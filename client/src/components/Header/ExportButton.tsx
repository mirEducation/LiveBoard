import Konva from 'konva';
import { exportToPNG } from '../../utils/exportHelpers';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function ExportButton({ stageRef }: Props) {
  const handleExport = () => {
    if (stageRef.current) {
      exportToPNG(stageRef.current, 'whiteboard.png');
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors"
      style={{
        background: 'var(--lime)',
        color: '#0b0c10',
        border: 'none',
        borderRadius: 4,
        fontFamily: "'Space Mono', monospace",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--lime-dim)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--lime)'; }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export PNG
    </button>
  );
}
