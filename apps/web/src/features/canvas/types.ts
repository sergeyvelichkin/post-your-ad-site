export type CanvasPoint = {
  x: number;
  y: number;
};

export type CanvasDrawEvent = {
  id: string;
  boardId: string;
  createdAt: string;
  authorSessionId: string;
  type: 'draw';
  payload: {
    color: string;
    strokeWidth: number;
    points: CanvasPoint[];
  };
};

export type CanvasTextEvent = {
  id: string;
  boardId: string;
  createdAt: string;
  authorSessionId: string;
  type: 'text';
  payload: {
    text: string;
    color: string;
    fontSize: number;
    position: CanvasPoint;
  };
};

export type CanvasEvent = CanvasDrawEvent | CanvasTextEvent;

export type CanvasEventDraft =
  | {
      type: 'draw';
      payload: CanvasDrawEvent['payload'];
    }
  | {
      type: 'text';
      payload: Omit<CanvasTextEvent['payload'], 'position'> & { position?: CanvasPoint };
    };
