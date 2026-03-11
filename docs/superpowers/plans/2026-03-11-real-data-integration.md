# Real Data Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all synthetic seed data with real CFBD data, build player stats from play-by-play parsing, and integrate pre-trained ML models for server-side predictions.

**Architecture:** Build-time ETL scripts (Python + TypeScript) process starter_pack CSVs into optimized JSON files consumed by the existing in-memory cache layer. A Python subprocess on the Express server serves ML model predictions. No structural changes to game engines — they consume real data through the same cache getters.

**Tech Stack:** Python 3 (pandas, regex, csv), TypeScript (csv-parse), Express.js, XGBoost/scikit-learn (server-side), existing React Native + Zustand frontend.

**Spec:** `docs/superpowers/specs/2026-03-11-real-data-integration-design.md`

---

## Chunk 1: Play-by-Play Discovery & Player Stats Parser

This chunk builds the Python pipeline that parses ~2M play-by-play records into structured player stats. It's the heaviest processing and produces the most novel dataset.

### Task 1: PlayText Discovery Script

**Files:**
- Create: `scripts/discover-play-formats.py`

This script samples `playText` values from the play-by-play CSVs to document all format variants per `playType`. It's a one-time tool that informs the regex patterns in the parser.

- [ ] **Step 1: Create the discovery script**

```python
#!/usr/bin/env python3
"""
Discover all playText format variants per playType from play-by-play CSVs.
Samples across multiple seasons to catch format changes over time.
"""
import csv
import os
import sys
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'starter_pack', 'data', 'plays')
SAMPLE_YEARS = [2014, 2017, 2020, 2023, 2024]
SAMPLES_PER_TYPE = 25


def discover_formats():
    samples = defaultdict(list)
    type_counts = defaultdict(int)

    for year in SAMPLE_YEARS:
        year_dir = os.path.join(DATA_DIR, str(year))
        if not os.path.isdir(year_dir):
            print(f"Warning: {year_dir} not found, skipping")
            continue

        csv_files = sorted([f for f in os.listdir(year_dir) if f.endswith('.csv')])
        # Sample from first and last week files
        for csv_file in [csv_files[0], csv_files[-1]]:
            filepath = os.path.join(year_dir, csv_file)
            with open(filepath, encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    play_type = row.get('playType', '')
                    play_text = row.get('playText', '')
                    if not play_type or not play_text:
                        continue
                    type_counts[play_type] += 1
                    if len(samples[play_type]) < SAMPLES_PER_TYPE:
                        samples[play_type].append({
                            'year': year,
                            'text': play_text,
                            'yardsGained': row.get('yardsGained', ''),
                            'scoring': row.get('scoring', ''),
                            'offense': row.get('offense', ''),
                        })

    # Output results
    print("=" * 80)
    print("PLAY-BY-PLAY FORMAT DISCOVERY REPORT")
    print("=" * 80)

    for play_type in sorted(type_counts.keys(), key=lambda k: -type_counts[k]):
        count = type_counts[play_type]
        print(f"\n{'─' * 60}")
        print(f"playType: {play_type}  (sampled count: {count})")
        print(f"{'─' * 60}")
        for s in samples[play_type]:
            print(f"  [{s['year']}] yards={s['yardsGained']} scoring={s['scoring']}")
            print(f"         {s['text'][:120]}")
        print()


if __name__ == '__main__':
    discover_formats()
```

- [ ] **Step 2: Run the discovery script**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && python scripts/discover-play-formats.py > docs/play-format-discovery.txt 2>&1`

Expected: A text file with 25+ sample `playText` values per `playType`, organized by type with counts. This file is a reference for building regex patterns.

- [ ] **Step 3: Review output and document key format variants**

Manually scan the output file. For each parseable `playType`, note:
- All distinct text patterns observed
- Which fields vary (some have yards, some don't; some name players, some don't)
- Any format changes between 2014 and 2024

Save any notable findings as comments in the parser script (Task 2).

- [ ] **Step 4: Commit**

```bash
git add scripts/discover-play-formats.py docs/play-format-discovery.txt
git commit -m "feat: add play-by-play format discovery script

Samples playText across 5 seasons to document all format variants
per playType. Output used to build regex patterns for player stats parser."
```

---

### Task 2: Legends Config File

**Files:**
- Create: `scripts/legends-config.json`

- [ ] **Step 1: Create the legends config**

```json
[
  { "season": 2003, "team": "USC", "note": "Carson Palmer Heisman, Matt Leinart" },
  { "season": 2004, "team": "USC", "note": "Matt Leinart, Reggie Bush" },
  { "season": 2005, "team": "Texas", "note": "Vince Young championship" },
  { "season": 2005, "team": "USC", "note": "Reggie Bush, LenDale White" },
  { "season": 2006, "team": "Ohio State", "note": "Troy Smith Heisman" },
  { "season": 2006, "team": "Florida", "note": "BCS Champions, Chris Leak" },
  { "season": 2007, "team": "Florida", "note": "Tim Tebow Heisman" },
  { "season": 2008, "team": "Florida", "note": "Tim Tebow BCS champ" },
  { "season": 2008, "team": "Oklahoma", "note": "Sam Bradford Heisman" },
  { "season": 2009, "team": "Alabama", "note": "Mark Ingram Heisman, BCS champ" },
  { "season": 2010, "team": "Auburn", "note": "Cam Newton Heisman/champ" },
  { "season": 2011, "team": "Alabama", "note": "BCS champ, Trent Richardson" },
  { "season": 2011, "team": "Baylor", "note": "RG3 Heisman" },
  { "season": 2012, "team": "Texas A&M", "note": "Johnny Manziel Heisman" },
  { "season": 2012, "team": "Alabama", "note": "BCS champ, AJ McCarron" },
  { "season": 2013, "team": "Texas A&M", "note": "Johnny Manziel" },
  { "season": 2013, "team": "Florida State", "note": "Jameis Winston Heisman/champ" }
]
```

- [ ] **Step 2: Commit**

```bash
git add scripts/legends-config.json
git commit -m "feat: add legends config for pre-2014 iconic team-seasons"
```

---

### Task 3: Play-by-Play Player Stats Parser — Core Module

**Files:**
- Create: `scripts/pbp_parser/__init__.py`
- Create: `scripts/pbp_parser/name_extractor.py`
- Test: `scripts/pbp_parser/test_name_extractor.py`

This module handles regex extraction of player names from `playText`. It's the trickiest part — uses the discovery output from Task 1 to build patterns.

- [ ] **Step 1: Write failing tests for name extraction**

```python
# scripts/pbp_parser/test_name_extractor.py
import pytest
from pbp_parser.name_extractor import extract_players

class TestRushPlays:
    def test_rush_basic(self):
        result = extract_players("Rush", "Anthony Woods run for 2 yds to the LAM 45")
        assert result['rusher'] == "Anthony Woods"

    def test_rush_td(self):
        result = extract_players("Rushing Touchdown", "Jack Layne run for 4 yds for a TD (Cameron Pope KICK)")
        assert result['rusher'] == "Jack Layne"

    def test_rush_negative(self):
        result = extract_players("Rush", "Sawyer Robertson run for a loss of 3 yds to the BAY 40")
        assert result['rusher'] == "Sawyer Robertson"


class TestPassPlays:
    def test_pass_complete(self):
        result = extract_players("Pass Reception", "Jack Layne pass complete to Mark Hamper")
        assert result['passer'] == "Jack Layne"
        assert result['receiver'] == "Mark Hamper"

    def test_pass_complete_first_down(self):
        result = extract_players("Pass Reception", "Jack Layne pass complete to Elisha Cummings for a 1ST down")
        assert result['passer'] == "Jack Layne"
        assert result['receiver'] == "Elisha Cummings"

    def test_pass_td_format_a(self):
        """TD format: '{receiver} {yards} Yd pass from {passer}'"""
        result = extract_players("Passing Touchdown", "Jake Cox 36 Yd pass from Hayden Hatten (Cameron Pope Kick)")
        assert result['passer'] == "Hayden Hatten"
        assert result['receiver'] == "Jake Cox"

    def test_pass_td_format_b(self):
        """TD format: '{passer} pass complete to {receiver} for X yds for a TD'"""
        result = extract_players("Passing Touchdown", "Rocco Becht pass complete to Jayden Higgins for 21 yds for a TD (Kyle Konrardy KICK)")
        assert result['passer'] == "Rocco Becht"
        assert result['receiver'] == "Jayden Higgins"

    def test_pass_incomplete_both_named(self):
        result = extract_players("Pass Incompletion", "Jack Layne pass incomplete to Terez Traynor")
        assert result['passer'] == "Jack Layne"

    def test_pass_incomplete_no_target(self):
        result = extract_players("Pass Incompletion", "Jack Layne pass incomplete")
        assert result['passer'] == "Jack Layne"

    def test_pass_incomplete_no_passer(self):
        result = extract_players("Pass Incompletion", "pass incomplete to Terez Traynor")
        assert result.get('passer') is None


class TestDefensivePlays:
    def test_sack(self):
        result = extract_players("Sack", "Spencer Rattler sacked by Tomari Fox for a loss of 3 yards to the UNC 8")
        assert result['qb'] == "Spencer Rattler"
        assert result['defender'] == "Tomari Fox"

    def test_interception(self):
        result = extract_players("Interception", "Gevani McCoy pass intercepted")
        assert result['passer'] == "Gevani McCoy"

    def test_interception_return_td(self):
        result = extract_players("Interception Return Touchdown", "Gevani McCoy pass intercepted, Joe Smith return for 45 yds for a TD")
        assert result['passer'] == "Gevani McCoy"


class TestSpecialTeams:
    def test_fg_good_format_a(self):
        result = extract_players("Field Goal Good", "Mitch Jeter 26 yd FG GOOD")
        assert result['kicker'] == "Mitch Jeter"

    def test_fg_good_format_b(self):
        result = extract_players("Field Goal Good", "Logan Ward 52 Yd Field Goal")
        assert result['kicker'] == "Logan Ward"

    def test_fg_missed(self):
        result = extract_players("Field Goal Missed", "Mitch Jeter 40 yd FG MISSED")
        assert result['kicker'] == "Mitch Jeter"


class TestFumbles:
    def test_fumble_recovery_opponent(self):
        result = extract_players("Fumble Recovery (Opponent)", "Sawyer Robertson fumbled, recovered by TXST Kaleb Culp")
        assert result['fumbler'] == "Sawyer Robertson"

    def test_fumble_own_recovery(self):
        result = extract_players("Fumble Recovery (Own)", "Sawyer Robertson fumbled, recovered by BAY Sawyer Robertson")
        assert result['fumbler'] == "Sawyer Robertson"


