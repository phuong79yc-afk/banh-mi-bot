import fs from 'fs';
import path from 'path';
import os from 'os';
import process from 'process';

export interface AuditEntry {
  id: string;
  guildId?: string;
  userId?: string;
  action: string;
  details?: Record<string, unknown>;
  source: 'discord' | 'dashboard';
  createdAt: string;
}

export interface ManagementState {
  guildSettings: Record<string, Record<string, string | number | boolean>>;
  schedules: Record<string, { enabled: boolean; intervalMinutes: number; action: string }>;
  audit: AuditEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_PATH = path.join(DATA_DIR, 'management.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const scheduleTimers = new Map<string, NodeJS.Timeout>();

function ensureFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(STATE_PATH)) {
    fs.writeFileSync(STATE_PATH, JSON.stringify({
      guildSettings: {},
      schedules: {},
      audit: [],
    }, null, 2));
  }
}

export function loadManagementState(): ManagementState {
  ensureFiles();
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) as ManagementState;
  } catch {
    return { guildSettings: {}, schedules: {}, audit: [] };
  }
}

export function saveManagementState(state: ManagementState) {
  ensureFiles();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function addAuditEntry(entry: Omit<AuditEntry, 'id' | 'createdAt'>) {
  const state = loadManagementState();
  state.audit.unshift({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  state.audit = state.audit.slice(0, 500);
  saveManagementState(state);
}

export function setGuildSetting(guildId: string, key: string, value: string | number | boolean) {
  const state = loadManagementState();
  state.guildSettings[guildId] ??= {};
  state.guildSettings[guildId][key] = value;
  saveManagementState(state);
}

export function createBackup(label = 'manual'): string {
  ensureFiles();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const folder = path.join(BACKUP_DIR, `${stamp}-${label.replace(/[^a-z0-9-_]/gi, '_').slice(0, 40)}`);
  fs.mkdirSync(folder, { recursive: true });
  for (const name of fs.readdirSync(DATA_DIR)) {
    if (name === 'backups') continue;
    const source = path.join(DATA_DIR, name);
    const destination = path.join(folder, name);
    if (name === 'economy.json') continue;
    fs.cpSync(source, destination, { recursive: true });
  }
  return folder;
}

export function listBackups() {
  ensureFiles();
  return fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(BACKUP_DIR, entry.name),
      createdAt: fs.statSync(path.join(BACKUP_DIR, entry.name)).mtime.toISOString(),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getServerHealth(client: import('discord.js').Client) {
  const memory = process.memoryUsage();
  return {
    online: client.ws.status === 0,
    ping: client.ws.ping,
    uptimeSeconds: Math.floor(process.uptime()),
    guilds: client.guilds.cache.size,
    users: client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0),
    memoryMb: Math.round(memory.heapUsed / 1024 / 1024),
    platform: os.platform(),
  };
}

export function setScheduledTask(
  taskId: string,
  intervalMinutes: number,
  action: string,
  enabled = true,
  callback?: () => void | Promise<void>,
) {
  const state = loadManagementState();
  state.schedules[taskId] = { enabled, intervalMinutes, action };
  saveManagementState(state);
  const existing = scheduleTimers.get(taskId);
  if (existing) clearInterval(existing);
  if (!enabled || intervalMinutes < 1) return;
  const timer = setInterval(async () => {
    try {
      await callback?.();
      addAuditEntry({
        action: 'schedule.executed',
        details: { taskId, action },
        source: 'dashboard',
      });
    } catch (error: any) {
      addAuditEntry({
        action: 'schedule.failed',
        details: { taskId, action, error: error?.message },
        source: 'dashboard',
      });
    }
  }, intervalMinutes * 60_000);
  scheduleTimers.set(taskId, timer);
}
