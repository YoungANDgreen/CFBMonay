import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { colors, spacing } from '@/lib/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  padded?: boolean;
}

export function ScreenWrapper({
  children,
  scrollable = true,
  style,
  contentStyle,
  padded = true,
}: ScreenWrapperProps) {
  const paddingStyle: ViewStyle = padded
    ? { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }
    : {};

  return (
    <View style={[styles.container, style]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, paddingStyle, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.staticContent, paddingStyle, contentStyle]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
});
