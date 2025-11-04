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

const MAX_EVENTS_PER_BOARD = 500;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const RATE_LIMIT_MAX_EVENTS = 25;

const boards = new Map<string, CanvasEvent[]>();
const sessionEventsWindow = new Map<string, number[]>();

export class CanvasRateLimitError extends Error {
  constructor(message = 'Too many events, slow down') {
    super(message);
    this.name = 'CanvasRateLimitError';
  }
}

export const listCanvasEvents = (boardId: string): CanvasEvent[] => {
  const events = boards.get(boardId);
  return events ? [...events] : [];
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

  const existing = boards.get(boardId) ?? [];
  const updated = [...existing, event];

  if (updated.length > MAX_EVENTS_PER_BOARD) {
    updated.splice(0, updated.length - MAX_EVENTS_PER_BOARD);
  }

  boards.set(boardId, updated);
  return event;
};

export const clearCanvasEvents = (boardId: string): void => {
  boards.delete(boardId);
};

export const resetCanvasStore = (): void => {
  boards.clear();
  sessionEventsWindow.clear();
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
