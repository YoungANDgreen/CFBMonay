import {
  WaiverClaim,
  FantasyTeam,
  RosterSlot,
  RosterSettings,
} from '@/types';

/**
 * Generate a unique ID for a waiver claim.
 */
function generateId(): string {
  return `wc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Create a new FAAB waiver claim.
 */
export function createWaiverClaim(
  leagueId: string,
  teamId: string,
  addPlayerId: string,
  addPlayerName: string,
  dropPlayerId: string | null,
  dropPlayerName: string | null,
  faabBid: number
): WaiverClaim | { error: string } {
  if (faabBid < 0) {
    return { error: 'FAAB bid must be greater than or equal to 0' };
  }

  return {
    id: generateId(),
    leagueId,
    teamId,
    addPlayerId,
    addPlayerName,
    dropPlayerId,
    dropPlayerName,
    faabBid,
    priority: 0,
    status: 'pending',
    submittedAt: Date.now(),
  };
}

/**
 * Cancel a pending waiver claim.
 */
export function cancelWaiverClaim(claim: WaiverClaim): WaiverClaim {
  return {
    ...claim,
    status: 'cancelled',
    processedAt: Date.now(),
  };
}

/**
 * Calculate the maximum roster size from roster settings.
 */
export function calculateMaxRosterSize(rosterSettings: RosterSettings): number {
  return (
    rosterSettings.qb +
    rosterSettings.rb +
    rosterSettings.wr +
    rosterSettings.te +
    rosterSettings.flex +
    rosterSettings.dst +
    rosterSettings.k +
    rosterSettings.bench
  );
}

/**
 * Check whether a team's roster is full.
 */
export function isRosterFull(
  team: FantasyTeam,
  rosterSettings: RosterSettings
): boolean {
  const maxSize = calculateMaxRosterSize(rosterSettings);
  const filledSlots = team.roster.filter(
    (slot: RosterSlot) => slot.playerId !== null
  ).length;
  return filledSlots >= maxSize;
}

/**
 * Process all pending waiver claims for a league.
 *
 * Sorting rules:
 *   1. Highest FAAB bid first.
 *   2. Tiebreaker: lower priority number wins (worst-record teams
 *      should be assigned the lowest priority numbers before calling
 *      this function).
 *
 * For each claim (in sorted order):
 *   - Team must have enough remaining FAAB budget.
 *   - The target player must not have already been claimed.
 *   - The roster must not be full unless a drop player is specified.
 *   - Approved claims mutate a working copy of teams: FAAB is deducted,
 *     the player is added, and the drop player (if any) is removed.
 */
export function processWaiverClaims(
  claims: WaiverClaim[],
  teams: FantasyTeam[],
  rosterSettings: RosterSettings
): { processedClaims: WaiverClaim[]; updatedTeams: FantasyTeam[] } {
  // Deep-copy teams so the originals are not mutated.
  const teamMap = new Map<string, FantasyTeam>(
    teams.map((t) => [
      t.id,
      {
        ...t,
        roster: t.roster.map((slot) => ({ ...slot })),
        record: { ...t.record },
      },
    ])
  );

  // Only process pending claims.
  const pending = claims.filter((c) => c.status === 'pending');

  // Sort: highest bid first, then lowest priority number wins ties.
  const sorted = [...pending].sort((a, b) => {
    if (b.faabBid !== a.faabBid) {
      return b.faabBid - a.faabBid;
    }
    return a.priority - b.priority;
  });

  // Track which players have already been claimed during this run.
  const claimedPlayerIds = new Set<string>();

  const processedClaims: WaiverClaim[] = [];
  const now = Date.now();

  for (const claim of sorted) {
    const team = teamMap.get(claim.teamId);

    // Team not found — deny.
    if (!team) {
      processedClaims.push({
        ...claim,
        status: 'denied',
        processedAt: now,
      });
      continue;
    }

    // Player already claimed by a higher-priority bid.
    if (claimedPlayerIds.has(claim.addPlayerId)) {
      processedClaims.push({
        ...claim,
        status: 'denied',
        processedAt: now,
      });
      continue;
    }

    // Insufficient FAAB budget.
    if (team.waiverBudget < claim.faabBid) {
      processedClaims.push({
        ...claim,
        status: 'denied',
        processedAt: now,
      });
      continue;
    }

    // Roster full and no drop player specified.
    if (!claim.dropPlayerId && isRosterFull(team, rosterSettings)) {
      processedClaims.push({
        ...claim,
        status: 'denied',
        processedAt: now,
      });
      continue;
    }

    // --- Claim is valid — apply it. ---

    // Deduct FAAB.
    team.waiverBudget -= claim.faabBid;

    // Drop player if specified.
    if (claim.dropPlayerId) {
      const dropIndex = team.roster.findIndex(
        (slot: RosterSlot) => slot.playerId === claim.dropPlayerId
      );
      if (dropIndex !== -1) {
        team.roster[dropIndex] = {
          ...team.roster[dropIndex],
          playerId: null,
          playerName: undefined,
        };
      }
    }

    // Add the new player to the first empty roster slot.
    const emptySlotIndex = team.roster.findIndex(
      (slot: RosterSlot) => slot.playerId === null
    );
    if (emptySlotIndex !== -1) {
      team.roster[emptySlotIndex] = {
        ...team.roster[emptySlotIndex],
        playerId: claim.addPlayerId,
        playerName: claim.addPlayerName,
      };
    }

    claimedPlayerIds.add(claim.addPlayerId);

    processedClaims.push({
      ...claim,
      status: 'approved',
      processedAt: now,
    });
  }

  // Include non-pending claims unchanged.
  const nonPending = claims.filter((c) => c.status !== 'pending');
  const allProcessed = [...processedClaims, ...nonPending];

  return {
    processedClaims: allProcessed,
    updatedTeams: Array.from(teamMap.values()),
  };
}

/**
 * Return all players that are not currently on any team's roster.
 */
export function getAvailableFreeAgents(
  allPlayers: { id: string; name: string }[],
  teams: FantasyTeam[]
): { id: string; name: string }[] {
  const rosteredIds = new Set<string>();
  for (const team of teams) {
    for (const slot of team.roster) {
      if (slot.playerId) {
        rosteredIds.add(slot.playerId);
      }
    }
  }
  return allPlayers.filter((player) => !rosteredIds.has(player.id));
}

/**
 * Get the waiver claim history for a specific team.
 */
export function getTeamWaiverHistory(
  claims: WaiverClaim[],
  teamId: string
): WaiverClaim[] {
  return claims.filter((claim) => claim.teamId === teamId);
}
