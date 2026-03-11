# Real Data Integration Design

## Overview

Replace all synthetic/mock seed data with real college football data from the CFBD Starter Pack and Model Pack. Build a custom player stats dataset by parsing ~2M play-by-play records. Integrate pre-trained ML models for server-side prediction inference.

## Data Sources

### Starter Pack (starter_pack/)
- `teams.csv` — All FBS teams with metadata
- `conferences.csv` — Conference definitions
- `games.csv` — ~106K games (filtering to 2014-2024)
- `game_stats/YYYY.csv` — Per-game team box score stats (2014-2024)
- `season_stats/YYYY.csv` — Season-level team traditional stats (2014-2024)
- `advanced_season_stats/YYYY.csv` — Season-level team advanced metrics (2014-2024)
- `advanced_game_stats/YYYY.csv` — Per-game team advanced stats (2014-2024)
- `drives/drives_YYYY.csv` — Drive-level data (2014-2024, aggregated only)
- `plays/YYYY/*.csv` — Play-by-play data (~250K plays/year, 2014-2024)

### Model Pack (model_pack/)
- `training_data.csv` — 92-column opponent-adjusted features (2016-2024)
- `xgb_home_win_model.pkl` — XGBoost win probability model
- `ridge_model.joblib` — Ridge regression spread prediction model
- `fastai_home_win_model.pkl` — FastAI neural net win probability model

### Important Note: No Pre-Built Player Data
The starter_pack and model_pack contain zero player-level data. All CSVs and notebooks are team-level only. Individual player stats are derived by parsing the `playText` column from play-by-play data (Section 1b).

## Section 1a: Build-Time Team Data ETL

### Script: `scripts/build-data.ts`

Reads starter_pack CSVs, filters to 2014-2024, transforms to app JSON format.

**Input:** `starter_pack/data/` CSVs
**Output:** `src/data/*.json` files matching existing `CachedX` TypeScript interfaces

### Transformations

| Source CSV(s) | Output JSON | Description |
|--------------|-------------|-------------|
| `teams.csv` + `conferences.csv` | `teams.json` | All FBS teams with id, school, mascot, conference, colors |
| `games.csv` (2014-2024) | `games.json` | ~25K games with scores, Elo, venues |
| `season_stats/YYYY.csv` + `games.csv` | `team-stats.json` | Season totals per team (joined with W/L from games) |
| `advanced_season_stats/YYYY.csv` (2014-2024) | `advanced-stats.json` | EPA, success rates, explosiveness, havoc (new file) |
| `drives/drives_YYYY.csv` (2014-2024) | `drive-stats.json` | Aggregated drive efficiency per team per season (new file) |

### Year Range
- **Core:** 2014-2024 (playoff era, 11 seasons)
- **Legends:** Curated pre-2014 entries for iconic games/teams (derived from games.csv pre-2014 data)

### Cross-File Joins
- `team-stats.json` requires joining `season_stats` (raw stats) with `games.csv` (to compute wins, losses, points for/against) since `season_stats` does not include W/L or points fields
- `games.json` enriched with Elo ratings (`home_start_elo`, `away_start_elo`) and `excitement` from `games.csv`

## Section 1b: Play-by-Play Player Stats ETL

### Script: `scripts/build-player-stats.py`

Python script that parses ~2M play-by-play records (2014-2024) to build a custom player stats dataset. This produces a unique dataset not available pre-built anywhere.

**Input:** `starter_pack/data/plays/YYYY/*.csv` (~250K plays/year)
**Output:** `src/data/players.json` + `src/data/player-stats.json`

### Play-by-Play Structure

Each play has structured columns plus a natural-language `playText` field:
- Structured: `offense`, `defense`, `yardsGained`, `ppa`, `down`, `distance`, `scoring`, `playType`, `gameId`, `season`
- Text: `playText` — e.g., "Nick Romano 45 Yd pass from Hayden Hatten (Logan Prescott Kick)"

### Parsing Strategy: Discovery-First

The `playText` column has multiple format variants per play type that vary across seasons. Rather than hardcoding regex patterns upfront, the parser uses a **discovery-first approach**:

1. **Phase 0 (one-time):** Run a discovery script that samples 20+ `playText` values per `playType` across multiple seasons, documenting all observed format variants
2. **Phase 1:** Build regex patterns from discovered formats
3. **Phase 2:** Validate patterns against full dataset, log unparseable plays for review

### Data Extraction Rules

**Primary principle:** Use structured CSV columns (`yardsGained`, `ppa`, `scoring`, `playType`) for stats. Use `playText` regex ONLY for player name extraction.

