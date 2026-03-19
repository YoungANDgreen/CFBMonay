import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Base Skeleton
// ---------------------------------------------------------------------------

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius: radius = borderRadius.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as Animated.WithAnimatedValue<ViewStyle['width']>,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceHighlight,
          opacity,
        },
        style as Animated.WithAnimatedValue<ViewStyle>,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Preset Skeletons
// ---------------------------------------------------------------------------

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="60%" height={18} borderRadius={borderRadius.sm} />
      <Skeleton
        width="100%"
        height={12}
        borderRadius={borderRadius.sm}
        style={{ marginTop: spacing.sm }}
      />
      <Skeleton
        width="80%"
        height={12}
        borderRadius={borderRadius.sm}
        style={{ marginTop: spacing.xs }}
      />
      <Skeleton
        width="40%"
        height={32}
        borderRadius={borderRadius.md}
        style={{ marginTop: spacing.md }}
      />
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <Skeleton
        width={40}
        height={40}
        borderRadius={borderRadius.full}
      />
      <View style={styles.listItemText}>
        <Skeleton width="70%" height={14} borderRadius={borderRadius.sm} />
        <Skeleton
          width="45%"
          height={10}
          borderRadius={borderRadius.sm}
          style={{ marginTop: spacing.xs }}
        />
      </View>
    </View>
  );
}

export function StatSkeleton() {
  return (
    <View style={styles.stat}>
      <Skeleton width={48} height={28} borderRadius={borderRadius.sm} />
      <Skeleton
        width={64}
        height={10}
        borderRadius={borderRadius.sm}
        style={{ marginTop: spacing.xs }}
      />
    </View>
  );
}

export function GameCardSkeleton() {
  return (
    <View style={styles.gameCard}>
      {/* Team row */}
      <View style={styles.gameRow}>
        <Skeleton width={32} height={32} borderRadius={borderRadius.full} />
        <Skeleton
          width="40%"
          height={14}
          borderRadius={borderRadius.sm}
          style={{ marginLeft: spacing.sm }}
        />
        <View style={{ flex: 1 }} />
        <Skeleton width={28} height={20} borderRadius={borderRadius.sm} />
      </View>

      <View style={styles.gameDivider} />

      {/* Team row */}
      <View style={styles.gameRow}>
        <Skeleton width={32} height={32} borderRadius={borderRadius.full} />
        <Skeleton
          width="40%"
          height={14}
          borderRadius={borderRadius.sm}
          style={{ marginLeft: spacing.sm }}
        />
        <View style={{ flex: 1 }} />
        <Skeleton width={28} height={20} borderRadius={borderRadius.sm} />
      </View>

      {/* Footer */}
      <Skeleton
        width="50%"
        height={10}
        borderRadius={borderRadius.sm}
        style={{ marginTop: spacing.md, alignSelf: 'center' }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  listItemText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  gameDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
});
