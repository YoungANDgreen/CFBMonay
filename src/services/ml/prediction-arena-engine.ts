import type {
  UserPrediction,
  GameResult,
  PredictionScoring,
  PredictionArenaWeek,
  PredictionArenaState,
  ModelAccuracy,
  GamePrediction,
  PredictionFactor,
  PredictionLeague,
} from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_SCORING: PredictionScoring = {
  winner: 10,
  spread: 25,
  overUnder: 10,
  upsetAlert: 50,
  exactScore: 500,
};

// ---------------------------------------------------------------------------
// Helper — build a GamePrediction
// ---------------------------------------------------------------------------

function gp(
  gameId: string,
  homeTeam: string,
  awayTeam: string,
  spreadValue: number,
  favored: string,
  spreadConf: number,
  totalValue: number,
  totalConf: number,
  upsetProb: number,
  factors: PredictionFactor[],
): GamePrediction {
  return {
    gameId,
    homeTeam,
    awayTeam,
    predictions: {
      spread: { value: spreadValue, favored, confidence: spreadConf },
      total: { value: totalValue, confidence: totalConf },
      upset: { probability: upsetProb, isAlert: upsetProb >= 0.25 },
    },
    topFactors: factors,
    modelVersion: '1.4.0',
    generatedAt: new Date().toISOString(),
  };
}

function factor(
  name: string,
  weight: number,
  direction: PredictionFactor['direction'],
  description: string,
): PredictionFactor {
  return { name, weight, direction, description };
}

// ---------------------------------------------------------------------------
// Mock Weekly Games — Weeks 1-14 (full predictions for weeks 1-5)
// ---------------------------------------------------------------------------

const week1Games: GamePrediction[] = [
  gp('w1g1', 'Alabama', 'Duke', 21.5, 'Alabama', 0.92, 52.5, 0.78, 0.05, [
    factor('Recruiting Rank', 0.35, 'favors_home', 'Alabama top-3 recruiting class 4 straight years'),
    factor('Returning Production', 0.25, 'favors_home', 'Alabama returns 78% of offensive production'),
    factor('Home Field', 0.15, 'favors_home', 'Bryant-Denny advantage worth ~3 pts'),
  ]),
  gp('w1g2', 'Ohio State', 'Western Michigan', 31.0, 'Ohio State', 0.96, 55.0, 0.72, 0.02, [
    factor('Talent Gap', 0.45, 'favors_home', 'Massive talent differential per 247 composite'),
    factor('Depth Chart', 0.2, 'favors_home', 'Ohio State 2-deep outmatches WMU starters'),
  ]),
  gp('w1g3', 'Georgia', 'Tennessee-Martin', 38.5, 'Georgia', 0.98, 50.0, 0.65, 0.01, [
    factor('FCS Matchup', 0.5, 'favors_home', 'FCS vs SEC powerhouse mismatch'),
    factor('Defensive Dominance', 0.3, 'favors_home', 'Georgia returns 8 defensive starters'),
  ]),
  gp('w1g4', 'USC', 'San Jose State', 24.0, 'USC', 0.90, 57.5, 0.70, 0.06, [
    factor('Offensive Firepower', 0.35, 'favors_home', 'USC top-10 in returning offensive talent'),
    factor('Pace of Play', 0.2, 'favors_home', 'USC tempo should overwhelm SJSU defense'),
  ]),
  gp('w1g5', 'Texas', 'Rice', 28.0, 'Texas', 0.94, 51.0, 0.74, 0.03, [
    factor('In-State Talent', 0.3, 'favors_home', 'Texas dominates Texas recruiting pipelines'),
    factor('Portal Additions', 0.25, 'favors_home', 'Key portal additions bolster both lines'),
  ]),
  gp('w1g6', 'Oregon', 'Portland State', 35.0, 'Oregon', 0.97, 53.5, 0.68, 0.02, [
    factor('FCS Mismatch', 0.45, 'favors_home', 'Significant talent and depth gap'),
    factor('Autzen Atmosphere', 0.15, 'favors_home', 'Autzen Stadium opening week energy'),
  ]),
  gp('w1g7', 'Michigan', 'Fresno State', 17.5, 'Michigan', 0.86, 44.5, 0.75, 0.10, [
    factor('Defensive Identity', 0.3, 'favors_home', 'Michigan elite run defense returns core'),
    factor('QB Uncertainty', 0.2, 'favors_away', 'Michigan breaking in new starting QB'),
  ]),
  gp('w1g8', 'Clemson', 'Appalachian State', 14.0, 'Clemson', 0.82, 48.0, 0.71, 0.15, [
    factor('App State History', 0.2, 'favors_away', 'App State has history of FBS upsets'),
    factor('Home Field', 0.15, 'favors_home', 'Death Valley night game advantage'),
    factor('Rushing Attack', 0.25, 'favors_away', 'App State top-15 rushing offense returns'),
  ]),
  gp('w1g9', 'LSU', 'Grambling State', 34.0, 'LSU', 0.97, 54.0, 0.66, 0.01, [
    factor('Talent Gap', 0.5, 'favors_home', 'SEC vs FCS talent differential'),
  ]),
  gp('w1g10', 'Penn State', 'West Virginia', 10.5, 'Penn State', 0.78, 46.5, 0.73, 0.18, [
    factor('Rivalry Intensity', 0.2, 'neutral', 'Former Big East rivals add emotional edge'),
    factor('WVU Passing', 0.25, 'favors_away', 'West Virginia returns prolific passer'),
    factor('White Out Crowd', 0.15, 'favors_home', 'Beaver Stadium early-season energy'),
  ]),
];

