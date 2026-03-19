"""
GridIron IQ — Feature Engineering for College Football Predictions

Transforms raw team stats and matchup data into ML-ready features.
"""

import numpy as np
from typing import Optional


# Conferences for conference game detection
CONFERENCE_TEAMS: dict[str, list[str]] = {
    "SEC": [
        "Alabama", "Arkansas", "Auburn", "Florida", "Georgia",
        "Kentucky", "LSU", "Mississippi State", "Missouri", "Ole Miss",
        "South Carolina", "Tennessee", "Texas A&M", "Vanderbilt",
        "Texas", "Oklahoma",
    ],
    "Big Ten": [
        "Illinois", "Indiana", "Iowa", "Maryland", "Michigan",
        "Michigan State", "Minnesota", "Nebraska", "Northwestern",
        "Ohio State", "Penn State", "Purdue", "Rutgers", "Wisconsin",
        "Oregon", "Washington", "UCLA", "USC",
    ],
    "Big 12": [
        "Baylor", "BYU", "Cincinnati", "Houston", "Iowa State",
        "Kansas", "Kansas State", "Oklahoma State", "TCU",
        "Texas Tech", "UCF", "West Virginia", "Arizona", "Arizona State",
        "Colorado", "Utah",
    ],
    "ACC": [
        "Boston College", "Clemson", "Duke", "Florida State",
        "Georgia Tech", "Louisville", "Miami", "NC State",
        "North Carolina", "Pittsburgh", "Syracuse", "Virginia",
        "Virginia Tech", "Wake Forest", "SMU", "Stanford", "Cal",
    ],
    "Pac-12": [
        "Oregon State", "Washington State",
    ],
}

# Notable rivalries for rivalry game detection
RIVALRIES: list[tuple[str, str]] = [
    ("Alabama", "Auburn"),
    ("Ohio State", "Michigan"),
    ("USC", "UCLA"),
    ("Texas", "Oklahoma"),
    ("Florida", "Georgia"),
    ("Florida", "Florida State"),
    ("Clemson", "South Carolina"),
    ("Oregon", "Oregon State"),
    ("Georgia", "Georgia Tech"),
    ("Army", "Navy"),
    ("Michigan", "Michigan State"),
    ("Oklahoma", "Oklahoma State"),
    ("Iowa", "Iowa State"),
    ("Kansas", "Kansas State"),
    ("North Carolina", "Duke"),
    ("Virginia", "Virginia Tech"),
    ("Penn State", "Pittsburgh"),
    ("Alabama", "Tennessee"),
    ("LSU", "Alabama"),
    ("Notre Dame", "USC"),
]


def _get_conference(team: str) -> Optional[str]:
    """Return the conference a team belongs to, or None."""
    for conf, teams in CONFERENCE_TEAMS.items():
        if team in teams:
            return conf
    return None


def _is_rivalry(team_a: str, team_b: str) -> bool:
    """Check if two teams have a notable rivalry."""
    for t1, t2 in RIVALRIES:
        if (team_a == t1 and team_b == t2) or (team_a == t2 and team_b == t1):
            return True
    return False