class TestEdgeCases:
    def test_empty_text(self):
        result = extract_players("Rush", "")
        assert result == {}

    def test_team_placeholder(self):
        result = extract_players("Rush", "TEAM run for 0 yds")
        assert result == {}

    def test_unknown_play_type(self):
        result = extract_players("Timeout", "Timeout Alabama")
        assert result == {}

    def test_name_with_suffix(self):
        result = extract_players("Rush", "Travis Etienne Jr. run for 5 yds to the CLE 40")
        assert result['rusher'] == "Travis Etienne Jr."
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && python -m pytest scripts/pbp_parser/test_name_extractor.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'pbp_parser'`

- [ ] **Step 3: Create the `__init__.py`**

```python
# scripts/pbp_parser/__init__.py
```

- [ ] **Step 4: Implement name extractor**

```python
# scripts/pbp_parser/name_extractor.py
"""
Extract player names from playText field in CFBD play-by-play data.
Uses structured columns (yardsGained, scoring, ppa) for stats — this module
only extracts NAMES from the natural-language playText.

Patterns derived from discovery script output (see docs/play-format-discovery.txt).
"""
import re

# Compiled patterns — order matters within each play type
RUSH_PATTERN = re.compile(r'^(.+?)\s+run\s+for\s+', re.IGNORECASE)

PASS_COMPLETE_PATTERN = re.compile(
    r'^(.+?)\s+pass\s+complete\s+to\s+(.+?)(?:\s+(?:for|to\s+the)\b|$)',
    re.IGNORECASE
)

PASS_TD_FROM_PATTERN = re.compile(
    r'^(.+?)\s+\d+\s+[Yy]d\s+pass\s+from\s+(.+?)(?:\s*\(|$)',
    re.IGNORECASE
)

PASS_INCOMPLETE_PATTERN = re.compile(
    r'^(.+?)\s+pass\s+incomplete(?:\s+to\s+(.+?))?(?:\s*$|\s+(?:to\s+the|at\s+the))',
    re.IGNORECASE
)
# Fallback for "pass incomplete" with no passer
PASS_INCOMPLETE_NO_PASSER = re.compile(
    r'^pass\s+incomplete',
    re.IGNORECASE
)

SACK_PATTERN = re.compile(
    r'^(.+?)\s+sacked\s+by\s+(.+?)\s+for\s+a?\s*loss',
    re.IGNORECASE
)

INTERCEPTION_PATTERN = re.compile(
    r'^(.+?)\s+pass\s+intercepted',
    re.IGNORECASE
)

FG_PATTERN = re.compile(
    r'^(.+?)\s+\d+\s+[Yy]d\s+(?:FG|Field\s+Goal)',
    re.IGNORECASE
)

FUMBLE_PATTERN = re.compile(
    r'^(.+?)\s+fumbled',
    re.IGNORECASE
)

KICKOFF_RETURN_PATTERN = re.compile(
    r'(?:,\s*)(.+?)\s+return\s+for',
    re.IGNORECASE
)

PUNT_RETURN_PATTERN = re.compile(
    r'(?:,\s*)(.+?)\s+return\s+for',
    re.IGNORECASE
)

# Team placeholder names to skip
TEAM_PLACEHOLDERS = {'TEAM', 'Team', 'team'}

# Play types we parse
PARSEABLE_TYPES = {
    'Rush', 'Rushing Touchdown',
    'Pass Reception', 'Passing Touchdown',
    'Pass Incompletion',
    'Sack',
    'Interception', 'Interception Return Touchdown', 'Pass Interception Return',
    'Fumble Recovery (Opponent)', 'Fumble Recovery (Own)', 'Fumble Return Touchdown',
    'Field Goal Good', 'Field Goal Missed',
    'Kickoff Return (Offense)', 'Kickoff Return Touchdown',
    'Punt Return Touchdown',
}


def _clean_name(name: str) -> str:
    """Strip trailing junk from extracted names."""
    name = name.strip().rstrip(',').strip()
    # Remove trailing yard-line references like "to the ALA 35"
    name = re.sub(r'\s+to\s+the\s+\w+\s+\d+.*$', '', name)
    # Remove trailing "for a 1ST down" etc.
    name = re.sub(r'\s+for\s+a\s+.*$', '', name)
    return name.strip()


def extract_players(play_type: str, play_text: str) -> dict:
    """
    Extract player names from a playText string.

    Returns a dict with keys like 'rusher', 'passer', 'receiver', 'qb',
    'defender', 'kicker', 'fumbler', 'returner' as applicable.
    Returns empty dict for unparseable or skipped play types.
    """
    if not play_text or play_type not in PARSEABLE_TYPES:
        return {}

    result = {}

    # Rush plays
    if play_type in ('Rush', 'Rushing Touchdown'):
        m = RUSH_PATTERN.match(play_text)
        if m:
            name = _clean_name(m.group(1))
            if name not in TEAM_PLACEHOLDERS:
                result['rusher'] = name

    # Pass plays — completion / TD
    elif play_type in ('Pass Reception', 'Passing Touchdown'):
        # Try "pass complete to" first (most common)
        m = PASS_COMPLETE_PATTERN.match(play_text)
        if m:
            result['passer'] = _clean_name(m.group(1))
            result['receiver'] = _clean_name(m.group(2))
        else:
            # Try "{receiver} {yards} Yd pass from {passer}" (TD format)
            m = PASS_TD_FROM_PATTERN.match(play_text)
            if m:
                result['receiver'] = _clean_name(m.group(1))
                result['passer'] = _clean_name(m.group(2))

    # Pass incompletion
    elif play_type == 'Pass Incompletion':
        if PASS_INCOMPLETE_NO_PASSER.match(play_text):
            # No passer named — "pass incomplete to X"
            pass
        else:
            m = PASS_INCOMPLETE_PATTERN.match(play_text)
            if m:
                result['passer'] = _clean_name(m.group(1))

    # Sack
    elif play_type == 'Sack':
        m = SACK_PATTERN.match(play_text)
        if m:
            result['qb'] = _clean_name(m.group(1))
            result['defender'] = _clean_name(m.group(2))

    # Interception
    elif play_type in ('Interception', 'Interception Return Touchdown', 'Pass Interception Return'):
        m = INTERCEPTION_PATTERN.match(play_text)
        if m:
            result['passer'] = _clean_name(m.group(1))

    # Field Goal
    elif play_type in ('Field Goal Good', 'Field Goal Missed'):
        m = FG_PATTERN.match(play_text)
        if m:
            result['kicker'] = _clean_name(m.group(1))

    # Fumble
    elif play_type in ('Fumble Recovery (Opponent)', 'Fumble Recovery (Own)', 'Fumble Return Touchdown'):
        m = FUMBLE_PATTERN.match(play_text)
        if m:
            name = _clean_name(m.group(1))
            if name not in TEAM_PLACEHOLDERS:
                result['fumbler'] = name

    # Kickoff / Punt return
    elif play_type in ('Kickoff Return (Offense)', 'Kickoff Return Touchdown', 'Punt Return Touchdown'):
        m = KICKOFF_RETURN_PATTERN.search(play_text)
        if m:
            name = _clean_name(m.group(1))
            if name not in TEAM_PLACEHOLDERS:
                result['returner'] = name

    # Filter out team placeholders from any result
    return {k: v for k, v in result.items() if v and v not in TEAM_PLACEHOLDERS}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && python -m pytest scripts/pbp_parser/test_name_extractor.py -v`
Expected: All tests PASS. If any fail, update regex patterns based on actual format discovery output.

- [ ] **Step 6: Commit**

```bash
git add scripts/pbp_parser/
git commit -m "feat: add playText name extractor with regex patterns

Parses player names from CFBD play-by-play playText column.
Handles all major play types: rush, pass, sack, INT, FG, fumble, returns.
Tests cover known format variants from discovery script."
```

---

### Task 4: Play-by-Play Player Stats Parser — Aggregation Engine

**Files:**
- Create: `scripts/pbp_parser/aggregator.py`
- Test: `scripts/pbp_parser/test_aggregator.py`

This module accumulates per-play extractions into per-player-per-season stat totals.

- [ ] **Step 1: Write failing tests for the aggregator**

```python
# scripts/pbp_parser/test_aggregator.py
import pytest
from pbp_parser.aggregator import PlayerAggregator


