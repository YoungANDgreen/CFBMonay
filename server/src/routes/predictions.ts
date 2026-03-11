import { Router, Request, Response, NextFunction } from 'express';
import { spawn, ChildProcess } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

let mlProcess: ChildProcess | null = null;
let mlReady = false;
const pendingRequests: Map<string, {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = new Map();

function startMLProcess(): void {
  const scriptPath = path.resolve(__dirname, '..', '..', 'ml', 'predict.py');
  mlProcess = spawn('python', [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const rl = readline.createInterface({ input: mlProcess.stdout! });
  rl.on('line', (line: string) => {
    try {
      const data = JSON.parse(line);
      if (data.status === 'ready') {
        mlReady = true;
        console.log('[ML] Prediction service ready');
        return;
      }
      const firstKey = pendingRequests.keys().next().value;
      if (firstKey) {
        const pending = pendingRequests.get(firstKey)!;
        pendingRequests.delete(firstKey);
        pending.resolve(data);
      }
    } catch (e) {
      console.error('[ML] Parse error:', e);
    }
  });

  mlProcess.stderr?.on('data', (data: Buffer) => {
    console.log(`[ML] ${data.toString().trim()}`);
  });

  mlProcess.on('exit', (code: number | null) => {
    console.log(`[ML] Process exited with code ${code}`);
    mlReady = false;
    mlProcess = null;
  });
}

async function predict(request: Record<string, unknown>): Promise<unknown> {
  if (!mlProcess || !mlReady) {
    startMLProcess();
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (mlReady) { clearInterval(check); resolve(); }
      }, 100);
      // Timeout after 30 seconds
      setTimeout(() => { clearInterval(check); resolve(); }, 30000);
    });
    if (!mlReady) {
      throw new Error('ML prediction service failed to start');
    }
  }

  return new Promise((resolve, reject) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    pendingRequests.set(id, { resolve, reject });
    mlProcess!.stdin!.write(JSON.stringify(request) + '\n');

    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('ML prediction timeout'));
      }
    }, 10000);
  });
}

const router = Router();

// GET /weeks/:weekNumber — Week's game predictions from ML model
router.get('/weeks/:weekNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber as string, 10);

    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 15) {
      throw new AppError('weekNumber must be between 1 and 15.', 400);
    }

    // TODO: Fetch ML predictions from prediction engine / DB

    const mockPredictions = {
      week: weekNumber,
      season: 2025,
      games: [
        {
          gameId: 'g1',
          homeTeam: 'Alabama',
          awayTeam: 'Georgia',
          predictedSpread: -3.5,
          predictedTotal: 52.5,
          homeWinProbability: 0.42,
          awayWinProbability: 0.58,
          upsetAlert: false,
          confidence: 0.72,
          keyFactors: ['Georgia rushing defense ranked #2', 'Alabama home-field advantage', 'Injury to Alabama starting LB'],
        },
        {
          gameId: 'g2',
          homeTeam: 'Ohio State',
          awayTeam: 'Michigan',
          predictedSpread: -7.0,
          predictedTotal: 47.5,
          homeWinProbability: 0.68,
          awayWinProbability: 0.32,
          upsetAlert: false,
          confidence: 0.65,
          keyFactors: ['Ohio State 8-0 at home this season', 'Michigan turnover margin -4 last 3 games'],
        },
        {
          gameId: 'g3',
          homeTeam: 'Appalachian State',
          awayTeam: 'Texas A&M',
          predictedSpread: 10.5,
          predictedTotal: 55.0,
          homeWinProbability: 0.28,
          awayWinProbability: 0.72,
          upsetAlert: true,
          confidence: 0.53,
          keyFactors: ['App State undefeated at home', 'Texas A&M traveling 800+ miles', 'Noon kickoff in Boone, NC'],
        },
      ],
      modelVersion: 'v2.4.1',
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: mockPredictions,
    });
  } catch (error) {
    next(error);
  }
});

// POST /weeks/:weekNumber/predict — Submit user prediction
router.post('/weeks/:weekNumber/predict', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber as string, 10);
    const { gameId, type, value } = req.body;

    if (!gameId || !type || value === undefined) {
      throw new AppError('gameId, type, and value are required.', 400);
    }

    const validTypes = ['spread', 'over_under', 'winner', 'exact_score'];
    if (!validTypes.includes(type)) {
      throw new AppError(`Invalid type. Valid types: ${validTypes.join(', ')}`, 400);
    }

    // TODO: Store prediction in PostgreSQL, check for duplicates

    const mockPrediction = {
      predictionId: 'pred_' + Date.now(),
      userId: req.user!.id,
      week: weekNumber,
      gameId,
      type,
      value,
      submittedAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: mockPrediction,
    });
  } catch (error) {
    next(error);
  }
});

// GET /weeks/:weekNumber/results — Week results and scoring
router.get('/weeks/:weekNumber/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber as string, 10);

    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 15) {
      throw new AppError('weekNumber must be between 1 and 15.', 400);
    }

    // TODO: Fetch results from DB, compare predictions to actuals

    const mockResults = {
      week: weekNumber,
      season: 2025,
      modelAccuracy: {
        spreadRecord: { correct: 8, total: 12 },
        overUnderRecord: { correct: 7, total: 12 },
        upsetsCalled: { correct: 1, total: 2 },
      },
      games: [
        {
          gameId: 'g1',
          homeTeam: 'Alabama',
          awayTeam: 'Georgia',
          finalScore: { home: 24, away: 31 },
          predictedSpread: -3.5,
          actualSpread: 7,
          spreadCorrect: true,
        },
      ],
    };

    res.json({
      success: true,
      data: mockResults,
    });
  } catch (error) {
    next(error);
  }
});

