import {
  generateBlindResumeGame,
  submitBlindResumeGuess,
} from './blind-resume-engine';

// ---- generateBlindResumeGame ----

describe('generateBlindResumeGame', () => {
  it('creates a game with the requested number of rounds', () => {
    const game = generateBlindResumeGame('2025-01-15', 5);
    expect(game.rounds).toHaveLength(5);
    expect(game.results).toHaveLength(5);
  });

  it('defaults to 10 rounds', () => {
    const game = generateBlindResumeGame('2025-01-15');
    expect(game.rounds).toHaveLength(10);
  });

  it('starts at round 0 with 0 score', () => {
    const game = generateBlindResumeGame('2025-01-15');
    expect(game.currentRound).toBe(0);
    expect(game.score).toBe(0);
    expect(game.isComplete).toBe(false);
    expect(game.guessesUsed).toBe(0);
  });

  it('all results start as pending', () => {
    const game = generateBlindResumeGame('2025-01-15');
    expect(game.results.every(r => r === 'pending')).toBe(true);
  });

  it('each round has anonymized stats and an answer', () => {
    const game = generateBlindResumeGame('2025-01-15', 3);
    for (const round of game.rounds) {
      expect(round.anonymizedStats).toBeDefined();
      expect(round.anonymizedStats.wins).toBeDefined();
      expect(round.anonymizedStats.pointsScored).toBeDefined();
      expect(round.answer).toBeDefined();
      expect(round.answer.team).toBeTruthy();
      expect(round.answer.year).toBeGreaterThan(2000);
    }
  });

  it('is deterministic for the same date', () => {
    const g1 = generateBlindResumeGame('2025-06-01', 5);
    const g2 = generateBlindResumeGame('2025-06-01', 5);
    expect(g1.rounds.map(r => r.teamId)).toEqual(g2.rounds.map(r => r.teamId));
  });

  it('cycles through data when roundCount exceeds available seasons', () => {
    const game = generateBlindResumeGame('2025-01-15', 20);
    expect(game.rounds).toHaveLength(20);
  });
});

// ---- submitBlindResumeGuess ----

describe('submitBlindResumeGuess', () => {
  it('returns correct for a right answer and awards points', () => {
    const game = generateBlindResumeGame('2025-01-15', 3);
    const answer = game.rounds[0].answer;
    const next = submitBlindResumeGuess(game, answer.team, answer.year);
    expect(next.results[0]).toBe('correct');
    expect(next.score).toBeGreaterThan(0);
    expect(next.currentRound).toBe(1);
    expect(next.guessesUsed).toBe(0); // reset for next round
  });

  it('returns incorrect for a wrong answer on first guess but allows more guesses', () => {
    const game = generateBlindResumeGame('2025-01-15', 3);
    const next = submitBlindResumeGuess(game, 'Wrong Team', 1999);
    // Still on same round with one guess used
    expect(next.currentRound).toBe(0);
    expect(next.guessesUsed).toBe(1);
    expect(next.results[0]).toBe('pending');
  });

  it('marks round incorrect after all guesses exhausted', () => {
    let game = generateBlindResumeGame('2025-01-15', 3);
    // Use all 3 guesses with wrong answers
    for (let i = 0; i < game.guessesPerRound; i++) {
      game = submitBlindResumeGuess(game, 'Wrong Team', 1900);
    }
    expect(game.results[0]).toBe('incorrect');
    expect(game.currentRound).toBe(1);
    expect(game.score).toBe(0);
  });

  it('awards more points for fewer guesses used', () => {
    // Correct on first guess
    const game1 = generateBlindResumeGame('2025-01-15', 3);
    const answer1 = game1.rounds[0].answer;
    const next1 = submitBlindResumeGuess(game1, answer1.team, answer1.year);

    // Correct on second guess
    let game2 = generateBlindResumeGame('2025-01-15', 3);
    game2 = submitBlindResumeGuess(game2, 'Wrong', 1999); // first guess wrong
    const answer2 = game2.rounds[0].answer;
    const next2 = submitBlindResumeGuess(game2, answer2.team, answer2.year);

    expect(next1.score).toBeGreaterThan(next2.score);
  });

  it('progresses through all rounds and marks game complete', () => {
    let game = generateBlindResumeGame('2025-01-15', 3);
    for (let i = 0; i < 3; i++) {
      const answer = game.rounds[game.currentRound].answer;
      game = submitBlindResumeGuess(game, answer.team, answer.year);
    }
    expect(game.isComplete).toBe(true);
    expect(game.currentRound).toBe(3);
  });

  it('does nothing when game is already complete', () => {
    let game = generateBlindResumeGame('2025-01-15', 1);
    const answer = game.rounds[0].answer;
    game = submitBlindResumeGuess(game, answer.team, answer.year);
    expect(game.isComplete).toBe(true);
    const afterComplete = submitBlindResumeGuess(game, 'Alabama', 2020);
    expect(afterComplete).toBe(game);
  });

  it('handles case-insensitive team name matching', () => {
    const game = generateBlindResumeGame('2025-01-15', 3);
    const answer = game.rounds[0].answer;
    const next = submitBlindResumeGuess(game, answer.team.toLowerCase(), answer.year);
    expect(next.results[0]).toBe('correct');
  });
});
