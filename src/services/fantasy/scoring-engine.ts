// ============================================================
// GridIron IQ — Fantasy Football Scoring Engine
// Pure functions for scoring, lineup optimization, and standings
// ============================================================

import type {
  ScoringSettings,
  RosterSettings,
  RosterSlot,
  FantasyPlayerScore,
  FantasyWeekScore,
  FantasyTeam,
} from '@/types';

// ============================================================
// Scoring Presets
// ============================================================

export const STANDARD_SCORING: ScoringSettings = {
  passingYardsPerPoint: 25,
  passingTD: 4,
  interception: -2,
  rushingYardsPerPoint: 10,
  rushingTD: 6,
  receivingYardsPerPoint: 10,
  receivingTD: 6,
  reception: 0,
  fumbleLost: -2,
};

export const HALF_PPR_SCORING: ScoringSettings = {
  ...STANDARD_SCORING,
  reception: 0.5,
};

export const FULL_PPR_SCORING: ScoringSettings = {
  ...STANDARD_SCORING,
  reception: 1,
};

// ============================================================
// Player Stats Shape (keys expected in stat objects)
// ============================================================

export interface PlayerWeekStats {
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  rushingYards?: number;
  rushingTDs?: number;
  receivingYards?: number;
  receivingTDs?: number;
  receptions?: number;
  fumblesLost?: number;
}

// ============================================================
// calculatePlayerPoints
// ============================================================

export function calculatePlayerPoints(
  playerStats: Record<string, number>,
  settings: ScoringSettings,
): number {
  let points = 0;

  const passingYards = playerStats['passingYards'] ?? 0;
  const passingTDs = playerStats['passingTDs'] ?? 0;
  const interceptions = playerStats['interceptions'] ?? 0;
  const rushingYards = playerStats['rushingYards'] ?? 0;
  const rushingTDs = playerStats['rushingTDs'] ?? 0;
  const receivingYards = playerStats['receivingYards'] ?? 0;
  const receivingTDs = playerStats['receivingTDs'] ?? 0;
  const receptions = playerStats['receptions'] ?? 0;
  const fumblesLost = playerStats['fumblesLost'] ?? 0;

  // Yardage points (yards / yardsPerPoint)
  if (settings.passingYardsPerPoint > 0) {
    points += passingYards / settings.passingYardsPerPoint;
  }
  if (settings.rushingYardsPerPoint > 0) {
    points += rushingYards / settings.rushingYardsPerPoint;
  }
  if (settings.receivingYardsPerPoint > 0) {
    points += receivingYards / settings.receivingYardsPerPoint;
  }

  // Touchdown points
  points += passingTDs * settings.passingTD;
  points += rushingTDs * settings.rushingTD;
  points += receivingTDs * settings.receivingTD;

  // Reception points (PPR)
  points += receptions * settings.reception;

  // Turnover penalties
  points += interceptions * settings.interception;
  points += fumblesLost * settings.fumbleLost;

  // Round to 1 decimal place
  return Math.round(points * 10) / 10;
}

// ============================================================
// calculateWeekScore
// ============================================================

export function calculateWeekScore(
  teamId: string,
  week: number,
  roster: RosterSlot[],
  weekStats: Record<string, Record<string, number>>,
  settings: ScoringSettings,
): FantasyWeekScore {
  const starters: FantasyPlayerScore[] = [];
  const bench: FantasyPlayerScore[] = [];

  for (const slot of roster) {
    if (!slot.playerId) continue;

    const stats = weekStats[slot.playerId] ?? {};
    const points = calculatePlayerPoints(stats, settings);

    const playerScore: FantasyPlayerScore = {
      playerId: slot.playerId,
      playerName: slot.playerName ?? 'Unknown',
      position: slot.position,
      points,
      stats,
      isStarter: slot.isStarter,
    };

    if (slot.isStarter) {
      starters.push(playerScore);
    } else {
      bench.push(playerScore);
    }
  }

  const totalPoints =
    Math.round(starters.reduce((sum, s) => sum + s.points, 0) * 10) / 10;

  return {
    teamId,
    week,
    starters,
    bench,
    totalPoints,
  };
}

// ============================================================
// optimizeLineup
// ============================================================

const FLEX_ELIGIBLE_POSITIONS = ['RB', 'WR', 'TE'];

