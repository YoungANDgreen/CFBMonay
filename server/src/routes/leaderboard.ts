import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

const router = Router();

// Mock leaderboard data generator
function generateMockLeaderboard(
  type: string,
  timeframe: string,
  conference: string | undefined,
  page: number,
  pageSize: number
) {
  // TODO: Query leaderboard from PostgreSQL with proper filtering, sorting, pagination

  const allEntries = [
    { rank: 1, userId: 'user-050', username: 'gridiron_guru', displayName: 'Gridiron Guru', score: 14520, gamesPlayed: 312, accuracy: 0.78 },
    { rank: 2, userId: 'user-002', username: 'pigskin_prophet', displayName: 'Jake M.', score: 13890, gamesPlayed: 298, accuracy: 0.75 },
    { rank: 3, userId: 'user-051', username: 'cfb_oracle', displayName: 'CFB Oracle', score: 13210, gamesPlayed: 305, accuracy: 0.73 },
    { rank: 4, userId: 'user-003', username: 'chaos_agent', displayName: 'Sarah K.', score: 12780, gamesPlayed: 287, accuracy: 0.71 },
    { rank: 5, userId: 'user-052', username: 'touchdown_tom', displayName: 'Touchdown Tom', score: 12450, gamesPlayed: 275, accuracy: 0.70 },
    { rank: 6, userId: 'user-053', username: 'blitz_master', displayName: 'Blitz Master', score: 12100, gamesPlayed: 260, accuracy: 0.69 },
    { rank: 7, userId: 'user-004', username: 'roll_tide_42', displayName: 'Mike R.', score: 11800, gamesPlayed: 252, accuracy: 0.68 },
    { rank: 8, userId: 'user-054', username: 'heisman_hunter', displayName: 'Heisman Hunter', score: 11500, gamesPlayed: 245, accuracy: 0.67 },
    { rank: 9, userId: 'mock-user-001', username: 'devuser', displayName: 'Dev User', score: 8750, gamesPlayed: 142, accuracy: 0.67 },
    { rank: 10, userId: 'user-055', username: 'fourth_and_long', displayName: 'Fourth and Long', score: 8200, gamesPlayed: 130, accuracy: 0.64 },
  ];

  const start = (page - 1) * pageSize;
  const entries = allEntries.slice(start, start + pageSize);

  return {
    type,
    timeframe,
    conference: conference || 'all',
    page,
    pageSize,
    totalEntries: allEntries.length,
    totalPages: Math.ceil(allEntries.length / pageSize),
    entries,
  };
}

// GET / — Paginated leaderboard
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = (req.query.type as string) || 'overall';
    const timeframe = (req.query.timeframe as string) || 'all_time';
    const conference = req.query.conference as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 25));

    const validTypes = ['overall', 'grid', 'stat_stack', 'clash', 'dynasty', 'predictions'];
    if (!validTypes.includes(type)) {
      throw new AppError(`Invalid type. Valid types: ${validTypes.join(', ')}`, 400);
    }

    const validTimeframes = ['all_time', 'season', 'monthly', 'weekly'];
    if (!validTimeframes.includes(timeframe)) {
      throw new AppError(`Invalid timeframe. Valid timeframes: ${validTimeframes.join(', ')}`, 400);
    }

    const leaderboard = generateMockLeaderboard(type, timeframe, conference, page, pageSize);

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
});

// GET /my-rank — User's rank
router.get('/my-rank', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = (req.query.type as string) || 'overall';

    const validTypes = ['overall', 'grid', 'stat_stack', 'clash', 'dynasty', 'predictions'];
    if (!validTypes.includes(type)) {
      throw new AppError(`Invalid type. Valid types: ${validTypes.join(', ')}`, 400);
    }

    // TODO: Query user's rank from PostgreSQL

    const mockRank = {
      userId: req.user!.id,
      username: req.user!.username,
      type,
      rank: 9,
      totalPlayers: 10250,
      percentile: 99.91,
      score: 8750,
      breakdown: {
        gridScore: 2100,
        statStackScore: 1850,
        clashScore: 1600,
        dynastyScore: 1400,
        predictionScore: 1800,
      },
    };

    res.json({
      success: true,
      data: mockRank,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
