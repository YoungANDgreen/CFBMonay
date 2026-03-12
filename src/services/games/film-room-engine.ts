// ============================================================
// GridIron IQ — Coach's Film Room Game Engine
// ============================================================
// Given a play/drive description, identify which game it was from.
// Multiple choice with 4 options. Seeded RNG for daily consistency.

import type { FilmRoomRound, FilmRoomGameState, FilmRoomRevealData } from '@/types';
import { getAllGames, getAllTeams, getTeamLogo } from '../data/cfbd-cache';
import type { CachedGame } from '../data/cfbd-cache';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const legendsData: LegendEntry[] = require('../../data/film-room-legends.json');

// --- Legends Data Shape ---

interface LegendEntry {
  id: string;
  season: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  gameType: string;
  description: string;
  disguiseHints: { home: string; away: string };
  broadcastQuote: string | null;
  announcer: string | null;
  difficulty: string;
}

// --- Seeded RNG Utilities ---

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
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

// --- Description Disguise ---

export function disguiseDescription(
  description: string,
  team1: string,
  team2: string,
  hints?: { home: string; away: string },
  mode: 'partial' | 'full' = 'partial'
): string {
  let result = description;
  if (mode === 'full') {
    result = result.replace(new RegExp(team1, 'gi'), 'Team A');
    result = result.replace(new RegExp(team2, 'gi'), 'Team B');
  } else {
    const hint1 = hints?.home || 'the home team';
    const hint2 = hints?.away || 'the visiting team';
    result = result.replace(new RegExp(team1, 'gi'), hint1);
    result = result.replace(new RegExp(team2, 'gi'), hint2);
  }
  return result;
}

// --- Dynamic Hint Generation ---

function generateHintForTeam(
  team: string,
  conference: string | undefined,
  elo: number | undefined,
  isHome: boolean
): string {
  if (elo && elo > 1700) {
    return `a top-5 ranked ${conference || ''} powerhouse`.trim();
  }
  if (elo && elo > 1600) {
    return `a ranked ${conference || ''} team`.trim();
  }
  if (conference) {
    return `an unranked ${conference} team`;
  }
  return isHome ? 'the home team' : 'the visiting team';
}

// --- Film Room Round Data ---

interface FilmRoomEntry {
  description: string;
  answer: { team: string; opponent: string; year: number; label: string };
  decoys: { team: string; opponent: string; year: number; label: string }[];
}