export function optimizeLineup(
  roster: RosterSlot[],
  weekStats: Record<string, Record<string, number>>,
  settings: ScoringSettings,
  rosterSettings: RosterSettings,
): RosterSlot[] {
  // Score every player on the roster
  type ScoredPlayer = {
    playerId: string;
    playerName: string;
    position: string;
    points: number;
  };

  const scoredPlayers: ScoredPlayer[] = roster
    .filter((slot) => slot.playerId !== null)
    .map((slot) => ({
      playerId: slot.playerId as string,
      playerName: slot.playerName ?? 'Unknown',
      position: slot.position,
      points: calculatePlayerPoints(
        weekStats[slot.playerId as string] ?? {},
        settings,
      ),
    }));

  // Sort descending by points
  scoredPlayers.sort((a, b) => b.points - a.points);

  // Track which players have been assigned a starter slot
  const assigned = new Set<string>();

  // Build starter slots by position
  const starterSlots: RosterSlot[] = [];

  const fillSlots = (
    positionKey: keyof RosterSettings,
    positionLabel: string,
    eligible: string[],
  ) => {
    const count = rosterSettings[positionKey] ?? 0;
    for (let i = 0; i < count; i++) {
      const best = scoredPlayers.find(
        (p) => !assigned.has(p.playerId) && eligible.includes(p.position),
      );
      if (best) {
        assigned.add(best.playerId);
        starterSlots.push({
          position: positionLabel,
          playerId: best.playerId,
          playerName: best.playerName,
          isStarter: true,
        });
      } else {
        starterSlots.push({
          position: positionLabel,
          playerId: null,
          isStarter: true,
        });
      }
    }
  };

  // Fill positional starters first (non-FLEX)
  fillSlots('qb', 'QB', ['QB']);
  fillSlots('rb', 'RB', ['RB']);
  fillSlots('wr', 'WR', ['WR']);
  fillSlots('te', 'TE', ['TE']);
  fillSlots('k', 'K', ['K']);
  fillSlots('dst', 'DST', ['DST']);

  // Fill FLEX last so positional starters are prioritized
  fillSlots('flex', 'FLEX', FLEX_ELIGIBLE_POSITIONS);

  // Remaining players go to bench
  const benchSlots: RosterSlot[] = scoredPlayers
    .filter((p) => !assigned.has(p.playerId))
    .map((p) => ({
      position: p.position,
      playerId: p.playerId,
      playerName: p.playerName,
      isStarter: false,
    }));

  return [...starterSlots, ...benchSlots];
}

// ============================================================
// Standing Calculation
// ============================================================

export interface StandingEntry {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  winPct: number;
}

export function calculateSeasonStandings(
  teams: FantasyTeam[],
  weekScores: FantasyWeekScore[],
): StandingEntry[] {
  // Build a map of total points scored per team across all weeks
  const pointsByTeam = new Map<string, number>();
  for (const score of weekScores) {
    pointsByTeam.set(
      score.teamId,
      (pointsByTeam.get(score.teamId) ?? 0) + score.totalPoints,
    );
  }

  const standings: StandingEntry[] = teams.map((team) => ({
    teamId: team.id,
    teamName: team.teamName,
    wins: team.record.wins,
    losses: team.record.losses,
    ties: team.record.ties,
    pointsFor: pointsByTeam.get(team.id) ?? team.pointsFor,
    pointsAgainst: team.pointsAgainst,
    winPct:
      team.record.wins + team.record.losses + team.record.ties > 0
        ? (team.record.wins + team.record.ties * 0.5) /
          (team.record.wins + team.record.losses + team.record.ties)
        : 0,
  }));

  // Sort by: win percentage desc, then points for desc
  standings.sort((a, b) => {
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;
    return b.pointsFor - a.pointsFor;
  });

  return standings;
}

// ============================================================
// MOCK_WEEK_STATS
// Realistic weekly stat lines for ~50 college football players
// IDs follow the pattern: cfb-{position}-{lastName}
// ============================================================

