// ============================================================
// GridIron IQ — CFB Data Cache (Local JSON Seed Data)
// ============================================================

import { CachedAdvancedStats, CachedDriveEfficiency } from '../../types';

// Cached data types
export interface CachedTeam {
  id: number;
  school: string;
  mascot: string;
  abbreviation: string;
  conference: string;
  color: string;
  altColor: string;
  logos: string[];
}

export interface CachedPlayer {
  id: number;
  firstName: string;
  lastName: string;
  team: string;
  position: string;
  jersey: number;
  height: number;
  weight: number;
  year: string;
  hometown: string;
}

export interface CachedPlayerSeasonStats {
  playerId: number;
  player: string;
  team: string;
  season: number;
  category: string;
  // Passing
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  completions?: number;
  attempts?: number;
  // Rushing
  rushingYards?: number;
  rushingTDs?: number;
  carries?: number;
  // Receiving
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
  // Defense
  tackles?: number;
  sacks?: number;
  defensiveInterceptions?: number;
  forcedFumbles?: number;
  passesDefended?: number;
}

export interface CachedTeamStats {
  team: string;
  season: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalYards: number;
  totalYardsPerGame: number;
  passingYards: number;
  rushingYards: number;
  pointsFor: number;
  pointsAgainst: number;
  turnoversGained: number;
  turnoversLost: number;
  firstDowns: number;
  thirdDownConvPct: number;
  fourthDownConvPct: number;
  redZonePct: number;
  timeOfPossession: string;
  penaltyYards: number;
}

export interface CachedGame {
  id: number;
  season: number;
  week: number;
  seasonType: string;
  homeTeam: string;
  homeConference: string;
  homePoints: number;
  awayTeam: string;
  awayConference: string;
  awayPoints: number;
  venue: string;
  completed: boolean;
  excitement?: number;
  homeElo?: number;
  awayElo?: number;
}

export interface CachedDraftPick {
  name: string;
  position: string;
  collegeTeam: string;
  nflTeam: string;
  year: number;
  round: number;
  pick: number;
  overall: number;
}

export interface CachedRanking {
  season: number;
  week: string;
  polls: Array<{
    rank: number;
    school: string;
    conference: string;
    points?: number;
    firstPlaceVotes?: number;
    record: string;
  }>;
}

export interface CachedTeamRecord {
  team: string;
  conference: string;
  season: number;
  totalWins: number;
  totalLosses: number;
  conferenceWins: number;
  conferenceLosses: number;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
}

export interface CachedRecruit {
  id: number;
  name: string;
  position: string;
  school: string;
  city: string;
  state: string;
  stars: number;
  rating: number;
  ranking: number;
  stateRanking: number;
  positionRanking: number;
}

// --- In-memory cache ---
let teams: CachedTeam[] = [];
let players: CachedPlayer[] = [];
let playerStats: CachedPlayerSeasonStats[] = [];
let teamStats: CachedTeamStats[] = [];
let games: CachedGame[] = [];
let draftPicks: CachedDraftPick[] = [];
let rankings: CachedRanking[] = [];
let records: CachedTeamRecord[] = [];
let recruits: CachedRecruit[] = [];
let advancedStats: CachedAdvancedStats[] = [];
let driveStats: CachedDriveEfficiency[] = [];

interface TeamLogoEntry {
  school: string;
  espnId: number;
  logoUrl: string;
  darkLogoUrl: string;
}
let teamLogos: TeamLogoEntry[] = [];
let _logoMap: Map<string, TeamLogoEntry> | null = null;

let initialized = false;