const FILM_ROOM_ROUNDS: FilmRoomEntry[] = [
  {
    description:
      'With one second left in the rivalry game, the opposing team attempts a long field goal that falls short. A defensive back catches the ball 9 yards deep in his own end zone and weaves through the entire coverage unit — 109 yards — for the game-winning touchdown as time expires. The stadium erupts into pandemonium.',
    answer: { team: 'Auburn', opponent: 'Alabama', year: 2013, label: 'Auburn vs Alabama 2013' },
    decoys: [
      { team: 'Alabama', opponent: 'Auburn', year: 2014, label: 'Alabama vs Auburn 2014' },
      { team: 'LSU', opponent: 'Alabama', year: 2012, label: 'LSU vs Alabama 2012' },
      { team: 'Georgia', opponent: 'Auburn', year: 2013, label: 'Georgia vs Auburn 2013' },
    ],
  },
  {
    description:
      'Down in the final seconds of a BCS bowl, a mid-major program from the Mountain West dials up a trick play on the 2-point conversion in overtime. The running back takes a handoff, stops, and tosses it behind his back to a wide-open receiver in the end zone — the Statue of Liberty play — to win the game and complete one of the greatest upsets in bowl history.',
    answer: { team: 'Boise State', opponent: 'Oklahoma', year: 2007, label: 'Boise State vs Oklahoma (2007 Fiesta Bowl)' },
    decoys: [
      { team: 'Utah', opponent: 'Alabama', year: 2009, label: 'Utah vs Alabama (2009 Sugar Bowl)' },
      { team: 'UCF', opponent: 'Auburn', year: 2018, label: 'UCF vs Auburn (2018 Peach Bowl)' },
      { team: 'TCU', opponent: 'Wisconsin', year: 2011, label: 'TCU vs Wisconsin (2011 Rose Bowl)' },
    ],
  },
  {
    description:
      'In a College Football Playoff semifinal, an unstoppable offensive machine rolls up 63 points against a storied program that had looked dominant all season. The Heisman-winning quarterback throws 7 touchdown passes, and the team\'s passing attack shreds every coverage the opponent deploys. The 63-28 final score is the most lopsided CFP semifinal ever.',
    answer: { team: 'LSU', opponent: 'Oklahoma', year: 2019, label: 'LSU vs Oklahoma (2019 Peach Bowl)' },
    decoys: [
      { team: 'Clemson', opponent: 'Alabama', year: 2019, label: 'Clemson vs Alabama (2019 CFP Championship)' },
      { team: 'Alabama', opponent: 'Michigan State', year: 2016, label: 'Alabama vs Michigan State (2016 CFP Semifinal)' },
      { team: 'Ohio State', opponent: 'Wisconsin', year: 2014, label: 'Ohio State vs Wisconsin (2014 Big Ten Championship)' },
    ],
  },
  {
    description:
      'Overtime in the national championship game. A freshman quarterback, brought in at halftime after his team trailed by 13, drops back and launches a deep ball to the back corner of the end zone. His freshman wide receiver makes a spectacular catch between two defenders, hauling in the 41-yard game-winning touchdown to complete the improbable comeback.',
    answer: { team: 'Alabama', opponent: 'Georgia', year: 2018, label: 'Alabama vs Georgia (2018 CFP Championship)' },
    decoys: [
      { team: 'Clemson', opponent: 'Alabama', year: 2017, label: 'Clemson vs Alabama (2017 CFP Championship)' },
      { team: 'Ohio State', opponent: 'Oregon', year: 2015, label: 'Ohio State vs Oregon (2015 CFP Championship)' },
      { team: 'Alabama', opponent: 'Clemson', year: 2016, label: 'Alabama vs Clemson (2016 CFP Championship)' },
    ],
  },
  {
    description:
      'A third-string quarterback — who weeks earlier had tweeted asking if anyone needed a player for their intramural team — leads his team on an improbable postseason run. In the national championship, his powerful arm and bruising rushing ability overwhelm the opponent. The team captures the title despite entering the playoff as an underdog, capping one of the wildest quarterback journeys in CFB history.',
    answer: { team: 'Ohio State', opponent: 'Oregon', year: 2015, label: 'Ohio State vs Oregon (2015 CFP Championship)' },
    decoys: [
      { team: 'Alabama', opponent: 'Clemson', year: 2016, label: 'Alabama vs Clemson (2016 CFP Championship)' },
      { team: 'Florida State', opponent: 'Auburn', year: 2014, label: 'Florida State vs Auburn (2014 BCS Championship)' },
      { team: 'Clemson', opponent: 'Alabama', year: 2019, label: 'Clemson vs Alabama (2019 CFP Championship)' },
    ],
  },
  {
    description:
      'A College Football Playoff semifinal played in the Rose Bowl turns into an instant classic. Trailing by 14 in the second half, a team from the Southeast rallies furiously. Their star freshman running back breaks off a long overtime touchdown run, and after a thrilling double-overtime battle, they punch their ticket to the national championship game with a 54-48 victory.',
    answer: { team: 'Georgia', opponent: 'Oklahoma', year: 2018, label: 'Georgia vs Oklahoma (2018 Rose Bowl)' },
    decoys: [
      { team: 'Penn State', opponent: 'USC', year: 2017, label: 'Penn State vs USC (2017 Rose Bowl)' },
      { team: 'Alabama', opponent: 'Ohio State', year: 2015, label: 'Alabama vs Ohio State (2015 Sugar Bowl)' },
      { team: 'Oklahoma', opponent: 'Georgia', year: 2017, label: 'Oklahoma vs Georgia (2017 Big 12 Championship)' },
    ],
  },
  {
    description:
      'A massive home upset rocks the college football world on a Saturday evening. The unranked host, known more for its engineering program than its football, dominates the #2 team in the country 49-20. A bruising rushing attack and swarming defense stun a team that had playoff aspirations, effectively ending their championship hopes in devastating fashion.',
    answer: { team: 'Purdue', opponent: 'Ohio State', year: 2018, label: 'Purdue vs Ohio State 2018' },
    decoys: [
      { team: 'Iowa', opponent: 'Michigan', year: 2016, label: 'Iowa vs Michigan 2016' },
      { team: 'Iowa', opponent: 'Ohio State', year: 2017, label: 'Iowa vs Ohio State 2017' },
      { team: 'Virginia Tech', opponent: 'Clemson', year: 2016, label: 'Virginia Tech vs Clemson 2016' },
    ],
  },
  {
    description:
      'Fourth and five, the national championship on the line. The dynamic quarterback takes the shotgun snap, sees nothing developing in the passing game, tucks the ball, and sprints toward the right corner of the end zone. He dives across the goal line with 19 seconds left to give his team a 41-38 lead. The opposing dynasty\'s 34-game winning streak is snapped in what many call the greatest championship game ever played.',
    answer: { team: 'Texas', opponent: 'USC', year: 2006, label: 'Texas vs USC (2006 Rose Bowl)' },
    decoys: [
      { team: 'Florida', opponent: 'Ohio State', year: 2007, label: 'Florida vs Ohio State (2007 BCS Championship)' },
      { team: 'Alabama', opponent: 'Texas', year: 2010, label: 'Alabama vs Texas (2010 BCS Championship)' },
      { team: 'Ohio State', opponent: 'Miami', year: 2003, label: 'Ohio State vs Miami (2003 BCS Championship)' },
    ],
  },
];

