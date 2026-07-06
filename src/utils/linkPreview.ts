import { Message, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import axios from 'axios';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createKetoStyleEmbed, TikTokData as KetoTikTokData } from './ketoEmbed';
import FormData from 'form-data';

interface LinkPreviewConfig {
  enabled: boolean;
  allowedChannels: string[];
  blockedChannels: string[];
  deleteOriginal: boolean;
  useCustomEmbed: boolean;
  tiktokService: 'tfxktok' | 'tiktokez' | 'tnktok'; // TikTok service selector
  downloadMethod: 'fast' | 'download'; // fast = fixed URL, download = download video
}

interface TikTokData extends KetoTikTokData {}

const configs = new Map<string, LinkPreviewConfig>();
const CONFIG_FILE = join(process.cwd(), 'data', 'linkpreview-config.json');

// Load configs from file on startup
function loadConfigs() {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf-8');
      const saved = JSON.parse(data);
      Object.entries(saved).forEach(([guildId, config]) => {
        configs.set(guildId, config as LinkPreviewConfig);
      });
      console.log(`✅ Loaded ${configs.size} link preview configs`);
    }
  } catch (error) {
    console.error('Failed to load link preview configs:', error);
  }
}

// Save configs to file
function saveConfigs() {
  try {
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      const { mkdirSync } = require('fs');
      mkdirSync(dataDir, { recursive: true });
    }
    
    const saved: Record<string, LinkPreviewConfig> = {};
    configs.forEach((config, guildId) => {
      saved[guildId] = config;
    });
    
    writeFileSync(CONFIG_FILE, JSON.stringify(saved, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save link preview configs:', error);
  }
}

// Load on module init
loadConfigs();

export function getLinkPreviewConfig(guildId: string): LinkPreviewConfig {
  if (!configs.has(guildId)) {
    configs.set(guildId, {
      enabled: false,
      allowedChannels: [],
      blockedChannels: [],
      deleteOriginal: false,
      useCustomEmbed: true,
      tiktokService: 'tfxktok', // Default service
      downloadMethod: 'download' // Default: download (Keto style)
    });
  }
  return configs.get(guildId)!;
}

export function setLinkPreviewConfig(guildId: string, config: Partial<LinkPreviewConfig>) {
  const current = getLinkPreviewConfig(guildId);
  configs.set(guildId, { ...current, ...config });
  saveConfigs();
}

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

// TikTok service options - try all 3 popular services
type TikTokService = 'tfxktok' | 'tiktokez' | 'tnktok';
const TIKTOK_SERVICES: Record<TikTokService, string> = {
  'tfxktok': 'tfxktok.com',    // fxTikTok - has buttons
  'tiktokez': 'tiktokez.com',  // EmbedEZ - clean video player
  'tnktok': 'tnktok.com'       // fxTikTok official - most stable
};

function getFixedEmbedUrl(url: string, service: TikTokService = 'tfxktok'): string | null {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname.includes('tiktok.com')) {
      const domain = TIKTOK_SERVICES[service];
      return url.replace(/tiktok\.com/g, domain);
    }
    
    if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
      return url.replace(/(?:twitter\.com|x\.com)/g, 'fxtwitter.com');
    }
    
    if (urlObj.hostname.includes('instagram.com')) {
      return url.replace(/instagram\.com/g, 'ddinstagram.com');
    }
    
    if (urlObj.hostname.includes('reddit.com')) {
      return url.replace(/reddit\.com/g, 'rxddit.com');
    }
    
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.includes('/shorts/')) {
      return url;
    }
    
    if (urlObj.hostname.includes('facebook.com') || urlObj.hostname.includes('fb.watch')) {
      return url;
    }
    
    return null;
  } catch {
    return null;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// SVG Icons for embed
const SVG_ICONS = {
  heart: '<:heart:1234567890>', // Replace with your custom emoji ID
  comment: '<:comment:1234567890>',
  share: '<:share:1234567890>',
  view: '<:view:1234567890>',
  music: '<:music:1234567890>',
  tiktok: '<:tiktok:1234567890>'
};

// Upload video to Imgur (has oEmbed support - Discord will auto-embed inline)
async function uploadToImgur(videoBuffer: Buffer): Promise<string | null> {
  try {
    console.log(`📤 Uploading to Imgur (${(videoBuffer.length / (1024 * 1024)).toFixed(2)}MB)...`);
    
    // Imgur API (anonymous upload)
    const formData = new FormData();
    formData.append('video', videoBuffer, {
      filename: `tiktok_${Date.now()}.mp4`,
      contentType: 'video/mp4'
    });
    formData.append('type', 'file');
    
    const response = await axios.post('https://api.imgur.com/3/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Client-ID 546c25a59c58ad7' // Anonymous Imgur client ID
      },
      timeout: 120000,
      maxContentLength: 200 * 1024 * 1024,
      maxBodyLength: 200 * 1024 * 1024
    });
    
    if (response.data && response.data.success && response.data.data) {
      const url = response.data.data.link;
      console.log(`✅ Uploaded to Imgur: ${url}`);
      return url;
    }
    
    console.error('❌ Imgur upload failed:', response.data);
    return null;
  } catch (error: any) {
    console.error('❌ Imgur upload error:', error.message);
    return null;
  }
}

