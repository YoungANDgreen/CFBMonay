import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { getRarityColor } from '@/lib/theme';

interface ScoreDisplayProps {
  label: string;
  score: number;
  percentile?: number;
  streak?: number;
  guessesRemaining?: number;
  maxGuesses?: number;
  compact?: boolean;
  accentColor?: string;
}

export function ScoreDisplay({
  label,
  score,
  percentile,
  streak,
  guessesRemaining,
  maxGuesses,
  compact = false,
  accentColor,
}: ScoreDisplayProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.scoreValue, accentColor && { color: accentColor }]}>
            {score.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>SCORE</Text>
        </View>

        {percentile !== undefined && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.percentileValue, { color: getRarityColor(percentile) }]}>
                {percentile}%
              </Text>
              <Text style={styles.statLabel}>PERCENTILE</Text>
            </View>
          </>
        )}

        {streak !== undefined && streak > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.streakValue}>{streak}</Text>
              <Text style={styles.statLabel}>STREAK</Text>
            </View>
          </>
        )}

        {guessesRemaining !== undefined && maxGuesses !== undefined && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.guessesValue}>
                {guessesRemaining}/{maxGuesses}
              </Text>
              <Text style={styles.statLabel}>GUESSES</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing.md,
    ...shadows.sm,
  },
  compact: {
    padding: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border + '60',
  },
  scoreValue: {
    color: colors.accent,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  percentileValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
  },
  streakValue: {
    color: colors.predictionOrange,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
  },
  guessesValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 1.5,
    marginTop: 3,
  },
});
