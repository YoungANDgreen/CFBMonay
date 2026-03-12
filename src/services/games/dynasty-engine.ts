// ============================================================
// GridIron IQ — Dynasty Builder Game Engine
// ============================================================
// Build the greatest all-time roster from one college football
// program under a salary cap, then simulate head-to-head matchups.

import type {
  Position,
  Award,
  DynastyPlayer,
  DynastyRoster,
  DynastySlot,
  DynastyGameState,
  SimulationResult,
  SeasonStats,
  DraftInfo,
} from '@/types';

import {
  getPlayersByTeam,
  getPlayerStats,
  getDraftPicksByTeam,
  getAllTeams,
} from '@/services/data/cfbd-cache';

// --- Constants ---

export const SALARY_CAP = 100; // $100M

export const DYNASTY_SLOTS: DynastySlot[] = [
  { key: 'qb1', position: 'QB', label: 'QB 1' },
  { key: 'rb1', position: 'RB', label: 'RB 1' },
  { key: 'rb2', position: 'RB', label: 'RB 2' },
  { key: 'wr1', position: 'WR', label: 'WR 1' },
  { key: 'wr2', position: 'WR', label: 'WR 2' },
  { key: 'wr3', position: 'WR', label: 'WR 3' },
  { key: 'te1', position: 'TE', label: 'TE 1' },
  { key: 'ol1', position: 'OL', label: 'OL 1' },
  { key: 'ol2', position: 'OL', label: 'OL 2' },
  { key: 'ol3', position: 'OL', label: 'OL 3' },
  { key: 'ol4', position: 'OL', label: 'OL 4' },
  { key: 'ol5', position: 'OL', label: 'OL 5' },
  { key: 'dl1', position: 'DL', label: 'DL 1' },
  { key: 'dl2', position: 'DL', label: 'DL 2' },
  { key: 'dl3', position: 'DL', label: 'DL 3' },
  { key: 'dl4', position: 'DL', label: 'DL 4' },
  { key: 'lb1', position: 'LB', label: 'LB 1' },
  { key: 'lb2', position: 'LB', label: 'LB 2' },
  { key: 'lb3', position: 'LB', label: 'LB 3' },
  { key: 'db1', position: 'DB', label: 'DB 1' },
  { key: 'db2', position: 'DB', label: 'DB 2' },
  { key: 'db3', position: 'DB', label: 'DB 3' },
  { key: 'db4', position: 'DB', label: 'DB 4' },
  { key: 'k1', position: 'K', label: 'K 1' },
  { key: 'p1', position: 'P', label: 'P 1' },
];

// --- Cost Calculation ---

function getEraYear(seasons: string): number {
  const match = seasons.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : 2020;
}

export function calculatePlayerCost(player: Omit<DynastyPlayer, 'cost'>): number {
  const baseCost = player.compositeScore * 0.5;

  // Award multiplier — take the highest applicable
  let awardMultiplier = 1.0;
  if (player.awards.includes('Heisman')) {
    awardMultiplier = 2.0;
  } else if (player.awards.includes('All-American')) {
    awardMultiplier = 1.5;
  } else if (player.awards.length > 0) {
    awardMultiplier = 1.4;
  }

  // Draft multiplier
  let draftMultiplier = 1.0;
  if (player.draftInfo) {
    if (player.draftInfo.round === 1 && player.draftInfo.pick <= 10) {
      draftMultiplier = 1.3;
    } else if (player.draftInfo.round === 1) {
      draftMultiplier = 1.2;
    }
  }

  // Era discount
  const eraYear = getEraYear(player.seasons);
  const eraMultiplier = eraYear < 2000 ? 0.8 : 1.0;

  const finalCost = baseCost * awardMultiplier * draftMultiplier * eraMultiplier;
  return Math.round(finalCost * 10) / 10;
}

// --- Mock Player Data ---

function buildPlayer(
  partial: Omit<DynastyPlayer, 'cost'>
): DynastyPlayer {
  return {
    ...partial,
    cost: calculatePlayerCost(partial),
  };
}

