import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/lib/theme';

// Prediction Arena game screen — reuses the predict tab for now
// Full standalone version will include:
// - Season-long prediction leagues
// - Detailed model factor breakdowns
// - Backtesting dashboard
// - Upset alert notifications

export { default } from '../(tabs)/predict';
