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

  // ========================================
  // QUEST, SHOP & USER DATA ROUTES
  // ========================================
  
  // Get user coins (blue + gold)
  router.get('/user/:userId/coins', async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    try {
      const { getTursoDatabase } = await import('../../database/turso');
      const db = getTursoDatabase();
      
      // Get user data from database (balance = blue coins)
      const result = await db.execute({
        sql: 'SELECT balance, gold_balance FROM daily_users WHERE user_id = ?',
        args: [userId]
      });
      
      if (result.rows.length === 0) {
        return res.json({
          success: true,
          blueCoins: 0,
          goldCoins: 0,
          coins: 0 // legacy field
        });
      }
      
      const row = result.rows[0];
      const cols = result.columns;
      const balance = Number(row[cols.indexOf('balance')]) || 0;
      const goldBalance = Number(row[cols.indexOf('gold_balance')]) || 0;
      
      res.json({
        success: true,
        blueCoins: balance,
        goldCoins: goldBalance,
        coins: balance // legacy field for backward compatibility
      });
    } catch (error) {
      console.error('Error fetching coins:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch coins',
        blueCoins: 0,
        goldCoins: 0
      });
    }
  });
  
  // Get user inventory
  router.get('/user/:userId/inventory', (req: Request, res: Response) => {
    const { userId } = req.params;
    
    try {
      const fs = require('fs');
      const path = require('path');
      const inventoryPath = path.join(process.cwd(), 'data', 'inventory.json');
      
      if (!fs.existsSync(inventoryPath)) {
        return res.json({
          success: true,
          inventory: {}
        });
      }
      
      const data: any = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
      const uid = userId as string;
      const inventory = data[uid] || {};
      
      res.json({
        success: true,
        inventory: inventory
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inventory'
      });
    }
  });
  
  // Shop items endpoint removed - now handled by shopRoutes.ts at /api/shop/items
  
  // Get user quests
  router.get('/user/:userId/quests', (req: Request, res: Response) => {
    const { userId } = req.params;
    
    try {
      const fs = require('fs');
      const path = require('path');
      const questsPath = path.join(process.cwd(), 'data', 'quests.json');
      
      if (!fs.existsSync(questsPath)) {
        return res.json({
          success: true,
          daily: [],
          weekly: [],
          totalEarned: 0
        });
      }
      
      const data: any = JSON.parse(fs.readFileSync(questsPath, 'utf8'));
      const userData = data[userId as string] || {};
      
      // Define available quests
      const dailyQuests = [
        { id: 'msg_10', text: 'Gửi 10 tin nhắn', target: 10, reward: 100, type: 'message' },
        { id: 'msg_50', text: 'Gửi 50 tin nhắn', target: 50, reward: 500, type: 'message' },
        { id: 'shop_3', text: 'Dùng /shop 3 lần', target: 3, reward: 150, type: 'command' },
        { id: 'daily_1', text: 'Dùng /daily hôm nay', target: 1, reward: 200, type: 'command' }
      ];
      
      const weeklyQuests = [
        { id: 'msg_week', text: 'Gửi 200 tin nhắn trong tuần', target: 200, reward: 2000, type: 'message' },
        { id: 'shop_week', text: 'Dùng /shop 10 lần trong tuần', target: 10, reward: 1500, type: 'command' }
      ];
      
      // Get progress
      const dailyProg = userData.quests?.daily?.prog || {};
      const weeklProg = userData.quests?.weekly?.prog || {};
      const dailyClaimed = userData.quests?.daily?.claimed || {};
      const weeklyClaimed = userData.quests?.weekly?.claimed || {};
      
      const dailyWithProgress = dailyQuests.map(q => ({
        ...q,
        progress: dailyProg[q.id] || 0,
        claimed: dailyClaimed[q.id] || false,
        completed: (dailyProg[q.id] || 0) >= q.target
      }));
      
      const weeklyWithProgress = weeklyQuests.map(q => ({
        ...q,
        progress: weeklProg[q.id] || 0,
        claimed: weeklyClaimed[q.id] || false,
        completed: (weeklProg[q.id] || 0) >= q.target
      }));
      
      res.json({
        success: true,
        daily: dailyWithProgress,
        weekly: weeklyWithProgress,
        totalEarned: (userData.quests?.daily?.earned || 0) + (userData.quests?.weekly?.earned || 0)
      });
    } catch (error) {
      console.error('Error fetching quests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quests'
      });
    }
  });
  
  // Get user premium status
  router.get('/user/:userId/premium', (req: Request, res: Response) => {
    const { userId } = req.params;
    
    try {
      const fs = require('fs');
      const path = require('path');
      const premiumPath = path.join(process.cwd(), 'data', 'premium.json');
      
      if (!fs.existsSync(premiumPath)) {
        return res.json({
          success: true,
          isPremium: false,
          tier: 'free',
          expiresAt: null,
          benefits: []
        });
      }
      
      const data: any = JSON.parse(fs.readFileSync(premiumPath, 'utf8'));
      const uid = userId as string;
      const premiumData = data[uid];
      
      if (!premiumData) {
        return res.json({
          success: true,
          isPremium: false,
          tier: 'free',
          expiresAt: null,
          benefits: []
        });
      }
      
      // Check if premium expired
      const now = Date.now();
      const isPremium = premiumData.expiresAt ? premiumData.expiresAt > now : true;
      
      res.json({
        success: true,
        isPremium: isPremium,
        tier: isPremium ? (premiumData.tier || 'premium') : 'free',
        expiresAt: premiumData.expiresAt || null,
        benefits: isPremium ? (premiumData.benefits || []) : []
      });
    } catch (error) {
      console.error('Error fetching premium status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch premium status'
      });
    }
  });

  return router;
}
