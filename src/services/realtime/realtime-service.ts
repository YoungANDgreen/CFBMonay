// ============================================================
// GridIron IQ — Real-Time Service (Mock WebSocket/Socket.io)
// ============================================================

import type { LiveEvent, LiveEventType, ChatMessage } from '@/types';

// --- Module-level state ---

type EventCallback = (event: LiveEvent) => void;

const listeners: Map<LiveEventType, EventCallback[]> = new Map();

let connected = false;
let connectionId = '';
let mockEventInterval: ReturnType<typeof setInterval> | null = null;

// --- Mock data pools ---

const MOCK_TEAMS = [
  'Alabama', 'Ohio State', 'Georgia', 'Michigan', 'Texas',
  'USC', 'LSU', 'Clemson', 'Oregon', 'Penn State',
  'Oklahoma', 'Florida State', 'Tennessee', 'Notre Dame', 'Miami',
];

const MOCK_USERNAMES = [
  'TideFan2026', 'BuckeyeNation', 'DawgPound', 'WolverineKing',
  'HookEm_22', 'TrojanWarrior', 'GeauxTigers', 'ClemsonTiger',
  'DuckHunter', 'NittanyLion99', 'BoomerSooner', 'NoleFan',
];

const MOCK_CHAT_MESSAGES = [
  'What a game!',
  'No way that call stands',
  'Pick him up on waivers ASAP',
  'My sleeper pick is paying off',
  'That prediction model was right again',
  'Anyone want to trade for a WR?',
  'CFB is the best sport, no debate',
  'Upset alert incoming...',
];

// --- Internal helpers ---

function _generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function _randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function _randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function _dispatch(event: LiveEvent): void {
  const callbacks = listeners.get(event.type);
  if (callbacks) {
    for (const cb of callbacks) {
      cb(event);
    }
  }
}

function _generateMockEvent(): void {
  const eventTypes: LiveEventType[] = [
    'score_update',
    'user_online',
    'user_offline',
    'chat_message',
  ];

  const type = _randomItem(eventTypes);
  let payload: Record<string, unknown>;

  switch (type) {
    case 'score_update': {
      const homeTeam = _randomItem(MOCK_TEAMS);
      let awayTeam = _randomItem(MOCK_TEAMS);
      while (awayTeam === homeTeam) {
        awayTeam = _randomItem(MOCK_TEAMS);
      }
      payload = {
        gameId: `game-${_generateId()}`,
        homeTeam,
        awayTeam,
        homeScore: _randomInt(0, 56),
        awayScore: _randomInt(0, 56),
        quarter: _randomInt(1, 4),
        timeRemaining: `${_randomInt(0, 14)}:${_randomInt(0, 59).toString().padStart(2, '0')}`,
        scoringPlay: _randomItem(['Touchdown', 'Field Goal', 'Safety', 'Extra Point']),
      };
      break;
    }
    case 'user_online':
    case 'user_offline': {
      const username = _randomItem(MOCK_USERNAMES);
      payload = {
        userId: `user-${_generateId()}`,
        username,
      };
      break;
    }
    case 'chat_message': {
      const username = _randomItem(MOCK_USERNAMES);
      payload = {
        messageId: `msg-${_generateId()}`,
        roomId: `room-${_randomInt(1, 5)}`,
        senderId: `user-${_generateId()}`,
        senderUsername: username,
        content: _randomItem(MOCK_CHAT_MESSAGES),
        type: 'text',
      };
      break;
    }
    default:
      payload = {};
  }

  const event: LiveEvent = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  _dispatch(event);
}

function _startMockEventStream(): void {
  if (mockEventInterval) {
    clearInterval(mockEventInterval);
  }

  const scheduleNext = (): void => {
    const delayMs = _randomInt(8000, 15000);
    mockEventInterval = setTimeout(() => {
      if (!connected) return;
      _generateMockEvent();
      scheduleNext();
    }, delayMs) as unknown as ReturnType<typeof setInterval>;
  };

  scheduleNext();
}

