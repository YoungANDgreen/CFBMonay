// ============================================================
// GridIron IQ — Social Features State Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type {
  FriendProfile,
  FriendRequest,
  LeaderboardEntry,
  LeaderboardType,
  LeaderboardTimeframe,
  LeaderboardConfig,
  Achievement,
  UserAchievement,
  ChatRoom,
  ChatMessage,
  AppNotification,
} from '@/types';

interface SocialStore {
  // Friends
  friends: FriendProfile[];
  friendRequests: FriendRequest[];

  // Leaderboard
  leaderboardEntries: LeaderboardEntry[];
  leaderboardType: LeaderboardType;
  leaderboardTimeframe: LeaderboardTimeframe;
  userRank: number | null;

  // Achievements
  allAchievements: Achievement[];
  userAchievements: UserAchievement[];

  // Chat
  chatRooms: ChatRoom[];
  activeChatRoom: string | null;
  chatMessages: ChatMessage[];

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFriends: () => void;
  sendFriendRequest: (toUserId: string) => void;
  respondToRequest: (requestId: string, accept: boolean) => void;
  removeFriend: (friendId: string) => void;

  loadLeaderboard: (type?: LeaderboardType, timeframe?: LeaderboardTimeframe) => void;
  setLeaderboardType: (type: LeaderboardType) => void;
  setLeaderboardTimeframe: (timeframe: LeaderboardTimeframe) => void;

  loadAchievements: () => void;

  loadChatRooms: () => void;
  openChatRoom: (roomId: string) => void;
  sendMessage: (content: string) => void;
  closeChatRoom: () => void;

  loadNotifications: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  reset: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- Mock Data ---

const MOCK_FRIENDS: FriendProfile[] = [
  {
    userId: 'usr-001',
    username: 'HookEm_Hardy',
    displayName: 'Jake Hardy',
    avatarUrl: undefined,
    favoriteTeam: 'Texas',
    eloRating: 1420,
    isOnline: true,
    lastActiveAt: '2026-03-10T14:30:00Z',
  },
  {
    userId: 'usr-002',
    username: 'CrimsonTideKing',
    displayName: 'Marcus Bell',
    avatarUrl: undefined,
    favoriteTeam: 'Alabama',
    eloRating: 1580,
    isOnline: false,
    lastActiveAt: '2026-03-09T22:15:00Z',
  },
  {
    userId: 'usr-003',
    username: 'DawgPound99',
    displayName: 'Sarah Mitchell',
    avatarUrl: undefined,
    favoriteTeam: 'Georgia',
    eloRating: 1350,
    isOnline: true,
    lastActiveAt: '2026-03-10T15:00:00Z',
  },
  {
    userId: 'usr-004',
    username: 'BuckeyeNation22',
    displayName: 'Tyler Owens',
    avatarUrl: undefined,
    favoriteTeam: 'Ohio State',
    eloRating: 1490,
    isOnline: false,
    lastActiveAt: '2026-03-08T18:45:00Z',
  },
  {
    userId: 'usr-005',
    username: 'TigerBait_LSU',
    displayName: 'Alicia Tran',
    avatarUrl: undefined,
    favoriteTeam: 'LSU',
    eloRating: 1310,
    isOnline: true,
    lastActiveAt: '2026-03-10T13:20:00Z',
  },
  {
    userId: 'usr-006',
    username: 'WolverineWarrior',
    displayName: 'Chris Park',
    avatarUrl: undefined,
    favoriteTeam: 'Michigan',
    eloRating: 1460,
    isOnline: false,
    lastActiveAt: '2026-03-10T08:00:00Z',
  },
  {
    userId: 'usr-007',
    username: 'SoonerMagic',
    displayName: 'Devon Carter',
    avatarUrl: undefined,
    favoriteTeam: 'Oklahoma',
    eloRating: 1540,
    isOnline: true,
    lastActiveAt: '2026-03-10T15:10:00Z',
  },
  {
    userId: 'usr-008',
    username: 'NoleFan4Life',
    displayName: 'Brianna Lopez',
    avatarUrl: undefined,
    favoriteTeam: 'Florida State',
    eloRating: 1280,
    isOnline: false,
    lastActiveAt: '2026-03-07T20:30:00Z',
  },
];

const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'req-001',
    fromUserId: 'usr-009',
    fromUsername: 'WarEagle_Auburn',
    fromAvatarUrl: undefined,
    toUserId: 'current-user',
    status: 'pending',
    createdAt: '2026-03-09T16:00:00Z',
  },
  {
    id: 'req-002',
    fromUserId: 'usr-010',
    fromUsername: 'GoIrish_ND',
    fromAvatarUrl: undefined,
    toUserId: 'current-user',
    status: 'pending',
    createdAt: '2026-03-10T10:30:00Z',
  },
];

