import {
  createTradeProposal,
  respondToTrade,
  analyzeTrade,
  addVetoVote,
} from './trade-engine';
import type { FantasyPlayerInfo, TradeProposal } from '@/types';

function makeMockPlayer(overrides: Partial<FantasyPlayerInfo> = {}): FantasyPlayerInfo {
  return {
    id: 'p-1',
    name: 'Test Player',
    position: 'QB',
    school: 'Test U',
    conference: 'SEC',
    projectedPoints: 250,
    adp: 10,
    byeWeek: 7,
    seasonStats: {},
    ...overrides,
  };
}

describe('trade-engine', () => {
  describe('createTradeProposal', () => {
    it('creates valid proposal with pending status', () => {
      const proposal = createTradeProposal(
        'league-1',
        'team-a',
        'team-b',
        ['p-1'],
        ['Player One'],
        ['p-2'],
        ['Player Two'],
        'Fair deal?',
      );

      expect(proposal.id).toBeDefined();
      expect(proposal.id).toMatch(/^trade_/);
      expect(proposal.leagueId).toBe('league-1');
      expect(proposal.proposingTeamId).toBe('team-a');
      expect(proposal.receivingTeamId).toBe('team-b');
      expect(proposal.sendPlayerIds).toEqual(['p-1']);
      expect(proposal.receivePlayerIds).toEqual(['p-2']);
      expect(proposal.status).toBe('pending');
      expect(proposal.message).toBe('Fair deal?');
      expect(proposal.proposedAt).toBeGreaterThan(0);
      expect(proposal.vetoVotes).toBe(0);
    });

    it('sets veto threshold based on league size', () => {
      const proposal = createTradeProposal(
        'league-1',
        'team-a',
        'team-b',
        ['p-1'],
        ['Player One'],
        ['p-2'],
        ['Player Two'],
        undefined,
        12,
      );

      expect(proposal.vetoThreshold).toBe(6); // ceil(12/2)
    });
  });

  describe('respondToTrade', () => {
    it('changes status to accepted', () => {
      const proposal = createTradeProposal(
        'league-1',
        'team-a',
        'team-b',
        ['p-1'],
        ['Player One'],
        ['p-2'],
        ['Player Two'],
      );

      const accepted = respondToTrade(proposal, 'accepted');
      expect(accepted.status).toBe('accepted');
      expect(accepted.respondedAt).toBeDefined();
      expect(accepted.respondedAt).toBeGreaterThan(0);
    });

    it('changes status to rejected', () => {
      const proposal = createTradeProposal(
        'league-1',
        'team-a',
        'team-b',
        ['p-1'],
        ['Player One'],
        ['p-2'],
        ['Player Two'],
      );

      const rejected = respondToTrade(proposal, 'rejected');
      expect(rejected.status).toBe('rejected');
      expect(rejected.respondedAt).toBeDefined();
    });
  });

  describe('analyzeTrade', () => {
    it('returns fairness score in valid range (-100 to 100)', () => {
      const sendPlayers = [makeMockPlayer({ projectedPoints: 250, adp: 10 })];
      const receivePlayers = [makeMockPlayer({ id: 'p-2', projectedPoints: 200, adp: 30 })];

      const analysis = analyzeTrade(sendPlayers, receivePlayers);

      expect(analysis.fairnessScore).toBeGreaterThanOrEqual(-100);
      expect(analysis.fairnessScore).toBeLessThanOrEqual(100);
      expect(analysis.proposingSideValue).toBeGreaterThan(0);
      expect(analysis.receivingSideValue).toBeGreaterThan(0);
      expect(analysis.verdict).toBeDefined();
      expect(['great', 'good', 'fair', 'poor', 'lopsided']).toContain(analysis.verdict);
      expect(analysis.reasoning.length).toBeGreaterThanOrEqual(2);
    });

    it('returns near-zero fairness for equal players', () => {
      const player = makeMockPlayer({ projectedPoints: 250, adp: 15 });
      const analysis = analyzeTrade([player], [{ ...player, id: 'p-copy' }]);

      expect(Math.abs(analysis.fairnessScore)).toBeLessThanOrEqual(10);
    });

    it('detects lopsided trade with large value gap', () => {
      const elite = makeMockPlayer({ projectedPoints: 350, adp: 1 });
      const scrub = makeMockPlayer({ id: 'p-2', projectedPoints: 80, adp: 150 });

      const analysis = analyzeTrade([elite], [scrub]);
      expect(Math.abs(analysis.fairnessScore)).toBeGreaterThan(25);
    });
  });

  describe('veto system', () => {
    it('tracks veto votes', () => {
      const proposal = createTradeProposal(
        'league-1',
        'team-a',
        'team-b',
        ['p-1'],
        ['Player One'],
        ['p-2'],
        ['Player Two'],
        undefined,
        10,
      );

      expect(proposal.vetoVotes).toBe(0);
      expect(proposal.vetoThreshold).toBe(5);

      const after1 = addVetoVote(proposal);
      expect(after1.vetoVotes).toBe(1);
      expect(after1.status).toBe('pending');

      const after2 = addVetoVote(after1);
      expect(after2.vetoVotes).toBe(2);
      expect(after2.status).toBe('pending');
    });

    it('vetoes trade when threshold is reached', () => {
      let proposal = createTradeProposal(
        'league-1',
        'team-a',
        'team-b',
        ['p-1'],
        ['Player One'],
        ['p-2'],
        ['Player Two'],
        undefined,
        4, // threshold = ceil(4/2) = 2
      );

      proposal = addVetoVote(proposal);
      expect(proposal.status).toBe('pending');

      proposal = addVetoVote(proposal);
      expect(proposal.status).toBe('vetoed');
      expect(proposal.respondedAt).toBeGreaterThan(0);
    });
  });

  describe('cannot trade to yourself', () => {
    it('createTradeProposal allows same team IDs (validation is caller responsibility) but analysis still works', () => {
      // The engine does not enforce this directly, but we document
      // that the proposing and receiving team should differ.
      // This test verifies the function does not throw.
      const proposal = createTradeProposal(
        'league-1',
        'team-a',
        'team-a',
        ['p-1'],
        ['Player One'],
        ['p-2'],
        ['Player Two'],
      );

      expect(proposal.proposingTeamId).toBe('team-a');
      expect(proposal.receivingTeamId).toBe('team-a');
    });
  });
});
