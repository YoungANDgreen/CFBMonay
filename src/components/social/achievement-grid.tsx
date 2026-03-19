import React, { useCallback, useMemo, useState } from 'react';
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
import type { Achievement, UserAchievement, AchievementCategory } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AchievementGridProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
}

type CategoryFilter = 'all' | AchievementCategory;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS: { label: string; value: CategoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Games', value: 'games' },
  { label: 'Prediction', value: 'prediction' },
  { label: 'Fantasy', value: 'fantasy' },
  { label: 'Social', value: 'social' },
  { label: 'Streak', value: 'streak' },
];

const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common: colors.rarityCommon,
  uncommon: colors.correct,
  rare: colors.statStackBlue,
  legendary: '#FFD700',
};

const RARITY_LABELS: Record<Achievement['rarity'], string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AchievementGrid({
  achievements,
  userAchievements,
}: AchievementGridProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  // Map user achievements by id for O(1) lookup
  const userMap = useMemo(() => {
    const map = new Map<string, UserAchievement>();
    userAchievements.forEach((ua) => map.set(ua.achievementId, ua));
    return map;
  }, [userAchievements]);

  // Filtered list
  const filtered = useMemo(() => {
    if (activeCategory === 'all') return achievements;
    return achievements.filter((a) => a.category === activeCategory);
  }, [achievements, activeCategory]);

  // ------------------------------------------------------------------
  // Renderers
  // ------------------------------------------------------------------

  const renderCategoryChip = useCallback(
    ({ label, value }: { label: string; value: CategoryFilter }) => {
      const isActive = value === activeCategory;
      return (
        <TouchableOpacity
          key={value}
          onPress={() => setActiveCategory(value)}
          style={[styles.chip, isActive && styles.chipActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeCategory],
  );

  const renderAchievement = useCallback(
    ({ item }: { item: Achievement }) => {
      const userAchievement = userMap.get(item.id);
      const isComplete = userAchievement?.isComplete ?? false;
      const progress = userAchievement?.progress ?? 0;
      const progressRatio =
        item.requirement > 0 ? Math.min(progress / item.requirement, 1) : 0;
      const hasProgress = userAchievement != null && !isComplete;
      const rarityColor = RARITY_COLORS[item.rarity];

      const cardStyle: ViewStyle = {
        ...styles.achievementCard,
        ...(isComplete ? {} : styles.achievementCardDimmed),
      };

      return (
        <View style={styles.cardWrapper}>
          <Card style={cardStyle}>
            {/* Checkmark overlay */}
            {isComplete && (
              <View style={styles.checkOverlay}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}

            {/* Icon */}
            <Text style={styles.achievementIcon}>{item.icon}</Text>

            {/* Name */}
            <Text style={styles.achievementName} numberOfLines={2}>
              {item.name}
            </Text>

            {/* Description */}
            <Text style={styles.achievementDescription} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Rarity badge */}
            <Badge
              label={RARITY_LABELS[item.rarity]}
              color={rarityColor}
              textColor={
                item.rarity === 'common' ? colors.primary : colors.textPrimary
              }
              size="sm"
            />

            {/* Progress bar (only if in progress, not complete) */}
            {hasProgress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(progressRatio * 100)}%`,
                        backgroundColor: rarityColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {progress}/{item.requirement}
                </Text>
              </View>
            )}
          </Card>
        </View>
      );
    },
    [userMap],
  );

  const keyExtractor = useCallback((item: Achievement) => item.id, []);

  // Header: category filter tabs
  const ListHeader = useMemo(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CATEGORY_OPTIONS.map(renderCategoryChip)}
      </ScrollView>
    ),
    [renderCategoryChip],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderAchievement}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
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
  columnWrapper: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  // Chip filter row
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm,
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

  // Achievement cards
  cardWrapper: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  achievementCard: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    minHeight: 200,
  },
  achievementCardDimmed: {
    opacity: 0.55,
  },

  // Check overlay
  checkOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.correct,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.heavy,
    color: colors.textPrimary,
  },

  // Achievement content
  achievementIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  achievementName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 16,
  },

  // Progress bar
  progressContainer: {
    width: '100%',
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: typography.fontWeight.medium,
  },
});