const week2Games: GamePrediction[] = [
  gp('w2g1', 'Alabama', 'Texas', 3.5, 'Alabama', 0.58, 49.5, 0.72, 0.38, [
    factor('Neutral Site', 0.1, 'neutral', 'Game played in Arlington, TX'),
    factor('QB Matchup', 0.3, 'favors_away', 'Texas QB edges in experience'),
    factor('Coaching', 0.25, 'favors_home', 'Alabama coaching staff edge in big games'),
  ]),
  gp('w2g2', 'Notre Dame', 'Northern Illinois', 21.0, 'Notre Dame', 0.91, 47.0, 0.74, 0.06, [
    factor('Talent Differential', 0.4, 'favors_home', 'Notre Dame significant talent edge'),
    factor('NIU Upset History', 0.15, 'favors_away', 'NIU beat power-5 teams recently'),
  ]),
  gp('w2g3', 'Georgia', 'Kentucky', 14.5, 'Georgia', 0.85, 44.0, 0.70, 0.12, [
    factor('SEC Opener', 0.15, 'neutral', 'Early conference game adds uncertainty'),
    factor('Georgia Defense', 0.35, 'favors_home', 'Georgia defense elite against the run'),
    factor('Kentucky RB', 0.2, 'favors_away', 'Kentucky features top returning rusher'),
  ]),
  gp('w2g4', 'Ohio State', 'Oregon', 2.5, 'Ohio State', 0.55, 56.0, 0.68, 0.42, [
    factor('Offensive Tempo', 0.25, 'favors_away', 'Oregon high-tempo attack stresses defenses'),
    factor('Home Field', 0.2, 'favors_home', 'The Horseshoe advantage'),
    factor('DB Matchup', 0.2, 'favors_home', 'Ohio State secondary vs Oregon WRs'),
  ]),
  gp('w2g5', 'Michigan', 'Texas A&M', 6.0, 'Michigan', 0.68, 42.5, 0.71, 0.28, [
    factor('Physical Play', 0.3, 'favors_home', 'Michigan line play dominant'),
    factor('A&M Portal Haul', 0.25, 'favors_away', 'Texas A&M massive portal acquisitions'),
  ]),
  gp('w2g6', 'USC', 'Stanford', 13.5, 'USC', 0.84, 55.5, 0.69, 0.12, [
    factor('Rivalry Factor', 0.15, 'neutral', 'Stanford historically plays USC tough'),
    factor('Offensive Talent', 0.35, 'favors_home', 'USC WR corps best in conference'),
  ]),
  gp('w2g7', 'Clemson', 'Florida State', 4.0, 'Clemson', 0.62, 47.5, 0.73, 0.34, [
    factor('Death Valley Night', 0.2, 'favors_home', 'Night game atmosphere'),
    factor('FSU QB Play', 0.25, 'favors_away', 'FSU starting QB high-caliber transfer'),
    factor('DL Battle', 0.25, 'favors_home', 'Clemson defensive line depth'),
  ]),
  gp('w2g8', 'Penn State', 'UCLA', 10.0, 'Penn State', 0.80, 48.0, 0.72, 0.15, [
    factor('Big Ten Newcomer', 0.2, 'favors_home', 'UCLA adjusting to Big Ten physicality'),
    factor('Penn State RB', 0.3, 'favors_home', 'Penn State running game top-tier'),
  ]),
  gp('w2g9', 'Oklahoma', 'Houston', 7.5, 'Oklahoma', 0.74, 53.0, 0.70, 0.22, [
    factor('SEC Transition', 0.15, 'neutral', 'Oklahoma still adjusting to SEC level'),
    factor('Houston Passing', 0.2, 'favors_away', 'Houston air raid scheme can exploit'),
  ]),
  gp('w2g10', 'LSU', 'Mississippi State', 11.0, 'LSU', 0.82, 51.5, 0.71, 0.14, [
    factor('Tiger Stadium Night', 0.25, 'favors_home', 'Death Valley night game premium'),
    factor('LSU Offense', 0.3, 'favors_home', 'LSU offensive weapons deep'),
  ]),
];

