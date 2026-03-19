# Sprint 3: Conference Clash + Dynasty Builder — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build four playable Conference Clash sub-games (Blind Resume, Stat Line Sleuth, Roster Roulette, Coach's Film Room) and a functional Dynasty Builder with salary cap, roster management, and matchup simulation.

**Architecture:** Pure TypeScript game engines (matching existing grid-engine.ts / stat-stack-engine.ts pattern), Zustand stores, and React Native screens. Mock data pools that mirror CFBD API shapes for offline play. No backend dependency — engines are self-contained with deterministic seeded puzzle generation.

**Tech Stack:** TypeScript, React Native, Zustand, Expo Router, existing theme/component system

---

## Existing Patterns to Follow

All new code must match these established conventions:

- **Engine files**: `src/services/games/<name>-engine.ts` — pure functions, no side effects, return new state objects
- **Store files**: `src/stores/<name>-store.ts` — Zustand `create<Store>((set, get) => ({...}))` pattern
- **Screen files**: `src/app/games/<name>.tsx` — React Native ScrollView with StyleSheet, imports from `@/lib/theme`
- **Types**: Added to `src/types/index.ts` — interfaces and union types, no classes
- **Components**: `src/components/games/<name>.tsx` — functional components with StyleSheet
- **Imports**: `@/types`, `@/lib/theme`, `@/components/ui/*`, `@/services/games/*`, `@/stores/*`
- **Styling**: `colors`, `spacing`, `typography`, `borderRadius`, `shadows` from theme.ts

---

## Task 1: Conference Clash Types

**Files:**
- Modify: `src/types/index.ts` (append after existing types)

**Step 1: Add Conference Clash types to the type definitions file**

Append these types after the existing `LeaderboardEntry` interface at the end of `src/types/index.ts`:

```typescript
// --- Conference Clash ---

export type ClashGameMode = 'blind_resume' | 'stat_line_sleuth' | 'roster_roulette' | 'film_room';

export interface BlindResumeRound {
  teamId: string;
  year: number;
  anonymizedStats: {
    wins: number;
    losses: number;
    pointsScored: number;
    pointsAllowed: number;
    totalOffenseYpg: number;
    totalDefenseYpg: number;
    strengthOfSchedule: number;
  };
  answer: { team: string; year: number };
}

export interface BlindResumeGameState {
  rounds: BlindResumeRound[];
  currentRound: number;
  guessesPerRound: number;
  guessesUsed: number;
  score: number;
  results: ('correct' | 'incorrect' | 'pending')[];
  isComplete: boolean;
  startTime: number;
}

export interface StatLineSleuthRound {
  playerId: string;
  statLine: Record<string, number>;
  hints: SleuthHint[];
  answer: { playerName: string; year: number };
}

export interface SleuthHint {
  level: 1 | 2 | 3;
  text: string;
  revealedAt: number; // seconds after round start
}

export interface StatLineSleuthGameState {
  rounds: StatLineSleuthRound[];
  currentRound: number;
  hintsRevealed: number;
  score: number;
  results: ('correct' | 'incorrect' | 'pending')[];
  isComplete: boolean;
  startTime: number;
  roundStartTime: number;
}

export interface RosterRouletteGameState {
  school: string;
  year: number;
  validPlayers: string[];
  guessedPlayers: string[];
  score: number;
  timeRemainingMs: number;
  isComplete: boolean;
  startTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FilmRoomRound {
  description: string;
  options: { team: string; opponent: string; year: number; label: string }[];
  correctIndex: number;
}

export interface FilmRoomGameState {
  rounds: FilmRoomRound[];
  currentRound: number;
  score: number;
  results: ('correct' | 'incorrect' | 'pending')[];
  isComplete: boolean;
  startTime: number;
}

// --- Dynasty Builder ---

export interface DynastyPlayer {
  id: string;
  name: string;
  position: Position;
  school: string;
  seasons: string; // e.g. "2017-2020"
  cost: number; // salary cap cost in millions
  compositeScore: number;
  stats: SeasonStats;
  awards: Award[];
  draftInfo?: DraftInfo;
}

export interface DynastyRoster {
  program: string;
  players: Record<string, DynastyPlayer | null>; // slotKey → player
  totalCost: number;
  salaryCap: number;
}

export interface DynastySlot {
  key: string;
  position: Position;
  label: string;
}

export interface DynastyGameState {
  program: string | null;
  roster: DynastyRoster | null;
  availablePlayers: DynastyPlayer[];
  selectedSlot: string | null;
  searchQuery: string;
  isComplete: boolean;
  simulationResult: SimulationResult | null;
}

export interface SimulationResult {
  wins: number;
  losses: number;
  totalSimulations: number;
  winProbability: number;
  opponentProgram: string;
  topPerformers: { name: string; position: string; rating: number }[];
}
```

**Step 2: Commit**
```bash
git add src/types/index.ts
git commit -m "feat: add Conference Clash and Dynasty Builder type definitions"
```

---

## Task 2: Blind Resume Engine

**Files:**
- Create: `src/services/games/blind-resume-engine.ts`

**Step 1: Create the Blind Resume game engine**

This engine generates rounds of anonymized team season stats. Player guesses team + year.

