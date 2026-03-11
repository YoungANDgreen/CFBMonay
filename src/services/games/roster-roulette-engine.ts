// ============================================================
// GridIron IQ — Roster Roulette Game Engine
// ============================================================
// Name as many players from a team's roster as possible in 60 seconds.
// Seeded RNG ensures the same school/year is selected for all users on a given day.

import type { RosterRouletteGameState } from '@/types';
import { getAllTeams, getPlayersByTeam } from '../data/cfbd-cache';

// --- Seeded RNG (same pattern as grid-engine) ---

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

// --- Difficulty Settings ---

const DIFFICULTY_TIME_MS: Record<RosterRouletteGameState['difficulty'], number> = {
  easy: 60_000,
  medium: 60_000,
  hard: 45_000,
};

// --- Mock Roster Data ---
// All player names stored lowercase for case-insensitive matching.

interface TeamRoster {
  school: string;
  year: number;
  players: string[];
}

const TEAM_ROSTERS: TeamRoster[] = [
  {
    school: 'Alabama',
    year: 2020,
    players: [
      'mac jones',
      'najee harris',
      'devonta smith',
      'jaylen waddle',
      'patrick surtain ii',
      'alex leatherwood',
      'landon dickerson',
      'dylan moses',
      'christian barmore',
      'brian robinson jr',
      'john metchie iii',
      'malachi moore',
      'phidarian mathis',
      'deonte brown',
      'evan neal',
      'thomas fletcher',
      'christopher allen',
      'josh jobe',
      'slade bolden',
      'jahleel billingsley',
    ],
  },
  {
    school: 'Ohio State',
    year: 2020,
    players: [
      'justin fields',
      'trey sermon',
      'chris olave',
      'garrett wilson',
      'shaun wade',
      'wyatt davis',
      'josh myers',
      'pete werner',
      'tommy togiai',
      'tuf borland',
      'jeremy ruckert',
      'luke farrell',
      'baron browning',
      'master teague iii',
      'thayer munford',
      'haskell garrett',
      'jameson williams',
      'cameron brown',
      'nicholas petit-frere',
      'zach harrison',
    ],
  },
  {
    school: 'LSU',
    year: 2019,
    players: [
      'joe burrow',
      "ja'marr chase",
      'justin jefferson',
      'clyde edwards-helaire',
      'grant delpit',
      'kristian fulton',
      'patrick queen',
      'k\'lavon chaisson',
      'lloyd cushenberry iii',
      'damien lewis',
      'thaddeus moss',
      'derek stingley jr',
      'terrace marshall jr',
      'rashard lawrence',
      'michael divinity jr',
      'austin deculus',
      'saahdiq charles',
      'jacoby stevens',
      'kary vincent jr',
      'tory carter',
    ],
  },
  {
    school: 'Clemson',
    year: 2018,
    players: [
      'trevor lawrence',
      'travis etienne',
      'tee higgins',
      'justyn ross',
      'clelin ferrell',
      'christian wilkins',
      'dexter lawrence',
      'austin bryant',
      'trayvon mullen',
      'mitch hyatt',
      'hunter renfrow',
      'isaiah simmons',
      'a.j. terrell',
      'tre lamar iii',
      'tanner muse',
      'amari rodgers',
      'k\'von wallace',
      'kendall joseph',
      'nolan turner',
      'john simpson',
    ],
  },
  {
    school: 'Georgia',
    year: 2021,
    players: [
      'stetson bennett',
      'brock bowers',
      'nakobe dean',
      'jordan davis',
      'george pickens',
      'james cook',
      'derion kendrick',
      'lewis cine',
      'devonte wyatt',
      'quay walker',
      'travon walker',
      'kenny mcintosh',
      'ladd mcconkey',
      'jalen carter',
      'kelee ringo',
      'christopher smith',
      'zamir white',
      'nolan smith',
      'channing tindall',
      'jamaree salyer',
    ],
  },
];

// --- Points ---

const POINTS_PER_CORRECT_GUESS = 10;

// --- Game Generation ---

