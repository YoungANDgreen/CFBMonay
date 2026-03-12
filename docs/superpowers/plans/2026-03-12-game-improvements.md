# Game Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Film Room with disguised descriptions + legends content, expand Grid to 50 stat thresholds with compatibility matrix, add year selection to Stat Stack, integrate team logos/player headshots, and add animations + UI polish across all games.

**Architecture:** Data-first approach — build new data files (legends, logos, headshots, expanded thresholds) first, then wire into engines, then upgrade UI components. Each task is independent and can be parallelized.

**Tech Stack:** React Native + Expo, Zustand stores, expo-image for cached logos, react-native-reanimated for animations, ESPN CDN for logos/headshots.

---

## Chunk 1: Data & Engine Upgrades

### Task 1: Create Team Logos Mapping

**Files:**
- Create: `src/data/team-logos.json`
- Create: `scripts/build-team-logos.ts`

- [ ] **Step 1: Create the logo mapping script**

```typescript
// scripts/build-team-logos.ts
// Reads src/data/teams.json, maps each team to ESPN CDN logo URL
// ESPN logo format: https://a.espncdn.com/i/teamlogos/ncaa/500/{espnId}.png
// ESPN team lookup: site.api.espn.com/apis/site/v2/sports/football/college-football/teams

import * as fs from 'fs';

interface TeamLogo {
  school: string;
  espnId: number;
  logoUrl: string;
  darkLogoUrl: string;
}

async function main() {
  // Fetch ESPN team list to get IDs
  const resp = await fetch(
    'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=200'
  );
  const data = await resp.json();
  const espnTeams = data.sports[0].leagues[0].teams;

  const teams = JSON.parse(fs.readFileSync('src/data/teams.json', 'utf-8'));
  const logos: TeamLogo[] = [];

  for (const team of teams) {
    const espnMatch = espnTeams.find(
      (e: any) => e.team.displayName.toLowerCase() === team.school.toLowerCase()
        || e.team.shortDisplayName.toLowerCase() === team.school.toLowerCase()
    );
    if (espnMatch) {
      logos.push({
        school: team.school,
        espnId: parseInt(espnMatch.team.id),
        logoUrl: espnMatch.team.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/ncaa/500/${espnMatch.team.id}.png`,
        darkLogoUrl: espnMatch.team.logos?.[1]?.href || espnMatch.team.logos?.[0]?.href || '',
      });
    }
  }

  fs.writeFileSync('src/data/team-logos.json', JSON.stringify(logos, null, 2));
  console.log(`Wrote ${logos.length} team logos`);
}
main();
```

- [ ] **Step 2: Run the script to generate team-logos.json**

Run: `npx ts-node scripts/build-team-logos.ts`
Expected: Creates `src/data/team-logos.json` with ~130+ team entries

- [ ] **Step 3: Add logo getters to cfbd-cache.ts**

Modify: `src/services/data/cfbd-cache.ts`

Add after line 161 (after `let driveStats`):
```typescript
interface TeamLogoEntry {
  school: string;
  espnId: number;
  logoUrl: string;
  darkLogoUrl: string;
}

let teamLogos: TeamLogoEntry[] = [];
let _logoMap: Map<string, TeamLogoEntry> | null = null;
```

In `initializeDataCache()` add after driveStats try/catch:
```typescript
try {
  teamLogos = require('../../data/team-logos.json') as TeamLogoEntry[];
} catch { teamLogos = []; }
```

Add getter functions:
```typescript
export function getTeamLogo(school: string): string | undefined {
  if (!_logoMap) {
    _logoMap = new Map(teamLogos.map(t => [t.school.toLowerCase(), t]));
  }
  return _logoMap.get(school.toLowerCase())?.logoUrl;
}

export function getTeamLogoDark(school: string): string | undefined {
  if (!_logoMap) {
    _logoMap = new Map(teamLogos.map(t => [t.school.toLowerCase(), t]));
  }
  return _logoMap.get(school.toLowerCase())?.darkLogoUrl;
}

