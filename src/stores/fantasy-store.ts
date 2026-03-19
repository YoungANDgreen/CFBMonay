// ============================================================
// GridIron IQ — Fantasy Football State Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type {
  FantasyLeague,
  FantasyTeam,
  ScoringSettings,
  RosterSettings,
  DraftState,
  DraftPick,
  FantasyPlayerInfo,
  WaiverClaim,
  TradeProposal,
  TradeAnalysis,
  FantasyMatchup,
  FantasySchedule,
  FantasyWeekScore,
  FantasyChatMessage,
} from '@/types';

// --- League Management ---

interface FantasyStore {
  // State
  leagues: FantasyLeague[];
  activeLeague: FantasyLeague | null;
  myTeam: FantasyTeam | null;
  leagueTeams: FantasyTeam[];
  draft: DraftState | null;
  schedule: FantasySchedule | null;
  weekScores: FantasyWeekScore[];
  waiverClaims: WaiverClaim[];
  trades: TradeProposal[];
  chatMessages: FantasyChatMessage[];
  currentWeek: number;
  error: string | null;

  // View state
  activeTab: 'my_team' | 'matchup' | 'standings' | 'draft' | 'waivers' | 'trades' | 'chat';

  // League actions
  createLeague: (name: string, scoringType: 'standard' | 'half_ppr' | 'full_ppr', draftType: 'snake' | 'auction', maxTeams: number) => void;
  joinLeague: (leagueId: string, teamName: string) => void;
  setActiveLeague: (league: FantasyLeague | null) => void;

  // Draft actions
  startDraft: () => void;
  makePick: (playerId: string) => void;
  autoPick: () => void;

  // Roster actions
  setActiveTab: (tab: FantasyStore['activeTab']) => void;
  movePlayer: (playerId: string, toStarter: boolean) => void;

  // Waiver actions
  submitWaiverClaim: (addPlayerId: string, addPlayerName: string, dropPlayerId: string | null, dropPlayerName: string | null, faabBid: number) => void;
  cancelWaiver: (claimId: string) => void;

  // Trade actions
  proposeTrade: (receivingTeamId: string, sendPlayerIds: string[], sendPlayerNames: string[], receivePlayerIds: string[], receivePlayerNames: string[], message?: string) => void;
  respondToTrade: (tradeId: string, response: 'accepted' | 'rejected') => void;

  // Chat
  sendMessage: (text: string) => void;

  // Reset
  reset: () => void;
}

const DEFAULT_SCORING_STANDARD: ScoringSettings = {
  passingYardsPerPoint: 25,
  passingTD: 4,
  interception: -2,
  rushingYardsPerPoint: 10,
  rushingTD: 6,
  receivingYardsPerPoint: 10,
  receivingTD: 6,
  reception: 0,
  fumbleLost: -2,
};

const DEFAULT_SCORING_HALF_PPR: ScoringSettings = {
  ...DEFAULT_SCORING_STANDARD,
  reception: 0.5,
};

const DEFAULT_SCORING_FULL_PPR: ScoringSettings = {
  ...DEFAULT_SCORING_STANDARD,
  reception: 1,
};

