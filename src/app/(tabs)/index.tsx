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
import { useTeamTheme } from '@/lib/team-theme-context';
import { TeamLogo } from '@/components/ui/team-logo';
import { Badge } from '@/components/ui/badge';

interface GameCardData {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  accentColor: string;
  gradient: string[];
  route: string;
  badge?: string;
}

const GAMES: GameCardData[] = [
  {
    id: 'grid',
    title: 'THE GRID',
    subtitle: 'Daily 3x3 puzzle — match players to criteria',
    tag: '01',
    accentColor: colors.gridGreen,
    gradient: gameGradients.grid,
    route: '/games/grid',
    badge: 'DAILY',
  },
  {
    id: 'stat-stack',
    title: 'STAT STACK',
    subtitle: 'Pick 5 players to maximize today\'s stat',
    tag: '02',
    accentColor: colors.statStackBlue,
    gradient: gameGradients.statStack,
    route: '/games/stat-stack',
    badge: 'DAILY',
  },
  {
    id: 'clash',
    title: 'CONFERENCE CLASH',
    subtitle: 'Head-to-head knowledge battles',
    tag: '03',
    accentColor: colors.clashRed,
    gradient: gameGradients.clash,
    route: '/games/clash',
    badge: 'LIVE',
  },
  {
    id: 'dynasty',
    title: 'DYNASTY BUILDER',
    subtitle: 'Build your all-time program roster',
    tag: '04',
    accentColor: colors.dynastyPurple,
    gradient: gameGradients.dynasty,
    route: '/games/dynasty',
  },
  {
    id: 'predictions',
    title: 'PREDICTION ARENA',
    subtitle: 'Beat the ML model — predict game outcomes',
    tag: '05',
    accentColor: colors.predictionOrange,
    gradient: gameGradients.prediction,
    route: '/games/predictions',
    badge: 'ML',
  },
];

export default function PlayScreen() {
  const router = useRouter();
  const { teamTheme, favoriteTeam } = useTeamTheme();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>GAME{'\n'}DAY</Text>
            <View style={[styles.heroAccent, { backgroundColor: teamTheme.primary }]} />
          </View>
          {favoriteTeam && (
            <View style={styles.heroLogo}>
              <TeamLogo school={favoriteTeam} size={64} />
            </View>
          )}
        </View>
        <Text style={styles.heroDate}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }).toUpperCase()}
        </Text>
      </View>

      {/* Daily Challenge Banner */}
      <TouchableOpacity
        style={[styles.dailyBanner, { borderLeftColor: teamTheme.primary }]}
        onPress={() => router.push('/games/grid' as never)}
        activeOpacity={0.8}
      >
        <View style={styles.dailyBannerContent}>
          <View style={styles.dailyBannerLeft}>
            <Text style={[styles.dailyBannerLabel, { color: teamTheme.primary }]}>DAILY CHALLENGE</Text>
            <Text style={styles.dailyBannerDesc}>
              Complete The Grid + Stat Stack for bonus XP
            </Text>
          </View>
          <View style={[styles.dailyBannerArrow, { backgroundColor: teamTheme.primary }]}>
            <Text style={[styles.dailyBannerArrowText, { color: teamTheme.text }]}>GO</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>GAMES</Text>
        <View style={[styles.sectionLine, { backgroundColor: teamTheme.primary }]} />
      </View>

      {/* Game Cards */}
      {GAMES.map((game) => (
        <TouchableOpacity
          key={game.id}
          style={styles.gameCard}
          onPress={() => router.push(game.route as never)}
          activeOpacity={0.8}
        >
          {/* Left accent bar */}
          <View style={[styles.gameAccentBar, { backgroundColor: game.accentColor }]} />

          <View style={styles.gameCardInner}>
            {/* Tag number */}
            <Text style={[styles.gameTag, { color: game.accentColor }]}>{game.tag}</Text>

            {/* Info block */}
            <View style={styles.gameInfo}>
              <View style={styles.gameTitleRow}>
                <Text style={styles.gameTitle}>{game.title}</Text>
                {game.badge && (
                  <Badge label={game.badge} color={game.accentColor} textColor="#000" size="sm" />
                )}
              </View>
              <Text style={styles.gameSubtitle}>{game.subtitle}</Text>
            </View>

            {/* Arrow */}
            <View style={[styles.gameArrow, { borderColor: game.accentColor }]}>
              <Text style={[styles.gameArrowText, { color: game.accentColor }]}>&#x203A;</Text>
            </View>
          </View>

          {/* Bottom accent line */}
          <View style={[styles.gameBottomLine, { backgroundColor: game.accentColor + '30' }]} />
        </TouchableOpacity>
      ))}

      {/* Stats Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>YOUR STATS</Text>
        <View style={[styles.sectionLine, { backgroundColor: teamTheme.primary }]} />
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'STREAK', value: '0', color: colors.predictionOrange },
          { label: 'BEST GRID', value: '--', color: colors.gridGreen },
          { label: 'PREDICT %', value: '--', color: colors.statStackBlue },
        ].map((stat, i) => (
          <View key={i} style={[styles.statBlock, i > 0 && styles.statBlockBorder]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
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
    paddingBottom: spacing.xxl + 20,
  },

  // Hero
  hero: {
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextBlock: {},
  heroTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: -1,
    lineHeight: 46,
  },
  heroAccent: {
    width: 60,
    height: 4,
    marginTop: spacing.sm,
  },
  heroLogo: {
    marginTop: spacing.xs,
  },
  heroDate: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 3,
    marginTop: spacing.md,
  },

  // Daily Banner
  dailyBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  dailyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  dailyBannerLeft: {
    flex: 1,
  },
  dailyBannerLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 3,
    marginBottom: 4,
  },
  dailyBannerDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  dailyBannerArrow: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  dailyBannerArrowText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 2,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 4,
    marginRight: spacing.sm,
  },
  sectionLine: {
    flex: 1,
    height: 2,
  },

  // Game Cards
  gameCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  gameAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  gameCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.md + 8,
  },
  gameTag: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
    width: 40,
    opacity: 0.3,
  },
  gameInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  gameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  gameTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 2,
  },
  gameSubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: 3,
  },
  gameArrow: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  gameArrowText: {
    fontSize: 20,
    fontWeight: typography.fontWeight.heavy,
    marginTop: -2,
  },
  gameBottomLine: {
    height: 1,
    marginHorizontal: spacing.md,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statBlockBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
});