const ALABAMA_PLAYERS_RAW: Omit<DynastyPlayer, 'cost'>[] = [
  // --- QBs ---
  {
    id: 'ala-tua',
    name: 'Tua Tagovailoa',
    position: 'QB',
    school: 'Alabama',
    seasons: '2017-2019',
    compositeScore: 9.5,
    stats: { gamesPlayed: 32, passingYards: 7442, passingTDs: 87, rushingYards: 340, rushingTDs: 3 },
    awards: ['Maxwell'],
    draftInfo: { year: 2020, round: 1, pick: 5, team: 'Miami Dolphins' },
  },
  {
    id: 'ala-namath',
    name: 'Joe Namath',
    position: 'QB',
    school: 'Alabama',
    seasons: '1962-1964',
    compositeScore: 9.0,
    stats: { gamesPlayed: 30, passingYards: 2713, passingTDs: 25, rushingYards: 160, rushingTDs: 7 },
    awards: ['All-American'],
    draftInfo: { year: 1965, round: 1, pick: 12, team: 'New York Jets' },
  },
  {
    id: 'ala-hurts',
    name: 'Jalen Hurts',
    position: 'QB',
    school: 'Alabama',
    seasons: '2016-2018',
    compositeScore: 8.5,
    stats: { gamesPlayed: 42, passingYards: 5626, passingTDs: 48, rushingYards: 1976, rushingTDs: 23 },
    awards: [],
    draftInfo: { year: 2020, round: 2, pick: 53, team: 'Philadelphia Eagles' },
  },
  {
    id: 'ala-bryce',
    name: 'Bryce Young',
    position: 'QB',
    school: 'Alabama',
    seasons: '2020-2022',
    compositeScore: 9.4,
    stats: { gamesPlayed: 40, passingYards: 8356, passingTDs: 80, rushingYards: 478, rushingTDs: 7 },
    awards: ['Heisman'],
    draftInfo: { year: 2023, round: 1, pick: 1, team: 'Carolina Panthers' },
  },
  // --- RBs ---
  {
    id: 'ala-henry',
    name: 'Derrick Henry',
    position: 'RB',
    school: 'Alabama',
    seasons: '2013-2015',
    compositeScore: 9.8,
    stats: { gamesPlayed: 41, rushingYards: 3591, rushingTDs: 42, receivingYards: 285, receivingTDs: 3 },
    awards: ['Heisman', 'Doak Walker'],
    draftInfo: { year: 2016, round: 2, pick: 45, team: 'Tennessee Titans' },
  },
  {
    id: 'ala-ingram',
    name: 'Mark Ingram',
    position: 'RB',
    school: 'Alabama',
    seasons: '2008-2010',
    compositeScore: 9.3,
    stats: { gamesPlayed: 40, rushingYards: 3261, rushingTDs: 42, receivingYards: 334, receivingTDs: 3 },
    awards: ['Heisman'],
    draftInfo: { year: 2011, round: 1, pick: 28, team: 'New Orleans Saints' },
  },
  {
    id: 'ala-harris',
    name: 'Najee Harris',
    position: 'RB',
    school: 'Alabama',
    seasons: '2017-2020',
    compositeScore: 9.0,
    stats: { gamesPlayed: 52, rushingYards: 3843, rushingTDs: 46, receivingYards: 781, receivingTDs: 11 },
    awards: ['Doak Walker'],
    draftInfo: { year: 2021, round: 1, pick: 24, team: 'Pittsburgh Steelers' },
  },
  {
    id: 'ala-lacy',
    name: 'Eddie Lacy',
    position: 'RB',
    school: 'Alabama',
    seasons: '2009-2012',
    compositeScore: 8.2,
    stats: { gamesPlayed: 52, rushingYards: 2402, rushingTDs: 28, receivingYards: 185, receivingTDs: 1 },
    awards: [],
    draftInfo: { year: 2013, round: 2, pick: 61, team: 'Green Bay Packers' },
  },
  // --- WRs ---
  {
    id: 'ala-julio',
    name: 'Julio Jones',
    position: 'WR',
    school: 'Alabama',
    seasons: '2008-2010',
    compositeScore: 9.6,
    stats: { gamesPlayed: 40, receivingYards: 2653, receivingTDs: 15, rushingYards: 64, rushingTDs: 0 },
    awards: ['All-American'],
    draftInfo: { year: 2011, round: 1, pick: 6, team: 'Atlanta Falcons' },
  },
  {
    id: 'ala-cooper',
    name: 'Amari Cooper',
    position: 'WR',
    school: 'Alabama',
    seasons: '2012-2014',
    compositeScore: 9.4,
    stats: { gamesPlayed: 40, receivingYards: 3463, receivingTDs: 31, rushingYards: 39, rushingTDs: 0 },
    awards: ['Biletnikoff', 'All-American'],
    draftInfo: { year: 2015, round: 1, pick: 4, team: 'Oakland Raiders' },
  },
  {
    id: 'ala-ridley',
    name: 'Calvin Ridley',
    position: 'WR',
    school: 'Alabama',
    seasons: '2015-2017',
    compositeScore: 8.8,
    stats: { gamesPlayed: 41, receivingYards: 2781, receivingTDs: 19, rushingYards: 12, rushingTDs: 0 },
    awards: [],
    draftInfo: { year: 2018, round: 1, pick: 26, team: 'Atlanta Falcons' },
  },
  {
    id: 'ala-jeudy',
    name: 'Jerry Jeudy',
    position: 'WR',
    school: 'Alabama',
    seasons: '2017-2019',
    compositeScore: 9.1,
    stats: { gamesPlayed: 40, receivingYards: 2742, receivingTDs: 26, rushingYards: 49, rushingTDs: 0 },
    awards: ['Biletnikoff'],
    draftInfo: { year: 2020, round: 1, pick: 15, team: 'Denver Broncos' },
  },
  {
    id: 'ala-smitty',
    name: 'DeVonta Smith',
    position: 'WR',
    school: 'Alabama',
    seasons: '2017-2020',
    compositeScore: 9.7,
    stats: { gamesPlayed: 53, receivingYards: 3965, receivingTDs: 46, rushingYards: 20, rushingTDs: 0 },
    awards: ['Heisman', 'Biletnikoff', 'All-American'],
    draftInfo: { year: 2021, round: 1, pick: 10, team: 'Philadelphia Eagles' },
  },
  // --- TE ---
  {
    id: 'ala-howard',
    name: 'O.J. Howard',
    position: 'TE',
    school: 'Alabama',
    seasons: '2013-2016',
    compositeScore: 8.8,
    stats: { gamesPlayed: 53, receivingYards: 1726, receivingTDs: 7 },
    awards: ['All-American'],
    draftInfo: { year: 2017, round: 1, pick: 19, team: 'Tampa Bay Buccaneers' },
  },
  {
    id: 'ala-hentges',
    name: 'Irv Smith Jr.',
    position: 'TE',
    school: 'Alabama',
    seasons: '2016-2018',
    compositeScore: 7.8,
    stats: { gamesPlayed: 43, receivingYards: 838, receivingTDs: 8 },
    awards: [],
    draftInfo: { year: 2019, round: 2, pick: 50, team: 'Minnesota Vikings' },
  },
  // --- OL ---
  {
    id: 'ala-thomas',
    name: 'Jedrick Wills',
    position: 'OL',
    school: 'Alabama',
    seasons: '2017-2019',
    compositeScore: 9.0,
    stats: { gamesPlayed: 40 },
    awards: ['All-American'],
    draftInfo: { year: 2020, round: 1, pick: 10, team: 'Cleveland Browns' },
  },
  {
    id: 'ala-leatherwood',
    name: 'Alex Leatherwood',
    position: 'OL',
    school: 'Alabama',
    seasons: '2017-2020',
    compositeScore: 8.6,
    stats: { gamesPlayed: 52 },
    awards: ['Outland', 'All-American'],
    draftInfo: { year: 2021, round: 1, pick: 17, team: 'Las Vegas Raiders' },
  },
  {
    id: 'ala-jonah',
    name: 'Jonah Williams',
    position: 'OL',
    school: 'Alabama',
    seasons: '2016-2018',
    compositeScore: 9.2,
    stats: { gamesPlayed: 43 },
    awards: ['All-American'],
    draftInfo: { year: 2019, round: 1, pick: 11, team: 'Cincinnati Bengals' },
  },
  {
    id: 'ala-fluker',
    name: 'D.J. Fluker',
    position: 'OL',
    school: 'Alabama',
    seasons: '2010-2012',
    compositeScore: 8.4,
    stats: { gamesPlayed: 41 },
    awards: ['All-American'],
    draftInfo: { year: 2013, round: 1, pick: 11, team: 'San Diego Chargers' },
  },
  {
    id: 'ala-warmack',
    name: 'Chance Warmack',
    position: 'OL',
    school: 'Alabama',
    seasons: '2009-2012',
    compositeScore: 8.9,
    stats: { gamesPlayed: 52 },
    awards: ['All-American'],
    draftInfo: { year: 2013, round: 1, pick: 10, team: 'Tennessee Titans' },
  },
  {
    id: 'ala-neal',
    name: 'Evan Neal',
    position: 'OL',
    school: 'Alabama',
    seasons: '2019-2021',
    compositeScore: 9.3,
    stats: { gamesPlayed: 40 },
    awards: ['All-American'],
    draftInfo: { year: 2022, round: 1, pick: 7, team: 'New York Giants' },
  },
  // --- DL ---
  {
    id: 'ala-anderson',
    name: 'Will Anderson Jr.',
    position: 'DL',
    school: 'Alabama',
    seasons: '2020-2022',
    compositeScore: 9.7,
    stats: { gamesPlayed: 42, tackles: 204, sacks: 34.5 },
    awards: ['Nagurski', 'Bednarik', 'All-American'],
    draftInfo: { year: 2023, round: 1, pick: 3, team: 'Houston Texans' },
  },
  {
    id: 'ala-quinnen',
    name: 'Quinnen Williams',
    position: 'DL',
    school: 'Alabama',
    seasons: '2016-2018',
    compositeScore: 9.4,
    stats: { gamesPlayed: 30, tackles: 71, sacks: 10 },
    awards: ['Outland', 'All-American'],
    draftInfo: { year: 2019, round: 1, pick: 3, team: 'New York Jets' },
  },
  {
    id: 'ala-marcell',
    name: 'Marcell Dareus',
    position: 'DL',
    school: 'Alabama',
    seasons: '2008-2010',
    compositeScore: 9.0,
    stats: { gamesPlayed: 39, tackles: 114, sacks: 11.5 },
    awards: ['All-American'],
    draftInfo: { year: 2011, round: 1, pick: 3, team: 'Buffalo Bills' },
  },
  {
    id: 'ala-jonathan-allen',
    name: 'Jonathan Allen',
    position: 'DL',
    school: 'Alabama',
    seasons: '2013-2016',
    compositeScore: 9.2,
    stats: { gamesPlayed: 52, tackles: 172, sacks: 28.5 },
    awards: ['Nagurski', 'Bednarik', 'All-American'],
    draftInfo: { year: 2017, round: 1, pick: 17, team: 'Washington Commanders' },
  },
  {
    id: 'ala-dalvin',
    name: "Da'Ron Payne",
    position: 'DL',
    school: 'Alabama',
    seasons: '2015-2017',
    compositeScore: 8.5,
    stats: { gamesPlayed: 42, tackles: 98, sacks: 4.5 },
    awards: [],
    draftInfo: { year: 2018, round: 1, pick: 13, team: 'Washington Commanders' },
  },
  // --- LBs ---
  {
    id: 'ala-dleejr',
    name: 'Dont\'a Hightower',
    position: 'LB',
    school: 'Alabama',
    seasons: '2008-2011',
    compositeScore: 9.0,
    stats: { gamesPlayed: 52, tackles: 235, sacks: 8.5 },
    awards: ['All-American'],
    draftInfo: { year: 2012, round: 1, pick: 25, team: 'New England Patriots' },
  },
  {
    id: 'ala-cj',
    name: 'C.J. Mosley',
    position: 'LB',
    school: 'Alabama',
    seasons: '2010-2013',
    compositeScore: 9.3,
    stats: { gamesPlayed: 54, tackles: 312, sacks: 5.5, interceptions: 6 },
    awards: ['Butkus', 'All-American'],
    draftInfo: { year: 2014, round: 1, pick: 17, team: 'Baltimore Ravens' },
  },
  {
    id: 'ala-reuben',
    name: 'Reuben Foster',
    position: 'LB',
    school: 'Alabama',
    seasons: '2013-2016',
    compositeScore: 9.1,
    stats: { gamesPlayed: 50, tackles: 233, sacks: 5 },
    awards: ['Butkus', 'All-American'],
    draftInfo: { year: 2017, round: 1, pick: 31, team: 'San Francisco 49ers' },
  },
  {
    id: 'ala-dlee',
    name: 'Derrick Thomas',
    position: 'LB',
    school: 'Alabama',
    seasons: '1985-1988',
    compositeScore: 9.8,
    stats: { gamesPlayed: 44, tackles: 258, sacks: 52 },
    awards: ['Butkus', 'All-American'],
    draftInfo: { year: 1989, round: 1, pick: 4, team: 'Kansas City Chiefs' },
  },
  // --- DBs ---
  {
    id: 'ala-minkah',
    name: 'Minkah Fitzpatrick',
    position: 'DB',
    school: 'Alabama',
    seasons: '2015-2017',
    compositeScore: 9.5,
    stats: { gamesPlayed: 43, tackles: 161, interceptions: 9 },
    awards: ['Thorpe', 'All-American'],
    draftInfo: { year: 2018, round: 1, pick: 11, team: 'Miami Dolphins' },
  },
  {
    id: 'ala-haha',
    name: 'Ha Ha Clinton-Dix',
    position: 'S',
    school: 'Alabama',
    seasons: '2011-2013',
    compositeScore: 8.6,
    stats: { gamesPlayed: 40, tackles: 118, interceptions: 6 },
    awards: ['All-American'],
    draftInfo: { year: 2014, round: 1, pick: 21, team: 'Green Bay Packers' },
  },
  {
    id: 'ala-eddie',
    name: 'Eddie Jackson',
    position: 'S',
    school: 'Alabama',
    seasons: '2013-2016',
    compositeScore: 8.4,
    stats: { gamesPlayed: 46, tackles: 127, interceptions: 8 },
    awards: ['All-American'],
    draftInfo: { year: 2017, round: 4, pick: 112, team: 'Chicago Bears' },
  },
  {
    id: 'ala-patrick',
    name: 'Patrick Surtain II',
    position: 'CB',
    school: 'Alabama',
    seasons: '2018-2020',
    compositeScore: 9.3,
    stats: { gamesPlayed: 40, tackles: 116, interceptions: 4 },
    awards: ['Thorpe', 'All-American'],
    draftInfo: { year: 2021, round: 1, pick: 9, team: 'Denver Broncos' },
  },
  {
    id: 'ala-marlon',
    name: 'Marlon Humphrey',
    position: 'CB',
    school: 'Alabama',
    seasons: '2014-2016',
    compositeScore: 8.8,
    stats: { gamesPlayed: 42, tackles: 96, interceptions: 3 },
    awards: ['All-American'],
    draftInfo: { year: 2017, round: 1, pick: 16, team: 'Baltimore Ravens' },
  },
  // --- K ---
  {
    id: 'ala-reichard',
    name: 'Will Reichard',
    position: 'K',
    school: 'Alabama',
    seasons: '2019-2023',
    compositeScore: 8.5,
    stats: { gamesPlayed: 62 },
    awards: ['All-American'],
  },
  // --- P ---
  {
    id: 'ala-jk-scott',
    name: 'JK Scott',
    position: 'P',
    school: 'Alabama',
    seasons: '2014-2017',
    compositeScore: 8.0,
    stats: { gamesPlayed: 55 },
    awards: ['All-American'],
    draftInfo: { year: 2018, round: 5, pick: 172, team: 'Green Bay Packers' },
  },
];

