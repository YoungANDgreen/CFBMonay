// ============================================================
// GridIron IQ — Social Features Service
// Leaderboards, Friends, Notifications, Achievements
// ============================================================

import type {
  LeaderboardEntry,
  LeaderboardType,
  LeaderboardTimeframe,
  LeaderboardConfig,
  FriendRequest,
  FriendProfile,
  FriendRequestStatus,
  AppNotification,
  NotificationType,
  Achievement,
  UserAchievement,
  AchievementCategory,
  User,
} from '@/types';

// ============================================================
// SECTION 1: Leaderboards
// ============================================================

const MOCK_LEADERBOARD_USERS: {
  userId: string;
  username: string;
  displayName: string;
  score: number;
  favoriteTeam: string;
  eloRating: number;
  gridScore: number;
  statStackScore: number;
  predictionScore: number;
  fantasyScore: number;
  weeklyScore: number;
}[] = [
  { userId: 'u001', username: 'BamaOrBust', displayName: 'Jake T.', score: 14820, favoriteTeam: 'Alabama', eloRating: 1845, gridScore: 3200, statStackScore: 2900, predictionScore: 4100, fantasyScore: 2800, weeklyScore: 620 },
  { userId: 'u002', username: 'HookEmHorns', displayName: 'Marcus W.', score: 14350, favoriteTeam: 'Texas', eloRating: 1810, gridScore: 3100, statStackScore: 2750, predictionScore: 3900, fantasyScore: 2900, weeklyScore: 580 },
  { userId: 'u003', username: 'DawgPound92', displayName: 'Sarah K.', score: 13980, favoriteTeam: 'Georgia', eloRating: 1790, gridScore: 3400, statStackScore: 2600, predictionScore: 3700, fantasyScore: 2580, weeklyScore: 550 },
  { userId: 'u004', username: 'MaizeNBlue', displayName: 'Tyler R.', score: 13720, favoriteTeam: 'Michigan', eloRating: 1775, gridScore: 2900, statStackScore: 3100, predictionScore: 3600, fantasyScore: 2520, weeklyScore: 540 },
  { userId: 'u005', username: 'BoomerSooner', displayName: 'Chloe M.', score: 13500, favoriteTeam: 'Oklahoma', eloRating: 1760, gridScore: 3050, statStackScore: 2800, predictionScore: 3500, fantasyScore: 2550, weeklyScore: 530 },
  { userId: 'u006', username: 'BuckeyeNation', displayName: 'Ryan P.', score: 13200, favoriteTeam: 'Ohio State', eloRating: 1740, gridScore: 2850, statStackScore: 2950, predictionScore: 3400, fantasyScore: 2400, weeklyScore: 510 },
  { userId: 'u007', username: 'TigerBait_LSU', displayName: 'Andre J.', score: 12890, favoriteTeam: 'LSU', eloRating: 1725, gridScore: 2700, statStackScore: 2650, predictionScore: 3500, fantasyScore: 2440, weeklyScore: 490 },
  { userId: 'u008', username: 'WarEagle22', displayName: 'Beth C.', score: 12650, favoriteTeam: 'Auburn', eloRating: 1710, gridScore: 2600, statStackScore: 2700, predictionScore: 3300, fantasyScore: 2450, weeklyScore: 480 },
  { userId: 'u009', username: 'GoNoles', displayName: 'David F.', score: 12400, favoriteTeam: 'Florida State', eloRating: 1695, gridScore: 2750, statStackScore: 2500, predictionScore: 3200, fantasyScore: 2350, weeklyScore: 470 },
  { userId: 'u010', username: 'ClemsonPaw', displayName: 'Emily H.', score: 12150, favoriteTeam: 'Clemson', eloRating: 1680, gridScore: 2650, statStackScore: 2550, predictionScore: 3100, fantasyScore: 2250, weeklyScore: 460 },
  { userId: 'u011', username: 'NittanyLion55', displayName: 'Jason L.', score: 11900, favoriteTeam: 'Penn State', eloRating: 1665, gridScore: 2500, statStackScore: 2600, predictionScore: 3050, fantasyScore: 2150, weeklyScore: 450 },
  { userId: 'u012', username: 'GigEmAgs', displayName: 'Laura B.', score: 11700, favoriteTeam: 'Texas A&M', eloRating: 1650, gridScore: 2550, statStackScore: 2400, predictionScore: 2950, fantasyScore: 2200, weeklyScore: 440 },
  { userId: 'u013', username: 'IrishNation', displayName: 'Kevin O.', score: 11450, favoriteTeam: 'Notre Dame', eloRating: 1635, gridScore: 2400, statStackScore: 2350, predictionScore: 2900, fantasyScore: 2200, weeklyScore: 430 },
  { userId: 'u014', username: 'VolsTop10', displayName: 'Amber S.', score: 11200, favoriteTeam: 'Tennessee', eloRating: 1620, gridScore: 2350, statStackScore: 2300, predictionScore: 2800, fantasyScore: 2150, weeklyScore: 420 },
  { userId: 'u015', username: 'OregonDuck', displayName: 'Matt D.', score: 11000, favoriteTeam: 'Oregon', eloRating: 1605, gridScore: 2300, statStackScore: 2250, predictionScore: 2750, fantasyScore: 2100, weeklyScore: 410 },
  { userId: 'u016', username: 'GoBigRed', displayName: 'Nicole G.', score: 10800, favoriteTeam: 'Nebraska', eloRating: 1590, gridScore: 2250, statStackScore: 2200, predictionScore: 2650, fantasyScore: 2100, weeklyScore: 400 },
  { userId: 'u017', username: 'RollTide2025', displayName: 'Brandon A.', score: 10600, favoriteTeam: 'Alabama', eloRating: 1575, gridScore: 2200, statStackScore: 2150, predictionScore: 2600, fantasyScore: 2050, weeklyScore: 390 },
  { userId: 'u018', username: 'DucksUnlimited', displayName: 'Christina R.', score: 10400, favoriteTeam: 'Oregon', eloRating: 1560, gridScore: 2150, statStackScore: 2100, predictionScore: 2550, fantasyScore: 2000, weeklyScore: 380 },
  { userId: 'u019', username: 'WreckEmTech', displayName: 'Daniel T.', score: 10200, favoriteTeam: 'Texas Tech', eloRating: 1545, gridScore: 2100, statStackScore: 2050, predictionScore: 2500, fantasyScore: 1950, weeklyScore: 370 },
  { userId: 'u020', username: 'RazorbackFan', displayName: 'Megan V.', score: 10000, favoriteTeam: 'Arkansas', eloRating: 1530, gridScore: 2050, statStackScore: 2000, predictionScore: 2450, fantasyScore: 1900, weeklyScore: 360 },
  { userId: 'u021', username: 'SpartanDawg', displayName: 'Chris N.', score: 9800, favoriteTeam: 'Michigan State', eloRating: 1515, gridScore: 2000, statStackScore: 1950, predictionScore: 2400, fantasyScore: 1850, weeklyScore: 350 },
  { userId: 'u022', username: 'CaneGang305', displayName: 'Jessica P.', score: 9600, favoriteTeam: 'Miami', eloRating: 1500, gridScore: 1950, statStackScore: 1900, predictionScore: 2350, fantasyScore: 1800, weeklyScore: 340 },
  { userId: 'u023', username: 'BadgerBacker', displayName: 'Tom E.', score: 9400, favoriteTeam: 'Wisconsin', eloRating: 1485, gridScore: 1900, statStackScore: 1850, predictionScore: 2300, fantasyScore: 1750, weeklyScore: 330 },
  { userId: 'u024', username: 'CougarBlue', displayName: 'Stephanie Y.', score: 9200, favoriteTeam: 'BYU', eloRating: 1470, gridScore: 1850, statStackScore: 1800, predictionScore: 2250, fantasyScore: 1700, weeklyScore: 320 },
  { userId: 'u025', username: 'GatorChomp', displayName: 'Robert W.', score: 9000, favoriteTeam: 'Florida', eloRating: 1455, gridScore: 1800, statStackScore: 1750, predictionScore: 2200, fantasyScore: 1650, weeklyScore: 310 },
  { userId: 'u026', username: 'CyclonePower', displayName: 'Ashley Z.', score: 8800, favoriteTeam: 'Iowa State', eloRating: 1440, gridScore: 1750, statStackScore: 1700, predictionScore: 2150, fantasyScore: 1600, weeklyScore: 300 },
  { userId: 'u027', username: 'HuskyPride', displayName: 'Greg M.', score: 8600, favoriteTeam: 'Washington', eloRating: 1425, gridScore: 1700, statStackScore: 1650, predictionScore: 2100, fantasyScore: 1550, weeklyScore: 290 },
  { userId: 'u028', username: 'PirateFanECU', displayName: 'Rachel I.', score: 8400, favoriteTeam: 'East Carolina', eloRating: 1410, gridScore: 1650, statStackScore: 1600, predictionScore: 2050, fantasyScore: 1500, weeklyScore: 280 },
  { userId: 'u029', username: 'WolfpackNC', displayName: 'Derek Q.', score: 8200, favoriteTeam: 'NC State', eloRating: 1395, gridScore: 1600, statStackScore: 1550, predictionScore: 2000, fantasyScore: 1450, weeklyScore: 270 },
  { userId: 'u030', username: 'MountaineerWV', displayName: 'Kayla U.', score: 8000, favoriteTeam: 'West Virginia', eloRating: 1380, gridScore: 1550, statStackScore: 1500, predictionScore: 1950, fantasyScore: 1400, weeklyScore: 260 },
  { userId: 'u031', username: 'FalconsFlyGS', displayName: 'Patrick J.', score: 7800, favoriteTeam: 'Georgia Southern', eloRating: 1365, gridScore: 1500, statStackScore: 1450, predictionScore: 1900, fantasyScore: 1350, weeklyScore: 250 },
  { userId: 'u032', username: 'AppStateMtn', displayName: 'Olivia X.', score: 7600, favoriteTeam: 'Appalachian State', eloRating: 1350, gridScore: 1450, statStackScore: 1400, predictionScore: 1850, fantasyScore: 1300, weeklyScore: 240 },
];