class TestPlayerAggregator:
    def setup_method(self):
        self.agg = PlayerAggregator()

    def test_rush_play(self):
        self.agg.record_play(
            season=2023, game_id='401234', team='Alabama',
            play_type='Rush', players={'rusher': 'Jalen Milroe'},
            yards_gained=12, scoring=False, ppa=0.5
        )
        stats = self.agg.get_player_season_stats('Jalen Milroe', 'Alabama', 2023)
        assert stats['rush_att'] == 1
        assert stats['rush_yds'] == 12
        assert stats['rush_td'] == 0
        assert stats['games'] == 1
        assert stats['ppa_total'] == pytest.approx(0.5)

    def test_rush_td(self):
        self.agg.record_play(
            season=2023, game_id='401234', team='Alabama',
            play_type='Rushing Touchdown', players={'rusher': 'Jalen Milroe'},
            yards_gained=5, scoring=True, ppa=2.0
        )
        stats = self.agg.get_player_season_stats('Jalen Milroe', 'Alabama', 2023)
        assert stats['rush_td'] == 1

    def test_pass_completion(self):
        self.agg.record_play(
            season=2023, game_id='401234', team='Alabama',
            play_type='Pass Reception',
            players={'passer': 'Jalen Milroe', 'receiver': 'Jermaine Burton'},
            yards_gained=25, scoring=False, ppa=1.2
        )
        passer = self.agg.get_player_season_stats('Jalen Milroe', 'Alabama', 2023)
        assert passer['pass_comp'] == 1
        assert passer['pass_att'] == 1
        assert passer['pass_yds'] == 25

        receiver = self.agg.get_player_season_stats('Jermaine Burton', 'Alabama', 2023)
        assert receiver['receptions'] == 1
        assert receiver['rec_yds'] == 25

    def test_sack_not_pass_attempt(self):
        """NCAA rules: sacks are not pass attempts."""
        self.agg.record_play(
            season=2023, game_id='401234', team='Alabama',
            play_type='Sack',
            players={'qb': 'Jalen Milroe', 'defender': 'Dallas Turner'},
            yards_gained=-8, scoring=False, ppa=-1.5
        )
        qb = self.agg.get_player_season_stats('Jalen Milroe', 'Alabama', 2023)
        assert qb['pass_att'] == 0  # NCAA: sacks not counted as pass attempts
        assert qb['times_sacked'] == 1

        defender = self.agg.get_player_season_stats('Dallas Turner', 'Alabama', 2023)
        assert defender['sacks_recorded'] == 1

    def test_interception(self):
        self.agg.record_play(
            season=2023, game_id='401234', team='Alabama',
            play_type='Interception',
            players={'passer': 'Jalen Milroe'},
            yards_gained=0, scoring=False, ppa=-3.0
        )
        stats = self.agg.get_player_season_stats('Jalen Milroe', 'Alabama', 2023)
        assert stats['pass_att'] == 1
        assert stats['pass_int'] == 1

    def test_game_counting(self):
        """Multiple plays in same game = 1 game played."""
        for _ in range(3):
            self.agg.record_play(
                season=2023, game_id='401234', team='Alabama',
                play_type='Rush', players={'rusher': 'Jalen Milroe'},
                yards_gained=5, scoring=False, ppa=0.3
            )
        self.agg.record_play(
            season=2023, game_id='401999', team='Alabama',
            play_type='Rush', players={'rusher': 'Jalen Milroe'},
            yards_gained=10, scoring=False, ppa=0.5
        )
        stats = self.agg.get_player_season_stats('Jalen Milroe', 'Alabama', 2023)
        assert stats['games'] == 2
        assert stats['rush_att'] == 4
        assert stats['rush_yds'] == 25

    def test_position_inference_qb(self):
        for i in range(6):
            self.agg.record_play(
                season=2023, game_id='401234', team='Alabama',
                play_type='Pass Reception',
                players={'passer': 'Jalen Milroe', 'receiver': f'WR{i}'},
                yards_gained=10, scoring=False, ppa=0.5
            )
        player = self.agg.get_player_entry('Jalen Milroe', 'Alabama')
        assert player['position'] == 'QB'

    def test_position_inference_rb(self):
        for i in range(10):
            self.agg.record_play(
                season=2023, game_id='401234', team='Alabama',
                play_type='Rush', players={'rusher': 'Jam Miller'},
                yards_gained=5, scoring=False, ppa=0.3
            )
        player = self.agg.get_player_entry('Jam Miller', 'Alabama')
        assert player['position'] == 'RB'

    def test_fg_kicker(self):
        self.agg.record_play(
            season=2023, game_id='401234', team='Alabama',
            play_type='Field Goal Good',
            players={'kicker': 'Will Reichard'},
            yards_gained=0, scoring=True, ppa=1.5
        )
        stats = self.agg.get_player_season_stats('Will Reichard', 'Alabama', 2023)
        assert stats['fg_made'] == 1
        assert stats['fg_att'] == 1

    def test_export_players_json(self):
        self.agg.record_play(
            season=2023, game_id='401234', team='Alabama',
            play_type='Rush', players={'rusher': 'Jalen Milroe'},
            yards_gained=5, scoring=False, ppa=0.3
        )
        players = self.agg.export_players()
        assert len(players) == 1
        assert players[0]['firstName'] == 'Jalen'
        assert players[0]['lastName'] == 'Milroe'
        assert players[0]['team'] == 'Alabama'

    def test_export_player_stats_matches_cached_interface(self):
        """export_player_stats must match flat CachedPlayerSeasonStats shape."""
        self.agg.record_play(
            season=2023, game_id='401234', team='Alabama',
            play_type='Rush', players={'rusher': 'Jalen Milroe'},
            yards_gained=55, scoring=False, ppa=0.3
        )
        self.agg.record_play(
            season=2023, game_id='401234', team='Alabama',
            play_type='Pass Reception',
            players={'passer': 'Jalen Milroe', 'receiver': 'Jermaine Burton'},
            yards_gained=30, scoring=False, ppa=1.0
        )
        stats = self.agg.export_player_stats()
        milroe = [s for s in stats if s['player'] == 'Jalen Milroe'][0]
        # Must use flat field names matching CachedPlayerSeasonStats
        assert milroe['playerId'] == milroe['playerId']  # exists
        assert milroe['player'] == 'Jalen Milroe'  # NOT 'playerName'
        assert milroe['team'] == 'Alabama'
        assert milroe['season'] == 2023
        assert milroe['category'] == 'QB'  # inferred position as category
        assert milroe['rushingYards'] == 55
        assert milroe['carries'] == 1
        assert milroe['passingYards'] == 30
        assert milroe['completions'] == 1
        assert milroe['attempts'] == 1
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && python -m pytest scripts/pbp_parser/test_aggregator.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement the aggregator**