const week3Games: GamePrediction[] = [
  gp('w3g1', 'Georgia', 'South Carolina', 17.0, 'Georgia', 0.88, 46.5, 0.73, 0.08, [
    factor('Defensive Talent', 0.35, 'favors_home', 'Georgia defense anchors performance'),
    factor('SC Home Crowd', 0.15, 'favors_away', 'Williams-Brice can be hostile'),
  ]),
  gp('w3g2', 'Ohio State', 'Marshall', 35.0, 'Ohio State', 0.97, 52.0, 0.65, 0.02, [
    factor('Talent Gap', 0.5, 'favors_home', 'Massive talent differential'),
  ]),
  gp('w3g3', 'Texas', 'UTSA', 27.5, 'Texas', 0.95, 55.0, 0.70, 0.03, [
    factor('In-State Matchup', 0.15, 'neutral', 'UTSA competitive G5 program'),
    factor('Texas Depth', 0.35, 'favors_home', 'Texas roster depth overwhelming'),
  ]),
  gp('w3g4', 'USC', 'Michigan', 1.5, 'USC', 0.52, 45.5, 0.67, 0.46, [
    factor('Style Clash', 0.3, 'favors_away', 'Michigan physicality vs USC speed'),
    factor('USC Home', 0.2, 'favors_home', 'Coliseum crowd factor'),
    factor('QB Advantage', 0.25, 'favors_home', 'USC QB more dynamic passer'),
  ]),
  gp('w3g5', 'Oregon', 'BYU', 10.5, 'Oregon', 0.79, 50.0, 0.72, 0.17, [
    factor('BYU Physicality', 0.2, 'favors_away', 'BYU OL very physical'),
    factor('Oregon Speed', 0.3, 'favors_home', 'Oregon skill position speed advantage'),
  ]),
  gp('w3g6', 'Alabama', 'Ole Miss', 6.5, 'Alabama', 0.70, 54.5, 0.69, 0.27, [
    factor('Offensive Shootout', 0.25, 'neutral', 'Both teams high-powered offenses'),
    factor('Bama Home', 0.2, 'favors_home', 'Bryant-Denny SEC game'),
    factor('Ole Miss Tempo', 0.2, 'favors_away', 'Ole Miss tempo could tire Bama D'),
  ]),
  gp('w3g7', 'Penn State', 'Illinois', 13.0, 'Penn State', 0.83, 41.0, 0.75, 0.13, [
    factor('Penn State Defense', 0.3, 'favors_home', 'Linebacker corps dominant'),
    factor('Illinois Bret Bielema', 0.15, 'favors_away', 'Bielema ball-control offense limits possessions'),
  ]),
  gp('w3g8', 'Clemson', 'NC State', 7.0, 'Clemson', 0.72, 43.5, 0.74, 0.24, [
    factor('NC State Wolfpack', 0.2, 'favors_away', 'NC State always plays Clemson tough'),
    factor('Clemson DL', 0.3, 'favors_home', 'Clemson defensive line dominance'),
  ]),
  gp('w3g9', 'Notre Dame', 'Purdue', 14.0, 'Notre Dame', 0.84, 47.0, 0.71, 0.12, [
    factor('Rivalry', 0.15, 'neutral', 'In-state bragging rights'),
    factor('ND Talent', 0.3, 'favors_home', 'Notre Dame roster significantly deeper'),
  ]),
  gp('w3g10', 'LSU', 'Auburn', 8.0, 'LSU', 0.75, 48.5, 0.70, 0.21, [
    factor('SEC West Rivalry', 0.2, 'neutral', 'Historic rivalry — anything can happen'),
    factor('LSU at Home', 0.25, 'favors_home', 'Tiger Stadium night game'),
  ]),
];

const week4Games: GamePrediction[] = [
  gp('w4g1', 'Alabama', 'Vanderbilt', 28.0, 'Alabama', 0.95, 48.0, 0.74, 0.03, [
    factor('Talent Gap', 0.4, 'favors_home', 'Alabama vastly more talented'),
  ]),
  gp('w4g2', 'Ohio State', 'Wisconsin', 11.5, 'Ohio State', 0.82, 44.0, 0.73, 0.14, [
    factor('Big Ten Matchup', 0.2, 'neutral', 'Physical Big Ten conference game'),
    factor('OSU Passing', 0.3, 'favors_home', 'Ohio State passing attack elite'),
  ]),
  gp('w4g3', 'Georgia', 'Auburn', 13.0, 'Georgia', 0.84, 43.5, 0.71, 0.12, [
    factor('Deep South Rivalry', 0.2, 'neutral', 'Historic rivalry intensity'),
    factor('Georgia RB Room', 0.3, 'favors_home', 'Georgia running back stable dominant'),
  ]),
  gp('w4g4', 'Texas', 'Oklahoma', 5.5, 'Texas', 0.66, 52.0, 0.68, 0.30, [
    factor('Red River Rivalry', 0.25, 'neutral', 'Neutral site — Cotton Bowl'),
    factor('Texas Defense', 0.2, 'favors_home', 'Texas defensive front seven elite'),
    factor('OU Offensive Line', 0.2, 'favors_away', 'Oklahoma rebuilt OL gelling nicely'),
  ]),
  gp('w4g5', 'Oregon', 'Washington', 7.0, 'Oregon', 0.72, 51.5, 0.70, 0.24, [
    factor('Pac-12 Legacy Rivalry', 0.2, 'neutral', 'Historic rivalry carries over'),
    factor('Oregon Home', 0.2, 'favors_home', 'Autzen advantage'),
  ]),
  gp('w4g6', 'Michigan', 'Minnesota', 9.5, 'Michigan', 0.78, 40.5, 0.76, 0.18, [
    factor('Little Brown Jug', 0.1, 'neutral', 'Rivalry trophy game'),
    factor('Michigan Defense', 0.35, 'favors_home', 'Michigan defensive scheme dominant'),
  ]),
  gp('w4g7', 'USC', 'Arizona State', 10.0, 'USC', 0.80, 54.0, 0.69, 0.16, [
    factor('Desert Factor', 0.15, 'favors_away', 'Late-season heat in Tempe'),
    factor('USC Talent', 0.3, 'favors_home', 'USC overall roster talent edge'),
  ]),
  gp('w4g8', 'Clemson', 'Louisville', 6.0, 'Clemson', 0.68, 49.0, 0.71, 0.28, [
    factor('Louisville QB', 0.25, 'favors_away', 'Louisville QB dynamic dual-threat'),
    factor('Clemson Experience', 0.2, 'favors_home', 'Clemson big-game experience'),
  ]),
  gp('w4g9', 'Penn State', 'Iowa', 8.5, 'Penn State', 0.76, 37.0, 0.80, 0.20, [
    factor('Iowa Defense', 0.3, 'favors_away', 'Iowa defense limits scoring'),
    factor('Penn State Offense', 0.25, 'favors_home', 'Penn State balanced attack'),
  ]),
  gp('w4g10', 'Notre Dame', 'Miami', 3.0, 'Notre Dame', 0.58, 50.5, 0.68, 0.38, [
    factor('Catholics vs Convicts', 0.15, 'neutral', 'Historic rivalry renewed'),
    factor('Miami Speed', 0.25, 'favors_away', 'Miami skill position speed elite'),
    factor('ND Home', 0.2, 'favors_home', 'Notre Dame Stadium advantage'),
  ]),
];

