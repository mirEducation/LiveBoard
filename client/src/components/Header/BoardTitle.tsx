import { useState, useRef, useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';

export default function BoardTitle() {
  const title = useBoardStore((s) => s.title);
  const setTitle = useBoardStore((s) => s.setTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const name = draft.trim() || 'Untitled Board';
    setTitle(name);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--lime)',
          background: 'transparent',
          border: 'none',
          borderBottom: '1.5px solid var(--lime)',
          outline: 'none',
          minWidth: 0,
          maxWidth: 280,
          padding: '0 4px',
          letterSpacing: '0.04em',
        }}
        maxLength={80}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 13,
        fontWeight: 700,
        color: 'var(--text-hi)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        maxWidth: 280,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        letterSpacing: '0.04em',
        padding: '2px 4px',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--lime)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-hi)')}
      title="Click to rename"
    >
      {title}
    </button>
  );
}
