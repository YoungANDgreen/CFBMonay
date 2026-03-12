import {
  SALARY_CAP,
  DYNASTY_SLOTS,
  calculatePlayerCost,
  getAvailablePrograms,
  getPlayersForProgram,
  createDynastyRoster,
  addPlayerToRoster,
  removePlayerFromRoster,
  isRosterComplete,
  simulateMatchup,
  createInitialGameState,
} from './dynasty-engine';

// ---- Player Pool ----

describe('player pool', () => {
  it('has at least one available program', () => {
    const programs = getAvailablePrograms();
    expect(programs.length).toBeGreaterThan(0);
  });

  it('returns players for Alabama', () => {
    const players = getPlayersForProgram('Alabama');
    expect(players.length).toBeGreaterThan(0);
  });

  it('returns players for Ohio State', () => {
    const players = getPlayersForProgram('Ohio State');
    expect(players.length).toBeGreaterThan(0);
  });

  it('returns empty array for unknown program', () => {
    expect(getPlayersForProgram('Nonexistent U')).toEqual([]);
  });

  it('every player has a calculated cost > 0', () => {
    const players = getPlayersForProgram('Alabama');
    for (const player of players) {
      expect(player.cost).toBeGreaterThan(0);
    }
  });
});

// ---- calculatePlayerCost ----

describe('calculatePlayerCost', () => {
  it('applies Heisman multiplier (2x)', () => {
    const base = {
      id: 'test', name: 'Test', position: 'QB' as const, school: 'Test U',
      seasons: '2020-2022', compositeScore: 10, stats: { gamesPlayed: 30 }, awards: ['Heisman'] as any[],
    };
    const cost = calculatePlayerCost(base);
    // baseCost = 10 * 0.5 = 5, * 2.0 Heisman = 10
    expect(cost).toBe(10);
  });

  it('applies era discount for pre-2000 players', () => {
    const base = {
      id: 'test', name: 'Test', position: 'RB' as const, school: 'Test U',
      seasons: '1990-1993', compositeScore: 10, stats: { gamesPlayed: 40 }, awards: [] as any[],
    };
    const cost = calculatePlayerCost(base);
    // baseCost = 5, eraMultiplier = 0.8, awardMultiplier = 1, draftMultiplier = 1 → 4
    expect(cost).toBe(4);
  });

  it('applies top-10 draft multiplier', () => {
    const base = {
      id: 'test', name: 'Test', position: 'QB' as const, school: 'Test U',
      seasons: '2020-2022', compositeScore: 10, stats: { gamesPlayed: 30 }, awards: [] as any[],
      draftInfo: { year: 2023, round: 1, pick: 5, team: 'Team' },
    };
    const cost = calculatePlayerCost(base);
    // baseCost = 5, draftMultiplier = 1.3 → 6.5
    expect(cost).toBe(6.5);
  });
});

// ---- createDynastyRoster ----

describe('createDynastyRoster', () => {
  it('creates an empty roster with correct salary cap', () => {
    const roster = createDynastyRoster('Alabama');
    expect(roster.program).toBe('Alabama');
    expect(roster.totalCost).toBe(0);
    expect(roster.salaryCap).toBe(SALARY_CAP);
  });

  it('has all slot keys initialised to null', () => {
    const roster = createDynastyRoster('Alabama');
    for (const slot of DYNASTY_SLOTS) {
      expect(roster.players[slot.key]).toBeNull();
    }
  });
});

// ---- addPlayerToRoster ----

describe('addPlayerToRoster', () => {
  it('adds a player to the correct position slot', () => {
    const roster = createDynastyRoster('Alabama');
    const players = getPlayersForProgram('Alabama');
    const qb = players.find(p => p.position === 'QB')!;
    const result = addPlayerToRoster(roster, 'qb1', qb);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.players['qb1']).toEqual(qb);
      expect(result.totalCost).toBe(qb.cost);
    }
  });

  it('rejects position mismatch', () => {
    const roster = createDynastyRoster('Alabama');
    const players = getPlayersForProgram('Alabama');
    const rb = players.find(p => p.position === 'RB')!;
    const result = addPlayerToRoster(roster, 'qb1', rb);
    expect('error' in result).toBe(true);
  });

  it('allows DB-compatible positions (CB, S) in DB slots', () => {
    const roster = createDynastyRoster('Alabama');
    const players = getPlayersForProgram('Alabama');
    const cb = players.find(p => p.position === 'CB');
    if (cb) {
      const result = addPlayerToRoster(roster, 'db1', cb);
      expect('error' in result).toBe(false);
    }
  });

  it('rejects salary cap overflow', () => {
    let roster = createDynastyRoster('Alabama');
    // Artificially set totalCost near cap
    roster = { ...roster, totalCost: SALARY_CAP - 1 };
    const players = getPlayersForProgram('Alabama');
    const expensive = players.reduce((a, b) => (a.cost > b.cost ? a : b));
    if (expensive.cost > 1) {
      // Find a slot matching the player's position
      const slot = DYNASTY_SLOTS.find(s =>
        s.position === expensive.position ||
        (s.position === 'DB' && ['DB', 'CB', 'S'].includes(expensive.position))
      );
      if (slot) {
        const result = addPlayerToRoster(roster, slot.key, expensive);
        expect('error' in result).toBe(true);
      }
    }
  });

  it('rejects duplicate player already on roster', () => {
    const roster = createDynastyRoster('Alabama');
    const players = getPlayersForProgram('Alabama');
    const wrs = players.filter(p => p.position === 'WR');
    expect(wrs.length).toBeGreaterThanOrEqual(2);
    const wr = wrs[0];
    const r1 = addPlayerToRoster(roster, 'wr1', wr);
    expect('error' in r1).toBe(false);
    if (!('error' in r1)) {
      const r2 = addPlayerToRoster(r1, 'wr2', wr);
      expect('error' in r2).toBe(true);
      if ('error' in r2) {
        expect(r2.error).toContain('already on the roster');
      }
    }
  });

  it('returns error for invalid slot key', () => {
    const roster = createDynastyRoster('Alabama');
    const players = getPlayersForProgram('Alabama');
    const result = addPlayerToRoster(roster, 'invalid_slot', players[0]);
    expect('error' in result).toBe(true);
  });
});

