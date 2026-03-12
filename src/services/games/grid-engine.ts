// ============================================================
// GridIron IQ — The Grid Game Engine
// ============================================================
// Generates daily grid puzzles, validates answers, scores rarity

import type {
  GridPuzzle,
  GridCriteria,
  GridCell,
  GridGameState,
  CriteriaType,
  Player,
} from '@/types';

import {
  getAllTeams,
  getTeamsByConference,
  getPlayersByPosition,
  getDraftPicksByYear,
  getStatLeadersByCategory,
} from '@/services/data/cfbd-cache';
import type { CachedPlayerSeasonStats } from '@/services/data/cfbd-cache';

// --- Cache-Backed Criteria Loading ---

let _cachedSchoolCriteria: GridCriteria[] | null = null;
let _cachedConferenceCriteria: GridCriteria[] | null = null;

async function loadSchoolCriteriaFromCache(): Promise<GridCriteria[]> {
  if (_cachedSchoolCriteria) return _cachedSchoolCriteria;
  try {
    const teams = await getAllTeams();
    if (teams && teams.length > 0) {
      _cachedSchoolCriteria = teams
        .filter(t => t.conference)
        .map(t => ({
          type: 'school' as CriteriaType,
          value: t.school,
          displayText: t.school,
        }));
      return _cachedSchoolCriteria;
    }
  } catch {
    // fall through to hardcoded
  }
  return SCHOOL_CRITERIA_FALLBACK;
}

async function loadConferenceCriteriaFromCache(): Promise<GridCriteria[]> {
  if (_cachedConferenceCriteria) return _cachedConferenceCriteria;
  try {
    const teams = await getAllTeams();
    if (teams && teams.length > 0) {
      const conferences = new Set(teams.map(t => t.conference).filter(Boolean));
      _cachedConferenceCriteria = Array.from(conferences).map(conf => ({
        type: 'conference' as CriteriaType,
        value: conf,
        displayText: conf,
      }));
      return _cachedConferenceCriteria;
    }
  } catch {
    // fall through to hardcoded
  }
  return CONFERENCE_CRITERIA_FALLBACK;
}

/**
 * Refreshes the criteria pools from the cache. Call this once at startup
 * or when you know the cache is populated. After this resolves, the
 * synchronous CONFERENCE_CRITERIA and SCHOOL_CRITERIA arrays are
 * updated in-place so existing synchronous code keeps working.
 */
export async function loadGridCriteriaFromCache(): Promise<void> {
  const [confCriteria, schoolCriteria] = await Promise.all([
    loadConferenceCriteriaFromCache(),
    loadSchoolCriteriaFromCache(),
  ]);

  // Mutate in-place so the ALL_CRITERIA_POOLS reference stays valid
  if (confCriteria.length > 0) {
    CONFERENCE_CRITERIA.length = 0;
    CONFERENCE_CRITERIA.push(...confCriteria);
  }
  if (schoolCriteria.length > 0) {
    SCHOOL_CRITERIA.length = 0;
    SCHOOL_CRITERIA.push(...schoolCriteria);
  }
}

// --- Criteria Pool ---
// These are the building blocks for generating grid puzzles

const CONFERENCE_CRITERIA_FALLBACK: GridCriteria[] = [
  { type: 'conference', value: 'SEC', displayText: 'SEC' },
  { type: 'conference', value: 'Big Ten', displayText: 'Big Ten' },
  { type: 'conference', value: 'Big 12', displayText: 'Big 12' },
  { type: 'conference', value: 'ACC', displayText: 'ACC' },
  { type: 'conference', value: 'Pac-12', displayText: 'Pac-12' },
];

const CONFERENCE_CRITERIA: GridCriteria[] = [
  { type: 'conference', value: 'SEC', displayText: 'SEC' },
  { type: 'conference', value: 'Big Ten', displayText: 'Big Ten' },
  { type: 'conference', value: 'Big 12', displayText: 'Big 12' },
  { type: 'conference', value: 'ACC', displayText: 'ACC' },
  { type: 'conference', value: 'Pac-12', displayText: 'Pac-12' },
];

const AWARD_CRITERIA: GridCriteria[] = [
  { type: 'award', value: 'Heisman', displayText: 'Heisman Winner' },
  { type: 'award', value: 'All-American', displayText: 'All-American' },
  { type: 'award', value: 'Biletnikoff', displayText: 'Biletnikoff Award' },
  { type: 'award', value: 'Butkus', displayText: 'Butkus Award' },
  { type: 'award', value: 'Doak Walker', displayText: 'Doak Walker Award' },
];