// Upload video to Streamable.com (has oEmbed support - Discord will auto-embed inline)
async function uploadToStreamable(videoBuffer: Buffer, title: string): Promise<string | null> {
  try {
    console.log(`📤 Uploading to Streamable.com (${(videoBuffer.length / (1024 * 1024)).toFixed(2)}MB)...`);
    
    const formData = new FormData();
    formData.append('file', videoBuffer, {
      filename: `tiktok_${Date.now()}.mp4`,
      contentType: 'video/mp4'
    });
    formData.append('title', title.substring(0, 100));
    
    // Streamable API (anonymous upload)
    const response = await axios.post('https://api.streamable.com/upload', formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 120000, // 2 minutes for upload
      maxContentLength: 250 * 1024 * 1024,
      maxBodyLength: 250 * 1024 * 1024
    });
    
    if (response.data && response.data.shortcode) {
      const url = `https://streamable.com/${response.data.shortcode}`;
      console.log(`✅ Uploaded to Streamable: ${url}`);
      return url;
    }
    
    console.error('❌ Streamable upload failed:', response.data);
    return null;
  } catch (error: any) {
    console.error('❌ Streamable upload error:', error.message);
    return null;
  }
}

// Upload video to Catbox.moe (free anonymous hosting)
async function uploadToCatbox(videoBuffer: Buffer, fileName: string): Promise<string | null> {
  try {
    console.log(`📤 Uploading video to Catbox.moe (${(videoBuffer.length / (1024 * 1024)).toFixed(2)}MB)...`);
    
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', videoBuffer, fileName);
    
    const response = await axios.post('https://catbox.moe/user/api.php', formData, {
      headers: formData.getHeaders(),
      timeout: 60000, // 60s timeout
      maxContentLength: 200 * 1024 * 1024, // 200MB
      maxBodyLength: 200 * 1024 * 1024
    });
    
    const url = response.data.trim();
    
    if (url && url.startsWith('https://files.catbox.moe/')) {
      console.log(`✅ Uploaded to Catbox: ${url}`);
      return url;
    }
    
    console.error('❌ Catbox upload failed:', response.data);
    return null;
  } catch (error: any) {
    console.error('❌ Catbox upload error:', error.message);
    return null;
  }
}

