import { useCallback, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { CanvasEvent, CanvasPoint } from './types';

type CanvasSurfaceProps = {
  events: CanvasEvent[];
  strokeColor: string;
  strokeWidth: number;
  onStrokeComplete: (points: CanvasPoint[]) => Promise<void> | void;
};

const VIEWBOX_SIZE = 1000;
const POINT_THRESHOLD = 0.005;

export const CanvasSurface = ({
  events,
  strokeColor,
  strokeWidth,
  onStrokeComplete
}: CanvasSurfaceProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef<CanvasPoint[]>([]);
  const [previewStroke, setPreviewStroke] = useState<CanvasPoint[] | null>(null);

  const normalisePointer = useCallback((event: PointerEvent<HTMLDivElement>): CanvasPoint | null => {
    const container = containerRef.current;

    if (!container) {
      return null;
    }

    const rect = container.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    return {
      x: clamp(x, 0, 1),
      y: clamp(y, 0, 1)
    };
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const point = normalisePointer(event);

    if (!point) {
      return;
    }

    drawingRef.current = true;
    pointsRef.current = [point];
    setPreviewStroke([point]);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!drawingRef.current) {
      return;
    }

    const point = normalisePointer(event);
    if (!point) {
      return;
    }

    const points = pointsRef.current;
    const lastPoint = points[points.length - 1];

    if (!lastPoint || distance(lastPoint, point) >= POINT_THRESHOLD) {
      points.push(point);
      pointsRef.current = points;
      setPreviewStroke([...points]);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (!drawingRef.current) {
      return;
    }

    drawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const stroke = pointsRef.current;
    pointsRef.current = [];
    setPreviewStroke(null);

    if (stroke.length < 2) {
      return;
    }

    void Promise.resolve(onStrokeComplete([...stroke])).catch(() => {
      // Errors handled upstream via board state
    });
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>): void => {
    if (drawingRef.current) {
      handlePointerUp(event);
    }
  };

  return (
    <div
      ref={containerRef}
      className="canvas-surface"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <svg className="canvas-surface__svg" viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}>
        {events.map((event) => {
          if (event.type !== 'draw') {
            return null;
          }

          return (
            <polyline
              key={event.id}
              points={toSvgPoints(event.payload.points)}
              stroke={event.payload.color}
              strokeWidth={event.payload.strokeWidth * 2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          );
        })}
        {previewStroke ? (
          <polyline
            points={toSvgPoints(previewStroke)}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />
        ) : null}
      </svg>

      {events.map((event) => {
        if (event.type !== 'text') {
          return null;
        }

        const { position, text, color, fontSize } = event.payload;

        return (
          <span
            key={event.id}
            className="canvas-surface__note"
            style={{
              left: `${position.x * 100}%`,
              top: `${position.y * 100}%`,
              color,
              fontSize
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const distance = (a: CanvasPoint, b: CanvasPoint): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const toSvgPoints = (points: CanvasPoint[]): string =>
  points
    .map((point) => `${point.x * VIEWBOX_SIZE},${point.y * VIEWBOX_SIZE}`)
    .join(' ');
