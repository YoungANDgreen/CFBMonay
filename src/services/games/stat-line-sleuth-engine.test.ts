import {
  generateSleuthGame,
  revealNextHint,
  submitSleuthGuess,
} from './stat-line-sleuth-engine';

// ---- generateSleuthGame ----

describe('generateSleuthGame', () => {
  it('creates a game with the requested number of rounds', () => {
    const game = generateSleuthGame('2025-01-15', 4);
    expect(game.rounds).toHaveLength(4);
    expect(game.results).toHaveLength(4);
  });

  it('defaults to 5 rounds', () => {
    const game = generateSleuthGame('2025-01-15');
    expect(game.rounds).toHaveLength(5);
  });

  it('starts at round 0 with hint level 1 revealed', () => {
    const game = generateSleuthGame('2025-01-15');
    expect(game.currentRound).toBe(0);
    expect(game.hintsRevealed).toBe(1);
    expect(game.score).toBe(0);
    expect(game.isComplete).toBe(false);
  });

  it('each round has a statLine, hints, and answer', () => {
    const game = generateSleuthGame('2025-01-15', 3);
    for (const round of game.rounds) {
      expect(round.statLine).toBeDefined();
      expect(round.hints).toBeDefined();
      expect(round.hints.length).toBeGreaterThanOrEqual(1);
      expect(round.answer).toBeDefined();
      expect(round.answer.playerName).toBeTruthy();
    }
  });

  it('is deterministic for the same date', () => {
    const g1 = generateSleuthGame('2025-06-01', 3);
    const g2 = generateSleuthGame('2025-06-01', 3);
    expect(g1.rounds.map(r => r.playerId)).toEqual(g2.rounds.map(r => r.playerId));
  });

  it('clamps roundCount to available data', () => {
    const game = generateSleuthGame('2025-01-15', 100);
    // Should not exceed the number of available rounds (8 in the data)
    expect(game.rounds.length).toBeLessThanOrEqual(8);
  });
});

// ---- revealNextHint ----

describe('revealNextHint', () => {
  it('increments hintsRevealed from 1 to 2', () => {
    const game = generateSleuthGame('2025-01-15');
    const next = revealNextHint(game);
    expect(next.hintsRevealed).toBe(2);
  });

  it('increments hintsRevealed from 2 to 3', () => {
    let game = generateSleuthGame('2025-01-15');
    game = revealNextHint(game);
    const next = revealNextHint(game);
    expect(next.hintsRevealed).toBe(3);
  });

  it('does not increment beyond 3', () => {
    let game = generateSleuthGame('2025-01-15');
    game = revealNextHint(game); // 2
    game = revealNextHint(game); // 3
    const next = revealNextHint(game); // still 3
    expect(next.hintsRevealed).toBe(3);
    expect(next).toBe(game);
  });

  it('does nothing when game is complete', () => {
    let game = generateSleuthGame('2025-01-15');
    game = { ...game, isComplete: true };
    const next = revealNextHint(game);
    expect(next).toBe(game);
  });
});

// ---- submitSleuthGuess ----

describe('submitSleuthGuess', () => {
  it('awards points for a correct guess', () => {
    const game = generateSleuthGame('2025-01-15', 3);
    const answer = game.rounds[0].answer.playerName;
    const next = submitSleuthGuess(game, answer);
    expect(next.results[0]).toBe('correct');
    expect(next.score).toBeGreaterThan(0);
    expect(next.currentRound).toBe(1);
  });

  it('awards 0 points for an incorrect guess', () => {
    const game = generateSleuthGame('2025-01-15', 3);
    const next = submitSleuthGuess(game, 'Totally Wrong Name');
    expect(next.results[0]).toBe('incorrect');
    expect(next.score).toBe(0);
    expect(next.currentRound).toBe(1);
  });

  it('awards more points with fewer hints revealed', () => {
    // Guess with 1 hint
    const game1 = generateSleuthGame('2025-01-15', 3);
    const answer = game1.rounds[0].answer.playerName;
    const next1 = submitSleuthGuess(game1, answer);

    // Guess with 2 hints
    let game2 = generateSleuthGame('2025-01-15', 3);
    game2 = revealNextHint(game2);
    const next2 = submitSleuthGuess(game2, answer);

    // Guess with 3 hints
    let game3 = generateSleuthGame('2025-01-15', 3);
    game3 = revealNextHint(game3);
    game3 = revealNextHint(game3);
    const next3 = submitSleuthGuess(game3, answer);

    // Points: (4 - hintsRevealed) * 10
    // 1 hint: 30 pts, 2 hints: 20 pts, 3 hints: 10 pts
    expect(next1.score).toBe(30);
    expect(next2.score).toBe(20);
    expect(next3.score).toBe(10);
  });

  it('resets hints to 1 for the next round', () => {
    const game = generateSleuthGame('2025-01-15', 3);
    let state = revealNextHint(game); // 2 hints
    const answer = state.rounds[0].answer.playerName;
    state = submitSleuthGuess(state, answer);
    expect(state.hintsRevealed).toBe(1); // reset
  });

  it('handles case-insensitive and whitespace-trimmed names', () => {
    const game = generateSleuthGame('2025-01-15', 3);
    const answer = game.rounds[0].answer.playerName;
    const next = submitSleuthGuess(game, '  ' + answer.toUpperCase() + '  ');
    expect(next.results[0]).toBe('correct');
  });

  it('marks game complete when all rounds are answered', () => {
    let game = generateSleuthGame('2025-01-15', 2);
    for (let i = 0; i < 2; i++) {
      const answer = game.rounds[game.currentRound].answer.playerName;
      game = submitSleuthGuess(game, answer);
    }
    expect(game.isComplete).toBe(true);
  });

  it('does nothing when game is already complete', () => {
    let game = generateSleuthGame('2025-01-15', 1);
    const answer = game.rounds[0].answer.playerName;
    game = submitSleuthGuess(game, answer);
    expect(game.isComplete).toBe(true);
    const after = submitSleuthGuess(game, 'anything');
    expect(after).toBe(game);
  });
});