const week5Games: GamePrediction[] = [
  gp('w5g1', 'Georgia', 'Alabama', 2.0, 'Georgia', 0.54, 47.0, 0.67, 0.44, [
    factor('Game of the Year', 0.1, 'neutral', 'Premier SEC matchup'),
    factor('Georgia Defense', 0.3, 'favors_home', 'Georgia defensive unit best in nation'),
    factor('Alabama Offense', 0.25, 'favors_away', 'Alabama offensive weapons can exploit anyone'),
  ]),
  gp('w5g2', 'Ohio State', 'Penn State', 4.5, 'Ohio State', 0.64, 43.0, 0.74, 0.32, [
    factor('Big Ten Showdown', 0.15, 'neutral', 'Top-10 Big Ten matchup'),
    factor('OSU Home', 0.2, 'favors_home', 'The Horseshoe gameday atmosphere'),
    factor('Penn State Defense', 0.25, 'favors_away', 'Penn State LBs can disrupt OSU run game'),
  ]),
  gp('w5g3', 'Oregon', 'USC', 5.0, 'Oregon', 0.66, 58.0, 0.66, 0.30, [
    factor('Offensive Fireworks', 0.2, 'neutral', 'Two elite offenses clash'),
    factor('Autzen Crowd', 0.2, 'favors_home', 'Autzen night game electric'),
    factor('USC WRs', 0.25, 'favors_away', 'USC receiving corps deepest in country'),
  ]),
  gp('w5g4', 'Texas', 'TCU', 12.0, 'Texas', 0.83, 50.5, 0.72, 0.13, [
    factor('Big 12 History', 0.15, 'neutral', 'TCU always competitive against Texas'),
    factor('Texas at Home', 0.2, 'favors_home', 'DKR advantage'),
    factor('Texas Depth', 0.3, 'favors_home', 'Texas depth wears down opponents'),
  ]),
  gp('w5g5', 'Michigan', 'Iowa', 9.0, 'Michigan', 0.78, 36.5, 0.80, 0.18, [
    factor('Defensive Slugfest', 0.3, 'neutral', 'Both teams elite defensively'),
    factor('Michigan Running Game', 0.3, 'favors_home', 'Michigan ground game relentless'),
  ]),
  gp('w5g6', 'Clemson', 'Wake Forest', 14.0, 'Clemson', 0.85, 51.0, 0.70, 0.11, [
    factor('ACC Matchup', 0.15, 'neutral', 'Conference play routine'),
    factor('Clemson DL', 0.3, 'favors_home', 'Clemson front four dominant'),
  ]),
  gp('w5g7', 'Notre Dame', 'Stanford', 16.5, 'Notre Dame', 0.87, 46.5, 0.73, 0.09, [
    factor('Rivalry', 0.15, 'neutral', 'Long-standing rivalry'),
    factor('ND Overall Talent', 0.35, 'favors_home', 'Notre Dame deeper roster'),
  ]),
  gp('w5g8', 'LSU', 'Tennessee', 3.5, 'LSU', 0.60, 53.0, 0.68, 0.36, [
    factor('SEC Clash', 0.15, 'neutral', 'Two top-15 teams'),
    factor('LSU Home', 0.2, 'favors_home', 'Tiger Stadium night game'),
    factor('Tennessee Offense', 0.25, 'favors_away', 'Tennessee up-tempo offense dangerous'),
  ]),
  gp('w5g9', 'Oklahoma', 'Kansas State', 2.5, 'Oklahoma', 0.55, 49.0, 0.70, 0.42, [
    factor('K-State Physicality', 0.25, 'favors_away', 'Kansas State OL mauling style'),
    factor('Oklahoma Skill', 0.2, 'favors_home', 'Oklahoma speed at skill positions'),
  ]),
  gp('w5g10', 'Florida', 'Mississippi State', 6.0, 'Florida', 0.70, 45.0, 0.72, 0.26, [
    factor('The Swamp', 0.2, 'favors_home', 'Ben Hill Griffin Stadium advantage'),
    factor('Florida Rebuild', 0.15, 'favors_away', 'Florida still building depth'),
  ]),
];

