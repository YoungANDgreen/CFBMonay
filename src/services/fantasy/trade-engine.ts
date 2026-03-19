// ============================================================
// GridIron IQ — Fantasy Football Trade Engine
// AI-powered trade analyzer with pure functions
// ============================================================

import type {
  TradeProposal,
  TradeAnalysis,
  FantasyPlayerInfo,
  FantasyTeam,
  RosterSlot,
} from '@/types';

// --- ID Generation ---

let tradeIdCounter = 0;

function generateTradeId(): string {
  tradeIdCounter += 1;
  return `trade_${Date.now()}_${tradeIdCounter}`;
}

// --- Positional Scarcity Multipliers ---

const POSITIONAL_SCARCITY: Record<string, number> = {
  QB: 1.3,
  RB: 1.1,
  WR: 1.0,
  TE: 1.25,
  K: 0.6,
  DST: 0.6,
};

function getPositionalScarcity(position: string): number {
  return POSITIONAL_SCARCITY[position] ?? 1.0;
}

// --- Trade Proposal Lifecycle ---

export function createTradeProposal(
  leagueId: string,
  proposingTeamId: string,
  receivingTeamId: string,
  sendPlayerIds: string[],
  sendPlayerNames: string[],
  receivePlayerIds: string[],
  receivePlayerNames: string[],
  message?: string,
  leagueSize: number = 10
): TradeProposal {
  return {
    id: generateTradeId(),
    leagueId,
    proposingTeamId,
    receivingTeamId,
    sendPlayerIds,
    receivePlayerIds,
    sendPlayerNames,
    receivePlayerNames,
    message,
    status: 'pending',
    proposedAt: Date.now(),
    vetoVotes: 0,
    vetoThreshold: Math.ceil(leagueSize / 2),
  };
}

export function respondToTrade(
  proposal: TradeProposal,
  response: 'accepted' | 'rejected'
): TradeProposal {
  return {
    ...proposal,
    status: response,
    respondedAt: Date.now(),
  };
}

export function cancelTrade(proposal: TradeProposal): TradeProposal {
  return {
    ...proposal,
    status: 'cancelled',
    respondedAt: Date.now(),
  };
}

export function addVetoVote(proposal: TradeProposal): TradeProposal {
  const newVetoVotes = proposal.vetoVotes + 1;
  const isVetoed = newVetoVotes >= proposal.vetoThreshold;

  return {
    ...proposal,
    vetoVotes: newVetoVotes,
    status: isVetoed ? 'vetoed' : proposal.status,
    respondedAt: isVetoed ? Date.now() : proposal.respondedAt,
  };
}

// --- Trade Execution ---

function validateRosterAfterSwap(
  roster: RosterSlot[],
  removePlayerIds: string[],
  addPlayerIds: string[]
): boolean {
  const removeSet = new Set(removePlayerIds);
  const remainingPlayers = roster.filter(
    (slot) => slot.playerId !== null && !removeSet.has(slot.playerId)
  );
  const totalAfterSwap = remainingPlayers.length + addPlayerIds.length;

  // Roster must have at least as many players as starter slots
  const starterSlots = roster.filter((slot) => slot.isStarter).length;
  return totalAfterSwap >= starterSlots;
}

function swapPlayersOnRoster(
  roster: RosterSlot[],
  removePlayerIds: string[],
  addPlayerIds: string[],
  addPlayerNames: string[]
): RosterSlot[] {
  const removeSet = new Set(removePlayerIds);
  const updatedRoster = roster.map((slot) => {
    if (slot.playerId !== null && removeSet.has(slot.playerId)) {
      return { ...slot, playerId: null, playerName: undefined };
    }
    return { ...slot };
  });

  // Place incoming players into empty slots (prefer bench first)
  const playersToAdd = addPlayerIds.map((id, i) => ({
    id,
    name: addPlayerNames[i],
  }));

  for (const player of playersToAdd) {
    const benchSlotIndex = updatedRoster.findIndex(
      (slot) => slot.playerId === null && !slot.isStarter
    );
    if (benchSlotIndex !== -1) {
      updatedRoster[benchSlotIndex] = {
        ...updatedRoster[benchSlotIndex],
        playerId: player.id,
        playerName: player.name,
      };
      continue;
    }
    const anySlotIndex = updatedRoster.findIndex(
      (slot) => slot.playerId === null
    );
    if (anySlotIndex !== -1) {
      updatedRoster[anySlotIndex] = {
        ...updatedRoster[anySlotIndex],
        playerId: player.id,
        playerName: player.name,
      };
    }
  }

  return updatedRoster;
}

