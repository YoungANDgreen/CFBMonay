import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DraftState, DraftPick, FantasyPlayerInfo } from '@/types';

interface DraftRoomProps {
  draft: DraftState;
  myTeamId: string;
  onPick: (playerId: string) => void;
  onAutoPick: () => void;
  onClose: () => void;
}

export function DraftRoom({ draft, myTeamId, onPick, onAutoPick, onClose }: DraftRoomProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string | null>(null);

  const isMyPick = draft.draftOrder[draft.currentPick % draft.draftOrder.length] === myTeamId ||
    getSnakePickTeam(draft) === myTeamId;

  const filteredPlayers = draft.availablePlayers.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.school.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = !positionFilter || p.position === positionFilter;
    return matchesSearch && matchesPosition;
  }).sort((a, b) => a.adp - b.adp);

  const myPicks = draft.picks.filter(p => p.teamId === myTeamId);
  const recentPicks = draft.picks.slice(-5).reverse();

  if (draft.status === 'complete') {
    return (
      <View style={styles.container}>
        <View style={styles.completeHeader}>
          <Text style={styles.completeTitle}>Draft Complete!</Text>
          <Text style={styles.completeSubtitle}>
            {draft.picks.length} picks made across {draft.totalRounds} rounds
          </Text>
        </View>
        <Text style={styles.sectionTitle}>Your Picks</Text>
        {myPicks.map(pick => (
          <View key={pick.pickNumber} style={styles.pickRow}>
            <Badge label={`R${pick.round}`} color={colors.fantasyTeal} textColor="#fff" />
            <Text style={styles.pickName}>{pick.playerName}</Text>
            <Text style={styles.pickPos}>{pick.position}</Text>
          </View>
        ))}
        <Button title="Go to My Team" onPress={onClose} variant="primary" style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Draft Header */}
      <View style={styles.draftHeader}>
        <View>
          <Text style={styles.draftTitle}>
            Round {draft.currentRound + 1}, Pick {(draft.currentPick % draft.draftOrder.length) + 1}
          </Text>
          <Text style={styles.draftMeta}>
            {draft.picks.length}/{draft.totalRounds * draft.draftOrder.length} picks
          </Text>
        </View>
        {isMyPick ? (
          <Badge label="YOUR PICK" color={colors.correct} textColor="#fff" />
        ) : (
          <Badge label="Waiting..." color={colors.textMuted} textColor="#fff" />
        )}
      </View>

      {/* Recent Picks */}
      {recentPicks.length > 0 && (
        <View style={styles.recentPicks}>
          {recentPicks.map(pick => (
            <View key={pick.pickNumber} style={styles.recentPick}>
              <Text style={styles.recentPickNum}>#{pick.pickNumber}</Text>
              <Text style={styles.recentPickPlayer}>{pick.playerName}</Text>
              <Text style={styles.recentPickPos}>{pick.position}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Position Filters */}
      <View style={styles.filterRow}>
        {['All', 'QB', 'RB', 'WR', 'TE', 'K'].map(pos => (
          <TouchableOpacity
            key={pos}
            style={[
              styles.filterChip,
              (pos === 'All' ? !positionFilter : positionFilter === pos) && styles.filterChipActive,
            ]}
            onPress={() => setPositionFilter(pos === 'All' ? null : pos)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterText,
              (pos === 'All' ? !positionFilter : positionFilter === pos) && styles.filterTextActive,
            ]}>
              {pos}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search players..."
        placeholderTextColor={colors.textMuted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Available Players */}
      <FlatList
        data={filteredPlayers.slice(0, 50)}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.playerRow}
            onPress={() => isMyPick && onPick(item.id)}
            activeOpacity={isMyPick ? 0.7 : 1}
            disabled={!isMyPick}
          >
            <View style={styles.playerAdp}>
              <Text style={styles.adpText}>{item.adp}</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{item.name}</Text>
              <Text style={styles.playerMeta}>{item.position} · {item.school} · {item.conference}</Text>
            </View>
            <View style={styles.playerProj}>
              <Text style={styles.projPoints}>{item.projectedPoints.toFixed(1)}</Text>
              <Text style={styles.projLabel}>proj</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No players match your search</Text>
        }
        style={styles.playerList}
      />

      {/* Auto-pick button */}
      {isMyPick && (
        <View style={styles.actionBar}>
          <Button title="Auto Pick" onPress={onAutoPick} variant="outline" style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
}

function getSnakePickTeam(draft: DraftState): string {
  const teamCount = draft.draftOrder.length;
  const round = draft.currentRound;
  const pickInRound = draft.currentPick % teamCount;

  if (draft.draftType === 'snake' && round % 2 === 1) {
    return draft.draftOrder[teamCount - 1 - pickInRound];
  }
  return draft.draftOrder[pickInRound];
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  draftTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  draftMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  recentPicks: { marginBottom: spacing.md },
  recentPick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  recentPickNum: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    width: 30,
  },
  recentPickPlayer: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  recentPickPos: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.fantasyTeal + '20',
    borderColor: colors.fantasyTeal,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  filterTextActive: {
    color: colors.fantasyTeal,
    fontWeight: typography.fontWeight.bold,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  playerList: { flex: 1 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  playerAdp: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  adpText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  playerInfo: { flex: 1 },
  playerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  playerMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  playerProj: { alignItems: 'flex-end' },
  projPoints: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  projLabel: {
    color: colors.textMuted,
    fontSize: 9,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  actionBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  completeHeader: { alignItems: 'center', paddingVertical: spacing.xl },
  completeTitle: {
    color: colors.fantasyTeal,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  completeSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  pickName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  pickPos: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});
