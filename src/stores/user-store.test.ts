// ============================================================
// GridIron IQ — User Store Unit Tests
// ============================================================

import { useUserStore } from './user-store';

const mockUser = {
  id: 'user-001',
  username: 'HookEm_Hardy',
  displayName: 'Jake Hardy',
  email: 'jake@example.com',
  avatarUrl: undefined,
  favoriteTeam: 'Texas',
  favoriteConference: 'SEC' as const,
  streakCurrent: 5,
  streakBest: 12,
  eloRating: 1400,
  createdAt: '2025-08-01T00:00:00Z',
  stats: {
    gridGamesPlayed: 0,
    gridBestScore: 0,
    statStackGamesPlayed: 0,
    statStackBestPercentile: 0,
    predictionAccuracy: 0,
    fantasyChampionships: 0,
  },
};

beforeEach(() => {
  useUserStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
});

describe('useUserStore', () => {
  describe('initial state', () => {
    it('has no user and is loading', () => {
      const state = useUserStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
    });
  });

  describe('setUser', () => {
    it('sets user and marks as authenticated', () => {
      useUserStore.getState().setUser(mockUser);

      const state = useUserStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('merges partial updates into user', () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().updateProfile({ displayName: 'Jacob Hardy', eloRating: 1500 });

      const { user } = useUserStore.getState();
      expect(user!.displayName).toBe('Jacob Hardy');
      expect(user!.eloRating).toBe(1500);
      // Other fields remain unchanged
      expect(user!.username).toBe('HookEm_Hardy');
      expect(user!.favoriteTeam).toBe('Texas');
    });

    it('does nothing when no user is logged in', () => {
      useUserStore.getState().updateProfile({ displayName: 'Ghost' });
      expect(useUserStore.getState().user).toBeNull();
    });
  });

  describe('setFavoriteTeam', () => {
    it('updates favorite team and conference', () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().setFavoriteTeam('Alabama', 'SEC' as any);

      const { user } = useUserStore.getState();
      expect(user!.favoriteTeam).toBe('Alabama');
      expect(user!.favoriteConference).toBe('SEC');
    });

    it('does nothing when no user is logged in', () => {
      useUserStore.getState().setFavoriteTeam('Alabama', 'SEC' as any);
      expect(useUserStore.getState().user).toBeNull();
    });
  });

  describe('incrementStreak', () => {
    it('increases current streak by 1', () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().incrementStreak();

      const { user } = useUserStore.getState();
      expect(user!.streakCurrent).toBe(6);
    });

    it('updates best streak when current exceeds it', () => {
      useUserStore.getState().setUser({ ...mockUser, streakCurrent: 12, streakBest: 12 });
      useUserStore.getState().incrementStreak();

      const { user } = useUserStore.getState();
      expect(user!.streakCurrent).toBe(13);
      expect(user!.streakBest).toBe(13);
    });

    it('does not update best streak when current is below it', () => {
      useUserStore.getState().setUser({ ...mockUser, streakCurrent: 3, streakBest: 12 });
      useUserStore.getState().incrementStreak();

      const { user } = useUserStore.getState();
      expect(user!.streakCurrent).toBe(4);
      expect(user!.streakBest).toBe(12);
    });

    it('does nothing when no user is logged in', () => {
      useUserStore.getState().incrementStreak();
      expect(useUserStore.getState().user).toBeNull();
    });
  });

  describe('resetStreak', () => {
    it('zeros out current streak', () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().resetStreak();

      const { user } = useUserStore.getState();
      expect(user!.streakCurrent).toBe(0);
    });

    it('preserves best streak', () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().resetStreak();

      expect(useUserStore.getState().user!.streakBest).toBe(12);
    });

    it('does nothing when no user is logged in', () => {
      useUserStore.getState().resetStreak();
      expect(useUserStore.getState().user).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears user and sets authenticated to false', () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().logout();

      const state = useUserStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});
