// ============================================================
// GridIron IQ — Stat Stack Game Engine
// ============================================================
// Pick 5 players + seasons to maximize a daily stat category

import type {
  StatStackPuzzle,
  StatStackGameState,
  StatStackPick,
  StatCategory,
  RowConstraint,
  Penalty,
} from '@/types';

import {
  getTopPlayersByStat,
  getStatLeadersByCategory,
  type CachedPlayerSeasonStats,
} from '@/services/data/cfbd-cache';

// --- Stat Category Definitions ---

const STAT_CATEGORIES: Record<StatCategory, { label: string; unit: string }> = {
  rushing_yards: { label: 'Rushing Yards', unit: 'yds' },
  passing_tds: { label: 'Passing Touchdowns', unit: 'TDs' },
  receiving_yards: { label: 'Receiving Yards', unit: 'yds' },
  sacks: { label: 'Sacks', unit: 'sacks' },
  interceptions: { label: 'Interceptions', unit: 'INTs' },
  total_tds: { label: 'Total Touchdowns', unit: 'TDs' },
  all_purpose_yards: { label: 'All-Purpose Yards', unit: 'yds' },
};

// --- Day-of-Week Category Rotation ---

const DAY_TO_CATEGORY: StatCategory[] = [
  'all_purpose_yards', // Sunday
  'rushing_yards',     // Monday
  'passing_tds',       // Tuesday
  'receiving_yards',   // Wednesday
  'sacks',             // Thursday
  'interceptions',     // Friday
  'total_tds',         // Saturday
];

export function getCategoryForDate(date: Date): StatCategory {
  return DAY_TO_CATEGORY[date.getDay()];
}

export function getStatCategoryInfo(category: StatCategory) {
  return STAT_CATEGORIES[category];
}

// --- Row Constraint Templates ---

const OPEN_CONSTRAINT_TEMPLATES: RowConstraint[] = [
  { index: 0, description: 'Player from a Group of 5 school', validator: 'group_of_5' },
  { index: 1, description: 'Player who was a freshman or sophomore', validator: 'underclassman' },
  { index: 2, description: 'Player from before 2010', validator: 'pre_2010' },
  { index: 3, description: 'Player who won a conference championship', validator: 'conf_champ' },
  { index: 4, description: 'Player who went undrafted', validator: 'undrafted' },
  { index: 0, description: 'Player from the SEC', validator: 'conference_sec' },
  { index: 1, description: 'Player from the Big Ten', validator: 'conference_big_ten' },
  { index: 2, description: 'Player who was a Heisman finalist', validator: 'heisman_finalist' },
  { index: 3, description: 'Player from a school with "State" in the name', validator: 'state_school' },
  { index: 4, description: 'Player who transferred at least once', validator: 'transfer' },
  { index: 0, description: 'Player drafted in the 1st round', validator: 'first_round' },
  { index: 1, description: 'Player from a team ranked in the top 10', validator: 'top_10_team' },
  { index: 2, description: 'Player with a last name starting A-M', validator: 'name_a_m' },
  { index: 3, description: 'Player from the 2010s decade', validator: 'decade_2010s' },
  { index: 4, description: 'Player who played in a NY6 bowl', validator: 'ny6_bowl' },
];

const YEAR_LOCKED_CONSTRAINT_TEMPLATES: RowConstraint[] = [
  { index: 0, description: 'Player from the 2005 season', validator: 'year_2005', lockedYear: 2005 },
  { index: 0, description: 'Player from the 2008 season', validator: 'year_2008', lockedYear: 2008 },
  { index: 0, description: 'Player from the 2010 season', validator: 'year_2010', lockedYear: 2010 },
  { index: 0, description: 'Player from the 2012 season', validator: 'year_2012', lockedYear: 2012 },
  { index: 0, description: 'Player from the 2014 season', validator: 'year_2014', lockedYear: 2014 },
  { index: 0, description: 'Player from the 2015 season', validator: 'year_2015', lockedYear: 2015 },
  { index: 0, description: 'Player from the 2017 season', validator: 'year_2017', lockedYear: 2017 },
  { index: 0, description: 'Player from the 2019 season', validator: 'year_2019', lockedYear: 2019 },
  { index: 0, description: 'Player from the 2021 season', validator: 'year_2021', lockedYear: 2021 },
  { index: 0, description: 'Player from the 2023 season', validator: 'year_2023', lockedYear: 2023 },
];

