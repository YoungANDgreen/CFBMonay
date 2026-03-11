# Real Data Integration Design

## Overview

Replace all synthetic/mock seed data with real college football data from the CFBD Starter Pack and Model Pack. Integrate pre-trained ML models for server-side prediction inference.

## Data Sources

### Starter Pack (starter_pack/)
- `teams.csv` — All FBS teams with metadata
- `conferences.csv` — Conference definitions
- `games.csv` — ~106K games (filtering to 2014-2024)
- `game_stats/YYYY.csv` — Per-game box score stats (2014-2024)
- `season_stats/YYYY.csv` — Season-level traditional stats (2014-2024)
- `advanced_season_stats/YYYY.csv` — Season-level advanced metrics (2014-2024)
- `advanced_game_stats/YYYY.csv` — Per-game advanced stats (2014-2024)
- `drives/drives_YYYY.csv` — Drive-level data (2014-2024, aggregated only)

### Model Pack (model_pack/)
- `training_data.csv` — 92-column opponent-adjusted features (2016-2024)
- `xgb_home_win_model.pkl` — XGBoost win probability model
- `ridge_model.joblib` — Ridge regression spread prediction model
- `fastai_home_win_model.pkl` — FastAI neural net win probability model

### Excluded (for now)
- `plays/` (871 MB) — Too large for on-device. Stays local for ML development.

## Section 1: Build-Time ETL Pipeline

### Script: `scripts/build-data.ts`

Reads starter_pack CSVs, filters to 2014-2024, transforms to app JSON format.

**Input:** `starter_pack/data/` CSVs
**Output:** `src/data/*.json` files matching existing `CachedX` TypeScript interfaces

### Transformations

| Source CSV(s) | Output JSON | Description |
|--------------|-------------|-------------|
| `teams.csv` + `conferences.csv` | `teams.json` | All FBS teams with id, school, mascot, conference, colors |
| `games.csv` (2014-2024) | `games.json` | ~25K games with scores, Elo, venues |
| `game_stats/YYYY.csv` (2014-2024) | `player-stats.json` | Individual game stat lines aggregated to season level |
| `season_stats/YYYY.csv` (2014-2024) | `team-stats.json` | Season totals per team |
| `advanced_season_stats/YYYY.csv` (2014-2024) | `advanced-stats.json` | EPA, success rates, explosiveness, havoc (new file) |
| `drives/drives_YYYY.csv` (2014-2024) | `drive-stats.json` | Aggregated drive efficiency per team per season (new file) |
| Curated list | `legends.json` | Pre-2014 iconic players and seasons (new file) |

### Year Range
- **Core:** 2014-2024 (playoff era, 11 seasons)
- **Legends:** Curated pre-2014 entries for iconic players/seasons (Cam Newton 2010, Tim Tebow 2007-2008, Vince Young 2005, etc.)

### Cache Layer Changes (`cfbd-cache.ts`)
- Load new files: `advanced-stats.json`, `drive-stats.json`, `legends.json`
- New getters: `getAdvancedStats()`, `getDriveEfficiency()`, `getLegendPlayers()`
- Existing interfaces extended with new fields where applicable
- No breaking changes to existing getter signatures

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

- Loads models once at startup (kept in memory)
- Accepts JSON via stdin: `{ features: number[] }` (81 feature columns)
- Returns JSON via stdout: `{ win_prob: float, spread: float, confidence: float }`
- XGBoost for win probability, Ridge for spread, FastAI as optional ensemble member

### Feature Lookup

- Server stores `training_data.csv` (or derived lookup) for current-season team features
- For a given matchup, looks up home/away team rows from most recent available data
- Passes 81 opponent-adjusted feature columns to Python subprocess

### Express Route (`/api/predictions/game`)

1. Validate request (homeTeam, awayTeam required)
2. Look up team features from stored data
3. Spawn/communicate with Python subprocess
4. Combine model outputs (win prob + spread)
5. Generate human-readable top factors (reuse existing factor generation logic)
6. Return `GamePrediction` response

### Replaces
- Current `prediction-engine.ts` heuristic formulas (weighted Elo/recruiting/scoring)
- Factor generation logic preserved — it explains predictions to users
- `loadTeamFeaturesFromCache()` still used as fallback for offline/demo mode

## Section 3: Game Engine Enhancements

No structural changes to game engines. They consume data through `cfbd-cache.ts` getters. The cache loads real data instead of mock data.

### Per-Engine Impact

**Grid Engine** — Hundreds of real players per criteria combination (2014-2024 game_stats). Rarity scoring becomes meaningful with real player pools.

**Stat Stack** — Real stat leaders across a decade. Daily categories draw from actual season leaders. Max possible scores grounded in reality.

**Blind Resume** — Every team's actual season stats for 11 years. No more hardcoded championship seasons. Hundreds of real team-seasons to quiz from.

**Dynasty Builder** — Real player valuations from actual stats and draft positions. Composite scores derived from real performance data.

**Conference Clash** — Real stat lines for player identification. Authentic "who had this stat line?" puzzles.

## Section 4: File Organization

### Ships with app (`src/data/` — committed to git)
- `teams.json` — All FBS teams
- `games.json` — 2014-2024 games
- `player-stats.json` — Player season stats 2014-2024
- `team-stats.json` — Team season stats 2014-2024
- `advanced-stats.json` — Advanced metrics 2014-2024 (new)
- `drive-stats.json` — Drive efficiency 2014-2024 (new)
- `legends.json` — Curated pre-2014 data (new)
- Existing files retained: `draft-picks.json`, `rankings.json`, `records.json`, `recruits.json`

### Ships on server (`server/`)
- `server/ml/predict.py` — Python prediction subprocess
- `server/ml/models/` — Pickle/joblib model files (copied from model_pack)
- `server/data/training_data.csv` — Feature lookup for inference

### Local development only (`.gitignore`)
- `starter_pack/` — Raw source CSVs (~1 GB)
- `model_pack/` — Notebooks and training pipeline

### Estimated app data size
- ~15-20 MB total JSON (compressed further in app bundle)

## Dependencies

### New
- `csv-parse` (or `papaparse`) — CSV parsing for build script
- Python 3.x on server — for model inference subprocess

### Existing (no changes)
- Zustand stores, cache layer, game engines, Express server — all extended, not replaced
