import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClashStore } from '@/stores/clash-store';

export function BlindResumeGame() {
  const { blindResume, guessBlindResume, startBlindResume } = useClashStore();
  const [teamGuess, setTeamGuess] = useState('');
  const [yearGuess, setYearGuess] = useState('');

  if (!blindResume) {
    return (
      <View style={styles.startContainer}>
        <Text style={styles.startTitle}>Blind Resume</Text>
        <Text style={styles.startDesc}>
          Anonymized team season stats. Can you identify the team and year?
        </Text>
        <Button title="Start Game" onPress={startBlindResume} variant="primary" />
      </View>
    );
  }

  if (blindResume.isComplete) {
    const correct = blindResume.results.filter(r => r === 'correct').length;
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeTitle}>Game Over!</Text>
        <Text style={styles.completeScore}>{blindResume.score} pts</Text>
        <Text style={styles.completeDetail}>
          {correct}/{blindResume.rounds.length} correct
        </Text>
        <View style={styles.resultsRow}>
          {blindResume.results.map((r, i) => (
            <View
              key={i}
              style={[
                styles.resultDot,
                { backgroundColor: r === 'correct' ? colors.correct : colors.incorrect },
              ]}
            />
          ))}
        </View>
        <Button title="Play Again" onPress={startBlindResume} variant="primary" />
      </View>
    );
  }

  const round = blindResume.rounds[blindResume.currentRound];
  const stats = round.anonymizedStats;

  const handleSubmit = () => {
    if (!teamGuess.trim() || !yearGuess.trim()) return;
    const year = parseInt(yearGuess, 10);
    if (isNaN(year)) return;
    guessBlindResume(teamGuess.trim(), year);
    setTeamGuess('');
    setYearGuess('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <Text style={styles.roundLabel}>
          Round {blindResume.currentRound + 1}/{blindResume.rounds.length}
        </Text>
        <Text style={styles.scoreLabel}>{blindResume.score} pts</Text>
      </View>

      <View style={styles.guessIndicator}>
        {Array.from({ length: blindResume.guessesPerRound }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.guessDot,
              i < blindResume.guessesUsed ? styles.guessDotUsed : styles.guessDotAvailable,
            ]}
          />
        ))}
      </View>

      <Card style={styles.statsCard}>
        <Text style={styles.statsTitle}>Season Resume</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Record</Text>
          <Text style={styles.statValue}>{stats.wins}-{stats.losses}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Pts Scored/G</Text>
          <Text style={styles.statValue}>{stats.pointsScored.toFixed(1)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Pts Allowed/G</Text>
          <Text style={styles.statValue}>{stats.pointsAllowed.toFixed(1)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Offense YPG</Text>
          <Text style={styles.statValue}>{stats.totalOffenseYpg.toFixed(1)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Defense YPG</Text>
          <Text style={styles.statValue}>{stats.totalDefenseYpg.toFixed(1)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>SOS</Text>
          <Text style={styles.statValue}>{stats.strengthOfSchedule.toFixed(2)}</Text>
        </View>
      </Card>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, styles.teamInput]}
          placeholder="Team name..."
          placeholderTextColor={colors.textMuted}
          value={teamGuess}
          onChangeText={setTeamGuess}
          autoCapitalize="words"
        />
        <TextInput
          style={[styles.input, styles.yearInput]}
          placeholder="Year"
          placeholderTextColor={colors.textMuted}
          value={yearGuess}
          onChangeText={setYearGuess}
          keyboardType="number-pad"
          maxLength={4}
        />
      </View>

      <Button title="Submit Guess" onPress={handleSubmit} variant="primary" />
    </View>
  );
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
  resultDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  guessIndicator: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  guessDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  guessDotAvailable: { backgroundColor: colors.correct },
  guessDotUsed: { backgroundColor: colors.incorrect },
  statsCard: { marginBottom: spacing.md },
  statsTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  },
  teamInput: { flex: 2 },
  yearInput: { flex: 1 },
});