export const MOCK_WEEK_STATS: Record<string, Record<string, number>> = {
  // --- Quarterbacks ---
  'cfb-qb-ewers': {
    passingYards: 312,
    passingTDs: 3,
    interceptions: 1,
    rushingYards: 18,
    rushingTDs: 0,
    receptions: 0,
    fumblesLost: 0,
  },
  'cfb-qb-beck': {
    passingYards: 287,
    passingTDs: 2,
    interceptions: 0,
    rushingYards: 34,
    rushingTDs: 1,
    receptions: 0,
    fumblesLost: 0,
  },
  'cfb-qb-howard': {
    passingYards: 245,
    passingTDs: 2,
    interceptions: 1,
    rushingYards: 67,
    rushingTDs: 1,
    receptions: 0,
    fumblesLost: 0,
  },
  'cfb-qb-gabriel': {
    passingYards: 298,
    passingTDs: 3,
    interceptions: 0,
    rushingYards: 12,
    rushingTDs: 0,
    receptions: 0,
    fumblesLost: 0,
  },
  'cfb-qb-sanders': {
    passingYards: 275,
    passingTDs: 2,
    interceptions: 2,
    rushingYards: 82,
    rushingTDs: 1,
    receptions: 0,
    fumblesLost: 1,
  },
  'cfb-qb-dart': {
    passingYards: 334,
    passingTDs: 4,
    interceptions: 1,
    rushingYards: -3,
    rushingTDs: 0,
    receptions: 0,
    fumblesLost: 0,
  },
  'cfb-qb-allar': {
    passingYards: 221,
    passingTDs: 1,
    interceptions: 0,
    rushingYards: 28,
    rushingTDs: 1,
    receptions: 0,
    fumblesLost: 0,
  },
  'cfb-qb-rattler': {
    passingYards: 189,
    passingTDs: 1,
    interceptions: 2,
    rushingYards: 15,
    rushingTDs: 0,
    receptions: 0,
    fumblesLost: 0,
  },
  'cfb-qb-nico': {
    passingYards: 265,
    passingTDs: 2,
    interceptions: 0,
    rushingYards: 45,
    rushingTDs: 0,
    receptions: 0,
    fumblesLost: 0,
  },
  'cfb-qb-penix': {
    passingYards: 352,
    passingTDs: 3,
    interceptions: 0,
    rushingYards: 8,
    rushingTDs: 0,
    receptions: 0,
    fumblesLost: 0,
  },

  // --- Running Backs ---
  'cfb-rb-allen': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 142,
    rushingTDs: 2,
    receivingYards: 38,
    receivingTDs: 0,
    receptions: 4,
    fumblesLost: 0,
  },
  'cfb-rb-sawyer': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 118,
    rushingTDs: 1,
    receivingYards: 22,
    receivingTDs: 0,
    receptions: 2,
    fumblesLost: 0,
  },
  'cfb-rb-corum': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 97,
    rushingTDs: 1,
    receivingYards: 15,
    receivingTDs: 0,
    receptions: 1,
    fumblesLost: 0,
  },
  'cfb-rb-baxter': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 134,
    rushingTDs: 2,
    receivingYards: 47,
    receivingTDs: 1,
    receptions: 5,
    fumblesLost: 0,
  },
  'cfb-rb-johnson': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 88,
    rushingTDs: 0,
    receivingYards: 52,
    receivingTDs: 1,
    receptions: 6,
    fumblesLost: 1,
  },
  'cfb-rb-bigsby': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 76,
    rushingTDs: 1,
    receivingYards: 18,
    receivingTDs: 0,
    receptions: 2,
    fumblesLost: 0,
  },
  'cfb-rb-etienne': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 156,
    rushingTDs: 2,
    receivingYards: 31,
    receivingTDs: 0,
    receptions: 3,
    fumblesLost: 0,
  },
  'cfb-rb-tucker': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 64,
    rushingTDs: 0,
    receivingYards: 42,
    receivingTDs: 1,
    receptions: 4,
    fumblesLost: 0,
  },
  'cfb-rb-hall': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 109,
    rushingTDs: 1,
    receivingYards: 28,
    receivingTDs: 0,
    receptions: 3,
    fumblesLost: 0,
  },
  'cfb-rb-achane': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 168,
    rushingTDs: 3,
    receivingYards: 44,
    receivingTDs: 0,
    receptions: 3,
    fumblesLost: 0,
  },

  // --- Wide Receivers ---
  'cfb-wr-harrison': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 12,
    rushingTDs: 0,
    receivingYards: 148,
    receivingTDs: 2,
    receptions: 9,
    fumblesLost: 0,
  },
  'cfb-wr-worthy': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 112,
    receivingTDs: 1,
    receptions: 6,
    fumblesLost: 0,
  },
  'cfb-wr-brooks': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 8,
    rushingTDs: 0,
    receivingYards: 98,
    receivingTDs: 1,
    receptions: 7,
    fumblesLost: 0,
  },
  'cfb-wr-njigba': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 134,
    receivingTDs: 1,
    receptions: 11,
    fumblesLost: 0,
  },
  'cfb-wr-addison': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 5,
    rushingTDs: 0,
    receivingYards: 87,
    receivingTDs: 0,
    receptions: 5,
    fumblesLost: 0,
  },
  'cfb-wr-boutte': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 65,
    receivingTDs: 1,
    receptions: 4,
    fumblesLost: 0,
  },
  'cfb-wr-egbuka': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 103,
    receivingTDs: 1,
    receptions: 7,
    fumblesLost: 0,
  },
  'cfb-wr-jameson': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 22,
    rushingTDs: 0,
    receivingYards: 157,
    receivingTDs: 2,
    receptions: 8,
    fumblesLost: 0,
  },
  'cfb-wr-downs': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 76,
    receivingTDs: 0,
    receptions: 6,
    fumblesLost: 0,
  },
  'cfb-wr-teteh': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 91,
    receivingTDs: 1,
    receptions: 5,
    fumblesLost: 0,
  },
  'cfb-wr-dotson': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 14,
    rushingTDs: 0,
    receivingYards: 128,
    receivingTDs: 2,
    receptions: 8,
    fumblesLost: 0,
  },
  'cfb-wr-mingo': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 58,
    receivingTDs: 0,
    receptions: 3,
    fumblesLost: 0,
  },

  // --- Tight Ends ---
  'cfb-te-bowers': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 88,
    receivingTDs: 1,
    receptions: 6,
    fumblesLost: 0,
  },
  'cfb-te-washington': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 52,
    receivingTDs: 1,
    receptions: 4,
    fumblesLost: 0,
  },
  'cfb-te-laporta': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 74,
    receivingTDs: 0,
    receptions: 5,
    fumblesLost: 0,
  },
  'cfb-te-kincaid': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 96,
    receivingTDs: 2,
    receptions: 7,
    fumblesLost: 0,
  },
  'cfb-te-mcbride': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 42,
    receivingTDs: 0,
    receptions: 3,
    fumblesLost: 0,
  },
  'cfb-te-gilbert': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 67,
    receivingTDs: 1,
    receptions: 5,
    fumblesLost: 0,
  },
  'cfb-te-fryar': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 35,
    receivingTDs: 0,
    receptions: 2,
    fumblesLost: 0,
  },
  'cfb-te-billingsley': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 58,
    receivingTDs: 1,
    receptions: 4,
    fumblesLost: 0,
  },

  // --- Kickers ---
  'cfb-k-aubrey': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 0,
    receivingTDs: 0,
    receptions: 0,
    fumblesLost: 0,
  },
  'cfb-k-yorke': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 0,
    receivingTDs: 0,
    receptions: 0,
    fumblesLost: 0,
  },

  // --- Additional RBs for depth ---
  'cfb-rb-gibbs': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 112,
    rushingTDs: 1,
    receivingYards: 65,
    receivingTDs: 1,
    receptions: 7,
    fumblesLost: 0,
  },
  'cfb-rb-robinson': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 145,
    rushingTDs: 2,
    receivingYards: 12,
    receivingTDs: 0,
    receptions: 1,
    fumblesLost: 1,
  },
  'cfb-rb-white': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 82,
    rushingTDs: 1,
    receivingYards: 27,
    receivingTDs: 0,
    receptions: 3,
    fumblesLost: 0,
  },

  // --- Additional WRs for depth ---
  'cfb-wr-hyatt': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 145,
    receivingTDs: 2,
    receptions: 6,
    fumblesLost: 0,
  },
  'cfb-wr-rome': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 0,
    rushingTDs: 0,
    receivingYards: 82,
    receivingTDs: 1,
    receptions: 5,
    fumblesLost: 0,
  },
  'cfb-wr-bell': {
    passingYards: 0,
    passingTDs: 0,
    interceptions: 0,
    rushingYards: 6,
    rushingTDs: 0,
    receivingYards: 72,
    receivingTDs: 0,
    receptions: 4,
    fumblesLost: 0,
  },
};
