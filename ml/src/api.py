"""
GridIron IQ — Flask API for Serving ML Predictions

Run:
  python -m src.api
  python -m src.api --port 5050 --model-dir ./models
"""

import argparse
import os
import sys
from datetime import datetime, timezone

from flask import Flask, jsonify, request

from .models import EnsemblePredictor
from .feature_engineering import FeatureEngineer
from .data_loader import CFBDataLoader

app = Flask(__name__)

# Global state — loaded on startup
_ensemble: EnsemblePredictor | None = None
_feature_eng: FeatureEngineer | None = None
_data_loader: CFBDataLoader | None = None
_model_dir: str = "models"


def _load_models(model_dir: str) -> None:
    """Load saved models into global state."""
    global _ensemble, _feature_eng, _data_loader
    _feature_eng = FeatureEngineer()
    _data_loader = CFBDataLoader()

    if not os.path.exists(os.path.join(model_dir, "model_meta.json")):
        print(f"WARNING: No trained models found in '{model_dir}'. "
              f"Run 'python -m src.train' first.")
        _ensemble = None
        return

    _ensemble = EnsemblePredictor.load(model_dir)
    print(f"Models loaded from '{model_dir}' "
          f"(trained: {_ensemble.training_date})")


def _build_matchup_features(home_team: str, away_team: str, season: int) -> dict:
    """Build matchup features for a prediction request."""
    # Load team stats for the requested season
    team_stats_df = _data_loader.load_team_stats(season)
    stats_by_team = {row["team"]: row.to_dict() for _, row in team_stats_df.iterrows()}

    home_raw = stats_by_team.get(home_team)
    away_raw = stats_by_team.get(away_team)

    if home_raw is None:
        raise ValueError(f"Unknown home team: '{home_team}'")
    if away_raw is None:
        raise ValueError(f"Unknown away team: '{away_team}'")

    home_feats = _feature_eng.build_team_features(home_raw)
    away_feats = _feature_eng.build_team_features(away_raw)

    home_feats["team"] = home_team
    away_feats["team"] = away_team
    home_feats["rest_days"] = 7
    away_feats["rest_days"] = 7

    return _feature_eng.build_matchup_features(home_feats, away_feats)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "models_loaded": _ensemble is not None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@app.route("/model/info", methods=["GET"])
def model_info():
    """Return model metadata and accuracy metrics."""
    if _ensemble is None:
        return jsonify({"error": "Models not loaded"}), 503

    return jsonify({
        "version": "1.0.0",
        "training_date": _ensemble.training_date,
        "feature_names": _ensemble.feature_names,
        "accuracy_metrics": _ensemble.accuracy_metrics,
    })


@app.route("/predict", methods=["POST"])
def predict():
    """Predict a single game.

    Request body:
    {
        "home_team": "Ohio State",
        "away_team": "Michigan",
        "season": 2024
    }
    """
    if _ensemble is None:
        return jsonify({"error": "Models not loaded. Run training first."}), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    home_team = data.get("home_team")
    away_team = data.get("away_team")
    season = data.get("season", 2024)

    if not home_team or not away_team:
        return jsonify({"error": "home_team and away_team are required"}), 400

    try:
        matchup_features = _build_matchup_features(home_team, away_team, season)
        prediction = _ensemble.predict_game(matchup_features)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    return jsonify({
        "home_team": home_team,
        "away_team": away_team,
        "season": season,
        "prediction": prediction,
    })


@app.route("/predict/week", methods=["POST"])
def predict_week():
    """Predict multiple games at once.

    Request body:
    {
        "matchups": [
            {"home_team": "Ohio State", "away_team": "Michigan", "season": 2024},
            {"home_team": "Alabama", "away_team": "Auburn", "season": 2024}
        ]
    }
    """
    if _ensemble is None:
        return jsonify({"error": "Models not loaded. Run training first."}), 503

    data = request.get_json()
    if not data or "matchups" not in data:
        return jsonify({"error": "Request body must contain 'matchups' array"}), 400

    matchups = data["matchups"]
    results: list[dict] = []

    for matchup in matchups:
        home_team = matchup.get("home_team")
        away_team = matchup.get("away_team")
        season = matchup.get("season", 2024)

        if not home_team or not away_team:
            results.append({
                "home_team": home_team,
                "away_team": away_team,
                "error": "home_team and away_team are required",
            })
            continue

        try:
            features = _build_matchup_features(home_team, away_team, season)
            prediction = _ensemble.predict_game(features)
            results.append({
                "home_team": home_team,
                "away_team": away_team,
                "season": season,
                "prediction": prediction,
            })
        except ValueError as e:
            results.append({
                "home_team": home_team,
                "away_team": away_team,
                "error": str(e),
            })
        except Exception as e:
            results.append({
                "home_team": home_team,
                "away_team": away_team,
                "error": f"Prediction failed: {str(e)}",
            })

    return jsonify({"results": results})


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="GridIron IQ Prediction API")
    parser.add_argument("--port", type=int, default=5050, help="Port to listen on")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to bind to")
    parser.add_argument(
        "--model-dir", type=str, default="models",
        help="Directory containing trained models",
    )
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    args = parser.parse_args()

    global _model_dir
    _model_dir = args.model_dir

    print("GridIron IQ — Prediction API")
    print(f"Loading models from '{args.model_dir}'...")
    _load_models(args.model_dir)

    print(f"Starting server on {args.host}:{args.port}")
    app.run(host=args.host, port=args.port, debug=args.debug)


if __name__ == "__main__":
    main()
