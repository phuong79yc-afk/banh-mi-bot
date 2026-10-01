import { Router, Request, Response } from 'express';
import { Client } from 'discord.js';
import { getModuleLoader } from '../../index';

export function createDashboardRoutes(client: Client): Router {
  const router = Router();

  // ========================================
  // AUTHENTICATION ROUTES
  // ========================================
  
  // Login - Simple auth for dashboard
  router.post('/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;

    // Get credentials from env
    const validUsername = process.env.DASHBOARD_USERNAME || 'admin';
    const validPassword = process.env.DASHBOARD_PASSWORD || 'admin123';

    if (username === validUsername && password === validPassword) {
      // Generate simple token
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      res.json({
        success: true,
        token,
        role: 'admin',
        username: username,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
  });

  // Logout
  router.post('/auth/logout', (req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out' });
  });

  // ========================================
  // BOT STATUS & STATS ROUTES
  // ========================================

  // Bot Status - Live stats
  router.get('/bot/status', (req: Request, res: Response) => {
    const isOnline = client.ws.status === 0; // 0 = READY
    res.json({
      online: isOnline,
      status: client.ws.status === 0 ? 'online' : 'offline',
      ping: Math.round(client.ws.ping),
      uptime: Math.floor(process.uptime())
    });
  });

  // Enhanced bot stats
  router.get('/bot/stats/enhanced', (req: Request, res: Response) => {
    const totalServers = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const uptime = Math.floor(process.uptime());
    const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    // Count commands from modules (fallback to 74 if modules not loaded yet)
    let commandCount = 74; // Total commands from 16 modules
    const moduleLoader = getModuleLoader();
    if (moduleLoader) {
      const modules = moduleLoader.getLoadedModules();
      let actualCount = 0;
      modules.forEach((loadedModule: any) => {
        if (loadedModule.instance && loadedModule.instance.commands) {
          actualCount += loadedModule.instance.commands.size;
        }
      });
      if (actualCount > 0) {
        commandCount = actualCount;
      }
    }

    res.json({
      botName: client.user?.username || 'Bot',
      avatarUrl: client.user?.displayAvatarURL({ size: 256 }),
      servers: totalServers,
      users: totalUsers,
      commands: commandCount,
      uptime: uptime,
      memory: memoryUsage,
      ping: Math.round(client.ws.ping),
      inviteUrl: `https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands`
    });
  });

  // Get analytics data - minimal mock
  router.get('/stats/analytics', (req: Request, res: Response) => {
    const totalServers = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    const analytics = {
      totalCommands: 0,
      commandsTrend: '0%',
      songsPlayed: 0,
      songsTrend: '0%',
      activeUsers: 0,
      usersTrend: '0%',
      totalServers: totalServers,
      serversTrend: '0%',
      
      serverGrowth: [
        { month: 'Jan', servers: 0, users: 0 },
        { month: 'Feb', servers: 0, users: 0 },
        { month: 'Mar', servers: 0, users: 0 },
        { month: 'Apr', servers: 0, users: 0 },
        { month: 'May', servers: 0, users: 0 },
        { month: 'Jun', servers: totalServers, users: totalUsers },
      ],
      
      commandUsage: [],
      activityByHour: [],
      
      topServers: Array.from(client.guilds.cache.values())
        .sort((a, b) => b.memberCount - a.memberCount)
        .slice(0, 5)
        .map((guild) => ({
          name: guild.name,
          members: guild.memberCount,
          commands: 0
        }))
    };

    res.json(analytics);
  });

  // Get commands list
  router.get('/commands', (req: Request, res: Response) => {
    try {
      const commands: any[] = [];
      
      // Get module loader
      const moduleLoader = getModuleLoader();
      console.log('[Commands API] Module loader:', moduleLoader ? 'Found' : 'Not found');
      
      if (moduleLoader) {
        const modules = moduleLoader.getLoadedModules();
        console.log('[Commands API] Loaded modules count:', modules.size);
        
        modules.forEach((loadedModule: any, moduleName: string) => {
          if (loadedModule.instance && loadedModule.instance.commands) {
            console.log(`[Commands API] Module ${moduleName} has ${loadedModule.instance.commands.size} commands`);
            loadedModule.instance.commands.forEach((cmd: any, name: string) => {
              commands.push({
                name: name,
                description: cmd.data?.description || 'No description',
                category: loadedModule.metadata?.category || moduleName.replace('-module', ''),
                usage: `/${name}`,
                options: cmd.data?.options?.map((opt: any) => ({
                  name: opt.name,
                  description: opt.description,
                  required: opt.required || false,
                  type: opt.type
                })) || []
              });
            });
          }
        });
      }
      
      console.log('[Commands API] Total commands:', commands.length);
      
      res.json({
        success: true,
        commands: commands,
        count: commands.length,
        source: 'live'
      });
    } catch (error) {
      console.error('Error fetching commands:', error);
      res.status(500).json({
        success: false,
        commands: [],
        count: 0,
        error: 'Failed to fetch commands'
      });
    }
  });

  // Get notifications
  router.get('/notifications', (req: Request, res: Response) => {
    res.json({
      success: true,
      notifications: [],
      unreadCount: 0
    });
  });

  // Get maintenance status
  router.get('/maintenance/status', (req: Request, res: Response) => {
    res.json({
      maintenance: false,
      message: null
    });
  });

  return router;
}
