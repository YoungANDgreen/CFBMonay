import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, shadows } from '@/lib/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Play: '🎮',
    Fantasy: '🏈',
    Predict: '🤖',
    Social: '🏆',
    Profile: '👤',
  };

  return (
    <View style={styles.tabIconWrapper}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {icons[label] ?? '•'}
      </Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopColor: colors.border + '60',
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 22,
          paddingTop: 10,
          ...shadows.lg,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: colors.primary,
          ...shadows.md,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: typography.fontWeight.bold,
          fontSize: typography.fontSize.lg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Play',
          tabBarIcon: ({ focused }) => <TabIcon label="Play" focused={focused} />,
          headerTitle: 'GridIron IQ',
          headerTitleStyle: {
            fontWeight: typography.fontWeight.heavy,
            fontSize: typography.fontSize.xl,
            color: colors.accent,
          },
        }}
      />
      <Tabs.Screen
        name="fantasy"
        options={{
          title: 'Fantasy',
          tabBarIcon: ({ focused }) => <TabIcon label="Fantasy" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="predict"
        options={{
          title: 'Predict',
          tabBarIcon: ({ focused }) => <TabIcon label="Predict" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ focused }) => <TabIcon label="Social" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
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
    fontSize: 24,
    opacity: 0.5,
  },
  iconFocused: {
    opacity: 1,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 3,
  },
});
