import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/lib/theme';

interface TabBarBadgeProps {
  count: number;
  children: React.ReactNode;
}

export function TabBarBadge({ count, children }: TabBarBadgeProps) {
  const displayCount = count > 9 ? '9+' : String(count);

  return (
    <View style={styles.container}>
      {children}
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </View>
  );
}

const BADGE_SIZE = 18;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.incorrect,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    lineHeight: 12,
  },
});
