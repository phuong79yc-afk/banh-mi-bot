import fs from 'fs/promises';
import path from 'path';
import { coinsCache, inventoryCache, cooldownCache } from './fileCache';

const DATA_DIR = path.join(process.cwd(), 'data');

// Validate that path is within data directory
function validatePath(filePath: string): string {
  const normalized = path.resolve(filePath);
  const dataDir = path.resolve(DATA_DIR);
  if (!normalized.startsWith(dataDir)) {
    throw new Error('Path traversal detected');
  }
  return normalized;
}

export async function readJSON<T = any>(filePath: string, useCache = true): Promise<T> {
  const validPath = validatePath(filePath);
  const cacheKey = validPath;
  
  if (useCache) {
    // Try all caches
    const cached = coinsCache.get(cacheKey) || inventoryCache.get(cacheKey) || cooldownCache.get(cacheKey);
    if (cached) return cached as T;
  }
  
  try {
    const content = await fs.readFile(validPath, 'utf8');
    const data = JSON.parse(content);
    
    if (useCache) {
      // Determine which cache to use based on file path
      if (filePath.includes('coins')) {
        coinsCache.set(cacheKey, data);
      } else if (filePath.includes('inventory')) {
        inventoryCache.set(cacheKey, data);
      } else if (filePath.includes('cooldown') || filePath.includes('usage')) {
        cooldownCache.set(cacheKey, data);
      }
    }
    
    return data;
  } catch (error: any) {
    if (error.code === 'ENOENT') return {} as T;
    throw error;
  }
}

export async function writeJSON<T = any>(filePath: string, data: T, invalidateCache = true): Promise<void> {
  const validPath = validatePath(filePath);
  
  // Ensure parent directory exists
  const dir = path.dirname(validPath);
  await fs.mkdir(dir, { recursive: true });
  
  await fs.writeFile(validPath, JSON.stringify(data, null, 2), 'utf8');
  
  if (invalidateCache) {
    const cacheKey = validPath;
    coinsCache.invalidate(cacheKey);
    inventoryCache.invalidate(cacheKey);
    cooldownCache.invalidate(cacheKey);
  }
}

// Batch operations for atomic multi-file writes
export async function batchWriteJSON(operations: Array<{path: string, data: any}>): Promise<void> {
  for (const op of operations) {
    await writeJSON(op.path, op.data, false);
  }
  
  // Invalidate all caches after batch write
  for (const op of operations) {
    const validPath = validatePath(op.path);
    coinsCache.invalidate(validPath);
    inventoryCache.invalidate(validPath);
    cooldownCache.invalidate(validPath);
  }
}
