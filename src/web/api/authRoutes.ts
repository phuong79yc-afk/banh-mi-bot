import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const DISCORD_CLIENT_ID = process.env.CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI = `${process.env.WEB_URL || 'http://localhost:5173'}/auth/callback`;

// Discord OAuth2 URLs
const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize';
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_API_URL = 'https://discord.com/api/v10';

// Route: Get Discord OAuth URL
router.get('/discord/url', (req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email guilds',
  });

  const authUrl = `${DISCORD_AUTH_URL}?${params.toString()}`;
  
  res.json({ url: authUrl });
});

// Route: Handle Discord OAuth callback
router.post('/discord/callback', async (req: Request, res: Response) => {
  const { code } = req.body;

  console.log('🔐 Discord callback received, code:', code ? `${code.substring(0, 10)}...` : 'MISSING');

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    console.log('📤 Exchanging code for access token...');
    
    // Exchange code for access token
    const tokenResponse = await axios.post(
      DISCORD_TOKEN_URL,
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('✅ Got access token');
    
    const { access_token, token_type } = tokenResponse.data;

    console.log('📤 Fetching user info from Discord...');
    
    // Get user info from Discord
    const userResponse = await axios.get(`${DISCORD_API_URL}/users/@me`, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    const discordUser = userResponse.data;
    console.log('✅ Got user info:', discordUser.username);

    // Check if user is admin (you can customize this logic)
    // For now, anyone can login, but you can check guild membership, roles, etc.
    const isAdmin = discordUser.id === process.env.OWNER_ID;
    console.log(`🔐 User role: ${isAdmin ? 'ADMIN' : 'USER'}`);

    // Create session token
    const sessionToken = Buffer.from(
      JSON.stringify({
        id: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar,
        email: discordUser.email,
        timestamp: Date.now(),
      })
    ).toString('base64');

    console.log('✅ Session created successfully');

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${Number(discordUser.discriminator || '0') % 5}.png`,
        email: discordUser.email,
        role: isAdmin ? 'admin' : 'user',
      },
    });
  } catch (error: any) {
    console.error('❌ Discord OAuth error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to authenticate with Discord',
      details: error.response?.data || error.message,
    });
  }
});

// Route: Verify session token
router.post('/verify', (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const userData = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - userData.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > maxAge) {
      return res.status(401).json({ error: 'Token expired' });
    }

    res.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
      },
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
