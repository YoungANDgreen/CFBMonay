import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '@/lib/theme';
import { flipCard, glowPulse } from '@/lib/animations';
import type { GridCell as GridCellType } from '@/types';

/** Rarity tier thresholds and colors */
function getRarityBorder(rarityScore: number | undefined): {
  borderColor: string;
  glowColor: string;
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
} | null {
  if (rarityScore === undefined) return null;
  if (rarityScore >= 95)
    return { borderColor: '#E2B714', glowColor: '#E2B714', tier: 'legendary' };
  if (rarityScore >= 80)
    return { borderColor: '#E67E22', glowColor: '#E67E22', tier: 'epic' };
  if (rarityScore >= 60)
    return { borderColor: '#9B59B6', glowColor: '#9B59B6', tier: 'rare' };
  if (rarityScore >= 40)
    return { borderColor: '#3498DB', glowColor: '#3498DB', tier: 'uncommon' };
  return null; // common — no special border
}

interface GridCellProps {
  cell: GridCellType;
  isSelected: boolean;
  onPress: () => void;
  rarityScore?: number;
}

export function GridCellComponent({ cell, isSelected, onPress, rarityScore }: GridCellProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const wasLocked = useRef(cell.isLocked);

  // Trigger flip animation when cell becomes locked (answer submitted)
  useEffect(() => {
    if (cell.isLocked && !wasLocked.current) {
      flipAnim.setValue(0);
      flipCard(flipAnim, 400).start();
    }
    wasLocked.current = cell.isLocked;
  }, [cell.isLocked, flipAnim]);

  // Rarity glow for correct answers with high rarity
  const rarityInfo = cell.isLocked && cell.isCorrect ? getRarityBorder(rarityScore) : null;

  useEffect(() => {
    if (rarityInfo && (rarityInfo.tier === 'legendary' || rarityInfo.tier === 'epic')) {
      glowAnim.setValue(0.3);
      const anim = glowPulse(glowAnim, rarityInfo.tier === 'legendary' ? 1200 : 1800);
      anim.start();
      return () => anim.stop();
    }
  }, [rarityInfo, glowAnim]);

  const getCellStyle = () => {
    if (cell.isLocked && cell.isCorrect) return styles.correct;
    if (cell.isLocked && !cell.isCorrect) return styles.incorrect;
    if (isSelected) return styles.selected;
    return styles.empty;
  };

  // Build flip transform: rotateY from 0 -> 90 -> 0
  const rotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  // Build rarity border style
  const rarityStyle = rarityInfo
    ? {
        borderWidth: 2,
        borderColor: rarityInfo.borderColor,
        ...(rarityInfo.tier === 'legendary' || rarityInfo.tier === 'epic'
          ? shadows.glow(rarityInfo.glowColor)
          : {}),
      }
    : {};

  // Animated shadow opacity for pulsing glow
  const glowShadowStyle =
    rarityInfo && (rarityInfo.tier === 'legendary' || rarityInfo.tier === 'epic')
      ? { shadowOpacity: glowAnim }
      : {};

  return (
    <Animated.View
      style={[
        { transform: [{ perspective: 800 }, { rotateY }] },
        glowShadowStyle,
      ]}
    >
      <TouchableOpacity
        style={[styles.cell, getCellStyle(), rarityStyle]}
        onPress={onPress}
        disabled={cell.isLocked}
        activeOpacity={0.7}
      >
        {cell.answer ? (
          <View style={styles.answerContent}>
            <Text style={styles.playerName} numberOfLines={2}>
              {cell.answer.name}
            </Text>
            <Text style={styles.playerSchool} numberOfLines={1}>
              {cell.answer.school}
            </Text>
            {rarityInfo && (
              <View style={[styles.rarityBadge, { backgroundColor: rarityInfo.borderColor + '30' }]}>
                <Text style={[styles.rarityText, { color: rarityInfo.borderColor }]}>
                  {rarityInfo.tier.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContent}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  empty: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  selected: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.glow(colors.accent),
  },
  correct: {
    backgroundColor: '#1a3d2a',
    borderWidth: 2,
    borderColor: colors.correct,
  },
  incorrect: {
    backgroundColor: '#3d1a1a',
    borderWidth: 2,
    borderColor: colors.incorrect,
  },
  answerContent: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  playerSchool: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: 2,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.regular,
  },
  rarityBadge: {
    marginTop: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 0.5,
  },
});
