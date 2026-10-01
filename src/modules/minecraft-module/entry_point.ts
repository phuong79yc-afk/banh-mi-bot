// Minecraft Module - Entry Point (Updated with Official Font)
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  AttachmentBuilder
} from 'discord.js';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { emojis } from '../../config/emojis';
import * as path from 'path';

interface MinecraftServerStatus {
  online: boolean;
  host: string;
  port: number;
  ip_address?: string;
  version?: {
    name_clean?: string;
    name_html?: string;
  };
  players?: {
    online: number;
    max: number;
    list?: Array<{ name_clean: string; uuid: string }>;
  };
  motd?: {
    clean?: string;
    html?: string;
  };
  icon?: string;
  favicon?: string;
  software?: string;
  eula_blocked?: boolean;
}

export default class MinecraftModule {
  name = 'minecraft-module';
  description = 'Minecraft Server Status and Banner Generator';
  version = '1.1.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  private cachedCommandId: string | null = null;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('⛏️ Minecraft module initialized');
    this.registerCommands();
    console.log(`${emojis.success} Minecraft module registered ${this.commands.size} commands`);
    
    // Cache command ID for clickable mentions
    this.cacheCommandId();
  }

  private async cacheCommandId() {
    try {
      // Wait for bot to be fully ready and commands synced with Discord
      setTimeout(async () => {
        try {
          // Fetch guild commands (commands are deployed to guild, not globally)
          const guildId = process.env.GUILD_ID;
          if (guildId) {
            const commands = await this.client.application?.commands.fetch({ guildId });
            const customBannerCmd = commands?.find(cmd => cmd.name === 'minecraft-custom-server-banner');
            if (customBannerCmd) {
              this.cachedCommandId = customBannerCmd.id;
              console.log(`${emojis.success} Cached guild command ID: ${this.cachedCommandId} for minecraft-custom-server-banner`);
            } else {
              console.log(`${emojis.warning} Command minecraft-custom-server-banner not found in guild commands`);
            }
          } else {
            // Fallback to global commands if no guild ID
            const commands = await this.client.application?.commands.fetch();
            const customBannerCmd = commands?.find(cmd => cmd.name === 'minecraft-custom-server-banner');
            if (customBannerCmd) {
              this.cachedCommandId = customBannerCmd.id;
              console.log(`${emojis.success} Cached global command ID: ${this.cachedCommandId} for minecraft-custom-server-banner`);
            }
          }
        } catch (err) {
          console.error('${emojis.error} Failed to cache command ID:', err);
        }
      }, 5000); // Wait 5s for bot to be fully ready
    } catch (err) {
      console.error('${emojis.error} Failed to setup command ID caching:', err);
    }
  }

  private async queryMinecraftServer(address: string): Promise<MinecraftServerStatus> {
    try {
      // Parse address (handle ip:port or just ip)
      const [host, portStr] = address.includes(':') ? address.split(':') : [address, '25565'];
      const port = parseInt(portStr);

      // Use mcsrvstat.us API (no rate limit, reliable)
      const apiUrl = `https://api.mcsrvstat.us/3/${host}:${port}`;
      
      const response = await fetch(apiUrl);
      const data: any = await response.json();

      if (!data.online) {
        return {
          online: false,
          host,
          port,
        };
      }

      // Map API response to our interface
      return {
        online: data.online,
        host: data.hostname || host,
        port: data.port || port,
        ip_address: data.ip,
        version: {
          name_clean: data.version,
          name_html: data.version,
        },
        players: {
          online: data.players?.online || 0,
          max: data.players?.max || 0,
          list: data.players?.list?.map((p: any) => ({
            name_clean: p.name || p,
            uuid: p.uuid || '',
          })) || [],
        },
        motd: {
          clean: data.motd?.clean?.join('\n') || data.motd?.raw?.join('\n') || 'A Minecraft Server',
          html: data.motd?.html?.join('\n') || '',
        },
        icon: data.icon,
        favicon: data.icon,
        software: data.software,
        eula_blocked: data.eula_blocked,
      };
    } catch (error) {
      console.error('Error querying Minecraft server:', error);
      throw new Error('Failed to query server');
    }
  }

  private async generateServerBanner(
    status: MinecraftServerStatus,
    iconData?: string
  ): Promise<Buffer> {
    const finalWidth = 940;
    const finalHeight = 96;
    
    const canvas = createCanvas(finalWidth, finalHeight);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // ============================================
    // MINECRAFT TEXT RENDERER (Official Style)
    // ============================================
    
    // Minecraft color codes
    const COLOR_MAP: { [key: string]: string } = {
      '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
      '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
      '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
      'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF',
      'r': '#FFFFFF'
    };

    // Parse text with color codes
    const parseFormattedText = (text: string) => {
      const segments: Array<{ text: string; color: string }> = [];
      let currentColor = '#FFFFFF';
      let i = 0;
      let currentStr = '';
      
      while (i < text.length) {
        if (text[i] === '§' && i + 1 < text.length) {
          if (currentStr.length > 0) {
            segments.push({ text: currentStr, color: currentColor });
            currentStr = '';
          }
          const code = text[i + 1].toLowerCase();
          if (COLOR_MAP[code]) {
            currentColor = COLOR_MAP[code];
          }
          i += 2;
        } else {
          currentStr += text[i];
          i++;
        }
      }
      
      if (currentStr.length > 0) {
        segments.push({ text: currentStr, color: currentColor });
      }
      
      return segments;
    };

    // Draw Minecraft text with drop shadow
    const drawMinecraftText = (text: string, x: number, y: number, fontSize: number, align: 'left' | 'center' | 'right' = 'left') => {
      ctx.font = `${fontSize}px "Minecraft", monospace`;
      ctx.textBaseline = 'top';
      
      const segments = parseFormattedText(text);
      
      // Calculate total width
      let totalWidth = 0;
      for (const seg of segments) {
        totalWidth += ctx.measureText(seg.text).width;
      }
      
      let startX = x;
      if (align === 'center') {
        startX = x - totalWidth / 2;
      } else if (align === 'right') {
        startX = x - totalWidth;
      }
      
      const shadowOffset = Math.max(2, Math.floor(fontSize / 8));
      
      // Draw shadow
      let currentX = startX;
      for (const seg of segments) {
        ctx.fillStyle = '#222222';
        ctx.fillText(seg.text, currentX + shadowOffset, y + shadowOffset);
        currentX += ctx.measureText(seg.text).width;
      }
      
      // Draw main text
      currentX = startX;
      for (const seg of segments) {
        ctx.fillStyle = seg.color;
        ctx.fillText(seg.text, currentX, y);
        currentX += ctx.measureText(seg.text).width;
      }
    };

    // Load Minecraft font
    try {
      const minecraftFontPath = path.resolve(__dirname, '../../../assets/fonts/Minecraft.ttf');
      GlobalFonts.registerFromPath(minecraftFontPath, 'Minecraft');
      console.log(`${emojis.success} Loaded Minecraft.ttf`);
    } catch (e) {
      try {
        const officialPath = path.resolve(__dirname, '../../../assets/fonts/minecraft_official.otf');
        GlobalFonts.registerFromPath(officialPath, 'Minecraft');
        console.log(`${emojis.success} Loaded minecraft_official.otf`);
      } catch (e2) {
        try {
          const monocraftPath = path.resolve(__dirname, '../../../assets/fonts/Monocraft.ttf');
          GlobalFonts.registerFromPath(monocraftPath, 'Minecraft');
          console.log(`${emojis.success} Loaded Monocraft.ttf`);
        } catch (e3) {
          console.log(`${emojis.warning} No Minecraft font found, using default`);
        }
      }
    }

    // Load End Stone texture background
    try {
      const texturePath = path.resolve(__dirname, '../../../assets/textures/end_stone.png');
      const texture = await loadImage(texturePath);
      
      const scaledSize = 64;
      const tempCanvas = createCanvas(scaledSize, scaledSize);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(texture, 0, 0, scaledSize, scaledSize);
      
      const pattern = ctx.createPattern(tempCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      }
      
      // Darker overlay
      ctx.fillStyle = 'rgba(15, 18, 10, 0.35)';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
      
      console.log(`${emojis.success} Loaded End Stone texture`);
    } catch (e) {
      ctx.fillStyle = '#8a8560';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }

    // Parse MOTD and add color codes
    const motd = status.motd?.clean || 'A Minecraft Server';
    console.log('${emojis.search} MOTD raw:', motd);
    
    let motdWithColors = motd
      .replace(/\s*Hypixel\s+Network/gi, '§fHYPIXEL §6NETWORK§r')
      .replace(/\[(\d+\.\d+)\/(\d+\.\d+)\]/g, ' §8[§4$1/$2§8]§r')
      .replace(/MEGACITY\s+NETWORK/gi, '§cMEGACITY §6NETWORK§r')
      .replace(/\[(\d+\.\d+)-(\d+\.\d+)\.x\]/g, ' §8[§4$1-$2.x§8]§r')
      .replace(/SB\s+(\d+\.\d+(?:\.\d+)?)/gi, '§7SB §f$1§r');
    
    console.log('${emojis.search} MOTD with colors:', motdWithColors);
    const motdLines = motdWithColors.split('\n').map(line => line.trim());
    
    // ============================================
    // LAYOUT: Icon + Title + MOTD + Player + Signal
    // ============================================
    
    // 1. Server Icon (16, 16, 64x64)
    if (status.favicon) {
      try {
        const faviconData = status.favicon.replace(/^data:image\/png;base64,/, '');
        const faviconBuffer = Buffer.from(faviconData, 'base64');
        const faviconImg = await loadImage(faviconBuffer);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(faviconImg, 16, 16, 64, 64);
      } catch (e) {
        ctx.fillStyle = '#555555';
        ctx.fillRect(16, 16, 64, 64);
      }
    } else {
      ctx.fillStyle = '#555555';
      ctx.fillRect(16, 16, 64, 64);
    }
    
    // 2. Title Line (96, 16, white, 20px)
    const serverTitle = status.host || 'A Minecraft Server';
    drawMinecraftText(`§f${serverTitle}`, 96, 16, 20, 'left');
    
    // 3. MOTD Line 1 (Centered, 40, 22px)
    if (motdLines[0]) {
      drawMinecraftText(motdLines[0], finalWidth / 2, 40, 22, 'center');
    }
    
    // 4. MOTD Line 2 (Centered, 66, 19px)
    if (motdLines[1]) {
      drawMinecraftText(motdLines[1], finalWidth / 2, 66, 19, 'center');
    }
    
    // 5. Player Count (Right aligned, 882, 16, 20px, gray)
    const playersText = `§7${status.players?.online || 0}/${status.players?.max || 0}`;
    drawMinecraftText(playersText, 882, 16, 20, 'right');
    
    // 6. Signal Bars (5 columns, green, top right)
    const barX = 894;
    const barY = 16;
    const barHeights = [4, 7, 10, 13, 16];
    
    for (let i = 0; i < 5; i++) {
      const height = barHeights[i];
      
      // Shadow
      ctx.fillStyle = '#222222';
      ctx.fillRect(barX + (i * 5) + 1, barY + (16 - height) + 1, 3, height);
      
      // Main bar
      ctx.fillStyle = '#55FF55';
      ctx.fillRect(barX + (i * 5), barY + (16 - height), 3, height);
    }

    return canvas.toBuffer('image/png');
  }

  private registerCommands() {
    // /minecraft-server
    const minecraftServerCommand = {
      data: new SlashCommandBuilder()
        .setName('minecraft-server')
        .setDescription('🎮 Kiểm tra trạng thái Minecraft server')
        .addStringOption(option =>
          option
            .setName('address')
            .setDescription('Địa chỉ server (vd: play.hypixel.net hoặc 1.1.1.1:25565)')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        // DEFER IMMEDIATELY to prevent timeout
        await interaction.deferReply();
        
        const address = interaction.options.getString('address', true);

        try {
          const status = await this.queryMinecraftServer(address);

          if (!status.online) {
            return interaction.editReply({
              content: `${emojis.error} Server **${address}** đang offline hoặc không tồn tại!`,
            });
          }

          // Generate banner
          const bannerBuffer = await this.generateServerBanner(status, status.icon);
          const attachment = new AttachmentBuilder(bannerBuffer, { name: 'minecraft-banner.png' });

          // Parse MOTD lines
          const motdLines = status.motd?.clean?.split('\n') || ['A Minecraft Server'];
          const motdLine1 = motdLines[0] || 'A Minecraft Server';
          const motdLine2 = motdLines[1] || '';

          // Use cached command ID for clickable mention (fallback to hardcoded ID)
          // Note: Command name uses hyphens, not spaces
          const commandMention = this.cachedCommandId 
            ? `</minecraft-custom-server-banner:${this.cachedCommandId}>`
            : `</minecraft-custom-server-banner:1552677727327359011>`;
          
          console.log('${emojis.link} Command mention:', commandMention);

          // Build embed
          const embed = new EmbedBuilder()
            .setColor(0x5865F2) // Discord blurple
            .setAuthor({ 
              name: motdLine1
            })
            .setDescription(
              `**TIP:** Đặt banner tùy chỉnh cho Server Minecraft bằng lệnh ${commandMention}!\n\n` +
              `${motdLine2 ? `**${motdLine2}**\n\n` : ''}`
            )
            .addFields(
              {
                name: '📍 Địa chỉ IP',
                value: `\`\`\`\n${status.host}:${status.port}\n\`\`\`\n**[${status.software || 'Unknown'}]** ${status.ip_address || 'Unknown'}`,
                inline: true
              },
              {
                name: '${emojis.users} Số lượng người chơi',
                value: `\`\`\`\n${status.players?.online || 0}/${status.players?.max || 0}\n\`\`\``,
                inline: true
              },
              {
                name: '🎮 Phiên bản',
                value: 
                  `**Phần mềm:** \`${status.software || 'Unknown'}\`\n` +
                  `**Phiên bản:** \`${status.version?.name_clean || 'Unknown'}\``,
                inline: false
              }
            )
            .setImage('attachment://minecraft-banner.png')
            .setFooter({ 
              text: `GlitchBucket • kingmc.vn`,
            })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (error: any) {
          await interaction.editReply({
            content: `${emojis.error} Lỗi: ${error.message}`,
          });
        }
      },
    };

    // /minecraft-custom-server-banner
    const customBannerCommand = {
      data: new SlashCommandBuilder()
        .setName('minecraft-custom-server-banner')
        .setDescription('${emojis.art} Tạo banner Minecraft server tùy chỉnh')
        .addStringOption(option =>
          option
            .setName('address')
            .setDescription('Địa chỉ server (vd: play.hypixel.net)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('style')
            .setDescription('Chọn style banner')
            .setRequired(false)
            .addChoices(
              { name: '🌙 Default - End Stone', value: 'default' },
              { name: '🌲 Grass Block', value: 'grass' },
              { name: '🪨 Stone Bricks', value: 'stone' },
              { name: '🔥 Nether Bricks', value: 'nether' },
              { name: '❄️ Ice', value: 'ice' }
            )
        )
        .addStringOption(option =>
          option
            .setName('text-color')
            .setDescription('Màu chữ chính')
            .setRequired(false)
            .addChoices(
              { name: '⚪ White', value: 'white' },
              { name: '🟡 Yellow', value: 'yellow' },
              { name: '🟢 Green', value: 'green' },
              { name: '🔴 Red', value: 'red' },
              { name: '🔵 Blue', value: 'blue' }
            )
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        
        const address = interaction.options.getString('address', true);
        const style = interaction.options.getString('style') || 'default';
        const textColor = interaction.options.getString('text-color') || 'white';

        try {
          const status = await this.queryMinecraftServer(address);

          if (!status.online) {
            return interaction.editReply({
              content: `${emojis.error} Server **${address}** đang offline!`,
            });
          }

          // Generate custom banner (coming soon - use default for now)
          const bannerBuffer = await this.generateServerBanner(status, status.icon);
          const attachment = new AttachmentBuilder(bannerBuffer, { name: 'custom-banner.png' });

          const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle('${emojis.art} Custom Minecraft Banner')
            .setDescription(
              `**Server:** ${status.host}\n` +
              `**Style:** ${style}\n` +
              `**Text Color:** ${textColor}\n\n` +
              `${emojis.sparkles} *Feature đang được phát triển - Preview banner chuẩn*`
            )
            .setImage('attachment://custom-banner.png')
            .setFooter({ text: 'Tính năng tùy chỉnh nâng cao sắp ra mắt!' })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (error: any) {
          await interaction.editReply({
            content: `${emojis.error} Lỗi: ${error.message}`,
          });
        }
      },
    };

    this.commands.set('minecraft-server', minecraftServerCommand);
    this.commands.set('minecraft-custom-server-banner', customBannerCommand);
  }

  async cleanup() {
    console.log('🧹 Minecraft module cleanup');
  }
}