function getScoreForType(
  user: (typeof MOCK_LEADERBOARD_USERS)[number],
  type: LeaderboardType
): number {
  switch (type) {
    case 'grid':
      return user.gridScore;
    case 'stat_stack':
      return user.statStackScore;
    case 'prediction':
      return user.predictionScore;
    case 'fantasy':
      return user.fantasyScore;
    case 'weekly':
      return user.weeklyScore;
    case 'overall':
    default:
      return user.score;
  }
}

function applyTimeframeMultiplier(score: number, timeframe: LeaderboardTimeframe): number {
  switch (timeframe) {
    case 'weekly':
      return Math.round(score * 0.07);
    case 'monthly':
      return Math.round(score * 0.3);
    case 'season':
      return Math.round(score * 0.8);
    case 'all_time':
    default:
      return score;
  }
}

const delay = (ms: number = 200): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getLeaderboard(
  config: LeaderboardConfig,
  page: number = 1,
  pageSize: number = 20
): Promise<{ entries: LeaderboardEntry[]; totalCount: number; userRank?: number }> {
  await delay();

  let filtered = MOCK_LEADERBOARD_USERS.map((u) => ({
    ...u,
    computedScore: applyTimeframeMultiplier(
      getScoreForType(u, config.type),
      config.timeframe
    ),
  }));

  if (config.conference) {
    const conferenceTeams: Record<string, string[]> = {
      SEC: ['Alabama', 'Georgia', 'LSU', 'Auburn', 'Tennessee', 'Texas A&M', 'Florida', 'Arkansas'],
      'Big Ten': ['Ohio State', 'Michigan', 'Penn State', 'Michigan State', 'Wisconsin', 'Nebraska', 'Oregon', 'Washington'],
      'Big 12': ['Texas', 'Oklahoma', 'Texas Tech', 'Iowa State', 'BYU', 'West Virginia'],
      ACC: ['Clemson', 'Florida State', 'Miami', 'NC State'],
      'Sun Belt': ['Appalachian State', 'Georgia Southern'],
      Independent: ['Notre Dame'],
    };
    const teams = conferenceTeams[config.conference] ?? [];
    filtered = filtered.filter((u) => teams.includes(u.favoriteTeam));
  }

  filtered.sort((a, b) => b.computedScore - a.computedScore);

  const totalCount = filtered.length;
  const start = (page - 1) * pageSize;
  const pageEntries = filtered.slice(start, start + pageSize);

  const entries: LeaderboardEntry[] = pageEntries.map((u, idx) => ({
    rank: start + idx + 1,
    userId: u.userId,
    username: u.username,
    displayName: u.displayName,
    score: u.computedScore,
    favoriteTeam: u.favoriteTeam,
  }));

  const currentUserRankEntry = filtered.findIndex((u) => u.userId === 'current-user');
  const userRank = currentUserRankEntry >= 0 ? currentUserRankEntry + 1 : undefined;

  return { entries, totalCount, userRank };
}

