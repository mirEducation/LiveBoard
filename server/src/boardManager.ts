import { BoardState, Shape } from './types';
import { getBoard, createBoard, saveShapes, saveTitle, touchBoard, deleteOldBoards } from './db';

// In-memory cache of active boards
const boards = new Map<string, BoardState>();

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Periodically clean up old boards
setInterval(() => {
  const deleted = deleteOldBoards(THREE_DAYS_MS);
  if (deleted > 0) {
    console.log(`[cleanup] Deleted ${deleted} old board(s) from DB`);
  }
  // Also evict idle boards from memory cache
  const cutoff = Date.now() - THREE_DAYS_MS;
  for (const [id, board] of boards.entries()) {
    if (board.users.size === 0) {
      boards.delete(id);
    }
  }
}, CLEANUP_INTERVAL_MS);

export function loadBoard(boardId: string): BoardState {
  if (boards.has(boardId)) {
    return boards.get(boardId)!;
  }

  let row = getBoard(boardId);
  if (!row) {
    row = createBoard(boardId);
  }

  const state: BoardState = {
    id: boardId,
    title: row.title,
    shapes: JSON.parse(row.shapes_json) as Record<string, Shape>,
    users: new Map(),
  };

  boards.set(boardId, state);
  return state;
}

export function getBoardState(boardId: string): BoardState | undefined {
  return boards.get(boardId);
}

export function addShape(boardId: string, shape: Shape): void {
  const board = loadBoard(boardId);
  board.shapes[shape.id] = shape;
  saveShapes(boardId, board.shapes);
}

export function updateShape(boardId: string, shapeId: string, changes: Partial<Shape>): void {
  const board = loadBoard(boardId);
  if (board.shapes[shapeId]) {
    board.shapes[shapeId] = { ...board.shapes[shapeId], ...changes } as Shape;
    saveShapes(boardId, board.shapes);
  }
}

export function deleteShape(boardId: string, shapeId: string): void {
  const board = loadBoard(boardId);
  delete board.shapes[shapeId];
  saveShapes(boardId, board.shapes);
}

export function updateTitle(boardId: string, title: string): void {
  const board = loadBoard(boardId);
  board.title = title;
  saveTitle(boardId, title);
}

export function addUser(
  boardId: string,
  userId: string,
  userName: string,
  color: string,
  socketId: string
): void {
  const board = loadBoard(boardId);
  board.users.set(userId, { userId, userName, color, socketId });
  touchBoard(boardId);
}

export function removeUser(boardId: string, userId: string): void {
  const board = boards.get(boardId);
  if (board) {
    board.users.delete(userId);
  }
}

export function getUsers(boardId: string): Array<{ userId: string; userName: string; color: string }> {
  const board = boards.get(boardId);
  if (!board) return [];
  return Array.from(board.users.values()).map(({ userId, userName, color }) => ({
    userId,
    userName,
    color,
  }));
}
