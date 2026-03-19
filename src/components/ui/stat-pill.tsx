import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';

interface StatPillProps {
  label: string;
  value: string | number;
  color?: string;
  size?: 'sm' | 'md';
}

export function StatPill({ label, value, color = colors.accent, size = 'md' }: StatPillProps) {
  const sizeStyles = SIZE_MAP[size];

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <Text style={[styles.label, sizeStyles.label]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.value, sizeStyles.value, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const SIZE_MAP: Record<'sm' | 'md', { container: ViewStyle; label: TextStyle; value: TextStyle }> = {
  sm: {
    container: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    label: {
      fontSize: 9,
    },
    value: {
      fontSize: typography.fontSize.xs,
    },
  },
  md: {
    container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    label: {
      fontSize: typography.fontSize.xs,
    },
    value: {
      fontSize: typography.fontSize.sm,
    },
  },
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  label: {
    color: colors.textMuted,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  value: {
    fontWeight: typography.fontWeight.bold,
  },
});
