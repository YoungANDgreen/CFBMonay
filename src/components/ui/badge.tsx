import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '@/lib/theme';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({
  label,
  color = colors.accent,
  textColor = colors.black,
  size = 'sm',
}: BadgeProps) {
  return (
    <View style={[styles.base, sizeStyles[size], { backgroundColor: color }]}>
      <Text style={[styles.text, sizeText[size], { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  md: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
};

const sizeText: Record<string, TextStyle> = {
  sm: { fontSize: typography.fontSize.xs },
  md: { fontSize: typography.fontSize.sm },
};
