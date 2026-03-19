import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing, typography, shadows } from '@/lib/theme';
import { flipCard, glowPulse } from '@/lib/animations';
import { tapHaptic, correctHaptic, wrongHaptic } from '@/lib/haptics';
import { TeamLogo } from '@/components/ui/team-logo';
import type { GridCell as GridCellType } from '@/types';

/** Rarity tier thresholds */
function getRarityInfo(rarityScore: number | undefined): {
  borderColor: string;
  glowColor: string;
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  label: string;
} | null {
  if (rarityScore === undefined) return null;
  if (rarityScore >= 95)
    return { borderColor: '#FFD700', glowColor: '#FFD700', tier: 'legendary', label: 'LEGENDARY' };
  if (rarityScore >= 80)
    return { borderColor: '#FF6A00', glowColor: '#FF6A00', tier: 'epic', label: 'EPIC' };
  if (rarityScore >= 60)
    return { borderColor: '#B44DFF', glowColor: '#B44DFF', tier: 'rare', label: 'RARE' };
  if (rarityScore >= 40)
    return { borderColor: '#00B4FF', glowColor: '#00B4FF', tier: 'uncommon', label: 'UNCOMMON' };
  return null;
}

interface GridCellProps {
  cell: GridCellType;
  isSelected: boolean;
  onPress: () => void;
  rarityScore?: number;
}

export function GridCellComponent({ cell, isSelected, onPress, rarityScore }: GridCellProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const wasLocked = useRef(cell.isLocked);

  // Flip + bounce on answer submission
  useEffect(() => {
    if (cell.isLocked && !wasLocked.current) {
      flipAnim.setValue(0);
      scaleAnim.setValue(1);

      // Flip card
      flipCard(flipAnim, 400).start();

      // Bounce after flip
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(scaleAnim, {
          toValue: 1.08,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic feedback
      if (cell.isCorrect) {
        correctHaptic();
      } else {
        wrongHaptic();
      }
    }
    wasLocked.current = cell.isLocked;
  }, [cell.isLocked, cell.isCorrect, flipAnim, scaleAnim]);

  // Rarity glow pulse
  const rarityInfo = cell.isLocked && cell.isCorrect ? getRarityInfo(rarityScore) : null;

  useEffect(() => {
    if (rarityInfo && (rarityInfo.tier === 'legendary' || rarityInfo.tier === 'epic')) {
      glowAnim.setValue(0.3);
      const anim = glowPulse(glowAnim, rarityInfo.tier === 'legendary' ? 1200 : 1800);
      anim.start();
      return () => anim.stop();
    }
  }, [rarityInfo, glowAnim]);

  const handlePress = () => {
    tapHaptic();
    onPress();
  };

  // Flip transform
  const rotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  // Rarity border
  const rarityStyle = rarityInfo
    ? {
        borderWidth: 2,
        borderColor: rarityInfo.borderColor,
        ...(rarityInfo.tier === 'legendary' || rarityInfo.tier === 'epic'
          ? shadows.glow(rarityInfo.glowColor)
          : {}),
      }
    : {};

  const glowShadowStyle =
    rarityInfo && (rarityInfo.tier === 'legendary' || rarityInfo.tier === 'epic')
      ? { shadowOpacity: glowAnim }
      : {};

  // Correct cell: green tint. Incorrect: red tint.
  const getCellStyle = () => {
    if (cell.isLocked && cell.isCorrect) return styles.correct;
    if (cell.isLocked && !cell.isCorrect) return styles.incorrect;
    if (isSelected) return styles.selected;
    return styles.empty;
  };

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          transform: [{ perspective: 800 }, { rotateY }, { scale: scaleAnim }],
        },
        glowShadowStyle,
      ]}
    >
      <TouchableOpacity
        style={[styles.cell, getCellStyle(), rarityStyle]}
        onPress={handlePress}
        disabled={cell.isLocked}
        activeOpacity={0.8}
      >
        {cell.answer ? (
          <View style={styles.answerContent}>
            {/* Team logo background watermark */}
            <View style={styles.logoBg}>
              <TeamLogo school={cell.answer.school} size={36} style={{ opacity: 0.15 }} />
            </View>

            <Text style={styles.playerName} numberOfLines={2}>
              {cell.answer.name}
            </Text>
            <Text style={styles.playerSchool} numberOfLines={1}>
              {cell.answer.school}
            </Text>

            {/* Rarity badge */}
            {rarityInfo && (
              <View style={[styles.rarityBadge, { backgroundColor: rarityInfo.borderColor + '25', borderColor: rarityInfo.borderColor + '60' }]}>
                <Text style={[styles.rarityText, { color: rarityInfo.borderColor }]}>
                  {rarityInfo.label}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContent}>
            {isSelected ? (
              <View style={styles.selectedIndicator}>
                <View style={[styles.selectedDot, { backgroundColor: colors.accent }]} />
              </View>
            ) : (
              <Text style={styles.plusIcon}>+</Text>
            )}
          </View>
        )}

        {/* Glass overlay for filled cells */}
        {cell.isLocked && cell.isCorrect && (
          <View style={styles.glassOverlay}>
            <LinearGradient
              colors={['transparent', colors.correct + '08']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    aspectRatio: 1,
    margin: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  empty: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.glow(colors.accent),
  },
  correct: {
    backgroundColor: '#0D1F14',
    borderWidth: 2,
    borderColor: colors.correct + '80',
    ...shadows.sm,
  },
  incorrect: {
    backgroundColor: '#1F0D0D',
    borderWidth: 2,
    borderColor: colors.incorrect + '60',
  },
  answerContent: {
    alignItems: 'center',
    padding: spacing.xs,
    zIndex: 1,
  },
  logoBg: {
    position: 'absolute',
    top: -4,
    right: -4,
    opacity: 0.5,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.heavy,
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  playerSchool: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: typography.fontWeight.medium,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  plusIcon: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.regular,
  },
  rarityBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 7,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 1.5,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
