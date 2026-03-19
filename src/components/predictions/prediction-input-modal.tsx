import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/theme';
import type { GamePrediction, UserPrediction } from '@/types';

type PredictionType = UserPrediction['predictionType'];

const PREDICTION_TABS: { key: PredictionType; label: string }[] = [
  { key: 'winner', label: 'Winner' },
  { key: 'spread', label: 'Spread' },
  { key: 'over_under', label: 'O/U' },
  { key: 'exact_score', label: 'Exact Score' },
];

interface PredictionInputModalProps {
  visible: boolean;
  game: GamePrediction | null;
  onClose: () => void;
  onSubmit: (type: UserPrediction['predictionType'], value: string) => void;
}

export function PredictionInputModal({
  visible,
  game,
  onClose,
  onSubmit,
}: PredictionInputModalProps) {
  const [activeTab, setActiveTab] = useState<PredictionType>('winner');
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [spreadInput, setSpreadInput] = useState('');
  const [overUnderPick, setOverUnderPick] = useState<'over' | 'under' | null>(null);
  const [homeScoreInput, setHomeScoreInput] = useState('');
  const [awayScoreInput, setAwayScoreInput] = useState('');

  useEffect(() => {
    if (visible) {
      setActiveTab('winner');
      setSelectedWinner(null);
      setSpreadInput('');
      setOverUnderPick(null);
      setHomeScoreInput('');
      setAwayScoreInput('');
    }
  }, [visible]);

  if (!game) return null;

  const { spread, total } = game.predictions;

  const isSubmitDisabled = (): boolean => {
    switch (activeTab) {
      case 'winner':
        return selectedWinner === null;
      case 'spread':
        return spreadInput.trim() === '' || isNaN(Number(spreadInput));
      case 'over_under':
        return overUnderPick === null;
      case 'exact_score':
        return (
          homeScoreInput.trim() === '' ||
          awayScoreInput.trim() === '' ||
          isNaN(Number(homeScoreInput)) ||
          isNaN(Number(awayScoreInput))
        );
      default:
        return true;
    }
  };

  const buildSubmitValue = (): string => {
    switch (activeTab) {
      case 'winner':
        return selectedWinner ?? '';
      case 'spread':
        return spreadInput.trim();
      case 'over_under':
        return overUnderPick ?? '';
      case 'exact_score':
        return `${awayScoreInput.trim()}-${homeScoreInput.trim()}`;
      default:
        return '';
    }
  };

  const handleSubmit = () => {
    if (isSubmitDisabled()) return;
    onSubmit(activeTab, buildSubmitValue());
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'winner':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionHint}>Pick the winner</Text>
            <View style={styles.teamButtonRow}>
              <TouchableOpacity
                style={[
                  styles.teamButton,
                  selectedWinner === game.awayTeam && styles.teamButtonSelected,
                ]}
                onPress={() => setSelectedWinner(game.awayTeam)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.teamButtonText,
                    selectedWinner === game.awayTeam && styles.teamButtonTextSelected,
                  ]}
                >
                  {game.awayTeam}
                </Text>
                <Text style={styles.teamButtonLabel}>AWAY</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.teamButton,
                  selectedWinner === game.homeTeam && styles.teamButtonSelected,
                ]}
                onPress={() => setSelectedWinner(game.homeTeam)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.teamButtonText,
                    selectedWinner === game.homeTeam && styles.teamButtonTextSelected,
                  ]}
                >
                  {game.homeTeam}
                </Text>
                <Text style={styles.teamButtonLabel}>HOME</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'spread':
        return (
          <View style={styles.contentSection}>
            <View style={styles.modelLine}>
              <Text style={styles.modelLineLabel}>Model spread</Text>
              <Text style={styles.modelLineValue}>
                {spread.favored}{' '}
                {spread.value > 0
                  ? `-${spread.value.toFixed(1)}`
                  : `+${Math.abs(spread.value).toFixed(1)}`}
              </Text>
            </View>
            <Text style={styles.sectionHint}>
              Enter your predicted spread (positive = home favored)
            </Text>
            <TextInput
              style={styles.textInput}
              value={spreadInput}
              onChangeText={setSpreadInput}
              keyboardType="numeric"
              placeholder="e.g. -7.5"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
            />
          </View>
        );

      case 'over_under':
        return (
          <View style={styles.contentSection}>
            <View style={styles.modelLine}>
              <Text style={styles.modelLineLabel}>Model total</Text>
              <Text style={styles.modelLineValue}>{total.value.toFixed(1)}</Text>
            </View>
            <Text style={styles.sectionHint}>Will the combined score go over or under?</Text>
            <View style={styles.teamButtonRow}>
              <TouchableOpacity
                style={[
                  styles.ouButton,
                  overUnderPick === 'over' && styles.ouButtonSelected,
                ]}
                onPress={() => setOverUnderPick('over')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.ouButtonText,
                    overUnderPick === 'over' && styles.ouButtonTextSelected,
                  ]}
                >
                  Over
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ouButton,
                  overUnderPick === 'under' && styles.ouButtonSelected,
                ]}
                onPress={() => setOverUnderPick('under')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.ouButtonText,
                    overUnderPick === 'under' && styles.ouButtonTextSelected,
                  ]}
                >
                  Under
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'exact_score':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionHint}>Predict the final score</Text>
            <View style={styles.scoreInputRow}>
              <View style={styles.scoreInputCol}>
                <Text style={styles.scoreTeamLabel}>{game.awayTeam}</Text>
                <TextInput
                  style={styles.textInput}
                  value={awayScoreInput}
                  onChangeText={setAwayScoreInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                />
              </View>
              <Text style={styles.scoreDash}>-</Text>
              <View style={styles.scoreInputCol}>
                <Text style={styles.scoreTeamLabel}>{game.homeTeam}</Text>
                <TextInput
                  style={styles.textInput}
                  value={homeScoreInput}
                  onChangeText={setHomeScoreInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>

            {/* Matchup header */}
            <View style={styles.matchupHeader}>
              <Text style={styles.matchupAway}>{game.awayTeam}</Text>
              <Text style={styles.matchupAt}>@</Text>
              <Text style={styles.matchupHome}>{game.homeTeam}</Text>
            </View>

            {/* Tab / segment control */}
            <View style={styles.tabRow}>
              {PREDICTION_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tab,
                    activeTab === tab.key && styles.tabActive,
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.key && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab content */}
            {renderTabContent()}

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitDisabled() && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled()}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  isSubmitDisabled() && styles.submitButtonTextDisabled,
                ]}
              >
                Submit Prediction
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
    ...shadows.lg,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },

  // Matchup header
  matchupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  matchupAway: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  matchupAt: {
    color: colors.textMuted,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  matchupHome: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },

  // Tab bar
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.predictionOrange,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },

  // Shared content section
  contentSection: {
    marginBottom: spacing.lg,
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  // Winner tab
  teamButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  teamButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  teamButtonSelected: {
    borderColor: colors.predictionOrange,
    backgroundColor: colors.predictionOrange + '18',
  },
  teamButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  teamButtonTextSelected: {
    color: colors.predictionOrange,
  },
  teamButtonLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },

  // Spread tab - model line
  modelLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  modelLineLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  modelLineValue: {
    color: colors.predictionOrange,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },

  // Text input (spread + exact score)
  textInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },

  // Over/Under buttons
  ouButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  ouButtonSelected: {
    borderColor: colors.predictionOrange,
    backgroundColor: colors.predictionOrange + '18',
  },
  ouButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  ouButtonTextSelected: {
    color: colors.predictionOrange,
  },

  // Exact score inputs
  scoreInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreInputCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreTeamLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  scoreDash: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.lg,
  },

  // Submit button
  submitButton: {
    backgroundColor: colors.predictionOrange,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.surfaceHighlight,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  submitButtonTextDisabled: {
    color: colors.textMuted,
  },
});
