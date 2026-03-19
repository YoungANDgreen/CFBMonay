import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  LeaderboardEntry,
  LeaderboardType,
  LeaderboardTimeframe,
} from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  userRank: number | null;
  currentType: LeaderboardType;
  currentTimeframe: LeaderboardTimeframe;
  onTypeChange: (type: LeaderboardType) => void;
  onTimeframeChange: (timeframe: LeaderboardTimeframe) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_OPTIONS: { label: string; value: LeaderboardType }[] = [
  { label: 'Overall', value: 'overall' },
  { label: 'Grid', value: 'grid' },
  { label: 'Stat Stack', value: 'stat_stack' },
  { label: 'Prediction', value: 'prediction' },
  { label: 'Fantasy', value: 'fantasy' },
  { label: 'Weekly', value: 'weekly' },
];

const TIMEFRAME_OPTIONS: { label: string; value: LeaderboardTimeframe }[] = [
  { label: 'All Time', value: 'all_time' },
  { label: 'Season', value: 'season' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Weekly', value: 'weekly' },
];

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeaderboardView({
  entries,
  userRank,
  currentType,
  currentTimeframe,
  onTypeChange,
  onTimeframeChange,
}: LeaderboardViewProps) {
  const userEntry = useMemo(() => {
    if (userRank === null) return null;
    return entries.find((e) => e.rank === userRank) ?? null;
  }, [entries, userRank]);

  const renderTypeChip = useCallback(
    ({ label, value }: { label: string; value: LeaderboardType }) => {
      const isActive = value === currentType;
      return (
        <TouchableOpacity
          key={value}
          onPress={() => onTypeChange(value)}
          style={[styles.chip, isActive && styles.chipActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    },
    [currentType, onTypeChange],
  );

  const renderTimeframeChip = useCallback(
    ({ label, value }: { label: string; value: LeaderboardTimeframe }) => {
      const isActive = value === currentTimeframe;
      return (
        <TouchableOpacity
          key={value}
          onPress={() => onTimeframeChange(value)}
          style={[styles.chip, isActive && styles.chipActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    },
    [currentTimeframe, onTimeframeChange],
  );

  const renderEntry = useCallback(
    ({ item }: { item: LeaderboardEntry }) => {
      const isCurrentUser = userRank !== null && item.rank === userRank;
      const rankColor = RANK_COLORS[item.rank] ?? colors.textSecondary;
      const isTopThree = item.rank <= 3;
      const initial = item.username.charAt(0).toUpperCase();

      const rowStyle: ViewStyle = {
        ...styles.row,
        ...(isCurrentUser ? styles.rowHighlighted : {}),
      };

      return (
        <View style={rowStyle}>
          {/* Rank */}
          <View style={styles.rankContainer}>
            <Text
              style={[
                styles.rankText,
                isTopThree && { color: rankColor, fontWeight: typography.fontWeight.heavy },
              ]}
            >
              {item.rank}
            </Text>
          </View>

          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              isTopThree && { borderColor: rankColor, borderWidth: 2 },
            ]}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          {/* Info */}
          <View style={styles.entryInfo}>
            <Text style={styles.username} numberOfLines={1}>
              {item.username}
            </Text>
            {item.favoriteTeam ? (
              <Badge label={item.favoriteTeam} size="sm" />
            ) : null}
          </View>

          {/* Score */}
          <Text style={styles.score}>{item.score.toLocaleString()}</Text>
        </View>
      );
    },
    [userRank],
  );

  const keyExtractor = useCallback(
    (item: LeaderboardEntry) => `${item.userId}-${item.rank}`,
    [],
  );

  // ------------------------------------------------------------------
  // Header: type chips + timeframe chips + user rank card
  // ------------------------------------------------------------------
  const ListHeader = useMemo(
    () => (
      <View>
        {/* Type filter row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {TYPE_OPTIONS.map(renderTypeChip)}
        </ScrollView>

        {/* Timeframe filter row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {TIMEFRAME_OPTIONS.map(renderTimeframeChip)}
        </ScrollView>

        {/* Current user rank card */}
        {userEntry && (
          <Card style={{ ...styles.userRankCard, ...shadows.glow(colors.accent) }}>
            <View style={styles.userRankInner}>
              <Text style={styles.userRankLabel}>Your Rank</Text>
              <Text style={styles.userRankNumber}>#{userEntry.rank}</Text>
              <Text style={styles.userRankScore}>
                {userEntry.score.toLocaleString()} pts
              </Text>
            </View>
          </Card>
        )}
      </View>
    ),
    [userEntry, renderTypeChip, renderTimeframeChip],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={keyExtractor}
        renderItem={renderEntry}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },

  // Chip filter rows
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },

  // User rank card
  userRankCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceHighlight,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  userRankInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRankLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  userRankNumber: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
    color: colors.accent,
  },
  userRankScore: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },

  // Leaderboard rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowHighlighted: {
    backgroundColor: `${colors.accent}20`,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rankText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  entryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  username: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  score: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginLeft: spacing.sm,
  },
});
