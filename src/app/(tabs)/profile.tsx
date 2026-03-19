import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { useTeamTheme } from '@/lib/team-theme-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TeamLogo } from '@/components/ui/team-logo';
import { TeamPicker } from '@/components/ui/team-picker';
import { useUserStore } from '@/stores/user-store';
import type { User, Conference } from '@/types';

export default function ProfileScreen() {
  const { user, isAuthenticated, setUser, updateProfile, setFavoriteTeam, logout } = useUserStore();
  const { teamTheme, favoriteTeam } = useTeamTheme();
  const [showEdit, setShowEdit] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);

  if (!isAuthenticated || !user) {
    return <AuthScreen onSignIn={(u) => { setUser(u); }} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header with Team Color Stripe */}
      <View style={[styles.headerStripe, { backgroundColor: teamTheme.primary }]}>
        <View style={styles.avatarContainer}>
          {favoriteTeam ? (
            <View style={[styles.avatar, { borderColor: teamTheme.primary }]}>
              <TeamLogo school={favoriteTeam} size={56} />
            </View>
          ) : (
            <View style={[styles.avatar, { borderColor: colors.accent }]}>
              <Text style={styles.avatarText}>
                {user.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.username}>{user.displayName}</Text>
        <Text style={styles.handle}>@{user.username}</Text>
        {favoriteTeam && (
          <Badge label={favoriteTeam} color={teamTheme.primary} textColor={teamTheme.text} />
        )}
        <View style={styles.headerActions}>
          <Button title="EDIT PROFILE" onPress={() => setShowEdit(true)} variant="outline" size="sm" accentColor={teamTheme.primary} />
        </View>
      </View>

      {/* Quick Stats Bar */}
      <View style={[styles.quickStats, { borderTopColor: teamTheme.primary }]}>
        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatValue, { color: teamTheme.primary }]}>{user.eloRating}</Text>
          <Text style={styles.quickStatLabel}>ELO</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatValue, { color: colors.predictionOrange }]}>
            {user.streakCurrent}
          </Text>
          <Text style={styles.quickStatLabel}>STREAK</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatValue, { color: colors.correct }]}>
            {user.streakBest}
          </Text>
          <Text style={styles.quickStatLabel}>BEST</Text>
        </View>
      </View>

      {/* Game Stats */}
      <SectionHeader label="GAME STATS" color={teamTheme.primary} />
      <View style={styles.statsGrid}>
        {[
          { label: 'GRID PLAYED', value: String(user.stats.gridGamesPlayed), color: colors.gridGreen },
          { label: 'GRID BEST', value: user.stats.gridBestScore > 0 ? String(user.stats.gridBestScore) : '--', color: colors.gridGreen },
          { label: 'STAT STACK', value: String(user.stats.statStackGamesPlayed), color: colors.statStackBlue },
          { label: 'BEST %ILE', value: user.stats.statStackBestPercentile > 0 ? `${user.stats.statStackBestPercentile}%` : '--', color: colors.statStackBlue },
          { label: 'PREDICT %', value: user.stats.predictionAccuracy > 0 ? `${Math.round(user.stats.predictionAccuracy)}%` : '--', color: colors.predictionOrange },
          { label: 'TITLES', value: String(user.stats.fantasyChampionships), color: colors.fantasyTeal },
        ].map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <SectionHeader label="RECENT ACTIVITY" color={teamTheme.primary} />
      <View style={styles.activityCard}>
        {[
          { text: 'Completed daily Grid puzzle', time: 'Today', color: colors.gridGreen },
          { text: 'Made 3 predictions for Week 4', time: 'Yesterday', color: colors.predictionOrange },
          { text: 'Won fantasy matchup 142-128', time: '3 days ago', color: colors.fantasyTeal },
        ].map((item, i) => (
          <View key={i} style={[styles.activityRow, i > 0 && styles.activityRowBorder]}>
            <View style={[styles.activityDot, { backgroundColor: item.color }]} />
            <Text style={styles.activityText}>{item.text}</Text>
            <Text style={styles.activityTime}>{item.time.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      {/* Settings */}
      <SectionHeader label="SETTINGS" color={teamTheme.primary} />
      <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7} onPress={() => setShowTeamPicker(true)}>
        <Text style={styles.settingsLabel}>FAVORITE TEAM</Text>
        <View style={styles.settingsValueRow}>
          {favoriteTeam && <TeamLogo school={favoriteTeam} size={20} />}
          <Text style={[styles.settingsValue, favoriteTeam && { color: teamTheme.primary }]}>
            {favoriteTeam ?? 'Not set'}
          </Text>
          <Text style={styles.settingsArrow}>&#x203A;</Text>
        </View>
      </TouchableOpacity>
      {[
        { label: 'NOTIFICATIONS', value: 'On' },
        { label: 'DARK MODE', value: 'Always' },
        { label: 'PRIVACY', value: 'Public' },
        { label: 'VERSION', value: 'v1.0.0' },
      ].map((item, i) => (
        <TouchableOpacity key={i} style={styles.settingsRow} activeOpacity={0.7}>
          <Text style={styles.settingsLabel}>{item.label}</Text>
          <View style={styles.settingsValueRow}>
            <Text style={styles.settingsValue}>{item.value}</Text>
            <Text style={styles.settingsArrow}>&#x203A;</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Sign Out */}
      <Button
        title="SIGN OUT"
        onPress={logout}
        variant="outline"
        accentColor={colors.clashRed}
        style={{ marginTop: spacing.lg }}
      />

      {/* Team Picker */}
      <TeamPicker
        visible={showTeamPicker}
        currentTeam={favoriteTeam}
        onSelect={(school, conference) => {
          setFavoriteTeam(school, conference as Conference);
          setShowTeamPicker(false);
        }}
        onClose={() => setShowTeamPicker(false)}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEdit}
        user={user}
        teamTheme={teamTheme}
        onClose={() => setShowEdit(false)}
        onSave={(updates) => {
          updateProfile(updates);
          setShowEdit(false);
        }}
        onPickTeam={() => {
          setShowEdit(false);
          setShowTeamPicker(true);
        }}
      />
    </ScrollView>
  );
}

// --- Section Header Component ---

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={[styles.sectionLine, { backgroundColor: color }]} />
    </View>
  );
}

// --- Auth Screen ---

function AuthScreen({ onSignIn }: { onSignIn: (user: User) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    const user: User = {
      id: `user-${Date.now()}`,
      username: username.trim() || 'GridIronPlayer',
      displayName: displayName.trim() || username.trim() || 'GridIron Player',
      eloRating: 1200,
      streakCurrent: 0,
      streakBest: 0,
      stats: {
        gridGamesPlayed: 0,
        gridBestScore: 0,
        statStackGamesPlayed: 0,
        statStackBestPercentile: 0,
        predictionAccuracy: 0,
        fantasyChampionships: 0,
      },
    };
    onSignIn(user);
  };

  const handleGuest = () => {
    const guestId = Math.random().toString(36).slice(2, 7).toUpperCase();
    const user: User = {
      id: `guest-${Date.now()}`,
      username: `Guest_${guestId}`,
      displayName: `Guest ${guestId}`,
      eloRating: 1200,
      streakCurrent: 0,
      streakBest: 0,
      stats: {
        gridGamesPlayed: 0,
        gridBestScore: 0,
        statStackGamesPlayed: 0,
        statStackBestPercentile: 0,
        predictionAccuracy: 0,
        fantasyChampionships: 0,
      },
    };
    onSignIn(user);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.authContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.authHero}>
        <Text style={styles.authLogo}>GRIDIRON</Text>
        <Text style={styles.authLogoSub}>IQ</Text>
        <View style={styles.authAccent} />
        <Text style={styles.authSubtitle}>
          {mode === 'signin' ? 'WELCOME BACK' : 'JOIN THE GAME'}
        </Text>
      </View>

      <View style={styles.authCard}>
        {/* Mode Toggle */}
        <View style={styles.authToggle}>
          <TouchableOpacity
            style={[styles.authToggleBtn, mode === 'signin' && styles.authToggleBtnActive]}
            onPress={() => setMode('signin')}
            activeOpacity={0.7}
          >
            <Text style={[styles.authToggleText, mode === 'signin' && styles.authToggleTextActive]}>
              SIGN IN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.authToggleBtn, mode === 'signup' && styles.authToggleBtnActive]}
            onPress={() => setMode('signup')}
            activeOpacity={0.7}
          >
            <Text style={[styles.authToggleText, mode === 'signup' && styles.authToggleTextActive]}>
              SIGN UP
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'signup' && (
          <TextInput
            style={styles.authInput}
            placeholder="DISPLAY NAME"
            placeholderTextColor={colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
          />
        )}
        <TextInput
          style={styles.authInput}
          placeholder="USERNAME"
          placeholderTextColor={colors.textMuted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.authInput}
          placeholder="EMAIL"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title={mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          onPress={handleSubmit}
          variant="primary"
          style={{ marginTop: spacing.md }}
        />

        <View style={styles.authDivider}>
          <View style={styles.authDividerLine} />
          <Text style={styles.authDividerText}>OR</Text>
          <View style={styles.authDividerLine} />
        </View>

        <Button
          title="CONTINUE AS GUEST"
          onPress={handleGuest}
          variant="outline"
        />
      </View>
    </ScrollView>
  );
}

