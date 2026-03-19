// ============================================================
// GridIron IQ — Dynasty Builder State Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type { DynastyPlayer, DynastyRoster, DynastyGameState } from '@/types';
import {
  createDynastyRoster,
  addPlayerToRoster,
  removePlayerFromRoster,
  getPlayersForProgram,
  getAvailablePrograms,
  isRosterComplete,
  simulateMatchup,
  DYNASTY_SLOTS,
} from '@/services/games/dynasty-engine';

interface DynastyStore {
  gameState: DynastyGameState;
  availablePrograms: string[];
  error: string | null;

  selectProgram: (program: string) => void;
  selectSlot: (slotKey: string | null) => void;
  addPlayer: (slotKey: string, player: DynastyPlayer) => void;
  removePlayer: (slotKey: string) => void;
  setSearchQuery: (query: string) => void;
  simulate: () => void;
  reset: () => void;
}

export const useDynastyStore = create<DynastyStore>((set, get) => ({
  gameState: {
    program: null,
    roster: null,
    availablePlayers: [],
    selectedSlot: null,
    searchQuery: '',
    isComplete: false,
    simulationResult: null,
  },
  availablePrograms: getAvailablePrograms(),
  error: null,

  selectProgram: (program) => {
    const roster = createDynastyRoster(program);
    const players = getPlayersForProgram(program);
    set({
      gameState: {
        program,
        roster,
        availablePlayers: players,
        selectedSlot: null,
        searchQuery: '',
        isComplete: false,
        simulationResult: null,
      },
      error: null,
    });
  },

  selectSlot: (slotKey) => {
    const { gameState } = get();
    set({ gameState: { ...gameState, selectedSlot: slotKey }, error: null });
  },

  addPlayer: (slotKey, player) => {
    const { gameState } = get();
    if (!gameState.roster) return;

    const result = addPlayerToRoster(gameState.roster, slotKey, player);
    if ('error' in result) {
      set({ error: result.error });
      return;
    }

    set({
      gameState: {
        ...gameState,
        roster: result,
        selectedSlot: null,
        isComplete: isRosterComplete(result),
      },
      error: null,
    });
  },

  removePlayer: (slotKey) => {
    const { gameState } = get();
    if (!gameState.roster) return;

    const newRoster = removePlayerFromRoster(gameState.roster, slotKey);
    set({
      gameState: { ...gameState, roster: newRoster, isComplete: false, simulationResult: null },
      error: null,
    });
  },

  setSearchQuery: (query) => {
    const { gameState } = get();
    set({ gameState: { ...gameState, searchQuery: query } });
  },

  simulate: () => {
    const { gameState } = get();
    if (!gameState.roster || !isRosterComplete(gameState.roster)) return;

    // Simulate against a random other program's auto-filled roster
    const otherPrograms = getAvailablePrograms().filter(p => p !== gameState.program);
    if (otherPrograms.length === 0) return;

    const opponent = otherPrograms[Math.floor(Math.random() * otherPrograms.length)];
    const opponentPlayers = getPlayersForProgram(opponent);
    const opponentRoster = createDynastyRoster(opponent);

    // Auto-fill opponent roster with best available at each position
    let filledRoster = opponentRoster;
    for (const slot of DYNASTY_SLOTS) {
      const validPositions = slot.position === 'DB' ? ['DB', 'CB', 'S'] : [slot.position];
      const eligible = opponentPlayers.filter(p =>
        validPositions.includes(p.position) &&
        !Object.values(filledRoster.players).some(rp => rp?.id === p.id)
      );
      if (eligible.length > 0) {
        const best = eligible.sort((a, b) => b.compositeScore - a.compositeScore)[0];
        const result = addPlayerToRoster(filledRoster, slot.key, best);
        if (!('error' in result)) filledRoster = result;
      }
    }

    const simResult = simulateMatchup(gameState.roster, filledRoster);
    set({ gameState: { ...gameState, simulationResult: simResult } });
  },

  reset: () => {
    set({
      gameState: {
        program: null,
        roster: null,
        availablePlayers: [],
        selectedSlot: null,
        searchQuery: '',
        isComplete: false,
        simulationResult: null,
      },
      error: null,
    });
  },
}));