function generateMockLeaderboard(type: LeaderboardType, timeframe: LeaderboardTimeframe): LeaderboardEntry[] {
  const usernames = [
    'CrimsonTideKing', 'SoonerMagic', 'BuckeyeNation22', 'HookEm_Hardy',
    'WolverineWarrior', 'DawgPound99', 'TigerBait_LSU', 'WarEagle_Auburn',
    'GoIrish_ND', 'NoleFan4Life', 'ClemsonClaws', 'GatorGrit',
    'HuskerPower', 'Trojans4Ever', 'PennSt_Nittany', 'MiamiU_Canes',
    'OregonDuckFan', 'TexasAM_12th', 'WisconsinBadger', 'IowaCityHawk',
    'AuburnPlains', 'MizzouTiger', 'ArkansasRazor',
  ];
  const displayNames = [
    'Marcus Bell', 'Devon Carter', 'Tyler Owens', 'Jake Hardy',
    'Chris Park', 'Sarah Mitchell', 'Alicia Tran', 'James Foster',
    'Kelly O\'Brien', 'Brianna Lopez', 'Raj Patel', 'Maria Sanchez',
    'Noah Jensen', 'Liam Young', 'Emily Ruiz', 'Dante Howard',
    'Megan Liu', 'Antonio Davis', 'Grace Thompson', 'Patrick Walsh',
    'Sofia Kim', 'Andre Brown', 'Haley Martin',
  ];
  const teams = [
    'Alabama', 'Oklahoma', 'Ohio State', 'Texas',
    'Michigan', 'Georgia', 'LSU', 'Auburn',
    'Notre Dame', 'Florida State', 'Clemson', 'Florida',
    'Nebraska', 'USC', 'Penn State', 'Miami',
    'Oregon', 'Texas A&M', 'Wisconsin', 'Iowa',
    'Auburn', 'Missouri', 'Arkansas',
  ];

  // Scale scores based on timeframe
  const scoreMultiplier = timeframe === 'weekly' ? 1 :
                          timeframe === 'monthly' ? 4 :
                          timeframe === 'season' ? 16 : 40;

  // Base scores vary by type
  const baseScore = type === 'overall' ? 250 :
                    type === 'grid' ? 180 :
                    type === 'stat_stack' ? 200 :
                    type === 'prediction' ? 150 :
                    type === 'fantasy' ? 300 : 220;

  return usernames.map((username, i) => ({
    rank: i + 1,
    userId: `usr-lb-${i}`,
    username,
    displayName: displayNames[i],
    avatarUrl: undefined,
    score: Math.round((baseScore - i * (baseScore / 30)) * scoreMultiplier + Math.random() * 50),
    favoriteTeam: teams[i],
  })).sort((a, b) => b.score - a.score).map((entry, i) => ({ ...entry, rank: i + 1 }));
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-001', name: 'First Down', description: 'Complete your first Grid puzzle', icon: 'grid-on', category: 'games', requirement: 1, rarity: 'common' },
  { id: 'ach-002', name: 'Stat Guru', description: 'Score in the 90th percentile on Stat Stack', icon: 'trending-up', category: 'games', requirement: 1, rarity: 'rare' },
  { id: 'ach-003', name: 'Perfect Grid', description: 'Complete a 3x3 Grid with no wrong guesses', icon: 'star', category: 'games', requirement: 1, rarity: 'rare' },
  { id: 'ach-004', name: 'Oracle', description: 'Correctly predict 10 game winners in a row', icon: 'visibility', category: 'prediction', requirement: 10, rarity: 'legendary' },
  { id: 'ach-005', name: 'Sharp', description: 'Beat the ML model for 3 consecutive weeks', icon: 'psychology', category: 'prediction', requirement: 3, rarity: 'uncommon' },
  { id: 'ach-006', name: 'Upset Special', description: 'Correctly predict 5 upsets in a season', icon: 'bolt', category: 'prediction', requirement: 5, rarity: 'rare' },
  { id: 'ach-007', name: 'Commissioner', description: 'Create and run a fantasy league', icon: 'shield', category: 'fantasy', requirement: 1, rarity: 'common' },
  { id: 'ach-008', name: 'Dynasty Champion', description: 'Win a fantasy league championship', icon: 'trophy', category: 'fantasy', requirement: 1, rarity: 'uncommon' },
  { id: 'ach-009', name: 'Trade Shark', description: 'Complete 10 trades in a single season', icon: 'swap-horiz', category: 'fantasy', requirement: 10, rarity: 'uncommon' },
  { id: 'ach-010', name: 'Social Butterfly', description: 'Add 10 friends', icon: 'people', category: 'social', requirement: 10, rarity: 'common' },
  { id: 'ach-011', name: 'Rivalry Week', description: 'Challenge a friend in 5 different game modes', icon: 'sports-mma', category: 'social', requirement: 5, rarity: 'uncommon' },
  { id: 'ach-012', name: 'Iron Man', description: 'Play every day for 30 consecutive days', icon: 'local-fire-department', category: 'streak', requirement: 30, rarity: 'rare' },
  { id: 'ach-013', name: 'Hot Streak', description: 'Win 7 games in a row across any mode', icon: 'whatshot', category: 'streak', requirement: 7, rarity: 'uncommon' },
  { id: 'ach-014', name: 'Century Club', description: 'Play 100 total games', icon: 'emoji-events', category: 'games', requirement: 100, rarity: 'uncommon' },
  { id: 'ach-015', name: 'Immaculate', description: 'Complete a 4x4 Grid with all rare answers', icon: 'diamond', category: 'games', requirement: 1, rarity: 'legendary' },
  { id: 'ach-016', name: 'Blind Judge', description: 'Correctly identify 20 Blind Resume teams', icon: 'search', category: 'games', requirement: 20, rarity: 'rare' },
];

