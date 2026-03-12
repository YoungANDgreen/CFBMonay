// ============================================================
// GridIron IQ — Core Type Definitions
// ============================================================

// --- Players & Teams ---

export interface Player {
  id: string;
  name: string;
  position: Position;
  school: string;
  conference: Conference;
  seasons: PlayerSeason[];
  draftInfo?: DraftInfo;
  awards: Award[];
}

export type Position =
  | 'QB' | 'RB' | 'WR' | 'TE' | 'OL'
  | 'DL' | 'LB' | 'CB' | 'S' | 'DB'
  | 'K' | 'P' | 'ATH';

export type Conference =
  | 'SEC' | 'Big Ten' | 'Big 12' | 'ACC' | 'Pac-12'
  | 'AAC' | 'Mountain West' | 'Sun Belt' | 'MAC' | 'CUSA'
  | 'Independent';

export interface PlayerSeason {
  year: number;
  school: string;
  conference: Conference;
  stats: SeasonStats;
}

export interface SeasonStats {
  gamesPlayed: number;
  passingYards?: number;
  passingTDs?: number;
  rushingYards?: number;
  rushingTDs?: number;
  receivingYards?: number;
  receivingTDs?: number;
  tackles?: number;
  sacks?: number;
  interceptions?: number;
  totalTouchdowns?: number;
  allPurposeYards?: number;
}

export interface DraftInfo {
  year: number;
  round: number;
  pick: number;
  team: string;
}

export type Award =
  | 'Heisman'
  | 'Maxwell'
  | 'Biletnikoff'
  | 'Doak Walker'
  | 'Thorpe'
  | 'Butkus'
  | 'Outland'
  | 'Nagurski'
  | 'Bednarik'
  | 'All-American'
  | 'Conference POY';

export interface Team {
  id: string;
  name: string;
  mascot: string;
  conference: Conference;
  abbreviation: string;
  color: string;
  altColor: string;
  logoUrl: string;
}

// --- The Grid Game ---

export type CriteriaType =
  | 'conference'
  | 'school'
  | 'award'
  | 'draft_round'
  | 'stat_threshold'
  | 'bowl_game'
  | 'era'
  | 'position'
  | 'coaching_tree'
  | 'transfer';

export interface GridCriteria {
  type: CriteriaType;
  value: string;
  displayText: string;
}

export interface GridPuzzle {
  id: string;
  date: string;
  size: 3 | 4;
  rows: GridCriteria[];
  columns: GridCriteria[];
  validAnswers: Record<string, string[]>; // cellKey → playerIds
}

export interface GridCell {
  rowIndex: number;
  colIndex: number;
  rowCriteria: GridCriteria;
  colCriteria: GridCriteria;
  answer?: Player;
  isCorrect?: boolean;
  isLocked: boolean;
}

export interface GridAttempt {
  userId: string;
  puzzleId: string;
  answers: Record<string, string>; // cellKey → playerId
  score: number;
  completionTimeSeconds: number;
  completedAt: string;
}

export interface GridGameState {
  puzzle: GridPuzzle | null;
  cells: GridCell[][];
  currentCell: { row: number; col: number } | null;
  guessesRemaining: number;
  score: number;
  isComplete: boolean;
  startTime: number;
}

// --- Stat Stack Game ---

export type StatCategory =
  | 'rushing_yards'
  | 'passing_tds'
  | 'receiving_yards'
  | 'sacks'
  | 'interceptions'
  | 'total_tds'
  | 'all_purpose_yards';

export interface RowConstraint {
  index: number;
  description: string;
  validator: string; // serialized validation rule
  lockedYear?: number; // if set, player must be from this specific season
}

export interface StatStackPuzzle {
  id: string;
  date: string;
  statCategory: StatCategory;
  statLabel: string;
  rows: RowConstraint[];
  maxPossibleScore: number;
}

export interface StatStackPick {
  rowIndex: number;
  playerId: string;
  playerName: string;
  season: number;
  statValue: number;
  isValid: boolean;
}

export interface StatStackGameState {
  puzzle: StatStackPuzzle | null;
  picks: (StatStackPick | null)[];
  currentRow: number;
  totalStatValue: number;
  penalties: Penalty[];
  isComplete: boolean;
  hasUsedTransferPortal: boolean;
}

export interface Penalty {
  type: 'targeting' | 'garbage_time';
  description: string;
  pointsLost: number;
}

// --- Fantasy Football ---

export interface FantasyLeague {
  id: string;
  name: string;
  commissionerId: string;
  scoringSettings: ScoringSettings;
  rosterSettings: RosterSettings;
  maxTeams: number;
  draftDate?: string;
  draftType: 'snake' | 'auction' | 'linear';
  seasonYear: number;
  status: 'pre_draft' | 'drafting' | 'in_season' | 'playoffs' | 'complete';
}

