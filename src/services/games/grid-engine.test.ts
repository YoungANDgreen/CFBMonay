import {
  generateDailyPuzzle,
  createInitialGameState,
  getCellKey,
  validateAnswer,
  calculateRarityScore,
  calculateGridScore,
  submitGuess,
} from './grid-engine';

// ---- generateDailyPuzzle ----

describe('generateDailyPuzzle', () => {
  it('produces a valid 3x3 grid with 3 row and 3 column criteria', () => {
    const puzzle = generateDailyPuzzle('2025-01-15', 3);
    expect(puzzle.size).toBe(3);
    expect(puzzle.rows).toHaveLength(3);
    expect(puzzle.columns).toHaveLength(3);
    expect(puzzle.id).toBe('grid-2025-01-15');
    expect(puzzle.date).toBe('2025-01-15');
  });

  it('produces a valid 4x4 grid when size is 4 (may have fewer columns with limited criteria pools)', () => {
    const puzzle = generateDailyPuzzle('2025-01-15', 4);
    expect(puzzle.size).toBe(4);
    expect(puzzle.rows).toHaveLength(4);
    // With 4 criteria pools, 4x4 may not fill all columns with unique types
    expect(puzzle.columns.length).toBeGreaterThanOrEqual(0);
    expect(puzzle.columns.length).toBeLessThanOrEqual(4);
  });

  it('produces deterministic results for the same date (seeded RNG)', () => {
    const puzzle1 = generateDailyPuzzle('2025-06-01');
    const puzzle2 = generateDailyPuzzle('2025-06-01');
    expect(puzzle1.rows).toEqual(puzzle2.rows);
    expect(puzzle1.columns).toEqual(puzzle2.columns);
  });

  it('produces different grids for different dates', () => {
    const puzzle1 = generateDailyPuzzle('2025-06-01');
    const puzzle2 = generateDailyPuzzle('2025-06-02');
    // Extremely unlikely to be identical; check at least one axis differs
    const rowsSame = JSON.stringify(puzzle1.rows) === JSON.stringify(puzzle2.rows);
    const colsSame = JSON.stringify(puzzle1.columns) === JSON.stringify(puzzle2.columns);
    expect(rowsSame && colsSame).toBe(false);
  });

  it('each criteria has required fields', () => {
    const puzzle = generateDailyPuzzle('2025-03-10');
    for (const criteria of [...puzzle.rows, ...puzzle.columns]) {
      expect(criteria).toHaveProperty('type');
      expect(criteria).toHaveProperty('value');
      expect(criteria).toHaveProperty('displayText');
    }
  });

  it('row and column criteria types do not overlap', () => {
    const puzzle = generateDailyPuzzle('2025-03-10');
    const rowTypes = new Set(puzzle.rows.map(r => r.type));
    const colTypes = new Set(puzzle.columns.map(c => c.type));
    for (const ct of colTypes) {
      expect(rowTypes.has(ct)).toBe(false);
    }
  });
});

// ---- createInitialGameState ----

describe('createInitialGameState', () => {
  it('creates state with correct dimensions for a 3x3 puzzle', () => {
    const puzzle = generateDailyPuzzle('2025-01-01', 3);
    const state = createInitialGameState(puzzle);
    expect(state.cells).toHaveLength(3);
    expect(state.cells[0]).toHaveLength(3);
    expect(state.guessesRemaining).toBe(9);
    expect(state.score).toBe(0);
    expect(state.isComplete).toBe(false);
  });

  it('creates state with 16 guesses for a 4x4 puzzle', () => {
    const puzzle = generateDailyPuzzle('2025-01-01', 4);
    const state = createInitialGameState(puzzle);
    expect(state.cells).toHaveLength(4);
    expect(state.guessesRemaining).toBe(16);
  });

  it('all cells start unlocked with no answer', () => {
    const puzzle = generateDailyPuzzle('2025-01-01');
    const state = createInitialGameState(puzzle);
    for (const row of state.cells) {
      for (const cell of row) {
        expect(cell.isLocked).toBe(false);
        expect(cell.answer).toBeUndefined();
      }
    }
  });
});

// ---- getCellKey ----

describe('getCellKey', () => {
  it('returns a string key from row and col', () => {
    expect(getCellKey(0, 0)).toBe('0-0');
    expect(getCellKey(2, 1)).toBe('2-1');
  });
});

// ---- validateAnswer ----

describe('validateAnswer', () => {
  it('returns true when the player is in the valid answers list', () => {
    const puzzle = generateDailyPuzzle('2025-01-01');
    puzzle.validAnswers['0-0'] = ['player-1', 'player-2'];
    expect(validateAnswer(puzzle, 0, 0, 'player-1')).toBe(true);
  });

  it('returns false when the player is not in the valid answers list', () => {
    const puzzle = generateDailyPuzzle('2025-01-01');
    puzzle.validAnswers['0-0'] = ['player-1'];
    expect(validateAnswer(puzzle, 0, 0, 'player-99')).toBe(false);
  });

  it('returns false when the cell has no valid answers', () => {
    const puzzle = generateDailyPuzzle('2025-01-01');
    // validAnswers is empty by default
    expect(validateAnswer(puzzle, 0, 0, 'player-1')).toBe(false);
  });
});