// Download TikTok video using TikWM API (free, no watermark)
// Download TikTok video using TikWM API (free, no watermark)
async function downloadTikTokVideo(url: string): Promise<{ videoBuffer: Buffer; metadata: TikTokData } | null> {
  try {
    console.log(`🎬 Downloading TikTok video: ${url}`);
    
    // Try TikWM API first
    try {
      const apiUrl = `https://www.tikwm.com/api/`;
      const params = new URLSearchParams();
      params.append('url', url);
      params.append('hd', '1');
      
      const response = await axios.post(apiUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      if (response.data && response.data.code === 0 && response.data.data) {
        const data = response.data.data;
        const videoUrl = data.hdplay || data.play || data.wmplay;
        
        if (videoUrl) {
          console.log(`📥 Downloading video from TikWM: ${videoUrl}`);
          
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://www.tikwm.com/'
            },
            maxContentLength: 50 * 1024 * 1024,
            maxBodyLength: 50 * 1024 * 1024
          });

          const videoBuffer = Buffer.from(videoResponse.data);
          const fileSizeMB = videoBuffer.length / (1024 * 1024);
          
          console.log(`✅ Downloaded video: ${fileSizeMB.toFixed(2)}MB`);
          
          if (fileSizeMB > 25) {
            console.warn(`⚠️ Video too large: ${fileSizeMB.toFixed(2)}MB`);
            return null;
          }

          const metadata: TikTokData = {
            username: data.author?.unique_id || data.author?.nickname || 'Unknown',
            caption: data.title || 'TikTok Video',
            likes: data.digg_count || 0,
            comments: data.comment_count || 0,
            shares: data.share_count || 0,
            views: data.play_count || 0,
            videoUrl: url,
            thumbnailUrl: data.cover || data.origin_cover || '',
            author: data.author?.nickname || 'Unknown',
            musicTitle: data.music_info?.title || data.music || '',
            downloadUrl: videoUrl
          };

          return { videoBuffer, metadata };
        }
      }
      
      console.log('⚠️ TikWM failed, trying alternative API...');
    } catch (tikwmError: any) {
      console.warn('⚠️ TikWM error:', tikwmError.message);
    }
    
    // Fallback: Try SnapTik API
    try {
      console.log('🔄 Trying SnapTik API...');
      
      const snapResponse = await axios.post('https://snaptik.app/abc2.php', 
        `url=${encodeURIComponent(url)}&lang=en&token=`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 15000
        }
      );
      
      // Parse HTML response to find video URL
      const html = snapResponse.data;
      const videoUrlMatch = html.match(/href="([^"]+)"[^>]*>Download Server/);
      
      if (videoUrlMatch && videoUrlMatch[1]) {
        const videoUrl = videoUrlMatch[1];
        console.log(`📥 Downloading from SnapTik: ${videoUrl}`);
        
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
          timeout: 60000,
          maxContentLength: 50 * 1024 * 1024,
          maxBodyLength: 50 * 1024 * 1024
        });
        
        const videoBuffer = Buffer.from(videoResponse.data);
        const fileSizeMB = videoBuffer.length / (1024 * 1024);
        
        console.log(`✅ Downloaded video: ${fileSizeMB.toFixed(2)}MB`);
        
        if (fileSizeMB > 25) {
          return null;
        }
        
        // Basic metadata (SnapTik doesn't provide full stats)
        const metadata: TikTokData = {
          username: 'Unknown',
          caption: 'TikTok Video',
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          videoUrl: url,
          thumbnailUrl: '',
          author: 'Unknown',
          musicTitle: '',
          downloadUrl: videoUrl
        };
        
        return { videoBuffer, metadata };
      }
    } catch (snapError: any) {
      console.warn('⚠️ SnapTik error:', snapError.message);
    }

    console.error('❌ All download APIs failed');
    return null;
  } catch (error: any) {
    console.error('❌ Failed to download TikTok video:', error.message);
    return null;
  }
}

