import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { colors, typography } from '@/lib/theme';
import { TeamThemeProvider } from '@/lib/team-theme-context';
import { initializeDataCache } from '@/services/data/cfbd-cache';

export default function RootLayout() {
  useEffect(() => {
    initializeDataCache();
  }, []);

  return (
    <TeamThemeProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface } as any,
            headerShadowVisible: false,
            headerTintColor: colors.textPrimary,
            headerTitleStyle: { fontWeight: typography.fontWeight.heavy, letterSpacing: 2 } as any,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="games/grid"
            options={{ title: 'THE GRID', presentation: 'card' }}
          />
          <Stack.Screen
            name="games/stat-stack"
            options={{ title: 'STAT STACK', presentation: 'card' }}
          />
          <Stack.Screen
            name="games/clash"
            options={{ title: 'CONFERENCE CLASH', presentation: 'card' }}
          />
          <Stack.Screen
            name="games/dynasty"
            options={{ title: 'DYNASTY BUILDER', presentation: 'card' }}
          />
          <Stack.Screen
            name="games/predictions"
            options={{ title: 'PREDICTION ARENA', presentation: 'card' }}
          />
        </Stack>
      </View>
    </TeamThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
