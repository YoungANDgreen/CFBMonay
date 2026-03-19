#!/usr/bin/env npx tsx
// ============================================================
// GridIron IQ — CFBD Data Sync Script
// Usage: npx tsx scripts/sync-cfbd-data.ts [--year 2024] [--all]
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'https://api.collegefootballdata.com';
const API_KEY = process.env.CFBD_API_KEY || '';
const DATA_DIR = path.resolve(__dirname, '../src/data');

const DEFAULT_YEAR = 2023;

if (!API_KEY) {
  console.error('Error: Set CFBD_API_KEY environment variable');
  process.exit(1);
}

async function fetchCFBD(endpoint: string, params: Record<string, string | number> = {}): Promise<unknown> {
  const url = new URL(endpoint, API_BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  console.log(`  Fetching ${url.pathname}${url.search}...`);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`CFBD API error ${res.status}: ${res.statusText} for ${url.pathname}`);
  }

  // Rate limit: 500ms between requests
  await new Promise(r => setTimeout(r, 500));

  return res.json();
}

function writeJSON(filename: string, data: unknown): void {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  const size = fs.statSync(filepath).size;
  console.log(`  Wrote ${filename} (${(size / 1024).toFixed(1)} KB)`);
}

async function syncTeams(year: number): Promise<void> {
  console.log('\n[1/9] Syncing teams...');
  const data = await fetchCFBD('/teams', { year }) as Array<Record<string, unknown>>;
  const teams = data
    .filter((t: Record<string, unknown>) => t.classification === 'fbs')
    .map((t: Record<string, unknown>) => ({
      id: t.id,
      school: t.school,
      mascot: t.mascot,
      abbreviation: t.abbreviation,
      conference: t.conference,
      color: t.color || '#333333',
      altColor: t.alt_color || '#FFFFFF',
      logos: t.logos || [],
    }));
  writeJSON('teams.json', teams);
}

async function syncPlayers(year: number): Promise<void> {
  console.log('\n[2/9] Syncing players (top teams)...');
  const topTeams = ['Alabama', 'Georgia', 'Michigan', 'Ohio State', 'Texas', 'USC', 'Oregon',
    'Florida State', 'Washington', 'Penn State', 'Oklahoma', 'LSU', 'Clemson', 'Tennessee',
    'Ole Miss', 'Notre Dame', 'Missouri', 'Oregon State', 'Louisville', 'Liberty',
    'Tulane', 'James Madison', 'Air Force', 'SMU', 'UTSA', 'Boise State',
    'Florida', 'Auburn', 'Iowa', 'Utah', 'Kansas State', 'Texas A&M',
    'Colorado', 'North Carolina', 'Miami', 'Wisconsin', 'Arizona'];

  const allPlayers: Array<Record<string, unknown>> = [];
  for (const team of topTeams) {
    const roster = await fetchCFBD('/roster', { team, year }) as Array<Record<string, unknown>>;
    const mapped = roster.map((p: Record<string, unknown>, i: number) => ({
      id: allPlayers.length + i + 1,
      firstName: p.first_name,
      lastName: p.last_name,
      team,
      position: p.position || 'ATH',
      jersey: p.jersey || 0,
      height: p.height || 72,
      weight: p.weight || 200,
      year: p.year || 'Unknown',
      hometown: [p.home_city, p.home_state].filter(Boolean).join(', ') || 'Unknown',
    }));
    allPlayers.push(...mapped);
  }
  writeJSON('players.json', allPlayers);
}

async function syncPlayerStats(year: number): Promise<void> {
  console.log('\n[3/9] Syncing player stats...');
  const categories = ['passing', 'rushing', 'receiving', 'defensive'];
  const allStats: Array<Record<string, unknown>> = [];

  for (const cat of categories) {
    const data = await fetchCFBD('/stats/player/season', { year, category: cat }) as Array<Record<string, unknown>>;
    allStats.push(...data.map((s: Record<string, unknown>) => ({
      playerId: s.playerId,
      player: s.player,
      team: s.team,
      season: year,
      category: cat,
      ...(s as Record<string, unknown>),
    })));
  }
  writeJSON('player-stats.json', allStats);
}

async function syncTeamStats(year: number): Promise<void> {
  console.log('\n[4/9] Syncing team stats...');
  const data = await fetchCFBD('/stats/season', { year }) as Array<Record<string, unknown>>;
  writeJSON('team-stats.json', data);
}