export interface ScoringSettings {
  passingYardsPerPoint: number;
  passingTD: number;
  interception: number;
  rushingYardsPerPoint: number;
  rushingTD: number;
  receivingYardsPerPoint: number;
  receivingTD: number;
  reception: number; // 0 for standard, 0.5 or 1 for PPR
  fumbleLost: number;
}

export interface RosterSettings {
  qb: number;
  rb: number;
  wr: number;
  te: number;
  flex: number;
  dst: number;
  k: number;
  bench: number;
}

export interface FantasyTeam {
  id: string;
  leagueId: string;
  userId: string;
  teamName: string;
  roster: RosterSlot[];
  record: { wins: number; losses: number; ties: number };
  pointsFor: number;
  pointsAgainst: number;
  waiverBudget: number;
}

export interface RosterSlot {
  position: string;
  playerId: string | null;
  playerName?: string;
  isStarter: boolean;
}

// --- Fantasy Draft ---

export type DraftStatus = 'waiting' | 'in_progress' | 'complete';

export interface DraftState {
  leagueId: string;
  draftType: 'snake' | 'auction' | 'linear';
  status: DraftStatus;
  draftOrder: string[]; // teamIds
  currentPick: number;
  currentRound: number;
  totalRounds: number;
  picks: DraftPick[];
  availablePlayers: FantasyPlayerInfo[];
  timePerPickMs: number;
  pickDeadline: number;
  isPaused: boolean;
}

export interface DraftPick {
  pickNumber: number;
  round: number;
  teamId: string;
  playerId: string;
  playerName: string;
  position: string;
  timestamp: number;
  // Auction-specific
  bidAmount?: number;
}

export interface FantasyPlayerInfo {
  id: string;
  name: string;
  position: string;
  school: string;
  conference: string;
  projectedPoints: number;
  adp: number; // average draft position
  byeWeek: number;
  seasonStats: {
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receivingYards?: number;
    receivingTDs?: number;
    receptions?: number;
    interceptions?: number;
    fumblesLost?: number;
  };
}

export interface AuctionState {
  currentPlayer: FantasyPlayerInfo | null;
  currentBid: number;
  currentBidder: string | null;
  nominatingTeam: string;
  biddingTimeMs: number;
  biddingDeadline: number;
  teamBudgets: Record<string, number>;
}

// --- Fantasy Scoring ---

export interface FantasyWeekScore {
  teamId: string;
  week: number;
  starters: FantasyPlayerScore[];
  bench: FantasyPlayerScore[];
  totalPoints: number;
}

export interface FantasyPlayerScore {
  playerId: string;
  playerName: string;
  position: string;
  points: number;
  stats: Record<string, number>;
  isStarter: boolean;
}

// --- Fantasy Waivers ---

export interface WaiverClaim {
  id: string;
  leagueId: string;
  teamId: string;
  addPlayerId: string;
  addPlayerName: string;
  dropPlayerId: string | null;
  dropPlayerName: string | null;
  faabBid: number;
  priority: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  submittedAt: number;
  processedAt?: number;
}

// --- Fantasy Trades ---

export interface TradeProposal {
  id: string;
  leagueId: string;
  proposingTeamId: string;
  receivingTeamId: string;
  sendPlayerIds: string[];
  receivePlayerIds: string[];
  sendPlayerNames: string[];
  receivePlayerNames: string[];
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'vetoed';
  proposedAt: number;
  respondedAt?: number;
  vetoVotes: number;
  vetoThreshold: number;
}

export interface TradeAnalysis {
  fairnessScore: number; // -100 to 100 (0 = fair)
  proposingSideValue: number;
  receivingSideValue: number;
  verdict: 'great' | 'good' | 'fair' | 'poor' | 'lopsided';
  reasoning: string[];
}

// --- Fantasy Matchup ---

export interface FantasyMatchup {
  id: string;
  leagueId: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'in_progress' | 'final';
}

export interface FantasySchedule {
  leagueId: string;
  seasonYear: number;
  regularSeasonWeeks: number;
  playoffWeeks: number;
  matchups: FantasyMatchup[];
}

// --- Fantasy Chat ---

export interface FantasyChatMessage {
  id: string;
  leagueId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  type: 'message' | 'trade' | 'waiver' | 'draft' | 'system';
}

// --- ML Predictions ---

export interface GamePrediction {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  predictions: {
    spread: { value: number; favored: string; confidence: number };
    total: { value: number; confidence: number };
    upset: { probability: number; isAlert: boolean };
  };
  topFactors: PredictionFactor[];
  modelVersion: string;
  generatedAt: string;
}

