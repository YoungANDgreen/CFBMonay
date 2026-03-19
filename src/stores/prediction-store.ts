// ============================================================
// GridIron IQ — Prediction Arena State Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type {
  PredictionArenaState,
  PredictionArenaWeek,
  UserPrediction,
  GamePrediction,
  GameResult,
  ModelAccuracy,
  BacktestResult,
  PredictionLeague,
} from '@/types';

type PredictionTab = 'this_week' | 'my_picks' | 'results' | 'model_stats' | 'leagues';

interface PredictionStore {
  // State
  arenaState: PredictionArenaState;
  activeTab: PredictionTab;
  selectedGameId: string | null;
  predictionType: UserPrediction['predictionType'];
  predictionValue: string;
  backtestResults: BacktestResult[];
  leagues: PredictionLeague[];
  error: string | null;

  // Actions
  setActiveTab: (tab: PredictionTab) => void;
  selectGame: (gameId: string | null) => void;
  setPredictionType: (type: UserPrediction['predictionType']) => void;
  setPredictionValue: (value: string) => void;
  submitPrediction: () => void;
  loadWeek: (weekNumber: number) => void;
  setBacktestResults: (results: BacktestResult[]) => void;

  // League actions
  createLeague: (name: string) => void;
  joinLeague: (leagueId: string) => void;

  reset: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const INITIAL_MODEL_ACCURACY: ModelAccuracy = {
  atsRecord: { wins: 142, losses: 68 },
  spreadMAE: 8.4,
  totalMAE: 7.8,
  upsetDetectionRate: 0.24,
  seasonAccuracy: 0.676,
};

const INITIAL_ARENA_STATE: PredictionArenaState = {
  currentWeek: null,
  pastWeeks: [],
  seasonScore: 0,
  modelSeasonScore: 0,
  userRank: 1,
  modelAccuracy: INITIAL_MODEL_ACCURACY,
};

export const usePredictionStore = create<PredictionStore>((set, get) => ({
  arenaState: INITIAL_ARENA_STATE,
  activeTab: 'this_week',
  selectedGameId: null,
  predictionType: 'winner',
  predictionValue: '',
  backtestResults: [],
  leagues: [],
  error: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  selectGame: (gameId) => set({
    selectedGameId: gameId,
    predictionType: 'winner',
    predictionValue: '',
    error: null,
  }),

  setPredictionType: (type) => set({ predictionType: type, predictionValue: '' }),

  setPredictionValue: (value) => set({ predictionValue: value }),

  submitPrediction: () => {
    const { arenaState, selectedGameId, predictionType, predictionValue } = get();
    if (!arenaState.currentWeek || !selectedGameId || !predictionValue.trim()) {
      set({ error: 'Please select a game and enter your prediction' });
      return;
    }

    if (arenaState.currentWeek.isLocked) {
      set({ error: 'Predictions are locked for this week' });
      return;
    }

    const newPrediction: UserPrediction = {
      userId: 'current-user',
      gameId: selectedGameId,
      predictionType,
      predictedValue: predictionType === 'winner' ? predictionValue :
                      predictionType === 'exact_score' ? predictionValue :
                      parseFloat(predictionValue) || 0,
    };

    // Update or add prediction
    const existingIdx = arenaState.currentWeek.userPredictions.findIndex(
      p => p.gameId === selectedGameId && p.predictionType === predictionType
    );

    const updatedPredictions = [...arenaState.currentWeek.userPredictions];
    if (existingIdx >= 0) {
      updatedPredictions[existingIdx] = newPrediction;
    } else {
      updatedPredictions.push(newPrediction);
    }

    set({
      arenaState: {
        ...arenaState,
        currentWeek: {
          ...arenaState.currentWeek,
          userPredictions: updatedPredictions,
        },
      },
      selectedGameId: null,
      predictionValue: '',
      error: null,
    });
  },

  loadWeek: (weekNumber) => {
    const { arenaState } = get();
    // Placeholder — will be wired to prediction-arena-engine.loadWeek()
    set({
      arenaState: {
        ...arenaState,
        currentWeek: arenaState.currentWeek
          ? { ...arenaState.currentWeek, weekNumber }
          : {
              weekNumber,
              seasonYear: 2025,
              games: [],
              userPredictions: [],
              isLocked: false,
              resultsAvailable: false,
            },
      },
    });
  },

  setBacktestResults: (results) => set({ backtestResults: results }),

  createLeague: (name) => {
    const league: PredictionLeague = {
      id: generateId(),
      name,
      members: [{ userId: 'current-user', username: 'You', score: 0 }],
      seasonYear: 2025,
      weekScores: {},
    };
    set(state => ({ leagues: [...state.leagues, league] }));
  },

  joinLeague: (leagueId) => {
    set(state => ({
      leagues: state.leagues.map(l =>
        l.id === leagueId
          ? { ...l, members: [...l.members, { userId: 'current-user', username: 'You', score: 0 }] }
          : l
      ),
    }));
  },

  reset: () => set({
    arenaState: INITIAL_ARENA_STATE,
    activeTab: 'this_week',
    selectedGameId: null,
    predictionType: 'winner',
    predictionValue: '',
    backtestResults: [],
    leagues: [],
    error: null,
  }),
}));
