import { Shape, ArrowShape, AnchorSide } from '../types';

export interface Point {
  x: number;
  y: number;
}

export function getAnchorPoint(shape: Shape, anchor: AnchorSide): Point {
  if (shape.type === 'rect') {
    const { x, y, width, height } = shape;
    switch (anchor) {
      case 'n': return { x: x + width / 2, y };
      case 's': return { x: x + width / 2, y: y + height };
      case 'e': return { x: x + width, y: y + height / 2 };
      case 'w': return { x, y: y + height / 2 };
    }
  }
  if (shape.type === 'circle') {
    const { x, y, radiusX, radiusY } = shape;
    switch (anchor) {
      case 'n': return { x, y: y - radiusY };
      case 's': return { x, y: y + radiusY };
      case 'e': return { x: x + radiusX, y };
      case 'w': return { x: x - radiusX, y };
    }
  }
  if (shape.type === 'text') {
    const { x, y, width, height } = shape;
    switch (anchor) {
      case 'n': return { x: x + width / 2, y };
      case 's': return { x: x + width / 2, y: y + height };
      case 'e': return { x: x + width, y: y + height / 2 };
      case 'w': return { x, y: y + height / 2 };
    }
  }
  // Fallback: treat x,y as top-left of a 1×1 point
  return { x: shape.x, y: shape.y };
}

export function computeArrowPoints(
  arrow: ArrowShape,
  shapes: Record<string, Shape>
): number[] {
  const start: Point = arrow.startShapeId && arrow.startAnchor && shapes[arrow.startShapeId]
    ? getAnchorPoint(shapes[arrow.startShapeId], arrow.startAnchor)
    : { x: arrow.points[0], y: arrow.points[1] };

  const end: Point = arrow.endShapeId && arrow.endAnchor && shapes[arrow.endShapeId]
    ? getAnchorPoint(shapes[arrow.endShapeId], arrow.endAnchor)
    : { x: arrow.points[2] ?? arrow.points[0], y: arrow.points[3] ?? arrow.points[1] };

  return [start.x, start.y, end.x, end.y];
}

export function findNearestAnchor(
  px: number,
  py: number,
  shapes: Record<string, Shape>,
  excludeId: string | null,
  threshold: number
): { shapeId: string; anchor: AnchorSide; point: Point } | null {
  const anchors: AnchorSide[] = ['n', 's', 'e', 'w'];
  let best: { shapeId: string; anchor: AnchorSide; point: Point; dist: number } | null = null;

  for (const [id, shape] of Object.entries(shapes)) {
    if (id === excludeId) continue;
    if (shape.type === 'arrow' || shape.type === 'line' || shape.type === 'path') continue;

    for (const anchor of anchors) {
      const pt = getAnchorPoint(shape, anchor);
      const dist = Math.hypot(px - pt.x, py - pt.y);
      if (dist < threshold && (!best || dist < best.dist)) {
        best = { shapeId: id, anchor, point: pt, dist };
      }
    }
  }

  return best ? { shapeId: best.shapeId, anchor: best.anchor, point: best.point } : null;
}
