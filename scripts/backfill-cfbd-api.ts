/**
 * Backfill pre-2014 player season stats from CFBD API
 *
 * Usage: CFBD_API_KEY=your_key npx ts-node scripts/backfill-cfbd-api.ts
 *
 * Get a free API key at: https://collegefootballdata.com/key
 */

import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.CFBD_API_KEY;
if (!API_KEY) {
  console.error('ERROR: Set CFBD_API_KEY environment variable');
  console.error('Get a free key at: https://collegefootballdata.com/key');
  process.exit(1);
}

const BASE_URL = 'https://api.collegefootballdata.com';
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const YEARS = [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013];
const CATEGORIES = ['passing', 'rushing', 'receiving', 'defensive'];

interface CachedPlayer {
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

interface CachedPlayerSeasonStats {
  playerId: number;
  player: string;
  team: string;
  season: number;
  category: string;
  passingYards?: number;
  passingTDs?: number;
  interceptions?: number;
  completions?: number;
  attempts?: number;
  rushingYards?: number;
  rushingTDs?: number;
  carries?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
  tackles?: number;
  sacks?: number;
  defensiveInterceptions?: number;
  forcedFumbles?: number;
  passesDefended?: number;
}

async function cfbdFetch(endpoint: string, params: Record<string, string | number> = {}): Promise<any> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const resp = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!resp.ok) {
    throw new Error(`CFBD API ${resp.status}: ${resp.statusText} - ${endpoint}`);
  }
  return resp.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseStatValue(val: string | number | undefined): number {
  if (val === undefined || val === null || val === '') return 0;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(n) ? 0 : n;
}

async function fetchPlayerStats(year: number, category: string): Promise<any[]> {
  try {
    const data = await cfbdFetch('/stats/player/season', { year, category });
    return data || [];
  } catch (e: any) {
    console.error(`  Error fetching ${category} ${year}: ${e.message}`);
    return [];
  }
}