const DEFAULT_ROSTER: RosterSettings = {
  qb: 1,
  rb: 2,
  wr: 2,
  te: 1,
  flex: 1,
  dst: 1,
  k: 1,
  bench: 6,
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getScoringSettings(type: 'standard' | 'half_ppr' | 'full_ppr'): ScoringSettings {
  switch (type) {
    case 'half_ppr': return DEFAULT_SCORING_HALF_PPR;
    case 'full_ppr': return DEFAULT_SCORING_FULL_PPR;
    default: return DEFAULT_SCORING_STANDARD;
  }
}

export const useFantasyStore = create<FantasyStore>((set, get) => ({
  leagues: [],
  activeLeague: null,
  myTeam: null,
  leagueTeams: [],
  draft: null,
  schedule: null,
  weekScores: [],
  waiverClaims: [],
  trades: [],
  chatMessages: [],
  currentWeek: 1,
  error: null,
  activeTab: 'my_team',

  createLeague: (name, scoringType, draftType, maxTeams) => {
    const league: FantasyLeague = {
      id: generateId(),
      name,
      commissionerId: 'current-user',
      scoringSettings: getScoringSettings(scoringType),
      rosterSettings: DEFAULT_ROSTER,
      maxTeams,
      draftType,
      seasonYear: new Date().getFullYear(),
      status: 'pre_draft',
    };

    // Auto-create commissioner's team
    const myTeam: FantasyTeam = {
      id: generateId(),
      leagueId: league.id,
      userId: 'current-user',
      teamName: `${name} Team 1`,
      roster: generateEmptyRoster(DEFAULT_ROSTER),
      record: { wins: 0, losses: 0, ties: 0 },
      pointsFor: 0,
      pointsAgainst: 0,
      waiverBudget: 100,
    };

    // Generate AI teams to fill the league
    const aiTeams = generateAITeams(league.id, maxTeams - 1, DEFAULT_ROSTER);

    set(state => ({
      leagues: [...state.leagues, league],
      activeLeague: league,
      myTeam: myTeam,
      leagueTeams: [myTeam, ...aiTeams],
      error: null,
    }));
  },

  joinLeague: (leagueId, teamName) => {
    const { leagues } = get();
    const league = leagues.find(l => l.id === leagueId);
    if (!league) {
      set({ error: 'League not found' });
      return;
    }

    const myTeam: FantasyTeam = {
      id: generateId(),
      leagueId,
      userId: 'current-user',
      teamName,
      roster: generateEmptyRoster(league.rosterSettings),
      record: { wins: 0, losses: 0, ties: 0 },
      pointsFor: 0,
      pointsAgainst: 0,
      waiverBudget: 100,
    };

    set(state => ({
      activeLeague: league,
      myTeam,
      leagueTeams: [...state.leagueTeams, myTeam],
      error: null,
    }));
  },

  setActiveLeague: (league) => set({ activeLeague: league }),

  startDraft: () => {
    // Draft initialization handled by draft-engine
    // This is a placeholder — the actual implementation calls initializeDraft
    const { activeLeague, leagueTeams } = get();
    if (!activeLeague) return;

    set({
      activeTab: 'draft',
      chatMessages: [{
        id: generateId(),
        leagueId: activeLeague.id,
        userId: 'system',
        username: 'System',
        text: 'The draft has started! Good luck!',
        timestamp: Date.now(),
        type: 'system',
      }],
    });
  },

  makePick: (playerId) => {
    // Placeholder — actual pick logic in draft-engine.ts
    const { draft } = get();
    if (!draft) return;
    // Will be wired to draft-engine.makeDraftPick()
  },

  autoPick: () => {
    const { draft } = get();
    if (!draft) return;
    // Will be wired to draft-engine.autoPickForTeam()
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  movePlayer: (playerId, toStarter) => {
    const { myTeam } = get();
    if (!myTeam) return;

    const newRoster = myTeam.roster.map(slot => {
      if (slot.playerId === playerId) {
        return { ...slot, isStarter: toStarter };
      }
      return slot;
    });

    set({ myTeam: { ...myTeam, roster: newRoster } });
  },

  submitWaiverClaim: (addPlayerId, addPlayerName, dropPlayerId, dropPlayerName, faabBid) => {
    const { activeLeague, myTeam, waiverClaims } = get();
    if (!activeLeague || !myTeam) return;

    if (faabBid > myTeam.waiverBudget) {
      set({ error: `Insufficient FAAB budget. You have $${myTeam.waiverBudget} remaining.` });
      return;
    }

    const claim: WaiverClaim = {
      id: generateId(),
      leagueId: activeLeague.id,
      teamId: myTeam.id,
      addPlayerId,
      addPlayerName,
      dropPlayerId,
      dropPlayerName,
      faabBid,
      priority: 0,
      status: 'pending',
      submittedAt: Date.now(),
    };

    set({ waiverClaims: [...waiverClaims, claim], error: null });
  },

  cancelWaiver: (claimId) => {
    set(state => ({
      waiverClaims: state.waiverClaims.map(c =>
        c.id === claimId ? { ...c, status: 'cancelled' as const } : c
      ),
    }));
  },

  proposeTrade: (receivingTeamId, sendPlayerIds, sendPlayerNames, receivePlayerIds, receivePlayerNames, message) => {
    const { activeLeague, myTeam, trades, leagueTeams } = get();
    if (!activeLeague || !myTeam) return;

    const trade: TradeProposal = {
      id: generateId(),
      leagueId: activeLeague.id,
      proposingTeamId: myTeam.id,
      receivingTeamId,
      sendPlayerIds,
      receivePlayerIds,
      sendPlayerNames,
      receivePlayerNames,
      message,
      status: 'pending',
      proposedAt: Date.now(),
      vetoVotes: 0,
      vetoThreshold: Math.ceil(leagueTeams.length / 2),
    };

    const chatMsg: FantasyChatMessage = {
      id: generateId(),
      leagueId: activeLeague.id,
      userId: 'system',
      username: 'System',
      text: `${myTeam.teamName} proposed a trade with ${leagueTeams.find(t => t.id === receivingTeamId)?.teamName || 'Unknown'}`,
      timestamp: Date.now(),
      type: 'trade',
    };

    set({
      trades: [...trades, trade],
      chatMessages: [...get().chatMessages, chatMsg],
      error: null,
    });
  },

  respondToTrade: (tradeId, response) => {
    set(state => ({
      trades: state.trades.map(t =>
        t.id === tradeId
          ? { ...t, status: response, respondedAt: Date.now() }
          : t
      ),
    }));
  },

  sendMessage: (text) => {
    const { activeLeague } = get();
    if (!activeLeague) return;

    const msg: FantasyChatMessage = {
      id: generateId(),
      leagueId: activeLeague.id,
      userId: 'current-user',
      username: 'You',
      text,
      timestamp: Date.now(),
      type: 'message',
    };

    set(state => ({ chatMessages: [...state.chatMessages, msg] }));
  },

  reset: () => set({
    leagues: [],
    activeLeague: null,
    myTeam: null,
    leagueTeams: [],
    draft: null,
    schedule: null,
    weekScores: [],
    waiverClaims: [],
    trades: [],
    chatMessages: [],
    currentWeek: 1,
    error: null,
    activeTab: 'my_team',
  }),
}));

// --- Helpers ---

function generateEmptyRoster(settings: RosterSettings): import('@/types').RosterSlot[] {
  const slots: import('@/types').RosterSlot[] = [];
  const addSlots = (pos: string, count: number, starter: boolean) => {
    for (let i = 0; i < count; i++) {
      slots.push({ position: pos, playerId: null, isStarter: starter });
    }
  };

  addSlots('QB', settings.qb, true);
  addSlots('RB', settings.rb, true);
  addSlots('WR', settings.wr, true);
  addSlots('TE', settings.te, true);
  addSlots('FLEX', settings.flex, true);
  addSlots('DST', settings.dst, true);
  addSlots('K', settings.k, true);
  addSlots('BN', settings.bench, false);

  return slots;
}

const AI_TEAM_NAMES = [
  'Touchdown Titans', 'Blitz Brigade', 'Gridiron Gladiators',
  'Red Zone Raiders', 'Hail Mary Heroes', 'Sack Attack Squad',
  'End Zone Eagles', 'Fourth Down Fury', 'Pigskin Predators',
  'Scramble Kings', 'Punt Return Panthers', 'Chain Movers',
];

function generateAITeams(leagueId: string, count: number, rosterSettings: RosterSettings): FantasyTeam[] {
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    leagueId,
    userId: `ai-${i + 1}`,
    teamName: AI_TEAM_NAMES[i % AI_TEAM_NAMES.length],
    roster: generateEmptyRoster(rosterSettings),
    record: { wins: 0, losses: 0, ties: 0 },
    pointsFor: 0,
    pointsAgainst: 0,
    waiverBudget: 100,
  }));
}
