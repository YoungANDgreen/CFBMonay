"""
GridIron IQ — Data Loading & Preparation

Loads historical college football game data and prepares feature matrices
for ML training. Currently generates realistic synthetic data; will be
replaced with live CFBD / ESPN API integration.
"""

import numpy as np
import pandas as pd
from typing import Optional

from .feature_engineering import FeatureEngineer


# ---------------------------------------------------------------------------
# Realistic FBS team pool (130 teams)
# ---------------------------------------------------------------------------
FBS_TEAMS: list[str] = [
    # SEC
    "Alabama", "Arkansas", "Auburn", "Florida", "Georgia",
    "Kentucky", "LSU", "Mississippi State", "Missouri", "Ole Miss",
    "South Carolina", "Tennessee", "Texas A&M", "Vanderbilt",
    "Texas", "Oklahoma",
    # Big Ten
    "Illinois", "Indiana", "Iowa", "Maryland", "Michigan",
    "Michigan State", "Minnesota", "Nebraska", "Northwestern",
    "Ohio State", "Penn State", "Purdue", "Rutgers", "Wisconsin",
    "Oregon", "Washington", "UCLA", "USC",
    # Big 12
    "Baylor", "BYU", "Cincinnati", "Houston", "Iowa State",
    "Kansas", "Kansas State", "Oklahoma State", "TCU",
    "Texas Tech", "UCF", "West Virginia", "Arizona", "Arizona State",
    "Colorado", "Utah",
    # ACC
    "Boston College", "Clemson", "Duke", "Florida State",
    "Georgia Tech", "Louisville", "Miami", "NC State",
    "North Carolina", "Pittsburgh", "Syracuse", "Virginia",
    "Virginia Tech", "Wake Forest", "SMU", "Stanford", "Cal",
    # Pac-12 remnants
    "Oregon State", "Washington State",
    # Independents & Group of 5 notables
    "Notre Dame", "Army", "Navy", "UConn", "UMass",
    "Boise State", "San Diego State", "Fresno State", "UNLV",
    "Air Force", "Colorado State", "Wyoming", "New Mexico",
    "San Jose State", "Hawaii", "Nevada",
    "Memphis", "Tulane", "SMU", "South Florida", "Tulsa", "East Carolina",
    "Temple", "UTSA", "North Texas", "Rice", "Charlotte", "FAU", "FIU",
    "Western Kentucky", "Middle Tennessee", "Marshall", "Old Dominion",
    "James Madison", "Southern Miss", "Louisiana Tech", "Sam Houston",
    "Jacksonville State", "Kennesaw State", "Liberty",
    "Appalachian State", "Coastal Carolina", "Georgia Southern",
    "Georgia State", "Louisiana", "South Alabama", "Texas State",
    "Troy", "Arkansas State", "UL Monroe",
    "Bowling Green", "Akron", "Ball State", "Buffalo",
    "Central Michigan", "Eastern Michigan", "Kent State",
    "Miami (OH)", "Northern Illinois", "Ohio", "Toledo",
    "Western Michigan",
]

# Deduplicate and trim to 130
FBS_TEAMS = list(dict.fromkeys(FBS_TEAMS))[:130]

# Tier assignments for realistic Elo / recruiting distributions
ELITE_TEAMS = {
    "Alabama", "Ohio State", "Georgia", "Clemson", "Oklahoma",
    "LSU", "Oregon", "Michigan", "Notre Dame", "Texas",
}
STRONG_TEAMS = {
    "Penn State", "USC", "Florida", "Florida State", "Auburn",
    "Tennessee", "Texas A&M", "Miami", "Wisconsin", "Iowa",
    "Oklahoma State", "Ole Miss", "Utah", "Washington", "Baylor",
    "Michigan State", "North Carolina", "Oregon State", "BYU",
    "Louisville", "Kansas State", "Pittsburgh",
}


