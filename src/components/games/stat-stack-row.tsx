import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { tapHaptic, correctHaptic, wrongHaptic } from '@/lib/haptics';
import { TeamLogo } from '@/components/ui/team-logo';
import { getAllTeams } from '@/services/data/cfbd-cache';
import type { RowConstraint, StatStackPick } from '@/types';

interface StatStackRowProps {
  constraint: RowConstraint;
  pick: StatStackPick | null;
  isActive: boolean;
  canUseTransferPortal: boolean;
  statUnit: string;
  onPress: () => void;
  onTransferPortal: () => void;
}

function getTeamColor(school: string): string {
  const teams = getAllTeams();
  const team = teams.find((t) => t.school.toLowerCase() === school.toLowerCase());
  return team?.color || colors.correct;
}

export function StatStackRow({
  constraint,
  pick,
  isActive,
  canUseTransferPortal,
  statUnit,
  onPress,
  onTransferPortal,
}: StatStackRowProps) {
  const statAnim = useRef(new Animated.Value(0)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;
  const wasFilled = useRef(pick !== null);

  // Animate stat value and fill when pick arrives
  useEffect(() => {
    if (pick && !wasFilled.current) {
      fillAnim.setValue(0);
      statAnim.setValue(0);

      Animated.parallel([
        Animated.spring(fillAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: false,
        }),
        Animated.timing(statAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start();

      if (pick.isValid) correctHaptic();
      else wrongHaptic();
    }
    wasFilled.current = pick !== null;
  }, [pick, fillAnim, statAnim]);

  const handlePress = () => {
    tapHaptic();
    onPress();
  };

  const teamColor = pick ? getTeamColor(pick.playerName.split(' ').pop() || '') : colors.correct;
  // Use school from pick context if available via parent — for now use accent
  const fillColor = pick?.isValid ? colors.correct : colors.incorrect;

  const bgOpacity = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.08],
  });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isActive && styles.active,
        pick && (pick.isValid ? styles.filled : styles.invalid),
      ]}
      onPress={handlePress}
      disabled={pick !== null && !canUseTransferPortal}
      activeOpacity={0.8}
    >
      {/* Team-color background fill on answer */}
      {pick && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: fillColor,
              opacity: bgOpacity,
              borderRadius: 4,
            },
          ]}
        />
      )}

      <View style={styles.constraintSection}>
        <View style={[styles.rowTag, isActive && { backgroundColor: colors.statStackBlue + '30', borderColor: colors.statStackBlue }]}>
          <Text style={[styles.rowNumber, isActive && { color: colors.statStackBlue }]}>
            {constraint.index + 1}
          </Text>
        </View>
        <Text style={styles.constraintText} numberOfLines={2}>{constraint.description}</Text>
        {constraint.lockedYear != null && (
          <View style={styles.yearLock}>
            <Text style={styles.yearLockText}>{constraint.lockedYear}</Text>
          </View>
        )}
      </View>

      {pick ? (
        <View style={styles.pickSection}>
          <View style={styles.pickInfo}>
            <Text style={styles.pickName}>{pick.playerName}</Text>
            <Text style={styles.pickMeta}>{pick.season}</Text>
          </View>
          <View style={[styles.statBadge, { borderColor: (pick.isValid ? colors.correct : colors.incorrect) + '40' }]}>
            <Text style={[styles.statValue, { color: pick.isValid ? colors.correct : colors.incorrect }]}>
              {pick.isValid ? pick.statValue.toLocaleString() : '---'}
            </Text>
            <Text style={styles.statUnit}>{statUnit}</Text>
          </View>
          {canUseTransferPortal && (
            <TouchableOpacity
              style={styles.transferButton}
              onPress={(e) => { e.stopPropagation?.(); onTransferPortal(); }}
            >
              <Text style={styles.transferText}>SWAP</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyPickSection}>
          <Text style={[styles.emptyText, isActive && { color: colors.statStackBlue }]}>
            {isActive ? 'SEARCH FOR A PLAYER' : 'TAP TO SELECT'}
          </Text>
          {isActive && <View style={[styles.activePulse, { backgroundColor: colors.statStackBlue }]} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  active: {
    borderColor: colors.statStackBlue,
    borderWidth: 2,
    backgroundColor: colors.surfaceLight,
  },
  filled: {
    borderColor: colors.correct + '50',
    borderLeftWidth: 4,
    borderLeftColor: colors.correct,
  },
  invalid: {
    borderColor: colors.incorrect + '40',
    borderLeftWidth: 4,
    borderLeftColor: colors.incorrect,
  },
  constraintSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rowTag: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rowNumber: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
  },
  constraintText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  yearLock: {
    backgroundColor: colors.accent + '20',
    borderWidth: 1,
    borderColor: colors.accent + '40',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  yearLockText: {
    color: colors.accent,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 0.5,
  },
  pickSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickInfo: {
    flex: 1,
  },
  pickName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 0.3,
  },
  pickMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  statBadge: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
  },
  statUnit: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  transferButton: {
    marginLeft: spacing.sm,
    backgroundColor: colors.dynastyPurple,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: 3,
  },
  transferText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 1.5,
  },
  emptyPickSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 2,
  },
  activePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: spacing.sm,
  },
});
