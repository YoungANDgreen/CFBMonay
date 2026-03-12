// ============================================================
// GridIron IQ — Stat Stack Game State Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type { StatStackGameState, StatStackPick } from '@/types';
import {
  generateStatStackPuzzleWithCache,
  createStatStackGameState,
  submitStatStackPick,
  useTransferPortal,
  calculateStatStackScore,
} from '@/services/games/stat-stack-engine';

interface StatStackStore {
  gameState: StatStackGameState | null;
  searchQuery: string;
  isSearching: boolean;
  scoreBreakdown: {
    totalStatValue: number;
    percentile: number;
    penaltyTotal: number;
    finalScore: number;
  } | null;

  loadDailyPuzzle: () => Promise<void>;
  submitPick: (pick: StatStackPick) => void;
  activateTransferPortal: (rowIndex: number) => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (searching: boolean) => void;
  resetGame: () => Promise<void>;
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const useStatStackStore = create<StatStackStore>((set, get) => ({
  gameState: null,
  searchQuery: '',
  isSearching: false,
  scoreBreakdown: null,

  loadDailyPuzzle: async () => {
    const dateStr = getTodayStr();
    const puzzle = await generateStatStackPuzzleWithCache(dateStr);
    const gameState = createStatStackGameState(puzzle);
    set({ gameState, scoreBreakdown: null });
  },

  submitPick: (pick: StatStackPick) => {
    const { gameState } = get();
    if (!gameState) return;

    const newState = submitStatStackPick(gameState, pick);
    const scoreBreakdown = newState.isComplete
      ? calculateStatStackScore(newState)
      : null;

    set({ gameState: newState, scoreBreakdown });
  },

  activateTransferPortal: (rowIndex: number) => {
    const { gameState } = get();
    if (!gameState) return;

    const newState = useTransferPortal(gameState, rowIndex);
    set({ gameState: newState });
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setIsSearching: (searching: boolean) => set({ isSearching: searching }),

  resetGame: async () => {
    const dateStr = getTodayStr();
    const puzzle = await generateStatStackPuzzleWithCache(dateStr);
    const gameState = createStatStackGameState(puzzle);
    set({ gameState, scoreBreakdown: null, searchQuery: '' });
  },
}));
