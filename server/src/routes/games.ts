import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

const router = Router();

// ---------------------------------------------------------------------------
// The Grid
// ---------------------------------------------------------------------------

// GET /grid/daily
router.get('/grid/daily', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Fetch today's grid puzzle from PostgreSQL / cache in Redis

    const today = new Date().toISOString().slice(0, 10);

    const mockGrid = {
      id: 'grid_' + today,
      date: today,
      size: 3,
      rows: [
        { label: 'SEC', type: 'conference' },
        { label: '1,000+ rushing yards (single season)', type: 'stat_threshold' },
        { label: 'Heisman finalist', type: 'award' },
      ],
      columns: [
        { label: 'Big Ten', type: 'conference' },
        { label: 'First-round draft pick', type: 'draft' },
        { label: 'Played in CFP', type: 'postseason' },
      ],
      completedCells: 0,
      maxGuesses: 9,
    };

    res.json({
      success: true,
      data: mockGrid,
    });
  } catch (error) {
    next(error);
  }
});

// POST /grid/submit
router.post('/grid/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { row, col, answer } = req.body;

    if (row === undefined || col === undefined || !answer) {
      throw new AppError('row, col, and answer are required.', 400);
    }

    // TODO: Validate answer against puzzle solution in DB
    // TODO: Calculate rarity based on how many other users picked the same answer

    const mockResult = {
      correct: true,
      answer,
      rarity: 0.12,
      rarityLabel: 'Uncommon',
      remainingGuesses: 8,
    };

    res.json({
      success: true,
      data: mockResult,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Stat Stack
// ---------------------------------------------------------------------------

// GET /stat-stack/daily
router.get('/stat-stack/daily', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Fetch daily stat stack config from DB

    const today = new Date().toISOString().slice(0, 10);

    const mockConfig = {
      id: 'ss_' + today,
      date: today,
      category: 'Rushing Yards',
      description: 'Pick 5 player-seasons that maximize total rushing yards.',
      maxPicks: 5,
      transferPortalAvailable: true,
      targetingRiskEnabled: true,
    };

    res.json({
      success: true,
      data: mockConfig,
    });
  } catch (error) {
    next(error);
  }
});

// POST /stat-stack/submit
router.post('/stat-stack/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { picks } = req.body;

    if (!picks || !Array.isArray(picks) || picks.length === 0) {
      throw new AppError('picks array is required.', 400);
    }

    // TODO: Validate picks and calculate scores from real stat data
    // TODO: Compute percentile rank against other submissions

    const mockResult = {
      score: 8742,
      breakdown: picks.map((pick: unknown, i: number) => ({
        pick,
        statValue: 1800 - i * 100,
        valid: true,
      })),
      percentile: 82,
      rank: 1847,
      totalParticipants: 10250,
      targetingTriggered: false,
    };

    res.json({
      success: true,
      data: mockResult,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Conference Clash
// ---------------------------------------------------------------------------

// GET /clash/modes
router.get('/clash/modes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Load available modes from config / DB

    const modes = [
      { id: 'stat-line', name: 'Stat Line ID', description: 'Given a stat line, guess the player and year.' },
      { id: 'blind-resume', name: 'Blind Resume', description: 'Given anonymous team stats, guess which team.' },
      { id: 'head-to-head', name: 'Head-to-Head', description: 'Real-time knowledge battle vs. another user.' },
    ];

    res.json({
      success: true,
      data: modes,
    });
  } catch (error) {
    next(error);
  }
});

// POST /clash/:mode/start
router.post('/clash/:mode/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mode = req.params.mode as string;
    const validModes = ['stat-line', 'blind-resume', 'head-to-head'];

    if (!validModes.includes(mode)) {
      throw new AppError(`Invalid mode: ${mode}. Valid modes: ${validModes.join(', ')}`, 400);
    }

    // TODO: Create game session in DB, match with opponent for head-to-head

    const mockSession = {
      sessionId: 'clash_' + Date.now(),
      mode,
      round: 1,
      totalRounds: 5,
      timePerRound: 30,
      prompt: mode === 'blind-resume'
        ? {
            type: 'blind-resume',
            stats: { wins: 11, losses: 2, pointsPerGame: 38.4, yardsPerGame: 485.2, conference: 'SEC' },
          }
        : {
            type: 'stat-line',
            stats: { passingYards: 3627, passingTDs: 32, interceptions: 7, rushingYards: 415, season: '2019' },
          },
    };

    res.json({
      success: true,
      data: mockSession,
    });
  } catch (error) {
    next(error);
  }
});

