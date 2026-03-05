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

export interface Cursor {
  userId: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

export type ToolMode = 'select' | 'rect' | 'circle' | 'line' | 'arrow' | 'path' | 'text';

export interface SnapSettings {
  enabled: boolean;
  gridSize: number;
  snapThreshold: number;
}

export interface StageTransform {
  x: number;
  y: number;
  scale: number;
}

export interface UndoEntry {
  type: 'add' | 'update' | 'delete' | 'batch';
  forward: () => void;
  backward: () => void;
}

export interface UserInfo {
  userId: string;
  userName: string;
  color: string;
}

// Socket event payloads
export interface SnapshotPayload {
  boardId: string;
  title: string;
  shapes: Record<string, Shape>;
  users: UserInfo[];
}

export interface ShapeAddedPayload {
  boardId: string;
  shape: Shape;
  userId: string;
}

export interface ShapeUpdatedPayload {
  boardId: string;
  shapeId: string;
  changes: Partial<Shape>;
  userId: string;
}

export interface ShapeDeletedPayload {
  boardId: string;
  shapeId: string;
  userId: string;
}

export interface CursorMovedPayload {
  boardId: string;
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
}

export interface PathPointedPayload {
  boardId: string;
  shapeId: string;
  x: number;
  y: number;
  userId: string;
}

export interface UserJoinedPayload {
  userId: string;
  userName: string;
  color: string;
}

export interface TitleUpdatedPayload {
  title: string;
  userId: string;
}