// --- Initialize ---
export function initializeDataCache(): void {
  if (initialized) return;

  try {
    teams = require('../../data/teams.json') as CachedTeam[];
  } catch { teams = []; }

  try {
    players = require('../../data/players.json') as CachedPlayer[];
  } catch { players = []; }

  try {
    playerStats = require('../../data/player-stats.json') as CachedPlayerSeasonStats[];
  } catch { playerStats = []; }

  try {
    teamStats = require('../../data/team-stats.json') as CachedTeamStats[];
  } catch { teamStats = []; }

  try {
    games = require('../../data/games.json') as CachedGame[];
  } catch { games = []; }

  try {
    draftPicks = require('../../data/draft-picks.json') as CachedDraftPick[];
  } catch { draftPicks = []; }

  try {
    rankings = require('../../data/rankings.json') as CachedRanking[];
  } catch { rankings = []; }

  try {
    records = require('../../data/records.json') as CachedTeamRecord[];
  } catch { records = []; }

  try {
    recruits = require('../../data/recruits.json') as CachedRecruit[];
  } catch { recruits = []; }

  try {
    advancedStats = require('../../data/advanced-stats.json') as CachedAdvancedStats[];
  } catch { advancedStats = []; }

  try {
    driveStats = require('../../data/drive-stats.json') as CachedDriveEfficiency[];
  } catch { driveStats = []; }

  try {
    teamLogos = require('../../data/team-logos.json') as TeamLogoEntry[];
    _logoMap = null; // Reset lazy map on re-init
  } catch { teamLogos = []; }

  initialized = true;
  console.log(`[DataCache] Loaded: ${teams.length} teams, ${players.length} players, ${playerStats.length} stat lines, ${games.length} games, ${draftPicks.length} draft picks, ${advancedStats.length} advanced stats, ${driveStats.length} drive stats`);
}

// --- Team Getters ---
export function getAllTeams(): CachedTeam[] { return teams; }

export function getTeamByName(name: string): CachedTeam | undefined {
  return teams.find(t => t.school.toLowerCase() === name.toLowerCase());
}

export function getTeamsByConference(conference: string): CachedTeam[] {
  return teams.filter(t => t.conference.toLowerCase() === conference.toLowerCase());
}

export function searchTeams(query: string): CachedTeam[] {
  const q = query.toLowerCase();
  return teams.filter(t =>
    t.school.toLowerCase().includes(q) ||
    t.mascot.toLowerCase().includes(q) ||
    t.abbreviation.toLowerCase().includes(q)
  );
}

// --- Player Getters ---
export function getAllPlayers(): CachedPlayer[] { return players; }

export function getPlayerById(id: number): CachedPlayer | undefined {
  return players.find(p => p.id === id);
}

export function getPlayersByTeam(team: string): CachedPlayer[] {
  return players.filter(p => p.team.toLowerCase() === team.toLowerCase());
}

export function getPlayersByPosition(position: string): CachedPlayer[] {
  return players.filter(p => p.position.toUpperCase() === position.toUpperCase());
}

export function searchPlayers(query: string): CachedPlayer[] {
  const q = query.toLowerCase();
  return players.filter(p =>
    p.firstName.toLowerCase().includes(q) ||
    p.lastName.toLowerCase().includes(q) ||
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
    p.team.toLowerCase().includes(q)
  );
}

// --- Player Stats Getters ---
export function getPlayerStats(playerId: number): CachedPlayerSeasonStats[] {
  return playerStats.filter(s => s.playerId === playerId);
}

export function getPlayerStatsByName(name: string): CachedPlayerSeasonStats[] {
  return playerStats.filter(s => s.player.toLowerCase().includes(name.toLowerCase()));
}

export function getTopPlayersByStat(
  statKey: keyof CachedPlayerSeasonStats,
  limit: number = 20
): CachedPlayerSeasonStats[] {
  return [...playerStats]
    .filter(s => typeof s[statKey] === 'number' && (s[statKey] as number) > 0)
    .sort((a, b) => ((b[statKey] as number) || 0) - ((a[statKey] as number) || 0))
    .slice(0, limit);
}

export function getStatLeadersByCategory(category: string, limit: number = 50): CachedPlayerSeasonStats[] {
  return playerStats
    .filter(s => s.category === category)
    .slice(0, limit);
}

// --- Team Stats Getters ---
export function getAllTeamStats(): CachedTeamStats[] { return teamStats; }

export function getTeamStats(team: string): CachedTeamStats | undefined {
  return teamStats.find(s => s.team.toLowerCase() === team.toLowerCase());
}

export function getTopTeamsByStat(
  statKey: keyof CachedTeamStats,
  limit: number = 25
): CachedTeamStats[] {
  return [...teamStats]
    .filter(s => typeof s[statKey] === 'number')
    .sort((a, b) => ((b[statKey] as number) || 0) - ((a[statKey] as number) || 0))
    .slice(0, limit);
}

// --- Game Getters ---
export function getAllGames(): CachedGame[] { return games; }

export function getGamesByWeek(week: number): CachedGame[] {
  return games.filter(g => g.week === week);
}

export function getGamesByTeam(team: string): CachedGame[] {
  const t = team.toLowerCase();
  return games.filter(g =>
    g.homeTeam.toLowerCase() === t || g.awayTeam.toLowerCase() === t
  );
}

