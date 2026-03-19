import type {
  GamePrediction,
  PredictionFactor,
  TeamFeatures,
  MatchupFeatures,
} from '@/types';

import {
  getTeamStats,
  getAllTeams,
} from '@/services/data/cfbd-cache';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MODEL_VERSION = 'v1.0.0-ts';

// ---------------------------------------------------------------------------
// Mock Team Features — 25+ FBS teams with realistic 2024-era stats
// ---------------------------------------------------------------------------

export const MOCK_TEAM_FEATURES: Record<string, TeamFeatures> = {
  // ── SEC ──────────────────────────────────────────────────────────────────
  alabama: {
    teamId: 'alabama',
    teamName: 'Alabama',
    conference: 'SEC',
    pointsScoredAvg: 37.2,
    pointsAllowedAvg: 17.8,
    yardsPerPlayOffense: 6.8,
    yardsPerPlayDefense: 4.7,
    thirdDownConvRate: 0.44,
    redZoneScoringPct: 0.89,
    turnoverMargin: 0.6,
    eloRating: 1720,
    strengthOfSchedule: 0.78,
    recruitingComposite3yr: 0.96,
    returningProductionPct: 0.58,
    coachTenureYears: 2,
    coachCareerWinPct: 0.74,
  },
  georgia: {
    teamId: 'georgia',
    teamName: 'Georgia',
    conference: 'SEC',
    pointsScoredAvg: 38.5,
    pointsAllowedAvg: 14.3,
    yardsPerPlayOffense: 7.1,
    yardsPerPlayDefense: 4.3,
    thirdDownConvRate: 0.47,
    redZoneScoringPct: 0.92,
    turnoverMargin: 0.9,
    eloRating: 1755,
    strengthOfSchedule: 0.80,
    recruitingComposite3yr: 0.97,
    returningProductionPct: 0.55,
    coachTenureYears: 9,
    coachCareerWinPct: 0.81,
  },
  lsu: {
    teamId: 'lsu',
    teamName: 'LSU',
    conference: 'SEC',
    pointsScoredAvg: 33.8,
    pointsAllowedAvg: 21.5,
    yardsPerPlayOffense: 6.5,
    yardsPerPlayDefense: 5.1,
    thirdDownConvRate: 0.42,
    redZoneScoringPct: 0.86,
    turnoverMargin: 0.2,
    eloRating: 1660,
    strengthOfSchedule: 0.77,
    recruitingComposite3yr: 0.93,
    returningProductionPct: 0.62,
    coachTenureYears: 3,
    coachCareerWinPct: 0.72,
  },
  tennessee: {
    teamId: 'tennessee',
    teamName: 'Tennessee',
    conference: 'SEC',
    pointsScoredAvg: 31.4,
    pointsAllowedAvg: 19.7,
    yardsPerPlayOffense: 6.2,
    yardsPerPlayDefense: 4.9,
    thirdDownConvRate: 0.40,
    redZoneScoringPct: 0.84,
    turnoverMargin: 0.3,
    eloRating: 1620,
    strengthOfSchedule: 0.76,
    recruitingComposite3yr: 0.89,
    returningProductionPct: 0.64,
    coachTenureYears: 4,
    coachCareerWinPct: 0.68,
  },
  ole_miss: {
    teamId: 'ole_miss',
    teamName: 'Ole Miss',
    conference: 'SEC',
    pointsScoredAvg: 35.1,
    pointsAllowedAvg: 18.4,
    yardsPerPlayOffense: 6.7,
    yardsPerPlayDefense: 4.8,
    thirdDownConvRate: 0.43,
    redZoneScoringPct: 0.88,
    turnoverMargin: 0.5,
    eloRating: 1670,
    strengthOfSchedule: 0.75,
    recruitingComposite3yr: 0.90,
    returningProductionPct: 0.52,
    coachTenureYears: 5,
    coachCareerWinPct: 0.71,
  },
  texas_am: {
    teamId: 'texas_am',
    teamName: 'Texas A&M',
    conference: 'SEC',
    pointsScoredAvg: 28.9,
    pointsAllowedAvg: 20.3,
    yardsPerPlayOffense: 5.9,
    yardsPerPlayDefense: 5.0,
    thirdDownConvRate: 0.39,
    redZoneScoringPct: 0.82,
    turnoverMargin: 0.1,
    eloRating: 1610,
    strengthOfSchedule: 0.76,
    recruitingComposite3yr: 0.92,
    returningProductionPct: 0.60,
    coachTenureYears: 3,
    coachCareerWinPct: 0.65,
  },

  // ── Big Ten ──────────────────────────────────────────────────────────────
  ohio_state: {
    teamId: 'ohio_state',
    teamName: 'Ohio State',
    conference: 'Big Ten',
    pointsScoredAvg: 39.7,
    pointsAllowedAvg: 13.9,
    yardsPerPlayOffense: 7.2,
    yardsPerPlayDefense: 4.2,
    thirdDownConvRate: 0.48,
    redZoneScoringPct: 0.93,
    turnoverMargin: 1.0,
    eloRating: 1760,
    strengthOfSchedule: 0.74,
    recruitingComposite3yr: 0.97,
    returningProductionPct: 0.57,
    coachTenureYears: 4,
    coachCareerWinPct: 0.78,
  },
  michigan: {
    teamId: 'michigan',
    teamName: 'Michigan',
    conference: 'Big Ten',
    pointsScoredAvg: 29.3,
    pointsAllowedAvg: 14.8,
    yardsPerPlayOffense: 5.8,
    yardsPerPlayDefense: 4.4,
    thirdDownConvRate: 0.38,
    redZoneScoringPct: 0.85,
    turnoverMargin: 0.7,
    eloRating: 1680,
    strengthOfSchedule: 0.73,
    recruitingComposite3yr: 0.91,
    returningProductionPct: 0.48,
    coachTenureYears: 1,
    coachCareerWinPct: 0.62,
  },
  penn_state: {
    teamId: 'penn_state',
    teamName: 'Penn State',
    conference: 'Big Ten',
    pointsScoredAvg: 32.6,
    pointsAllowedAvg: 16.5,
    yardsPerPlayOffense: 6.4,
    yardsPerPlayDefense: 4.6,
    thirdDownConvRate: 0.42,
    redZoneScoringPct: 0.87,
    turnoverMargin: 0.4,
    eloRating: 1690,
    strengthOfSchedule: 0.72,
    recruitingComposite3yr: 0.90,
    returningProductionPct: 0.63,
    coachTenureYears: 10,
    coachCareerWinPct: 0.74,
  },
  oregon: {
    teamId: 'oregon',
    teamName: 'Oregon',
    conference: 'Big Ten',
    pointsScoredAvg: 36.4,
    pointsAllowedAvg: 17.1,
    yardsPerPlayOffense: 6.9,
    yardsPerPlayDefense: 4.8,
    thirdDownConvRate: 0.45,
    redZoneScoringPct: 0.90,
    turnoverMargin: 0.5,
    eloRating: 1710,
    strengthOfSchedule: 0.71,
    recruitingComposite3yr: 0.89,
    returningProductionPct: 0.66,
    coachTenureYears: 3,
    coachCareerWinPct: 0.76,
  },
  usc: {
    teamId: 'usc',
    teamName: 'USC',
    conference: 'Big Ten',
    pointsScoredAvg: 33.1,
    pointsAllowedAvg: 24.6,
    yardsPerPlayOffense: 6.6,
    yardsPerPlayDefense: 5.4,
    thirdDownConvRate: 0.43,
    redZoneScoringPct: 0.86,
    turnoverMargin: -0.2,
    eloRating: 1620,
    strengthOfSchedule: 0.70,
    recruitingComposite3yr: 0.92,
    returningProductionPct: 0.54,
    coachTenureYears: 3,
    coachCareerWinPct: 0.70,
  },

  // ── Big 12 ──────────────────────────────────────────────────────────────
  texas: {
    teamId: 'texas',
    teamName: 'Texas',
    conference: 'SEC',
    pointsScoredAvg: 34.8,
    pointsAllowedAvg: 16.2,
    yardsPerPlayOffense: 6.7,
    yardsPerPlayDefense: 4.5,
    thirdDownConvRate: 0.44,
    redZoneScoringPct: 0.90,
    turnoverMargin: 0.8,
    eloRating: 1730,
    strengthOfSchedule: 0.79,
    recruitingComposite3yr: 0.95,
    returningProductionPct: 0.61,
    coachTenureYears: 5,
    coachCareerWinPct: 0.77,
  },
  oklahoma: {
    teamId: 'oklahoma',
    teamName: 'Oklahoma',
    conference: 'SEC',
    pointsScoredAvg: 27.6,
    pointsAllowedAvg: 22.1,
    yardsPerPlayOffense: 5.7,
    yardsPerPlayDefense: 5.2,
    thirdDownConvRate: 0.37,
    redZoneScoringPct: 0.81,
    turnoverMargin: -0.1,
    eloRating: 1580,
    strengthOfSchedule: 0.74,
    recruitingComposite3yr: 0.91,
    returningProductionPct: 0.56,
    coachTenureYears: 2,
    coachCareerWinPct: 0.64,
  },
  utah: {
    teamId: 'utah',
    teamName: 'Utah',
    conference: 'Big 12',
    pointsScoredAvg: 28.3,
    pointsAllowedAvg: 19.8,
    yardsPerPlayOffense: 5.8,
    yardsPerPlayDefense: 4.9,
    thirdDownConvRate: 0.39,
    redZoneScoringPct: 0.83,
    turnoverMargin: 0.3,
    eloRating: 1590,
    strengthOfSchedule: 0.66,
    recruitingComposite3yr: 0.84,
    returningProductionPct: 0.59,
    coachTenureYears: 20,
    coachCareerWinPct: 0.72,
  },
  kansas_state: {
    teamId: 'kansas_state',
    teamName: 'Kansas State',
    conference: 'Big 12',
    pointsScoredAvg: 31.7,
    pointsAllowedAvg: 20.4,
    yardsPerPlayOffense: 6.1,
    yardsPerPlayDefense: 5.0,
    thirdDownConvRate: 0.41,
    redZoneScoringPct: 0.85,
    turnoverMargin: 0.4,
    eloRating: 1610,
    strengthOfSchedule: 0.65,
    recruitingComposite3yr: 0.82,
    returningProductionPct: 0.67,
    coachTenureYears: 6,
    coachCareerWinPct: 0.69,
  },
  arizona: {
    teamId: 'arizona',
    teamName: 'Arizona',
    conference: 'Big 12',
    pointsScoredAvg: 30.2,
    pointsAllowedAvg: 23.5,
    yardsPerPlayOffense: 6.0,
    yardsPerPlayDefense: 5.3,
    thirdDownConvRate: 0.40,
    redZoneScoringPct: 0.83,
    turnoverMargin: 0.0,
    eloRating: 1560,
    strengthOfSchedule: 0.64,
    recruitingComposite3yr: 0.81,
    returningProductionPct: 0.55,
    coachTenureYears: 3,
    coachCareerWinPct: 0.63,
  },

  // ── ACC ──────────────────────────────────────────────────────────────────
  clemson: {
    teamId: 'clemson',
    teamName: 'Clemson',
    conference: 'ACC',
    pointsScoredAvg: 31.9,
    pointsAllowedAvg: 18.7,
    yardsPerPlayOffense: 6.3,
    yardsPerPlayDefense: 4.7,
    thirdDownConvRate: 0.41,
    redZoneScoringPct: 0.86,
    turnoverMargin: 0.5,
    eloRating: 1640,
    strengthOfSchedule: 0.62,
    recruitingComposite3yr: 0.91,
    returningProductionPct: 0.65,
    coachTenureYears: 13,
    coachCareerWinPct: 0.78,
  },
  florida_state: {
    teamId: 'florida_state',
    teamName: 'Florida State',
    conference: 'ACC',
    pointsScoredAvg: 24.1,
    pointsAllowedAvg: 26.3,
    yardsPerPlayOffense: 5.3,
    yardsPerPlayDefense: 5.6,
    thirdDownConvRate: 0.34,
    redZoneScoringPct: 0.78,
    turnoverMargin: -0.6,
    eloRating: 1480,
    strengthOfSchedule: 0.61,
    recruitingComposite3yr: 0.88,
    returningProductionPct: 0.50,
    coachTenureYears: 5,
    coachCareerWinPct: 0.59,
  },
  miami: {
    teamId: 'miami',
    teamName: 'Miami',
    conference: 'ACC',
    pointsScoredAvg: 36.8,
    pointsAllowedAvg: 21.2,
    yardsPerPlayOffense: 6.8,
    yardsPerPlayDefense: 5.1,
    thirdDownConvRate: 0.45,
    redZoneScoringPct: 0.89,
    turnoverMargin: 0.4,
    eloRating: 1650,
    strengthOfSchedule: 0.60,
    recruitingComposite3yr: 0.88,
    returningProductionPct: 0.58,
    coachTenureYears: 3,
    coachCareerWinPct: 0.67,
  },
  north_carolina: {
    teamId: 'north_carolina',
    teamName: 'North Carolina',
    conference: 'ACC',
    pointsScoredAvg: 27.4,
    pointsAllowedAvg: 24.8,
    yardsPerPlayOffense: 5.8,
    yardsPerPlayDefense: 5.4,
    thirdDownConvRate: 0.38,
    redZoneScoringPct: 0.82,
    turnoverMargin: -0.1,
    eloRating: 1530,
    strengthOfSchedule: 0.59,
    recruitingComposite3yr: 0.85,
    returningProductionPct: 0.53,
    coachTenureYears: 2,
    coachCareerWinPct: 0.58,
  },

  // ── Group of 5 ──────────────────────────────────────────────────────────
  boise_state: {
    teamId: 'boise_state',
    teamName: 'Boise State',
    conference: 'Mountain West',
    pointsScoredAvg: 34.5,
    pointsAllowedAvg: 18.9,
    yardsPerPlayOffense: 6.5,
    yardsPerPlayDefense: 4.8,
    thirdDownConvRate: 0.43,
    redZoneScoringPct: 0.88,
    turnoverMargin: 0.6,
    eloRating: 1620,
    strengthOfSchedule: 0.52,
    recruitingComposite3yr: 0.78,
    returningProductionPct: 0.70,
    coachTenureYears: 3,
    coachCareerWinPct: 0.73,
  },
  liberty: {
    teamId: 'liberty',
    teamName: 'Liberty',
    conference: 'Conference USA',
    pointsScoredAvg: 30.7,
    pointsAllowedAvg: 21.6,
    yardsPerPlayOffense: 6.0,
    yardsPerPlayDefense: 5.1,
    thirdDownConvRate: 0.40,
    redZoneScoringPct: 0.84,
    turnoverMargin: 0.3,
    eloRating: 1530,
    strengthOfSchedule: 0.44,
    recruitingComposite3yr: 0.76,
    returningProductionPct: 0.62,
    coachTenureYears: 2,
    coachCareerWinPct: 0.66,
  },
  memphis: {
    teamId: 'memphis',
    teamName: 'Memphis',
    conference: 'American',
    pointsScoredAvg: 32.4,
    pointsAllowedAvg: 25.1,
    yardsPerPlayOffense: 6.3,
    yardsPerPlayDefense: 5.5,
    thirdDownConvRate: 0.42,
    redZoneScoringPct: 0.85,
    turnoverMargin: 0.1,
    eloRating: 1540,
    strengthOfSchedule: 0.50,
    recruitingComposite3yr: 0.77,
    returningProductionPct: 0.64,
    coachTenureYears: 4,
    coachCareerWinPct: 0.64,
  },
  tulane: {
    teamId: 'tulane',
    teamName: 'Tulane',
    conference: 'American',
    pointsScoredAvg: 31.2,
    pointsAllowedAvg: 22.3,
    yardsPerPlayOffense: 6.1,
    yardsPerPlayDefense: 5.2,
    thirdDownConvRate: 0.41,
    redZoneScoringPct: 0.84,
    turnoverMargin: 0.2,
    eloRating: 1550,
    strengthOfSchedule: 0.49,
    recruitingComposite3yr: 0.75,
    returningProductionPct: 0.66,
    coachTenureYears: 6,
    coachCareerWinPct: 0.67,
  },
  james_madison: {
    teamId: 'james_madison',
    teamName: 'James Madison',
    conference: 'Sun Belt',
    pointsScoredAvg: 33.8,
    pointsAllowedAvg: 19.4,
    yardsPerPlayOffense: 6.4,
    yardsPerPlayDefense: 4.9,
    thirdDownConvRate: 0.43,
    redZoneScoringPct: 0.87,
    turnoverMargin: 0.5,
    eloRating: 1560,
    strengthOfSchedule: 0.46,
    recruitingComposite3yr: 0.73,
    returningProductionPct: 0.68,
    coachTenureYears: 3,
    coachCareerWinPct: 0.75,
  },
};

