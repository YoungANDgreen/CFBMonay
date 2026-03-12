import {
  generateFilmRoomGame,
  submitFilmRoomGuess,
  disguiseDescription,
} from './film-room-engine';

// ---- generateFilmRoomGame ----

describe('generateFilmRoomGame', () => {
  it('creates a game with the requested number of rounds', () => {
    const game = generateFilmRoomGame('2025-01-15', 4);
    expect(game.rounds).toHaveLength(4);
    expect(game.results).toHaveLength(4);
  });

  it('defaults to 5 rounds', () => {
    const game = generateFilmRoomGame('2025-01-15');
    expect(game.rounds).toHaveLength(5);
  });

  it('clamps roundCount to available data', () => {
    const game = generateFilmRoomGame('2025-01-15', 100);
    // Only 8 entries in the data
    expect(game.rounds.length).toBeLessThanOrEqual(8);
  });

  it('starts at round 0 with 0 score and not complete', () => {
    const game = generateFilmRoomGame('2025-01-15');
    expect(game.currentRound).toBe(0);
    expect(game.score).toBe(0);
    expect(game.isComplete).toBe(false);
  });

  it('all results start as pending', () => {
    const game = generateFilmRoomGame('2025-01-15');
    expect(game.results.every(r => r === 'pending')).toBe(true);
  });

  it('each round has a description, options, and a valid correctIndex', () => {
    const game = generateFilmRoomGame('2025-01-15', 5);
    for (const round of game.rounds) {
      expect(round.description).toBeTruthy();
      expect(round.options.length).toBe(4);
      expect(round.correctIndex).toBeGreaterThanOrEqual(0);
      expect(round.correctIndex).toBeLessThan(4);
    }
  });

  it('is deterministic for the same date', () => {
    const g1 = generateFilmRoomGame('2025-06-01', 5);
    const g2 = generateFilmRoomGame('2025-06-01', 5);
    expect(g1.rounds.map(r => r.description)).toEqual(
      g2.rounds.map(r => r.description)
    );
    expect(g1.rounds.map(r => r.correctIndex)).toEqual(
      g2.rounds.map(r => r.correctIndex)
    );
  });
});

// ---- submitFilmRoomGuess ----

describe('submitFilmRoomGuess', () => {
  it('identifies a correct guess and awards 20 points', () => {
    const game = generateFilmRoomGame('2025-01-15', 3);
    const correctIdx = game.rounds[0].correctIndex;
    const next = submitFilmRoomGuess(game, correctIdx);
    expect(next.results[0]).toBe('correct');
    expect(next.score).toBe(20);
    expect(next.currentRound).toBe(1);
  });

  it('identifies an incorrect guess and awards 0 points', () => {
    const game = generateFilmRoomGame('2025-01-15', 3);
    const correctIdx = game.rounds[0].correctIndex;
    const wrongIdx = (correctIdx + 1) % 4;
    const next = submitFilmRoomGuess(game, wrongIdx);
    expect(next.results[0]).toBe('incorrect');
    expect(next.score).toBe(0);
    expect(next.currentRound).toBe(1);
  });

  it('accumulates score across multiple correct rounds', () => {
    let game = generateFilmRoomGame('2025-01-15', 3);
    for (let i = 0; i < 3; i++) {
      const correctIdx = game.rounds[game.currentRound].correctIndex;
      game = submitFilmRoomGuess(game, correctIdx);
    }
    expect(game.score).toBe(60); // 3 * 20
    expect(game.isComplete).toBe(true);
  });

  it('marks game complete after the last round', () => {
    let game = generateFilmRoomGame('2025-01-15', 2);
    for (let i = 0; i < 2; i++) {
      const correctIdx = game.rounds[game.currentRound].correctIndex;
      game = submitFilmRoomGuess(game, correctIdx);
    }
    expect(game.isComplete).toBe(true);
    expect(game.currentRound).toBe(2);
  });

  it('does nothing when game is already complete', () => {
    let game = generateFilmRoomGame('2025-01-15', 1);
    const correctIdx = game.rounds[0].correctIndex;
    game = submitFilmRoomGuess(game, correctIdx);
    expect(game.isComplete).toBe(true);
    const after = submitFilmRoomGuess(game, 0);
    expect(after).toBe(game);
  });

  it('does nothing for an out-of-range selectedIndex', () => {
    const game = generateFilmRoomGame('2025-01-15', 3);
    const after1 = submitFilmRoomGuess(game, -1);
    expect(after1).toBe(game);
    const after2 = submitFilmRoomGuess(game, 4);
    expect(after2).toBe(game);
  });

  it('can complete all rounds with a mix of correct and incorrect', () => {
    let game = generateFilmRoomGame('2025-01-15', 4);
    for (let i = 0; i < 4; i++) {
      const correctIdx = game.rounds[game.currentRound].correctIndex;
      // Alternate correct / incorrect
      if (i % 2 === 0) {
        game = submitFilmRoomGuess(game, correctIdx);
      } else {
        game = submitFilmRoomGuess(game, (correctIdx + 1) % 4);
      }
    }
    expect(game.isComplete).toBe(true);
    expect(game.score).toBe(40); // 2 correct * 20
    expect(game.results.filter(r => r === 'correct')).toHaveLength(2);
    expect(game.results.filter(r => r === 'incorrect')).toHaveLength(2);
  });
});

// ---- disguiseDescription ----

describe('disguiseDescription', () => {
  it('replaces team names with hints in partial mode', () => {
    const result = disguiseDescription(
      'Alabama demolished Auburn 55-24',
      'Alabama', 'Auburn',
      { home: 'a top-5 SEC powerhouse', away: 'their in-state rival' },
      'partial'
    );
    expect(result).not.toContain('Alabama');
    expect(result).not.toContain('Auburn');
    expect(result).toContain('a top-5 SEC powerhouse');
  });

  it('uses Team A/B in full mode', () => {
    const result = disguiseDescription(
      'Alabama beat Auburn in overtime',
      'Alabama', 'Auburn',
      undefined,
      'full'
    );
    expect(result).toContain('Team A');
    expect(result).toContain('Team B');
  });

  it('handles case-insensitive replacement', () => {
    const result = disguiseDescription(
      'ALABAMA vs alabama',
      'Alabama', 'Auburn',
      { home: 'Team X', away: 'Team Y' },
      'partial'
    );
    expect(result).not.toMatch(/alabama/i);
  });

  it('defaults to partial mode', () => {
    const result = disguiseDescription(
      'Alabama faced Auburn',
      'Alabama', 'Auburn',
      { home: 'the home squad', away: 'the visitors' }
    );
    expect(result).toContain('the home squad');
    expect(result).toContain('the visitors');
  });

  it('uses default labels when hints are not provided in partial mode', () => {
    const result = disguiseDescription(
      'Alabama beat Auburn',
      'Alabama', 'Auburn',
      undefined,
      'partial'
    );
    expect(result).toContain('the home team');
    expect(result).toContain('the visiting team');
  });
});
