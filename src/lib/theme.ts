// ============================================================
// GridIron IQ — Brutalist CFB Design System
// ============================================================
// Sharp edges. Heavy borders. Stadium concrete. Bold type.
// Team colors bleed through every surface.

export const colors = {
  // Core palette — concrete & steel
  primary: '#0A0A0F',
  primaryLight: '#111118',
  accent: '#E2B714',
  accentLight: '#F5D547',

  // Game-specific accent colors
  gridGreen: '#00FF6A',
  statStackBlue: '#00B4FF',
  clashRed: '#FF2D2D',
  dynastyPurple: '#B44DFF',
  predictionOrange: '#FF6A00',
  fantasyTeal: '#00FFD1',

  // Feedback colors
  correct: '#00FF6A',
  incorrect: '#FF2D2D',
  warning: '#FFB800',

  // Neutrals — concrete stadium palette
  background: '#08080D',
  surface: '#0F0F16',
  surfaceLight: '#16161F',
  surfaceHighlight: '#1E1E2A',
  border: '#2A2A3A',
  borderHeavy: '#3A3A50',
  textPrimary: '#F0F0F0',
  textSecondary: '#8A8AA0',
  textMuted: '#55556A',

  // Rarity tiers
  rarityCommon: '#6A6A80',
  rarityUncommon: '#00B4FF',
  rarityRare: '#B44DFF',
  rarityEpic: '#FF6A00',
  rarityLegendary: '#FFD700',

  rarity: {
    common: '#6A6A80',
    uncommon: '#00B4FF',
    rare: '#B44DFF',
    epic: '#FF6A00',
    legendary: '#FFD700',
  },

  // Brutalist-specific
  white: '#F0F0F0',
  black: '#08080D',
  steel: '#2A2A3A',
  concrete: '#1A1A24',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Brutalist = sharp. Minimal rounding.
export const borderRadius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 4,
  xl: 4,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
  },

  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
    hero: 36,
    display: 48,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '900' as const,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  }),
} as const;

// --- Brutalist Border Styles ---

export const borders = {
  thin: { borderWidth: 1, borderColor: colors.border },
  thick: { borderWidth: 2, borderColor: colors.borderHeavy },
  heavy: { borderWidth: 3, borderColor: colors.white },
  accent: (color: string) => ({ borderWidth: 2, borderColor: color }),
  left: (color: string, width = 4) => ({
    borderLeftWidth: width,
    borderLeftColor: color,
  }),
  bottom: (color: string, width = 3) => ({
    borderBottomWidth: width,
    borderBottomColor: color,
  }),
} as const;

// --- Rarity Glow ---

export function getRarityGlow(score: number): {
  borderColor: string;
  borderWidth: number;
  shadowColor: string;
  shadowRadius: number;
} {
  if (score >= 95) return { borderColor: colors.rarity.legendary, borderWidth: 3, shadowColor: colors.rarity.legendary, shadowRadius: 16 };
  if (score >= 80) return { borderColor: colors.rarity.epic, borderWidth: 2, shadowColor: colors.rarity.epic, shadowRadius: 10 };
  if (score >= 60) return { borderColor: colors.rarity.rare, borderWidth: 2, shadowColor: colors.rarity.rare, shadowRadius: 8 };
  if (score >= 40) return { borderColor: colors.rarity.uncommon, borderWidth: 2, shadowColor: colors.rarity.uncommon, shadowRadius: 6 };
  return { borderColor: colors.border, borderWidth: 1, shadowColor: 'transparent', shadowRadius: 0 };
}

// --- Game Gradients ---

export const gameGradients = {
  grid: ['#00FF6A', '#008838'],
  statStack: ['#00B4FF', '#005580'],
  clash: ['#FF2D2D', '#801616'],
  dynasty: ['#B44DFF', '#5A2680'],
  prediction: ['#FF6A00', '#803500'],
  fantasy: ['#00FFD1', '#008068'],
};

// --- Brutalist Section Header ---

export const sectionHeaderStyle = {
  color: colors.textPrimary,
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.heavy as any,
  textTransform: 'uppercase' as const,
  letterSpacing: 3,
  borderBottomWidth: 3,
  borderBottomColor: colors.accent,
  paddingBottom: spacing.xs,
  marginBottom: spacing.md,
};

// --- Brutalist Card Base ---

export const cardBaseStyle = {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.sm,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.border,
};

// --- Team Color Theme ---

export interface TeamTheme {
  primary: string;
  secondary: string;
  text: string; // readable text color on primary bg
}

const DEFAULT_TEAM_THEME: TeamTheme = {
  primary: colors.accent,
  secondary: colors.surfaceHighlight,
  text: colors.black,
};

/** Get a team color theme. Returns default gold if team not found. */
export function getTeamTheme(teamColors?: { color: string; altColor: string } | null): TeamTheme {
  if (!teamColors || !teamColors.color) return DEFAULT_TEAM_THEME;

  const primary = teamColors.color;
  const secondary = teamColors.altColor || colors.surfaceHighlight;

  // Determine readable text: if primary is dark, use white; else use black
  const isLight = isLightColor(primary);
  return {
    primary,
    secondary,
    text: isLight ? '#0A0A0F' : '#F0F0F0',
  };
}

/** Simple luminance check */
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

// --- Stat Category Color ---

export function getRarityColor(percentile: number): string {
  if (percentile >= 95) return colors.rarityLegendary;
  if (percentile >= 80) return colors.rarityEpic;
  if (percentile >= 60) return colors.rarityRare;
  if (percentile >= 30) return colors.rarityUncommon;
  return colors.rarityCommon;
}

export function getStatCategoryColor(category: string): string {
  const map: Record<string, string> = {
    rushing_yards: colors.gridGreen,
    passing_tds: colors.statStackBlue,
    receiving_yards: colors.predictionOrange,
    sacks: colors.clashRed,
    interceptions: colors.dynastyPurple,
    total_tds: colors.accent,
    all_purpose_yards: colors.fantasyTeal,
  };
  return map[category] ?? colors.accent;
}
