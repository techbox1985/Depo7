import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'shw-pos-db';
const DB_VERSION = 1;

export const STORES = {
  PRODUCTS: 'products',
  CONFIG: 'config',
};

let dbPromise: Promise<IDBPDatabase>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
        db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
};

export const dbService = {
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await initDB();
    return db.getAll(storeName);
  },
  async setAll<T>(storeName: string, items: T[]): Promise<void> {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    await Promise.all(items.map(item => tx.store.put(item)));
    await tx.done;
  },
  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await initDB();
    return db.get(storeName, key);
  },
  async set<T>(storeName: string, key: string, value: T): Promise<void> {
    const db = await initDB();
    await db.put(storeName, { key, value });
  }
};