| Data Point | Source |
|------------|--------|
| Yardage (rush, receiving, sack, return) | `yardsGained` column (structured, reliable) |
| Player names (rusher, passer, receiver, etc.) | `playText` regex parsing |
| Touchdowns | `scoring` column + `playType` |
| Team association | `offense` / `defense` column |
| PPA (predicted points added) | `ppa` column (structured) |
| Game linkage | `gameId` column → links to `games.csv` |

### Known `playText` Format Variants

Multiple formats exist per play type. Examples from actual data:

**Rush / Rushing Touchdown:**
- `"Anthony Woods run for 2 yds to the LAM 45"`
- `"Jack Layne run for 4 yds for a TD (Cameron Pope KICK)"`
- Regex target: `^(.+?) run for` → extracts rusher name

**Pass Reception / Passing Touchdown (TWO formats):**
- Format A: `"Jack Layne pass complete to Mark Hamper"` (+ optional "for a 1ST down")
- Format B: `"Jake Cox 36 Yd pass from Hayden Hatten (Cameron Pope Kick)"` (TD variant)
- Format C: `"Rocco Becht pass complete to Jayden Higgins for 21 yds for a TD"` (TD via complete)
- Regex targets: `^(.+?) pass complete to (.+?)(?:\s+(?:for|to the)|$)` and `^(.+?) \d+ Yd pass from (.+?)(?:\s*\(|$)`

**Pass Incompletion:**
- `"Jack Layne pass incomplete"` (no target — common)
- `"pass incomplete to Terez Traynor"` (no passer — common)
- `"Jack Layne pass incomplete to Terez Traynor"` (both named)

**Sack:**
- `"Spencer Rattler sacked by Tomari Fox for a loss of 3 yards to the UNC 8"`
- Note: "for **a** loss" not "for loss"

**Field Goal (TWO formats):**
- `"Mitch Jeter 26 yd FG GOOD"`
- `"Logan Ward 52 Yd Field Goal"`

**Interception:**
- `"Gevani McCoy pass intercepted"` (defender not always named)

**Fumble:**
- Player name sometimes absent at start of play
- Recovery text includes team abbreviation: `"recovered by PSU Jaylen Reed"`

### Complete `playType` Enumeration

Parsed (extract player names + use structured columns for stats):
- `Rush`, `Rushing Touchdown`
- `Pass Reception`, `Passing Touchdown`
- `Pass Incompletion`
- `Sack`
- `Interception`, `Interception Return Touchdown`, `Pass Interception Return`
- `Fumble Recovery (Opponent)`, `Fumble Recovery (Own)`, `Fumble Return Touchdown`
- `Field Goal Good`, `Field Goal Missed`
- `Kickoff Return (Offense)`, `Kickoff Return Touchdown`
- `Punt Return Touchdown`

Skipped (no useful player stats):
- `Kickoff`, `Punt` (kicker/punter names extractable but low priority)
- `Penalty` (may contain negated play data — skip to avoid false stats)
- `Timeout`, `End Period`, `End of Half`, `End of Game`, `End of Regulation`
- `Blocked Field Goal`, `Blocked Punt`, `Blocked Field Goal Touchdown`, `Blocked Punt Touchdown`
- `Safety`, `Uncategorized`, `placeholder`

### Pass Attempt Counting (NCAA Rules)

- `Pass Reception` / `Passing Touchdown` → +1 completion, +1 attempt
- `Pass Incompletion` → +1 attempt
- `Interception` → +1 attempt, +1 interception
- `Sack` → NOT a pass attempt (NCAA rules differ from NFL; sacks are rushing plays in college stats)

### Aggregation Pipeline

1. **Parse** — For each play, extract player name(s) from `playText`; pull stats from structured columns (`yardsGained`, `ppa`, `scoring`)
2. **Associate** — Link player to team using the `offense`/`defense` column (no ambiguity)
3. **Count games** — Track unique `gameId` values per player per season for accurate games played
4. **Accumulate** — Sum stats per player per season per team (handles transfers — different team = different player-season)
5. **Derive** — Calculate completion %, yards/attempt, yards/carry, etc.
6. **Output players.json** — Unique player entries with id, name, team (most recent), position (inferred from play types)
7. **Output player-stats.json** — Per-player-per-season stat objects

### Position Inference

Players don't have explicit positions in play-by-play. Infer from usage:
- **QBs:** Players who appear as `passer` in 5+ pass plays in a season
- **RBs:** Players who appear primarily as `rusher` (and not as passer)
- **WRs/TEs:** Players who appear as `receiver` (distinguish by volume/team context)
- **K:** Players in FG plays
- **DEF:** Players who appear as sack/INT/fumble recovery credit (position not further differentiated)

