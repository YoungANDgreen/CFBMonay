#!/usr/bin/env python3
"""
Backfill pre-2014 player stats from play-by-play CSV data.

This script processes ALL teams for years 2003-2013 from the starter_pack
PBP data (not just the curated legends), then merges with the existing
players.json and player-stats.json files.

Usage:
    python scripts/backfill-pre2014.py
    python scripts/backfill-pre2014.py --dry-run   # Preview counts without writing
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

BACKFILL_YEARS = list(range(2003, 2014))  # 2003-2013
PLAYS_DIR = PROJECT_ROOT / "starter_pack" / "data" / "plays"
TEAMS_CSV = PROJECT_ROOT / "starter_pack" / "data" / "teams.csv"
OUTPUT_PLAYERS = PROJECT_ROOT / "src" / "data" / "players.json"
OUTPUT_STATS = PROJECT_ROOT / "src" / "data" / "player-stats.json"


def load_team_conferences(teams_csv: Path) -> dict:
    """Load team->conference mapping from teams.csv."""
    mapping = {}
    with open(teams_csv, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            school = row.get("school", "").strip()
            conference = row.get("conference", "").strip()
            if school:
                mapping[school] = conference
    return mapping


def safe_float(val, default=0.0):
    if not val or str(val).strip() == "" or str(val).strip().lower() == "nan":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_bool(val):
    return str(val).strip().lower() == "true" if val else False


def process_csv_file(filepath, season, aggregator, stats):
    """Process a single PBP CSV file for all teams."""
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            play_type = row.get("playType", "").strip()
            play_text = row.get("playText", "").strip()
            offense = row.get("offense", "").strip()
            defense = row.get("defense", "").strip()
            game_id = row.get("gameId", "").strip()

            stats["total_plays"] += 1

            if play_type in SKIP_TYPES:
                stats["skipped_types"][play_type] += 1
                continue

            if not play_type or not play_text:
                stats["skipped_types"]["(empty)"] += 1
                continue

            players = extract_players(play_type, play_text)
            if not players:
                stats["skipped_types"][play_type] = stats["skipped_types"].get(play_type, 0) + 1
                continue

            stats["parsed_plays"] += 1

            yards_gained = safe_float(row.get("yardsGained", "0"))
            scoring = safe_bool(row.get("scoring", "False"))
            ppa = safe_float(row.get("ppa", "0"))

            offensive_roles = {"rusher", "passer", "receiver", "kicker", "fumbler", "returner", "qb"}
            defensive_roles = {"defender"}

            off_players = {k: v for k, v in players.items() if k in offensive_roles}
            def_players = {k: v for k, v in players.items() if k in defensive_roles}

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


def process_year(year, aggregator, stats):
    """Process all CSV files for a given year (all teams)."""
    year_dir = PLAYS_DIR / str(year)
    if not year_dir.exists():
        print(f"  [SKIP] No data directory for {year}")
        return

    csv_files = sorted(year_dir.glob("*.csv"))
    if not csv_files:
        print(f"  [SKIP] No CSV files in {year_dir}")
        return

    for csv_file in csv_files:
        process_csv_file(csv_file, year, aggregator, stats)


def merge_data(new_players, new_stats, existing_players_path, existing_stats_path):
    """Merge new pre-2014 data with existing data, deduplicating."""
    # Load existing data
    existing_players = []
    existing_stats = []

    if existing_players_path.exists():
        with open(existing_players_path, "r") as f:
            existing_players = json.load(f)

    if existing_stats_path.exists():
        with open(existing_stats_path, "r") as f:
            existing_stats = json.load(f)

    print(f"\n  Existing players: {len(existing_players):,}")
    print(f"  Existing player-stats: {len(existing_stats):,}")
    print(f"  New pre-2014 players: {len(new_players):,}")
    print(f"  New pre-2014 player-stats: {len(new_stats):,}")

    # Remove existing pre-2014 entries (we're replacing them with full data)
    existing_players_post2014 = [p for p in existing_players if True]  # Keep all players (can't filter by season)
    existing_stats_post2014 = [s for s in existing_stats if s.get("season", 2020) >= 2014]

    print(f"  Existing post-2014 stats (keeping): {len(existing_stats_post2014):,}")
    pre2014_existing = len(existing_stats) - len(existing_stats_post2014)
    print(f"  Existing pre-2014 stats (replacing): {pre2014_existing:,}")

    # Build player ID set from post-2014 data
    existing_player_ids = set()
    for p in existing_players_post2014:
        existing_player_ids.add(p["id"])

    # Deduplicate stats by (playerId, season, category)
    stat_keys = set()
    for s in existing_stats_post2014:
        key = (s["playerId"], s["season"], s.get("category", ""))
        stat_keys.add(key)

    # Add new stats, deduplicating
    merged_stats = list(existing_stats_post2014)
    new_stat_count = 0
    for s in new_stats:
        key = (s["playerId"], s["season"], s.get("category", ""))
        if key not in stat_keys:
            merged_stats.append(s)
            stat_keys.add(key)
            new_stat_count += 1

    # Add new players, deduplicating by ID
    merged_players = list(existing_players_post2014)
    new_player_ids = set()
    for p in new_players:
        if p["id"] not in existing_player_ids and p["id"] not in new_player_ids:
            merged_players.append(p)
            new_player_ids.add(p["id"])

    print(f"\n  Merged players: {len(merged_players):,}")
    print(f"  Merged player-stats: {len(merged_stats):,}")
    print(f"  New stats added: {new_stat_count:,}")
    print(f"  New players added: {len(new_player_ids):,}")

    return merged_players, merged_stats


def main():
    parser = argparse.ArgumentParser(description="Backfill pre-2014 player stats from PBP data")
    parser.add_argument("--dry-run", action="store_true", help="Preview counts without writing files")
    args = parser.parse_args()

    print("=" * 70)
    print("BACKFILL PRE-2014 PLAYER STATS")
    print("=" * 70)

    # Check that PBP data exists
    if not PLAYS_DIR.exists():
        print(f"\nERROR: starter_pack plays directory not found: {PLAYS_DIR}")
        print("Make sure the starter_pack data is available.")
        sys.exit(1)

    # Load team conferences
    print("\nLoading team conferences...")
    team_conf = load_team_conferences(TEAMS_CSV)
    print(f"  Loaded {len(team_conf)} teams")

    # Process all pre-2014 years
    aggregator = PlayerAggregator()
    stats = {
        "total_plays": 0,
        "parsed_plays": 0,
        "skipped_types": defaultdict(int),
    }

    print(f"\nProcessing years {BACKFILL_YEARS[0]}-{BACKFILL_YEARS[-1]} (ALL teams)...")
    for year in BACKFILL_YEARS:
        print(f"  Processing {year}...", end=" ", flush=True)
        before = stats["parsed_plays"]
        process_year(year, aggregator, stats)
        after = stats["parsed_plays"]
        print(f"{after - before:,} plays parsed")

    # Quality summary
    total = stats["total_plays"]
    parsed = stats["parsed_plays"]
    pct = (parsed / total * 100) if total > 0 else 0
    print(f"\n  Total plays processed: {total:,}")
    print(f"  Parsed plays: {parsed:,} ({pct:.1f}%)")

    # Export new data
    new_players = aggregator.export_players()
    new_stats = aggregator.export_player_stats()

    # Fill conferences
    for entry in new_stats:
        entry["conference"] = team_conf.get(entry.get("team", ""), "")
    for p in new_players:
        p["conference"] = team_conf.get(p["team"], "")

    # Show top players
    print("\n--- Top 10 QBs by passing yards (pre-2014) ---")
    qb_stats = [(s["player"], s["team"], s["season"], s["passingYards"], s["passingTDs"])
                 for s in new_stats if s["category"] == "QB" and s["passingYards"] > 0]
    qb_stats.sort(key=lambda x: -x[3])
    for i, (name, team, season, yds, tds) in enumerate(qb_stats[:10], 1):
        print(f"  {i}. {name} ({team}, {season}): {yds:,} yds, {tds} TD")

    print("\n--- Top 10 RBs by rushing yards (pre-2014) ---")
    rb_stats = [(s["player"], s["team"], s["season"], s["rushingYards"], s["rushingTDs"])
                 for s in new_stats if s["category"] == "RB" and s["rushingYards"] > 0]
    rb_stats.sort(key=lambda x: -x[3])
    for i, (name, team, season, yds, tds) in enumerate(rb_stats[:10], 1):
        print(f"  {i}. {name} ({team}, {season}): {yds:,} yds, {tds} TD")

    print("\n--- Top 10 WRs by receiving yards (pre-2014) ---")
    wr_stats = [(s["player"], s["team"], s["season"], s["receivingYards"], s["receivingTDs"])
                 for s in new_stats if s["category"] == "WR" and s["receivingYards"] > 0]
    wr_stats.sort(key=lambda x: -x[3])
    for i, (name, team, season, yds, tds) in enumerate(wr_stats[:10], 1):
        print(f"  {i}. {name} ({team}, {season}): {yds:,} yds, {tds} TD")

    # Check for key players
    print("\n--- Key Player Check ---")
    key_players = [
        ("Crabtree", 2008), ("Tebow", 2007), ("Tebow", 2008), ("Tebow", 2009),
        ("Harvin", 2007), ("Harvin", 2008), ("Bush", 2005), ("Young", 2005),
        ("Newton", 2010), ("Ingram", 2009), ("Manziel", 2012), ("Manziel", 2013),
        ("Bradford", 2008), ("Smith", 2006), ("Griffin", 2011), ("Winston", 2013),
        ("Leinart", 2004), ("Peterson", 2004),
    ]
    for name_frag, season in key_players:
        matches = [s for s in new_stats
                   if name_frag.lower() in s["player"].lower() and s["season"] == season]
        if matches:
            m = matches[0]
            total_yds = m["passingYards"] + m["rushingYards"] + m["receivingYards"]
            print(f"  {m['player']} ({m['team']}, {season}): {total_yds:,} total yds - FOUND")
        else:
            print(f"  *{name_frag}* ({season}): NOT FOUND")

    if args.dry_run:
        print("\n[DRY RUN] Would merge and write files. Exiting.")
        return

    # Merge with existing data
    print("\nMerging with existing data...")
    merged_players, merged_stats = merge_data(
        new_players, new_stats, OUTPUT_PLAYERS, OUTPUT_STATS
    )

    # Write output
    print(f"\nWriting {OUTPUT_PLAYERS}...")
    OUTPUT_PLAYERS.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PLAYERS, "w", encoding="utf-8") as f:
        json.dump(merged_players, f, indent=2)
    size_kb = OUTPUT_PLAYERS.stat().st_size / 1024
    print(f"  Wrote {len(merged_players):,} players ({size_kb:.0f} KB)")

    print(f"Writing {OUTPUT_STATS}...")
    with open(OUTPUT_STATS, "w", encoding="utf-8") as f:
        json.dump(merged_stats, f, indent=2)
    size_kb = OUTPUT_STATS.stat().st_size / 1024
    print(f"  Wrote {len(merged_stats):,} player-seasons ({size_kb:.0f} KB)")

    # Final verification
    pre2014 = sum(1 for s in merged_stats if s["season"] < 2014)
    post2014 = sum(1 for s in merged_stats if s["season"] >= 2014)
    print(f"\n  Pre-2014 stats: {pre2014:,}")
    print(f"  Post-2014 stats: {post2014:,}")
    print(f"  Total: {len(merged_stats):,}")

    print("\n" + "=" * 70)
    print("BACKFILL COMPLETE!")
    print("=" * 70)


if __name__ == "__main__":
    main()