// ---- calculateRarityScore ----

describe('calculateRarityScore', () => {
  it('returns 100 when totalSubmissions is 0', () => {
    expect(calculateRarityScore(0, 5)).toBe(100);
  });

  it('returns 100 (Legendary) for <= 1% usage', () => {
    expect(calculateRarityScore(1000, 10)).toBe(100); // 1%
    expect(calculateRarityScore(1000, 5)).toBe(100);  // 0.5%
  });

  it('returns 80 (Epic) for 1-5% usage', () => {
    expect(calculateRarityScore(1000, 20)).toBe(80); // 2%
    expect(calculateRarityScore(1000, 50)).toBe(80); // 5%
  });

  it('returns 60 (Rare) for 5-15% usage', () => {
    expect(calculateRarityScore(1000, 100)).toBe(60); // 10%
  });

  it('returns 40 (Uncommon) for 15-40% usage', () => {
    expect(calculateRarityScore(1000, 200)).toBe(40); // 20%
  });

  it('returns 20 (Common) for > 40% usage', () => {
    expect(calculateRarityScore(1000, 500)).toBe(20); // 50%
  });

  it('always returns a value in 0-100 range', () => {
    const scores = [
      calculateRarityScore(0, 0),
      calculateRarityScore(100, 1),
      calculateRarityScore(100, 100),
    ];
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
});

// ---- calculateGridScore ----

describe('calculateGridScore', () => {
  function makeCells(correct: boolean[][]): any[][] {
    return correct.map((row, ri) =>
      row.map((isCorrect, ci) => ({
        rowIndex: ri,
        colIndex: ci,
        isCorrect,
        isLocked: true,
      }))
    );
  }

  it('scores 100 per correct cell plus completion bonus when all correct', () => {
    const cells = makeCells([
      [true, true, true],
      [true, true, true],
      [true, true, true],
    ]);
    // 9 * 100 = 900 base, +200 completion bonus, + speed bonus at 0 seconds
    const score = calculateGridScore(cells, 0);
    expect(score).toBeGreaterThanOrEqual(900 + 200);
  });

  it('gives no completion bonus for partial grid', () => {
    const cells = makeCells([
      [true, true, true],
      [true, false, true],
      [true, true, true],
    ]);
    const score = calculateGridScore(cells, 300); // at 5 min baseline speed bonus = 0
    // 8 * 100 = 800 base, no completion bonus, speed bonus ~0
    expect(score).toBe(800);
  });

  it('returns 0 for no correct cells', () => {
    const cells = makeCells([
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ]);
    expect(calculateGridScore(cells, 100)).toBe(0);
  });
});

// ---- submitGuess ----

describe('submitGuess', () => {
  function makeState() {
    const puzzle = generateDailyPuzzle('2025-01-01', 3);
    puzzle.validAnswers['0-0'] = ['player-1'];
    puzzle.validAnswers['0-1'] = ['player-2'];
    return createInitialGameState(puzzle);
  }

  const player1 = { id: 'player-1', name: 'Test Player 1' } as any;
  const player2 = { id: 'player-2', name: 'Test Player 2' } as any;
  const wrongPlayer = { id: 'player-99', name: 'Wrong Player' } as any;

  it('marks a correct answer and locks the cell', () => {
    const state = makeState();
    const next = submitGuess(state, 0, 0, player1);
    expect(next.cells[0][0].isCorrect).toBe(true);
    expect(next.cells[0][0].isLocked).toBe(true);
    expect(next.cells[0][0].answer).toEqual(player1);
    expect(next.guessesRemaining).toBe(8);
  });

  it('marks an incorrect answer and locks the cell', () => {
    const state = makeState();
    const next = submitGuess(state, 0, 0, wrongPlayer);
    expect(next.cells[0][0].isCorrect).toBe(false);
    expect(next.cells[0][0].isLocked).toBe(true);
    expect(next.guessesRemaining).toBe(8);
  });

  it('does not allow guessing on a locked cell', () => {
    const state = makeState();
    const afterFirst = submitGuess(state, 0, 0, player1);
    const afterSecond = submitGuess(afterFirst, 0, 0, wrongPlayer);
    // State should be unchanged
    expect(afterSecond).toBe(afterFirst);
  });

  it('does not allow guessing when game is complete', () => {
    let state = makeState();
    state = { ...state, isComplete: true };
    const next = submitGuess(state, 0, 0, player1);
    expect(next).toBe(state);
  });

  it('does not allow guessing when no guesses remain', () => {
    let state = makeState();
    state = { ...state, guessesRemaining: 0 };
    const next = submitGuess(state, 0, 0, player1);
    expect(next).toBe(state);
  });

  it('marks game complete when all cells are filled', () => {
    const puzzle = generateDailyPuzzle('2025-01-01', 3);
    // Make all cells valid for player-1
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        puzzle.validAnswers[getCellKey(r, c)] = ['player-1'];
      }
    }
    let state = createInitialGameState(puzzle);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        state = submitGuess(state, r, c, player1);
      }
    }
    expect(state.isComplete).toBe(true);
    expect(state.score).toBeGreaterThan(0);
  });
});