export async function getUserRank(userId: string, type: LeaderboardType): Promise<number> {
  await delay();

  const sorted = [...MOCK_LEADERBOARD_USERS].sort(
    (a, b) => getScoreForType(b, type) - getScoreForType(a, type)
  );

  const index = sorted.findIndex((u) => u.userId === userId);
  return index >= 0 ? index + 1 : sorted.length + 1;
}

// ============================================================
// SECTION 2: Friends System
// ============================================================

let friendsList: FriendProfile[] = [
  {
    userId: 'u003',
    username: 'DawgPound92',
    displayName: 'Sarah K.',
    favoriteTeam: 'Georgia',
    eloRating: 1790,
    isOnline: true,
    lastActiveAt: '2026-03-10T14:22:00Z',
  },
  {
    userId: 'u006',
    username: 'BuckeyeNation',
    displayName: 'Ryan P.',
    favoriteTeam: 'Ohio State',
    eloRating: 1740,
    isOnline: false,
    lastActiveAt: '2026-03-09T22:15:00Z',
  },
  {
    userId: 'u010',
    username: 'ClemsonPaw',
    displayName: 'Emily H.',
    favoriteTeam: 'Clemson',
    eloRating: 1680,
    isOnline: true,
    lastActiveAt: '2026-03-10T13:45:00Z',
  },
  {
    userId: 'u015',
    username: 'OregonDuck',
    displayName: 'Matt D.',
    favoriteTeam: 'Oregon',
    eloRating: 1605,
    isOnline: false,
    lastActiveAt: '2026-03-10T08:30:00Z',
  },
  {
    userId: 'u022',
    username: 'CaneGang305',
    displayName: 'Jessica P.',
    favoriteTeam: 'Miami',
    eloRating: 1500,
    isOnline: true,
    lastActiveAt: '2026-03-10T15:00:00Z',
  },
  {
    userId: 'u025',
    username: 'GatorChomp',
    displayName: 'Robert W.',
    favoriteTeam: 'Florida',
    eloRating: 1455,
    isOnline: false,
    lastActiveAt: '2026-03-08T19:20:00Z',
  },
];

