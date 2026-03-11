"""
ML Prediction Service for GridIron IQ.

Long-running subprocess that reads JSON lines from stdin,
writes JSON lines to stdout. All logging goes to stderr.

Protocol:
  - Startup: loads models, prints {"status": "ready"} to stdout
  - Commands: health, shutdown, or prediction requests
"""

import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR.parent / "data"

XGB_MODEL_PATH = MODELS_DIR / "xgb_home_win_model.pkl"
RIDGE_MODEL_PATH = MODELS_DIR / "ridge_model.joblib"
TRAINING_DATA_PATH = DATA_DIR / "training_data.csv"

# ---------------------------------------------------------------------------
# Metadata columns — these are NOT model features
# ---------------------------------------------------------------------------
METADATA_COLS = [
    "id",
    "start_date",
    "season",
    "season_type",
    "week",
    "neutral_site",
    "home_team",
    "home_conference",
    "home_elo",
    "home_talent",
    "away_team",
    "away_conference",
    "away_talent",
    "away_elo",
    "home_points",
    "away_points",
    "margin",
    "spread",
]


def log(msg: str) -> None:
    """Log a message to stderr."""
    print(msg, file=sys.stderr, flush=True)


def respond(obj: dict) -> None:
    """Write a JSON line to stdout."""
    print(json.dumps(obj), flush=True)


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------

def load_models():
    """Load all models and training data. Returns (xgb_model, ridge_model, df)."""
    log(f"Loading XGBoost model from {XGB_MODEL_PATH}")
    xgb_model = joblib.load(XGB_MODEL_PATH)

    log(f"Loading Ridge model from {RIDGE_MODEL_PATH}")
    ridge_model = joblib.load(RIDGE_MODEL_PATH)

    log(f"Loading training data from {TRAINING_DATA_PATH}")
    df = pd.read_csv(TRAINING_DATA_PATH)
    log(f"Training data loaded: {len(df)} rows, {len(df.columns)} columns")

    return xgb_model, ridge_model, df


def get_feature_columns(df: pd.DataFrame) -> list[str]:
    """Return the feature column names (everything not in METADATA_COLS)."""
    return [c for c in df.columns if c not in METADATA_COLS]


# ---------------------------------------------------------------------------
# Prediction logic
# ---------------------------------------------------------------------------

def find_team_features(df: pd.DataFrame, team: str, season: int, feature_cols: list[str], role: str):
    """
    Find the most recent game row for *team* in *season* (or earlier)
    and extract the feature values for the given role ('home' or 'away').

    Returns a dict mapping feature_col -> value, or None if not found.
    """
    # Team could appear as home_team or away_team
    mask_home = (df["home_team"] == team) & (df["season"] <= season)
    mask_away = (df["away_team"] == team) & (df["season"] <= season)

    rows_home = df.loc[mask_home].sort_values("season", ascending=False)
    rows_away = df.loc[mask_away].sort_values("season", ascending=False)

    # Pick the most recent appearance overall
    best_row = None
    best_season = -1

    if len(rows_home) > 0:
        candidate = rows_home.iloc[0]
        if candidate["season"] > best_season:
            best_row = candidate
            best_season = candidate["season"]
            appeared_as = "home"

    if len(rows_away) > 0:
        candidate = rows_away.iloc[0]
        if candidate["season"] > best_season:
            best_row = candidate
            best_season = candidate["season"]
            appeared_as = "away"

    if best_row is None:
        return None

    # Extract features that match the role we need (home_* or away_*)
    # The appeared_as tells us which prefix the team's stats are under
    # The role tells us which prefix we need in the final feature vector
    result = {}
    for col in feature_cols:
        if col.startswith(f"{role}_"):
            # We need this column in the final vector.
            # Map from the role prefix to where the team's data actually lives.
            suffix = col[len(f"{role}_"):]
            source_col = f"{appeared_as}_{suffix}"
            if source_col in best_row.index:
                result[col] = best_row[source_col]
            else:
                result[col] = 0.0

    return result


def predict_game(
    xgb_model,
    ridge_model,
    df: pd.DataFrame,
    feature_cols: list[str],
    home_team: str,
    away_team: str,
    season: int,
) -> dict:
    """Run prediction for a single game."""

    home_features = find_team_features(df, home_team, season, feature_cols, "home")
    if home_features is None:
        return {"status": "error", "error": f"No feature data found for {home_team}"}

    away_features = find_team_features(df, away_team, season, feature_cols, "away")
    if away_features is None:
        return {"status": "error", "error": f"No feature data found for {away_team}"}

    # Build full feature vector in column order
    row = {}
    row.update(home_features)
    row.update(away_features)

    feature_vector = pd.DataFrame([row], columns=feature_cols)
    feature_vector = feature_vector.fillna(0.0)

    # XGBoost → win probability
    try:
        win_prob_raw = xgb_model.predict_proba(feature_vector)[0]
        # Class 1 = home win
        win_prob = float(win_prob_raw[1]) if len(win_prob_raw) > 1 else float(win_prob_raw[0])
    except Exception:
        # Some XGBoost wrappers use predict() returning probabilities directly
        win_prob = float(xgb_model.predict(feature_vector)[0])
        win_prob = max(0.0, min(1.0, win_prob))

    # Ridge → spread prediction
    spread = float(ridge_model.predict(feature_vector)[0])

    # Confidence = how far from a coin flip
    confidence = abs(win_prob - 0.5) * 2.0

    return {
        "status": "ok",
        "win_prob": round(win_prob, 4),
        "spread": round(spread, 1),
        "confidence": round(confidence, 4),
    }


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def main():
    try:
        xgb_model, ridge_model, df = load_models()
    except Exception as exc:
        log(f"Failed to load models: {exc}")
        respond({"status": "error", "error": f"Failed to load models: {str(exc)}"})
        sys.exit(1)

    feature_cols = get_feature_columns(df)
    log(f"Feature columns ({len(feature_cols)}): {feature_cols[:5]}...")

    # Signal readiness
    respond({"status": "ready"})

    # Main loop — read JSON lines from stdin
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
        except json.JSONDecodeError as exc:
            respond({"status": "error", "error": f"Invalid JSON: {str(exc)}"})
            continue

        command = request.get("command")

        if command == "health":
            respond({"status": "ok", "models_loaded": True})
            continue

        if command == "shutdown":
            log("Shutdown requested")
            respond({"status": "ok", "message": "shutting down"})
            break

        # Prediction request
        home_team = request.get("home_team")
        away_team = request.get("away_team")
        season = request.get("season", 2024)

        if not home_team or not away_team:
            respond({"status": "error", "error": "Missing home_team or away_team"})
            continue

        log(f"Predicting: {home_team} vs {away_team} (season {season})")

        try:
            result = predict_game(
                xgb_model, ridge_model, df, feature_cols,
                home_team, away_team, season,
            )
            respond(result)
        except Exception as exc:
            log(f"Prediction error: {exc}")
            respond({"status": "error", "error": str(exc)})


if __name__ == "__main__":
    main()