// --- Game Generation ---

function buildRound(entry: FilmRoomEntry, rng: () => number): FilmRoomRound {
  const allOptions = [entry.answer, ...entry.decoys];
  const shuffledOptions = shuffleWithRng(allOptions, rng);
  const correctIndex = shuffledOptions.findIndex(
    (opt) =>
      opt.team === entry.answer.team &&
      opt.opponent === entry.answer.opponent &&
      opt.year === entry.answer.year
  );

  return {
    description: entry.description,
    options: shuffledOptions,
    correctIndex,
  };
}

export function generateFilmRoomGame(
  dateStr: string,
  roundCount: number = 5
): FilmRoomGameState {
  const rng = seededRandom(dateToSeed(dateStr));

  const clampedCount = Math.min(roundCount, FILM_ROOM_ROUNDS.length);
  const shuffledEntries = shuffleWithRng(FILM_ROOM_ROUNDS, rng);
  const selectedEntries = shuffledEntries.slice(0, clampedCount);

  const rounds = selectedEntries.map((entry) => buildRound(entry, rng));

  return {
    rounds,
    currentRound: 0,
    score: 0,
    results: rounds.map(() => 'pending' as const),
    isComplete: false,
    startTime: Date.now(),
  };
}

// --- Guess Submission ---

const POINTS_PER_CORRECT = 20;

export function submitFilmRoomGuess(
  state: FilmRoomGameState,
  selectedIndex: number
): FilmRoomGameState {
  if (state.isComplete) return state;
  if (state.currentRound >= state.rounds.length) return state;

  const round = state.rounds[state.currentRound];
  if (selectedIndex < 0 || selectedIndex >= round.options.length) return state;

  const isCorrect = selectedIndex === round.correctIndex;

  const newResults = [...state.results];
  newResults[state.currentRound] = isCorrect ? 'correct' : 'incorrect';

  const newScore = state.score + (isCorrect ? POINTS_PER_CORRECT : 0);
  const nextRound = state.currentRound + 1;
  const isComplete = nextRound >= state.rounds.length;

  return {
    ...state,
    currentRound: nextRound,
    score: newScore,
    results: newResults,
    isComplete,
  };
}

// --- Cache-Integrated Film Room ---

type GameType = 'upset' | 'shootout' | 'defensive' | 'close' | 'blowout';

