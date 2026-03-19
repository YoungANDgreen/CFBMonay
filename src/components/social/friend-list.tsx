import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FriendProfile, FriendRequest } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FriendListProps {
  friends: FriendProfile[];
  pendingRequests: FriendRequest[];
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  onOpenChat: (friendId: string) => void;
}

type ListItem =
  | { kind: 'section_header'; title: string }
  | { kind: 'request'; data: FriendRequest }
  | { kind: 'friend'; data: FriendProfile }
  | { kind: 'empty' };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FriendList({
  friends,
  pendingRequests,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriend,
  onOpenChat,
}: FriendListProps) {
  // Build a single flat list of heterogeneous items for optimal performance.
  const listData: ListItem[] = [];

  if (pendingRequests.length > 0) {
    listData.push({ kind: 'section_header', title: 'Pending Requests' });
    pendingRequests.forEach((r) => listData.push({ kind: 'request', data: r }));
  }

  if (friends.length > 0) {
    listData.push({ kind: 'section_header', title: 'Friends' });
    friends.forEach((f) => listData.push({ kind: 'friend', data: f }));
  }

  if (friends.length === 0 && pendingRequests.length === 0) {
    listData.push({ kind: 'empty' });
  }

  // ------------------------------------------------------------------
  // Renderers
  // ------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      switch (item.kind) {
        case 'section_header':
          return <Text style={styles.sectionHeader}>{item.title}</Text>;

        case 'request':
          return (
            <RequestRow
              request={item.data}
              onAccept={onAcceptRequest}
              onDecline={onDeclineRequest}
            />
          );

        case 'friend':
          return (
            <FriendRow
              friend={item.data}
              onRemove={onRemoveFriend}
              onChat={onOpenChat}
            />
          );

        case 'empty':
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No Friends Yet</Text>
              <Text style={styles.emptySubtitle}>
                Search for players to send friend requests and start competing together.
              </Text>
            </View>
          );
      }
    },
    [onAcceptRequest, onDeclineRequest, onRemoveFriend, onOpenChat],
  );

  const keyExtractor = useCallback((_item: ListItem, index: number) => {
    if (_item.kind === 'request') return `req-${_item.data.id}`;
    if (_item.kind === 'friend') return `fr-${_item.data.userId}`;
    if (_item.kind === 'section_header') return `hdr-${_item.title}`;
    return `empty-${index}`;
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RequestRow({
  request,
  onAccept,
  onDecline,
}: {
  request: FriendRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const initial = request.fromUsername.charAt(0).toUpperCase();

  return (
    <Card style={{ ...styles.requestCard }}>
      <View style={styles.requestInner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.requestUsername} numberOfLines={1}>
          {request.fromUsername}
        </Text>
        <View style={styles.requestActions}>
          <Button
            title="Accept"
            size="sm"
            variant="primary"
            onPress={() => onAccept(request.id)}
          />
          <Button
            title="Decline"
            size="sm"
            variant="ghost"
            onPress={() => onDecline(request.id)}
          />
        </View>
      </View>
    </Card>
  );
}

function FriendRow({
  friend,
  onRemove,
  onChat,
}: {
  friend: FriendProfile;
  onRemove: (id: string) => void;
  onChat: (id: string) => void;
}) {
  const initial = friend.username.charAt(0).toUpperCase();

  return (
    <View style={styles.friendRow}>
      {/* Online indicator + avatar */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View
          style={[
            styles.onlineDot,
            { backgroundColor: friend.isOnline ? colors.correct : colors.textMuted },
          ]}
        />
      </View>

      {/* Info */}
      <View style={styles.friendInfo}>
        <View style={styles.friendNameRow}>
          <Text style={styles.friendUsername} numberOfLines={1}>
            {friend.username}
          </Text>
          {friend.displayName !== friend.username && (
            <Text style={styles.friendDisplayName} numberOfLines={1}>
              {friend.displayName}
            </Text>
          )}
        </View>
        <View style={styles.friendMeta}>
          {friend.favoriteTeam ? (
            <Badge label={friend.favoriteTeam} size="sm" />
          ) : null}
          <Text style={styles.eloText}>Elo {friend.eloRating}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => onChat(friend.userId)}
          activeOpacity={0.7}
        >
          <Text style={styles.chatButtonText}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(friend.userId)}
          activeOpacity={0.7}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
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

  // Section headers
  sectionHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },

  // Request card
  requestCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  requestInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestUsername: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },

  // Friend row
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Avatar
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.background,
  },

  // Friend info
  friendInfo: {
    flex: 1,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  friendUsername: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  friendDisplayName: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    flexShrink: 1,
  },
  friendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  eloText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },

  // Actions
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    fontSize: typography.fontSize.lg,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontWeight: typography.fontWeight.bold,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
