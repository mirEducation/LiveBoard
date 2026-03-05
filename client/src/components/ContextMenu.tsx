import { useEffect, useRef } from 'react';
import { Shape } from '../types';
import { useBoardStore } from '../store/boardStore';

interface Props {
  x: number;
  y: number;
  selectedIds: string[];
  shapes: Record<string, Shape>;
  onClose: () => void;
}

export default function ContextMenu({ x, y, selectedIds, shapes, onClose }: Props) {
  const store = useBoardStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const allZIndexes = Object.values(shapes).map((s) => s.zIndex);
  const maxZ = Math.max(0, ...allZIndexes);
  const minZ = Math.min(0, ...allZIndexes);

  const updateZ = (newZ: (current: number) => number) => {
    for (const id of selectedIds) {
      const shape = shapes[id];
      if (!shape) continue;
      const prev = shape.zIndex;
      const next = newZ(prev);
      store.updateShape(id, { zIndex: next });
      store.pushUndo({
        type: 'update',
        backward: () => store.updateShape(id, { zIndex: prev }),
        forward: () => store.updateShape(id, { zIndex: next }),
      });
    }
    onClose();
  };

  const handleDelete = () => {
    for (const id of selectedIds) {
      const shape = shapes[id];
      if (!shape) continue;
      store.deleteShape(id);
      store.pushUndo({
        type: 'delete',
        backward: () => store.addShape(shape),
        forward: () => store.deleteShape(id),
      });
    }
    store.setSelection([]);
    onClose();
  };

  const items = [
    { label: 'Bring to Front', onClick: () => updateZ(() => maxZ + 1) },
    { label: 'Bring Forward', onClick: () => updateZ((z) => z + 1) },
    { label: 'Send Backward', onClick: () => updateZ((z) => z - 1) },
    { label: 'Send to Back', onClick: () => updateZ(() => minZ - 1) },
    null, // divider
    { label: 'Delete', onClick: handleDelete, danger: true },
  ];

  // Adjust position to avoid overflow
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 1000,
  };

  return (
    <div
      ref={menuRef}
      style={{
        ...menuStyle,
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-mid)',
        borderRadius: 6,
        padding: '4px 0',
        minWidth: 172,
        boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
      }}
    >
      {items.map((item, i) =>
        item === null ? (
          <div key={i} style={{ margin: '3px 0', borderTop: '1px solid var(--border)' }} />
        ) : (
          <button
            key={item.label}
            onClick={item.onClick}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              fontSize: 13,
              color: (item as any).danger ? '#f87171' : 'var(--text-mid)',
              cursor: 'pointer',
              transition: 'background 0.1s, color 0.1s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = (item as any).danger ? 'rgba(248,113,113,0.08)' : 'var(--bg-hover)';
              e.currentTarget.style.color = (item as any).danger ? '#f87171' : 'var(--text-hi)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = (item as any).danger ? '#f87171' : 'var(--text-mid)';
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