```python
# scripts/pbp_parser/aggregator.py
"""
Aggregates per-play player extractions into per-player-per-season stat totals.
Exports in CachedPlayer and CachedPlayerSeasonStats format.
"""
import hashlib
from collections import defaultdict


def _make_id(name: str, team: str) -> int:
    """Generate a stable numeric ID from name + first team."""
    h = hashlib.md5(f"{name}:{team}".encode()).hexdigest()
    return int(h[:8], 16)


def _split_name(full_name: str) -> tuple:
    """Split 'First Last' or 'First Last Jr.' into (first, last)."""
    parts = full_name.strip().split()
    if len(parts) == 1:
        return (parts[0], '')
    first = parts[0]
    last = ' '.join(parts[1:])
    return (first, last)


def _empty_stats() -> dict:
    return {
        'games': 0,
        'rush_att': 0, 'rush_yds': 0, 'rush_td': 0,
        'pass_comp': 0, 'pass_att': 0, 'pass_yds': 0, 'pass_td': 0, 'pass_int': 0,
        'receptions': 0, 'rec_yds': 0, 'rec_td': 0,
        'times_sacked': 0,
        'sacks_recorded': 0, 'interceptions_recorded': 0,
        'fumbles_lost': 0, 'fumbles_recovered': 0,
        'fg_made': 0, 'fg_att': 0,
        'kick_return_yds': 0, 'punt_return_yds': 0, 'return_tds': 0,
        'ppa_total': 0.0,
        '_game_ids': set(),  # internal tracking, removed on export
        '_pass_plays': 0,    # for position inference
        '_rush_plays': 0,
        '_rec_plays': 0,
        '_kick_plays': 0,
        '_def_plays': 0,
    }


class PlayerAggregator:
    def __init__(self):
        # key: (name, team, season) -> stats dict
        self.season_stats = defaultdict(_empty_stats)
        # key: (name, team) -> {'first_season': int, 'last_season': int}
        self.player_meta = {}

    def record_play(self, season: int, game_id: str, team: str,
                    play_type: str, players: dict,
                    yards_gained: float, scoring: bool, ppa: float):
        """Record a single play's contribution to player stats."""
        if not players:
            return

        ppa = ppa if ppa and ppa == ppa else 0.0  # handle NaN
        yards = int(yards_gained) if yards_gained and yards_gained == yards_gained else 0
        is_td = scoring and play_type in (
            'Rushing Touchdown', 'Passing Touchdown',
            'Interception Return Touchdown', 'Fumble Return Touchdown',
            'Kickoff Return Touchdown', 'Punt Return Touchdown',
        )

        # Rush plays
        if play_type in ('Rush', 'Rushing Touchdown') and 'rusher' in players:
            name = players['rusher']
            key = (name, team, season)
            s = self.season_stats[key]
            s['rush_att'] += 1
            s['rush_yds'] += yards
            if play_type == 'Rushing Touchdown':
                s['rush_td'] += 1
            s['ppa_total'] += ppa
            s['_rush_plays'] += 1
            s['_game_ids'].add(game_id)
            s['games'] = len(s['_game_ids'])
            self._track_meta(name, team, season)

        # Pass plays — passer
        if play_type in ('Pass Reception', 'Passing Touchdown') and 'passer' in players:
            name = players['passer']
            key = (name, team, season)
            s = self.season_stats[key]
            s['pass_comp'] += 1
            s['pass_att'] += 1
            s['pass_yds'] += yards
            if play_type == 'Passing Touchdown':
                s['pass_td'] += 1
            s['ppa_total'] += ppa
            s['_pass_plays'] += 1
            s['_game_ids'].add(game_id)
            s['games'] = len(s['_game_ids'])
            self._track_meta(name, team, season)

        # Pass plays — receiver
        if play_type in ('Pass Reception', 'Passing Touchdown') and 'receiver' in players:
            name = players['receiver']
            key = (name, team, season)
            s = self.season_stats[key]
            s['receptions'] += 1
            s['rec_yds'] += yards
            if play_type == 'Passing Touchdown':
                s['rec_td'] += 1
            s['_rec_plays'] += 1
            s['_game_ids'].add(game_id)
            s['games'] = len(s['_game_ids'])
            self._track_meta(name, team, season)

        # Pass incompletion — passer only
        if play_type == 'Pass Incompletion' and 'passer' in players:
            name = players['passer']
            key = (name, team, season)
            s = self.season_stats[key]
            s['pass_att'] += 1
            s['_pass_plays'] += 1
            s['_game_ids'].add(game_id)
            s['games'] = len(s['_game_ids'])
            self._track_meta(name, team, season)

        # Sack — QB and defender
        if play_type == 'Sack':
            if 'qb' in players:
                name = players['qb']
                key = (name, team, season)
                s = self.season_stats[key]
                s['times_sacked'] += 1
                s['ppa_total'] += ppa
                s['_pass_plays'] += 1  # counts for position inference but NOT pass_att
                s['_game_ids'].add(game_id)
                s['games'] = len(s['_game_ids'])
                self._track_meta(name, team, season)
            if 'defender' in players:
                name = players['defender']
                # Defender is on the defense team
                key = (name, team, season)  # team here is offense — we need defense
                # NOTE: caller should pass defense team for defender. For now,
                # we track under the same team and fix in the main script.
                s = self.season_stats[key]
                s['sacks_recorded'] += 1
                s['_def_plays'] += 1
                s['_game_ids'].add(game_id)
                s['games'] = len(s['_game_ids'])
                self._track_meta(name, team, season)

        # Interception — passer
        if play_type in ('Interception', 'Interception Return Touchdown', 'Pass Interception Return'):
            if 'passer' in players:
                name = players['passer']
                key = (name, team, season)
                s = self.season_stats[key]
                s['pass_att'] += 1
                s['pass_int'] += 1
                s['ppa_total'] += ppa
                s['_pass_plays'] += 1
                s['_game_ids'].add(game_id)
                s['games'] = len(s['_game_ids'])
                self._track_meta(name, team, season)

        # Field goals
        if play_type in ('Field Goal Good', 'Field Goal Missed') and 'kicker' in players:
            name = players['kicker']
            key = (name, team, season)
            s = self.season_stats[key]
            s['fg_att'] += 1
            if play_type == 'Field Goal Good':
                s['fg_made'] += 1
            s['_kick_plays'] += 1
            s['_game_ids'].add(game_id)
            s['games'] = len(s['_game_ids'])
            self._track_meta(name, team, season)

        # Fumbles
        if play_type in ('Fumble Recovery (Opponent)', 'Fumble Recovery (Own)',
                         'Fumble Return Touchdown') and 'fumbler' in players:
            name = players['fumbler']
            key = (name, team, season)
            s = self.season_stats[key]
            if play_type == 'Fumble Recovery (Opponent)':
                s['fumbles_lost'] += 1
            else:
                s['fumbles_recovered'] += 1
            s['_game_ids'].add(game_id)
            s['games'] = len(s['_game_ids'])
            self._track_meta(name, team, season)

        # Returns
        if play_type in ('Kickoff Return (Offense)', 'Kickoff Return Touchdown') and 'returner' in players:
            name = players['returner']
            key = (name, team, season)
            s = self.season_stats[key]
            s['kick_return_yds'] += yards
            if play_type == 'Kickoff Return Touchdown':
                s['return_tds'] += 1
            s['_game_ids'].add(game_id)
            s['games'] = len(s['_game_ids'])
            self._track_meta(name, team, season)

        if play_type == 'Punt Return Touchdown' and 'returner' in players:
            name = players['returner']
            key = (name, team, season)
            s = self.season_stats[key]
            s['punt_return_yds'] += yards
            s['return_tds'] += 1
            s['_game_ids'].add(game_id)
            s['games'] = len(s['_game_ids'])
            self._track_meta(name, team, season)

    def _track_meta(self, name: str, team: str, season: int):
        key = (name, team)
        if key not in self.player_meta:
            self.player_meta[key] = {'first_season': season, 'last_season': season}
        else:
            meta = self.player_meta[key]
            meta['first_season'] = min(meta['first_season'], season)
            meta['last_season'] = max(meta['last_season'], season)

    def _infer_position(self, name: str, team: str) -> str:
        """Infer position from play usage across all seasons for this player+team."""
        totals = {'pass': 0, 'rush': 0, 'rec': 0, 'kick': 0, 'def': 0}
        for (n, t, s), stats in self.season_stats.items():
            if n == name and t == team:
                totals['pass'] += stats['_pass_plays']
                totals['rush'] += stats['_rush_plays']
                totals['rec'] += stats['_rec_plays']
                totals['kick'] += stats['_kick_plays']
                totals['def'] += stats['_def_plays']

        if totals['pass'] >= 5:
            return 'QB'
        if totals['kick'] > 0 and totals['rush'] == 0 and totals['rec'] == 0:
            return 'K'
        if totals['def'] > 0 and totals['rush'] == 0 and totals['rec'] == 0 and totals['pass'] == 0:
            return 'DEF'
        if totals['rec'] > totals['rush']:
            return 'WR'
        if totals['rush'] > 0:
            return 'RB'
        if totals['rec'] > 0:
            return 'WR'
        return 'ATH'

    def get_player_season_stats(self, name: str, team: str, season: int) -> dict:
        key = (name, team, season)
        return dict(self.season_stats[key])

    def get_player_entry(self, name: str, team: str) -> dict:
        first, last = _split_name(name)
        return {
            'id': _make_id(name, team),
            'firstName': first,
            'lastName': last,
            'team': team,
            'position': self._infer_position(name, team),
            'jersey': 0,
            'height': 0,
            'weight': 0,
            'year': '',
            'hometown': '',
        }

    def export_players(self) -> list:
        """Export unique player entries in CachedPlayer format."""
        seen = set()
        players = []
        for (name, team) in self.player_meta:
            key = (name, team)
            if key not in seen:
                seen.add(key)
                players.append(self.get_player_entry(name, team))
        return sorted(players, key=lambda p: (p['team'], p['lastName'], p['firstName']))

    def export_player_stats(self) -> list:
        """Export player-season stats in FLAT CachedPlayerSeasonStats format.

        IMPORTANT: Must match the existing interface exactly:
          playerId, player (NOT playerName), team, season, category,
          passingYards?, passingTDs?, interceptions?, completions?, attempts?,
          rushingYards?, rushingTDs?, carries?,
          receptions?, receivingYards?, receivingTDs?,
          tackles?, sacks?, defensiveInterceptions?, forcedFumbles?, passesDefended?
        """
        results = []
        for (name, team, season), stats in self.season_stats.items():
            position = self._infer_position(name, team)

            entry = {
                'playerId': _make_id(name, team),
                'player': name,  # matches CachedPlayerSeasonStats.player
                'team': team,
                'conference': '',  # filled in by main script from teams data
                'season': season,
                'category': position,  # position serves as category
            }

            # Flat passing fields
            if stats['pass_att'] > 0:
                entry['passingYards'] = stats['pass_yds']
                entry['passingTDs'] = stats['pass_td']
                entry['interceptions'] = stats['pass_int']
                entry['completions'] = stats['pass_comp']
                entry['attempts'] = stats['pass_att']

            # Flat rushing fields
            if stats['rush_att'] > 0:
                entry['rushingYards'] = stats['rush_yds']
                entry['rushingTDs'] = stats['rush_td']
                entry['carries'] = stats['rush_att']

            # Flat receiving fields
            if stats['receptions'] > 0:
                entry['receptions'] = stats['receptions']
                entry['receivingYards'] = stats['rec_yds']
                entry['receivingTDs'] = stats['rec_td']

            # Flat defensive fields
            if stats['sacks_recorded'] > 0 or stats['interceptions_recorded'] > 0:
                entry['sacks'] = stats['sacks_recorded']
                entry['defensiveInterceptions'] = stats['interceptions_recorded']
                entry['forcedFumbles'] = 0
                entry['tackles'] = 0
                entry['passesDefended'] = 0

            results.append(entry)

        return sorted(results, key=lambda r: (r['season'], r['team'], r['player']))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && python -m pytest scripts/pbp_parser/test_aggregator.py -v`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/pbp_parser/aggregator.py scripts/pbp_parser/test_aggregator.py
git commit -m "feat: add player stats aggregator for play-by-play data

Accumulates per-play extractions into season stats per player.
Infers position from play type usage patterns.
Exports in CachedPlayer and CachedPlayerSeasonStats format."
```

---

### Task 5: Play-by-Play Main Script

**Files:**
- Create: `scripts/build-player-stats.py`

The main script that orchestrates: read CSVs → extract names → aggregate → validate → output JSON.

- [ ] **Step 1: Implement the main script**

```python
#!/usr/bin/env python3
"""
Build player stats from CFBD play-by-play data.

Reads play-by-play CSVs from starter_pack/data/plays/, parses playText
for player names, aggregates stats using structured columns, and outputs
players.json + player-stats.json to src/data/.

Usage: python scripts/build-player-stats.py [--legends]
"""
import csv
import json
import os
import sys
import time
from collections import defaultdict

# Add scripts dir to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from pbp_parser.name_extractor import extract_players
from pbp_parser.aggregator import PlayerAggregator

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAYS_DIR = os.path.join(PROJECT_ROOT, 'starter_pack', 'data', 'plays')
TEAMS_CSV = os.path.join(PROJECT_ROOT, 'starter_pack', 'data', 'teams.csv')
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'src', 'data')
LEGENDS_CONFIG = os.path.join(PROJECT_ROOT, 'scripts', 'legends-config.json')

CORE_YEARS = range(2014, 2025)  # 2014-2024


