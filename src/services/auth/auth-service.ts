// ============================================================
// GridIron IQ — Mock Authentication Service
// Simulates Clerk/Firebase Auth for development & testing.
// Replace with real auth provider before production release.
// ============================================================

import type { User, UserStats } from '@/types';

// --- Internal State ---

let currentUser: User | null = null;

const registeredUsers: Map<string, User> = new Map();

// --- Helpers ---

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultUserStats(): UserStats {
  return {
    gridGamesPlayed: 0,
    gridBestScore: 0,
    statStackGamesPlayed: 0,
    statStackBestPercentile: 0,
    predictionAccuracy: 0,
    fantasyChampionships: 0,
  };
}

// --- Pre-seeded Demo Users ---

const demoUsers: User[] = [
  {
    id: 'demo_gridiron_king',
    username: 'GridIronKing',
    displayName: 'GridIron King',
    favoriteTeam: 'Alabama',
    favoriteConference: 'SEC',
    eloRating: 1650,
    streakCurrent: 42,
    streakBest: 42,
    stats: {
      gridGamesPlayed: 218,
      gridBestScore: 950,
      statStackGamesPlayed: 134,
      statStackBestPercentile: 96,
      predictionAccuracy: 68,
      fantasyChampionships: 2,
    },
  },
  {
    id: 'demo_cfb_nerd',
    username: 'CFBNerd2025',
    displayName: 'CFB Nerd',
    favoriteTeam: 'Ohio State',
    favoriteConference: 'Big Ten',
    eloRating: 1580,
    streakCurrent: 15,
    streakBest: 31,
    stats: {
      gridGamesPlayed: 175,
      gridBestScore: 880,
      statStackGamesPlayed: 92,
      statStackBestPercentile: 88,
      predictionAccuracy: 62,
      fantasyChampionships: 1,
    },
  },
  {
    id: 'demo_pick_em_pro',
    username: 'PickEmPro',
    displayName: 'Pick Em Pro',
    favoriteTeam: 'Georgia',
    favoriteConference: 'SEC',
    eloRating: 1720,
    streakCurrent: 28,
    streakBest: 55,
    stats: {
      gridGamesPlayed: 102,
      gridBestScore: 820,
      statStackGamesPlayed: 67,
      statStackBestPercentile: 79,
      predictionAccuracy: 74,
      fantasyChampionships: 3,
    },
  },
  {
    id: 'demo_dynasty_dave',
    username: 'DynastyDave',
    displayName: 'Dynasty Dave',
    favoriteTeam: 'Texas',
    favoriteConference: 'SEC',
    eloRating: 1490,
    streakCurrent: 7,
    streakBest: 19,
    stats: {
      gridGamesPlayed: 85,
      gridBestScore: 710,
      statStackGamesPlayed: 48,
      statStackBestPercentile: 65,
      predictionAccuracy: 55,
      fantasyChampionships: 4,
    },
  },
];

// Seed the registered users map (keyed by email for sign-in lookup)
for (const user of demoUsers) {
  const email = `${user.username.toLowerCase()}@gridiron-iq.dev`;
  registeredUsers.set(email, user);
}

// --- Public API ---

export async function signUp(
  username: string,
  displayName: string,
  email: string,
  _password: string,
): Promise<User> {
  await delay(500);

  if (registeredUsers.has(email)) {
    throw new Error(`An account with email "${email}" already exists.`);
  }

  const newUser: User = {
    id: generateId(),
    username,
    displayName,
    eloRating: 1200,
    streakCurrent: 0,
    streakBest: 0,
    stats: defaultUserStats(),
  };

  registeredUsers.set(email, newUser);
  currentUser = newUser;

  return newUser;
}

export async function signIn(
  email: string,
  _password: string,
): Promise<User> {
  await delay(500);

  const user = registeredUsers.get(email);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  currentUser = user;
  return user;
}

export async function signInAsGuest(): Promise<User> {
  await delay(300);

  const guestId = Math.floor(10000 + Math.random() * 90000);

  const guestUser: User = {
    id: generateId(),
    username: `Guest_${guestId}`,
    displayName: `Guest ${guestId}`,
    eloRating: 1200,
    streakCurrent: 0,
    streakBest: 0,
    stats: defaultUserStats(),
  };

  const guestEmail = `guest_${guestId}@gridiron-iq.dev`;
  registeredUsers.set(guestEmail, guestUser);
  currentUser = guestUser;

  return guestUser;
}

export async function signOut(): Promise<void> {
  await delay(200);
  currentUser = null;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<User>,
): Promise<User> {
  await delay(400);

  let targetUser: User | null = null;
  let targetEmail: string | null = null;

  for (const [email, user] of registeredUsers.entries()) {
    if (user.id === userId) {
      targetUser = user;
      targetEmail = email;
      break;
    }
  }

  if (!targetUser || !targetEmail) {
    throw new Error(`User with id "${userId}" not found.`);
  }

  const updatedUser: User = {
    ...targetUser,
    ...updates,
    id: targetUser.id, // prevent id override
    stats: updates.stats
      ? { ...targetUser.stats, ...updates.stats }
      : targetUser.stats,
  };

  registeredUsers.set(targetEmail, updatedUser);

  if (currentUser?.id === userId) {
    currentUser = updatedUser;
  }

  return updatedUser;
}

export async function deleteAccount(userId: string): Promise<void> {
  await delay(400);

  let found = false;

  for (const [email, user] of registeredUsers.entries()) {
    if (user.id === userId) {
      registeredUsers.delete(email);
      found = true;
      break;
    }
  }

  if (!found) {
    throw new Error(`User with id "${userId}" not found.`);
  }

  if (currentUser?.id === userId) {
    currentUser = null;
  }
}
