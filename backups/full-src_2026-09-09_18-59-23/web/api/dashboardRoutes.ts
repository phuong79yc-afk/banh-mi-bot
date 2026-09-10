import { Router, Request, Response } from 'express';
import { Client } from 'discord.js';
import { useQueue } from 'discord-player';

export function createDashboardRoutes(client: Client): Router {
  const router = Router();

  // ========================================
  // AUTHENTICATION ROUTES
  // ========================================
  
  // Login - Simple auth for dashboard
  router.post('/auth/login', (req: Request, res: Response) => {
    const { username, password, remember } = req.body;

    // Simple hardcoded auth (you can enhance this later)
    const validUsers = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'user', password: 'user123', role: 'user' }
    ];

    const user = validUsers.find(u => u.username === username && u.password === password);

    if (user) {
      // Generate simple token (in production, use JWT)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      res.json({
        success: true,
        token,
        role: user.role,
        username: user.username,
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
  // STATISTICS & ANALYTICS ROUTES
  // ========================================

  // Get analytics data
  router.get('/stats/analytics', (req: Request, res: Response) => {
    const totalServers = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    // Mock data - In production, fetch from database
    const analytics = {
      totalCommands: Math.floor(Math.random() * 10000) + 5000,
      commandsTrend: '+12.5%',
      songsPlayed: Math.floor(Math.random() * 3000) + 1000,
      songsTrend: '+8.3%',
      activeUsers: Math.floor(totalUsers * 0.3),
      usersTrend: '+15.2%',
      totalServers: totalServers,
      serversTrend: '+24.6%',
      
      // Server growth over months
      serverGrowth: [
        { month: 'Jan', servers: Math.floor(totalServers * 0.4), users: Math.floor(totalUsers * 0.4) },
        { month: 'Feb', servers: Math.floor(totalServers * 0.5), users: Math.floor(totalUsers * 0.5) },
        { month: 'Mar', servers: Math.floor(totalServers * 0.6), users: Math.floor(totalUsers * 0.6) },
        { month: 'Apr', servers: Math.floor(totalServers * 0.7), users: Math.floor(totalUsers * 0.7) },
        { month: 'May', servers: Math.floor(totalServers * 0.85), users: Math.floor(totalUsers * 0.85) },
        { month: 'Jun', servers: totalServers, users: totalUsers },
      ],
      
      // Command usage
      commandUsage: [
        { name: 'play', count: 3420 },
        { name: 'skip', count: 2180 },
        { name: 'queue', count: 1890 },
        { name: 'pause', count: 1520 },
        { name: 'help', count: 980 },
        { name: 'stats', count: 750 },
      ],
      
      // Activity by hour
      activityByHour: [
        { hour: '00:00', commands: 12 },
        { hour: '03:00', commands: 8 },
        { hour: '06:00', commands: 15 },
        { hour: '09:00', commands: 45 },
        { hour: '12:00', commands: 78 },
        { hour: '15:00', commands: 92 },
        { hour: '18:00', commands: 125 },
        { hour: '21:00', commands: 98 },
      ],
      
      // Top servers
      topServers: Array.from(client.guilds.cache.values())
        .sort((a, b) => b.memberCount - a.memberCount)
        .slice(0, 5)
        .map((guild, index) => ({
          name: guild.name,
          members: guild.memberCount,
          commands: Math.floor(Math.random() * 3000) + 500
        }))
    };

    res.json(analytics);
  });

  // ========================================
  // BOT STATUS & STATS ROUTES
  // ========================================

  // Bot Status - Live stats for BotStatusWidget
  router.get('/bot/status', (req: Request, res: Response) => {
    const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const cpuUsage = Math.round(process.cpuUsage().user / 1000000); // Convert to percentage estimate
    
    res.json({
      status: client.isReady() ? 'online' : 'offline',
      memory: memoryUsage,
      cpu: Math.min(cpuUsage % 100, 100), // Cap at 100%
      ping: Math.round(client.ws.ping)
    });
  });

  // Music Control - For BotControlWidget
  router.post('/music/pause', (req: Request, res: Response) => {
    // Get first active guild with music
    const activeGuild = client.guilds.cache.find(guild => {
      const queue = useQueue(guild.id);
      return queue && queue.currentTrack;
    });

    if (!activeGuild) {
      return res.status(404).json({
        success: false,
        message: 'No active music session'
      });
    }

    const queue = useQueue(activeGuild.id);
    if (queue) {
      queue.node.setPaused(true);
      res.json({ success: true, message: 'Paused' });
    } else {
      res.status(404).json({ success: false, message: 'No queue found' });
    }
  });

  router.post('/music/resume', (req: Request, res: Response) => {
    const activeGuild = client.guilds.cache.find(guild => {
      const queue = useQueue(guild.id);
      return queue && queue.currentTrack;
    });

    if (!activeGuild) {
      return res.status(404).json({
        success: false,
        message: 'No active music session'
      });
    }

    const queue = useQueue(activeGuild.id);
    if (queue) {
      queue.node.setPaused(false);
      res.json({ success: true, message: 'Resumed' });
    } else {
      res.status(404).json({ success: false, message: 'No queue found' });
    }
  });

  router.post('/music/skip', (req: Request, res: Response) => {
    const activeGuild = client.guilds.cache.find(guild => {
      const queue = useQueue(guild.id);
      return queue && queue.currentTrack;
    });

    if (!activeGuild) {
      return res.status(404).json({
        success: false,
        message: 'No active music session'
      });
    }

    const queue = useQueue(activeGuild.id);
    if (queue && queue.tracks.size > 0) {
      queue.node.skip();
      res.json({ success: true, message: 'Skipped' });
    } else {
      res.status(400).json({ success: false, message: 'No next track in queue' });
    }
  });

  router.post('/music/volume', (req: Request, res: Response) => {
    const { volume } = req.body;

    if (typeof volume !== 'number' || volume < 0 || volume > 100) {
      return res.status(400).json({
        success: false,
        message: 'Volume must be between 0 and 100'
      });
    }

    const activeGuild = client.guilds.cache.find(guild => {
      const queue = useQueue(guild.id);
      return queue && queue.currentTrack;
    });

    if (!activeGuild) {
      return res.status(404).json({
        success: false,
        message: 'No active music session'
      });
    }

    const queue = useQueue(activeGuild.id);
    if (queue) {
      queue.node.setVolume(volume);
      res.json({ success: true, volume });
    } else {
      res.status(404).json({ success: false, message: 'No queue found' });
    }
  });

  // Music Queue - For QueueWidget and MusicPlayer
  router.get('/music/current', (req: Request, res: Response) => {
    // Helper function to upgrade YouTube thumbnail
    const getHDThumbnail = (thumbnail: string) => {
      if (!thumbnail) return thumbnail;
      return thumbnail
        .replace('/default.jpg', '/sddefault.jpg')
        .replace('/mqdefault.jpg', '/sddefault.jpg')
        .replace('/hqdefault.jpg', '/sddefault.jpg')
        .replace('/maxresdefault.jpg', '/sddefault.jpg');
    };

    const guilds: any[] = [];

    client.guilds.cache.forEach(guild => {
      const queue = useQueue(guild.id);
      if (queue && queue.currentTrack) {
        const current = queue.currentTrack;
        const tracks = queue.tracks.toArray();

        guilds.push({
          guildId: guild.id,
          guildName: guild.name,
          track: {
            title: current.title,
            author: current.author,
            url: current.url,
            thumbnail: getHDThumbnail(current.thumbnail),
            duration: current.duration,
            durationFormatted: current.duration
          },
          queue: {
            size: tracks.length,
            tracks: tracks.map((track) => ({
              title: track.title,
              author: track.author,
              duration: track.duration,
              thumbnail: getHDThumbnail(track.thumbnail)
            }))
          },
          status: {
            isPaused: queue.node.isPaused(),
            volume: queue.node.volume,
            currentTime: '0:00',
            totalTime: current.duration,
            progress: 0,
            loop: queue.repeatMode === 0 ? 'off' : queue.repeatMode === 1 ? 'track' : 'queue'
          },
          voiceChannel: {
            name: guild.members.cache.get(client.user?.id || '')?.voice?.channel?.name || 'Unknown',
            memberCount: guild.members.cache.get(client.user?.id || '')?.voice?.channel?.members.size || 0
          }
        });
      }
    });

    res.json({
      playing: guilds.length > 0,
      guilds
    });
  });

  // Music Queue - For QueueWidget
  router.get('/music/queue', (req: Request, res: Response) => {
    // Get first active guild with music
    const activeGuild = client.guilds.cache.find(guild => {
      const queue = useQueue(guild.id);
      return queue && queue.currentTrack;
    });

    if (!activeGuild) {
      return res.json({
        success: true,
        queue: [],
        current: null
      });
    }

    const queue = useQueue(activeGuild.id);
    if (!queue || !queue.currentTrack) {
      return res.json({
        success: true,
        queue: [],
        current: null
      });
    }

    const current = queue.currentTrack;
    const tracks = queue.tracks.toArray();

    // Helper function to upgrade YouTube thumbnail to best available quality
    const getHDThumbnail = (thumbnail: string) => {
      if (!thumbnail) return thumbnail;
      
      // Use sddefault (640x480) - this is more reliable than maxresdefault
      // maxresdefault only exists for HD videos
      return thumbnail
        .replace('/default.jpg', '/sddefault.jpg')
        .replace('/mqdefault.jpg', '/sddefault.jpg')
        .replace('/hqdefault.jpg', '/sddefault.jpg')
        .replace('/maxresdefault.jpg', '/sddefault.jpg');
    };

    const queueData = [
      {
        id: 'current',
        title: current.title,
        artist: current.author,
        duration: current.raw.duration || '0:00',
        thumbnail: getHDThumbnail(current.thumbnail)
      },
      ...tracks.map((track, index) => ({
        id: `track-${index}`,
        title: track.title,
        artist: track.author,
        duration: track.raw.duration || '0:00',
        thumbnail: getHDThumbnail(track.thumbnail)
      }))
    ];

    res.json({
      success: true,
      queue: queueData
    });
  });

  // Remove from queue
  router.delete('/music/queue/:songId', (req: Request, res: Response) => {
    const { songId } = req.params;
    
    // Ensure songId is a string
    if (typeof songId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid song ID'
      });
    }
    
    // Extract index from songId (format: "track-0", "track-1", etc.)
    const match = songId.match(/track-(\d+)/);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Invalid song ID format'
      });
    }

    const trackIndex = parseInt(match[1]);

    const activeGuild = client.guilds.cache.find(guild => {
      const queue = useQueue(guild.id);
      return queue && queue.currentTrack;
    });

    if (!activeGuild) {
      return res.status(404).json({
        success: false,
        message: 'No active music session'
      });
    }

    const queue = useQueue(activeGuild.id);
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'No queue found'
      });
    }

    try {
      queue.node.remove(trackIndex);
      res.json({ success: true, message: 'Track removed' });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to remove track'
      });
    }
  });

  // Clear queue
  router.delete('/music/queue', (req: Request, res: Response) => {
    const activeGuild = client.guilds.cache.find(guild => {
      const queue = useQueue(guild.id);
      return queue && queue.currentTrack;
    });

    if (!activeGuild) {
      return res.status(404).json({
        success: false,
        message: 'No active music session'
      });
    }

    const queue = useQueue(activeGuild.id);
    if (queue) {
      queue.tracks.clear();
      res.json({ success: true, message: 'Queue cleared' });
    } else {
      res.status(404).json({ success: false, message: 'No queue found' });
    }
  });

  // Enhanced bot stats with current song
  router.get('/bot/stats/enhanced', (req: Request, res: Response) => {
    const totalServers = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const uptime = Math.floor(process.uptime());
    const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const commands = client.application?.commands.cache.size || 42;

    // Helper function to upgrade YouTube thumbnail to best available quality
    const getHDThumbnail = (thumbnail: string) => {
      if (!thumbnail) return thumbnail;
      return thumbnail
        .replace('/default.jpg', '/sddefault.jpg')
        .replace('/mqdefault.jpg', '/sddefault.jpg')
        .replace('/hqdefault.jpg', '/sddefault.jpg')
        .replace('/maxresdefault.jpg', '/sddefault.jpg');
    };

    // Get current playing song
    let currentSong = undefined;
    let isPlaying = false;
    let volume = 50;

    const activeGuild = client.guilds.cache.find(guild => {
      const queue = useQueue(guild.id);
      return queue && queue.currentTrack;
    });

    if (activeGuild) {
      const queue = useQueue(activeGuild.id);
      if (queue && queue.currentTrack) {
        const track = queue.currentTrack;
        currentSong = {
          title: track.title,
          artist: track.author,
          thumbnail: getHDThumbnail(track.thumbnail)
        };
        isPlaying = !queue.node.isPaused();
        volume = queue.node.volume;
      }
    }

    res.json({
      botName: client.user?.username || 'Bot',
      avatarUrl: client.user?.displayAvatarURL({ size: 256 }),
      servers: totalServers,
      users: totalUsers,
      commands: commands,
      uptime: uptime,
      memory: memoryUsage,
      ping: Math.round(client.ws.ping),
      inviteUrl: `https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands`,
      currentSong,
      isPlaying,
      volume
    });
  });

  // Get all commands list
  router.get('/commands', (req: Request, res: Response) => {
    try {
      // Try to get commands from client cache
      let commandsList = client.application?.commands.cache.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        category: getCategoryFromName(cmd.name),
        usage: `/${cmd.name}`,
      })) || [];

      // If cache is empty, return static command list
      if (commandsList.length === 0) {
        commandsList = getStaticCommandsList();
      }

      res.json({
        success: true,
        commands: commandsList,
        count: commandsList.length
      });
    } catch (error) {
      // Fallback to static commands on error
      const commandsList = getStaticCommandsList();
      res.json({
        success: true,
        commands: commandsList,
        count: commandsList.length
      });
    }
  });

  // ========================================
  // MUSIC LIBRARY ROUTES
  // ========================================

  // ========================================
  // PIN/UNPIN SONGS
  // ========================================
  
  // Get pinned songs
  router.get('/music/pinned', (req: Request, res: Response) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const pinnedPath = path.join(process.cwd(), 'data', 'pinned-songs.json');
      
      if (!fs.existsSync(pinnedPath)) {
        return res.json({ success: true, pinnedIds: [] });
      }

      const pinnedData = JSON.parse(fs.readFileSync(pinnedPath, 'utf-8'));
      res.json({ success: true, pinnedIds: pinnedData.pinnedIds || [] });
    } catch (error) {
      console.error('Error fetching pinned songs:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch pinned songs' });
    }
  });

  // Toggle pin status
  router.post('/music/pin', (req: Request, res: Response) => {
    try {
      const { songId } = req.body;
      
      if (!songId) {
        return res.status(400).json({ success: false, message: 'Song ID required' });
      }

      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      const pinnedPath = path.join(dataDir, 'pinned-songs.json');
      
      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Read current pinned songs
      let pinnedData = { pinnedIds: [] as string[] };
      if (fs.existsSync(pinnedPath)) {
        pinnedData = JSON.parse(fs.readFileSync(pinnedPath, 'utf-8'));
      }

      // Toggle pin status
      const index = pinnedData.pinnedIds.indexOf(songId);
      if (index > -1) {
        // Unpin
        pinnedData.pinnedIds.splice(index, 1);
      } else {
        // Pin
        pinnedData.pinnedIds.push(songId);
      }

      // Save to file
      fs.writeFileSync(pinnedPath, JSON.stringify(pinnedData, null, 2));

      res.json({ 
        success: true, 
        pinned: index === -1,
        pinnedIds: pinnedData.pinnedIds 
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      res.status(500).json({ success: false, message: 'Failed to toggle pin' });
    }
  });

  // ========================================
  // MUSIC LIBRARY & SEARCH
  // ========================================

  // Cache for library data
  let libraryCache: { data: any; timestamp: number } | null = null;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Get music library - using iTunes API (free, no auth required)
  router.get('/music/library', async (req: Request, res: Response) => {
    try {
      // Check cache first
      if (libraryCache && (Date.now() - libraryCache.timestamp) < CACHE_DURATION) {
        console.log('📦 Serving from cache');
        return res.json(libraryCache.data);
      }

      const axios = require('axios');
      
      // Vietnamese artists
      const vnArtists = [
        'Sơn Tùng M-TP', 'Jack', 'Erik', 'Đen Vâu', 'Hương Tràm',
        'Mỹ Tâm', 'Noo Phước Thịnh', 'Bích Phương', 'Min', 'Chi Pu',
        'Đức Phúc', 'Hoàng Thùy Linh', 'Hòa Minzy', 'Amee', 'Hiền Hồ',
        'Hương Ly', 'Justatee', 'Văn Mai Hương'
      ];

      // International artists  
      const intArtists = [
        'The Weeknd', 'Ed Sheeran', 'Harry Styles', 'Taylor Swift', 'Ariana Grande',
        'Bruno Mars', 'Dua Lipa', 'Post Malone', 'Billie Eilish', 'Shawn Mendes'
      ];

      const songs: any[] = [];
      
      console.log('🔍 Fetching songs from iTunes API...');

      // Fetch VN songs - 5 songs per artist
      for (const artist of vnArtists) {
        try {
          const response = await axios.get(`https://itunes.apple.com/search`, {
            params: {
              term: artist,
              country: 'VN',
              entity: 'song',
              limit: 5
            },
            timeout: 5000
          });
          
          if (response.data.results) {
            response.data.results.forEach((track: any, index: number) => {
              let thumbnail = track.artworkUrl100 || track.artworkUrl60 || '';
              if (thumbnail) {
                thumbnail = thumbnail.replace('100x100', '1200x1200').replace('60x60', '1200x1200');
              }
              
              songs.push({
                id: `vn-${artist}-${index}`,
                title: track.trackName,
                artist: track.artistName,
                album: track.collectionName,
                duration: formatDuration(track.trackTimeMillis),
                thumbnail: thumbnail,
                url: `${track.artistName} - ${track.trackName}`,
                plays: Math.floor(Math.random() * 20000) + 5000
              });
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err: any) {
          console.log(`Failed to fetch ${artist}:`, err.message || err);
        }
      }
      
      // Fetch International songs - 4 songs per artist
      for (const artist of intArtists) {
        try {
          const response = await axios.get(`https://itunes.apple.com/search`, {
            params: {
              term: artist,
              country: 'US',
              entity: 'song',
              limit: 4
            },
            timeout: 5000
          });
          
          if (response.data.results) {
            response.data.results.forEach((track: any, index: number) => {
              let thumbnail = track.artworkUrl100 || track.artworkUrl60 || '';
              if (thumbnail) {
                thumbnail = thumbnail.replace('100x100', '1200x1200').replace('60x60', '1200x1200');
              }
              
              songs.push({
                id: `int-${artist}-${index}`,
                title: track.trackName,
                artist: track.artistName,
                album: track.collectionName,
                duration: formatDuration(track.trackTimeMillis),
                thumbnail: thumbnail,
                url: `${track.artistName} - ${track.trackName}`,
                plays: Math.floor(Math.random() * 15000) + 3000
              });
            });
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err: any) {
          console.log(`Failed to fetch ${artist}:`, err.message || err);
        }
      }

      console.log(`✅ Fetched ${songs.length} songs from iTunes`);

      // Add 6 popular Vietnamese songs (using search queries)
      const popularSongs = [
        {
          id: 'vn-popular-1',
          title: 'Hơn Cả Nắm Tay',
          artist: 'Harmonie ft. Thế Anh Shinichi',
          album: 'V-Pop',
          duration: '3:45',
          thumbnail: 'https://i.ytimg.com/vi/Us6Ictt9oCI/sddefault.jpg',
          url: 'Harmonie Thế Anh Shinichi Hơn Cả Nắm Tay',
          plays: 32000
        },
        {
          id: 'vn-popular-2',
          title: 'Tìm Em',
          artist: 'Hngle ft. Bảo Anh',
          album: 'V-Pop',
          duration: '4:15',
          thumbnail: 'https://i.ytimg.com/vi/gJAbDSse5WM/sddefault.jpg',
          url: 'Hngle Bảo Anh Tìm Em',
          plays: 28500
        },
        {
          id: 'vn-popular-3',
          title: 'Để Dành Khi Thức Giấc',
          artist: 'SIVAN',
          album: 'V-Pop',
          duration: '4:00',
          thumbnail: 'https://i.ytimg.com/vi/S6x-p6Vfyew/sddefault.jpg',
          url: 'SIVAN Để Dành Khi Thức Giấc',
          plays: 25000
        },
        {
          id: 'vn-popular-4',
          title: 'Bài Này Dành Tặng Em',
          artist: 'Tài Nguyễnn',
          album: 'V-Pop',
          duration: '3:30',
          thumbnail: 'https://i.ytimg.com/vi/ZmJ0DqGCLhE/sddefault.jpg',
          url: 'Tài Nguyễnn Bài Này Dành Tặng Em',
          plays: 22000
        },
        {
          id: 'vn-popular-5',
          title: 'shhhh',
          artist: 'tlinh',
          album: 'V-Pop',
          duration: '3:15',
          thumbnail: 'https://i.ytimg.com/vi/Pys2iOT9rpw/sddefault.jpg',
          url: 'tlinh shhhh',
          plays: 45000
        },
        {
          id: 'vn-popular-6',
          title: 'Giá Như',
          artist: 'Xoxad, EREN',
          album: 'V-Pop',
          duration: '3:50',
          thumbnail: 'https://i.ytimg.com/vi/0PDHNlqLtio/sddefault.jpg',
          url: 'Xoxad EREN Giá Như',
          plays: 38000
        }
      ];

      const finalSongs = [...popularSongs, ...songs];

      const playlists = [
        {
          id: 'playlist-1',
          name: 'Top V-Pop 2024',
          description: 'Những bài hát Việt hot nhất',
          trackCount: finalSongs.filter(s => vnArtists.some(a => s.artist.includes(a))).length,
          thumbnail: finalSongs.find(s => vnArtists.some(a => s.artist.includes(a)))?.thumbnail || '',
          tracks: finalSongs.filter(s => vnArtists.some(a => s.artist.includes(a))).slice(0, 20)
        },
        {
          id: 'playlist-2',
          name: 'International Hits',
          description: 'Top songs from around the world',
          trackCount: finalSongs.filter(s => intArtists.some(a => s.artist.includes(a))).length,
          thumbnail: finalSongs.find(s => intArtists.some(a => s.artist.includes(a)))?.thumbnail || '',
          tracks: finalSongs.filter(s => intArtists.some(a => s.artist.includes(a))).slice(0, 20)
        },
        {
          id: 'playlist-3',
          name: 'All Tracks',
          description: 'Complete music library',
          trackCount: finalSongs.length,
          thumbnail: finalSongs[0]?.thumbnail || '',
          tracks: finalSongs.slice(0, 50)
        }
      ];

      const responseData = {
        success: true,
        songs: finalSongs,
        playlists
      };

      // Cache the result
      libraryCache = {
        data: responseData,
        timestamp: Date.now()
      };

      res.json(responseData);

    } catch (error: any) {
      console.error('❌ Library fetch error:', error.message || error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to load library',
        songs: [],
        playlists: []
      });
    }
  });

  // Helper function to format duration
  function formatDuration(millis: number): string {
    if (!millis) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Search music (YouTube API simulation)
  router.get('/music/search', async (req: Request, res: Response) => {
    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    try {
      // Use discord-player's search functionality
      const { QueryType, useMainPlayer } = require('discord-player');
      const player = useMainPlayer();

      if (!player) {
        // Fallback to mock data if player not available
        return res.json({
          success: true,
          results: getMockSearchResults(query)
        });
      }

      const searchResult = await player.search(query, {
        requestedBy: 'dashboard',
        searchEngine: QueryType.AUTO
      });

      if (!searchResult || !searchResult.tracks || searchResult.tracks.length === 0) {
        return res.json({
          success: true,
          results: []
        });
      }

      const results = searchResult.tracks.slice(0, 20).map((track: any) => ({
        id: track.url || `search-${Date.now()}-${Math.random()}`,
        title: track.title,
        artist: track.author,
        album: track.raw?.album || undefined,
        duration: track.duration,
        thumbnail: track.thumbnail,
        url: track.url,
        plays: Math.floor(Math.random() * 10000) + 1000
      }));

      res.json({
        success: true,
        results
      });
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to mock results on error
      res.json({
        success: true,
        results: getMockSearchResults(query)
      });
    }
  });

  // Music player control (loop, pause, skip, volume, etc.)
  router.post('/music/control/:guildId', async (req: Request, res: Response) => {
    const guildId = req.params.guildId as string;
    const { action, mode, trackIndex, volume } = req.body;

    console.log('🎛️ Control request:', { guildId, action, mode, trackIndex, volume });

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }

    try {
      const { useMainPlayer, QueueRepeatMode } = require('discord-player');
      const player = useMainPlayer();

      if (!player) {
        return res.status(500).json({
          success: false,
          message: 'Music player not initialized'
        });
      }

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return res.status(404).json({
          success: false,
          message: 'Guild not found'
        });
      }

      const queue = player.queues.get(guildId);
      if (!queue) {
        return res.status(404).json({
          success: false,
          message: 'No active queue in this server'
        });
      }

      switch (action) {
        case 'loop':
          if (mode === undefined) {
            return res.status(400).json({
              success: false,
              message: 'Loop mode is required'
            });
          }
          queue.setRepeatMode(mode);
          res.json({
            success: true,
            message: `Loop mode set to ${mode}`,
            repeatMode: mode
          });
          break;

        case 'pause':
          queue.node.setPaused(!queue.node.isPaused());
          res.json({
            success: true,
            message: queue.node.isPaused() ? 'Paused' : 'Resumed',
            paused: queue.node.isPaused()
          });
          break;

        case 'skip':
          queue.node.skip();
          res.json({
            success: true,
            message: 'Skipped to next track'
          });
          break;

        case 'jump':
          if (trackIndex === undefined) {
            return res.status(400).json({
              success: false,
              message: 'Track index is required'
            });
          }
          queue.node.jump(trackIndex);
          res.json({
            success: true,
            message: `Jumped to track ${trackIndex}`
          });
          break;

        case 'volume':
          if (volume === undefined) {
            return res.status(400).json({
              success: false,
              message: 'Volume is required'
            });
          }
          queue.node.setVolume(volume);
          res.json({
            success: true,
            message: `Volume set to ${volume}%`,
            volume
          });
          break;

        case 'shuffle':
          queue.tracks.shuffle();
          res.json({
            success: true,
            message: 'Queue shuffled'
          });
          break;

        case 'stop':
          queue.delete();
          res.json({
            success: true,
            message: 'Player stopped'
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            message: `Unknown action: ${action}`
          });
      }
    } catch (error: any) {
      console.error('❌ Control error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to control player: ' + (error.message || 'Unknown error')
      });
    }
  });

  // Play song from library (add to queue)
  router.post('/music/play', async (req: Request, res: Response) => {
    const { query, title, artist } = req.body;

    console.log('🎵 Play request:', { query, title, artist });

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    try {
      // Find first guild with bot in voice channel
      const activeGuild = client.guilds.cache.find(guild => {
        const botMember = guild.members.cache.get(client.user?.id || '');
        return botMember?.voice?.channel;
      });

      if (!activeGuild) {
        return res.status(404).json({
          success: false,
          message: 'Bot is not in any voice channel. Join a voice channel and use /play command in Discord first.'
        });
      }

      const { useMainPlayer } = require('discord-player');
      const player = useMainPlayer();

      if (!player) {
        return res.status(500).json({
          success: false,
          message: 'Music player not initialized'
        });
      }

      // Get bot's voice channel
      const botMember = activeGuild.members.cache.get(client.user?.id || '');
      const voiceChannel = botMember?.voice?.channel;

      if (!voiceChannel) {
        return res.status(404).json({
          success: false,
          message: 'Bot is not in a voice channel'
        });
      }

      // Use title + artist for search (works best with iTunes data)
      const searchQuery = title && artist ? `${artist} ${title}` : query;
      console.log('🔍 Searching:', searchQuery);

      // Play using search query
      const result = await player.play(voiceChannel, searchQuery, {
        nodeOptions: {
          metadata: {
            channel: voiceChannel,
            client: client,
            requestedBy: 'dashboard'
          },
          volume: 100,
          leaveOnEnd: false,
          leaveOnStop: false,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 60_000
        },
        requestedBy: 'dashboard'
      });

      console.log('✅ Found:', result.track.title);
      console.log('▶️', result.track.title);

      res.json({
        success: true,
        message: `Added "${result.track.title}" to queue`,
        track: {
          title: result.track.title,
          artist: result.track.author
        }
      });
    } catch (error: any) {
      console.error('❌ Play error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to play track: ' + (error.message || 'Unknown error')
      });
    }
  });

  // ========================================
  // DATA MANAGEMENT ROUTES
  // ========================================

  // Get all users
  router.get('/data/users', (req: Request, res: Response) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const usersPath = path.join(process.cwd(), 'data', 'users.json');
      
      if (!fs.existsSync(usersPath)) {
        return res.json([]);
      }

      const usersData: Record<string, any> = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      const users = Object.entries(usersData).map(([userId, data]: [string, any]) => ({
        userId,
        username: data.username || 'Unknown',
        balance: data.balance || 0,
        level: data.level || 1,
        xp: data.xp || 0,
        lastDaily: data.lastDaily || 'Never'
      }));

      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Update user
  router.put('/data/users/:userId', (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      const { username, balance, level, xp } = req.body;
      
      const fs = require('fs');
      const path = require('path');
      const usersPath = path.join(process.cwd(), 'data', 'users.json');
      
      if (!fs.existsSync(usersPath)) {
        return res.status(404).json({ message: 'Users file not found' });
      }

      const usersData: Record<string, any> = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      
      if (!usersData[userId]) {
        return res.status(404).json({ message: 'User not found' });
      }

      usersData[userId] = {
        ...usersData[userId],
        username: username || usersData[userId].username,
        balance: balance !== undefined ? balance : usersData[userId].balance,
        level: level !== undefined ? level : usersData[userId].level,
        xp: xp !== undefined ? xp : usersData[userId].xp,
      };

      fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
      res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Delete user
  router.delete('/data/users/:userId', (req: Request, res: Response) => {
    try {
      const userId = String(req.params.userId);
      
      const fs = require('fs');
      const path = require('path');
      const usersPath = path.join(process.cwd(), 'data', 'users.json');
      
      if (!fs.existsSync(usersPath)) {
        return res.status(404).json({ message: 'Users file not found' });
      }

      const usersData: Record<string, any> = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      
      if (!usersData[userId]) {
        return res.status(404).json({ message: 'User not found' });
      }

      delete usersData[userId];
      fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Get all lyrics
  router.get('/data/lyrics', (req: Request, res: Response) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const lyricsPath = path.join(process.cwd(), 'data', 'lyrics.json');
      
      if (!fs.existsSync(lyricsPath)) {
        return res.json([]);
      }

      const lyricsData: Record<string, any> = JSON.parse(fs.readFileSync(lyricsPath, 'utf-8'));
      const lyrics = Object.entries(lyricsData).map(([query, data]: [string, any]) => ({
        id: query,
        query: query,
        lyrics: data.lyrics || '',
        createdAt: data.createdAt || new Date().toISOString()
      }));

      res.json(lyrics);
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      res.status(500).json({ message: 'Failed to fetch lyrics' });
    }
  });

  // Add lyric
  router.post('/data/lyrics', (req: Request, res: Response) => {
    try {
      const { query, lyrics } = req.body;
      
      if (!query || !lyrics) {
        return res.status(400).json({ message: 'Query and lyrics are required' });
      }

      const fs = require('fs');
      const path = require('path');
      const lyricsPath = path.join(process.cwd(), 'data', 'lyrics.json');
      
      let lyricsData: Record<string, any> = {};
      if (fs.existsSync(lyricsPath)) {
        lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf-8'));
      }

      const queryKey = String(query).toLowerCase();
      lyricsData[queryKey] = {
        lyrics: lyrics,
        createdAt: new Date().toISOString()
      };

      fs.writeFileSync(lyricsPath, JSON.stringify(lyricsData, null, 2));
      res.json({ success: true, message: 'Lyric added successfully' });
    } catch (error) {
      console.error('Error adding lyric:', error);
      res.status(500).json({ message: 'Failed to add lyric' });
    }
  });

  // Delete lyric
  router.delete('/data/lyrics/:id', (req: Request, res: Response) => {
    try {
      const lyricId = String(req.params.id);
      
      const fs = require('fs');
      const path = require('path');
      const lyricsPath = path.join(process.cwd(), 'data', 'lyrics.json');
      
      if (!fs.existsSync(lyricsPath)) {
        return res.status(404).json({ message: 'Lyrics file not found' });
      }

      const lyricsData: Record<string, any> = JSON.parse(fs.readFileSync(lyricsPath, 'utf-8'));
      
      if (!lyricsData[lyricId]) {
        return res.status(404).json({ message: 'Lyric not found' });
      }

      delete lyricsData[lyricId];
      fs.writeFileSync(lyricsPath, JSON.stringify(lyricsData, null, 2));
      res.json({ success: true, message: 'Lyric deleted successfully' });
    } catch (error) {
      console.error('Error deleting lyric:', error);
      res.status(500).json({ message: 'Failed to delete lyric' });
    }
  });

  return router;
}

// Mock search results fallback
function getMockSearchResults(query: string) {
  const mockSongs = [
    {
      id: 'mock-1',
      title: `${query} - Official Music Video`,
      artist: 'Various Artists',
      duration: '3:45',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      url: `https://youtube.com/results?search_query=${encodeURIComponent(query)}`,
      plays: Math.floor(Math.random() * 5000) + 1000
    },
    {
      id: 'mock-2',
      title: `${query} (Lyrics)`,
      artist: 'Various Artists',
      duration: '3:12',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      url: `https://youtube.com/results?search_query=${encodeURIComponent(query)}+lyrics`,
      plays: Math.floor(Math.random() * 3000) + 500
    }
  ];
  
  return mockSongs;
}

// Static commands list fallback
function getStaticCommandsList() {
  return [
    // Music Commands (11)
    { name: 'play', description: 'Play a song from YouTube or search query', category: 'music', usage: '/play <song name or URL>' },
    { name: 'pause', description: 'Pause the current song', category: 'music', usage: '/pause' },
    { name: 'skip', description: 'Skip to the next song', category: 'music', usage: '/skip' },
    { name: 'stop', description: 'Stop playing and clear queue', category: 'music', usage: '/stop' },
    { name: 'queue', description: 'Show the current music queue', category: 'music', usage: '/queue' },
    { name: 'nowplaying', description: 'Show currently playing song', category: 'music', usage: '/nowplaying' },
    { name: 'volume', description: 'Set playback volume (0-100)', category: 'music', usage: '/volume <number>' },
    { name: 'loop', description: 'Toggle loop mode', category: 'music', usage: '/loop' },
    { name: 'shuffle', description: 'Shuffle the queue', category: 'music', usage: '/shuffle' },
    { name: 'lyrics', description: 'Get lyrics for current song', category: 'music', usage: '/lyrics' },
    
    // Moderation Commands (13)
    { name: 'kick', description: 'Kick a member from the server', category: 'moderation', usage: '/kick <user> [reason]' },
    { name: 'ban', description: 'Ban a member from the server', category: 'moderation', usage: '/ban <user> [reason]' },
    { name: 'unban', description: 'Unban a user from the server', category: 'moderation', usage: '/unban <user ID>' },
    { name: 'mute', description: 'Mute a member', category: 'moderation', usage: '/mute <user> [duration] [reason]' },
    { name: 'unmute', description: 'Unmute a member', category: 'moderation', usage: '/unmute <user>' },
    { name: 'warn', description: 'Warn a member', category: 'moderation', usage: '/warn <user> [reason]' },
    { name: 'warnings', description: 'View warnings for a user', category: 'moderation', usage: '/warnings <user>' },
    { name: 'clear', description: 'Clear messages in channel', category: 'moderation', usage: '/clear <amount>' },
    { name: 'purge', description: 'Purge messages from a user', category: 'moderation', usage: '/purge <user> [amount]' },
    { name: 'lock', description: 'Lock a channel', category: 'moderation', usage: '/lock [channel]' },
    { name: 'unlock', description: 'Unlock a channel', category: 'moderation', usage: '/unlock [channel]' },
    { name: 'slowmode', description: 'Set slowmode delay', category: 'moderation', usage: '/slowmode <seconds>' },
    { name: 'timeout', description: 'Timeout a member', category: 'moderation', usage: '/timeout <user> <duration>' },
    { name: 'nuke', description: 'Delete and recreate channel', category: 'moderation', usage: '/nuke' },
    
    // Utility Commands (9)
    { name: 'help', description: 'Show all available commands', category: 'utility', usage: '/help [command]' },
    { name: 'ping', description: 'Check bot latency', category: 'utility', usage: '/ping' },
    { name: 'serverinfo', description: 'Show server information', category: 'utility', usage: '/serverinfo' },
    { name: 'userinfo', description: 'Show user information', category: 'utility', usage: '/userinfo [user]' },
    { name: 'avatar', description: 'Get user avatar', category: 'utility', usage: '/avatar [user]' },
    { name: 'stats', description: 'Show bot statistics', category: 'utility', usage: '/stats' },
    { name: 'uptime', description: 'Show bot uptime', category: 'utility', usage: '/uptime' },
    { name: 'invite', description: 'Get bot invite link', category: 'utility', usage: '/invite' },
    { name: 'support', description: 'Get support server link', category: 'utility', usage: '/support' },
    
    // Fun Commands (5)
    { name: '8ball', description: 'Ask the magic 8ball', category: 'fun', usage: '/8ball <question>' },
    { name: 'joke', description: 'Get a random joke', category: 'fun', usage: '/joke' },
    { name: 'meme', description: 'Get a random meme', category: 'fun', usage: '/meme' },
    { name: 'coinflip', description: 'Flip a coin', category: 'fun', usage: '/coinflip' },
    { name: 'roll', description: 'Roll a dice', category: 'fun', usage: '/roll [sides]' },
    
    // Economy Commands (4)
    { name: 'balance', description: 'Check your balance', category: 'economy', usage: '/balance [user]' },
    { name: 'daily', description: 'Claim daily reward', category: 'economy', usage: '/daily' },
    { name: 'shop', description: 'View the shop', category: 'economy', usage: '/shop' },
    { name: 'giveaway', description: 'Start a giveaway', category: 'economy', usage: '/giveaway <duration> <winners> <prize>' },
  ];
}

// Helper function to determine command category
function getCategoryFromName(name: string): string {
  const musicCommands = ['play', 'pause', 'resume', 'skip', 'stop', 'queue', 'nowplaying', 'volume', 'loop', 'shuffle', 'lyrics'];
  const modCommands = ['kick', 'ban', 'unban', 'mute', 'unmute', 'warn', 'warnings', 'clear', 'purge', 'lock', 'unlock', 'slowmode', 'timeout', 'nuke'];
  const funCommands = ['8ball', 'joke', 'meme', 'coinflip', 'roll'];
  const economyCommands = ['balance', 'daily', 'shop', 'giveaway'];
  
  if (musicCommands.includes(name)) return 'music';
  if (modCommands.includes(name)) return 'moderation';
  if (funCommands.includes(name)) return 'fun';
  if (economyCommands.includes(name)) return 'economy';
  return 'utility';
}
