import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GamePredictionCard } from '@/components/predictions/game-prediction-card';
import { usePredictionStore } from '@/stores/prediction-store';
import { MOCK_WEEKLY_GAMES } from '@/services/ml/prediction-arena-engine';
import { getBacktestResults, getCurrentSeasonAccuracy } from '@/services/ml/backtest-engine';

type PredictionTab = 'this_week' | 'my_picks' | 'results' | 'model_stats' | 'leagues';

const TABS: { key: PredictionTab; label: string }[] = [
  { key: 'this_week', label: 'This Week' },
  { key: 'my_picks', label: 'My Picks' },
  { key: 'results', label: 'Results' },
  { key: 'model_stats', label: 'Model Stats' },
  { key: 'leagues', label: 'Leagues' },
];

export default function PredictScreen() {
  const {
    arenaState,
    activeTab,
    setActiveTab,
    selectGame,
    loadWeek,
    backtestResults,
    setBacktestResults,
    leagues,
    createLeague,
  } = usePredictionStore();

  // Load initial data
  useEffect(() => {
    if (!arenaState.currentWeek) {
      loadWeek(1);
    }
    if (backtestResults.length === 0) {
      setBacktestResults(getBacktestResults());
    }
  }, []);

  const currentWeekGames = arenaState.currentWeek
    ? MOCK_WEEKLY_GAMES[arenaState.currentWeek.weekNumber] ?? []
    : [];

  const userPredictions = arenaState.currentWeek?.userPredictions ?? [];
  const modelAccuracy = arenaState.modelAccuracy;
  const seasonAccuracy = getCurrentSeasonAccuracy();

  const handlePredict = useCallback((gameId: string) => {
    selectGame(gameId);
  }, [selectGame]);

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Prediction Arena</Text>
        <Text style={styles.heroSubtitle}>Beat the model. Prove your football IQ.</Text>
      </View>

      {/* Season Score Bar */}
      <View style={styles.scoreBar}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreValue}>{arenaState.seasonScore}</Text>
          <Text style={styles.scoreLabel}>Your Score</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreValue}>{arenaState.modelSeasonScore}</Text>
          <Text style={styles.scoreLabel}>Model Score</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreValue, { color: colors.correct }]}>#{arenaState.userRank}</Text>
          <Text style={styles.scoreLabel}>Your Rank</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.tabContentInner}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'this_week' && (
          <ThisWeekTab
            games={currentWeekGames}
            userPredictions={userPredictions}
            weekNumber={arenaState.currentWeek?.weekNumber ?? 1}
            onPredict={handlePredict}
            onWeekChange={loadWeek}
          />
        )}

        {activeTab === 'my_picks' && (
          <MyPicksTab
            userPredictions={userPredictions}
            games={currentWeekGames}
          />
        )}

        {activeTab === 'results' && (
          <ResultsTab
            pastWeeks={arenaState.pastWeeks}
            seasonScore={arenaState.seasonScore}
            modelScore={arenaState.modelSeasonScore}
          />
        )}

        {activeTab === 'model_stats' && (
          <ModelStatsTab
            accuracy={modelAccuracy}
            backtestResults={backtestResults}
            seasonAccuracy={seasonAccuracy}
          />
        )}

        {activeTab === 'leagues' && (
          <LeaguesTab
            leagues={leagues}
            onCreateLeague={createLeague}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ── This Week Tab ──────────────────────────────────────────────────────────────

function ThisWeekTab({
  games,
  userPredictions,
  weekNumber,
  onPredict,
  onWeekChange,
}: {
  games: import('@/types').GamePrediction[];
  userPredictions: import('@/types').UserPrediction[];
  weekNumber: number;
  onPredict: (gameId: string) => void;
  onWeekChange: (week: number) => void;
}) {
  return (
    <>
      {/* Week Selector */}
      <View style={styles.weekSelector}>
        <TouchableOpacity
          onPress={() => weekNumber > 1 && onWeekChange(weekNumber - 1)}
          activeOpacity={0.7}
          disabled={weekNumber <= 1}
        >
          <Text style={[styles.weekArrow, weekNumber <= 1 && styles.weekArrowDisabled]}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.weekTitle}>Week {weekNumber}</Text>
        <TouchableOpacity
          onPress={() => weekNumber < 14 && onWeekChange(weekNumber + 1)}
          activeOpacity={0.7}
          disabled={weekNumber >= 14}
        >
          <Text style={[styles.weekArrow, weekNumber >= 14 && styles.weekArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {games.length > 0 ? (
        games.map(game => (
          <GamePredictionCard
            key={game.gameId}
            game={game}
            userPrediction={userPredictions.find(p => p.gameId === game.gameId)}
            onPredict={onPredict}
            showFactors
          />
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No games available for Week {weekNumber}</Text>
          <Text style={styles.emptySubtext}>Games are loaded for weeks 1-5</Text>
        </Card>
      )}
    </>
  );
}

// ── My Picks Tab ───────────────────────────────────────────────────────────────

function MyPicksTab({
  userPredictions,
  games,
}: {
  userPredictions: import('@/types').UserPrediction[];
  games: import('@/types').GamePrediction[];
}) {
  if (userPredictions.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>🎯</Text>
        <Text style={styles.emptyTitle}>No Picks Yet</Text>
        <Text style={styles.emptySubtext}>
          Head to "This Week" and make your predictions
        </Text>
      </Card>
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>
        {userPredictions.length} Prediction{userPredictions.length !== 1 ? 's' : ''} This Week
      </Text>
      {userPredictions.map((pick, i) => {
        const game = games.find(g => g.gameId === pick.gameId);
        return (
          <Card key={`${pick.gameId}-${pick.predictionType}-${i}`} style={styles.pickCard}>
            <View style={styles.pickHeader}>
              <Text style={styles.pickGame}>
                {game ? `${game.awayTeam} @ ${game.homeTeam}` : pick.gameId}
              </Text>
              <Badge
                label={pick.predictionType.replace('_', ' ').toUpperCase()}
                color={colors.predictionOrange}
                textColor="#fff"
              />
            </View>
            <Text style={styles.pickValue}>
              Your Pick: {String(pick.predictedValue)}
            </Text>
            {pick.pointsEarned !== undefined && (
              <Text style={[
                styles.pickPoints,
                { color: pick.pointsEarned > 0 ? colors.correct : colors.textMuted },
              ]}>
                {pick.pointsEarned > 0 ? '+' : ''}{pick.pointsEarned} pts
              </Text>
            )}
          </Card>
        );
      })}
    </>
  );
}

// ── Results Tab ────────────────────────────────────────────────────────────────

function ResultsTab({
  pastWeeks,
  seasonScore,
  modelScore,
}: {
  pastWeeks: import('@/types').PredictionArenaWeek[];
  seasonScore: number;
  modelScore: number;
}) {
  const resultsWeeks = pastWeeks.filter(w => w.resultsAvailable);

  return (
    <>
      {/* Score Comparison */}
      <Card style={styles.resultsScoreCard}>
        <Text style={styles.sectionTitle}>Season Totals</Text>
        <View style={styles.resultsScoreRow}>
          <View style={styles.resultsScoreItem}>
            <Text style={[
              styles.resultsScoreValue,
              seasonScore >= modelScore && { color: colors.correct },
            ]}>
              {seasonScore}
            </Text>
            <Text style={styles.resultsScoreLabel}>You</Text>
          </View>
          <Text style={styles.resultsVs}>vs</Text>
          <View style={styles.resultsScoreItem}>
            <Text style={[
              styles.resultsScoreValue,
              modelScore > seasonScore && { color: colors.predictionOrange },
            ]}>
              {modelScore}
            </Text>
            <Text style={styles.resultsScoreLabel}>Model</Text>
          </View>
        </View>
      </Card>

      {resultsWeeks.length > 0 ? (
        resultsWeeks.map(week => (
          <Card key={week.weekNumber} style={styles.weekResultCard}>
            <Text style={styles.weekResultTitle}>Week {week.weekNumber}</Text>
            <Text style={styles.weekResultMeta}>
              {week.userPredictions.filter(p => p.isCorrect).length}/
              {week.userPredictions.length} correct
            </Text>
            {week.userPredictions.map((pick, i) => (
              <View key={i} style={styles.resultRow}>
                <View style={[
                  styles.resultDot,
                  { backgroundColor: pick.isCorrect ? colors.correct : colors.clashRed },
                ]} />
                <Text style={styles.resultGame}>{pick.gameId.replace(/-/g, ' ')}</Text>
                <Text style={styles.resultPoints}>
                  {pick.pointsEarned !== undefined ? `${pick.pointsEarned > 0 ? '+' : ''}${pick.pointsEarned}` : '—'}
                </Text>
              </View>
            ))}
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Results Yet</Text>
          <Text style={styles.emptySubtext}>
            Results will appear after games are completed and scored
          </Text>
        </Card>
      )}
    </>
  );
}

// ── Model Stats Tab ────────────────────────────────────────────────────────────

function ModelStatsTab({
  accuracy,
  backtestResults,
  seasonAccuracy,
}: {
  accuracy: import('@/types').ModelAccuracy;
  backtestResults: import('@/types').BacktestResult[];
  seasonAccuracy: import('@/types').ModelAccuracy;
}) {
  return (
    <>
      {/* Current Performance */}
      <Card style={styles.modelCard}>
        <Text style={styles.sectionTitle}>Current Season</Text>
        <View style={styles.modelGrid}>
          <View style={styles.modelGridItem}>
            <Text style={styles.modelBigValue}>
              {accuracy.atsRecord.wins}-{accuracy.atsRecord.losses}
            </Text>
            <Text style={styles.modelGridLabel}>ATS Record</Text>
          </View>
          <View style={styles.modelGridItem}>
            <Text style={styles.modelBigValue}>
              {Math.round(accuracy.seasonAccuracy * 100)}%
            </Text>
            <Text style={styles.modelGridLabel}>Accuracy</Text>
          </View>
          <View style={styles.modelGridItem}>
            <Text style={styles.modelBigValue}>{accuracy.spreadMAE.toFixed(1)}</Text>
            <Text style={styles.modelGridLabel}>Spread MAE</Text>
          </View>
          <View style={styles.modelGridItem}>
            <Text style={styles.modelBigValue}>
              {Math.round(accuracy.upsetDetectionRate * 100)}%
            </Text>
            <Text style={styles.modelGridLabel}>Upset Detection</Text>
          </View>
        </View>
      </Card>

      {/* Backtest History */}
      <Text style={styles.sectionTitle}>Historical Accuracy (2015-2024)</Text>
      {[...backtestResults].reverse().map(bt => (
        <View key={bt.season} style={styles.backtestRow}>
          <Text style={styles.backtestYear}>{bt.season}</Text>
          <View style={styles.backtestBar}>
            <View style={[styles.backtestFill, { width: `${bt.accuracy * 100}%` }]} />
          </View>
          <Text style={styles.backtestPct}>{Math.round(bt.accuracy * 100)}%</Text>
          <Text style={[
            styles.backtestProfit,
            { color: bt.profitATS >= 0 ? colors.correct : colors.clashRed },
          ]}>
            {bt.profitATS >= 0 ? '+' : ''}{bt.profitATS.toFixed(1)}u
          </Text>
        </View>
      ))}

      {/* Upset Stats */}
      <Card style={{ ...styles.modelCard, marginTop: spacing.md }}>
        <Text style={styles.sectionTitle}>Upset Detection</Text>
        {(() => {
          const totalCalled = backtestResults.reduce((s, b) => s + b.upsetsCalled, 0);
          const totalCorrect = backtestResults.reduce((s, b) => s + b.upsetsCorrect, 0);
          const rate = totalCalled > 0 ? totalCorrect / totalCalled : 0;
          return (
            <View style={styles.modelGrid}>
              <View style={styles.modelGridItem}>
                <Text style={styles.modelBigValue}>{totalCalled}</Text>
                <Text style={styles.modelGridLabel}>Upsets Called</Text>
              </View>
              <View style={styles.modelGridItem}>
                <Text style={styles.modelBigValue}>{totalCorrect}</Text>
                <Text style={styles.modelGridLabel}>Correct</Text>
              </View>
              <View style={styles.modelGridItem}>
                <Text style={styles.modelBigValue}>{Math.round(rate * 100)}%</Text>
                <Text style={styles.modelGridLabel}>Hit Rate</Text>
              </View>
            </View>
          );
        })()}
      </Card>
    </>
  );
}

// ── Leagues Tab ────────────────────────────────────────────────────────────────

function LeaguesTab({
  leagues,
  onCreateLeague,
}: {
  leagues: import('@/types').PredictionLeague[];
  onCreateLeague: (name: string) => void;
}) {
  return (
    <>
      <Button
        title="Create Prediction League"
        onPress={() => onCreateLeague(`League ${leagues.length + 1}`)}
        variant="outline"
        style={{ marginBottom: spacing.md }}
      />

      {leagues.length > 0 ? (
        leagues.map(league => (
          <Card key={league.id} style={styles.leagueCard}>
            <Text style={styles.leagueName}>{league.name}</Text>
            <Text style={styles.leagueMeta}>
              {league.members.length} member{league.members.length !== 1 ? 's' : ''} · {league.seasonYear} Season
            </Text>
            {league.members.slice(0, 5).map((m, i) => (
              <View key={i} style={styles.leagueMemberRow}>
                <Text style={styles.leagueMemberRank}>#{i + 1}</Text>
                <Text style={styles.leagueMemberName}>{m.username}</Text>
                <Text style={styles.leagueMemberScore}>{m.score} pts</Text>
              </View>
            ))}
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyTitle}>No Leagues Yet</Text>
          <Text style={styles.emptySubtext}>
            Create a prediction league and compete with friends
          </Text>
        </Card>
      )}
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.sm },
  heroTitle: {
    color: colors.predictionOrange,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
  },

  // Score bar
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreItem: { flex: 1, alignItems: 'center' },
  scoreValue: {
    color: colors.predictionOrange,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  scoreDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },

  // Tabs
  tabBar: { marginBottom: spacing.sm },
  tabBarContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.predictionOrange + '20',
    borderColor: colors.predictionOrange,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.predictionOrange,
    fontWeight: typography.fontWeight.bold,
  },

  // Tab content
  tabContent: { flex: 1 },
  tabContentInner: { padding: spacing.md, paddingBottom: spacing.xxl },

  // Section
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },

  // Week selector
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  weekArrow: {
    color: colors.predictionOrange,
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    paddingHorizontal: spacing.md,
  },
  weekArrowDisabled: { color: colors.textMuted + '40' },
  weekTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },

  // Empty states
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // My Picks
  pickCard: { marginBottom: spacing.sm },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pickGame: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  pickValue: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  pickPoints: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs,
  },

  // Results
  resultsScoreCard: { marginBottom: spacing.md },
  resultsScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  resultsScoreItem: { alignItems: 'center' },
  resultsScoreValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
  },
  resultsScoreLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  resultsVs: {
    color: colors.textMuted,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  weekResultCard: { marginBottom: spacing.sm },
  weekResultTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  weekResultMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 3,
  },
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultGame: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  resultPoints: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },

  // Model Stats
  modelCard: { marginBottom: spacing.md },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  modelGridItem: {
    alignItems: 'center',
    minWidth: '40%',
    marginBottom: spacing.sm,
  },
  modelBigValue: {
    color: colors.predictionOrange,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  modelGridLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },

  // Backtest
  backtestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  backtestYear: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    width: 36,
  },
  backtestBar: {
    flex: 1,
    height: 12,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  backtestFill: {
    height: '100%',
    backgroundColor: colors.predictionOrange + '60',
    borderRadius: borderRadius.full,
  },
  backtestPct: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    width: 32,
    textAlign: 'right',
  },
  backtestProfit: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    width: 42,
    textAlign: 'right',
  },

  // Leagues
  leagueCard: { marginBottom: spacing.sm },
  leagueName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  leagueMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  leagueMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: colors.border + '30',
  },
  leagueMemberRank: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    width: 24,
  },
  leagueMemberName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  leagueMemberScore: {
    color: colors.predictionOrange,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
