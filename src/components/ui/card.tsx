import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'highlighted' | 'game';
  accentColor?: string;
}

export function Card({ children, style, variant = 'default', accentColor }: CardProps) {
  return (
    <View style={[styles.base, variantStyles[variant], accentColor && { borderLeftWidth: 4, borderLeftColor: accentColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    ...shadows.sm,
  },
});

const variantStyles: Record<string, ViewStyle> = {
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlighted: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  game: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.borderHeavy,
  },
};