```typescript
// src/services/games/blind-resume-engine.ts
import type { BlindResumeRound, BlindResumeGameState } from '@/types';

// Mock team seasons — in production these come from CFBD API
const TEAM_SEASONS: BlindResumeRound[] = [
  {
    teamId: 'alabama-2020',
    year: 2020,
    anonymizedStats: {
      wins: 13, losses: 0, pointsScored: 48.5, pointsAllowed: 19.4,
      totalOffenseYpg: 541.5, totalDefenseYpg: 294.4, strengthOfSchedule: 0.82,
    },
    answer: { team: 'Alabama', year: 2020 },
  },
  {
    teamId: 'lsu-2019',
    year: 2019,
    anonymizedStats: {
      wins: 15, losses: 0, pointsScored: 48.4, pointsAllowed: 21.2,
      totalOffenseYpg: 568.4, totalDefenseYpg: 345.8, strengthOfSchedule: 0.79,
    },
    answer: { team: 'LSU', year: 2019 },
  },
  {
    teamId: 'clemson-2018',
    year: 2018,
    anonymizedStats: {
      wins: 15, losses: 0, pointsScored: 44.3, pointsAllowed: 13.1,
      totalOffenseYpg: 527.2, totalDefenseYpg: 286.7, strengthOfSchedule: 0.71,
    },
    answer: { team: 'Clemson', year: 2018 },
  },
  {
    teamId: 'ohiostate-2014',
    year: 2014,
    anonymizedStats: {
      wins: 14, losses: 1, pointsScored: 44.8, pointsAllowed: 22.0,
      totalOffenseYpg: 511.6, totalDefenseYpg: 330.5, strengthOfSchedule: 0.75,
    },
    answer: { team: 'Ohio State', year: 2014 },
  },
  {
    teamId: 'georgia-2021',
    year: 2021,
    anonymizedStats: {
      wins: 14, losses: 1, pointsScored: 38.6, pointsAllowed: 10.2,
      totalOffenseYpg: 432.1, totalDefenseYpg: 253.0, strengthOfSchedule: 0.80,
    },
    answer: { team: 'Georgia', year: 2021 },
  },
  {
    teamId: 'michigan-2023',
    year: 2023,
    anonymizedStats: {
      wins: 15, losses: 0, pointsScored: 35.0, pointsAllowed: 11.9,
      totalOffenseYpg: 407.5, totalDefenseYpg: 264.3, strengthOfSchedule: 0.76,
    },
    answer: { team: 'Michigan', year: 2023 },
  },
  {
    teamId: 'florida-2008',
    year: 2008,
    anonymizedStats: {
      wins: 13, losses: 1, pointsScored: 43.0, pointsAllowed: 12.9,
      totalOffenseYpg: 451.3, totalDefenseYpg: 262.7, strengthOfSchedule: 0.78,
    },
    answer: { team: 'Florida', year: 2008 },
  },
  {
    teamId: 'auburn-2010',
    year: 2010,
    anonymizedStats: {
      wins: 14, losses: 0, pointsScored: 38.7, pointsAllowed: 19.2,
      totalOffenseYpg: 499.9, totalDefenseYpg: 316.7, strengthOfSchedule: 0.77,
    },
    answer: { team: 'Auburn', year: 2010 },
  },
  {
    teamId: 'tcu-2010',
    year: 2010,
    anonymizedStats: {
      wins: 13, losses: 0, pointsScored: 36.5, pointsAllowed: 12.5,
      totalOffenseYpg: 434.6, totalDefenseYpg: 274.8, strengthOfSchedule: 0.61,
    },
    answer: { team: 'TCU', year: 2010 },
  },
  {
    teamId: 'ucf-2017',
    year: 2017,
    anonymizedStats: {
      wins: 13, losses: 0, pointsScored: 43.3, pointsAllowed: 19.0,
      totalOffenseYpg: 530.8, totalDefenseYpg: 343.2, strengthOfSchedule: 0.48,
    },
    answer: { team: 'UCF', year: 2017 },
  },
  {
    teamId: 'oklahoma-2008',
    year: 2008,
    anonymizedStats: {
      wins: 12, losses: 2, pointsScored: 54.0, pointsAllowed: 17.0,
      totalOffenseYpg: 547.2, totalDefenseYpg: 310.1, strengthOfSchedule: 0.74,
    },
    answer: { team: 'Oklahoma', year: 2008 },
  },
  {
    teamId: 'alabama-2011',
    year: 2011,
    anonymizedStats: {
      wins: 12, losses: 1, pointsScored: 34.8, pointsAllowed: 8.2,
      totalOffenseYpg: 413.3, totalDefenseYpg: 183.6, strengthOfSchedule: 0.83,
    },
    answer: { team: 'Alabama', year: 2011 },
  },
];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (state >>> 0) / 0xFFFFFFFF;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function shuffleWithRng<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateBlindResumeGame(dateStr: string, roundCount: number = 10): BlindResumeGameState {
  const rng = seededRandom(dateToSeed(dateStr + '-blind-resume'));
  const shuffled = shuffleWithRng(TEAM_SEASONS, rng);
  const rounds = shuffled.slice(0, Math.min(roundCount, shuffled.length));

  return {
    rounds,
    currentRound: 0,
    guessesPerRound: 3,
    guessesUsed: 0,
    score: 0,
    results: rounds.map(() => 'pending' as const),
    isComplete: false,
    startTime: Date.now(),
  };
}

export function submitBlindResumeGuess(
  state: BlindResumeGameState,
  teamGuess: string,
  yearGuess: number
): BlindResumeGameState {
  if (state.isComplete) return state;

  const round = state.rounds[state.currentRound];
  const isTeamCorrect = teamGuess.toLowerCase() === round.answer.team.toLowerCase();
  const isYearCorrect = yearGuess === round.answer.year;
  const isCorrect = isTeamCorrect && isYearCorrect;

  const newGuessesUsed = state.guessesUsed + 1;

  if (isCorrect) {
    const pointsForGuess = state.guessesPerRound - state.guessesUsed; // fewer guesses = more points
    const newResults = [...state.results];
    newResults[state.currentRound] = 'correct';

    const nextRound = state.currentRound + 1;
    const isComplete = nextRound >= state.rounds.length;

    return {
      ...state,
      score: state.score + (pointsForGuess * 10),
      guessesUsed: 0,
      currentRound: isComplete ? state.currentRound : nextRound,
      results: newResults,
      isComplete,
    };
  }

  if (newGuessesUsed >= state.guessesPerRound) {
    const newResults = [...state.results];
    newResults[state.currentRound] = 'incorrect';

    const nextRound = state.currentRound + 1;
    const isComplete = nextRound >= state.rounds.length;

    return {
      ...state,
      guessesUsed: 0,
      currentRound: isComplete ? state.currentRound : nextRound,
      results: newResults,
      isComplete,
    };
  }

  return { ...state, guessesUsed: newGuessesUsed };
}
```

**Step 2: Commit**
```bash
git add src/services/games/blind-resume-engine.ts
git commit -m "feat: add Blind Resume game engine with mock team season data"
```

---

## Task 3: Stat Line Sleuth Engine

**Files:**
- Create: `src/services/games/stat-line-sleuth-engine.ts`

**Step 1: Create the Stat Line Sleuth engine**

```typescript
// src/services/games/stat-line-sleuth-engine.ts
import type { StatLineSleuthRound, StatLineSleuthGameState, SleuthHint } from '@/types';

const SLEUTH_ROUNDS: StatLineSleuthRound[] = [
  {
    playerId: 'joe-burrow-2019-lsu-bama',
    statLine: { completions: 31, attempts: 39, passingYards: 393, passingTDs: 3, rushingYards: 14 },
    hints: [
      { level: 1, text: 'SEC Quarterback', revealedAt: 0 },
      { level: 2, text: 'vs Alabama, 2019', revealedAt: 10 },
      { level: 3, text: 'LSU', revealedAt: 20 },
    ],
    answer: { playerName: 'Joe Burrow', year: 2019 },
  },
  {
    playerId: 'derrick-henry-2015-lsu',
    statLine: { rushingAttempts: 38, rushingYards: 210, rushingTDs: 3, receivingYards: 0, fumbles: 0 },
    hints: [
      { level: 1, text: 'SEC Running Back', revealedAt: 0 },
      { level: 2, text: 'vs LSU, 2015', revealedAt: 10 },
      { level: 3, text: 'Alabama', revealedAt: 20 },
    ],
    answer: { playerName: 'Derrick Henry', year: 2015 },
  },
  {
    playerId: 'lamar-jackson-2016-cuse',
    statLine: { completions: 20, attempts: 31, passingYards: 411, passingTDs: 2, rushingYards: 199, rushingTDs: 4 },
    hints: [
      { level: 1, text: 'ACC Quarterback', revealedAt: 0 },
      { level: 2, text: 'vs Syracuse, 2016', revealedAt: 10 },
      { level: 3, text: 'Louisville', revealedAt: 20 },
    ],
    answer: { playerName: 'Lamar Jackson', year: 2016 },
  },
  {
    playerId: 'devonta-smith-2020-osu',
    statLine: { receptions: 12, receivingYards: 215, receivingTDs: 3, rushingYards: 0, targets: 15 },
    hints: [
      { level: 1, text: 'SEC Wide Receiver', revealedAt: 0 },
      { level: 2, text: 'CFP Championship, 2020', revealedAt: 10 },
      { level: 3, text: 'Alabama', revealedAt: 20 },
    ],
    answer: { playerName: 'DeVonta Smith', year: 2020 },
  },
  {
    playerId: 'cam-newton-2010-sec',
    statLine: { completions: 18, attempts: 30, passingYards: 265, passingTDs: 2, rushingYards: 188, rushingTDs: 3 },
    hints: [
      { level: 1, text: 'SEC Quarterback', revealedAt: 0 },
      { level: 2, text: 'SEC Championship, 2010', revealedAt: 10 },
      { level: 3, text: 'Auburn', revealedAt: 20 },
    ],
    answer: { playerName: 'Cam Newton', year: 2010 },
  },
  {
    playerId: 'johnny-manziel-2012-bama',
    statLine: { completions: 24, attempts: 31, passingYards: 253, passingTDs: 2, rushingYards: 92, rushingTDs: 2 },
    hints: [
      { level: 1, text: 'SEC Quarterback', revealedAt: 0 },
      { level: 2, text: 'vs #1 Alabama, 2012', revealedAt: 10 },
      { level: 3, text: 'Texas A&M', revealedAt: 20 },
    ],
    answer: { playerName: 'Johnny Manziel', year: 2012 },
  },
  {
    playerId: 'vince-young-2006-rose',
    statLine: { completions: 30, attempts: 40, passingYards: 267, passingTDs: 0, rushingYards: 200, rushingTDs: 3 },
    hints: [
      { level: 1, text: 'Big 12 Quarterback', revealedAt: 0 },
      { level: 2, text: 'Rose Bowl / BCS Championship, 2005 season', revealedAt: 10 },
      { level: 3, text: 'Texas', revealedAt: 20 },
    ],
    answer: { playerName: 'Vince Young', year: 2005 },
  },
  {
    playerId: 'reggie-bush-2005-fresno',
    statLine: { rushingAttempts: 23, rushingYards: 513, rushingTDs: 2, receptions: 1, receivingYards: 68 },
    hints: [
      { level: 1, text: 'Pac-12 Running Back', revealedAt: 0 },
      { level: 2, text: 'vs Fresno State, 2005', revealedAt: 10 },
      { level: 3, text: 'USC', revealedAt: 20 },
    ],
    answer: { playerName: 'Reggie Bush', year: 2005 },
  },
];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (state >>> 0) / 0xFFFFFFFF;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function shuffleWithRng<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateSleuthGame(dateStr: string, roundCount: number = 5): StatLineSleuthGameState {
  const rng = seededRandom(dateToSeed(dateStr + '-sleuth'));
  const shuffled = shuffleWithRng(SLEUTH_ROUNDS, rng);
  const rounds = shuffled.slice(0, Math.min(roundCount, shuffled.length));

  return {
    rounds,
    currentRound: 0,
    hintsRevealed: 1, // hint level 1 revealed at start
    score: 0,
    results: rounds.map(() => 'pending' as const),
    isComplete: false,
    startTime: Date.now(),
    roundStartTime: Date.now(),
  };
}

export function revealNextHint(state: StatLineSleuthGameState): StatLineSleuthGameState {
  if (state.isComplete) return state;
  const maxHints = state.rounds[state.currentRound].hints.length;
  if (state.hintsRevealed >= maxHints) return state;

  return { ...state, hintsRevealed: state.hintsRevealed + 1 };
}

export function submitSleuthGuess(
  state: StatLineSleuthGameState,
  playerNameGuess: string
): StatLineSleuthGameState {
  if (state.isComplete) return state;

  const round = state.rounds[state.currentRound];
  const isCorrect = playerNameGuess.toLowerCase().trim() === round.answer.playerName.toLowerCase();

  const newResults = [...state.results];
  newResults[state.currentRound] = isCorrect ? 'correct' : 'incorrect';

  // Points based on how few hints were used: 3 hints = 30, 2 = 20, 1 = 10
  const pointsEarned = isCorrect ? (4 - state.hintsRevealed) * 10 : 0;

  const nextRound = state.currentRound + 1;
  const isComplete = nextRound >= state.rounds.length;

  return {
    ...state,
    currentRound: isComplete ? state.currentRound : nextRound,
    hintsRevealed: isComplete ? state.hintsRevealed : 1,
    score: state.score + pointsEarned,
    results: newResults,
    isComplete,
    roundStartTime: isComplete ? state.roundStartTime : Date.now(),
  };
}
```