const OHIO_STATE_PLAYERS_RAW: Omit<DynastyPlayer, 'cost'>[] = [
  // --- QBs ---
  {
    id: 'osu-fields',
    name: 'Justin Fields',
    position: 'QB',
    school: 'Ohio State',
    seasons: '2019-2020',
    compositeScore: 9.3,
    stats: { gamesPlayed: 22, passingYards: 5373, passingTDs: 63, rushingYards: 867, rushingTDs: 15 },
    awards: ['All-American'],
    draftInfo: { year: 2021, round: 1, pick: 11, team: 'Chicago Bears' },
  },
  {
    id: 'osu-stroud',
    name: 'C.J. Stroud',
    position: 'QB',
    school: 'Ohio State',
    seasons: '2020-2022',
    compositeScore: 9.5,
    stats: { gamesPlayed: 33, passingYards: 8123, passingTDs: 85, rushingYards: -6, rushingTDs: 1 },
    awards: ['All-American'],
    draftInfo: { year: 2023, round: 1, pick: 2, team: 'Houston Texans' },
  },
  {
    id: 'osu-haskins',
    name: 'Dwayne Haskins',
    position: 'QB',
    school: 'Ohio State',
    seasons: '2016-2018',
    compositeScore: 8.8,
    stats: { gamesPlayed: 22, passingYards: 5396, passingTDs: 54, rushingYards: 108, rushingTDs: 4 },
    awards: ['All-American'],
    draftInfo: { year: 2019, round: 1, pick: 15, team: 'Washington Commanders' },
  },
  {
    id: 'osu-troy',
    name: 'Troy Smith',
    position: 'QB',
    school: 'Ohio State',
    seasons: '2003-2006',
    compositeScore: 9.0,
    stats: { gamesPlayed: 39, passingYards: 5720, passingTDs: 54, rushingYards: 1168, rushingTDs: 14 },
    awards: ['Heisman'],
    draftInfo: { year: 2007, round: 5, pick: 174, team: 'Baltimore Ravens' },
  },
  {
    id: 'osu-hopalong',
    name: 'Howard "Hopalong" Cassady',
    position: 'QB',
    school: 'Ohio State',
    seasons: '1952-1955',
    compositeScore: 9.2,
    stats: { gamesPlayed: 36, rushingYards: 2466, rushingTDs: 37, totalTouchdowns: 37 },
    awards: ['Heisman'],
    draftInfo: { year: 1956, round: 1, pick: 3, team: 'Detroit Lions' },
  },
  // --- RBs ---
  {
    id: 'osu-zeke',
    name: 'Ezekiel Elliott',
    position: 'RB',
    school: 'Ohio State',
    seasons: '2013-2015',
    compositeScore: 9.6,
    stats: { gamesPlayed: 41, rushingYards: 3961, rushingTDs: 43, receivingYards: 399, receivingTDs: 5 },
    awards: ['All-American'],
    draftInfo: { year: 2016, round: 1, pick: 4, team: 'Dallas Cowboys' },
  },
  {
    id: 'osu-archie',
    name: 'Archie Griffin',
    position: 'RB',
    school: 'Ohio State',
    seasons: '1972-1975',
    compositeScore: 9.9,
    stats: { gamesPlayed: 48, rushingYards: 5589, rushingTDs: 26 },
    awards: ['Heisman'],
    draftInfo: { year: 1976, round: 1, pick: 24, team: 'Cincinnati Bengals' },
  },
  {
    id: 'osu-eddie',
    name: 'Eddie George',
    position: 'RB',
    school: 'Ohio State',
    seasons: '1992-1995',
    compositeScore: 9.5,
    stats: { gamesPlayed: 47, rushingYards: 3768, rushingTDs: 44, receivingYards: 417, receivingTDs: 4 },
    awards: ['Heisman', 'Doak Walker'],
    draftInfo: { year: 1996, round: 1, pick: 14, team: 'Houston Oilers' },
  },
  {
    id: 'osu-jk',
    name: 'J.K. Dobbins',
    position: 'RB',
    school: 'Ohio State',
    seasons: '2017-2019',
    compositeScore: 9.0,
    stats: { gamesPlayed: 42, rushingYards: 4459, rushingTDs: 38, receivingYards: 455, receivingTDs: 5 },
    awards: ['All-American'],
    draftInfo: { year: 2020, round: 2, pick: 55, team: 'Baltimore Ravens' },
  },
  // --- WRs ---
  {
    id: 'osu-olave',
    name: 'Chris Olave',
    position: 'WR',
    school: 'Ohio State',
    seasons: '2018-2021',
    compositeScore: 9.2,
    stats: { gamesPlayed: 47, receivingYards: 2711, receivingTDs: 35 },
    awards: ['Biletnikoff', 'All-American'],
    draftInfo: { year: 2022, round: 1, pick: 11, team: 'New Orleans Saints' },
  },
  {
    id: 'osu-wilson',
    name: 'Garrett Wilson',
    position: 'WR',
    school: 'Ohio State',
    seasons: '2019-2021',
    compositeScore: 9.3,
    stats: { gamesPlayed: 35, receivingYards: 2213, receivingTDs: 23 },
    awards: ['Biletnikoff', 'All-American'],
    draftInfo: { year: 2022, round: 1, pick: 10, team: 'New York Jets' },
  },
  {
    id: 'osu-thomas',
    name: 'Michael Thomas',
    position: 'WR',
    school: 'Ohio State',
    seasons: '2012-2015',
    compositeScore: 8.6,
    stats: { gamesPlayed: 48, receivingYards: 1602, receivingTDs: 18 },
    awards: [],
    draftInfo: { year: 2016, round: 2, pick: 47, team: 'New Orleans Saints' },
  },
  {
    id: 'osu-terry',
    name: 'Terry McLaurin',
    position: 'WR',
    school: 'Ohio State',
    seasons: '2015-2018',
    compositeScore: 8.4,
    stats: { gamesPlayed: 52, receivingYards: 1251, receivingTDs: 19 },
    awards: [],
    draftInfo: { year: 2019, round: 3, pick: 76, team: 'Washington Commanders' },
  },
  {
    id: 'osu-jaxon',
    name: 'Jaxon Smith-Njigba',
    position: 'WR',
    school: 'Ohio State',
    seasons: '2020-2022',
    compositeScore: 9.0,
    stats: { gamesPlayed: 30, receivingYards: 2270, receivingTDs: 10 },
    awards: ['All-American'],
    draftInfo: { year: 2023, round: 1, pick: 20, team: 'Seattle Seahawks' },
  },
  // --- TE ---
  {
    id: 'osu-njoku',
    name: 'David Njoku',
    position: 'TE',
    school: 'Ohio State',
    seasons: '2014-2016',
    compositeScore: 8.0,
    stats: { gamesPlayed: 34, receivingYards: 526, receivingTDs: 8 },
    awards: [],
    draftInfo: { year: 2017, round: 1, pick: 29, team: 'Cleveland Browns' },
  },
  {
    id: 'osu-ruckert',
    name: 'Jeremy Ruckert',
    position: 'TE',
    school: 'Ohio State',
    seasons: '2018-2021',
    compositeScore: 7.5,
    stats: { gamesPlayed: 48, receivingYards: 615, receivingTDs: 12 },
    awards: [],
    draftInfo: { year: 2022, round: 3, pick: 101, team: 'New York Jets' },
  },
  // --- OL ---
  {
    id: 'osu-orlando',
    name: 'Orlando Pace',
    position: 'OL',
    school: 'Ohio State',
    seasons: '1994-1996',
    compositeScore: 9.9,
    stats: { gamesPlayed: 36 },
    awards: ['Outland', 'All-American'],
    draftInfo: { year: 1997, round: 1, pick: 1, team: 'St. Louis Rams' },
  },
  {
    id: 'osu-munoz',
    name: 'Jim Parker',
    position: 'OL',
    school: 'Ohio State',
    seasons: '1953-1956',
    compositeScore: 9.5,
    stats: { gamesPlayed: 36 },
    awards: ['Outland', 'All-American'],
    draftInfo: { year: 1957, round: 1, pick: 8, team: 'Baltimore Colts' },
  },
  {
    id: 'osu-wyatt',
    name: 'Wyatt Davis',
    position: 'OL',
    school: 'Ohio State',
    seasons: '2018-2020',
    compositeScore: 8.8,
    stats: { gamesPlayed: 33 },
    awards: ['All-American'],
    draftInfo: { year: 2021, round: 3, pick: 86, team: 'Minnesota Vikings' },
  },
  {
    id: 'osu-thayer',
    name: 'Thayer Munford',
    position: 'OL',
    school: 'Ohio State',
    seasons: '2018-2021',
    compositeScore: 8.4,
    stats: { gamesPlayed: 50 },
    awards: ['All-American'],
    draftInfo: { year: 2022, round: 7, pick: 238, team: 'Las Vegas Raiders' },
  },
  {
    id: 'osu-kobie',
    name: 'Kobie Turner',
    position: 'OL',
    school: 'Ohio State',
    seasons: '2017-2020',
    compositeScore: 7.8,
    stats: { gamesPlayed: 40 },
    awards: [],
  },
  {
    id: 'osu-paris',
    name: 'Paris Johnson Jr.',
    position: 'OL',
    school: 'Ohio State',
    seasons: '2020-2022',
    compositeScore: 9.2,
    stats: { gamesPlayed: 38 },
    awards: ['All-American'],
    draftInfo: { year: 2023, round: 1, pick: 6, team: 'Arizona Cardinals' },
  },
  // --- DL ---
  {
    id: 'osu-bosa-nick',
    name: 'Nick Bosa',
    position: 'DL',
    school: 'Ohio State',
    seasons: '2016-2018',
    compositeScore: 9.8,
    stats: { gamesPlayed: 29, tackles: 77, sacks: 17.5 },
    awards: ['All-American'],
    draftInfo: { year: 2019, round: 1, pick: 2, team: 'San Francisco 49ers' },
  },
  {
    id: 'osu-bosa-joey',
    name: 'Joey Bosa',
    position: 'DL',
    school: 'Ohio State',
    seasons: '2013-2015',
    compositeScore: 9.6,
    stats: { gamesPlayed: 36, tackles: 143, sacks: 26 },
    awards: ['Nagurski', 'All-American'],
    draftInfo: { year: 2016, round: 1, pick: 3, team: 'San Diego Chargers' },
  },
  {
    id: 'osu-chase-young',
    name: 'Chase Young',
    position: 'DL',
    school: 'Ohio State',
    seasons: '2017-2019',
    compositeScore: 9.9,
    stats: { gamesPlayed: 34, tackles: 98, sacks: 30.5 },
    awards: ['Nagurski', 'Bednarik', 'All-American'],
    draftInfo: { year: 2020, round: 1, pick: 2, team: 'Washington Commanders' },
  },
  {
    id: 'osu-hubbard',
    name: 'Sam Hubbard',
    position: 'DL',
    school: 'Ohio State',
    seasons: '2014-2017',
    compositeScore: 8.4,
    stats: { gamesPlayed: 50, tackles: 116, sacks: 13.5 },
    awards: [],
    draftInfo: { year: 2018, round: 3, pick: 77, team: 'Cincinnati Bengals' },
  },
  {
    id: 'osu-dre-mont',
    name: 'Dre\'Mont Jones',
    position: 'DL',
    school: 'Ohio State',
    seasons: '2015-2018',
    compositeScore: 8.6,
    stats: { gamesPlayed: 50, tackles: 98, sacks: 13 },
    awards: ['All-American'],
    draftInfo: { year: 2019, round: 3, pick: 71, team: 'Denver Broncos' },
  },
  // --- LBs ---
  {
    id: 'osu-spielman',
    name: 'Chris Spielman',
    position: 'LB',
    school: 'Ohio State',
    seasons: '1984-1987',
    compositeScore: 9.6,
    stats: { gamesPlayed: 48, tackles: 546, sacks: 4, interceptions: 11 },
    awards: ['All-American'],
    draftInfo: { year: 1988, round: 2, pick: 29, team: 'Detroit Lions' },
  },
  {
    id: 'osu-aj-hawk',
    name: 'A.J. Hawk',
    position: 'LB',
    school: 'Ohio State',
    seasons: '2002-2005',
    compositeScore: 9.0,
    stats: { gamesPlayed: 50, tackles: 394, sacks: 16, interceptions: 2 },
    awards: ['Butkus', 'All-American'],
    draftInfo: { year: 2006, round: 1, pick: 5, team: 'Green Bay Packers' },
  },
  {
    id: 'osu-james-laurinaitis',
    name: 'James Laurinaitis',
    position: 'LB',
    school: 'Ohio State',
    seasons: '2005-2008',
    compositeScore: 9.3,
    stats: { gamesPlayed: 52, tackles: 375, sacks: 6.5, interceptions: 10 },
    awards: ['Butkus', 'Nagurski', 'All-American'],
    draftInfo: { year: 2009, round: 2, pick: 35, team: 'St. Louis Rams' },
  },
  {
    id: 'osu-jerome-baker',
    name: 'Jerome Baker',
    position: 'LB',
    school: 'Ohio State',
    seasons: '2015-2017',
    compositeScore: 8.2,
    stats: { gamesPlayed: 40, tackles: 177, sacks: 4.5, interceptions: 2 },
    awards: [],
    draftInfo: { year: 2018, round: 3, pick: 73, team: 'Miami Dolphins' },
  },
  // --- DBs ---
  {
    id: 'osu-jack-tatum',
    name: 'Jack Tatum',
    position: 'DB',
    school: 'Ohio State',
    seasons: '1968-1970',
    compositeScore: 9.5,
    stats: { gamesPlayed: 33, tackles: 187, interceptions: 7 },
    awards: ['All-American'],
    draftInfo: { year: 1971, round: 1, pick: 19, team: 'Oakland Raiders' },
  },
  {
    id: 'osu-ward',
    name: 'Denzel Ward',
    position: 'CB',
    school: 'Ohio State',
    seasons: '2015-2017',
    compositeScore: 9.1,
    stats: { gamesPlayed: 36, tackles: 64, interceptions: 2 },
    awards: ['All-American'],
    draftInfo: { year: 2018, round: 1, pick: 4, team: 'Cleveland Browns' },
  },
  {
    id: 'osu-okudah',
    name: 'Jeff Okudah',
    position: 'CB',
    school: 'Ohio State',
    seasons: '2017-2019',
    compositeScore: 9.0,
    stats: { gamesPlayed: 36, tackles: 88, interceptions: 3 },
    awards: ['All-American'],
    draftInfo: { year: 2020, round: 1, pick: 3, team: 'Detroit Lions' },
  },
  {
    id: 'osu-malik-hooker',
    name: 'Malik Hooker',
    position: 'S',
    school: 'Ohio State',
    seasons: '2014-2016',
    compositeScore: 9.0,
    stats: { gamesPlayed: 31, tackles: 64, interceptions: 7 },
    awards: ['All-American'],
    draftInfo: { year: 2017, round: 1, pick: 15, team: 'Indianapolis Colts' },
  },
  {
    id: 'osu-vonn-bell',
    name: 'Vonn Bell',
    position: 'S',
    school: 'Ohio State',
    seasons: '2013-2015',
    compositeScore: 8.5,
    stats: { gamesPlayed: 42, tackles: 162, interceptions: 5 },
    awards: ['All-American'],
    draftInfo: { year: 2016, round: 2, pick: 61, team: 'New Orleans Saints' },
  },
  // --- K ---
  {
    id: 'osu-nugent',
    name: 'Mike Nugent',
    position: 'K',
    school: 'Ohio State',
    seasons: '2001-2004',
    compositeScore: 8.8,
    stats: { gamesPlayed: 50 },
    awards: ['All-American'],
    draftInfo: { year: 2005, round: 2, pick: 47, team: 'New York Jets' },
  },
  // --- P ---
  {
    id: 'osu-chrisman',
    name: 'Drue Chrisman',
    position: 'P',
    school: 'Ohio State',
    seasons: '2017-2021',
    compositeScore: 7.8,
    stats: { gamesPlayed: 55 },
    awards: ['All-American'],
  },
];