export function getEspnTeamId(school: string): number | undefined {
  if (!_logoMap) {
    _logoMap = new Map(teamLogos.map(t => [t.school.toLowerCase(), t]));
  }
  return _logoMap.get(school.toLowerCase())?.espnId;
}
```

- [ ] **Step 4: Run tsc and tests**

Run: `npx tsc --noEmit && npx jest --no-coverage`
Expected: 0 TS errors, 316+ tests pass

- [ ] **Step 5: Commit**

```bash
git add src/data/team-logos.json scripts/build-team-logos.ts src/services/data/cfbd-cache.ts
git commit -m "feat: add team logo mapping from ESPN CDN"
```

---

### Task 2: Create Film Room Legends Data

**Files:**
- Create: `src/data/film-room-legends.json`

- [ ] **Step 1: Create legends JSON with ~40 iconic games**

Research from ESPN 150 Greatest Games list + 50 Best of 21st Century. Each entry has disguised description (no team names), broadcast quote where available.

```json
[
  {
    "id": "legend-001",
    "season": 2013,
    "homeTeam": "Auburn",
    "awayTeam": "Alabama",
    "homeScore": 34,
    "awayScore": 28,
    "venue": "Jordan-Hare Stadium",
    "gameType": "rivalry",
    "description": "With one second left in the rivalry game, a top-ranked team attempts a 57-yard field goal to send the game to overtime. The kick falls short — and a defensive back catches it 9 yards deep in his own end zone. What follows is 109 yards of broken tackles, desperate dives, and pandemonium as the return goes all the way for the game-winning touchdown.",
    "disguiseHints": {
      "home": "a top-15 SEC team at home",
      "away": "the #1 ranked team in the country"
    },
    "broadcastQuote": "There goes Davis! Davis is gonna run it all the way back! Auburn's gonna win the football game! Auburn's gonna win the football game!",
    "announcer": "Rod Bramblett",
    "difficulty": "medium"
  }
]
```

Full list to include (40-50 games):
- 2013 Iron Bowl (Kick Six)
- 2006 Rose Bowl (Vince Young Texas vs USC)
- 2007 Fiesta Bowl (Boise State vs Oklahoma)
- 2007 App State vs Michigan
- 1984 Orange Bowl (Flutie Hail Mary — BC vs Miami)
- 2017 CFP Championship (Alabama vs Georgia OT)
- 2018 CFP Semifinal (Alabama vs Oklahoma)
- 2018 CFP Championship (Clemson 44-16 Alabama)
- 2021 Iron Bowl (4 OT)
- 2005 USC vs Texas (Rose Bowl)
- 2016 Clemson vs Alabama CFP Championship
- 2006 Ohio State vs Michigan (#1 vs #2)
- 2014 Ohio State vs Alabama CFP Semifinal
- 2022 TCU vs Michigan CFP Semifinal
- 2022 Georgia vs TCU CFP Championship
- 2019 LSU vs Alabama (Burrow's Heisman game)
- 2019 CFP Championship (LSU vs Clemson)
- 1971 Nebraska vs Oklahoma (Game of Century)
- 1982 Cal vs Stanford (The Play)
- 2003 Fiesta Bowl (Ohio State vs Miami)
- 2012 Alabama vs LSU (BCS Championship)
- 2015 CFP Championship (Ohio State vs Oregon)
- 2008 Florida vs Oklahoma (BCS Championship)
- 2010 Cam Newton Auburn season (various)
- 2013 Michigan State vs Stanford (Rose Bowl)
- 2016 Michigan vs Ohio State (double OT)
- 2009 Texas vs Nebraska (Big 12 Championship, 1 second)
- 2014 Mississippi State vs Auburn
- 2000 Florida State vs Miami (Wide Right IV)
- 2006 Boise State regular season perfection
- 2018 Texas A&M vs LSU (7 OTs)
- 2003 Miami (OH) vs Ohio (Ben Roethlisberger bowl era)
- 2012 Stanford vs Oregon
- 2011 Oklahoma State vs Iowa State (upset)
- 2007 #2 USF vs UCF
- 2020 Coastal Carolina undefeated run
- 1998 Tennessee vs Florida State (Fiesta Bowl National Championship)
- 2002 Ohio State vs Michigan
- 2004 USC vs Oklahoma (Orange Bowl)

- [ ] **Step 2: Validate JSON structure**

Run: `node -e "const d=require('./src/data/film-room-legends.json'); console.log(d.length + ' legends loaded'); d.forEach(g => { if(!g.description||!g.homeTeam||!g.awayTeam) throw new Error('Missing field: '+g.id) })"`
Expected: "40 legends loaded" (or similar count)

- [ ] **Step 3: Commit**

```bash
git add src/data/film-room-legends.json
git commit -m "feat: add 40+ curated Film Room legends games with broadcast quotes"
```

---

### Task 3: Film Room Engine — Disguised Descriptions

**Files:**
- Modify: `src/services/games/film-room-engine.ts`
- Modify: `src/components/games/film-room-game.tsx`
- Test: `src/services/games/film-room-engine.test.ts`

- [ ] **Step 1: Write failing test for disguised description generation**

Add to `src/services/games/film-room-engine.test.ts`:
```typescript
describe('disguiseDescription', () => {
  it('replaces team names with hints in mode B', () => {
    const result = disguiseDescription(
      'Alabama demolished Auburn 55-24 at Bryant-Denny',
      'Alabama', 'Auburn',
      { home: 'a top-5 SEC powerhouse', away: 'their in-state rival' },
      'partial'
    );
    expect(result).not.toContain('Alabama');
    expect(result).not.toContain('Auburn');
    expect(result).toContain('a top-5 SEC powerhouse');
  });

  it('uses Team A/B in mode A (full anonymization)', () => {
    const result = disguiseDescription(
      'Alabama demolished Auburn 55-24',
      'Alabama', 'Auburn',
      undefined,
      'full'
    );
    expect(result).not.toContain('Alabama');
    expect(result).not.toContain('Auburn');
    expect(result).toMatch(/Team [AB]/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/games/film-room-engine.test.ts -v`
Expected: FAIL — disguiseDescription not exported

- [ ] **Step 3: Implement disguiseDescription**

Add to `film-room-engine.ts`:
```typescript
export function disguiseDescription(
  description: string,
  team1: string,
  team2: string,
  hints?: { home: string; away: string },
  mode: 'partial' | 'full' = 'partial'
): string {
  let result = description;
  if (mode === 'full') {
    // Replace all occurrences of team names with Team A / Team B
    result = result.replace(new RegExp(team1, 'gi'), 'Team A');
    result = result.replace(new RegExp(team2, 'gi'), 'Team B');
  } else {
    // Replace with contextual hints
    const hint1 = hints?.home || 'the home team';
    const hint2 = hints?.away || 'the visiting team';
    result = result.replace(new RegExp(team1, 'gi'), hint1);
    result = result.replace(new RegExp(team2, 'gi'), hint2);
  }
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/games/film-room-engine.test.ts -v`
Expected: PASS

- [ ] **Step 5: Update generateFilmRoomGameWithCache to use disguised descriptions**

Modify `generateFilmRoomGameWithCache` (line ~347):
- Load legends JSON via `require('../../data/film-room-legends.json')`
- Mix ~70% Mode B / ~30% Mode A using seeded RNG
- For dynamic (2014-2024) games: generate ranking-based hints from cache (`getRankingsByWeek`)
- For legends games: use pre-written `disguiseHints`
- Add `revealData` to each round: `{ homeTeam, awayTeam, homeLogo, awayLogo, broadcastQuote?, announcer? }`

- [ ] **Step 6: Update FilmRoomGame component for post-reveal experience**

Modify `src/components/games/film-room-game.tsx`:
- After answer selection, show reveal card:
  - Team logos side-by-side (using `getTeamLogo()`)
  - Final score with animation
  - Broadcast quote in stylized block (if available)
  - Announcer attribution

- [ ] **Step 7: Filter for quality games in dynamic mode**

In `generateFilmRoomGameWithCache`, update game filtering:
```typescript
const qualityGames = allGames.filter(g => {
  if (!g.completed || !g.homeConference || !g.awayConference) return false;
  const margin = Math.abs(g.homePoints - g.awayPoints);
  const total = g.homePoints + g.awayPoints;
  const isUpset = g.homeElo && g.awayElo && Math.abs(g.homeElo - g.awayElo) > 150;
  const isClose = margin <= 7;
  const isShootout = total >= 70;
  const isRankedMatchup = g.homeElo && g.awayElo && g.homeElo > 1600 && g.awayElo > 1600;
  return isUpset || isClose || isShootout || isRankedMatchup;
});
```

- [ ] **Step 8: Run all tests**

Run: `npx tsc --noEmit && npx jest --no-coverage`
Expected: 0 TS errors, all tests pass

- [ ] **Step 9: Commit**

```bash
git add src/services/games/film-room-engine.ts src/services/games/film-room-engine.test.ts src/components/games/film-room-game.tsx
git commit -m "feat: Film Room disguised descriptions with legends + post-reveal experience"
```

---

### Task 4: Grid Engine — 50 Stat Thresholds + Compatibility Matrix

**Files:**
- Modify: `src/services/games/grid-engine.ts:118-162` (STAT_CRITERIA, POSITION_CRITERIA, ALL_CRITERIA_POOLS)
- Modify: `src/services/games/grid-engine.ts:265-299` (buildStatThresholdIndex)
- Modify: `src/services/games/grid-engine.ts:347-374` (matchCriteria)
- Test: `src/services/games/grid-engine.test.ts`

- [ ] **Step 1: Write failing test for compatibility checking**

Add to `src/services/games/grid-engine.test.ts`:
```typescript
import { areCompatibleCriteria } from './grid-engine';

describe('areCompatibleCriteria', () => {
  it('allows QB + passing stats', () => {
    expect(areCompatibleCriteria(
      { type: 'position', value: 'QB', displayText: 'QB' },
      { type: 'stat_threshold', value: '30+ Passing TDs', displayText: '30+ Passing TDs' }
    )).toBe(true);
  });

  it('blocks K + passing stats', () => {
    expect(areCompatibleCriteria(
      { type: 'position', value: 'K', displayText: 'K' },
      { type: 'stat_threshold', value: '30+ Passing TDs', displayText: '30+ Passing TDs' }
    )).toBe(false);
  });

  it('allows WR + 1 Passing TD (trick play)', () => {
    expect(areCompatibleCriteria(
      { type: 'position', value: 'WR', displayText: 'WR' },
      { type: 'stat_threshold', value: '1+ Passing TD', displayText: '1+ Passing TD' }
    )).toBe(true);
  });

  it('allows DEF + 5+ Sacks', () => {
    expect(areCompatibleCriteria(
      { type: 'position', value: 'DEF', displayText: 'DEF' },
      { type: 'stat_threshold', value: '5+ Sacks', displayText: '5+ Sacks' }
    )).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/games/grid-engine.test.ts -v --testNamePattern="areCompatibleCriteria"`
Expected: FAIL — areCompatibleCriteria not exported

- [ ] **Step 3: Define expanded STAT_CRITERIA with compatibility metadata**

Replace STAT_CRITERIA (lines 118-124) with 50 criteria:
```typescript
interface StatCriterion {
  type: 'stat_threshold';
  value: string;
  displayText: string;
  compatiblePositions: string[];
  statField: string;
  threshold: number;
}

const STAT_CRITERIA: StatCriterion[] = [
  // Passing (QB only, except trick play)
  { type: 'stat_threshold', value: '1+ Passing TD', displayText: '1+ Passing TD', compatiblePositions: ['QB', 'WR', 'RB', 'ATH'], statField: 'passingTDs', threshold: 1 },
  { type: 'stat_threshold', value: '10+ Passing TDs', displayText: '10+ Passing TDs', compatiblePositions: ['QB'], statField: 'passingTDs', threshold: 10 },
  { type: 'stat_threshold', value: '20+ Passing TDs', displayText: '20+ Passing TDs', compatiblePositions: ['QB'], statField: 'passingTDs', threshold: 20 },
  { type: 'stat_threshold', value: '30+ Passing TDs', displayText: '30+ Passing TDs', compatiblePositions: ['QB'], statField: 'passingTDs', threshold: 30 },
  { type: 'stat_threshold', value: '40+ Passing TDs', displayText: '40+ Passing TDs', compatiblePositions: ['QB'], statField: 'passingTDs', threshold: 40 },
  { type: 'stat_threshold', value: '1000+ Passing Yds', displayText: '1000+ Passing Yds', compatiblePositions: ['QB'], statField: 'passingYards', threshold: 1000 },
  { type: 'stat_threshold', value: '2000+ Passing Yds', displayText: '2000+ Passing Yds', compatiblePositions: ['QB'], statField: 'passingYards', threshold: 2000 },
  { type: 'stat_threshold', value: '3000+ Passing Yds', displayText: '3000+ Passing Yds', compatiblePositions: ['QB'], statField: 'passingYards', threshold: 3000 },
  { type: 'stat_threshold', value: '4000+ Passing Yds', displayText: '4000+ Passing Yds', compatiblePositions: ['QB'], statField: 'passingYards', threshold: 4000 },
  { type: 'stat_threshold', value: '10+ INTs Thrown', displayText: '10+ INTs Thrown', compatiblePositions: ['QB'], statField: 'interceptions', threshold: 10 },
  // Rushing (QB, RB, ATH, + WR for rare)
  { type: 'stat_threshold', value: '100+ Rush Yds', displayText: '100+ Rush Yds', compatiblePositions: ['QB', 'RB', 'WR', 'ATH'], statField: 'rushingYards', threshold: 100 },
  { type: 'stat_threshold', value: '500+ Rush Yds', displayText: '500+ Rush Yds', compatiblePositions: ['QB', 'RB', 'ATH'], statField: 'rushingYards', threshold: 500 },
  { type: 'stat_threshold', value: '1000+ Rush Yds', displayText: '1000+ Rush Yds', compatiblePositions: ['QB', 'RB', 'ATH'], statField: 'rushingYards', threshold: 1000 },
  { type: 'stat_threshold', value: '1500+ Rush Yds', displayText: '1500+ Rush Yds', compatiblePositions: ['RB', 'ATH'], statField: 'rushingYards', threshold: 1500 },
  { type: 'stat_threshold', value: '2000+ Rush Yds', displayText: '2000+ Rush Yds', compatiblePositions: ['RB'], statField: 'rushingYards', threshold: 2000 },
  { type: 'stat_threshold', value: '5+ Rush TDs', displayText: '5+ Rush TDs', compatiblePositions: ['QB', 'RB', 'WR', 'ATH'], statField: 'rushingTDs', threshold: 5 },
  { type: 'stat_threshold', value: '10+ Rush TDs', displayText: '10+ Rush TDs', compatiblePositions: ['QB', 'RB', 'ATH'], statField: 'rushingTDs', threshold: 10 },
  { type: 'stat_threshold', value: '15+ Rush TDs', displayText: '15+ Rush TDs', compatiblePositions: ['RB', 'ATH'], statField: 'rushingTDs', threshold: 15 },
  { type: 'stat_threshold', value: '20+ Rush TDs', displayText: '20+ Rush TDs', compatiblePositions: ['RB'], statField: 'rushingTDs', threshold: 20 },
  // Receiving (WR, RB, ATH + QB for rare)
  { type: 'stat_threshold', value: '1+ Receiving TD', displayText: '1+ Receiving TD', compatiblePositions: ['WR', 'RB', 'QB', 'ATH'], statField: 'receivingTDs', threshold: 1 },
  { type: 'stat_threshold', value: '500+ Rec Yds', displayText: '500+ Rec Yds', compatiblePositions: ['WR', 'RB', 'ATH'], statField: 'receivingYards', threshold: 500 },
  { type: 'stat_threshold', value: '1000+ Rec Yds', displayText: '1000+ Rec Yds', compatiblePositions: ['WR', 'ATH'], statField: 'receivingYards', threshold: 1000 },
  { type: 'stat_threshold', value: '1500+ Rec Yds', displayText: '1500+ Rec Yds', compatiblePositions: ['WR'], statField: 'receivingYards', threshold: 1500 },
  { type: 'stat_threshold', value: '5+ Rec TDs', displayText: '5+ Rec TDs', compatiblePositions: ['WR', 'RB', 'ATH'], statField: 'receivingTDs', threshold: 5 },
  { type: 'stat_threshold', value: '10+ Rec TDs', displayText: '10+ Rec TDs', compatiblePositions: ['WR', 'ATH'], statField: 'receivingTDs', threshold: 10 },
  { type: 'stat_threshold', value: '15+ Rec TDs', displayText: '15+ Rec TDs', compatiblePositions: ['WR'], statField: 'receivingTDs', threshold: 15 },
  // Total TDs
  { type: 'stat_threshold', value: '10+ Total TDs', displayText: '10+ Total TDs', compatiblePositions: ['QB', 'RB', 'WR', 'ATH'], statField: 'totalTDs', threshold: 10 },
  { type: 'stat_threshold', value: '15+ Total TDs', displayText: '15+ Total TDs', compatiblePositions: ['QB', 'RB', 'WR', 'ATH'], statField: 'totalTDs', threshold: 15 },
  { type: 'stat_threshold', value: '20+ Total TDs', displayText: '20+ Total TDs', compatiblePositions: ['QB', 'RB', 'WR', 'ATH'], statField: 'totalTDs', threshold: 20 },
  { type: 'stat_threshold', value: '25+ Total TDs', displayText: '25+ Total TDs', compatiblePositions: ['QB', 'RB', 'ATH'], statField: 'totalTDs', threshold: 25 },
  { type: 'stat_threshold', value: '30+ Total TDs', displayText: '30+ Total TDs', compatiblePositions: ['QB', 'RB'], statField: 'totalTDs', threshold: 30 },
  // Defensive
  { type: 'stat_threshold', value: '3+ Sacks', displayText: '3+ Sacks', compatiblePositions: ['DEF'], statField: 'sacks', threshold: 3 },
  { type: 'stat_threshold', value: '5+ Sacks', displayText: '5+ Sacks', compatiblePositions: ['DEF'], statField: 'sacks', threshold: 5 },
  { type: 'stat_threshold', value: '8+ Sacks', displayText: '8+ Sacks', compatiblePositions: ['DEF'], statField: 'sacks', threshold: 8 },
  { type: 'stat_threshold', value: '10+ Sacks', displayText: '10+ Sacks', compatiblePositions: ['DEF'], statField: 'sacks', threshold: 10 },
  { type: 'stat_threshold', value: '3+ DEF INTs', displayText: '3+ DEF INTs', compatiblePositions: ['DEF'], statField: 'defensiveInterceptions', threshold: 3 },
  { type: 'stat_threshold', value: '5+ DEF INTs', displayText: '5+ DEF INTs', compatiblePositions: ['DEF'], statField: 'defensiveInterceptions', threshold: 5 },
  { type: 'stat_threshold', value: '8+ DEF INTs', displayText: '8+ DEF INTs', compatiblePositions: ['DEF'], statField: 'defensiveInterceptions', threshold: 8 },
  { type: 'stat_threshold', value: '2+ Forced Fumbles', displayText: '2+ Forced Fumbles', compatiblePositions: ['DEF'], statField: 'forcedFumbles', threshold: 2 },
  { type: 'stat_threshold', value: '3+ Forced Fumbles', displayText: '3+ Forced Fumbles', compatiblePositions: ['DEF'], statField: 'forcedFumbles', threshold: 3 },
  { type: 'stat_threshold', value: '5+ Passes Defended', displayText: '5+ Pass Def', compatiblePositions: ['DEF'], statField: 'passesDefended', threshold: 5 },
  { type: 'stat_threshold', value: '10+ Passes Defended', displayText: '10+ Pass Def', compatiblePositions: ['DEF'], statField: 'passesDefended', threshold: 10 },
  // Cross-position rare
  { type: 'stat_threshold', value: '100+ Rush Yds (WR)', displayText: 'WR w/ 100+ Rush Yds', compatiblePositions: ['WR'], statField: 'rushingYards', threshold: 100 },
];
```

- [ ] **Step 4: Implement areCompatibleCriteria function**

```typescript
export function areCompatibleCriteria(
  criteria1: { type: string; value: string },
  criteria2: { type: string; value: string }
): boolean {
  // Only check compatibility when one is position and other is stat_threshold
  const pos = criteria1.type === 'position' ? criteria1 : criteria2.type === 'position' ? criteria2 : null;
  const stat = criteria1.type === 'stat_threshold' ? criteria1 : criteria2.type === 'stat_threshold' ? criteria2 : null;
  if (!pos || !stat) return true; // Non position+stat combos are always compatible

  const statDef = STAT_CRITERIA.find(s => s.value === stat.value);
  if (!statDef) return true;
  return statDef.compatiblePositions.includes(pos.value);
}
```

- [ ] **Step 5: Update puzzle generation to check compatibility**

In `generateDailyPuzzle` / `pickCriteria`, after selecting row and column criteria, validate each cell's row+column pair passes `areCompatibleCriteria`. If incompatible, re-roll the criteria selection.

- [ ] **Step 6: Rebuild buildStatThresholdIndex to use expanded criteria**

Replace `buildStatThresholdIndex` to dynamically build from STAT_CRITERIA array instead of hardcoded thresholds. Loop through STAT_CRITERIA and for each player stat record, check all thresholds.

- [ ] **Step 7: Run all tests**

Run: `npx tsc --noEmit && npx jest --no-coverage`
Expected: 0 TS errors, all tests pass

- [ ] **Step 8: Commit**

```bash
git add src/services/games/grid-engine.ts src/services/games/grid-engine.test.ts
git commit -m "feat: Grid 50 stat thresholds with position compatibility matrix"
```

---

### Task 5: Grid & Stat Stack — Year Selection in Player Search

**Files:**
- Modify: `src/components/games/player-search.tsx`
- Modify: `src/services/data/cfbd-cache.ts` (add getPlayerSeasons getter)
- Modify: `src/app/games/grid.tsx`
- Modify: `src/app/games/stat-stack.tsx`

- [ ] **Step 1: Add getPlayerSeasons to cache**

Add to `src/services/data/cfbd-cache.ts`:
```typescript
export function getPlayerSeasons(playerName: string): number[] {
  const name = playerName.toLowerCase();
  const seasons = playerStats
    .filter(s => s.player.toLowerCase() === name)
    .map(s => s.season);
  return [...new Set(seasons)].sort();
}
```

- [ ] **Step 2: Update PlayerSearch to show active years and allow selection**

Modify `src/components/games/player-search.tsx`:
- Add `showYearSelector?: boolean` prop
- After player selection, if `showYearSelector` is true, show dropdown of active seasons
- Call `getPlayerSeasons(playerName)` to populate dropdown
- Final callback includes both player and selected year: `onSelectPlayer(player, year)`
- In search results, show years in parentheses: "Derrick Henry - RB - Alabama (2013-2015)"

- [ ] **Step 3: Update Grid screen to pass year with guess**

Modify `src/app/games/grid.tsx`:
- Enable year selector on PlayerSearch
- When player+year selected, pass to submitGuess with year context
- Grid validation checks the specific season stats against threshold

- [ ] **Step 4: Update Stat Stack to support year selection**

Modify `src/app/games/stat-stack.tsx`:
- For open (non-year-locked) rows: show year selector after player pick
- For year-locked rows: auto-set year, no dropdown
- Pass selected year when submitting pick so stat value comes from correct season

- [ ] **Step 5: Run all tests**

Run: `npx tsc --noEmit && npx jest --no-coverage`
Expected: 0 TS errors, all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/games/player-search.tsx src/services/data/cfbd-cache.ts src/app/games/grid.tsx src/app/games/stat-stack.tsx
git commit -m "feat: year selection in player search for Grid and Stat Stack"
```

---

### Task 6: Stat Stack — Mixed Year-Locked and Open Constraints

**Files:**
- Modify: `src/services/games/stat-stack-engine.ts:55-71` (CONSTRAINT_TEMPLATES)
- Test: `src/services/games/stat-stack-engine.test.ts`

- [ ] **Step 1: Write failing test for year-locked constraints**

Add to `src/services/games/stat-stack-engine.test.ts`:
```typescript
describe('generateStatStackPuzzle year-locked constraints', () => {
  it('produces a mix of locked and open year constraints', () => {
    const puzzle = generateStatStackPuzzle('2025-03-12');
    const lockedRows = puzzle.constraints.filter((c: any) => c.lockedYear);
    const openRows = puzzle.constraints.filter((c: any) => !c.lockedYear);
    expect(lockedRows.length).toBeGreaterThan(0);
    expect(openRows.length).toBeGreaterThan(0);
    expect(lockedRows.length + openRows.length).toBe(5);
  });

  it('locked year constraints specify a valid season year', () => {
    const puzzle = generateStatStackPuzzle('2025-03-12');
    for (const c of puzzle.constraints.filter((c: any) => c.lockedYear)) {
      expect(c.lockedYear).toBeGreaterThanOrEqual(2003);
      expect(c.lockedYear).toBeLessThanOrEqual(2024);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/games/stat-stack-engine.test.ts -v --testNamePattern="year-locked"`
Expected: FAIL

- [ ] **Step 3: Add year-locked constraint templates**

Add to CONSTRAINT_TEMPLATES:
```typescript
// Year-locked constraints
{ id: 'year_2008', description: 'Player from the 2008 season', lockedYear: 2008 },
{ id: 'year_2012', description: 'Player from the 2012 season', lockedYear: 2012 },
{ id: 'year_2015', description: 'Player from the 2015 season', lockedYear: 2015 },
{ id: 'year_2019', description: 'Player from the 2019 season', lockedYear: 2019 },
{ id: 'year_2023', description: 'Player from the 2023 season', lockedYear: 2023 },
{ id: 'year_pre2010', description: 'Player from before 2010', lockedYear: -2009 }, // negative = "up to"
{ id: 'year_2020plus', description: 'Player from 2020 or later', lockedYear: 2020 },
```

Update `generateStatStackPuzzle` to ensure 2-3 locked + 2-3 open per puzzle using seeded RNG.

- [ ] **Step 4: Run tests**

Run: `npx jest src/services/games/stat-stack-engine.test.ts -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/games/stat-stack-engine.ts src/services/games/stat-stack-engine.test.ts
git commit -m "feat: Stat Stack mixed year-locked and open constraints"
```

---

## Chunk 2: UI Upgrades

### Task 7: Team Logo Component & Player Search Upgrade

**Files:**
- Create: `src/components/ui/team-logo.tsx`
- Modify: `src/components/games/player-search.tsx`

- [ ] **Step 1: Create TeamLogo component**

```typescript
// src/components/ui/team-logo.tsx
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { getTeamLogo } from '@/services/data/cfbd-cache';

interface TeamLogoProps {
  school: string;
  size?: number;
  style?: any;
}

export function TeamLogo({ school, size = 24, style }: TeamLogoProps) {
  const logoUrl = getTeamLogo(school);
  if (!logoUrl) {
    return <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }, style]} />;
  }
  return (
    <Image
      source={{ uri: logoUrl }}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: '#2F2F52' },
});
```

- [ ] **Step 2: Integrate logos into PlayerSearch results**

Modify `src/components/games/player-search.tsx`:
- Import TeamLogo
- Add `<TeamLogo school={item.school} size={20} />` before school name in results
- Add player headshot URL support (ESPN CDN fallback to position icon)

- [ ] **Step 3: Run tsc**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/team-logo.tsx src/components/games/player-search.tsx
git commit -m "feat: TeamLogo component + logos in player search results"
```

---

### Task 8: Grid UI — Logos in Criteria Headers + Cell Animations

**Files:**
- Modify: `src/app/games/grid.tsx`
- Modify: `src/lib/animations.ts`

- [ ] **Step 1: Add cell flip animation to animations.ts**

```typescript
export function flipCard(animatedValue: Animated.Value, toValue: number, duration = 300) {
  return Animated.spring(animatedValue, {
    toValue,
    friction: 8,
    tension: 10,
    useNativeDriver: true,
  });
}
```

- [ ] **Step 2: Update Grid screen with logo headers and cell animations**

Modify `src/app/games/grid.tsx`:
- Import TeamLogo
- In criteria header cells: show team logo for school criteria, conference badge for conference criteria
- Wrap grid cells in Animated.View with flip animation on guess
- Green glow border for correct, red flash for incorrect
- Score counter uses rolling number animation

- [ ] **Step 3: Add rarity glow effects**

When a cell answer has a high rarity score:
- Legendary (100): Gold pulsing border + gold particle burst
- Epic (80): Purple shimmer border
- Rare (60): Blue glow border

- [ ] **Step 4: Run tsc**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/app/games/grid.tsx src/lib/animations.ts
git commit -m "feat: Grid UI logos in headers + cell flip animations + rarity glows"
```

---

### Task 9: Stat Stack UI — Team Branding + Ticker Styling

**Files:**
- Modify: `src/app/games/stat-stack.tsx`

- [ ] **Step 1: Add team logos to pick rows**

- Each filled pick row shows the team logo next to the player name
- Category banner gets dynamic gradient background using game accent color
- Running total uses animated counter (rolling number)

- [ ] **Step 2: Add sports ticker styling**

- Constraint rows styled like sports ticker cards
- Stat values displayed with team color accent bars
- Transfer portal button gets a portal-swirl icon animation

- [ ] **Step 3: Add completion celebration**

- High percentile (90+): confetti animation
- Score reveal: rolling number animation with percentile badge

- [ ] **Step 4: Run tsc**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/app/games/stat-stack.tsx
git commit -m "feat: Stat Stack UI team logos + ticker styling + celebrations"
```

---

### Task 10: Home Screen Game Cards & Theme Polish

**Files:**
- Modify: `src/app/(tabs)/_layout.tsx`
- Modify: `src/lib/theme.ts`
- Modify: `src/app/(tabs)/predict.tsx` (if game hub lives here)

- [ ] **Step 1: Upgrade game card styling**

- Gradient backgrounds using game-specific accent colors (expo-linear-gradient already installed)
- Team logo watermarks as subtle background elements
- Daily streak indicator badge
- Difficulty/completion indicators

- [ ] **Step 2: Polish theme typography**

- Tighter section headers with gold accent underlines
- Consistent card padding and border radius
- Add rarity border glow utility to theme

- [ ] **Step 3: Game-specific chrome accents**

- Film Room: film strip border/divider elements
- Grid: LED-dot style for score display
- Stat Stack: ticker-tape top border
- Subtle, not overwhelming

- [ ] **Step 4: Run tsc and tests**

Run: `npx tsc --noEmit && npx jest --no-coverage`
Expected: 0 TS errors, all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/ src/lib/theme.ts
git commit -m "feat: upgraded game cards with gradients + theme polish"
```
