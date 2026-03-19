import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocialStore } from '@/stores/social-store';
import type {
  LeaderboardEntry,
  LeaderboardType,
  LeaderboardTimeframe,
  FriendProfile,
  FriendRequest,
  Achievement,
  UserAchievement,
  AppNotification,
} from '@/types';

type SocialTab = 'leaderboard' | 'friends' | 'achievements' | 'notifications' | 'chat';

const TABS: { key: SocialTab; label: string; icon: string }[] = [
  { key: 'leaderboard', label: 'Rankings', icon: '🏆' },
  { key: 'friends', label: 'Friends', icon: '👥' },
  { key: 'achievements', label: 'Achievements', icon: '🎖️' },
  { key: 'notifications', label: 'Alerts', icon: '🔔' },
  { key: 'chat', label: 'Chat', icon: '💬' },
];

const LEADERBOARD_TYPES: { key: LeaderboardType; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'grid', label: 'Grid' },
  { key: 'stat_stack', label: 'Stat Stack' },
  { key: 'prediction', label: 'Prediction' },
  { key: 'fantasy', label: 'Fantasy' },
];

export default function SocialScreen() {
  const [activeTab, setActiveTab] = React.useState<SocialTab>('leaderboard');
  const store = useSocialStore();

  useEffect(() => {
    store.loadLeaderboard();
    store.loadFriends();
    store.loadAchievements();
    store.loadNotifications();
    store.loadChatRooms();
  }, []);

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Community</Text>
        <Text style={styles.heroSubtitle}>Compete. Connect. Conquer.</Text>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.key === 'notifications' && store.unreadCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{store.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView
        style={styles.tabContent}
        contentContainerStyle={styles.tabContentInner}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            entries={store.leaderboardEntries}
            userRank={store.userRank}
            currentType={store.leaderboardType}
            onTypeChange={store.setLeaderboardType}
          />
        )}
        {activeTab === 'friends' && (
          <FriendsTab
            friends={store.friends}
            pendingRequests={store.friendRequests.filter(r => r.status === 'pending')}
            onAccept={(id) => store.respondToRequest(id, true)}
            onDecline={(id) => store.respondToRequest(id, false)}
            onRemove={store.removeFriend}
          />
        )}
        {activeTab === 'achievements' && (
          <AchievementsTab
            achievements={store.allAchievements}
            userAchievements={store.userAchievements}
          />
        )}
        {activeTab === 'notifications' && (
          <NotificationsTab
            notifications={store.notifications}
            onMarkRead={store.markNotificationRead}
            onMarkAllRead={store.markAllNotificationsRead}
          />
        )}
        {activeTab === 'chat' && (
          <ChatTab
            rooms={store.chatRooms}
            activeRoom={store.activeChatRoom}
            messages={store.chatMessages}
            onOpenRoom={store.openChatRoom}
            onSendMessage={store.sendMessage}
            onCloseRoom={store.closeChatRoom}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ── Leaderboard Tab ────────────────────────────────────────────────────────────

function LeaderboardTab({
  entries,
  userRank,
  currentType,
  onTypeChange,
}: {
  entries: LeaderboardEntry[];
  userRank: number | null;
  currentType: LeaderboardType;
  onTypeChange: (type: LeaderboardType) => void;
}) {
  const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <>
      {/* Type Filter */}
      <View style={styles.filterRow}>
        {LEADERBOARD_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.filterChip, currentType === t.key && styles.filterChipActive]}
            onPress={() => onTypeChange(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, currentType === t.key && styles.filterTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Your Rank */}
      {userRank !== null && (
        <Card style={{ ...styles.yourRankCard, borderColor: colors.accent }}>
          <Text style={styles.yourRankLabel}>Your Rank</Text>
          <Text style={styles.yourRankValue}>#{userRank}</Text>
        </Card>
      )}

      {/* Leaderboard */}
      {entries.map((entry, i) => (
        <View
          key={entry.userId}
          style={[styles.lbRow, i < 3 && styles.lbRowTop3]}
        >
          <View style={[
            styles.lbRank,
            i < 3 && { backgroundColor: RANK_COLORS[i] + '30' },
          ]}>
            <Text style={[
              styles.lbRankText,
              i < 3 && { color: RANK_COLORS[i] },
            ]}>
              {entry.rank}
            </Text>
          </View>
          <View style={styles.lbAvatar}>
            <Text style={styles.lbAvatarText}>
              {entry.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.lbInfo}>
            <Text style={styles.lbUsername}>{entry.username}</Text>
            {entry.favoriteTeam && (
              <Text style={styles.lbTeam}>{entry.favoriteTeam}</Text>
            )}
          </View>
          <Text style={[styles.lbScore, i < 3 && { color: RANK_COLORS[i] }]}>
            {entry.score.toLocaleString()}
          </Text>
        </View>
      ))}
    </>
  );
}

// ── Friends Tab ────────────────────────────────────────────────────────────────

function FriendsTab({
  friends,
  pendingRequests,
  onAccept,
  onDecline,
  onRemove,
}: {
  friends: FriendProfile[];
  pendingRequests: FriendRequest[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            Pending Requests ({pendingRequests.length})
          </Text>
          {pendingRequests.map(req => (
            <Card key={req.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>
                    {req.fromUsername.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.requestUsername}>{req.fromUsername}</Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => onAccept(req.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={() => onDecline(req.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Friends List */}
      <Text style={styles.sectionTitle}>
        Friends ({friends.length})
      </Text>
      {friends.length > 0 ? (
        friends.map(friend => (
          <View key={friend.userId} style={styles.friendRow}>
            <View style={styles.friendAvatarWrap}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>
                  {friend.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={[
                styles.onlineDot,
                { backgroundColor: friend.isOnline ? colors.correct : colors.textMuted },
              ]} />
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendUsername}>{friend.username}</Text>
              <Text style={styles.friendMeta}>
                {friend.favoriteTeam ?? 'No team'} · {friend.eloRating} Elo
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onRemove(friend.userId)}
              activeOpacity={0.7}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No Friends Yet</Text>
          <Text style={styles.emptySubtext}>Search for players and send friend requests</Text>
        </Card>
      )}
    </>
  );
}

// ── Achievements Tab ───────────────────────────────────────────────────────────

function AchievementsTab({
  achievements,
  userAchievements,
}: {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
}) {
  const [filter, setFilter] = React.useState<string>('all');
  const RARITY_COLORS: Record<string, string> = {
    common: colors.textMuted,
    uncommon: colors.correct,
    rare: colors.statStackBlue,
    legendary: '#FFD700',
  };

  const categories = ['all', 'games', 'prediction', 'fantasy', 'social', 'streak'];

  const filtered = filter === 'all'
    ? achievements
    : achievements.filter(a => a.category === filter);

  const completedIds = new Set(
    userAchievements.filter(ua => ua.isComplete).map(ua => ua.achievementId)
  );

  return (
    <>
      {/* Category Filter */}
      <View style={styles.filterRow}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            onPress={() => setFilter(cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <Card style={styles.achieveStatsCard}>
        <Text style={styles.achieveStatsValue}>
          {userAchievements.filter(a => a.isComplete).length}/{achievements.length}
        </Text>
        <Text style={styles.achieveStatsLabel}>Achievements Unlocked</Text>
      </Card>

      {/* Grid */}
      <View style={styles.achieveGrid}>
        {filtered.map(achievement => {
          const userA = userAchievements.find(ua => ua.achievementId === achievement.id);
          const isComplete = completedIds.has(achievement.id);
          const progress = userA ? userA.progress / achievement.requirement : 0;

          return (
            <Card
              key={achievement.id}
              style={{
                ...styles.achieveCard,
                opacity: isComplete ? 1 : 0.7,
                borderColor: isComplete ? RARITY_COLORS[achievement.rarity] : colors.border,
              }}
            >
              <Text style={styles.achieveIcon}>{achievement.icon}</Text>
              <Text style={styles.achieveName}>{achievement.name}</Text>
              <Text style={styles.achieveDesc}>{achievement.description}</Text>
              <View style={[
                styles.rarityBadge,
                { backgroundColor: RARITY_COLORS[achievement.rarity] + '20' },
              ]}>
                <Text style={[
                  styles.rarityText,
                  { color: RARITY_COLORS[achievement.rarity] },
                ]}>
                  {achievement.rarity.toUpperCase()}
                </Text>
              </View>
              {!isComplete && (
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { width: `${Math.min(progress * 100, 100)}%` },
                  ]} />
                </View>
              )}
              {isComplete && (
                <Text style={styles.achieveCheck}>✓</Text>
              )}
            </Card>
          );
        })}
      </View>
    </>
  );
}

// ── Notifications Tab ──────────────────────────────────────────────────────────

function NotificationsTab({
  notifications,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const NOTIF_ICONS: Record<string, string> = {
    friend_request: '👥',
    friend_accepted: '🤝',
    game_invite: '🎮',
    league_invite: '🏈',
    achievement_unlocked: '🎖️',
    prediction_result: '🤖',
    trade_proposal: '🔄',
    draft_starting: '📋',
    live_score_update: '📊',
    system: '⚙️',
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {unreadCount > 0 && (
        <View style={styles.notifHeader}>
          <Text style={styles.notifUnread}>{unreadCount} unread</Text>
          <TouchableOpacity onPress={onMarkAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      {notifications.length > 0 ? (
        notifications.map(notif => (
          <TouchableOpacity
            key={notif.id}
            style={[styles.notifRow, !notif.read && styles.notifRowUnread]}
            onPress={() => onMarkRead(notif.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.notifIcon}>{NOTIF_ICONS[notif.type] ?? '📢'}</Text>
            <View style={styles.notifContent}>
              <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]}>
                {notif.title}
              </Text>
              <Text style={styles.notifBody}>{notif.body}</Text>
              <Text style={styles.notifTime}>
                {new Date(notif.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {!notif.read && <View style={styles.notifDot} />}
          </TouchableOpacity>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtext}>You're all caught up!</Text>
        </Card>
      )}
    </>
  );
}

// ── Chat Tab ───────────────────────────────────────────────────────────────────

function ChatTab({
  rooms,
  activeRoom,
  messages,
  onOpenRoom,
  onSendMessage,
  onCloseRoom,
}: {
  rooms: import('@/types').ChatRoom[];
  activeRoom: string | null;
  messages: import('@/types').ChatMessage[];
  onOpenRoom: (id: string) => void;
  onSendMessage: (content: string) => void;
  onCloseRoom: () => void;
}) {
  const [messageText, setMessageText] = React.useState('');

  const ROOM_ICONS: Record<string, string> = {
    global: '🌍',
    league: '🏈',
    group: '👥',
    direct: '💬',
  };

  // Chat room detail
  if (activeRoom) {
    const room = rooms.find(r => r.id === activeRoom);
    return (
      <>
        <TouchableOpacity onPress={onCloseRoom} activeOpacity={0.7}>
          <Text style={styles.chatBackBtn}>← Back to Rooms</Text>
        </TouchableOpacity>
        <Text style={styles.chatRoomTitle}>{room?.name ?? 'Chat'}</Text>

        {messages.length > 0 ? (
          messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.chatBubble,
                msg.senderId === 'current-user' ? styles.chatBubbleMine : styles.chatBubbleOther,
              ]}
            >
              {msg.senderId !== 'current-user' && (
                <Text style={styles.chatSender}>{msg.senderUsername}</Text>
              )}
              <Text style={styles.chatText}>{msg.content}</Text>
              <Text style={styles.chatTime}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.chatEmpty}>No messages yet. Start the conversation!</Text>
        )}

        {/* Message Input */}
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={messageText}
            onChangeText={setMessageText}
          />
          <TouchableOpacity
            style={styles.chatSendBtn}
            onPress={() => {
              if (messageText.trim()) {
                onSendMessage(messageText.trim());
                setMessageText('');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.chatSendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // Room list
  return (
    <>
      <Text style={styles.sectionTitle}>Chat Rooms</Text>
      {rooms.length > 0 ? (
        rooms.map(room => (
          <TouchableOpacity
            key={room.id}
            style={styles.chatRoomRow}
            onPress={() => onOpenRoom(room.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.chatRoomIcon}>{ROOM_ICONS[room.type] ?? '💬'}</Text>
            <View style={styles.chatRoomInfo}>
              <Text style={styles.chatRoomName}>{room.name}</Text>
              <Text style={styles.chatRoomPreview}>
                {room.lastMessage
                  ? `${room.lastMessage.senderUsername}: ${room.lastMessage.content}`
                  : 'No messages yet'}
              </Text>
            </View>
            {room.unreadCount > 0 && (
              <View style={styles.chatUnreadBadge}>
                <Text style={styles.chatUnreadText}>{room.unreadCount}</Text>
              </View>
            )}
            <Text style={styles.chatRoomArrow}>›</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No Chat Rooms</Text>
          <Text style={styles.emptySubtext}>Join a league to unlock chat</Text>
        </Card>
      )}
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.sm },
  heroTitle: {
    color: colors.accent,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
  },

  // Tabs
  tabBar: { marginBottom: spacing.sm },
  tabBarContent: { paddingHorizontal: spacing.md, gap: spacing.xs },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  tabIcon: { fontSize: 14 },
  tabText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  tabBadge: {
    backgroundColor: colors.clashRed,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },

  // Content
  tabContent: { flex: 1 },
  tabContentInner: { padding: spacing.md, paddingBottom: spacing.xxl },

  // Section
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },

  // Filter chips
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
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
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  filterTextActive: {
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },

  // Leaderboard
  yourRankCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
  },
  yourRankLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
  },
  yourRankValue: {
    color: colors.accent,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  lbRowTop3: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderBottomWidth: 0,
  },
  lbRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHighlight,
    marginRight: spacing.sm,
  },
  lbRankText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  lbAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  lbAvatarText: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  lbInfo: { flex: 1 },
  lbUsername: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  lbTeam: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  lbScore: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },

  // Friends
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requestUsername: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  acceptBtn: {
    backgroundColor: colors.correct + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.correct,
  },
  acceptBtnText: {
    color: colors.correct,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  declineBtn: {
    backgroundColor: colors.clashRed + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.clashRed,
  },
  declineBtnText: {
    color: colors.clashRed,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  friendAvatarWrap: { position: 'relative', marginRight: spacing.sm },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
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
  friendInfo: { flex: 1 },
  friendUsername: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  friendMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  removeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removeBtnText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },

  // Achievements
  achieveStatsCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  achieveStatsValue: {
    color: colors.accent,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  achieveStatsLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  achieveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achieveCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
  },
  achieveIcon: { fontSize: 32, marginBottom: spacing.xs },
  achieveName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  achieveDesc: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: spacing.xs,
  },
  rarityBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  achieveCheck: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    color: colors.correct,
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
  },

  // Notifications
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  notifUnread: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  markAllRead: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifRowUnread: {
    backgroundColor: colors.accent + '08',
    borderColor: colors.accent + '30',
  },
  notifIcon: { fontSize: 20, marginRight: spacing.sm, marginTop: 2 },
  notifContent: { flex: 1 },
  notifTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  notifTitleUnread: { fontWeight: typography.fontWeight.bold },
  notifBody: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  notifTime: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginLeft: spacing.sm,
    marginTop: 6,
  },

  // Chat
  chatRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  chatRoomIcon: { fontSize: 24, marginRight: spacing.md },
  chatRoomInfo: { flex: 1 },
  chatRoomName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  chatRoomPreview: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  chatUnreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: spacing.sm,
  },
  chatUnreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  chatRoomArrow: {
    color: colors.textMuted,
    fontSize: 24,
  },
  chatBackBtn: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  chatRoomTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  chatBubbleMine: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent + '40',
    borderWidth: 1,
    alignSelf: 'flex-end',
  },
  chatBubbleOther: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chatSender: {
    color: colors.accent,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  chatText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  chatTime: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  chatEmpty: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  chatSendBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  chatSendText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },

  // Empty states
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