### Player Identity & Interface

**ID generation:** Hash of normalized `name + team + season` for player-season uniqueness. Player entity ID is hash of `name + first_team_seen`.

**Name normalization:** Strip suffixes (Jr., II, III), normalize whitespace, handle "TEAM" placeholder plays.

**CachedPlayer interface adaptation:** PBP-derived players cannot provide `jersey`, `height`, `weight`, `year`, or `hometown`. These fields will be set to defaults (`jersey: 0`, `height: 0`, `weight: 0`, `year: ''`, `hometown: ''`). The interface is preserved for compatibility — game engines only use `name`, `team`, `position` for gameplay logic.

### Edge Cases
- **Transfers:** Same player name on different teams across seasons — same player entity, separate player-seasons
- **Common names:** Disambiguate by team (the `offense`/`defense` column)
- **Unnamed plays:** Some `playText` entries lack player names (penalties, timeouts) — skip these
- **Partial parses:** If regex doesn't match, log the play for review but don't crash
- **PAT/2PT:** Extract kicker name from parenthetical in TD plays when present

### Validation & Quality Report

After parsing, the script outputs a quality report:
- Total plays processed vs. total plays in source files
- Parse success rate by `playType`
- Top 20 unparseable `playText` samples for manual review
- Stat sanity checks: top 5 QBs by passing yards per season, top 5 RBs by rushing yards — spot-check against known leaders
- Cross-validation: compare per-team aggregated rushing/passing yards against `game_stats` CSV totals

### Expected Output Scale
- ~5,000-10,000 unique players per season (all FBS rosters touching a play)
- ~50,000-100,000 total player-seasons across 2014-2024
- Per-player stats: games, rush_att, rush_yds, rush_td, pass_comp, pass_att, pass_yds, pass_td, pass_int, receptions, rec_yds, rec_td, sacks_recorded (defensive), interceptions_recorded (defensive), fumbles_lost, fumbles_recovered, fg_made, fg_att, kick_return_yds, punt_return_yds, return_tds, ppa_total
- **Not derivable from PBP:** tackles, tackles_for_loss (except sacks), passes defended, forced fumbles (attribution unclear in text)

### Legends Extension
For pre-2014 iconic players, parse plays from 2003-2013 selectively. Controlled by a config list (`scripts/legends-config.json`):
```json
[
  { "season": 2005, "team": "Texas", "note": "Vince Young" },
  { "season": 2005, "team": "USC", "note": "Reggie Bush" },
  { "season": 2007, "team": "Florida", "note": "Tim Tebow" },
  { "season": 2008, "team": "Florida", "note": "Tim Tebow" },
  { "season": 2010, "team": "Auburn", "note": "Cam Newton" },
  { "season": 2012, "team": "Texas A&M", "note": "Johnny Manziel" },
  { "season": 2013, "team": "Texas A&M", "note": "Johnny Manziel" },
  { "season": 2013, "team": "Florida State", "note": "Jameis Winston" }
]
```
These team-seasons are fully parsed. All players from those teams in those years are included, not just the named legends — this gives Dynasty Builder full rosters for iconic teams.

## Section 2: ML Model Integration

### Architecture

```
React Native App
    -> POST /api/predictions/game { homeTeam, awayTeam, season?, week? }
    -> Express server (server/src/routes/predictions.ts)
    -> Python child process (server/ml/predict.py)
    -> Loads xgb_home_win_model.pkl + ridge_model.joblib
    -> Returns { spread, winProbability, confidence, factors }
    -> Express returns prediction to app
```

### Python Prediction Service (`server/ml/predict.py`)

- Loads models once at startup (kept in memory via long-running subprocess)
- Communicates via stdin/stdout JSON lines
- XGBoost for win probability, Ridge for spread, FastAI as optional ensemble member

### Feature Lookup

- Server stores `training_data.csv` for feature lookup
- Each row is one game with both home/away team features in the same row
- For a future prediction: find each team's most recent game row, extract their respective feature columns (home_* or away_* depending on which side they were on)
- Feature columns (81 total): adjusted EPA, rushing/passing EPA, success rates, explosiveness, havoc, line yards, field position, points per opportunity — all opponent-adjusted
- Column mapping between `training_data.csv` names and `advanced_season_stats` names documented in script

### Express Route (`/api/predictions/game`)

1. Validate request (homeTeam, awayTeam required)
2. Look up team features from most recent game rows in training data
3. Construct 81-feature vector in correct column order
4. Send to Python subprocess, receive prediction
5. Generate human-readable top factors (reuse existing factor generation logic from prediction-engine.ts)
6. Return `GamePrediction` response

