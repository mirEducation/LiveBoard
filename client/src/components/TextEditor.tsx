import { useEffect, useRef } from 'react';

interface Props {
  shapeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  onCommit: (id: string, text: string) => void;
  onClose: () => void;
}

export default function TextEditor({ shapeId, x, y, width, height, text, fontSize, fontFamily, onCommit, onClose }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.value = text;
      ref.current.focus();
      ref.current.select();
    }
  }, [text]);

  const commit = () => {
    if (ref.current) {
      onCommit(shapeId, ref.current.value);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    // Allow Enter for newlines in text shapes
  };

  return (
    <textarea
      ref={ref}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width,
        minHeight: height,
        fontSize,
        fontFamily,
        zIndex: 999,
        border: '2px solid #2563eb',
        borderRadius: 4,
        padding: 4,
        resize: 'both',
        outline: 'none',
        background: 'white',
        lineHeight: 1.4,
      }}
      onBlur={commit}
      onKeyDown={handleKeyDown}
    />
  );
}
