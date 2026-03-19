import { openDB } from 'idb';

const DB_NAME = 'pos-offline-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('products', { keyPath: 'id' });
      db.createObjectStore('pending_sales', { keyPath: 'client_txn_id' });
    },
  });
};

export const offlineDb = {
  async saveProducts(products: any[]) {
    const db = await initDB();
    const tx = db.transaction('products', 'readwrite');
    for (const product of products) {
      await tx.store.put(product);
    }
    await tx.done;
  },
  async getProducts() {
    const db = await initDB();
    return db.getAll('products');
  },
  async saveSale(sale: any) {
    const db = await initDB();
    await db.put('pending_sales', sale);
  },
  async getPendingSales() {
    const db = await initDB();
    return db.getAll('pending_sales');
  },
  async deleteSale(clientTxnId: string) {
    const db = await initDB();
    await db.delete('pending_sales', clientTxnId);
  }
};
