import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, shadows } from '@/lib/theme';
import { useTeamTheme } from '@/lib/team-theme-context';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Play: '////',
    Fantasy: 'FF',
    Predict: 'ML',
    Social: 'LB',
    Profile: 'ID',
  };

  const { teamTheme } = useTeamTheme();

  return (
    <View style={styles.tabIconWrapper}>
      <Text style={[
        styles.icon,
        focused && { color: teamTheme.primary, opacity: 1 },
      ]}>
        {icons[label] ?? '//'}
      </Text>
      {focused && <View style={[styles.activeIndicator, { backgroundColor: teamTheme.primary }]} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderHeavy,
          borderTopWidth: 2,
          height: 88,
          paddingBottom: 22,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.heavy,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomWidth: 2,
          borderBottomColor: colors.borderHeavy,
          ...shadows.sm,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: typography.fontWeight.heavy,
          fontSize: typography.fontSize.lg,
          letterSpacing: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Play',
          tabBarIcon: ({ focused }) => <TabIcon label="Play" focused={focused} />,
          headerTitle: 'GRIDIRON IQ',
          headerTitleStyle: {
            fontWeight: typography.fontWeight.heavy,
            fontSize: typography.fontSize.xl,
            color: colors.accent,
            letterSpacing: 4,
          },
        }}
      />
      <Tabs.Screen
        name="fantasy"
        options={{
          title: 'Fantasy',
          tabBarIcon: ({ focused }) => <TabIcon label="Fantasy" focused={focused} />,
          headerTitle: 'FANTASY',
        }}
      />
      <Tabs.Screen
        name="predict"
        options={{
          title: 'Predict',
          tabBarIcon: ({ focused }) => <TabIcon label="Predict" focused={focused} />,
          headerTitle: 'PREDICTIONS',
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ focused }) => <TabIcon label="Social" focused={focused} />,
          headerTitle: 'LEADERBOARD',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
          headerTitle: 'PROFILE',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 13,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 1,
    color: colors.textMuted,
    opacity: 0.5,
    fontFamily: typography.fontFamily.mono,
  },
  activeIndicator: {
    width: 20,
    height: 2,
    marginTop: 4,
  },
});