export interface PredictionFactor {
  name: string;
  weight: number;
  direction: 'favors_home' | 'favors_away' | 'neutral';
  description: string;
}

export interface UserPrediction {
  userId: string;
  gameId: string;
  predictionType: 'winner' | 'spread' | 'over_under' | 'upset' | 'exact_score';
  predictedValue: string | number;
  pointsEarned?: number;
  isCorrect?: boolean;
}

// --- Prediction Arena ---

export interface PredictionArenaWeek {
  weekNumber: number;
  seasonYear: number;
  games: GamePrediction[];
  userPredictions: UserPrediction[];
  isLocked: boolean;
  resultsAvailable: boolean;
}

export interface GameResult {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  actualSpread: number;
  actualTotal: number;
  wasUpset: boolean;
}

export interface PredictionScoring {
  winner: number;       // 10 pts
  spread: number;       // 25 pts (within 3 of actual)
  overUnder: number;    // 10 pts
  upsetAlert: number;   // 50 pts
  exactScore: number;   // 500 pts
}

export interface PredictionArenaState {
  currentWeek: PredictionArenaWeek | null;
  pastWeeks: PredictionArenaWeek[];
  seasonScore: number;
  modelSeasonScore: number;
  userRank: number;
  modelAccuracy: ModelAccuracy;
}

export interface ModelAccuracy {
  atsRecord: { wins: number; losses: number };
  spreadMAE: number;
  totalMAE: number;
  upsetDetectionRate: number;
  seasonAccuracy: number;
}

export interface PredictionLeague {
  id: string;
  name: string;
  members: { userId: string; username: string; score: number }[];
  seasonYear: number;
  weekScores: Record<number, Record<string, number>>; // week → userId → score
}

// --- ML Feature Engineering ---

export interface TeamFeatures {
  teamId: string;
  teamName: string;
  conference: string;
  pointsScoredAvg: number;
  pointsAllowedAvg: number;
  yardsPerPlayOffense: number;
  yardsPerPlayDefense: number;
  thirdDownConvRate: number;
  redZoneScoringPct: number;
  turnoverMargin: number;
  eloRating: number;
  strengthOfSchedule: number;
  recruitingComposite3yr: number;
  returningProductionPct: number;
  coachTenureYears: number;
  coachCareerWinPct: number;
}

export interface MatchupFeatures {
  gameId: string;
  homeTeam: TeamFeatures;
  awayTeam: TeamFeatures;
  eloDiff: number;
  recruitingDiff: number;
  restAdvantage: number;
  isConferenceGame: boolean;
  isRivalryGame: boolean;
  homeFieldAdvantage: number;
}

export interface BacktestResult {
  season: number;
  totalGames: number;
  correctPicks: number;
  accuracy: number;
  spreadMAE: number;
  totalMAE: number;
  upsetsCalled: number;
  upsetsCorrect: number;
  profitATS: number; // units won/lost if betting ATS
}

// --- User & Social ---

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  favoriteTeam?: string;
  favoriteConference?: Conference;
  eloRating: number;
  streakCurrent: number;
  streakBest: number;
  stats: UserStats;
}

export interface UserStats {
  gridGamesPlayed: number;
  gridBestScore: number;
  statStackGamesPlayed: number;
  statStackBestPercentile: number;
  predictionAccuracy: number;
  fantasyChampionships: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  favoriteTeam?: string;
}

// --- Social & Friends ---

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatarUrl?: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: string;
}

export interface FriendProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  favoriteTeam?: string;
  eloRating: number;
  isOnline: boolean;
  lastActiveAt: string;
}

// --- Notifications ---

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'game_invite'
  | 'league_invite'
  | 'achievement_unlocked'
  | 'prediction_result'
  | 'trade_proposal'
  | 'draft_starting'
  | 'live_score_update'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

// --- Achievements ---

export type AchievementCategory = 'games' | 'prediction' | 'fantasy' | 'social' | 'streak';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
  progress: number;
  isComplete: boolean;
}

// --- Chat & Messaging ---

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'league' | 'global';
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  type: 'text' | 'gif' | 'game_share' | 'prediction_share';
  createdAt: string;
}

// --- Real-Time Events ---

export type LiveEventType =
  | 'score_update'
  | 'prediction_lock'
  | 'draft_pick'
  | 'trade_accepted'
  | 'user_online'
  | 'user_offline'
  | 'chat_message';