interface ClassifiedGame {
  game: CachedGame;
  type: GameType;
}

function getWinnerLoser(game: CachedGame): {
  winner: string;
  loser: string;
  winScore: number;
  loseScore: number;
  margin: number;
} {
  const homeWon = game.homePoints >= game.awayPoints;
  return {
    winner: homeWon ? game.homeTeam : game.awayTeam,
    loser: homeWon ? game.awayTeam : game.homeTeam,
    winScore: homeWon ? game.homePoints : game.awayPoints,
    loseScore: homeWon ? game.awayPoints : game.homePoints,
    margin: Math.abs(game.homePoints - game.awayPoints),
  };
}

function classifyGame(game: CachedGame): GameType | null {
  const total = game.homePoints + game.awayPoints;
  const margin = Math.abs(game.homePoints - game.awayPoints);
  const awayWon = game.awayPoints > game.homePoints;

  // Upset: away team wins AND (had lower Elo or won by 14+)
  if (awayWon) {
    const eloUpset = game.homeElo != null && game.awayElo != null && game.awayElo < game.homeElo;
    if (eloUpset || margin >= 14) return 'upset';
  }

  // Shootout: combined >= 70
  if (total >= 70) return 'shootout';

  // Defensive battle: combined <= 20 and both scored
  if (total <= 20 && game.homePoints > 0 && game.awayPoints > 0) return 'defensive';

  // Close game: margin <= 3 and combined >= 30
  if (margin <= 3 && total >= 30) return 'close';

  // Blowout: margin >= 35
  if (margin >= 35) return 'blowout';

  return null;
}

function generateDescription(game: CachedGame, type: GameType): string {
  const { winner, loser, winScore, loseScore, margin } = getWinnerLoser(game);
  const venueContext = game.venue ? ` at ${game.venue}` : '';

  switch (type) {
    case 'upset':
      return `In Week ${game.week} of the ${game.season} season, ${winner} pulled off a stunning upset over ${loser}, winning ${winScore}-${loseScore}${venueContext}. The ${margin}-point underdog victory shocked the college football world.`;

    case 'shootout':
      return `A high-scoring affair in Week ${game.week} of ${game.season} saw ${game.homeTeam} and ${game.awayTeam} combine for ${game.homePoints + game.awayPoints} points at ${game.venue || 'a packed stadium'}. The ${winner} prevailed ${winScore}-${loseScore} in one of the season's wildest games.`;

    case 'close':
      return `In a nail-biter at ${game.venue || 'the stadium'} during Week ${game.week} of ${game.season}, ${winner} edged ${loser} by just ${margin} points, ${winScore}-${loseScore}. The game came down to the final moments.`;

    case 'blowout':
      return `A dominant performance in Week ${game.week} of ${game.season} saw ${winner} demolish ${loser} ${winScore}-${loseScore}. The ${margin}-point victory was one of the most lopsided results of the season.`;

    case 'defensive':
      return `Defense ruled in Week ${game.week} of ${game.season} at ${game.venue || 'the stadium'} as ${winner} ground out a ${winScore}-${loseScore} victory over ${loser} in a hard-fought, low-scoring contest.`;
  }
}

