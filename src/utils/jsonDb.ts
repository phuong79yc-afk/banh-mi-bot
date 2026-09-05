import fs from 'fs';

/**
 * Safely load JSON database file
 * Handles corrupted files, BOM, and empty content
 */
export function loadJsonDb<T = any>(filePath: string): T {
  try {
    // Ensure file exists
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{}', 'utf8');
      return {} as T;
    }

    // Read and clean content
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    content = content.trim();

    // Handle empty file
    if (!content || content === '') {
      fs.writeFileSync(filePath, '{}', 'utf8');
      return {} as T;
    }

    // Parse JSON
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading JSON from ${filePath}:`, error);
    
    // Backup corrupted file
    const backupPath = filePath + '.backup.' + Date.now();
    try {
      fs.copyFileSync(filePath, backupPath);
      console.log(`Corrupted file backed up to: ${backupPath}`);
    } catch (e) {
      // Ignore backup errors
    }

    // Reset to empty object
    fs.writeFileSync(filePath, '{}', 'utf8');
    return {} as T;
  }
}

/**
 * Safely save JSON database file
 */
export function saveJsonDb(filePath: string, data: any): void {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonStr, 'utf8');
  } catch (error) {
    console.error(`Error saving JSON to ${filePath}:`, error);
    throw error;
  }
}

/**
 * Ensure data directory exists
 */
export function ensureDataDir(): void {
  const dataDir = './data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}