// --- Edit Profile Modal ---

function EditProfileModal({
  visible,
  user,
  teamTheme,
  onClose,
  onSave,
  onPickTeam,
}: {
  visible: boolean;
  user: User;
  teamTheme: { primary: string; secondary: string; text: string };
  onClose: () => void;
  onSave: (updates: Partial<User>) => void;
  onPickTeam: () => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { borderTopColor: teamTheme.primary, borderTopWidth: 4 }]}>
          <Text style={styles.modalTitle}>EDIT PROFILE</Text>

          <Text style={styles.inputLabel}>DISPLAY NAME</Text>
          <TextInput
            style={styles.authInput}
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Text style={styles.inputLabel}>FAVORITE TEAM</Text>
          <TouchableOpacity style={styles.teamPickerBtn} onPress={onPickTeam} activeOpacity={0.7}>
            <Text style={[styles.teamPickerBtnText, { color: teamTheme.primary }]}>
              {user.favoriteTeam ?? 'Tap to select...'}
            </Text>
            <Text style={styles.settingsArrow}>&#x203A;</Text>
          </TouchableOpacity>

          <View style={styles.modalActions}>
            <Button title="CANCEL" onPress={onClose} variant="outline" style={{ flex: 1 }} />
            <Button
              title="SAVE"
              onPress={() => onSave({
                displayName: displayName.trim() || user.displayName,
              })}
              variant="primary"
              accentColor={teamTheme.primary}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl + 20 },

  // Header stripe
  headerStripe: {
    height: 100,
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    alignItems: 'center',
    transform: [{ translateY: 44 }],
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  avatarText: {
    color: colors.accent,
    fontSize: 36,
    fontWeight: typography.fontWeight.heavy,
  },

  // Profile info
  profileInfo: {
    alignItems: 'center',
    paddingTop: spacing.xxl + 8,
    paddingHorizontal: spacing.md,
  },
  username: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 1,
    marginBottom: 2,
  },
  handle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  headerActions: {
    marginTop: spacing.md,
  },

  // Quick stats
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  quickStatItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  quickStatValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  quickStatLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 2,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
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

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 1.5,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Activity
  activityCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  activityRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  activityText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  activityTime: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },

  // Settings
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  settingsLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 1.5,
  },
  settingsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsValue: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  settingsArrow: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },

  // Auth screen
  authContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    justifyContent: 'center',
    minHeight: '100%',
  },
  authHero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  authLogo: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 6,
  },
  authLogoSub: {
    color: colors.accent,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 12,
    marginTop: -8,
  },
  authAccent: {
    width: 60,
    height: 4,
    backgroundColor: colors.accent,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  authSubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 4,
  },
  authCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.sm,
    padding: 2,
    marginBottom: spacing.lg,
  },
  authToggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  authToggleBtnActive: {
    backgroundColor: colors.accent,
  },
  authToggleText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 2,
  },
  authToggleTextActive: {
    color: colors.black,
  },
  authInput: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  authDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  authDividerText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 3,
    marginHorizontal: spacing.md,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 3,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 2,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  teamPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  teamPickerBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