function findDecoys(
  targetGame: CachedGame,
  targetType: GameType,
  allCompleted: CachedGame[],
  rng: () => number
): { team: string; opponent: string; year: number; label: string }[] {
  const { winner: targetWinner, loser: targetLoser } = getWinnerLoser(targetGame);

  // Prefer games from the same season with similar characteristics
  const sameSeason = allCompleted.filter(
    (g) =>
      g.id !== targetGame.id &&
      g.season === targetGame.season
  );

  // Score candidates by similarity
  const scored = sameSeason.map((g) => {
    const gType = classifyGame(g);
    let score = 0;
    if (gType === targetType) score += 3;
    const totalDiff = Math.abs(
      (g.homePoints + g.awayPoints) - (targetGame.homePoints + targetGame.awayPoints)
    );
    if (totalDiff <= 10) score += 2;
    if (totalDiff <= 20) score += 1;
    return { game: g, score };
  });

  // Sort by score descending, then shuffle ties
  scored.sort((a, b) => b.score - a.score || (rng() - 0.5));

  // Pick up to 3 decoys, avoiding the same winner/loser pair
  const decoys: { team: string; opponent: string; year: number; label: string }[] = [];
  for (const candidate of scored) {
    if (decoys.length >= 3) break;
    const { winner, loser } = getWinnerLoser(candidate.game);
    if (winner === targetWinner && loser === targetLoser) continue;
    decoys.push({
      team: winner,
      opponent: loser,
      year: candidate.game.season,
      label: `${winner} vs ${loser} ${candidate.game.season}`,
    });
  }

  // If not enough same-season decoys, grab from other seasons
  if (decoys.length < 3) {
    const otherSeasons = shuffleWithRng(
      allCompleted.filter(
        (g) => g.id !== targetGame.id && g.season !== targetGame.season
      ),
      rng
    );
    for (const g of otherSeasons) {
      if (decoys.length >= 3) break;
      const { winner, loser } = getWinnerLoser(g);
      if (winner === targetWinner && loser === targetLoser) continue;
      decoys.push({
        team: winner,
        opponent: loser,
        year: g.season,
        label: `${winner} vs ${loser} ${g.season}`,
      });
    }
  }

  return decoys;
}

// --- Legend Round Builder ---

function buildLegendRound(
  legend: LegendEntry,
  rng: () => number,
  mode: 'partial' | 'full'
): FilmRoomRound {
  // Disguise the description
  const disguised = disguiseDescription(
    legend.description,
    legend.homeTeam,
    legend.awayTeam,
    legend.disguiseHints,
    mode
  );

  // Winner is whichever team scored more
  const homeWon = legend.homeScore >= legend.awayScore;
  const winner = homeWon ? legend.homeTeam : legend.awayTeam;
  const loser = homeWon ? legend.awayTeam : legend.homeTeam;

  const answer = {
    team: winner,
    opponent: loser,
    year: legend.season,
    label: `${winner} vs ${loser} ${legend.season}`,
  };

  // Build decoys from other legends with similar game types
  const candidates = legendsData.filter(l => l.id !== legend.id);
  const shuffledCandidates = shuffleWithRng(candidates, rng);
  const decoys = shuffledCandidates.slice(0, 3).map(l => {
    const lHomeWon = l.homeScore >= l.awayScore;
    const lWinner = lHomeWon ? l.homeTeam : l.awayTeam;
    const lLoser = lHomeWon ? l.awayTeam : l.homeTeam;
    return {
      team: lWinner,
      opponent: lLoser,
      year: l.season,
      label: `${lWinner} vs ${lLoser} ${l.season}`,
    };
  });

  const allOptions = [answer, ...decoys];
  const shuffledOptions = shuffleWithRng(allOptions, rng);
  const correctIndex = shuffledOptions.findIndex(
    (opt) => opt.team === answer.team && opt.opponent === answer.opponent && opt.year === answer.year
  );

  const revealData: FilmRoomRevealData = {
    homeTeam: legend.homeTeam,
    awayTeam: legend.awayTeam,
    homeScore: legend.homeScore,
    awayScore: legend.awayScore,
    broadcastQuote: legend.broadcastQuote,
    announcer: legend.announcer,
    homeLogo: getTeamLogo(legend.homeTeam) || null,
    awayLogo: getTeamLogo(legend.awayTeam) || null,
  };

  return {
    description: disguised,
    options: shuffledOptions,
    correctIndex,
    revealData,
  };
}

// --- Dynamic Round Builder with Disguise ---

