import { PencilSimple, Square, TextT, ImageSquare, UploadSimple } from 'phosphor-react';
import type { ChangeEventHandler, PointerEvent as ReactPointerEvent } from 'react';
import type { Tool, IconRenderer } from '../types';

const strokeWidthOptions = [1, 2, 4, 6, 8, 12, 16, 24, 32];
const fontSizeOptions = [16, 20, 24, 28, 32, 40, 48, 60, 72];

export type ToolbarProps = {
  position: { x: number; y: number };
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  textValue: string;
  onTextValueChange: (value: string) => void;
  fontSize: number;
  onFontSizeChange: (value: number) => void;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
  pendingImageTitle: string | null;
  onPendingImageTitleChange: (value: string) => void;
  dimensions: { width: number; height: number };
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

const toolOptions: Array<{ value: Tool; label: string; Icon: IconRenderer; helper: string }> = [
  { value: 'pen', label: 'Pen', Icon: PencilSimple, helper: 'Freehand' },
  { value: 'rect', label: 'Box', Icon: Square, helper: 'Rectangle' },
  { value: 'text', label: 'Text', Icon: TextT, helper: 'Copy' },
  { value: 'image', label: 'Image', Icon: ImageSquare, helper: 'Upload' }
];

export function Toolbar({
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
  dimensions,
  onPointerDown,
  onPointerMove,
  onPointerUp
}: ToolbarProps): JSX.Element {
  return (
    <div
      className="tool-panel"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: dimensions.width, height: dimensions.height }}
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
}
