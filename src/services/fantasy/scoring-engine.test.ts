import {
  calculatePlayerPoints,
  calculateWeekScore,
  optimizeLineup,
  STANDARD_SCORING,
  HALF_PPR_SCORING,
  FULL_PPR_SCORING,
  MOCK_WEEK_STATS,
} from './scoring-engine';
import type { ScoringSettings, RosterSlot, RosterSettings } from '@/types';

describe('scoring-engine', () => {
  describe('calculatePlayerPoints', () => {
    it('returns correct points for standard scoring', () => {
      const stats = {
        passingYards: 300,
        passingTDs: 3,
        interceptions: 1,
        rushingYards: 50,
        rushingTDs: 0,
        receivingYards: 0,
        receivingTDs: 0,
        receptions: 0,
        fumblesLost: 0,
      };

      const points = calculatePlayerPoints(stats, STANDARD_SCORING);
      // 300/25 = 12, 3*4 = 12, 1*(-2) = -2, 50/10 = 5 => 27
      expect(points).toBe(27);
    });

    it('handles half PPR correctly (0.5 per reception)', () => {
      const stats = {
        receptions: 8,
        receivingYards: 100,
        receivingTDs: 1,
      };

      const points = calculatePlayerPoints(stats, HALF_PPR_SCORING);
      // 100/10 = 10, 1*6 = 6, 8*0.5 = 4 => 20
      expect(points).toBe(20);
    });

    it('handles full PPR correctly (1.0 per reception)', () => {
      const stats = {
        receptions: 8,
        receivingYards: 100,
        receivingTDs: 1,
      };

      const points = calculatePlayerPoints(stats, FULL_PPR_SCORING);
      // 100/10 = 10, 1*6 = 6, 8*1.0 = 8 => 24
      expect(points).toBe(24);
    });

    it('returns zero points for zero stats', () => {
      const stats = {};
      const points = calculatePlayerPoints(stats, STANDARD_SCORING);
      expect(points).toBe(0);
    });

    it('applies negative scoring for interceptions', () => {
      const stats = { interceptions: 3 };
      const points = calculatePlayerPoints(stats, STANDARD_SCORING);
      // 3 * -2 = -6
      expect(points).toBe(-6);
    });

    it('applies negative scoring for fumbles lost', () => {
      const stats = { fumblesLost: 2 };
      const points = calculatePlayerPoints(stats, STANDARD_SCORING);
      // 2 * -2 = -4
      expect(points).toBe(-4);
    });

    it('combines negative and positive scoring correctly', () => {
      const stats = {
        passingYards: 250,
        passingTDs: 2,
        interceptions: 3,
        fumblesLost: 1,
      };

      const points = calculatePlayerPoints(stats, STANDARD_SCORING);
      // 250/25 = 10, 2*4 = 8, 3*(-2) = -6, 1*(-2) = -2 => 10
      expect(points).toBe(10);
    });
  });

  describe('calculateWeekScore', () => {
    it('sums starters only for totalPoints', () => {
      const roster: RosterSlot[] = [
        { position: 'QB', playerId: 'cfb-qb-ewers', playerName: 'Ewers', isStarter: true },
        { position: 'RB', playerId: 'cfb-rb-allen', playerName: 'Allen', isStarter: true },
        { position: 'WR', playerId: 'cfb-wr-harrison', playerName: 'Harrison', isStarter: false },
      ];

      const weekScore = calculateWeekScore(
        'team-1',
        1,
        roster,
        MOCK_WEEK_STATS,
        STANDARD_SCORING,
      );

      // Ewers: 312/25 + 3*4 + 1*(-2) + 18/10 = 12.48 + 12 - 2 + 1.8 = 24.28 -> 24.3
      // Allen: 142/10 + 2*6 + 38/10 + 0 = 14.2 + 12 + 3.8 = 30
      const starterTotal = weekScore.starters.reduce((s, p) => s + p.points, 0);
      expect(weekScore.totalPoints).toBeCloseTo(
        Math.round(starterTotal * 10) / 10,
        1,
      );
      expect(weekScore.bench).toHaveLength(1);
      expect(weekScore.bench[0].playerId).toBe('cfb-wr-harrison');
      // Harrison's bench points should NOT be in totalPoints
      expect(weekScore.totalPoints).toBeLessThan(
        starterTotal + weekScore.bench[0].points,
      );
    });

    it('handles empty roster slots', () => {
      const roster: RosterSlot[] = [
        { position: 'QB', playerId: null, isStarter: true },
      ];

      const weekScore = calculateWeekScore(
        'team-1',
        1,
        roster,
        MOCK_WEEK_STATS,
        STANDARD_SCORING,
      );

      expect(weekScore.totalPoints).toBe(0);
      expect(weekScore.starters).toHaveLength(0);
    });
  });

  describe('optimizeLineup', () => {
    it('maximizes total points by placing highest scorers in starter slots', () => {
      const roster: RosterSlot[] = [
        { position: 'QB', playerId: 'cfb-qb-ewers', playerName: 'Ewers', isStarter: false },
        { position: 'QB', playerId: 'cfb-qb-rattler', playerName: 'Rattler', isStarter: true },
        { position: 'RB', playerId: 'cfb-rb-allen', playerName: 'Allen', isStarter: true },
        { position: 'RB', playerId: 'cfb-rb-achane', playerName: 'Achane', isStarter: false },
      ];

      const rosterSettings: RosterSettings = {
        qb: 1,
        rb: 1,
        wr: 0,
        te: 0,
        flex: 0,
        dst: 0,
        k: 0,
        bench: 2,
      };

      const optimized = optimizeLineup(
        roster,
        MOCK_WEEK_STATS,
        STANDARD_SCORING,
        rosterSettings,
      );

      const starters = optimized.filter((s) => s.isStarter);
      const qbStarter = starters.find((s) => s.position === 'QB');
      const rbStarter = starters.find((s) => s.position === 'RB');

      // Ewers scores more than Rattler, Achane scores more than Allen
      const ewersPoints = calculatePlayerPoints(MOCK_WEEK_STATS['cfb-qb-ewers'], STANDARD_SCORING);
      const rattlerPoints = calculatePlayerPoints(MOCK_WEEK_STATS['cfb-qb-rattler'], STANDARD_SCORING);
      expect(ewersPoints).toBeGreaterThan(rattlerPoints);
      expect(qbStarter?.playerId).toBe('cfb-qb-ewers');

      const achanePoints = calculatePlayerPoints(MOCK_WEEK_STATS['cfb-rb-achane'], STANDARD_SCORING);
      const allenPoints = calculatePlayerPoints(MOCK_WEEK_STATS['cfb-rb-allen'], STANDARD_SCORING);
      expect(achanePoints).toBeGreaterThan(allenPoints);
      expect(rbStarter?.playerId).toBe('cfb-rb-achane');
    });
  });
});