async function fetchRosters(year: number): Promise<any[]> {
  try {
    const data = await cfbdFetch('/roster', { year });
    return data || [];
  } catch (e: any) {
    console.error(`  Error fetching roster ${year}: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('BACKFILL PRE-2014 PLAYER STATS FROM CFBD API');
  console.log('='.repeat(70));

  // Load existing data
  const existingPlayers: CachedPlayer[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'players.json'), 'utf-8')
  );
  const existingStats: CachedPlayerSeasonStats[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'player-stats.json'), 'utf-8')
  );

  console.log(`\nExisting: ${existingPlayers.length} players, ${existingStats.length} stat lines`);

  // Track new data
  const newPlayers = new Map<number, CachedPlayer>();
  const newStats: CachedPlayerSeasonStats[] = [];
  const existingPlayerIds = new Set(existingPlayers.map(p => p.id));
  const existingStatKeys = new Set(
    existingStats
      .filter(s => s.season < 2014)
      .map(s => `${s.playerId}-${s.season}-${s.category}`)
  );

  // Fetch rosters for each year
  console.log('\nFetching rosters...');
  for (const year of YEARS) {
    process.stdout.write(`  ${year}...`);
    const roster = await fetchRosters(year);
    let added = 0;
    for (const p of roster) {
      if (p.id && !existingPlayerIds.has(p.id) && !newPlayers.has(p.id)) {
        newPlayers.set(p.id, {
          id: p.id,
          firstName: p.first_name || p.firstName || '',
          lastName: p.last_name || p.lastName || '',
          team: p.team || '',
          position: p.position || 'ATH',
          jersey: p.jersey || 0,
          height: p.height || 0,
          weight: p.weight || 0,
          year: p.year || '',
          hometown: p.home_city ? `${p.home_city}, ${p.home_state || ''}` : '',
        });
        added++;
      }
    }
    console.log(` ${roster.length} players (${added} new)`);
    await sleep(1200);
  }

  // Fetch stats for each year and category
  console.log('\nFetching player season stats...');
  for (const year of YEARS) {
    console.log(`\n  ${year}:`);
    for (const category of CATEGORIES) {
      process.stdout.write(`    ${category}...`);
      const rawStats = await fetchPlayerStats(year, category);

      let added = 0;
      for (const s of rawStats) {
        const playerId = s.playerId || 0;
        const playerName = s.player || '';
        const team = s.team || '';
        const key = `${playerId}-${year}-${category}`;

        if (existingStatKeys.has(key)) continue;

        // Build stat record
        const stat: CachedPlayerSeasonStats = {
          playerId,
          player: playerName,
          team,
          season: year,
          category,
        };

        // Map CFBD stat types to our flat format
        if (s.statType && s.stat !== undefined) {
          // Single stat type per record from CFBD
          const val = parseStatValue(s.stat);
          switch (s.statType) {
            case 'YDS': case 'PASS_YDS':
              if (category === 'passing') stat.passingYards = val;
              else if (category === 'rushing') stat.rushingYards = val;
              else if (category === 'receiving') stat.receivingYards = val;
              break;
            case 'TD': case 'PASS_TD':
              if (category === 'passing') stat.passingTDs = val;
              else if (category === 'rushing') stat.rushingTDs = val;
              else if (category === 'receiving') stat.receivingTDs = val;
              break;
            case 'INT':
              if (category === 'passing') stat.interceptions = val;
              else if (category === 'defensive') stat.defensiveInterceptions = val;
              break;
            case 'COMPLETIONS': stat.completions = val; break;
            case 'ATT':
              if (category === 'passing') stat.attempts = val;
              else if (category === 'rushing') stat.carries = val;
              break;
            case 'CAR': stat.carries = val; break;
            case 'REC': stat.receptions = val; break;
            case 'TFL': break; // skip
            case 'SACKS': case 'SK': stat.sacks = val; break;
            case 'QBH': break; // skip
            case 'PD': stat.passesDefended = val; break;
            case 'FF': stat.forcedFumbles = val; break;
            case 'SOLO': case 'TOT': stat.tackles = val; break;
          }
        }

        newStats.push(stat);
        existingStatKeys.add(key);
        added++;
      }
      console.log(` ${rawStats.length} records (${added} new)`);
      await sleep(1200);
    }
  }

  // CFBD returns one row per stat type. We need to merge rows for same player+season+category.
  console.log('\nConsolidating stat records...');
  const consolidated = new Map<string, CachedPlayerSeasonStats>();
  for (const s of newStats) {
    const key = `${s.playerId}-${s.season}-${s.category}`;
    const existing = consolidated.get(key);
    if (existing) {
      // Merge non-zero fields
      if (s.passingYards) existing.passingYards = (existing.passingYards || 0) + s.passingYards;
      if (s.passingTDs) existing.passingTDs = (existing.passingTDs || 0) + s.passingTDs;
      if (s.interceptions) existing.interceptions = (existing.interceptions || 0) + s.interceptions;
      if (s.completions) existing.completions = (existing.completions || 0) + s.completions;
      if (s.attempts) existing.attempts = (existing.attempts || 0) + s.attempts;
      if (s.rushingYards) existing.rushingYards = (existing.rushingYards || 0) + s.rushingYards;
      if (s.rushingTDs) existing.rushingTDs = (existing.rushingTDs || 0) + s.rushingTDs;
      if (s.carries) existing.carries = (existing.carries || 0) + s.carries;
      if (s.receptions) existing.receptions = (existing.receptions || 0) + s.receptions;
      if (s.receivingYards) existing.receivingYards = (existing.receivingYards || 0) + s.receivingYards;
      if (s.receivingTDs) existing.receivingTDs = (existing.receivingTDs || 0) + s.receivingTDs;
      if (s.tackles) existing.tackles = (existing.tackles || 0) + s.tackles;
      if (s.sacks) existing.sacks = (existing.sacks || 0) + s.sacks;
      if (s.defensiveInterceptions) existing.defensiveInterceptions = (existing.defensiveInterceptions || 0) + s.defensiveInterceptions;
      if (s.forcedFumbles) existing.forcedFumbles = (existing.forcedFumbles || 0) + s.forcedFumbles;
      if (s.passesDefended) existing.passesDefended = (existing.passesDefended || 0) + s.passesDefended;
    } else {
      consolidated.set(key, { ...s });
    }
  }

  const consolidatedStats = Array.from(consolidated.values());
  console.log(`  ${newStats.length} raw records → ${consolidatedStats.length} consolidated`);

  // Merge with existing (keep post-2014 + replace pre-2014)
  const post2014Stats = existingStats.filter(s => s.season >= 2014);
  const mergedStats = [...post2014Stats, ...consolidatedStats];
  const mergedPlayers = [...existingPlayers, ...Array.from(newPlayers.values())];

  // Write
  console.log(`\nWriting ${mergedPlayers.length} players...`);
  fs.writeFileSync(
    path.join(DATA_DIR, 'players.json'),
    JSON.stringify(mergedPlayers, null, 2)
  );

  console.log(`Writing ${mergedStats.length} stat lines...`);
  fs.writeFileSync(
    path.join(DATA_DIR, 'player-stats.json'),
    JSON.stringify(mergedStats, null, 2)
  );

  // Verify key players
  console.log('\n--- Key Player Check ---');
  const check = (name: string, year: number) => {
    const found = mergedStats.filter(
      s => s.player?.toLowerCase().includes(name.toLowerCase()) && s.season === year
    );
    const totalYds = found.reduce((sum, s) =>
      sum + (s.passingYards || 0) + (s.rushingYards || 0) + (s.receivingYards || 0), 0);
    console.log(`  ${name} (${year}): ${found.length} records, ${totalYds} total yds`);
  };
  check('Crabtree', 2008);
  check('Harvin', 2008);
  check('Tebow', 2008);
  check('Bradford', 2008);
  check('Newton', 2010);
  check('Manziel', 2012);
  check('Winston', 2013);
  check('Ingram', 2009);
  check('Bush', 2005);

  console.log('\n' + '='.repeat(70));
  console.log('BACKFILL COMPLETE');
  console.log(`  Players: ${mergedPlayers.length}`);
  console.log(`  Stats: ${mergedStats.length} (${consolidatedStats.length} pre-2014, ${post2014Stats.length} post-2014)`);
  console.log('='.repeat(70));
}

main().catch(console.error);
