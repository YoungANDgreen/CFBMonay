#!/usr/bin/env python3
"""
Build player stats JSON from play-by-play CSV data.

Reads PBP CSVs from starter_pack/data/plays/<YYYY>/*.csv, extracts player names,
aggregates stats, and writes src/data/players.json and src/data/player-stats.json.

Usage:
    python scripts/build-player-stats.py            # Core years (2014-2024)
    python scripts/build-player-stats.py --legends   # Core + pre-2014 legends
"""

import argparse
import csv
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

# Add project root to path so we can import the pbp_parser package
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from scripts.pbp_parser.name_extractor import extract_players, SKIP_TYPES
from scripts.pbp_parser.aggregator import PlayerAggregator


CORE_YEARS = list(range(2014, 2025))  # 2014-2024
PLAYS_DIR = PROJECT_ROOT / "starter_pack" / "data" / "plays"
TEAMS_CSV = PROJECT_ROOT / "starter_pack" / "data" / "teams.csv"
LEGENDS_CONFIG = PROJECT_ROOT / "scripts" / "legends-config.json"
OUTPUT_PLAYERS = PROJECT_ROOT / "src" / "data" / "players.json"
OUTPUT_STATS = PROJECT_ROOT / "src" / "data" / "player-stats.json"


def load_team_conferences(teams_csv: Path) -> dict[str, str]:
    """Load team→conference mapping from teams.csv."""
    mapping = {}
    with open(teams_csv, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            school = row.get("school", "").strip()
            conference = row.get("conference", "").strip()
            if school:
                mapping[school] = conference
    return mapping


def load_legends_config(config_path: Path) -> list[dict]:
    """Load legends config JSON."""
    with open(config_path, "r") as f:
        return json.load(f)


def safe_float(val: str, default: float = 0.0) -> float:
    """Parse a float from a string, handling NaN and empty values."""
    if not val or val.strip() == "" or val.strip().lower() == "nan":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_bool(val: str) -> bool:
    """Parse a boolean from a CSV string."""
    return val.strip().lower() == "true" if val else False


def process_csv_file(
    filepath: Path,
    season: int,
    aggregator: PlayerAggregator,
    stats: dict,
    legends_teams: set[str] | None = None,
):
    """Process a single PBP CSV file.

    Args:
        filepath: Path to CSV file
        season: The season year
        aggregator: PlayerAggregator instance
        stats: Dict tracking total_plays, parsed_plays, skipped_types, unparseable_samples
        legends_teams: If set, only process plays where offense or defense is in this set
    """
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            play_type = row.get("playType", "").strip()
            play_text = row.get("playText", "").strip()
            offense = row.get("offense", "").strip()
            defense = row.get("defense", "").strip()
            game_id = row.get("gameId", "").strip()

            # For legends mode, only process relevant teams
            if legends_teams is not None:
                if offense not in legends_teams and defense not in legends_teams:
                    continue

            stats["total_plays"] += 1

            # Skip known non-player play types
            if play_type in SKIP_TYPES:
                stats["skipped_types"][play_type] += 1
                continue

            if not play_type or not play_text:
                stats["skipped_types"]["(empty)"] += 1
                continue

            # Extract player names from play text
            players = extract_players(play_type, play_text)

            if not players:
                stats["skipped_types"][play_type] = stats["skipped_types"].get(play_type, 0) + 1
                if len(stats["unparseable_samples"]) < 50:
                    stats["unparseable_samples"].append(
                        f"[{play_type}] {play_text[:120]}"
                    )
                continue

            stats["parsed_plays"] += 1

            yards_gained = safe_float(row.get("yardsGained", "0"))
            scoring = safe_bool(row.get("scoring", "False"))
            ppa = safe_float(row.get("ppa", "0"))

            # Split offensive vs defensive players
            offensive_roles = {"rusher", "passer", "receiver", "kicker", "fumbler", "returner", "qb"}
            defensive_roles = {"defender"}

            off_players = {k: v for k, v in players.items() if k in offensive_roles}
            def_players = {k: v for k, v in players.items() if k in defensive_roles}

            # Record offensive players with offense team
            if off_players:
                aggregator.record_play(
                    season=season,
                    game_id=game_id,
                    team=offense,
                    play_type=play_type,
                    players=off_players,
                    yards_gained=yards_gained,
                    scoring=scoring,
                    ppa=ppa,
                )

            # Record defensive players with defense team
            if def_players:
                aggregator.record_play(
                    season=season,
                    game_id=game_id,
                    team=defense,
                    play_type=play_type,
                    players=def_players,
                    yards_gained=yards_gained,
                    scoring=scoring,
                    ppa=ppa,
                )


def process_year(
    year: int,
    aggregator: PlayerAggregator,
    stats: dict,
    legends_teams: set[str] | None = None,
):
    """Process all CSV files for a given year."""
    year_dir = PLAYS_DIR / str(year)
    if not year_dir.exists():
        print(f"  [SKIP] No data directory for {year}")
        return

    csv_files = sorted(year_dir.glob("*.csv"))
    if not csv_files:
        print(f"  [SKIP] No CSV files in {year_dir}")
        return

    for csv_file in csv_files:
        process_csv_file(csv_file, year, aggregator, stats, legends_teams)


def print_quality_report(stats: dict, aggregator: PlayerAggregator):
    """Print quality report to stdout."""
    total = stats["total_plays"]
    parsed = stats["parsed_plays"]
    pct = (parsed / total * 100) if total > 0 else 0

    print("\n" + "=" * 70)
    print("QUALITY REPORT")
    print("=" * 70)

    print(f"\nTotal plays processed: {total:,}")
    print(f"Parsed plays (name extracted): {parsed:,} ({pct:.1f}%)")
    print(f"Skipped/unparseable: {total - parsed:,}")

    # Skipped play types
    print("\nSkipped play types:")
    sorted_skipped = sorted(stats["skipped_types"].items(), key=lambda x: -x[1])
    for ptype, count in sorted_skipped[:20]:
        print(f"  {ptype:45s} {count:>8,}")

    # Unparseable samples
    if stats["unparseable_samples"]:
        print(f"\nSample unparseable plays (up to 20):")
        for sample in stats["unparseable_samples"][:20]:
            print(f"  {sample}")

    # Top QBs by passing yards for 2023
    print("\nTop 5 QBs by passing yards (2023 season):")
    qb_yards_2023 = []
    for (name, team, season), s in aggregator._stats.items():
        if season == 2023 and s["_pass_plays"] >= 5:
            qb_yards_2023.append((name, team, s["pass_yds"], s["pass_td"], s["pass_att"], s["pass_comp"]))
    qb_yards_2023.sort(key=lambda x: -x[2])
    for i, (name, team, yds, tds, att, comp) in enumerate(qb_yards_2023[:5], 1):
        print(f"  {i}. {name} ({team}): {yds:,} yds, {tds} TD, {comp}/{att} comp/att")

    # Top RBs by rushing yards for 2023
    print("\nTop 5 RBs by rushing yards (2023 season):")
    rb_yards_2023 = []
    for (name, team, season), s in aggregator._stats.items():
        if season == 2023 and s["_rush_plays"] >= 10 and s["_pass_plays"] < 5:
            rb_yards_2023.append((name, team, s["rush_yds"], s["rush_td"], s["rush_att"]))
    rb_yards_2023.sort(key=lambda x: -x[2])
    for i, (name, team, yds, tds, att) in enumerate(rb_yards_2023[:5], 1):
        print(f"  {i}. {name} ({team}): {yds:,} yds, {tds} TD, {att} carries")

    # Total counts
    players = aggregator.export_players()
    player_stats = aggregator.export_player_stats()
    print(f"\nTotal unique players: {len(players):,}")
    print(f"Total player-seasons: {len(player_stats):,}")
    print("=" * 70)


def fill_conferences(player_stats: list[dict], team_conf: dict[str, str]):
    """Add conference field to each player stat entry."""
    for entry in player_stats:
        team = entry.get("team", "")
        entry["conference"] = team_conf.get(team, "")


def main():
    parser = argparse.ArgumentParser(description="Build player stats from PBP data")
    parser.add_argument(
        "--legends", action="store_true",
        help="Also process pre-2014 legend years from legends-config.json"
    )
    args = parser.parse_args()

    # Load team→conference mapping
    print("Loading team conferences...")
    team_conf = load_team_conferences(TEAMS_CSV)
    print(f"  Loaded {len(team_conf)} teams")

    # Load legends config if needed
    legends_entries = []
    if args.legends:
        legends_entries = load_legends_config(LEGENDS_CONFIG)
        print(f"  Loaded {len(legends_entries)} legends config entries")

    aggregator = PlayerAggregator()
    stats = {
        "total_plays": 0,
        "parsed_plays": 0,
        "skipped_types": defaultdict(int),
        "unparseable_samples": [],
    }

    # Process core years (2014-2024)
    print("\nProcessing core years (2014-2024)...")
    for year in CORE_YEARS:
        print(f"  Processing {year}...", end=" ", flush=True)
        before = stats["parsed_plays"]
        process_year(year, aggregator, stats)
        after = stats["parsed_plays"]
        print(f"{after - before:,} plays parsed")

    # Process legends (pre-2014) if requested
    if args.legends and legends_entries:
        print("\nProcessing legends years...")
        # Group legends by season
        legends_by_year: dict[int, set[str]] = defaultdict(set)
        for entry in legends_entries:
            season = entry["season"]
            if season < 2014:  # Only pre-core years
                legends_by_year[season].add(entry["team"])

        for year in sorted(legends_by_year.keys()):
            teams = legends_by_year[year]
            print(f"  Processing {year} (teams: {', '.join(sorted(teams))})...", end=" ", flush=True)
            before = stats["parsed_plays"]
            process_year(year, aggregator, stats, legends_teams=teams)
            after = stats["parsed_plays"]
            print(f"{after - before:,} plays parsed")

    # Print quality report
    print_quality_report(stats, aggregator)

    # Fill in conference data
    print("\nFilling in conference data...")
    players = aggregator.export_players()
    player_stats_list = aggregator.export_player_stats()
    fill_conferences(player_stats_list, team_conf)

    # Also add conference to player entries
    for p in players:
        p["conference"] = team_conf.get(p["team"], "")

    # Write output files
    print(f"\nWriting {OUTPUT_PLAYERS}...")
    OUTPUT_PLAYERS.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PLAYERS, "w", encoding="utf-8") as f:
        json.dump(players, f, indent=2)
    print(f"  Wrote {len(players):,} players ({OUTPUT_PLAYERS.stat().st_size / 1024:.0f} KB)")

    print(f"Writing {OUTPUT_STATS}...")
    with open(OUTPUT_STATS, "w", encoding="utf-8") as f:
        json.dump(player_stats_list, f, indent=2)
    print(f"  Wrote {len(player_stats_list):,} player-seasons ({OUTPUT_STATS.stat().st_size / 1024:.0f} KB)")

    print("\nDone!")


if __name__ == "__main__":
    main()
