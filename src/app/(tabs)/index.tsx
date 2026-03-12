import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows, gameGradients } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GameCardData {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  gradient: string[];
  route: string;
  badge?: string;
}

const GAMES: GameCardData[] = [
  {
    id: 'grid',
    title: 'The Grid',
    subtitle: 'Daily 3x3 puzzle — match players to criteria',
    icon: '🔲',
    accentColor: colors.gridGreen,
    gradient: gameGradients.grid,
    route: '/games/grid',
    badge: 'DAILY',
  },
  {
    id: 'stat-stack',
    title: 'Stat Stack',
    subtitle: 'Pick 5 players to maximize today\'s stat',
    icon: '📊',
    accentColor: colors.statStackBlue,
    gradient: gameGradients.statStack,
    route: '/games/stat-stack',
    badge: 'DAILY',
  },
  {
    id: 'clash',
    title: 'Conference Clash',
    subtitle: 'Head-to-head knowledge battles',
    icon: '⚔️',
    accentColor: colors.clashRed,
    gradient: gameGradients.clash,
    route: '/games/clash',
    badge: 'MULTIPLAYER',
  },
  {
    id: 'dynasty',
    title: 'Dynasty Builder',
    subtitle: 'Build your all-time program roster',
    icon: '🏛️',
    accentColor: colors.dynastyPurple,
    gradient: gameGradients.dynasty,
    route: '/games/dynasty',
  },
  {
    id: 'predictions',
    title: 'Prediction Arena',
    subtitle: 'Beat the ML model — predict game outcomes',
    icon: '🤖',
    accentColor: colors.predictionOrange,
    gradient: gameGradients.prediction,
    route: '/games/predictions',
    badge: 'ML-POWERED',
  },
];

export default function PlayScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Game Day</Text>
        <Text style={styles.heroSubtitle}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Daily Challenge Banner */}
      <TouchableOpacity
        style={styles.dailyBanner}
        onPress={() => router.push('/games/grid' as never)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.accent + '25', colors.accent + '08']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dailyBannerGradient}
        >
          <View style={styles.dailyBannerContent}>
            <Text style={styles.dailyBannerIcon}>🏆</Text>
            <View style={styles.dailyBannerText}>
              <Text style={styles.dailyBannerTitle}>Daily Challenge</Text>
              <Text style={styles.dailyBannerSub}>
                Complete The Grid + Stat Stack for bonus XP
              </Text>
            </View>
            <Text style={styles.dailyBannerArrow}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Game Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Games</Text>
        <View style={styles.sectionAccent} />
      </View>
      {GAMES.map((game) => (
        <TouchableOpacity
          key={game.id}
          style={styles.gameCard}
          onPress={() => router.push(game.route as never)}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[game.gradient[0] + '30', game.gradient[1] + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gameCardGradient}
          >
            <View style={[styles.gameIconContainer, { backgroundColor: game.accentColor + '25' }]}>
              <Text style={styles.gameIcon}>{game.icon}</Text>
            </View>
            <View style={styles.gameInfo}>
              <View style={styles.gameTitleRow}>
                <Text style={styles.gameTitle}>{game.title}</Text>
                {game.badge && (
                  <Badge label={game.badge} color={game.accentColor} textColor="#fff" size="sm" />
                )}
              </View>
              <Text style={styles.gameSubtitle}>{game.subtitle}</Text>
            </View>
            <View style={styles.gameArrowContainer}>
              <Text style={[styles.gameArrow, { color: game.accentColor }]}>›</Text>
            </View>
          </LinearGradient>
          {/* Left accent bar */}
          <View style={[styles.gameAccentBar, { backgroundColor: game.accentColor }]} />
        </TouchableOpacity>
      ))}

      {/* Quick Stats */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.sectionAccent} />
      </View>
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={styles.statNumber}>--</Text>
          <Text style={styles.statLabel}>Best Grid</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statEmoji}>🧠</Text>
          <Text style={styles.statNumber}>--</Text>
          <Text style={styles.statLabel}>Prediction %</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  hero: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
  },
  dailyBanner: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  dailyBannerGradient: {
    padding: spacing.md,
  },
  dailyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyBannerIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  dailyBannerText: {
    flex: 1,
  },
  dailyBannerTitle: {
    color: colors.accent,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  dailyBannerSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  dailyBannerArrow: {
    color: colors.accent,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  sectionAccent: {
    width: 40,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
  },
  gameCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border + '80',
    ...shadows.md,
  },
  gameCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
  },
  gameAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  gameIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  gameIcon: {
    fontSize: 28,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gameTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  gameSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: 3,
  },
  gameArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHighlight + '60',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  gameArrow: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    marginTop: -1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  statNumber: {
    color: colors.accent,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});
