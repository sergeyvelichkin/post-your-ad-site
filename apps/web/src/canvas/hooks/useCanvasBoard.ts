import { useCallback, useRef, useState } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { CanvasElement, Tool } from '../types';

export type UseCanvasBoardOptions = {
  tool: Tool;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  onElementCreated?: (element: CanvasElement) => void;
  onDrawingComplete?: (elementId: string) => void;
};

export type DragEndPosition = { x: number; y: number };

export const useCanvasBoard = ({ tool, strokeColor, strokeWidth, fontSize, onElementCreated, onDrawingComplete }: UseCanvasBoardOptions) => {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const isDrawing = useRef(false);
  const activeElementId = useRef<string | null>(null);

  const addElement = useCallback((element: CanvasElement) => {
    setElements((prev) => [...prev, element]);
    activeElementId.current = element.id;
  }, []);

  const updateActiveElement = useCallback((updater: (element: CanvasElement) => CanvasElement) => {
    const id = activeElementId.current;
    if (!id) return;
    setElements((prev) => prev.map((element) => (element.id === id ? updater({ ...element }) : element)));
  }, []);

  const handlePointerDown = useCallback(
    (event: KonvaEventObject<PointerEvent>) => {
      if (tool === 'hand' || tool === 'text' || tool === 'image') {
        return;
      }

      const stage = event.target.getStage();
      const point = stage?.getPointerPosition();
      if (!stage || !point) {
        return;
      }

      if (tool === 'pen') {
        isDrawing.current = true;
        const element: CanvasElement = {
          id: crypto.randomUUID(),
          type: 'pen',
          color: strokeColor,
          strokeWidth,
          points: [point.x, point.y],
          offsetX: 0,
          offsetY: 0
        };
        addElement(element);
        onElementCreated?.(element);
        return;
      }

      if (tool === 'rect') {
        isDrawing.current = true;
        const element: CanvasElement = {
          id: crypto.randomUUID(),
          type: 'rect',
          color: strokeColor,
          strokeWidth,
          x: point.x,
          y: point.y,
          width: 0,
          height: 0
        };
        addElement(element);
        onElementCreated?.(element);
        return;
      }

      if (tool === 'arrow') {
        isDrawing.current = true;
        const element: CanvasElement = {
          id: crypto.randomUUID(),
          type: 'arrow',
          color: strokeColor,
          strokeWidth,
          startX: point.x,
          startY: point.y,
          midX: point.x,
          midY: point.y,
          endX: point.x,
          endY: point.y
        };
        addElement(element);
        onElementCreated?.(element);
        return;
      }
    },
    [addElement, fontSize, onElementCreated, strokeColor, strokeWidth, tool]
  );

  const handlePointerMove = useCallback(
    (event: KonvaEventObject<PointerEvent>) => {
      if (tool === 'hand' || tool === 'text' || tool === 'image') {
        return;
      }

      if (!isDrawing.current) {
        return;
      }

      const stage = event.target.getStage();
      const point = stage?.getPointerPosition();
      if (!stage || !point) {
        return;
      }

      if (tool === 'pen') {
        updateActiveElement((element) => {
          if (element.type !== 'pen') return element;
          return { ...element, points: [...element.points, point.x, point.y] };
        });
      }

      if (tool === 'rect') {
        updateActiveElement((element) => {
          if (element.type !== 'rect') return element;
          const width = point.x - element.x;
          const height = point.y - element.y;
          return {
            ...element,
            x: width < 0 ? element.x + width : element.x,
            y: height < 0 ? element.y + height : element.y,
            width: Math.abs(width),
            height: Math.abs(height)
          };
        });
      }

      if (tool === 'arrow') {
        updateActiveElement((element) => {
          if (element.type !== 'arrow') return element;
          return {
            ...element,
            endX: point.x,
            endY: point.y,
            midX: (element.startX + point.x) / 2,
            midY: (element.startY + point.y) / 2
          };
        });
      }
    },
    [tool, updateActiveElement]
  );

  const handlePointerUp = useCallback(() => {
    const completedId = isDrawing.current ? activeElementId.current : null;
    isDrawing.current = false;
    activeElementId.current = null;
    if (completedId && onDrawingComplete) {
      onDrawingComplete(completedId);
    }
  }, [onDrawingComplete]);

  const handleElementDragEnd = useCallback((id: string, position: DragEndPosition) => {
    setElements((prev) =>
      prev.map((element) => {
        if (element.id !== id) {
          return element;
        }

        if (element.type === 'pen') {
          return {
            ...element,
            offsetX: position.x,
            offsetY: position.y
          };
        }

        if (element.type === 'arrow') {
          const dx = position.x - element.startX;
          const dy = position.y - element.startY;
          return {
            ...element,
            startX: element.startX + dx,
            startY: element.startY + dy,
            midX: element.midX + dx,
            midY: element.midY + dy,
            endX: element.endX + dx,
            endY: element.endY + dy
          };
        }

        return {
          ...element,
          x: position.x,
          y: position.y
        };
      })
    );
  }, []);

  const updateElement = useCallback((id: string, updater: (element: CanvasElement) => CanvasElement) => {
    setElements((prev) => prev.map((element) => (element.id === id ? updater({ ...element }) : element)));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((element) => element.id !== id));
  }, []);

  const createTextElement = useCallback(
    ({ x, y }: { x: number; y: number }) => {
      const element: CanvasElement = {
        id: crypto.randomUUID(),
        type: 'text',
        color: strokeColor,
        fontSize,
        x,
        y,
        text: ''
      };
      addElement(element);
      onElementCreated?.(element);
      return element;
    },
    [addElement, fontSize, onElementCreated, strokeColor]
  );

  const createImageElement = useCallback(
    ({ x, y, width, height, src, title }: { x: number; y: number; width: number; height: number; src: string; title: string }) => {
      const element: CanvasElement = {
        id: crypto.randomUUID(),
        type: 'image',
        x,
        y,
        width,
        height,
        src,
        title
      };
      addElement(element);
      onElementCreated?.(element);
      return element;
    },
    [addElement, onElementCreated]
  );

  const updateArrowPoints = useCallback(
    (id: string, part: 'start' | 'end' | 'middle', position: { x: number; y: number }) => {
      setElements((prev) =>
        prev.map((element) => {
          if (element.id !== id || element.type !== 'arrow') {
            return element;
          }

          if (part === 'start') {
            return { ...element, startX: position.x, startY: position.y };
          }

          if (part === 'end') {
            return { ...element, endX: position.x, endY: position.y };
          }

          return {
            ...element,
            midX: position.x,
            midY: position.y
          };
        })
      );
    },
    []
  );

  return {
    elements,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleElementDragEnd,
    updateElement,
    deleteElement,
    createTextElement,
    createImageElement,
    updateArrowPoints
  };
};
