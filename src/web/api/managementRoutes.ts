import { Router, Request, Response, NextFunction } from 'express';
import { Client } from 'discord.js';
import { timingSafeEqual } from 'crypto';
import { getModuleLoader } from '../../index';
import {
  addAuditEntry,
  createBackup,
  getServerHealth,
  listBackups,
  loadManagementState,
  setGuildSetting,
  setScheduledTask,
} from '../../utils/managementService';

function safeEqual(value: string | undefined, expected: string) {
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function requireDashboardAdmin(req: Request, res: Response, next: NextFunction) {
  const password = req.headers['x-admin-password'] as string | undefined
    ?? req.body?.adminPassword;
  const valid = process.env.ADMIN_PASSWORD || process.env.DASHBOARD_PASSWORD;
  if (!valid || !safeEqual(password, valid)) {
    res.status(403).json({ success: false, error: 'Unauthorized' });
    return;
  }
  next();
}

export function createManagementRoutes(client: Client): Router {
  const router = Router();

  router.get('/management/health', (req, res) => {
    res.json({ success: true, health: getServerHealth(client) });
  });

  router.get('/management/modules', (req, res) => {
    const loader = getModuleLoader();
    const modules = loader
      ? Array.from(loader.getLoadedModules().entries()).map(([name, loaded]) => ({
          name,
          version: loaded.metadata?.version ?? '1.0.0',
          description: loaded.metadata?.description ?? '',
          enabled: loaded.metadata?.enabled !== false,
          loadTime: loaded.loadTime,
        }))
      : [];
    res.json({ success: true, modules: modules.sort((a, b) => a.name.localeCompare(b.name)) });
  });

  router.post('/management/modules/:name/:action', requireDashboardAdmin, async (req, res) => {
    const loader = getModuleLoader();
    const name = routeParam(req.params.name);
    const action = routeParam(req.params.action);
    let success = false;
    try {
      if (!loader) throw new Error('Module loader chưa sẵn sàng');
      if (action === 'reload') success = !!await loader.reloadModule(name);
      else if (action === 'unload') success = await loader.unloadModule(name);
      else if (action === 'load') success = !!await loader.loadModule(name);
      else return res.status(400).json({ success: false, error: 'Invalid action' });
      addAuditEntry({
        userId: req.ip,
        action: `module.${action}`,
        details: { module: name, success },
        source: 'dashboard',
      });
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message ?? 'Module action failed' });
    }
  });

  router.get('/management/commands', (req, res) => {
    const commands = Array.from(client.commands.keys()).sort();
    res.json({ success: true, commands, count: commands.length });
  });

  router.get('/management/settings/:guildId', (req, res) => {
    const state = loadManagementState();
    const guildId = routeParam(req.params.guildId);
    res.json({
      success: true,
      settings: state.guildSettings[guildId] ?? {},
    });
  });

  router.post('/management/settings/:guildId', requireDashboardAdmin, (req, res) => {
    const guildId = routeParam(req.params.guildId);
    const entries = Object.entries(req.body?.settings ?? {});
    if (entries.length > 50) {
      return res.status(400).json({ success: false, error: 'Too many settings' });
    }
    for (const [key, value] of entries) {
      if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(key)) continue;
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
      if (typeof value === 'string' && value.length > 500) continue;
      setGuildSetting(guildId, key, value);
    }
    addAuditEntry({
      guildId,
      action: 'guild.settings.updated',
      details: { keys: entries.map(([key]) => key) },
      source: 'dashboard',
    });
    res.json({ success: true });
  });

  router.get('/management/audit', (req, res) => {
    const state = loadManagementState();
    const guildId = Array.isArray(req.query.guildId) ? req.query.guildId[0] : req.query.guildId;
    const guildIdFilter = typeof guildId === 'string' ? guildId : undefined;
    const entries = state.audit
      .filter((entry) => !guildIdFilter || entry.guildId === guildIdFilter)
      .slice(0, 100);
    res.json({ success: true, entries });
  });

  router.get('/management/backups', (req, res) => {
    res.json({ success: true, backups: listBackups() });
  });

  router.post('/management/backups', requireDashboardAdmin, (req, res) => {
    const folder = createBackup(req.body?.label ?? 'dashboard');
    addAuditEntry({
      action: 'backup.created',
      details: { backup: folder },
      source: 'dashboard',
    });
    res.json({ success: true, backup: folder });
  });

  router.get('/management/schedules', (req, res) => {
    res.json({ success: true, schedules: loadManagementState().schedules });
  });

  router.post('/management/schedules/:taskId', requireDashboardAdmin, (req, res) => {
    const taskId = routeParam(req.params.taskId);
    const minutes = Number(req.body?.minutes);
    const action = String(req.body?.action ?? '');
    const enabled = req.body?.enabled !== false;
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 10080 || !action) {
      return res.status(400).json({ success: false, error: 'Invalid schedule' });
    }
    setScheduledTask(taskId, minutes, action, enabled, async () => {
      if (action === 'backup') createBackup(taskId);
    });
    addAuditEntry({
      action: 'schedule.updated',
      details: { taskId, action, minutes, enabled },
      source: 'dashboard',
    });
    res.json({ success: true, taskId });
  });

  return router;
}