// ---------------------------------------------------------------------------
// Cache-Backed Team Features
// ---------------------------------------------------------------------------

let _cachedTeamFeatures: Record<string, TeamFeatures> | null = null;

/**
 * Load team features from the cache, deriving TeamFeatures from real stats.
 * Falls back to MOCK_TEAM_FEATURES for any team not in the cache.
 */
export async function loadTeamFeaturesFromCache(): Promise<Record<string, TeamFeatures>> {
  if (_cachedTeamFeatures) return _cachedTeamFeatures;

  try {
    const teams = await getAllTeams();
    if (!teams || teams.length === 0) {
      _cachedTeamFeatures = MOCK_TEAM_FEATURES;
      return _cachedTeamFeatures;
    }

    const features: Record<string, TeamFeatures> = { ...MOCK_TEAM_FEATURES };

    for (const team of teams) {
      const teamId = team.school.toLowerCase().replace(/\s+/g, '_');
      // Skip if we already have hardcoded data (it has more detail)
      if (features[teamId]) continue;

      try {
        const stats = await getTeamStats(team.school);
        if (!stats) continue;

        const games = stats.gamesPlayed ?? 12;
        const ptsFor = (stats.pointsFor ?? 350) / games;
        const ptsAgainst = (stats.pointsAgainst ?? 250) / games;
        const totalOff = stats.totalYards ? stats.totalYards / games : ptsFor * 9;
        const totalDef = stats.pointsAgainst ? (stats.pointsAgainst * 10) / games : ptsAgainst * 10;
        const plays = games * 70;
        const ypp = totalOff / (plays / games);

        features[teamId] = {
          teamId,
          teamName: team.school,
          conference: team.conference ?? '',
          pointsScoredAvg: Math.round(ptsFor * 10) / 10,
          pointsAllowedAvg: Math.round(ptsAgainst * 10) / 10,
          yardsPerPlayOffense: Math.round(ypp * 10) / 10,
          yardsPerPlayDefense: Math.round((totalDef / 70) * 10) / 10,
          thirdDownConvRate: stats.thirdDownConvPct ?? 0.40,
          redZoneScoringPct: stats.redZonePct ?? 0.84,
          turnoverMargin: (stats.turnoversGained ?? 0) - (stats.turnoversLost ?? 0),
          eloRating: 1500 + Math.round((ptsFor - ptsAgainst) * 8),
          strengthOfSchedule: (['SEC', 'Big Ten', 'Big 12', 'ACC'].includes(team.conference ?? ''))
            ? 0.70 : 0.55,
          recruitingComposite3yr: 0.80,
          returningProductionPct: 0.55,
          coachTenureYears: 3,
          coachCareerWinPct: 0.60,
        };
      } catch {
        // skip this team
      }
    }

    _cachedTeamFeatures = features;
    return _cachedTeamFeatures;
  } catch {
    _cachedTeamFeatures = MOCK_TEAM_FEATURES;
    return _cachedTeamFeatures;
  }
}

