import { useRef, useState, useCallback, useEffect } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useBoardStore } from '../../store/boardStore';
import { Shape, AnchorSide, ArrowShape, PathShape, ToolMode } from '../../types';
import { generateId } from '../../utils/id';
import { findNearestAnchor } from '../../utils/connectorHelpers';
import { getSocket } from '../../socket/socket';
import { usePanZoom } from '../../hooks/usePanZoom';
import { CANVAS_W, CANVAS_H } from '../../utils/constants';
import GridLayer from './GridLayer';
import ShapeLayer from './ShapeLayer';
import SelectionLayer from './SelectionLayer';
import CursorLayer from './CursorLayer';
import ContextMenu from '../ContextMenu';
import TextEditor from '../TextEditor';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
  emitCursorMove: (x: number, y: number) => void;
}

interface DrawState {
  isDrawing: boolean;
  shapeId: string;
  startX: number; // world coord
  startY: number; // world coord
}

interface RubberBand {
  x: number; y: number; width: number; height: number;
}

interface TextEditorState {
  shapeId: string;
  x: number; y: number; width: number; height: number;
  text: string; fontSize: number; fontFamily: string;
}

export default function Canvas({ stageRef, emitCursorMove }: Props) {
  const store = useBoardStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const drawState = useRef<DrawState | null>(null);
  const [rubberBand, setRubberBand] = useState<RubberBand | null>(null);
  const isSpaceDown = useRef(false);
  const isRubberBanding = useRef(false);
  const rubberBandStart = useRef({ x: 0, y: 0 });

  // Arrow anchor highlight
  const arrowAnchorHighlight = useRef<{ shapeId: string; anchor: AnchorSide } | null>(null);
  const [anchorHighlight, setAnchorHighlight] = useState<{ shapeId: string; anchor: AnchorSide } | null>(null);

  // Context menu & text editor
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeId: string } | null>(null);
  const [textEditor, setTextEditor] = useState<TextEditorState | null>(null);

  const { handleWheel, startPan, doPan, endPan, isPanning } = usePanZoom(stageRef);

  // ── Resize observer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    // Initial size
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ── Set initial transform: center on canvas at 1:1 scale ────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || size.width < 10) return;
    const scale = 1.0;
    const x = (size.width - CANVAS_W * scale) / 2;
    const y = (size.height - CANVAS_H * scale) / 2;
    stage.scale({ x: scale, y: scale });
    stage.position({ x, y });
    store.setStageTransform({ x, y, scale });
  // Run only once after first real size is measured by ResizeObserver
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width > 0 && size.height > 0 ? 'ready' : 'waiting']);

  // ── Space key for pan ────────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping()) { isSpaceDown.current = true; e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') isSpaceDown.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Global keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping()) return;

      // Tool shortcuts (no modifier)
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        const toolMap: Record<string, ToolMode> = {
          v: 'select', r: 'rect', e: 'circle', l: 'line', a: 'arrow', p: 'path', t: 'text',
        };
        const mode = toolMap[e.key.toLowerCase()];
        if (mode) { store.setToolMode(mode); return; }
      }

      // Delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedShapeIds.length > 0) {
        e.preventDefault();
        const toDelete = [...store.selectedShapeIds];
        const snapshots = toDelete.map((id) => store.shapes[id]).filter(Boolean);
        for (const id of toDelete) store.deleteShape(id);
        store.setSelection([]);
        store.pushUndo({
          type: 'batch',
          backward: () => snapshots.forEach((s) => store.addShape(s)),
          forward: () => toDelete.forEach((id) => store.deleteShape(id)),
        });
        return;
      }

      if (e.key === 'Escape') {
        store.setSelection([]);
        setContextMenu(null);
        return;
      }

      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        store.setSelection(Object.keys(store.shapes));
        return;
      }

      // Copy
      if (e.ctrlKey && e.key === 'c') {
        if (store.selectedShapeIds.length > 0) {
          (window as any).__wbClipboard = store.selectedShapeIds
            .map((id) => store.shapes[id])
            .filter(Boolean);
        }
        return;
      }

      // Paste
      if (e.ctrlKey && e.key === 'v') {
        const clipboard: Shape[] = (window as any).__wbClipboard ?? [];
        if (clipboard.length > 0) {
          const newIds: string[] = [];
          const newShapes: Shape[] = [];
          for (const shape of clipboard) {
            const ns = { ...shape, id: generateId(), x: shape.x + 10, y: shape.y + 10 };
            store.addShape(ns, true);
            newIds.push(ns.id);
            newShapes.push(ns);
          }
          store.setSelection(newIds);
          store.pushUndo({
            type: 'batch',
            backward: () => newIds.forEach((id) => store.deleteShape(id)),
            forward: () => newShapes.forEach((s) => store.addShape(s)),
          });
        }
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);

  function isTyping() {
    const el = document.activeElement;
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
  }

  function getStagePoint(stage: Konva.Stage) {
    const pos = stage.getPointerPosition()!;
    const scale = stage.scaleX();
    return {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale,
    };
  }

  // ── mouseDown ────────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      if (e.evt.button === 1 || isSpaceDown.current) { startPan(e); return; }
      if (e.evt.button === 2) return;

      setContextMenu(null);

      // Use fresh state to avoid stale closure
      const s = useBoardStore.getState();
      const { toolMode, defaultFill, defaultStroke, defaultStrokeWidth, shapes } = s;

      const pt = getStagePoint(stage);

      // Reject draw/interaction outside canvas bounds
      if (toolMode !== 'select' && (pt.x < 0 || pt.x > CANVAS_W || pt.y < 0 || pt.y > CANVAS_H)) return;

      if (toolMode === 'select') {
        if (e.target === stage) {
          store.setSelection([]);
          isRubberBanding.current = true;
          rubberBandStart.current = pt;
          setRubberBand({ x: pt.x, y: pt.y, width: 0, height: 0 });
        }
        return;
      }

      const id = generateId();
      const maxZ = Math.max(0, ...Object.values(shapes).map((s) => s.zIndex));
      const base = {
        id, fill: defaultFill, stroke: defaultStroke, strokeWidth: defaultStrokeWidth,
        rotation: 0, zIndex: maxZ + 1, opacity: 1,
      };

      let newShape: Shape | null = null;

      if (toolMode === 'rect') {
        newShape = { ...base, type: 'rect', x: pt.x, y: pt.y, width: 0, height: 0, cornerRadius: 0 };
      } else if (toolMode === 'circle') {
        newShape = { ...base, type: 'circle', x: pt.x, y: pt.y, radiusX: 0, radiusY: 0 };
      } else if (toolMode === 'line') {
        newShape = { ...base, type: 'line', x: pt.x, y: pt.y, points: [0, 0, 0, 0] };
      } else if (toolMode === 'arrow') {
        // Arrows always have x=0, y=0; points are absolute world coordinates
        newShape = {
          ...base, type: 'arrow',
          x: 0, y: 0,
          points: [pt.x, pt.y, pt.x, pt.y],
          pointerAtEnd: true, pointerAtStart: false,
        };
      } else if (toolMode === 'path') {
        newShape = {
          ...base, type: 'path',
          x: pt.x, y: pt.y,
          fill: 'transparent', points: [0, 0], tension: 0.4,
        };
      } else if (toolMode === 'text') {
        newShape = {
          ...base, type: 'text',
          x: pt.x, y: pt.y,
          width: 200, height: 50,
          text: 'Text', fontSize: 16, fontFamily: 'sans-serif', align: 'left',
          fill: defaultStroke, stroke: 'transparent', strokeWidth: 0,
        };
        store.addShape(newShape, true);
        store.pushUndo({
          type: 'add',
          backward: () => store.deleteShape(id),
          forward: () => store.addShape(newShape!),
        });
        // Stay in text mode so user can place more text
        store.setSelection([id]);
        return;
      }

      if (newShape) {
        drawState.current = { isDrawing: true, shapeId: id, startX: pt.x, startY: pt.y };
        // Add locally only — emit happens on mouseUp with the finalized shape
        store.addShape(newShape, false);
        // Path: emit add immediately so other clients start receiving streaming points
        if (toolMode === 'path') {
          const { boardId, userId } = s;
          getSocket().emit('board:shape_add', { boardId, shape: newShape, userId });
        }
      }
    },
    [stageRef, startPan, store]
  );

  // ── mouseMove ────────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      if (isPanning.current) { doPan(e); return; }

      const pt = getStagePoint(stage);
      emitCursorMove(pt.x, pt.y);

      // Rubber-band
      if (isRubberBanding.current) {
        setRubberBand({
          x: rubberBandStart.current.x,
          y: rubberBandStart.current.y,
          width: pt.x - rubberBandStart.current.x,
          height: pt.y - rubberBandStart.current.y,
        });
        return;
      }

      const ds = drawState.current;
      if (!ds?.isDrawing) return;

      const { toolMode } = useBoardStore.getState();
      // Clamp draw target to canvas bounds
      pt.x = Math.max(0, Math.min(CANVAS_W, pt.x));
      pt.y = Math.max(0, Math.min(CANVAS_H, pt.y));
      const dx = pt.x - ds.startX;
      const dy = pt.y - ds.startY;

      if (toolMode === 'rect') {
        store.updateShape(ds.shapeId, {
          x: dx < 0 ? pt.x : ds.startX,
          y: dy < 0 ? pt.y : ds.startY,
          width: Math.abs(dx),
          height: Math.abs(dy),
        } as any, false);
      } else if (toolMode === 'circle') {
        store.updateShape(ds.shapeId, { radiusX: Math.abs(dx) / 2, radiusY: Math.abs(dy) / 2 } as any, false);
      } else if (toolMode === 'line') {
        store.updateShape(ds.shapeId, { points: [0, 0, dx, dy] } as any, false);
      } else if (toolMode === 'arrow') {
        // Absolute coords: start stays fixed, end follows mouse
        store.updateShape(ds.shapeId, { points: [ds.startX, ds.startY, pt.x, pt.y] } as any, false);
        // Show anchor highlights
        const snapR = useBoardStore.getState().snapSettings.snapThreshold * 3;
        const hit = findNearestAnchor(pt.x, pt.y, useBoardStore.getState().shapes, ds.shapeId, snapR);
        arrowAnchorHighlight.current = hit;
        setAnchorHighlight(hit);
      } else if (toolMode === 'path') {
        store.appendPathPoint(ds.shapeId, dx, dy);
        const { boardId, userId } = useBoardStore.getState();
        getSocket().emit('board:path_point', { boardId, shapeId: ds.shapeId, x: dx, y: dy, userId });
      }
    },
    [stageRef, isPanning, doPan, emitCursorMove, store]
  );

  // ── mouseUp ──────────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;

      if (isPanning.current) { endPan(e); return; }

      // End rubber-band
      if (isRubberBanding.current) {
        isRubberBanding.current = false;
        const rb = rubberBand;
        if (rb) {
          const left = Math.min(rb.x, rb.x + rb.width);
          const right = Math.max(rb.x, rb.x + rb.width);
          const top = Math.min(rb.y, rb.y + rb.height);
          const bottom = Math.max(rb.y, rb.y + rb.height);
          const { shapes } = useBoardStore.getState();
          const selected = Object.values(shapes)
            .filter((s) => {
              if (s.type === 'rect') return s.x >= left && s.x + s.width <= right && s.y >= top && s.y + s.height <= bottom;
              if (s.type === 'circle') return s.x - s.radiusX >= left && s.x + s.radiusX <= right && s.y - s.radiusY >= top && s.y + s.radiusY <= bottom;
              return s.x >= left && s.x <= right && s.y >= top && s.y <= bottom;
            })
            .map((s) => s.id);
          store.setSelection(selected);
        }
        setRubberBand(null);
        return;
      }

      const ds = drawState.current;
      if (!ds?.isDrawing) return;
      drawState.current = null;

      const { toolMode, boardId, userId } = useBoardStore.getState();
      // Read shape from fresh state
      let shape = useBoardStore.getState().shapes[ds.shapeId];
      if (!shape) return;

      // Arrow: check anchor snapping
      if (toolMode === 'arrow' && shape.type === 'arrow') {
        const arrowShape = shape as ArrowShape;
        const snapR = useBoardStore.getState().snapSettings.snapThreshold * 3;
        const endPt = { x: arrowShape.points[2], y: arrowShape.points[3] };
        const startPtCoords = { x: arrowShape.points[0], y: arrowShape.points[1] };

        const endHit = findNearestAnchor(endPt.x, endPt.y, useBoardStore.getState().shapes, ds.shapeId, snapR);
        const startHit = findNearestAnchor(startPtCoords.x, startPtCoords.y, useBoardStore.getState().shapes, ds.shapeId, snapR);

        const anchorChanges: Partial<ArrowShape> = {};
        if (endHit) { anchorChanges.endShapeId = endHit.shapeId; anchorChanges.endAnchor = endHit.anchor; }
        if (startHit) { anchorChanges.startShapeId = startHit.shapeId; anchorChanges.startAnchor = startHit.anchor; }
        if (Object.keys(anchorChanges).length > 0) {
          store.updateShape(ds.shapeId, anchorChanges as any, false);
        }

        arrowAnchorHighlight.current = null;
        setAnchorHighlight(null);
        // Re-read after anchor update
        shape = useBoardStore.getState().shapes[ds.shapeId]!;
      }

      // Emit final shape
      if (toolMode !== 'path') {
        getSocket().emit('board:shape_add', { boardId, shape, userId });
      } else {
        getSocket().emit('board:shape_update', {
          boardId, shapeId: ds.shapeId,
          changes: { points: (shape as PathShape).points },
          userId,
        });
      }

      // Push undo (capture shape at this point in time)
      const finalShape = shape;
      store.pushUndo({
        type: 'add',
        backward: () => store.deleteShape(ds.shapeId),
        forward: () => store.addShape(finalShape),
      });

      // NOTE: do NOT reset tool mode — user keeps the current tool active
    },
    [stageRef, isPanning, endPan, rubberBand, store]
  );

  // ── Shape drag end ───────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      const { shapes } = useBoardStore.getState();
      const prev = shapes[id];
      if (!prev) return;

      if (prev.type === 'arrow') {
        // Arrow uses x=0,y=0; translate absolute points by drag delta
        const [x1, y1, x2, y2] = (prev as ArrowShape).points;
        const newPoints = [x1 + x, y1 + y, x2 + x, y2 + y];
        const changes = { x: 0, y: 0, points: newPoints } as any;
        // Reset node position before updating store
        const node = stageRef.current?.findOne(`#${id}`);
        if (node) { node.x(0); node.y(0); }
        store.updateShape(id, changes);
        store.pushUndo({
          type: 'update',
          backward: () => store.updateShape(id, { x: 0, y: 0, points: (prev as ArrowShape).points } as any),
          forward: () => store.updateShape(id, changes),
        });
        return;
      }

      const changes = { x, y };
      store.updateShape(id, changes);
      store.pushUndo({
        type: 'update',
        backward: () => store.updateShape(id, { x: prev.x, y: prev.y }),
        forward: () => store.updateShape(id, changes),
      });
    },
    [store, stageRef]
  );

  // ── Transform end ────────────────────────────────────────────────────────────
  const handleTransformEnd = useCallback(
    (id: string, changes: Record<string, unknown>) => {
      const { shapes } = useBoardStore.getState();
      const prev = shapes[id];
      store.updateShape(id, changes as any);
      if (prev) {
        const prevChanges: Record<string, unknown> = {};
        for (const k of Object.keys(changes)) prevChanges[k] = (prev as any)[k];
        store.pushUndo({
          type: 'update',
          backward: () => store.updateShape(id, prevChanges as any),
          forward: () => store.updateShape(id, changes as any),
        });
      }
    },
    [store]
  );

  // ── Context menu ─────────────────────────────────────────────────────────────
  const handleContextMenu = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, shapeId: string) => {
      e.evt.preventDefault();
      if (!store.selectedShapeIds.includes(shapeId)) store.setSelection([shapeId]);
      setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, shapeId });
    },
    [store]
  );

  const handleStageContextMenu = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.evt.preventDefault();
      if (e.target === stageRef.current) setContextMenu(null);
    },
    [stageRef]
  );

  // ── Text double-click ────────────────────────────────────────────────────────
  const handleDblClick = useCallback(
    (id: string, node: Konva.Text) => {
      const stage = stageRef.current;
      if (!stage) return;
      const { shapes } = useBoardStore.getState();
      const shape = shapes[id];
      if (!shape || shape.type !== 'text') return;

      const containerRect = stage.container().getBoundingClientRect();
      const scale = stage.scaleX();
      const absPos = node.getAbsolutePosition();

      setTextEditor({
        shapeId: id,
        x: containerRect.left + absPos.x,
        y: containerRect.top + absPos.y,
        width: shape.width * scale,
        height: Math.max(shape.height * scale, 50),
        text: shape.text,
        fontSize: shape.fontSize * scale,
        fontFamily: shape.fontFamily,
      });
    },
    [stageRef]
  );

  const handleTextCommit = useCallback(
    (id: string, text: string) => {
      const { shapes } = useBoardStore.getState();
      const prev = shapes[id];
      store.updateShape(id, { text } as any);
      if (prev && prev.type === 'text') {
        store.pushUndo({
          type: 'update',
          backward: () => store.updateShape(id, { text: (prev as any).text } as any),
          forward: () => store.updateShape(id, { text } as any),
        });
      }
      setTextEditor(null);
    },
    [store]
  );

  // ── Shape select ─────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (id: string, multi: boolean) => {
      if (useBoardStore.getState().toolMode !== 'select') return;
      if (multi) {
        const cur = useBoardStore.getState().selectedShapeIds;
        store.setSelection(
          cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]
        );
      } else {
        store.setSelection([id]);
      }
    },
    [store]
  );

  const getCursor = () => {
    if (isSpaceDown.current || isPanning.current) return 'grab';
    if (store.toolMode === 'select') return 'default';
    return 'crosshair';
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ background: '#13141a', cursor: getCursor() }}
    >
      <Stage
        ref={stageRef as React.RefObject<Konva.Stage>}
        width={size.width}
        height={size.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleStageContextMenu}
      >
        <GridLayer
          width={size.width}
          height={size.height}
          gridSize={store.snapSettings.gridSize}
          stageTransform={store.stageTransform}
          showGridLines={store.showGrid}
        />
        <ShapeLayer
          shapes={store.shapes}
          selectedIds={store.selectedShapeIds}
          toolMode={store.toolMode}
          arrowAnchorHighlight={anchorHighlight}
          onSelect={handleSelect}
          onDragEnd={handleDragEnd}
          onContextMenu={handleContextMenu}
          onDblClick={handleDblClick}
        />
        <SelectionLayer
          selectedIds={store.selectedShapeIds}
          stageRef={stageRef}
          rubberBand={rubberBand}
          onTransformEnd={handleTransformEnd}
        />
        <CursorLayer cursors={store.cursors} />
      </Stage>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedIds={store.selectedShapeIds}
          shapes={store.shapes}
          onClose={() => setContextMenu(null)}
        />
      )}

      {textEditor && (
        <TextEditor
          {...textEditor}
          onCommit={handleTextCommit}
          onClose={() => setTextEditor(null)}
        />
      )}
    </div>
  );
}
