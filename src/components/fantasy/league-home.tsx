import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFantasyStore } from '@/stores/fantasy-store';

type TabKey = 'my_team' | 'matchup' | 'standings' | 'draft' | 'waivers' | 'trades' | 'chat';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'my_team', label: 'Team', icon: '🏈' },
  { key: 'matchup', label: 'Matchup', icon: '⚔️' },
  { key: 'standings', label: 'Standings', icon: '📊' },
  { key: 'waivers', label: 'Waivers', icon: '💰' },
  { key: 'trades', label: 'Trades', icon: '🔁' },
  { key: 'chat', label: 'Chat', icon: '💬' },
];

export function LeagueHome() {
  const { activeLeague, myTeam, leagueTeams, activeTab, setActiveTab, currentWeek } = useFantasyStore();

  if (!activeLeague || !myTeam) return null;

  return (
    <View style={styles.container}>
      {/* League Header */}
      <View style={styles.header}>
        <Text style={styles.leagueName}>{activeLeague.name}</Text>
        <Text style={styles.weekLabel}>Week {currentWeek}</Text>
      </View>

      {/* Team Summary */}
      <Card style={styles.teamCard}>
        <View style={styles.teamRow}>
          <View>
            <Text style={styles.teamName}>{myTeam.teamName}</Text>
            <Text style={styles.teamRecord}>
              {myTeam.record.wins}-{myTeam.record.losses}
              {myTeam.record.ties > 0 ? `-${myTeam.record.ties}` : ''}
            </Text>
          </View>
          <View style={styles.teamStats}>
            <Text style={styles.teamPF}>{myTeam.pointsFor.toFixed(1)} PF</Text>
            <Text style={styles.teamBudget}>${myTeam.waiverBudget} FAAB</Text>
          </View>
        </View>
      </Card>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'my_team' && <MyTeamTab />}
        {activeTab === 'matchup' && <MatchupTab />}
        {activeTab === 'standings' && <StandingsTab />}
        {activeTab === 'waivers' && <WaiversTab />}
        {activeTab === 'trades' && <TradesTab />}
        {activeTab === 'chat' && <ChatTab />}
      </ScrollView>
    </View>
  );
}