def load_team_conferences() -> dict:
    """Load team -> conference mapping from teams.csv."""
    conferences = {}
    try:
        with open(TEAMS_CSV, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                conferences[row['school']] = row.get('conference', '')
    except FileNotFoundError:
        print("Warning: teams.csv not found, conferences will be empty")
    return conferences


def load_legends_config() -> list:
    """Load legends config for pre-2014 team-seasons to include."""
    try:
        with open(LEGENDS_CONFIG, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: legends-config.json not found, skipping legends")
        return []


def get_play_files(year: int) -> list:
    """Get all play CSV files for a given year, sorted."""
    year_dir = os.path.join(PLAYS_DIR, str(year))
    if not os.path.isdir(year_dir):
        return []
    return sorted([
        os.path.join(year_dir, f)
        for f in os.listdir(year_dir)
        if f.endswith('.csv')
    ])


def parse_float(val: str) -> float:
    try:
        v = float(val)
        return v if v == v else 0.0  # NaN check
    except (ValueError, TypeError):
        return 0.0


def process_plays(aggregator: PlayerAggregator, years: range,
                  legends: list = None, legend_teams: dict = None):
    """Process all play-by-play CSVs for the given years."""
    total_plays = 0
    parsed_plays = 0
    skipped_types = defaultdict(int)
    failed_parses = []

    for year in years:
        files = get_play_files(year)
        if not files:
            print(f"  {year}: no files found")
            continue

        year_plays = 0
        year_parsed = 0

        for filepath in files:
            with open(filepath, encoding='utf-8', errors='replace') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    total_plays += 1
                    year_plays += 1

                    play_type = row.get('playType', '')
                    play_text = row.get('playText', '')
                    offense = row.get('offense', '')
                    defense = row.get('defense', '')
                    game_id = row.get('gameId', '')
                    yards_gained = parse_float(row.get('yardsGained', '0'))
                    scoring = row.get('scoring', '').lower() == 'true'
                    ppa = parse_float(row.get('ppa', '0'))

                    # For legends mode, filter to only configured teams
                    if legend_teams and offense not in legend_teams.get(year, set()):
                        # Still process defensive plays where legend team is on defense
                        if defense not in legend_teams.get(year, set()):
                            continue

                    # Extract player names from playText
                    players = extract_players(play_type, play_text)

                    if not players:
                        if play_type in ('Rush', 'Rushing Touchdown', 'Pass Reception',
                                        'Passing Touchdown', 'Pass Incompletion', 'Sack',
                                        'Interception', 'Field Goal Good', 'Field Goal Missed'):
                            if len(failed_parses) < 100:
                                failed_parses.append({
                                    'year': year, 'type': play_type,
                                    'text': play_text[:150]
                                })
                        skipped_types[play_type] += 1
                        continue

                    parsed_plays += 1
                    year_parsed += 1

                    # Record offensive players under offense team
                    off_players = {k: v for k, v in players.items()
                                   if k in ('rusher', 'passer', 'receiver', 'kicker',
                                           'fumbler', 'returner', 'qb')}
                    if off_players:
                        aggregator.record_play(
                            season=year, game_id=game_id, team=offense,
                            play_type=play_type, players=off_players,
                            yards_gained=yards_gained, scoring=scoring, ppa=ppa
                        )

                    # Record defensive players under defense team
                    def_players = {k: v for k, v in players.items()
                                   if k == 'defender'}
                    if def_players:
                        aggregator.record_play(
                            season=year, game_id=game_id, team=defense,
                            play_type=play_type, players=def_players,
                            yards_gained=yards_gained, scoring=scoring, ppa=ppa
                        )

        print(f"  {year}: {year_plays:,} plays, {year_parsed:,} parsed ({year_parsed/max(year_plays,1)*100:.1f}%)")

    return total_plays, parsed_plays, skipped_types, failed_parses


def print_quality_report(total: int, parsed: int, skipped: dict,
                         failed: list, aggregator: PlayerAggregator):
    """Print validation and quality metrics."""
    print(f"\n{'=' * 60}")
    print("QUALITY REPORT")
    print(f"{'=' * 60}")
    print(f"Total plays: {total:,}")
    print(f"Parsed plays: {parsed:,} ({parsed/max(total,1)*100:.1f}%)")

    print(f"\nSkipped play types:")
    for pt, count in sorted(skipped.items(), key=lambda x: -x[1]):
        print(f"  {pt}: {count:,}")

    if failed:
        print(f"\nSample unparseable plays (showing up to 20):")
        for fp in failed[:20]:
            print(f"  [{fp['year']}] {fp['type']}: {fp['text']}")

    # Stat sanity checks
    print(f"\nTop 5 QBs by passing yards (each season, 2023):")
    qb_stats = []
    for (name, team, season), stats in aggregator.season_stats.items():
        if season == 2023 and stats['pass_att'] >= 50:
            qb_stats.append((name, team, stats['pass_yds'], stats['pass_td'], stats['pass_int']))
    for name, team, yds, td, ints in sorted(qb_stats, key=lambda x: -x[2])[:5]:
        print(f"  {name} ({team}): {yds:,} yds, {td} TD, {ints} INT")

    print(f"\nTop 5 RBs by rushing yards (2023):")
    rb_stats = []
    for (name, team, season), stats in aggregator.season_stats.items():
        if season == 2023 and stats['rush_att'] >= 20 and stats['_pass_plays'] < 5:
            rb_stats.append((name, team, stats['rush_yds'], stats['rush_td']))
    for name, team, yds, td in sorted(rb_stats, key=lambda x: -x[2])[:5]:
        print(f"  {name} ({team}): {yds:,} yds, {td} TD")

    players = aggregator.export_players()
    player_stats = aggregator.export_player_stats()
    print(f"\nTotal unique players: {len(players):,}")
    print(f"Total player-seasons: {len(player_stats):,}")


def main():
    start_time = time.time()
    include_legends = '--legends' in sys.argv

    print("Building player stats from play-by-play data...")
    print(f"Core years: {CORE_YEARS.start}-{CORE_YEARS.stop - 1}")

    aggregator = PlayerAggregator()
    conferences = load_team_conferences()

    # Process core years (2014-2024)
    print(f"\nProcessing core years:")
    total, parsed, skipped, failed = process_plays(aggregator, CORE_YEARS)

    # Process legends if requested
    if include_legends:
        legends = load_legends_config()
        if legends:
            legend_teams = defaultdict(set)
            for entry in legends:
                legend_teams[entry['season']].add(entry['team'])
            legend_years = range(
                min(e['season'] for e in legends),
                max(e['season'] for e in legends) + 1
            )
            print(f"\nProcessing legends ({len(legends)} team-seasons):")
            lt, lp, ls, lf = process_plays(
                aggregator, legend_years,
                legends=legends, legend_teams=dict(legend_teams)
            )
            total += lt
            parsed += lp
            for k, v in ls.items():
                skipped[k] += v
            failed.extend(lf)

    # Print quality report
    print_quality_report(total, parsed, skipped, failed, aggregator)

    # Fill in conferences
    player_stats = aggregator.export_player_stats()
    for ps in player_stats:
        ps['conference'] = conferences.get(ps['team'], '')

    players = aggregator.export_players()

    # Write output files
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    players_path = os.path.join(OUTPUT_DIR, 'players.json')
    with open(players_path, 'w', encoding='utf-8') as f:
        json.dump(players, f, indent=2)
    print(f"\nWrote {players_path} ({len(players):,} players, {os.path.getsize(players_path)/1024:.0f} KB)")

    stats_path = os.path.join(OUTPUT_DIR, 'player-stats.json')
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(player_stats, f, indent=2)
    print(f"Wrote {stats_path} ({len(player_stats):,} entries, {os.path.getsize(stats_path)/1024:.0f} KB)")

    elapsed = time.time() - start_time
    print(f"\nDone in {elapsed:.1f}s")


if __name__ == '__main__':
    main()
```

- [ ] **Step 2: Run the script on a small test (single year)**

Temporarily modify `CORE_YEARS = range(2023, 2024)` or add a `--year 2023` flag to test with one year first. Verify output looks reasonable.

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && python scripts/build-player-stats.py`
Expected: Quality report showing ~250K plays processed, reasonable parse rate (>80%), sensible top QBs/RBs for 2023.

- [ ] **Step 3: Run full 2014-2024 parse**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && python scripts/build-player-stats.py --legends`
Expected: ~2M plays processed. `src/data/players.json` and `src/data/player-stats.json` created with real data.

- [ ] **Step 4: Spot-check output**

Verify known players appear with reasonable stats:
- 2023 LSU QB Jayden Daniels should have ~3800 pass yards, ~40 TDs
- 2023 Michigan RB Blake Corum should have ~1000+ rush yards
- Legends: 2010 Cam Newton should have huge rushing + passing numbers

- [ ] **Step 5: Commit**

```bash
git add scripts/build-player-stats.py
git commit -m "feat: add main play-by-play parser script

Orchestrates PBP parsing across 2014-2024 + optional legends.
Outputs players.json and player-stats.json with real derived stats.
Includes quality report with sanity checks."
```

---

## Chunk 2: Team Data ETL

This chunk builds the TypeScript script that processes team-level CSVs into app JSON files.

### Task 6: Install csv-parse Dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install csv-parse**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && npm install csv-parse --save-dev`
Expected: `csv-parse` added to devDependencies

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add csv-parse for build-time data processing"
```

---

### Task 7: Team Data ETL Script — Teams & Games

**Files:**
- Create: `scripts/build-data.ts`

This script processes teams.csv, conferences.csv, and games.csv.

- [ ] **Step 1: Implement the teams + games ETL**

```typescript
// scripts/build-data.ts
/**
 * Build-time ETL: Process starter_pack CSVs into app JSON files.
 *
 * Reads: starter_pack/data/ CSVs
 * Writes: src/data/ JSON files (teams.json, games.json, team-stats.json,
 *         advanced-stats.json, drive-stats.json)
 *
 * Usage: npx tsx scripts/build-data.ts
 */
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STARTER_PACK = path.join(PROJECT_ROOT, 'starter_pack', 'data');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'data');

const CORE_YEAR_START = 2014;
const CORE_YEAR_END = 2024;

function readCsv(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });
}

function writeJson(filename: string, data: unknown): void {
  const filePath = path.join(OUTPUT_DIR, filename);
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, json, 'utf-8');
  const sizeKb = (Buffer.byteLength(json) / 1024).toFixed(0);
  console.log(`  Wrote ${filename} (${Array.isArray(data) ? data.length : '?'} entries, ${sizeKb} KB)`);
}

// ─── Teams ─────────────────────────────────────────────────────────
function buildTeams(): void {
  console.log('Building teams.json...');
  const rows = readCsv(path.join(STARTER_PACK, 'teams.csv'));

  const teams = rows
    .filter(r => r.classification === 'fbs')
    .map(r => ({
      id: parseInt(r.id, 10),
      school: r.school || '',
      mascot: r.mascot || r.nickname || '',
      abbreviation: r.abbreviation || '',
      conference: r.conference || '',
      color: '',      // Not in starter_pack CSV
      altColor: '',
      logos: [],
    }));

  writeJson('teams.json', teams);
}

// ─── Games ─────────────────────────────────────────────────────────
function buildGames(): void {
  console.log('Building games.json...');
  const rows = readCsv(path.join(STARTER_PACK, 'games.csv'));

  const games = rows
    .filter(r => {
      const season = parseInt(r.season, 10);
      return season >= CORE_YEAR_START && season <= CORE_YEAR_END;
    })
    .filter(r => r.status === 'completed')
    .map(r => ({
      id: parseInt(r.id, 10),
      season: parseInt(r.season, 10),
      week: parseInt(r.week, 10),
      seasonType: r.season_type || 'regular',
      homeTeam: r.home_team || '',
      homeConference: r.home_conference || '',
      homePoints: parseInt(r.home_points, 10) || 0,
      awayTeam: r.away_team || '',
      awayConference: r.away_conference || '',
      awayPoints: parseInt(r.away_points, 10) || 0,
      venue: '', // venue_id available but not venue name in games.csv
      completed: true,
      excitement: parseFloat(r.excitement) || 0,
      homeElo: parseInt(r.home_start_elo, 10) || 0,
      awayElo: parseInt(r.away_start_elo, 10) || 0,
    }));

  writeJson('games.json', games);
}