// --- Exported functions ---

export async function connect(): Promise<void> {
  // Simulate connection delay
  await new Promise<void>((resolve) => setTimeout(resolve, 300));
  connected = true;
  connectionId = _generateId();
  _startMockEventStream();
}

export function disconnect(): void {
  if (mockEventInterval) {
    clearTimeout(mockEventInterval as unknown as number);
    mockEventInterval = null;
  }
  connected = false;
  connectionId = '';
}

export function isConnected(): boolean {
  return connected;
}

export function on(
  eventType: LiveEventType,
  callback: (event: LiveEvent) => void,
): () => void {
  const callbacks = listeners.get(eventType) ?? [];
  callbacks.push(callback);
  listeners.set(eventType, callbacks);

  // Return unsubscribe function
  return () => {
    off(eventType, callback);
  };
}

export function off(
  eventType: LiveEventType,
  callback: (event: LiveEvent) => void,
): void {
  const callbacks = listeners.get(eventType);
  if (!callbacks) return;

  const index = callbacks.indexOf(callback);
  if (index !== -1) {
    callbacks.splice(index, 1);
  }

  if (callbacks.length === 0) {
    listeners.delete(eventType);
  }
}

export function emit(
  eventType: LiveEventType,
  payload: Record<string, unknown>,
): void {
  if (!connected) return;

  const event: LiveEvent = {
    type: eventType,
    payload,
    timestamp: new Date().toISOString(),
  };

  // Simulate sending to server by dispatching locally
  _dispatch(event);
}

export async function sendChatMessage(
  roomId: string,
  content: string,
  type?: ChatMessage['type'],
): Promise<ChatMessage> {
  if (!connected) {
    throw new Error('Not connected to real-time service');
  }

  const message: ChatMessage = {
    id: `msg-${_generateId()}`,
    roomId,
    senderId: connectionId,
    senderUsername: 'CurrentUser',
    content,
    type: type ?? 'text',
    createdAt: new Date().toISOString(),
  };

  // Dispatch the chat_message event to listeners
  _dispatch({
    type: 'chat_message',
    payload: message as unknown as Record<string, unknown>,
    timestamp: message.createdAt,
  });

  return message;
}

export function subscribeToRoom(roomId: string): () => void {
  if (!connected) {
    throw new Error('Not connected to real-time service');
  }

  // In a real implementation, this would emit a join_room event to the server
  const handleChatEvent = (event: LiveEvent): void => {
    if (event.payload['roomId'] === roomId) {
      // Event is for this room — listeners on chat_message will handle it
    }
  };

  const unsubscribe = on('chat_message', handleChatEvent);
  return unsubscribe;
}

export function subscribeToDraftRoom(draftId: string): () => void {
  if (!connected) {
    throw new Error('Not connected to real-time service');
  }

  // In a real implementation, this would join the draft room via Socket.io
  const handleDraftEvent = (event: LiveEvent): void => {
    if (event.payload['draftId'] === draftId) {
      // Event is for this draft — listeners on draft_pick will handle it
    }
  };

  const unsubscribe = on('draft_pick', handleDraftEvent);
  return unsubscribe;
}

export function subscribeToLiveScoring(gameIds: string[]): () => void {
  if (!connected) {
    throw new Error('Not connected to real-time service');
  }

  const gameIdSet = new Set(gameIds);

  // In a real implementation, this would subscribe to specific game channels
  const handleScoreEvent = (event: LiveEvent): void => {
    const eventGameId = event.payload['gameId'] as string | undefined;
    if (eventGameId && gameIdSet.has(eventGameId)) {
      // Event is for a tracked game — listeners on score_update will handle it
    }
  };

  const unsubscribe = on('score_update', handleScoreEvent);
  return unsubscribe;
}
