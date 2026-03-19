import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows, getRarityColor } from '@/lib/theme';
import { getStatCategoryColor } from '@/lib/theme';
import { scaleBounce, fadeIn, slideUp, staggeredFadeIn } from '@/lib/animations';
import { tapHaptic, milestoneHaptic, impactMediumHaptic } from '@/lib/haptics';
import { useStatStackStore } from '@/stores/stat-stack-store';
import { getStatCategoryInfo, lookupPlayerStatValue } from '@/services/games/stat-stack-engine';
import { StatStackRow } from '@/components/games/stat-stack-row';
import { PlayerSearch } from '@/components/games/player-search';
import { ScoreDisplay } from '@/components/games/score-display';
import { TeamLogo } from '@/components/ui/team-logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Player } from '@/types';

// ---- Animated rolling number component ----
function AnimatedRollingNumber({
  value,
  style,
  duration = 600,
}: {
  value: number;
  style?: Animated.WithAnimatedObject<import('react-native').TextStyle> | Animated.WithAnimatedArray<import('react-native').TextStyle>;
  duration?: number;
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const prevValue = useRef(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const from = prevValue.current;
    prevValue.current = value;
    animatedValue.setValue(0);

    const listener = animatedValue.addListener(({ value: progress }) => {
      setDisplayValue(Math.round(from + (value - from) * progress));
    });

    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => animatedValue.removeListener(listener);
  }, [value, duration, animatedValue]);

  return <Animated.Text style={style}>{displayValue.toLocaleString()}</Animated.Text>;
}

