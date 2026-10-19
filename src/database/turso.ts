import { createClient } from '@libsql/client';

let db: any = null;

export function getTursoDatabase() {
  if (db) return db;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in environment variables');
  }

  console.log(`🚀 Connecting to Turso database: ${url}`);
  
  db = createClient({
    url,
    authToken,
  });

  return db;
}

// Helper to convert Turso result to better-sqlite3-like format
export function tursoToSqliteFormat(result: any) {
  if (!result.rows || result.rows.length === 0) return null;
  
  // Convert array format to object format
  const columns = result.columns;
  return result.rows.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj;
  });
}
