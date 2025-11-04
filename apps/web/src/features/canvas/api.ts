import type { CanvasEvent, CanvasEventDraft, CanvasPoint } from './types';

const jsonHeaders = {
  'Content-Type': 'application/json'
} as const;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const fetchCanvasEvents = async (boardSlug: string): Promise<CanvasEvent[]> => {
  const response = await fetch(`/api/boards/${boardSlug}/canvas/events`, {
    credentials: 'include'
  });

  const body = await handleResponse<{ boardId: string; events: CanvasEvent[] }>(response);
  return body.events;
};

export const postCanvasEvent = async (
  boardSlug: string,
  draft: CanvasEventDraft
): Promise<CanvasEvent> => {
  const response = await fetch(`/api/boards/${boardSlug}/canvas/events`, {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify(normaliseDraft(draft))
  });

  return handleResponse<CanvasEvent>(response);
};

const normaliseDraft = (draft: CanvasEventDraft): CanvasEventDraft => {
  if (draft.type === 'text') {
    return {
      type: 'text',
      payload: {
        ...draft.payload,
        position: draft.payload.position ?? randomPosition()
      }
    };
  }

  return draft;
};

const randomPosition = (): CanvasPoint => ({
  x: clamp(Math.random() * 0.7 + 0.15, 0, 1),
  y: clamp(Math.random() * 0.7 + 0.15, 0, 1)
});

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const parseError = async (response: Response): Promise<string> => {
  try {
    const data: unknown = await response.json();

    if (isErrorResponse(data)) {
      return data.message;
    }
  } catch (error) {
    // Ignore JSON parsing errors and fall back to generic message
  }

  return `Request failed with status ${response.status}`;
};

const isErrorResponse = (value: unknown): value is { message: string } =>
  typeof value === 'object' && value !== null && 'message' in value && typeof (value as { message: unknown }).message === 'string';
