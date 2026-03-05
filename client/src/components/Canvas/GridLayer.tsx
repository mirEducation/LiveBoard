import { Layer, Rect, Line } from 'react-konva';
import { StageTransform } from '../../types';
import { CANVAS_W, CANVAS_H } from '../../utils/constants';

interface Props {
  width: number;
  height: number;
  gridSize: number;
  stageTransform: StageTransform;
  showGridLines: boolean;
}

export default function GridLayer({ width, height, gridSize, stageTransform, showGridLines }: Props) {
  const { x: stageX, y: stageY, scale } = stageTransform;

  // Visible world area
  const startX = -stageX / scale;
  const startY = -stageY / scale;
  const endX = startX + width / scale;
  const endY = startY + height / scale;

  // Clip grid lines to canvas bounds
  const gx1 = Math.max(startX, 0);
  const gy1 = Math.max(startY, 0);
  const gx2 = Math.min(endX, CANVAS_W);
  const gy2 = Math.min(endY, CANVAS_H);

  const firstX = Math.floor(gx1 / gridSize) * gridSize;
  const firstY = Math.floor(gy1 / gridSize) * gridSize;

  const verticals: number[] = [];
  for (let x = firstX; x <= gx2; x += gridSize) {
    verticals.push(x);
  }

  const horizontals: number[] = [];
  for (let y = firstY; y <= gy2; y += gridSize) {
    horizontals.push(y);
  }

  const strokeW = 1 / scale;

  return (
    <Layer listening={false}>
      {/* Canvas background — white paper */}
      <Rect
        x={0}
        y={0}
        width={CANVAS_W}
        height={CANVAS_H}
        fill="white"
        shadowColor="rgba(0,0,0,0.65)"
        shadowBlur={24 / scale}
        shadowOffsetX={0}
        shadowOffsetY={4 / scale}
        listening={false}
      />

      {/* Grid lines inside canvas — only when enabled */}
      {showGridLines && verticals.map((x) => (
        <Line
          key={`v${x}`}
          points={[x, gy1, x, gy2]}
          stroke="#e5e7eb"
          strokeWidth={strokeW}
          listening={false}
        />
      ))}
      {showGridLines && horizontals.map((y) => (
        <Line
          key={`h${y}`}
          points={[gx1, y, gx2, y]}
          stroke="#e5e7eb"
          strokeWidth={strokeW}
          listening={false}
        />
      ))}

      {/* Canvas border */}
      <Rect
        x={0}
        y={0}
        width={CANVAS_W}
        height={CANVAS_H}
        fill="transparent"
        stroke="#d1d5db"
        strokeWidth={strokeW * 2}
        listening={false}
      />
    </Layer>
  );
}
