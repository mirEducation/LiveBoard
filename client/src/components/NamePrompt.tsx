import { useState, useRef, useEffect } from 'react';

interface Props {
  onSubmit: (name: string) => void;
}

export default function NamePrompt({ onSubmit }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    onSubmit(name);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-mid)',
        borderRadius: 8,
        padding: 40,
        width: '100%',
        maxWidth: 380,
        margin: '0 16px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Logo mark */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="8" height="8" fill="var(--lime)" />
            <rect x="11" y="1" width="8" height="8" fill="var(--lime)" opacity="0.5" />
            <rect x="1" y="11" width="8" height="8" fill="var(--lime)" opacity="0.5" />
            <rect x="11" y="11" width="8" height="8" fill="var(--lime)" />
          </svg>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--lime)', letterSpacing: '0.1em' }}>CANVAS</span>
        </div>

        <h2 style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Join Board
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-lo)', marginBottom: 28, lineHeight: 1.5 }}>
          Enter your display name to start collaborating
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your name"
            maxLength={32}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--bg-deep)',
              border: '1px solid var(--border-mid)',
              borderRadius: 4,
              color: 'var(--text-hi)',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--lime)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; }}
          />
          <button
            type="submit"
            disabled={!value.trim()}
            style={{
              width: '100%',
              padding: '13px 0',
              background: value.trim() ? 'var(--lime)' : 'var(--bg-hover)',
              color: value.trim() ? '#0b0c10' : 'var(--text-lo)',
              border: 'none',
              borderRadius: 4,
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: value.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            JOIN →
          </button>
        </form>
      </div>
    </div>
  );
}
