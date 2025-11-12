import { Stage, Layer, Line, Rect, Text as KonvaText, Arrow as KonvaArrow, Circle, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { CanvasElement, CanvasSize, Tool } from '../types';
import type { DragEndPosition } from '../hooks/useCanvasBoard';
import { CanvasImage } from './CanvasImage';

export type CanvasStageProps = {
  size: CanvasSize;
  elements: CanvasElement[];
  activeTool: Tool;
  selectedElementId: string | null;
  onPointerDown: (event: KonvaEventObject<PointerEvent>) => void;
  onPointerMove: (event: KonvaEventObject<PointerEvent>) => void;
  onPointerUp: () => void;
  onElementSelect: (id: string) => void;
  onElementDragEnd: (id: string, position: DragEndPosition) => void;
  onArrowPointChange: (id: string, part: 'start' | 'end' | 'middle', position: { x: number; y: number }) => void;
};

export function CanvasStage({
  size,
  elements,
  activeTool,
  selectedElementId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onElementSelect,
  onElementDragEnd,
  onArrowPointChange
}: CanvasStageProps): JSX.Element {
  const isHandMode = activeTool === 'hand';

  const handleShapePointerDown = (elementId: string) => (event: KonvaEventObject<PointerEvent>) => {
    event.cancelBubble = true;
    onElementSelect(elementId);
  };

  const handleShapeDragEnd = (elementId: string) => (event: KonvaEventObject<DragEvent>) => {
    onElementDragEnd(elementId, { x: event.target.x(), y: event.target.y() });
  };

  return (
    <Stage
      width={size.width}
      height={size.height}
      className="canvas-app__stage"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <Layer>
        {elements.map((element) => {
          const isSelected = selectedElementId === element.id;
          const draggable = isHandMode;
          const pointerDown = isHandMode ? handleShapePointerDown(element.id) : undefined;
          const dragEnd = isHandMode ? handleShapeDragEnd(element.id) : undefined;
          const dragStart = isHandMode ? () => onElementSelect(element.id) : undefined;

          if (element.type === 'pen') {
            return (
              <Line
                key={element.id}
                points={element.points}
                stroke={element.color}
                strokeWidth={element.strokeWidth}
                tension={0.5}
                lineCap="round"
                globalCompositeOperation="source-over"
                x={element.offsetX}
                y={element.offsetY}
                shadowColor={isSelected ? '#6366f1' : undefined}
                shadowBlur={isSelected ? 14 : 0}
                opacity={isSelected ? 1 : 0.95}
                draggable={draggable}
                onPointerDown={pointerDown}
                onDragStart={dragStart}
                onDragEnd={dragEnd}
              />
            );
          }

          if (element.type === 'rect') {
            return (
              <Rect
                key={element.id}
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                stroke={isSelected ? '#6366f1' : element.color}
                strokeWidth={element.strokeWidth + (isSelected ? 1 : 0)}
                fillEnabled={false}
                draggable={draggable}
                onPointerDown={pointerDown}
                onDragStart={dragStart}
                onDragEnd={dragEnd}
              />
            );
          }

          if (element.type === 'text') {
            return (
              <KonvaText
                key={element.id}
                x={element.x}
                y={element.y}
                text={element.text}
                fontSize={element.fontSize}
                fill={element.color}
                strokeEnabled={isSelected}
                stroke="#818cf8"
                strokeWidth={isSelected ? 0.5 : 0}
                draggable={draggable}
                onPointerDown={pointerDown}
                onDragStart={dragStart}
                onDragEnd={dragEnd}
              />
            );
          }

          if (element.type === 'image') {
            return (
              <CanvasImage
                key={element.id}
                image={element}
                onDragEnd={onElementDragEnd}
                isInteractive={isHandMode}
                isSelected={isSelected}
                onSelect={onElementSelect}
              />
            );
          }

          if (element.type === 'arrow') {
            const midX = element.midX;
            const midY = element.midY;
            const commonHandleProps = {
              draggable: isSelected,
              stroke: '#fff',
              strokeWidth: 1
            } as const;

            return (
              <Group key={element.id}>
                <KonvaArrow
                  points={[element.startX, element.startY, element.midX, element.midY, element.endX, element.endY]}
                  stroke={element.color}
                  strokeWidth={element.strokeWidth}
                  pointerWidth={element.strokeWidth * 2}
                  pointerLength={element.strokeWidth * 2.5}
                  lineCap="round"
                  lineJoin="round"
                  draggable={isHandMode}
                  onPointerDown={isHandMode ? handleShapePointerDown(element.id) : undefined}
                  onDragStart={isHandMode ? () => onElementSelect(element.id) : undefined}
                  onDragEnd={isHandMode ? (event) => onElementDragEnd(element.id, { x: event.target.x(), y: event.target.y() }) : undefined}
                />
                {isSelected && isHandMode ? (
                  <>
                    <Circle
                      x={element.startX}
                      y={element.startY}
                      radius={8}
                      fill="#6366f1"
                      {...commonHandleProps}
                      onPointerDown={() => onElementSelect(element.id)}
                      onDragMove={(event) => onArrowPointChange(element.id, 'start', { x: event.target.x(), y: event.target.y() })}
                    />
                    <Circle
                      x={element.endX}
                      y={element.endY}
                      radius={8}
                      fill="#6366f1"
                      {...commonHandleProps}
                      onPointerDown={() => onElementSelect(element.id)}
                      onDragMove={(event) => onArrowPointChange(element.id, 'end', { x: event.target.x(), y: event.target.y() })}
                    />
                    <Circle
                      x={midX}
                      y={midY}
                      radius={7}
                      fill="#a855f7"
                      {...commonHandleProps}
                      onPointerDown={() => onElementSelect(element.id)}
                      onDragMove={(event) => onArrowPointChange(element.id, 'middle', { x: event.target.x(), y: event.target.y() })}
                    />
                  </>
                ) : null}
              </Group>
            );
          }

          return null;
        })}
      </Layer>
    </Stage>
  );
}
