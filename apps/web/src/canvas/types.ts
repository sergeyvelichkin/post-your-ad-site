import type { IconProps } from 'phosphor-react';

export type Tool = 'hand' | 'pen' | 'rect' | 'text' | 'image';

export type PenElement = {
  id: string;
  type: 'pen';
  color: string;
  strokeWidth: number;
  points: number[];
  offsetX: number;
  offsetY: number;
};

export type RectElement = {
  id: string;
  type: 'rect';
  color: string;
  strokeWidth: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextElement = {
  id: string;
  type: 'text';
  color: string;
  fontSize: number;
  x: number;
  y: number;
  text: string;
};

export type ImageElement = {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  title: string;
};

export type CanvasElement = PenElement | RectElement | TextElement | ImageElement;

export type PendingImage = {
  src: string;
  width: number;
  height: number;
  title: string;
};

export type CanvasSize = {
  width: number;
  height: number;
};

export type IconRenderer = (props: IconProps) => JSX.Element;

export const NAV_HEIGHT = 72;
export const PANEL_WIDTH = 720;
export const PANEL_HEIGHT = 60;
export const MAX_IMAGE_SIZE = 220;
