import { Stage, Layer, Line, Rect, Text as KonvaText, Image as KonvaImage, Group } from 'react-konva';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import useImage from 'use-image';
import { PencilSimple, Square, TextT, ImageSquare, UploadSimple } from 'phosphor-react';
import type { IconProps } from 'phosphor-react';

type Tool = 'pen' | 'rect' | 'text' | 'image';

type PenElement = {
  id: string;
  type: 'pen';
  color: string;
  strokeWidth: number;
  points: number[];
  offsetX: number;
  offsetY: number;
};

type RectElement = {
  id: string;
  type: 'rect';
  color: string;
  strokeWidth: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type TextElement = {
  id: string;
  type: 'text';
  color: string;
  fontSize: number;
  x: number;
  y: number;
  text: string;
};

type ImageElement = {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  title: string;
};

type CanvasElement = PenElement | RectElement | TextElement | ImageElement;
type IconRenderer = (props: IconProps) => JSX.Element;

const NAV_HEIGHT = 72;
const PANEL_WIDTH = 720;
const PANEL_HEIGHT = 80;
const MAX_IMAGE_SIZE = 220;

export default function App(): JSX.Element {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [textValue, setTextValue] = useState('New message');
  const [fontSize, setFontSize] = useState(24);
  const [pendingImage, setPendingImage] = useState<{ src: string; width: number; height: number; title: string } | null>(null);
  const [canvasSize, setCanvasSize] = useState(() => ({
    width: window.innerWidth,
    height: Math.max(200, window.innerHeight - NAV_HEIGHT)
  }));
  const [panelPosition, setPanelPosition] = useState({ x: window.innerWidth / 2 - PANEL_WIDTH / 2, y: window.innerHeight - PANEL_HEIGHT - 24 });
  const isDrawing = useRef(false);
  const activeElementId = useRef<string | null>(null);
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
      setCanvasSize({
        width: window.innerWidth,
        height: Math.max(200, window.innerHeight - NAV_HEIGHT)
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPanelPosition((prev) => clampPanelPosition(prev.x, prev.y));
  }, [clampPanelPosition]);

  const addElement = (element: CanvasElement): void => {
    setElements((prev) => [...prev, element]);
    activeElementId.current = element.id;
  };

  const updateActiveElement = (updater: (element: CanvasElement) => CanvasElement): void => {
    const id = activeElementId.current;
    if (!id) return;
    setElements((prev) => prev.map((element) => (element.id === id ? updater({ ...element }) : element)));
  };

  const handlePointerDown = (event: KonvaEventObject<PointerEvent>): void => {
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
      addElement({
        id: crypto.randomUUID(),
        type: 'pen',
        color: strokeColor,
        strokeWidth,
        points: [point.x, point.y],
        offsetX: 0,
        offsetY: 0
      });
      return;
    }

    if (tool === 'rect') {
      isDrawing.current = true;
      addElement({
        id: crypto.randomUUID(),
        type: 'rect',
        color: strokeColor,
        strokeWidth,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0
      });
      return;
    }

    if (tool === 'text') {
      addElement({
        id: crypto.randomUUID(),
        type: 'text',
        color: strokeColor,
        fontSize,
        x: point.x,
        y: point.y,
        text: textValue
      });
      return;
    }

    if (tool === 'image' && pendingImage) {
      addElement({
        id: crypto.randomUUID(),
        type: 'image',
        x: point.x,
        y: point.y,
        width: pendingImage.width,
        height: pendingImage.height,
        src: pendingImage.src,
        title: pendingImage.title
      });
      setPendingImage(null);
    }
  };

  const handlePointerMove = (event: KonvaEventObject<PointerEvent>): void => {
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
  };

  const handlePointerUp = (): void => {
    isDrawing.current = false;
    activeElementId.current = null;
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const title = file.name;
    const dataUrl = await readFileAsDataURL(file);
    const { width, height } = await getImageDimensions(dataUrl);
    const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(width, height));

    setPendingImage({
      src: dataUrl,
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      title
    });

    setTool('image');
    event.target.value = '';
  };

  const handlePendingImageTitleChange = (title: string): void => {
    setPendingImage((prev) => (prev ? { ...prev, title } : prev));
  };

  const handlePanelPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
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
  };

  const handlePanelPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragPanelRef.current) return;
    event.preventDefault();
    const nextPosition = clampPanelPosition(event.clientX - dragPanelRef.current.offsetX, event.clientY - dragPanelRef.current.offsetY);
    setPanelPosition(nextPosition);
  };

  const handlePanelPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragPanelRef.current || dragPanelRef.current.pointerId !== event.pointerId) {
      return;
    }
    dragPanelRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleElementDragEnd = (id: string, position: { x: number; y: number }): void => {
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
  };

  const memoizedElements = useMemo(() => elements, [elements]);

  return (
    <div className="canvas-app">
      <header className="canvas-app__nav">
        <div className="canvas-app__brand">Post Your Ad – Creator</div>
        <p className="canvas-app__hint">{tool === 'image' && pendingImage ? 'Click the board to drop your asset.' : 'Pick a mode to begin sketching.'}</p>
      </header>
      <div className="canvas-app__stage-wrapper">
        <Stage
          width={canvasSize.width}
          height={canvasSize.height}
          className="canvas-app__stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <Layer>
            {memoizedElements.map((element) => {
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
                    onDragEnd={(event) => handleElementDragEnd(element.id, { x: event.target.x(), y: event.target.y() })}
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
                    onDragEnd={(event) => handleElementDragEnd(element.id, { x: event.target.x(), y: event.target.y() })}
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
                    onDragEnd={(event) => handleElementDragEnd(element.id, { x: event.target.x(), y: event.target.y() })}
                  />
                );
              }

              if (element.type === 'image') {
                return <CanvasImage key={element.id} image={element} onDragEnd={handleElementDragEnd} />;
              }

              return null;
            })}
          </Layer>
        </Stage>
        <ToolPanel
          position={panelPosition}
          tool={tool}
          onToolChange={setTool}
          strokeColor={strokeColor}
          onStrokeColorChange={setStrokeColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          textValue={textValue}
          onTextValueChange={setTextValue}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onFileChange={handleFileChange}
          pendingImageTitle={pendingImage?.title ?? null}
          onPendingImageTitleChange={handlePendingImageTitleChange}
          onPointerDown={handlePanelPointerDown}
          onPointerMove={handlePanelPointerMove}
          onPointerUp={handlePanelPointerUp}
        />
      </div>
    </div>
  );
}

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getImageDimensions = (src: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = reject;
    image.src = src;
  });

