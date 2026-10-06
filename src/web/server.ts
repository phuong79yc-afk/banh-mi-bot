import express from 'express';
import path from 'path';
import { Client } from 'discord.js';
import { createDashboardRoutes } from './api/dashboardRoutes';
import { createShopRoutes } from './api/shopRoutes';
import rateLimit from 'express-rate-limit';

export function startWebServer(client: Client, port: number = 3000) {
  // Check for required security credentials before starting
  const requiredCredentials = ['ADMIN_PASSWORD', 'JWT_SECRET', 'DASHBOARD_PASSWORD'];
  const missing = requiredCredentials.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Cannot start web server: Missing required credentials:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\nSet these in your .env file for security.');
    console.error('Web server startup aborted.\n');
    return; // Don't start the server
  }
  
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
  
  // Body size limits for security
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Rate limiting for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' }
  });
  
  app.use('/api/', apiLimiter);

  // Debug middleware - log all requests
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    next();
  });

  // ========================================
  // API ROUTES FIRST (before static files!)
  // ========================================

  // Shop Routes (more specific, mount BEFORE dashboard)
  try {
    const shopRouter = createShopRoutes(client);
    app.use('/api/shop', shopRouter);
    console.log('✅ Shop routes mounted successfully');
  } catch (error) {
    console.error('❌ Error mounting shop routes:', error);
  }

  // Dashboard API Routes (more general, mount AFTER specific routes)
  try {
    const dashboardRouter = createDashboardRoutes(client);
    app.use('/api', dashboardRouter);
    console.log('✅ Dashboard routes mounted successfully');
  } catch (error) {
    console.error('❌ Error mounting dashboard routes:', error);
  }

  // Auth Routes (Discord OAuth)
  try {
    const createAuthRoutes = require('./api/authRoutes').default;
    const authRoutes = createAuthRoutes(client);
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes mounted successfully');
  } catch (error) {
    console.error('❌ Error mounting auth routes:', error);
  }

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
  
  // Test endpoint - verify API routes work
  app.get('/api/test', (req, res) => {
    res.json({ 
      success: true, 
      message: 'API routes are working!',
      timestamp: Date.now() 
    });
  });

  // ========================================
  // STATIC FILES LAST (catches remaining requests)
  // ========================================
  
  // Static files - serve from dist/public folder (after build)
  // __dirname = dist/src/web/ after TypeScript compilation
  // So ../../public = dist/public
  const publicPath = path.join(__dirname, '../../public');
  app.use(express.static(publicPath));
  console.log(`📁 Serving static files from: ${publicPath}`);

  app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Web server running on http://localhost:${port}`);
  });
}