**Step 2: Commit**
```bash
git add src/services/games/stat-line-sleuth-engine.ts
git commit -m "feat: add Stat Line Sleuth engine with progressive hints"
```

---

## Task 4: Roster Roulette Engine

**Files:**
- Create: `src/services/games/roster-roulette-engine.ts`

**Step 1: Create the Roster Roulette engine**

```typescript
// src/services/games/roster-roulette-engine.ts
import type { RosterRouletteGameState } from '@/types';

// Mock rosters — in production these come from CFBD API
const TEAM_ROSTERS: Record<string, { year: number; players: string[] }[]> = {
  'Alabama': [
    {
      year: 2020,
      players: [
        'Mac Jones', 'Najee Harris', 'DeVonta Smith', 'Jaylen Waddle', 'Alex Leatherwood',
        'Patrick Surtain II', 'Dylan Moses', 'Christian Barmore', 'Landon Dickerson',
        'Evan Neal', 'John Metchie III', 'Brian Robinson Jr', 'Malachi Moore',
        'Daniel Wright', 'Josh Jobe', 'Christopher Allen', 'Phidarian Mathis',
        'Slade Bolden', 'Jahleel Billingsley', 'Will Anderson Jr',
      ],
    },
  ],
  'Ohio State': [
    {
      year: 2020,
      players: [
        'Justin Fields', 'Trey Sermon', 'Chris Olave', 'Garrett Wilson', 'Wyatt Davis',
        'Josh Myers', 'Shaun Wade', 'Pete Werner', 'Tommy Togiai', 'Baron Browning',
        'Thayer Munford', 'Jeremy Ruckert', 'Master Teague III', 'Haskell Garrett',
        'Tuf Borland', 'Luke Farrell', 'Jonathon Cooper', 'Justin Hilliard',
        'Jameson Williams', 'Zach Harrison',
      ],
    },
  ],
  'LSU': [
    {
      year: 2019,
      players: [
        'Joe Burrow', 'Clyde Edwards-Helaire', "Ja'Marr Chase", 'Justin Jefferson',
        'Terrace Marshall Jr', 'Grant Delpit', 'Kristian Fulton', 'K\'Lavon Chaisson',
        'Patrick Queen', 'Lloyd Cushenberry III', 'Damien Lewis', 'Thaddeus Moss',
        'Derek Stingley Jr', 'Jacoby Stevens', 'Racey McMath', 'Tyler Shelvin',
        'Austin Deculus', 'Saahdiq Charles', 'Kary Vincent Jr', 'Michael Divinity Jr',
      ],
    },
  ],
  'Clemson': [
    {
      year: 2018,
      players: [
        'Trevor Lawrence', 'Travis Etienne', 'Tee Higgins', 'Justyn Ross',
        'Clelin Ferrell', 'Christian Wilkins', 'Austin Bryant', 'Dexter Lawrence',
        'Trayvon Mullen', 'Mitch Hyatt', 'A.J. Terrell', 'Isaiah Simmons',
        'Hunter Renfrow', 'Amari Rodgers', 'John Simpson', 'Gage Cervenka',
        'Nolan Turner', 'K\'Von Wallace', 'Tanner Muse', 'Xavier Thomas',
      ],
    },
  ],
  'Georgia': [
    {
      year: 2021,
      players: [
        'Stetson Bennett', 'James Cook', 'Brock Bowers', 'George Pickens',
        'Nakobe Dean', 'Jordan Davis', 'Travon Walker', 'Lewis Cine',
        'Derion Kendrick', 'Quay Walker', 'Devonte Wyatt', 'Jamaree Salyer',
        'Ladd McConkey', 'Kelee Ringo', 'Jalen Carter', 'Nolan Smith',
        'Channing Tindall', 'Robert Beal', 'Broderick Jones', 'Kenny McIntosh',
      ],
    },
  ],
};

const DIFFICULTY_SETTINGS = {
  easy: { programs: ['Alabama', 'Ohio State', 'Clemson'], timeMs: 60000 },
  medium: { programs: ['Georgia', 'LSU'], timeMs: 60000 },
  hard: { programs: ['Alabama', 'Ohio State', 'LSU', 'Clemson', 'Georgia'], timeMs: 45000 },
};

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (state >>> 0) / 0xFFFFFFFF;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateRosterRouletteGame(
  dateStr: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): RosterRouletteGameState {
  const rng = seededRandom(dateToSeed(dateStr + '-roulette'));
  const schools = Object.keys(TEAM_ROSTERS);
  const schoolIndex = Math.floor(rng() * schools.length);
  const school = schools[schoolIndex];
  const roster = TEAM_ROSTERS[school][0];

  return {
    school,
    year: roster.year,
    validPlayers: roster.players.map(p => p.toLowerCase()),
    guessedPlayers: [],
    score: 0,
    timeRemainingMs: DIFFICULTY_SETTINGS[difficulty].timeMs,
    isComplete: false,
    startTime: Date.now(),
    difficulty,
  };
}

export function submitRosterGuess(
  state: RosterRouletteGameState,
  playerName: string
): RosterRouletteGameState {
  if (state.isComplete) return state;

  const normalized = playerName.toLowerCase().trim();
  const alreadyGuessed = state.guessedPlayers.includes(normalized);
  if (alreadyGuessed) return state;

  const isValid = state.validPlayers.includes(normalized);
  if (!isValid) return state;

  const newGuessed = [...state.guessedPlayers, normalized];
  const isComplete = newGuessed.length >= state.validPlayers.length;

  return {
    ...state,
    guessedPlayers: newGuessed,
    score: state.score + 10,
    isComplete,
  };
}

export function endRosterRoulette(state: RosterRouletteGameState): RosterRouletteGameState {
  return { ...state, isComplete: true, timeRemainingMs: 0 };
}
```

