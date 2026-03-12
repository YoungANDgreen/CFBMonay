import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { searchPlayers, getAllTeams, getPlayerSeasons } from '@/services/data/cfbd-cache';
import { TeamLogo } from '@/components/ui/team-logo';
import type { Player } from '@/types';

interface PlayerSearchProps {
  onSelectPlayer: (player: Player, year?: number) => void;
  placeholder?: string;
  showYearSelector?: boolean;
}

// Team -> conference lookup (built lazily)
let _confLookup: Map<string, string> | null = null;
function getConfLookup(): Map<string, string> {
  if (!_confLookup) {
    _confLookup = new Map();
    for (const t of getAllTeams()) {
      _confLookup.set(t.school.toLowerCase(), t.conference);
    }
  }
  return _confLookup;
}

// Extended result with year range info for display
interface PlayerSearchResult extends Player {
  yearRange: string;
}

// Search real CFBD cache data
function searchCachePlayers(query: string): PlayerSearchResult[] {
  if (query.length < 2) return [];

  const confLookup = getConfLookup();
  const cached = searchPlayers(query);

  return cached.slice(0, 12).map(p => {
    const fullName = `${p.firstName} ${p.lastName}`;
    const seasons = getPlayerSeasons(fullName);
    const yearRange = seasons.length > 0
      ? `${seasons[0]}-${seasons[seasons.length - 1]}`
      : '';

    return {
      id: String(p.id),
      name: fullName,
      position: p.position as Player['position'],
      school: p.team,
      conference: (confLookup.get(p.team.toLowerCase()) || '') as Player['conference'],
      seasons: [],
      awards: [],
      yearRange,
    };
  });
}

export function PlayerSearch({
  onSelectPlayer,
  placeholder = 'Search players...',
  showYearSelector = false,
}: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerSeasons, setPlayerSeasons] = useState<number[]>([]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    // Small delay for debouncing rapid keystrokes
    setTimeout(() => {
      const found = searchCachePlayers(text);
      setResults(found);
      setIsSearching(false);
    }, 100);
  }, []);

  const handleSelect = (player: Player) => {
    if (showYearSelector) {
      const seasons = getPlayerSeasons(player.name);
      if (seasons.length > 0) {
        setSelectedPlayer(player);
        setPlayerSeasons(seasons);
        setResults([]);
      } else {
        // No season data -- fall back to immediate selection
        onSelectPlayer(player);
        setQuery('');
        setResults([]);
      }
    } else {
      onSelectPlayer(player);
      setQuery('');
      setResults([]);
    }
  };

  const handleYearSelect = (year: number) => {
    if (selectedPlayer) {
      onSelectPlayer(selectedPlayer, year);
      setSelectedPlayer(null);
      setPlayerSeasons([]);
      setQuery('');
      setResults([]);
    }
  };

  const handleCancelYearSelect = () => {
    setSelectedPlayer(null);
    setPlayerSeasons([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.searchIcon}>&#x1F50D;</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleSearch}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {isSearching && <ActivityIndicator color={colors.accent} size="small" />}
      </View>

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <TeamLogo school={item.school} size={32} style={styles.teamLogo} />
                <View style={styles.resultContent}>
                  <Text style={styles.playerName}>{item.name}</Text>
                  <View style={styles.playerMeta}>
                    <Text style={styles.positionBadge}>{item.position}</Text>
                    <Text style={styles.schoolText}>{item.school}</Text>
                    <Text style={styles.confText}>{item.conference}</Text>
                    {item.yearRange !== '' && (
                      <Text style={styles.yearRangeText}>({item.yearRange})</Text>
                    )}
                  </View>
                </View>
                {item.awards && item.awards.length > 0 && (
                  <Text style={styles.awardBadge}>
                    {item.awards[0]}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {selectedPlayer && showYearSelector && (
        <View style={styles.yearSelector}>
          <View style={styles.yearHeader}>
            <Text style={styles.yearLabel}>Select Season for {selectedPlayer.name}:</Text>
            <TouchableOpacity onPress={handleCancelYearSelect}>
              <Text style={styles.yearCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {playerSeasons.map(year => (
              <TouchableOpacity
                key={year}
                style={styles.yearChip}
                onPress={() => handleYearSelect(year)}
              >
                <Text style={styles.yearChipText}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
  },
  resultsContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamLogo: {
    marginRight: spacing.sm,
  },
  resultContent: {
    flex: 1,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: spacing.sm,
  },
  positionBadge: {
    color: colors.accent,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  schoolText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  confText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  yearRangeText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
  },
  awardBadge: {
    color: colors.accent,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    backgroundColor: 'rgba(226, 183, 20, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  yearSelector: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  yearLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  yearCancelText: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  yearChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearChipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