// --- Build players with calculated costs at module level ---

const PROGRAM_PLAYERS: Record<string, DynastyPlayer[]> = {
  'Alabama': ALABAMA_PLAYERS_RAW.map(buildPlayer),
  'Ohio State': OHIO_STATE_PLAYERS_RAW.map(buildPlayer),
};

// --- Cache-Backed Dynasty Player Loading ---

let _cacheLoadedPrograms: Record<string, DynastyPlayer[]> = {};
let _cacheInitialized = false;

/**
 * Map a position string from the cache to a valid dynasty Position.
 * Consolidates sub-positions (CB, S -> DB, DE/DT -> DL, etc.)
 */
function mapCachePosition(pos: string): Position {
  const upper = pos.toUpperCase();
  if (['CB', 'S', 'FS', 'SS'].includes(upper)) return 'DB';
  if (['DE', 'DT', 'NT'].includes(upper)) return 'DL';
  if (['OT', 'OG', 'C', 'G', 'T'].includes(upper)) return 'OL';
  if (['ILB', 'OLB', 'MLB'].includes(upper)) return 'LB';
  if (['QB', 'RB', 'WR', 'TE', 'K', 'P', 'DL', 'LB', 'DB', 'OL'].includes(upper)) return upper as Position;
  return 'DB'; // fallback for unknown positions
}