const STAT_CRITERIA: GridCriteria[] = [
  { type: 'stat_threshold', value: 'rushing_yards_1000', displayText: '1,000+ Rush Yds (Season)' },
  { type: 'stat_threshold', value: 'passing_tds_30', displayText: '30+ Pass TDs (Season)' },
  { type: 'stat_threshold', value: 'receiving_yards_1000', displayText: '1,000+ Rec Yds (Season)' },
  { type: 'stat_threshold', value: 'passing_yards_3000', displayText: '3,000+ Pass Yds (Season)' },
  { type: 'stat_threshold', value: 'total_tds_20', displayText: '20+ Total TDs (Season)' },
];

const DRAFT_CRITERIA: GridCriteria[] = [
  { type: 'draft_round', value: '1', displayText: '1st Round Pick' },
  { type: 'draft_round', value: 'top10', displayText: 'Top 10 Pick' },
  { type: 'draft_round', value: 'undrafted', displayText: 'Undrafted' },
];

const POSITION_CRITERIA: GridCriteria[] = [
  { type: 'position', value: 'QB', displayText: 'Quarterback' },
  { type: 'position', value: 'RB', displayText: 'Running Back' },
  { type: 'position', value: 'WR', displayText: 'Wide Receiver' },
  { type: 'position', value: 'DEF', displayText: 'Defensive Player' },
  { type: 'position', value: 'K', displayText: 'Kicker' },
];

const SCHOOL_CRITERIA_FALLBACK: GridCriteria[] = [
  { type: 'school', value: 'Alabama', displayText: 'Alabama' },
  { type: 'school', value: 'Ohio State', displayText: 'Ohio State' },
  { type: 'school', value: 'LSU', displayText: 'LSU' },
  { type: 'school', value: 'Clemson', displayText: 'Clemson' },
  { type: 'school', value: 'Oklahoma', displayText: 'Oklahoma' },
  { type: 'school', value: 'Michigan', displayText: 'Michigan' },
  { type: 'school', value: 'Georgia', displayText: 'Georgia' },
  { type: 'school', value: 'USC', displayText: 'USC' },
  { type: 'school', value: 'Texas', displayText: 'Texas' },
  { type: 'school', value: 'Notre Dame', displayText: 'Notre Dame' },
];

const SCHOOL_CRITERIA: GridCriteria[] = [...SCHOOL_CRITERIA_FALLBACK];