const MOCK_USER_ACHIEVEMENTS: UserAchievement[] = [
  { achievementId: 'ach-001', unlockedAt: '2026-01-15T12:00:00Z', progress: 1, isComplete: true },
  { achievementId: 'ach-007', unlockedAt: '2026-02-01T09:30:00Z', progress: 1, isComplete: true },
  { achievementId: 'ach-010', unlockedAt: '', progress: 8, isComplete: false },
  { achievementId: 'ach-005', unlockedAt: '', progress: 2, isComplete: false },
  { achievementId: 'ach-012', unlockedAt: '', progress: 14, isComplete: false },
  { achievementId: 'ach-014', unlockedAt: '', progress: 67, isComplete: false },
  { achievementId: 'ach-004', unlockedAt: '', progress: 6, isComplete: false },
  { achievementId: 'ach-013', unlockedAt: '2026-02-20T18:00:00Z', progress: 7, isComplete: true },
  { achievementId: 'ach-003', unlockedAt: '', progress: 0, isComplete: false },
  { achievementId: 'ach-009', unlockedAt: '', progress: 4, isComplete: false },
];

const MOCK_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'room-global',
    name: 'Global Chat',
    type: 'global',
    participants: [],
    lastMessage: {
      id: 'msg-g1',
      roomId: 'room-global',
      senderId: 'usr-002',
      senderUsername: 'CrimsonTideKing',
      content: 'That Grid today was brutal!',
      type: 'text',
      createdAt: '2026-03-10T14:55:00Z',
    },
    unreadCount: 3,
    createdAt: '2025-08-01T00:00:00Z',
  },
  {
    id: 'room-league-1',
    name: 'SEC Fantasy League Chat',
    type: 'league',
    participants: ['current-user', 'usr-001', 'usr-002', 'usr-003', 'usr-005'],
    lastMessage: {
      id: 'msg-l1',
      roomId: 'room-league-1',
      senderId: 'usr-005',
      senderUsername: 'TigerBait_LSU',
      content: 'Who is dropping FAAB on the new transfer QB?',
      type: 'text',
      createdAt: '2026-03-10T13:40:00Z',
    },
    unreadCount: 5,
    createdAt: '2025-09-01T12:00:00Z',
  },
  {
    id: 'room-league-2',
    name: 'Big Ten Prediction League',
    type: 'league',
    participants: ['current-user', 'usr-004', 'usr-006'],
    lastMessage: {
      id: 'msg-l2',
      roomId: 'room-league-2',
      senderId: 'usr-006',
      senderUsername: 'WolverineWarrior',
      content: 'Model has OSU favored by 7, I\'m taking the under',
      type: 'text',
      createdAt: '2026-03-09T21:00:00Z',
    },
    unreadCount: 0,
    createdAt: '2025-09-15T10:00:00Z',
  },
  {
    id: 'room-dm-001',
    name: 'Jake Hardy',
    type: 'direct',
    participants: ['current-user', 'usr-001'],
    lastMessage: {
      id: 'msg-d1',
      roomId: 'room-dm-001',
      senderId: 'usr-001',
      senderUsername: 'HookEm_Hardy',
      content: 'Want to do a head-to-head Clash tonight?',
      type: 'text',
      createdAt: '2026-03-10T12:30:00Z',
    },
    unreadCount: 1,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'room-dm-007',
    name: 'Devon Carter',
    type: 'direct',
    participants: ['current-user', 'usr-007'],
    lastMessage: {
      id: 'msg-d7',
      roomId: 'room-dm-007',
      senderId: 'current-user',
      senderUsername: 'You',
      content: 'GG on that Dynasty matchup',
      type: 'text',
      createdAt: '2026-03-08T19:15:00Z',
    },
    unreadCount: 0,
    createdAt: '2026-02-14T14:00:00Z',
  },
  {
    id: 'room-group-1',
    name: 'CFB Degen Squad',
    type: 'group',
    participants: ['current-user', 'usr-001', 'usr-003', 'usr-005', 'usr-007'],
    lastMessage: {
      id: 'msg-grp1',
      roomId: 'room-group-1',
      senderId: 'usr-003',
      senderUsername: 'DawgPound99',
      content: 'Spring game predictions thread go!',
      type: 'text',
      createdAt: '2026-03-10T11:00:00Z',
    },
    unreadCount: 12,
    createdAt: '2025-11-20T16:00:00Z',
  },
];

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-001',
    type: 'friend_request',
    title: 'New Friend Request',
    body: 'WarEagle_Auburn wants to be your friend',
    data: { fromUserId: 'usr-009' },
    read: false,
    createdAt: '2026-03-10T10:30:00Z',
  },
  {
    id: 'notif-002',
    type: 'achievement_unlocked',
    title: 'Achievement Unlocked!',
    body: 'You earned "Hot Streak" — 7 wins in a row!',
    data: { achievementId: 'ach-013' },
    read: false,
    createdAt: '2026-03-09T18:00:00Z',
  },
  {
    id: 'notif-003',
    type: 'prediction_result',
    title: 'Prediction Results',
    body: 'Week 10 results are in — you scored 185 pts!',
    data: { weekNumber: '10' },
    read: false,
    createdAt: '2026-03-09T08:00:00Z',
  },
  {
    id: 'notif-004',
    type: 'trade_proposal',
    title: 'Trade Proposed',
    body: 'Touchdown Titans sent you a trade offer',
    data: { tradeId: 'trade-042' },
    read: true,
    createdAt: '2026-03-08T14:20:00Z',
  },
  {
    id: 'notif-005',
    type: 'game_invite',
    title: 'Game Invite',
    body: 'HookEm_Hardy challenged you to Conference Clash',
    data: { fromUserId: 'usr-001', gameMode: 'conference_clash' },
    read: true,
    createdAt: '2026-03-08T12:00:00Z',
  },
  {
    id: 'notif-006',
    type: 'league_invite',
    title: 'League Invite',
    body: 'You\'ve been invited to "Pac-12 After Dark Fantasy"',
    data: { leagueId: 'league-099' },
    read: false,
    createdAt: '2026-03-07T20:00:00Z',
  },
  {
    id: 'notif-007',
    type: 'friend_accepted',
    title: 'Friend Request Accepted',
    body: 'NoleFan4Life accepted your friend request',
    data: { userId: 'usr-008' },
    read: true,
    createdAt: '2026-03-07T15:30:00Z',
  },
  {
    id: 'notif-008',
    type: 'draft_starting',
    title: 'Draft Starting Soon',
    body: 'SEC Fantasy League draft starts in 1 hour',
    data: { leagueId: 'league-001' },
    read: true,
    createdAt: '2026-03-06T19:00:00Z',
  },
  {
    id: 'notif-009',
    type: 'live_score_update',
    title: 'Score Alert',
    body: 'Your player Arch Manning just threw a 65-yd TD!',
    data: { playerId: 'player-manning' },
    read: true,
    createdAt: '2026-03-06T16:45:00Z',
  },
  {
    id: 'notif-010',
    type: 'system',
    title: 'New Game Mode',
    body: 'Film Room is now available in Conference Clash!',
    read: true,
    createdAt: '2026-03-05T12:00:00Z',
  },
];