// Weeks 6-14 are stub shells (games populated on demand in a real system)
function stubWeek(weekNum: number, gameCount: number): GamePrediction[] {
  const teams = [
    ['Alabama', 'LSU'], ['Ohio State', 'Michigan'], ['Georgia', 'Florida'],
    ['Texas', 'Baylor'], ['Oregon', 'Washington'], ['USC', 'Notre Dame'],
    ['Clemson', 'Miami'], ['Penn State', 'Michigan State'],
    ['Oklahoma', 'Texas Tech'], ['Tennessee', 'Kentucky'],
    ['Auburn', 'Mississippi State'], ['Iowa', 'Nebraska'],
  ];
  return teams.slice(0, gameCount).map(([home, away], i) =>
    gp(
      `w${weekNum}g${i + 1}`,
      home,
      away,
      Math.round((Math.random() * 20 + 1) * 2) / 2,
      home,
      +(0.5 + Math.random() * 0.45).toFixed(2),
      +(40 + Math.random() * 20).toFixed(1),
      +(0.6 + Math.random() * 0.3).toFixed(2),
      +(Math.random() * 0.45).toFixed(2),
      [factor('Simulated Factor', 0.3, 'neutral', 'Placeholder for full model output')],
    ),
  );
}

export const MOCK_WEEKLY_GAMES: Record<number, GamePrediction[]> = {
  1: week1Games,
  2: week2Games,
  3: week3Games,
  4: week4Games,
  5: week5Games,
  6: stubWeek(6, 10),
  7: stubWeek(7, 10),
  8: stubWeek(8, 10),
  9: stubWeek(9, 10),
  10: stubWeek(10, 10),
  11: stubWeek(11, 10),
  12: stubWeek(12, 10),
  13: stubWeek(13, 8),
  14: stubWeek(14, 8),
};

// ---------------------------------------------------------------------------
// Mock Game Results — Weeks 1-3
// ---------------------------------------------------------------------------

export const MOCK_GAME_RESULTS: Record<number, GameResult[]> = {
  1: [
    { gameId: 'w1g1', homeTeam: 'Alabama', awayTeam: 'Duke', homeScore: 42, awayScore: 13, actualSpread: 29, actualTotal: 55, wasUpset: false },
    { gameId: 'w1g2', homeTeam: 'Ohio State', awayTeam: 'Western Michigan', homeScore: 49, awayScore: 10, actualSpread: 39, actualTotal: 59, wasUpset: false },
    { gameId: 'w1g3', homeTeam: 'Georgia', awayTeam: 'Tennessee-Martin', homeScore: 56, awayScore: 0, actualSpread: 56, actualTotal: 56, wasUpset: false },
    { gameId: 'w1g4', homeTeam: 'USC', awayTeam: 'San Jose State', homeScore: 38, awayScore: 14, actualSpread: 24, actualTotal: 52, wasUpset: false },
    { gameId: 'w1g5', homeTeam: 'Texas', awayTeam: 'Rice', homeScore: 45, awayScore: 10, actualSpread: 35, actualTotal: 55, wasUpset: false },
    { gameId: 'w1g6', homeTeam: 'Oregon', awayTeam: 'Portland State', homeScore: 52, awayScore: 7, actualSpread: 45, actualTotal: 59, wasUpset: false },
    { gameId: 'w1g7', homeTeam: 'Michigan', awayTeam: 'Fresno State', homeScore: 24, awayScore: 17, actualSpread: 7, actualTotal: 41, wasUpset: false },
    { gameId: 'w1g8', homeTeam: 'Clemson', awayTeam: 'Appalachian State', homeScore: 21, awayScore: 24, actualSpread: -3, actualTotal: 45, wasUpset: true },
    { gameId: 'w1g9', homeTeam: 'LSU', awayTeam: 'Grambling State', homeScore: 48, awayScore: 3, actualSpread: 45, actualTotal: 51, wasUpset: false },
    { gameId: 'w1g10', homeTeam: 'Penn State', awayTeam: 'West Virginia', homeScore: 31, awayScore: 24, actualSpread: 7, actualTotal: 55, wasUpset: false },
  ],
  2: [
    { gameId: 'w2g1', homeTeam: 'Alabama', awayTeam: 'Texas', homeScore: 24, awayScore: 28, actualSpread: -4, actualTotal: 52, wasUpset: true },
    { gameId: 'w2g2', homeTeam: 'Notre Dame', awayTeam: 'Northern Illinois', homeScore: 35, awayScore: 10, actualSpread: 25, actualTotal: 45, wasUpset: false },
    { gameId: 'w2g3', homeTeam: 'Georgia', awayTeam: 'Kentucky', homeScore: 31, awayScore: 13, actualSpread: 18, actualTotal: 44, wasUpset: false },
    { gameId: 'w2g4', homeTeam: 'Ohio State', awayTeam: 'Oregon', homeScore: 28, awayScore: 35, actualSpread: -7, actualTotal: 63, wasUpset: true },
    { gameId: 'w2g5', homeTeam: 'Michigan', awayTeam: 'Texas A&M', homeScore: 20, awayScore: 17, actualSpread: 3, actualTotal: 37, wasUpset: false },
    { gameId: 'w2g6', homeTeam: 'USC', awayTeam: 'Stanford', homeScore: 42, awayScore: 21, actualSpread: 21, actualTotal: 63, wasUpset: false },
    { gameId: 'w2g7', homeTeam: 'Clemson', awayTeam: 'Florida State', homeScore: 17, awayScore: 24, actualSpread: -7, actualTotal: 41, wasUpset: true },
    { gameId: 'w2g8', homeTeam: 'Penn State', awayTeam: 'UCLA', homeScore: 34, awayScore: 14, actualSpread: 20, actualTotal: 48, wasUpset: false },
    { gameId: 'w2g9', homeTeam: 'Oklahoma', awayTeam: 'Houston', homeScore: 28, awayScore: 21, actualSpread: 7, actualTotal: 49, wasUpset: false },
    { gameId: 'w2g10', homeTeam: 'LSU', awayTeam: 'Mississippi State', homeScore: 35, awayScore: 17, actualSpread: 18, actualTotal: 52, wasUpset: false },
  ],
  3: [
    { gameId: 'w3g1', homeTeam: 'Georgia', awayTeam: 'South Carolina', homeScore: 28, awayScore: 14, actualSpread: 14, actualTotal: 42, wasUpset: false },
    { gameId: 'w3g2', homeTeam: 'Ohio State', awayTeam: 'Marshall', homeScore: 52, awayScore: 7, actualSpread: 45, actualTotal: 59, wasUpset: false },
    { gameId: 'w3g3', homeTeam: 'Texas', awayTeam: 'UTSA', homeScore: 41, awayScore: 14, actualSpread: 27, actualTotal: 55, wasUpset: false },
    { gameId: 'w3g4', homeTeam: 'USC', awayTeam: 'Michigan', homeScore: 27, awayScore: 24, actualSpread: 3, actualTotal: 51, wasUpset: false },
    { gameId: 'w3g5', homeTeam: 'Oregon', awayTeam: 'BYU', homeScore: 35, awayScore: 21, actualSpread: 14, actualTotal: 56, wasUpset: false },
    { gameId: 'w3g6', homeTeam: 'Alabama', awayTeam: 'Ole Miss', homeScore: 31, awayScore: 28, actualSpread: 3, actualTotal: 59, wasUpset: false },
    { gameId: 'w3g7', homeTeam: 'Penn State', awayTeam: 'Illinois', homeScore: 21, awayScore: 10, actualSpread: 11, actualTotal: 31, wasUpset: false },
    { gameId: 'w3g8', homeTeam: 'Clemson', awayTeam: 'NC State', homeScore: 14, awayScore: 17, actualSpread: -3, actualTotal: 31, wasUpset: true },
    { gameId: 'w3g9', homeTeam: 'Notre Dame', awayTeam: 'Purdue', homeScore: 38, awayScore: 14, actualSpread: 24, actualTotal: 52, wasUpset: false },
    { gameId: 'w3g10', homeTeam: 'LSU', awayTeam: 'Auburn', homeScore: 24, awayScore: 21, actualSpread: 3, actualTotal: 45, wasUpset: false },
  ],
};

