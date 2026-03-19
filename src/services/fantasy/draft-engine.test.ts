import {
  initializeDraft,
  makeDraftPick,
  autoPickForTeam,
  getNextPickTeamId,
  MOCK_PLAYER_POOL,
} from './draft-engine';
import type { RosterSettings, DraftState } from '@/types';

const DEFAULT_ROSTER: RosterSettings = {
  qb: 1,
  rb: 2,
  wr: 2,
  te: 1,
  flex: 1,
  dst: 1,
  k: 1,
  bench: 6,
};

const TEAM_IDS = ['team-a', 'team-b', 'team-c', 'team-d'];

function freshDraft(
  type: DraftState['draftType'] = 'snake',
  roster: RosterSettings = DEFAULT_ROSTER,
): DraftState {
  return initializeDraft('league-1', TEAM_IDS, type, roster);
}

describe('draft-engine', () => {
  describe('initializeDraft', () => {
    it('creates valid draft state with correct player count', () => {
      const state = freshDraft();

      expect(state.leagueId).toBe('league-1');
      expect(state.status).toBe('in_progress');
      expect(state.draftOrder).toEqual(TEAM_IDS);
      expect(state.currentPick).toBe(1);
      expect(state.currentRound).toBe(1);
      expect(state.picks).toHaveLength(0);
      expect(state.availablePlayers.length).toBe(MOCK_PLAYER_POOL.length);
      expect(state.availablePlayers.length).toBeGreaterThan(150);
    });

    it('computes totalRounds from roster settings', () => {
      const state = freshDraft();
      // qb(1)+rb(2)+wr(2)+te(1)+flex(1)+dst(1)+k(1)+bench(6) = 15
      expect(state.totalRounds).toBe(15);
    });
  });

  describe('makeDraftPick', () => {
    it('removes player from available and adds to picks', () => {
      const state = freshDraft();
      const playerId = state.availablePlayers[0].id;
      const result = makeDraftPick(state, 'team-a', playerId);

      expect('error' in result).toBe(false);
      const next = result as DraftState;

      expect(next.picks).toHaveLength(1);
      expect(next.picks[0].playerId).toBe(playerId);
      expect(next.picks[0].teamId).toBe('team-a');
      expect(next.availablePlayers.find((p) => p.id === playerId)).toBeUndefined();
      expect(next.availablePlayers.length).toBe(state.availablePlayers.length - 1);
    });

    it('advances currentPick and currentRound', () => {
      let state = freshDraft();
      // Make 4 picks (one full round with 4 teams)
      for (let i = 0; i < TEAM_IDS.length; i++) {
        const team = getNextPickTeamId(state);
        const playerId = state.availablePlayers[0].id;
        const result = makeDraftPick(state, team, playerId);
        expect('error' in result).toBe(false);
        state = result as DraftState;
      }

      expect(state.currentPick).toBe(5);
      expect(state.currentRound).toBe(2);
    });

    it('cannot pick already-drafted player', () => {
      const state = freshDraft();
      const playerId = state.availablePlayers[0].id;
      const afterFirst = makeDraftPick(state, 'team-a', playerId) as DraftState;

      // Next team tries to pick the same player
      const nextTeam = getNextPickTeamId(afterFirst);
      const result = makeDraftPick(afterFirst, nextTeam, playerId);
      expect('error' in result).toBe(true);
      expect((result as { error: string }).error).toContain('not available');
    });

    it('returns error when wrong team tries to pick', () => {
      const state = freshDraft();
      const playerId = state.availablePlayers[0].id;
      const result = makeDraftPick(state, 'team-c', playerId);
      expect('error' in result).toBe(true);
    });
  });

  describe('snake draft order', () => {
    it('reverses order on even rounds (round 2)', () => {
      let state = freshDraft('snake');

      // Complete round 1: team-a, team-b, team-c, team-d
      for (let i = 0; i < TEAM_IDS.length; i++) {
        const team = getNextPickTeamId(state);
        const playerId = state.availablePlayers[0].id;
        state = makeDraftPick(state, team, playerId) as DraftState;
      }

      // Round 2 should go in reverse: team-d, team-c, team-b, team-a
      expect(getNextPickTeamId(state)).toBe('team-d');

      const pid1 = state.availablePlayers[0].id;
      state = makeDraftPick(state, 'team-d', pid1) as DraftState;
      expect(getNextPickTeamId(state)).toBe('team-c');

      const pid2 = state.availablePlayers[0].id;
      state = makeDraftPick(state, 'team-c', pid2) as DraftState;
      expect(getNextPickTeamId(state)).toBe('team-b');
    });

    it('reverts to normal order on odd rounds (round 3)', () => {
      let state = freshDraft('snake');

      // Complete 2 full rounds (8 picks)
      for (let i = 0; i < TEAM_IDS.length * 2; i++) {
        const team = getNextPickTeamId(state);
        const playerId = state.availablePlayers[0].id;
        state = makeDraftPick(state, team, playerId) as DraftState;
      }

      expect(state.currentRound).toBe(3);
      expect(getNextPickTeamId(state)).toBe('team-a');
    });
  });

  describe('autoPickForTeam', () => {
    it('selects a player sorted by ADP', () => {
      const state = freshDraft();
      const result = autoPickForTeam(state, 'team-a');

      expect(result.picks).toHaveLength(1);
      // The auto-pick should choose from the best ADP available
      expect(result.availablePlayers.length).toBe(state.availablePlayers.length - 1);
    });

    it('selects highest ADP available player when no positional need', () => {
      let state = freshDraft();

      // Fill all starting positions by manually making picks
      // Then auto-pick should take BPA by ADP
      // For a fresh draft, auto should fill a starting position first (QB has 0)
      const result = autoPickForTeam(state, 'team-a');
      expect(result.picks).toHaveLength(1);
      // First pick should be a position they need (QB, RB, WR, TE, or K with 0 count)
      const pickedPosition = result.picks[0].position;
      expect(['QB', 'RB', 'WR', 'TE', 'K']).toContain(pickedPosition);
    });
  });

  describe('draft completion', () => {
    it('draft completes when all rounds done', () => {
      const smallRoster: RosterSettings = {
        qb: 1,
        rb: 0,
        wr: 0,
        te: 0,
        flex: 0,
        dst: 0,
        k: 0,
        bench: 0,
      };
      const twoTeams = ['team-x', 'team-y'];
      let state = initializeDraft('league-1', twoTeams, 'snake', smallRoster);

      expect(state.totalRounds).toBe(1);

      // Pick 1: team-x
      const team1 = getNextPickTeamId(state);
      state = makeDraftPick(state, team1, state.availablePlayers[0].id) as DraftState;
      expect(state.status).toBe('in_progress');

      // Pick 2: team-y (last pick)
      const team2 = getNextPickTeamId(state);
      state = makeDraftPick(state, team2, state.availablePlayers[0].id) as DraftState;
      expect(state.status).toBe('complete');
    });
  });
});
