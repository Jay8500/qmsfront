/**
 * Minimal native IndexedDB wrapper (zero dependencies).
 *
 * Every operation opens its transaction and issues its request in the SAME
 * synchronous turn (inside the promise callback after the DB handle resolves)
 * to avoid the classic "transaction auto-closed" pitfall that happens when you
 * `await` between creating a transaction and using it.
 */
export type UpgradeFn = (db: IDBDatabase, oldVersion: number) => void;

export class IndexedDb {
  private readonly dbPromise: Promise<IDBDatabase>;

  constructor(
    private readonly dbName: string,
    private readonly version: number,
    private readonly upgrade: UpgradeFn,
  ) {
    this.dbPromise = this.open();
  }

  private open(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.version);
      req.onupgradeneeded = (ev) => this.upgrade(req.result, ev.oldVersion);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /** Run a store operation atomically; the request is created synchronously. */
  private run<T>(
    store: string,
    mode: IDBTransactionMode,
    op: (os: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    return this.dbPromise.then(
      (db) =>
        new Promise<T>((resolve, reject) => {
          const tx = db.transaction(store, mode);
          const request = op(tx.objectStore(store));
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }),
    );
  }

  getAll<T>(store: string): Promise<T[]> {
    return this.run<T[]>(store, 'readonly', (os) => os.getAll() as IDBRequest<T[]>);
  }

  getAllByIndex<T>(store: string, index: string, key: IDBValidKey): Promise<T[]> {
    return this.run<T[]>(
      store,
      'readonly',
      (os) => os.index(index).getAll(key) as IDBRequest<T[]>,
    );
  }

  get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    return this.run<T | undefined>(
      store,
      'readonly',
      (os) => os.get(key) as IDBRequest<T | undefined>,
    );
  }

  put<T>(store: string, value: T): Promise<IDBValidKey> {
    return this.run<IDBValidKey>(store, 'readwrite', (os) => os.put(value as any));
  }

  delete(store: string, key: IDBValidKey): Promise<undefined> {
    return this.run<undefined>(store, 'readwrite', (os) => os.delete(key) as IDBRequest<undefined>);
  }

  count(store: string): Promise<number> {
    return this.run<number>(store, 'readonly', (os) => os.count());
  }

  /** Bulk put within a single transaction. */
  bulkPut<T>(store: string, values: T[]): Promise<void> {
    return this.dbPromise.then(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const tx = db.transaction(store, 'readwrite');
          const os = tx.objectStore(store);
          for (const v of values) os.put(v as any);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        }),
    );
  }
}