const ALL_CRITERIA_POOLS: GridCriteria[][] = [
  CONFERENCE_CRITERIA,
  // AWARD_CRITERIA excluded — no award data in cache yet
  STAT_CRITERIA,
  // DRAFT_CRITERIA excluded — only 101 draft picks in seed data
  POSITION_CRITERIA,
  SCHOOL_CRITERIA,
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
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
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

function pickCriteria(rng: () => number, count: number, exclude: CriteriaType[]): GridCriteria[] {
  const availablePools = ALL_CRITERIA_POOLS.filter(pool =>
    pool.length > 0 && !exclude.includes(pool[0].type)
  );

  const selected: GridCriteria[] = [];
  const usedTypes = new Set<CriteriaType>();

  while (selected.length < count && availablePools.length > 0) {
    const shuffledPools = shuffleWithRng(availablePools, rng);

    for (const pool of shuffledPools) {
      if (selected.length >= count) break;
      if (usedTypes.has(pool[0].type)) continue;

      const shuffled = shuffleWithRng(pool, rng);
      selected.push(shuffled[0]);
      usedTypes.add(pool[0].type);
    }

    // If we still need more, allow duplicate types
    if (selected.length < count) {
      const allCriteria = availablePools.flat();
      const remaining = shuffleWithRng(
        allCriteria.filter(c => !selected.includes(c)),
        rng
      );
      while (selected.length < count && remaining.length > 0) {
        selected.push(remaining.shift()!);
      }
    }
  }

  return selected;
}

export function generateDailyPuzzle(dateStr: string, size: 3 | 4 = 3): GridPuzzle {
  const rng = seededRandom(dateToSeed(dateStr));

  const rows = pickCriteria(rng, size, []);
  const usedRowTypes = rows.map(r => r.type);
  const columns = pickCriteria(rng, size, usedRowTypes);

  return {
    id: `grid-${dateStr}`,
    date: dateStr,
    size,
    rows,
    columns,
    validAnswers: {}, // populated by populateValidAnswersFromCache() or backend
  };
}

/**
 * Populate a puzzle's validAnswers map using real cached player and draft data.
 * Call after generating the puzzle. Returns the same puzzle with validAnswers filled in.
 */
// --- Pre-built lookup indexes for fast grid matching ---

// Team → conference map (lazy)
let _teamConfMap: Map<string, string> | null = null;
function getTeamConfMap(): Map<string, string> {
  if (!_teamConfMap) {
    _teamConfMap = new Map();
    for (const t of getAllTeams()) {
      _teamConfMap.set(t.school.toLowerCase(), t.conference);
    }
  }
  return _teamConfMap;
}

// Build stat threshold sets: player name (lowercase) → Set of met thresholds
function buildStatThresholdIndex(): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();

  function addThreshold(name: string, threshold: string) {
    const key = name.toLowerCase();
    let set = index.get(key);
    if (!set) { set = new Set(); index.set(key, set); }
    set.add(threshold);
  }

  // Scan all stat categories efficiently
  const allPassers = getStatLeadersByCategory('passing', 50000);
  for (const s of allPassers) {
    const name = s.player;
    if ((s.passingTDs ?? 0) >= 30) addThreshold(name, 'passing_tds_30');
    if ((s.passingYards ?? 0) >= 3000) addThreshold(name, 'passing_yards_3000');
    if (((s.passingTDs ?? 0) + (s.rushingTDs ?? 0) + (s.receivingTDs ?? 0)) >= 20) addThreshold(name, 'total_tds_20');
  }

  const allRushers = getStatLeadersByCategory('rushing', 50000);
  for (const s of allRushers) {
    const name = s.player;
    if ((s.rushingYards ?? 0) >= 1000) addThreshold(name, 'rushing_yards_1000');
    if (((s.passingTDs ?? 0) + (s.rushingTDs ?? 0) + (s.receivingTDs ?? 0)) >= 20) addThreshold(name, 'total_tds_20');
  }

  const allReceivers = getStatLeadersByCategory('receiving', 50000);
  for (const s of allReceivers) {
    const name = s.player;
    if ((s.receivingYards ?? 0) >= 1000) addThreshold(name, 'receiving_yards_1000');
    if (((s.passingTDs ?? 0) + (s.rushingTDs ?? 0) + (s.receivingTDs ?? 0)) >= 20) addThreshold(name, 'total_tds_20');
  }

  return index;
}

export async function populateValidAnswersFromCache(
  puzzle: GridPuzzle,
): Promise<GridPuzzle> {
  try {
    const positions = ['QB', 'RB', 'WR', 'DEF', 'ATH', 'K'];
    const allPlayers = positions.flatMap(pos => getPlayersByPosition(pos));
    const allDrafts = [2020, 2021, 2022, 2023, 2024].flatMap(yr => getDraftPicksByYear(yr));

    if (allPlayers.length === 0) {
      return puzzle;
    }

    // Pre-build all lookup indexes
    const confMap = getTeamConfMap();
    const draftByName = new Map(
      allDrafts.filter(d => d.name).map(d => [d.name.toLowerCase(), d])
    );
    const statIndex = buildStatThresholdIndex();

    const validAnswers: Record<string, string[]> = {};

    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        const rowCrit = puzzle.rows[row];
        const colCrit = puzzle.columns[col];
        const cellKey = `${row}-${col}`;

        const matching = allPlayers.filter(p => {
          const fullName = `${p.firstName} ${p.lastName}`;
          const nameLower = fullName.toLowerCase();
          const draft = draftByName.get(nameLower);
          const thresholds = statIndex.get(nameLower);
          return matchCriteria(p, fullName, draft, thresholds, confMap, rowCrit) &&
                 matchCriteria(p, fullName, draft, thresholds, confMap, colCrit);
        });

        validAnswers[cellKey] = matching.map(p => String(p.id));
      }
    }

    return { ...puzzle, validAnswers };
  } catch {
    return puzzle;
  }
}

