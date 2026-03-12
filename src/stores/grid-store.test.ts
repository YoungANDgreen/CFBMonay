// ============================================================
// GridIron IQ — Grid Store Unit Tests
// ============================================================

import { useGridStore } from './grid-store';

// Mock the grid engine
const mockPuzzle = (dateStr: string) => ({
  id: `puzzle-${dateStr}`,
  date: dateStr,
  size: 3,
  rowCriteria: ['SEC', 'Big Ten', 'Pac-12'],
  colCriteria: ['1st Round Pick', '1000+ Rush Yds', 'Heisman Finalist'],
  rows: [],
  columns: [],
  validAnswers: {},
});

jest.mock('@/services/games/grid-engine', () => ({
  loadGridCriteriaFromCache: jest.fn(() => Promise.resolve()),
  populateValidAnswersFromCache: jest.fn((puzzle: any) => Promise.resolve(puzzle)),
  generateDailyPuzzle: jest.fn((dateStr: string) => mockPuzzle(dateStr)),
  createInitialGameState: jest.fn((puzzle: any) => ({
    puzzle,
    cells: [
      [{ isLocked: false, answer: null }, { isLocked: false, answer: null }, { isLocked: false, answer: null }],
      [{ isLocked: false, answer: null }, { isLocked: false, answer: null }, { isLocked: false, answer: null }],
      [{ isLocked: false, answer: null }, { isLocked: false, answer: null }, { isLocked: false, answer: null }],
    ],
    currentCell: null,
    guessesRemaining: 9,
    isComplete: false,
    score: 0,
  })),
  submitGuess: jest.fn((state: any, row: number, col: number, player: any) => {
    const newCells = state.cells.map((r: any[]) => r.map((c: any) => ({ ...c })));
    newCells[row][col] = { isLocked: true, answer: player, isCorrect: true };
    const lockedCount = newCells.flat().filter((c: any) => c.isLocked).length;
    return {
      ...state,
      cells: newCells,
      currentCell: null,
      guessesRemaining: state.guessesRemaining - 1,
      isComplete: lockedCount === 9,
      score: state.score + 100,
    };
  }),
}));

const mockPlayer: any = {
  id: 'player-1',
  name: 'Derrick Henry',
  team: 'Alabama',
  position: 'RB',
  seasons: ['2014', '2015'],
};

beforeEach(() => {
  // Reset store to initial state between tests
  useGridStore.setState({
    gameState: null,
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    dailyCompleted: false,
  });
});

describe('useGridStore', () => {
  describe('loadDailyPuzzle', () => {
    it('sets up initial game state', async () => {
      await useGridStore.getState().loadDailyPuzzle();

      const { gameState, dailyCompleted } = useGridStore.getState();
      expect(gameState).not.toBeNull();
      expect(gameState!.isComplete).toBe(false);
      expect(gameState!.guessesRemaining).toBe(9);
      expect(gameState!.cells).toHaveLength(3);
      expect(dailyCompleted).toBe(false);
    });
  });

  describe('selectCell', () => {
    it('updates current cell selection and clears search', async () => {
      await useGridStore.getState().loadDailyPuzzle();
      useGridStore.setState({ searchQuery: 'Henry', searchResults: [mockPlayer] });

      useGridStore.getState().selectCell(1, 2);

      const { gameState, searchQuery, searchResults } = useGridStore.getState();
      expect(gameState!.currentCell).toEqual({ row: 1, col: 2 });
      expect(searchQuery).toBe('');
      expect(searchResults).toEqual([]);
    });

    it('does nothing when game is not loaded', () => {
      useGridStore.getState().selectCell(0, 0);
      expect(useGridStore.getState().gameState).toBeNull();
    });

    it('does nothing when game is complete', async () => {
      await useGridStore.getState().loadDailyPuzzle();
      useGridStore.setState({
        gameState: { ...useGridStore.getState().gameState!, isComplete: true },
      });

      useGridStore.getState().selectCell(0, 0);
      expect(useGridStore.getState().gameState!.currentCell).toBeNull();
    });

    it('does nothing when cell is locked', async () => {
      await useGridStore.getState().loadDailyPuzzle();
      const gs = useGridStore.getState().gameState!;
      gs.cells[0][0] = { isLocked: true, answer: mockPlayer } as any;
      useGridStore.setState({ gameState: gs });

      useGridStore.getState().selectCell(0, 0);
      expect(useGridStore.getState().gameState!.currentCell).toBeNull();
    });
  });

  describe('submitAnswer', () => {
    it('processes a correct answer and updates state', async () => {
      await useGridStore.getState().loadDailyPuzzle();
      useGridStore.getState().selectCell(0, 0);

      useGridStore.getState().submitAnswer(mockPlayer);

      const { gameState, searchQuery, searchResults } = useGridStore.getState();
      expect(gameState!.cells[0][0].isLocked).toBe(true);
      expect(gameState!.cells[0][0].answer).toEqual(mockPlayer);
      expect(gameState!.guessesRemaining).toBe(8);
      expect(gameState!.score).toBe(100);
      expect(searchQuery).toBe('');
      expect(searchResults).toEqual([]);
    });

    it('does nothing when no game is loaded', () => {
      useGridStore.getState().submitAnswer(mockPlayer);
      expect(useGridStore.getState().gameState).toBeNull();
    });

    it('does nothing when no cell is selected', async () => {
      await useGridStore.getState().loadDailyPuzzle();
      // No selectCell call
      useGridStore.getState().submitAnswer(mockPlayer);
      expect(useGridStore.getState().gameState!.guessesRemaining).toBe(9);
    });

    it('sets dailyCompleted when game finishes', async () => {
      await useGridStore.getState().loadDailyPuzzle();

      // Fill all 9 cells
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          useGridStore.getState().selectCell(row, col);
          useGridStore.getState().submitAnswer(mockPlayer);
        }
      }

      expect(useGridStore.getState().dailyCompleted).toBe(true);
      expect(useGridStore.getState().gameState!.isComplete).toBe(true);
    });
  });

  describe('setSearchQuery / setSearchResults / setIsSearching', () => {
    it('updates search query', () => {
      useGridStore.getState().setSearchQuery('Tebow');
      expect(useGridStore.getState().searchQuery).toBe('Tebow');
    });

    it('updates search results', () => {
      useGridStore.getState().setSearchResults([mockPlayer]);
      expect(useGridStore.getState().searchResults).toEqual([mockPlayer]);
    });

    it('updates isSearching flag', () => {
      useGridStore.getState().setIsSearching(true);
      expect(useGridStore.getState().isSearching).toBe(true);
    });
  });

  describe('resetGame', () => {
    it('resets all game state', async () => {
      await useGridStore.getState().loadDailyPuzzle();
      useGridStore.getState().selectCell(0, 0);
      useGridStore.getState().submitAnswer(mockPlayer);
      useGridStore.setState({ searchQuery: 'test', dailyCompleted: true });

      await useGridStore.getState().resetGame();

      const state = useGridStore.getState();
      expect(state.gameState).not.toBeNull();
      expect(state.gameState!.guessesRemaining).toBe(9);
      expect(state.searchQuery).toBe('');
      expect(state.searchResults).toEqual([]);
      expect(state.dailyCompleted).toBe(false);
    });
  });
});
