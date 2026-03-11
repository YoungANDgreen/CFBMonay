"""
Accumulate per-play player extractions into per-player-per-season stat totals.

Exports data in the exact shape of the CachedPlayer and CachedPlayerSeasonStats
TypeScript interfaces (flat fields, NOT nested).
"""

import hashlib
from collections import defaultdict
from typing import Any

from scripts.pbp_parser.name_extractor import extract_players  # noqa: F401


def _player_id(name: str, team: str) -> int:
    """Deterministic integer ID from name+team via MD5 hash."""
    h = hashlib.md5(f"{name}|{team}".encode()).hexdigest()
    return int(h[:12], 16)  # first 12 hex chars → 48-bit int


def _empty_season_stats() -> dict:
    return {
        "pass_att": 0,
        "pass_comp": 0,
        "pass_yds": 0,
        "pass_td": 0,
        "pass_int": 0,
        "times_sacked": 0,
        "rush_att": 0,
        "rush_yds": 0,
        "rush_td": 0,
        "receptions": 0,
        "rec_yds": 0,
        "rec_td": 0,
        "fumbles": 0,
        "fg_att": 0,
        "fg_made": 0,
        "sacks_recorded": 0,
        "def_int": 0,
        "tackles": 0,
        "forced_fumbles": 0,
        "passes_defended": 0,
        "returns": 0,
        "ret_yds": 0,
        "games": 0,
        # internal counters for position inference
        "_pass_plays": 0,
        "_rush_plays": 0,
        "_rec_plays": 0,
        "_kick_plays": 0,
        "_def_plays": 0,
        "_game_ids": set(),
    }


# Play types that count as rush plays
_RUSH_TYPES = {"Rush", "Rushing Touchdown"}
_PASS_COMPLETE_TYPES = {"Pass Reception", "Passing Touchdown"}
_PASS_INCOMPLETE_TYPES = {"Pass Incompletion"}
_SACK_TYPES = {"Sack"}
_INT_TYPES = {"Interception", "Interception Return Touchdown", "Pass Interception Return"}
_FG_TYPES = {"Field Goal Good", "Field Goal Missed"}
_FUMBLE_TYPES = {"Fumble Recovery (Opponent)", "Fumble Recovery (Own)"}
_RETURN_TYPES = {"Kickoff Return (Offense)", "Kickoff Return Touchdown", "Punt Return Touchdown"}


