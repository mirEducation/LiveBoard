export type ShapeType = 'rect' | 'circle' | 'line' | 'arrow' | 'path' | 'text';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
  zIndex: number;
  opacity: number;
}

export interface RectShape extends BaseShape {
  type: 'rect';
  width: number;
  height: number;
  cornerRadius: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  radiusX: number;
  radiusY: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: number[];
}

export interface PathShape extends BaseShape {
  type: 'path';
  points: number[];
  tension: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
}

export type AnchorSide = 'n' | 's' | 'e' | 'w';

export interface ArrowShape extends BaseShape {
  type: 'arrow';
  points: number[];
  startShapeId?: string;
  startAnchor?: AnchorSide;
  endShapeId?: string;
  endAnchor?: AnchorSide;
  pointerAtEnd: boolean;
  pointerAtStart: boolean;
}

export type Shape = RectShape | CircleShape | LineShape | PathShape | ArrowShape | TextShape;

export interface BoardState {
  id: string;
  title: string;
  shapes: Record<string, Shape>;
  users: Map<string, { userId: string; userName: string; color: string; socketId: string }>;
}
