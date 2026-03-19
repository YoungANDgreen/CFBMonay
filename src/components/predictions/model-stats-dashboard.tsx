import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import type { ModelAccuracy, BacktestResult } from '@/types';

interface ModelStatsDashboardProps {
  accuracy: ModelAccuracy;
  backtestResults: BacktestResult[];
}

export function ModelStatsDashboard({ accuracy, backtestResults }: ModelStatsDashboardProps) {
  const sortedResults = useMemo(
    () => [...backtestResults].sort((a, b) => b.season - a.season),
    [backtestResults],
  );

  const aggregateUpsets = useMemo(() => {
    const totalCalled = backtestResults.reduce((sum, r) => sum + r.upsetsCalled, 0);
    const totalCorrect = backtestResults.reduce((sum, r) => sum + r.upsetsCorrect, 0);
    const detectionRate = totalCalled > 0 ? totalCorrect / totalCalled : 0;
    return { totalCalled, totalCorrect, detectionRate };
  }, [backtestResults]);

  const winRate = accuracy.atsRecord.wins + accuracy.atsRecord.losses > 0
    ? (accuracy.atsRecord.wins / (accuracy.atsRecord.wins + accuracy.atsRecord.losses)) * 100
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Current Season Performance */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>CURRENT SEASON PERFORMANCE</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {accuracy.atsRecord.wins}-{accuracy.atsRecord.losses}
            </Text>
            <Text style={styles.statLabel}>ATS Record</Text>
            <Text style={styles.statSublabel}>{winRate.toFixed(1)}% win rate</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {(accuracy.seasonAccuracy * 100).toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Season Accuracy</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {accuracy.spreadMAE.toFixed(1)} pts
            </Text>
            <Text style={styles.statLabel}>Spread MAE</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(accuracy.upsetDetectionRate * 100)}%
            </Text>
            <Text style={styles.statLabel}>Upset Detection</Text>
          </View>
        </View>
      </Card>

      {/* Historical Accuracy Trend */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>HISTORICAL ACCURACY TREND</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colSeason]}>Season</Text>
          <Text style={[styles.tableHeaderText, styles.colAccuracy]}>Accuracy</Text>
          <Text style={[styles.tableHeaderText, styles.colRecord]}>Record</Text>
          <Text style={[styles.tableHeaderText, styles.colProfit]}>Profit ATS</Text>
        </View>

        {sortedResults.map((result) => (
          <View key={result.season} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colSeason, styles.seasonText]}>
              {result.season}
            </Text>
            <Text style={[styles.tableCell, styles.colAccuracy, styles.accuracyText]}>
              {(result.accuracy * 100).toFixed(1)}%
            </Text>
            <Text style={[styles.tableCell, styles.colRecord, styles.recordText]}>
              {result.correctPicks}/{result.totalGames}
            </Text>
            <Text style={[
              styles.tableCell,
              styles.colProfit,
              { color: result.profitATS >= 0 ? colors.correct : colors.incorrect },
            ]}>
              {result.profitATS >= 0 ? '+' : ''}{result.profitATS.toFixed(1)}u
            </Text>
          </View>
        ))}
      </Card>

      {/* Upset Detection Stats */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>UPSET DETECTION STATS</Text>

        <View style={styles.upsetStatsRow}>
          <View style={styles.upsetStatItem}>
            <Text style={styles.statValue}>{aggregateUpsets.totalCalled}</Text>
            <Text style={styles.statLabel}>Upsets Called</Text>
          </View>

          <View style={styles.upsetDivider} />

          <View style={styles.upsetStatItem}>
            <Text style={styles.statValue}>{aggregateUpsets.totalCorrect}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>

          <View style={styles.upsetDivider} />

          <View style={styles.upsetStatItem}>
            <Text style={styles.statValue}>
              {(aggregateUpsets.detectionRate * 100).toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Detection Rate</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '40%' as unknown as number,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    color: colors.predictionOrange,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    marginBottom: spacing.xs,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  statSublabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  tableHeaderText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  tableCell: {
    fontSize: typography.fontSize.sm,
  },
  colSeason: { flex: 1 },
  colAccuracy: { flex: 1, textAlign: 'center' },
  colRecord: { flex: 1, textAlign: 'center' },
  colProfit: { flex: 1, textAlign: 'right' },
  seasonText: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  accuracyText: {
    color: colors.predictionOrange,
    fontWeight: typography.fontWeight.bold,
  },
  recordText: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  upsetStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  upsetStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  upsetDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
});
