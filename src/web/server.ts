import express from 'express';
import path from 'path';
import { Client } from 'discord.js';
import { createDashboardRoutes } from './api/dashboardRoutes';

export function startWebServer(client: Client, port: number = 3000) {
  const app = express();

  // Middleware - CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Dashboard API Routes
  try {
    const dashboardRouter = createDashboardRoutes(client);
    app.use('/api', dashboardRouter);
    console.log('✅ Dashboard routes mounted successfully');
  } catch (error) {
    console.error('❌ Error mounting dashboard routes:', error);
  }

  // Auth Routes (Discord OAuth)
  try {
    const authRoutes = require('./api/authRoutes').default;
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes mounted successfully');
  } catch (error) {
    console.error('❌ Error mounting auth routes:', error);
  }

  // Static files
  app.use(express.static(path.join(__dirname, '../../public')));

  // Basic status endpoint
  app.get('/api/status', (req, res) => {
    const isOnline = client.ws.status === 0;
    res.json({
      online: isOnline,
      status: isOnline ? 'online' : 'offline',
      ping: Math.round(client.ws.ping),
      uptime: Math.floor(process.uptime()),
      guilds: client.guilds.cache.size,
      users: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
      timestamp: Date.now()
    });
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Web server running on http://localhost:${port}`);
  });
}