export function generateRosterRouletteGame(
  dateStr: string,
  difficulty: RosterRouletteGameState['difficulty'] = 'medium'
): RosterRouletteGameState {
  const rng = seededRandom(dateToSeed(dateStr));
  const rosterIndex = Math.floor(rng() * TEAM_ROSTERS.length);
  const roster = TEAM_ROSTERS[rosterIndex];

  return {
    school: roster.school,
    year: roster.year,
    validPlayers: [...roster.players],
    guessedPlayers: [],
    score: 0,
    timeRemainingMs: DIFFICULTY_TIME_MS[difficulty],
    isComplete: false,
    startTime: Date.now(),
    difficulty,
  };
}

// --- Cache-Integrated Game Generation ---

const OFFENSIVE_SKILL_POSITIONS = ['QB', 'RB', 'WR', 'TE'];
const EXCLUDED_MEDIUM_POSITIONS = ['K', 'P', 'PK'];

export function generateRosterRouletteGameWithCache(
  dateStr: string,
  difficulty: RosterRouletteGameState['difficulty'] = 'medium'
): RosterRouletteGameState {
  try {
    const allTeams = getAllTeams();
    if (allTeams.length === 0) {
      return generateRosterRouletteGame(dateStr, difficulty);
    }

    // Filter to teams with enough players in the cache
    const teamsWithRosters = allTeams.filter((team) => {
      const players = getPlayersByTeam(team.school);
      return players.length >= 15;
    });

    if (teamsWithRosters.length === 0) {
      return generateRosterRouletteGame(dateStr, difficulty);
    }

    // Use seeded RNG to pick a team deterministically for the date
    const rng = seededRandom(dateToSeed(dateStr));
    const teamIndex = Math.floor(rng() * teamsWithRosters.length);
    const selectedTeam = teamsWithRosters[teamIndex];

    // Get players and apply difficulty-based position filtering
    let players = getPlayersByTeam(selectedTeam.school);

    if (difficulty === 'medium') {
      players = players.filter(
        (p) => !EXCLUDED_MEDIUM_POSITIONS.includes(p.position)
      );
    } else if (difficulty === 'hard') {
      players = players.filter((p) =>
        OFFENSIVE_SKILL_POSITIONS.includes(p.position)
      );
    }
    // 'easy' includes all positions — no filtering

    if (players.length < 10) {
      return generateRosterRouletteGame(dateStr, difficulty);
    }

    // Build validPlayers array from real player names (lowercase)
    const validPlayers = players.map(
      (p) => `${p.firstName} ${p.lastName}`.toLowerCase()
    );

    return {
      school: selectedTeam.school,
      year: 2024,
      validPlayers,
      guessedPlayers: [],
      score: 0,
      timeRemainingMs: DIFFICULTY_TIME_MS[difficulty],
      isComplete: false,
      startTime: Date.now(),
      difficulty,
    };
  } catch {
    // Any failure — fall back to hardcoded data
    return generateRosterRouletteGame(dateStr, difficulty);
  }
}

// --- Guess Submission ---

export function submitRosterGuess(
  state: RosterRouletteGameState,
  playerName: string
): RosterRouletteGameState {
  if (state.isComplete) return state;

  const normalized = playerName.trim().toLowerCase();

  // Skip empty input
  if (normalized.length === 0) return state;

  // Skip if already guessed
  if (state.guessedPlayers.includes(normalized)) return state;

  // Skip if not a valid player (no penalty)
  if (!state.validPlayers.includes(normalized)) return state;

  const newGuessedPlayers = [...state.guessedPlayers, normalized];
  const newScore = state.score + POINTS_PER_CORRECT_GUESS;
  const allGuessed = newGuessedPlayers.length === state.validPlayers.length;

  return {
    ...state,
    guessedPlayers: newGuessedPlayers,
    score: newScore,
    isComplete: allGuessed,
  };
}

// --- End Game (timer expired) ---

export function endRosterRoulette(
  state: RosterRouletteGameState
): RosterRouletteGameState {
  return {
    ...state,
    timeRemainingMs: 0,
    isComplete: true,
  };
}