function buildDynamicRound(
  game: CachedGame,
  type: GameType,
  completedGames: CachedGame[],
  rng: () => number,
  mode: 'partial' | 'full'
): FilmRoomRound {
  const { winner, loser } = getWinnerLoser(game);
  const rawDescription = generateDescription(game, type);

  // Generate hints for dynamic games
  const homeHint = generateHintForTeam(
    game.homeTeam,
    game.homeConference,
    game.homeElo,
    true
  );
  const awayHint = generateHintForTeam(
    game.awayTeam,
    game.awayConference,
    game.awayElo,
    false
  );

  const disguised = disguiseDescription(
    rawDescription,
    game.homeTeam,
    game.awayTeam,
    { home: homeHint, away: awayHint },
    mode
  );

  const answer = {
    team: winner,
    opponent: loser,
    year: game.season,
    label: `${winner} vs ${loser} ${game.season}`,
  };

  const decoys = findDecoys(game, type, completedGames, rng);
  const allOptions = [answer, ...decoys];
  const shuffledOptions = shuffleWithRng(allOptions, rng);
  const correctIndex = shuffledOptions.findIndex(
    (opt) => opt.team === answer.team && opt.opponent === answer.opponent && opt.year === answer.year
  );

  const revealData: FilmRoomRevealData = {
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeScore: game.homePoints,
    awayScore: game.awayPoints,
    broadcastQuote: null,
    announcer: null,
    homeLogo: getTeamLogo(game.homeTeam) || null,
    awayLogo: getTeamLogo(game.awayTeam) || null,
  };

  return {
    description: disguised,
    options: shuffledOptions,
    correctIndex,
    revealData,
  };
}

export function generateFilmRoomGameWithCache(
  dateStr: string,
  roundCount: number = 5
): FilmRoomGameState {
  const allGames = getAllGames();
  // Only FBS-vs-FBS games (both teams have conferences in our data)
  const completedGames = allGames.filter(
    (g) => g.completed && g.homeConference && g.awayConference
  );

  // Quality filter for dynamic games
  const qualityGames = completedGames.filter(g => {
    if (!g.completed || !g.homeConference || !g.awayConference) return false;
    const margin = Math.abs(g.homePoints - g.awayPoints);
    const total = g.homePoints + g.awayPoints;
    const hasElo = g.homeElo && g.awayElo;
    const isUpset = hasElo && Math.abs(g.homeElo! - g.awayElo!) > 150;
    const isClose = margin <= 7;
    const isShootout = total >= 70;
    const isRankedMatchup = hasElo && g.homeElo! > 1600 && g.awayElo! > 1600;
    return isUpset || isClose || isShootout || isRankedMatchup;
  });

  // Classify quality games
  const interestingGames: ClassifiedGame[] = [];
  for (const game of qualityGames) {
    const type = classifyGame(game);
    if (type) {
      interestingGames.push({ game, type });
    }
  }

  // Fall back to hardcoded rounds if not enough interesting games
  if (interestingGames.length < 10) {
    return generateFilmRoomGame(dateStr, roundCount);
  }

  const rng = seededRandom(dateToSeed(dateStr + '-cache'));

  // Determine round mix: 2-3 dynamic rounds + 1-2 legends rounds
  const clampedCount = Math.min(roundCount, 5);
  const legendCount = rng() < 0.5 ? 1 : 2;
  const dynamicCount = clampedCount - legendCount;

  // Select legends
  const shuffledLegends = shuffleWithRng(legendsData, rng);
  const selectedLegends = shuffledLegends.slice(0, legendCount);

  // Select dynamic games
  const shuffledDynamic = shuffleWithRng(interestingGames, rng);
  const selectedDynamic = shuffledDynamic.slice(0, dynamicCount);

  // Build rounds — ~70% partial (hints), ~30% full (Team A/B)
  const rounds: FilmRoomRound[] = [];

  for (const legend of selectedLegends) {
    const mode = rng() < 0.7 ? 'partial' : 'full';
    rounds.push(buildLegendRound(legend, rng, mode));
  }

  for (const { game, type } of selectedDynamic) {
    const mode = rng() < 0.7 ? 'partial' : 'full';
    rounds.push(buildDynamicRound(game, type, completedGames, rng, mode));
  }

  // Shuffle the combined rounds so legends aren't always first
  const shuffledRounds = shuffleWithRng(rounds, rng);

  return {
    rounds: shuffledRounds,
    currentRound: 0,
    score: 0,
    results: shuffledRounds.map(() => 'pending' as const),
    isComplete: false,
    startTime: Date.now(),
  };
}