**Step 2: Commit**
```bash
git add src/services/games/roster-roulette-engine.ts
git commit -m "feat: add Roster Roulette engine with timed roster recall"
```

---

## Task 5: Coach's Film Room Engine

**Files:**
- Create: `src/services/games/film-room-engine.ts`

**Step 1: Create the Film Room engine**

```typescript
// src/services/games/film-room-engine.ts
import type { FilmRoomRound, FilmRoomGameState } from '@/types';

const FILM_ROOM_ROUNDS: FilmRoomRound[] = [
  {
    description: 'Down 28-3 in the second half, the offense orchestrated a 25-point comeback to win in overtime, completing the largest comeback in championship game history.',
    options: [
      { team: 'New England', opponent: 'Atlanta', year: 2017, label: 'Super Bowl LI' },
      { team: 'Ohio State', opponent: 'Oregon', year: 2015, label: 'CFP Championship' },
      { team: 'Alabama', opponent: 'Georgia', year: 2018, label: 'CFP Championship' },
      { team: 'Auburn', opponent: 'Alabama', year: 2010, label: 'Iron Bowl' },
    ],
    correctIndex: 0,
  },
  {
    description: 'Trailing 31-27 with seconds left, the QB scrambled and threw a 25-yard jump ball to the end zone. His receiver leaped over two defenders for the game-winning touchdown as time expired.',
    options: [
      { team: 'Michigan', opponent: 'Ohio State', year: 2016, label: 'The Game' },
      { team: 'Georgia', opponent: 'Oklahoma', year: 2018, label: 'Rose Bowl' },
      { team: 'Boise State', opponent: 'Oklahoma', year: 2007, label: 'Fiesta Bowl' },
      { team: 'Alabama', opponent: 'Auburn', year: 2014, label: 'Iron Bowl' },
    ],
    correctIndex: 1,
  },
  {
    description: 'A missed 56-yard field goal attempt was returned 109 yards for a touchdown on the final play of the game to beat the #1 ranked team, ending their 11-game winning streak in the rivalry.',
    options: [
      { team: 'Auburn', opponent: 'Alabama', year: 2013, label: 'Kick Six - Iron Bowl' },
      { team: 'Michigan', opponent: 'Ohio State', year: 2015, label: 'The Game' },
      { team: 'Stanford', opponent: 'Cal', year: 2007, label: 'The Band Play' },
      { team: 'LSU', opponent: 'Alabama', year: 2010, label: 'Tiger Stadium' },
    ],
    correctIndex: 0,
  },
  {
    description: 'The #14 ranked team executed a Statue of Liberty play on the two-point conversion in overtime to upset the #7 team in a BCS bowl game, completing a storybook season for the mid-major program.',
    options: [
      { team: 'Utah', opponent: 'Alabama', year: 2009, label: 'Sugar Bowl' },
      { team: 'Boise State', opponent: 'Oklahoma', year: 2007, label: 'Fiesta Bowl' },
      { team: 'UCF', opponent: 'Auburn', year: 2018, label: 'Peach Bowl' },
      { team: 'TCU', opponent: 'Wisconsin', year: 2011, label: 'Rose Bowl' },
    ],
    correctIndex: 1,
  },
  {
    description: 'The quarterback threw for 5 touchdowns in the first half, leading a 42-point halftime lead. The team won 63-14 in what was the most dominant CFP semifinal performance to date.',
    options: [
      { team: 'Clemson', opponent: 'Ohio State', year: 2017, label: 'Fiesta Bowl' },
      { team: 'LSU', opponent: 'Oklahoma', year: 2019, label: 'Peach Bowl' },
      { team: 'Alabama', opponent: 'Michigan State', year: 2015, label: 'Cotton Bowl' },
      { team: 'Ohio State', opponent: 'Wisconsin', year: 2014, label: 'B1G Championship' },
    ],
    correctIndex: 1,
  },
  {
    description: 'With 1 second left, the quarterback found his tight end on a 4th-and-goal fade route for the touchdown, capping a 15-play, 87-yard drive to win the national championship in his second start.',
    options: [
      { team: 'Alabama', opponent: 'Georgia', year: 2018, label: 'CFP Championship' },
      { team: 'Clemson', opponent: 'Alabama', year: 2017, label: 'CFP Championship' },
      { team: 'Ohio State', opponent: 'Oregon', year: 2015, label: 'CFP Championship' },
      { team: 'Florida State', opponent: 'Auburn', year: 2014, label: 'BCS Championship' },
    ],
    correctIndex: 0,
  },
  {
    description: 'The true freshman quarterback led two fourth-quarter touchdown drives, including a 22-yard run with 2:16 remaining, to rally past the defending national champions and complete a three-quarterback journey to the title.',
    options: [
      { team: 'Ohio State', opponent: 'Oregon', year: 2015, label: 'CFP Championship' },
      { team: 'Alabama', opponent: 'Clemson', year: 2016, label: 'CFP Championship' },
      { team: 'Clemson', opponent: 'Alabama', year: 2019, label: 'CFP Championship' },
      { team: 'LSU', opponent: 'Clemson', year: 2020, label: 'CFP Championship' },
    ],
    correctIndex: 0,
  },
  {
    description: 'The 4-TD underdog scored 31 unanswered points in the second half, led by a walk-on quarterback who was a former baseball player, winning 43-42 in the highest-scoring regulation game in the rivalry\'s history.',
    options: [
      { team: 'Texas A&M', opponent: 'Alabama', year: 2012, label: 'Bryant-Denny' },
      { team: 'Purdue', opponent: 'Ohio State', year: 2018, label: 'Ross-Ade' },
      { team: 'Iowa State', opponent: 'Oklahoma', year: 2017, label: 'Jack Trice' },
      { team: 'App State', opponent: 'Michigan', year: 2007, label: 'Big House' },
    ],
    correctIndex: 1,
  },
];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (state >>> 0) / 0xFFFFFFFF;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function shuffleWithRng<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateFilmRoomGame(dateStr: string, roundCount: number = 5): FilmRoomGameState {
  const rng = seededRandom(dateToSeed(dateStr + '-film-room'));
  const shuffled = shuffleWithRng(FILM_ROOM_ROUNDS, rng);
  const rounds = shuffled.slice(0, Math.min(roundCount, shuffled.length));

  return {
    rounds,
    currentRound: 0,
    score: 0,
    results: rounds.map(() => 'pending' as const),
    isComplete: false,
    startTime: Date.now(),
  };
}

export function submitFilmRoomGuess(
  state: FilmRoomGameState,
  selectedIndex: number
): FilmRoomGameState {
  if (state.isComplete) return state;

  const round = state.rounds[state.currentRound];
  const isCorrect = selectedIndex === round.correctIndex;

  const newResults = [...state.results];
  newResults[state.currentRound] = isCorrect ? 'correct' : 'incorrect';

  const nextRound = state.currentRound + 1;
  const isComplete = nextRound >= state.rounds.length;

  return {
    ...state,
    currentRound: isComplete ? state.currentRound : nextRound,
    score: state.score + (isCorrect ? 20 : 0),
    results: newResults,
    isComplete,
  };
}
```

**Step 2: Commit**
```bash
git add src/services/games/film-room-engine.ts
git commit -m "feat: add Coach's Film Room engine with iconic CFB moments"
```

---

## Task 6: Dynasty Builder Engine

**Files:**
- Create: `src/services/games/dynasty-engine.ts`

