import {
  getCategoryForDate,
  getStatCategoryInfo,
  generateStatStackPuzzle,
  createStatStackGameState,
  submitStatStackPick,
  useTransferPortal,
  calculateStatStackScore,
} from './stat-stack-engine';

import type { StatStackPick } from '@/types';

// ---- getCategoryForDate ----

describe('getCategoryForDate', () => {
  it('returns a valid stat category for any date', () => {
    const validCategories = [
      'rushing_yards', 'passing_tds', 'receiving_yards',
      'sacks', 'interceptions', 'total_tds', 'all_purpose_yards',
    ];
    const result = getCategoryForDate(new Date('2025-01-06'));
    expect(validCategories).toContain(result);
  });

  it('returns different categories for different days of the week', () => {
    const categories = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const date = new Date(2025, 0, 5 + i); // Jan 5-11, using local time
      categories.add(getCategoryForDate(date));
    }
    expect(categories.size).toBe(7);
  });

  it('maps day index to the correct category', () => {
    // Use local dates to avoid timezone issues
    const monday = new Date(2025, 0, 6); // Jan 6 2025 = Monday
    expect(monday.getDay()).toBe(1);
    expect(getCategoryForDate(monday)).toBe('rushing_yards');
  });
});

// ---- getStatCategoryInfo ----

describe('getStatCategoryInfo', () => {
  it('returns label and unit for a valid category', () => {
    const info = getStatCategoryInfo('rushing_yards');
    expect(info.label).toBe('Rushing Yards');
    expect(info.unit).toBe('yds');
  });
});

// ---- generateStatStackPuzzle ----

describe('generateStatStackPuzzle', () => {
  it('creates a puzzle with correct id and date', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    expect(puzzle.id).toBe('stat-stack-2025-01-06');
    expect(puzzle.date).toBe('2025-01-06');
  });

  it('selects a valid stat category', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    const validCategories = [
      'rushing_yards', 'passing_tds', 'receiving_yards',
      'sacks', 'interceptions', 'total_tds', 'all_purpose_yards',
    ];
    expect(validCategories).toContain(puzzle.statCategory);
  });

  it('generates exactly 5 row constraints', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    expect(puzzle.rows).toHaveLength(5);
  });

  it('row constraints are indexed 0-4', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    const indices = puzzle.rows.map(r => r.index).sort();
    expect(indices).toEqual([0, 1, 2, 3, 4]);
  });

  it('produces deterministic results for the same date', () => {
    const p1 = generateStatStackPuzzle('2025-03-10');
    const p2 = generateStatStackPuzzle('2025-03-10');
    expect(p1.rows).toEqual(p2.rows);
    expect(p1.statCategory).toBe(p2.statCategory);
  });
});

// ---- generateStatStackPuzzle year-locked constraints ----

describe('generateStatStackPuzzle year-locked constraints', () => {
  it('produces a mix of locked and open year constraints', () => {
    const puzzle = generateStatStackPuzzle('2025-03-12');
    const locked = puzzle.rows.filter((c: any) => c.lockedYear !== undefined);
    const open = puzzle.rows.filter((c: any) => c.lockedYear === undefined);
    expect(locked.length).toBeGreaterThanOrEqual(2);
    expect(locked.length).toBeLessThanOrEqual(3);
    expect(open.length).toBeGreaterThanOrEqual(2);
    expect(open.length).toBeLessThanOrEqual(3);
    expect(locked.length + open.length).toBe(5);
  });

  it('locked year constraints specify valid season years', () => {
    const puzzle = generateStatStackPuzzle('2025-03-12');
    for (const c of puzzle.rows.filter((c: any) => c.lockedYear !== undefined)) {
      expect(c.lockedYear).toBeGreaterThanOrEqual(2003);
      expect(c.lockedYear).toBeLessThanOrEqual(2024);
    }
  });

  it('different dates produce different constraint mixes', () => {
    const p1 = generateStatStackPuzzle('2025-03-12');
    const p2 = generateStatStackPuzzle('2025-03-13');
    const ids1 = p1.rows.map((c: any) => c.validator).join(',');
    const ids2 = p2.rows.map((c: any) => c.validator).join(',');
    expect(ids1).not.toBe(ids2);
  });
});

// ---- createStatStackGameState ----

describe('createStatStackGameState', () => {
  it('initialises with 5 null picks', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    const state = createStatStackGameState(puzzle);
    expect(state.picks).toHaveLength(5);
    expect(state.picks.every(p => p === null)).toBe(true);
  });

  it('starts with zeroed score and not complete', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    const state = createStatStackGameState(puzzle);
    expect(state.totalStatValue).toBe(0);
    expect(state.isComplete).toBe(false);
    expect(state.hasUsedTransferPortal).toBe(false);
    expect(state.penalties).toHaveLength(0);
  });
});

