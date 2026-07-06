import express, { Request, Response } from 'express';
import { Client } from 'discord.js';
import session from 'express-session';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { config } from 'dotenv';
import { renderLandingPage } from './landing';
import { renderTestPage } from './testPage';
import { renderBleedStyleLanding } from './landing-bleed';
import { renderExactBleedLanding } from './landing-exact';
import { renderFullBleedLanding } from './landing-full';
import { renderVieLanding } from './landing-vie';
import { renderIconsDemo } from './icons-demo';
import { renderIconsGuide } from './icons-guide';
import { renderDocsPage } from './docs-page';
import { renderSupportPage } from './support-page';
import { renderTermsPage } from './terms-page';
import { renderToS } from './tos';
import { renderPrivacy } from './privacy';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3001/auth/callback';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      avatar: string | null;
      email: string;
    };
    oauth_state?: string;
  }
}

let botClient: Client | null = null;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from public folder
app.use(session({
  secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

export function setClient(client: Client) {
  botClient = client;
}

// Get bot stats
function getBotStats() {
  if (!botClient) {
    return { servers: 0, users: 0, commands: 55 };
  }
  
  return {
    servers: botClient.guilds.cache.size,
    users: botClient.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
    commands: 55
  };
}


// Routes
app.get('/', (_req: Request, res: Response) => {
  const stats = getBotStats();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderVieLanding(botClient?.user?.username || 'Discord Bot', stats));
});

app.get('/bleed', (_req: Request, res: Response) => {
  const stats = getBotStats();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderExactBleedLanding(botClient?.user?.username || 'Discord Bot', stats));
});

app.get('/modern', (_req: Request, res: Response) => {
  const stats = getBotStats();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderVieLanding(botClient?.user?.username || 'Discord Bot', stats));
});

app.get('/icons', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderIconsDemo());
});

app.get('/icons-guide', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderIconsGuide());
});

app.get('/docs', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderDocsPage(botClient?.user?.username || 'Nyx Bot'));
});

app.get('/support', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderSupportPage(botClient?.user?.username || 'Discord Bot'));
});

app.get('/terms', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderToS());
});

app.get('/privacy', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderPrivacy());
});

app.get('/full', (_req: Request, res: Response) => {
  const stats = getBotStats();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderFullBleedLanding(botClient?.user?.username || 'Discord Bot', stats));
});

app.get('/simple', (_req: Request, res: Response) => {
  const stats = getBotStats();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderExactBleedLanding(botClient?.user?.username || 'Discord Bot', stats));
});

app.get('/old', (_req: Request, res: Response) => {
  const stats = getBotStats();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderLandingPage(botClient?.user?.username || 'Discord Bot', stats));
});

app.get('/test', (_req: Request, res: Response) => {
  const stats = getBotStats();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderTestPage(botClient?.user?.username || 'Discord Bot', stats));
});

app.get('/auth/discord', (_req: Request, res: Response) => {
  const state = randomBytes(16).toString('hex');
  _req.session.oauth_state = state;
  const scope = ['identify', 'email', 'guilds'];
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope.join('%20')}&state=${state}&prompt=consent`;
  res.redirect(discordAuthUrl);
});

app.get('/auth/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const sessionState = req.session.oauth_state;
  
  if (state !== sessionState) {
    res.status(403).send('Invalid state parameter');
    return;
  }
  
  if (!code || typeof code !== 'string') {
    res.status(400).send('No code provided');
    return;
  }
  
  try {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        scope: 'identify email guilds'
      },
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const user = userResponse.data;
    req.session.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      email: user.email
    };
    
    res.send('<html><body><h1>Login successful!</h1><p>You can close this window.</p></body></html>');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Failed to authenticate');
  }
});

app.get('/stats', (_req: Request, res: Response) => {
  const stats = getBotStats();
  const isReady = Boolean(botClient && botClient.user);
  
  res.json({
    name: botClient?.user?.username || 'Discord Bot',
    status: isReady ? 'online' : 'starting',
    uptime: botClient?.uptime ? Math.floor(botClient.uptime / 1000) : 0,
    ping: botClient?.ws?.ping ?? 0,
    servers: stats.servers,
    users: stats.users,
    commands: stats.commands
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Serve ticket transcripts
app.get('/transcripts/ticket-:ticketId', (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const transcriptPath = join(__dirname, '..', '..', 'transcripts', `ticket-${ticketId}.html`);
  
  if (!existsSync(transcriptPath)) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transcript Not Found</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #23272a;
            color: #dcddde;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: #2c2f33;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          h1 { color: #ed4245; margin: 0 0 1rem 0; }
          p { margin: 0.5rem 0; }
          a {
            color: #5865f2;
            text-decoration: none;
            font-weight: bold;
          }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Transcript Not Found</h1>
          <p>Ticket transcript <code>ticket-${ticketId}.html</code> không tồn tại.</p>
          <p><a href="/">← Về trang chủ</a></p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  
  try {
    const transcriptHtml = readFileSync(transcriptPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(transcriptHtml);
  } catch (error) {
    console.error('Error reading transcript:', error);
    res.status(500).send('Error loading transcript');
  }
});

// Start server
export function startWebServer() {
  app.listen(PORT, () => {
    console.log(`🌐 Web server running on http://localhost:${PORT}`);
  });
}