export interface LiveEvent {
  type: LiveEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

// --- Leaderboard ---

export type LeaderboardType = 'overall' | 'grid' | 'stat_stack' | 'prediction' | 'fantasy' | 'weekly';
export type LeaderboardTimeframe = 'all_time' | 'season' | 'weekly' | 'monthly';

export interface LeaderboardConfig {
  type: LeaderboardType;
  timeframe: LeaderboardTimeframe;
  conference?: Conference;
}

// --- Conference Clash ---

export type ClashGameMode = 'blind_resume' | 'stat_line_sleuth' | 'roster_roulette' | 'film_room';

export interface BlindResumeRound {
  teamId: string;
  year: number;
  anonymizedStats: {
    wins: number;
    losses: number;
    pointsScored: number;
    pointsAllowed: number;
    totalOffenseYpg: number;
    totalDefenseYpg: number;
    strengthOfSchedule: number;
  };
  answer: { team: string; year: number };
}

export interface BlindResumeGameState {
  rounds: BlindResumeRound[];
  currentRound: number;
  guessesPerRound: number;
  guessesUsed: number;
  score: number;
  results: ('correct' | 'incorrect' | 'pending')[];
  isComplete: boolean;
  startTime: number;
}

export interface StatLineSleuthRound {
  playerId: string;
  statLine: Record<string, number>;
  hints: SleuthHint[];
  answer: { playerName: string; year: number };
}

export interface SleuthHint {
  level: 1 | 2 | 3;
  text: string;
  revealedAt: number;
}

export interface StatLineSleuthGameState {
  rounds: StatLineSleuthRound[];
  currentRound: number;
  hintsRevealed: number;
  score: number;
  results: ('correct' | 'incorrect' | 'pending')[];
  isComplete: boolean;
  startTime: number;
  roundStartTime: number;
}

export interface RosterRouletteGameState {
  school: string;
  year: number;
  validPlayers: string[];
  guessedPlayers: string[];
  score: number;
  timeRemainingMs: number;
  isComplete: boolean;
  startTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FilmRoomRevealData {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  broadcastQuote?: string | null;
  announcer?: string | null;
  homeLogo?: string | null;
  awayLogo?: string | null;
}

export interface FilmRoomRound {
  description: string;
  options: { team: string; opponent: string; year: number; label: string }[];
  correctIndex: number;
  revealData?: FilmRoomRevealData;
}

export interface FilmRoomGameState {
  rounds: FilmRoomRound[];
  currentRound: number;
  score: number;
  results: ('correct' | 'incorrect' | 'pending')[];
  isComplete: boolean;
  startTime: number;
}

// --- Dynasty Builder ---

export interface DynastyPlayer {
  id: string;
  name: string;
  position: Position;
  school: string;
  seasons: string;
  cost: number;
  compositeScore: number;
  stats: SeasonStats;
  awards: Award[];
  draftInfo?: DraftInfo;
}

export interface DynastyRoster {
  program: string;
  players: Record<string, DynastyPlayer | null>;
  totalCost: number;
  salaryCap: number;
}

export interface DynastySlot {
  key: string;
  position: Position;
  label: string;
}

export interface DynastyGameState {
  program: string | null;
  roster: DynastyRoster | null;
  availablePlayers: DynastyPlayer[];
  selectedSlot: string | null;
  searchQuery: string;
  isComplete: boolean;
  simulationResult: SimulationResult | null;
}

export interface SimulationResult {
  wins: number;
  losses: number;
  totalSimulations: number;
  winProbability: number;
  opponentProgram: string;
  topPerformers: { name: string; position: string; rating: number }[];
}

// ─── Advanced Stats (from advanced_season_stats CSVs) ──────────────
export interface CachedAdvancedStats {
  team: string;
  conference: string;
  season: number;
  offense: {
    epa: number;
    rushingEpa: number;
    passingEpa: number;
    successRate: number;
    explosiveness: number;
    rushExplosiveness: number;
    passExplosiveness: number;
    standardDownSuccess: number;
    passingDownSuccess: number;
    lineYards: number;
    secondLevelYards: number;
    openFieldYards: number;
    pointsPerOpportunity: number;
    avgStartPosition: number;
    havoc: { total: number; frontSeven: number; db: number };
  };
  defense: {
    epa: number;
    rushingEpa: number;
    passingEpa: number;
    successRate: number;
    explosiveness: number;
    rushExplosiveness: number;
    passExplosiveness: number;
    standardDownSuccess: number;
    passingDownSuccess: number;
    lineYards: number;
    secondLevelYards: number;
    openFieldYards: number;
    pointsPerOpportunity: number;
    avgStartPosition: number;
    havoc: { total: number; frontSeven: number; db: number };
  };
}

// ─── Drive Efficiency (aggregated from drives CSVs) ────────────────
export interface CachedDriveEfficiency {
  team: string;
  conference: string;
  season: number;
  totalDrives: number;
  scoringDrives: number;
  scoringPct: number;
  avgYardsPerDrive: number;
  avgPlaysPerDrive: number;
  avgStartPosition: number;
  turnoversPerDrive: number;
  threeAndOutPct: number;
}