**Step 1: Create the Dynasty Builder engine with salary cap and simulation**

```typescript
// src/services/games/dynasty-engine.ts
import type { DynastyPlayer, DynastyRoster, DynastySlot, DynastyGameState, SimulationResult, Position, Award } from '@/types';

export const SALARY_CAP = 100; // $100M

export const DYNASTY_SLOTS: DynastySlot[] = [
  { key: 'qb1', position: 'QB', label: 'QB' },
  { key: 'rb1', position: 'RB', label: 'RB1' },
  { key: 'rb2', position: 'RB', label: 'RB2' },
  { key: 'wr1', position: 'WR', label: 'WR1' },
  { key: 'wr2', position: 'WR', label: 'WR2' },
  { key: 'wr3', position: 'WR', label: 'WR3' },
  { key: 'te1', position: 'TE', label: 'TE' },
  { key: 'ol1', position: 'OL', label: 'OL1' },
  { key: 'ol2', position: 'OL', label: 'OL2' },
  { key: 'ol3', position: 'OL', label: 'OL3' },
  { key: 'ol4', position: 'OL', label: 'OL4' },
  { key: 'ol5', position: 'OL', label: 'OL5' },
  { key: 'dl1', position: 'DL', label: 'DL1' },
  { key: 'dl2', position: 'DL', label: 'DL2' },
  { key: 'dl3', position: 'DL', label: 'DL3' },
  { key: 'dl4', position: 'DL', label: 'DL4' },
  { key: 'lb1', position: 'LB', label: 'LB1' },
  { key: 'lb2', position: 'LB', label: 'LB2' },
  { key: 'lb3', position: 'LB', label: 'LB3' },
  { key: 'db1', position: 'DB', label: 'DB1' },
  { key: 'db2', position: 'DB', label: 'DB2' },
  { key: 'db3', position: 'DB', label: 'DB3' },
  { key: 'db4', position: 'DB', label: 'DB4' },
  { key: 'k1', position: 'K', label: 'K' },
  { key: 'p1', position: 'P', label: 'P' },
];

// Salary pricing per game-modes-spec.md
function calculatePlayerCost(player: DynastyPlayer): number {
  let baseCost = player.compositeScore * 0.5; // composite → base millions

  // Award multipliers
  if (player.awards.includes('Heisman')) baseCost *= 2.0;
  else if (player.awards.includes('All-American')) baseCost *= 1.5;
  else if (player.awards.includes('Maxwell') || player.awards.includes('Biletnikoff') ||
           player.awards.includes('Doak Walker') || player.awards.includes('Thorpe') ||
           player.awards.includes('Butkus')) baseCost *= 1.4;

  // Draft multiplier
  if (player.draftInfo) {
    if (player.draftInfo.round === 1 && player.draftInfo.pick <= 10) baseCost *= 1.3;
    else if (player.draftInfo.round === 1) baseCost *= 1.2;
  }

  // Era discount
  const startYear = parseInt(player.seasons.split('-')[0], 10);
  if (startYear < 2000) baseCost *= 0.8;

  return Math.round(baseCost * 10) / 10; // round to 0.1M
}

// Mock player pools per program — production version fetches from CFBD
const PROGRAM_PLAYERS: Record<string, DynastyPlayer[]> = {
  'Alabama': [
    { id: 'ala-derrick-henry', name: 'Derrick Henry', position: 'RB', school: 'Alabama', seasons: '2013-2015', compositeScore: 18, stats: { gamesPlayed: 40, rushingYards: 3591, rushingTDs: 42 }, awards: ['Heisman', 'Doak Walker'], draftInfo: { year: 2016, round: 2, pick: 45, team: 'Tennessee Titans' }, cost: 0 },
    { id: 'ala-tua', name: 'Tua Tagovailoa', position: 'QB', school: 'Alabama', seasons: '2017-2019', compositeScore: 17, stats: { gamesPlayed: 32, passingYards: 7442, passingTDs: 87 }, awards: [], draftInfo: { year: 2020, round: 1, pick: 5, team: 'Miami Dolphins' }, cost: 0 },
    { id: 'ala-devonta', name: 'DeVonta Smith', position: 'WR', school: 'Alabama', seasons: '2017-2020', compositeScore: 19, stats: { gamesPlayed: 57, receivingYards: 3965, receivingTDs: 46 }, awards: ['Heisman', 'Biletnikoff'], draftInfo: { year: 2021, round: 1, pick: 10, team: 'Philadelphia Eagles' }, cost: 0 },
    { id: 'ala-julio', name: 'Julio Jones', position: 'WR', school: 'Alabama', seasons: '2008-2010', compositeScore: 16, stats: { gamesPlayed: 40, receivingYards: 2653, receivingTDs: 15 }, awards: ['All-American'], draftInfo: { year: 2011, round: 1, pick: 6, team: 'Atlanta Falcons' }, cost: 0 },
    { id: 'ala-amari', name: 'Amari Cooper', position: 'WR', school: 'Alabama', seasons: '2012-2014', compositeScore: 17, stats: { gamesPlayed: 40, receivingYards: 3463, receivingTDs: 31 }, awards: ['Biletnikoff'], draftInfo: { year: 2015, round: 1, pick: 4, team: 'Oakland Raiders' }, cost: 0 },
    { id: 'ala-najee', name: 'Najee Harris', position: 'RB', school: 'Alabama', seasons: '2017-2020', compositeScore: 15, stats: { gamesPlayed: 55, rushingYards: 3843, rushingTDs: 46 }, awards: ['All-American'], draftInfo: { year: 2021, round: 1, pick: 24, team: 'Pittsburgh Steelers' }, cost: 0 },
    { id: 'ala-mark-ingram', name: 'Mark Ingram', position: 'RB', school: 'Alabama', seasons: '2008-2010', compositeScore: 16, stats: { gamesPlayed: 39, rushingYards: 3261, rushingTDs: 42 }, awards: ['Heisman'], draftInfo: { year: 2011, round: 1, pick: 28, team: 'New Orleans Saints' }, cost: 0 },
    { id: 'ala-minkah', name: 'Minkah Fitzpatrick', position: 'DB', school: 'Alabama', seasons: '2015-2017', compositeScore: 15, stats: { gamesPlayed: 42, interceptions: 8, tackles: 159 }, awards: ['Thorpe', 'All-American'], draftInfo: { year: 2018, round: 1, pick: 11, team: 'Miami Dolphins' }, cost: 0 },
    { id: 'ala-jonathan-allen', name: 'Jonathan Allen', position: 'DL', school: 'Alabama', seasons: '2013-2016', compositeScore: 15, stats: { gamesPlayed: 55, sacks: 28.5, tackles: 188 }, awards: ['Nagurski', 'All-American'], draftInfo: { year: 2017, round: 1, pick: 17, team: 'Washington' }, cost: 0 },
    { id: 'ala-quinnen', name: 'Quinnen Williams', position: 'DL', school: 'Alabama', seasons: '2016-2018', compositeScore: 14, stats: { gamesPlayed: 29, sacks: 10, tackles: 71 }, awards: ['Outland', 'All-American'], draftInfo: { year: 2019, round: 1, pick: 3, team: 'New York Jets' }, cost: 0 },
    { id: 'ala-dont-a', name: "Dont'a Hightower", position: 'LB', school: 'Alabama', seasons: '2008-2011', compositeScore: 14, stats: { gamesPlayed: 51, sacks: 8.5, tackles: 235 }, awards: ['All-American'], draftInfo: { year: 2012, round: 1, pick: 25, team: 'New England Patriots' }, cost: 0 },
    { id: 'ala-cj-mosley', name: 'C.J. Mosley', position: 'LB', school: 'Alabama', seasons: '2010-2013', compositeScore: 15, stats: { gamesPlayed: 52, sacks: 4, tackles: 296, interceptions: 5 }, awards: ['Butkus', 'All-American'], draftInfo: { year: 2014, round: 1, pick: 17, team: 'Baltimore Ravens' }, cost: 0 },
    { id: 'ala-will-anderson', name: 'Will Anderson Jr', position: 'DL', school: 'Alabama', seasons: '2020-2022', compositeScore: 16, stats: { gamesPlayed: 40, sacks: 34.5, tackles: 204 }, awards: ['Nagurski', 'Bednarik', 'All-American'], draftInfo: { year: 2023, round: 1, pick: 3, team: 'Houston Texans' }, cost: 0 },
    { id: 'ala-surtain', name: 'Patrick Surtain II', position: 'DB', school: 'Alabama', seasons: '2018-2020', compositeScore: 14, stats: { gamesPlayed: 37, interceptions: 4, tackles: 116 }, awards: ['Thorpe', 'All-American'], draftInfo: { year: 2021, round: 1, pick: 9, team: 'Denver Broncos' }, cost: 0 },
    { id: 'ala-jalen-milroe', name: 'Jalen Milroe', position: 'QB', school: 'Alabama', seasons: '2021-2024', compositeScore: 13, stats: { gamesPlayed: 30, passingYards: 4200, passingTDs: 35, rushingYards: 1200 }, awards: [], cost: 0 },
    { id: 'ala-mac-jones', name: 'Mac Jones', position: 'QB', school: 'Alabama', seasons: '2017-2020', compositeScore: 15, stats: { gamesPlayed: 21, passingYards: 4500, passingTDs: 41 }, awards: ['All-American'], draftInfo: { year: 2021, round: 1, pick: 15, team: 'New England Patriots' }, cost: 0 },
    { id: 'ala-jc-latham', name: 'JC Latham', position: 'OL', school: 'Alabama', seasons: '2021-2023', compositeScore: 13, stats: { gamesPlayed: 35 }, awards: ['All-American'], draftInfo: { year: 2024, round: 1, pick: 7, team: 'Tennessee Titans' }, cost: 0 },
    { id: 'ala-evan-neal', name: 'Evan Neal', position: 'OL', school: 'Alabama', seasons: '2019-2021', compositeScore: 14, stats: { gamesPlayed: 40 }, awards: ['All-American'], draftInfo: { year: 2022, round: 1, pick: 7, team: 'New York Giants' }, cost: 0 },
    { id: 'ala-alex-leatherwood', name: 'Alex Leatherwood', position: 'OL', school: 'Alabama', seasons: '2017-2020', compositeScore: 13, stats: { gamesPlayed: 50 }, awards: ['Outland', 'All-American'], draftInfo: { year: 2021, round: 1, pick: 17, team: 'Las Vegas Raiders' }, cost: 0 },
    { id: 'ala-landon-dickerson', name: 'Landon Dickerson', position: 'OL', school: 'Alabama', seasons: '2016-2020', compositeScore: 13, stats: { gamesPlayed: 45 }, awards: ['All-American'], draftInfo: { year: 2021, round: 2, pick: 37, team: 'Philadelphia Eagles' }, cost: 0 },
    { id: 'ala-jedrick-wills', name: 'Jedrick Wills', position: 'OL', school: 'Alabama', seasons: '2017-2019', compositeScore: 13, stats: { gamesPlayed: 38 }, awards: ['All-American'], draftInfo: { year: 2020, round: 1, pick: 10, team: 'Cleveland Browns' }, cost: 0 },
    { id: 'ala-irv-smith', name: 'Irv Smith Jr', position: 'TE', school: 'Alabama', seasons: '2016-2018', compositeScore: 11, stats: { gamesPlayed: 38, receivingYards: 840, receivingTDs: 7 }, awards: [], draftInfo: { year: 2019, round: 2, pick: 50, team: 'Minnesota Vikings' }, cost: 0 },
    { id: 'ala-eddie-lacy', name: 'Eddie Lacy', position: 'RB', school: 'Alabama', seasons: '2009-2012', compositeScore: 13, stats: { gamesPlayed: 51, rushingYards: 2402, rushingTDs: 31 }, awards: [], draftInfo: { year: 2013, round: 2, pick: 61, team: 'Green Bay Packers' }, cost: 0 },
    { id: 'ala-leigh-tiffin', name: 'Leigh Tiffin', position: 'K', school: 'Alabama', seasons: '2006-2009', compositeScore: 10, stats: { gamesPlayed: 50 }, awards: [], cost: 0 },
    { id: 'ala-jk-scott', name: 'JK Scott', position: 'P', school: 'Alabama', seasons: '2014-2017', compositeScore: 11, stats: { gamesPlayed: 56 }, awards: ['All-American'], draftInfo: { year: 2018, round: 5, pick: 172, team: 'Green Bay Packers' }, cost: 0 },
  ],
  'Ohio State': [
    { id: 'osu-chase-young', name: 'Chase Young', position: 'DL', school: 'Ohio State', seasons: '2017-2019', compositeScore: 18, stats: { gamesPlayed: 34, sacks: 30.5, tackles: 98 }, awards: ['Nagurski', 'Bednarik', 'All-American'], draftInfo: { year: 2020, round: 1, pick: 2, team: 'Washington' }, cost: 0 },
    { id: 'osu-joey-bosa', name: 'Joey Bosa', position: 'DL', school: 'Ohio State', seasons: '2013-2015', compositeScore: 17, stats: { gamesPlayed: 36, sacks: 26, tackles: 135 }, awards: ['Nagurski', 'All-American'], draftInfo: { year: 2016, round: 1, pick: 3, team: 'San Diego Chargers' }, cost: 0 },
    { id: 'osu-ezekiel-elliott', name: 'Ezekiel Elliott', position: 'RB', school: 'Ohio State', seasons: '2013-2015', compositeScore: 17, stats: { gamesPlayed: 39, rushingYards: 3961, rushingTDs: 43 }, awards: ['All-American'], draftInfo: { year: 2016, round: 1, pick: 4, team: 'Dallas Cowboys' }, cost: 0 },
    { id: 'osu-justin-fields', name: 'Justin Fields', position: 'QB', school: 'Ohio State', seasons: '2019-2020', compositeScore: 16, stats: { gamesPlayed: 22, passingYards: 5373, passingTDs: 63 }, awards: ['All-American'], draftInfo: { year: 2021, round: 1, pick: 11, team: 'Chicago Bears' }, cost: 0 },
    { id: 'osu-chris-olave', name: 'Chris Olave', position: 'WR', school: 'Ohio State', seasons: '2018-2021', compositeScore: 15, stats: { gamesPlayed: 45, receivingYards: 2711, receivingTDs: 35 }, awards: ['Biletnikoff', 'All-American'], draftInfo: { year: 2022, round: 1, pick: 11, team: 'New Orleans Saints' }, cost: 0 },
    { id: 'osu-garrett-wilson', name: 'Garrett Wilson', position: 'WR', school: 'Ohio State', seasons: '2019-2021', compositeScore: 15, stats: { gamesPlayed: 33, receivingYards: 2213, receivingTDs: 23 }, awards: ['Biletnikoff', 'All-American'], draftInfo: { year: 2022, round: 1, pick: 10, team: 'New York Jets' }, cost: 0 },
    { id: 'osu-marshon-lattimore', name: 'Marshon Lattimore', position: 'DB', school: 'Ohio State', seasons: '2014-2016', compositeScore: 14, stats: { gamesPlayed: 27, interceptions: 4, tackles: 52 }, awards: ['All-American'], draftInfo: { year: 2017, round: 1, pick: 11, team: 'New Orleans Saints' }, cost: 0 },
    { id: 'osu-jeff-okudah', name: 'Jeff Okudah', position: 'DB', school: 'Ohio State', seasons: '2017-2019', compositeScore: 14, stats: { gamesPlayed: 35, interceptions: 3, tackles: 89 }, awards: ['All-American'], draftInfo: { year: 2020, round: 1, pick: 3, team: 'Detroit Lions' }, cost: 0 },
  ],
};

// Initialize costs for all players
for (const program of Object.values(PROGRAM_PLAYERS)) {
  for (const player of program) {
    player.cost = calculatePlayerCost(player);
  }
}

export function getAvailablePrograms(): string[] {
  return Object.keys(PROGRAM_PLAYERS);
}

export function getPlayersForProgram(program: string): DynastyPlayer[] {
  return PROGRAM_PLAYERS[program] || [];
}

export function createDynastyRoster(program: string): DynastyRoster {
  const players: Record<string, DynastyPlayer | null> = {};
  for (const slot of DYNASTY_SLOTS) {
    players[slot.key] = null;
  }

  return {
    program,
    players,
    totalCost: 0,
    salaryCap: SALARY_CAP,
  };
}

export function addPlayerToRoster(
  roster: DynastyRoster,
  slotKey: string,
  player: DynastyPlayer
): DynastyRoster | { error: string } {
  const slot = DYNASTY_SLOTS.find(s => s.key === slotKey);
  if (!slot) return { error: 'Invalid roster slot' };

  // Check position match (DB includes CB and S)
  const validPositions: Position[] = slot.position === 'DB'
    ? ['DB', 'CB', 'S']
    : [slot.position as Position];
  if (!validPositions.includes(player.position)) {
    return { error: `${player.name} is a ${player.position}, not a ${slot.position}` };
  }

  // Check salary cap
  const currentInSlot = roster.players[slotKey];
  const costDelta = player.cost - (currentInSlot?.cost || 0);
  if (roster.totalCost + costDelta > roster.salaryCap) {
    return { error: `Not enough cap space. Need $${costDelta.toFixed(1)}M, have $${(roster.salaryCap - roster.totalCost).toFixed(1)}M` };
  }

  // Check player not already in roster
  const alreadyInRoster = Object.entries(roster.players).some(
    ([key, p]) => key !== slotKey && p?.id === player.id
  );
  if (alreadyInRoster) {
    return { error: `${player.name} is already on your roster` };
  }

  const newPlayers = { ...roster.players, [slotKey]: player };
  const newCost = Object.values(newPlayers).reduce((sum, p) => sum + (p?.cost || 0), 0);

  return {
    ...roster,
    players: newPlayers,
    totalCost: Math.round(newCost * 10) / 10,
  };
}

export function removePlayerFromRoster(roster: DynastyRoster, slotKey: string): DynastyRoster {
  const newPlayers = { ...roster.players, [slotKey]: null };
  const newCost = Object.values(newPlayers).reduce((sum, p) => sum + (p?.cost || 0), 0);

  return {
    ...roster,
    players: newPlayers,
    totalCost: Math.round(newCost * 10) / 10,
  };
}

export function isRosterComplete(roster: DynastyRoster): boolean {
  return DYNASTY_SLOTS.every(slot => roster.players[slot.key] !== null);
}

// Monte Carlo matchup simulation
export function simulateMatchup(
  rosterA: DynastyRoster,
  rosterB: DynastyRoster,
  simCount: number = 1000
): SimulationResult {
  const ratingA = calculateRosterRating(rosterA);
  const ratingB = calculateRosterRating(rosterB);
  const diff = ratingA - ratingB;

  // Win probability using logistic function
  const baseProbability = 1 / (1 + Math.exp(-diff / 10));

  let wins = 0;
  for (let i = 0; i < simCount; i++) {
    // Add variance per simulation
    const randomFactor = (Math.random() - 0.5) * 0.3;
    if (Math.random() < baseProbability + randomFactor) {
      wins++;
    }
  }

  const topPerformers = Object.values(rosterA.players)
    .filter((p): p is DynastyPlayer => p !== null)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 3)
    .map(p => ({ name: p.name, position: p.position, rating: p.compositeScore }));

  return {
    wins,
    losses: simCount - wins,
    totalSimulations: simCount,
    winProbability: Math.round((wins / simCount) * 1000) / 10,
    opponentProgram: rosterB.program,
    topPerformers,
  };
}

function calculateRosterRating(roster: DynastyRoster): number {
  return Object.values(roster.players).reduce((sum, p) => sum + (p?.compositeScore || 0), 0);
}
```