// ---- removePlayerFromRoster ----

describe('removePlayerFromRoster', () => {
  it('removes a player and returns their salary', () => {
    const roster = createDynastyRoster('Alabama');
    const players = getPlayersForProgram('Alabama');
    const qb = players.find(p => p.position === 'QB')!;
    const withPlayer = addPlayerToRoster(roster, 'qb1', qb);
    expect('error' in withPlayer).toBe(false);
    if (!('error' in withPlayer)) {
      const after = removePlayerFromRoster(withPlayer, 'qb1');
      expect(after.players['qb1']).toBeNull();
      expect(after.totalCost).toBe(0);
    }
  });

  it('does nothing when removing from an empty slot', () => {
    const roster = createDynastyRoster('Alabama');
    const after = removePlayerFromRoster(roster, 'qb1');
    expect(after).toBe(roster);
  });
});

// ---- isRosterComplete ----

describe('isRosterComplete', () => {
  it('returns false for empty roster', () => {
    const roster = createDynastyRoster('Alabama');
    expect(isRosterComplete(roster)).toBe(false);
  });
});

// ---- simulateMatchup ----

describe('simulateMatchup', () => {
  function buildRosterWithPlayers(program: string) {
    let roster = createDynastyRoster(program);
    const players = getPlayersForProgram(program);

    for (const slot of DYNASTY_SLOTS) {
      const compatible = players.find(p => {
        // check position compatibility
        if (slot.position === 'DB') {
          return ['DB', 'CB', 'S'].includes(p.position);
        }
        return p.position === slot.position;
      });
      if (compatible) {
        const result = addPlayerToRoster(roster, slot.key, compatible);
        if (!('error' in result)) {
          roster = result;
        }
      }
    }
    return roster;
  }

  it('returns a valid SimulationResult', () => {
    const rosterA = buildRosterWithPlayers('Alabama');
    const rosterB = buildRosterWithPlayers('Ohio State');
    const result = simulateMatchup(rosterA, rosterB, 100);

    expect(result.totalSimulations).toBe(100);
    expect(result.wins + result.losses).toBe(100);
    expect(result.winProbability).toBeGreaterThanOrEqual(0);
    expect(result.winProbability).toBeLessThanOrEqual(1);
    expect(result.topPerformers.length).toBeLessThanOrEqual(5);
  });

  it('wins + losses equals total simulations', () => {
    const rosterA = buildRosterWithPlayers('Alabama');
    const rosterB = buildRosterWithPlayers('Ohio State');
    const result = simulateMatchup(rosterA, rosterB, 500);
    expect(result.wins + result.losses).toBe(500);
  });

  it('is deterministic for the same rosters', () => {
    const rosterA = buildRosterWithPlayers('Alabama');
    const rosterB = buildRosterWithPlayers('Ohio State');
    const r1 = simulateMatchup(rosterA, rosterB, 200);
    const r2 = simulateMatchup(rosterA, rosterB, 200);
    expect(r1.wins).toBe(r2.wins);
    expect(r1.losses).toBe(r2.losses);
  });

  it('handles two empty rosters without crashing', () => {
    const rosterA = createDynastyRoster('Alabama');
    const rosterB = createDynastyRoster('Ohio State');
    const result = simulateMatchup(rosterA, rosterB, 50);
    expect(result.wins + result.losses).toBe(50);
  });
});

// ---- createInitialGameState ----

describe('createInitialGameState', () => {
  it('returns a blank game state', () => {
    const state = createInitialGameState();
    expect(state.program).toBeNull();
    expect(state.roster).toBeNull();
    expect(state.availablePlayers).toEqual([]);
    expect(state.isComplete).toBe(false);
    expect(state.simulationResult).toBeNull();
  });
});