/**
 * Get team features for a given teamId, checking cached data first, then mock.
 */
function getTeamFeatures(teamId: string): TeamFeatures | undefined {
  // Check cache first (if loaded), then fall back to mock
  if (_cachedTeamFeatures && _cachedTeamFeatures[teamId]) {
    return _cachedTeamFeatures[teamId];
  }
  return MOCK_TEAM_FEATURES[teamId];
}

// ---------------------------------------------------------------------------
// Rivalry pairs
// ---------------------------------------------------------------------------

export const RIVALRY_PAIRS: Set<string> = new Set([
  'alabama|auburn',
  'alabama|tennessee',
  'alabama|lsu',
  'florida|georgia',
  'auburn|georgia',
  'michigan|ohio_state',
  'ohio_state|penn_state',
  'oklahoma|texas',
  'texas|texas_am',
  'ucla|usc',
  'notre_dame|usc',
  'oregon|oregon_state',
  'oregon|washington',
  'clemson|florida_state',
  'clemson|south_carolina',
  'florida_state|miami',
  'duke|north_carolina',
  'nc_state|north_carolina',
  'kansas|kansas_state',
  'utah|byu',
  'boise_state|fresno_state',
  'memphis|tulane',
]);

// ---------------------------------------------------------------------------
// Feature weights for the spread prediction model
// ---------------------------------------------------------------------------

