/**
 * Seed legendary pre-2003 college football players into the data files.
 * Run: npx ts-node --project tsconfig.json scripts/seed-legends.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// Generate a deterministic ID from player name
function nameToId(name: string): number {
  let hash = 0;
  const str = `legend-${name}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash) + 900000000000;
}

interface LegendPlayer {
  firstName: string;
  lastName: string;
  team: string;
  position: string;
  conference: string;
}

interface LegendStat {
  player: string;
  team: string;
  season: number;
  category: string;
  conference: string;
  passingYards: number;
  passingTDs: number;
  interceptions: number;
  completions: number;
  attempts: number;
  rushingYards: number;
  rushingTDs: number;
  carries: number;
  receptions: number;
  receivingYards: number;
  receivingTDs: number;
  tackles: number;
  sacks: number;
  defensiveInterceptions: number;
  forcedFumbles: number;
  passesDefended: number;
}

// ---- LEGENDS DATA ----

const legends: { player: LegendPlayer; stats: Omit<LegendStat, 'player' | 'team' | 'category' | 'conference'>[] }[] = [
  // 1. Michael Vick
  { player: { firstName: 'Michael', lastName: 'Vick', team: 'Virginia Tech', position: 'QB', conference: 'ACC' }, stats: [
    { season: 1999, passingYards: 1840, passingTDs: 12, interceptions: 5, completions: 90, attempts: 152, rushingYards: 585, rushingTDs: 8, carries: 103, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2000, passingYards: 1234, passingTDs: 8, interceptions: 5, completions: 87, attempts: 161, rushingYards: 617, rushingTDs: 8, carries: 113, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 2. Randy Moss
  { player: { firstName: 'Randy', lastName: 'Moss', team: 'Marshall', position: 'WR', conference: 'Mid-American' }, stats: [
    { season: 1996, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 50, rushingTDs: 0, carries: 10, receptions: 78, receivingYards: 1709, receivingTDs: 28, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1997, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 40, rushingTDs: 0, carries: 8, receptions: 96, receivingYards: 1820, receivingTDs: 26, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 3. Charles Woodson
  { player: { firstName: 'Charles', lastName: 'Woodson', team: 'Michigan', position: 'DEF', conference: 'Big Ten' }, stats: [
    { season: 1995, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 2, receivingYards: 30, receivingTDs: 0, tackles: 33, sacks: 0, defensiveInterceptions: 5, forcedFumbles: 0, passesDefended: 3 },
    { season: 1996, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 152, rushingTDs: 0, carries: 6, receptions: 13, receivingYards: 164, receivingTDs: 0, tackles: 38, sacks: 0, defensiveInterceptions: 5, forcedFumbles: 1, passesDefended: 5 },
    { season: 1997, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 11, receivingYards: 231, receivingTDs: 1, tackles: 44, sacks: 1, defensiveInterceptions: 8, forcedFumbles: 1, passesDefended: 8 },
  ]},
  // 4. Ricky Williams
  { player: { firstName: 'Ricky', lastName: 'Williams', team: 'Texas', position: 'RB', conference: 'Big 12' }, stats: [
    { season: 1995, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 990, rushingTDs: 8, carries: 166, receptions: 14, receivingYards: 89, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1996, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1272, rushingTDs: 12, carries: 205, receptions: 14, receivingYards: 120, receivingTDs: 1, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1997, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1893, rushingTDs: 25, carries: 279, receptions: 20, receivingYards: 155, receivingTDs: 1, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1998, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 2124, rushingTDs: 27, carries: 361, receptions: 26, receivingYards: 256, receivingTDs: 1, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 5. Herschel Walker
  { player: { firstName: 'Herschel', lastName: 'Walker', team: 'Georgia', position: 'RB', conference: 'SEC' }, stats: [
    { season: 1980, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1616, rushingTDs: 15, carries: 274, receptions: 9, receivingYards: 88, receivingTDs: 1, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1981, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1891, rushingTDs: 18, carries: 385, receptions: 8, receivingYards: 94, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1982, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1752, rushingTDs: 16, carries: 335, receptions: 9, receivingYards: 70, receivingTDs: 1, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 6. Barry Sanders
  { player: { firstName: 'Barry', lastName: 'Sanders', team: 'Oklahoma State', position: 'RB', conference: 'Big 12' }, stats: [
    { season: 1986, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 325, rushingTDs: 2, carries: 74, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1987, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 603, rushingTDs: 9, carries: 111, receptions: 4, receivingYards: 58, receivingTDs: 1, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1988, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 2628, rushingTDs: 37, carries: 344, receptions: 19, receivingYards: 106, receivingTDs: 2, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 7. Bo Jackson
  { player: { firstName: 'Bo', lastName: 'Jackson', team: 'Auburn', position: 'RB', conference: 'SEC' }, stats: [
    { season: 1982, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 829, rushingTDs: 9, carries: 127, receptions: 3, receivingYards: 28, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1983, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1213, rushingTDs: 12, carries: 158, receptions: 2, receivingYards: 30, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1984, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 475, rushingTDs: 5, carries: 87, receptions: 3, receivingYards: 45, receivingTDs: 1, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1985, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1786, rushingTDs: 17, carries: 278, receptions: 6, receivingYards: 63, receivingTDs: 1, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 8. Deion Sanders
  { player: { firstName: 'Deion', lastName: 'Sanders', team: 'Florida State', position: 'DEF', conference: 'ACC' }, stats: [
    { season: 1985, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 20, sacks: 0, defensiveInterceptions: 1, forcedFumbles: 0, passesDefended: 3 },
    { season: 1986, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 25, sacks: 0, defensiveInterceptions: 3, forcedFumbles: 0, passesDefended: 5 },
    { season: 1987, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 30, sacks: 0, defensiveInterceptions: 5, forcedFumbles: 1, passesDefended: 8 },
    { season: 1988, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 30, sacks: 0, defensiveInterceptions: 5, forcedFumbles: 1, passesDefended: 10 },
  ]},
  // 9. Eric Dickerson
  { player: { firstName: 'Eric', lastName: 'Dickerson', team: 'SMU', position: 'RB', conference: 'SWC' }, stats: [
    { season: 1979, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 477, rushingTDs: 6, carries: 115, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1980, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 928, rushingTDs: 5, carries: 166, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1981, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1428, rushingTDs: 19, carries: 277, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1982, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1617, rushingTDs: 17, carries: 232, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 10. Earl Campbell
  { player: { firstName: 'Earl', lastName: 'Campbell', team: 'Texas', position: 'RB', conference: 'SWC' }, stats: [
    { season: 1974, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 928, rushingTDs: 6, carries: 162, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1975, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1118, rushingTDs: 13, carries: 198, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1977, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1744, rushingTDs: 19, carries: 267, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 11. Tony Dorsett
  { player: { firstName: 'Tony', lastName: 'Dorsett', team: 'Pittsburgh', position: 'RB', conference: 'Independent' }, stats: [
    { season: 1973, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1586, rushingTDs: 12, carries: 286, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1974, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1004, rushingTDs: 9, carries: 209, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1975, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1544, rushingTDs: 11, carries: 250, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1976, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 2150, rushingTDs: 21, carries: 351, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 12. Doug Flutie
  { player: { firstName: 'Doug', lastName: 'Flutie', team: 'Boston College', position: 'QB', conference: 'Independent' }, stats: [
    { season: 1981, passingYards: 1652, passingTDs: 10, interceptions: 8, completions: 105, attempts: 192, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1982, passingYards: 2749, passingTDs: 13, interceptions: 20, completions: 152, attempts: 280, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1983, passingYards: 2724, passingTDs: 17, interceptions: 15, completions: 155, attempts: 286, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1984, passingYards: 3454, passingTDs: 27, interceptions: 11, completions: 196, attempts: 312, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 13. Archie Griffin
  { player: { firstName: 'Archie', lastName: 'Griffin', team: 'Ohio State', position: 'RB', conference: 'Big Ten' }, stats: [
    { season: 1972, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 767, rushingTDs: 3, carries: 159, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1973, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1428, rushingTDs: 6, carries: 247, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1974, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1620, rushingTDs: 12, carries: 236, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1975, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1357, rushingTDs: 7, carries: 262, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 14. Peyton Manning
  { player: { firstName: 'Peyton', lastName: 'Manning', team: 'Tennessee', position: 'QB', conference: 'SEC' }, stats: [
    { season: 1994, passingYards: 1141, passingTDs: 11, interceptions: 6, completions: 89, attempts: 144, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1995, passingYards: 2954, passingTDs: 22, interceptions: 4, completions: 244, attempts: 380, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1996, passingYards: 3287, passingTDs: 20, interceptions: 12, completions: 243, attempts: 380, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1997, passingYards: 3819, passingTDs: 36, interceptions: 11, completions: 287, attempts: 477, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 15. Danny Wuerffel
  { player: { firstName: 'Danny', lastName: 'Wuerffel', team: 'Florida', position: 'QB', conference: 'SEC' }, stats: [
    { season: 1993, passingYards: 2230, passingTDs: 22, interceptions: 10, completions: 160, attempts: 260, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1995, passingYards: 3266, passingTDs: 35, interceptions: 10, completions: 207, attempts: 327, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1996, passingYards: 3625, passingTDs: 39, interceptions: 13, completions: 221, attempts: 370, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 16. Eddie George
  { player: { firstName: 'Eddie', lastName: 'George', team: 'Ohio State', position: 'RB', conference: 'Big Ten' }, stats: [
    { season: 1992, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 176, rushingTDs: 5, carries: 42, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1994, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1442, rushingTDs: 12, carries: 276, receptions: 17, receivingYards: 133, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1995, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1927, rushingTDs: 24, carries: 328, receptions: 16, receivingYards: 162, receivingTDs: 1, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 17. Tommie Frazier
  { player: { firstName: 'Tommie', lastName: 'Frazier', team: 'Nebraska', position: 'QB', conference: 'Big 12' }, stats: [
    { season: 1992, passingYards: 727, passingTDs: 10, interceptions: 5, completions: 65, attempts: 130, rushingYards: 399, rushingTDs: 7, carries: 80, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1993, passingYards: 1159, passingTDs: 12, interceptions: 4, completions: 77, attempts: 162, rushingYards: 704, rushingTDs: 9, carries: 126, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1995, passingYards: 1159, passingTDs: 12, interceptions: 4, completions: 77, attempts: 162, rushingYards: 604, rushingTDs: 14, carries: 108, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 18. Darren McFadden
  { player: { firstName: 'Darren', lastName: 'McFadden', team: 'Arkansas', position: 'RB', conference: 'SEC' }, stats: [
    { season: 2005, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1113, rushingTDs: 11, carries: 176, receptions: 12, receivingYards: 114, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2006, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1647, rushingTDs: 14, carries: 284, receptions: 17, receivingYards: 172, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2007, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1830, rushingTDs: 16, carries: 325, receptions: 16, receivingYards: 163, receivingTDs: 1, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 19. Reggie Bush (may be missing from PBP)
  { player: { firstName: 'Reggie', lastName: 'Bush', team: 'USC', position: 'RB', conference: 'Pac-12' }, stats: [
    { season: 2003, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 293, rushingTDs: 3, carries: 56, receptions: 15, receivingYards: 143, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2004, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 908, rushingTDs: 8, carries: 145, receptions: 37, receivingYards: 509, receivingTDs: 5, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2005, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 1740, rushingTDs: 16, carries: 200, receptions: 37, receivingYards: 478, receivingTDs: 2, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 20. Matt Leinart
  { player: { firstName: 'Matt', lastName: 'Leinart', team: 'USC', position: 'QB', conference: 'Pac-12' }, stats: [
    { season: 2003, passingYards: 3556, passingTDs: 38, interceptions: 9, completions: 255, attempts: 387, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2004, passingYards: 3322, passingTDs: 33, interceptions: 6, completions: 289, attempts: 412, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2005, passingYards: 3815, passingTDs: 28, interceptions: 8, completions: 236, attempts: 363, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 21. Vince Young
  { player: { firstName: 'Vince', lastName: 'Young', team: 'Texas', position: 'QB', conference: 'Big 12' }, stats: [
    { season: 2003, passingYards: 1155, passingTDs: 6, interceptions: 4, completions: 64, attempts: 110, rushingYards: 456, rushingTDs: 5, carries: 74, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2004, passingYards: 2490, passingTDs: 12, interceptions: 11, completions: 184, attempts: 302, rushingYards: 1079, rushingTDs: 14, carries: 155, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2005, passingYards: 3036, passingTDs: 26, interceptions: 10, completions: 212, attempts: 325, rushingYards: 1050, rushingTDs: 12, carries: 155, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 22. Troy Smith
  { player: { firstName: 'Troy', lastName: 'Smith', team: 'Ohio State', position: 'QB', conference: 'Big Ten' }, stats: [
    { season: 2004, passingYards: 896, passingTDs: 7, interceptions: 3, completions: 62, attempts: 107, rushingYards: 355, rushingTDs: 5, carries: 67, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2005, passingYards: 2282, passingTDs: 16, interceptions: 4, completions: 149, attempts: 237, rushingYards: 611, rushingTDs: 11, carries: 117, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2006, passingYards: 2542, passingTDs: 30, interceptions: 6, completions: 203, attempts: 311, rushingYards: 233, rushingTDs: 1, carries: 80, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 23. Dan Marino
  { player: { firstName: 'Dan', lastName: 'Marino', team: 'Pittsburgh', position: 'QB', conference: 'Independent' }, stats: [
    { season: 1979, passingYards: 1680, passingTDs: 10, interceptions: 9, completions: 124, attempts: 220, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1980, passingYards: 1609, passingTDs: 15, interceptions: 14, completions: 108, attempts: 195, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1981, passingYards: 2876, passingTDs: 37, interceptions: 23, completions: 170, attempts: 290, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1982, passingYards: 2432, passingTDs: 17, interceptions: 23, completions: 163, attempts: 280, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 24. Joe Montana
  { player: { firstName: 'Joe', lastName: 'Montana', team: 'Notre Dame', position: 'QB', conference: 'Independent' }, stats: [
    { season: 1977, passingYards: 1604, passingTDs: 11, interceptions: 8, completions: 0, attempts: 0, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1978, passingYards: 2010, passingTDs: 10, interceptions: 9, completions: 0, attempts: 0, rushingYards: 0, rushingTDs: 0, carries: 0, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 25. Jim Brown
  { player: { firstName: 'Jim', lastName: 'Brown', team: 'Syracuse', position: 'RB', conference: 'Independent' }, stats: [
    { season: 1954, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 439, rushingTDs: 4, carries: 75, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1955, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 666, rushingTDs: 6, carries: 128, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 1956, passingYards: 0, passingTDs: 0, interceptions: 0, completions: 0, attempts: 0, rushingYards: 986, rushingTDs: 13, carries: 158, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
  // 26. Pat White
  { player: { firstName: 'Pat', lastName: 'White', team: 'West Virginia', position: 'QB', conference: 'Big East' }, stats: [
    { season: 2005, passingYards: 952, passingTDs: 8, interceptions: 5, completions: 65, attempts: 114, rushingYards: 952, rushingTDs: 7, carries: 140, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2006, passingYards: 1655, passingTDs: 13, interceptions: 5, completions: 110, attempts: 190, rushingYards: 1219, rushingTDs: 18, carries: 190, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2007, passingYards: 1724, passingTDs: 14, interceptions: 4, completions: 120, attempts: 200, rushingYards: 1335, rushingTDs: 14, carries: 210, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
    { season: 2008, passingYards: 1842, passingTDs: 21, interceptions: 6, completions: 140, attempts: 230, rushingYards: 974, rushingTDs: 8, carries: 175, receptions: 0, receivingYards: 0, receivingTDs: 0, tackles: 0, sacks: 0, defensiveInterceptions: 0, forcedFumbles: 0, passesDefended: 0 },
  ]},
];

// ---- MAIN ----
function main() {
  const playersPath = path.join(DATA_DIR, 'players.json');
  const statsPath = path.join(DATA_DIR, 'player-stats.json');

  const existingPlayers = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  const existingStats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));

  // Build existing name set for dedup
  const existingNames = new Set(
    existingPlayers.map((p: any) => `${p.firstName} ${p.lastName}`.toLowerCase())
  );

  let addedPlayers = 0;
  let addedStats = 0;

  for (const legend of legends) {
    const fullName = `${legend.player.firstName} ${legend.player.lastName}`;
    const id = nameToId(fullName);

    // Add player if not already present
    if (!existingNames.has(fullName.toLowerCase())) {
      existingPlayers.push({
        id,
        firstName: legend.player.firstName,
        lastName: legend.player.lastName,
        team: legend.player.team,
        position: legend.player.position,
        jersey: 0,
        height: 0,
        weight: 0,
        year: '',
        hometown: '',
        conference: legend.player.conference,
      });
      existingNames.add(fullName.toLowerCase());
      addedPlayers++;
    }

    // Add stats for each season
    for (const stat of legend.stats) {
      // Check if stat already exists
      const exists = existingStats.some(
        (s: any) => s.player.toLowerCase() === fullName.toLowerCase() && s.season === stat.season
      );
      if (exists) continue;

      const { season, ...statFields } = stat;
      existingStats.push({
        playerId: id,
        player: fullName,
        team: legend.player.team,
        season,
        category: legend.player.position === 'DEF' ? 'defensive' :
                  legend.player.position === 'QB' ? 'passing' :
                  legend.player.position === 'WR' ? 'receiving' : 'rushing',
        ...statFields,
        conference: legend.player.conference,
      });
      addedStats++;
    }
  }

  // Sort players alphabetically
  existingPlayers.sort((a: any, b: any) =>
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  );

  fs.writeFileSync(playersPath, JSON.stringify(existingPlayers, null, 2));
  fs.writeFileSync(statsPath, JSON.stringify(existingStats, null, 2));

  console.log(`Added ${addedPlayers} legend players, ${addedStats} stat seasons`);
  console.log(`Total players: ${existingPlayers.length}, Total stats: ${existingStats.length}`);
}

main();
