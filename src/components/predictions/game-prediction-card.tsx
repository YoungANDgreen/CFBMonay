import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GamePrediction, UserPrediction } from '@/types';

interface GamePredictionCardProps {
  game: GamePrediction;
  userPrediction?: UserPrediction;
  onPredict: (gameId: string) => void;
  showFactors?: boolean;
}

export function GamePredictionCard({ game, userPrediction, onPredict, showFactors = false }: GamePredictionCardProps) {
  const { spread, total, upset } = game.predictions;

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.gameId}>
          {game.gameId.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}
        </Text>
        {upset.isAlert && (
          <View style={styles.upsetBadge}>
            <Text style={styles.upsetBadgeText}>UPSET ALERT</Text>
          </View>
        )}
      </View>

      {/* Matchup */}
      <View style={styles.matchup}>
        <View style={styles.teamCol}>
          <Text style={styles.teamName}>{game.awayTeam}</Text>
          <Text style={styles.teamLabel}>AWAY</Text>
        </View>
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>@</Text>
        </View>
        <View style={[styles.teamCol, styles.teamColRight]}>
          <Text style={styles.teamName}>{game.homeTeam}</Text>
          <Text style={styles.teamLabel}>HOME</Text>
        </View>
      </View>

      {/* Model Predictions */}
      <View style={styles.predictionRow}>
        <View style={styles.predictionItem}>
          <Text style={styles.predictionLabel}>Spread</Text>
          <Text style={styles.predictionValue}>
            {spread.favored} {spread.value > 0 ? `-${spread.value.toFixed(1)}` : `+${Math.abs(spread.value).toFixed(1)}`}
          </Text>
        </View>
        <View style={styles.predictionItem}>
          <Text style={styles.predictionLabel}>O/U</Text>
          <Text style={styles.predictionValue}>{total.value.toFixed(1)}</Text>
        </View>
        <View style={styles.predictionItem}>
          <Text style={styles.predictionLabel}>Confidence</Text>
          <Text style={styles.predictionValue}>
            {Math.round(spread.confidence * 100)}%
          </Text>
        </View>
        <View style={styles.predictionItem}>
          <Text style={styles.predictionLabel}>Upset</Text>
          <Text style={[styles.predictionValue, upset.isAlert && styles.upsetValue]}>
            {Math.round(upset.probability * 100)}%
          </Text>
        </View>
      </View>

      {/* Top Factors */}
      {showFactors && game.topFactors.length > 0 && (
        <View style={styles.factorsContainer}>
          <Text style={styles.factorsTitle}>Key Factors</Text>
          {game.topFactors.slice(0, 3).map((factor, i) => (
            <View key={i} style={styles.factorRow}>
              <Text style={[
                styles.factorIndicator,
                { color: factor.direction === 'favors_home' ? colors.correct :
                         factor.direction === 'favors_away' ? colors.clashRed :
                         colors.textMuted },
              ]}>
                {factor.direction === 'favors_home' ? '▲' :
                 factor.direction === 'favors_away' ? '▼' : '●'}
              </Text>
              <Text style={styles.factorText}>{factor.description}</Text>
              <Text style={styles.factorWeight}>{Math.round(factor.weight * 100)}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* User Prediction Status */}
      {userPrediction ? (
        <View style={styles.userPrediction}>
          <Badge label="Your Pick" color={colors.correct} textColor="#fff" />
          <Text style={styles.userPick}>
            {userPrediction.predictionType}: {String(userPrediction.predictedValue)}
          </Text>
          {userPrediction.pointsEarned !== undefined && (
            <Text style={[
              styles.userPoints,
              { color: userPrediction.pointsEarned > 0 ? colors.correct : colors.textMuted },
            ]}>
              +{userPrediction.pointsEarned} pts
            </Text>
          )}
        </View>
      ) : (
        <Button
          title="Make Your Prediction"
          onPress={() => onPredict(game.gameId)}
          variant="outline"
          size="sm"
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gameId: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  upsetBadge: {
    backgroundColor: colors.clashRed + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.clashRed + '40',
  },
  upsetBadgeText: {
    color: colors.clashRed,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  teamCol: { flex: 1 },
  teamColRight: { alignItems: 'flex-end' },
  teamName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  teamLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  vsContainer: { width: 40, alignItems: 'center' },
  vsText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  predictionItem: { alignItems: 'center' },
  predictionLabel: { color: colors.textMuted, fontSize: typography.fontSize.xs },
  predictionValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  upsetValue: { color: colors.clashRed },
  factorsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border + '50',
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  factorsTitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  factorIndicator: { fontSize: 10, width: 14 },
  factorText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  factorWeight: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  userPrediction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.correct + '10',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  userPick: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  userPoints: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
