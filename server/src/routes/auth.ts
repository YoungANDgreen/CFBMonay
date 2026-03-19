import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

const router = Router();

// POST /register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, displayName, email, password } = req.body;

    if (!username || !email || !password) {
      throw new AppError('username, email, and password are required.', 400);
    }

    // TODO: Hash password with bcrypt
    // TODO: Insert user into PostgreSQL
    // TODO: Generate real JWT token

    const mockUser = {
      id: 'usr_' + Date.now(),
      username,
      displayName: displayName || username,
      email,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    res.status(201).json({
      success: true,
      data: { user: mockUser, token: mockToken },
    });
  } catch (error) {
    next(error);
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('email and password are required.', 400);
    }

    // TODO: Look up user by email in PostgreSQL
    // TODO: Compare password hash with bcrypt
    // TODO: Generate real JWT token

    const mockUser = {
      id: 'mock-user-001',
      username: 'cfbfan42',
      displayName: 'CFB Fan',
      email,
      avatarUrl: null,
      createdAt: '2025-09-01T00:00:00.000Z',
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    res.json({
      success: true,
      data: { user: mockUser, token: mockToken },
    });
  } catch (error) {
    next(error);
  }
});

// POST /guest
router.post('/guest', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Create guest user record in PostgreSQL
    // TODO: Generate JWT with guest role

    const guestId = 'guest_' + Date.now();

    const mockUser = {
      id: guestId,
      username: 'guest_' + Math.random().toString(36).slice(2, 8),
      displayName: 'Guest',
      email: null,
      avatarUrl: null,
      isGuest: true,
      createdAt: new Date().toISOString(),
    };

    const mockToken = 'mock-guest-token-' + Date.now();

    res.status(201).json({
      success: true,
      data: { user: mockUser, token: mockToken },
    });
  } catch (error) {
    next(error);
  }
});

// GET /me
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Fetch full user profile from PostgreSQL using req.user.id

    const mockProfile = {
      id: req.user!.id,
      username: req.user!.username,
      displayName: 'Dev User',
      email: req.user!.email,
      avatarUrl: null,
      bio: 'College football enthusiast',
      favoriteTeam: 'Ohio State Buckeyes',
      stats: {
        gamesPlayed: 142,
        totalScore: 8750,
        gridStreak: 12,
        predictionAccuracy: 0.67,
      },
      createdAt: '2025-09-01T00:00:00.000Z',
    };

    res.json({
      success: true,
      data: mockProfile,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /me
router.patch('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allowedFields = ['displayName', 'bio', 'favoriteTeam', 'avatarUrl'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError('No valid fields to update.', 400);
    }

    // TODO: Update user record in PostgreSQL

    const updatedUser = {
      id: req.user!.id,
      username: req.user!.username,
      displayName: 'Dev User',
      email: req.user!.email,
      avatarUrl: null,
      bio: 'College football enthusiast',
      favoriteTeam: 'Ohio State Buckeyes',
      createdAt: '2025-09-01T00:00:00.000Z',
      ...updates,
    };

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// POST /logout
router.post('/logout', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Invalidate the JWT token (add to Redis blacklist or delete session)

    res.json({
      success: true,
      data: { message: 'Logged out successfully.' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