/**
 * Load dynasty players for a given program from the cache.
 * Falls back to the hardcoded PROGRAM_PLAYERS for that school.
 */
async function loadProgramFromCache(program: string): Promise<DynastyPlayer[]> {
  if (_cacheLoadedPrograms[program]) return _cacheLoadedPrograms[program];

  try {
    const [players, draftPicks] = await Promise.all([
      getPlayersByTeam(program),
      getDraftPicksByTeam(program),
    ]);

    if (!players || players.length === 0) {
      return PROGRAM_PLAYERS[program] ?? [];
    }

    // Build a draft info lookup by player name
    const draftByName = new Map(
      (draftPicks ?? []).filter(d => d.name).map(d => [d.name.toLowerCase(), d])
    );

    const dynastyPlayers: Omit<DynastyPlayer, 'cost'>[] = [];

    for (const player of players) {
      const position = mapCachePosition(player.position);
      const fullName = `${player.firstName} ${player.lastName}`;
      const draft = draftByName.get(fullName.toLowerCase());

      // Try to get stats for composite scoring
      let stats: Record<string, number> & { gamesPlayed: number } = { gamesPlayed: 12 };
      let compositeScore = 7.0; // default
      try {
        const playerStatsList = getPlayerStats(player.id);
        if (playerStatsList && playerStatsList.length > 0) {
          const ps = playerStatsList[0];
          // Build stats record from flat properties
          if (ps.passingYards !== undefined) stats['passingYards'] = ps.passingYards;
          if (ps.passingTDs !== undefined) stats['passingTDs'] = ps.passingTDs;
          if (ps.rushingYards !== undefined) stats['rushingYards'] = ps.rushingYards;
          if (ps.rushingTDs !== undefined) stats['rushingTDs'] = ps.rushingTDs;
          if (ps.receivingYards !== undefined) stats['receivingYards'] = ps.receivingYards;
          if (ps.receivingTDs !== undefined) stats['receivingTDs'] = ps.receivingTDs;
          // Estimate composite from stats — higher stats = higher score
          const totalYards = (stats['rushingYards'] ?? 0) + (stats['passingYards'] ?? 0);
          const tds = (stats['rushingTDs'] ?? 0) + (stats['passingTDs'] ?? 0);
          compositeScore = Math.min(10, 6.0 + totalYards / 3000 + tds / 15);
        }
      } catch {
        // use default composite
      }

      const awards: Award[] = [];
      const draftInfo: DraftInfo | undefined = draft
        ? { year: 0, round: draft.round, pick: draft.pick, team: draft.nflTeam }
        : undefined;

      // Boost composite for high draft picks
      if (draftInfo) {
        if (draftInfo.round === 1 && draftInfo.pick <= 10) compositeScore = Math.min(10, compositeScore + 1.0);
        else if (draftInfo.round === 1) compositeScore = Math.min(10, compositeScore + 0.5);
      }

      compositeScore = Math.round(compositeScore * 10) / 10;

      dynastyPlayers.push({
        id: `cache-${program.toLowerCase().replace(/\s+/g, '-')}-${player.id}`,
        name: fullName,
        position,
        school: program,
        seasons: player.year ?? 'Unknown',
        compositeScore,
        stats,
        awards,
        draftInfo,
      });
    }

    if (dynastyPlayers.length > 0) {
      _cacheLoadedPrograms[program] = dynastyPlayers.map(buildPlayer);
      return _cacheLoadedPrograms[program];
    }
  } catch {
    // fall through to hardcoded
  }

  return PROGRAM_PLAYERS[program] ?? [];
}