const CanvasImage = ({ image, onDragEnd }: { image: ImageElement; onDragEnd: (id: string, position: { x: number; y: number }) => void }): JSX.Element => {
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
};

type ToolPanelProps = {
  position: { x: number; y: number };
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  textValue: string;
  onTextValueChange: (text: string) => void;
  fontSize: number;
  onFontSizeChange: (value: number) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  pendingImageTitle: string | null;
  onPendingImageTitleChange: (value: string) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

const ToolPanel = ({
  position,
  tool,
  onToolChange,
  strokeColor,
  onStrokeColorChange,
  strokeWidth,
  onStrokeWidthChange,
  textValue,
  onTextValueChange,
  fontSize,
  onFontSizeChange,
  onFileChange,
  pendingImageTitle,
  onPendingImageTitleChange,
  onPointerDown,
  onPointerMove,
  onPointerUp
}: ToolPanelProps): JSX.Element => {
  const toolOptions: Array<{ value: Tool; label: string; Icon: IconRenderer; helper: string }> = [
    { value: 'pen', label: 'Pen', Icon: PencilSimple, helper: 'Freehand' },
    { value: 'rect', label: 'Box', Icon: Square, helper: 'Rectangle' },
    { value: 'text', label: 'Text', Icon: TextT, helper: 'Copy' },
    { value: 'image', label: 'Image', Icon: ImageSquare, helper: 'Upload' }
  ];
  const strokeWidthOptions = [1, 2, 4, 6, 8, 12, 16, 24, 32];
  const fontSizeOptions = [16, 20, 24, 28, 32, 40, 48, 60, 72];

  return (
    <div
      className="tool-panel"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: PANEL_WIDTH, height: PANEL_HEIGHT }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="tool-panel__drag-handle" data-panel-handle="true" title="Drag toolbar">
        ⋮⋮
      </div>
      <div className="tool-panel__tools">
        {toolOptions.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`tool-panel__icon-button ${tool === item.value ? 'tool-panel__icon-button--active' : ''}`}
            onClick={() => onToolChange(item.value)}
            title={item.helper}
          >
            <item.Icon size={20} weight="bold" aria-hidden="true" />
            <span className="tool-panel__sr-only">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="tool-panel__divider" />
      <div className="tool-panel__controls">
        <label className="tool-panel__inline-field" title="Stroke color">
          <span>Line</span>
          <input type="color" value={strokeColor} onChange={(event) => onStrokeColorChange(event.target.value)} />
        </label>
        <label className="tool-panel__inline-field" title="Stroke width">
          <span>Width</span>
          <select value={strokeWidth} onChange={(event) => onStrokeWidthChange(Number(event.target.value))}>
            {strokeWidthOptions.map((value) => (
              <option key={value} value={value}>
                {value}px
              </option>
            ))}
          </select>
        </label>
        <label className="tool-panel__inline-field tool-panel__inline-field--text">
          <span>Text</span>
          <input type="text" value={textValue} onChange={(event) => onTextValueChange(event.target.value)} placeholder="Caption" />
        </label>
        <label className="tool-panel__inline-field" title="Font size">
          <span>Size</span>
          <select value={fontSize} onChange={(event) => onFontSizeChange(Number(event.target.value))}>
            {fontSizeOptions.map((value) => (
              <option key={value} value={value}>
                {value}px
              </option>
            ))}
          </select>
        </label>
        <label className="tool-panel__icon-button tool-panel__icon-button--upload" title="Upload image">
          <UploadSimple size={20} weight="bold" aria-hidden="true" />
          <span className="tool-panel__sr-only">{pendingImageTitle ? 'Replace image' : 'Upload image'}</span>
          <input type="file" accept="image/*" onChange={onFileChange} />
        </label>
        {pendingImageTitle ? (
          <label className="tool-panel__inline-field tool-panel__inline-field--text" title="Image title">
            <span>Title</span>
            <input type="text" value={pendingImageTitle} onChange={(event) => onPendingImageTitleChange(event.target.value)} />
          </label>
        ) : null}
      </div>
    </div>
  );
};
