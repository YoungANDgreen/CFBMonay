import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  PredictionArenaWeek,
  GamePrediction,
  GameResult,
  UserPrediction,
} from '@/types';

interface WeekResultsProps {
  weeks: PredictionArenaWeek[];
  seasonScore: number;
  modelSeasonScore: number;
}

export function WeekResults({ weeks, seasonScore, modelSeasonScore }: WeekResultsProps) {
  const completedWeeks = weeks.filter((w) => w.resultsAvailable);
  const userIsLeading = seasonScore >= modelSeasonScore;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Season Score Summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>SEASON STANDINGS</Text>
        <View style={styles.scoreRow}>
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>YOUR SCORE</Text>
            <Text
              style={[
                styles.scoreValue,
                { color: userIsLeading ? colors.correct : colors.textPrimary },
              ]}
            >
              {seasonScore}
            </Text>
            {userIsLeading && (
              <Badge label="LEADING" color={colors.correct} textColor="#fff" size="sm" />
            )}
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreColumn}>
            <Text style={styles.scoreLabel}>MODEL SCORE</Text>
            <Text
              style={[
                styles.scoreValue,
                { color: !userIsLeading ? colors.correct : colors.textPrimary },
              ]}
            >
              {modelSeasonScore}
            </Text>
            {!userIsLeading && seasonScore !== modelSeasonScore && (
              <Badge label="LEADING" color={colors.correct} textColor="#fff" size="sm" />
            )}
          </View>
        </View>
        <View style={styles.differentialRow}>
          <Text style={styles.differentialText}>
            {seasonScore === modelSeasonScore
              ? 'Tied with the model!'
              : userIsLeading
                ? `You lead by ${seasonScore - modelSeasonScore} pts`
                : `Model leads by ${modelSeasonScore - seasonScore} pts`}
          </Text>
        </View>
      </Card>

      {/* Week-by-Week Results */}
      <Text style={styles.sectionTitle}>WEEK-BY-WEEK RESULTS</Text>

      {completedWeeks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Results Yet</Text>
          <Text style={styles.emptyText}>
            Results will appear here once completed weeks are scored. Make your
            predictions and check back after games are played!
          </Text>
        </Card>
      ) : (
        completedWeeks.map((week) => (
          <WeekCard key={`${week.seasonYear}-${week.weekNumber}`} week={week} />
        ))
      )}
    </ScrollView>
  );
}

// --- Week Card sub-component ---

function WeekCard({ week }: { week: PredictionArenaWeek }) {
  const predictions = week.userPredictions;
  const correctCount = predictions.filter((p) => (p.pointsEarned ?? 0) > 0).length;
  const totalCount = predictions.length;
  const weekPoints = predictions.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0);

  // Build a lookup of game data by gameId
  const gameMap = new Map<string, GamePrediction>();
  for (const game of week.games) {
    gameMap.set(game.gameId, game);
  }

  return (
    <Card style={styles.weekCard}>
      {/* Week header */}
      <View style={styles.weekHeader}>
        <View>
          <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
          <Text style={styles.weekSeason}>{week.seasonYear} Season</Text>
        </View>
        <View style={styles.weekSummary}>
          <View style={styles.weekStat}>
            <Text style={styles.weekStatValue}>
              {correctCount}/{totalCount}
            </Text>
            <Text style={styles.weekStatLabel}>CORRECT</Text>
          </View>
          <View style={styles.weekStat}>
            <Text style={[styles.weekStatValue, { color: colors.predictionOrange }]}>
              {weekPoints}
            </Text>
            <Text style={styles.weekStatLabel}>PTS</Text>
          </View>
        </View>
      </View>

      {/* Accuracy bar */}
      <View style={styles.accuracyBarBackground}>
        <View
          style={[
            styles.accuracyBarFill,
            {
              width: totalCount > 0 ? `${(correctCount / totalCount) * 100}%` : '0%',
            },
          ]}
        />
      </View>

      {/* Individual game results */}
      <View style={styles.gameResultsList}>
        {predictions.map((prediction) => {
          const game = gameMap.get(prediction.gameId);
          if (!game) return null;

          const isCorrect = (prediction.pointsEarned ?? 0) > 0;

          return (
            <View key={prediction.gameId} style={styles.gameResultRow}>
              <View
                style={[
                  styles.resultIndicator,
                  {
                    backgroundColor: isCorrect
                      ? colors.correct + '20'
                      : colors.clashRed + '20',
                    borderColor: isCorrect ? colors.correct : colors.clashRed,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.resultIndicatorText,
                    { color: isCorrect ? colors.correct : colors.clashRed },
                  ]}
                >
                  {isCorrect ? '✓' : '✗'}
                </Text>
              </View>

              <View style={styles.gameResultInfo}>
                <Text style={styles.gameResultMatchup}>
                  {game.awayTeam} @ {game.homeTeam}
                </Text>
                <Text style={styles.gameResultPick}>
                  Your pick: {formatPrediction(prediction)}
                </Text>
              </View>

              <View style={styles.gameResultPoints}>
                <Text
                  style={[
                    styles.gameResultPointsText,
                    { color: isCorrect ? colors.correct : colors.clashRed },
                  ]}
                >
                  {isCorrect ? `+${prediction.pointsEarned}` : '0'}
                </Text>
                <Text style={styles.gameResultPointsLabel}>pts</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

// --- Helpers ---

function formatPrediction(prediction: UserPrediction): string {
  switch (prediction.predictionType) {
    case 'winner':
      return `${prediction.predictedValue} wins`;
    case 'spread':
      return `Spread ${Number(prediction.predictedValue) > 0 ? '+' : ''}${prediction.predictedValue}`;
    case 'over_under':
      return `${String(prediction.predictedValue).toUpperCase()}`;
    case 'upset':
      return `Upset: ${prediction.predictedValue}`;
    case 'exact_score':
      return `Score: ${prediction.predictedValue}`;
    default:
      return String(prediction.predictedValue);
  }
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Section title
  sectionTitle: {
    color: colors.predictionOrange,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },

  // Season score summary
  summaryCard: {
    marginBottom: spacing.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  scoreColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  scoreValue: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.heavy,
    color: colors.textPrimary,
  },
  scoreDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
  },
  differentialRow: {
    marginTop: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  differentialText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },

  // Week cards
  weekCard: {
    marginBottom: spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weekTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  weekSeason: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  weekSummary: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  weekStat: {
    alignItems: 'center',
  },
  weekStatValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  weekStatLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
    marginTop: 2,
  },

  // Accuracy bar
  accuracyBarBackground: {
    height: 4,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  accuracyBarFill: {
    height: '100%',
    backgroundColor: colors.predictionOrange,
    borderRadius: borderRadius.full,
  },

  // Game results
  gameResultsList: {
    gap: spacing.sm,
  },
  gameResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  resultIndicator: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIndicatorText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  gameResultInfo: {
    flex: 1,
  },
  gameResultMatchup: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  gameResultPick: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  gameResultPoints: {
    alignItems: 'center',
  },
  gameResultPointsText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  gameResultPointsLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});
