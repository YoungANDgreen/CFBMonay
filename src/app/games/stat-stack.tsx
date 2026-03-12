import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { getStatCategoryColor } from '@/lib/theme';
import { useStatStackStore } from '@/stores/stat-stack-store';
import { getStatCategoryInfo } from '@/services/games/stat-stack-engine';
import { StatStackRow } from '@/components/games/stat-stack-row';
import { PlayerSearch } from '@/components/games/player-search';
import { ScoreDisplay } from '@/components/games/score-display';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Player } from '@/types';

export default function StatStackScreen() {
  const {
    gameState,
    scoreBreakdown,
    loadDailyPuzzle,
    submitPick,
    activateTransferPortal,
    resetGame,
  } = useStatStackStore();

  const [activeRow, setActiveRow] = useState(0);

  useEffect(() => {
    loadDailyPuzzle();
  }, [loadDailyPuzzle]);

  if (!gameState || !gameState.puzzle) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading today's Stat Stack...</Text>
      </View>
    );
  }

  const categoryInfo = getStatCategoryInfo(gameState.puzzle.statCategory);
  const accentColor = getStatCategoryColor(gameState.puzzle.statCategory);

  const activeConstraint = gameState.puzzle.rows[activeRow];
  const hasLockedYear = activeConstraint?.lockedYear != null;

  const handlePlayerSelect = (player: Player, year?: number) => {
    // Use locked year from constraint, selected year, or fallback to 2023
    const season = activeConstraint?.lockedYear ?? year ?? 2023;

    // In production, we'd look up the player's actual stat value for the season
    // For now, use a mock stat value
    const mockStatValue = Math.floor(Math.random() * 2000) + 500;

    submitPick({
      rowIndex: activeRow,
      playerId: player.id,
      playerName: player.name,
      season,
      statValue: mockStatValue,
      isValid: true, // would be validated by backend
    });

    // Advance to next empty row
    const nextEmpty = gameState.picks.findIndex((p, i) => p === null && i > activeRow);
    if (nextEmpty !== -1) {
      setActiveRow(nextEmpty);
    }
  };

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
          <Text style={[styles.title, { color: accentColor }]}>Stat Stack</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Category Banner */}
        <View style={[styles.categoryBanner, { borderColor: accentColor + '40' }]}>
          <Text style={styles.categoryLabel}>Today's Category</Text>
          <Text style={[styles.categoryName, { color: accentColor }]}>
            {categoryInfo.label}
          </Text>
          <Text style={styles.categoryHint}>
            Pick 5 players + seasons to maximize total {categoryInfo.unit}
          </Text>
        </View>

        {/* Running Total */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total {categoryInfo.label}</Text>
          <Text style={[styles.totalValue, { color: accentColor }]}>
            {gameState.totalStatValue.toLocaleString()}
          </Text>
          <Text style={styles.totalUnit}>{categoryInfo.unit}</Text>
        </Card>

        {/* Penalty Display */}
        {gameState.penalties.length > 0 && (
          <View style={styles.penaltyBanner}>
            {gameState.penalties.map((penalty, i) => (
              <Text key={i} style={styles.penaltyText}>
                {penalty.type === 'targeting' ? '🚩 ' : '⏱ '}
                {penalty.description}
              </Text>
            ))}
          </View>
        )}

        {/* Rows */}
        {gameState.puzzle.rows.map((constraint, i) => (
          <StatStackRow
            key={i}
            constraint={constraint}
            pick={gameState.picks[i]}
            isActive={activeRow === i && !gameState.isComplete}
            canUseTransferPortal={
              !gameState.hasUsedTransferPortal &&
              gameState.picks[i] !== null &&
              !gameState.isComplete
            }
            statUnit={categoryInfo.unit}
            onPress={() => !gameState.isComplete && setActiveRow(i)}
            onTransferPortal={() => activateTransferPortal(i)}
          />
        ))}

        {/* Transfer Portal Badge */}
        {!gameState.hasUsedTransferPortal && !gameState.isComplete && (
          <View style={styles.portalBadge}>
            <Text style={styles.portalText}>
              🔄 Transfer Portal available — swap one pick
            </Text>
          </View>
        )}

        {/* Player Search */}
        {!gameState.isComplete && gameState.picks[activeRow] === null && (
          <View style={styles.searchSection}>
            <Text style={styles.searchHint}>
              Search for a player who fits:{' '}
              <Text style={styles.constraintHighlight}>
                {gameState.puzzle.rows[activeRow].description}
              </Text>
            </Text>
            <PlayerSearch
              onSelectPlayer={handlePlayerSelect}
              showYearSelector={!hasLockedYear}
              placeholder="Search players..."
            />
          </View>
        )}

        {/* Game Complete */}
        {gameState.isComplete && scoreBreakdown && (
          <View style={styles.completeSection}>
            <ScoreDisplay
              label="Final Results"
              score={scoreBreakdown.finalScore}
              percentile={scoreBreakdown.percentile}
            />
            <Button
              title="Share Results"
              onPress={() => {}}
              variant="primary"
              style={styles.shareButton}
            />
            <Button
              title="Play Again"
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
  header: { marginBottom: spacing.md },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  categoryBanner: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  categoryLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    marginVertical: spacing.xs,
  },
  categoryHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  totalCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.heavy,
  },
  totalUnit: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  penaltyBanner: {
    backgroundColor: colors.incorrect + '15',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.incorrect + '30',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  penaltyText: {
    color: colors.incorrect,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  portalBadge: {
    backgroundColor: colors.dynastyPurple + '15',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  portalText: {
    color: colors.dynastyPurple,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  searchSection: { marginTop: spacing.sm },
  searchHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  constraintHighlight: {
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  completeSection: {
    marginTop: spacing.lg,
  },
  shareButton: { marginTop: spacing.md, marginBottom: spacing.sm },
});