/**
 * Initialize all available programs from the cache.
 * After this, getAvailablePrograms() and getPlayersForProgram() will include
 * all teams with cached player data.
 */
export async function initDynastyFromCache(): Promise<void> {
  if (_cacheInitialized) return;

  try {
    const teams = await getAllTeams();
    if (teams && teams.length > 0) {
      // Pre-load the hardcoded programs first
      for (const program of Object.keys(PROGRAM_PLAYERS)) {
        if (!_cacheLoadedPrograms[program]) {
          const cached = await loadProgramFromCache(program);
          if (cached.length > 0) {
            _cacheLoadedPrograms[program] = cached;
          }
        }
      }

      // Mark known teams as available (they'll lazy-load on access)
      for (const team of teams) {
        if (!_cacheLoadedPrograms[team.school] && !PROGRAM_PLAYERS[team.school]) {
          // Store a sentinel — will be loaded on demand
          _cacheLoadedPrograms[team.school] = [];
        }
      }
    }
  } catch {
    // cache unavailable, use hardcoded only
  }

  _cacheInitialized = true;
}

// --- Public API ---

export function getAvailablePrograms(): string[] {
  // Merge hardcoded and cache-loaded program names
  const programs = new Set([
    ...Object.keys(PROGRAM_PLAYERS),
    ...Object.keys(_cacheLoadedPrograms),
  ]);
  return Array.from(programs).sort();
}