// GET /my-picks — User's predictions for current season
router.get('/my-picks', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Fetch all predictions for current season from PostgreSQL

    const mockPicks = {
      userId: req.user!.id,
      season: 2025,
      totalPredictions: 45,
      correctPredictions: 29,
      accuracy: 0.644,
      weeklyBreakdown: [
        { week: 1, predictions: 5, correct: 3 },
        { week: 2, predictions: 5, correct: 4 },
        { week: 3, predictions: 5, correct: 3 },
      ],
      recentPicks: [
        { gameId: 'g1', type: 'winner', value: 'Georgia', result: 'correct', week: 10 },
        { gameId: 'g2', type: 'spread', value: -7.0, result: 'incorrect', week: 10 },
      ],
    };

    res.json({
      success: true,
      data: mockPicks,
    });
  } catch (error) {
    next(error);
  }
});

// GET /model/accuracy — Model accuracy stats
router.get('/model/accuracy', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Compute from historical prediction records

    const mockAccuracy = {
      season: 2025,
      modelVersion: 'v2.4.1',
      overall: {
        spreadAccuracy: 0.683,
        overUnderAccuracy: 0.612,
        straightUpAccuracy: 0.741,
        upsetDetection: 0.38,
      },
      byConference: [
        { conference: 'SEC', spreadAccuracy: 0.71, gamesAnalyzed: 64 },
        { conference: 'Big Ten', spreadAccuracy: 0.69, gamesAnalyzed: 58 },
        { conference: 'Big 12', spreadAccuracy: 0.66, gamesAnalyzed: 52 },
        { conference: 'ACC', spreadAccuracy: 0.65, gamesAnalyzed: 48 },
      ],
      weeklyTrend: [
        { week: 1, accuracy: 0.58 },
        { week: 2, accuracy: 0.62 },
        { week: 3, accuracy: 0.67 },
        { week: 4, accuracy: 0.71 },
        { week: 5, accuracy: 0.69 },
      ],
    };

    res.json({
      success: true,
      data: mockAccuracy,
    });
  } catch (error) {
    next(error);
  }
});

// GET /model/backtest — Backtest results (2015-2024)
router.get('/model/backtest', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Load precomputed backtest results from DB / cache

    const mockBacktest = {
      modelVersion: 'v2.4.1',
      seasons: [
        { year: 2015, gamesAnalyzed: 780, spreadAccuracy: 0.61, straightUpAccuracy: 0.71 },
        { year: 2016, gamesAnalyzed: 782, spreadAccuracy: 0.63, straightUpAccuracy: 0.72 },
        { year: 2017, gamesAnalyzed: 785, spreadAccuracy: 0.62, straightUpAccuracy: 0.70 },
        { year: 2018, gamesAnalyzed: 790, spreadAccuracy: 0.65, straightUpAccuracy: 0.73 },
        { year: 2019, gamesAnalyzed: 788, spreadAccuracy: 0.66, straightUpAccuracy: 0.74 },
        { year: 2020, gamesAnalyzed: 650, spreadAccuracy: 0.59, straightUpAccuracy: 0.68 },
        { year: 2021, gamesAnalyzed: 792, spreadAccuracy: 0.67, straightUpAccuracy: 0.75 },
        { year: 2022, gamesAnalyzed: 800, spreadAccuracy: 0.68, straightUpAccuracy: 0.74 },
        { year: 2023, gamesAnalyzed: 805, spreadAccuracy: 0.69, straightUpAccuracy: 0.76 },
        { year: 2024, gamesAnalyzed: 810, spreadAccuracy: 0.70, straightUpAccuracy: 0.77 },
      ],
      aggregate: {
        totalGames: 7782,
        avgSpreadAccuracy: 0.65,
        avgStraightUpAccuracy: 0.73,
      },
      notes: 'COVID-shortened 2020 season had lower sample size and reduced accuracy.',
    };

    res.json({
      success: true,
      data: mockBacktest,
    });
  } catch (error) {
    next(error);
  }
});

// POST /leagues — Create prediction league
router.post('/leagues', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, maxMembers, predictionTypes } = req.body;

    if (!name) {
      throw new AppError('League name is required.', 400);
    }

    // TODO: Insert prediction league into PostgreSQL

    const mockLeague = {
      id: 'pred_league_' + Date.now(),
      name,
      maxMembers: maxMembers || 20,
      predictionTypes: predictionTypes || ['spread', 'winner'],
      commissioner: req.user!.id,
      members: 1,
      season: 2025,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: mockLeague,
    });
  } catch (error) {
    next(error);
  }
});

// GET /leagues — List prediction leagues
router.get('/leagues', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Query prediction leagues user belongs to from PostgreSQL

    const mockLeagues = [
      {
        id: 'pred_league_001',
        name: 'The Spread Kings',
        members: 8,
        maxMembers: 20,
        myRank: 2,
        myScore: 156,
        leader: { username: 'pigskin_prophet', score: 172 },
        season: 2025,
      },
      {
        id: 'pred_league_002',
        name: 'Upset City',
        members: 15,
        maxMembers: 25,
        myRank: 6,
        myScore: 89,
        leader: { username: 'chaos_agent', score: 112 },
        season: 2025,
      },
    ];

    res.json({
      success: true,
      data: mockLeagues,
    });
  } catch (error) {
    next(error);
  }
});

// ML-powered prediction endpoint
router.post('/ml/predict', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { homeTeam, awayTeam, season, week } = req.body;

    if (!homeTeam || !awayTeam) {
      return res.status(400).json({
        success: false,
        error: 'homeTeam and awayTeam are required',
      });
    }

    const result = await predict({
      home_team: homeTeam,
      away_team: awayTeam,
      season: season || 2024,
      week: week || undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
