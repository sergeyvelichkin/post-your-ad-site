import { useMemo, useState } from 'react';
import { CanvasSurface } from './CanvasSurface';
import { useCanvasBoard } from './useCanvasBoard';
import type { CanvasPoint } from './types';

const DEFAULT_BOARD_SLUG = 'downtown-wall';
const DEFAULT_STROKE_COLOR = '#2563eb';
const DEFAULT_TEXT_COLOR = '#0f172a';
const STROKE_WIDTH_OPTIONS = [2, 4, 6];

export const CanvasBoard = ({ boardSlug = DEFAULT_BOARD_SLUG }: { boardSlug?: string }): JSX.Element => {
  const { state, submitEvent } = useCanvasBoard(boardSlug);
  const [strokeColor, setStrokeColor] = useState(DEFAULT_STROKE_COLOR);
  const [strokeWidth, setStrokeWidth] = useState<number>(STROKE_WIDTH_OPTIONS[1]);
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(DEFAULT_TEXT_COLOR);
  const [noteFontSize, setNoteFontSize] = useState(20);

  const { strokeCount, noteCount } = useMemo(() => {
    let strokes = 0;
    let notes = 0;

    for (const event of state.events) {
      if (event.type === 'draw') {
        strokes += 1;
      } else {
        notes += 1;
      }
    }

    return { strokeCount: strokes, noteCount: notes };
  }, [state.events]);

  const handleStrokeComplete = async (points: CanvasPoint[]): Promise<void> => {
    if (points.length < 2) {
      return;
    }

    try {
      await submitEvent({
        type: 'draw',
        payload: {
          color: strokeColor,
          strokeWidth,
          points
        }
      });
    } catch (error) {
      // state.error already updated by the hook; swallow to avoid UI disruption
    }
  };

  const handleSubmitNote = async (): Promise<void> => {
    const trimmed = noteText.trim();

    if (!trimmed) {
      return;
    }

    try {
      await submitEvent({
        type: 'text',
        payload: {
          text: trimmed,
          color: noteColor,
          fontSize: noteFontSize
        }
      });

      setNoteText('');
    } catch (error) {
      // error handled by hook state
    }
  };

  return (
    <section className="canvas-board" aria-live="polite">
      <header className="canvas-board__header">
        <div>
          <p className="canvas-board__eyebrow">Live Community Canvas</p>
          <h2>Downtown Wall</h2>
          <p>Draw or drop a note — everyone connected sees it appear in seconds.</p>
        </div>
        <div className="canvas-board__controls">
          <label>
            Stroke
            <input
              type="color"
              value={strokeColor}
              onChange={(event) => setStrokeColor(event.target.value)}
              aria-label="Stroke color"
            />
          </label>
          <label>
            Width
            <select
              value={strokeWidth}
              onChange={(event) => setStrokeWidth(Number(event.target.value))}
              aria-label="Stroke width"
            >
              {STROKE_WIDTH_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}px
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <CanvasSurface
        events={state.events}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        onStrokeComplete={handleStrokeComplete}
      />

      <div className="canvas-board__note-form">
        <label htmlFor="canvas-note-input">Post a quick note</label>
        <textarea
          id="canvas-note-input"
          value={noteText}
          maxLength={280}
          rows={2}
          onChange={(event) => setNoteText(event.target.value)}
          placeholder="Hype your project, ask a question, share an idea..."
        />
        <div className="canvas-board__note-controls">
          <label>
            Text color
            <input
              type="color"
              value={noteColor}
              onChange={(event) => setNoteColor(event.target.value)}
              aria-label="Note text color"
            />
          </label>
          <label>
            Font size
            <input
              type="range"
              min={14}
              max={42}
              value={noteFontSize}
              onChange={(event) => setNoteFontSize(Number(event.target.value))}
            />
            <span>{noteFontSize}px</span>
          </label>
          <button type="button" onClick={() => void handleSubmitNote()} disabled={state.isPosting}>
            Post note
          </button>
        </div>
      </div>

      <footer className="canvas-board__footer">
        {state.isLoading ? <span>Loading canvas…</span> : null}
        {state.error ? <span className="canvas-board__error">{state.error}</span> : null}
        {!state.isLoading ? (
          <div className="canvas-board__legend">
            <span>{strokeCount} strokes</span>
            <span>{noteCount} notes</span>
          </div>
        ) : null}
      </footer>
    </section>
  );
};
