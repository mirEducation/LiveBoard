import { Shape, SnapSettings } from '../types';

interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
}

// Get the bounding box corners/edges/center of a shape
function getSnapPoints(shape: Shape): Array<{ x: number; y: number }> {
  if (shape.type === 'rect') {
    const { x, y, width, height } = shape;
    return [
      { x, y },
      { x: x + width, y },
      { x, y: y + height },
      { x: x + width, y: y + height },
      { x: x + width / 2, y },
      { x: x + width / 2, y: y + height },
      { x, y: y + height / 2 },
      { x: x + width, y: y + height / 2 },
      { x: x + width / 2, y: y + height / 2 },
    ];
  }
  if (shape.type === 'circle') {
    const { x, y, radiusX, radiusY } = shape;
    return [
      { x: x - radiusX, y: y - radiusY },
      { x: x + radiusX, y: y - radiusY },
      { x: x - radiusX, y: y + radiusY },
      { x: x + radiusX, y: y + radiusY },
      { x, y },
    ];
  }
  return [{ x: shape.x, y: shape.y }];
}

export function snapPosition(
  px: number,
  py: number,
  shapes: Record<string, Shape>,
  draggedId: string,
  settings: SnapSettings
): SnapResult {
  const { enabled, gridSize, snapThreshold } = settings;

  if (!enabled) {
    return { x: px, y: py, snappedX: false, snappedY: false };
  }

  let bestX = px;
  let bestY = py;
  let dxMin = snapThreshold + 1;
  let dyMin = snapThreshold + 1;

  // Snap to other shapes
  for (const [id, shape] of Object.entries(shapes)) {
    if (id === draggedId) continue;
    const pts = getSnapPoints(shape);
    for (const pt of pts) {
      const dx = Math.abs(px - pt.x);
      const dy = Math.abs(py - pt.y);
      if (dx < dxMin) { dxMin = dx; bestX = pt.x; }
      if (dy < dyMin) { dyMin = dy; bestY = pt.y; }
    }
  }

  // Snap to grid (lower priority — only if still outside threshold of shapes)
  if (dxMin > snapThreshold) {
    const gridX = Math.round(px / gridSize) * gridSize;
    if (Math.abs(px - gridX) < snapThreshold) {
      bestX = gridX;
      dxMin = Math.abs(px - gridX);
    }
  }
  if (dyMin > snapThreshold) {
    const gridY = Math.round(py / gridSize) * gridSize;
    if (Math.abs(py - gridY) < snapThreshold) {
      bestY = gridY;
      dyMin = Math.abs(py - gridY);
    }
  }

  return {
    x: dxMin <= snapThreshold ? bestX : px,
    y: dyMin <= snapThreshold ? bestY : py,
    snappedX: dxMin <= snapThreshold,
    snappedY: dyMin <= snapThreshold,
  };
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
