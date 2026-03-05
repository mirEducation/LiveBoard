import { useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { useBoardStore } from '../store/boardStore';
import { CANVAS_W, CANVAS_H } from '../utils/constants';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
}

// Minimap dimensions — match 16:9 canvas aspect ratio
const MAP_W = 160;
const MAP_H = Math.round(MAP_W * CANVAS_H / CANVAS_W); // 90px for 16:9

// Fixed canvas bounds as the minimap reference frame
const BBOX = { minX: 0, minY: 0, maxX: CANVAS_W, maxY: CANVAS_H };
// Fixed scale: canvas world → minimap pixels
const MAP_SCALE_X = MAP_W / CANVAS_W;
const MAP_SCALE_Y = MAP_H / CANVAS_H;

export default function Minimap({ stageRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapes = useBoardStore((s) => s.shapes);
  const stageTransform = useBoardStore((s) => s.stageTransform);
  const isDragging = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, MAP_W, MAP_H);

    // Minimap background (dark)
    ctx.fillStyle = '#1a1c23';
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    // Canvas area (white paper)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    const shapeArr = Object.values(shapes);

    const toMap = (wx: number, wy: number) => ({
      x: (wx - BBOX.minX) * MAP_SCALE_X,
      y: (wy - BBOX.minY) * MAP_SCALE_Y,
    });

    // Draw shapes
    for (const shape of shapeArr) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = shape.fill === 'transparent' ? 'transparent' : shape.fill;
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = 0.5;

      if (shape.type === 'rect') {
        const { x, y } = toMap(shape.x, shape.y);
        const w = shape.width * MAP_SCALE_X;
        const h = shape.height * MAP_SCALE_Y;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      } else if (shape.type === 'circle') {
        const { x, y } = toMap(shape.x, shape.y);
        ctx.beginPath();
        ctx.ellipse(x, y, shape.radiusX * MAP_SCALE_X, shape.radiusY * MAP_SCALE_Y, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (shape.type === 'text') {
        const { x, y } = toMap(shape.x, shape.y);
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(x, y, shape.width * MAP_SCALE_X, Math.max(2, shape.height * MAP_SCALE_Y));
      }
    }

    ctx.globalAlpha = 1;

    // Draw viewport rect (world coords → minimap coords)
    const stageW = stage.width();
    const stageH = stage.height();
    const { x: stX, y: stY, scale } = stageTransform;

    const vpX = -stX / scale;
    const vpY = -stY / scale;
    const vpW = stageW / scale;
    const vpH = stageH / scale;

    const vp = toMap(vpX, vpY);
    const vpMapW = vpW * MAP_SCALE_X;
    const vpMapH = vpH * MAP_SCALE_Y;

    ctx.strokeStyle = '#c8e234';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(vp.x, vp.y, vpMapW, vpMapH);
    ctx.fillStyle = 'rgba(200, 226, 52, 0.08)';
    ctx.fillRect(vp.x, vp.y, vpMapW, vpMapH);
  }, [shapes, stageTransform, stageRef]);

  useEffect(() => {
    draw();
  }, [draw]);

  const mapToWorld = useCallback((mx: number, my: number) => {
    return {
      wx: mx / MAP_SCALE_X + BBOX.minX,
      wy: my / MAP_SCALE_Y + BBOX.minY,
    };
  }, []);

  const panToMapPoint = useCallback((mx: number, my: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const { wx, wy } = mapToWorld(mx, my);
    const scale = stage.scaleX();
    const newX = -wx * scale + stage.width() / 2;
    const newY = -wy * scale + stage.height() / 2;
    stage.position({ x: newX, y: newY });
    stage.batchDraw();
    useBoardStore.getState().setStageTransform({ x: newX, y: newY, scale });
  }, [stageRef, mapToWorld]);

  const getMapCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { mx: e.clientX - rect.left, my: e.clientY - rect.top };
  };

  return (
    <div style={{
      position: 'absolute', bottom: 16, right: 16, zIndex: 20,
      borderRadius: 6, overflow: 'hidden',
      border: '1px solid var(--border-mid)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <canvas
        ref={canvasRef}
        width={MAP_W}
        height={MAP_H}
        style={{ display: 'block', cursor: 'crosshair' }}
        onMouseDown={(e) => { isDragging.current = true; const { mx, my } = getMapCoords(e); panToMapPoint(mx, my); }}
        onMouseMove={(e) => { if (isDragging.current) { const { mx, my } = getMapCoords(e); panToMapPoint(mx, my); } }}
        onMouseUp={() => { isDragging.current = false; }}
        onMouseLeave={() => { isDragging.current = false; }}
      />
    </div>
  );
}