**Step 2: Commit**
```bash
git add src/services/games/dynasty-engine.ts
git commit -m "feat: add Dynasty Builder engine with salary cap and matchup simulation"
```

---

## Task 7: Conference Clash Zustand Store

**Files:**
- Create: `src/stores/clash-store.ts`

**Step 1: Create the Clash store managing all 4 sub-game modes**

```typescript
// src/stores/clash-store.ts
import { create } from 'zustand';
import type {
  ClashGameMode,
  BlindResumeGameState,
  StatLineSleuthGameState,
  RosterRouletteGameState,
  FilmRoomGameState,
} from '@/types';
import { generateBlindResumeGame, submitBlindResumeGuess } from '@/services/games/blind-resume-engine';
import { generateSleuthGame, submitSleuthGuess, revealNextHint } from '@/services/games/stat-line-sleuth-engine';
import { generateRosterRouletteGame, submitRosterGuess, endRosterRoulette } from '@/services/games/roster-roulette-engine';
import { generateFilmRoomGame, submitFilmRoomGuess } from '@/services/games/film-room-engine';

interface ClashStore {
  activeMode: ClashGameMode | null;
  blindResume: BlindResumeGameState | null;
  sleuth: StatLineSleuthGameState | null;
  rosterRoulette: RosterRouletteGameState | null;
  filmRoom: FilmRoomGameState | null;

  // Navigation
  setActiveMode: (mode: ClashGameMode | null) => void;

  // Blind Resume
  startBlindResume: () => void;
  guessBlindResume: (team: string, year: number) => void;

  // Stat Line Sleuth
  startSleuth: () => void;
  guessSleuth: (playerName: string) => void;
  revealSleuthHint: () => void;

  // Roster Roulette
  startRosterRoulette: (difficulty?: 'easy' | 'medium' | 'hard') => void;
  guessRosterPlayer: (name: string) => void;
  endRoulette: () => void;

  // Film Room
  startFilmRoom: () => void;
  guessFilmRoom: (optionIndex: number) => void;

  // Reset
  resetAll: () => void;
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const useClashStore = create<ClashStore>((set, get) => ({
  activeMode: null,
  blindResume: null,
  sleuth: null,
  rosterRoulette: null,
  filmRoom: null,

  setActiveMode: (mode) => set({ activeMode: mode }),

  // Blind Resume
  startBlindResume: () => {
    const state = generateBlindResumeGame(getTodayStr());
    set({ blindResume: state, activeMode: 'blind_resume' });
  },
  guessBlindResume: (team, year) => {
    const { blindResume } = get();
    if (!blindResume) return;
    set({ blindResume: submitBlindResumeGuess(blindResume, team, year) });
  },

  // Stat Line Sleuth
  startSleuth: () => {
    const state = generateSleuthGame(getTodayStr());
    set({ sleuth: state, activeMode: 'stat_line_sleuth' });
  },
  guessSleuth: (playerName) => {
    const { sleuth } = get();
    if (!sleuth) return;
    set({ sleuth: submitSleuthGuess(sleuth, playerName) });
  },
  revealSleuthHint: () => {
    const { sleuth } = get();
    if (!sleuth) return;
    set({ sleuth: revealNextHint(sleuth) });
  },

  // Roster Roulette
  startRosterRoulette: (difficulty = 'medium') => {
    const state = generateRosterRouletteGame(getTodayStr(), difficulty);
    set({ rosterRoulette: state, activeMode: 'roster_roulette' });
  },
  guessRosterPlayer: (name) => {
    const { rosterRoulette } = get();
    if (!rosterRoulette) return;
    set({ rosterRoulette: submitRosterGuess(rosterRoulette, name) });
  },
  endRoulette: () => {
    const { rosterRoulette } = get();
    if (!rosterRoulette) return;
    set({ rosterRoulette: endRosterRoulette(rosterRoulette) });
  },

  // Film Room
  startFilmRoom: () => {
    const state = generateFilmRoomGame(getTodayStr());
    set({ filmRoom: state, activeMode: 'film_room' });
  },
  guessFilmRoom: (optionIndex) => {
    const { filmRoom } = get();
    if (!filmRoom) return;
    set({ filmRoom: submitFilmRoomGuess(filmRoom, optionIndex) });
  },

  resetAll: () => set({
    activeMode: null,
    blindResume: null,
    sleuth: null,
    rosterRoulette: null,
    filmRoom: null,
  }),
}));
```

