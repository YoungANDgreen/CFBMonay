/**
 * build-data.ts — ETL script that reads starter_pack CSVs and writes
 * transformed JSON files into src/data/ for the app to consume.
 *
 * Usage:  npx tsx scripts/build-data.ts
 */

import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STARTER_PACK = path.join(PROJECT_ROOT, 'starter_pack', 'data');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'data');
const CORE_YEAR_START = 2014;
const CORE_YEAR_END = 2024;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readCsv(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function writeJson(filename: string, data: unknown): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const dest = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf-8');
  const count = Array.isArray(data) ? data.length : 'N/A';
  console.log(`  ✓ ${filename} — ${count} records`);
}

function num(v: string | undefined): number {
  if (v === undefined || v === '' || v === 'None') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function years(): number[] {
  const out: number[] = [];
  for (let y = CORE_YEAR_START; y <= CORE_YEAR_END; y++) out.push(y);
  return out;
}

// ---------------------------------------------------------------------------
// 1. teams.json
// ---------------------------------------------------------------------------

function buildTeams(): void {
  const rows = readCsv(path.join(STARTER_PACK, 'teams.csv'));
  const teams = rows
    .filter((r) => r.classification === 'fbs')
    .map((r) => ({
      id: num(r.id),
      school: r.school,
      mascot: r.mascot || r.nickname || '',
      abbreviation: r.abbreviation || '',
      conference: r.conference || '',
      color: '',
      altColor: '',
      logos: [] as string[],
    }));
  writeJson('teams.json', teams);
}

// ---------------------------------------------------------------------------
// 2. games.json
// ---------------------------------------------------------------------------

function buildGames(): Record<string, string>[] {
  const rows = readCsv(path.join(STARTER_PACK, 'games.csv'));
  const filtered = rows.filter((r) => {
    const season = num(r.season);
    return (
      season >= CORE_YEAR_START &&
      season <= CORE_YEAR_END &&
      r.status === 'completed'
    );
  });

  const games = filtered.map((r) => ({
    id: num(r.id),
    season: num(r.season),
    week: num(r.week),
    seasonType: r.season_type || 'regular',
    homeTeam: r.home_team,
    homeConference: r.home_conference || '',
    homePoints: num(r.home_points),
    awayTeam: r.away_team,
    awayConference: r.away_conference || '',
    awayPoints: num(r.away_points),
    venue: '',
    completed: true,
    excitement: num(r.excitement),
    homeElo: num(r.home_start_elo),
    awayElo: num(r.away_start_elo),
  }));

  writeJson('games.json', games);
  return filtered; // return raw rows for W/L computation
}

// ---------------------------------------------------------------------------
// 3. team-stats.json
// ---------------------------------------------------------------------------

interface WinLoss {
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

function computeWinLoss(
  gameRows: Record<string, string>[]
): Map<string, WinLoss> {
  const map = new Map<string, WinLoss>();

  const key = (team: string, season: number) => `${team}::${season}`;

  const ensure = (k: string): WinLoss => {
    if (!map.has(k)) map.set(k, { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 });
    return map.get(k)!;
  };

  for (const r of gameRows) {
    const season = num(r.season);
    const hp = num(r.home_points);
    const ap = num(r.away_points);

    const hk = key(r.home_team, season);
    const ak = key(r.away_team, season);

    const h = ensure(hk);
    const a = ensure(ak);

    h.pointsFor += hp;
    h.pointsAgainst += ap;
    a.pointsFor += ap;
    a.pointsAgainst += hp;

    if (hp > ap) {
      h.wins++;
      a.losses++;
    } else if (ap > hp) {
      a.wins++;
      h.losses++;
    } else {
      // tie — rare but possible
      h.wins += 0;
      a.wins += 0;
    }
  }

  return map;
}

function buildTeamStats(gameRows: Record<string, string>[]): void {
  const wl = computeWinLoss(gameRows);
  const allStats: unknown[] = [];

  for (const year of years()) {
    const csvPath = path.join(STARTER_PACK, 'season_stats', `${year}.csv`);
    if (!fs.existsSync(csvPath)) continue;

    const rows = readCsv(csvPath);
    for (const r of rows) {
      const season = num(r.season);
      const team = r.team;
      const wlKey = `${team}::${season}`;
      const record = wl.get(wlKey) || { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
      const gamesPlayed = num(r.games) || record.wins + record.losses;

      const thirdDowns = num(r.thirdDowns);
      const thirdDownConv = num(r.thirdDownConversions);
      const fourthDowns = num(r.fourthDowns);
      const fourthDownConv = num(r.fourthDownConversions);

      allStats.push({
        team,
        conference: r.conference || '',
        season,
        gamesPlayed,
        wins: record.wins,
        losses: record.losses,
        totalYards: num(r.totalYards),
        totalYardsPerGame: gamesPlayed > 0 ? Math.round((num(r.totalYards) / gamesPlayed) * 10) / 10 : 0,
        passingYards: num(r.netPassingYards),
        rushingYards: num(r.rushingYards),
        pointsFor: record.pointsFor,
        pointsAgainst: record.pointsAgainst,
        turnoversGained: num(r.turnoversOpponent),
        turnoversLost: num(r.turnovers),
        firstDowns: num(r.firstDowns),
        thirdDownConvPct: thirdDowns > 0 ? Math.round((thirdDownConv / thirdDowns) * 1000) / 1000 : 0,
        fourthDownConvPct: fourthDowns > 0 ? Math.round((fourthDownConv / fourthDowns) * 1000) / 1000 : 0,
        redZonePct: 0,
        timeOfPossession: num(r.possessionTime),
        penaltyYards: num(r.penaltyYards),
      });
    }
  }

  writeJson('team-stats.json', allStats);
}

// ---------------------------------------------------------------------------
// 4. advanced-stats.json
// ---------------------------------------------------------------------------

function buildAdvancedStats(): void {
  const allStats: unknown[] = [];

  for (const year of years()) {
    const csvPath = path.join(STARTER_PACK, 'advanced_season_stats', `${year}.csv`);
    if (!fs.existsSync(csvPath)) continue;

    const rows = readCsv(csvPath);
    for (const r of rows) {
      allStats.push({
        team: r.team,
        conference: r.conference || '',
        season: num(r.season),
        offense: {
          epa: num(r.offense_ppa),
          rushingEpa: num(r.offense_rushingPlays_ppa),
          passingEpa: num(r.offense_passingPlays_ppa),
          successRate: num(r.offense_successRate),
          explosiveness: num(r.offense_explosiveness),
          rushExplosiveness: num(r.offense_rushingPlays_explosiveness),
          passExplosiveness: num(r.offense_passingPlays_explosiveness),
          standardDownSuccess: num(r.offense_standardDowns_successRate),
          passingDownSuccess: num(r.offense_passingDowns_successRate),
          lineYards: num(r.offense_lineYards),
          secondLevelYards: num(r.offense_secondLevelYards),
          openFieldYards: num(r.offense_openFieldYards),
          pointsPerOpportunity: num(r.offense_pointsPerOpportunity),
          avgStartPosition: num(r.offense_fieldPosition_averageStart),
          havoc: {
            total: num(r.offense_havoc_total),
            frontSeven: num(r.offense_havoc_frontSeven),
            db: num(r.offense_havoc_db),
          },
        },
        defense: {
          epa: num(r.defense_ppa),
          rushingEpa: num(r.defense_rushingPlays_ppa),
          passingEpa: num(r.defense_passingPlays_ppa),
          successRate: num(r.defense_successRate),
          explosiveness: num(r.defense_explosiveness),
          rushExplosiveness: num(r.defense_rushingPlays_explosiveness),
          passExplosiveness: num(r.defense_passingPlays_explosiveness),
          standardDownSuccess: num(r.defense_standardDowns_successRate),
          passingDownSuccess: num(r.defense_passingDowns_successRate),
          lineYards: num(r.defense_lineYards),
          secondLevelYards: num(r.defense_secondLevelYards),
          openFieldYards: num(r.defense_openFieldYards),
          pointsPerOpportunity: num(r.defense_pointsPerOpportunity),
          avgStartPosition: num(r.defense_fieldPosition_averageStart),
          havoc: {
            total: num(r.defense_havoc_total),
            frontSeven: num(r.defense_havoc_frontSeven),
            db: num(r.defense_havoc_db),
          },
        },
      });
    }
  }

  writeJson('advanced-stats.json', allStats);
}

// ---------------------------------------------------------------------------
// 5. drive-stats.json
// ---------------------------------------------------------------------------

function buildDriveStats(): void {
  interface Agg {
    team: string;
    conference: string;
    season: number;
    totalDrives: number;
    scoringDrives: number;
    totalYards: number;
    totalPlays: number;
    totalStartYTG: number;
    turnovers: number;
    threeAndOuts: number;
  }

  const map = new Map<string, Agg>();

  const TURNOVER_RESULTS = new Set([
    'FUMBLE',
    'INT',
    'INTERCEPTION',
    'FUMBLE RECOVERY (OPP)',
    'TURNOVER ON DOWNS',
    'TURNOVER',
    'DOWNS',
    'MISSED FG TD',
  ]);

  for (const year of years()) {
    const csvPath = path.join(STARTER_PACK, 'drives', `drives_${year}.csv`);
    if (!fs.existsSync(csvPath)) continue;

    const rows = readCsv(csvPath);
    for (const r of rows) {
      const team = r.offense;
      if (!team) continue;
      const key = `${team}::${year}`;

      if (!map.has(key)) {
        map.set(key, {
          team,
          conference: r.offenseConference || '',
          season: year,
          totalDrives: 0,
          scoringDrives: 0,
          totalYards: 0,
          totalPlays: 0,
          totalStartYTG: 0,
          turnovers: 0,
          threeAndOuts: 0,
        });
      }

      const agg = map.get(key)!;
      agg.totalDrives++;
      if (r.scoring === 'True' || r.scoring === 'true' || r.scoring === '1') {
        agg.scoringDrives++;
      }
      agg.totalYards += num(r.yards);
      agg.totalPlays += num(r.plays);
      agg.totalStartYTG += num(r.startYardsToGoal);

      const result = (r.driveResult || '').toUpperCase();
      if (TURNOVER_RESULTS.has(result)) {
        agg.turnovers++;
      }

      // Three-and-out: 3 plays with a punt
      if (num(r.plays) <= 3 && result === 'PUNT') {
        agg.threeAndOuts++;
      }
    }
  }

  const output = Array.from(map.values()).map((a) => ({
    team: a.team,
    conference: a.conference,
    season: a.season,
    totalDrives: a.totalDrives,
    scoringDrives: a.scoringDrives,
    scoringPct:
      a.totalDrives > 0
        ? Math.round((a.scoringDrives / a.totalDrives) * 1000) / 1000
        : 0,
    avgYardsPerDrive:
      a.totalDrives > 0
        ? Math.round((a.totalYards / a.totalDrives) * 10) / 10
        : 0,
    avgPlaysPerDrive:
      a.totalDrives > 0
        ? Math.round((a.totalPlays / a.totalDrives) * 10) / 10
        : 0,
    avgStartPosition:
      a.totalDrives > 0
        ? Math.round((a.totalStartYTG / a.totalDrives) * 10) / 10
        : 0,
    turnoversPerDrive:
      a.totalDrives > 0
        ? Math.round((a.turnovers / a.totalDrives) * 1000) / 1000
        : 0,
    threeAndOutPct:
      a.totalDrives > 0
        ? Math.round((a.threeAndOuts / a.totalDrives) * 1000) / 1000
        : 0,
  }));

  writeJson('drive-stats.json', output);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log('Building data from starter_pack CSVs...\n');

  buildTeams();
  const gameRows = buildGames();
  buildTeamStats(gameRows);
  buildAdvancedStats();
  buildDriveStats();

  console.log('\nDone!');
}

main();