function MyTeamTab() {
  const { myTeam } = useFantasyStore();
  if (!myTeam) return null;

  const starters = myTeam.roster.filter(s => s.isStarter);
  const bench = myTeam.roster.filter(s => !s.isStarter);

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Starters</Text>
      {starters.map((slot, i) => (
        <View key={i} style={styles.rosterRow}>
          <Badge
            label={slot.position}
            color={colors.fantasyTeal}
            textColor="#fff"
          />
          <Text style={styles.rosterPlayer}>
            {slot.playerName || 'Empty'}
          </Text>
          <Text style={styles.rosterPoints}>-</Text>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Bench</Text>
      {bench.map((slot, i) => (
        <View key={i} style={[styles.rosterRow, styles.rosterRowBench]}>
          <Badge
            label="BN"
            color={colors.textMuted}
            textColor="#fff"
          />
          <Text style={styles.rosterPlayer}>
            {slot.playerName || 'Empty'}
          </Text>
          <Text style={styles.rosterPoints}>-</Text>
        </View>
      ))}
    </View>
  );
}

function MatchupTab() {
  const { currentWeek } = useFantasyStore();
  return (
    <View style={styles.tabContent}>
      <Card style={styles.matchupCard}>
        <Text style={styles.matchupWeek}>Week {currentWeek} Matchup</Text>
        <View style={styles.matchupVs}>
          <View style={styles.matchupTeam}>
            <Text style={styles.matchupTeamName}>Your Team</Text>
            <Text style={styles.matchupScore}>0.0</Text>
          </View>
          <Text style={styles.matchupVsText}>VS</Text>
          <View style={styles.matchupTeam}>
            <Text style={styles.matchupTeamName}>Opponent</Text>
            <Text style={styles.matchupScore}>0.0</Text>
          </View>
        </View>
        <Text style={styles.matchupStatus}>Waiting for game day...</Text>
      </Card>
    </View>
  );
}

function StandingsTab() {
  const { leagueTeams } = useFantasyStore();
  const sorted = [...leagueTeams].sort((a, b) => {
    if (b.record.wins !== a.record.wins) return b.record.wins - a.record.wins;
    return b.pointsFor - a.pointsFor;
  });

  return (
    <View style={styles.tabContent}>
      <View style={styles.standingsHeader}>
        <Text style={[styles.standingsHeaderText, { flex: 1 }]}>Team</Text>
        <Text style={styles.standingsHeaderText}>W-L</Text>
        <Text style={styles.standingsHeaderText}>PF</Text>
      </View>
      {sorted.map((team, i) => (
        <View key={team.id} style={styles.standingsRow}>
          <Text style={styles.standingsRank}>#{i + 1}</Text>
          <Text style={styles.standingsName}>{team.teamName}</Text>
          <Text style={styles.standingsRecord}>
            {team.record.wins}-{team.record.losses}
          </Text>
          <Text style={styles.standingsPF}>{team.pointsFor.toFixed(1)}</Text>
        </View>
      ))}
    </View>
  );
}

function WaiversTab() {
  const { waiverClaims, myTeam } = useFantasyStore();
  const myClaims = waiverClaims.filter(c => c.teamId === myTeam?.id);

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>My Waiver Claims</Text>
      {myClaims.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No pending claims</Text>
          <Text style={styles.emptySubtext}>Browse free agents to add players</Text>
        </Card>
      ) : (
        myClaims.map(claim => (
          <View key={claim.id} style={styles.claimRow}>
            <View style={styles.claimInfo}>
              <Text style={styles.claimAdd}>+ {claim.addPlayerName}</Text>
              {claim.dropPlayerName && (
                <Text style={styles.claimDrop}>- {claim.dropPlayerName}</Text>
              )}
            </View>
            <View style={styles.claimMeta}>
              <Text style={styles.claimBid}>${claim.faabBid}</Text>
              <Badge
                label={claim.status}
                color={claim.status === 'pending' ? colors.predictionOrange : colors.textMuted}
                textColor="#fff"
              />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function TradesTab() {
  const { trades, myTeam } = useFantasyStore();
  const myTrades = trades.filter(
    t => t.proposingTeamId === myTeam?.id || t.receivingTeamId === myTeam?.id
  );

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Trade Center</Text>
      {myTrades.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active trades</Text>
          <Text style={styles.emptySubtext}>Propose a trade from another team's roster</Text>
        </Card>
      ) : (
        myTrades.map(trade => (
          <Card key={trade.id} style={styles.tradeCard}>
            <View style={styles.tradeSide}>
              <Text style={styles.tradeLabel}>You send</Text>
              {trade.sendPlayerNames.map((name, i) => (
                <Text key={i} style={styles.tradePlayer}>{name}</Text>
              ))}
            </View>
            <Text style={styles.tradeArrow}>⇄</Text>
            <View style={styles.tradeSide}>
              <Text style={styles.tradeLabel}>You get</Text>
              {trade.receivePlayerNames.map((name, i) => (
                <Text key={i} style={styles.tradePlayer}>{name}</Text>
              ))}
            </View>
            <Badge
              label={trade.status}
              color={
                trade.status === 'accepted' ? colors.correct :
                trade.status === 'rejected' ? colors.incorrect :
                colors.predictionOrange
              }
              textColor="#fff"
            />
          </Card>
        ))
      )}
    </View>
  );
}

function ChatTab() {
  const { chatMessages, sendMessage } = useFantasyStore();
  const [text, setText] = React.useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  return (
    <View style={styles.tabContent}>
      {chatMessages.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Start the conversation!</Text>
        </Card>
      ) : (
        chatMessages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.chatBubble,
              msg.type === 'system' && styles.chatBubbleSystem,
            ]}
          >
            <Text style={styles.chatUser}>{msg.username}</Text>
            <Text style={styles.chatText}>{msg.text}</Text>
          </View>
        ))
      )}
      <View style={styles.chatInputRow}>
        <View style={styles.chatInput}>
          <Text style={styles.chatInputPlaceholder}>
            {text || 'Type a message...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.chatSend} onPress={handleSend}>
          <Text style={styles.chatSendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  leagueName: {
    color: colors.fantasyTeal,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
  },
  weekLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  teamCard: { marginBottom: spacing.md },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  teamRecord: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  teamStats: { alignItems: 'flex-end' },
  teamPF: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  teamBudget: {
    color: colors.correct,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  tabScroll: { marginBottom: spacing.md },
  tabRow: { gap: spacing.xs },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.fantasyTeal + '20',
    borderColor: colors.fantasyTeal,
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: colors.fantasyTeal,
    fontWeight: typography.fontWeight.bold,
  },
  content: { flex: 1 },
  tabContent: { paddingBottom: spacing.xxl },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  rosterRowBench: { opacity: 0.7 },
  rosterPlayer: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  rosterPoints: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    width: 40,
    textAlign: 'right',
  },
  // Matchup
  matchupCard: { alignItems: 'center', paddingVertical: spacing.xl },
  matchupWeek: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  matchupVs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  matchupTeam: { alignItems: 'center' },
  matchupTeamName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  matchupScore: {
    color: colors.accent,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
    marginTop: spacing.xs,
  },
  matchupVsText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  matchupStatus: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.md,
  },
  // Standings
  standingsHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  standingsHeaderText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    width: 50,
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  standingsRank: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    width: 30,
  },
  standingsName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  standingsRecord: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    width: 50,
    textAlign: 'center',
  },
  standingsPF: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    width: 50,
    textAlign: 'right',
  },
  // Empty states
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  // Waivers
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  claimInfo: { flex: 1 },
  claimAdd: {
    color: colors.correct,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  claimDrop: {
    color: colors.incorrect,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  claimMeta: { alignItems: 'flex-end', gap: spacing.xs },
  claimBid: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  // Trades
  tradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tradeSide: { flex: 1 },
  tradeLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  tradePlayer: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  tradeArrow: {
    color: colors.textMuted,
    fontSize: 20,
  },
  // Chat
  chatBubble: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatBubbleSystem: {
    backgroundColor: colors.fantasyTeal + '10',
    borderColor: colors.fantasyTeal + '30',
  },
  chatUser: {
    color: colors.accent,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  chatText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatInputPlaceholder: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  chatSend: {
    backgroundColor: colors.fantasyTeal,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  chatSendText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
