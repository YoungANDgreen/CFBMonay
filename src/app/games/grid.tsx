import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { useGridStore } from '@/stores/grid-store';
import { GridBoard } from '@/components/games/grid-board';
import { PlayerSearch } from '@/components/games/player-search';
import { ScoreDisplay } from '@/components/games/score-display';
import { Button } from '@/components/ui/button';
import { celebrationBurst, rollNumber } from '@/lib/animations';
import { tapHaptic, milestoneHaptic } from '@/lib/haptics';
import type { Player } from '@/types';

export default function GridScreen() {
  const {
    gameState,
    loadDailyPuzzle,
    selectCell,
    submitAnswer,
    resetGame,
  } = useGridStore();

  // Animated values
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(1)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const prevScore = useRef(0);
  const prevComplete = useRef(false);

  useEffect(() => {
    loadDailyPuzzle();
  }, [loadDailyPuzzle]);

  // Fade in header on mount
  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [headerOpacity]);

  // Animate score changes
  useEffect(() => {
    if (!gameState) return;
    if (gameState.score !== prevScore.current) {
      rollNumber(scoreAnim, gameState.score, 600).start();
      prevScore.current = gameState.score;
    }
  }, [gameState?.score, scoreAnim, gameState]);

  // Celebration animation when game completes
  useEffect(() => {
    if (!gameState) return;
    if (gameState.isComplete && !prevComplete.current) {
      milestoneHaptic();
      celebrationScale.setValue(1);
      celebrationBurst(celebrationScale).start();
    }
    prevComplete.current = gameState.isComplete;
  }, [gameState?.isComplete, celebrationScale, gameState]);

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      tapHaptic();
      selectCell(row, col);
    },
    [selectCell],
  );

  const handlePlayerSelect = useCallback(
    (player: Player, year?: number) => {
      submitAnswer(player, year);
    },
    [submitAnswer],
  );

  const handleShare = useCallback(() => {
    if (!gameState) return;
    const grid = gameState.cells
      .map((row) => row.map((c) => (c.isCorrect ? '\u{1F7E9}' : c.isLocked ? '\u{1F7E5}' : '\u{2B1C}')).join(''))
      .join('\n');
    Share.share({
      message: `GridIron IQ - The Grid\nScore: ${gameState.score}\n\n${grid}`,
    });
  }, [gameState]);

  if (!gameState || !gameState.puzzle) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPulse}>
          <Text style={styles.loadingIcon}>{'\u{1F3C8}'}</Text>
          <Text style={styles.loadingText}>LOADING PUZZLE</Text>
        </View>
      </View>
    );
  }

  const totalCells = gameState.puzzle.size * gameState.puzzle.size;
  const filledCells = gameState.cells.reduce(
    (sum, row) => sum + row.filter((c) => c.isLocked).length,
    0,
  );
  const correctCells = gameState.cells.reduce(
    (sum, row) => sum + row.filter((c) => c.isCorrect).length,
    0,
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with green accent */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <View style={styles.headerLeft}>
            <View style={styles.titleRow}>
              <View style={[styles.titleDot, { backgroundColor: colors.gridGreen }]} />
              <Text style={styles.title}>THE GRID</Text>
            </View>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              }).toUpperCase()}
            </Text>
          </View>

          {/* Progress ring */}
          <View style={styles.progressContainer}>
            <View style={[
              styles.progressRing,
              filledCells === totalCells && { borderColor: colors.gridGreen },
            ]}>
              <Text style={styles.progressCount}>{correctCells}</Text>
              <Text style={styles.progressDivider}>/{totalCells}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Score Display */}
        <Animated.View style={{ transform: [{ scale: celebrationScale }] }}>
          <ScoreDisplay
            label={gameState.isComplete ? 'Final Score' : 'Current Game'}
            score={gameState.score}
            guessesRemaining={gameState.guessesRemaining}
            maxGuesses={totalCells}
            compact
            accentColor={colors.gridGreen}
          />
        </Animated.View>

        {/* Instructions */}
        {!gameState.isComplete && gameState.currentCell === null && (
          <LinearGradient
            colors={[colors.gridGreen + '12', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.instructionBanner}
          >
            <View style={[styles.instructionAccent, { backgroundColor: colors.gridGreen }]} />
            <Text style={styles.instructionText}>
              TAP A CELL, THEN SEARCH FOR A PLAYER WHO MATCHES BOTH CRITERIA
            </Text>
          </LinearGradient>
        )}

        {/* Grid Board */}
        <GridBoard
          cells={gameState.cells}
          rows={gameState.puzzle.rows}
          columns={gameState.puzzle.columns}
          selectedCell={gameState.currentCell}
          onCellPress={handleCellPress}
        />

        {/* Player Search — visible when a cell is selected */}
        {gameState.currentCell && !gameState.isComplete && (
          <View style={styles.searchSection}>
            <View style={styles.searchHintContainer}>
              <View style={[styles.searchHintDot, { backgroundColor: colors.gridGreen }]} />
              <Text style={styles.searchHint}>
                Find a player who played in the{' '}
                <Text style={styles.criteriaHighlight}>
                  {gameState.cells[gameState.currentCell.row][gameState.currentCell.col].rowCriteria.displayText}
                </Text>
                {' and '}
                <Text style={styles.criteriaHighlight}>
                  {gameState.cells[gameState.currentCell.row][gameState.currentCell.col].colCriteria.displayText}
                </Text>
              </Text>
            </View>
            <PlayerSearch
              onSelectPlayer={handlePlayerSelect}
              showYearSelector={true}
              placeholder="Search by name, school, or position..."
            />
          </View>
        )}

        {/* Game Complete */}
        {gameState.isComplete && (
          <View style={styles.completeSection}>
            <Text style={styles.completeEmoji}>
              {correctCells === totalCells ? '\u{1F3C6}' : correctCells > 0 ? '\u{1F3C8}' : '\u{1F614}'}
            </Text>
            <Text style={styles.completeTitle}>
              {correctCells === totalCells
                ? 'PERFECT GRID!'
                : correctCells > 0
                  ? 'NICE WORK!'
                  : 'BETTER LUCK TOMORROW'}
            </Text>

            {/* Result mini-grid */}
            <View style={styles.resultGrid}>
              {gameState.cells.map((row, ri) => (
                <View key={ri} style={styles.resultRow}>
                  {row.map((cell, ci) => (
                    <View
                      key={ci}
                      style={[
                        styles.resultCell,
                        cell.isCorrect ? styles.resultCorrect : styles.resultIncorrect,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>

            <Button
              title="SHARE RESULTS"
              onPress={handleShare}
              variant="primary"
              accentColor={colors.gridGreen}
              style={styles.shareButton}
            />
            <Button
              title="PLAY PRACTICE MODE"
              onPress={resetGame}
              variant="outline"
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingPulse: {
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 3,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  title: {
    color: colors.gridGreen,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 2,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1.5,
    marginTop: 4,
    marginLeft: 18, // align with title text past the dot
  },

  // Progress
  progressContainer: {},
  progressRing: {
    width: 52,
    height: 52,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  progressCount: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.heavy,
  },
  progressDivider: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginTop: -2,
  },

  // Instructions
  instructionBanner: {
    flexDirection: 'row',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gridGreen + '30',
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  instructionAccent: {
    width: 4,
  },
  instructionText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    padding: spacing.md,
    flex: 1,
  },

  // Search
  searchSection: {
    marginTop: spacing.md,
  },
  searchHintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  searchHintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 5,
    marginRight: spacing.sm,
  },
  searchHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  criteriaHighlight: {
    color: colors.gridGreen,
    fontWeight: typography.fontWeight.heavy,
    textTransform: 'uppercase',
  },

  // Complete
  completeSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  completeEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  completeTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  resultGrid: {
    marginBottom: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
  },
  resultCell: {
    width: 36,
    height: 36,
    margin: 2,
    borderRadius: 3,
  },
  resultCorrect: { backgroundColor: colors.correct + '50' },
  resultIncorrect: { backgroundColor: colors.incorrect + '40' },
  shareButton: { marginBottom: spacing.sm, width: '100%' },
});
