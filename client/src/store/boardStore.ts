import { create } from 'zustand';
import {
  Shape,
  Cursor,
  ToolMode,
  SnapSettings,
  StageTransform,
  UndoEntry,
  UserInfo,
} from '../types';
import { getSocket } from '../socket/socket';

const MAX_UNDO = 50;

interface BoardStore {
  // Identity
  boardId: string;
  userId: string;
  userName: string;

  // Board data
  title: string;
  shapes: Record<string, Shape>;
  cursors: Record<string, Cursor>;
  connectedUsers: Record<string, UserInfo>;

  // UI state
  toolMode: ToolMode;
  selectedShapeIds: string[];
  snapSettings: SnapSettings;
  isConnected: boolean;
  stageTransform: StageTransform;
  showGrid: boolean;

  // Style defaults for new shapes
  defaultFill: string;
  defaultStroke: string;
  defaultStrokeWidth: number;

  // Undo/redo
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];

  // Identity actions
  setIdentity: (boardId: string, userId: string, userName: string) => void;

  // Board actions
  setSnapshot: (title: string, shapes: Record<string, Shape>, users: UserInfo[]) => void;

  addShape: (shape: Shape, emit?: boolean) => void;
  updateShape: (id: string, changes: Partial<Shape>, emit?: boolean) => void;
  deleteShape: (id: string, emit?: boolean) => void;
  appendPathPoint: (shapeId: string, x: number, y: number) => void;

  setTitle: (title: string, emit?: boolean) => void;

  // Presence
  addUser: (user: UserInfo) => void;
  removeUser: (userId: string) => void;
  updateCursor: (cursor: Cursor) => void;
  removeCursor: (userId: string) => void;

  // UI actions
  setToolMode: (mode: ToolMode) => void;
  setSelection: (ids: string[]) => void;
  toggleSnap: () => void;
  setSnapSettings: (s: Partial<SnapSettings>) => void;
  setStageTransform: (t: StageTransform) => void;
  setConnected: (v: boolean) => void;
  toggleGrid: () => void;
  setDefaultStyle: (style: { fill?: string; stroke?: string; strokeWidth?: number }) => void;

  // Undo/redo
  pushUndo: (entry: UndoEntry) => void;
  undo: () => void;
  redo: () => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  boardId: '',
  userId: '',
  userName: '',
  title: 'Untitled Board',
  shapes: {},
  cursors: {},
  connectedUsers: {},
  toolMode: 'select',
  selectedShapeIds: [],
  snapSettings: { enabled: true, gridSize: 20, snapThreshold: 8 },
  isConnected: false,
  stageTransform: { x: 0, y: 0, scale: 1 },
  showGrid: true,
  defaultFill: '#ffffff',
  defaultStroke: '#000000',
  defaultStrokeWidth: 2,
  undoStack: [],
  redoStack: [],

  setIdentity: (boardId, userId, userName) => set({ boardId, userId, userName }),

  setSnapshot: (title, shapes, users) => {
    const connectedUsers: Record<string, UserInfo> = {};
    for (const u of users) {
      connectedUsers[u.userId] = u;
    }
    set({ title, shapes, connectedUsers });
  },

  addShape: (shape, emit = true) => {
    set((state) => ({ shapes: { ...state.shapes, [shape.id]: shape } }));
    if (emit) {
      const { boardId, userId } = get();
      getSocket().emit('board:shape_add', { boardId, shape, userId });
    }
  },

  updateShape: (id, changes, emit = true) => {
    set((state) => {
      const existing = state.shapes[id];
      if (!existing) return state;
      return { shapes: { ...state.shapes, [id]: { ...existing, ...changes } as Shape } };
    });
    if (emit) {
      const { boardId, userId } = get();
      getSocket().emit('board:shape_update', { boardId, shapeId: id, changes, userId });
    }
  },

  deleteShape: (id, emit = true) => {
    set((state) => {
      const { [id]: _, ...rest } = state.shapes;
      return { shapes: rest, selectedShapeIds: state.selectedShapeIds.filter((s) => s !== id) };
    });
    if (emit) {
      const { boardId, userId } = get();
      getSocket().emit('board:shape_delete', { boardId, shapeId: id, userId });
    }
  },

  appendPathPoint: (shapeId, x, y) => {
    set((state) => {
      const shape = state.shapes[shapeId];
      if (!shape || shape.type !== 'path') return state;
      return {
        shapes: {
          ...state.shapes,
          [shapeId]: { ...shape, points: [...shape.points, x, y] },
        },
      };
    });
  },

  setTitle: (title, emit = true) => {
    set({ title });
    if (emit) {
      const { boardId, userId } = get();
      getSocket().emit('board:title_update', { boardId, title, userId });
    }
  },

  addUser: (user) => {
    set((state) => ({
      connectedUsers: { ...state.connectedUsers, [user.userId]: user },
    }));
  },

  removeUser: (userId) => {
    set((state) => {
      const { [userId]: _, ...rest } = state.connectedUsers;
      return { connectedUsers: rest };
    });
  },

  updateCursor: (cursor) => {
    set((state) => ({ cursors: { ...state.cursors, [cursor.userId]: cursor } }));
  },

  removeCursor: (userId) => {
    set((state) => {
      const { [userId]: _, ...rest } = state.cursors;
      return { cursors: rest };
    });
  },

  setToolMode: (mode) => set({ toolMode: mode, selectedShapeIds: [] }),

  setSelection: (ids) => set({ selectedShapeIds: ids }),

  toggleSnap: () =>
    set((state) => ({
      snapSettings: { ...state.snapSettings, enabled: !state.snapSettings.enabled },
    })),

  setSnapSettings: (s) =>
    set((state) => ({ snapSettings: { ...state.snapSettings, ...s } })),

  setStageTransform: (t) => set({ stageTransform: t }),

  setConnected: (v) => set({ isConnected: v }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  setDefaultStyle: (style) =>
    set((state) => ({
      defaultFill: style.fill ?? state.defaultFill,
      defaultStroke: style.stroke ?? state.defaultStroke,
      defaultStrokeWidth: style.strokeWidth ?? state.defaultStrokeWidth,
    })),

  pushUndo: (entry) => {
    set((state) => {
      const stack = [...state.undoStack, entry];
      if (stack.length > MAX_UNDO) stack.shift();
      return { undoStack: stack, redoStack: [] };
    });
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const entry = undoStack[undoStack.length - 1];
    entry.backward();
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, entry],
    }));
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    entry.forward();
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, entry],
    }));
  },
}));
