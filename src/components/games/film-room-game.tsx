import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeamLogo } from '@/components/ui/team-logo';
import { useClashStore } from '@/stores/clash-store';
import { fadeIn, slideUp } from '@/lib/animations';
import type { FilmRoomRevealData } from '@/types';

export function FilmRoomGame() {
  const { filmRoom, startFilmRoom, guessFilmRoom } = useClashStore();
  const [revealData, setRevealData] = useState<FilmRoomRevealData | null>(null);
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealSlide = useRef(new Animated.Value(50)).current;

  const showReveal = useCallback((data: FilmRoomRevealData, result: 'correct' | 'incorrect') => {
    setRevealData(data);
    setLastResult(result);
    revealOpacity.setValue(0);
    revealSlide.setValue(50);
    Animated.parallel([
      fadeIn(revealOpacity, 400),
      slideUp(revealSlide, 50, 400),
    ]).start();
  }, [revealOpacity, revealSlide]);

  const handleGuess = useCallback((index: number) => {
    if (!filmRoom) return;
    const round = filmRoom.rounds[filmRoom.currentRound];
    const isCorrect = index === round.correctIndex;
    const result = isCorrect ? 'correct' as const : 'incorrect' as const;

    if (round.revealData) {
      showReveal(round.revealData, result);
    } else {
      // No reveal data — just advance immediately
      guessFilmRoom(index);
    }
    // Store the selected index so we can advance after reveal
    selectedIndexRef.current = index;
  }, [filmRoom, guessFilmRoom, showReveal]);

  const selectedIndexRef = useRef<number | null>(null);

  const handleNextRound = useCallback(() => {
    if (selectedIndexRef.current !== null) {
      guessFilmRoom(selectedIndexRef.current);
      selectedIndexRef.current = null;
    }
    setRevealData(null);
    setLastResult(null);
  }, [guessFilmRoom]);

  // Auto-advance after 5 seconds if reveal is showing
  useEffect(() => {
    if (revealData) {
      const timer = setTimeout(handleNextRound, 5000);
      return () => clearTimeout(timer);
    }
  }, [revealData, handleNextRound]);

  if (!filmRoom) {
    return (
      <View style={styles.startContainer}>
        <Text style={styles.startTitle}>Coach's Film Room</Text>
        <Text style={styles.startDesc}>
          Read the play-by-play description and identify which iconic game it came from.
        </Text>
        <Button title="Start Game" onPress={startFilmRoom} variant="primary" />
      </View>
    );
  }

  if (filmRoom.isComplete && !revealData) {
    const correct = filmRoom.results.filter(r => r === 'correct').length;
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeTitle}>Film Session Over!</Text>
        <Text style={styles.completeScore}>{filmRoom.score} pts</Text>
        <Text style={styles.completeDetail}>
          {correct}/{filmRoom.rounds.length} correct
        </Text>
        <View style={styles.resultsRow}>
          {filmRoom.results.map((r, i) => (
            <View
              key={i}
              style={[
                styles.resultDot,
                { backgroundColor: r === 'correct' ? colors.correct : colors.incorrect },
              ]}
            />
          ))}
        </View>
        <Button title="Play Again" onPress={startFilmRoom} variant="primary" />
      </View>
    );
  }

  // Show reveal card after a guess
  if (revealData) {
    return (
      <Animated.View
        style={[
          styles.container,
          { opacity: revealOpacity, transform: [{ translateY: revealSlide }] },
        ]}
      >
        <View style={styles.revealHeader}>
          <Text style={[
            styles.revealResultText,
            { color: lastResult === 'correct' ? colors.correct : colors.incorrect },
          ]}>
            {lastResult === 'correct' ? 'Correct!' : 'Incorrect'}
          </Text>
        </View>

        <Card style={styles.revealCard}>
          <View style={styles.revealTeams}>
            <View style={styles.revealTeamCol}>
              <TeamLogo school={revealData.homeTeam} size={48} />
              <Text style={styles.revealTeamName}>{revealData.homeTeam}</Text>
              <Text style={styles.revealScore}>{revealData.homeScore}</Text>
            </View>

            <Text style={styles.revealVs}>vs</Text>

            <View style={styles.revealTeamCol}>
              <TeamLogo school={revealData.awayTeam} size={48} />
              <Text style={styles.revealTeamName}>{revealData.awayTeam}</Text>
              <Text style={styles.revealScore}>{revealData.awayScore}</Text>
            </View>
          </View>

          {revealData.broadcastQuote ? (
            <View style={styles.quoteBlock}>
              <Text style={styles.quoteText}>"{revealData.broadcastQuote}"</Text>
              {revealData.announcer ? (
                <Text style={styles.announcerText}>- {revealData.announcer}</Text>
              ) : null}
            </View>
          ) : null}
        </Card>

        <Button title="Next Round" onPress={handleNextRound} variant="primary" />
      </Animated.View>
    );
  }

  const round = filmRoom.rounds[filmRoom.currentRound];

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <Text style={styles.roundLabel}>
          Round {filmRoom.currentRound + 1}/{filmRoom.rounds.length}
        </Text>
        <Text style={styles.scoreLabel}>{filmRoom.score} pts</Text>
      </View>

      {/* Play description */}
      <Card style={styles.descriptionCard}>
        <Text style={styles.descriptionIcon}>🎬</Text>
        <Text style={styles.descriptionText}>{round.description}</Text>
      </Card>

      {/* Multiple choice options */}
      <Text style={styles.optionsTitle}>Which game was this?</Text>
      {round.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.optionCard}
          onPress={() => handleGuess(index)}
          activeOpacity={0.7}
        >
          <View style={styles.optionLetter}>
            <Text style={styles.optionLetterText}>
              {String.fromCharCode(65 + index)}
            </Text>
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>{option.label}</Text>
            <Text style={styles.optionDetail}>
              {option.team} vs {option.opponent} ({option.year})
            </Text>
          </View>
        </TouchableOpacity>
      ))}
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
  descriptionCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  descriptionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    lineHeight: 24,
    textAlign: 'center',
  },
  optionsTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.clashRed + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionLetterText: {
    color: colors.clashRed,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  optionInfo: { flex: 1 },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  optionDetail: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  // --- Reveal Styles ---
  revealHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  revealResultText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  revealCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    padding: spacing.lg,
  },
  revealTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  revealTeamCol: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  revealTeamName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    maxWidth: 100,
  },
  revealScore: {
    color: colors.accent,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  revealVs: {
    color: colors.textMuted,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  quoteBlock: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  quoteText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  announcerText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
