import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getOfflineDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('inventory_offline.db');
    await initOfflineSchema(db);
  }
  return db;
}

async function initOfflineSchema(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS cached_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL,
      barcode TEXT,
      cost_price REAL,
      selling_price REAL,
      quantity INTEGER,
      low_stock_threshold INTEGER,
      image_url TEXT,
      category_name TEXT,
      brand_name TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_operations (
      id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export async function cacheProducts(products: any[]) {
  const database = await getOfflineDb();
  await database.execAsync('DELETE FROM cached_products;');

  for (const p of products) {
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_products (id, name, sku, barcode, cost_price, selling_price, quantity, low_stock_threshold, image_url, category_name, brand_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        p.id,
        p.name,
        p.sku,
        p.barcode || null,
        p.cost_price || 0,
        p.selling_price || 0,
        p.quantity || 0,
        p.low_stock_threshold || 10,
        p.image_url || null,
        p.categories?.name || null,
        p.brands?.name || null,
      ]
    );
  }
}

export async function getCachedProductByBarcode(barcode: string) {
  const database = await getOfflineDb();
  return await database.getFirstAsync<any>(
    'SELECT * FROM cached_products WHERE barcode = ?;',
    [barcode.trim()]
  );
}

export async function searchCachedProducts(query: string) {
  const database = await getOfflineDb();
  const pattern = \`%\${query.trim()}%\`;
  return await database.getAllAsync<any>(
    'SELECT * FROM cached_products WHERE name LIKE ? OR sku LIKE ? OR barcode LIKE ? LIMIT 20;',
    [pattern, pattern, pattern]
  );
}

export async function queuePendingOperation(type: string, payload: any) {
  const database = await getOfflineDb();
  const id = \`op_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`;
  await database.runAsync(
    \`INSERT INTO pending_operations (id, operation_type, payload, status, created_at) VALUES (?, ?, ?, 'pending', ?);\`,
    [id, type, JSON.stringify(payload), new Date().toISOString()]
  );
  return id;
}

export async function getPendingOperations() {
  const database = await getOfflineDb();
  const rows = await database.getAllAsync<any>(
    "SELECT * FROM pending_operations WHERE status = 'pending' ORDER BY created_at ASC;"
  );
  return rows.map((r: any) => ({
    ...r,
    payload: JSON.parse(r.payload),
  }));
}

export async function markOperationStatus(id: string, status: 'synced' | 'failed', errorMsg?: string) {
  const database = await getOfflineDb();
  await database.runAsync(
    'UPDATE pending_operations SET status = ?, error_message = ? WHERE id = ?;',
    [status, errorMsg || null, id]
  );
}
