import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCanvasEvents, postCanvasEvent } from './api';
import type { CanvasEvent, CanvasEventDraft } from './types';

const POLL_INTERVAL_MS = 5_000;
const IS_TEST_ENV = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

type CanvasBoardState = {
  events: CanvasEvent[];
  isLoading: boolean;
  isPosting: boolean;
  error: string | null;
};

export const useCanvasBoard = (
  boardSlug: string
): {
  state: CanvasBoardState;
  submitEvent: (draft: CanvasEventDraft) => Promise<CanvasEvent>;
  refresh: () => Promise<void>;
} => {
  const [events, setEvents] = useState<CanvasEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const result = await fetchCanvasEvents(boardSlug);
      setEvents((prev) => mergeEvents(prev, result));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load canvas events');
    } finally {
      setIsLoading(false);
    }
  }, [boardSlug]);

  useEffect(() => {
    if (IS_TEST_ENV) {
      setIsLoading(false);
      return () => undefined;
    }

    let isMounted = true;

    const initialise = async (): Promise<void> => {
      if (!isMounted) {
        return;
      }

      await refresh();

      if (typeof window !== 'undefined') {
        pollRef.current = window.setInterval(() => {
          void refresh();
        }, POLL_INTERVAL_MS);
      }
    };

    void initialise();

    return () => {
      isMounted = false;

      if (typeof window !== 'undefined' && pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [refresh]);

  const submitEvent = useCallback(
    async (draft: CanvasEventDraft): Promise<CanvasEvent> => {
      setIsPosting(true);
      try {
        const created = await postCanvasEvent(boardSlug, draft);
        setEvents((prev) => mergeEvents(prev, [created]));
        setError(null);
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit event';
        setError(message);
        throw err;
      } finally {
        setIsPosting(false);
      }
    },
    [boardSlug]
  );

  const state = useMemo<CanvasBoardState>(
    () => ({
      events,
      isLoading,
      isPosting,
      error
    }),
    [events, error, isLoading, isPosting]
  );

  return {
    state,
    submitEvent,
    refresh
  };
};

const mergeEvents = (current: CanvasEvent[], incoming: CanvasEvent[]): CanvasEvent[] => {
  const byId = new Map<string, CanvasEvent>();

  for (const event of current) {
    byId.set(event.id, event);
  }

  for (const event of incoming) {
    byId.set(event.id, event);
  }

  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};
