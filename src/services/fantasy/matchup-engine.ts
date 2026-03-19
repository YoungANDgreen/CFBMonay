import {
  FantasyMatchup,
  FantasySchedule,
  FantasyTeam,
  FantasyWeekScore,
} from '@/types';

/**
 * Generate a unique matchup ID from league, week, and team pairing.
 */
function generateMatchupId(
  leagueId: string,
  week: number,
  homeTeamId: string,
  awayTeamId: string
): string {
  return `${leagueId}_w${week}_${homeTeamId}_vs_${awayTeamId}`;
}

/**
 * Build round-robin pairings for a list of team IDs.
 * Uses the circle method: fix one team, rotate the rest.
 * If odd number of teams, a "BYE" placeholder is inserted and
 * any matchup involving it is excluded.
 *
 * Returns an array of rounds, each round being an array of [home, away] tuples.
 */
function buildRoundRobinRounds(
  teamIds: string[]
): Array<Array<[string, string]>> {
  const ids = [...teamIds];
  const hasBye = ids.length % 2 !== 0;
  if (hasBye) {
    ids.push('BYE');
  }

  const n = ids.length;
  const totalRounds = n - 1;
  const rounds: Array<Array<[string, string]>> = [];

  // Fix the first element; rotate the rest using the circle method.
  const fixed = ids[0];
  const rotating = ids.slice(1);

  for (let round = 0; round < totalRounds; round++) {
    const pairings: Array<[string, string]> = [];

    // Pair the fixed team with the current top of the rotating list.
    // Alternate home/away for the fixed team each round.
    const opponent = rotating[0];
    if (round % 2 === 0) {
      pairings.push([fixed, opponent]);
    } else {
      pairings.push([opponent, fixed]);
    }

    // Pair the remaining teams from opposite ends of the rotating list.
    for (let i = 1; i < n / 2; i++) {
      const home = rotating[i];
      const away = rotating[rotating.length - i];
      pairings.push([home, away]);
    }

    // Filter out any pairings involving the BYE placeholder.
    const validPairings = pairings.filter(
      ([h, a]) => h !== 'BYE' && a !== 'BYE'
    );
    rounds.push(validPairings);

    // Rotate: move last element to the front of the rotating array.
    rotating.unshift(rotating.pop()!);
  }

  return rounds;
}

/**
 * Generate a full regular-season schedule using round-robin pairing.
 * Cycles through rounds repeatedly until all weeks are filled.
 */
export function generateSchedule(
  leagueId: string,
  teamIds: string[],
  seasonYear: number,
  regularSeasonWeeks: number = 13,
  playoffWeeks: number = 3
): FantasySchedule {
  if (teamIds.length < 2) {
    throw new Error('At least 2 teams are required to generate a schedule');
  }

  const rounds = buildRoundRobinRounds(teamIds);
  const matchups: FantasyMatchup[] = [];

  for (let week = 1; week <= regularSeasonWeeks; week++) {
    const roundIndex = (week - 1) % rounds.length;
    const pairings = rounds[roundIndex];

    for (const [homeTeamId, awayTeamId] of pairings) {
      matchups.push({
        id: generateMatchupId(leagueId, week, homeTeamId, awayTeamId),
        leagueId,
        week,
        homeTeamId,
        awayTeamId,
        homeScore: 0,
        awayScore: 0,
        status: 'scheduled',
      });
    }
  }

  return {
    leagueId,
    seasonYear,
    regularSeasonWeeks,
    playoffWeeks,
    matchups,
  };
}

/**
 * Return all matchups for a given week.
 */
export function getWeekMatchups(
  schedule: FantasySchedule,
  week: number
): FantasyMatchup[] {
  return schedule.matchups.filter((m) => m.week === week);
}

/**
 * Return a new matchup with updated scores and status set to 'in_progress'.
 */
export function updateMatchupScores(
  matchup: FantasyMatchup,
  homeScore: number,
  awayScore: number
): FantasyMatchup {
  return {
    ...matchup,
    homeScore,
    awayScore,
    status: 'in_progress',
  };
}

/**
 * Finalize an entire week: apply scores from weekScores,
 * mark matchups as 'final', and update team records / point totals.
 *
 * weekScores must include an entry for every team that played that week.
 */