// Combined pool for backward compatibility
const CONSTRAINT_TEMPLATES: RowConstraint[] = [
  ...OPEN_CONSTRAINT_TEMPLATES,
  ...YEAR_LOCKED_CONSTRAINT_TEMPLATES,
];

// --- Puzzle Generation ---

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
  return Math.abs(hash) + 1; // different seed space from grid
}

export function generateStatStackPuzzle(dateStr: string): StatStackPuzzle {
  const date = new Date(dateStr);
  const category = getCategoryForDate(date);
  const info = STAT_CATEGORIES[category];

  const rng = seededRandom(dateToSeed(dateStr));

  // Decide how many year-locked constraints: 2 or 3
  const numLocked = rng() < 0.5 ? 2 : 3;
  const numOpen = 5 - numLocked;

  // Pick year-locked constraints
  const shuffledLocked = [...YEAR_LOCKED_CONSTRAINT_TEMPLATES]
    .sort(() => rng() - 0.5)
    .slice(0, numLocked);

  // Pick open constraints
  const shuffledOpen = [...OPEN_CONSTRAINT_TEMPLATES]
    .sort(() => rng() - 0.5)
    .slice(0, numOpen);

  // Combine and shuffle so locked/open are interspersed
  const combined = [...shuffledLocked, ...shuffledOpen]
    .sort(() => rng() - 0.5);

  const shuffled = combined.map((c, i) => ({ ...c, index: i }));

  return {
    id: `stat-stack-${dateStr}`,
    date: dateStr,
    statCategory: category,
    statLabel: info.label,
    rows: shuffled,
    maxPossibleScore: 0, // calculated by backend with real data
  };
}

// --- Game State ---

export function createStatStackGameState(puzzle: StatStackPuzzle): StatStackGameState {
  return {
    puzzle,
    picks: [null, null, null, null, null],
    currentRow: 0,
    totalStatValue: 0,
    penalties: [],
    isComplete: false,
    hasUsedTransferPortal: false,
  };
}

// --- Targeting Mechanic ---

function rollTargeting(rng: () => number): boolean {
  return rng() < 0.15; // 15% chance
}

function applyTargeting(state: StatStackGameState): StatStackGameState {
  // Find the highest scoring pick
  let bestIndex = -1;
  let bestValue = -1;

  state.picks.forEach((pick, i) => {
    if (pick && pick.statValue > bestValue) {
      bestValue = pick.statValue;
      bestIndex = i;
    }
  });

  if (bestIndex === -1) return state;

  const ejectedPick = state.picks[bestIndex]!;
  const penalty: Penalty = {
    type: 'targeting',
    description: `TARGETING! ${ejectedPick.playerName} ejected (${ejectedPick.statValue} ${getStatCategoryInfo(state.puzzle!.statCategory).unit} lost)`,
    pointsLost: ejectedPick.statValue,
  };

  const newPicks = [...state.picks];
  newPicks[bestIndex] = {
    ...ejectedPick,
    statValue: 0,
    isValid: false,
  };

  return {
    ...state,
    picks: newPicks,
    totalStatValue: state.totalStatValue - ejectedPick.statValue,
    penalties: [...state.penalties, penalty],
  };
}

// --- Submit Pick ---

export function submitStatStackPick(
  state: StatStackGameState,
  pick: StatStackPick
): StatStackGameState {
  if (state.isComplete || !state.puzzle) return state;
  if (state.picks[pick.rowIndex] !== null) return state;

  const newPicks = [...state.picks];
  newPicks[pick.rowIndex] = pick;

  let newState: StatStackGameState = {
    ...state,
    picks: newPicks,
    totalStatValue: state.totalStatValue + (pick.isValid ? pick.statValue : 0),
    currentRow: pick.rowIndex + 1,
  };

  // If the pick is wrong, roll for targeting
  if (!pick.isValid) {
    const rng = seededRandom(Date.now());
    if (rollTargeting(rng)) {
      newState = applyTargeting(newState);
    }
  }

  // Check if all rows filled
  const allFilled = newPicks.every(p => p !== null);
  if (allFilled) {
    newState = { ...newState, isComplete: true };
  }

  return newState;
}

// --- Transfer Portal (Power-Up) ---

