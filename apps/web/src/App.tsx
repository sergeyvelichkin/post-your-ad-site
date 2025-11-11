import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from 'react';
import { CanvasStage } from './canvas/components/CanvasStage';
import { Toolbar } from './canvas/components/Toolbar';
import { useCanvasBoard } from './canvas/hooks/useCanvasBoard';
import { getImageDimensions, readFileAsDataURL } from './canvas/utils/image';
import type { CanvasSize, PendingImage, Tool } from './canvas/types';
import { MAX_IMAGE_SIZE, NAV_HEIGHT, PANEL_HEIGHT, PANEL_WIDTH } from './canvas/types';

const initialCanvasSize = (): CanvasSize => ({
  width: window.innerWidth,
  height: Math.max(200, window.innerHeight - NAV_HEIGHT)
});

const initialPanelPosition = (): { x: number; y: number } => ({
  x: window.innerWidth / 2 - PANEL_WIDTH / 2,
  y: window.innerHeight - PANEL_HEIGHT - 24
});

export default function App(): JSX.Element {
  const [tool, setTool] = useState<Tool>('pen');
  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [textValue, setTextValue] = useState('New message');
  const [fontSize, setFontSize] = useState(24);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(() => initialCanvasSize());
  const [panelPosition, setPanelPosition] = useState(() => initialPanelPosition());
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

  const handleImagePlaced = useCallback(() => {
    setPendingImage(null);
  }, []);

  const { elements, handlePointerDown, handlePointerMove, handlePointerUp, handleElementDragEnd } = useCanvasBoard({
    tool,
    strokeColor,
    strokeWidth,
    fontSize,
    textValue,
    pendingImage,
    onImagePlaced: handleImagePlaced
  });

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

      setPendingImage({
        src: dataUrl,
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        title
      });

      setTool('image');
      event.target.value = '';
    },
    []
  );

  const handlePendingImageTitleChange = useCallback((title: string) => {
    setPendingImage((prev) => (prev ? { ...prev, title } : prev));
  }, []);

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

  return (
    <div className="canvas-app">
      <header className="canvas-app__nav">
        <div className="canvas-app__brand">Post Your Ad – Creator</div>
        <p className="canvas-app__hint">{tool === 'image' && pendingImage ? 'Click the board to drop your asset.' : 'Pick a mode to begin sketching.'}</p>
      </header>
      <div className="canvas-app__stage-wrapper">
        <CanvasStage
          size={canvasSize}
          elements={elements}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onElementDragEnd={handleElementDragEnd}
        />
        <Toolbar
          position={panelPosition}
          dimensions={{ width: PANEL_WIDTH, height: PANEL_HEIGHT }}
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
