import { useEffect, useRef } from 'react';
import { getSocket } from '../socket/socket';
import { useBoardStore } from '../store/boardStore';
import {
  SnapshotPayload,
  ShapeAddedPayload,
  ShapeUpdatedPayload,
  ShapeDeletedPayload,
  CursorMovedPayload,
  PathPointedPayload,
  UserJoinedPayload,
  TitleUpdatedPayload,
  UserInfo,
} from '../types';
import { userIdToColor } from '../utils/color';

export function useSocket(boardId: string, userId: string, userName: string) {
  const store = useBoardStore();
  const cursorThrottleRef = useRef<number>(0);

  useEffect(() => {
    if (!boardId || !userId || !userName) return;

    const socket = getSocket();

    const color = userIdToColor(userId);

    const onConnect = () => {
      store.setConnected(true);
      socket.emit('board:join', { boardId, userId, userName, color });
    };

    const onDisconnect = () => {
      store.setConnected(false);
    };

    const onSnapshot = (payload: SnapshotPayload) => {
      store.setSnapshot(payload.title, payload.shapes, payload.users);
    };

    const onUserJoined = (payload: UserJoinedPayload) => {
      if (payload.userId === userId) return;
      store.addUser(payload as UserInfo);
    };

    const onUserLeft = (payload: { userId: string }) => {
      store.removeUser(payload.userId);
      store.removeCursor(payload.userId);
    };

    const onTitleUpdated = (payload: TitleUpdatedPayload) => {
      store.setTitle(payload.title, false);
    };

    const onShapeAdded = (payload: ShapeAddedPayload) => {
      if (payload.userId === userId) return;
      store.addShape(payload.shape, false);
    };

    const onShapeUpdated = (payload: ShapeUpdatedPayload) => {
      if (payload.userId === userId) return;
      store.updateShape(payload.shapeId, payload.changes, false);
    };

    const onShapeDeleted = (payload: ShapeDeletedPayload) => {
      if (payload.userId === userId) return;
      store.deleteShape(payload.shapeId, false);
    };

    const onCursorMoved = (payload: CursorMovedPayload) => {
      if (payload.userId === userId) return;
      // Ensure user appears in header — fallback if snapshot didn't include them
      if (!useBoardStore.getState().connectedUsers[payload.userId]) {
        store.addUser({ userId: payload.userId, userName: payload.userName, color: payload.color });
      }
      store.updateCursor({
        userId: payload.userId,
        name: payload.userName,
        x: payload.x,
        y: payload.y,
        color: payload.color,
      });
    };

    const onPathPointed = (payload: PathPointedPayload) => {
      if (payload.userId === userId) return;
      store.appendPathPoint(payload.shapeId, payload.x, payload.y);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('board:snapshot', onSnapshot);
    socket.on('board:user_joined', onUserJoined);
    socket.on('board:user_left', onUserLeft);
    socket.on('board:title_updated', onTitleUpdated);
    socket.on('board:shape_added', onShapeAdded);
    socket.on('board:shape_updated', onShapeUpdated);
    socket.on('board:shape_deleted', onShapeDeleted);
    socket.on('board:cursor_moved', onCursorMoved);
    socket.on('board:path_pointed', onPathPointed);

    // If already connected, manually join
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('board:snapshot', onSnapshot);
      socket.off('board:user_joined', onUserJoined);
      socket.off('board:user_left', onUserLeft);
      socket.off('board:title_updated', onTitleUpdated);
      socket.off('board:shape_added', onShapeAdded);
      socket.off('board:shape_updated', onShapeUpdated);
      socket.off('board:shape_deleted', onShapeDeleted);
      socket.off('board:cursor_moved', onCursorMoved);
      socket.off('board:path_pointed', onPathPointed);
    };
  }, [boardId, userId, userName]);

  const emitCursorMove = (x: number, y: number) => {
    const now = Date.now();
    if (now - cursorThrottleRef.current < 50) return;
    cursorThrottleRef.current = now;
    const socket = getSocket();
    const color = userIdToColor(userId);
    socket.emit('board:cursor_move', { boardId, userId, userName, color, x, y });
  };

  return { emitCursorMove };
}