let friendRequests: FriendRequest[] = [
  {
    id: 'fr001',
    fromUserId: 'u007',
    fromUsername: 'TigerBait_LSU',
    toUserId: 'current-user',
    status: 'pending',
    createdAt: '2026-03-09T10:00:00Z',
  },
  {
    id: 'fr002',
    fromUserId: 'u014',
    fromUsername: 'VolsTop10',
    toUserId: 'current-user',
    status: 'pending',
    createdAt: '2026-03-08T16:30:00Z',
  },
];

export async function getFriends(userId: string): Promise<FriendProfile[]> {
  await delay();
  return [...friendsList];
}

export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string
): Promise<FriendRequest> {
  await delay();

  const targetUser = MOCK_LEADERBOARD_USERS.find((u) => u.userId === toUserId);
  const newRequest: FriendRequest = {
    id: `fr-${Date.now()}`,
    fromUserId,
    fromUsername: 'You',
    toUserId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (targetUser) {
    newRequest.fromUsername =
      fromUserId === 'current-user' ? 'You' : targetUser.username;
  }

  friendRequests.push(newRequest);
  return newRequest;
}

export async function respondToFriendRequest(
  requestId: string,
  accept: boolean
): Promise<void> {
  await delay();

  const request = friendRequests.find((r) => r.id === requestId);
  if (!request) {
    throw new Error(`Friend request ${requestId} not found`);
  }

  request.status = accept ? 'accepted' : 'declined';

  if (accept) {
    const senderData = MOCK_LEADERBOARD_USERS.find(
      (u) => u.userId === request.fromUserId
    );
    if (senderData) {
      friendsList.push({
        userId: senderData.userId,
        username: senderData.username,
        displayName: senderData.displayName,
        favoriteTeam: senderData.favoriteTeam,
        eloRating: senderData.eloRating,
        isOnline: Math.random() > 0.5,
        lastActiveAt: new Date().toISOString(),
      });
    }
  }
}

export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  await delay();
  return friendRequests.filter(
    (r) => r.toUserId === userId && r.status === 'pending'
  );
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  await delay();
  friendsList = friendsList.filter((f) => f.userId !== friendId);
}

