import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CanvasStage } from './canvas/components/CanvasStage';
import { Toolbar } from './canvas/components/Toolbar';
import { TextEditor } from './canvas/components/TextEditor';
import { useCanvasBoard } from './canvas/hooks/useCanvasBoard';
import { getImageDimensions, readFileAsDataURL } from './canvas/utils/image';
import type { CanvasElement, CanvasSize, Tool } from './canvas/types';
import { MAX_IMAGE_SIZE, NAV_HEIGHT, PANEL_HEIGHT, PANEL_WIDTH } from './canvas/types';

const initialCanvasSize = (): CanvasSize => ({
  width: window.innerWidth,
  height: Math.max(200, window.innerHeight - NAV_HEIGHT)
});

const initialPanelPosition = (): { x: number; y: number } => ({
  x: window.innerWidth / 2 - PANEL_WIDTH / 2,
  y: window.innerHeight - PANEL_HEIGHT - 24
});

type TextEditorState = {
  id: string;
  x: number;
  y: number;
  value: string;
  initialValue: string;
};

type SelectionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function App(): JSX.Element {
  const [tool, setTool] = useState<Tool>('pen');
  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(24);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(() => initialCanvasSize());
  const [panelPosition, setPanelPosition] = useState(() => initialPanelPosition());
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [textEditor, setTextEditor] = useState<TextEditorState | null>(null);
  const dragPanelRef = useRef<{ offsetX: number; offsetY: number; pointerId: number } | null>(null);

  const clampPanelPosition = useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(16, canvasSize.width - PANEL_WIDTH - 16);
      const maxY = Math.max(NAV_HEIGHT + 16, NAV_HEIGHT + canvasSize.height - PANEL_HEIGHT - 16);
      return {
        x: Math.min(Math.max(16, x), maxX),
        y: Math.min(Math.max(NAV_HEIGHT + 16, y), maxY)
      };
    },
    [canvasSize]
  );

  useEffect(() => {
    const handleResize = (): void => {
      setCanvasSize(initialCanvasSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPanelPosition((prev) => clampPanelPosition(prev.x, prev.y));
  }, [clampPanelPosition]);

const handleElementCreated = useCallback((element: CanvasElement) => {
  if (element.type === 'text') {
    setTextEditor({ id: element.id, x: element.x, y: element.y, value: element.text, initialValue: element.text });
  }
}, []);

  const {
    elements,
    handlePointerDown: canvasPointerDown,
    handlePointerMove: canvasPointerMove,
    handlePointerUp: canvasPointerUp,
    handleElementDragEnd,
    updateElement,
    deleteElement,
    createTextElement,
    createImageElement,
    updateArrowPoints
  } = useCanvasBoard({
    tool,
    strokeColor,
    strokeWidth,
    fontSize,
    onElementCreated: handleElementCreated,
    onDrawingComplete: setSelectedElementId
  });

  useEffect(() => {
    const handleDeleteKey = (event: KeyboardEvent): void => {
      if (textEditor) return;
      if (!selectedElementId) return;
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        deleteElement(selectedElementId);
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleDeleteKey);
    return () => window.removeEventListener('keydown', handleDeleteKey);
  }, [deleteElement, selectedElementId, textEditor]);

  const selectedElement = useMemo(() => elements.find((element) => element.id === selectedElementId) ?? null, [elements, selectedElementId]);
  const selectionBounds = useMemo<SelectionBounds | null>(() => (selectedElement ? getElementBounds(selectedElement) : null), [selectedElement]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const title = file.name;
      const dataUrl = await readFileAsDataURL(file);
      const { width, height } = await getImageDimensions(dataUrl);
      const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(width, height));
      const scaledWidth = Math.round(width * scale);
      const scaledHeight = Math.round(height * scale);
      const centerX = Math.max(0, Math.round(canvasSize.width / 2 - scaledWidth / 2));
      const centerY = Math.max(0, Math.round(canvasSize.height / 2 - scaledHeight / 2));

      const element = createImageElement({ x: centerX, y: centerY, width: scaledWidth, height: scaledHeight, src: dataUrl, title });
      setSelectedElementId(element.id);
      event.target.value = '';
    },
    [canvasSize.height, canvasSize.width, createImageElement]
  );

  const handlePanelPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const handle = (event.target as HTMLElement | null)?.closest('[data-panel-handle="true"]');
    if (!handle) {
      return;
    }
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    dragPanelRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId
    };
    target.setPointerCapture(event.pointerId);
  }, []);

  const handlePanelPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragPanelRef.current) return;
      event.preventDefault();
      const nextPosition = clampPanelPosition(event.clientX - dragPanelRef.current.offsetX, event.clientY - dragPanelRef.current.offsetY);
      setPanelPosition(nextPosition);
    },
    [clampPanelPosition]
  );

  const handlePanelPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragPanelRef.current || dragPanelRef.current.pointerId !== event.pointerId) {
      return;
    }
    dragPanelRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const commitTextEditor = useCallback(() => {
    setTextEditor((prev) => {
      if (!prev) return null;
      const trimmed = prev.value.trim();
      if (!trimmed) {
        deleteElement(prev.id);
        setSelectedElementId((current) => (current === prev.id ? null : current));
      } else {
        updateElement(prev.id, (element) => (element.type === 'text' ? { ...element, text: trimmed } : element));
      }
      return null;
    });
  }, [deleteElement, updateElement]);

  useEffect(() => {
    if (tool !== 'text' && textEditor) {
      commitTextEditor();
    }
  }, [commitTextEditor, textEditor, tool]);

  const cancelTextEditor = useCallback(() => {
    setTextEditor((prev) => {
      if (!prev) return null;
      if (!prev.initialValue.trim()) {
        deleteElement(prev.id);
        setSelectedElementId((current) => (current === prev.id ? null : current));
      } else {
        updateElement(prev.id, (element) => (element.type === 'text' ? { ...element, text: prev.initialValue } : element));
      }
      return null;
    });
  }, [deleteElement, updateElement]);

  const handleTextInputChange = useCallback((value: string) => {
    setTextEditor((prev) => (prev ? { ...prev, value } : prev));
  }, []);

  const handleTextInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelTextEditor();
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        commitTextEditor();
      }
    },
    [cancelTextEditor, commitTextEditor]
  );

  const handleElementSelect = useCallback(
    (elementId: string) => {
      if (tool !== 'hand') return;
      setSelectedElementId(elementId);
    },
    [tool]
  );

  const handleArrowPointChange = useCallback(
    (id: string, part: 'start' | 'end' | 'middle', position: { x: number; y: number }) => {
      updateArrowPoints(id, part, position);
    },
    [updateArrowPoints]
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedElementId) {
      return;
    }
    deleteElement(selectedElementId);
    setSelectedElementId(null);
  }, [deleteElement, selectedElementId]);

  const handleStagePointerDown = useCallback(
    (event: KonvaEventObject<PointerEvent>) => {
      if (tool === 'hand') {
        const stage = event.target.getStage();
        if (!stage) return;
        const clickedEmpty = event.target === stage || event.target.getType() === 'Layer';
        if (clickedEmpty) {
          setSelectedElementId(null);
        }
        return;
      }

      if (tool === 'text') {
        const stage = event.target.getStage();
        const point = stage?.getPointerPosition();
        if (!stage || !point) {
          return;
        }
        if (textEditor) {
          commitTextEditor();
        }
        const element = createTextElement(point);
        setTextEditor({ id: element.id, x: element.x, y: element.y, value: element.text, initialValue: element.text });
        setSelectedElementId(element.id);
        return;
      }

      if (textEditor) {
        commitTextEditor();
      }

      canvasPointerDown(event);
    },
    [canvasPointerDown, commitTextEditor, createTextElement, textEditor, tool]
  );

  const handleStagePointerMove = useCallback(
    (event: KonvaEventObject<PointerEvent>) => {
      if (tool === 'hand' || tool === 'text') return;
      canvasPointerMove(event);
    },
    [canvasPointerMove, tool]
  );

  const handleStagePointerUp = useCallback(() => {
    canvasPointerUp();
  }, [canvasPointerUp]);

  const navHint = useMemo(() => {
    if (tool === 'image') return 'Select an image to drop onto the board.';
    if (tool === 'text') return 'Click anywhere to place text and start typing.';
    if (tool === 'arrow') return 'Click and drag to draw an arrow.';
    if (tool === 'hand') return 'Select ads to move or delete them.';
    return 'Pick a mode to begin sketching.';
  }, [tool]);

  return (
    <div className="canvas-app">
      <header className="canvas-app__nav">
        <div className="canvas-app__brand">Post Your Ad – Creator</div>
        <p className="canvas-app__hint">{navHint}</p>
      </header>
      <div className={`canvas-app__stage-wrapper${tool === 'hand' ? ' canvas-app__stage-wrapper--hand' : ''}`}>
        <CanvasStage
          size={canvasSize}
          elements={elements}
          activeTool={tool}
          selectedElementId={selectedElementId}
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onElementSelect={handleElementSelect}
          onElementDragEnd={handleElementDragEnd}
          onArrowPointChange={handleArrowPointChange}
        />
        {selectionBounds && !textEditor ? (
          <div
            className="selection-overlay"
            style={{
              left: selectionBounds.x - 4,
              top: selectionBounds.y - 4,
              width: selectionBounds.width + 8,
              height: selectionBounds.height + 8
            }}
          >
            <div className="selection-overlay__box" />
            <button className="selection-overlay__delete" type="button" onClick={handleDeleteSelected} aria-label="Delete selection">
              ×
            </button>
          </div>
        ) : null}
        {textEditor ? (
          <TextEditor
            x={textEditor.x}
            y={textEditor.y}
            value={textEditor.value}
            onChange={handleTextInputChange}
            onKeyDown={handleTextInputKeyDown}
            onDragEnd={({ x: nextX, y: nextY }) => {
              setTextEditor((prev) => {
                if (!prev) return prev;
                updateElement(prev.id, (element) => (element.type === 'text' ? { ...element, x: nextX, y: nextY } : element));
                return { ...prev, x: nextX, y: nextY };
              });
            }}
          />
        ) : null}
        <Toolbar
          position={panelPosition}
          dimensions={{ width: PANEL_WIDTH, height: PANEL_HEIGHT }}
          tool={tool}
          onToolChange={setTool}
          strokeColor={strokeColor}
          onStrokeColorChange={setStrokeColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onFileChange={handleFileChange}
          onPointerDown={handlePanelPointerDown}
          onPointerMove={handlePanelPointerMove}
          onPointerUp={handlePanelPointerUp}
        />
      </div>
    </div>
  );
}