class FeatureEngineer:
    """Builds ML features from raw college football team stats."""

    TEAM_FEATURE_NAMES: list[str] = [
        "offensive_efficiency",
        "defensive_efficiency",
        "turnover_margin_per_game",
        "red_zone_efficiency",
        "third_down_conversion_rate",
        "sos_adjusted_win_pct",
        "recruiting_composite_3yr",
        "returning_production_pct",
        "coach_tenure_years",
        "coach_win_pct",
        "elo_rating",
        "yards_per_play_offense",
        "yards_per_play_defense",
        "scoring_margin_per_game",
        "penalty_yards_per_game",
    ]

    MATCHUP_FEATURE_NAMES: list[str] = [
        "elo_diff",
        "scoring_margin_diff",
        "yards_per_play_diff",
        "off_efficiency_diff",
        "def_efficiency_diff",
        "turnover_margin_diff",
        "recruiting_gap",
        "coach_experience_diff",
        "home_field_advantage",
        "home_field_strength",
        "is_conference_game",
        "is_rivalry_game",
        "rest_days_diff",
        "red_zone_eff_diff",
        "third_down_diff",
        "returning_production_diff",
        "penalty_diff",
    ]

    def __init__(self) -> None:
        self.feature_names = self.MATCHUP_FEATURE_NAMES.copy()

    def build_team_features(self, team_stats: dict) -> dict:
        """Compute derived features from raw team season stats.

        Expected keys in team_stats:
            team, season, games_played, points_for, points_against,
            total_plays_offense, total_plays_defense, total_yards_offense,
            total_yards_defense, turnovers_gained, turnovers_lost,
            red_zone_attempts, red_zone_scores, third_down_attempts,
            third_down_conversions, sos_rating, recruiting_2yr_ago,
            recruiting_1yr_ago, recruiting_current, returning_production_pct,
            coach_tenure_years, coach_career_wins, coach_career_losses,
            elo_rating, penalty_yards
        """
        gp = max(team_stats.get("games_played", 1), 1)
        total_plays_off = max(team_stats.get("total_plays_offense", 1), 1)
        total_plays_def = max(team_stats.get("total_plays_defense", 1), 1)

        points_for = team_stats.get("points_for", 0)
        points_against = team_stats.get("points_against", 0)
        total_yards_off = team_stats.get("total_yards_offense", 0)
        total_yards_def = team_stats.get("total_yards_defense", 0)

        # Offensive / defensive efficiency (points per play)
        offensive_efficiency = points_for / total_plays_off
        defensive_efficiency = points_against / total_plays_def

        # Turnover margin per game
        to_gained = team_stats.get("turnovers_gained", 0)
        to_lost = team_stats.get("turnovers_lost", 0)
        turnover_margin_per_game = (to_gained - to_lost) / gp

        # Red zone efficiency
        rz_att = max(team_stats.get("red_zone_attempts", 1), 1)
        rz_scores = team_stats.get("red_zone_scores", 0)
        red_zone_efficiency = rz_scores / rz_att

        # Third down conversion rate
        td_att = max(team_stats.get("third_down_attempts", 1), 1)
        td_conv = team_stats.get("third_down_conversions", 0)
        third_down_conversion_rate = td_conv / td_att

        # Strength of schedule adjusted win pct
        sos = team_stats.get("sos_rating", 0.5)
        raw_win_pct = points_for / max(points_for + points_against, 1)
        sos_adjusted_win_pct = raw_win_pct * (0.5 + 0.5 * sos)

        # Recruiting composite (3-year average)
        rec_vals = [
            team_stats.get("recruiting_current", 50),
            team_stats.get("recruiting_1yr_ago", 50),
            team_stats.get("recruiting_2yr_ago", 50),
        ]
        recruiting_composite_3yr = float(np.mean(rec_vals))

        # Returning production
        returning_production_pct = team_stats.get("returning_production_pct", 0.5)

        # Coach metrics
        coach_tenure = team_stats.get("coach_tenure_years", 1)
        coach_wins = team_stats.get("coach_career_wins", 0)
        coach_losses = team_stats.get("coach_career_losses", 0)
        total_coach_games = max(coach_wins + coach_losses, 1)
        coach_win_pct = coach_wins / total_coach_games

        # Elo
        elo_rating = team_stats.get("elo_rating", 1500)

        # Yards per play
        yards_per_play_offense = total_yards_off / total_plays_off
        yards_per_play_defense = total_yards_def / total_plays_def

        # Scoring margin
        scoring_margin_per_game = (points_for - points_against) / gp

        # Penalty yards per game
        penalty_yards_per_game = team_stats.get("penalty_yards", 0) / gp

        return {
            "offensive_efficiency": offensive_efficiency,
            "defensive_efficiency": defensive_efficiency,
            "turnover_margin_per_game": turnover_margin_per_game,
            "red_zone_efficiency": red_zone_efficiency,
            "third_down_conversion_rate": third_down_conversion_rate,
            "sos_adjusted_win_pct": sos_adjusted_win_pct,
            "recruiting_composite_3yr": recruiting_composite_3yr,
            "returning_production_pct": returning_production_pct,
            "coach_tenure_years": float(coach_tenure),
            "coach_win_pct": coach_win_pct,
            "elo_rating": float(elo_rating),
            "yards_per_play_offense": yards_per_play_offense,
            "yards_per_play_defense": yards_per_play_defense,
            "scoring_margin_per_game": scoring_margin_per_game,
            "penalty_yards_per_game": penalty_yards_per_game,
        }

    def build_matchup_features(self, home: dict, away: dict) -> dict:
        """Compute matchup features from two team feature dicts.

        Parameters
        ----------
        home : dict
            Output of build_team_features for the home team, plus optional
            keys: team, rest_days.
        away : dict
            Same structure for the away team.

        Returns
        -------
        dict with keys matching MATCHUP_FEATURE_NAMES.
        """
        home_team = home.get("team", "")
        away_team = away.get("team", "")

        elo_diff = home.get("elo_rating", 1500) - away.get("elo_rating", 1500)
        scoring_margin_diff = (
            home.get("scoring_margin_per_game", 0)
            - away.get("scoring_margin_per_game", 0)
        )
        ypp_diff = (
            home.get("yards_per_play_offense", 5.5)
            - away.get("yards_per_play_offense", 5.5)
        )
        off_eff_diff = (
            home.get("offensive_efficiency", 0.3)
            - away.get("offensive_efficiency", 0.3)
        )
        def_eff_diff = (
            home.get("defensive_efficiency", 0.3)
            - away.get("defensive_efficiency", 0.3)
        )
        to_margin_diff = (
            home.get("turnover_margin_per_game", 0)
            - away.get("turnover_margin_per_game", 0)
        )
        recruiting_gap = (
            home.get("recruiting_composite_3yr", 50)
            - away.get("recruiting_composite_3yr", 50)
        )
        coach_exp_diff = (
            home.get("coach_tenure_years", 1) - away.get("coach_tenure_years", 1)
        )

        # Home field: always 1 for home team, strength varies by Elo
        home_field_advantage = 1.0
        home_elo = home.get("elo_rating", 1500)
        home_field_strength = min(max((home_elo - 1300) / 400, 0.0), 1.0)

        # Conference game detection
        home_conf = _get_conference(home_team)
        away_conf = _get_conference(away_team)
        is_conference_game = 1.0 if (home_conf and home_conf == away_conf) else 0.0

        # Rivalry detection
        is_rivalry_game = 1.0 if _is_rivalry(home_team, away_team) else 0.0

        # Rest days
        rest_diff = home.get("rest_days", 7) - away.get("rest_days", 7)

        # Additional differentials
        rz_diff = (
            home.get("red_zone_efficiency", 0.8)
            - away.get("red_zone_efficiency", 0.8)
        )
        third_down_diff = (
            home.get("third_down_conversion_rate", 0.4)
            - away.get("third_down_conversion_rate", 0.4)
        )
        ret_prod_diff = (
            home.get("returning_production_pct", 0.5)
            - away.get("returning_production_pct", 0.5)
        )
        penalty_diff = (
            home.get("penalty_yards_per_game", 50)
            - away.get("penalty_yards_per_game", 50)
        )

        return {
            "elo_diff": elo_diff,
            "scoring_margin_diff": scoring_margin_diff,
            "yards_per_play_diff": ypp_diff,
            "off_efficiency_diff": off_eff_diff,
            "def_efficiency_diff": def_eff_diff,
            "turnover_margin_diff": to_margin_diff,
            "recruiting_gap": recruiting_gap,
            "coach_experience_diff": coach_exp_diff,
            "home_field_advantage": home_field_advantage,
            "home_field_strength": home_field_strength,
            "is_conference_game": is_conference_game,
            "is_rivalry_game": is_rivalry_game,
            "rest_days_diff": float(rest_diff),
            "red_zone_eff_diff": rz_diff,
            "third_down_diff": third_down_diff,
            "returning_production_diff": ret_prod_diff,
            "penalty_diff": penalty_diff,
        }

    def get_feature_names(self) -> list[str]:
        """Return ordered feature names for the matchup feature vector."""
        return self.feature_names

    def features_to_array(self, features: dict) -> np.ndarray:
        """Convert a matchup feature dict to a numpy array in canonical order.

        Parameters
        ----------
        features : dict
            Output of build_matchup_features.

        Returns
        -------
        np.ndarray of shape (1, n_features)
        """
        arr = np.array(
            [features.get(name, 0.0) for name in self.feature_names],
            dtype=np.float64,
        )
        return arr.reshape(1, -1)
