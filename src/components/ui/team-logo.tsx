import React from 'react';
import { Image, View, StyleSheet, StyleProp, ImageStyle } from 'react-native';
import { getTeamLogo } from '@/services/data/cfbd-cache';

interface TeamLogoProps {
  school: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function TeamLogo({ school, size = 24, style }: TeamLogoProps) {
  const logoUrl = getTeamLogo(school);
  if (!logoUrl) {
    return <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }, style as any]} />;
  }
  return (
    <Image
      source={{ uri: logoUrl }}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style as ImageStyle]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: '#2F2F52' },
});