export async function searchUsers(query: string): Promise<FriendProfile[]> {
  await delay();

  const lowerQuery = query.toLowerCase();
  return MOCK_LEADERBOARD_USERS
    .filter(
      (u) =>
        u.username.toLowerCase().includes(lowerQuery) ||
        u.displayName.toLowerCase().includes(lowerQuery)
    )
    .map((u) => ({
      userId: u.userId,
      username: u.username,
      displayName: u.displayName,
      favoriteTeam: u.favoriteTeam,
      eloRating: u.eloRating,
      isOnline: Math.random() > 0.5,
      lastActiveAt: new Date().toISOString(),
    }));
}

// ============================================================
// SECTION 3: Notifications
// ============================================================

let notifications: AppNotification[] = [
  {
    id: 'n001',
    type: 'friend_request',
    title: 'New Friend Request',
    body: 'TigerBait_LSU wants to be your friend!',
    data: { fromUserId: 'u007' },
    read: false,
    createdAt: '2026-03-09T10:00:00Z',
  },
  {
    id: 'n002',
    type: 'achievement_unlocked',
    title: 'Achievement Unlocked!',
    body: 'You earned "On Fire" — 7-day login streak!',
    data: { achievementId: 'streak-on-fire' },
    read: false,
    createdAt: '2026-03-09T08:00:00Z',
  },
  {
    id: 'n003',
    type: 'prediction_result',
    title: 'Prediction Results In',
    body: 'You went 8/12 this week — top 15% of all players!',
    data: { week: '10' },
    read: false,
    createdAt: '2026-03-08T22:00:00Z',
  },
  {
    id: 'n004',
    type: 'trade_proposal',
    title: 'Trade Offer Received',
    body: 'ClemsonPaw wants to trade you Travis Etienne for your Najee Harris.',
    data: { tradeId: 'tr-550' },
    read: true,
    createdAt: '2026-03-08T14:30:00Z',
  },
  {
    id: 'n005',
    type: 'friend_accepted',
    title: 'Friend Request Accepted',
    body: 'DawgPound92 accepted your friend request.',
    data: { userId: 'u003' },
    read: true,
    createdAt: '2026-03-07T18:00:00Z',
  },
  {
    id: 'n006',
    type: 'draft_starting',
    title: 'Draft Starting Soon',
    body: 'Your "SEC Showdown" league draft starts in 30 minutes!',
    data: { leagueId: 'lg-101' },
    read: false,
    createdAt: '2026-03-07T11:30:00Z',
  },
  {
    id: 'n007',
    type: 'game_invite',
    title: 'Challenge Received',
    body: 'BuckeyeNation challenged you to Conference Clash!',
    data: { gameType: 'conference_clash', fromUserId: 'u006' },
    read: false,
    createdAt: '2026-03-06T20:00:00Z',
  },
  {
    id: 'n008',
    type: 'achievement_unlocked',
    title: 'Achievement Unlocked!',
    body: 'You earned "Grid Master" — completed 100 grid puzzles!',
    data: { achievementId: 'games-grid-master' },
    read: true,
    createdAt: '2026-03-06T09:15:00Z',
  },
  {
    id: 'n009',
    type: 'live_score_update',
    title: 'Live Score Alert',
    body: 'Upset alert! Your predicted underdog is winning 21-7 at halftime.',
    data: { gameId: 'g-3344' },
    read: true,
    createdAt: '2026-03-05T20:45:00Z',
  },
  {
    id: 'n010',
    type: 'league_invite',
    title: 'League Invitation',
    body: 'OregonDuck invited you to join "Pac-12 Legends" fantasy league.',
    data: { leagueId: 'lg-205', fromUserId: 'u015' },
    read: false,
    createdAt: '2026-03-05T12:00:00Z',
  },
];

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  await delay();
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function markAsRead(notificationId: string): Promise<void> {
  await delay();
  const notification = notifications.find((n) => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  await delay();
  notifications.forEach((n) => {
    n.read = true;
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  await delay();
  return notifications.filter((n) => !n.read).length;
}

// ============================================================
// SECTION 4: Achievements
// ============================================================

const ALL_ACHIEVEMENTS: Achievement[] = [
  // --- Games ---
  { id: 'games-first-blood', name: 'First Blood', description: 'Play your first game of any type', icon: '🎮', category: 'games', requirement: 1, rarity: 'common' },
  { id: 'games-grid-rookie', name: 'Grid Rookie', description: 'Complete 10 grid puzzles', icon: '🔲', category: 'games', requirement: 10, rarity: 'common' },
  { id: 'games-grid-master', name: 'Grid Master', description: 'Complete 100 grid puzzles', icon: '🏆', category: 'games', requirement: 100, rarity: 'rare' },
  { id: 'games-perfect-grid', name: 'Perfect Grid', description: 'Score 9/9 on a 3x3 grid puzzle', icon: '💎', category: 'games', requirement: 1, rarity: 'rare' },
  { id: 'games-stat-stacker', name: 'Stat Stacker', description: 'Complete 50 Stat Stack games', icon: '📊', category: 'games', requirement: 50, rarity: 'uncommon' },
  { id: 'games-dynasty-founder', name: 'Dynasty Founder', description: 'Build your first Dynasty roster', icon: '🏛️', category: 'games', requirement: 1, rarity: 'common' },
  { id: 'games-clash-victor', name: 'Clash Victor', description: 'Win 25 Conference Clash matches', icon: '⚔️', category: 'games', requirement: 25, rarity: 'uncommon' },
  { id: 'games-all-rounder', name: 'All-Rounder', description: 'Play every game mode at least once', icon: '🌟', category: 'games', requirement: 5, rarity: 'uncommon' },

  // --- Prediction ---
  { id: 'prediction-oracle', name: 'Oracle', description: 'Make 10 correct game predictions', icon: '🔮', category: 'prediction', requirement: 10, rarity: 'common' },
  { id: 'prediction-upset-caller', name: 'Upset Caller', description: 'Correctly predict 5 upsets', icon: '🫨', category: 'prediction', requirement: 5, rarity: 'rare' },
  { id: 'prediction-beat-the-model', name: 'Beat the Model', description: 'Outscore the ML model for 3 weeks', icon: '🤖', category: 'prediction', requirement: 3, rarity: 'rare' },
  { id: 'prediction-sharpshooter', name: 'Sharpshooter', description: 'Hit the exact spread on 5 games', icon: '🎯', category: 'prediction', requirement: 5, rarity: 'legendary' },
  { id: 'prediction-season-sage', name: 'Season Sage', description: 'Finish a season in the top 10%', icon: '🧙', category: 'prediction', requirement: 1, rarity: 'rare' },

  // --- Fantasy ---
  { id: 'fantasy-draft-day', name: 'Draft Day', description: 'Complete your first fantasy draft', icon: '📋', category: 'fantasy', requirement: 1, rarity: 'common' },
  { id: 'fantasy-champion', name: 'Champion', description: 'Win a fantasy football league', icon: '🏅', category: 'fantasy', requirement: 1, rarity: 'rare' },
  { id: 'fantasy-trade-master', name: 'Trade Master', description: 'Successfully complete 10 trades', icon: '🤝', category: 'fantasy', requirement: 10, rarity: 'uncommon' },
  { id: 'fantasy-waiver-hawk', name: 'Waiver Hawk', description: 'Win 20 waiver claims', icon: '🦅', category: 'fantasy', requirement: 20, rarity: 'uncommon' },
  { id: 'fantasy-dynasty-king', name: 'Dynasty King', description: 'Win back-to-back league championships', icon: '👑', category: 'fantasy', requirement: 2, rarity: 'legendary' },

  // --- Social ---
  { id: 'social-butterfly', name: 'Social Butterfly', description: 'Add 10 friends', icon: '🦋', category: 'social', requirement: 10, rarity: 'common' },
  { id: 'social-chat-champion', name: 'Chat Champion', description: 'Send 100 messages in league chat', icon: '💬', category: 'social', requirement: 100, rarity: 'uncommon' },
  { id: 'social-influencer', name: 'Influencer', description: 'Have 50 friends', icon: '📢', category: 'social', requirement: 50, rarity: 'rare' },

  // --- Streak ---
  { id: 'streak-on-fire', name: 'On Fire', description: 'Maintain a 7-day login streak', icon: '🔥', category: 'streak', requirement: 7, rarity: 'common' },
  { id: 'streak-unstoppable', name: 'Unstoppable', description: 'Maintain a 30-day login streak', icon: '⚡', category: 'streak', requirement: 30, rarity: 'uncommon' },
  { id: 'streak-legend', name: 'Legend', description: 'Maintain a 100-day login streak', icon: '🐐', category: 'streak', requirement: 100, rarity: 'legendary' },
  { id: 'streak-dedicated', name: 'Dedicated', description: 'Maintain a 14-day login streak', icon: '💪', category: 'streak', requirement: 14, rarity: 'common' },
];

export function getAllAchievements(): Achievement[] {
  return [...ALL_ACHIEVEMENTS];
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  await delay();

  const mockProgress: UserAchievement[] = [
    { achievementId: 'games-first-blood', unlockedAt: '2025-09-01T12:00:00Z', progress: 1, isComplete: true },
    { achievementId: 'games-grid-rookie', unlockedAt: '2025-10-15T09:00:00Z', progress: 10, isComplete: true },
    { achievementId: 'games-grid-master', unlockedAt: '2026-03-06T09:15:00Z', progress: 100, isComplete: true },
    { achievementId: 'games-perfect-grid', unlockedAt: '2026-01-20T14:30:00Z', progress: 1, isComplete: true },
    { achievementId: 'games-stat-stacker', unlockedAt: '', progress: 32, isComplete: false },
    { achievementId: 'games-dynasty-founder', unlockedAt: '2025-11-05T10:00:00Z', progress: 1, isComplete: true },
    { achievementId: 'games-clash-victor', unlockedAt: '', progress: 18, isComplete: false },
    { achievementId: 'games-all-rounder', unlockedAt: '2025-12-01T17:00:00Z', progress: 5, isComplete: true },
    { achievementId: 'prediction-oracle', unlockedAt: '2025-10-20T20:00:00Z', progress: 10, isComplete: true },
    { achievementId: 'prediction-upset-caller', unlockedAt: '', progress: 3, isComplete: false },
    { achievementId: 'prediction-beat-the-model', unlockedAt: '2026-02-15T22:00:00Z', progress: 3, isComplete: true },
    { achievementId: 'prediction-sharpshooter', unlockedAt: '', progress: 2, isComplete: false },
    { achievementId: 'prediction-season-sage', unlockedAt: '', progress: 0, isComplete: false },
    { achievementId: 'fantasy-draft-day', unlockedAt: '2025-09-05T19:00:00Z', progress: 1, isComplete: true },
    { achievementId: 'fantasy-champion', unlockedAt: '', progress: 0, isComplete: false },
    { achievementId: 'fantasy-trade-master', unlockedAt: '', progress: 7, isComplete: false },
    { achievementId: 'fantasy-waiver-hawk', unlockedAt: '', progress: 12, isComplete: false },
    { achievementId: 'fantasy-dynasty-king', unlockedAt: '', progress: 0, isComplete: false },
    { achievementId: 'social-butterfly', unlockedAt: '2026-01-10T11:00:00Z', progress: 10, isComplete: true },
    { achievementId: 'social-chat-champion', unlockedAt: '', progress: 64, isComplete: false },
    { achievementId: 'social-influencer', unlockedAt: '', progress: 10, isComplete: false },
    { achievementId: 'streak-on-fire', unlockedAt: '2026-03-09T08:00:00Z', progress: 7, isComplete: true },
    { achievementId: 'streak-unstoppable', unlockedAt: '', progress: 7, isComplete: false },
    { achievementId: 'streak-legend', unlockedAt: '', progress: 7, isComplete: false },
    { achievementId: 'streak-dedicated', unlockedAt: '', progress: 7, isComplete: false },
  ];

  return mockProgress;
}

export function checkAchievementProgress(
  userId: string,
  category: AchievementCategory,
  currentValue: number
): UserAchievement[] {
  const categoryAchievements = ALL_ACHIEVEMENTS.filter(
    (a) => a.category === category
  );

  const newlyUnlocked: UserAchievement[] = [];

  for (const achievement of categoryAchievements) {
    if (currentValue >= achievement.requirement) {
      newlyUnlocked.push({
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString(),
        progress: currentValue,
        isComplete: true,
      });
    }
  }

  return newlyUnlocked;
}
