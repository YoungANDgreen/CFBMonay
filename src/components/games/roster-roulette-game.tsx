import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClashStore } from '@/stores/clash-store';

export function RosterRouletteGame() {
  const { rosterRoulette, startRosterRoulette, guessRosterPlayer, endRoulette } = useClashStore();
  const [guess, setGuess] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRef = useRef<TextInput>(null);

  // Countdown timer
  useEffect(() => {
    if (!rosterRoulette || rosterRoulette.isComplete) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - rosterRoulette.startTime;
      const remaining = Math.max(0, Math.ceil((rosterRoulette.timeRemainingMs - elapsed) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        endRoulette();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [rosterRoulette?.startTime, rosterRoulette?.isComplete]);

  if (!rosterRoulette) {
    return (
      <View style={styles.startContainer}>
        <Text style={styles.startTitle}>Roster Roulette</Text>
        <Text style={styles.startDesc}>
          Name as many players as you can from the roster in 60 seconds!
        </Text>
        <View style={styles.difficultyRow}>
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <Button
              key={d}
              title={d.charAt(0).toUpperCase() + d.slice(1)}
              onPress={() => startRosterRoulette(d)}
              variant={d === 'medium' ? 'primary' : 'outline'}
              size="sm"
            />
          ))}
        </View>
      </View>
    );
  }

  if (rosterRoulette.isComplete) {
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeTitle}>Time's Up!</Text>
        <Text style={styles.completeSchool}>
          {rosterRoulette.school} ({rosterRoulette.year})
        </Text>
        <Text style={styles.completeScore}>{rosterRoulette.score} pts</Text>
        <Text style={styles.completeDetail}>
          {rosterRoulette.guessedPlayers.length}/{rosterRoulette.validPlayers.length} players named
        </Text>
        <Button
          title="Play Again"
          onPress={() => startRosterRoulette(rosterRoulette.difficulty)}
          variant="primary"
        />
      </View>
    );
  }

  const handleSubmit = () => {
    if (!guess.trim()) return;
    guessRosterPlayer(guess.trim());
    setGuess('');
    inputRef.current?.focus();
  };

  const timerColor = timeLeft <= 10 ? colors.incorrect : timeLeft <= 20 ? colors.predictionOrange : colors.correct;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.schoolName}>{rosterRoulette.school}</Text>
          <Text style={styles.schoolYear}>{rosterRoulette.year} Roster</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={[styles.timer, { color: timerColor }]}>{timeLeft}s</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {rosterRoulette.guessedPlayers.length}/{rosterRoulette.validPlayers.length} players
        </Text>
        <Text style={styles.scoreText}>{rosterRoulette.score} pts</Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${(rosterRoulette.guessedPlayers.length / rosterRoulette.validPlayers.length) * 100}%`,
            },
          ]}
        />
      </View>

      {/* Input */}
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder="Type a player name..."
        placeholderTextColor={colors.textMuted}
        value={guess}
        onChangeText={setGuess}
        onSubmitEditing={handleSubmit}
        autoCapitalize="words"
        autoFocus
        returnKeyType="go"
      />

      {/* Guessed players */}
      <Text style={styles.guessedTitle}>Named Players</Text>
      <FlatList
        data={rosterRoulette.guessedPlayers}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.guessedRow}
        renderItem={({ item }) => (
          <View style={styles.guessedChip}>
            <Text style={styles.guessedName}>
              {item.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Start typing player names!</Text>
        }
      />
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
  difficultyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  completeContainer: { alignItems: 'center', paddingTop: spacing.xxl },
  completeTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  completeSchool: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
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
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  schoolName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
  },
  schoolYear: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  timerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timer: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  scoreText: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 3,
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.correct,
    borderRadius: 3,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.clashRed,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.md,
  },
  guessedTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  guessedRow: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  guessedChip: {
    flex: 1,
    backgroundColor: colors.correct + '20',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.correct + '40',
  },
  guessedName: {
    color: colors.correct,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
