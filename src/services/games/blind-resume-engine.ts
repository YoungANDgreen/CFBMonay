// ============================================================
// GridIron IQ — Blind Resume Game Engine
// ============================================================
// Players see anonymized team season stats and guess the team + year.
// Pure functions, no side effects, seeded RNG for deterministic daily games.

import type {
  BlindResumeRound,
  BlindResumeGameState,
} from '@/types';

import {
  getTeamStats,
  getTeamRecord,
  getAllTeams,
} from '@/services/data/cfbd-cache';

// --- Team Season Data ---
// Championship-caliber seasons with realistic stat averages

interface TeamSeason {
  teamId: string;
  team: string;
  year: number;
  wins: number;
  losses: number;
  pointsScored: number;
  pointsAllowed: number;
  totalOffenseYpg: number;
  totalDefenseYpg: number;
  strengthOfSchedule: number;
}

const TEAM_SEASONS: TeamSeason[] = [
  {
    teamId: 'alabama-2020',
    team: 'Alabama',
    year: 2020,
    wins: 13,
    losses: 0,
    pointsScored: 634,
    pointsAllowed: 227,
    totalOffenseYpg: 541.5,
    totalDefenseYpg: 317.2,
    strengthOfSchedule: 0.81,
  },
  {
    teamId: 'lsu-2019',
    team: 'LSU',
    year: 2019,
    wins: 15,
    losses: 0,
    pointsScored: 726,
    pointsAllowed: 236,
    totalOffenseYpg: 568.4,
    totalDefenseYpg: 324.5,
    strengthOfSchedule: 0.84,
  },
  {
    teamId: 'clemson-2018',
    team: 'Clemson',
    year: 2018,
    wins: 15,
    losses: 0,
    pointsScored: 683,
    pointsAllowed: 172,
    totalOffenseYpg: 527.2,
    totalDefenseYpg: 286.7,
    strengthOfSchedule: 0.68,
  },
  {
    teamId: 'ohio-state-2014',
    team: 'Ohio State',
    year: 2014,
    wins: 14,
    losses: 1,
    pointsScored: 607,
    pointsAllowed: 258,
    totalOffenseYpg: 485.6,
    totalDefenseYpg: 310.3,
    strengthOfSchedule: 0.76,
  },
  {
    teamId: 'georgia-2021',
    team: 'Georgia',
    year: 2021,
    wins: 14,
    losses: 1,
    pointsScored: 583,
    pointsAllowed: 175,
    totalOffenseYpg: 424.8,
    totalDefenseYpg: 256.3,
    strengthOfSchedule: 0.82,
  },
  {
    teamId: 'michigan-2023',
    team: 'Michigan',
    year: 2023,
    wins: 15,
    losses: 0,
    pointsScored: 508,
    pointsAllowed: 159,
    totalOffenseYpg: 392.5,
    totalDefenseYpg: 250.8,
    strengthOfSchedule: 0.79,
  },
  {
    teamId: 'florida-2008',
    team: 'Florida',
    year: 2008,
    wins: 13,
    losses: 1,
    pointsScored: 550,
    pointsAllowed: 205,
    totalOffenseYpg: 424.7,
    totalDefenseYpg: 279.4,
    strengthOfSchedule: 0.80,
  },
  {
    teamId: 'auburn-2010',
    team: 'Auburn',
    year: 2010,
    wins: 14,
    losses: 0,
    pointsScored: 581,
    pointsAllowed: 268,
    totalOffenseYpg: 499.9,
    totalDefenseYpg: 323.6,
    strengthOfSchedule: 0.78,
  },
  {
    teamId: 'tcu-2010',
    team: 'TCU',
    year: 2010,
    wins: 13,
    losses: 0,
    pointsScored: 466,
    pointsAllowed: 175,
    totalOffenseYpg: 396.4,
    totalDefenseYpg: 243.1,
    strengthOfSchedule: 0.55,
  },
  {
    teamId: 'ucf-2017',
    team: 'UCF',
    year: 2017,
    wins: 13,
    losses: 0,
    pointsScored: 553,
    pointsAllowed: 230,
    totalOffenseYpg: 530.5,
    totalDefenseYpg: 329.7,
    strengthOfSchedule: 0.49,
  },
  {
    teamId: 'oklahoma-2008',
    team: 'Oklahoma',
    year: 2008,
    wins: 12,
    losses: 2,
    pointsScored: 716,
    pointsAllowed: 286,
    totalOffenseYpg: 547.2,
    totalDefenseYpg: 316.8,
    strengthOfSchedule: 0.74,
  },
  {
    teamId: 'alabama-2011',
    team: 'Alabama',
    year: 2011,
    wins: 12,
    losses: 1,
    pointsScored: 378,
    pointsAllowed: 115,
    totalOffenseYpg: 389.8,
    totalDefenseYpg: 183.6,
    strengthOfSchedule: 0.83,
  },
];

