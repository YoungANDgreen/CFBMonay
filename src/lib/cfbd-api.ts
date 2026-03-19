// ============================================================
// GridIron IQ — College Football Data API Client
// ============================================================
// Source: https://api.collegefootballdata.com
// Docs: https://collegefootballdata.com/

const BASE_URL = 'https://api.collegefootballdata.com';

// API key should come from environment/config in production
let apiKey = '';

export function setCfbdApiKey(key: string) {
  apiKey = key;
}

async function cfbdFetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`CFBD API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// --- Teams ---

export interface CfbdTeam {
  id: number;
  school: string;
  mascot: string;
  abbreviation: string;
  conference: string;
  color: string;
  alt_color: string;
  logos: string[];
}

export async function getTeams(conference?: string): Promise<CfbdTeam[]> {
  const params: Record<string, string> = {};
  if (conference) params.conference = conference;
  return cfbdFetch<CfbdTeam[]>('/teams', params);
}

// --- Players ---

export interface CfbdPlayerSearchResult {
  id: number;
  team: string;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  height: number;
  weight: number;
  jersey: number;
}

export async function searchPlayers(query: string, team?: string): Promise<CfbdPlayerSearchResult[]> {
  const params: Record<string, string> = { searchTerm: query };
  if (team) params.team = team;
  return cfbdFetch<CfbdPlayerSearchResult[]>('/player/search', params);
}

// --- Player Stats ---

export interface CfbdPlayerStats {
  playerId: number;
  player: string;
  team: string;
  conference: string;
  category: string;
  statType: string;
  stat: number;
}

export async function getPlayerSeasonStats(
  year: number,
  options?: { conference?: string; team?: string; category?: string }
): Promise<CfbdPlayerStats[]> {
  const params: Record<string, string | number> = { year };
  if (options?.conference) params.conference = options.conference;
  if (options?.team) params.team = options.team;
  if (options?.category) params.category = options.category;
  return cfbdFetch<CfbdPlayerStats[]>('/stats/player/season', params);
}

// --- Team Stats ---

export interface CfbdTeamStats {
  season: number;
  team: string;
  conference: string;
  statName: string;
  statValue: string;
}

export async function getTeamSeasonStats(year: number, team?: string): Promise<CfbdTeamStats[]> {
  const params: Record<string, string | number> = { year };
  if (team) params.team = team;
  return cfbdFetch<CfbdTeamStats[]>('/stats/season', params);
}

// --- Games ---

export interface CfbdGame {
  id: number;
  season: number;
  week: number;
  seasonType: string;
  startDate: string;
  homeTeam: string;
  homeConference: string;
  homePoints: number;
  awayTeam: string;
  awayConference: string;
  awayPoints: number;
  venue: string;
}

export async function getGames(
  year: number,
  options?: { week?: number; team?: string; conference?: string }
): Promise<CfbdGame[]> {
  const params: Record<string, string | number> = { year };
  if (options?.week) params.week = options.week;
  if (options?.team) params.team = options.team;
  if (options?.conference) params.conference = options.conference;
  return cfbdFetch<CfbdGame[]>('/games', params);
}

// --- Draft ---

export interface CfbdDraftPick {
  collegeTeam: string;
  collegeConference: string;
  nflTeam: string;
  year: number;
  overall: number;
  round: number;
  pick: number;
  name: string;
  position: string;
}

export async function getDraftPicks(year: number): Promise<CfbdDraftPick[]> {
  return cfbdFetch<CfbdDraftPick[]>('/draft/picks', { year });
}

// --- Rankings ---

export interface CfbdRanking {
  season: number;
  seasonType: string;
  week: number;
  polls: {
    poll: string;
    ranks: {
      rank: number;
      school: string;
      conference: string;
      firstPlaceVotes: number;
      points: number;
    }[];
  }[];
}

export async function getRankings(year: number, week?: number): Promise<CfbdRanking[]> {
  const params: Record<string, string | number> = { year };
  if (week) params.week = week;
  return cfbdFetch<CfbdRanking[]>('/rankings', params);
}

// --- Conferences ---

export interface CfbdConference {
  id: number;
  name: string;
  shortName: string;
  abbreviation: string;
}

export async function getConferences(): Promise<CfbdConference[]> {
  return cfbdFetch<CfbdConference[]>('/conferences');
}

// --- Records ---

export interface CfbdTeamRecord {
  year: number;
  team: string;
  conference: string;
  total: { games: number; wins: number; losses: number; ties: number };
  conferenceGames: { games: number; wins: number; losses: number; ties: number };
}

export async function getTeamRecords(year: number, team?: string): Promise<CfbdTeamRecord[]> {
  const params: Record<string, string | number> = { year };
  if (team) params.team = team;
  return cfbdFetch<CfbdTeamRecord[]>('/records', params);
}

// --- Recruiting ---

export interface CfbdRecruit {
  id: number;
  athleteId: number;
  recruitType: string;
  year: number;
  ranking: number;
  name: string;
  school: string;
  committedTo: string;
  position: string;
  height: number;
  weight: number;
  stars: number;
  rating: number;
  city: string;
  stateProvince: string;
}

export async function getRecruits(year: number, team?: string): Promise<CfbdRecruit[]> {
  const params: Record<string, string | number> = { year };
  if (team) params.team = team;
  return cfbdFetch<CfbdRecruit[]>('/recruiting/players', params);
}

// --- Roster ---

export interface CfbdRosterPlayer {
  id: number;
  first_name: string;
  last_name: string;
  team: string;
  position: string;
  height: number;
  weight: number;
  jersey: number;
  year: number;
  home_state: string;
}

export async function getRoster(team: string, year?: number): Promise<CfbdRosterPlayer[]> {
  const params: Record<string, string | number> = { team };
  if (year) params.year = year;
  return cfbdFetch<CfbdRosterPlayer[]>('/roster', params);
}
