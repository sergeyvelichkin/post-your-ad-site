import { Group, Rect, Image as KonvaImage } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import useImage from 'use-image';
import type { ImageElement } from '../types';
import type { DragEndPosition } from '../hooks/useCanvasBoard';

export type CanvasImageProps = {
  image: ImageElement;
  onDragEnd: (id: string, position: DragEndPosition) => void;
  isInteractive: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export function CanvasImage({ image, onDragEnd, isInteractive, isSelected, onSelect }: CanvasImageProps): JSX.Element {
  const [konvaImage] = useImage(image.src, 'anonymous');

  const handlePointerDown = (event: KonvaEventObject<PointerEvent>): void => {
    if (!isInteractive) return;
    event.cancelBubble = true;
    onSelect(image.id);
  };

  return (
    <Group
      x={image.x}
      y={image.y}
      draggable={isInteractive}
      onPointerDown={isInteractive ? handlePointerDown : undefined}
      onDragStart={isInteractive ? () => onSelect(image.id) : undefined}
      onDragEnd={isInteractive ? (event) => onDragEnd(image.id, { x: event.target.x(), y: event.target.y() }) : undefined}
    >
      <Rect
        width={image.width}
        height={image.height}
        cornerRadius={8}
        stroke={isSelected ? '#6366f1' : 'rgba(15,23,42,0.25)'}
        strokeWidth={isSelected ? 2 : 1}
        fill="#fff"
      />
      <KonvaImage image={konvaImage ?? undefined} width={image.width} height={image.height} listening={false} />
    </Group>
  );
}