// ─── Team Stats ────────────────────────────────────────────────────
function buildTeamStats(): void {
  console.log('Building team-stats.json...');

  // First, compute W/L and points from games.csv
  const gameRows = readCsv(path.join(STARTER_PACK, 'games.csv'));
  const teamRecords: Record<string, {
    season: number; team: string; conference: string;
    wins: number; losses: number; pointsFor: number; pointsAgainst: number;
    gamesPlayed: number;
  }> = {};

  for (const r of gameRows) {
    const season = parseInt(r.season, 10);
    if (season < CORE_YEAR_START || season > CORE_YEAR_END) continue;
    if (r.status !== 'completed') continue;

    const homePoints = parseInt(r.home_points, 10) || 0;
    const awayPoints = parseInt(r.away_points, 10) || 0;

    // Home team
    const hKey = `${r.home_team}:${season}`;
    if (!teamRecords[hKey]) {
      teamRecords[hKey] = {
        season, team: r.home_team, conference: r.home_conference || '',
        wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, gamesPlayed: 0,
      };
    }
    teamRecords[hKey].gamesPlayed++;
    teamRecords[hKey].pointsFor += homePoints;
    teamRecords[hKey].pointsAgainst += awayPoints;
    if (homePoints > awayPoints) teamRecords[hKey].wins++;
    else teamRecords[hKey].losses++;

    // Away team
    const aKey = `${r.away_team}:${season}`;
    if (!teamRecords[aKey]) {
      teamRecords[aKey] = {
        season, team: r.away_team, conference: r.away_conference || '',
        wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, gamesPlayed: 0,
      };
    }
    teamRecords[aKey].gamesPlayed++;
    teamRecords[aKey].pointsFor += awayPoints;
    teamRecords[aKey].pointsAgainst += homePoints;
    if (awayPoints > homePoints) teamRecords[aKey].wins++;
    else teamRecords[aKey].losses++;
  }

  // Now merge with season_stats CSVs
  const teamStats: Record<string, unknown>[] = [];

  for (let year = CORE_YEAR_START; year <= CORE_YEAR_END; year++) {
    const ssPath = path.join(STARTER_PACK, 'season_stats', `${year}.csv`);
    if (!fs.existsSync(ssPath)) continue;

    const rows = readCsv(ssPath);
    for (const r of rows) {
      const key = `${r.team}:${year}`;
      const record = teamRecords[key];

      const gamesPlayed = record?.gamesPlayed || parseInt(r.games, 10) || 0;
      const thirdDownConv = parseInt(r.thirdDownConversions, 10) || 0;
      const thirdDowns = parseInt(r.thirdDowns, 10) || 0;
      const fourthDownConv = parseInt(r.fourthDownConversions, 10) || 0;
      const fourthDowns = parseInt(r.fourthDowns, 10) || 0;
      const totalYards = parseInt(r.totalYards, 10) || 0;

      teamStats.push({
        team: r.team,
        conference: r.conference || record?.conference || '',
        season: year,
        gamesPlayed,
        wins: record?.wins || 0,
        losses: record?.losses || 0,
        pointsFor: record?.pointsFor || 0,
        pointsAgainst: record?.pointsAgainst || 0,
        totalYards,
        totalYardsPerGame: gamesPlayed ? Math.round(totalYards / gamesPlayed) : 0,
        passingYards: parseInt(r.netPassingYards, 10) || 0,
        rushingYards: parseInt(r.rushingYards, 10) || 0,
        turnoversGained: parseInt(r.turnoversOpponent, 10) || 0,
        turnoversLost: parseInt(r.turnovers, 10) || 0,
        firstDowns: parseInt(r.firstDowns, 10) || 0,
        thirdDownConvPct: thirdDowns > 0 ? Math.round(thirdDownConv / thirdDowns * 1000) / 10 : 0,
        fourthDownConvPct: fourthDowns > 0 ? Math.round(fourthDownConv / fourthDowns * 1000) / 10 : 0,
        redZonePct: 0,  // Not in season_stats; available in advanced-stats
        timeOfPossession: r.possessionTime || '',
        penaltyYards: parseInt(r.penaltyYards, 10) || 0,
      });
    }
  }

  writeJson('team-stats.json', teamStats);
}

// ─── Advanced Stats ────────────────────────────────────────────────
function buildAdvancedStats(): void {
  console.log('Building advanced-stats.json...');
  const allStats: Record<string, unknown>[] = [];

  for (let year = CORE_YEAR_START; year <= CORE_YEAR_END; year++) {
    const asPath = path.join(STARTER_PACK, 'advanced_season_stats', `${year}.csv`);
    if (!fs.existsSync(asPath)) continue;

    const rows = readCsv(asPath);
    for (const r of rows) {
      allStats.push({
        team: r.team,
        conference: r.conference || '',
        season: year,
        offense: {
          epa: parseFloat(r.offense_ppa) || 0,
          rushingEpa: parseFloat(r.offense_rushingPlays_ppa) || 0,
          passingEpa: parseFloat(r.offense_passingPlays_ppa) || 0,
          successRate: parseFloat(r.offense_successRate) || 0,
          explosiveness: parseFloat(r.offense_explosiveness) || 0,
          rushExplosiveness: parseFloat(r.offense_rushingPlays_explosiveness) || 0,
          passExplosiveness: parseFloat(r.offense_passingPlays_explosiveness) || 0,
          standardDownSuccess: parseFloat(r.offense_standardDowns_successRate) || 0,
          passingDownSuccess: parseFloat(r.offense_passingDowns_successRate) || 0,
          lineYards: parseFloat(r.offense_lineYards) || 0,
          secondLevelYards: parseFloat(r.offense_secondLevelYards) || 0,
          openFieldYards: parseFloat(r.offense_openFieldYards) || 0,
          pointsPerOpportunity: parseFloat(r.offense_pointsPerOpportunity) || 0,
          avgStartPosition: parseFloat(r.offense_fieldPosition_averageStart) || 0,
          havoc: {
            total: parseFloat(r.offense_havoc_total) || 0,
            frontSeven: parseFloat(r.offense_havoc_frontSeven) || 0,
            db: parseFloat(r.offense_havoc_db) || 0,
          },
        },
        defense: {
          epa: parseFloat(r.defense_ppa) || 0,
          rushingEpa: parseFloat(r.defense_rushingPlays_ppa) || 0,
          passingEpa: parseFloat(r.defense_passingPlays_ppa) || 0,
          successRate: parseFloat(r.defense_successRate) || 0,
          explosiveness: parseFloat(r.defense_explosiveness) || 0,
          rushExplosiveness: parseFloat(r.defense_rushingPlays_explosiveness) || 0,
          passExplosiveness: parseFloat(r.defense_passingPlays_explosiveness) || 0,
          standardDownSuccess: parseFloat(r.defense_standardDowns_successRate) || 0,
          passingDownSuccess: parseFloat(r.defense_passingDowns_successRate) || 0,
          lineYards: parseFloat(r.defense_lineYards) || 0,
          secondLevelYards: parseFloat(r.defense_secondLevelYards) || 0,
          openFieldYards: parseFloat(r.defense_openFieldYards) || 0,
          pointsPerOpportunity: parseFloat(r.defense_pointsPerOpportunity) || 0,
          avgStartPosition: parseFloat(r.defense_fieldPosition_averageStart) || 0,
          havoc: {
            total: parseFloat(r.defense_havoc_total) || 0,
            frontSeven: parseFloat(r.defense_havoc_frontSeven) || 0,
            db: parseFloat(r.defense_havoc_db) || 0,
          },
        },
      });
    }
  }

  writeJson('advanced-stats.json', allStats);
}

// ─── Drive Stats ───────────────────────────────────────────────────
function buildDriveStats(): void {
  console.log('Building drive-stats.json...');
  // Aggregate drives per team per season
  const teamDrives: Record<string, {
    team: string; conference: string; season: number;
    totalDrives: number; scoringDrives: number;
    totalYards: number; totalPlays: number;
    turnovers: number; threeAndOuts: number;
    startPositionSum: number;
  }> = {};

  for (let year = CORE_YEAR_START; year <= CORE_YEAR_END; year++) {
    // Drives files use format drives_YYYY.csv
    const dPath = path.join(STARTER_PACK, 'drives', `drives_${year}.csv`);
    if (!fs.existsSync(dPath)) continue;

    const rows = readCsv(dPath);
    for (const r of rows) {
      const team = r.offense || '';
      const conf = r.offenseConference || '';
      const key = `${team}:${year}`;

      if (!teamDrives[key]) {
        teamDrives[key] = {
          team, conference: conf, season: year,
          totalDrives: 0, scoringDrives: 0,
          totalYards: 0, totalPlays: 0,
          turnovers: 0, threeAndOuts: 0,
          startPositionSum: 0,
        };
      }

      const d = teamDrives[key];
      d.totalDrives++;

      const scoring = r.scoring?.toLowerCase() === 'true';
      if (scoring) d.scoringDrives++;

      d.totalYards += parseInt(r.yards, 10) || 0;
      d.totalPlays += parseInt(r.plays, 10) || 0;

      const result = (r.driveResult || '').toUpperCase();
      if (result.includes('TURNOVER') || result.includes('INT') ||
          result.includes('FUMBLE') || result === 'INTERCEPTION') {
        d.turnovers++;
      }
      if ((parseInt(r.plays, 10) || 0) <= 3 && !scoring) {
        d.threeAndOuts++;
      }

      d.startPositionSum += parseInt(r.startYardsToGoal, 10) || 0;
    }
  }

  const driveStats = Object.values(teamDrives).map(d => ({
    team: d.team,
    conference: d.conference,
    season: d.season,
    totalDrives: d.totalDrives,
    scoringDrives: d.scoringDrives,
    scoringPct: d.totalDrives > 0 ? Math.round(d.scoringDrives / d.totalDrives * 1000) / 10 : 0,
    avgYardsPerDrive: d.totalDrives > 0 ? Math.round(d.totalYards / d.totalDrives * 10) / 10 : 0,
    avgPlaysPerDrive: d.totalDrives > 0 ? Math.round(d.totalPlays / d.totalDrives * 10) / 10 : 0,
    avgStartPosition: d.totalDrives > 0 ? Math.round(d.startPositionSum / d.totalDrives * 10) / 10 : 0,
    turnoversPerDrive: d.totalDrives > 0 ? Math.round(d.turnovers / d.totalDrives * 1000) / 1000 : 0,
    threeAndOutPct: d.totalDrives > 0 ? Math.round(d.threeAndOuts / d.totalDrives * 1000) / 10 : 0,
  }));

  writeJson('drive-stats.json', driveStats.sort((a, b) =>
    a.season - b.season || a.team.localeCompare(b.team)
  ));
}

