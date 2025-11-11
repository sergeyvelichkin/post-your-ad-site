import { randomUUID } from 'node:crypto';

export type CanvasPoint = {
  x: number;
  y: number;
};

export type CanvasDrawEventInput = {
  type: 'draw';
  payload: {
    color: string;
    strokeWidth: number;
    points: CanvasPoint[];
  };
};

export type CanvasTextEventInput = {
  type: 'text';
  payload: {
    text: string;
    color: string;
    fontSize: number;
    position: CanvasPoint;
  };
};

export type CanvasEventInput = CanvasDrawEventInput | CanvasTextEventInput;

export type CanvasEvent = CanvasEventInput & {
  id: string;
  boardId: string;
  createdAt: string;
  authorSessionId: string;
};

export type CanvasAppearance = {
  backgroundColor: string;
};

type CanvasBoardState = {
  events: CanvasEvent[];
  appearance: CanvasAppearance;
};

const MAX_EVENTS_PER_BOARD = 500;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const RATE_LIMIT_MAX_EVENTS = 25;

const DEFAULT_APPEARANCE: CanvasAppearance = { backgroundColor: '#f8fafc' };

const boards = new Map<string, CanvasBoardState>();
const sessionEventsWindow = new Map<string, number[]>();

export class CanvasRateLimitError extends Error {
  constructor(message = 'Too many events, slow down') {
    super(message);
    this.name = 'CanvasRateLimitError';
  }
}

const getBoardState = (boardId: string, createIfMissing = true): CanvasBoardState | undefined => {
  const existing = boards.get(boardId);

  if (existing) {
    return existing;
  }

  if (!createIfMissing) {
    return undefined;
  }

  const state: CanvasBoardState = {
    events: [],
    appearance: { ...DEFAULT_APPEARANCE }
  };
  boards.set(boardId, state);
  return state;
};

export const getCanvasState = (boardId: string): CanvasBoardState => {
  const state = getBoardState(boardId);
  if (!state) {
    throw new Error('Failed to create board state');
  }

  return {
    events: [...state.events],
    appearance: { ...state.appearance }
  };
};

export const appendCanvasEvent = (
  boardId: string,
  sessionId: string,
  input: CanvasEventInput
): CanvasEvent => {
  enforceRateLimit(sessionId);

  const event: CanvasEvent = {
    ...normaliseEventPayload(input),
    id: randomUUID(),
    boardId,
    createdAt: new Date().toISOString(),
    authorSessionId: sessionId
  };

  const state = getBoardState(boardId);
  if (!state) {
    throw new Error('Failed to create board state');
  }

  state.events = [...state.events, event];

  if (state.events.length > MAX_EVENTS_PER_BOARD) {
    state.events.splice(0, state.events.length - MAX_EVENTS_PER_BOARD);
  }

  return event;
};

export const clearCanvasEvents = (boardId: string): void => {
  const state = getBoardState(boardId, false);
  if (!state) {
    return;
  }

  state.events = [];
};

export const resetCanvasStore = (): void => {
  boards.clear();
  sessionEventsWindow.clear();
};

export type CanvasEventUpdate =
  | {
      type: 'draw';
      payload: CanvasDrawEventInput['payload'];
    }
  | {
      type: 'text';
      payload: CanvasTextEventInput['payload'];
    };

export const updateCanvasEvent = (
  boardId: string,
  eventId: string,
  update: CanvasEventUpdate
): CanvasEvent | undefined => {
  const state = getBoardState(boardId, false);

  if (!state) {
    return undefined;
  }

  const index = state.events.findIndex((event) => event.id === eventId);

  if (index === -1) {
    return undefined;
  }

  const current = state.events[index];

  if (current.type !== update.type) {
    throw new Error('Event type mismatch');
  }

  const next: CanvasEvent = {
    ...current,
    ...normaliseEventPayload(update)
  };

  state.events[index] = next;
  return next;
};

export const deleteCanvasEvent = (boardId: string, eventId: string): boolean => {
  const state = getBoardState(boardId, false);

  if (!state) {
    return false;
  }

  const originalLength = state.events.length;
  state.events = state.events.filter((event) => event.id !== eventId);
  return state.events.length !== originalLength;
};

export const setBoardAppearance = (
  boardId: string,
  appearance: Partial<CanvasAppearance>
): CanvasAppearance => {
  const state = getBoardState(boardId);

  if (!state) {
    throw new Error('Failed to create board state');
  }

  state.appearance = {
    ...state.appearance,
    ...appearance
  };

  return { ...state.appearance };
};

const enforceRateLimit = (sessionId: string): void => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = sessionEventsWindow.get(sessionId) ?? [];
  const recent = timestamps.filter((timestamp) => timestamp >= windowStart);

  if (recent.length >= RATE_LIMIT_MAX_EVENTS) {
    sessionEventsWindow.set(sessionId, recent);
    throw new CanvasRateLimitError();
  }

  recent.push(now);
  sessionEventsWindow.set(sessionId, recent);
};

const normaliseEventPayload = (event: CanvasEventInput): CanvasEventInput => {
  if (event.type === 'draw') {
    return {
      type: 'draw',
      payload: {
        color: event.payload.color,
        strokeWidth: event.payload.strokeWidth,
        points: event.payload.points.map((point) => ({
          x: clamp(point.x, 0, 1),
          y: clamp(point.y, 0, 1)
        }))
      }
    };
  }

  return {
    type: 'text',
    payload: {
      text: event.payload.text.trim(),
      color: event.payload.color,
      fontSize: event.payload.fontSize,
      position: {
        x: clamp(event.payload.position.x, 0, 1),
        y: clamp(event.payload.position.y, 0, 1)
      }
    }
  };
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