// ---- Percentile badge component ----
function PercentileBadge({ percentile }: { percentile: number }) {
  const tierColor = getRarityColor(percentile);
  const suffix =
    percentile % 10 === 1 && percentile !== 11
      ? 'st'
      : percentile % 10 === 2 && percentile !== 12
        ? 'nd'
        : percentile % 10 === 3 && percentile !== 13
          ? 'rd'
          : 'th';
  return (
    <View style={[badgeStyles.container, { borderColor: tierColor + '60', backgroundColor: tierColor + '18' }]}>
      <Text style={[badgeStyles.value, { color: tierColor }]}>
        {percentile}{suffix}
      </Text>
      <Text style={[badgeStyles.label, { color: tierColor + 'CC' }]}>percentile</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  value: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  label: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
});

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
  // Track team (school) for each row for logo display
  const [rowTeams, setRowTeams] = useState<Record<number, string>>({});

  // Animations
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const portalPulse = useRef(new Animated.Value(1)).current;
  const rowAnimations = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0)),
  ).current;

  // Portal button pulse animation
  useEffect(() => {
    if (gameState && !gameState.hasUsedTransferPortal && !gameState.isComplete) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(portalPulse, {
            toValue: 1.06,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(portalPulse, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
  }, [gameState?.hasUsedTransferPortal, gameState?.isComplete, portalPulse]);

  // Stagger rows on mount
  useEffect(() => {
    if (gameState?.puzzle) {
      rowAnimations.forEach((v) => v.setValue(0));
      staggeredFadeIn(rowAnimations, 100).start();
    }
  }, [gameState?.puzzle, rowAnimations]);

  // Celebration animation when game completes
  useEffect(() => {
    if (gameState?.isComplete && scoreBreakdown) {
      milestoneHaptic();
      celebrationScale.setValue(0.3);
      celebrationOpacity.setValue(0);
      Animated.parallel([
        fadeIn(celebrationOpacity, 400),
        Animated.spring(celebrationScale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (scoreBreakdown.percentile >= 90) {
          scaleBounce(celebrationScale).start();
        }
      });
    }
  }, [gameState?.isComplete, scoreBreakdown, celebrationScale, celebrationOpacity]);

  useEffect(() => {
    loadDailyPuzzle();
  }, [loadDailyPuzzle]);

  const handlePlayerSelect = useCallback(
    (player: Player, year?: number) => {
      if (!gameState) return;
      const activeConstraint = gameState.puzzle?.rows[activeRow];
      const season = activeConstraint?.lockedYear ?? year ?? 2023;

      // Track team for logo display
      setRowTeams((prev) => ({ ...prev, [activeRow]: player.school }));

      // Look up the player's real stat value from the cache
      const statCategory = gameState.puzzle!.statCategory;
      const realStatValue = lookupPlayerStatValue(player.name, season, statCategory);

      impactMediumHaptic();

      submitPick({
        rowIndex: activeRow,
        playerId: player.id,
        playerName: player.name,
        season,
        statValue: realStatValue,
        isValid: realStatValue > 0,
      });

      const nextEmpty = gameState.picks.findIndex(
        (p, i) => p === null && i > activeRow,
      );
      if (nextEmpty !== -1) {
        setActiveRow(nextEmpty);
      }
    },
    [activeRow, gameState, submitPick],
  );

  if (!gameState || !gameState.puzzle) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingIcon}>{'\uD83C\uDFC8'}</Text>
        <Text style={styles.loadingText}>LOADING STAT STACK</Text>
      </View>
    );
  }

  const categoryInfo = getStatCategoryInfo(gameState.puzzle.statCategory);
  const accentColor = getStatCategoryColor(gameState.puzzle.statCategory);

  const activeConstraint = gameState.puzzle.rows[activeRow];
  const hasLockedYear = activeConstraint?.lockedYear != null;

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
          <View style={styles.titleRow}>
            <View style={[styles.titleDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.title, { color: accentColor }]}>STAT STACK</Text>
          </View>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            }).toUpperCase()}
          </Text>
        </View>

        {/* Category Banner — sports ticker style with gradient */}
        <LinearGradient
          colors={[accentColor + '25', accentColor + '08', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.categoryBanner, { borderColor: accentColor + '40' }]}
        >
          <View style={[styles.tickerAccent, { backgroundColor: accentColor }]} />
          <View style={styles.categoryContent}>
            <Text style={styles.categoryLabel}>TODAY'S CATEGORY</Text>
            <Text style={[styles.categoryName, { color: accentColor }]}>
              {categoryInfo.label}
            </Text>
            <Text style={styles.categoryHint}>
              Pick 5 players + seasons to maximize total {categoryInfo.unit}
            </Text>
          </View>
        </LinearGradient>

        {/* Running Total with animated number */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total {categoryInfo.label}</Text>
          <AnimatedRollingNumber
            value={gameState.totalStatValue}
            style={[styles.totalValue, { color: accentColor }]}
          />
          <Text style={styles.totalUnit}>{categoryInfo.unit}</Text>
        </Card>

        {/* Penalty Display */}
        {gameState.penalties.length > 0 && (
          <View style={styles.penaltyBanner}>
            {gameState.penalties.map((penalty, i) => (
              <Text key={i} style={styles.penaltyText}>
                {penalty.type === 'targeting' ? '\uD83D\uDEA9 ' : '\u23F1 '}
                {penalty.description}
              </Text>
            ))}
          </View>
        )}

        {/* Section header for rows */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Your Picks</Text>
          <View style={[styles.sectionUnderline, { backgroundColor: colors.accent }]} />
        </View>

        {/* Rows — ticker card style with team logos */}
        {gameState.puzzle.rows.map((constraint, i) => {
          const pick = gameState.picks[i];
          const teamSchool = rowTeams[i];
          const rowFilled = pick !== null;
          const leftBorderColor = rowFilled
            ? pick?.isValid
              ? accentColor
              : colors.incorrect
            : colors.border;

          return (
            <Animated.View
              key={i}
              style={{
                opacity: rowAnimations[i] ?? 1,
                transform: [
                  {
                    translateY: (rowAnimations[i] ?? new Animated.Value(1)).interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              {/* Ticker-card wrapper with left accent border */}
              <View
                style={[
                  styles.tickerCardWrapper,
                  { borderLeftColor: leftBorderColor },
                ]}
              >
                {/* Year badge for locked-year constraints */}
                {constraint.lockedYear != null && (
                  <View style={styles.yearBadge}>
                    <Text style={styles.yearBadgeIcon}>{'\uD83D\uDD12'}</Text>
                    <Text style={styles.yearBadgeText}>{constraint.lockedYear}</Text>
                  </View>
                )}

                {/* Team logo next to player name when filled */}
                {rowFilled && teamSchool && (
                  <View style={styles.teamLogoRow}>
                    <TeamLogo school={teamSchool} size={20} />
                    <Text style={styles.teamSchoolText}>{teamSchool}</Text>
                  </View>
                )}

                <StatStackRow
                  constraint={constraint}
                  pick={pick}
                  isActive={activeRow === i && !gameState.isComplete}
                  canUseTransferPortal={
                    !gameState.hasUsedTransferPortal &&
                    gameState.picks[i] !== null &&
                    !gameState.isComplete
                  }
                  statUnit={categoryInfo.unit}
                  onPress={() => { if (!gameState.isComplete) { tapHaptic(); setActiveRow(i); } }}
                  onTransferPortal={() => activateTransferPortal(i)}
                />
              </View>
            </Animated.View>
          );
        })}

        {/* Transfer Portal Button — polished action button */}
        {!gameState.hasUsedTransferPortal && !gameState.isComplete && (
          <Animated.View
            style={[
              styles.portalBadge,
              { transform: [{ scale: portalPulse }] },
            ]}
          >
            <LinearGradient
              colors={[colors.dynastyPurple + '30', colors.dynastyPurple + '10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.portalGradient}
            >
              <Text style={styles.portalIcon}>{'\uD83C\uDF00'}</Text>
              <View style={styles.portalTextContainer}>
                <Text style={styles.portalTitle}>Transfer Portal</Text>
                <Text style={styles.portalSubtext}>Swap one pick this game</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Player Search */}
        {!gameState.isComplete && gameState.picks[activeRow] === null && (
          <View style={styles.searchSection}>
            <Text style={styles.searchHint}>
              Search for a player who fits:{' '}
              <Text style={styles.constraintHighlight}>
                {gameState.puzzle.rows[activeRow].description}
              </Text>
              {hasLockedYear && (
                <Text style={styles.yearChip}>
                  {' '}
                  [{activeConstraint.lockedYear}]
                </Text>
              )}
            </Text>
            <PlayerSearch
              onSelectPlayer={handlePlayerSelect}
              showYearSelector={!hasLockedYear}
              placeholder="Search players..."
            />
          </View>
        )}

        {/* Game Complete — celebration with animations */}
        {gameState.isComplete && scoreBreakdown && (
          <Animated.View
            style={[
              styles.completeSection,
              {
                opacity: celebrationOpacity,
                transform: [{ scale: celebrationScale }],
              },
            ]}
          >
            <View style={styles.completeBanner}>
              <Text style={styles.completeEmoji}>{'\uD83C\uDFC8'}</Text>
              <Text style={styles.completeTitle}>Game Complete!</Text>
            </View>

            {/* Animated final score */}
            <Card style={styles.finalScoreCard}>
              <Text style={styles.finalScoreLabel}>FINAL SCORE</Text>
              <AnimatedRollingNumber
                value={scoreBreakdown.finalScore}
                style={[styles.finalScoreValue, { color: accentColor }]}
                duration={1200}
              />
            </Card>

            {/* Percentile badge */}
            <PercentileBadge percentile={scoreBreakdown.percentile} />

            <ScoreDisplay
              label="Detailed Results"
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
          </Animated.View>
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
  header: { marginBottom: spacing.md },
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
    marginLeft: 18,
  },

  // Category banner — ticker style
  categoryBanner: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  tickerAccent: {
    width: 4,
  },
  categoryContent: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  categoryLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 2,
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

  // Running total
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

  // Penalties
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

  // Section headers
  sectionHeaderContainer: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionUnderline: {
    width: 28,
    height: 2,
    borderRadius: 1,
    marginTop: 4,
  },

  // Ticker card wrapper (around each StatStackRow)
  tickerCardWrapper: {
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },

  // Year badge for locked-year constraints
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
  },
  yearBadgeIcon: {
    fontSize: typography.fontSize.xs,
    marginRight: 4,
  },
  yearBadgeText: {
    color: colors.accent,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },

  // Team logo row inside ticker card
  teamLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingTop: spacing.xs,
  },
  teamSchoolText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },

  // Transfer portal button
  portalBadge: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.dynastyPurple + '40',
    ...shadows.md,
  },
  portalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  portalIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  portalTextContainer: {
    flex: 1,
  },
  portalTitle: {
    color: colors.dynastyPurple,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  portalSubtext: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },

  // Search section
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
  yearChip: {
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xs,
  },

  // Game complete section
  completeSection: {
    marginTop: spacing.lg,
  },
  completeBanner: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completeEmoji: {
    fontSize: 48,
  },
  completeTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
    marginTop: spacing.xs,
  },
  finalScoreCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
  },
  finalScoreLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  finalScoreValue: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.heavy,
  },
  shareButton: { marginTop: spacing.md, marginBottom: spacing.sm },
});