**Step 2: Commit**
```bash
git add src/stores/clash-store.ts
git commit -m "feat: add Conference Clash Zustand store for all 4 game modes"
```

---

## Task 8: Dynasty Builder Zustand Store

**Files:**
- Create: `src/stores/dynasty-store.ts`

**Step 1: Create the Dynasty store**

```typescript
// src/stores/dynasty-store.ts
import { create } from 'zustand';
import type { DynastyPlayer, DynastyRoster, DynastyGameState, SimulationResult } from '@/types';
import {
  createDynastyRoster,
  addPlayerToRoster,
  removePlayerFromRoster,
  getPlayersForProgram,
  getAvailablePrograms,
  isRosterComplete,
  simulateMatchup,
  DYNASTY_SLOTS,
} from '@/services/games/dynasty-engine';

interface DynastyStore {
  gameState: DynastyGameState;
  availablePrograms: string[];
  error: string | null;

  selectProgram: (program: string) => void;
  selectSlot: (slotKey: string | null) => void;
  addPlayer: (slotKey: string, player: DynastyPlayer) => void;
  removePlayer: (slotKey: string) => void;
  setSearchQuery: (query: string) => void;
  simulate: () => void;
  reset: () => void;
}

export const useDynastyStore = create<DynastyStore>((set, get) => ({
  gameState: {
    program: null,
    roster: null,
    availablePlayers: [],
    selectedSlot: null,
    searchQuery: '',
    isComplete: false,
    simulationResult: null,
  },
  availablePrograms: getAvailablePrograms(),
  error: null,

  selectProgram: (program) => {
    const roster = createDynastyRoster(program);
    const players = getPlayersForProgram(program);
    set({
      gameState: {
        program,
        roster,
        availablePlayers: players,
        selectedSlot: null,
        searchQuery: '',
        isComplete: false,
        simulationResult: null,
      },
      error: null,
    });
  },

  selectSlot: (slotKey) => {
    const { gameState } = get();
    set({ gameState: { ...gameState, selectedSlot: slotKey }, error: null });
  },

  addPlayer: (slotKey, player) => {
    const { gameState } = get();
    if (!gameState.roster) return;

    const result = addPlayerToRoster(gameState.roster, slotKey, player);
    if ('error' in result) {
      set({ error: result.error });
      return;
    }

    set({
      gameState: {
        ...gameState,
        roster: result,
        selectedSlot: null,
        isComplete: isRosterComplete(result),
      },
      error: null,
    });
  },

  removePlayer: (slotKey) => {
    const { gameState } = get();
    if (!gameState.roster) return;

    const newRoster = removePlayerFromRoster(gameState.roster, slotKey);
    set({
      gameState: { ...gameState, roster: newRoster, isComplete: false, simulationResult: null },
      error: null,
    });
  },

  setSearchQuery: (query) => {
    const { gameState } = get();
    set({ gameState: { ...gameState, searchQuery: query } });
  },

  simulate: () => {
    const { gameState } = get();
    if (!gameState.roster || !isRosterComplete(gameState.roster)) return;

    // Simulate against a random other program's full roster
    const otherPrograms = getAvailablePrograms().filter(p => p !== gameState.program);
    if (otherPrograms.length === 0) return;

    const opponent = otherPrograms[Math.floor(Math.random() * otherPrograms.length)];
    const opponentPlayers = getPlayersForProgram(opponent);
    const opponentRoster = createDynastyRoster(opponent);

    // Auto-fill opponent roster with best available
    let filledRoster = opponentRoster;
    for (const slot of DYNASTY_SLOTS) {
      const eligible = opponentPlayers.filter(p => {
        const validPositions = slot.position === 'DB' ? ['DB', 'CB', 'S'] : [slot.position];
        return validPositions.includes(p.position);
      });
      const available = eligible.filter(p =>
        !Object.values(filledRoster.players).some(rp => rp?.id === p.id)
      );
      if (available.length > 0) {
        const best = available.sort((a, b) => b.compositeScore - a.compositeScore)[0];
        const result = addPlayerToRoster(filledRoster, slot.key, best);
        if (!('error' in result)) filledRoster = result;
      }
    }

    const simResult = simulateMatchup(gameState.roster, filledRoster);
    set({ gameState: { ...gameState, simulationResult: simResult } });
  },

  reset: () => {
    set({
      gameState: {
        program: null,
        roster: null,
        availablePlayers: [],
        selectedSlot: null,
        searchQuery: '',
        isComplete: false,
        simulationResult: null,
      },
      error: null,
    });
  },
}));
```

