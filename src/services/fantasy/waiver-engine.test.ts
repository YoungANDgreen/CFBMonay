import {
  createWaiverClaim,
  processWaiverClaims,
  getAvailableFreeAgents,
} from './waiver-engine';
import type { FantasyTeam, RosterSettings, RosterSlot, WaiverClaim } from '@/types';

const DEFAULT_ROSTER_SETTINGS: RosterSettings = {
  qb: 1,
  rb: 2,
  wr: 2,
  te: 1,
  flex: 1,
  dst: 1,
  k: 1,
  bench: 6,
};

function makeTeam(
  id: string,
  filledSlots: number,
  waiverBudget: number = 100,
): FantasyTeam {
  const roster: RosterSlot[] = [];
  // Fill some slots with players
  for (let i = 0; i < filledSlots; i++) {
    roster.push({
      position: 'RB',
      playerId: `existing-${id}-${i}`,
      playerName: `Player ${i}`,
      isStarter: i < 9, // first 9 are starters
    });
  }
  // Add empty slots to reach max roster size (15)
  for (let i = filledSlots; i < 15; i++) {
    roster.push({
      position: 'RB',
      playerId: null,
      isStarter: i < 9,
    });
  }

  return {
    id,
    leagueId: 'league-1',
    userId: `user-${id}`,
    teamName: `Team ${id}`,
    roster,
    record: { wins: 3, losses: 2, ties: 0 },
    pointsFor: 500,
    pointsAgainst: 450,
    waiverBudget,
  };
}

function makeClaim(
  teamId: string,
  addPlayerId: string,
  faabBid: number,
  priority: number = 0,
  dropPlayerId: string | null = null,
  dropPlayerName: string | null = null,
): WaiverClaim {
  return {
    id: `wc-${Date.now()}-${Math.random()}`,
    leagueId: 'league-1',
    teamId,
    addPlayerId,
    addPlayerName: `Player ${addPlayerId}`,
    dropPlayerId,
    dropPlayerName,
    faabBid,
    priority,
    status: 'pending',
    submittedAt: Date.now(),
  };
}

describe('waiver-engine', () => {
  describe('createWaiverClaim', () => {
    it('creates valid claim with pending status', () => {
      const result = createWaiverClaim(
        'league-1',
        'team-a',
        'player-x',
        'Player X',
        null,
        null,
        25,
      );

      expect('error' in result).toBe(false);
      const claim = result as WaiverClaim;
      expect(claim.id).toBeDefined();
      expect(claim.leagueId).toBe('league-1');
      expect(claim.teamId).toBe('team-a');
      expect(claim.addPlayerId).toBe('player-x');
      expect(claim.faabBid).toBe(25);
      expect(claim.status).toBe('pending');
      expect(claim.submittedAt).toBeGreaterThan(0);
    });

    it('rejects negative bid', () => {
      const result = createWaiverClaim(
        'league-1',
        'team-a',
        'player-x',
        'Player X',
        null,
        null,
        -5,
      );

      expect('error' in result).toBe(true);
      expect((result as { error: string }).error).toContain('FAAB bid');
    });

    it('allows zero bid', () => {
      const result = createWaiverClaim(
        'league-1',
        'team-a',
        'player-x',
        'Player X',
        null,
        null,
        0,
      );

      expect('error' in result).toBe(false);
      expect((result as WaiverClaim).faabBid).toBe(0);
    });
  });

  describe('processWaiverClaims', () => {
    it('awards player to highest bidder', () => {
      const teamA = makeTeam('team-a', 10, 100);
      const teamB = makeTeam('team-b', 10, 100);

      const claims: WaiverClaim[] = [
        makeClaim('team-a', 'fa-player-1', 30, 1),
        makeClaim('team-b', 'fa-player-1', 50, 2),
      ];

      const { processedClaims, updatedTeams } = processWaiverClaims(
        claims,
        [teamA, teamB],
        DEFAULT_ROSTER_SETTINGS,
      );

      const approved = processedClaims.find((c) => c.status === 'approved');
      const denied = processedClaims.find((c) => c.status === 'denied');

      expect(approved).toBeDefined();
      expect(approved!.teamId).toBe('team-b');
      expect(approved!.faabBid).toBe(50);

      expect(denied).toBeDefined();
      expect(denied!.teamId).toBe('team-a');

      // Team B's budget should be deducted
      const updatedTeamB = updatedTeams.find((t) => t.id === 'team-b');
      expect(updatedTeamB!.waiverBudget).toBe(50); // 100 - 50
    });

    it('uses priority as tiebreaker (lower priority number wins)', () => {
      const teamA = makeTeam('team-a', 10, 100);
      const teamB = makeTeam('team-b', 10, 100);

      const claims: WaiverClaim[] = [
        makeClaim('team-a', 'fa-player-1', 40, 2), // same bid, higher priority number (worse)
        makeClaim('team-b', 'fa-player-1', 40, 1), // same bid, lower priority number (better)
      ];

      const { processedClaims } = processWaiverClaims(
        claims,
        [teamA, teamB],
        DEFAULT_ROSTER_SETTINGS,
      );

      const approved = processedClaims.find((c) => c.status === 'approved');
      expect(approved).toBeDefined();
      expect(approved!.teamId).toBe('team-b');
    });

    it('denies claim when team cannot afford bid', () => {
      const teamA = makeTeam('team-a', 10, 20);

      const claims: WaiverClaim[] = [
        makeClaim('team-a', 'fa-player-1', 50),
      ];

      const { processedClaims } = processWaiverClaims(
        claims,
        [teamA],
        DEFAULT_ROSTER_SETTINGS,
      );

      expect(processedClaims[0].status).toBe('denied');
    });
  });

  describe('getAvailableFreeAgents', () => {
    it('filters out rostered players', () => {
      const allPlayers = [
        { id: 'p-1', name: 'Player 1' },
        { id: 'p-2', name: 'Player 2' },
        { id: 'p-3', name: 'Player 3' },
      ];

      const team: FantasyTeam = {
        id: 'team-1',
        leagueId: 'league-1',
        userId: 'user-1',
        teamName: 'Team 1',
        roster: [
          { position: 'QB', playerId: 'p-1', playerName: 'Player 1', isStarter: true },
          { position: 'RB', playerId: null, isStarter: false },
        ],
        record: { wins: 0, losses: 0, ties: 0 },
        pointsFor: 0,
        pointsAgainst: 0,
        waiverBudget: 100,
      };

      const freeAgents = getAvailableFreeAgents(allPlayers, [team]);

      expect(freeAgents).toHaveLength(2);
      expect(freeAgents.map((fa) => fa.id)).toEqual(['p-2', 'p-3']);
    });

    it('returns all players when no one is rostered', () => {
      const allPlayers = [
        { id: 'p-1', name: 'Player 1' },
        { id: 'p-2', name: 'Player 2' },
      ];

      const team: FantasyTeam = {
        id: 'team-1',
        leagueId: 'league-1',
        userId: 'user-1',
        teamName: 'Team 1',
        roster: [],
        record: { wins: 0, losses: 0, ties: 0 },
        pointsFor: 0,
        pointsAgainst: 0,
        waiverBudget: 100,
      };

      const freeAgents = getAvailableFreeAgents(allPlayers, [team]);
      expect(freeAgents).toHaveLength(2);
    });
  });
});