export function getPlayersForProgram(program: string): DynastyPlayer[] {
  // Try cache first, then hardcoded
  if (_cacheLoadedPrograms[program] && _cacheLoadedPrograms[program].length > 0) {
    return _cacheLoadedPrograms[program];
  }
  return PROGRAM_PLAYERS[program] ?? [];
}

/**
 * Async version that will lazy-load from cache if needed.
 */
export async function getPlayersForProgramAsync(program: string): Promise<DynastyPlayer[]> {
  // If already loaded and non-empty, return immediately
  if (_cacheLoadedPrograms[program] && _cacheLoadedPrograms[program].length > 0) {
    return _cacheLoadedPrograms[program];
  }

  // Try loading from cache
  const cached = await loadProgramFromCache(program);
  if (cached.length > 0) return cached;

  // Fall back to hardcoded
  return PROGRAM_PLAYERS[program] ?? [];
}

export function createDynastyRoster(program: string): DynastyRoster {
  const players: Record<string, DynastyPlayer | null> = {};
  for (const slot of DYNASTY_SLOTS) {
    players[slot.key] = null;
  }

  return {
    program,
    players,
    totalCost: 0,
    salaryCap: SALARY_CAP,
  };
}

// --- Position Compatibility ---

const DB_POSITIONS: Set<Position> = new Set(['DB', 'CB', 'S']);

