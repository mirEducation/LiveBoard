import { useRef, useCallback } from 'react';
import Konva from 'konva';
import { useBoardStore } from '../store/boardStore';
import { CANVAS_W, CANVAS_H } from '../utils/constants';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_FACTOR = 1.1;
// How many px of grey can show past each canvas edge
const EDGE_MARGIN = 50;

function clampPos(x: number, y: number, scale: number, vw: number, vh: number) {
  const cw = CANVAS_W * scale;
  const ch = CANVAS_H * scale;
  // When canvas is larger than viewport: allow EDGE_MARGIN px of grey on each side
  // When canvas is smaller: allow it to float with EDGE_MARGIN slack
  const newX = cw >= vw
    ? Math.max(vw - EDGE_MARGIN - cw, Math.min(EDGE_MARGIN, x))
    : Math.max(-EDGE_MARGIN, Math.min(vw - cw + EDGE_MARGIN, x));
  const newY = ch >= vh
    ? Math.max(vh - EDGE_MARGIN - ch, Math.min(EDGE_MARGIN, y))
    : Math.max(-EDGE_MARGIN, Math.min(vh - ch + EDGE_MARGIN, y));
  return { x: newX, y: newY };
}

export function usePanZoom(stageRef: React.RefObject<Konva.Stage | null>) {
  const setStageTransform = useBoardStore((s) => s.setStageTransform);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const applyTransform = useCallback(
    (stage: Konva.Stage, x: number, y: number, scale: number) => {
      const vw = stage.width();
      const vh = stage.height();
      const clamped = clampPos(x, y, scale, vw, vh);
      stage.scale({ x: scale, y: scale });
      stage.position(clamped);
      stage.batchDraw();
      setStageTransform({ x: clamped.x, y: clamped.y, scale });
    },
    [setStageTransform]
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition()!;

      // Trackpad two-finger pan (small delta, no ctrl)
      if (!e.evt.ctrlKey && Math.abs(e.evt.deltaX) + Math.abs(e.evt.deltaY) < 60) {
        const newX = stage.x() - e.evt.deltaX;
        const newY = stage.y() - e.evt.deltaY;
        applyTransform(stage, newX, newY, oldScale);
        return;
      }

      // Zoom
      const scaleBy = e.evt.ctrlKey
        ? 1 + Math.min(Math.abs(e.evt.deltaY) * 0.01, 0.3)
        : ZOOM_FACTOR;
      const direction = e.evt.deltaY < 0 ? 1 : -1;

      let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newX = pointer.x - mousePointTo.x * newScale;
      const newY = pointer.y - mousePointTo.y * newScale;

      applyTransform(stage, newX, newY, newScale);
    },
    [stageRef, applyTransform]
  );

  const startPan = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      isPanning.current = true;
      const pos = stage.getPointerPosition()!;
      lastPos.current = { x: pos.x, y: pos.y };
      stage.container().style.cursor = 'grabbing';
    },
    [stageRef]
  );

  const doPan = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanning.current) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition()!;
      const dx = pos.x - lastPos.current.x;
      const dy = pos.y - lastPos.current.y;
      lastPos.current = { x: pos.x, y: pos.y };
      applyTransform(stage, stage.x() + dx, stage.y() + dy, stage.scaleX());
    },
    [stageRef, applyTransform]
  );

  const endPan = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPanning.current) return;
      isPanning.current = false;
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = '';
    },
    [stageRef]
  );

  return { handleWheel, startPan, doPan, endPan, isPanning };
}
