import { Server, Socket } from 'socket.io';
import {
  loadBoard,
  addShape,
  updateShape,
  deleteShape,
  updateTitle,
  addUser,
  removeUser,
  getUsers,
} from '../boardManager';
import { Shape } from '../types';

export function registerBoardEvents(io: Server, socket: Socket): void {
  // Track which board + user this socket belongs to
  let currentBoardId: string | null = null;
  let currentUserId: string | null = null;

  socket.on('board:join', (payload: { boardId: string; userId: string; userName: string; color: string }) => {
    const { boardId, userId, userName, color } = payload;

    currentBoardId = boardId;
    currentUserId = userId;

    socket.join(boardId);

    addUser(boardId, userId, userName, color, socket.id);

    const board = loadBoard(boardId);

    // Send snapshot to joining client only
    socket.emit('board:snapshot', {
      boardId,
      title: board.title,
      shapes: board.shapes,
      users: getUsers(boardId),
    });

    // Broadcast user joined to others
    socket.to(boardId).emit('board:user_joined', { userId, userName, color });

    console.log(`[join] ${userName} (${userId}) joined board ${boardId}`);
  });

  socket.on('board:title_update', (payload: { boardId: string; title: string; userId: string }) => {
    const { boardId, title, userId } = payload;
    updateTitle(boardId, title);
    // Broadcast to all in room (including sender for confirmation)
    io.to(boardId).emit('board:title_updated', { title, userId });
  });

  socket.on('board:shape_add', (payload: { boardId: string; shape: Shape; userId: string }) => {
    const { boardId, shape, userId } = payload;
    addShape(boardId, shape);
    io.to(boardId).emit('board:shape_added', { boardId, shape, userId });
  });

  socket.on(
    'board:shape_update',
    (payload: { boardId: string; shapeId: string; changes: Partial<Shape>; userId: string }) => {
      const { boardId, shapeId, changes, userId } = payload;
      updateShape(boardId, shapeId, changes);
      io.to(boardId).emit('board:shape_updated', { boardId, shapeId, changes, userId });
    }
  );

  socket.on('board:shape_delete', (payload: { boardId: string; shapeId: string; userId: string }) => {
    const { boardId, shapeId, userId } = payload;
    deleteShape(boardId, shapeId);
    io.to(boardId).emit('board:shape_deleted', { boardId, shapeId, userId });
  });

  socket.on('board:cursor_move', (payload: { boardId: string; userId: string; userName: string; color: string; x: number; y: number }) => {
    // Relay cursor to others (no DB write needed)
    socket.to(payload.boardId).emit('board:cursor_moved', payload);
  });

  socket.on(
    'board:path_point',
    (payload: { boardId: string; shapeId: string; x: number; y: number; userId: string }) => {
      // Relay live path point to others
      socket.to(payload.boardId).emit('board:path_pointed', payload);
    }
  );

  socket.on('disconnect', () => {
    if (currentBoardId && currentUserId) {
      removeUser(currentBoardId, currentUserId);
      io.to(currentBoardId).emit('board:user_left', { userId: currentUserId });
      console.log(`[leave] ${currentUserId} left board ${currentBoardId}`);
    }
  });
}
