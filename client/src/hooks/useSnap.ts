import { useCallback } from 'react';
import { useBoardStore } from '../store/boardStore';
import { snapPosition } from '../utils/snapHelpers';

export function useSnap() {
  const shapes = useBoardStore((s) => s.shapes);
  const snapSettings = useBoardStore((s) => s.snapSettings);

  const snap = useCallback(
    (px: number, py: number, draggedId: string) => {
      return snapPosition(px, py, shapes, draggedId, snapSettings);
    },
    [shapes, snapSettings]
  );

  return { snap };
}
