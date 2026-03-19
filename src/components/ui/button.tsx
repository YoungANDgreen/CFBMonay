import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '@/lib/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accentColor?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  accentColor,
}: ButtonProps) {
  const dynamicContainer: ViewStyle = {};
  const dynamicText: TextStyle = {};

  if (accentColor) {
    if (variant === 'primary') {
      dynamicContainer.backgroundColor = accentColor;
    } else if (variant === 'outline') {
      dynamicContainer.borderColor = accentColor;
      dynamicText.color = accentColor;
    } else if (variant === 'ghost') {
      dynamicText.color = accentColor;
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeStyles[size],
        variantContainerStyles[variant],
        dynamicContainer,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? (accentColor || colors.accent) : colors.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.text, sizeTextStyles[size], variantTextStyles[variant], dynamicText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, minHeight: 32 },
  md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, minHeight: 44 },
  lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 52 },
};

const sizeTextStyles: Record<string, TextStyle> = {
  sm: { fontSize: typography.fontSize.xs },
  md: { fontSize: typography.fontSize.sm },
  lg: { fontSize: typography.fontSize.md },
};

const variantContainerStyles: Record<string, ViewStyle> = {
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceHighlight, borderWidth: 1, borderColor: colors.border },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.accent },
  ghost: { backgroundColor: 'transparent' },
};

const variantTextStyles: Record<string, TextStyle> = {
  primary: { color: colors.black },
  secondary: { color: colors.textPrimary },
  outline: { color: colors.accent },
  ghost: { color: colors.accent },
};
