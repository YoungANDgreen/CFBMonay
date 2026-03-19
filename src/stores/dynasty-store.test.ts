// ============================================================
// GridIron IQ — Dynasty Builder Store Unit Tests
// ============================================================

import { useDynastyStore } from './dynasty-store';

const mockPlayers: any[] = [
  { id: 'p1', name: 'Derrick Henry', position: 'RB', team: 'Alabama', compositeScore: 95, salary: 15 },
  { id: 'p2', name: 'Tua Tagovailoa', position: 'QB', team: 'Alabama', compositeScore: 90, salary: 18 },
  { id: 'p3', name: 'Amari Cooper', position: 'WR', team: 'Alabama', compositeScore: 88, salary: 14 },
  { id: 'p4', name: 'Mark Ingram', position: 'RB', team: 'Alabama', compositeScore: 85, salary: 12 },
];

const mockRoster: any = {
  program: 'Alabama',
  players: {} as Record<string, any>,
  salaryCap: 100,
  salaryUsed: 0,
};

const mockRosterWithPlayer: any = {
  ...mockRoster,
  players: { RB1: mockPlayers[0] },
  salaryUsed: 15,
};

const mockSimResult: any = {
  userScore: 85,
  opponentScore: 72,
  winner: 'user' as const,
  breakdown: { offense: 45, defense: 40 },
};

jest.mock('@/services/games/dynasty-engine', () => ({
  createDynastyRoster: jest.fn((program: string) => ({
    program,
    players: {},
    salaryCap: 100,
    salaryUsed: 0,
  })),
  addPlayerToRoster: jest.fn((roster: any, slotKey: string, player: any) => {
    if (roster.salaryUsed + player.salary > roster.salaryCap) {
      return { error: 'Over salary cap' };
    }
    return {
      ...roster,
      players: { ...roster.players, [slotKey]: player },
      salaryUsed: roster.salaryUsed + player.salary,
    };
  }),
  removePlayerFromRoster: jest.fn((roster: any, slotKey: string) => {
    const player = roster.players[slotKey];
    const newPlayers = { ...roster.players };
    delete newPlayers[slotKey];
    return {
      ...roster,
      players: newPlayers,
      salaryUsed: roster.salaryUsed - (player?.salary ?? 0),
    };
  }),
  getPlayersForProgram: jest.fn(() => [...mockPlayers]),
  getAvailablePrograms: jest.fn(() => ['Alabama', 'Ohio State', 'Georgia', 'USC']),
  isRosterComplete: jest.fn((roster: any) => Object.keys(roster.players).length >= 3),
  simulateMatchup: jest.fn(() => mockSimResult),
  DYNASTY_SLOTS: [
    { key: 'QB1', position: 'QB' },
    { key: 'RB1', position: 'RB' },
    { key: 'WR1', position: 'WR' },
    { key: 'DB1', position: 'DB' },
  ],
}));

beforeEach(() => {
  useDynastyStore.getState().reset();
});