export function executeTrade(
  proposingTeam: FantasyTeam,
  receivingTeam: FantasyTeam,
  proposal: TradeProposal
): { proposingTeam: FantasyTeam; receivingTeam: FantasyTeam } | { error: string } {
  if (proposal.status !== 'accepted') {
    return { error: 'Trade must be accepted before execution' };
  }

  // Validate proposing team has the players being sent
  const proposingPlayerIds = new Set(
    proposingTeam.roster
      .filter((s) => s.playerId !== null)
      .map((s) => s.playerId as string)
  );
  for (const pid of proposal.sendPlayerIds) {
    if (!proposingPlayerIds.has(pid)) {
      return { error: `Proposing team does not have player ${pid} on roster` };
    }
  }

  // Validate receiving team has the players being sent back
  const receivingPlayerIds = new Set(
    receivingTeam.roster
      .filter((s) => s.playerId !== null)
      .map((s) => s.playerId as string)
  );
  for (const pid of proposal.receivePlayerIds) {
    if (!receivingPlayerIds.has(pid)) {
      return { error: `Receiving team does not have player ${pid} on roster` };
    }
  }

  // Validate rosters remain valid after swap
  if (
    !validateRosterAfterSwap(
      proposingTeam.roster,
      proposal.sendPlayerIds,
      proposal.receivePlayerIds
    )
  ) {
    return { error: 'Proposing team would have an invalid roster after trade' };
  }

  if (
    !validateRosterAfterSwap(
      receivingTeam.roster,
      proposal.receivePlayerIds,
      proposal.sendPlayerIds
    )
  ) {
    return { error: 'Receiving team would have an invalid roster after trade' };
  }

  // Execute the swap
  const newProposingRoster = swapPlayersOnRoster(
    proposingTeam.roster,
    proposal.sendPlayerIds,
    proposal.receivePlayerIds,
    proposal.receivePlayerNames
  );

  const newReceivingRoster = swapPlayersOnRoster(
    receivingTeam.roster,
    proposal.receivePlayerIds,
    proposal.sendPlayerIds,
    proposal.sendPlayerNames
  );

  return {
    proposingTeam: { ...proposingTeam, roster: newProposingRoster },
    receivingTeam: { ...receivingTeam, roster: newReceivingRoster },
  };
}

// --- AI-Powered Trade Analysis ---

function calculatePlayerValue(player: FantasyPlayerInfo): number {
  // Projected points: 60% weight
  const projectedPointsValue = player.projectedPoints * 0.6;

  // ADP position value: 25% weight — lower ADP = more valuable
  // Normalize ADP to a 0-100 scale (ADP 1 = 100 value, ADP 200+ = ~0)
  const adpValue = Math.max(0, (200 - player.adp) / 2) * 0.25;

  // Positional scarcity: 15% weight
  const scarcityMultiplier = getPositionalScarcity(player.position);
  const scarcityValue = player.projectedPoints * scarcityMultiplier * 0.15;

  return projectedPointsValue + adpValue + scarcityValue;
}

