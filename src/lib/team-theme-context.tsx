// ============================================================
// GridIron IQ — Team Theme Context
// ============================================================
// Provides team-colored accents throughout the app based on
// the user's favorite school selection.

import React, { createContext, useContext, useMemo } from 'react';
import { colors, getTeamTheme, type TeamTheme } from '@/lib/theme';
import { useUserStore } from '@/stores/user-store';
import { getAllTeams } from '@/services/data/cfbd-cache';

interface TeamThemeContextValue {
  teamTheme: TeamTheme;
  favoriteTeam: string | undefined;
  teamLogo: string | undefined;
}

const defaultValue: TeamThemeContextValue = {
  teamTheme: { primary: colors.accent, secondary: colors.surfaceHighlight, text: colors.black },
  favoriteTeam: undefined,
  teamLogo: undefined,
};

const TeamThemeContext = createContext<TeamThemeContextValue>(defaultValue);

export function TeamThemeProvider({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user);
  const favoriteTeam = user?.favoriteTeam;

  const value = useMemo<TeamThemeContextValue>(() => {
    if (!favoriteTeam) return defaultValue;

    const allTeams = getAllTeams();
    const team = allTeams.find(
      (t) => t.school.toLowerCase() === favoriteTeam.toLowerCase()
    );

    if (!team || !team.color) return { ...defaultValue, favoriteTeam };

    return {
      teamTheme: getTeamTheme({ color: team.color, altColor: team.altColor }),
      favoriteTeam,
      teamLogo: team.logos?.[0],
    };
  }, [favoriteTeam]);

  return (
    <TeamThemeContext.Provider value={value}>
      {children}
    </TeamThemeContext.Provider>
  );
}

export function useTeamTheme(): TeamThemeContextValue {
  return useContext(TeamThemeContext);
}
