import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { useGridStore } from '@/stores/grid-store';
import { GridBoard } from '@/components/games/grid-board';
import { PlayerSearch } from '@/components/games/player-search';
import { ScoreDisplay } from '@/components/games/score-display';
import { Button } from '@/components/ui/button';
import type { Player } from '@/types';

export default function GridScreen() {
  const {
    gameState,
    loadDailyPuzzle,
    selectCell,
    submitAnswer,
    resetGame,
  } = useGridStore();

  useEffect(() => {
    loadDailyPuzzle();
  }, [loadDailyPuzzle]);

  if (!gameState || !gameState.puzzle) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading today's puzzle...</Text>
      </View>
    );
  }

  const handlePlayerSelect = (player: Player, year?: number) => {
    submitAnswer(player, year);
  };

  const totalCells = gameState.puzzle.size * gameState.puzzle.size;

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>The Grid</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Score Display */}
        <ScoreDisplay
          label={gameState.isComplete ? 'Final Score' : 'Current Game'}
          score={gameState.score}
          guessesRemaining={gameState.guessesRemaining}
          maxGuesses={totalCells}
          compact
        />

        {/* Instructions */}
        {!gameState.isComplete && gameState.currentCell === null && (
          <View style={styles.instructionBanner}>
            <Text style={styles.instructionText}>
              Tap a cell, then search for a player who matches both the row and column criteria
            </Text>
          </View>
        )}

        {/* Grid Board */}
        <GridBoard
          cells={gameState.cells}
          rows={gameState.puzzle.rows}
          columns={gameState.puzzle.columns}
          selectedCell={gameState.currentCell}
          onCellPress={selectCell}
        />

        {/* Player Search — visible when a cell is selected */}
        {gameState.currentCell && !gameState.isComplete && (
          <View style={styles.searchSection}>
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
            <Text style={styles.completeTitle}>
              {gameState.score > 0 ? 'Nice work!' : 'Better luck tomorrow!'}
            </Text>

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
                    >
                      <Text style={styles.resultEmoji}>
                        {cell.isCorrect ? '✅' : '❌'}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            <Button
              title="Share Results"
              onPress={() => {}}
              variant="primary"
              style={styles.shareButton}
            />
            <Button
              title="Play Practice Mode"
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
  loadingText: { color: colors.textSecondary, fontSize: typography.fontSize.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.gridGreen,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  instructionBanner: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.gridGreen,
  },
  instructionText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  searchSection: {
    marginTop: spacing.md,
  },
  searchHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  criteriaHighlight: {
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  completeSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  completeTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  resultGrid: {
    marginBottom: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
  },
  resultCell: {
    width: 44,
    height: 44,
    margin: 2,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCorrect: { backgroundColor: colors.correct + '30' },
  resultIncorrect: { backgroundColor: colors.incorrect + '30' },
  resultEmoji: { fontSize: 20 },
  shareButton: { marginBottom: spacing.sm, width: '100%' },
});