// POST /clash/:mode/guess
router.post('/clash/:mode/guess', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mode } = req.params;
    const { sessionId, guess } = req.body;

    if (!sessionId || !guess) {
      throw new AppError('sessionId and guess are required.', 400);
    }

    // TODO: Validate guess against session data in DB

    const mockResult = {
      sessionId,
      correct: true,
      correctAnswer: guess,
      pointsEarned: 100,
      roundComplete: true,
      nextRound: 2,
      totalScore: 100,
    };

    res.json({
      success: true,
      data: mockResult,
    });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Dynasty Builder
// ---------------------------------------------------------------------------

// GET /dynasty/programs
router.get('/dynasty/programs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Fetch programs from DB

    const programs = [
      { id: 'alabama', name: 'Alabama Crimson Tide', conference: 'SEC', salaryCap: 200 },
      { id: 'ohio-state', name: 'Ohio State Buckeyes', conference: 'Big Ten', salaryCap: 200 },
      { id: 'clemson', name: 'Clemson Tigers', conference: 'ACC', salaryCap: 200 },
      { id: 'oklahoma', name: 'Oklahoma Sooners', conference: 'SEC', salaryCap: 200 },
      { id: 'lsu', name: 'LSU Tigers', conference: 'SEC', salaryCap: 200 },
      { id: 'usc', name: 'USC Trojans', conference: 'Big Ten', salaryCap: 200 },
    ];

    res.json({
      success: true,
      data: programs,
    });
  } catch (error) {
    next(error);
  }
});

// GET /dynasty/players/:program
router.get('/dynasty/players/:program', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { program } = req.params;

    // TODO: Fetch player pool from DB for the given program

    const mockPlayers = [
      { id: 'p1', name: 'Derrick Henry', position: 'RB', years: '2013-2015', salary: 45, rating: 97 },
      { id: 'p2', name: 'Julio Jones', position: 'WR', years: '2008-2010', salary: 42, rating: 95 },
      { id: 'p3', name: 'Joe Namath', position: 'QB', years: '1962-1964', salary: 38, rating: 92 },
      { id: 'p4', name: 'Dont\'a Hightower', position: 'LB', years: '2008-2011', salary: 32, rating: 89 },
      { id: 'p5', name: 'Minkah Fitzpatrick', position: 'DB', years: '2015-2017', salary: 35, rating: 91 },
    ];

    res.json({
      success: true,
      data: { program, players: mockPlayers },
    });
  } catch (error) {
    next(error);
  }
});

// POST /dynasty/simulate
router.post('/dynasty/simulate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roster1, roster2 } = req.body;

    if (!roster1 || !roster2) {
      throw new AppError('roster1 and roster2 are required.', 400);
    }

    // TODO: Run simulation engine against the two rosters

    const mockSimulation = {
      winner: 'roster1',
      score: { roster1: 35, roster2: 28 },
      mvp: { name: 'Derrick Henry', position: 'RB', stats: '28 carries, 187 yards, 3 TDs' },
      highlights: [
        'Derrick Henry broke a 65-yard TD run in the 3rd quarter.',
        'Roster 2 rallied in the 4th but fell short on a failed 2-point conversion.',
      ],
      historicalAccuracy: {
        roster1: 0.88,
        roster2: 0.82,
      },
    };

    res.json({
      success: true,
      data: mockSimulation,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