// --- Seeded RNG ---

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (state >>> 0) / 0xFFFFFFFF;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function shuffleWithRng<T>(array: T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// --- Round Generation ---

function teamSeasonToRound(season: TeamSeason): BlindResumeRound {
  return {
    teamId: season.teamId,
    year: season.year,
    anonymizedStats: {
      wins: season.wins,
      losses: season.losses,
      pointsScored: season.pointsScored,
      pointsAllowed: season.pointsAllowed,
      totalOffenseYpg: season.totalOffenseYpg,
      totalDefenseYpg: season.totalDefenseYpg,
      strengthOfSchedule: season.strengthOfSchedule,
    },
    answer: {
      team: season.team,
      year: season.year,
    },
  };
}

// --- Game Generation ---

export function generateBlindResumeGame(
  dateStr: string,
  roundCount: number = 10
): BlindResumeGameState {
  const rng = seededRandom(dateToSeed(dateStr));
  const shuffled = shuffleWithRng(TEAM_SEASONS, rng);

  // If roundCount exceeds available seasons, cycle through shuffled data
  const rounds: BlindResumeRound[] = [];
  for (let i = 0; i < roundCount; i++) {
    rounds.push(teamSeasonToRound(shuffled[i % shuffled.length]));
  }

  const guessesPerRound = 3;

  return {
    rounds,
    currentRound: 0,
    guessesPerRound,
    guessesUsed: 0,
    score: 0,
    results: Array.from({ length: roundCount }, () => 'pending' as const),
    isComplete: false,
    startTime: Date.now(),
  };
}

// --- Guess Submission ---

export function submitBlindResumeGuess(
  state: BlindResumeGameState,
  teamGuess: string,
  yearGuess: number
): BlindResumeGameState {
  if (state.isComplete) return state;
  if (state.currentRound >= state.rounds.length) return state;

  const round = state.rounds[state.currentRound];
  const newGuessesUsed = state.guessesUsed + 1;

  const isCorrect =
    round.answer.team.toLowerCase() === teamGuess.toLowerCase() &&
    round.answer.year === yearGuess;

  if (isCorrect) {
    // Fewer guesses used = more points: (guessesPerRound - guessesUsed) * 10
    // guessesUsed is pre-increment count (0-indexed), so use newGuessesUsed - 1
    const pointsEarned = (state.guessesPerRound - (newGuessesUsed - 1)) * 10;

    const newResults = [...state.results];
    newResults[state.currentRound] = 'correct';

    const nextRound = state.currentRound + 1;
    const isComplete = nextRound >= state.rounds.length;

    return {
      ...state,
      guessesUsed: 0,
      score: state.score + pointsEarned,
      results: newResults,
      currentRound: nextRound,
      isComplete,
    };
  }

  // Incorrect guess
  const allGuessesUsed = newGuessesUsed >= state.guessesPerRound;

  if (allGuessesUsed) {
    // Out of guesses for this round — mark incorrect and advance
    const newResults = [...state.results];
    newResults[state.currentRound] = 'incorrect';

    const nextRound = state.currentRound + 1;
    const isComplete = nextRound >= state.rounds.length;

    return {
      ...state,
      guessesUsed: 0,
      results: newResults,
      currentRound: nextRound,
      isComplete,
    };
  }

  // Still have guesses remaining in this round
  return {
    ...state,
    guessesUsed: newGuessesUsed,
  };
}

// --- Cache-Backed Team Seasons ---

let _cachedTeamSeasons: TeamSeason[] | null = null;

/**
 * Load team season data from the cache to augment the hardcoded TEAM_SEASONS.
 * Builds TeamSeason objects from real team records and stats.
 * Falls back to hardcoded data if cache is empty.
 */
async function loadTeamSeasonsFromCache(): Promise<TeamSeason[]> {
  if (_cachedTeamSeasons !== null) return _cachedTeamSeasons;

  try {
    const teams = await getAllTeams();
    if (!teams || teams.length === 0) {
      _cachedTeamSeasons = TEAM_SEASONS;
      return _cachedTeamSeasons;
    }

    const seasons: TeamSeason[] = [];

    for (const team of teams) {
      try {
        const [record, stats] = await Promise.all([
          getTeamRecord(team.school),
          getTeamStats(team.school),
        ]);

        if (record && record.totalWins + record.totalLosses >= 8) {
          const totalGames = record.totalWins + record.totalLosses;

          // Extract stats if available, estimate otherwise
          const pointsScored = stats?.pointsFor ??
            Math.round((record.totalWins / totalGames) * 35 * totalGames);
          const pointsAllowed = stats?.pointsAgainst ??
            Math.round(((totalGames - record.totalWins) / totalGames) * 28 * totalGames);

          const offYpg = stats?.totalYards
            ? stats.totalYards / totalGames
            : 350 + (record.totalWins / totalGames) * 200;
          const defYpg = stats?.pointsAgainst
            ? (stats.pointsAgainst * 10) / totalGames
            : 400 - (record.totalWins / totalGames) * 150;

          const sos = record.conference
            ? (['SEC', 'Big Ten', 'Big 12', 'ACC'].includes(record.conference) ? 0.70 + Math.random() * 0.15 : 0.45 + Math.random() * 0.2)
            : 0.60;

          seasons.push({
            teamId: `${team.school.toLowerCase().replace(/\s+/g, '-')}-${record.season}`,
            team: team.school,
            year: record.season,
            wins: record.totalWins,
            losses: record.totalLosses,
            pointsScored: typeof pointsScored === 'number' ? pointsScored : 400,
            pointsAllowed: typeof pointsAllowed === 'number' ? pointsAllowed : 250,
            totalOffenseYpg: Math.round(offYpg * 10) / 10,
            totalDefenseYpg: Math.round(defYpg * 10) / 10,
            strengthOfSchedule: Math.round(sos * 100) / 100,
          });
        }
      } catch {
        // skip this team on error
      }
    }

    // Only replace if we got a meaningful number of seasons
    if (seasons.length >= 10) {
      _cachedTeamSeasons = seasons;
    } else {
      // Merge: cached seasons first, then hardcoded as supplement
      _cachedTeamSeasons = [...seasons, ...TEAM_SEASONS];
    }

    return _cachedTeamSeasons;
  } catch {
    _cachedTeamSeasons = TEAM_SEASONS;
    return _cachedTeamSeasons;
  }
}

/**
 * Generate a blind resume game using real cached team data.
 * Falls back to hardcoded data if cache is unavailable.
 */
export async function generateBlindResumeGameWithCache(
  dateStr: string,
  roundCount: number = 10,
): Promise<BlindResumeGameState> {
  const teamSeasons = await loadTeamSeasonsFromCache();

  const rng = seededRandom(dateToSeed(dateStr));
  const shuffled = shuffleWithRng(teamSeasons, rng);

  const rounds: BlindResumeRound[] = [];
  for (let i = 0; i < roundCount; i++) {
    rounds.push(teamSeasonToRound(shuffled[i % shuffled.length]));
  }

  const guessesPerRound = 3;

  return {
    rounds,
    currentRound: 0,
    guessesPerRound,
    guessesUsed: 0,
    score: 0,
    results: Array.from({ length: roundCount }, () => 'pending' as const),
    isComplete: false,
    startTime: Date.now(),
  };
}
