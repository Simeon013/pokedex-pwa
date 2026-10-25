/**
 * Adaptateur de stockage Zustand vers IndexedDB (table `kv`).
 * Repli sur localStorage si IndexedDB est indisponible.
 */
import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import { db } from '@/db/dexie';

const idbStorage: StateStorage = {
  async getItem(name) {
    try {
      return (await db.kv.get(name))?.value ?? null;
    } catch {
      return globalThis.localStorage?.getItem(name) ?? null;
    }
  },
  async setItem(name, value) {
    try {
      await db.kv.put({ key: name, value });
    } catch {
      globalThis.localStorage?.setItem(name, value);
    }
  },
  async removeItem(name) {
    try {
      await db.kv.delete(name);
    } catch {
      globalThis.localStorage?.removeItem(name);
    }
  },
};

export const persistentStorage = createJSONStorage(() => idbStorage);