const getElementBounds = (element: CanvasElement): SelectionBounds | null => {
  if (element.type === 'rect') {
    return {
      x: element.x,
      y: element.y,
      width: Math.max(24, element.width),
      height: Math.max(24, element.height)
    };
  }

  if (element.type === 'text') {
    const width = Math.max(24, estimateTextWidth(element.text || 'Text', element.fontSize));
    const height = Math.max(24, element.fontSize * 1.2);
    return { x: element.x, y: element.y, width, height };
  }

  if (element.type === 'image') {
    return {
      x: element.x,
      y: element.y,
      width: Math.max(24, element.width),
      height: Math.max(24, element.height + 16)
    };
  }

  if (element.type === 'pen') {
    if (!element.points.length) return null;
    const xs = element.points.filter((_, index) => index % 2 === 0);
    const ys = element.points.filter((_, index) => index % 2 === 1);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      x: minX + element.offsetX,
      y: minY + element.offsetY,
      width: Math.max(24, maxX - minX),
      height: Math.max(24, maxY - minY)
    };
  }

  if (element.type === 'arrow') {
    const minX = Math.min(element.startX, element.midX, element.endX);
    const minY = Math.min(element.startY, element.midY, element.endY);
    const maxX = Math.max(element.startX, element.midX, element.endX);
    const maxY = Math.max(element.startY, element.midY, element.endY);
    return {
      x: minX,
      y: minY,
      width: Math.max(24, maxX - minX),
      height: Math.max(24, maxY - minY)
    };
  }

  return null;
};

const estimateTextWidth = (text: string, fontSize: number): number => {
  const averageCharWidth = fontSize * 0.55;
  return Math.max(fontSize, text.length * averageCharWidth);
};