const INITIAL_STATE = {
  friends: [] as FriendProfile[],
  friendRequests: [] as FriendRequest[],
  leaderboardEntries: [] as LeaderboardEntry[],
  leaderboardType: 'overall' as LeaderboardType,
  leaderboardTimeframe: 'weekly' as LeaderboardTimeframe,
  userRank: null as number | null,
  allAchievements: [] as Achievement[],
  userAchievements: [] as UserAchievement[],
  chatRooms: [] as ChatRoom[],
  activeChatRoom: null as string | null,
  chatMessages: [] as ChatMessage[],
  notifications: [] as AppNotification[],
  unreadCount: 0,
  isLoading: false,
  error: null as string | null,
};

export const useSocialStore = create<SocialStore>((set, get) => ({
  ...INITIAL_STATE,

  // --- Friends ---

  loadFriends: () => {
    set({ isLoading: true, error: null });
    set({
      friends: MOCK_FRIENDS,
      friendRequests: MOCK_FRIEND_REQUESTS,
      isLoading: false,
    });
  },

  sendFriendRequest: (toUserId) => {
    const request: FriendRequest = {
      id: generateId(),
      fromUserId: 'current-user',
      fromUsername: 'You',
      fromAvatarUrl: undefined,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      friendRequests: [...state.friendRequests, request],
    }));
  },

  respondToRequest: (requestId, accept) => {
    const { friendRequests, friends } = get();
    const request = friendRequests.find(r => r.id === requestId);
    if (!request) return;

    const updatedRequests = friendRequests.map(r =>
      r.id === requestId
        ? { ...r, status: accept ? 'accepted' as const : 'declined' as const }
        : r
    );

    if (accept) {
      const newFriend: FriendProfile = {
        userId: request.fromUserId,
        username: request.fromUsername,
        displayName: request.fromUsername,
        avatarUrl: request.fromAvatarUrl,
        favoriteTeam: undefined,
        eloRating: 1200,
        isOnline: false,
        lastActiveAt: new Date().toISOString(),
      };
      set({
        friendRequests: updatedRequests,
        friends: [...friends, newFriend],
      });
    } else {
      set({ friendRequests: updatedRequests });
    }
  },

  removeFriend: (friendId) => {
    set(state => ({
      friends: state.friends.filter(f => f.userId !== friendId),
    }));
  },

  // --- Leaderboard ---

  loadLeaderboard: (type, timeframe) => {
    const { leaderboardType, leaderboardTimeframe } = get();
    const effectiveType = type ?? leaderboardType;
    const effectiveTimeframe = timeframe ?? leaderboardTimeframe;

    set({ isLoading: true, error: null });

    const entries = generateMockLeaderboard(effectiveType, effectiveTimeframe);

    // Insert current user somewhere in the top 25
    const userRank = Math.floor(Math.random() * 15) + 3;
    const userEntry: LeaderboardEntry = {
      rank: userRank,
      userId: 'current-user',
      username: 'You',
      displayName: 'You',
      avatarUrl: undefined,
      score: entries[userRank - 1]?.score ?? 500,
      favoriteTeam: 'Texas',
    };

    // Replace entry at userRank position with the current user
    const finalEntries = [...entries];
    finalEntries.splice(userRank - 1, 0, userEntry);
    finalEntries.pop();
    finalEntries.forEach((e, i) => { e.rank = i + 1; });

    set({
      leaderboardEntries: finalEntries,
      leaderboardType: effectiveType,
      leaderboardTimeframe: effectiveTimeframe,
      userRank,
      isLoading: false,
    });
  },

  setLeaderboardType: (type) => {
    set({ leaderboardType: type });
    get().loadLeaderboard(type);
  },

  setLeaderboardTimeframe: (timeframe) => {
    set({ leaderboardTimeframe: timeframe });
    get().loadLeaderboard(undefined, timeframe);
  },

  // --- Achievements ---

  loadAchievements: () => {
    set({ isLoading: true, error: null });
    set({
      allAchievements: MOCK_ACHIEVEMENTS,
      userAchievements: MOCK_USER_ACHIEVEMENTS,
      isLoading: false,
    });
  },

  // --- Chat ---

  loadChatRooms: () => {
    set({ isLoading: true, error: null });
    set({
      chatRooms: MOCK_CHAT_ROOMS,
      isLoading: false,
    });
  },

  openChatRoom: (roomId) => {
    const { chatRooms } = get();
    const room = chatRooms.find(r => r.id === roomId);
    if (!room) return;

    // Generate some mock messages for the room
    const mockMessages: ChatMessage[] = [
      {
        id: generateId(),
        roomId,
        senderId: room.participants[1] ?? 'usr-001',
        senderUsername: room.type === 'global' ? 'SoonerMagic' : (room.lastMessage?.senderUsername ?? 'Unknown'),
        content: 'Hey everyone!',
        type: 'text',
        createdAt: '2026-03-10T10:00:00Z',
      },
      {
        id: generateId(),
        roomId,
        senderId: 'current-user',
        senderUsername: 'You',
        content: 'What\'s up?',
        type: 'text',
        createdAt: '2026-03-10T10:05:00Z',
      },
    ];

    if (room.lastMessage) {
      mockMessages.push(room.lastMessage);
    }

    // Clear unread count for this room
    const updatedRooms = chatRooms.map(r =>
      r.id === roomId ? { ...r, unreadCount: 0 } : r
    );

    set({
      activeChatRoom: roomId,
      chatMessages: mockMessages.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
      chatRooms: updatedRooms,
    });
  },

  sendMessage: (content) => {
    const { activeChatRoom, chatMessages, chatRooms } = get();
    if (!activeChatRoom || !content.trim()) return;

    const newMessage: ChatMessage = {
      id: generateId(),
      roomId: activeChatRoom,
      senderId: 'current-user',
      senderUsername: 'You',
      content: content.trim(),
      type: 'text',
      createdAt: new Date().toISOString(),
    };

    const updatedRooms = chatRooms.map(r =>
      r.id === activeChatRoom ? { ...r, lastMessage: newMessage } : r
    );

    set({
      chatMessages: [...chatMessages, newMessage],
      chatRooms: updatedRooms,
    });
  },

  closeChatRoom: () => {
    set({ activeChatRoom: null, chatMessages: [] });
  },

  // --- Notifications ---

  loadNotifications: () => {
    set({ isLoading: true, error: null });
    const unread = MOCK_NOTIFICATIONS.filter(n => !n.read).length;
    set({
      notifications: MOCK_NOTIFICATIONS,
      unreadCount: unread,
      isLoading: false,
    });
  },

  markNotificationRead: (id) => {
    set(state => {
      const updated = state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      const unread = updated.filter(n => !n.read).length;
      return { notifications: updated, unreadCount: unread };
    });
  },

  markAllNotificationsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  // --- Reset ---

  reset: () => set(INITIAL_STATE),
}));
