import { Group, Rect, Text as KonvaText, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import type { ImageElement } from '../types';
import type { DragEndPosition } from '../hooks/useCanvasBoard';

export type CanvasImageProps = {
  image: ImageElement;
  onDragEnd: (id: string, position: DragEndPosition) => void;
};

export function CanvasImage({ image, onDragEnd }: CanvasImageProps): JSX.Element {
  const [konvaImage] = useImage(image.src, 'anonymous');

  return (
    <Group
      x={image.x}
      y={image.y}
      draggable
      onDragEnd={(event) => onDragEnd(image.id, { x: event.target.x(), y: event.target.y() })}
    >
      <Rect width={image.width} height={image.height} cornerRadius={8} stroke="rgba(15,23,42,0.25)" strokeWidth={1} fill="#fff" />
      <KonvaImage image={konvaImage ?? undefined} width={image.width} height={image.height} listening={false} />
      <KonvaText x={0} y={image.height + 8} text={image.title} fontSize={12} fill="#1f2937" />
    </Group>
  );
}