// ---------------------------------------------------------------------------
// Core Engine Functions
// ---------------------------------------------------------------------------

export function createArenaState(seasonYear: number): PredictionArenaState {
  const week1 = MOCK_WEEKLY_GAMES[1] ?? [];
  return {
    currentWeek: {
      weekNumber: 1,
      seasonYear,
      games: week1,
      userPredictions: [],
      isLocked: false,
      resultsAvailable: false,
    },
    pastWeeks: [],
    seasonScore: 0,
    modelSeasonScore: 0,
    userRank: 0,
    modelAccuracy: {
      atsRecord: { wins: 0, losses: 0 },
      spreadMAE: 0,
      totalMAE: 0,
      upsetDetectionRate: 0,
      seasonAccuracy: 0,
    },
  };
}

export function loadWeek(
  state: PredictionArenaState,
  weekNumber: number,
): PredictionArenaState {
  const games = MOCK_WEEKLY_GAMES[weekNumber];
  if (!games) return state;

  const resultsAvailable = MOCK_GAME_RESULTS[weekNumber] !== undefined;

  return {
    ...state,
    currentWeek: {
      weekNumber,
      seasonYear: state.currentWeek?.seasonYear ?? new Date().getFullYear(),
      games,
      userPredictions: state.currentWeek?.weekNumber === weekNumber
        ? state.currentWeek.userPredictions
        : [],
      isLocked: resultsAvailable,
      resultsAvailable,
    },
  };
}

export function submitPrediction(
  state: PredictionArenaState,
  gameId: string,
  predictionType: UserPrediction['predictionType'],
  predictedValue: string | number,
): PredictionArenaState {
  if (!state.currentWeek) return state;
  if (state.currentWeek.isLocked) return state;

  const gameExists = state.currentWeek.games.some((g) => g.gameId === gameId);
  if (!gameExists) return state;

  const existingIndex = state.currentWeek.userPredictions.findIndex(
    (p) => p.gameId === gameId && p.predictionType === predictionType,
  );

  const prediction: UserPrediction = {
    userId: 'current-user',
    gameId,
    predictionType,
    predictedValue,
  };

  const updatedPredictions = [...state.currentWeek.userPredictions];
  if (existingIndex >= 0) {
    updatedPredictions[existingIndex] = prediction;
  } else {
    updatedPredictions.push(prediction);
  }

  return {
    ...state,
    currentWeek: {
      ...state.currentWeek,
      userPredictions: updatedPredictions,
    },
  };
}

