import { useCallback, useRef, useState } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { CanvasElement, PendingImage, Tool } from '../types';

export type UseCanvasBoardOptions = {
  tool: Tool;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  textValue: string;
  pendingImage: PendingImage | null;
  onImagePlaced: () => void;
  onElementCreated?: (element: CanvasElement) => void;
};

export type DragEndPosition = { x: number; y: number };

export const useCanvasBoard = ({
  tool,
  strokeColor,
  strokeWidth,
  fontSize,
  textValue,
  pendingImage,
  onImagePlaced,
  onElementCreated
}: UseCanvasBoardOptions) => {
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
      if (tool === 'hand') {
        return;
      }

      const stage = event.target.getStage();
      const point = stage?.getPointerPosition();
      if (!stage || !point) {
        return;
      }

      const clickedOnBackground = event.target === stage || event.target.getType() === 'Layer';
      if (!clickedOnBackground && (tool === 'pen' || tool === 'rect')) {
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

      if (tool === 'text') {
        const element: CanvasElement = {
          id: crypto.randomUUID(),
          type: 'text',
          color: strokeColor,
          fontSize,
          x: point.x,
          y: point.y,
          text: textValue
        };
        addElement(element);
        onElementCreated?.(element);
        return;
      }

      if (tool === 'image' && pendingImage) {
        const element: CanvasElement = {
          id: crypto.randomUUID(),
          type: 'image',
          x: point.x,
          y: point.y,
          width: pendingImage.width,
          height: pendingImage.height,
          src: pendingImage.src,
          title: pendingImage.title
        };
        addElement(element);
        onElementCreated?.(element);
        onImagePlaced();
      }
    },
    [addElement, fontSize, onElementCreated, onImagePlaced, pendingImage, strokeColor, strokeWidth, textValue, tool]
  );

  const handlePointerMove = useCallback(
    (event: KonvaEventObject<PointerEvent>) => {
      if (tool === 'hand') {
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
    },
    [tool, updateActiveElement]
  );

  const handlePointerUp = useCallback(() => {
    isDrawing.current = false;
    activeElementId.current = null;
  }, []);

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

  return {
    elements,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleElementDragEnd,
    updateElement,
    deleteElement
  };
};
