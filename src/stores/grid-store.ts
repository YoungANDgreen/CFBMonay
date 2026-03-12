// ============================================================
// GridIron IQ — Grid Game State Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type { GridGameState, Player } from '@/types';
import {
  generateDailyPuzzle,
  createInitialGameState,
  submitGuess,
  loadGridCriteriaFromCache,
  populateValidAnswersFromCache,
} from '@/services/games/grid-engine';

interface GridStore {
  gameState: GridGameState | null;
  searchQuery: string;
  searchResults: Player[];
  isSearching: boolean;
  dailyCompleted: boolean;

  // Actions
  loadDailyPuzzle: () => Promise<void>;
  selectCell: (row: number, col: number) => void;
  submitAnswer: (player: Player) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Player[]) => void;
  setIsSearching: (searching: boolean) => void;
  resetGame: () => Promise<void>;
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const useGridStore = create<GridStore>((set, get) => ({
  gameState: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  dailyCompleted: false,

  loadDailyPuzzle: async () => {
    const dateStr = getTodayStr();
    await loadGridCriteriaFromCache();
    const basePuzzle = generateDailyPuzzle(dateStr);
    const puzzle = await populateValidAnswersFromCache(basePuzzle);
    const gameState = createInitialGameState(puzzle);
    set({ gameState, dailyCompleted: false });
  },

  selectCell: (row: number, col: number) => {
    const { gameState } = get();
    if (!gameState || gameState.isComplete) return;
    if (gameState.cells[row][col].isLocked) return;

    set({
      gameState: { ...gameState, currentCell: { row, col } },
      searchQuery: '',
      searchResults: [],
    });
  },

  submitAnswer: (player: Player) => {
    const { gameState } = get();
    if (!gameState || !gameState.currentCell) return;

    const { row, col } = gameState.currentCell;
    const newState = submitGuess(gameState, row, col, player);

    set({
      gameState: newState,
      searchQuery: '',
      searchResults: [],
      dailyCompleted: newState.isComplete,
    });
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSearchResults: (results: Player[]) => set({ searchResults: results }),
  setIsSearching: (searching: boolean) => set({ isSearching: searching }),

  resetGame: async () => {
    const dateStr = getTodayStr();
    await loadGridCriteriaFromCache();
    const basePuzzle = generateDailyPuzzle(dateStr);
    const puzzle = await populateValidAnswersFromCache(basePuzzle);
    const gameState = createInitialGameState(puzzle);
    set({
      gameState,
      searchQuery: '',
      searchResults: [],
      dailyCompleted: false,
    });
  },
}));
