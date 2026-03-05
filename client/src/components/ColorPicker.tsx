import { useState } from 'react';
import { PRESET_COLORS } from '../utils/color';

interface Props {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: Props) {
  const [showHex, setShowHex] = useState(false);
  const [hexInput, setHexInput] = useState(value);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHexInput(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      onChange(v);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ fontSize: 11, color: 'var(--text-lo)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            title={color}
            onClick={() => { onChange(color); setHexInput(color); }}
            style={{
              width: 22, height: 22,
              backgroundColor: color,
              border: value === color ? '2px solid var(--lime)' : '1px solid var(--border-mid)',
              borderRadius: 3,
              cursor: 'pointer',
              transform: 'scale(1)',
              transition: 'transform 0.1s',
              outline: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ))}
      </div>
      <button
        onClick={() => setShowHex(!showHex)}
        style={{ fontSize: 11, color: 'var(--lime)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
      >
        {showHex ? '— hide hex' : '+ hex input'}
      </button>
      {showHex && (
        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          placeholder="#000000"
          maxLength={7}
          style={{
            width: '100%',
            fontSize: 12,
            fontFamily: "'Space Mono', monospace",
            background: 'var(--bg-deep)',
            border: '1px solid var(--border-mid)',
            borderRadius: 3,
            padding: '4px 8px',
            color: 'var(--text-hi)',
            outline: 'none',
          }}
        />
      )}
    </div>
  );
}
