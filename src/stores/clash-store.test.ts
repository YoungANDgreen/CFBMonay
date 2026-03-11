// ============================================================
// GridIron IQ — Conference Clash Store Unit Tests
// ============================================================

import { useClashStore } from './clash-store';

const mockBlindResumeState = {
  id: 'br-1',
  stats: { wins: 11, losses: 2, pointsPerGame: 34.5 },
  answer: { team: 'Georgia', year: 2022 },
  guesses: [],
  isComplete: false,
  isCorrect: false,
  hintsRevealed: 0,
};

const mockSleuthState = {
  id: 'sleuth-1',
  statLine: { passingYards: 4500, touchdowns: 40, interceptions: 4 },
  answer: 'Joe Burrow',
  hints: ['LSU', '2019 Season', 'Heisman Winner'],
  hintsRevealed: 0,
  guesses: [],
  isComplete: false,
  isCorrect: false,
};

const mockSleuthAfterHint = {
  ...mockSleuthState,
  hintsRevealed: 1,
};

const mockRosterRouletteState = {
  id: 'rr-1',
  team: 'Alabama',
  year: 2020,
  players: [],
  guesses: [],
  score: 0,
  isComplete: false,
};

const mockFilmRoomState = {
  id: 'fr-1',
  playDescription: 'A quick slant route',
  options: ['Play A', 'Play B', 'Play C', 'Play D'],
  correctIndex: 2,
  selectedIndex: null,
  isComplete: false,
};

jest.mock('@/services/games/blind-resume-engine', () => ({
  generateBlindResumeGameWithCache: jest.fn(() => Promise.resolve({ ...mockBlindResumeState })),
  submitBlindResumeGuess: jest.fn((state: any, team: string, year: number) => ({
    ...state,
    guesses: [...state.guesses, { team, year }],
    isComplete: team === state.answer.team && year === state.answer.year,
    isCorrect: team === state.answer.team && year === state.answer.year,
  })),
}));

jest.mock('@/services/games/stat-line-sleuth-engine', () => ({
  generateSleuthGameWithCache: jest.fn(() => ({ ...mockSleuthState })),
  submitSleuthGuess: jest.fn((state: any, playerName: string) => ({
    ...state,
    guesses: [...state.guesses, playerName],
    isComplete: playerName === state.answer,
    isCorrect: playerName === state.answer,
  })),
  revealNextHint: jest.fn((state: any) => ({
    ...state,
    hintsRevealed: state.hintsRevealed + 1,
  })),
}));

jest.mock('@/services/games/roster-roulette-engine', () => ({
  generateRosterRouletteGameWithCache: jest.fn((_date: string, difficulty: string) => ({
    ...mockRosterRouletteState,
    difficulty,
  })),
  submitRosterGuess: jest.fn((state: any, name: string) => ({
    ...state,
    guesses: [...state.guesses, name],
    score: state.score + 10,
  })),
  endRosterRoulette: jest.fn((state: any) => ({
    ...state,
    isComplete: true,
  })),
}));

jest.mock('@/services/games/film-room-engine', () => ({
  generateFilmRoomGameWithCache: jest.fn(() => ({ ...mockFilmRoomState })),
  submitFilmRoomGuess: jest.fn((state: any, optionIndex: number) => ({
    ...state,
    selectedIndex: optionIndex,
    isComplete: true,
  })),
}));

beforeEach(() => {
  useClashStore.setState({
    activeMode: null,
    blindResume: null,
    sleuth: null,
    rosterRoulette: null,
    filmRoom: null,
  });
});

