import { useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import ColorPicker from './ColorPicker';

export default function StylePanel() {
  const [open, setOpen] = useState(false);
  const store = useBoardStore();
  const { defaultFill, defaultStroke, defaultStrokeWidth, selectedShapeIds, shapes } = store;

  const setFill = (color: string) => {
    store.setDefaultStyle({ fill: color });
    // Apply to selected shapes
    for (const id of selectedShapeIds) {
      const prev = shapes[id];
      store.updateShape(id, { fill: color });
      if (prev) {
        store.pushUndo({
          type: 'update',
          backward: () => store.updateShape(id, { fill: prev.fill }),
          forward: () => store.updateShape(id, { fill: color }),
        });
      }
    }
  };

  const setStroke = (color: string) => {
    store.setDefaultStyle({ stroke: color });
    for (const id of selectedShapeIds) {
      const prev = shapes[id];
      store.updateShape(id, { stroke: color });
      if (prev) {
        store.pushUndo({
          type: 'update',
          backward: () => store.updateShape(id, { stroke: prev.stroke }),
          forward: () => store.updateShape(id, { stroke: color }),
        });
      }
    }
  };

  const setStrokeWidth = (w: number) => {
    store.setDefaultStyle({ strokeWidth: w });
    for (const id of selectedShapeIds) {
      const prev = shapes[id];
      store.updateShape(id, { strokeWidth: w });
      if (prev) {
        store.pushUndo({
          type: 'update',
          backward: () => store.updateShape(id, { strokeWidth: prev.strokeWidth }),
          forward: () => store.updateShape(id, { strokeWidth: w }),
        });
      }
    }
  };

  return (
    <div className="relative">
      <button
        title="Style"
        onClick={() => setOpen(!open)}
        style={{
          width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'var(--bg-hover)' : 'transparent',
          border: `1px solid ${open ? 'var(--border-mid)' : 'transparent'}`,
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        {/* Color swatch preview */}
        <div style={{ width: 20, height: 20, borderRadius: 3, border: '1px solid var(--border-mid)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: defaultFill }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, backgroundColor: defaultStroke }} />
        </div>
      </button>

      {open && (
        <div
          className="absolute z-50 space-y-4"
          style={{
            bottom: 48, left: 48,
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-mid)',
            borderRadius: 6,
            padding: 16,
            width: 208,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}
        >
          <ColorPicker label="Fill" value={defaultFill} onChange={setFill} />
          <ColorPicker label="Stroke" value={defaultStroke} onChange={setStroke} />
          <div className="space-y-1">
            <div style={{ fontSize: 11, color: 'var(--text-lo)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stroke width</div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={16}
                value={defaultStrokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="flex-1"
              />
              <span style={{ fontSize: 11, color: 'var(--lime)', fontFamily: "'Space Mono', monospace", width: 16 }}>{defaultStrokeWidth}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
