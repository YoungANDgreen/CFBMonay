import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, ViewStyle } from 'react-native';
import { colors } from '@/lib/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PullToRefresh({
  children,
  onRefresh,
  style,
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      style={style}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.background}
        />
      }
    >
      {children}
    </ScrollView>
  );
}
