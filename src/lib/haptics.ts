// ============================================================
// GridIron IQ — Haptic Feedback System
// ============================================================
// iOS-native haptic patterns for every game interaction.

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

/** Light tick — cell tap, option selection */
export function tapHaptic() {
  if (isIOS) Haptics.selectionAsync();
}

/** Satisfying double-tap — correct answer */
export function correctHaptic() {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Heavy buzz — wrong answer */
export function wrongHaptic() {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Strong thud — targeting penalty, ejection */
export function impactHeavyHaptic() {
  if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Medium impact — submit pick, confirm action */
export function impactMediumHaptic() {
  if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Light impact — scroll snap, badge appear */
export function impactLightHaptic() {
  if (isIOS) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Attention grab — score milestone, game complete */
export function milestoneHaptic() {
  if (isIOS) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
