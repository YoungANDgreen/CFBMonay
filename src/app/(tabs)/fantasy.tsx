import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFantasyStore } from '@/stores/fantasy-store';
import { LeagueHome } from '@/components/fantasy/league-home';
import { CreateLeague } from '@/components/fantasy/create-league';

export default function FantasyScreen() {
  const { leagues, activeLeague, setActiveLeague } = useFantasyStore();
  const [showCreate, setShowCreate] = useState(false);

  // League detail view
  if (activeLeague) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setActiveLeague(null)}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>← My Leagues</Text>
        </TouchableOpacity>
        <LeagueHome />
      </View>
    );
  }

  // Create league form
  if (showCreate) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <CreateLeague onClose={() => setShowCreate(false)} />
      </ScrollView>
    );
  }

  // League list / empty state
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>College Fantasy</Text>
        <Text style={styles.heroSubtitle}>Draft. Trade. Dominate.</Text>
      </View>

      {/* Create/Join League */}
      <View style={styles.actionRow}>
        <Button
          title="Create League"
          onPress={() => setShowCreate(true)}
          variant="primary"
          style={styles.actionButton}
        />
        <Button
          title="Join League"
          onPress={() => {}}
          variant="outline"
          style={styles.actionButton}
        />
      </View>

      {/* My Leagues */}
      <Text style={styles.sectionTitle}>My Leagues</Text>
      {leagues.length === 0 ? (
        <Card style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏈</Text>
          <Text style={styles.emptyTitle}>No leagues yet</Text>
          <Text style={styles.emptySubtitle}>
            Create or join a college fantasy football league to get started
          </Text>
        </Card>
      ) : (
        leagues.map(league => (
          <TouchableOpacity
            key={league.id}
            style={styles.leagueCard}
            onPress={() => setActiveLeague(league)}
            activeOpacity={0.7}
          >
            <View style={styles.leagueInfo}>
              <Text style={styles.leagueName}>{league.name}</Text>
              <Text style={styles.leagueMeta}>
                {league.maxTeams} teams · {league.draftType} draft ·{' '}
                {league.scoringSettings.reception === 0 ? 'Standard' :
                 league.scoringSettings.reception === 0.5 ? 'Half PPR' : 'Full PPR'}
              </Text>
            </View>
            <View style={styles.leagueStatus}>
              <Text style={[
                styles.leagueStatusText,
                { color: league.status === 'in_season' ? colors.correct : colors.predictionOrange },
              ]}>
                {league.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.leagueArrow}>›</Text>
          </TouchableOpacity>
        ))
      )}

      {/* Features Preview */}
      <Text style={styles.sectionTitle}>Features</Text>
      {[
        { icon: '📋', title: 'Custom Scoring', desc: 'PPR, standard, or build your own' },
        { icon: '🔄', title: 'Snake & Auction Drafts', desc: 'Draft with friends or AI opponents' },
        { icon: '📊', title: 'Live Scoring', desc: 'Real-time play-by-play updates on game day' },
        { icon: '💬', title: 'League Chat', desc: 'Talk trash and share highlights' },
        { icon: '🔁', title: 'Trade Analyzer', desc: 'AI-powered trade evaluation' },
        { icon: '💰', title: 'FAAB Waivers', desc: 'Bid on free agents with your budget' },
      ].map((feature, i) => (
        <View key={i} style={styles.featureRow}>
          <Text style={styles.featureIcon}>{feature.icon}</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  hero: { marginBottom: spacing.lg, marginTop: spacing.sm },
  heroTitle: {
    color: colors.fantasyTeal,
    fontSize: typography.fontSize.hero,
    fontWeight: typography.fontWeight.heavy,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    marginTop: spacing.xs,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionButton: { flex: 1 },
  backButton: { padding: spacing.md, paddingBottom: 0 },
  backText: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  leagueInfo: { flex: 1 },
  leagueName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  leagueMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  leagueStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceHighlight,
    marginRight: spacing.sm,
  },
  leagueStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  leagueArrow: {
    color: colors.textMuted,
    fontSize: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: { fontSize: 24, marginRight: spacing.md },
  featureText: { flex: 1 },
  featureTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  featureDesc: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
});
