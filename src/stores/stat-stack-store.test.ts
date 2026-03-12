// ============================================================
// GridIron IQ — Stat Stack Store Unit Tests
// ============================================================

import { useStatStackStore } from './stat-stack-store';

const mockPuzzle = {
  id: 'ss-puzzle-1',
  category: 'Rushing Yards',
  maxPicks: 5,
};

const mockGameState = {
  puzzle: mockPuzzle,
  picks: [],
  currentPickIndex: 0,
  maxPicks: 5,
  isComplete: false,
  transferPortalUsed: false,
  penalties: [],
};

const mockPick: any = {
  playerId: 'player-1',
  playerName: 'Derrick Henry',
  team: 'Alabama',
  season: '2015',
  statValue: 2219,
};

const mockCompletedState = {
  ...mockGameState,
  picks: [mockPick, mockPick, mockPick, mockPick, mockPick],
  currentPickIndex: 5,
  isComplete: true,
};

const mockScoreBreakdown = {
  totalStatValue: 8500,
  percentile: 92,
  penaltyTotal: 0,
  finalScore: 8500,
};

jest.mock('@/services/games/stat-stack-engine', () => ({
  generateStatStackPuzzleWithCache: jest.fn(() => Promise.resolve(mockPuzzle)),
  createStatStackGameState: jest.fn(() => ({ ...mockGameState })),
  submitStatStackPick: jest.fn((state: any, pick: any) => {
    const newPicks = [...state.picks, pick];
    const isComplete = newPicks.length >= state.maxPicks;
    return {
      ...state,
      picks: newPicks,
      currentPickIndex: state.currentPickIndex + 1,
      isComplete,
    };
  }),
  useTransferPortal: jest.fn((state: any, _rowIndex: number) => ({
    ...state,
    transferPortalUsed: true,
    picks: state.picks.slice(0, -1),
    currentPickIndex: state.currentPickIndex - 1,
  })),
  calculateStatStackScore: jest.fn(() => mockScoreBreakdown),
}));

beforeEach(() => {
  useStatStackStore.setState({
    gameState: null,
    searchQuery: '',
    isSearching: false,
    scoreBreakdown: null,
  });
});

describe('useStatStackStore', () => {
  describe('loadDailyPuzzle', () => {
    it('initializes game state from puzzle', async () => {
      await useStatStackStore.getState().loadDailyPuzzle();

      const { gameState, scoreBreakdown } = useStatStackStore.getState();
      expect(gameState).not.toBeNull();
      expect(gameState!.picks).toEqual([]);
      expect(gameState!.isComplete).toBe(false);
      expect(scoreBreakdown).toBeNull();
    });
  });

  describe('submitPick', () => {
    it('adds a pick to the game state', async () => {
      await useStatStackStore.getState().loadDailyPuzzle();

      useStatStackStore.getState().submitPick(mockPick);

      const { gameState } = useStatStackStore.getState();
      expect(gameState!.picks).toHaveLength(1);
      expect(gameState!.picks[0]).toEqual(mockPick);
      expect((gameState as any).currentPickIndex).toBe(1);
    });

    it('does nothing when no game is loaded', () => {
      useStatStackStore.getState().submitPick(mockPick);
      expect(useStatStackStore.getState().gameState).toBeNull();
    });

    it('calculates score when game is complete', async () => {
      await useStatStackStore.getState().loadDailyPuzzle();

      // Submit 5 picks to complete the game
      for (let i = 0; i < 5; i++) {
        useStatStackStore.getState().submitPick(mockPick);
      }

      const { gameState, scoreBreakdown } = useStatStackStore.getState();
      expect(gameState!.isComplete).toBe(true);
      expect(scoreBreakdown).not.toBeNull();
      expect(scoreBreakdown!.percentile).toBe(92);
      expect(scoreBreakdown!.finalScore).toBe(8500);
    });

    it('does not calculate score for incomplete game', async () => {
      await useStatStackStore.getState().loadDailyPuzzle();
      useStatStackStore.getState().submitPick(mockPick);

      expect(useStatStackStore.getState().scoreBreakdown).toBeNull();
    });
  });

  describe('activateTransferPortal', () => {
    it('activates transfer portal and removes a pick', async () => {
      await useStatStackStore.getState().loadDailyPuzzle();
      useStatStackStore.getState().submitPick(mockPick);

      useStatStackStore.getState().activateTransferPortal(0);

      const { gameState } = useStatStackStore.getState();
      expect((gameState as any).transferPortalUsed).toBe(true);
      expect(gameState!.picks).toHaveLength(0);
      expect((gameState as any).currentPickIndex).toBe(0);
    });

    it('does nothing when no game is loaded', () => {
      useStatStackStore.getState().activateTransferPortal(0);
      expect(useStatStackStore.getState().gameState).toBeNull();
    });
  });

  describe('setSearchQuery / setIsSearching', () => {
    it('updates search query', () => {
      useStatStackStore.getState().setSearchQuery('Henry');
      expect(useStatStackStore.getState().searchQuery).toBe('Henry');
    });

    it('updates isSearching flag', () => {
      useStatStackStore.getState().setIsSearching(true);
      expect(useStatStackStore.getState().isSearching).toBe(true);
    });
  });

  describe('resetGame', () => {
    it('resets game state and clears score breakdown', async () => {
      await useStatStackStore.getState().loadDailyPuzzle();
      useStatStackStore.getState().submitPick(mockPick);
      useStatStackStore.setState({ searchQuery: 'test', scoreBreakdown: mockScoreBreakdown });

      await useStatStackStore.getState().resetGame();

      const state = useStatStackStore.getState();
      expect(state.gameState).not.toBeNull();
      expect(state.gameState!.picks).toEqual([]);
      expect(state.scoreBreakdown).toBeNull();
      expect(state.searchQuery).toBe('');
    });
  });
});