function matchCriteria(
  player: { team: string; position: string },
  _fullName: string,
  draft: { round: number; pick: number } | undefined,
  thresholds: Set<string> | undefined,
  confMap: Map<string, string>,
  criteria: GridCriteria,
): boolean {
  switch (criteria.type) {
    case 'school':
      return player.team.toLowerCase() === criteria.value.toLowerCase();
    case 'conference':
      return confMap.get(player.team.toLowerCase()) === criteria.value;
    case 'position':
      return player.position.toUpperCase() === criteria.value.toUpperCase();
    case 'draft_round':
      if (!draft) return criteria.value === 'undrafted';
      if (criteria.value === 'top10') return draft.pick <= 10;
      if (criteria.value === 'undrafted') return false;
      return draft.round === parseInt(criteria.value, 10);
    case 'stat_threshold':
      return thresholds?.has(criteria.value) ?? false;
    case 'award':
      return false;
    default:
      return false;
  }
}

// --- Game State ---

export function createInitialGameState(puzzle: GridPuzzle): GridGameState {
  const cells: GridCell[][] = [];

  for (let row = 0; row < puzzle.size; row++) {
    const cellRow: GridCell[] = [];
    for (let col = 0; col < puzzle.size; col++) {
      cellRow.push({
        rowIndex: row,
        colIndex: col,
        rowCriteria: puzzle.rows[row],
        colCriteria: puzzle.columns[col],
        isLocked: false,
      });
    }
    cells.push(cellRow);
  }

  const maxGuesses = puzzle.size === 3 ? 9 : 16;

  return {
    puzzle,
    cells,
    currentCell: null,
    guessesRemaining: maxGuesses,
    score: 0,
    isComplete: false,
    startTime: Date.now(),
  };
}

// --- Answer Validation ---

export function getCellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export function validateAnswer(
  puzzle: GridPuzzle,
  row: number,
  col: number,
  playerId: string
): boolean {
  const cellKey = getCellKey(row, col);
  const validPlayers = puzzle.validAnswers[cellKey];
  if (!validPlayers) return false;
  return validPlayers.includes(playerId);
}

// --- Scoring ---

export function calculateRarityScore(
  totalSubmissions: number,
  playerSubmissions: number
): number {
  if (totalSubmissions === 0) return 100;
  const percentage = (playerSubmissions / totalSubmissions) * 100;

  if (percentage <= 1) return 100;  // Legendary
  if (percentage <= 5) return 80;   // Epic
  if (percentage <= 15) return 60;  // Rare
  if (percentage <= 40) return 40;  // Uncommon
  return 20;                        // Common
}

export function calculateGridScore(
  cells: GridCell[][],
  completionTimeSeconds: number
): number {
  let baseScore = 0;
  let correctCount = 0;

  for (const row of cells) {
    for (const cell of row) {
      if (cell.isCorrect) {
        baseScore += 100; // base per correct cell
        correctCount++;
      }
    }
  }

  // Speed bonus: up to 50% extra for fast completion
  const speedMultiplier = Math.max(0, 1.5 - (completionTimeSeconds / 300)); // 5 min baseline
  const speedBonus = Math.floor(baseScore * Math.max(0, speedMultiplier - 1));

  // Completion bonus
  const totalCells = cells.length * cells[0].length;
  const completionBonus = correctCount === totalCells ? 200 : 0;

  return baseScore + speedBonus + completionBonus;
}

// --- Submission ---

export function submitGuess(
  state: GridGameState,
  row: number,
  col: number,
  player: Player
): GridGameState {
  if (state.isComplete || state.guessesRemaining <= 0) return state;

  const cell = state.cells[row][col];
  if (cell.isLocked) return state;

  const isCorrect = state.puzzle
    ? validateAnswer(state.puzzle, row, col, player.id)
    : false;

  const newCells = state.cells.map((r, ri) =>
    r.map((c, ci) => {
      if (ri === row && ci === col) {
        return {
          ...c,
          answer: player,
          isCorrect,
          isLocked: true,
        };
      }
      return c;
    })
  );

  const newGuessesRemaining = state.guessesRemaining - 1;
  const allFilled = newCells.every(r => r.every(c => c.isLocked));
  const noGuessesLeft = newGuessesRemaining <= 0;

  const isComplete = allFilled || noGuessesLeft;
  const completionTime = isComplete
    ? Math.floor((Date.now() - state.startTime) / 1000)
    : 0;

  return {
    ...state,
    cells: newCells,
    guessesRemaining: newGuessesRemaining,
    score: isComplete ? calculateGridScore(newCells, completionTime) : state.score,
    isComplete,
    currentCell: null,
  };
}