export function getGamesByConference(conference: string): CachedGame[] {
  const c = conference.toLowerCase();
  return games.filter(g =>
    g.homeConference.toLowerCase() === c || g.awayConference.toLowerCase() === c
  );
}

// --- Draft Getters ---
export function getAllDraftPicks(): CachedDraftPick[] { return draftPicks; }

export function getDraftPicksByRound(round: number): CachedDraftPick[] {
  return draftPicks.filter(p => p.round === round);
}

export function getDraftPicksByCollege(college: string): CachedDraftPick[] {
  return draftPicks.filter(p => p.collegeTeam.toLowerCase() === college.toLowerCase());
}

export function getFirstRoundPicks(): CachedDraftPick[] {
  return draftPicks.filter(p => p.round === 1);
}

export function getDraftPicksByYear(year: number): CachedDraftPick[] {
  return draftPicks.filter(p => p.year === year);
}

export function getDraftPicksByTeam(college: string): CachedDraftPick[] {
  return draftPicks.filter(p => p.collegeTeam.toLowerCase() === college.toLowerCase());
}

// --- Rankings Getters ---
export function getAllRankings(): CachedRanking[] { return rankings; }

export function getRankingsByWeek(week: string): CachedRanking | undefined {
  return rankings.find(r => r.week === week);
}

export function getFinalRankings(): CachedRanking | undefined {
  return rankings.find(r => r.week === 'Final');
}

// --- Records Getters ---
export function getAllRecords(): CachedTeamRecord[] { return records; }

export function getTeamRecord(team: string): CachedTeamRecord | undefined {
  return records.find(r => r.team.toLowerCase() === team.toLowerCase());
}

export function getRecordsByConference(conference: string): CachedTeamRecord[] {
  return records.filter(r => r.conference.toLowerCase() === conference.toLowerCase());
}

// --- Recruits Getters ---
export function getAllRecruits(): CachedRecruit[] { return recruits; }

export function getRecruitsBySchool(school: string): CachedRecruit[] {
  return recruits.filter(r => r.school.toLowerCase() === school.toLowerCase());
}

export function getFiveStarRecruits(): CachedRecruit[] {
  return recruits.filter(r => r.stars === 5);
}

// --- Advanced Stats Getters ---
export function getAdvancedStats(): CachedAdvancedStats[] {
  return advancedStats;
}

export function getAdvancedStatsByTeam(team: string, season?: number): CachedAdvancedStats[] {
  return advancedStats.filter(s =>
    s.team.toLowerCase() === team.toLowerCase() &&
    (season === undefined || s.season === season)
  );
}

export function getAdvancedStatsByConference(conference: string, season: number): CachedAdvancedStats[] {
  return advancedStats.filter(s =>
    s.conference.toLowerCase() === conference.toLowerCase() &&
    s.season === season
  );
}

// --- Drive Efficiency Getters ---
export function getDriveEfficiency(): CachedDriveEfficiency[] {
  return driveStats;
}

export function getDriveEfficiencyByTeam(team: string, season?: number): CachedDriveEfficiency[] {
  return driveStats.filter(s =>
    s.team.toLowerCase() === team.toLowerCase() &&
    (season === undefined || s.season === season)
  );
}

// --- Team Logo Getters ---
function ensureLogoMap(): Map<string, TeamLogoEntry> {
  if (!_logoMap) {
    _logoMap = new Map(teamLogos.map(t => [t.school.toLowerCase(), t]));
  }
  return _logoMap;
}

export function getTeamLogo(school: string): string | undefined {
  return ensureLogoMap().get(school.toLowerCase())?.logoUrl;
}

export function getTeamLogoDark(school: string): string | undefined {
  return ensureLogoMap().get(school.toLowerCase())?.darkLogoUrl;
}

export function getEspnTeamId(school: string): number | undefined {
  return ensureLogoMap().get(school.toLowerCase())?.espnId;
}

// --- Utility ---
export function isCacheReady(): boolean { return initialized; }

export function getCacheStats() {
  return {
    initialized,
    teams: teams.length,
    players: players.length,
    playerStats: playerStats.length,
    teamStats: teamStats.length,
    games: games.length,
    draftPicks: draftPicks.length,
    rankings: rankings.length,
    records: records.length,
    recruits: recruits.length,
    advancedStats: advancedStats.length,
    driveStats: driveStats.length,
    teamLogos: teamLogos.length,
  };
}
