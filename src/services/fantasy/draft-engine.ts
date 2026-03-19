import type {
  DraftState,
  DraftStatus,
  DraftPick,
  FantasyPlayerInfo,
  AuctionState,
  RosterSettings,
} from '@/types';

import {
  getPlayersByPosition,
  getPlayerStats,
} from '@/services/data/cfbd-cache';

// ---------------------------------------------------------------------------
// MOCK PLAYER POOL — 150+ real college football players (2023-2025 seasons)
// ---------------------------------------------------------------------------

export const MOCK_PLAYER_POOL: FantasyPlayerInfo[] = [
  // ---- QUARTERBACKS (25) ----
  { id: 'qb-001', name: 'Shedeur Sanders', position: 'QB', school: 'Colorado', conference: 'Big 12', projectedPoints: 312.4, adp: 1, byeWeek: 7, seasonStats: { passingYards: 3926, passingTDs: 27, rushingYards: 125, rushingTDs: 2, interceptions: 3 } },
  { id: 'qb-002', name: 'Cam Ward', position: 'QB', school: 'Miami', conference: 'ACC', projectedPoints: 308.1, adp: 2, byeWeek: 9, seasonStats: { passingYards: 4123, passingTDs: 36, rushingYards: 210, rushingTDs: 3, interceptions: 7 } },
  { id: 'qb-003', name: 'Carson Beck', position: 'QB', school: 'Georgia', conference: 'SEC', projectedPoints: 295.7, adp: 5, byeWeek: 6, seasonStats: { passingYards: 3941, passingTDs: 28, rushingYards: 64, rushingTDs: 1, interceptions: 12 } },
  { id: 'qb-004', name: 'Quinn Ewers', position: 'QB', school: 'Texas', conference: 'SEC', projectedPoints: 288.3, adp: 8, byeWeek: 8, seasonStats: { passingYards: 3479, passingTDs: 29, rushingYards: 85, rushingTDs: 2, interceptions: 8 } },
  { id: 'qb-005', name: 'Jalen Milroe', position: 'QB', school: 'Alabama', conference: 'SEC', projectedPoints: 301.9, adp: 4, byeWeek: 10, seasonStats: { passingYards: 2834, passingTDs: 23, rushingYards: 719, rushingTDs: 12, interceptions: 6 } },
  { id: 'qb-006', name: 'Dillon Gabriel', position: 'QB', school: 'Oregon', conference: 'Big Ten', projectedPoints: 290.5, adp: 6, byeWeek: 5, seasonStats: { passingYards: 3558, passingTDs: 28, rushingYards: 312, rushingTDs: 7, interceptions: 6 } },
  { id: 'qb-007', name: 'Jaxson Dart', position: 'QB', school: 'Ole Miss', conference: 'SEC', projectedPoints: 276.2, adp: 12, byeWeek: 7, seasonStats: { passingYards: 3713, passingTDs: 25, rushingYards: 380, rushingTDs: 5, interceptions: 5 } },
  { id: 'qb-008', name: 'Drew Allar', position: 'QB', school: 'Penn State', conference: 'Big Ten', projectedPoints: 268.0, adp: 15, byeWeek: 6, seasonStats: { passingYards: 3192, passingTDs: 24, rushingYards: 141, rushingTDs: 3, interceptions: 7 } },
  { id: 'qb-009', name: 'Kyle McCord', position: 'QB', school: 'Syracuse', conference: 'ACC', projectedPoints: 271.4, adp: 14, byeWeek: 11, seasonStats: { passingYards: 3870, passingTDs: 26, rushingYards: 55, rushingTDs: 1, interceptions: 12 } },
  { id: 'qb-010', name: 'Miller Moss', position: 'QB', school: 'USC', conference: 'Big Ten', projectedPoints: 260.3, adp: 18, byeWeek: 8, seasonStats: { passingYards: 3014, passingTDs: 22, rushingYards: 90, rushingTDs: 2, interceptions: 9 } },
  { id: 'qb-011', name: 'Cade Klubnik', position: 'QB', school: 'Clemson', conference: 'ACC', projectedPoints: 265.8, adp: 16, byeWeek: 7, seasonStats: { passingYards: 3303, passingTDs: 26, rushingYards: 456, rushingTDs: 7, interceptions: 5 } },
  { id: 'qb-012', name: 'Garrett Nussmeier', position: 'QB', school: 'LSU', conference: 'SEC', projectedPoints: 274.1, adp: 13, byeWeek: 9, seasonStats: { passingYards: 3739, passingTDs: 29, rushingYards: 42, rushingTDs: 1, interceptions: 11 } },
  { id: 'qb-013', name: 'Avery Johnson', position: 'QB', school: 'Kansas State', conference: 'Big 12', projectedPoints: 255.6, adp: 22, byeWeek: 6, seasonStats: { passingYards: 2638, passingTDs: 19, rushingYards: 692, rushingTDs: 8, interceptions: 5 } },
  { id: 'qb-014', name: 'Conner Weigman', position: 'QB', school: 'Texas A&M', conference: 'SEC', projectedPoints: 242.0, adp: 30, byeWeek: 10, seasonStats: { passingYards: 2710, passingTDs: 18, rushingYards: 175, rushingTDs: 3, interceptions: 7 } },
  { id: 'qb-015', name: 'DJ Uiagalelei', position: 'QB', school: 'Florida State', conference: 'ACC', projectedPoints: 237.5, adp: 34, byeWeek: 11, seasonStats: { passingYards: 2507, passingTDs: 17, rushingYards: 355, rushingTDs: 4, interceptions: 8 } },
  { id: 'qb-016', name: 'Tyler Shough', position: 'QB', school: 'Louisville', conference: 'ACC', projectedPoints: 248.3, adp: 27, byeWeek: 5, seasonStats: { passingYards: 3012, passingTDs: 23, rushingYards: 108, rushingTDs: 2, interceptions: 6 } },
  { id: 'qb-017', name: 'Will Howard', position: 'QB', school: 'Ohio State', conference: 'Big Ten', projectedPoints: 262.7, adp: 17, byeWeek: 5, seasonStats: { passingYards: 3241, passingTDs: 26, rushingYards: 235, rushingTDs: 5, interceptions: 9 } },
  { id: 'qb-018', name: 'Maalik Murphy', position: 'QB', school: 'Duke', conference: 'ACC', projectedPoints: 231.4, adp: 38, byeWeek: 8, seasonStats: { passingYards: 2689, passingTDs: 17, rushingYards: 142, rushingTDs: 2, interceptions: 10 } },
  { id: 'qb-019', name: 'Donovan Smith', position: 'QB', school: 'Houston', conference: 'Big 12', projectedPoints: 225.8, adp: 42, byeWeek: 9, seasonStats: { passingYards: 2488, passingTDs: 16, rushingYards: 312, rushingTDs: 4, interceptions: 7 } },
  { id: 'qb-020', name: 'Cameron Rising', position: 'QB', school: 'Utah', conference: 'Big 12', projectedPoints: 252.1, adp: 24, byeWeek: 7, seasonStats: { passingYards: 2914, passingTDs: 22, rushingYards: 290, rushingTDs: 4, interceptions: 6 } },
  { id: 'qb-021', name: 'Sam Hartman', position: 'QB', school: 'Notre Dame', conference: 'Independent', projectedPoints: 245.0, adp: 28, byeWeek: 6, seasonStats: { passingYards: 2689, passingTDs: 24, rushingYards: 120, rushingTDs: 3, interceptions: 8 } },
  { id: 'qb-022', name: 'KJ Jefferson', position: 'QB', school: 'UCF', conference: 'Big 12', projectedPoints: 239.3, adp: 32, byeWeek: 10, seasonStats: { passingYards: 2311, passingTDs: 17, rushingYards: 510, rushingTDs: 6, interceptions: 5 } },
  { id: 'qb-023', name: 'Taylen Green', position: 'QB', school: 'Baylor', conference: 'Big 12', projectedPoints: 233.7, adp: 36, byeWeek: 11, seasonStats: { passingYards: 2405, passingTDs: 15, rushingYards: 620, rushingTDs: 7, interceptions: 9 } },
  { id: 'qb-024', name: 'Haynes King', position: 'QB', school: 'Georgia Tech', conference: 'ACC', projectedPoints: 228.4, adp: 40, byeWeek: 8, seasonStats: { passingYards: 2518, passingTDs: 16, rushingYards: 465, rushingTDs: 5, interceptions: 6 } },
  { id: 'qb-025', name: 'Spencer Sanders', position: 'QB', school: 'Ole Miss', conference: 'SEC', projectedPoints: 220.1, adp: 45, byeWeek: 7, seasonStats: { passingYards: 2344, passingTDs: 14, rushingYards: 385, rushingTDs: 4, interceptions: 10 } },

  // ---- RUNNING BACKS (40) ----
  { id: 'rb-001', name: 'Ashton Jeanty', position: 'RB', school: 'Boise State', conference: 'Mountain West', projectedPoints: 298.5, adp: 3, byeWeek: 6, seasonStats: { rushingYards: 2497, rushingTDs: 29, receptions: 20, receivingYards: 180, receivingTDs: 1, fumblesLost: 2 } },
  { id: 'rb-002', name: 'Omarion Hampton', position: 'RB', school: 'North Carolina', conference: 'ACC', projectedPoints: 258.3, adp: 9, byeWeek: 8, seasonStats: { rushingYards: 1660, rushingTDs: 15, receptions: 24, receivingYards: 235, receivingTDs: 2, fumblesLost: 1 } },
  { id: 'rb-003', name: 'TreVeyon Henderson', position: 'RB', school: 'Ohio State', conference: 'Big Ten', projectedPoints: 245.7, adp: 11, byeWeek: 5, seasonStats: { rushingYards: 1450, rushingTDs: 15, receptions: 18, receivingYards: 152, receivingTDs: 1, fumblesLost: 2 } },
  { id: 'rb-004', name: 'Quinshon Judkins', position: 'RB', school: 'Ohio State', conference: 'Big Ten', projectedPoints: 240.2, adp: 10, byeWeek: 5, seasonStats: { rushingYards: 1322, rushingTDs: 14, receptions: 22, receivingYards: 195, receivingTDs: 2, fumblesLost: 1 } },
  { id: 'rb-005', name: 'Ollie Gordon II', position: 'RB', school: 'Oklahoma State', conference: 'Big 12', projectedPoints: 235.8, adp: 19, byeWeek: 7, seasonStats: { rushingYards: 1410, rushingTDs: 12, receptions: 16, receivingYards: 140, receivingTDs: 1, fumblesLost: 3 } },
  { id: 'rb-006', name: 'Kaleb Johnson', position: 'RB', school: 'Iowa', conference: 'Big Ten', projectedPoints: 230.4, adp: 20, byeWeek: 9, seasonStats: { rushingYards: 1537, rushingTDs: 14, receptions: 10, receivingYards: 88, receivingTDs: 0, fumblesLost: 2 } },
  { id: 'rb-007', name: 'Devin Neal', position: 'RB', school: 'Kansas', conference: 'Big 12', projectedPoints: 224.1, adp: 23, byeWeek: 10, seasonStats: { rushingYards: 1266, rushingTDs: 11, receptions: 28, receivingYards: 312, receivingTDs: 2, fumblesLost: 1 } },
  { id: 'rb-008', name: 'RJ Harvey', position: 'RB', school: 'UCF', conference: 'Big 12', projectedPoints: 231.6, adp: 21, byeWeek: 10, seasonStats: { rushingYards: 1416, rushingTDs: 17, receptions: 14, receivingYards: 110, receivingTDs: 1, fumblesLost: 2 } },
  { id: 'rb-009', name: 'Jarquez Hunter', position: 'RB', school: 'Auburn', conference: 'SEC', projectedPoints: 219.7, adp: 25, byeWeek: 8, seasonStats: { rushingYards: 1230, rushingTDs: 11, receptions: 20, receivingYards: 175, receivingTDs: 1, fumblesLost: 1 } },
  { id: 'rb-010', name: 'Woody Marks', position: 'RB', school: 'USC', conference: 'Big Ten', projectedPoints: 215.3, adp: 26, byeWeek: 8, seasonStats: { rushingYards: 1194, rushingTDs: 10, receptions: 30, receivingYards: 280, receivingTDs: 2, fumblesLost: 1 } },
  { id: 'rb-011', name: 'DJ Giddens', position: 'RB', school: 'Kansas State', conference: 'Big 12', projectedPoints: 218.9, adp: 29, byeWeek: 6, seasonStats: { rushingYards: 1344, rushingTDs: 12, receptions: 12, receivingYards: 95, receivingTDs: 0, fumblesLost: 1 } },
  { id: 'rb-012', name: 'Cam Skattebo', position: 'RB', school: 'Arizona State', conference: 'Big 12', projectedPoints: 242.8, adp: 7, byeWeek: 9, seasonStats: { rushingYards: 1568, rushingTDs: 17, receptions: 34, receivingYards: 410, receivingTDs: 3, fumblesLost: 2 } },
  { id: 'rb-013', name: 'Tahj Brooks', position: 'RB', school: 'Texas Tech', conference: 'Big 12', projectedPoints: 208.5, adp: 31, byeWeek: 7, seasonStats: { rushingYards: 1288, rushingTDs: 12, receptions: 15, receivingYards: 120, receivingTDs: 1, fumblesLost: 2 } },
  { id: 'rb-014', name: 'Donovan Edwards', position: 'RB', school: 'Michigan', conference: 'Big Ten', projectedPoints: 198.7, adp: 35, byeWeek: 5, seasonStats: { rushingYards: 1058, rushingTDs: 9, receptions: 22, receivingYards: 218, receivingTDs: 2, fumblesLost: 2 } },
  { id: 'rb-015', name: 'Phil Mafah', position: 'RB', school: 'Clemson', conference: 'ACC', projectedPoints: 205.2, adp: 33, byeWeek: 7, seasonStats: { rushingYards: 1188, rushingTDs: 11, receptions: 10, receivingYards: 88, receivingTDs: 0, fumblesLost: 1 } },
  { id: 'rb-016', name: 'Raheim Sanders', position: 'RB', school: 'South Carolina', conference: 'SEC', projectedPoints: 192.4, adp: 37, byeWeek: 8, seasonStats: { rushingYards: 1012, rushingTDs: 8, receptions: 26, receivingYards: 265, receivingTDs: 2, fumblesLost: 1 } },
  { id: 'rb-017', name: 'Trevor Etienne', position: 'RB', school: 'Georgia', conference: 'SEC', projectedPoints: 201.0, adp: 39, byeWeek: 6, seasonStats: { rushingYards: 1095, rushingTDs: 10, receptions: 18, receivingYards: 156, receivingTDs: 1, fumblesLost: 2 } },
  { id: 'rb-018', name: 'Nicholas Singleton', position: 'RB', school: 'Penn State', conference: 'Big Ten', projectedPoints: 196.3, adp: 41, byeWeek: 6, seasonStats: { rushingYards: 1010, rushingTDs: 10, receptions: 12, receivingYards: 104, receivingTDs: 1, fumblesLost: 1 } },
  { id: 'rb-019', name: 'Kaytron Allen', position: 'RB', school: 'Penn State', conference: 'Big Ten', projectedPoints: 189.1, adp: 43, byeWeek: 6, seasonStats: { rushingYards: 968, rushingTDs: 9, receptions: 14, receivingYards: 115, receivingTDs: 1, fumblesLost: 1 } },
  { id: 'rb-020', name: 'Dylan Sampson', position: 'RB', school: 'Tennessee', conference: 'SEC', projectedPoints: 222.5, adp: 44, byeWeek: 11, seasonStats: { rushingYards: 1485, rushingTDs: 22, receptions: 8, receivingYards: 62, receivingTDs: 0, fumblesLost: 3 } },
  { id: 'rb-021', name: 'Jonah Coleman', position: 'RB', school: 'Washington', conference: 'Big Ten', projectedPoints: 186.5, adp: 46, byeWeek: 9, seasonStats: { rushingYards: 1056, rushingTDs: 9, receptions: 10, receivingYards: 85, receivingTDs: 0, fumblesLost: 2 } },
  { id: 'rb-022', name: 'Damien Martinez', position: 'RB', school: 'Miami', conference: 'ACC', projectedPoints: 194.8, adp: 47, byeWeek: 9, seasonStats: { rushingYards: 1112, rushingTDs: 10, receptions: 16, receivingYards: 130, receivingTDs: 1, fumblesLost: 1 } },
  { id: 'rb-023', name: 'Cody Schrader', position: 'RB', school: 'Missouri', conference: 'SEC', projectedPoints: 184.2, adp: 48, byeWeek: 10, seasonStats: { rushingYards: 1627, rushingTDs: 14, receptions: 9, receivingYards: 66, receivingTDs: 0, fumblesLost: 2 } },
  { id: 'rb-024', name: 'Jaydon Blue', position: 'RB', school: 'Texas', conference: 'SEC', projectedPoints: 178.6, adp: 52, byeWeek: 8, seasonStats: { rushingYards: 922, rushingTDs: 8, receptions: 15, receivingYards: 128, receivingTDs: 1, fumblesLost: 1 } },
  { id: 'rb-025', name: 'Blake Corum', position: 'RB', school: 'Michigan', conference: 'Big Ten', projectedPoints: 182.9, adp: 50, byeWeek: 5, seasonStats: { rushingYards: 1233, rushingTDs: 12, receptions: 8, receivingYards: 55, receivingTDs: 0, fumblesLost: 1 } },
  { id: 'rb-026', name: 'Kendall Milton', position: 'RB', school: 'Georgia', conference: 'SEC', projectedPoints: 170.4, adp: 56, byeWeek: 6, seasonStats: { rushingYards: 855, rushingTDs: 7, receptions: 12, receivingYards: 105, receivingTDs: 1, fumblesLost: 2 } },
  { id: 'rb-027', name: 'Trey Benson', position: 'RB', school: 'Florida State', conference: 'ACC', projectedPoints: 177.1, adp: 53, byeWeek: 11, seasonStats: { rushingYards: 963, rushingTDs: 9, receptions: 14, receivingYards: 120, receivingTDs: 1, fumblesLost: 1 } },
  { id: 'rb-028', name: 'Sedrick Irvin Jr', position: 'RB', school: 'Florida', conference: 'SEC', projectedPoints: 165.8, adp: 59, byeWeek: 10, seasonStats: { rushingYards: 812, rushingTDs: 7, receptions: 18, receivingYards: 155, receivingTDs: 1, fumblesLost: 1 } },
  { id: 'rb-029', name: 'Jawhar Jordan', position: 'RB', school: 'Louisville', conference: 'ACC', projectedPoints: 173.5, adp: 55, byeWeek: 5, seasonStats: { rushingYards: 900, rushingTDs: 8, receptions: 22, receivingYards: 210, receivingTDs: 2, fumblesLost: 1 } },
  { id: 'rb-030', name: 'Emeka Egbuka', position: 'RB', school: 'Ohio State', conference: 'Big Ten', projectedPoints: 162.3, adp: 61, byeWeek: 5, seasonStats: { rushingYards: 780, rushingTDs: 6, receptions: 15, receivingYards: 132, receivingTDs: 1, fumblesLost: 2 } },
  { id: 'rb-031', name: 'MarShawn Lloyd', position: 'RB', school: 'USC', conference: 'Big Ten', projectedPoints: 168.9, adp: 57, byeWeek: 8, seasonStats: { rushingYards: 876, rushingTDs: 7, receptions: 20, receivingYards: 178, receivingTDs: 1, fumblesLost: 1 } },
  { id: 'rb-032', name: 'Montrell Johnson Jr', position: 'RB', school: 'Florida', conference: 'SEC', projectedPoints: 160.1, adp: 63, byeWeek: 10, seasonStats: { rushingYards: 885, rushingTDs: 8, receptions: 10, receivingYards: 82, receivingTDs: 0, fumblesLost: 2 } },
  { id: 'rb-033', name: 'Will Shipley', position: 'RB', school: 'Clemson', conference: 'ACC', projectedPoints: 175.4, adp: 54, byeWeek: 7, seasonStats: { rushingYards: 952, rushingTDs: 9, receptions: 18, receivingYards: 160, receivingTDs: 1, fumblesLost: 1 } },
  { id: 'rb-034', name: 'Braelon Allen', position: 'RB', school: 'Wisconsin', conference: 'Big Ten', projectedPoints: 171.7, adp: 58, byeWeek: 9, seasonStats: { rushingYards: 1103, rushingTDs: 10, receptions: 6, receivingYards: 40, receivingTDs: 0, fumblesLost: 2 } },
  { id: 'rb-035', name: 'Devin Mockobee', position: 'RB', school: 'Purdue', conference: 'Big Ten', projectedPoints: 152.0, adp: 68, byeWeek: 9, seasonStats: { rushingYards: 872, rushingTDs: 7, receptions: 12, receivingYards: 95, receivingTDs: 0, fumblesLost: 1 } },
  { id: 'rb-036', name: 'Bhayshul Tuten', position: 'RB', school: 'Virginia Tech', conference: 'ACC', projectedPoints: 188.3, adp: 49, byeWeek: 7, seasonStats: { rushingYards: 1165, rushingTDs: 13, receptions: 10, receivingYards: 72, receivingTDs: 0, fumblesLost: 2 } },
  { id: 'rb-037', name: 'Carson Steele', position: 'RB', school: 'UCLA', conference: 'Big Ten', projectedPoints: 155.8, adp: 66, byeWeek: 6, seasonStats: { rushingYards: 896, rushingTDs: 8, receptions: 8, receivingYards: 62, receivingTDs: 0, fumblesLost: 1 } },
  { id: 'rb-038', name: 'Trey Sanders', position: 'RB', school: 'TCU', conference: 'Big 12', projectedPoints: 148.5, adp: 72, byeWeek: 11, seasonStats: { rushingYards: 778, rushingTDs: 6, receptions: 14, receivingYards: 118, receivingTDs: 1, fumblesLost: 2 } },
  { id: 'rb-039', name: 'George Holani', position: 'RB', school: 'Boise State', conference: 'Mountain West', projectedPoints: 158.2, adp: 64, byeWeek: 6, seasonStats: { rushingYards: 940, rushingTDs: 8, receptions: 10, receivingYards: 78, receivingTDs: 0, fumblesLost: 1 } },
  { id: 'rb-040', name: 'Lew Nichols III', position: 'RB', school: 'Michigan State', conference: 'Big Ten', projectedPoints: 145.0, adp: 75, byeWeek: 5, seasonStats: { rushingYards: 745, rushingTDs: 5, receptions: 20, receivingYards: 175, receivingTDs: 1, fumblesLost: 1 } },

  // ---- WIDE RECEIVERS (50) ----
  { id: 'wr-001', name: 'Tetairoa McMillan', position: 'WR', school: 'Arizona', conference: 'Big 12', projectedPoints: 275.4, adp: 7, byeWeek: 8, seasonStats: { receptions: 84, receivingYards: 1319, receivingTDs: 10, rushingYards: 25, rushingTDs: 0 } },
  { id: 'wr-002', name: 'Luther Burden III', position: 'WR', school: 'Missouri', conference: 'SEC', projectedPoints: 260.1, adp: 11, byeWeek: 10, seasonStats: { receptions: 61, receivingYards: 1077, receivingTDs: 12, rushingYards: 78, rushingTDs: 1 } },
  { id: 'wr-003', name: 'Travis Hunter', position: 'WR', school: 'Colorado', conference: 'Big 12', projectedPoints: 282.0, adp: 3, byeWeek: 7, seasonStats: { receptions: 92, receivingYards: 1152, receivingTDs: 14, rushingYards: 10, rushingTDs: 0 } },
  { id: 'wr-004', name: 'Tez Johnson', position: 'WR', school: 'Oregon', conference: 'Big Ten', projectedPoints: 238.5, adp: 20, byeWeek: 5, seasonStats: { receptions: 86, receivingYards: 1025, receivingTDs: 8, rushingYards: 42, rushingTDs: 0 } },
  { id: 'wr-005', name: 'Xavier Worthy', position: 'WR', school: 'Texas', conference: 'SEC', projectedPoints: 232.1, adp: 23, byeWeek: 8, seasonStats: { receptions: 60, receivingYards: 977, receivingTDs: 9, rushingYards: 65, rushingTDs: 1 } },
  { id: 'wr-006', name: 'Rome Odunze', position: 'WR', school: 'Washington', conference: 'Big Ten', projectedPoints: 248.7, adp: 15, byeWeek: 9, seasonStats: { receptions: 70, receivingYards: 1145, receivingTDs: 8, rushingYards: 15, rushingTDs: 0 } },
  { id: 'wr-007', name: 'Evan Stewart', position: 'WR', school: 'Oregon', conference: 'Big Ten', projectedPoints: 228.3, adp: 26, byeWeek: 5, seasonStats: { receptions: 67, receivingYards: 965, receivingTDs: 7, rushingYards: 38, rushingTDs: 0 } },
  { id: 'wr-008', name: 'Dane Key', position: 'WR', school: 'Kentucky', conference: 'SEC', projectedPoints: 215.6, adp: 32, byeWeek: 7, seasonStats: { receptions: 72, receivingYards: 920, receivingTDs: 7, rushingYards: 12, rushingTDs: 0 } },
  { id: 'wr-009', name: 'Xavier Restrepo', position: 'WR', school: 'Miami', conference: 'ACC', projectedPoints: 242.4, adp: 18, byeWeek: 9, seasonStats: { receptions: 78, receivingYards: 1128, receivingTDs: 9, rushingYards: 30, rushingTDs: 0 } },
  { id: 'wr-010', name: 'Barion Brown', position: 'WR', school: 'Kentucky', conference: 'SEC', projectedPoints: 210.8, adp: 35, byeWeek: 7, seasonStats: { receptions: 55, receivingYards: 870, receivingTDs: 6, rushingYards: 110, rushingTDs: 1 } },
  { id: 'wr-011', name: 'Elic Ayomanor', position: 'WR', school: 'Stanford', conference: 'ACC', projectedPoints: 218.2, adp: 30, byeWeek: 6, seasonStats: { receptions: 64, receivingYards: 948, receivingTDs: 8, rushingYards: 18, rushingTDs: 0 } },
  { id: 'wr-012', name: 'Tre Harris', position: 'WR', school: 'Ole Miss', conference: 'SEC', projectedPoints: 252.3, adp: 14, byeWeek: 7, seasonStats: { receptions: 70, receivingYards: 1154, receivingTDs: 10, rushingYards: 8, rushingTDs: 0 } },
  { id: 'wr-013', name: 'Quentin Johnston', position: 'WR', school: 'TCU', conference: 'Big 12', projectedPoints: 205.4, adp: 38, byeWeek: 11, seasonStats: { receptions: 52, receivingYards: 903, receivingTDs: 6, rushingYards: 45, rushingTDs: 0 } },
  { id: 'wr-014', name: 'Marvin Harrison Jr', position: 'WR', school: 'Ohio State', conference: 'Big Ten', projectedPoints: 278.8, adp: 4, byeWeek: 5, seasonStats: { receptions: 67, receivingYards: 1211, receivingTDs: 14, rushingYards: 5, rushingTDs: 0 } },
  { id: 'wr-015', name: 'Kobe Prentice', position: 'WR', school: 'Alabama', conference: 'SEC', projectedPoints: 198.7, adp: 42, byeWeek: 10, seasonStats: { receptions: 56, receivingYards: 812, receivingTDs: 6, rushingYards: 22, rushingTDs: 0 } },
  { id: 'wr-016', name: 'Ja\'Corey Brooks', position: 'WR', school: 'Louisville', conference: 'ACC', projectedPoints: 208.1, adp: 36, byeWeek: 5, seasonStats: { receptions: 60, receivingYards: 888, receivingTDs: 7, rushingYards: 15, rushingTDs: 0 } },
  { id: 'wr-017', name: 'LaJohntay Wester', position: 'WR', school: 'Colorado', conference: 'Big 12', projectedPoints: 220.5, adp: 28, byeWeek: 7, seasonStats: { receptions: 79, receivingYards: 948, receivingTDs: 7, rushingYards: 55, rushingTDs: 1 } },
  { id: 'wr-018', name: 'Jayden Higgins', position: 'WR', school: 'Iowa State', conference: 'Big 12', projectedPoints: 213.4, adp: 33, byeWeek: 8, seasonStats: { receptions: 68, receivingYards: 945, receivingTDs: 7, rushingYards: 10, rushingTDs: 0 } },
  { id: 'wr-019', name: 'Jeremiah Smith', position: 'WR', school: 'Ohio State', conference: 'Big Ten', projectedPoints: 265.6, adp: 9, byeWeek: 5, seasonStats: { receptions: 71, receivingYards: 1227, receivingTDs: 14, rushingYards: 35, rushingTDs: 0 } },
  { id: 'wr-020', name: 'Jordyn Tyson', position: 'WR', school: 'Arizona State', conference: 'Big 12', projectedPoints: 224.8, adp: 27, byeWeek: 9, seasonStats: { receptions: 74, receivingYards: 978, receivingTDs: 8, rushingYards: 40, rushingTDs: 0 } },
  { id: 'wr-021', name: 'Isaiah Bond', position: 'WR', school: 'Texas', conference: 'SEC', projectedPoints: 202.1, adp: 40, byeWeek: 8, seasonStats: { receptions: 52, receivingYards: 845, receivingTDs: 6, rushingYards: 72, rushingTDs: 1 } },
  { id: 'wr-022', name: 'Emeka Egbuka', position: 'WR', school: 'Ohio State', conference: 'Big Ten', projectedPoints: 244.3, adp: 17, byeWeek: 5, seasonStats: { receptions: 66, receivingYards: 1024, receivingTDs: 9, rushingYards: 48, rushingTDs: 1 } },
  { id: 'wr-023', name: 'Malik Nabers', position: 'WR', school: 'LSU', conference: 'SEC', projectedPoints: 262.7, adp: 10, byeWeek: 9, seasonStats: { receptions: 74, receivingYards: 1202, receivingTDs: 13, rushingYards: 20, rushingTDs: 0 } },
  { id: 'wr-024', name: 'Ja\'Lynn Polk', position: 'WR', school: 'Washington', conference: 'Big Ten', projectedPoints: 230.5, adp: 24, byeWeek: 9, seasonStats: { receptions: 62, receivingYards: 1002, receivingTDs: 9, rushingYards: 10, rushingTDs: 0 } },
  { id: 'wr-025', name: 'Javon Baker', position: 'WR', school: 'UCF', conference: 'Big 12', projectedPoints: 195.3, adp: 44, byeWeek: 10, seasonStats: { receptions: 54, receivingYards: 828, receivingTDs: 6, rushingYards: 18, rushingTDs: 0 } },
  { id: 'wr-026', name: 'Jaylin Noel', position: 'WR', school: 'Iowa State', conference: 'Big 12', projectedPoints: 192.8, adp: 46, byeWeek: 8, seasonStats: { receptions: 58, receivingYards: 810, receivingTDs: 5, rushingYards: 42, rushingTDs: 0 } },
  { id: 'wr-027', name: 'Kevin Concepcion', position: 'WR', school: 'NC State', conference: 'ACC', projectedPoints: 200.4, adp: 41, byeWeek: 7, seasonStats: { receptions: 60, receivingYards: 852, receivingTDs: 6, rushingYards: 130, rushingTDs: 2 } },
  { id: 'wr-028', name: 'Troy Franklin', position: 'WR', school: 'Oregon', conference: 'Big Ten', projectedPoints: 226.1, adp: 25, byeWeek: 5, seasonStats: { receptions: 58, receivingYards: 980, receivingTDs: 9, rushingYards: 12, rushingTDs: 0 } },
  { id: 'wr-029', name: 'Dont\'e Thornton', position: 'WR', school: 'Tennessee', conference: 'SEC', projectedPoints: 188.5, adp: 48, byeWeek: 11, seasonStats: { receptions: 48, receivingYards: 802, receivingTDs: 5, rushingYards: 8, rushingTDs: 0 } },
  { id: 'wr-030', name: 'Andrew Armstrong', position: 'WR', school: 'Arkansas', conference: 'SEC', projectedPoints: 206.3, adp: 37, byeWeek: 10, seasonStats: { receptions: 66, receivingYards: 898, receivingTDs: 7, rushingYards: 35, rushingTDs: 0 } },
  { id: 'wr-031', name: 'Mazeo Bennett Jr', position: 'WR', school: 'South Carolina', conference: 'SEC', projectedPoints: 185.1, adp: 50, byeWeek: 8, seasonStats: { receptions: 52, receivingYards: 775, receivingTDs: 5, rushingYards: 20, rushingTDs: 0 } },
  { id: 'wr-032', name: 'Tyler Warren', position: 'WR', school: 'Penn State', conference: 'Big Ten', projectedPoints: 236.2, adp: 19, byeWeek: 6, seasonStats: { receptions: 88, receivingYards: 1042, receivingTDs: 8, rushingYards: 95, rushingTDs: 2 } },
  { id: 'wr-033', name: 'Tayvion Robinson', position: 'WR', school: 'Kentucky', conference: 'SEC', projectedPoints: 180.2, adp: 53, byeWeek: 7, seasonStats: { receptions: 50, receivingYards: 750, receivingTDs: 4, rushingYards: 45, rushingTDs: 0 } },
  { id: 'wr-034', name: 'Jalen Royals', position: 'WR', school: 'Utah State', conference: 'Mountain West', projectedPoints: 182.7, adp: 51, byeWeek: 6, seasonStats: { receptions: 68, receivingYards: 920, receivingTDs: 5, rushingYards: 10, rushingTDs: 0 } },
  { id: 'wr-035', name: 'Adonai Mitchell', position: 'WR', school: 'Texas', conference: 'SEC', projectedPoints: 210.6, adp: 34, byeWeek: 8, seasonStats: { receptions: 56, receivingYards: 912, receivingTDs: 8, rushingYards: 18, rushingTDs: 0 } },
  { id: 'wr-036', name: 'Jack Bech', position: 'WR', school: 'TCU', conference: 'Big 12', projectedPoints: 176.4, adp: 55, byeWeek: 11, seasonStats: { receptions: 50, receivingYards: 738, receivingTDs: 5, rushingYards: 25, rushingTDs: 0 } },
  { id: 'wr-037', name: 'Elijah Moore', position: 'WR', school: 'Ole Miss', conference: 'SEC', projectedPoints: 190.8, adp: 47, byeWeek: 7, seasonStats: { receptions: 55, receivingYards: 822, receivingTDs: 6, rushingYards: 30, rushingTDs: 0 } },
  { id: 'wr-038', name: 'Theo Wease', position: 'WR', school: 'Missouri', conference: 'SEC', projectedPoints: 172.5, adp: 58, byeWeek: 10, seasonStats: { receptions: 48, receivingYards: 710, receivingTDs: 4, rushingYards: 14, rushingTDs: 0 } },
  { id: 'wr-039', name: 'Malik Washington', position: 'WR', school: 'Virginia', conference: 'ACC', projectedPoints: 178.9, adp: 54, byeWeek: 7, seasonStats: { receptions: 62, receivingYards: 780, receivingTDs: 4, rushingYards: 55, rushingTDs: 1 } },
  { id: 'wr-040', name: 'Keenan Cummings', position: 'WR', school: 'Tulane', conference: 'AAC', projectedPoints: 168.3, adp: 60, byeWeek: 9, seasonStats: { receptions: 52, receivingYards: 725, receivingTDs: 4, rushingYards: 8, rushingTDs: 0 } },
  { id: 'wr-041', name: 'Dorian Singer', position: 'WR', school: 'USC', conference: 'Big Ten', projectedPoints: 197.5, adp: 43, byeWeek: 8, seasonStats: { receptions: 58, receivingYards: 862, receivingTDs: 6, rushingYards: 15, rushingTDs: 0 } },
  { id: 'wr-042', name: 'J. Michael Sturdivant', position: 'WR', school: 'UCLA', conference: 'Big Ten', projectedPoints: 174.1, adp: 56, byeWeek: 6, seasonStats: { receptions: 55, receivingYards: 742, receivingTDs: 4, rushingYards: 20, rushingTDs: 0 } },
  { id: 'wr-043', name: 'Squirrel White', position: 'WR', school: 'Tennessee', conference: 'SEC', projectedPoints: 186.7, adp: 49, byeWeek: 11, seasonStats: { receptions: 72, receivingYards: 810, receivingTDs: 4, rushingYards: 28, rushingTDs: 0 } },
  { id: 'wr-044', name: 'Brian Thomas Jr', position: 'WR', school: 'LSU', conference: 'SEC', projectedPoints: 254.5, adp: 13, byeWeek: 9, seasonStats: { receptions: 68, receivingYards: 1177, receivingTDs: 17, rushingYards: 12, rushingTDs: 0 } },
  { id: 'wr-045', name: 'Quentin Johnston', position: 'WR', school: 'TCU', conference: 'Big 12', projectedPoints: 165.8, adp: 62, byeWeek: 11, seasonStats: { receptions: 44, receivingYards: 695, receivingTDs: 4, rushingYards: 32, rushingTDs: 0 } },
  { id: 'wr-046', name: 'Johnny Wilson', position: 'WR', school: 'Florida State', conference: 'ACC', projectedPoints: 170.2, adp: 59, byeWeek: 11, seasonStats: { receptions: 46, receivingYards: 718, receivingTDs: 5, rushingYards: 10, rushingTDs: 0 } },
  { id: 'wr-047', name: 'Ladd McConkey', position: 'WR', school: 'Georgia', conference: 'SEC', projectedPoints: 240.8, adp: 16, byeWeek: 6, seasonStats: { receptions: 58, receivingYards: 1002, receivingTDs: 10, rushingYards: 55, rushingTDs: 1 } },
  { id: 'wr-048', name: 'Jamari Thrash', position: 'WR', school: 'Louisville', conference: 'ACC', projectedPoints: 166.5, adp: 61, byeWeek: 5, seasonStats: { receptions: 45, receivingYards: 702, receivingTDs: 5, rushingYards: 38, rushingTDs: 0 } },
  { id: 'wr-049', name: 'Rico Scott', position: 'WR', school: 'SMU', conference: 'ACC', projectedPoints: 162.1, adp: 65, byeWeek: 8, seasonStats: { receptions: 48, receivingYards: 685, receivingTDs: 4, rushingYards: 22, rushingTDs: 0 } },
  { id: 'wr-050', name: 'Deandre Moore Jr', position: 'WR', school: 'Texas A&M', conference: 'SEC', projectedPoints: 158.8, adp: 67, byeWeek: 10, seasonStats: { receptions: 42, receivingYards: 665, receivingTDs: 4, rushingYards: 15, rushingTDs: 0 } },

  // ---- TIGHT ENDS (20) ----
  { id: 'te-001', name: 'Brock Bowers', position: 'TE', school: 'Georgia', conference: 'SEC', projectedPoints: 220.5, adp: 22, byeWeek: 6, seasonStats: { receptions: 56, receivingYards: 796, receivingTDs: 6, rushingYards: 45, rushingTDs: 1 } },
  { id: 'te-002', name: 'Cade Stover', position: 'TE', school: 'Ohio State', conference: 'Big Ten', projectedPoints: 175.3, adp: 45, byeWeek: 5, seasonStats: { receptions: 42, receivingYards: 576, receivingTDs: 5, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-003', name: 'Ja\'Tavion Sanders', position: 'TE', school: 'Texas', conference: 'SEC', projectedPoints: 182.1, adp: 40, byeWeek: 8, seasonStats: { receptions: 48, receivingYards: 622, receivingTDs: 5, rushingYards: 10, rushingTDs: 0 } },
  { id: 'te-004', name: 'Tyler Warren', position: 'TE', school: 'Penn State', conference: 'Big Ten', projectedPoints: 210.8, adp: 25, byeWeek: 6, seasonStats: { receptions: 82, receivingYards: 998, receivingTDs: 7, rushingYards: 80, rushingTDs: 2 } },
  { id: 'te-005', name: 'Colston Loveland', position: 'TE', school: 'Michigan', conference: 'Big Ten', projectedPoints: 168.4, adp: 48, byeWeek: 5, seasonStats: { receptions: 45, receivingYards: 582, receivingTDs: 4, rushingYards: 5, rushingTDs: 0 } },
  { id: 'te-006', name: 'Mitchell Evans', position: 'TE', school: 'Notre Dame', conference: 'Independent', projectedPoints: 155.2, adp: 55, byeWeek: 6, seasonStats: { receptions: 38, receivingYards: 502, receivingTDs: 4, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-007', name: 'Gunnar Helm', position: 'TE', school: 'Texas', conference: 'SEC', projectedPoints: 162.7, adp: 52, byeWeek: 8, seasonStats: { receptions: 42, receivingYards: 548, receivingTDs: 3, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-008', name: 'Mason Taylor', position: 'TE', school: 'LSU', conference: 'SEC', projectedPoints: 159.3, adp: 54, byeWeek: 9, seasonStats: { receptions: 40, receivingYards: 524, receivingTDs: 3, rushingYards: 12, rushingTDs: 0 } },
  { id: 'te-009', name: 'Harold Fannin Jr', position: 'TE', school: 'Bowling Green', conference: 'MAC', projectedPoints: 170.6, adp: 47, byeWeek: 10, seasonStats: { receptions: 62, receivingYards: 862, receivingTDs: 7, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-010', name: 'Benjamin Yurosek', position: 'TE', school: 'Stanford', conference: 'ACC', projectedPoints: 148.5, adp: 60, byeWeek: 6, seasonStats: { receptions: 36, receivingYards: 472, receivingTDs: 3, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-011', name: 'Brevyn Spann-Ford', position: 'TE', school: 'Minnesota', conference: 'Big Ten', projectedPoints: 142.1, adp: 64, byeWeek: 9, seasonStats: { receptions: 34, receivingYards: 438, receivingTDs: 2, rushingYards: 5, rushingTDs: 0 } },
  { id: 'te-012', name: 'AJ Barner', position: 'TE', school: 'Washington', conference: 'Big Ten', projectedPoints: 150.8, adp: 58, byeWeek: 9, seasonStats: { receptions: 38, receivingYards: 488, receivingTDs: 3, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-013', name: 'Luke Lachey', position: 'TE', school: 'Iowa', conference: 'Big Ten', projectedPoints: 136.4, adp: 68, byeWeek: 9, seasonStats: { receptions: 30, receivingYards: 410, receivingTDs: 2, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-014', name: 'Jaheim Bell', position: 'TE', school: 'Florida State', conference: 'ACC', projectedPoints: 145.9, adp: 62, byeWeek: 11, seasonStats: { receptions: 32, receivingYards: 425, receivingTDs: 3, rushingYards: 85, rushingTDs: 1 } },
  { id: 'te-015', name: 'Oscar Delp', position: 'TE', school: 'Georgia', conference: 'SEC', projectedPoints: 130.2, adp: 72, byeWeek: 6, seasonStats: { receptions: 28, receivingYards: 375, receivingTDs: 2, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-016', name: 'Elijah Arroyo', position: 'TE', school: 'Miami', conference: 'ACC', projectedPoints: 138.7, adp: 66, byeWeek: 9, seasonStats: { receptions: 32, receivingYards: 420, receivingTDs: 3, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-017', name: 'Terrance Ferguson', position: 'TE', school: 'Oregon', conference: 'Big Ten', projectedPoints: 125.3, adp: 76, byeWeek: 5, seasonStats: { receptions: 24, receivingYards: 342, receivingTDs: 2, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-018', name: 'Oronde Gadsden II', position: 'TE', school: 'Syracuse', conference: 'ACC', projectedPoints: 153.2, adp: 56, byeWeek: 11, seasonStats: { receptions: 44, receivingYards: 540, receivingTDs: 4, rushingYards: 10, rushingTDs: 0 } },
  { id: 'te-019', name: 'Will Swanson', position: 'TE', school: 'Notre Dame', conference: 'Independent', projectedPoints: 120.8, adp: 80, byeWeek: 6, seasonStats: { receptions: 22, receivingYards: 310, receivingTDs: 2, rushingYards: 0, rushingTDs: 0 } },
  { id: 'te-020', name: 'Raheim Sanders', position: 'TE', school: 'Arkansas', conference: 'SEC', projectedPoints: 128.4, adp: 74, byeWeek: 10, seasonStats: { receptions: 26, receivingYards: 355, receivingTDs: 2, rushingYards: 40, rushingTDs: 0 } },

  // ---- KICKERS (20) ----
  { id: 'k-001', name: 'Graham Nicholson', position: 'K', school: 'Alabama', conference: 'SEC', projectedPoints: 142.0, adp: 120, byeWeek: 10, seasonStats: {} },
  { id: 'k-002', name: 'Bert Auburn', position: 'K', school: 'Oregon', conference: 'Big Ten', projectedPoints: 138.5, adp: 122, byeWeek: 5, seasonStats: {} },
  { id: 'k-003', name: 'Aubrey Falk', position: 'K', school: 'Florida State', conference: 'ACC', projectedPoints: 135.2, adp: 124, byeWeek: 11, seasonStats: {} },
  { id: 'k-004', name: 'Alex Raynor', position: 'K', school: 'Kentucky', conference: 'SEC', projectedPoints: 140.1, adp: 121, byeWeek: 7, seasonStats: {} },
  { id: 'k-005', name: 'Tory Horton', position: 'K', school: 'Colorado State', conference: 'Mountain West', projectedPoints: 128.3, adp: 130, byeWeek: 8, seasonStats: {} },
  { id: 'k-006', name: 'Joshua Karty', position: 'K', school: 'Stanford', conference: 'ACC', projectedPoints: 136.8, adp: 123, byeWeek: 6, seasonStats: {} },
  { id: 'k-007', name: 'Will Reichard', position: 'K', school: 'Alabama', conference: 'SEC', projectedPoints: 141.5, adp: 119, byeWeek: 10, seasonStats: {} },
  { id: 'k-008', name: 'Brock Travelstead', position: 'K', school: 'Missouri', conference: 'SEC', projectedPoints: 130.4, adp: 128, byeWeek: 10, seasonStats: {} },
  { id: 'k-009', name: 'Cole Becker', position: 'K', school: 'SMU', conference: 'ACC', projectedPoints: 126.7, adp: 132, byeWeek: 8, seasonStats: {} },
  { id: 'k-010', name: 'Ryan Coe', position: 'K', school: 'Texas', conference: 'SEC', projectedPoints: 134.0, adp: 125, byeWeek: 8, seasonStats: {} },
  { id: 'k-011', name: 'Camden Lewis', position: 'K', school: 'Oregon', conference: 'Big Ten', projectedPoints: 127.8, adp: 131, byeWeek: 5, seasonStats: {} },
  { id: 'k-012', name: 'Jake Moody', position: 'K', school: 'Michigan', conference: 'Big Ten', projectedPoints: 137.2, adp: 126, byeWeek: 5, seasonStats: {} },
  { id: 'k-013', name: 'Jonah Dalmas', position: 'K', school: 'Boise State', conference: 'Mountain West', projectedPoints: 133.5, adp: 127, byeWeek: 6, seasonStats: {} },
  { id: 'k-014', name: 'Chris Dunn', position: 'K', school: 'NC State', conference: 'ACC', projectedPoints: 131.2, adp: 129, byeWeek: 7, seasonStats: {} },
  { id: 'k-015', name: 'Marshall Meeder', position: 'K', school: 'Clemson', conference: 'ACC', projectedPoints: 125.4, adp: 133, byeWeek: 7, seasonStats: {} },
  { id: 'k-016', name: 'Caden Davis', position: 'K', school: 'LSU', conference: 'SEC', projectedPoints: 129.6, adp: 134, byeWeek: 9, seasonStats: {} },
  { id: 'k-017', name: 'Noah Ruggles', position: 'K', school: 'Ohio State', conference: 'Big Ten', projectedPoints: 132.8, adp: 135, byeWeek: 5, seasonStats: {} },
  { id: 'k-018', name: 'Harrison Mevis', position: 'K', school: 'Iowa', conference: 'Big Ten', projectedPoints: 139.0, adp: 118, byeWeek: 9, seasonStats: {} },
  { id: 'k-019', name: 'Mitchell Fineran', position: 'K', school: 'Purdue', conference: 'Big Ten', projectedPoints: 124.1, adp: 136, byeWeek: 9, seasonStats: {} },
  { id: 'k-020', name: 'Peyton Hawkins', position: 'K', school: 'Georgia', conference: 'SEC', projectedPoints: 123.0, adp: 137, byeWeek: 6, seasonStats: {} },
];

// ---------------------------------------------------------------------------
// Cache-Backed Player Pool
// ---------------------------------------------------------------------------

let _cachedPlayerPool: FantasyPlayerInfo[] | null = null;

/**
 * Calculate projected fantasy points from a player's cached stats.
 * Uses a simplified scoring system: passing yards/25 + pass TDs*4 + rush yards/10
 * + rush TDs*6 + rec yards/10 + rec TDs*6 - INTs*2
 */
function calculateProjectedPoints(
  stats: Record<string, number>,
  position: string,
): number {
  const passYds = stats['YDS'] ?? stats['passingYards'] ?? 0;
  const passTDs = stats['TD'] ?? stats['passingTDs'] ?? 0;
  const rushYds = stats['rushingYards'] ?? stats['YDS'] ?? 0;
  const rushTDs = stats['rushingTDs'] ?? stats['TD'] ?? 0;
  const recYds = stats['receivingYards'] ?? 0;
  const recTDs = stats['receivingTDs'] ?? 0;
  const ints = stats['INT'] ?? stats['interceptions'] ?? 0;
  const receptions = stats['receptions'] ?? stats['REC'] ?? 0;

  if (position === 'QB') {
    return passYds / 25 + passTDs * 4 + rushYds / 10 + rushTDs * 6 - ints * 2;
  }
  if (position === 'RB') {
    return rushYds / 10 + rushTDs * 6 + receptions * 0.5 + recYds / 10 + recTDs * 6;
  }
  if (position === 'WR' || position === 'TE') {
    return receptions * 0.5 + recYds / 10 + recTDs * 6 + rushYds / 10 + rushTDs * 6;
  }
  return 100; // kickers get a flat estimate
}

/**
 * Build a fantasy draft player pool from cached data.
 * Returns the cached pool on subsequent calls.
 * Falls back to MOCK_PLAYER_POOL if cache is unavailable.
 */
export async function buildPlayerPoolFromCache(): Promise<FantasyPlayerInfo[]> {
  if (_cachedPlayerPool) return _cachedPlayerPool;

  try {
    const positions = ['QB', 'RB', 'WR', 'TE', 'K'];
    const positionTargets: Record<string, number> = { QB: 25, RB: 40, WR: 50, TE: 20, K: 20 };

    const playersByPos = await Promise.all(
      positions.map(pos => getPlayersByPosition(pos))
    );

    const pool: FantasyPlayerInfo[] = [];
    let adpCounter = 1;

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const players = playersByPos[i];
      const target = positionTargets[pos];

      if (!players || players.length === 0) continue;

      // Take up to target count of players
      const subset = players.slice(0, target);

      for (const player of subset) {
        let projectedPoints = 150; // default
        let seasonStats: Record<string, number> = {};
        const fullName = `${player.firstName} ${player.lastName}`;

        try {
          const statsList = getPlayerStats(player.id);
          if (statsList && statsList.length > 0) {
            const ps = statsList[0];
            // Build stats record from flat properties
            if (ps.passingYards !== undefined) seasonStats['passingYards'] = ps.passingYards;
            if (ps.passingTDs !== undefined) seasonStats['passingTDs'] = ps.passingTDs;
            if (ps.rushingYards !== undefined) seasonStats['rushingYards'] = ps.rushingYards;
            if (ps.rushingTDs !== undefined) seasonStats['rushingTDs'] = ps.rushingTDs;
            if (ps.receivingYards !== undefined) seasonStats['receivingYards'] = ps.receivingYards;
            if (ps.receivingTDs !== undefined) seasonStats['receivingTDs'] = ps.receivingTDs;
            if (ps.receptions !== undefined) seasonStats['receptions'] = ps.receptions;
            if (ps.tackles !== undefined) seasonStats['tackles'] = ps.tackles;
            if (ps.sacks !== undefined) seasonStats['sacks'] = ps.sacks;
            projectedPoints = Math.round(calculateProjectedPoints(seasonStats, pos) * 10) / 10;
          }
        } catch {
          // use defaults
        }

        pool.push({
          id: `cache-${pos.toLowerCase()}-${player.id}`,
          name: fullName,
          position: pos,
          school: player.team,
          conference: '', // cache player doesn't directly carry conference
          projectedPoints,
          adp: adpCounter++,
          byeWeek: Math.floor(Math.random() * 7) + 5, // random bye 5-11
          seasonStats,
        });
      }
    }

    if (pool.length >= 50) {
      // Sort by projected points descending and reassign ADP
      pool.sort((a, b) => b.projectedPoints - a.projectedPoints);
      pool.forEach((p, idx) => { p.adp = idx + 1; });
      _cachedPlayerPool = pool;
      return _cachedPlayerPool;
    }
  } catch {
    // fall through to mock pool
  }

  return MOCK_PLAYER_POOL;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeTotalRounds(settings: RosterSettings): number {
  return (
    settings.qb +
    settings.rb +
    settings.wr +
    settings.te +
    settings.flex +
    settings.dst +
    settings.k +
    settings.bench
  );
}

/**
 * For a given pick number, determine who picks in a snake or linear draft.
 * Rounds are 1-indexed.
 */
function pickIndexInRound(
  pickNumber: number,
  teamCount: number,
): { round: number; indexInRound: number } {
  const round = Math.floor((pickNumber - 1) / teamCount) + 1;
  const indexInRound = (pickNumber - 1) % teamCount;
  return { round, indexInRound };
}

function getPickingTeamId(
  draftOrder: string[],
  pickNumber: number,
  draftType: DraftState['draftType'],
): string {
  const teamCount = draftOrder.length;
  const { round, indexInRound } = pickIndexInRound(pickNumber, teamCount);

  if (draftType === 'snake' && round % 2 === 0) {
    // Even rounds go in reverse order for snake drafts
    return draftOrder[teamCount - 1 - indexInRound];
  }
  return draftOrder[indexInRound];
}

function positionCountForTeam(
  picks: DraftPick[],
  teamId: string,
  position: string,
): number {
  return picks.filter(
    (p) => p.teamId === teamId && p.position === position,
  ).length;
}

// ---------------------------------------------------------------------------
// Core Draft Functions
// ---------------------------------------------------------------------------

export function initializeDraft(
  leagueId: string,
  teamIds: string[],
  draftType: DraftState['draftType'],
  rosterSettings: RosterSettings,
  timePerPickMs: number = 90_000,
): DraftState {
  const totalRounds = computeTotalRounds(rosterSettings);
  const now = Date.now();

  return {
    leagueId,
    draftType,
    status: 'in_progress',
    draftOrder: [...teamIds],
    currentPick: 1,
    currentRound: 1,
    totalRounds,
    picks: [],
    availablePlayers: [...MOCK_PLAYER_POOL],
    timePerPickMs,
    pickDeadline: now + timePerPickMs,
    isPaused: false,
  };
}

/**
 * Async version of initializeDraft that uses cache-backed player data.
 * Falls back to MOCK_PLAYER_POOL if cache is unavailable.
 */
export async function initializeDraftWithCache(
  leagueId: string,
  teamIds: string[],
  draftType: DraftState['draftType'],
  rosterSettings: RosterSettings,
  timePerPickMs: number = 90_000,
): Promise<DraftState> {
  const totalRounds = computeTotalRounds(rosterSettings);
  const now = Date.now();
  const playerPool = await buildPlayerPoolFromCache();

  return {
    leagueId,
    draftType,
    status: 'in_progress',
    draftOrder: [...teamIds],
    currentPick: 1,
    currentRound: 1,
    totalRounds,
    picks: [],
    availablePlayers: [...playerPool],
    timePerPickMs,
    pickDeadline: now + timePerPickMs,
    isPaused: false,
  };
}

export function getNextPickTeamId(state: DraftState): string {
  return getPickingTeamId(state.draftOrder, state.currentPick, state.draftType);
}

export function makeDraftPick(
  state: DraftState,
  teamId: string,
  playerId: string,
): DraftState | { error: string } {
  if (state.status !== 'in_progress') {
    return { error: 'Draft is not in progress.' };
  }

  const expectedTeam = getNextPickTeamId(state);
  if (expectedTeam !== teamId) {
    return { error: `It is not team ${teamId}'s turn. Expected: ${expectedTeam}.` };
  }

  const playerIndex = state.availablePlayers.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) {
    return { error: `Player ${playerId} is not available.` };
  }

  const player = state.availablePlayers[playerIndex];
  const teamCount = state.draftOrder.length;
  const { round } = pickIndexInRound(state.currentPick, teamCount);

  const newPick: DraftPick = {
    pickNumber: state.currentPick,
    round,
    teamId,
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    timestamp: Date.now(),
  };

  const newAvailable = [
    ...state.availablePlayers.slice(0, playerIndex),
    ...state.availablePlayers.slice(playerIndex + 1),
  ];

  const newPicks = [...state.picks, newPick];
  const nextPick = state.currentPick + 1;
  const totalPicks = state.draftOrder.length * state.totalRounds;
  const isComplete = nextPick > totalPicks;
  const { round: nextRound } = pickIndexInRound(
    nextPick,
    teamCount,
  );

  return {
    ...state,
    picks: newPicks,
    availablePlayers: newAvailable,
    currentPick: nextPick,
    currentRound: isComplete ? state.currentRound : nextRound,
    status: isComplete ? 'complete' : 'in_progress',
    pickDeadline: isComplete ? 0 : Date.now() + state.timePerPickMs,
  };
}

export function autoPickForTeam(
  state: DraftState,
  teamId: string,
): DraftState {
  // Determine positional needs based on a basic priority order
  const positionPriority: string[] = ['QB', 'RB', 'WR', 'TE', 'K'];
  const teamPicks = state.picks.filter((p) => p.teamId === teamId);

  // Count current roster
  const roster: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0 };
  for (const pick of teamPicks) {
    if (roster[pick.position] !== undefined) {
      roster[pick.position]++;
    }
  }

  // Simple need-based logic: if a starting position is empty, prioritise it
  // Otherwise, take best available by ADP
  const sortedAvailable = [...state.availablePlayers].sort(
    (a, b) => a.adp - b.adp,
  );

  // Check if any starting position still has zero — try to fill it first
  for (const pos of positionPriority) {
    if (roster[pos] === 0) {
      const candidate = sortedAvailable.find((p) => p.position === pos);
      if (candidate) {
        const result = makeDraftPick(state, teamId, candidate.id);
        if ('error' in result) {
          break; // fall through to BPA
        }
        return result;
      }
    }
  }

  // Best player available by ADP
  if (sortedAvailable.length > 0) {
    const result = makeDraftPick(state, teamId, sortedAvailable[0].id);
    if (!('error' in result)) {
      return result;
    }
  }

  // Nothing changed — should not happen unless pool is empty
  return state;
}

export function getTeamDraftedPlayers(
  state: DraftState,
  teamId: string,
): DraftPick[] {
  return state.picks.filter((p) => p.teamId === teamId);
}

export function getDraftBoard(state: DraftState): DraftPick[][] {
  const board: DraftPick[][] = [];
  for (const pick of state.picks) {
    const roundIndex = pick.round - 1;
    if (!board[roundIndex]) {
      board[roundIndex] = [];
    }
    board[roundIndex].push(pick);
  }
  return board;
}

// ---------------------------------------------------------------------------
// Auction Draft Functions
// ---------------------------------------------------------------------------

export type AuctionDraftState = DraftState & { auction: AuctionState };

export function initializeAuction(
  state: DraftState,
  budgetPerTeam: number = 200,
): AuctionDraftState {
  const teamBudgets: Record<string, number> = {};
  for (const teamId of state.draftOrder) {
    teamBudgets[teamId] = budgetPerTeam;
  }

  const auction: AuctionState = {
    currentPlayer: null,
    currentBid: 0,
    currentBidder: null,
    nominatingTeam: state.draftOrder[0],
    biddingTimeMs: 15_000,
    biddingDeadline: 0,
    teamBudgets,
  };

  return {
    ...state,
    draftType: 'auction',
    status: 'in_progress',
    auction,
  };
}

export function nominatePlayer(
  state: DraftState,
  auction: AuctionState,
  teamId: string,
  playerId: string,
  openingBid: number,
): { state: DraftState; auction: AuctionState } | { error: string } {
  if (auction.nominatingTeam !== teamId) {
    return { error: `It is not team ${teamId}'s turn to nominate.` };
  }

  if (auction.currentPlayer !== null) {
    return { error: 'A player is already up for bidding.' };
  }

  const playerIndex = state.availablePlayers.findIndex(
    (p) => p.id === playerId,
  );
  if (playerIndex === -1) {
    return { error: `Player ${playerId} is not available.` };
  }

  const budget = auction.teamBudgets[teamId] ?? 0;
  if (openingBid < 1) {
    return { error: 'Opening bid must be at least 1.' };
  }
  if (openingBid > budget) {
    return { error: `Team ${teamId} cannot afford a bid of ${openingBid}. Budget: ${budget}.` };
  }

  const player = state.availablePlayers[playerIndex];
  const now = Date.now();

  const newAuction: AuctionState = {
    ...auction,
    currentPlayer: player,
    currentBid: openingBid,
    currentBidder: teamId,
    biddingDeadline: now + auction.biddingTimeMs,
  };

  return { state, auction: newAuction };
}

export function placeBid(
  state: DraftState,
  auction: AuctionState,
  teamId: string,
  bidAmount: number,
): { state: DraftState; auction: AuctionState } | { error: string } {
  if (auction.currentPlayer === null) {
    return { error: 'No player is currently up for bidding.' };
  }

  if (bidAmount <= auction.currentBid) {
    return { error: `Bid must be higher than current bid of ${auction.currentBid}.` };
  }

  const budget = auction.teamBudgets[teamId] ?? 0;
  if (bidAmount > budget) {
    return { error: `Team ${teamId} cannot afford a bid of ${bidAmount}. Budget: ${budget}.` };
  }

  const now = Date.now();

  const newAuction: AuctionState = {
    ...auction,
    currentBid: bidAmount,
    currentBidder: teamId,
    biddingDeadline: now + auction.biddingTimeMs,
  };

  return { state, auction: newAuction };
}

export function closeBidding(
  state: DraftState,
  auction: AuctionState,
): { state: DraftState; auction: AuctionState } | { error: string } {
  if (auction.currentPlayer === null || auction.currentBidder === null) {
    return { error: 'No active bidding to close.' };
  }

  const player = auction.currentPlayer;
  const winningTeam = auction.currentBidder;
  const winningBid = auction.currentBid;

  // Create the pick
  const newPick: DraftPick = {
    pickNumber: state.currentPick,
    round: state.currentRound,
    teamId: winningTeam,
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    timestamp: Date.now(),
    bidAmount: winningBid,
  };

  // Remove player from available pool
  const newAvailable = state.availablePlayers.filter(
    (p) => p.id !== player.id,
  );

  const newPicks = [...state.picks, newPick];

  // Update budget
  const newBudgets = {
    ...auction.teamBudgets,
    [winningTeam]: (auction.teamBudgets[winningTeam] ?? 0) - winningBid,
  };

  // Advance nomination to next team
  const teamCount = state.draftOrder.length;
  const currentNominatorIndex = state.draftOrder.indexOf(
    auction.nominatingTeam,
  );
  const nextNominatorIndex = (currentNominatorIndex + 1) % teamCount;
  const nextNominator = state.draftOrder[nextNominatorIndex];

  const totalPicks = state.draftOrder.length * state.totalRounds;
  const nextPick = state.currentPick + 1;
  const isComplete = nextPick > totalPicks;

  const newState: DraftState = {
    ...state,
    picks: newPicks,
    availablePlayers: newAvailable,
    currentPick: nextPick,
    status: isComplete ? 'complete' : 'in_progress',
  };

  const newAuction: AuctionState = {
    ...auction,
    currentPlayer: null,
    currentBid: 0,
    currentBidder: null,
    nominatingTeam: nextNominator,
    biddingDeadline: 0,
    teamBudgets: newBudgets,
  };

  return { state: newState, auction: newAuction };
}