**Step 2: Commit**
```bash
git add src/stores/dynasty-store.ts
git commit -m "feat: add Dynasty Builder Zustand store with simulation"
```

---

## Task 9: Conference Clash Sub-Game Screens

**Files:**
- Create: `src/components/games/blind-resume-game.tsx`
- Create: `src/components/games/stat-line-sleuth-game.tsx`
- Create: `src/components/games/roster-roulette-game.tsx`
- Create: `src/components/games/film-room-game.tsx`

These are the 4 game-mode components that will be rendered inside the Clash screen based on `activeMode`. Each is a self-contained game UI component.

**Step 1: Create all 4 game components**

See the separate component files created in Task 9a-9d below. Each follows the pattern:
- Import from store
- Render game state
- Handle user input
- Show results on completion

**Step 2: Commit**
```bash
git add src/components/games/blind-resume-game.tsx src/components/games/stat-line-sleuth-game.tsx src/components/games/roster-roulette-game.tsx src/components/games/film-room-game.tsx
git commit -m "feat: add Conference Clash sub-game UI components"
```

---

## Task 10: Update Clash Screen to Use Real Game Modes

**Files:**
- Modify: `src/app/games/clash.tsx`

Replace the static UI shell with the actual game mode navigation. When a mode is selected, render the corresponding game component. When no mode is active, show the mode selection menu.

**Step 1: Rewrite clash screen to integrate store and sub-game components**

The updated clash.tsx imports `useClashStore` and renders the appropriate sub-game component based on `activeMode`.

**Step 2: Commit**
```bash
git add src/app/games/clash.tsx
git commit -m "feat: wire Conference Clash screen to real game engines"
```

---

## Task 11: Update Dynasty Screen with Real Engine

**Files:**
- Modify: `src/app/games/dynasty.tsx`

Replace static UI with `useDynastyStore`. Add player browser, salary cap tracking, roster management, and simulate button.

**Step 1: Rewrite dynasty screen to integrate store and engine**

The updated dynasty.tsx imports `useDynastyStore` and provides full roster building with player selection modals and simulation results.

**Step 2: Commit**
```bash
git add src/app/games/dynasty.tsx
git commit -m "feat: wire Dynasty Builder screen to real engine with simulation"
```

---

## Task 12: Navigation Updates

**Files:**
- Modify: `src/app/_layout.tsx` (if sub-game routes needed)

Add any new screen routes for Conference Clash sub-games if they need separate navigation entries. The current modal approach may be sufficient if we render sub-games inline.

---

## Verification Checklist

- [ ] TypeScript compiles with `npm run typecheck`
- [ ] All 4 Conference Clash engines generate consistent daily games (seeded RNG)
- [ ] Blind Resume: renders anonymized stats, accepts team+year guess, scores correctly
- [ ] Stat Line Sleuth: shows stat line, reveals hints progressively, scores by hint count
- [ ] Roster Roulette: timer counts down, accepts player names, tracks guessed count
- [ ] Film Room: shows description, 4 multiple-choice options, scores correct picks
- [ ] Dynasty Builder: program selection, player browser, salary cap enforcement, roster slots fill
- [ ] Dynasty simulation: runs Monte Carlo, displays win probability and top performers
- [ ] All game engines are pure functions with no side effects
- [ ] All stores follow existing Zustand pattern
- [ ] All screens use theme.ts colors/spacing/typography
