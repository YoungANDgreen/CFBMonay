// ============================================================
// GridIron IQ — Stat Line Sleuth Game Engine
// ============================================================
// Given a player's game stat line, guess who it is.
// Progressive hints revealed over time. Fewer hints = more points.

import type {
  StatLineSleuthRound,
  SleuthHint,
  StatLineSleuthGameState,
} from '@/types';

import {
  getTopPlayersByStat,
  getAllTeams,
} from '../data/cfbd-cache';
import type { CachedPlayerSeasonStats } from '../data/cfbd-cache';

// --- Mock Data: Iconic College Football Game Performances ---

const SLEUTH_ROUNDS: StatLineSleuthRound[] = [
  {
    playerId: 'burrow-2019-bama',
    statLine: {
      completions: 31,
      attempts: 39,
      passingYards: 393,
      passingTDs: 3,
      interceptions: 0,
    },
    hints: [
      { level: 1, text: 'SEC Quarterback', revealedAt: 0 },
      { level: 2, text: 'vs Alabama, 2019', revealedAt: 10 },
      { level: 3, text: 'LSU', revealedAt: 20 },
    ],
    answer: { playerName: 'Joe Burrow', year: 2019 },
  },
  {
    playerId: 'henry-2015-lsu',
    statLine: {
      carries: 38,
      rushingYards: 210,
      rushingTDs: 3,
      receptions: 1,
      receivingYards: 8,
    },
    hints: [
      { level: 1, text: 'SEC Running Back', revealedAt: 0 },
      { level: 2, text: 'vs LSU, 2015', revealedAt: 10 },
      { level: 3, text: 'Alabama', revealedAt: 20 },
    ],
    answer: { playerName: 'Derrick Henry', year: 2015 },
  },
  {
    playerId: 'jackson-2016-syracuse',
    statLine: {
      passingYards: 411,
      rushingYards: 199,
      passingTDs: 0,
      rushingTDs: 4,
      completions: 20,
      attempts: 34,
    },
    hints: [
      { level: 1, text: 'ACC Quarterback', revealedAt: 0 },
      { level: 2, text: 'vs Syracuse, 2016', revealedAt: 10 },
      { level: 3, text: 'Louisville', revealedAt: 20 },
    ],
    answer: { playerName: 'Lamar Jackson', year: 2016 },
  },
  {
    playerId: 'smith-2020-cfp',
    statLine: {
      receptions: 12,
      receivingYards: 215,
      receivingTDs: 3,
      targets: 15,
    },
    hints: [
      { level: 1, text: 'SEC Wide Receiver', revealedAt: 0 },
      { level: 2, text: 'CFP Championship, 2020', revealedAt: 10 },
      { level: 3, text: 'Alabama', revealedAt: 20 },
    ],
    answer: { playerName: 'DeVonta Smith', year: 2020 },
  },
  {
    playerId: 'newton-2010-sec',
    statLine: {
      passingYards: 265,
      rushingYards: 188,
      passingTDs: 2,
      rushingTDs: 3,
      totalTDs: 5,
    },
    hints: [
      { level: 1, text: 'SEC Quarterback', revealedAt: 0 },
      { level: 2, text: 'SEC Championship, 2010', revealedAt: 10 },
      { level: 3, text: 'Auburn', revealedAt: 20 },
    ],
    answer: { playerName: 'Cam Newton', year: 2010 },
  },
  {
    playerId: 'manziel-2012-bama',
    statLine: {
      passingYards: 253,
      rushingYards: 92,
      passingTDs: 2,
      rushingTDs: 2,
      totalTDs: 4,
    },
    hints: [
      { level: 1, text: 'SEC Quarterback', revealedAt: 0 },
      { level: 2, text: 'vs Alabama, 2012', revealedAt: 10 },
      { level: 3, text: 'Texas A&M', revealedAt: 20 },
    ],
    answer: { playerName: 'Johnny Manziel', year: 2012 },
  },
  {
    playerId: 'young-2005-rose',
    statLine: {
      passingYards: 267,
      rushingYards: 200,
      passingTDs: 0,
      rushingTDs: 3,
      completions: 30,
      attempts: 40,
    },
    hints: [
      { level: 1, text: 'Big 12 Quarterback', revealedAt: 0 },
      { level: 2, text: 'Rose Bowl, 2005', revealedAt: 10 },
      { level: 3, text: 'Texas', revealedAt: 20 },
    ],
    answer: { playerName: 'Vince Young', year: 2005 },
  },
  {
    playerId: 'bush-2005-fresno',
    statLine: {
      totalYards: 513,
      rushingYards: 294,
      receivingYards: 68,
      returnYards: 151,
      rushingTDs: 2,
      receivingTDs: 1,
    },
    hints: [
      { level: 1, text: 'Pac-12 Running Back', revealedAt: 0 },
      { level: 2, text: 'vs Fresno State, 2005', revealedAt: 10 },
      { level: 3, text: 'USC', revealedAt: 20 },
    ],
    answer: { playerName: 'Reggie Bush', year: 2005 },
  },
];