export function finalizeWeek(
  schedule: FantasySchedule,
  weekScores: FantasyWeekScore[],
  teams: FantasyTeam[]
): { schedule: FantasySchedule; updatedTeams: FantasyTeam[] } {
  if (weekScores.length === 0) {
    return { schedule, updatedTeams: teams };
  }

  const week = weekScores[0].week;
  const scoresByTeam = new Map<string, number>();
  for (const ws of weekScores) {
    scoresByTeam.set(ws.teamId, ws.totalPoints);
  }

  // Build updated matchups list.
  const updatedMatchups = schedule.matchups.map((m) => {
    if (m.week !== week) {
      return m;
    }

    const homeScore = scoresByTeam.get(m.homeTeamId) ?? m.homeScore;
    const awayScore = scoresByTeam.get(m.awayTeamId) ?? m.awayScore;

    return {
      ...m,
      homeScore,
      awayScore,
      status: 'final' as const,
    };
  });

  const updatedSchedule: FantasySchedule = {
    ...schedule,
    matchups: updatedMatchups,
  };

  // Build a map for quick team lookup.
  const teamMap = new Map<string, FantasyTeam>();
  for (const team of teams) {
    teamMap.set(team.id, { ...team, record: { ...team.record } });
  }

  // Update records from the finalized matchups for this week.
  const weekMatchups = updatedMatchups.filter((m) => m.week === week);
  for (const m of weekMatchups) {
    const home = teamMap.get(m.homeTeamId);
    const away = teamMap.get(m.awayTeamId);

    if (home) {
      home.pointsFor += m.homeScore;
      home.pointsAgainst += m.awayScore;
      if (m.homeScore > m.awayScore) {
        home.record.wins += 1;
      } else if (m.homeScore < m.awayScore) {
        home.record.losses += 1;
      } else {
        home.record.ties += 1;
      }
    }

    if (away) {
      away.pointsFor += m.awayScore;
      away.pointsAgainst += m.homeScore;
      if (m.awayScore > m.homeScore) {
        away.record.wins += 1;
      } else if (m.awayScore < m.homeScore) {
        away.record.losses += 1;
      } else {
        away.record.ties += 1;
      }
    }
  }

  const updatedTeams = teams.map(
    (t) => teamMap.get(t.id) ?? t
  );

  return { schedule: updatedSchedule, updatedTeams };
}

/**
 * Sort teams into standings: wins descending, then pointsFor descending.
 */
export function getStandings(teams: FantasyTeam[]): FantasyTeam[] {
  return [...teams].sort((a, b) => {
    if (b.record.wins !== a.record.wins) {
      return b.record.wins - a.record.wins;
    }
    return b.pointsFor - a.pointsFor;
  });
}

/**
 * Generate a playoff bracket from the top N teams by standings.
 * Default bracket: 4 teams — #1 vs #4, #2 vs #3 (semis), then a final.
 *
 * Returns an array of scheduled playoff matchups. The championship
 * matchup uses placeholder team IDs ('semi_1_winner' / 'semi_2_winner')
 * that should be resolved after semifinals are played.
 */
export function getPlayoffBracket(
  teams: FantasyTeam[],
  playoffTeamCount: number = 4
): FantasyMatchup[] {
  const standings = getStandings(teams);
  const playoffTeams = standings.slice(0, playoffTeamCount);

  if (playoffTeams.length < 2) {
    throw new Error('Not enough teams for a playoff bracket');
  }

  const leagueId = playoffTeams[0].leagueId;
  const matchups: FantasyMatchup[] = [];

  if (playoffTeamCount === 4) {
    // Semifinal 1: #1 seed vs #4 seed
    const semi1: FantasyMatchup = {
      id: generateMatchupId(leagueId, 100, playoffTeams[0].id, playoffTeams[3].id),
      leagueId,
      week: 100, // Playoff week sentinel — semifinal round
      homeTeamId: playoffTeams[0].id,
      awayTeamId: playoffTeams[3].id,
      homeScore: 0,
      awayScore: 0,
      status: 'scheduled',
    };

    // Semifinal 2: #2 seed vs #3 seed
    const semi2: FantasyMatchup = {
      id: generateMatchupId(leagueId, 100, playoffTeams[1].id, playoffTeams[2].id),
      leagueId,
      week: 100,
      homeTeamId: playoffTeams[1].id,
      awayTeamId: playoffTeams[2].id,
      homeScore: 0,
      awayScore: 0,
      status: 'scheduled',
    };

    // Championship: winners TBD
    const championship: FantasyMatchup = {
      id: `${leagueId}_championship`,
      leagueId,
      week: 101, // Championship week sentinel
      homeTeamId: 'semi_1_winner',
      awayTeamId: 'semi_2_winner',
      homeScore: 0,
      awayScore: 0,
      status: 'scheduled',
    };

    matchups.push(semi1, semi2, championship);
  } else {
    // Generic seeded bracket for other sizes: pair #1 vs #N, #2 vs #N-1, etc.
    const half = Math.floor(playoffTeams.length / 2);
    for (let i = 0; i < half; i++) {
      const home = playoffTeams[i];
      const away = playoffTeams[playoffTeams.length - 1 - i];
      matchups.push({
        id: generateMatchupId(leagueId, 100, home.id, away.id),
        leagueId,
        week: 100,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: 0,
        awayScore: 0,
        status: 'scheduled',
      });
    }
  }

  return matchups;
}

/**
 * Return all matchups involving a specific team across the entire schedule.
 */
export function getTeamSchedule(
  schedule: FantasySchedule,
  teamId: string
): FantasyMatchup[] {
  return schedule.matchups.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
  );
}