// ─── Main ──────────────────────────────────────────────────────────
function main(): void {
  console.log('Building team data from starter_pack CSVs...');
  console.log(`Year range: ${CORE_YEAR_START}-${CORE_YEAR_END}\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  buildTeams();
  buildGames();
  buildTeamStats();
  buildAdvancedStats();
  buildDriveStats();

  console.log('\nDone!');
}

main();
```

- [ ] **Step 2: Run the ETL script**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && npx tsx scripts/build-data.ts`
Expected: 5 JSON files created in `src/data/` with logged sizes. Games should have ~25K entries, teams ~130+.

- [ ] **Step 3: Spot-check output**

Verify:
- `teams.json` has all FBS teams (130+)
- `games.json` has games from 2014-2024 with Elo ratings
- `team-stats.json` has reasonable W/L records and stats
- `advanced-stats.json` has EPA/PPA values between -0.5 and 0.5 (typical range)
- `drive-stats.json` has drive efficiency metrics

- [ ] **Step 4: Commit**

```bash
git add scripts/build-data.ts
git commit -m "feat: add team data ETL script

Processes starter_pack CSVs into app JSON files:
- teams.json from teams.csv + conferences.csv
- games.json from games.csv (2014-2024, with Elo)
- team-stats.json from season_stats + games.csv (joined for W/L)
- advanced-stats.json from advanced_season_stats
- drive-stats.json from drives (aggregated per team per season)"
```

---

### Task 8: Add npm build:data Script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add build:data script**

Add to the `"scripts"` section of `package.json`:
```json
"build:data": "python scripts/build-player-stats.py --legends && npx tsx scripts/build-data.ts"
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add build:data npm script for ETL pipeline"
```

---

## Chunk 3: Cache Layer & Type Updates

This chunk updates the in-memory cache to load the new/expanded JSON files and adds TypeScript interfaces for new data types.

### Task 9: Add New TypeScript Interfaces

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add CachedAdvancedStats and CachedDriveEfficiency interfaces**

Add at the end of `src/types/index.ts` (before any closing braces):

```typescript
// ─── Advanced Stats (from advanced_season_stats CSVs) ──────────────
export interface CachedAdvancedStats {
  team: string;
  conference: string;
  season: number;
  offense: {
    epa: number;
    rushingEpa: number;
    passingEpa: number;
    successRate: number;
    explosiveness: number;
    rushExplosiveness: number;
    passExplosiveness: number;
    standardDownSuccess: number;
    passingDownSuccess: number;
    lineYards: number;
    secondLevelYards: number;
    openFieldYards: number;
    pointsPerOpportunity: number;
    avgStartPosition: number;
    havoc: { total: number; frontSeven: number; db: number };
  };
  defense: {
    epa: number;
    rushingEpa: number;
    passingEpa: number;
    successRate: number;
    explosiveness: number;
    rushExplosiveness: number;
    passExplosiveness: number;
    standardDownSuccess: number;
    passingDownSuccess: number;
    lineYards: number;
    secondLevelYards: number;
    openFieldYards: number;
    pointsPerOpportunity: number;
    avgStartPosition: number;
    havoc: { total: number; frontSeven: number; db: number };
  };
}

// ─── Drive Efficiency (aggregated from drives CSVs) ────────────────
export interface CachedDriveEfficiency {
  team: string;
  conference: string;
  season: number;
  totalDrives: number;
  scoringDrives: number;
  scoringPct: number;
  avgYardsPerDrive: number;
  avgPlaysPerDrive: number;
  avgStartPosition: number;
  turnoversPerDrive: number;
  threeAndOutPct: number;
}
```

- [ ] **Step 2: Add homeElo and awayElo to CachedGame**

Find the `CachedGame` interface in `cfbd-cache.ts` and add `homeElo` and `awayElo` fields:

```typescript
homeElo?: number;
awayElo?: number;
```

- [ ] **Step 3: Run typecheck**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && npx tsc --noEmit`
Expected: No new type errors

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/services/data/cfbd-cache.ts
git commit -m "feat: add TypeScript interfaces for advanced stats and drive efficiency"
```

---

### Task 10: Update Cache Layer

**Files:**
- Modify: `src/services/data/cfbd-cache.ts`

- [ ] **Step 1: Add new data arrays and load calls**

Add after the existing module-level arrays (around line 20-30 in cfbd-cache.ts):

```typescript
let advancedStats: CachedAdvancedStats[] = [];
let driveStats: CachedDriveEfficiency[] = [];
```

Import the new types at the top of the file.

In `initializeDataCache()`, add loads for the new files:

```typescript
try {
  advancedStats = require('../../data/advanced-stats.json') as CachedAdvancedStats[];
} catch { advancedStats = []; }

try {
  driveStats = require('../../data/drive-stats.json') as CachedDriveEfficiency[];
} catch { driveStats = []; }
```

Update the console.log in `initializeDataCache` to include new counts:
```typescript
console.log(`[DataCache] Loaded: ... ${advancedStats.length} advanced stat entries, ${driveStats.length} drive stat entries`);
```

- [ ] **Step 2: Add getter functions**

Add after the existing getter functions:

```typescript
// ─── Advanced Stats ────────────────────────────────────────────────
export function getAdvancedStats(): CachedAdvancedStats[] {
  return advancedStats;
}

export function getAdvancedStatsByTeam(team: string, season?: number): CachedAdvancedStats[] {
  return advancedStats.filter(s =>
    s.team.toLowerCase() === team.toLowerCase() &&
    (season === undefined || s.season === season)
  );
}

export function getAdvancedStatsByConference(conference: string, season: number): CachedAdvancedStats[] {
  return advancedStats.filter(s =>
    s.conference.toLowerCase() === conference.toLowerCase() &&
    s.season === season
  );
}

// ─── Drive Efficiency ──────────────────────────────────────────────
export function getDriveEfficiency(): CachedDriveEfficiency[] {
  return driveStats;
}

export function getDriveEfficiencyByTeam(team: string, season?: number): CachedDriveEfficiency[] {
  return driveStats.filter(s =>
    s.team.toLowerCase() === team.toLowerCase() &&
    (season === undefined || s.season === season)
  );
}
```

- [ ] **Step 3: Update getCacheStats()**

Add the new counts to the `getCacheStats()` function return object:

```typescript
advancedStats: advancedStats.length,
driveStats: driveStats.length,
```

- [ ] **Step 4: Run typecheck**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Run existing tests**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && npm test`
Expected: All existing tests pass (no breaking changes)

- [ ] **Step 6: Commit**

```bash
git add src/services/data/cfbd-cache.ts
git commit -m "feat: extend cache layer with advanced stats and drive efficiency

Loads advanced-stats.json and drive-stats.json at startup.
New getters: getAdvancedStats, getAdvancedStatsByTeam,
getAdvancedStatsByConference, getDriveEfficiency, getDriveEfficiencyByTeam."
```

---

## Chunk 4: ML Model Server Integration

This chunk adds server-side ML prediction using the pre-trained models from model_pack.

### Task 11: Copy Models & Training Data to Server

**Files:**
- Create: `server/ml/models/` directory
- Create: `server/data/` directory

- [ ] **Step 1: Copy model files and training data**

```bash
mkdir -p C:/Users/Ryan.younggreen/Desktop/CFBMoney/server/ml/models
mkdir -p C:/Users/Ryan.younggreen/Desktop/CFBMoney/server/data

cp C:/Users/Ryan.younggreen/Desktop/CFBMoney/model_pack/xgb_home_win_model.pkl C:/Users/Ryan.younggreen/Desktop/CFBMoney/server/ml/models/
cp C:/Users/Ryan.younggreen/Desktop/CFBMoney/model_pack/ridge_model.joblib C:/Users/Ryan.younggreen/Desktop/CFBMoney/server/ml/models/
cp C:/Users/Ryan.younggreen/Desktop/CFBMoney/model_pack/fastai_home_win_model.pkl C:/Users/Ryan.younggreen/Desktop/CFBMoney/server/ml/models/
cp C:/Users/Ryan.younggreen/Desktop/CFBMoney/model_pack/training_data.csv C:/Users/Ryan.younggreen/Desktop/CFBMoney/server/data/
```

- [ ] **Step 2: Add server/ml/models/ and server/data/ to .gitignore**

These are large binary/data files that shouldn't be in git. Add:

```
# ML models and training data (large files)
server/ml/models/
server/data/training_data.csv
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add gitignore entries for ML model files and training data"
```

---

### Task 12: Python Prediction Service

**Files:**
- Create: `server/ml/predict.py`
- Create: `server/ml/requirements.txt`

- [ ] **Step 1: Create requirements.txt**

```
pandas>=2.0.0
scikit-learn>=1.3.0
xgboost>=2.0.0
joblib>=1.3.0
```

- [ ] **Step 2: Implement the prediction service**

```python
#!/usr/bin/env python3
"""
ML Prediction Service for GridIron IQ.

Long-running subprocess that communicates via stdin/stdout JSON lines.
Loads pre-trained models once at startup, then accepts prediction requests.

Protocol:
  Input (stdin):  {"home_team": "Alabama", "away_team": "Georgia", "season": 2024, "week": 10}
  Output (stdout): {"win_prob": 0.62, "spread": -3.5, "confidence": 0.78, "status": "ok"}

Special commands:
  {"command": "health"} -> {"status": "ok", "models_loaded": true}
  {"command": "shutdown"} -> exits
"""
import json
import os
import sys
import warnings

import joblib
import pandas as pd
import numpy as np

warnings.filterwarnings('ignore')

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

# Feature columns from training_data.csv (in order)
# These are the 81 usable features — excludes metadata columns
METADATA_COLS = [
    'id', 'start_date', 'season', 'season_type', 'week', 'neutral_site',
    'home_team', 'home_conference', 'home_elo', 'home_talent',
    'away_team', 'away_conference', 'away_talent', 'away_elo',
    'home_points', 'away_points', 'margin', 'spread',
]


class PredictionService:
    def __init__(self):
        self.xgb_model = None
        self.ridge_model = None
        self.training_data = None
        self.feature_cols = None

    def load_models(self):
        """Load pre-trained models and training data."""
        try:
            xgb_path = os.path.join(MODELS_DIR, 'xgb_home_win_model.pkl')
            self.xgb_model = joblib.load(xgb_path)
            log(f"Loaded XGBoost model from {xgb_path}")
        except Exception as e:
            log(f"Warning: Could not load XGBoost model: {e}")

        try:
            ridge_path = os.path.join(MODELS_DIR, 'ridge_model.joblib')
            self.ridge_model = joblib.load(ridge_path)
            log(f"Loaded Ridge model from {ridge_path}")
        except Exception as e:
            log(f"Warning: Could not load Ridge model: {e}")

        try:
            data_path = os.path.join(DATA_DIR, 'training_data.csv')
            self.training_data = pd.read_csv(data_path)
            # Identify feature columns (everything not in metadata)
            self.feature_cols = [
                c for c in self.training_data.columns
                if c not in METADATA_COLS
            ]
            log(f"Loaded training data: {len(self.training_data)} rows, {len(self.feature_cols)} features")
        except Exception as e:
            log(f"Warning: Could not load training data: {e}")

    def get_team_features(self, team: str, season: int = None) -> dict:
        """
        Get the most recent feature values for a team.
        Searches training_data for the team's most recent appearance
        and extracts their feature columns.
        """
        if self.training_data is None:
            return {}

        df = self.training_data

        # Find rows where team appears as home or away
        home_mask = df['home_team'] == team
        away_mask = df['away_team'] == team

        if season:
            home_mask = home_mask & (df['season'] == season)
            away_mask = away_mask & (df['season'] == season)

        # Get the most recent row for each side
        home_rows = df[home_mask].sort_values('start_date', ascending=False)
        away_rows = df[away_mask].sort_values('start_date', ascending=False)

        features = {}

        if not home_rows.empty:
            row = home_rows.iloc[0]
            for col in self.feature_cols:
                if col.startswith('home_'):
                    features[col] = float(row[col]) if pd.notna(row[col]) else 0.0
        elif not away_rows.empty:
            # Mirror: away columns → home columns
            row = away_rows.iloc[0]
            for col in self.feature_cols:
                if col.startswith('away_'):
                    home_col = col.replace('away_', 'home_', 1)
                    features[home_col] = float(row[col]) if pd.notna(row[col]) else 0.0

        return features

    def predict(self, home_team: str, away_team: str,
                season: int = 2024, week: int = None) -> dict:
        """Generate prediction for a matchup."""
        # Get features for both teams
        home_features = self.get_team_features(home_team, season)
        away_features_raw = self.get_team_features(away_team, season)

        # Convert away team features to away_ prefix
        away_features = {}
        for col, val in away_features_raw.items():
            if col.startswith('home_'):
                away_col = col.replace('home_', 'away_', 1)
                away_features[away_col] = val

        if not home_features or not away_features:
            return {
                'status': 'error',
                'error': f'No feature data found for {home_team if not home_features else away_team}',
            }

        # Build feature vector in correct column order
        feature_vector = []
        for col in self.feature_cols:
            if col.startswith('home_'):
                feature_vector.append(home_features.get(col, 0.0))
            elif col.startswith('away_'):
                feature_vector.append(away_features.get(col, 0.0))
            else:
                feature_vector.append(0.0)

        features_df = pd.DataFrame([feature_vector], columns=self.feature_cols)

        result = {'status': 'ok'}

        # XGBoost win probability
        if self.xgb_model is not None:
            try:
                win_prob = float(self.xgb_model.predict_proba(features_df)[0][1])
                result['win_prob'] = round(win_prob, 4)
                result['confidence'] = round(abs(win_prob - 0.5) * 2, 4)
            except Exception as e:
                result['win_prob_error'] = str(e)

        # Ridge spread prediction
        if self.ridge_model is not None:
            try:
                spread = float(self.ridge_model.predict(features_df)[0])
                result['spread'] = round(spread * 2) / 2  # Round to nearest 0.5
            except Exception as e:
                result['spread_error'] = str(e)

        return result


def log(msg: str):
    """Log to stderr so it doesn't interfere with JSON protocol on stdout."""
    print(f"[predict.py] {msg}", file=sys.stderr, flush=True)


def main():
    service = PredictionService()
    log("Loading models...")
    service.load_models()
    log("Ready for predictions")

    # Signal ready
    print(json.dumps({"status": "ready"}), flush=True)

    # Main loop: read JSON lines from stdin
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
        except json.JSONDecodeError:
            print(json.dumps({"status": "error", "error": "Invalid JSON"}), flush=True)
            continue

        # Handle commands
        if 'command' in request:
            if request['command'] == 'health':
                print(json.dumps({
                    "status": "ok",
                    "models_loaded": service.xgb_model is not None,
                }), flush=True)
            elif request['command'] == 'shutdown':
                log("Shutting down")
                break
            continue

        # Handle prediction request
        home = request.get('home_team', '')
        away = request.get('away_team', '')
        season = request.get('season', 2024)
        week = request.get('week')

        if not home or not away:
            print(json.dumps({
                "status": "error",
                "error": "home_team and away_team required",
            }), flush=True)
            continue

        result = service.predict(home, away, season, week)
        print(json.dumps(result), flush=True)


if __name__ == '__main__':
    main()
```

- [ ] **Step 3: Test the prediction service manually**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && echo '{"home_team": "Alabama", "away_team": "Georgia", "season": 2024}' | python server/ml/predict.py`
Expected: JSON output with `win_prob`, `spread`, `confidence` values.

- [ ] **Step 4: Commit**

```bash
git add server/ml/predict.py server/ml/requirements.txt
git commit -m "feat: add Python ML prediction service

Long-running subprocess that loads XGBoost + Ridge models.
Communicates via stdin/stdout JSON lines protocol.
Looks up team features from training_data.csv."
```

---

### Task 13: Express Prediction Route Update

**Files:**
- Modify: `server/src/routes/predictions.ts`

- [ ] **Step 1: Add Python subprocess management**

Add ML subprocess management to the predictions route. Add a helper at the top of the file that spawns and communicates with the Python prediction service:

```typescript
import { spawn, ChildProcess } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';

let mlProcess: ChildProcess | null = null;
let mlReady = false;
let pendingRequests: Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = new Map();

function startMLProcess(): void {
  const scriptPath = path.resolve(__dirname, '..', '..', 'ml', 'predict.py');
  mlProcess = spawn('python', [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const rl = readline.createInterface({ input: mlProcess.stdout! });
  rl.on('line', (line) => {
    try {
      const data = JSON.parse(line);
      if (data.status === 'ready') {
        mlReady = true;
        console.log('[ML] Prediction service ready');
        return;
      }
      // Resolve the oldest pending request
      const [firstKey] = pendingRequests.keys();
      if (firstKey) {
        const { resolve } = pendingRequests.get(firstKey)!;
        pendingRequests.delete(firstKey);
        resolve(data);
      }
    } catch (e) {
      console.error('[ML] Parse error:', e);
    }
  });

  mlProcess.stderr?.on('data', (data) => {
    console.log(`[ML] ${data.toString().trim()}`);
  });

  mlProcess.on('exit', (code) => {
    console.log(`[ML] Process exited with code ${code}`);
    mlReady = false;
    mlProcess = null;
  });
}

async function predict(request: Record<string, unknown>): Promise<unknown> {
  if (!mlProcess || !mlReady) {
    startMLProcess();
    // Wait for ready
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (mlReady) { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  return new Promise((resolve, reject) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    pendingRequests.set(id, { resolve, reject });
    mlProcess!.stdin!.write(JSON.stringify(request) + '\n');

    // Timeout after 10 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('ML prediction timeout'));
      }
    }, 10000);
  });
}
```

- [ ] **Step 2: Add ML prediction endpoint**

Add a new route that uses the real ML models. This supplements (not replaces) the existing mock routes:

```typescript
// POST /api/predictions/ml/predict
router.post('/ml/predict', async (req, res, next) => {
  try {
    const { homeTeam, awayTeam, season, week } = req.body;

    if (!homeTeam || !awayTeam) {
      return res.status(400).json({
        success: false,
        error: 'homeTeam and awayTeam are required',
      });
    }

    const result = await predict({
      home_team: homeTeam,
      away_team: awayTeam,
      season: season || 2024,
      week: week || undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 3: Run typecheck**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney/server && npx tsc --noEmit`
Expected: No new type errors

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/predictions.ts
git commit -m "feat: add ML prediction endpoint with Python subprocess

POST /api/predictions/ml/predict sends matchup to Python subprocess
running XGBoost + Ridge models. Returns win probability and spread.
Manages subprocess lifecycle with auto-start and health checks."
```

---

## Chunk 5: Build Pipeline, .gitignore & Validation

### Task 14: Update .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add starter_pack and model_pack to .gitignore**

```
# CFBD data packs (large, local development only)
starter_pack/
model_pack/

# ML models (binary files)
server/ml/models/
server/data/training_data.csv

# PBP discovery output
docs/play-format-discovery.txt
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore starter_pack, model_pack, and ML model files"
```

---

### Task 15: Run Full ETL Pipeline & Validate

- [ ] **Step 1: Run full build:data pipeline**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && npm run build:data`
Expected: All JSON files generated in `src/data/`. Console output shows counts and sizes.

- [ ] **Step 2: Run typecheck**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run all tests**

Run: `cd C:/Users/Ryan.younggreen/Desktop/CFBMoney && npm test`
Expected: All existing tests pass. Game engines consume real data through same cache getters.

- [ ] **Step 4: Verify cache loads new data**

Temporarily add a test or script that calls `initializeDataCache()` and then `getCacheStats()` to verify all data loads:

```typescript
// Quick verification — can run via tsx
import { initializeDataCache, getCacheStats } from './src/services/data/cfbd-cache';
initializeDataCache();
console.log(getCacheStats());
```

Expected output should show large counts (thousands of players, tens of thousands of games, etc.)

- [ ] **Step 5: Commit generated data**

```bash
git add src/data/teams.json src/data/games.json src/data/players.json src/data/player-stats.json src/data/team-stats.json src/data/advanced-stats.json src/data/drive-stats.json
git commit -m "feat: add real CFBD data generated from starter_pack

teams.json: All FBS teams from teams.csv
games.json: 2014-2024 games with Elo ratings
players.json: Players derived from play-by-play parsing
player-stats.json: Player season stats from PBP
team-stats.json: Team season stats from season_stats + games.csv
advanced-stats.json: Advanced metrics from advanced_season_stats
drive-stats.json: Drive efficiency from drives CSVs"
```

---

### Task 16: Update Memory File

**Files:**
- Modify: `C:\Users\Ryan.younggreen\.claude\projects\C--Users-Ryan-younggreen-Desktop-CFBMoney\memory\MEMORY.md`

- [ ] **Step 1: Update MEMORY.md with new data pipeline information**

Add to the memory file:
- ETL pipeline: `npm run build:data` → runs Python PBP parser + TypeScript team data ETL
- New data files: advanced-stats.json, drive-stats.json (from starter_pack CSVs)
- players.json and player-stats.json now derived from play-by-play parsing (not mock data)
- ML prediction service: server/ml/predict.py (Python subprocess, stdin/stdout JSON lines)
- starter_pack/ and model_pack/ in .gitignore (local development only)
- Data year range: 2014-2024 core + select pre-2014 legends

- [ ] **Step 2: Commit memory update**

```bash
git add -f C:\Users\Ryan.younggreen\.claude\projects\C--Users-Ryan-younggreen-Desktop-CFBMoney\memory\MEMORY.md
git commit -m "docs: update project memory with real data integration details"
```