// ---- submitStatStackPick ----

describe('submitStatStackPick', () => {
  function makeState() {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    // Clear lockedYear constraints so generic tests aren't affected by year validation
    puzzle.rows = puzzle.rows.map((r: any) => ({ ...r, lockedYear: undefined }));
    return createStatStackGameState(puzzle);
  }

  const validPick: StatStackPick = {
    rowIndex: 0,
    playerId: 'p1',
    playerName: 'Test Player',
    season: 2020,
    statValue: 1500,
    isValid: true,
  };

  it('places a valid pick and updates totalStatValue', () => {
    const state = makeState();
    const next = submitStatStackPick(state, validPick);
    expect(next.picks[0]).toEqual(validPick);
    expect(next.totalStatValue).toBe(1500);
  });

  it('does not allow placing a pick in an already-filled row', () => {
    const state = makeState();
    const after1 = submitStatStackPick(state, validPick);
    const duplicate: StatStackPick = { ...validPick, playerId: 'p2', playerName: 'Other' };
    const after2 = submitStatStackPick(after1, duplicate);
    // Should be unchanged
    expect(after2).toBe(after1);
  });

  it('does not add statValue for invalid picks', () => {
    const state = makeState();
    const invalidPick: StatStackPick = { ...validPick, isValid: false, statValue: 500 };
    const next = submitStatStackPick(state, invalidPick);
    expect(next.totalStatValue).toBe(0);
  });

  it('marks game complete when all 5 rows are filled', () => {
    let state = makeState();
    for (let i = 0; i < 5; i++) {
      state = submitStatStackPick(state, {
        rowIndex: i,
        playerId: `p${i}`,
        playerName: `Player ${i}`,
        season: 2020,
        statValue: 100,
        isValid: true,
      });
    }
    expect(state.isComplete).toBe(true);
  });

  it('returns unchanged state when game is already complete', () => {
    let state = makeState();
    state = { ...state, isComplete: true };
    const next = submitStatStackPick(state, validPick);
    expect(next).toBe(state);
  });

  it('returns unchanged state when puzzle is null', () => {
    let state = makeState();
    state = { ...state, puzzle: null as any };
    const next = submitStatStackPick(state, validPick);
    expect(next).toBe(state);
  });
});

// ---- useTransferPortal ----

describe('useTransferPortal', () => {
  function makeStateWithPick() {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    let state = createStatStackGameState(puzzle);
    state = submitStatStackPick(state, {
      rowIndex: 0,
      playerId: 'p1',
      playerName: 'Test',
      season: 2020,
      statValue: 1000,
      isValid: true,
    });
    return state;
  }

  it('clears the pick and subtracts its stat value', () => {
    const state = makeStateWithPick();
    const next = useTransferPortal(state, 0);
    expect(next.picks[0]).toBeNull();
    expect(next.totalStatValue).toBe(0);
    expect(next.hasUsedTransferPortal).toBe(true);
    expect(next.isComplete).toBe(false);
  });

  it('cannot be used twice', () => {
    const state = makeStateWithPick();
    const after1 = useTransferPortal(state, 0);
    // Re-fill and try again
    const refilled = submitStatStackPick(after1, {
      rowIndex: 0,
      playerId: 'p2',
      playerName: 'Test 2',
      season: 2021,
      statValue: 800,
      isValid: true,
    });
    const after2 = useTransferPortal(refilled, 0);
    expect(after2).toBe(refilled); // unchanged
  });

  it('does nothing if the targeted row is empty', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    const state = createStatStackGameState(puzzle);
    const next = useTransferPortal(state, 0);
    expect(next).toBe(state);
  });
});

// ---- calculateStatStackScore ----