const SPREAD_WEIGHTS = {
  eloDiff: 0.40,
  scoringDiff: 0.20,
  recruitingGap: 0.15,
  homeField: 0.10,
  turnoverMargin: 0.08,
  coachWinPct: 0.07,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clamp a number between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Build a canonical rivalry key for two team IDs (alphabetical order). */
function rivalryKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// ---------------------------------------------------------------------------
// 1. buildMatchupFeatures
// ---------------------------------------------------------------------------

export interface BuildMatchupOptions {
  homeFieldAdvantage?: number;
  restAdvantage?: number;
}

export function buildMatchupFeatures(
  homeTeamId: string,
  awayTeamId: string,
  gameId: string,
  options?: BuildMatchupOptions,
): MatchupFeatures {
  const homeTeam = getTeamFeatures(homeTeamId);
  const awayTeam = getTeamFeatures(awayTeamId);

  if (!homeTeam) {
    throw new Error(`Unknown home team: ${homeTeamId}`);
  }
  if (!awayTeam) {
    throw new Error(`Unknown away team: ${awayTeamId}`);
  }

  const homeFieldAdvantage = options?.homeFieldAdvantage ?? 3.0;
  const restAdvantage = options?.restAdvantage ?? 0;

  return {
    gameId,
    homeTeam,
    awayTeam,
    eloDiff: homeTeam.eloRating - awayTeam.eloRating,
    recruitingDiff: homeTeam.recruitingComposite3yr - awayTeam.recruitingComposite3yr,
    restAdvantage,
    isConferenceGame: homeTeam.conference === awayTeam.conference,
    isRivalryGame: RIVALRY_PAIRS.has(rivalryKey(homeTeamId, awayTeamId)),
    homeFieldAdvantage,
  };
}

// ---------------------------------------------------------------------------
// 2. predictSpread
// ---------------------------------------------------------------------------

export function predictSpread(
  matchup: MatchupFeatures,
): { value: number; favored: string; confidence: number } {
  const { homeTeam, awayTeam } = matchup;

  // --- Individual feature contributions (positive = favors home) ---

  // Elo difference: scale so that a 100-point Elo gap ~ 7 points of spread
  const eloComponent = (matchup.eloDiff / 100) * 7;

  // Scoring differential: (home offensive avg - away defensive avg) minus
  //   (away offensive avg - home defensive avg)
  const homeScoringEdge =
    homeTeam.pointsScoredAvg -
    awayTeam.pointsAllowedAvg -
    (awayTeam.pointsScoredAvg - homeTeam.pointsAllowedAvg);
  const scoringComponent = homeScoringEdge * 0.5;

  // Recruiting composite gap scaled to points (0.10 gap ~ 7 points)
  const recruitingComponent = (matchup.recruitingDiff / 0.10) * 7;

  // Home field advantage is a flat bonus
  const homeFieldComponent = matchup.homeFieldAdvantage;

  // Turnover margin difference scaled (1.0 margin diff ~ 4 points)
  const turnoverComponent =
    (homeTeam.turnoverMargin - awayTeam.turnoverMargin) * 4;

  // Coach career win pct gap (0.10 gap ~ 3 points)
  const coachComponent =
    ((homeTeam.coachCareerWinPct - awayTeam.coachCareerWinPct) / 0.10) * 3;

  // --- Weighted sum ---
  const rawSpread =
    SPREAD_WEIGHTS.eloDiff * eloComponent +
    SPREAD_WEIGHTS.scoringDiff * scoringComponent +
    SPREAD_WEIGHTS.recruitingGap * recruitingComponent +
    SPREAD_WEIGHTS.homeField * homeFieldComponent +
    SPREAD_WEIGHTS.turnoverMargin * turnoverComponent +
    SPREAD_WEIGHTS.coachWinPct * coachComponent;

  // Clamp to realistic spread range and round to half-point
  const clampedSpread = clamp(rawSpread, -35, 35);
  const spread = Math.round(clampedSpread * 2) / 2;

  // Confidence: larger absolute spread => more confident
  const absSpread = Math.abs(spread);
  const confidence = clamp(0.50 + absSpread * 0.015, 0.50, 0.95);

  const favored =
    spread >= 0 ? homeTeam.teamName : awayTeam.teamName;

  return {
    value: Math.abs(spread),
    favored,
    confidence: parseFloat(confidence.toFixed(3)),
  };
}

// ---------------------------------------------------------------------------
// 3. predictTotal
// ---------------------------------------------------------------------------

export function predictTotal(
  matchup: MatchupFeatures,
): { value: number; confidence: number } {
  const { homeTeam, awayTeam } = matchup;

  // Estimate each team's expected points using the opponent's defensive profile
  const homeExpected =
    (homeTeam.pointsScoredAvg + awayTeam.pointsAllowedAvg) / 2;
  const awayExpected =
    (awayTeam.pointsScoredAvg + homeTeam.pointsAllowedAvg) / 2;

  let rawTotal = homeExpected + awayExpected;

  // Pace adjustment: high yards-per-play offenses push totals up
  const combinedYPP =
    homeTeam.yardsPerPlayOffense + awayTeam.yardsPerPlayOffense;
  // Average combined YPP is roughly 12.0; adjust +/- 3 pts per full point above/below
  rawTotal += (combinedYPP - 12.0) * 3;

  // Conference norms: SEC and Big Ten games trend slightly lower; Big 12 slightly higher
  const conferences = [homeTeam.conference, awayTeam.conference];
  if (conferences.includes('Big 12')) {
    rawTotal += 1.5;
  }
  if (
    conferences.every(
      (c) => c === 'SEC' || c === 'Big Ten',
    )
  ) {
    rawTotal -= 1.5;
  }

  // Round to nearest 0.5
  const total = Math.round(rawTotal * 2) / 2;

  // Confidence is higher when both teams' scoring profiles are consistent
  const scoringVariance =
    Math.abs(homeTeam.pointsScoredAvg - awayTeam.pointsScoredAvg);
  const confidence = clamp(0.55 + (30 - scoringVariance) * 0.01, 0.45, 0.90);

  return {
    value: clamp(total, 28, 80),
    confidence: parseFloat(confidence.toFixed(3)),
  };
}

// ---------------------------------------------------------------------------
// 4. predictUpset
// ---------------------------------------------------------------------------

export function predictUpset(
  matchup: MatchupFeatures,
  predictedSpread: number,
): { probability: number; isAlert: boolean } {
  // Base upset probability from spread: tighter spread = higher chance
  let probability = 0;

  if (predictedSpread <= 1) {
    // Near pick'em — not really an "upset"
    probability = 0.45;
  } else if (predictedSpread <= 3.5) {
    probability = 0.38;
  } else if (predictedSpread <= 7) {
    probability = 0.28;
  } else if (predictedSpread <= 14) {
    probability = 0.18;
  } else if (predictedSpread <= 21) {
    probability = 0.08;
  } else {
    probability = 0.03;
  }

  // Boost if close Elo but large recruiting gap (underdog develops talent better)
  const absEloDiff = Math.abs(matchup.eloDiff);
  const absRecruitingDiff = Math.abs(matchup.recruitingDiff);
  if (absEloDiff < 60 && absRecruitingDiff > 0.06) {
    probability += 0.06;
  }

  // Rivalry games are more volatile
  if (matchup.isRivalryGame) {
    probability += 0.08;
  }

  // Conference games are tighter
  if (matchup.isConferenceGame) {
    probability += 0.04;
  }

  // Away team with better returning production (experience advantage)
  if (
    matchup.awayTeam.returningProductionPct >
    matchup.homeTeam.returningProductionPct + 0.05
  ) {
    probability += 0.03;
  }

  probability = clamp(probability, 0.01, 0.65);

  return {
    probability: parseFloat(probability.toFixed(3)),
    isAlert: probability > 0.35,
  };
}

// ---------------------------------------------------------------------------
// 5. generateTopFactors
// ---------------------------------------------------------------------------

export function generateTopFactors(
  matchup: MatchupFeatures,
  predictedSpread: number,
): PredictionFactor[] {
  const { homeTeam, awayTeam } = matchup;

  const factors: PredictionFactor[] = [];

  // Elo rating gap
  const eloDiff = matchup.eloDiff;
  factors.push({
    name: 'Elo Rating Gap',
    weight: Math.abs(eloDiff) / 200,
    direction: eloDiff > 0 ? 'favors_home' : eloDiff < 0 ? 'favors_away' : 'neutral',
    description:
      eloDiff >= 0
        ? `${homeTeam.teamName} holds a ${eloDiff}-point Elo advantage (${homeTeam.eloRating} vs ${awayTeam.eloRating})`
        : `${awayTeam.teamName} holds a ${Math.abs(eloDiff)}-point Elo advantage (${awayTeam.eloRating} vs ${homeTeam.eloRating})`,
  });

  // Scoring efficiency
  const homeNetScoring =
    homeTeam.pointsScoredAvg - homeTeam.pointsAllowedAvg;
  const awayNetScoring =
    awayTeam.pointsScoredAvg - awayTeam.pointsAllowedAvg;
  const scoringEdge = homeNetScoring - awayNetScoring;
  factors.push({
    name: 'Scoring Efficiency',
    weight: Math.abs(scoringEdge) / 20,
    direction: scoringEdge > 0 ? 'favors_home' : scoringEdge < 0 ? 'favors_away' : 'neutral',
    description:
      scoringEdge >= 0
        ? `${homeTeam.teamName} has a +${homeNetScoring.toFixed(1)} scoring margin vs ${awayTeam.teamName}'s +${awayNetScoring.toFixed(1)}`
        : `${awayTeam.teamName} has a +${awayNetScoring.toFixed(1)} scoring margin vs ${homeTeam.teamName}'s +${homeNetScoring.toFixed(1)}`,
  });

  // Recruiting talent gap
  const recruitDiff = matchup.recruitingDiff;
  factors.push({
    name: 'Recruiting Talent',
    weight: Math.abs(recruitDiff) * 8,
    direction: recruitDiff > 0 ? 'favors_home' : recruitDiff < 0 ? 'favors_away' : 'neutral',
    description:
      recruitDiff >= 0
        ? `${homeTeam.teamName}'s 3-year recruiting composite (${homeTeam.recruitingComposite3yr}) edges ${awayTeam.teamName} (${awayTeam.recruitingComposite3yr})`
        : `${awayTeam.teamName}'s 3-year recruiting composite (${awayTeam.recruitingComposite3yr}) edges ${homeTeam.teamName} (${homeTeam.recruitingComposite3yr})`,
  });

  // Home field advantage
  factors.push({
    name: 'Home Field Advantage',
    weight: matchup.homeFieldAdvantage / 5,
    direction: 'favors_home',
    description: `${homeTeam.teamName} benefits from a ${matchup.homeFieldAdvantage.toFixed(1)}-point home field edge`,
  });

  // Turnover margin
  const turnoverDiff =
    homeTeam.turnoverMargin - awayTeam.turnoverMargin;
  factors.push({
    name: 'Turnover Margin',
    weight: Math.abs(turnoverDiff) * 0.6,
    direction: turnoverDiff > 0 ? 'favors_home' : turnoverDiff < 0 ? 'favors_away' : 'neutral',
    description:
      turnoverDiff >= 0
        ? `${homeTeam.teamName} averages ${homeTeam.turnoverMargin > 0 ? '+' : ''}${homeTeam.turnoverMargin.toFixed(1)} turnovers/game vs ${awayTeam.teamName}'s ${awayTeam.turnoverMargin > 0 ? '+' : ''}${awayTeam.turnoverMargin.toFixed(1)}`
        : `${awayTeam.teamName} averages ${awayTeam.turnoverMargin > 0 ? '+' : ''}${awayTeam.turnoverMargin.toFixed(1)} turnovers/game vs ${homeTeam.teamName}'s ${homeTeam.turnoverMargin > 0 ? '+' : ''}${homeTeam.turnoverMargin.toFixed(1)}`,
  });

  // Coaching edge
  const coachDiff =
    homeTeam.coachCareerWinPct - awayTeam.coachCareerWinPct;
  factors.push({
    name: 'Coaching Edge',
    weight: Math.abs(coachDiff) * 4,
    direction: coachDiff > 0 ? 'favors_home' : coachDiff < 0 ? 'favors_away' : 'neutral',
    description:
      coachDiff >= 0
        ? `${homeTeam.teamName}'s coach has a ${(homeTeam.coachCareerWinPct * 100).toFixed(0)}% career win rate (${homeTeam.coachTenureYears}yr tenure) vs ${(awayTeam.coachCareerWinPct * 100).toFixed(0)}%`
        : `${awayTeam.teamName}'s coach has a ${(awayTeam.coachCareerWinPct * 100).toFixed(0)}% career win rate (${awayTeam.coachTenureYears}yr tenure) vs ${(homeTeam.coachCareerWinPct * 100).toFixed(0)}%`,
  });

  // Rivalry / conference context
  if (matchup.isRivalryGame) {
    factors.push({
      name: 'Rivalry Game',
      weight: 0.7,
      direction: 'neutral',
      description: `This is a rivalry matchup — expect heightened intensity and increased upset potential`,
    });
  }

  if (matchup.isConferenceGame) {
    factors.push({
      name: 'Conference Game',
      weight: 0.3,
      direction: 'neutral',
      description: `Conference opponents have more film and familiarity, tightening the spread`,
    });
  }

  // Returning production edge
  const retProdDiff =
    homeTeam.returningProductionPct - awayTeam.returningProductionPct;
  if (Math.abs(retProdDiff) > 0.05) {
    const favored = retProdDiff > 0 ? homeTeam : awayTeam;
    factors.push({
      name: 'Returning Production',
      weight: Math.abs(retProdDiff) * 3,
      direction: retProdDiff > 0 ? 'favors_home' : 'favors_away',
      description: `${favored.teamName} returns ${(favored.returningProductionPct * 100).toFixed(0)}% of last year's production — experience matters early in the season`,
    });
  }

  // Sort by weight descending and return top 5
  factors.sort((a, b) => b.weight - a.weight);
  return factors.slice(0, 5);
}

// ---------------------------------------------------------------------------
// 6. generateGamePrediction
// ---------------------------------------------------------------------------

export function generateGamePrediction(
  homeTeamId: string,
  awayTeamId: string,
  gameId: string,
): GamePrediction {
  const matchup = buildMatchupFeatures(homeTeamId, awayTeamId, gameId);
  const spread = predictSpread(matchup);
  const total = predictTotal(matchup);
  const upset = predictUpset(matchup, spread.value);
  const topFactors = generateTopFactors(matchup, spread.value);

  return {
    gameId,
    homeTeam: matchup.homeTeam.teamName,
    awayTeam: matchup.awayTeam.teamName,
    predictions: {
      spread,
      total,
      upset,
    },
    topFactors,
    modelVersion: MODEL_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 7. generateWeekPredictions
// ---------------------------------------------------------------------------

export function generateWeekPredictions(
  games: Array<{ homeTeamId: string; awayTeamId: string; gameId: string }>,
): GamePrediction[] {
  return games.map((game) =>
    generateGamePrediction(game.homeTeamId, game.awayTeamId, game.gameId),
  );
}