describe('useClashStore', () => {
  describe('setActiveMode', () => {
    it('changes the active mode', () => {
      useClashStore.getState().setActiveMode('blind_resume');
      expect(useClashStore.getState().activeMode).toBe('blind_resume');
    });

    it('can set mode to null', () => {
      useClashStore.getState().setActiveMode('blind_resume');
      useClashStore.getState().setActiveMode(null);
      expect(useClashStore.getState().activeMode).toBeNull();
    });
  });

  describe('Blind Resume', () => {
    it('startBlindResume creates a game and sets mode', async () => {
      await useClashStore.getState().startBlindResume();

      const { blindResume, activeMode } = useClashStore.getState();
      expect(activeMode).toBe('blind_resume');
      expect(blindResume).not.toBeNull();
      expect(blindResume!.isComplete).toBe(false);
      expect((blindResume as any).guesses).toEqual([]);
    });

    it('guessBlindResume processes an incorrect answer', async () => {
      await useClashStore.getState().startBlindResume();
      useClashStore.getState().guessBlindResume('Alabama', 2021);

      const { blindResume } = useClashStore.getState();
      expect((blindResume as any).guesses).toHaveLength(1);
      expect((blindResume as any).isCorrect).toBe(false);
      expect(blindResume!.isComplete).toBe(false);
    });

    it('guessBlindResume processes a correct answer', async () => {
      await useClashStore.getState().startBlindResume();
      useClashStore.getState().guessBlindResume('Georgia', 2022);

      const { blindResume } = useClashStore.getState();
      expect((blindResume as any).isCorrect).toBe(true);
      expect(blindResume!.isComplete).toBe(true);
    });

    it('guessBlindResume does nothing without active game', () => {
      useClashStore.getState().guessBlindResume('Georgia', 2022);
      expect(useClashStore.getState().blindResume).toBeNull();
    });
  });

  describe('Stat Line Sleuth', () => {
    it('startSleuth creates a game and sets mode', () => {
      useClashStore.getState().startSleuth();

      const { sleuth, activeMode } = useClashStore.getState();
      expect(activeMode).toBe('stat_line_sleuth');
      expect(sleuth).not.toBeNull();
      expect(sleuth!.hintsRevealed).toBe(0);
    });

    it('guessSleuth processes a guess', () => {
      useClashStore.getState().startSleuth();
      useClashStore.getState().guessSleuth('Lamar Jackson');

      const { sleuth } = useClashStore.getState();
      expect((sleuth as any).guesses).toHaveLength(1);
      expect((sleuth as any).isCorrect).toBe(false);
    });

    it('guessSleuth processes a correct guess', () => {
      useClashStore.getState().startSleuth();
      useClashStore.getState().guessSleuth('Joe Burrow');

      const { sleuth } = useClashStore.getState();
      expect((sleuth as any).isCorrect).toBe(true);
      expect(sleuth!.isComplete).toBe(true);
    });

    it('revealSleuthHint increments hints revealed', () => {
      useClashStore.getState().startSleuth();
      useClashStore.getState().revealSleuthHint();

      const { sleuth } = useClashStore.getState();
      expect(sleuth!.hintsRevealed).toBe(1);
    });

    it('revealSleuthHint does nothing without active game', () => {
      useClashStore.getState().revealSleuthHint();
      expect(useClashStore.getState().sleuth).toBeNull();
    });

    it('guessSleuth does nothing without active game', () => {
      useClashStore.getState().guessSleuth('Joe Burrow');
      expect(useClashStore.getState().sleuth).toBeNull();
    });
  });

  describe('Roster Roulette', () => {
    it('startRosterRoulette creates a game with default difficulty', () => {
      useClashStore.getState().startRosterRoulette();

      const { rosterRoulette, activeMode } = useClashStore.getState();
      expect(activeMode).toBe('roster_roulette');
      expect(rosterRoulette).not.toBeNull();
      expect((rosterRoulette as any).difficulty).toBe('medium');
    });

    it('startRosterRoulette respects difficulty parameter', () => {
      useClashStore.getState().startRosterRoulette('hard');

      const { rosterRoulette } = useClashStore.getState();
      expect((rosterRoulette as any).difficulty).toBe('hard');
    });

    it('guessRosterPlayer adds a guess and increments score', () => {
      useClashStore.getState().startRosterRoulette();
      useClashStore.getState().guessRosterPlayer('Derrick Henry');

      const { rosterRoulette } = useClashStore.getState();
      expect((rosterRoulette as any).guesses).toHaveLength(1);
      expect(rosterRoulette!.score).toBe(10);
    });

    it('endRoulette marks game as complete', () => {
      useClashStore.getState().startRosterRoulette();
      useClashStore.getState().endRoulette();

      expect(useClashStore.getState().rosterRoulette!.isComplete).toBe(true);
    });
  });

  describe('Film Room', () => {
    it('startFilmRoom creates a game and sets mode', () => {
      useClashStore.getState().startFilmRoom();

      const { filmRoom, activeMode } = useClashStore.getState();
      expect(activeMode).toBe('film_room');
      expect(filmRoom).not.toBeNull();
      expect((filmRoom as any).selectedIndex).toBeNull();
    });

    it('guessFilmRoom processes a selection', () => {
      useClashStore.getState().startFilmRoom();
      useClashStore.getState().guessFilmRoom(2);

      const { filmRoom } = useClashStore.getState();
      expect((filmRoom as any).selectedIndex).toBe(2);
      expect(filmRoom!.isComplete).toBe(true);
    });
  });

  describe('resetAll', () => {
    it('clears all game state and mode', async () => {
      await useClashStore.getState().startBlindResume();
      useClashStore.getState().startSleuth();
      useClashStore.getState().startFilmRoom();

      useClashStore.getState().resetAll();

      const state = useClashStore.getState();
      expect(state.activeMode).toBeNull();
      expect(state.blindResume).toBeNull();
      expect(state.sleuth).toBeNull();
      expect(state.rosterRoulette).toBeNull();
      expect(state.filmRoom).toBeNull();
    });
  });
});
