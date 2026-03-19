// ============================================================
// GridIron IQ — Favorite Team Picker (Brutalist)
// ============================================================
// Full-screen modal with searchable grid of all 136 FBS teams,
// grouped by conference. Saves selection to user store.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography, borderRadius, borders } from '@/lib/theme';
import { TeamLogo } from '@/components/ui/team-logo';
import { getAllTeams, type CachedTeam } from '@/services/data/cfbd-cache';

interface TeamPickerProps {
  visible: boolean;
  currentTeam?: string;
  onSelect: (school: string, conference: string) => void;
  onClose: () => void;
}

const CONFERENCE_ORDER = [
  'SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12',
  'American Athletic', 'Mountain West', 'Sun Belt',
  'Mid-American', 'Conference USA', 'FBS Independents',
];

function conferenceLabel(conf: string): string {
  const map: Record<string, string> = {
    'American Athletic': 'AAC',
    'Mid-American': 'MAC',
    'Conference USA': 'C-USA',
    'FBS Independents': 'IND',
  };
  return map[conf] || conf;
}

export function TeamPicker({ visible, currentTeam, onSelect, onClose }: TeamPickerProps) {
  const [search, setSearch] = useState('');

  const allTeams = useMemo(() => getAllTeams(), []);

  const grouped = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? allTeams.filter(
          (t) =>
            t.school.toLowerCase().includes(q) ||
            t.mascot.toLowerCase().includes(q) ||
            t.conference.toLowerCase().includes(q)
        )
      : allTeams;

    const groups: Record<string, CachedTeam[]> = {};
    for (const t of filtered) {
      const conf = t.conference || 'Other';
      if (!groups[conf]) groups[conf] = [];
      groups[conf].push(t);
    }

    // Sort each group alphabetically
    for (const conf of Object.keys(groups)) {
      groups[conf].sort((a, b) => a.school.localeCompare(b.school));
    }

    // Return in conference order
    return CONFERENCE_ORDER
      .filter((c) => groups[c] && groups[c].length > 0)
      .map((c) => ({ conference: c, teams: groups[c] }));
  }, [allTeams, search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>CANCEL</Text>
          </TouchableOpacity>
          <Text style={styles.title}>PICK YOUR SCHOOL</Text>
          <View style={styles.closeBtnPlaceholder} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="SEARCH TEAMS..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Team Grid */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {grouped.map(({ conference, teams }) => (
            <View key={conference} style={styles.confSection}>
              <View style={styles.confHeader}>
                <Text style={styles.confLabel}>{conferenceLabel(conference)}</Text>
                <View style={styles.confLine} />
              </View>
              <View style={styles.teamGrid}>
                {teams.map((team) => {
                  const isSelected = currentTeam?.toLowerCase() === team.school.toLowerCase();
                  const teamColor = team.color || colors.accent;
                  return (
                    <TouchableOpacity
                      key={team.id}
                      style={[
                        styles.teamCell,
                        isSelected && { borderColor: teamColor, borderWidth: 3 },
                      ]}
                      onPress={() => onSelect(team.school, team.conference)}
                      activeOpacity={0.7}
                    >
                      <TeamLogo school={team.school} size={40} />
                      <Text
                        style={[
                          styles.teamName,
                          isSelected && { color: teamColor },
                        ]}
                        numberOfLines={2}
                      >
                        {team.school}
                      </Text>
                      {isSelected && (
                        <View style={[styles.selectedBar, { backgroundColor: teamColor }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.accent,
    backgroundColor: colors.surface,
  },
  closeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 2,
  },
  closeBtnPlaceholder: { width: 60 },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 3,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  confSection: {
    marginTop: spacing.md,
  },
  confHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  confLabel: {
    color: colors.accent,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.heavy,
    letterSpacing: 3,
    marginRight: spacing.sm,
  },
  confLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
  },
  teamCell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  teamName: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  selectedBar: {
    position: 'absolute',
    bottom: 0,
    left: spacing.sm,
    right: spacing.sm,
    height: 3,
  },
});