class PlayerAggregator:
    """Accumulates play-by-play data into per-player-per-season stats."""

    def __init__(self):
        # Key: (name, team) → set of seasons
        self._players: dict[tuple[str, str], set[int]] = defaultdict(set)
        # Key: (name, team, season) → stats dict
        self._stats: dict[tuple[str, str, int], dict] = {}

    def _ensure_stats(self, name: str, team: str, season: int) -> dict:
        key = (name, team, season)
        if key not in self._stats:
            self._stats[key] = _empty_season_stats()
        self._players[(name, team)].add(season)
        return self._stats[key]

    def _record_game(self, stats: dict, game_id: str):
        if game_id not in stats["_game_ids"]:
            stats["_game_ids"].add(game_id)
            stats["games"] += 1

    def record_play(
        self,
        season: int,
        game_id: str,
        team: str,
        play_type: str,
        players: dict,
        yards_gained: float,
        scoring: bool,
        ppa: float,
    ):
        """Record a single play's stats. `players` is dict from extract_players()."""
        yards = int(yards_gained) if yards_gained else 0

        # ── Rush ────────────────────────────────────────────────────────
        if play_type in _RUSH_TYPES:
            rusher = players.get("rusher")
            if rusher:
                s = self._ensure_stats(rusher, team, season)
                self._record_game(s, game_id)
                s["rush_att"] += 1
                s["rush_yds"] += yards
                s["_rush_plays"] += 1
                if scoring:
                    s["rush_td"] += 1

        # ── Pass completion / TD ────────────────────────────────────────
        elif play_type in _PASS_COMPLETE_TYPES:
            passer = players.get("passer")
            receiver = players.get("receiver")
            if passer:
                s = self._ensure_stats(passer, team, season)
                self._record_game(s, game_id)
                s["pass_att"] += 1
                s["pass_comp"] += 1
                s["pass_yds"] += yards
                s["_pass_plays"] += 1
                if scoring:
                    s["pass_td"] += 1
            if receiver:
                s = self._ensure_stats(receiver, team, season)
                self._record_game(s, game_id)
                s["receptions"] += 1
                s["rec_yds"] += yards
                s["_rec_plays"] += 1
                if scoring:
                    s["rec_td"] += 1

        # ── Pass incompletion ──────────────────────────────────────────
        elif play_type in _PASS_INCOMPLETE_TYPES:
            passer = players.get("passer")
            if passer:
                s = self._ensure_stats(passer, team, season)
                self._record_game(s, game_id)
                s["pass_att"] += 1
                s["_pass_plays"] += 1

        # ── Sack — NOT a pass attempt ──────────────────────────────────
        elif play_type in _SACK_TYPES:
            qb = players.get("qb")
            defender = players.get("defender")
            if qb:
                s = self._ensure_stats(qb, team, season)
                self._record_game(s, game_id)
                s["times_sacked"] += 1
                s["_pass_plays"] += 1  # counts for position inference
            if defender:
                s = self._ensure_stats(defender, team, season)
                self._record_game(s, game_id)
                s["sacks_recorded"] += 1
                s["_def_plays"] += 1

        # ── Interception ───────────────────────────────────────────────
        elif play_type in _INT_TYPES:
            passer = players.get("passer")
            if passer:
                s = self._ensure_stats(passer, team, season)
                self._record_game(s, game_id)
                s["pass_att"] += 1
                s["pass_int"] += 1
                s["_pass_plays"] += 1

        # ── Field Goal ─────────────────────────────────────────────────
        elif play_type in _FG_TYPES:
            kicker = players.get("kicker")
            if kicker:
                s = self._ensure_stats(kicker, team, season)
                self._record_game(s, game_id)
                s["fg_att"] += 1
                s["_kick_plays"] += 1
                if play_type == "Field Goal Good":
                    s["fg_made"] += 1

        # ── Fumble ─────────────────────────────────────────────────────
        elif play_type in _FUMBLE_TYPES:
            fumbler = players.get("fumbler")
            if fumbler:
                s = self._ensure_stats(fumbler, team, season)
                self._record_game(s, game_id)
                s["fumbles"] += 1

        # ── Returns ────────────────────────────────────────────────────
        elif play_type in _RETURN_TYPES:
            returner = players.get("returner")
            if returner:
                s = self._ensure_stats(returner, team, season)
                self._record_game(s, game_id)
                s["returns"] += 1
                s["ret_yds"] += yards

    def get_player_season_stats(self, name: str, team: str, season: int) -> dict:
        """Get raw internal stats for a player-season (for testing)."""
        key = (name, team, season)
        if key not in self._stats:
            return _empty_season_stats()
        return self._stats[key]

    def _infer_position(self, name: str, team: str) -> str:
        """Infer position from accumulated play-type counters across all seasons."""
        total_pass = 0
        total_rush = 0
        total_rec = 0
        total_kick = 0
        total_def = 0

        for season in self._players.get((name, team), set()):
            s = self._stats.get((name, team, season), {})
            total_pass += s.get("_pass_plays", 0)
            total_rush += s.get("_rush_plays", 0)
            total_rec += s.get("_rec_plays", 0)
            total_kick += s.get("_kick_plays", 0)
            total_def += s.get("_def_plays", 0)

        if total_pass >= 5:
            return "QB"
        if total_kick > 0 and total_pass == 0 and total_rush == 0 and total_rec == 0 and total_def == 0:
            return "K"
        if total_def > 0 and total_pass == 0 and total_rush == 0 and total_rec == 0 and total_kick == 0:
            return "DEF"
        if total_rec > total_rush:
            return "WR"
        if total_rush > 0:
            return "RB"
        return "ATH"

    def _split_name(self, full_name: str) -> tuple[str, str]:
        """Split full name into (firstName, lastName)."""
        parts = full_name.split()
        if len(parts) == 1:
            return (parts[0], "")
        return (parts[0], " ".join(parts[1:]))

    def get_player_entry(self, name: str, team: str) -> dict:
        """Get CachedPlayer-format entry."""
        first, last = self._split_name(name)
        return {
            "id": _player_id(name, team),
            "firstName": first,
            "lastName": last,
            "team": team,
            "position": self._infer_position(name, team),
            "jersey": 0,
            "height": 0,
            "weight": 0,
            "year": "",
            "hometown": "",
        }

    def export_players(self) -> list[dict]:
        """Export all unique players in CachedPlayer format."""
        return [
            self.get_player_entry(name, team)
            for (name, team) in sorted(self._players.keys())
        ]

    def export_player_stats(self) -> list[dict]:
        """Export all player-seasons in FLAT CachedPlayerSeasonStats format."""
        results = []
        for (name, team, season), s in sorted(self._stats.items()):
            pos = self._infer_position(name, team)
            results.append({
                "playerId": _player_id(name, team),
                "player": name,
                "team": team,
                "season": season,
                "category": pos,
                "passingYards": s["pass_yds"],
                "passingTDs": s["pass_td"],
                "interceptions": s["pass_int"],
                "completions": s["pass_comp"],
                "attempts": s["pass_att"],
                "rushingYards": s["rush_yds"],
                "rushingTDs": s["rush_td"],
                "carries": s["rush_att"],
                "receptions": s["receptions"],
                "receivingYards": s["rec_yds"],
                "receivingTDs": s["rec_td"],
                "tackles": s["tackles"],
                "sacks": s["sacks_recorded"],
                "defensiveInterceptions": s["def_int"],
                "forcedFumbles": s["forced_fumbles"],
                "passesDefended": s["passes_defended"],
            })
        return results