export function lockWeek(state: PredictionArenaState): PredictionArenaState {
  if (!state.currentWeek) return state;

  return {
    ...state,
    currentWeek: {
      ...state.currentWeek,
      isLocked: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function determineWinner(result: GameResult): string {
  return result.homeScore >= result.awayScore ? result.homeTeam : result.awayTeam;
}

function scorePrediction(
  prediction: UserPrediction,
  result: GameResult,
  gamePrediction: GamePrediction | undefined,
  scoring: PredictionScoring,
): number {
  switch (prediction.predictionType) {
    case 'winner': {
      const winner = determineWinner(result);
      return String(prediction.predictedValue) === winner ? scoring.winner : 0;
    }
    case 'spread': {
      const predictedSpread = Number(prediction.predictedValue);
      return Math.abs(predictedSpread - result.actualSpread) <= 3 ? scoring.spread : 0;
    }
    case 'over_under': {
      const predictedDirection = String(prediction.predictedValue).toLowerCase();
      const modelTotal = gamePrediction?.predictions.total.value ?? 0;
      const actualWentOver = result.actualTotal > modelTotal;
      const userPredictedOver = predictedDirection === 'over';
      return userPredictedOver === actualWentOver ? scoring.overUnder : 0;
    }
    case 'upset': {
      const predictedUpset = String(prediction.predictedValue).toLowerCase() === 'true' ||
        prediction.predictedValue === true as unknown as string;
      if (predictedUpset && result.wasUpset) {
        const upsetProb = gamePrediction?.predictions.upset.probability ?? 1;
        return upsetProb < 0.35 ? scoring.upsetAlert : scoring.winner;
      }
      return 0;
    }
    case 'exact_score': {
      const parts = String(prediction.predictedValue).split('-').map(Number);
      if (parts.length === 2) {
        const [pHome, pAway] = parts;
        if (pHome === result.homeScore && pAway === result.awayScore) {
          return scoring.exactScore;
        }
      }
      return 0;
    }
    default:
      return 0;
  }
}

function scoreModelForGame(
  gamePrediction: GamePrediction,
  result: GameResult,
  scoring: PredictionScoring,
): number {
  let modelPoints = 0;

  // Winner
  const predictedFavored = gamePrediction.predictions.spread.favored;
  const actualWinner = determineWinner(result);
  if (predictedFavored === actualWinner) {
    modelPoints += scoring.winner;
  }

  // Spread
  const predictedSpread = gamePrediction.predictions.spread.value;
  // Model spread is absolute — convert to directional based on favored team
  const directedModelSpread = predictedFavored === result.homeTeam
    ? predictedSpread
    : -predictedSpread;
  if (Math.abs(directedModelSpread - result.actualSpread) <= 3) {
    modelPoints += scoring.spread;
  }

  // Over/Under
  const predictedTotal = gamePrediction.predictions.total.value;
  // Model doesn't pick "over/under" — it picks a total. Compare direction.
  // If model total > actual total, model effectively predicted "over" but actual was under.
  // Score model as correct if its total is on the same side as the actual.
  const modelPredictedOver = predictedTotal > 45; // baseline
  const actualOver = result.actualTotal > predictedTotal;
  // Simpler: did the actual total land within 3 of model prediction? Give credit.
  if (Math.abs(predictedTotal - result.actualTotal) <= 5) {
    modelPoints += scoring.overUnder;
  }

  // Upset detection
  if (result.wasUpset && gamePrediction.predictions.upset.isAlert) {
    modelPoints += scoring.upsetAlert;
  }

  return modelPoints;
}

// ---------------------------------------------------------------------------
// scoreWeek
// ---------------------------------------------------------------------------

export function scoreWeek(
  state: PredictionArenaState,
  weekNumber: number,
  results: GameResult[],
): PredictionArenaState {
  if (!state.currentWeek || state.currentWeek.weekNumber !== weekNumber) {
    return state;
  }

  const scoring = DEFAULT_SCORING;
  const gameLookup = new Map(state.currentWeek.games.map((g) => [g.gameId, g]));
  let weekUserScore = 0;
  let weekModelScore = 0;

  // Score user predictions
  const scoredPredictions: UserPrediction[] = state.currentWeek.userPredictions.map((pred) => {
    const result = results.find((r) => r.gameId === pred.gameId);
    if (!result) return { ...pred, pointsEarned: 0 };

    const gamePred = gameLookup.get(pred.gameId);
    const pts = scorePrediction(pred, result, gamePred, scoring);
    weekUserScore += pts;
    return { ...pred, pointsEarned: pts };
  });

  // Score model predictions
  let modelAtsWins = state.modelAccuracy.atsRecord.wins;
  let modelAtsLosses = state.modelAccuracy.atsRecord.losses;
  let spreadErrors: number[] = [];
  let totalErrors: number[] = [];
  let upsetCorrect = 0;
  let upsetTotal = 0;

  for (const result of results) {
    const gp = gameLookup.get(result.gameId);
    if (!gp) continue;

    weekModelScore += scoreModelForGame(gp, result, scoring);

    // Track model accuracy metrics
    const predictedFavored = gp.predictions.spread.favored;
    const actualWinner = determineWinner(result);
    if (predictedFavored === actualWinner) {
      modelAtsWins++;
    } else {
      modelAtsLosses++;
    }

    const directedModelSpread = predictedFavored === result.homeTeam
      ? gp.predictions.spread.value
      : -gp.predictions.spread.value;
    spreadErrors.push(Math.abs(directedModelSpread - result.actualSpread));
    totalErrors.push(Math.abs(gp.predictions.total.value - result.actualTotal));

    if (result.wasUpset) {
      upsetTotal++;
      if (gp.predictions.upset.isAlert) upsetCorrect++;
    }
  }

  const allSpreadErrors = [...spreadErrors];
  const allTotalErrors = [...totalErrors];

  const completedWeek: PredictionArenaWeek = {
    ...state.currentWeek,
    userPredictions: scoredPredictions,
    isLocked: true,
    resultsAvailable: true,
  };

  // Load next week
  const nextWeekNumber = weekNumber + 1;
  const nextGames = MOCK_WEEKLY_GAMES[nextWeekNumber];
  const nextWeek: PredictionArenaWeek | null = nextGames
    ? {
        weekNumber: nextWeekNumber,
        seasonYear: state.currentWeek.seasonYear,
        games: nextGames,
        userPredictions: [],
        isLocked: false,
        resultsAvailable: MOCK_GAME_RESULTS[nextWeekNumber] !== undefined,
      }
    : null;

  const newSeasonScore = state.seasonScore + weekUserScore;
  const newModelSeasonScore = state.modelSeasonScore + weekModelScore;
  const totalGamesTracked = modelAtsWins + modelAtsLosses;

  return {
    ...state,
    currentWeek: nextWeek,
    pastWeeks: [...state.pastWeeks, completedWeek],
    seasonScore: newSeasonScore,
    modelSeasonScore: newModelSeasonScore,
    userRank: newSeasonScore > newModelSeasonScore ? 1 : 2,
    modelAccuracy: {
      atsRecord: { wins: modelAtsWins, losses: modelAtsLosses },
      spreadMAE: allSpreadErrors.length
        ? +(allSpreadErrors.reduce((a, b) => a + b, 0) / allSpreadErrors.length).toFixed(1)
        : 0,
      totalMAE: allTotalErrors.length
        ? +(allTotalErrors.reduce((a, b) => a + b, 0) / allTotalErrors.length).toFixed(1)
        : 0,
      upsetDetectionRate: upsetTotal > 0
        ? +(upsetCorrect / upsetTotal).toFixed(2)
        : state.modelAccuracy.upsetDetectionRate,
      seasonAccuracy: totalGamesTracked > 0
        ? +(modelAtsWins / totalGamesTracked).toFixed(3)
        : 0,
    },
  };
}

// ---------------------------------------------------------------------------
// getWeekResults
// ---------------------------------------------------------------------------

export function getWeekResults(
  state: PredictionArenaState,
  weekNumber: number,
): {
  userScore: number;
  modelScore: number;
  predictions: Array<{
    prediction: UserPrediction;
    result: GameResult | undefined;
    gamePrediction: GamePrediction | undefined;
  }>;
} | null {
  const week = state.pastWeeks.find((w) => w.weekNumber === weekNumber);
  if (!week) return null;

  const results = MOCK_GAME_RESULTS[weekNumber] ?? [];
  const resultLookup = new Map(results.map((r) => [r.gameId, r]));
  const gameLookup = new Map(week.games.map((g) => [g.gameId, g]));

  const userScore = week.userPredictions.reduce(
    (sum, p) => sum + (p.pointsEarned ?? 0),
    0,
  );

  let modelScore = 0;
  for (const result of results) {
    const gPred = gameLookup.get(result.gameId);
    if (gPred) {
      modelScore += scoreModelForGame(gPred, result, DEFAULT_SCORING);
    }
  }

  const predictions = week.userPredictions.map((prediction) => ({
    prediction,
    result: resultLookup.get(prediction.gameId),
    gamePrediction: gameLookup.get(prediction.gameId),
  }));

  return { userScore, modelScore, predictions };
}

// ---------------------------------------------------------------------------
// getSeasonLeaderboard
// ---------------------------------------------------------------------------

export function getSeasonLeaderboard(
  state: PredictionArenaState,
): {
  entries: Array<{ name: string; score: number; isModel: boolean }>;
  weeksCompleted: number;
  modelAccuracy: ModelAccuracy;
} {
  const entries = [
    { name: 'You', score: state.seasonScore, isModel: false },
    { name: 'GridIron IQ Model', score: state.modelSeasonScore, isModel: true },
  ].sort((a, b) => b.score - a.score);

  return {
    entries,
    weeksCompleted: state.pastWeeks.length,
    modelAccuracy: state.modelAccuracy,
  };
}

// ---------------------------------------------------------------------------
// Prediction League Functions
// ---------------------------------------------------------------------------

export function createPredictionLeague(
  name: string,
  userId: string,
  username: string,
): PredictionLeague {
  return {
    id: `league-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    members: [{ userId, username, score: 0 }],
    seasonYear: new Date().getFullYear(),
    weekScores: {},
  };
}

export function joinPredictionLeague(
  league: PredictionLeague,
  userId: string,
  username: string,
): PredictionLeague {
  const alreadyMember = league.members.some((m) => m.userId === userId);
  if (alreadyMember) return league;

  return {
    ...league,
    members: [...league.members, { userId, username, score: 0 }],
  };
}

export function updateLeagueScores(
  league: PredictionLeague,
  weekNumber: number,
  scores: Record<string, number>,
): PredictionLeague {
  const updatedMembers = league.members.map((member) => {
    const weekScore = scores[member.userId] ?? 0;
    return { ...member, score: member.score + weekScore };
  });

  return {
    ...league,
    members: updatedMembers.sort((a, b) => b.score - a.score),
    weekScores: {
      ...league.weekScores,
      [weekNumber]: scores,
    },
  };
}