export function useTransferPortal(
  state: StatStackGameState,
  rowIndex: number
): StatStackGameState {
  if (state.hasUsedTransferPortal) return state;
  if (!state.picks[rowIndex]) return state;

  const oldPick = state.picks[rowIndex]!;
  const newPicks = [...state.picks];
  newPicks[rowIndex] = null;

  return {
    ...state,
    picks: newPicks,
    totalStatValue: state.totalStatValue - oldPick.statValue,
    hasUsedTransferPortal: true,
    isComplete: false,
  };
}

// --- Scoring ---

export function calculateStatStackScore(state: StatStackGameState): {
  totalStatValue: number;
  percentile: number;
  penaltyTotal: number;
  finalScore: number;
} {
  const penaltyTotal = state.penalties.reduce((sum, p) => sum + p.pointsLost, 0);
  const maxPossible = state.puzzle?.maxPossibleScore ?? 1;
  const percentile = maxPossible > 0
    ? Math.round((state.totalStatValue / maxPossible) * 100)
    : 0;

  return {
    totalStatValue: state.totalStatValue,
    percentile: Math.min(100, percentile),
    penaltyTotal,
    finalScore: Math.max(0, state.totalStatValue),
  };
}

// --- Cache-Backed Stat Leaders ---

/** Maps our StatCategory to the cache stat category strings used by getTopPlayersByStat */
const CATEGORY_TO_CACHE_KEY: Record<StatCategory, string> = {
  rushing_yards: 'rushing',
  passing_tds: 'passing',
  receiving_yards: 'receiving',
  sacks: 'defensive',
  interceptions: 'defensive',
  total_tds: 'rushing',
  all_purpose_yards: 'rushing',
};

/** Maps our StatCategory to the specific stat field within CachedPlayerSeasonStats */
const CATEGORY_TO_STAT_FIELD: Record<StatCategory, keyof CachedPlayerSeasonStats> = {
  rushing_yards: 'rushingYards',
  passing_tds: 'passingTDs',
  receiving_yards: 'receivingYards',
  sacks: 'sacks',
  interceptions: 'interceptions',
  total_tds: 'passingTDs',
  all_purpose_yards: 'rushingYards',
};

let _cachedStatLeaders: Record<string, CachedPlayerSeasonStats[]> = {};

/**
 * Load top players for a given stat category from the cache.
 * Returns cached player season stats sorted descending by the relevant stat.
 * Falls back to an empty array if cache is unavailable.
 */
export async function getStatLeadersFromCache(
  category: StatCategory,
  limit: number = 100,
): Promise<CachedPlayerSeasonStats[]> {
  const cacheKey = `${category}-${limit}`;
  if (_cachedStatLeaders[cacheKey]) return _cachedStatLeaders[cacheKey];

  try {
    const cacheCategory = CATEGORY_TO_CACHE_KEY[category];
    const statField = CATEGORY_TO_STAT_FIELD[category];
    const players = getStatLeadersByCategory(cacheCategory);

    if (players && players.length > 0) {
      // Sort by the specific stat field descending
      const sorted = [...players]
        .filter(p => p[statField] !== undefined)
        .sort((a, b) => ((b[statField] as number) ?? 0) - ((a[statField] as number) ?? 0))
        .slice(0, limit);

      _cachedStatLeaders[cacheKey] = sorted;
      return sorted;
    }
  } catch {
    // fall through — return empty, caller can use own fallback
  }
  return [];
}

/**
 * Compute the max possible score for a puzzle from real cached stat data.
 * Takes the top 5 stat values for the category and sums them.
 */
export async function computeMaxPossibleScore(
  category: StatCategory,
): Promise<number> {
  const leaders = await getStatLeadersFromCache(category, 5);
  const statField = CATEGORY_TO_STAT_FIELD[category];
  return leaders.reduce((sum, p) => sum + ((p[statField] as number) ?? 0), 0);
}

/**
 * Generate a stat stack puzzle with real max possible score from cache.
 * Falls back to the basic puzzle if cache is empty.
 */
export async function generateStatStackPuzzleWithCache(
  dateStr: string,
): Promise<StatStackPuzzle> {
  const puzzle = generateStatStackPuzzle(dateStr);
  const maxScore = await computeMaxPossibleScore(puzzle.statCategory);
  if (maxScore > 0) {
    return { ...puzzle, maxPossibleScore: maxScore };
  }
  return puzzle;
}
