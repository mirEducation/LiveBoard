import React from 'react';
import Konva from 'konva';
import BoardTitle from './BoardTitle';
import UserAvatars from './UserAvatars';
import ShareButton from './ShareButton';
import ExportButton from './ExportButton';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export default function Header({ stageRef }: Props) {
  return (
    <header
      className="h-12 flex items-center px-4 gap-4 shrink-0 z-10"
      style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="1" width="8" height="8" fill="var(--lime)" />
          <rect x="11" y="1" width="8" height="8" fill="var(--lime)" opacity="0.5" />
          <rect x="1" y="11" width="8" height="8" fill="var(--lime)" opacity="0.5" />
          <rect x="11" y="11" width="8" height="8" fill="var(--lime)" />
        </svg>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '0.08em' }}>
          LiveBoard
        </span>
      </div>

      {/* Board title */}
      <div className="flex-1 min-w-0">
        <BoardTitle />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
        <UserAvatars />
        <div style={{ width: 1, height: 22, background: 'var(--border-mid)' }} />
        <ShareButton />
        <ExportButton stageRef={stageRef} />
      </div>
    </header>
  );
}
