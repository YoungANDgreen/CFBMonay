import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClashStore } from '@/stores/clash-store';

export function StatLineSleuthGame() {
  const { sleuth, startSleuth, guessSleuth, revealSleuthHint } = useClashStore();
  const [guess, setGuess] = useState('');

  // Auto-reveal hints based on timer
  useEffect(() => {
    if (!sleuth || sleuth.isComplete) return;
    const round = sleuth.rounds[sleuth.currentRound];
    const nextHintLevel = sleuth.hintsRevealed + 1;
    const nextHint = round.hints.find(h => h.level === nextHintLevel);
    if (!nextHint) return;

    const elapsed = (Date.now() - sleuth.roundStartTime) / 1000;
    const delay = Math.max(0, nextHint.revealedAt - elapsed) * 1000;

    const timer = setTimeout(() => {
      revealSleuthHint();
    }, delay);

    return () => clearTimeout(timer);
  }, [sleuth?.currentRound, sleuth?.hintsRevealed, sleuth?.roundStartTime]);

  if (!sleuth) {
    return (
      <View style={styles.startContainer}>
        <Text style={styles.startTitle}>Stat Line Sleuth</Text>
        <Text style={styles.startDesc}>
          Identify the player from their game stat line. Fewer hints = more points!
        </Text>
        <Button title="Start Game" onPress={startSleuth} variant="primary" />
      </View>
    );
  }

  if (sleuth.isComplete) {
    const correct = sleuth.results.filter(r => r === 'correct').length;
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeTitle}>Game Over!</Text>
        <Text style={styles.completeScore}>{sleuth.score} pts</Text>
        <Text style={styles.completeDetail}>
          {correct}/{sleuth.rounds.length} correct
        </Text>
        <View style={styles.resultsRow}>
          {sleuth.results.map((r, i) => (
            <View
              key={i}
              style={[
                styles.resultDot,
                { backgroundColor: r === 'correct' ? colors.correct : colors.incorrect },
              ]}
            />
          ))}
        </View>
        <Button title="Play Again" onPress={startSleuth} variant="primary" />
      </View>
    );
  }

  const round = sleuth.rounds[sleuth.currentRound];
  const visibleHints = round.hints.filter(h => h.level <= sleuth.hintsRevealed);

  const handleSubmit = () => {
    if (!guess.trim()) return;
    guessSleuth(guess.trim());
    setGuess('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <Text style={styles.roundLabel}>
          Round {sleuth.currentRound + 1}/{sleuth.rounds.length}
        </Text>
        <Text style={styles.scoreLabel}>{sleuth.score} pts</Text>
      </View>

      {/* Stat Line */}
      <Card style={styles.statLineCard}>
        <Text style={styles.statLineTitle}>Game Stat Line</Text>
        {Object.entries(round.statLine).map(([key, value]) => (
          <View key={key} style={styles.statRow}>
            <Text style={styles.statKey}>{formatStatKey(key)}</Text>
            <Text style={styles.statValue}>{value}</Text>
          </View>
        ))}
      </Card>

      {/* Hints */}
      <View style={styles.hintsContainer}>
        <Text style={styles.hintsTitle}>
          Hints ({sleuth.hintsRevealed}/{round.hints.length})
        </Text>
        {visibleHints.map((hint, i) => (
          <View key={i} style={styles.hintRow}>
            <Badge
              label={`Hint ${hint.level}`}
              color={hint.level === 1 ? colors.gridGreen : hint.level === 2 ? colors.predictionOrange : colors.clashRed}
              textColor="#fff"
            />
            <Text style={styles.hintText}>{hint.text}</Text>
          </View>
        ))}
        {sleuth.hintsRevealed < round.hints.length && (
          <Text style={styles.hintWait}>Next hint reveals automatically...</Text>
        )}
      </View>

      {/* Points preview */}
      <Text style={styles.pointsPreview}>
        Worth {(4 - sleuth.hintsRevealed) * 10} pts if correct
      </Text>

      {/* Guess input */}
      <TextInput
        style={styles.input}
        placeholder="Player name..."
        placeholderTextColor={colors.textMuted}
        value={guess}
        onChangeText={setGuess}
        onSubmitEditing={handleSubmit}
        autoCapitalize="words"
        returnKeyType="go"
      />
      <Button title="Submit Guess" onPress={handleSubmit} variant="primary" />
    </View>
  );
}

function formatStatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  startContainer: { alignItems: 'center', paddingTop: spacing.xxl },
  startTitle: {
    color: colors.clashRed,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
    marginBottom: spacing.sm,
  },
  startDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  completeContainer: { alignItems: 'center', paddingTop: spacing.xxl },
  completeTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  completeScore: {
    color: colors.accent,
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.heavy,
    marginVertical: spacing.sm,
  },
  completeDetail: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.md,
  },
  resultsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  resultDot: { width: 12, height: 12, borderRadius: 6 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  roundLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  scoreLabel: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  statLineCard: { marginBottom: spacing.md },
  statLineTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  statKey: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  statValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  hintsContainer: { marginBottom: spacing.md },
  hintsTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  hintText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  hintWait: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  pointsPreview: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.md,
  },
});
