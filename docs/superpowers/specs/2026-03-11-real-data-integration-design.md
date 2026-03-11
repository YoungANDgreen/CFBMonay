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

### Regex Parsing Patterns by Play Type

| playType | Pattern | Extracted Fields |
|----------|---------|-----------------|
| `Rush` | `{name} run for {yards} yds` | rusher, rush_yards |
| `Rushing Touchdown` | `{name} {yards} Yd Run` | rusher, rush_yards, rush_td=1 |
| `Pass Reception` | `{passer} pass complete to {receiver}` | passer, receiver, (yards if present) |
| `Passing Touchdown` | `{receiver} {yards} Yd pass from {passer}` | passer, receiver, pass_yards, pass_td=1 |
| `Pass Incompletion` | `{passer} pass incomplete to {target}` | passer, incompletion=1 |
| `Sack` | `{qb} sacked by {defender} for loss of {yards}` | qb, defender, sack=1, sack_yards |
| `Interception` | `{passer} pass intercepted` | passer, int=1 |
| `Interception Return TD` | `intercepted by {defender}...return...touchdown` | passer, defender, int=1, def_td=1 |
| `Field Goal Good/Missed` | `{kicker} {distance} yd FG GOOD/MISSED` | kicker, fg_made/fg_missed, distance |
| `Fumble Recovery (Opponent)` | `{player} fumbled, recovered by {defender}` | fumbler, recoverer, fumble_lost=1 |
| `Kickoff Return` | `{returner} return for {yards} yds` | returner, return_yards |
| `Punt Return Touchdown` | `{returner} return for {yards} yds...touchdown` | returner, return_yards, return_td=1 |

### Aggregation Pipeline

1. **Parse** — For each play, extract player name(s) and stat contributions via regex
2. **Associate** — Link player to team using the `offense`/`defense` column (no ambiguity)
3. **Accumulate** — Sum stats per player per season per team (handles transfers)
4. **Derive** — Calculate completion %, yards/attempt, yards/carry, etc.
5. **Output players.json** — Unique player entries with id, name, team (most recent), position (inferred from play types)
6. **Output player-stats.json** — Per-player-per-season stat objects

### Position Inference

Players don't have explicit positions in play-by-play. Infer from usage:
- QBs: Players who appear as `passer` in pass plays
- RBs: Players who appear primarily as `rusher` (and not as passer)
- WRs/TEs: Players who appear as `receiver` (distinguish by volume/team context)
- Kickers: Players in FG/kickoff plays
- Defensive players: Players who appear as sack/INT/fumble recovery credit

### Edge Cases
- **Transfers:** Same player name on different teams across seasons — treat as separate player-seasons, same player entity
- **Common names:** Disambiguate by team (the `offense`/`defense` column)
- **Unnamed plays:** Some `playText` entries lack player names (penalties, timeouts) — skip these
- **Partial parses:** If regex doesn't match, log the play for review but don't crash
- **PAT/2PT:** Extract from parenthetical in TD plays when present

### Expected Output Scale
- ~5,000-10,000 unique players per season (all FBS rosters)
- ~50,000-100,000 total player-seasons across 2014-2024
- Per-player stats: games, rush_att, rush_yds, rush_td, pass_comp, pass_att, pass_yds, pass_td, pass_int, receptions, rec_yds, rec_td, sacks, tackles_for_loss, interceptions, fumbles_forced, fumbles_recovered, fg_made, fg_att, kick_return_yds, punt_return_yds, return_tds, ppa_total

### Legends Extension
For pre-2014 iconic players, parse plays from 2003-2013 selectively:
- Specific seasons: Cam Newton 2010, Tim Tebow 2007-2008, Vince Young 2005, Reggie Bush 2005, Johnny Manziel 2012-2013, etc.
- Full year parses for championship-caliber seasons

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
