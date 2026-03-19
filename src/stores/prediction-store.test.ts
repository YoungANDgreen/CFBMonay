// ============================================================
// GridIron IQ — Prediction Arena Store Unit Tests
// ============================================================

import { usePredictionStore } from './prediction-store';

beforeEach(() => {
  usePredictionStore.getState().reset();
});

describe('usePredictionStore', () => {
  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = usePredictionStore.getState();
      expect(state.activeTab).toBe('this_week');
      expect(state.selectedGameId).toBeNull();
      expect(state.predictionType).toBe('winner');
      expect(state.predictionValue).toBe('');
      expect(state.leagues).toEqual([]);
      expect(state.backtestResults).toEqual([]);
      expect(state.error).toBeNull();
      expect(state.arenaState.currentWeek).toBeNull();
      expect(state.arenaState.seasonScore).toBe(0);
    });
  });

  describe('setActiveTab', () => {
    it('changes the active tab', () => {
      usePredictionStore.getState().setActiveTab('my_picks');
      expect(usePredictionStore.getState().activeTab).toBe('my_picks');
    });

    it('can switch to all tab types', () => {
      const tabs = ['this_week', 'my_picks', 'results', 'model_stats', 'leagues'] as const;
      for (const tab of tabs) {
        usePredictionStore.getState().setActiveTab(tab);
        expect(usePredictionStore.getState().activeTab).toBe(tab);
      }
    });
  });

  describe('selectGame', () => {
    it('sets the selected game and clears form', () => {
      usePredictionStore.setState({ predictionType: 'spread', predictionValue: '7.5', error: 'old error' });

      usePredictionStore.getState().selectGame('game-123');

      const state = usePredictionStore.getState();
      expect(state.selectedGameId).toBe('game-123');
      expect(state.predictionType).toBe('winner');
      expect(state.predictionValue).toBe('');
      expect(state.error).toBeNull();
    });

    it('can deselect a game with null', () => {
      usePredictionStore.getState().selectGame('game-123');
      usePredictionStore.getState().selectGame(null);

      expect(usePredictionStore.getState().selectedGameId).toBeNull();
    });
  });

  describe('setPredictionType / setPredictionValue', () => {
    it('sets prediction type and clears value', () => {
      usePredictionStore.setState({ predictionValue: '14.5' });
      usePredictionStore.getState().setPredictionType('spread');

      expect(usePredictionStore.getState().predictionType).toBe('spread');
      expect(usePredictionStore.getState().predictionValue).toBe('');
    });

    it('sets prediction value', () => {
      usePredictionStore.getState().setPredictionValue('Alabama');
      expect(usePredictionStore.getState().predictionValue).toBe('Alabama');
    });
  });

  describe('submitPrediction', () => {
    it('sets error when no current week', () => {
      usePredictionStore.getState().selectGame('game-1');
      usePredictionStore.getState().setPredictionValue('Alabama');

      usePredictionStore.getState().submitPrediction();

      expect(usePredictionStore.getState().error).toBe('Please select a game and enter your prediction');
    });

    it('sets error when no game is selected', () => {
      usePredictionStore.getState().loadWeek(5);
      usePredictionStore.getState().setPredictionValue('Alabama');

      usePredictionStore.getState().submitPrediction();

      expect(usePredictionStore.getState().error).toBe('Please select a game and enter your prediction');
    });

    it('sets error when prediction value is empty', () => {
      usePredictionStore.getState().loadWeek(5);
      usePredictionStore.getState().selectGame('game-1');

      usePredictionStore.getState().submitPrediction();

      expect(usePredictionStore.getState().error).toBe('Please select a game and enter your prediction');
    });

    it('sets error when week is locked', () => {
      usePredictionStore.getState().loadWeek(5);
      // Lock the week
      const arena = usePredictionStore.getState().arenaState;
      usePredictionStore.setState({
        arenaState: {
          ...arena,
          currentWeek: { ...arena.currentWeek!, isLocked: true },
        },
      });
      usePredictionStore.getState().selectGame('game-1');
      usePredictionStore.getState().setPredictionValue('Alabama');

      usePredictionStore.getState().submitPrediction();

      expect(usePredictionStore.getState().error).toBe('Predictions are locked for this week');
    });

    it('adds a new prediction successfully', () => {
      usePredictionStore.getState().loadWeek(5);
      usePredictionStore.getState().selectGame('game-1');
      usePredictionStore.getState().setPredictionValue('Alabama');

      usePredictionStore.getState().submitPrediction();

      const state = usePredictionStore.getState();
      expect(state.error).toBeNull();
      expect(state.selectedGameId).toBeNull();
      expect(state.predictionValue).toBe('');
      expect(state.arenaState.currentWeek!.userPredictions).toHaveLength(1);
      expect(state.arenaState.currentWeek!.userPredictions[0].gameId).toBe('game-1');
      expect(state.arenaState.currentWeek!.userPredictions[0].predictedValue).toBe('Alabama');
    });

    it('updates an existing prediction for the same game and type', () => {
      usePredictionStore.getState().loadWeek(5);

      // Submit first prediction
      usePredictionStore.getState().selectGame('game-1');
      usePredictionStore.getState().setPredictionValue('Alabama');
      usePredictionStore.getState().submitPrediction();

      // Submit updated prediction for same game
      usePredictionStore.getState().selectGame('game-1');
      usePredictionStore.getState().setPredictionValue('Georgia');
      usePredictionStore.getState().submitPrediction();

      const predictions = usePredictionStore.getState().arenaState.currentWeek!.userPredictions;
      expect(predictions).toHaveLength(1);
      expect(predictions[0].predictedValue).toBe('Georgia');
    });

    it('handles numeric prediction values for spread type', () => {
      usePredictionStore.getState().loadWeek(5);
      usePredictionStore.getState().selectGame('game-1');
      usePredictionStore.getState().setPredictionType('spread');
      usePredictionStore.getState().setPredictionValue('7.5');

      usePredictionStore.getState().submitPrediction();

      const predictions = usePredictionStore.getState().arenaState.currentWeek!.userPredictions;
      expect(predictions[0].predictedValue).toBe(7.5);
    });
  });

  describe('loadWeek', () => {
    it('creates a new week when none exists', () => {
      usePredictionStore.getState().loadWeek(8);

      const { arenaState } = usePredictionStore.getState();
      expect(arenaState.currentWeek).not.toBeNull();
      expect(arenaState.currentWeek!.weekNumber).toBe(8);
      expect(arenaState.currentWeek!.seasonYear).toBe(2025);
      expect(arenaState.currentWeek!.games).toEqual([]);
      expect(arenaState.currentWeek!.userPredictions).toEqual([]);
      expect(arenaState.currentWeek!.isLocked).toBe(false);
    });

    it('updates week number when week already exists', () => {
      usePredictionStore.getState().loadWeek(5);
      usePredictionStore.getState().loadWeek(6);

      expect(usePredictionStore.getState().arenaState.currentWeek!.weekNumber).toBe(6);
    });
  });

  describe('setBacktestResults', () => {
    it('sets backtest results', () => {
      const results = [{ week: 1, accuracy: 0.75, profit: 100 }] as any;
      usePredictionStore.getState().setBacktestResults(results);
      expect(usePredictionStore.getState().backtestResults).toEqual(results);
    });
  });

  describe('createLeague', () => {
    it('adds a new league with current user as member', () => {
      usePredictionStore.getState().createLeague('SEC Predictions');

      const { leagues } = usePredictionStore.getState();
      expect(leagues).toHaveLength(1);
      expect(leagues[0].name).toBe('SEC Predictions');
      expect(leagues[0].members).toHaveLength(1);
      expect(leagues[0].members[0].userId).toBe('current-user');
      expect(leagues[0].seasonYear).toBe(2025);
      expect(leagues[0].id).toBeDefined();
    });

    it('can create multiple leagues', () => {
      usePredictionStore.getState().createLeague('League 1');
      usePredictionStore.getState().createLeague('League 2');

      expect(usePredictionStore.getState().leagues).toHaveLength(2);
    });
  });

  describe('joinLeague', () => {
    it('adds current user to an existing league', () => {
      usePredictionStore.getState().createLeague('Open League');
      const leagueId = usePredictionStore.getState().leagues[0].id;

      // Remove the auto-added member to simulate joining a league you are not in
      usePredictionStore.setState({
        leagues: usePredictionStore.getState().leagues.map(l => ({
          ...l,
          members: [],
        })),
      });

      usePredictionStore.getState().joinLeague(leagueId);

      const league = usePredictionStore.getState().leagues.find(l => l.id === leagueId);
      expect(league!.members).toHaveLength(1);
      expect(league!.members[0].userId).toBe('current-user');
    });
  });

  describe('reset', () => {
    it('clears all state back to initial', () => {
      usePredictionStore.getState().loadWeek(5);
      usePredictionStore.getState().selectGame('game-1');
      usePredictionStore.getState().createLeague('My League');
      usePredictionStore.getState().setActiveTab('leagues');

      usePredictionStore.getState().reset();

      const state = usePredictionStore.getState();
      expect(state.activeTab).toBe('this_week');
      expect(state.selectedGameId).toBeNull();
      expect(state.arenaState.currentWeek).toBeNull();
      expect(state.leagues).toEqual([]);
      expect(state.error).toBeNull();
    });
  });
});
