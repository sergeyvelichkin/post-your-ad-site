import { Stage, Layer, Line, Rect, Text as KonvaText } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { CanvasElement, CanvasSize } from '../types';
import type { DragEndPosition } from '../hooks/useCanvasBoard';
import { CanvasImage } from './CanvasImage';

export type CanvasStageProps = {
  size: CanvasSize;
  elements: CanvasElement[];
  onPointerDown: (event: KonvaEventObject<PointerEvent>) => void;
  onPointerMove: (event: KonvaEventObject<PointerEvent>) => void;
  onPointerUp: () => void;
  onElementDragEnd: (id: string, position: DragEndPosition) => void;
};

export function CanvasStage({ size, elements, onPointerDown, onPointerMove, onPointerUp, onElementDragEnd }: CanvasStageProps): JSX.Element {
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
                draggable
                x={element.offsetX}
                y={element.offsetY}
                onDragEnd={(event) => onElementDragEnd(element.id, { x: event.target.x(), y: event.target.y() })}
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
                stroke={element.color}
                strokeWidth={element.strokeWidth}
                fillEnabled={false}
                draggable
                onDragEnd={(event) => onElementDragEnd(element.id, { x: event.target.x(), y: event.target.y() })}
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
                draggable
                onDragEnd={(event) => onElementDragEnd(element.id, { x: event.target.x(), y: event.target.y() })}
              />
            );
          }

          if (element.type === 'image') {
            return <CanvasImage key={element.id} image={element} onDragEnd={onElementDragEnd} />;
          }

          return null;
        })}
      </Layer>
    </Stage>
  );
}