class CFBDataLoader:
    """Loads and prepares college football data for ML training."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key
        self.feature_engineer = FeatureEngineer()
        self._rng = np.random.default_rng(seed=42)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def load_historical_games(self, seasons: list[int]) -> pd.DataFrame:
        """Load game results for the given seasons.

        Currently generates synthetic data. Each season produces ~800 games
        with realistic score distributions.
        """
        all_games: list[dict] = []
        for season in seasons:
            games = self._generate_season_games(season)
            all_games.extend(games)
        return pd.DataFrame(all_games)

    def load_team_stats(self, season: int) -> pd.DataFrame:
        """Load team-level seasonal stats.

        Returns a DataFrame with one row per team containing raw stats that
        can be fed into FeatureEngineer.build_team_features().
        """
        rows: list[dict] = []
        for team in FBS_TEAMS:
            rows.append(self._generate_team_stats(team, season))
        return pd.DataFrame(rows)

    def prepare_training_data(
        self,
        games_df: pd.DataFrame,
        team_stats_df: pd.DataFrame,
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Build feature matrices and target vectors.

        Returns
        -------
        X : np.ndarray of shape (n_games, n_features)
        y_spread : np.ndarray — actual point spread (home - away)
        y_total : np.ndarray — actual combined score
        """
        # Index team stats by (team, season)
        stats_lookup: dict[tuple[str, int], dict] = {}
        for _, row in team_stats_df.iterrows():
            key = (row["team"], row["season"])
            stats_lookup[key] = row.to_dict()

        feature_rows: list[np.ndarray] = []
        spreads: list[float] = []
        totals: list[float] = []

        for _, game in games_df.iterrows():
            home_key = (game["home_team"], game["season"])
            away_key = (game["away_team"], game["season"])

            home_raw = stats_lookup.get(home_key)
            away_raw = stats_lookup.get(away_key)
            if home_raw is None or away_raw is None:
                continue

            home_feats = self.feature_engineer.build_team_features(home_raw)
            away_feats = self.feature_engineer.build_team_features(away_raw)

            # Attach metadata for matchup builder
            home_feats["team"] = game["home_team"]
            away_feats["team"] = game["away_team"]
            home_feats["rest_days"] = game.get("home_rest_days", 7)
            away_feats["rest_days"] = game.get("away_rest_days", 7)

            matchup = self.feature_engineer.build_matchup_features(
                home_feats, away_feats
            )
            arr = self.feature_engineer.features_to_array(matchup)
            feature_rows.append(arr.flatten())

            spread = game["home_score"] - game["away_score"]
            total = game["home_score"] + game["away_score"]
            spreads.append(spread)
            totals.append(total)

        X = np.vstack(feature_rows)
        y_spread = np.array(spreads, dtype=np.float64)
        y_total = np.array(totals, dtype=np.float64)
        return X, y_spread, y_total

    def train_test_split_by_season(
        self,
        X: np.ndarray,
        y: np.ndarray,
        games_df: pd.DataFrame,
        test_seasons: list[int],
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Temporal train/test split — prevents future data leakage.

        Parameters
        ----------
        X : feature matrix
        y : target vector
        games_df : original games DataFrame (used to read season column)
        test_seasons : seasons to hold out for testing

        Returns
        -------
        X_train, X_test, y_train, y_test
        """
        # We must align the games_df rows with X rows; they were built in
        # the same order by prepare_training_data, so index alignment works.
        # However, some rows may have been skipped, so we rebuild the season
        # list from games_df that matched.
        seasons = games_df["season"].values[: len(y)]
        test_mask = np.isin(seasons, test_seasons)
        train_mask = ~test_mask

        return (
            X[train_mask],
            X[test_mask],
            y[train_mask],
            y[test_mask],
        )

    # ------------------------------------------------------------------
    # Synthetic data generation (private)
    # ------------------------------------------------------------------

    def _team_tier(self, team: str) -> int:
        """Return 0 (elite), 1 (strong), or 2 (average)."""
        if team in ELITE_TEAMS:
            return 0
        if team in STRONG_TEAMS:
            return 1
        return 2

    def _elo_for_tier(self, tier: int) -> float:
        base = {0: 1650, 1: 1520, 2: 1400}
        noise = self._rng.normal(0, 40)
        return base[tier] + noise

    def _recruiting_for_tier(self, tier: int) -> float:
        base = {0: 85, 1: 70, 2: 50}
        noise = self._rng.normal(0, 8)
        return max(10, min(100, base[tier] + noise))

    def _generate_team_stats(self, team: str, season: int) -> dict:
        """Generate realistic synthetic team season stats."""
        tier = self._team_tier(team)
        # Use season as part of seed so stats vary year to year
        local_rng = np.random.default_rng(seed=hash((team, season)) % (2**31))

        games_played = 12 + local_rng.choice([0, 1, 2], p=[0.2, 0.5, 0.3])
        elo = self._elo_for_tier(tier)

        # Offense scales with tier
        ppg_base = {0: 38, 1: 30, 2: 24}[tier]
        ppg = max(10, ppg_base + local_rng.normal(0, 5))
        points_for = ppg * games_played

        papg_base = {0: 18, 1: 23, 2: 28}[tier]
        papg = max(10, papg_base + local_rng.normal(0, 4))
        points_against = papg * games_played

        plays_per_game = 70 + local_rng.normal(0, 5)
        total_plays_off = int(plays_per_game * games_played)
        total_plays_def = int((70 + local_rng.normal(0, 5)) * games_played)

        ypp_off = 5.5 + (2 - tier) * 0.5 + local_rng.normal(0, 0.3)
        ypp_def = 5.5 - (2 - tier) * 0.3 + local_rng.normal(0, 0.3)
        total_yards_off = ypp_off * total_plays_off
        total_yards_def = ypp_def * total_plays_def

        to_gained = int(max(0, (14 + (2 - tier) * 3 + local_rng.normal(0, 3))))
        to_lost = int(max(0, (14 - (2 - tier) * 2 + local_rng.normal(0, 3))))

        rz_att = int(max(10, 35 + (2 - tier) * 5 + local_rng.normal(0, 5)))
        rz_eff = min(1.0, max(0.5, 0.82 + (2 - tier) * 0.04 + local_rng.normal(0, 0.05)))
        rz_scores = int(rz_att * rz_eff)

        td_att = int(max(50, 150 + local_rng.normal(0, 15)))
        td_rate = min(0.65, max(0.25, 0.40 + (2 - tier) * 0.05 + local_rng.normal(0, 0.04)))
        td_conv = int(td_att * td_rate)

        sos = min(1.0, max(0.0, 0.5 + (2 - tier) * 0.08 + local_rng.normal(0, 0.1)))

        rec_current = self._recruiting_for_tier(tier)
        rec_1yr = self._recruiting_for_tier(tier)
        rec_2yr = self._recruiting_for_tier(tier)

        ret_prod = min(1.0, max(0.2, 0.55 + local_rng.normal(0, 0.1)))

        coach_tenure = max(1, int(4 + (2 - tier) * 1 + local_rng.normal(0, 2)))
        coach_wins = int(max(0, coach_tenure * (6 + (2 - tier) * 2) + local_rng.normal(0, 3)))
        coach_losses = int(max(0, coach_tenure * (6 - (2 - tier) * 2) + local_rng.normal(0, 3)))

        penalty_yards = int(max(200, 600 + local_rng.normal(0, 80)))

        return {
            "team": team,
            "season": season,
            "games_played": games_played,
            "points_for": int(points_for),
            "points_against": int(points_against),
            "total_plays_offense": total_plays_off,
            "total_plays_defense": total_plays_def,
            "total_yards_offense": int(total_yards_off),
            "total_yards_defense": int(total_yards_def),
            "turnovers_gained": to_gained,
            "turnovers_lost": to_lost,
            "red_zone_attempts": rz_att,
            "red_zone_scores": rz_scores,
            "third_down_attempts": td_att,
            "third_down_conversions": td_conv,
            "sos_rating": round(sos, 3),
            "recruiting_current": round(rec_current, 1),
            "recruiting_1yr_ago": round(rec_1yr, 1),
            "recruiting_2yr_ago": round(rec_2yr, 1),
            "returning_production_pct": round(ret_prod, 3),
            "coach_tenure_years": coach_tenure,
            "coach_career_wins": coach_wins,
            "coach_career_losses": coach_losses,
            "elo_rating": round(elo, 1),
            "penalty_yards": penalty_yards,
        }

    def _generate_season_games(self, season: int) -> list[dict]:
        """Generate ~800 games for a season with realistic outcomes."""
        local_rng = np.random.default_rng(seed=season)
        n_games = 780 + local_rng.integers(0, 40)
        games: list[dict] = []

        for i in range(n_games):
            # Pick two different teams
            idx = local_rng.choice(len(FBS_TEAMS), size=2, replace=False)
            home_team = FBS_TEAMS[idx[0]]
            away_team = FBS_TEAMS[idx[1]]

            home_tier = self._team_tier(home_team)
            away_tier = self._team_tier(away_team)

            # Generate scores based on tiers; home team gets ~3 pt advantage
            home_base = {0: 34, 1: 28, 2: 22}[home_tier] + 1.5
            away_base = {0: 34, 1: 28, 2: 22}[away_tier] - 1.5

            home_score = max(0, int(home_base + local_rng.normal(0, 10)))
            away_score = max(0, int(away_base + local_rng.normal(0, 10)))

            # Ensure no negative scores, and add some blowout / close game variety
            home_score = max(0, home_score)
            away_score = max(0, away_score)

            home_rest = local_rng.choice([6, 7, 7, 7, 7, 14], p=[0.1, 0.5, 0.15, 0.1, 0.1, 0.05])
            away_rest = local_rng.choice([6, 7, 7, 7, 7, 14], p=[0.1, 0.5, 0.15, 0.1, 0.1, 0.05])

            week = (i // 65) + 1  # ~65 games per week across 12 weeks

            games.append({
                "season": season,
                "week": min(week, 15),
                "home_team": home_team,
                "away_team": away_team,
                "home_score": home_score,
                "away_score": away_score,
                "home_rest_days": int(home_rest),
                "away_rest_days": int(away_rest),
            })

        return games