export async function handleLinkPreview(message: Message): Promise<void> {
  if (!message.guild) return;
  if (message.author.bot) return;
  
  const config = getLinkPreviewConfig(message.guild.id);
  if (!config.enabled) return;
  
  if (config.allowedChannels.length > 0 && !config.allowedChannels.includes(message.channel.id)) {
    return;
  }
  if (config.blockedChannels.includes(message.channel.id)) {
    return;
  }
  
  const urls = extractUrls(message.content);
  if (urls.length === 0) return;
  
  try {
    // Suppress embeds first
    try {
      await message.suppressEmbeds(true);
    } catch (err) {
      console.log('Cannot suppress embeds:', err);
    }
    
    for (const url of urls) {
      const urlObj = new URL(url);
      
      // Handle TikTok - Download and upload video (Keto style)
      if (urlObj.hostname.includes('tiktok.com')) {
        if (!message.channel.isSendable()) continue;
        
        // Check method config
        if (config.downloadMethod === 'download') {
          try {
            // Send "downloading" message
            const loadingMsg = await message.channel.send('🎬 Đang tải video...');
            
            // Download video
            const videoData = await downloadTikTokVideo(url);
            
            if (!videoData) {
              try {
                await loadingMsg.delete();
              } catch (delErr) {
                // Message already deleted - ignore
              }
              // Fallback to fast method
              const service = config.tiktokService || 'tfxktok';
              const fixed = getFixedEmbedUrl(url, service);
              if (fixed) {
                await message.channel.send({
                  content: fixed,
                  allowedMentions: { repliedUser: false }
                });
              }
              continue;
            }
            
            const { videoBuffer, metadata } = videoData;
            
            // Create attachment
            const attachment = new AttachmentBuilder(videoBuffer, { 
              name: `tiktok_${Date.now()}.mp4`,
              description: metadata.caption
            });
            
            // Create Keto-style embed
            const { embed, components } = createKetoStyleEmbed(metadata);
            
            // Send video + embed together
            await message.channel.send({
              files: [attachment],
              embeds: [embed],
              components: components,
              allowedMentions: { repliedUser: false }
            });
            
            // Delete loading message
            try {
              await loadingMsg.delete();
            } catch (delErr) {
              // Message already deleted or not found - ignore
            }
            
            console.log(`✅ Sent TikTok: ${metadata.username} (${(videoBuffer.length / (1024 * 1024)).toFixed(2)}MB)`);
            
          } catch (error: any) {
            console.error('❌ Error handling TikTok video:', error);
            
            // Fallback: send fixed URL
            const service = config.tiktokService || 'tfxktok';
            const fixed = getFixedEmbedUrl(url, service);
            if (fixed) {
              await message.channel.send({
                content: fixed,
                allowedMentions: { repliedUser: false }
              });
            }
          }
        } else {
          // Fast method: Just send fixed URL
          try {
            const service = config.tiktokService || 'tfxktok';
            const fixed = getFixedEmbedUrl(url, service);
            
            if (!fixed) continue;
            
            // Send fixed URL - Discord will handle embed
            await message.channel.send({
              content: fixed,
              allowedMentions: { repliedUser: false }
            });
            
            console.log(`✅ Sent fixed TikTok URL (${service}): ${fixed}`);
            
          } catch (error: any) {
            console.error('❌ Error handling TikTok:', error);
          }
        }
        continue;
      }
      
      // Handle other platforms - Use fixed URL method
      const service = config.tiktokService || 'tfxktok';
      const fixed = getFixedEmbedUrl(url, service);
      if (!fixed) continue;
      
      if (!message.channel.isSendable()) continue;
      
      // Send fixed URL and let Discord handle the embed
      await message.channel.send({
        content: fixed,
        allowedMentions: { repliedUser: false }
      });
      
      console.log(`✅ Sent fixed URL: ${fixed}`);
    }
    
    // Delete original message AFTER sending fixed links
    if (config.deleteOriginal) {
      try {
        await message.delete();
        console.log('🗑️ Deleted original message');
      } catch (err) {
        console.log('Cannot delete message:', err);
      }
    }
  } catch (error) {
    console.error('Error handling link preview:', error);
  }
}
