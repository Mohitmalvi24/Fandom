/**
 * MMKV storage for zoom-state persistence.
 *
 * Uses react-native-mmkv for synchronous, disk-backed storage
 * that survives app kill (cold start).
 */
import type { ZoomState } from '../types/api';

let storage: {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  remove: (key: string) => void;
};

try {
  const { createMMKV } = require('react-native-mmkv');
  storage = createMMKV({ id: 'fanon-zoom-state' });
} catch (e) {
  console.warn('MMKV not available (likely Expo Go). Falling back to memory store.');
  const memoryStore = new Map<string, string>();
  storage = {
    getString: (key: string) => memoryStore.get(key),
    set: (key: string, value: string) => memoryStore.set(key, value),
    remove: (key: string) => memoryStore.delete(key),
  };
}

const ZOOM_KEY_PREFIX = 'zoom:';

export function getZoomState(chapterId: string): ZoomState | null {
  const key = `${ZOOM_KEY_PREFIX}${chapterId}`;
  const raw = storage.getString(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ZoomState;
  } catch {
    return null;
  }
}

export function setZoomState(state: ZoomState): void {
  const key = `${ZOOM_KEY_PREFIX}${state.chapterId}`;
  storage.set(key, JSON.stringify(state));
}

export function clearZoomState(chapterId: string): void {
  const key = `${ZOOM_KEY_PREFIX}${chapterId}`;
  storage.remove(key);
}

export { storage };