describe('calculateStatStackScore', () => {
  it('computes percentile relative to maxPossibleScore', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    puzzle.maxPossibleScore = 5000;
    let state = createStatStackGameState(puzzle);
    state = { ...state, totalStatValue: 2500 };
    const result = calculateStatStackScore(state);
    expect(result.percentile).toBe(50);
    expect(result.totalStatValue).toBe(2500);
    expect(result.finalScore).toBe(2500);
  });

  it('caps percentile at 100', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    puzzle.maxPossibleScore = 1000;
    let state = createStatStackGameState(puzzle);
    state = { ...state, totalStatValue: 2000 };
    const result = calculateStatStackScore(state);
    expect(result.percentile).toBe(100);
  });

  it('returns 0 percentile when maxPossibleScore is 0', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    puzzle.maxPossibleScore = 0;
    let state = createStatStackGameState(puzzle);
    state = { ...state, totalStatValue: 500 };
    const result = calculateStatStackScore(state);
    expect(result.percentile).toBe(0);
  });

  it('sums penalty points correctly', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    let state = createStatStackGameState(puzzle);
    state = {
      ...state,
      penalties: [
        { type: 'targeting', description: 'test', pointsLost: 100 },
        { type: 'targeting', description: 'test2', pointsLost: 200 },
      ],
    };
    const result = calculateStatStackScore(state);
    expect(result.penaltyTotal).toBe(300);
  });

  it('finalScore is never negative', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    let state = createStatStackGameState(puzzle);
    state = { ...state, totalStatValue: 0 };
    const result = calculateStatStackScore(state);
    expect(result.finalScore).toBeGreaterThanOrEqual(0);
  });
});

// ---- submitStatStackPick: year validation ----

describe('submitStatStackPick year-locked constraint enforcement', () => {
  function makeLockedYearState(lockedYear: number) {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    // Force row 0 to have a lockedYear constraint
    puzzle.rows[0] = {
      index: 0,
      description: `Player from the ${lockedYear} season`,
      validator: `year_${lockedYear}`,
      lockedYear,
    };
    return createStatStackGameState(puzzle);
  }

  it('rejects pick when player season does not match locked year', () => {
    const state = makeLockedYearState(2008);
    const wrongYearPick: StatStackPick = {
      rowIndex: 0,
      playerId: 'p1',
      playerName: 'Wrong Year Player',
      season: 2020, // does NOT match locked year 2008
      statValue: 1500,
      isValid: true,
    };
    const next = submitStatStackPick(state, wrongYearPick);
    // The pick should be placed but marked invalid with 0 stat value
    expect(next.picks[0]).not.toBeNull();
    expect(next.picks[0]!.isValid).toBe(false);
    expect(next.picks[0]!.statValue).toBe(0);
    expect(next.totalStatValue).toBe(0);
  });

  it('accepts pick when player season matches locked year', () => {
    const state = makeLockedYearState(2008);
    const correctYearPick: StatStackPick = {
      rowIndex: 0,
      playerId: 'p1',
      playerName: 'Correct Year Player',
      season: 2008, // matches locked year
      statValue: 1500,
      isValid: true,
    };
    const next = submitStatStackPick(state, correctYearPick);
    expect(next.picks[0]).not.toBeNull();
    expect(next.picks[0]!.isValid).toBe(true);
    expect(next.picks[0]!.statValue).toBe(1500);
    expect(next.totalStatValue).toBe(1500);
  });
});

// ---- submitStatStackPick: duplicate player prevention ----

describe('submitStatStackPick duplicate player prevention', () => {
  function makeState() {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    return createStatStackGameState(puzzle);
  }

  it('rejects duplicate player picks across different rows', () => {
    const state = makeState();
    const pick1: StatStackPick = {
      rowIndex: 0,
      playerId: 'p1',
      playerName: 'Test Player',
      season: 2020,
      statValue: 1000,
      isValid: true,
    };
    const after1 = submitStatStackPick(state, pick1);
    expect(after1.picks[0]).not.toBeNull();

    const pick2: StatStackPick = {
      rowIndex: 1,
      playerId: 'p1', // same player
      playerName: 'Test Player',
      season: 2020,
      statValue: 1000,
      isValid: true,
    };
    const after2 = submitStatStackPick(after1, pick2);
    // Should be rejected — state unchanged
    expect(after2).toBe(after1);
    expect(after2.picks[1]).toBeNull();
  });

  it('allows different players in different rows', () => {
    const puzzle = generateStatStackPuzzle('2025-01-06');
    // Clear any lockedYear constraints so season won't cause rejection
    puzzle.rows = puzzle.rows.map((r: any) => ({ ...r, lockedYear: undefined }));
    const state = createStatStackGameState(puzzle);

    const pick1: StatStackPick = {
      rowIndex: 0,
      playerId: 'p1',
      playerName: 'Player 1',
      season: 2020,
      statValue: 1000,
      isValid: true,
    };
    const after1 = submitStatStackPick(state, pick1);

    const pick2: StatStackPick = {
      rowIndex: 1,
      playerId: 'p2', // different player
      playerName: 'Player 2',
      season: 2020,
      statValue: 800,
      isValid: true,
    };
    const after2 = submitStatStackPick(after1, pick2);
    expect(after2.picks[0]).not.toBeNull();
    expect(after2.picks[1]).not.toBeNull();
    expect(after2.totalStatValue).toBe(1800);
  });
});
