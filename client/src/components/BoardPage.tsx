import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Konva from 'konva';
import { useBoardStore } from '../store/boardStore';
import { generateId } from '../utils/id';
import { userIdToColor } from '../utils/color';
import { useSocket } from '../hooks/useSocket';
import { useUndoRedo } from '../hooks/useUndoRedo';
import NamePrompt from './NamePrompt';
import Header from './Header';
import Toolbar from './Toolbar';
import Canvas from './Canvas';
import Minimap from './Minimap';

const USER_ID_KEY = 'wb_userId';

function getOrCreateUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const setIdentity = useBoardStore((s) => s.setIdentity);
  const [userName, setUserName] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const userId = getOrCreateUserId();

  // Ask for name once per board (store in sessionStorage so refresh re-asks)
  useEffect(() => {
    const key = `wb_name_${boardId}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      setUserName(saved);
    }
  }, [boardId]);

  const handleNameSubmit = (name: string) => {
    const key = `wb_name_${boardId}`;
    sessionStorage.setItem(key, name);
    setUserName(name);
  };

  useEffect(() => {
    if (boardId && userId && userName) {
      const color = userIdToColor(userId);
      setIdentity(boardId!, userId, userName);
    }
  }, [boardId, userId, userName, setIdentity]);

  const { emitCursorMove } = useSocket(
    boardId ?? '',
    userId,
    userName ?? ''
  );

  useUndoRedo();

  if (!userName) {
    return <NamePrompt onSubmit={handleNameSubmit} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      <Header stageRef={stageRef} />
      <div className="flex flex-1 overflow-hidden relative">
        <Toolbar />
        <div className="flex-1 relative overflow-hidden">
          <Canvas stageRef={stageRef} emitCursorMove={emitCursorMove} />
          <Minimap stageRef={stageRef} />
        </div>
      </div>
    </div>
  );
}
