// ============================================================
// GridIron IQ — Conference Clash State Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type {
  ClashGameMode,
  BlindResumeGameState,
  StatLineSleuthGameState,
  RosterRouletteGameState,
  FilmRoomGameState,
} from '@/types';
import { generateBlindResumeGameWithCache, submitBlindResumeGuess } from '@/services/games/blind-resume-engine';
import { generateSleuthGameWithCache, submitSleuthGuess, revealNextHint } from '@/services/games/stat-line-sleuth-engine';
import { generateRosterRouletteGameWithCache, submitRosterGuess, endRosterRoulette } from '@/services/games/roster-roulette-engine';
import { generateFilmRoomGameWithCache, submitFilmRoomGuess } from '@/services/games/film-room-engine';

interface ClashStore {
  activeMode: ClashGameMode | null;
  blindResume: BlindResumeGameState | null;
  sleuth: StatLineSleuthGameState | null;
  rosterRoulette: RosterRouletteGameState | null;
  filmRoom: FilmRoomGameState | null;

  // Navigation
  setActiveMode: (mode: ClashGameMode | null) => void;

  // Blind Resume
  startBlindResume: () => Promise<void>;
  guessBlindResume: (team: string, year: number) => void;

  // Stat Line Sleuth
  startSleuth: () => void;
  guessSleuth: (playerName: string) => void;
  revealSleuthHint: () => void;

  // Roster Roulette
  startRosterRoulette: (difficulty?: 'easy' | 'medium' | 'hard') => void;
  guessRosterPlayer: (name: string) => void;
  endRoulette: () => void;

  // Film Room
  startFilmRoom: () => void;
  guessFilmRoom: (optionIndex: number) => void;

  // Reset
  resetAll: () => void;
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const useClashStore = create<ClashStore>((set, get) => ({
  activeMode: null,
  blindResume: null,
  sleuth: null,
  rosterRoulette: null,
  filmRoom: null,

  setActiveMode: (mode) => set({ activeMode: mode }),

  // Blind Resume
  startBlindResume: async () => {
    const state = await generateBlindResumeGameWithCache(getTodayStr());
    set({ blindResume: state, activeMode: 'blind_resume' });
  },
  guessBlindResume: (team, year) => {
    const { blindResume } = get();
    if (!blindResume) return;
    set({ blindResume: submitBlindResumeGuess(blindResume, team, year) });
  },

  // Stat Line Sleuth
  startSleuth: () => {
    const state = generateSleuthGameWithCache(getTodayStr());
    set({ sleuth: state, activeMode: 'stat_line_sleuth' });
  },
  guessSleuth: (playerName) => {
    const { sleuth } = get();
    if (!sleuth) return;
    set({ sleuth: submitSleuthGuess(sleuth, playerName) });
  },
  revealSleuthHint: () => {
    const { sleuth } = get();
    if (!sleuth) return;
    set({ sleuth: revealNextHint(sleuth) });
  },

  // Roster Roulette
  startRosterRoulette: (difficulty = 'medium') => {
    const state = generateRosterRouletteGameWithCache(getTodayStr(), difficulty);
    set({ rosterRoulette: state, activeMode: 'roster_roulette' });
  },
  guessRosterPlayer: (name) => {
    const { rosterRoulette } = get();
    if (!rosterRoulette) return;
    set({ rosterRoulette: submitRosterGuess(rosterRoulette, name) });
  },
  endRoulette: () => {
    const { rosterRoulette } = get();
    if (!rosterRoulette) return;
    set({ rosterRoulette: endRosterRoulette(rosterRoulette) });
  },

  // Film Room
  startFilmRoom: () => {
    const state = generateFilmRoomGameWithCache(getTodayStr());
    set({ filmRoom: state, activeMode: 'film_room' });
  },
  guessFilmRoom: (optionIndex) => {
    const { filmRoom } = get();
    if (!filmRoom) return;
    set({ filmRoom: submitFilmRoomGuess(filmRoom, optionIndex) });
  },

  resetAll: () => set({
    activeMode: null,
    blindResume: null,
    sleuth: null,
    rosterRoulette: null,
    filmRoom: null,
  }),
}));
