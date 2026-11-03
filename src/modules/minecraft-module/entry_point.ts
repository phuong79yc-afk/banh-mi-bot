// Minecraft Module - Entry Point (Components V2)

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  escapeMarkdown,
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

const V2 = MessageFlags.IsComponentsV2;
const text = (content: string) => new TextDisplayBuilder().setContent(content);

export default class MinecraftModule {
  name = 'minecraft-module';
  description = 'Minecraft Server Status and Banner Generator';
  version = '1.2.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  private cachedCommandId: string | null = null;
  private fontLoaded = false;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('⛏️ Minecraft module initialized');
    this.registerCommands();
    console.log(`✅ Minecraft module registered ${this.commands.size} commands`);

    // Cache command ID for clickable mentions
    this.cacheCommandId();
  }

  private async cacheCommandId() {
    // Wait for bot to be fully ready and commands synced with Discord
    setTimeout(async () => {
      try {
        const guildId = process.env.GUILD_ID;
        const commands = guildId
          ? await this.client.application?.commands.fetch({ guildId })
          : await this.client.application?.commands.fetch();

        const cmd = commands?.find((c) => c.name === 'minecraft-custom-server-banner');
        if (cmd) {
          this.cachedCommandId = cmd.id;
          console.log(`✅ Cached guild command ID: ${cmd.id} for minecraft-custom-server-banner`);
        } else {
          console.log('⚠️ Command minecraft-custom-server-banner not found');
        }
      } catch (err) {
        console.error(`${emojis.error} Failed to cache command ID:`, err);
      }
    }, 5000);
  }

  // ============================================
  // COMPONENTS V2 HELPERS
  // ============================================

  private notice(content: string) {
    return new ContainerBuilder().addTextDisplayComponents(text(content));
  }

  private gallery(fileName: string) {
    return new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${fileName}`));
  }

  private send(interaction: ChatInputCommandInteraction, card: ContainerBuilder, files: AttachmentBuilder[] = []) {
    return interaction.editReply({
      components: [card],
      files,
      flags: V2,
      allowedMentions: { parse: [] },
    } as any);
  }

  // ============================================
  // SERVER QUERY
  // ============================================

  private async queryMinecraftServer(address: string): Promise<MinecraftServerStatus> {
    try {
      // Parse address (handle ip:port or just ip)
      const [host, portStr] = address.includes(':') ? address.split(':') : [address, '25565'];
      const port = parseInt(portStr) || 25565;

      let primarySuccess = false;
      let primaryData: any = null;

      // Try primary API: mcsrvstat.us
      try {
        const apiUrl = `https://api.mcsrvstat.us/3/${host}:${port}`;
        const response = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
        primaryData = await response.json();

        if (primaryData.online) {
          primarySuccess = true;
        }
      } catch (primaryError) {
        console.log('Primary API failed, trying fallback...');
      }

      // If primary API failed or returned offline, try fallback
      if (!primarySuccess) {
        try {
          const fallbackUrl = `https://api.mcstatus.io/v2/status/java/${host}:${port}`;
          const fallbackResponse = await fetch(fallbackUrl, { signal: AbortSignal.timeout(8000) });
          const fallbackData: any = await fallbackResponse.json();

          if (fallbackData.online) {
            return {
              online: true,
              host: fallbackData.host || host,
              port: fallbackData.port || port,
              ip_address: fallbackData.ip_address,
              version: {
                name_clean: fallbackData.version?.name_clean || fallbackData.version?.name_raw,
                name_html: fallbackData.version?.name_html,
              },
              players: {
                online: fallbackData.players?.online || 0,
                max: fallbackData.players?.max || 0,
                list:
                  fallbackData.players?.list?.map((p: any) => ({
                    name_clean: p.name_clean || p.name_raw,
                    uuid: p.uuid || '',
                  })) || [],
              },
              motd: {
                clean: fallbackData.motd?.clean || fallbackData.motd?.raw,
                html: fallbackData.motd?.html || '',
              },
              icon: fallbackData.icon,
              favicon: fallbackData.icon,
              software: fallbackData.software,
              eula_blocked: fallbackData.eula_blocked,
            };
          }
        } catch (fallbackError) {
          console.log('Fallback API also failed');
        }

        // Both APIs failed or returned offline
        return { online: false, host, port };
      }

      // Primary API succeeded
      return {
        online: true,
        host: primaryData.hostname || host,
        port: primaryData.port || port,
        ip_address: primaryData.ip,
        version: {
          name_clean: primaryData.version,
          name_html: primaryData.version,
        },
        players: {
          online: primaryData.players?.online || 0,
          max: primaryData.players?.max || 0,
          list:
            primaryData.players?.list?.map((p: any) => ({
              name_clean: p.name || p,
              uuid: p.uuid || '',
            })) || [],
        },
        motd: {
          clean: primaryData.motd?.clean?.join('\n') || primaryData.motd?.raw?.join('\n') || 'A Minecraft Server',
          html: primaryData.motd?.html?.join('\n') || '',
        },
        icon: primaryData.icon,
        favicon: primaryData.icon,
        software: primaryData.software,
        eula_blocked: primaryData.eula_blocked,
      };
    } catch (error) {
      console.error('Error querying Minecraft server:', error);
      throw new Error('Failed to query server');
    }
  }

  // ============================================
  // BANNER
  // ============================================

  // Chỉ đăng ký font một lần thay vì mỗi lần tạo banner
  private ensureFont() {
    if (this.fontLoaded) return;

    const dir = path.resolve(__dirname, '../../../assets/fonts');
    for (const file of ['Minecraft.ttf', 'minecraft_official.otf', 'Monocraft.ttf']) {
      try {
        if (GlobalFonts.registerFromPath(path.join(dir, file), 'Minecraft')) {
          console.log(`✅ Loaded ${file}`);
          break;
        }
      } catch {
        // thử font tiếp theo
      }
    }

    try {
      if (GlobalFonts.registerFromPath(path.join(dir, 'Monocraft.ttf'), 'PixelMinecraft')) {
        console.log('✅ Loaded Monocraft pixel font');
      }
    } catch {
      // dùng lại font mặc định nếu thiếu Monocraft
    }

    this.fontLoaded = true;
  }

  private async generateServerBanner(status: MinecraftServerStatus, iconData?: string): Promise<Buffer> {
    const finalWidth = 940;
    const finalHeight = 96;

    this.ensureFont();

    const canvas = createCanvas(finalWidth, finalHeight);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Minecraft color codes
    const COLOR_MAP: { [key: string]: string } = {
      '0': '#000000',
      '1': '#0000AA',
      '2': '#00AA00',
      '3': '#00AAAA',
      '4': '#AA0000',
      '5': '#AA00AA',
      '6': '#FFAA00',
      '7': '#AAAAAA',
      '8': '#555555',
      '9': '#5555FF',
      a: '#55FF55',
      b: '#55FFFF',
      c: '#FF5555',
      d: '#FF55FF',
      e: '#FFFF55',
      f: '#FFFFFF',
      r: '#FFFFFF',
    };

    // Parse text with color codes
    const parseFormattedText = (input: string) => {
      const segments: Array<{ text: string; color: string }> = [];
      let currentColor = '#FFFFFF';
      let currentStr = '';
      let i = 0;

      while (i < input.length) {
        if (input[i] === '§' && i + 1 < input.length) {
          if (currentStr.length > 0) {
            segments.push({ text: currentStr, color: currentColor });
            currentStr = '';
          }
          const code = input[i + 1].toLowerCase();
          if (COLOR_MAP[code]) currentColor = COLOR_MAP[code];
          i += 2;
        } else {
          currentStr += input[i];
          i++;
        }
      }

      if (currentStr.length > 0) segments.push({ text: currentStr, color: currentColor });
      return segments;
    };

    // Draw Minecraft text with drop shadow
    const drawMinecraftText = (
      content: string,
      x: number,
      y: number,
      fontSize: number,
      align: 'left' | 'center' | 'right' = 'left',
      fontFamily = '"Minecraft", monospace',
    ) => {
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textBaseline = 'top';

      const segments = parseFormattedText(content);
      let totalWidth = 0;
      for (const seg of segments) totalWidth += ctx.measureText(seg.text).width;

      let startX = x;
      if (align === 'center') startX = x - totalWidth / 2;
      else if (align === 'right') startX = x - totalWidth;

      const shadowOffset = Math.max(2, Math.floor(fontSize / 8));
      let currentX = startX;

      for (const seg of segments) {
        ctx.fillStyle = '#222222';
        ctx.fillText(seg.text, currentX + shadowOffset, y + shadowOffset);
        currentX += ctx.measureText(seg.text).width;
      }

      currentX = startX;
      for (const seg of segments) {
        ctx.fillStyle = seg.color;
        ctx.fillText(seg.text, currentX, y);
        currentX += ctx.measureText(seg.text).width;
      }
    };

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
    } catch (e) {
      ctx.fillStyle = '#8a8560';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }

    // Parse MOTD and add color codes
    const rawMotd = status.motd?.clean || 'A Minecraft Server';
    
    // Keep Vietnamese and line breaks while removing non-printing control characters.
    const cleanMotd = rawMotd
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n');

    const smallCapsMap: Record<string, string> = {
      'ᴀ':'a','ᴁ':'a','ᴃ':'b','ʙ':'b','ᴄ':'c','ᴅ':'d','ᴇ':'e','ᴦ':'g','ʜ':'h','ɪ':'i','ᴉ':'i','ᴊ':'j','ᴋ':'k','ʟ':'l','ᴌ':'l','ᴍ':'m','ɴ':'n','ᴎ':'n','ᴏ':'o','ᴘ':'p','ǫ':'q','ᴿ':'r','ʀ':'r','ᴛ':'t','ᴜ':'u','ᴠ':'v','ᴡ':'w','ʏ':'y','ᴢ':'z',
      'ꜱ':'s','ꜰ':'f','ꜻ':'2','ꜽ':'3','Ꜿ':'4','ꜿ':'6','Ꜹ':'um','ꜹ':'uo',
    };
    const normalizeSmallCaps = (text: string) => Array.from(text, (char) => smallCapsMap[char] ?? char).join('');

    const finalClean = cleanMotd
      .split('\n')
      .map((line) => {
        const normalized = normalizeSmallCaps(line)
          .replace(/^[\s.*·]+|[\s.*·]+$/g, '')
          .replace(/[ \t]+x[ \t]+(\d+)[ \t]*/gi, ' §6$1x Rate§r ')
          .replace(/[ \t]+/g, ' ')
          .trim();

        return normalized
          .replace(/[ \t]*Hypixel[ \t]+Network/gi, '§fHYPIXEL §6NETWORK§r')
          .replace(/\[(\d+\.\d+)\/(\d+\.\d+)\]/g, '§8[§4$1/$2§8]§r')
          .replace(/\[(\d+\.\d+)x?[ \t]*-[ \t]*(\d+\.\d+)x?\]/gi, '§8[§6$1x §7- §6$2x§8]§r')
          .replace(/MEGACITY[ \t]+NETWORK/gi, '§cMEGACITY §6NETWORK§r')
          .replace(/SB[ \t]+(\d+\.\d+(?:\.\d+)?)/gi, '§7SB §f$1§r');
      })
      .filter((line) => line.length > 0);
    const motdLines = finalClean;
    const motdFont = () => '"PixelMinecraft", "Minecraft", monospace';

    // 1. Server Icon (16, 16, 64x64)
    if (status.favicon) {
      try {
        const faviconData = status.favicon.replace(/^data:image\/png;base64,/, '');
        const faviconImg = await loadImage(Buffer.from(faviconData, 'base64'));
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

    // 2. Title Line - Server name với màu sáng và uppercase
    const serverName = (status.host || 'A Minecraft Server').toUpperCase();
    drawMinecraftText(`§6${serverName}`, 96, 16, 22, 'left');

    // 3. MOTD Line 1
    if (motdLines[0]) drawMinecraftText(motdLines[0], finalWidth / 2, 40, 22, 'center', motdFont());

    // 4. MOTD Line 2
    if (motdLines[1]) drawMinecraftText(motdLines[1], finalWidth / 2, 66, 19, 'center', motdFont());

    // 5. Player Count
    drawMinecraftText(`§7${status.players?.online || 0}/${status.players?.max || 0}`, 882, 16, 20, 'right');

    // 6. Signal Bars
    const barX = 894;
    const barY = 16;
    const barHeights = [4, 7, 10, 13, 16];

    for (let i = 0; i < 5; i++) {
      const height = barHeights[i];
      ctx.fillStyle = '#222222';
      ctx.fillRect(barX + i * 5 + 1, barY + (16 - height) + 1, 3, height);
      ctx.fillStyle = '#55FF55';
      ctx.fillRect(barX + i * 5, barY + (16 - height), 3, height);
    }

    return canvas.toBuffer('image/png');
  }

  // ============================================
  // CUSTOM BANNER GENERATOR (FULL FEATURES)
  // ============================================

  private async generateCustomBanner(
    status: MinecraftServerStatus,
    options: {
      style: string;
      layout: string;
      textEffect: string;
      animated: boolean;
      border: string;
      textColor: string;
      accentColor: string;
      customTitle?: string;
      customDescription?: string;
      footerText?: string;
    },
  ): Promise<Buffer> {
    // Nếu animated, return GIF
    if (options.animated) {
      return this.generateAnimatedBanner(status, options);
    }

    // Static PNG với full customization
    const { width, height } = this.getLayoutDimensions(options.layout);
    
    this.ensureFont();
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // 1. Draw background texture
    await this.drawBackground(ctx, options.style, width, height);

    // 2. Draw border
    this.drawBorder(ctx, options.border, width, height);

    // 3. Draw content based on layout
    await this.drawLayoutContent(ctx, status, options, width, height);

    return canvas.toBuffer('image/png');
  }

  private getLayoutDimensions(layout: string): { width: number; height: number } {
    switch (layout) {
      case 'compact':
        return { width: 720, height: 80 };
      case 'minimal':
        return { width: 600, height: 64 };
      case 'wide':
        return { width: 1200, height: 120 };
      case 'detailed':
        return { width: 940, height: 140 };
      default: // default
        return { width: 940, height: 96 };
    }
  }

  private async drawBackground(ctx: any, style: string, width: number, height: number) {
    const textureMap: { [key: string]: string } = {
      end_stone: 'end_stone.png',
      grass: 'grass_block_top.png',
      stone: 'stone_bricks.png',
      nether: 'nether_bricks.png',
      ice: 'ice.png',
      oak: 'oak_planks.png',
      dirt: 'dirt.png',
      moss: 'moss_block.png',
    };

    const textureFile = textureMap[style] || 'end_stone.png';
    const texturePath = path.resolve(__dirname, '../../../assets/textures', textureFile);

    try {
      const texture = await loadImage(texturePath);
      const scaledSize = 64;
      const tempCanvas = createCanvas(scaledSize, scaledSize);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(texture, 0, 0, scaledSize, scaledSize);

      const pattern = ctx.createPattern(tempCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }

      // Overlay dựa trên style
      const overlays: { [key: string]: string } = {
        end_stone: 'rgba(15, 18, 10, 0.35)',
        grass: 'rgba(20, 40, 10, 0.3)',
        stone: 'rgba(10, 10, 10, 0.4)',
        nether: 'rgba(40, 10, 10, 0.35)',
        ice: 'rgba(200, 220, 255, 0.2)',
        oak: 'rgba(30, 20, 10, 0.3)',
        dirt: 'rgba(20, 15, 10, 0.35)',
        moss: 'rgba(10, 30, 20, 0.3)',
      };

      ctx.fillStyle = overlays[style] || 'rgba(15, 18, 10, 0.35)';
      ctx.fillRect(0, 0, width, height);
    } catch (e) {
      // Fallback colors
      const colors: { [key: string]: string } = {
        end_stone: '#8a8560',
        grass: '#5ca943',
        stone: '#7a7a7a',
        nether: '#441414',
        ice: '#9fcbff',
        oak: '#9d804d',
        dirt: '#8b6f47',
        moss: '#5c7a45',
      };
      ctx.fillStyle = colors[style] || '#8a8560';
      ctx.fillRect(0, 0, width, height);
    }
  }

  private drawBorder(ctx: any, borderType: string, width: number, height: number) {
    if (borderType === 'none') return;

    const borderWidth = borderType === 'double' ? 4 : 2;
    
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);

    if (borderType === 'fancy') {
      // Inner glow
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.strokeRect(borderWidth + 1, borderWidth + 1, width - (borderWidth + 2) * 2, height - (borderWidth + 2) * 2);
    }

    if (borderType === 'double') {
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1;
      const offset = 6;
      ctx.strokeRect(offset, offset, width - offset * 2, height - offset * 2);
    }
  }

  private async drawLayoutContent(
    ctx: any,
    status: MinecraftServerStatus,
    options: any,
    width: number,
    height: number,
  ) {
    const { layout, textEffect, textColor, accentColor, customTitle, customDescription, footerText } = options;

    // Helper: Draw text with effects
    const drawText = (text: string, x: number, y: number, size: number, align: 'left' | 'center' | 'right' = 'left', color: string = '#FFFFFF') => {
      ctx.font = `${size}px "Minecraft", monospace`;
      ctx.textBaseline = 'top';
      ctx.textAlign = align;

      // Apply text effect
      if (textEffect === 'glow') {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
      } else if (textEffect === 'gradient') {
        const gradient = ctx.createLinearGradient(x - 50, y, x + 50, y + size);
        gradient.addColorStop(0, '#FFFF55');
        gradient.addColorStop(0.5, '#FFAA00');
        gradient.addColorStop(1, '#FF5555');
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);
      } else if (textEffect === 'fire') {
        const gradient = ctx.createLinearGradient(x, y, x, y + size);
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(0.5, '#FF5500');
        gradient.addColorStop(1, '#AA0000');
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);
      } else if (textEffect === 'diamond') {
        const gradient = ctx.createLinearGradient(x - 30, y, x + 30, y + size);
        gradient.addColorStop(0, '#55FFFF');
        gradient.addColorStop(0.5, '#FFFFFF');
        gradient.addColorStop(1, '#55FFFF');
        ctx.fillStyle = gradient;
        ctx.fillText(text, x, y);
      } else {
        // Shadow for clean text
        ctx.fillStyle = '#222222';
        ctx.fillText(text, x + 2, y + 2);
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
      }
    };

    // Helper: Wrap text thành multiple lines
    const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
      ctx.font = `${fontSize}px "Minecraft", monospace`;
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // Draw favicon
    const drawFavicon = async (x: number, y: number, size: number) => {
      if (status.favicon) {
        try {
          const faviconData = status.favicon.replace(/^data:image\/png;base64,/, '');
          const faviconImg = await loadImage(Buffer.from(faviconData, 'base64'));
          ctx.drawImage(faviconImg, x, y, size, size);
        } catch (e) {
          ctx.fillStyle = '#555555';
          ctx.fillRect(x, y, size, size);
        }
      } else {
        ctx.fillStyle = '#555555';
        ctx.fillRect(x, y, size, size);
      }
    };

    // Title box - nền đậm với border
    const drawTitleBox = (text: string, x: number, y: number, boxWidth: number, boxHeight: number) => {
      // Background box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x, y, boxWidth, boxHeight);
      
      // Border
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, boxWidth, boxHeight);
      
      // Title text
      const titleY = y + (boxHeight - 20) / 2;
      drawText(text, x + 10, titleY, 20, 'left', textColor);
    };

    // Footer với icon và text
    const drawFooter = (text: string, x: number, y: number) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y, width - x * 2, 24);
      drawText(text, x + 8, y + 6, 12, 'left', '#AAAAAA');
    };

    const serverName = customTitle || (status.host || 'Minecraft Server').toUpperCase();
    const playerText = `${status.players?.online || 0}/${status.players?.max || 0}`;
    const motd = status.motd?.clean || 'A Minecraft Server';
    const footer = footerText || `${status.software || 'Unknown'} • ${status.version?.name_clean || 'Unknown'} • ${new Date().toLocaleString('vi-VN')}`;

    switch (layout) {
      case 'compact':
        await drawFavicon(12, 12, 56);
        drawTitleBox(serverName, 80, 12, width - 100, 28);
        drawText(playerText, 80, 48, 16, 'left', accentColor);
        if (customDescription) {
          const lines = wrapText(customDescription, width - 100, 12);
          lines.slice(0, 1).forEach((line, i) => {
            drawText(line, 80, 68 + i * 14, 12, 'left', '#CCCCCC');
          });
        }
        break;

      case 'minimal':
        await drawFavicon(12, 12, 40);
        drawText(serverName, 64, 18, 18, 'left', textColor);
        drawText(playerText, width - 20, 18, 16, 'right', accentColor);
        break;

      case 'wide':
        await drawFavicon(20, 20, 80);
        drawTitleBox(serverName, 120, 20, width - 150, 30);
        
        // Description/MOTD area
        const descText = customDescription || motd;
        const descLines = wrapText(descText, width - 140, 18);
        descLines.slice(0, 2).forEach((line, i) => {
          drawText(line, 120, 60 + i * 22, 18, 'left', '#FFFFFF');
        });
        
        // Stats
        drawText(`Players: ${playerText}`, width - 30, 20, 16, 'right', accentColor);
        
        // Footer
        drawFooter(footer, 20, height - 30);
        break;

      case 'detailed':
        // Title box at top
        drawTitleBox(serverName, 16, 10, width - 32, 32);
        
        // Favicon
        await drawFavicon(width - 80, 16, 64);
        
        // Description area
        const detailDesc = customDescription || motd;
        const detailLines = wrapText(detailDesc, width - 40, 16);
        detailLines.slice(0, 2).forEach((line, i) => {
          drawText(line, 20, 52 + i * 20, 16, 'left', '#FFFFFF');
        });
        
        // Stats row
        drawText(`Online: ${playerText}`, 20, 96, 16, 'left', accentColor);
        drawText(`Version: ${status.version?.name_clean || 'Unknown'}`, width / 2, 96, 16, 'center', '#AAAAAA');
        
        // Footer
        drawFooter(footer, 20, height - 28);
        break;

      default: // default layout - Discord-style
        // Favicon thumbnail bên phải
        await drawFavicon(width - 80, 16, 64);
        
        // Title box
        drawTitleBox(serverName, 16, 16, width - 112, 28);
        
        // Description/MOTD
        const defaultDesc = customDescription || motd;
        const defaultLines = wrapText(defaultDesc, width - 100, 16);
        defaultLines.slice(0, 2).forEach((line, i) => {
          drawText(line, 20, 52 + i * 20, 16, 'left', '#FFFFFF');
        });
        
        // Footer với timestamp
        drawFooter(footer, 16, height - 26);
        
        // Player count badge
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(width - 100, height - 26, 84, 20);
        drawText(playerText, width - 58, height - 21, 14, 'center', accentColor);
        break;
    }
  }

  // Animated GIF Generator
  private async generateAnimatedBanner(
    status: MinecraftServerStatus,
    options: any,
  ): Promise<Buffer> {
    // TODO: Implement GIF encoding với player count animation
    // Tạm thời return static PNG
    const { width, height } = this.getLayoutDimensions(options.layout);
    
    this.ensureFont();
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    await this.drawBackground(ctx, options.style, width, height);
    this.drawBorder(ctx, options.border, width, height);
    await this.drawLayoutContent(ctx, status, options, width, height);

    // Add "LIVE" indicator for animated version
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(width - 60, 10, 8, 8);
    ctx.font = '12px "Minecraft", monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('LIVE', width - 48, 8);

    return canvas.toBuffer('image/png');
  }

  // ============================================
  // COMMANDS
  // ============================================

  private registerCommands() {
    // /minecraft-server
    const minecraftServerCommand = {
      data: new SlashCommandBuilder()
        .setName('minecraft-server')
        .setDescription('Kiểm tra trạng thái máy chủ Minecraft')
        .addStringOption((option) =>
          option
            .setName('address')
            .setDescription('IP hoặc tên máy chủ, có thể kèm cổng')
            .setRequired(true),
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062 || error.code === 40060) return;
          throw error;
        }

        const address = interaction.options.getString('address', true);

        try {
          const status = await this.queryMinecraftServer(address);

          if (!status.online) {
            return this.send(
              interaction,
              this.notice(
                `${emojis.error} **Không thể kết nối đến server** \`${escapeMarkdown(address)}\`\n\n` +
                `**Nguyên nhân có thể:**\n` +
                `• Server đang offline\n` +
                `• Địa chỉ hoặc port không đúng\n` +
                `• Server có firewall chặn query\n\n` +
                `**Hãy thử:**\n` +
                `• Kiểm tra server có online bằng Minecraft client\n` +
                `• Thêm port nếu không phải 25565: \`server.com:19132\`\n` +
                `• Dùng IP trực tiếp thay vì domain`
              ),
            );
          }

          const bannerBuffer = await this.generateServerBanner(status, status.icon);
          const fileName = 'minecraft-banner.png';
          const attachment = new AttachmentBuilder(bannerBuffer, { name: fileName });

          const motdLines = status.motd?.clean?.split('\n') || ['A Minecraft Server'];
          const motdLine1 = escapeMarkdown(motdLines[0] || 'A Minecraft Server');
          const motdLine2 = escapeMarkdown(motdLines[1] || '');

          // Clickable mention (fallback to hardcoded ID)
          const commandMention = `</minecraft-custom-server-banner:${this.cachedCommandId ?? '1552677727327359011'}>`;

          const card = new ContainerBuilder().addMediaGalleryComponents(this.gallery(fileName))
            .addTextDisplayComponents(
              text(`### ${motdLine1}${motdLine2 ? `\n**${motdLine2}**` : ''}`),
              text(
                `💡 **TIP:** Đặt banner tùy chỉnh cho Server Minecraft bằng lệnh ${commandMention}!`,
              ),
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
            .addTextDisplayComponents(
              text(
                `**${emojis.pin} Địa chỉ IP**\n` +
                  `\`${status.host}:${status.port}\`\n` +
                  `-# [${status.software || 'Unknown'}] ${status.ip_address || 'Unknown'}`,
              ),
              text(
                `**${emojis.users} Số lượng người chơi**\n` + `\`${status.players?.online || 0}/${status.players?.max || 0}\``,
              ),
              text(
                `**${emojis.sparkles} Phiên bản**\n` +
                  `Phần mềm: \`${status.software || 'Unknown'}\`\n` +
                  `Phiên bản: \`${status.version?.name_clean || 'Unknown'}\``,
              ),
            )
            .addTextDisplayComponents(text(`-# Bánh Cuốn Bot • <t:${Math.floor(Date.now() / 1000)}:R>`));

          await this.send(interaction, card, [attachment]);
        } catch (error: any) {
          await this.send(interaction, this.notice(`${emojis.error} Lỗi: ${error.message}`));
        }
      },
    };

    // /minecraft-custom-server-banner
    const customBannerCommand = {
      data: new SlashCommandBuilder()
        .setName('minecraft-custom-server-banner')
        .setDescription('Tạo banner máy chủ Minecraft')
        .addStringOption((option) =>
          option.setName('address').setDescription('IP hoặc tên máy chủ, có thể kèm cổng').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('style')
            .setDescription('Chọn giao diện nền cho banner')
            .setRequired(false)
            .addChoices(
              { name: '🌙 End Stone', value: 'end_stone' },
              { name: '🌲 Grass Block', value: 'grass' },
              { name: '🪨 Stone Bricks', value: 'stone' },
              { name: '🔥 Nether Bricks', value: 'nether' },
              { name: '❄️ Ice', value: 'ice' },
              { name: '🌳 Oak Planks', value: 'oak' },
              { name: '🟫 Dirt', value: 'dirt' },
              { name: '🌿 Moss Block', value: 'moss' },
            ),
        )
        .addStringOption((option) =>
          option
            .setName('layout')
            .setDescription('Chọn cách sắp xếp thông tin trên banner')
            .setRequired(false)
            .addChoices(
              { name: '📐 Default - Classic', value: 'default' },
              { name: '📏 Compact', value: 'compact' },
              { name: '📋 Detailed', value: 'detailed' },
              { name: '📄 Minimal', value: 'minimal' },
              { name: '🖼️ Wide Screen', value: 'wide' },
            ),
        )
        .addStringOption((option) =>
          option
            .setName('text-effect')
            .setDescription('Chọn hiệu ứng hiển thị chữ')
            .setRequired(false)
            .addChoices(
              { name: '✨ None - Clean', value: 'none' },
              { name: '🌟 Glow', value: 'glow' },
              { name: '🎨 Gradient', value: 'gradient' },
              { name: '🔥 Fire', value: 'fire' },
              { name: '💎 Diamond', value: 'diamond' },
            ),
        )
        .addBooleanOption((option) =>
          option
            .setName('animated')
            .setDescription('Tạo banner GIF với hiệu ứng số người chơi')
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName('border')
            .setDescription('Chọn kiểu đường viền cho banner')
            .setRequired(false)
            .addChoices(
              { name: '🚫 None', value: 'none' },
              { name: '⬛ Simple', value: 'simple' },
              { name: '🟫 Double', value: 'double' },
              { name: '✨ Fancy', value: 'fancy' },
            ),
        )
        .addStringOption((option) =>
          option
            .setName('text-color')
            .setDescription('Chọn màu chữ chính trên banner')
            .setRequired(false)
            .addChoices(
              { name: '⚪ White', value: '#FFFFFF' },
              { name: '🟡 Yellow', value: '#FFFF55' },
              { name: '🟠 Orange', value: '#FFAA00' },
              { name: '🔴 Red', value: '#FF5555' },
              { name: '🟢 Green', value: '#55FF55' },
              { name: '🔵 Blue', value: '#5555FF' },
              { name: '🟣 Purple', value: '#AA00AA' },
              { name: '🟤 Brown', value: '#AA5500' },
              { name: '⚫ Black', value: '#000000' },
              { name: '🩶 Gray', value: '#AAAAAA' },
              { name: '💙 Aqua', value: '#55FFFF' },
              { name: '💗 Pink', value: '#FF55FF' },
            ),
        )
        .addStringOption((option) =>
          option
            .setName('custom-color')
            .setDescription('Mã màu HEX tùy chỉnh (định dạng #RRGGBB)')
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName('accent-color')
            .setDescription('Chọn màu phụ cho số người chơi và phiên bản')
            .setRequired(false)
            .addChoices(
              { name: '🟢 Green (Default)', value: '#55FF55' },
              { name: '🟡 Yellow', value: '#FFFF55' },
              { name: '🔴 Red', value: '#FF5555' },
              { name: '🔵 Blue', value: '#5555FF' },
              { name: '💙 Aqua', value: '#55FFFF' },
              { name: '⚪ White', value: '#FFFFFF' },
              { name: '🩶 Gray', value: '#AAAAAA' },
            ),
        )
        .addStringOption((option) =>
          option
            .setName('title')
            .setDescription('Tiêu đề thay thế tên máy chủ trên banner')
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName('footer-text')
            .setDescription('Nội dung chân banner (mặc định là thông tin máy chủ)')
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName('description')
            .setDescription('Dòng mô tả bổ sung hiển thị bên dưới MOTD')
            .setRequired(false),
        ),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062 || error.code === 40060) return;
          throw error;
        }

        const address = interaction.options.getString('address', true);
        const style = interaction.options.getString('style') || 'end_stone';
        const layout = interaction.options.getString('layout') || 'default';
        const textEffect = interaction.options.getString('text-effect') || 'none';
        const animated = interaction.options.getBoolean('animated') || false;
        const border = interaction.options.getString('border') || 'none';
        
        // Color options - custom color overrides preset
        let textColor = interaction.options.getString('text-color') || '#FFAA00';
        const customColor = interaction.options.getString('custom-color');
        
        // Validate and use custom color if provided
        if (customColor) {
          const hexRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
          if (hexRegex.test(customColor)) {
            textColor = customColor.toUpperCase();
          } else {
            return this.send(
              interaction,
              this.notice(`${emojis.error} Custom color không hợp lệ! Sử dụng format HEX: #RRGGBB (vd: #4287f5)`),
            );
          }
        }
        
        const accentColor = interaction.options.getString('accent-color') || '#55FF55';
        
        // Custom text options
        const customTitle = interaction.options.getString('title');
        const customDescription = interaction.options.getString('description');
        const footerText = interaction.options.getString('footer-text');

        try {
          const status = await this.queryMinecraftServer(address);

          if (!status.online) {
            return this.send(
              interaction,
              this.notice(`${emojis.error} Server **${escapeMarkdown(address)}** đang offline!`),
            );
          }

          // Generate custom banner với tất cả options
          const bannerBuffer = await this.generateCustomBanner(status, {
            style,
            layout,
            textEffect,
            animated,
            border,
            textColor,
            accentColor,
            customTitle: customTitle || undefined,
            customDescription: customDescription || undefined,
            footerText: footerText || undefined,
          });

          const fileName = animated ? 'custom-banner.gif' : 'custom-banner.png';
          const attachment = new AttachmentBuilder(bannerBuffer, { name: fileName });

          const colorPreview = `🎨 ${textColor}${customColor ? ' (Custom)' : ''}`;
          const card = new ContainerBuilder()
            .addTextDisplayComponents(
              text(
                `### ${emojis.art} Custom Minecraft Banner\n` +
                  `**Server:** §6${escapeMarkdown(status.host)}§r\n` +
                  `**Players:** §a${status.players?.online || 0}§7/§c${status.players?.max || 0}§r`,
              ),
            )
            .addMediaGalleryComponents(this.gallery(fileName))
            .addTextDisplayComponents(
              text(
                `🎨 **Style:** ${style} • 📐 **Layout:** ${layout}\n` +
                  `✨ **Effect:** ${textEffect} • ${colorPreview}\n` +
                  `🖼️ **Border:** ${border}${animated ? ' • 🎬 **Animated**' : ''}\n` +
                  `-# Bánh Cuốn Banner Generator v2.0 • <t:${Math.floor(Date.now() / 1000)}:R>`,
              ),
            );

          await this.send(interaction, card, [attachment]);
        } catch (error: any) {
          await this.send(interaction, this.notice(`${emojis.error} Lỗi: ${error.message}`));
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
