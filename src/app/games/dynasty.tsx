import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDynastyStore } from '@/stores/dynasty-store';
import { DYNASTY_SLOTS } from '@/services/games/dynasty-engine';
import type { DynastyPlayer, DynastySlot } from '@/types';

const FEATURED_PROGRAMS = [
  { name: 'Alabama', color: '#9E1B32', wins: 953 },
  { name: 'Ohio State', color: '#BB0000', wins: 943 },
  { name: 'Michigan', color: '#00274C', wins: 976 },
  { name: 'Oklahoma', color: '#841617', wins: 919 },
  { name: 'Notre Dame', color: '#0C2340', wins: 929 },
  { name: 'USC', color: '#990000', wins: 854 },
  { name: 'Texas', color: '#BF5700', wins: 923 },
  { name: 'Georgia', color: '#BA0C2F', wins: 870 },
  { name: 'LSU', color: '#461D7C', wins: 808 },
  { name: 'Penn State', color: '#041E42', wins: 903 },
  { name: 'Clemson', color: '#F56600', wins: 774 },
  { name: 'Florida State', color: '#782F40', wins: 590 },
];

function PlayerPickerModal({
  slot,
  players,
  onSelect,
  onClose,
}: {
  slot: DynastySlot;
  players: DynastyPlayer[];
  onSelect: (player: DynastyPlayer) => void;
  onClose: () => void;
}) {
  const validPositions = slot.position === 'DB' ? ['DB', 'CB', 'S'] : [slot.position];
  const eligible = players.filter(p => validPositions.includes(p.position));

  return (
    <View style={styles.pickerOverlay}>
      <View style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Select {slot.label}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.pickerClose}>✕</Text>
          </TouchableOpacity>
        </View>
        {eligible.length === 0 ? (
          <Text style={styles.pickerEmpty}>No eligible players available</Text>
        ) : (
          <FlatList
            data={eligible.sort((a, b) => b.compositeScore - a.compositeScore)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.playerRow}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{item.name}</Text>
                  <Text style={styles.playerMeta}>
                    {item.position} · {item.seasons}
                    {item.awards.length > 0 ? ` · ${item.awards[0]}` : ''}
                  </Text>
                </View>
                <View style={styles.playerCostContainer}>
                  <Text style={styles.playerCost}>${item.cost.toFixed(1)}M</Text>
                  <Text style={styles.playerRating}>{item.compositeScore} OVR</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

export default function DynastyScreen() {
  const {
    gameState,
    availablePrograms,
    error,
    selectProgram,
    selectSlot,
    addPlayer,
    removePlayer,
    simulate,
    reset,
  } = useDynastyStore();

  // Program selection
  if (!gameState.program || !gameState.roster) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dynasty Builder</Text>
          <Text style={styles.subtitle}>
            Build the greatest all-time roster from one program
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Choose Your Program</Text>
        <View style={styles.programGrid}>
          {FEATURED_PROGRAMS.map((program) => {
            const isAvailable = availablePrograms.includes(program.name);
            return (
              <TouchableOpacity
                key={program.name}
                style={[
                  styles.programCard,
                  { borderColor: program.color + '60' },
                  !isAvailable && styles.programCardDisabled,
                ]}
                onPress={() => isAvailable && selectProgram(program.name)}
                activeOpacity={isAvailable ? 0.7 : 1}
              >
                <View style={[styles.programBadge, { backgroundColor: program.color }]}>
                  <Text style={styles.programInitial}>
                    {program.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.programName}>{program.name}</Text>
                <Text style={styles.programWins}>{program.wins} all-time wins</Text>
                {!isAvailable && (
                  <Badge label="Coming Soon" color={colors.textMuted} textColor="#fff" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  const { roster, availablePlayers, selectedSlot, simulationResult } = gameState;
  const filledCount = Object.values(roster.players).filter(p => p !== null).length;
  const capPct = (roster.totalCost / roster.salaryCap) * 100;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Selected Program Header */}
      <View style={styles.selectedHeader}>
        <Text style={styles.selectedProgram}>{gameState.program}</Text>
        <TouchableOpacity onPress={reset}>
          <Text style={styles.changeProgram}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Salary Cap */}
      <Card style={styles.salaryCard}>
        <View style={styles.salaryRow}>
          <Text style={styles.salaryLabel}>Salary Cap</Text>
          <Text style={styles.salaryValue}>${roster.salaryCap}M</Text>
        </View>
        <View style={styles.salaryRow}>
          <Text style={styles.salaryLabel}>Spent</Text>
          <Text style={styles.salarySpent}>${roster.totalCost.toFixed(1)}M</Text>
        </View>
        <View style={styles.salaryRow}>
          <Text style={styles.salaryLabel}>Remaining</Text>
          <Text style={styles.salaryRemaining}>
            ${(roster.salaryCap - roster.totalCost).toFixed(1)}M
          </Text>
        </View>
        <View style={styles.capBar}>
          <View style={[styles.capBarFill, { width: `${Math.min(capPct, 100)}%` }]} />
        </View>
      </Card>

      {/* Roster Slots */}
      <Text style={styles.sectionTitle}>Roster ({filledCount}/25)</Text>
      {DYNASTY_SLOTS.map((slot) => {
        const player = roster.players[slot.key];
        return (
          <TouchableOpacity
            key={slot.key}
            style={[
              styles.rosterSlot,
              player && styles.rosterSlotFilled,
            ]}
            onPress={() => {
              if (player) {
                removePlayer(slot.key);
              } else {
                selectSlot(slot.key);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rosterSlotLeft}>
              <Text style={styles.rosterPos}>{slot.label}</Text>
            </View>
            {player ? (
              <View style={styles.rosterPlayerInfo}>
                <Text style={styles.rosterPlayerName}>{player.name}</Text>
                <Text style={styles.rosterPlayerMeta}>
                  {player.seasons} · ${player.cost.toFixed(1)}M · {player.compositeScore} OVR
                </Text>
              </View>
            ) : (
              <Text style={styles.rosterEmpty}>Tap to add player</Text>
            )}
            <Text style={styles.rosterAction}>{player ? '✕' : '+'}</Text>
          </TouchableOpacity>
        );
      })}

      {/* Simulate Button */}
      <Button
        title={gameState.isComplete ? 'Simulate Matchup' : `Fill all 25 slots to simulate (${filledCount}/25)`}
        onPress={simulate}
        variant="primary"
        disabled={!gameState.isComplete}
        style={styles.simulateButton}
      />

      {/* Simulation Results */}
      {simulationResult && (
        <Card style={styles.simCard}>
          <Text style={styles.simTitle}>Simulation Results</Text>
          <Text style={styles.simMatchup}>
            {gameState.program} vs {simulationResult.opponentProgram}
          </Text>
          <Text style={styles.simWinPct}>
            {simulationResult.winProbability}% Win Probability
          </Text>
          <Text style={styles.simRecord}>
            {simulationResult.wins}W - {simulationResult.losses}L
            ({simulationResult.totalSimulations} simulations)
          </Text>
          <Text style={styles.simTopTitle}>Top Performers</Text>
          {simulationResult.topPerformers.map((p, i) => (
            <View key={i} style={styles.simPerformerRow}>
              <Text style={styles.simPerformerName}>{p.name}</Text>
              <Text style={styles.simPerformerDetail}>{p.position} · {p.rating} OVR</Text>
            </View>
          ))}
          <Button
            title="Simulate Again"
            onPress={simulate}
            variant="outline"
            style={{ marginTop: spacing.md }}
          />
        </Card>
      )}

      {/* Player Picker Modal */}
      {selectedSlot && (
        <PlayerPickerModal
          slot={DYNASTY_SLOTS.find(s => s.key === selectedSlot)!}
          players={availablePlayers}
          onSelect={(player) => addPlayer(selectedSlot, player)}
          onClose={() => selectSlot(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.lg },
  title: {
    color: colors.dynastyPurple,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
  },
  subtitle: {
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
    marginBottom: spacing.md,
  },
  programGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  programCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  programCardDisabled: { opacity: 0.5 },
  programBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  programInitial: {
    color: '#fff',
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
  },
  programName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  programWins: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectedProgram: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
  },
  changeProgram: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  errorContainer: {
    backgroundColor: colors.incorrect + '20',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.incorrect,
    fontSize: typography.fontSize.sm,
  },
  salaryCard: { marginBottom: spacing.lg },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  salaryLabel: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  salaryValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  salarySpent: {
    color: colors.incorrect,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  salaryRemaining: {
    color: colors.correct,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  capBar: {
    height: 6,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 3,
    marginTop: spacing.sm,
  },
  capBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  rosterSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  rosterSlotFilled: {
    borderColor: colors.dynastyPurple + '40',
  },
  rosterSlotLeft: {
    width: 48,
  },
  rosterPos: {
    color: colors.dynastyPurple,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  rosterPlayerInfo: { flex: 1 },
  rosterPlayerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  rosterPlayerMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  rosterEmpty: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  rosterAction: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xl,
    marginLeft: spacing.md,
  },
  simulateButton: { marginTop: spacing.lg, marginBottom: spacing.lg },
  simCard: { marginBottom: spacing.lg },
  simTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  simMatchup: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  simWinPct: {
    color: colors.accent,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  simRecord: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  simTopTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  simPerformerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  simPerformerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  simPerformerDetail: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  // Player picker modal
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 100,
    padding: spacing.md,
  },
  pickerContainer: { flex: 1 },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  pickerClose: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xl,
    padding: spacing.sm,
  },
  pickerEmpty: {
    color: colors.textMuted,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
  },
  playerInfo: { flex: 1 },
  playerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  playerMeta: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  playerCostContainer: { alignItems: 'flex-end' },
  playerCost: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  playerRating: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});