### Replaces
- Current `prediction-engine.ts` heuristic formulas (weighted Elo/recruiting/scoring)
- Factor generation logic preserved — it explains predictions to users
- `loadTeamFeaturesFromCache()` still used as fallback for offline/demo mode

### Margin Convention
- `training_data.csv` margin = home_points - away_points (positive = home win)
- Spread convention: negative = home favored (matches Vegas convention)

## Section 3: Game Engine Enhancements

No structural changes to game engines. They consume data through `cfbd-cache.ts` getters. The cache loads real data instead of mock data.

### Per-Engine Impact

**Grid Engine** — Thousands of real players from play-by-play parsing (2014-2024). Criteria like "SEC player" or "1000+ rushing yards" now have massive valid answer pools. Rarity scoring becomes meaningful.

**Stat Stack** — Real stat leaders across a decade. Daily categories draw from actual season leaders computed from play-by-play. Max possible scores grounded in reality.

**Blind Resume** — Every team's actual season stats for 11 years from `season_stats` + `team-stats.json`. No more hardcoded championship seasons. Hundreds of real team-seasons to quiz from.

**Dynasty Builder** — Real player valuations from play-by-play-derived stats. Composite scores derived from actual performance data across seasons.

**Conference Clash** — Real stat lines for player identification. "Who had 3,812 passing yards and 40 TDs in 2023?" pulled from actual computed player stats.

### Cache Layer Changes (`cfbd-cache.ts`)
- Load new files: `advanced-stats.json`, `drive-stats.json`
- New getters: `getAdvancedStats()`, `getAdvancedStatsByTeam()`, `getDriveEfficiency()`, `getDriveEfficiencyByTeam()`
- Existing `players.json` and `player-stats.json` replaced with play-by-play-derived versions (same interfaces, real data)
- Existing getter signatures preserved — no breaking changes
- `CachedGame` interface extended with `homeElo`, `awayElo` fields

### New TypeScript Interfaces

```typescript
interface CachedAdvancedStats {
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
    havoc: { total: number; frontSeven: number; db: number; };
  };
  defense: { /* mirror of offense */ };
}

interface CachedDriveEfficiency {
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

## Section 4: File Organization

### Ships with app (`src/data/` — committed to git)
- `teams.json` — All FBS teams (from teams.csv)
- `games.json` — 2014-2024 games with Elo (from games.csv)
- `players.json` — All players derived from play-by-play (replaces mock)
- `player-stats.json` — Player season stats from play-by-play (replaces mock)
- `team-stats.json` — Team season stats 2014-2024 (from season_stats + games.csv)
- `advanced-stats.json` — Advanced metrics 2014-2024 (new, from advanced_season_stats)
- `drive-stats.json` — Drive efficiency 2014-2024 (new, from drives)
- Existing files retained as-is: `draft-picks.json`, `rankings.json`, `records.json`, `recruits.json` (no replacement source in starter_pack; refresh via CFBD API later)

### Ships on server (`server/`)
- `server/ml/predict.py` — Python prediction subprocess
- `server/ml/models/` — Pickle/joblib model files (copied from model_pack)
- `server/data/training_data.csv` — Feature lookup for inference

### Local development only (`.gitignore`)
- `starter_pack/` — Raw source CSVs (~1 GB)
- `model_pack/` — Notebooks and training pipeline

### Estimated app data size
- Team data (teams, games, team-stats, advanced-stats, drive-stats): ~10-15 MB
- Player data (players, player-stats from PBP parsing): ~5-10 MB
- Total: ~15-25 MB (compressed further in app bundle)

## Section 5: Build Pipeline

### Order of Operations

1. `scripts/build-player-stats.py` — Parse play-by-play → `players.json` + `player-stats.json` (Python, runs first, heaviest processing)
2. `scripts/build-data.ts` — Process team CSVs → `teams.json`, `games.json`, `team-stats.json`, `advanced-stats.json`, `drive-stats.json` (TypeScript)
3. Both scripts idempotent — safe to re-run anytime

### npm script
```json
{
  "build:data": "python scripts/build-player-stats.py && npx tsx scripts/build-data.ts"
}
```

## Dependencies

### New
- `csv-parse` (or `papaparse`) — CSV parsing for TypeScript build script
- Python 3.x — for play-by-play parser and server-side model inference
- Python packages: `pandas`, `joblib`, `xgboost`, `scikit-learn` (server ML)

### Existing (no changes)
- Zustand stores, cache layer, game engines, Express server — all extended, not replaced
