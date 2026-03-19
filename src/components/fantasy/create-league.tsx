import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFantasyStore } from '@/stores/fantasy-store';

interface CreateLeagueProps {
  onClose: () => void;
}

export function CreateLeague({ onClose }: CreateLeagueProps) {
  const { createLeague } = useFantasyStore();
  const [name, setName] = useState('');
  const [scoringType, setScoringType] = useState<'standard' | 'half_ppr' | 'full_ppr'>('half_ppr');
  const [draftType, setDraftType] = useState<'snake' | 'auction'>('snake');
  const [teamCount, setTeamCount] = useState(10);

  const handleCreate = () => {
    if (!name.trim()) return;
    createLeague(name.trim(), scoringType, draftType, teamCount);
    onClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create League</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>League Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter league name..."
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Text style={styles.label}>Scoring Format</Text>
      <View style={styles.optionRow}>
        {([
          { key: 'standard', label: 'Standard' },
          { key: 'half_ppr', label: 'Half PPR' },
          { key: 'full_ppr', label: 'Full PPR' },
        ] as const).map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.optionChip, scoringType === opt.key && styles.optionChipActive]}
            onPress={() => setScoringType(opt.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, scoringType === opt.key && styles.optionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Draft Type</Text>
      <View style={styles.optionRow}>
        {([
          { key: 'snake', label: 'Snake Draft' },
          { key: 'auction', label: 'Auction Draft' },
        ] as const).map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.optionChip, draftType === opt.key && styles.optionChipActive]}
            onPress={() => setDraftType(opt.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, draftType === opt.key && styles.optionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Number of Teams</Text>
      <View style={styles.optionRow}>
        {[8, 10, 12, 14].map(n => (
          <TouchableOpacity
            key={n}
            style={[styles.optionChip, teamCount === n && styles.optionChipActive]}
            onPress={() => setTeamCount(n)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, teamCount === n && styles.optionTextActive]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scoring breakdown */}
      <Card style={styles.previewCard}>
        <Text style={styles.previewTitle}>Scoring Preview</Text>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Passing TD</Text>
          <Text style={styles.previewValue}>4 pts</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Rushing/Receiving TD</Text>
          <Text style={styles.previewValue}>6 pts</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Reception</Text>
          <Text style={styles.previewValue}>
            {scoringType === 'standard' ? '0' : scoringType === 'half_ppr' ? '0.5' : '1'} pts
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>25 Pass Yds / 10 Rush-Rec Yds</Text>
          <Text style={styles.previewValue}>1 pt</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Interception / Fumble</Text>
          <Text style={styles.previewValue}>-2 pts</Text>
        </View>
      </Card>

      <Button
        title="Create League"
        onPress={handleCreate}
        variant="primary"
        disabled={!name.trim()}
        style={styles.createButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.fantasyTeal,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
  },
  close: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xl,
    padding: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.fantasyTeal + '20',
    borderColor: colors.fantasyTeal,
  },
  optionText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  optionTextActive: {
    color: colors.fantasyTeal,
    fontWeight: typography.fontWeight.bold,
  },
  previewCard: { marginTop: spacing.lg },
  previewTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  previewLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  previewValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  createButton: { marginTop: spacing.lg },
});