function isPositionCompatible(slotPosition: Position, playerPosition: Position): boolean {
  if (slotPosition === 'DB') {
    return DB_POSITIONS.has(playerPosition);
  }
  return slotPosition === playerPosition;
}

// --- Roster Management ---

export function addPlayerToRoster(
  roster: DynastyRoster,
  slotKey: string,
  player: DynastyPlayer
): DynastyRoster | { error: string } {
  // Find the slot definition
  const slot = DYNASTY_SLOTS.find(s => s.key === slotKey);
  if (!slot) {
    return { error: `Invalid slot key: ${slotKey}` };
  }

  // Validate position match
  if (!isPositionCompatible(slot.position, player.position)) {
    return {
      error: `Cannot place ${player.position} in ${slot.position} slot. Position mismatch.`,
    };
  }

  // Validate no duplicate player on roster
  for (const [key, rostered] of Object.entries(roster.players)) {
    if (rostered && rostered.id === player.id && key !== slotKey) {
      return { error: `${player.name} is already on the roster in slot ${key}.` };
    }
  }

  // Calculate new total cost (subtract current occupant if any, add new player)
  const currentOccupant = roster.players[slotKey];
  const currentOccupantCost = currentOccupant ? currentOccupant.cost : 0;
  const newTotalCost = roster.totalCost - currentOccupantCost + player.cost;

  // Validate salary cap
  if (newTotalCost > SALARY_CAP) {
    const remaining = SALARY_CAP - roster.totalCost + currentOccupantCost;
    return {
      error: `Adding ${player.name} ($${player.cost}M) exceeds salary cap. Remaining budget: $${Math.round(remaining * 10) / 10}M.`,
    };
  }

  return {
    ...roster,
    players: {
      ...roster.players,
      [slotKey]: player,
    },
    totalCost: Math.round(newTotalCost * 10) / 10,
  };
}

export function removePlayerFromRoster(
  roster: DynastyRoster,
  slotKey: string
): DynastyRoster {
  const currentOccupant = roster.players[slotKey];
  if (!currentOccupant) return roster;

  return {
    ...roster,
    players: {
      ...roster.players,
      [slotKey]: null,
    },
    totalCost: Math.round((roster.totalCost - currentOccupant.cost) * 10) / 10,
  };
}

export function isRosterComplete(roster: DynastyRoster): boolean {
  return DYNASTY_SLOTS.every(slot => roster.players[slot.key] !== null);
}

// --- Simulation ---

function calculateRosterRating(roster: DynastyRoster): number {
  let totalRating = 0;
  let filledSlots = 0;

  for (const slot of DYNASTY_SLOTS) {
    const player = roster.players[slot.key];
    if (player) {
      totalRating += player.compositeScore;
      filledSlots++;
    }
  }

  if (filledSlots === 0) return 0;

  // Average composite score weighted by roster completeness
  const averageScore = totalRating / DYNASTY_SLOTS.length;
  const completenessBonus = filledSlots / DYNASTY_SLOTS.length;

  return averageScore * completenessBonus;
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function getTopPerformers(
  roster: DynastyRoster,
  count: number
): { name: string; position: string; rating: number }[] {
  const players: { name: string; position: string; rating: number }[] = [];

  for (const slot of DYNASTY_SLOTS) {
    const player = roster.players[slot.key];
    if (player) {
      players.push({
        name: player.name,
        position: player.position,
        rating: player.compositeScore,
      });
    }
  }

  return players
    .sort((a, b) => b.rating - a.rating)
    .slice(0, count);
}

// Seeded random for deterministic simulation when needed
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateMatchup(
  rosterA: DynastyRoster,
  rosterB: DynastyRoster,
  simCount: number = 1000
): SimulationResult {
  const ratingA = calculateRosterRating(rosterA);
  const ratingB = calculateRosterRating(rosterB);

  // Logistic function: convert rating difference to base win probability
  // A difference of ~2 composite points maps to roughly 73% win probability
  const ratingDiff = ratingA - ratingB;
  const baseWinProb = logistic(ratingDiff * 0.8);

  // Monte Carlo simulation with variance
  const rng = mulberry32(
    Math.floor(ratingA * 1000) ^ Math.floor(ratingB * 1000) ^ simCount
  );

  let wins = 0;
  let losses = 0;

  for (let i = 0; i < simCount; i++) {
    // Add game-to-game variance (standard deviation ~0.1)
    const variance = (rng() - 0.5) * 0.2;
    const adjustedProb = Math.max(0.01, Math.min(0.99, baseWinProb + variance));

    if (rng() < adjustedProb) {
      wins++;
    } else {
      losses++;
    }
  }

  return {
    wins,
    losses,
    totalSimulations: simCount,
    winProbability: Math.round((wins / simCount) * 1000) / 1000,
    opponentProgram: rosterB.program,
    topPerformers: getTopPerformers(rosterA, 5),
  };
}

// --- Initial Game State ---

export function createInitialGameState(): DynastyGameState {
  return {
    program: null,
    roster: null,
    availablePlayers: [],
    selectedSlot: null,
    searchQuery: '',
    isComplete: false,
    simulationResult: null,
  };
}
