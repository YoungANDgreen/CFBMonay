import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

const router = Router();

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

// GET /friends — List friends
router.get('/friends', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Query friends list from PostgreSQL

    const mockFriends = [
      { id: 'user-002', username: 'pigskin_prophet', displayName: 'Jake M.', avatarUrl: null, status: 'online' },
      { id: 'user-003', username: 'chaos_agent', displayName: 'Sarah K.', avatarUrl: null, status: 'offline' },
      { id: 'user-004', username: 'roll_tide_42', displayName: 'Mike R.', avatarUrl: null, status: 'in_game' },
    ];

    res.json({
      success: true,
      data: mockFriends,
    });
  } catch (error) {
    next(error);
  }
});

// POST /friends/request — Send friend request
router.post('/friends/request', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toUserId } = req.body;

    if (!toUserId) {
      throw new AppError('toUserId is required.', 400);
    }

    if (toUserId === req.user!.id) {
      throw new AppError('You cannot send a friend request to yourself.', 400);
    }

    // TODO: Check if request already exists, insert into PostgreSQL, send notification

    const mockRequest = {
      requestId: 'fr_' + Date.now(),
      fromUserId: req.user!.id,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: mockRequest,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /friends/request/:id — Accept/decline friend request
router.patch('/friends/request/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { accept } = req.body;

    if (accept === undefined || typeof accept !== 'boolean') {
      throw new AppError('accept (boolean) is required.', 400);
    }

    // TODO: Update friend request status in PostgreSQL, create friendship if accepted

    res.json({
      success: true,
      data: {
        requestId: id,
        status: accept ? 'accepted' : 'declined',
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /friends/:friendId — Remove friend
router.delete('/friends/:friendId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { friendId } = req.params;

    // TODO: Delete friendship record from PostgreSQL

    res.json({
      success: true,
      data: {
        removedFriendId: friendId,
        message: 'Friend removed successfully.',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

// GET /search — Search users
router.get('/search', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      throw new AppError('Search query (q) must be at least 2 characters.', 400);
    }

    // TODO: Search users by username/displayName in PostgreSQL with ILIKE

    const mockResults = [
      { id: 'user-010', username: 'cfb_king', displayName: 'CFB King', avatarUrl: null },
      { id: 'user-011', username: 'cfb_queen', displayName: 'CFB Queen', avatarUrl: null },
    ];

    res.json({
      success: true,
      data: {
        query: query.trim(),
        results: mockResults,
        total: mockResults.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

// GET /notifications — List notifications
router.get('/notifications', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Fetch notifications from PostgreSQL, ordered by createdAt DESC

    const mockNotifications = [
      {
        id: 'notif_001',
        type: 'friend_request',
        message: 'pigskin_prophet sent you a friend request.',
        read: false,
        createdAt: '2025-11-10T14:30:00.000Z',
      },
      {
        id: 'notif_002',
        type: 'trade_proposed',
        message: 'You received a trade offer in SEC Showdown.',
        read: false,
        createdAt: '2025-11-10T12:15:00.000Z',
      },
      {
        id: 'notif_003',
        type: 'achievement',
        message: 'You unlocked "Grid Streak 10"!',
        read: true,
        createdAt: '2025-11-09T20:00:00.000Z',
      },
    ];

    res.json({
      success: true,
      data: mockNotifications,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /notifications/:id/read — Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // TODO: Update notification read status in PostgreSQL

    res.json({
      success: true,
      data: { notificationId: id, read: true },
    });
  } catch (error) {
    next(error);
  }
});

// POST /notifications/read-all — Mark all notifications as read
router.post('/notifications/read-all', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Bulk update all unread notifications for user in PostgreSQL

    res.json({
      success: true,
      data: { message: 'All notifications marked as read.', updatedCount: 2 },
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

// GET /achievements — List all achievements
router.get('/achievements', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Fetch achievement definitions from DB / config

    const mockAchievements = [
      { id: 'ach_grid_streak_5', name: 'Grid Streak 5', description: 'Complete 5 daily grids in a row.', icon: 'fire', tier: 'bronze' },
      { id: 'ach_grid_streak_10', name: 'Grid Streak 10', description: 'Complete 10 daily grids in a row.', icon: 'fire', tier: 'silver' },
      { id: 'ach_grid_streak_30', name: 'Grid Streak 30', description: 'Complete 30 daily grids in a row.', icon: 'fire', tier: 'gold' },
      { id: 'ach_rare_find', name: 'Rare Find', description: 'Submit a grid answer with under 5% rarity.', icon: 'diamond', tier: 'silver' },
      { id: 'ach_stat_master', name: 'Stat Master', description: 'Reach 95th percentile in Stat Stack.', icon: 'chart', tier: 'gold' },
      { id: 'ach_upset_caller', name: 'Upset Caller', description: 'Correctly predict 3 upsets in one week.', icon: 'megaphone', tier: 'gold' },
      { id: 'ach_dynasty_legend', name: 'Dynasty Legend', description: 'Win 10 dynasty simulations.', icon: 'trophy', tier: 'platinum' },
    ];

    res.json({
      success: true,
      data: mockAchievements,
    });
  } catch (error) {
    next(error);
  }
});

// GET /achievements/mine — User's achievement progress
router.get('/achievements/mine', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Fetch user's achievement progress from PostgreSQL

    const mockProgress = {
      userId: req.user!.id,
      totalUnlocked: 3,
      totalAchievements: 7,
      achievements: [
        { id: 'ach_grid_streak_5', unlocked: true, unlockedAt: '2025-10-15T08:00:00.000Z', progress: 1.0 },
        { id: 'ach_grid_streak_10', unlocked: true, unlockedAt: '2025-10-20T08:00:00.000Z', progress: 1.0 },
        { id: 'ach_grid_streak_30', unlocked: false, unlockedAt: null, progress: 0.4 },
        { id: 'ach_rare_find', unlocked: true, unlockedAt: '2025-10-18T14:22:00.000Z', progress: 1.0 },
        { id: 'ach_stat_master', unlocked: false, unlockedAt: null, progress: 0.82 },
        { id: 'ach_upset_caller', unlocked: false, unlockedAt: null, progress: 0.33 },
        { id: 'ach_dynasty_legend', unlocked: false, unlockedAt: null, progress: 0.2 },
      ],
    };

    res.json({
      success: true,
      data: mockProgress,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

// GET /chat/rooms — List chat rooms
router.get('/chat/rooms', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Fetch user's chat rooms from PostgreSQL

    const mockRooms = [
      {
        id: 'room_001',
        type: 'league',
        name: 'SEC Showdown Chat',
        leagueId: 'league_001',
        lastMessage: { text: 'Nice trade!', sender: 'pigskin_prophet', timestamp: '2025-11-10T14:30:00.000Z' },
        unreadCount: 3,
      },
      {
        id: 'room_002',
        type: 'direct',
        name: 'pigskin_prophet',
        participants: ['mock-user-001', 'user-002'],
        lastMessage: { text: 'Want to do a head-to-head clash?', sender: 'pigskin_prophet', timestamp: '2025-11-10T10:00:00.000Z' },
        unreadCount: 1,
      },
    ];

    res.json({
      success: true,
      data: mockRooms,
    });
  } catch (error) {
    next(error);
  }
});

// GET /chat/rooms/:roomId/messages — Get messages (paginated)
router.get('/chat/rooms/:roomId/messages', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 50;

    // TODO: Fetch paginated messages from PostgreSQL

    const mockMessages = {
      roomId,
      page,
      pageSize,
      totalMessages: 128,
      messages: [
        { id: 'msg_003', senderId: 'user-002', senderName: 'pigskin_prophet', text: 'Nice trade!', timestamp: '2025-11-10T14:30:00.000Z' },
        { id: 'msg_002', senderId: 'mock-user-001', senderName: 'devuser', text: 'Thanks! I think it was fair.', timestamp: '2025-11-10T14:28:00.000Z' },
        { id: 'msg_001', senderId: 'user-002', senderName: 'pigskin_prophet', text: 'Did you accept the trade for Etienne?', timestamp: '2025-11-10T14:25:00.000Z' },
      ],
    };

    res.json({
      success: true,
      data: mockMessages,
    });
  } catch (error) {
    next(error);
  }
});

// POST /chat/rooms/:roomId/messages — Send message
router.post('/chat/rooms/:roomId/messages', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      throw new AppError('Message text is required.', 400);
    }

    // TODO: Insert message into PostgreSQL, emit via WebSocket (Socket.io)

    const mockMessage = {
      id: 'msg_' + Date.now(),
      roomId,
      senderId: req.user!.id,
      senderName: req.user!.username,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: mockMessage,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