describe('useDynastyStore', () => {
  describe('initial state', () => {
    it('has null program and roster', () => {
      const { gameState } = useDynastyStore.getState();
      expect(gameState.program).toBeNull();
      expect(gameState.roster).toBeNull();
      expect(gameState.availablePlayers).toEqual([]);
    });

    it('has available programs', () => {
      expect(useDynastyStore.getState().availablePrograms).toEqual([
        'Alabama', 'Ohio State', 'Georgia', 'USC',
      ]);
    });
  });

  describe('selectProgram', () => {
    it('sets program, roster, and available players', () => {
      useDynastyStore.getState().selectProgram('Alabama');

      const { gameState, error } = useDynastyStore.getState();
      expect(gameState.program).toBe('Alabama');
      expect(gameState.roster).not.toBeNull();
      expect(gameState.roster!.program).toBe('Alabama');
      expect(gameState.availablePlayers).toHaveLength(4);
      expect(gameState.isComplete).toBe(false);
      expect(gameState.simulationResult).toBeNull();
      expect(error).toBeNull();
    });
  });

  describe('selectSlot', () => {
    it('sets the selected slot', () => {
      useDynastyStore.getState().selectProgram('Alabama');
      useDynastyStore.getState().selectSlot('QB1');

      expect(useDynastyStore.getState().gameState.selectedSlot).toBe('QB1');
    });

    it('can deselect slot with null', () => {
      useDynastyStore.getState().selectProgram('Alabama');
      useDynastyStore.getState().selectSlot('QB1');
      useDynastyStore.getState().selectSlot(null);

      expect(useDynastyStore.getState().gameState.selectedSlot).toBeNull();
    });
  });

  describe('addPlayer', () => {
    it('adds player to roster and updates salary', () => {
      useDynastyStore.getState().selectProgram('Alabama');
      useDynastyStore.getState().addPlayer('RB1', mockPlayers[0]);

      const { gameState, error } = useDynastyStore.getState();
      expect(gameState.roster!.players['RB1']).toEqual(mockPlayers[0]);
      expect((gameState.roster as any).salaryUsed).toBe(15);
      expect(gameState.selectedSlot).toBeNull();
      expect(error).toBeNull();
    });

    it('sets error when over salary cap', () => {
      useDynastyStore.getState().selectProgram('Alabama');

      // Set salary to near cap so next add fails
      useDynastyStore.setState({
        gameState: {
          ...useDynastyStore.getState().gameState,
          roster: { ...useDynastyStore.getState().gameState.roster!, salaryUsed: 90 } as any,
        },
      });

      useDynastyStore.getState().addPlayer('QB1', mockPlayers[1]); // salary 18, total would be 108

      expect(useDynastyStore.getState().error).toBe('Over salary cap');
    });

    it('does nothing without a roster', () => {
      useDynastyStore.getState().addPlayer('RB1', mockPlayers[0]);
      expect(useDynastyStore.getState().gameState.roster).toBeNull();
    });

    it('marks roster complete when enough players added', () => {
      useDynastyStore.getState().selectProgram('Alabama');
      useDynastyStore.getState().addPlayer('QB1', mockPlayers[1]);
      useDynastyStore.getState().addPlayer('RB1', mockPlayers[0]);
      useDynastyStore.getState().addPlayer('WR1', mockPlayers[2]);

      expect(useDynastyStore.getState().gameState.isComplete).toBe(true);
    });
  });

  describe('removePlayer', () => {
    it('removes player and restores salary', () => {
      useDynastyStore.getState().selectProgram('Alabama');
      useDynastyStore.getState().addPlayer('RB1', mockPlayers[0]);

      useDynastyStore.getState().removePlayer('RB1');

      const { gameState } = useDynastyStore.getState();
      expect(gameState.roster!.players['RB1']).toBeUndefined();
      expect((gameState.roster as any).salaryUsed).toBe(0);
      expect(gameState.isComplete).toBe(false);
      expect(gameState.simulationResult).toBeNull();
    });

    it('does nothing without a roster', () => {
      useDynastyStore.getState().removePlayer('RB1');
      expect(useDynastyStore.getState().gameState.roster).toBeNull();
    });
  });

  describe('setSearchQuery', () => {
    it('updates the search query', () => {
      useDynastyStore.getState().setSearchQuery('Henry');
      expect(useDynastyStore.getState().gameState.searchQuery).toBe('Henry');
    });
  });

  describe('simulate', () => {
    it('runs a simulation when roster is complete', () => {
      useDynastyStore.getState().selectProgram('Alabama');
      useDynastyStore.getState().addPlayer('QB1', mockPlayers[1]);
      useDynastyStore.getState().addPlayer('RB1', mockPlayers[0]);
      useDynastyStore.getState().addPlayer('WR1', mockPlayers[2]);

      useDynastyStore.getState().simulate();

      const { gameState } = useDynastyStore.getState();
      expect(gameState.simulationResult).not.toBeNull();
      expect((gameState.simulationResult as any).userScore).toBe(85);
      expect((gameState.simulationResult as any).winner).toBe('user');
    });

    it('does nothing when roster is not complete', () => {
      useDynastyStore.getState().selectProgram('Alabama');
      useDynastyStore.getState().addPlayer('RB1', mockPlayers[0]);

      useDynastyStore.getState().simulate();

      expect(useDynastyStore.getState().gameState.simulationResult).toBeNull();
    });

    it('does nothing without a roster', () => {
      useDynastyStore.getState().simulate();
      expect(useDynastyStore.getState().gameState.simulationResult).toBeNull();
    });
  });

  describe('reset', () => {
    it('clears all state back to initial', () => {
      useDynastyStore.getState().selectProgram('Alabama');
      useDynastyStore.getState().addPlayer('RB1', mockPlayers[0]);

      useDynastyStore.getState().reset();

      const { gameState, error } = useDynastyStore.getState();
      expect(gameState.program).toBeNull();
      expect(gameState.roster).toBeNull();
      expect(gameState.availablePlayers).toEqual([]);
      expect(gameState.isComplete).toBe(false);
      expect(gameState.simulationResult).toBeNull();
      expect(error).toBeNull();
    });
  });
});