// --- Seeded RNG (same pattern as grid-engine.ts) ---

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

// --- Game Generation ---

export function generateSleuthGame(
  dateStr: string,
  roundCount: number = 5
): StatLineSleuthGameState {
  const rng = seededRandom(dateToSeed(dateStr));
  const shuffled = shuffleWithRng(SLEUTH_ROUNDS, rng);
  const selectedRounds = shuffled.slice(0, Math.min(roundCount, shuffled.length));

  return {
    rounds: selectedRounds,
    currentRound: 0,
    hintsRevealed: 1, // level 1 hint is revealed at start
    score: 0,
    results: selectedRounds.map(() => 'pending' as const),
    isComplete: false,
    startTime: Date.now(),
    roundStartTime: Date.now(),
  };
}

// --- Hint Reveal ---

export function revealNextHint(
  state: StatLineSleuthGameState
): StatLineSleuthGameState {
  if (state.isComplete) return state;
  if (state.hintsRevealed >= 3) return state;

  return {
    ...state,
    hintsRevealed: state.hintsRevealed + 1,
  };
}

// --- Guess Submission ---

function normalizePlayerName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function submitSleuthGuess(
  state: StatLineSleuthGameState,
  playerNameGuess: string
): StatLineSleuthGameState {
  if (state.isComplete) return state;

  const { currentRound, rounds, hintsRevealed, score, results } = state;
  if (currentRound >= rounds.length) return state;

  const round = rounds[currentRound];
  const isCorrect =
    normalizePlayerName(playerNameGuess) ===
    normalizePlayerName(round.answer.playerName);

  const pointsEarned = isCorrect ? (4 - hintsRevealed) * 10 : 0;

  const newResults = [...results];
  newResults[currentRound] = isCorrect ? 'correct' : 'incorrect';

  const nextRound = currentRound + 1;
  const isComplete = nextRound >= rounds.length;

  return {
    ...state,
    currentRound: nextRound,
    hintsRevealed: isComplete ? hintsRevealed : 1, // reset to level 1 for next round
    score: score + pointsEarned,
    results: newResults,
    isComplete,
    roundStartTime: isComplete ? state.roundStartTime : Date.now(),
  };
}

// --- Cache-Integrated Game Generation ---

function buildTeamConferenceMap(): Map<string, string> {
  const teams = getAllTeams();
  const map = new Map<string, string>();
  for (const t of teams) {
    map.set(t.school.toLowerCase(), t.conference);
  }
  return map;
}

function buildQBRound(
  stat: CachedPlayerSeasonStats,
  conference: string
): StatLineSleuthRound {
  return {
    playerId: `${stat.player}-${stat.season}`.toLowerCase().replace(/\s+/g, '-'),
    statLine: {
      completions: stat.completions!,
      attempts: stat.attempts!,
      passingYards: stat.passingYards!,
      passingTDs: stat.passingTDs!,
      interceptions: stat.interceptions ?? 0,
    },
    hints: [
      { level: 1, text: 'Quarterback', revealedAt: 0 },
      { level: 2, text: `${stat.season} Season — ${conference}`, revealedAt: 10 },
      { level: 3, text: stat.team, revealedAt: 20 },
    ],
    answer: { playerName: stat.player, year: stat.season },
  };
}

