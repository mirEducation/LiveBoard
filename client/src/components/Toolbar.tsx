import React from 'react';
import { useBoardStore } from '../store/boardStore';
import { ToolMode } from '../types';
import StylePanel from './StylePanel';

interface ToolBtn {
  mode: ToolMode;
  label: string;
  icon: React.ReactNode;
}

const TOOLS: ToolBtn[] = [
  {
    mode: 'select',
    label: 'Select (V)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-6-6m0 0l6-6m-6 6h12" />
      </svg>
    ),
  },
  {
    mode: 'rect',
    label: 'Rectangle (R)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
      </svg>
    ),
  },
  {
    mode: 'circle',
    label: 'Ellipse (E)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <ellipse cx="12" cy="12" rx="9" ry="7" strokeWidth={2} />
      </svg>
    ),
  },
  {
    mode: 'line',
    label: 'Line (L)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <line x1="4" y1="20" x2="20" y2="4" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    mode: 'arrow',
    label: 'Arrow (A)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19L19 5m0 0h-8m8 0v8" />
      </svg>
    ),
  },
  {
    mode: 'path',
    label: 'Freehand (P)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20c2-4 4-6 8-8s6-4 8-8" />
      </svg>
    ),
  },
  {
    mode: 'text',
    label: 'Text (T)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 6v12M8 18h8" />
      </svg>
    ),
  },
];

// Keyboard shortcut map
const KEY_MAP: Record<string, ToolMode> = {
  v: 'select', r: 'rect', e: 'circle', l: 'line', a: 'arrow', p: 'path', t: 'text',
};

export default function Toolbar() {
  const toolMode = useBoardStore((s) => s.toolMode);
  const setToolMode = useBoardStore((s) => s.setToolMode);
  const snapSettings = useBoardStore((s) => s.snapSettings);
  const toggleSnap = useBoardStore((s) => s.toggleSnap);
  const showGrid = useBoardStore((s) => s.showGrid);
  const toggleGrid = useBoardStore((s) => s.toggleGrid);

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const mode = KEY_MAP[e.key.toLowerCase()];
    if (mode) setToolMode(mode);
  };

  const toolBtnStyle = (active: boolean): React.CSSProperties => ({
    width: 40, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? 'var(--lime)' : 'transparent',
    color: active ? '#0b0c10' : 'var(--text-lo)',
    border: active ? 'none' : '1px solid transparent',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'background 0.12s, color 0.12s, border-color 0.12s',
    flexShrink: 0,
  });

  const utilBtnStyle = (active: boolean): React.CSSProperties => ({
    width: 40, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? 'rgba(200,226,52,0.12)' : 'transparent',
    color: active ? 'var(--lime)' : 'var(--text-lo)',
    border: `1px solid ${active ? 'var(--lime)' : 'transparent'}`,
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'background 0.12s, color 0.12s, border-color 0.12s',
    flexShrink: 0,
  });

  return (
    <div
      className="flex flex-col items-center py-3 gap-1 shrink-0 z-10"
      style={{ width: 56, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {TOOLS.map((tool) => (
        <button
          key={tool.mode}
          title={tool.label}
          onClick={() => setToolMode(tool.mode)}
          style={toolBtnStyle(toolMode === tool.mode)}
          onMouseEnter={e => { if (toolMode !== tool.mode) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-hi)'; } }}
          onMouseLeave={e => { if (toolMode !== tool.mode) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-lo)'; } }}
        >
          {tool.icon}
        </button>
      ))}

      <div style={{ margin: '4px 0', width: 28, borderTop: '1px solid var(--border)' }} />

      {/* Snap toggle */}
      <button
        title={`Snap: ${snapSettings.enabled ? 'On' : 'Off'}`}
        onClick={toggleSnap}
        style={utilBtnStyle(snapSettings.enabled)}
        onMouseEnter={e => { if (!snapSettings.enabled) { e.currentTarget.style.color = 'var(--text-hi)'; e.currentTarget.style.background = 'var(--bg-hover)'; } }}
        onMouseLeave={e => { if (!snapSettings.enabled) { e.currentTarget.style.color = 'var(--text-lo)'; e.currentTarget.style.background = 'transparent'; } }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      {/* Grid toggle */}
      <button
        title={`Grid: ${showGrid ? 'On' : 'Off'}`}
        onClick={toggleGrid}
        style={utilBtnStyle(showGrid)}
        onMouseEnter={e => { if (!showGrid) { e.currentTarget.style.color = 'var(--text-hi)'; e.currentTarget.style.background = 'var(--bg-hover)'; } }}
        onMouseLeave={e => { if (!showGrid) { e.currentTarget.style.color = 'var(--text-lo)'; e.currentTarget.style.background = 'transparent'; } }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
        </svg>
      </button>

      <div className="flex-1" />

      <StylePanel />
    </div>
  );
}
