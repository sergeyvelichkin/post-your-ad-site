import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';

export type TextEditorProps = {
  x: number;
  y: number;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  onDragEnd: (position: { x: number; y: number }) => void;
};

const MIN_WIDTH = 160;
const MIN_HEIGHT = 32;

export function TextEditor({ x, y, value, onChange, onKeyDown, onDragEnd }: TextEditorProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleWrapperPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: wrapper.offsetLeft,
      originY: wrapper.offsetTop
    };
  }, []);

  const handleWrapperPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragStateRef.current) return;
      event.preventDefault();
      const dx = event.clientX - dragStateRef.current.startX;
      const dy = event.clientY - dragStateRef.current.startY;
      const wrapper = wrapperRef.current;
      if (wrapper) {
        wrapper.style.left = `${dragStateRef.current.originX + dx}px`;
        wrapper.style.top = `${dragStateRef.current.originY + dy}px`;
      }
    },
    []
  );

  const handleWrapperPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const data = dragStateRef.current;
      if (!data) return;
      dragStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      const wrapper = wrapperRef.current;
      if (wrapper) {
        onDragEnd({ x: wrapper.offsetLeft, y: wrapper.offsetTop });
      }
    },
    [onDragEnd]
  );

  const clipStyle = useMemo(() => ({ left: x, top: y }), [x, y]);

  return (
    <div
      ref={wrapperRef}
      className="text-editor__wrapper"
      style={clipStyle}
      onPointerDown={handleWrapperPointerDown}
      onPointerMove={handleWrapperPointerMove}
      onPointerUp={handleWrapperPointerUp}
    >
      <textarea
        ref={textareaRef}
        className="text-editor"
        style={{ minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type here"
      />
    </div>
  );
}