function generateReasoning(
  sendPlayers: FantasyPlayerInfo[],
  receivePlayers: FantasyPlayerInfo[],
  fairnessScore: number
): string[] {
  const reasons: string[] = [];

  // Find best player in the trade
  const allPlayers = [...sendPlayers, ...receivePlayers];
  const bestPlayer = allPlayers.reduce((best, p) =>
    calculatePlayerValue(p) > calculatePlayerValue(best) ? p : best
  );
  const bestPlayerSide = sendPlayers.includes(bestPlayer) ? 'send' : 'receive';

  // Top player insight
  const adpRank = bestPlayer.adp;
  if (adpRank <= 20) {
    const sideLabel = bestPlayerSide === 'receive' ? 'Getting' : 'Giving up';
    reasons.push(
      `${sideLabel} ${bestPlayer.name} (ADP #${adpRank}, ${bestPlayer.position}) — a top-20 caliber player — is a significant factor`
    );
  } else if (adpRank <= 50) {
    const sideLabel = bestPlayerSide === 'receive' ? 'Acquiring' : 'Losing';
    reasons.push(
      `${sideLabel} ${bestPlayer.name} (${bestPlayer.position}, ${bestPlayer.school}) reshapes the ${bestPlayer.position} position`
    );
  }

  // Positional analysis
  const sendPositions = new Set(sendPlayers.map((p) => p.position));
  const receivePositions = new Set(receivePlayers.map((p) => p.position));

  for (const pos of receivePositions) {
    if (getPositionalScarcity(pos) >= 1.2 && !sendPositions.has(pos)) {
      reasons.push(
        `Adding ${pos} depth addresses a scarce position without losing any ${pos}s in return`
      );
    }
  }

  for (const pos of sendPositions) {
    if (getPositionalScarcity(pos) >= 1.2 && !receivePositions.has(pos)) {
      reasons.push(
        `Losing ${pos} depth hurts long-term given positional scarcity`
      );
    }
  }

  // Volume analysis
  if (sendPlayers.length !== receivePlayers.length) {
    const moreSide =
      sendPlayers.length > receivePlayers.length ? 'sending' : 'receiving';
    reasons.push(
      `${moreSide === 'sending' ? 'Sending' : 'Receiving'} more players (${Math.max(sendPlayers.length, receivePlayers.length)} vs ${Math.min(sendPlayers.length, receivePlayers.length)}) impacts roster flexibility`
    );
  }

  // Bye week impact
  const receiveByeWeeks = new Set(receivePlayers.map((p) => p.byeWeek));
  if (receiveByeWeeks.size < receivePlayers.length) {
    reasons.push(
      'Overlapping bye weeks among incoming players could create a tough scheduling week'
    );
  }

  // Overall fairness summary
  if (Math.abs(fairnessScore) <= 10) {
    reasons.push('Overall this trade looks balanced for both sides');
  } else if (fairnessScore > 30) {
    reasons.push(
      'The proposing side gains a clear value advantage in this deal'
    );
  } else if (fairnessScore < -30) {
    reasons.push(
      'The receiving side comes out significantly ahead in this trade'
    );
  }

  // Return 2-4 reasons
  return reasons.slice(0, 4).length >= 2
    ? reasons.slice(0, 4)
    : [
        ...reasons,
        'Consider roster needs and playoff schedule when evaluating this trade',
      ].slice(0, 2);
}

function getVerdict(
  fairnessScore: number
): 'great' | 'good' | 'fair' | 'poor' | 'lopsided' {
  const absScore = Math.abs(fairnessScore);
  if (absScore <= 10) return 'fair';
  if (absScore <= 25) return 'good';
  if (absScore <= 45) return 'good';
  if (absScore <= 65) return 'poor';
  return 'lopsided';
}

export function analyzeTrade(
  sendPlayers: FantasyPlayerInfo[],
  receivePlayers: FantasyPlayerInfo[]
): TradeAnalysis {
  const proposingSideValue = sendPlayers.reduce(
    (sum, p) => sum + calculatePlayerValue(p),
    0
  );
  const receivingSideValue = receivePlayers.reduce(
    (sum, p) => sum + calculatePlayerValue(p),
    0
  );

  const totalValue = proposingSideValue + receivingSideValue;

  // fairnessScore: positive = proposer benefits, negative = receiver benefits
  let fairnessScore = 0;
  if (totalValue > 0) {
    const diff = receivingSideValue - proposingSideValue;
    fairnessScore = Math.round((diff / totalValue) * 100);
  }

  // Clamp to -100..100
  fairnessScore = Math.max(-100, Math.min(100, fairnessScore));

  const verdict = getVerdict(fairnessScore);
  const reasoning = generateReasoning(sendPlayers, receivePlayers, fairnessScore);

  return {
    fairnessScore,
    proposingSideValue: Math.round(proposingSideValue * 100) / 100,
    receivingSideValue: Math.round(receivingSideValue * 100) / 100,
    verdict,
    reasoning,
  };
}

// --- Trade History ---

export function getTradeHistory(
  proposals: TradeProposal[],
  leagueId: string
): TradeProposal[] {
  return proposals
    .filter((p) => p.leagueId === leagueId)
    .sort((a, b) => b.proposedAt - a.proposedAt);
}