function buildRBRound(
  stat: CachedPlayerSeasonStats,
  conference: string
): StatLineSleuthRound {
  return {
    playerId: `${stat.player}-${stat.season}`.toLowerCase().replace(/\s+/g, '-'),
    statLine: {
      carries: stat.carries!,
      rushingYards: stat.rushingYards!,
      rushingTDs: stat.rushingTDs!,
    },
    hints: [
      { level: 1, text: 'Running Back', revealedAt: 0 },
      { level: 2, text: `${stat.season} Season — ${conference}`, revealedAt: 10 },
      { level: 3, text: stat.team, revealedAt: 20 },
    ],
    answer: { playerName: stat.player, year: stat.season },
  };
}

function buildWRRound(
  stat: CachedPlayerSeasonStats,
  conference: string
): StatLineSleuthRound {
  return {
    playerId: `${stat.player}-${stat.season}`.toLowerCase().replace(/\s+/g, '-'),
    statLine: {
      receptions: stat.receptions!,
      receivingYards: stat.receivingYards!,
      receivingTDs: stat.receivingTDs!,
    },
    hints: [
      { level: 1, text: 'Wide Receiver', revealedAt: 0 },
      { level: 2, text: `${stat.season} Season — ${conference}`, revealedAt: 10 },
      { level: 3, text: stat.team, revealedAt: 20 },
    ],
    answer: { playerName: stat.player, year: stat.season },
  };
}

export function generateSleuthGameWithCache(
  dateStr: string,
  roundCount: number = 5
): StatLineSleuthGameState {
  const conferenceMap = buildTeamConferenceMap();

  function lookupConference(team: string): string {
    return conferenceMap.get(team.toLowerCase()) || 'FBS';
  }

  // Pull top players from each category
  const topPassers = getTopPlayersByStat('passingYards', 30);
  const topRushers = getTopPlayersByStat('rushingYards', 30);
  const topReceivers = getTopPlayersByStat('receivingYards', 30);

  const rounds: StatLineSleuthRound[] = [];

  // Build QB rounds — require completions, attempts, passingYards, passingTDs; FBS only
  for (const s of topPassers) {
    if (
      conferenceMap.has(s.team.toLowerCase()) &&
      s.completions && s.completions > 0 &&
      s.attempts && s.attempts > 0 &&
      s.passingYards && s.passingYards > 0 &&
      s.passingTDs !== undefined && s.passingTDs !== null
    ) {
      rounds.push(buildQBRound(s, lookupConference(s.team)));
    }
  }

  // Build RB rounds — require carries, rushingYards, rushingTDs; FBS only
  for (const s of topRushers) {
    if (
      conferenceMap.has(s.team.toLowerCase()) &&
      s.carries && s.carries > 0 &&
      s.rushingYards && s.rushingYards > 0 &&
      s.rushingTDs !== undefined && s.rushingTDs !== null
    ) {
      rounds.push(buildRBRound(s, lookupConference(s.team)));
    }
  }

  // Build WR rounds — require receptions, receivingYards, receivingTDs; FBS only
  for (const s of topReceivers) {
    if (
      conferenceMap.has(s.team.toLowerCase()) &&
      s.receptions && s.receptions > 0 &&
      s.receivingYards && s.receivingYards > 0 &&
      s.receivingTDs !== undefined && s.receivingTDs !== null
    ) {
      rounds.push(buildWRRound(s, lookupConference(s.team)));
    }
  }

  // Fall back to hardcoded rounds if cache has insufficient data
  if (rounds.length < 10) {
    return generateSleuthGame(dateStr, roundCount);
  }

  // Deduplicate by playerId
  const seen = new Set<string>();
  const uniqueRounds = rounds.filter((r) => {
    if (seen.has(r.playerId)) return false;
    seen.add(r.playerId);
    return true;
  });

  const rng = seededRandom(dateToSeed(dateStr));
  const shuffled = shuffleWithRng(uniqueRounds, rng);
  const selectedRounds = shuffled.slice(0, Math.min(roundCount, shuffled.length));

  return {
    rounds: selectedRounds,
    currentRound: 0,
    hintsRevealed: 1,
    score: 0,
    results: selectedRounds.map(() => 'pending' as const),
    isComplete: false,
    startTime: Date.now(),
    roundStartTime: Date.now(),
  };
}