async function syncGames(year: number): Promise<void> {
  console.log('\n[5/9] Syncing games...');
  const regular = await fetchCFBD('/games', { year, seasonType: 'regular' }) as Array<Record<string, unknown>>;
  const postseason = await fetchCFBD('/games', { year, seasonType: 'postseason' }) as Array<Record<string, unknown>>;

  const allGames = [...regular, ...postseason].map((g: Record<string, unknown>) => ({
    id: g.id,
    season: g.season,
    week: g.week,
    seasonType: g.season_type,
    homeTeam: g.home_team,
    homeConference: g.home_conference,
    homePoints: g.home_points,
    awayTeam: g.away_team,
    awayConference: g.away_conference,
    awayPoints: g.away_points,
    venue: g.venue,
    completed: g.completed,
    excitement: g.excitement_index,
  }));
  writeJSON('games.json', allGames);
}

async function syncDraftPicks(year: number): Promise<void> {
  console.log('\n[6/9] Syncing draft picks...');
  const data = await fetchCFBD('/draft/picks', { year: year + 1 }) as Array<Record<string, unknown>>;
  const picks = data.map((p: Record<string, unknown>) => ({
    pick: p.overall,
    round: p.round,
    team: p.nflTeam,
    player: p.name,
    position: p.position,
    college: p.collegeName || p.college_team,
    conference: p.collegeConference || '',
  }));
  writeJSON('draft-picks.json', picks);
}

async function syncRankings(year: number): Promise<void> {
  console.log('\n[7/9] Syncing rankings...');
  const data = await fetchCFBD('/rankings', { year, seasonType: 'regular' }) as Array<Record<string, unknown>>;
  const mapped = data.map((week: Record<string, unknown>) => {
    const polls = week.polls as Array<Record<string, unknown>> || [];
    const apPoll = polls.find((p: Record<string, unknown>) => p.poll === 'AP Top 25');
    return {
      season: year,
      week: String(week.week),
      polls: apPoll
        ? ((apPoll.ranks as Array<Record<string, unknown>>) || []).map((r: Record<string, unknown>) => ({
            rank: r.rank,
            school: r.school,
            conference: r.conference,
            points: r.points,
            firstPlaceVotes: r.firstPlaceVotes,
            record: `${r.wins || 0}-${r.losses || 0}`,
          }))
        : [],
    };
  });
  writeJSON('rankings.json', mapped);
}

async function syncRecords(year: number): Promise<void> {
  console.log('\n[8/9] Syncing records...');
  const data = await fetchCFBD('/records', { year }) as Array<Record<string, unknown>>;
  const records = data.map((r: Record<string, unknown>) => {
    const total = r.total as Record<string, number> || {};
    const conf = r.conferenceGames as Record<string, number> || {};
    const home = r.homeGames as Record<string, number> || {};
    const away = r.awayGames as Record<string, number> || {};
    return {
      team: r.team,
      conference: r.conference,
      season: year,
      totalWins: total.wins || 0,
      totalLosses: total.losses || 0,
      conferenceWins: conf.wins || 0,
      conferenceLosses: conf.losses || 0,
      homeWins: home.wins || 0,
      homeLosses: home.losses || 0,
      awayWins: away.wins || 0,
      awayLosses: away.losses || 0,
    };
  });
  writeJSON('records.json', records);
}

async function syncRecruits(year: number): Promise<void> {
  console.log('\n[9/9] Syncing recruits...');
  const data = await fetchCFBD('/recruiting/players', { year: year + 1 }) as Array<Record<string, unknown>>;
  const recruits = data.slice(0, 200).map((r: Record<string, unknown>, i: number) => ({
    id: i + 1,
    name: r.name,
    position: r.position,
    school: r.committedTo || 'Uncommitted',
    city: r.city || '',
    state: r.stateProvince || '',
    stars: r.stars || 3,
    rating: r.rating || 0.8,
    ranking: r.ranking || i + 1,
    stateRanking: r.stateRanking || 0,
    positionRanking: r.positionRanking || 0,
  }));
  writeJSON('recruits.json', recruits);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const yearFlag = args.indexOf('--year');
  const year = yearFlag !== -1 ? parseInt(args[yearFlag + 1], 10) : DEFAULT_YEAR;

  console.log(`\n=== CFBD Data Sync (${year} season) ===\n`);
  console.log(`Data directory: ${DATA_DIR}`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    await syncTeams(year);
    await syncPlayers(year);
    await syncPlayerStats(year);
    await syncTeamStats(year);
    await syncGames(year);
    await syncDraftPicks(year);
    await syncRankings(year);
    await syncRecords(year);
    await syncRecruits(year);
    console.log('\n=== Sync complete! ===\n');
  } catch (error) {
    console.error('\nSync failed:', error);
    process.exit(1);
  }
}

main();
