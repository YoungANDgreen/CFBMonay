// ============================================================
// GridIron IQ — Social Store Unit Tests
// ============================================================

import { useSocialStore } from './social-store';

beforeEach(() => {
  useSocialStore.getState().reset();
});

describe('useSocialStore', () => {
  describe('initial state', () => {
    it('starts with empty arrays and no loading', () => {
      const state = useSocialStore.getState();
      expect(state.friends).toEqual([]);
      expect(state.friendRequests).toEqual([]);
      expect(state.leaderboardEntries).toEqual([]);
      expect(state.allAchievements).toEqual([]);
      expect(state.userAchievements).toEqual([]);
      expect(state.chatRooms).toEqual([]);
      expect(state.chatMessages).toEqual([]);
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('loadFriends', () => {
    it('populates friends and friend requests', () => {
      useSocialStore.getState().loadFriends();

      const { friends, friendRequests, isLoading } = useSocialStore.getState();
      expect(friends.length).toBeGreaterThan(0);
      expect(friendRequests.length).toBeGreaterThan(0);
      expect(isLoading).toBe(false);

      // Verify friend structure
      expect(friends[0]).toHaveProperty('userId');
      expect(friends[0]).toHaveProperty('username');
      expect(friends[0]).toHaveProperty('eloRating');
    });
  });

  describe('sendFriendRequest', () => {
    it('adds a pending friend request', () => {
      useSocialStore.getState().sendFriendRequest('usr-new');

      const { friendRequests } = useSocialStore.getState();
      expect(friendRequests).toHaveLength(1);
      expect(friendRequests[0].fromUserId).toBe('current-user');
      expect(friendRequests[0].toUserId).toBe('usr-new');
      expect(friendRequests[0].status).toBe('pending');
    });
  });

  describe('respondToRequest', () => {
    it('accepts a friend request and adds new friend', () => {
      useSocialStore.getState().loadFriends();
      const initialFriendCount = useSocialStore.getState().friends.length;
      const requestId = useSocialStore.getState().friendRequests[0].id;

      useSocialStore.getState().respondToRequest(requestId, true);

      const { friends, friendRequests } = useSocialStore.getState();
      expect(friends.length).toBe(initialFriendCount + 1);
      const updatedRequest = friendRequests.find(r => r.id === requestId);
      expect(updatedRequest!.status).toBe('accepted');
    });

    it('declines a friend request without adding friend', () => {
      useSocialStore.getState().loadFriends();
      const initialFriendCount = useSocialStore.getState().friends.length;
      const requestId = useSocialStore.getState().friendRequests[0].id;

      useSocialStore.getState().respondToRequest(requestId, false);

      expect(useSocialStore.getState().friends.length).toBe(initialFriendCount);
      const updatedRequest = useSocialStore.getState().friendRequests.find(r => r.id === requestId);
      expect(updatedRequest!.status).toBe('declined');
    });

    it('does nothing for non-existent request', () => {
      useSocialStore.getState().loadFriends();
      const initialCount = useSocialStore.getState().friends.length;

      useSocialStore.getState().respondToRequest('non-existent', true);

      expect(useSocialStore.getState().friends.length).toBe(initialCount);
    });
  });

  describe('removeFriend', () => {
    it('removes a friend by ID', () => {
      useSocialStore.getState().loadFriends();
      const friendId = useSocialStore.getState().friends[0].userId;
      const initialCount = useSocialStore.getState().friends.length;

      useSocialStore.getState().removeFriend(friendId);

      expect(useSocialStore.getState().friends.length).toBe(initialCount - 1);
      expect(useSocialStore.getState().friends.find(f => f.userId === friendId)).toBeUndefined();
    });
  });

  describe('loadLeaderboard', () => {
    it('populates leaderboard entries', () => {
      useSocialStore.getState().loadLeaderboard();

      const { leaderboardEntries, userRank, isLoading } = useSocialStore.getState();
      expect(leaderboardEntries.length).toBeGreaterThan(0);
      expect(userRank).not.toBeNull();
      expect(isLoading).toBe(false);

      // Entries should be ranked
      expect(leaderboardEntries[0].rank).toBe(1);
    });

    it('uses provided type and timeframe', () => {
      useSocialStore.getState().loadLeaderboard('grid', 'season');

      const { leaderboardType, leaderboardTimeframe } = useSocialStore.getState();
      expect(leaderboardType).toBe('grid');
      expect(leaderboardTimeframe).toBe('season');
    });
  });

  describe('setLeaderboardType / setLeaderboardTimeframe', () => {
    it('changes leaderboard type and reloads', () => {
      useSocialStore.getState().setLeaderboardType('stat_stack');

      expect(useSocialStore.getState().leaderboardType).toBe('stat_stack');
      expect(useSocialStore.getState().leaderboardEntries.length).toBeGreaterThan(0);
    });

    it('changes leaderboard timeframe and reloads', () => {
      useSocialStore.getState().setLeaderboardTimeframe('season');

      expect(useSocialStore.getState().leaderboardTimeframe).toBe('season');
      expect(useSocialStore.getState().leaderboardEntries.length).toBeGreaterThan(0);
    });
  });

  describe('loadAchievements', () => {
    it('populates both achievement lists', () => {
      useSocialStore.getState().loadAchievements();

      const { allAchievements, userAchievements, isLoading } = useSocialStore.getState();
      expect(allAchievements.length).toBeGreaterThan(0);
      expect(userAchievements.length).toBeGreaterThan(0);
      expect(isLoading).toBe(false);

      // Verify achievement structure
      expect(allAchievements[0]).toHaveProperty('id');
      expect(allAchievements[0]).toHaveProperty('name');
      expect(allAchievements[0]).toHaveProperty('rarity');

      // Verify user achievement structure
      expect(userAchievements[0]).toHaveProperty('achievementId');
      expect(userAchievements[0]).toHaveProperty('progress');
    });
  });

  describe('Chat', () => {
    it('loadChatRooms populates rooms', () => {
      useSocialStore.getState().loadChatRooms();

      const { chatRooms, isLoading } = useSocialStore.getState();
      expect(chatRooms.length).toBeGreaterThan(0);
      expect(isLoading).toBe(false);
      expect(chatRooms[0]).toHaveProperty('id');
      expect(chatRooms[0]).toHaveProperty('name');
    });

    it('openChatRoom sets active room and loads messages', () => {
      useSocialStore.getState().loadChatRooms();
      const roomId = useSocialStore.getState().chatRooms[0].id;

      useSocialStore.getState().openChatRoom(roomId);

      const { activeChatRoom, chatMessages } = useSocialStore.getState();
      expect(activeChatRoom).toBe(roomId);
      expect(chatMessages.length).toBeGreaterThan(0);
    });

    it('openChatRoom clears unread count for the room', () => {
      useSocialStore.getState().loadChatRooms();
      const roomId = useSocialStore.getState().chatRooms[0].id;

      useSocialStore.getState().openChatRoom(roomId);

      const room = useSocialStore.getState().chatRooms.find(r => r.id === roomId);
      expect(room!.unreadCount).toBe(0);
    });

    it('openChatRoom does nothing for non-existent room', () => {
      useSocialStore.getState().loadChatRooms();

      useSocialStore.getState().openChatRoom('non-existent');

      expect(useSocialStore.getState().activeChatRoom).toBeNull();
    });

    it('sendMessage adds to chat messages', () => {
      useSocialStore.getState().loadChatRooms();
      const roomId = useSocialStore.getState().chatRooms[0].id;
      useSocialStore.getState().openChatRoom(roomId);

      const initialCount = useSocialStore.getState().chatMessages.length;
      useSocialStore.getState().sendMessage('Hook em!');

      const { chatMessages } = useSocialStore.getState();
      expect(chatMessages.length).toBe(initialCount + 1);
      const lastMessage = chatMessages[chatMessages.length - 1];
      expect(lastMessage.content).toBe('Hook em!');
      expect(lastMessage.senderId).toBe('current-user');
      expect(lastMessage.roomId).toBe(roomId);
    });

    it('sendMessage updates lastMessage on the chat room', () => {
      useSocialStore.getState().loadChatRooms();
      const roomId = useSocialStore.getState().chatRooms[0].id;
      useSocialStore.getState().openChatRoom(roomId);

      useSocialStore.getState().sendMessage('Test message');

      const room = useSocialStore.getState().chatRooms.find(r => r.id === roomId);
      expect(room!.lastMessage!.content).toBe('Test message');
    });

    it('sendMessage does nothing without active room', () => {
      useSocialStore.getState().sendMessage('Hello');
      expect(useSocialStore.getState().chatMessages).toEqual([]);
    });

    it('sendMessage does nothing with empty content', () => {
      useSocialStore.getState().loadChatRooms();
      const roomId = useSocialStore.getState().chatRooms[0].id;
      useSocialStore.getState().openChatRoom(roomId);
      const initialCount = useSocialStore.getState().chatMessages.length;

      useSocialStore.getState().sendMessage('   ');

      expect(useSocialStore.getState().chatMessages.length).toBe(initialCount);
    });

    it('closeChatRoom clears active room and messages', () => {
      useSocialStore.getState().loadChatRooms();
      const roomId = useSocialStore.getState().chatRooms[0].id;
      useSocialStore.getState().openChatRoom(roomId);

      useSocialStore.getState().closeChatRoom();

      expect(useSocialStore.getState().activeChatRoom).toBeNull();
      expect(useSocialStore.getState().chatMessages).toEqual([]);
    });
  });

  describe('Notifications', () => {
    it('loadNotifications populates notifications and unread count', () => {
      useSocialStore.getState().loadNotifications();

      const { notifications, unreadCount, isLoading } = useSocialStore.getState();
      expect(notifications.length).toBeGreaterThan(0);
      expect(unreadCount).toBeGreaterThan(0);
      expect(isLoading).toBe(false);
    });

    it('markNotificationRead updates a single notification', () => {
      useSocialStore.getState().loadNotifications();
      const unreadNotif = useSocialStore.getState().notifications.find(n => !n.read);
      const initialUnread = useSocialStore.getState().unreadCount;

      useSocialStore.getState().markNotificationRead(unreadNotif!.id);

      const updatedNotif = useSocialStore.getState().notifications.find(n => n.id === unreadNotif!.id);
      expect(updatedNotif!.read).toBe(true);
      expect(useSocialStore.getState().unreadCount).toBe(initialUnread - 1);
    });

    it('markNotificationRead on already-read notification does not change unread count', () => {
      useSocialStore.getState().loadNotifications();
      const readNotif = useSocialStore.getState().notifications.find(n => n.read);
      const initialUnread = useSocialStore.getState().unreadCount;

      useSocialStore.getState().markNotificationRead(readNotif!.id);

      expect(useSocialStore.getState().unreadCount).toBe(initialUnread);
    });

    it('markAllNotificationsRead sets all to read and zeros count', () => {
      useSocialStore.getState().loadNotifications();

      useSocialStore.getState().markAllNotificationsRead();

      const { notifications, unreadCount } = useSocialStore.getState();
      expect(unreadCount).toBe(0);
      expect(notifications.every(n => n.read)).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears all state back to initial', () => {
      useSocialStore.getState().loadFriends();
      useSocialStore.getState().loadLeaderboard();
      useSocialStore.getState().loadAchievements();
      useSocialStore.getState().loadChatRooms();
      useSocialStore.getState().loadNotifications();

      useSocialStore.getState().reset();

      const state = useSocialStore.getState();
      expect(state.friends).toEqual([]);
      expect(state.leaderboardEntries).toEqual([]);
      expect(state.allAchievements).toEqual([]);
      expect(state.userAchievements).toEqual([]);
      expect(state.chatRooms).toEqual([]);
      expect(state.chatMessages).toEqual([]);
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.activeChatRoom).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
