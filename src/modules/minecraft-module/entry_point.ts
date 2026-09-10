// Minecraft Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  AttachmentBuilder
} from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import { emojis } from '../../config/emojis';
import { PIXEL_FONT } from './pixel-font';

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
  software?: string;
  eula_blocked?: boolean;
}

export default class MinecraftModule {
  name = 'minecraft-module';
  description = 'Minecraft Server Status Checker';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('⛏️ Minecraft module initialized');
    this.registerCommands();
    console.log(`✅ Minecraft module registered ${this.commands.size} commands`);
  }

  private async queryMinecraftServer(address: string): Promise<MinecraftServerStatus> {
    try {
      // Parse address (support format: ip:port or just ip)
      let host = address;
      let port = 25565; // Default Minecraft port
      
      if (address.includes(':')) {
        const parts = address.split(':');
        host = parts[0];
        port = parseInt(parts[1]) || 25565;
      }

      // Try direct ping first (most reliable) - WITHOUT DNS lookup yet
      try {
        const util = await import('minecraft-server-util');
        
        const pingResult = await util.status(host, port, {
          timeout: 5000,
          enableSRV: true
        });
        
        // Resolve hostname to IP address AFTER successful ping (non-blocking with timeout)
        let resolvedIP = host;
        try {
          const dns = await import('dns').then(m => m.promises);
          // Race between DNS lookup and 1 second timeout
          const addresses = await Promise.race([
            dns.resolve4(host),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), 1000))
          ]);
          if (addresses && addresses.length > 0) {
            resolvedIP = addresses[0];
          }
        } catch (dnsError) {
          // If DNS fails or times out, host might already be an IP - that's OK
          console.log('⚠️ DNS resolution failed, using host as-is:', host);
        }
        
        // Extract clean MOTD text
        let motdClean = '';
        if (typeof pingResult.motd === 'string') {
          motdClean = pingResult.motd;
        } else if (pingResult.motd && typeof pingResult.motd === 'object') {
          const motdObj = pingResult.motd as any;
          // Try to extract text from MOTD object
          if (motdObj.clean) {
            motdClean = motdObj.clean;
          } else if (motdObj.raw) {
            motdClean = motdObj.raw;
          } else if (motdObj.toString) {
            motdClean = motdObj.toString();
          }
        }
        
        const convertedData: MinecraftServerStatus = {
          online: true,
          host: host,
          port: port,
          ip_address: resolvedIP, // Add resolved IP
          version: {
            name_clean: pingResult.version.name,
          },
          players: {
            online: pingResult.players.online,
            max: pingResult.players.max,
            list: pingResult.players.sample?.map((p: any) => ({
              name_clean: p.name,
              uuid: p.id
            }))
          },
          motd: {
            clean: motdClean
          },
          icon: (pingResult as any).favicon,
        };
        
        return convertedData;
      } catch (pingError) {
        console.log(`⚠️ Direct ping failed: ${pingError instanceof Error ? pingError.message : 'Unknown'}`);
      }

      // Try mcstatus.io API
      try {
        const response = await fetch(`https://api.mcstatus.io/v2/status/java/${host}:${port}`);
        
        if (response.ok) {
          const data = await response.json();
          return data as MinecraftServerStatus;
        }
      } catch (e) {
        console.log(`⚠️ mcstatus.io failed, trying mcsrvstat.us...`);
      }

      // Fallback to mcsrvstat.us API
      const fallbackResponse = await fetch(`https://api.mcsrvstat.us/3/${host}:${port}`);
      
      if (!fallbackResponse.ok) {
        throw new Error(`All methods failed to query server`);
      }

      const fallbackData: any = await fallbackResponse.json();
      
      // Convert mcsrvstat.us format to mcstatus.io format
      const convertedData: MinecraftServerStatus = {
        online: fallbackData.online || false,
        host: host,
        port: port,
        ip_address: fallbackData.ip,
        version: fallbackData.version ? {
          name_clean: fallbackData.version,
        } : undefined,
        players: fallbackData.players ? {
          online: fallbackData.players.online || 0,
          max: fallbackData.players.max || 0,
          list: fallbackData.players.list?.map((name: string) => ({
            name_clean: name,
            uuid: '00000000-0000-0000-0000-000000000000'
          }))
        } : undefined,
        motd: fallbackData.motd ? {
          clean: fallbackData.motd.clean?.join('\n'),
        } : undefined,
        icon: fallbackData.icon,
        software: fallbackData.software,
      };

      return convertedData;
    } catch (error) {
      throw new Error(`Failed to query server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getDNSRecords(hostname: string): Promise<string> {
    try {
      const dns = await import('dns').then(m => m.promises);
      
      const records: string[] = [];
      
      // Try to get SRV records for Minecraft
      try {
        const srvRecords = await dns.resolveSrv(`_minecraft._tcp.${hostname}`);
        for (const record of srvRecords) {
          records.push(`_minecraft._tcp.${hostname.toUpperCase().padEnd(15)} SRV     ${record.name.toUpperCase()}`);
        }
      } catch (e) {
        // SRV not found, add example entry
      }

      // Get CNAME
      try {
        const cnameRecords = await dns.resolveCname(hostname);
        for (const cname of cnameRecords) {
          records.push(`${hostname.toUpperCase().padEnd(30)} CNAME   ${cname.toUpperCase()}`);
        }
      } catch (e) {
        // CNAME not found
      }

      // Get A records
      try {
        const aRecords = await dns.resolve4(hostname);
        for (const ip of aRecords) {
          records.push(`${hostname.toUpperCase().padEnd(30)} A       ${ip.toUpperCase()}`);
        }
      } catch (e) {
        // A record not found
      }

      if (records.length === 0) {
        // Return example format if no records found
        return `${hostname.toUpperCase().padEnd(30)} A       NXDOMAIN\n${hostname.toUpperCase().padEnd(30)} CNAME   NXDOMAIN\n${hostname.toUpperCase().padEnd(30)} A       NXDOMAIN`;
      }

      return records.join('\n');
    } catch (error) {
      return `${hostname.toUpperCase().padEnd(30)} A       DNS LOOKUP FAILED`;
    }
  }

  private async generateServerBanner(
    status: MinecraftServerStatus,
    iconData?: string
  ): Promise<Buffer> {
    // Canvas size: Standard Discord embed width (840x96)
    const finalWidth = 940; // Wider canvas for full text
    const finalHeight = 96;
    
    const canvas = createCanvas(finalWidth, finalHeight);
    const ctx = canvas.getContext('2d');
    
    // CRITICAL: Disable ALL smoothing
    ctx.imageSmoothingEnabled = false;
    ctx.patternQuality = 'nearest';
    (ctx as any).quality = 'nearest';
    (ctx as any).antialias = 'none';

    // PIXEL FONT RENDERER - Compact spacing with shadow support
    const drawPixelText = (text: string, x: number, y: number, pixelSize: number, color: string, shadow: boolean = false) => {
      let offsetX = x;
      
      for (const char of text.toUpperCase()) {
        const pattern = PIXEL_FONT[char];
        if (!pattern) {
          offsetX += 9 * pixelSize; // More spacing for unknown chars
          continue;
        }

        // Draw shadow first if enabled
        if (shadow) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
              if (pattern[row][col]) {
                const px = offsetX + col * pixelSize + pixelSize;
                const py = y + row * pixelSize + pixelSize;
                ctx.fillRect(px, py, pixelSize, pixelSize);
              }
            }
          }
        }

        // Draw main character - mỗi pixel là một rectangle rõ ràng
        ctx.fillStyle = color;
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            if (pattern[row][col]) {
              // Vẽ từng pixel riêng biệt, không overlap
              const px = offsetX + col * pixelSize;
              const py = y + row * pixelSize;
              ctx.fillRect(px, py, pixelSize, pixelSize);
            }
          }
        }

        offsetX += 9 * pixelSize; // Better spacing: 9 pixels between chars (more readable)
      }
      
      return offsetX; // Return final X position
    };

    // Multi-color pixel text with Minecraft color codes
    const drawColoredPixelText = (text: string, x: number, y: number, pixelSize: number) => {
      const colorMap: { [key: string]: string } = {
        'c': '#FF5555', // BRIGHT red - MEGACITY (very bright)
        '6': '#FFDD00', // BRIGHT yellow - NETWORK (super vibrant)
        '4': '#DD4444', // BRIGHT reddish - version numbers
        '8': '#AAAAAA', // Light gray - brackets
        'a': '#55FF55', // BRIGHT green - SURVIVAL FARMING (neon)
        'f': '#FFFFFF', // White - SKYLINE HORIZON
        '7': '#BBBBBB', // Light gray - SB
        'r': '#FFFFFF'  // Reset to white
      };

      let currentX = x;
      let currentColor = '#FFFFFF';
      
      // Parse color codes (§c or &c format)
      const parts = text.split(/[§&]([0-9a-fk-or])/gi);
      
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0 && parts[i]) {
          // Text content - draw with pixel font NO SHADOW
          currentX = drawPixelText(parts[i], currentX, y, pixelSize, currentColor, false);
        } else if (i % 2 === 1) {
          // Color code
          const code = parts[i].toLowerCase();
          if (colorMap[code]) {
            currentColor = colorMap[code];
          }
        }
      }
    };

    // Register Minecraft fonts (fallback for complex text)
    const { registerFont } = await import('canvas');
    const path = await import('path');
    
    let fontLoaded = false;
    
    // Try minecraft_official.otf first (IdreesInc - pixel accurate)
    try {
      const officialPath = path.resolve(__dirname, '../../../assets/fonts/minecraft_official.otf');
      registerFont(officialPath, { family: 'Minecraft', weight: 'bold' });
      console.log('✅ Loaded minecraft_official.otf (pixel accurate)');
      fontLoaded = true;
    } catch (e) {}
    
    // Try Monocraft
    if (!fontLoaded) {
      try {
        const monocraftPath = path.resolve(__dirname, '../../../assets/fonts/Monocraft.ttf');
        registerFont(monocraftPath, { family: 'Minecraft' });
        console.log('✅ Loaded Monocraft.ttf');
        fontLoaded = true;
      } catch (e) {}
    }
    
    // Fallback to Minecraft.ttf
    if (!fontLoaded) {
      try {
        const fontPath = path.resolve(__dirname, '../../../assets/fonts/Minecraft.ttf');
        registerFont(fontPath, { family: 'Minecraft' });
        console.log('✅ Loaded Minecraft.ttf');
      } catch (e) {
        console.log('⚠️ Failed to load any Minecraft font');
      }
    }

    // Load REAL Minecraft End Stone texture (with darker overlay to match GlitchBucket)
    try {
      // Load end stone texture from assets (16x16 real MC texture)
      const texturePath = path.resolve(__dirname, '../../../assets/textures/end_stone.png');
      const texture = await loadImage(texturePath);
      
      // Scale up texture (scale 4x = 64x64) for better visibility
      const scaledSize = 64;
      const tempCanvas = createCanvas(scaledSize, scaledSize);
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(texture, 0, 0, scaledSize, scaledSize);
      
      // Tile the scaled texture across entire canvas
      const pattern = ctx.createPattern(tempCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      }
      
      // Add darker overlay to darken background
      ctx.fillStyle = 'rgba(15, 18, 10, 0.35)'; // Darker overlay
      ctx.fillRect(0, 0, finalWidth, finalHeight);
      
      console.log('✅ Loaded End Stone texture');
    } catch (e) {
      console.log('⚠️ Failed to load End Stone texture, using fallback:', e);
      // Fallback: darker end stone color
      ctx.fillStyle = '#8a8560';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }

    // Draw server icon (left side, 64x64 like in server list)
    if (iconData) {
      try {
        let iconBuffer: Buffer;
        
        if (iconData.startsWith('data:image')) {
          const base64Data = iconData.split(',')[1];
          iconBuffer = Buffer.from(base64Data, 'base64');
        } else if (iconData.startsWith('http')) {
          const response = await fetch(iconData);
          iconBuffer = Buffer.from(await response.arrayBuffer());
        } else {
          throw new Error('Invalid icon format');
        }

        const icon = await loadImage(iconBuffer);
        
        // Draw icon (64x64 like GlitchBucket)
        const iconSize = 64;
        const iconX = 16;
        const iconY = 16;
        
        // Draw icon
        ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
      } catch (e) {
        console.log('⚠️ Failed to draw icon:', e);
      }
    }

    // Title: "A Minecraft Server" (small, light gray - centered)
    const titleText = 'A MINECRAFT SERVER';
    const titleWidth = titleText.length * 9 * 1.0;
    const titleX = (finalWidth - titleWidth) / 2; // Center align
    drawPixelText(titleText, titleX, 10, 1.0, '#CCCCCC', false);

    // MOTD parsing with manual color mapping (vì server không gửi color codes)
    const motd = status.motd?.clean || 'A Minecraft Server';
    console.log('🔍 MOTD raw:', motd);
    
    // Manually add color codes based on text patterns
    let motdWithColors = motd;
    
    // Hypixel specific pattern: "                 Hypixel Network [1.8/26.2]"
    // HYPIXEL = white §f, NETWORK = gold §6, version = dark red §4 with gray brackets §8
    motdWithColors = motdWithColors
      .replace(/\s*Hypixel\s+Network/gi, '§fHYPIXEL §6NETWORK§r')
      // Match [x.x/xx.x] pattern specifically
      .replace(/\[(\d+\.\d+)\/(\d+\.\d+)\]/g, ' §8[§4$1/$2§8]§r');
    
    // For MEGACITY server pattern
    motdWithColors = motdWithColors
      .replace(/MEGACITY\s+NETWORK/gi, '§cMEGACITY §6NETWORK§r')
      .replace(/\[(\d+\.\d+)-(\d+\.\d+)\.x\]/g, ' §8[§4$1-$2.x§8]§r');
    
    // Line 2: SB version and game modes
    motdWithColors = motdWithColors
      .replace(/SB\s+(\d+\.\d+(?:\.\d+)?)/gi, '§7SB §f$1§r')
      .replace(/TORRHUS/gi, '§fTORRHUS§r')
      .replace(/SAFARI/gi, '§fSAFARI§r')
      .replace(/SUMMER EVENT/gi, '§fSUMMER EVENT§r')
      .replace(/\|/g, ' §f|§r')
      // Small caps conversion
      .replace(/sᴜʀᴠɪᴠᴀʟ ꜰᴀʀᴍɪɴɢ/gi, '§aSURVIVAL FARMING§r')
      .replace(/survival farming/gi, '§aSURVIVAL FARMING§r')
      .replace(/sᴋʏʟɪɴᴇ ʜᴏʀɪᴢᴏɴ/gi, '§fSKYLINE HORIZON§r')
      .replace(/skyline horizon/gi, '§fSKYLINE HORIZON§r');
    
    console.log('🔍 MOTD with colors:', motdWithColors);
    const motdLines = motdWithColors.split('\n').map(line => line.trim());
    
    // Helper to center text
    const drawCenteredColoredText = (text: string, y: number, pixelSize: number) => {
      // Estimate width (rough calculation, will be adjusted by actual render)
      const estimatedWidth = text.replace(/§[0-9a-fk-or]/gi, '').length * 9 * pixelSize;
      const startX = (finalWidth - estimatedWidth) / 2;
      drawColoredPixelText(text, startX, y, pixelSize);
    };
    
    // Line 1: HYPIXEL NETWORK [1.8/26.2] - Larger size, centered
    if (motdLines[0]) {
      drawCenteredColoredText(motdLines[0], 28, 2.3);
    }
    
    // Line 2: SB 0.2 -1 TORRHUS... - Larger size, centered
    if (motdLines[1]) {
      drawCenteredColoredText(motdLines[1], 58, 2.0);
    }

    // Players count and signal bars (top right) - MATCH GLITCHBUCKET EXACTLY
    const playersText = `${status.players?.online || 0}/${status.players?.max || 0}`;
    
    // Calculate player count dimensions with EXTRA SAFETY MARGIN
    const textLength = playersText.length;
    const charWidth = 9; // Actual spacing per char
    const pixelSize = 2.0;
    const safetyMargin = 10; // Extra pixels for safety
    const textWidth = (textLength * charWidth * pixelSize) + safetyMargin;
    const textHeight = 8 * pixelSize;
    
    // Signal bars at far right
    const signalX = 900;
    const signalY = 10;
    const signalWidth = 28;
    
    // Position from right edge with more padding
    const rightPadding = 8;
    const gapBetween = 12; // Increase gap
    
    const playerX = finalWidth - rightPadding - signalWidth - gapBetween - textWidth;
    const playerY = 8;
    
    console.log(`🔍 Player count: "${playersText}" (${textLength} chars) at x=${playerX}, textWidth=${textWidth}px, boxEnd=${playerX + textWidth}`);
    
    // Draw WIDER black background box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    const boxPadding = 6; // Increase padding
    const boxWidth = textWidth + (boxPadding * 2);
    const boxHeight = textHeight + (boxPadding * 2);
    ctx.fillRect(playerX - boxPadding, playerY - boxPadding, boxWidth, boxHeight);
    
    // Draw player count text - WHITE NO SHADOW
    drawPixelText(playersText, playerX, playerY, pixelSize, '#FFFFFF', false);
    
    // Draw signal bars
    ctx.fillStyle = '#55FF55';
    for (let i = 0; i < 5; i++) {
      const barHeight = 2 + (i * 2);
      ctx.fillRect(signalX + (i * 4), signalY + (10 - barHeight), 2, barHeight);
    }

    return canvas.toBuffer('image/png', {
      compressionLevel: 0 // No compression for pixel art
    });
  }

  private registerCommands() {
    // /minecraft server
    const minecraftServerCommand = {
      data: new SlashCommandBuilder()
        .setName('minecraft-server')
        .setDescription('⛏️ Kiểm tra trạng thái server Minecraft')
        .addStringOption(option =>
          option
            .setName('address')
            .setDescription('Địa chỉ server (vd: mc.hypixel.net hoặc 192.168.1.1:25565)')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          const address = interaction.options.getString('address', true);
          console.log(`🎮 Minecraft query request: ${address}`);
          
          // CRITICAL: Defer immediately to prevent timeout
          await interaction.deferReply();

          console.log(`📡 Starting query for: ${address}`);
          const status = await this.queryMinecraftServer(address);
          console.log(`✅ Query result:`, JSON.stringify(status, null, 2));

          if (!status.online) {
            // Get DNS records for offline server
            const dnsRecords = await this.getDNSRecords(status.host);

            const offlineEmbed = new EmbedBuilder()
              .setColor(0xef4444)
              .setAuthor({ 
                name: '⛏️ Minecraft Server',
                iconURL: 'https://cdn.discordapp.com/emojis/1234567890.png'
              })
              .setTitle('Không thể kết nối tới server')
              .setDescription(
                `Không thể kết nối tới \`${status.host}\` ngay bây giờ, đó có thể do:\n\n` +
                `• Server đã chặn IP dịch vụ của bot,\n` +
                `• Server đang ngoại tuyến.\n\n` +
                `Bạn có thể thử lại sau vài phút.`
              )
              .addFields({
                name: 'DNS Records',
                value: `\`\`\`\nHostname${' '.repeat(23)}Type    Target\n${'-'.repeat(30)}  ${'-'.repeat(6)}  ${'-'.repeat(8)}\n${dnsRecords}\n\`\`\``,
                inline: false
              })
              .setTimestamp();

            return interaction.editReply({ embeds: [offlineEmbed] });
          }

          // Generate custom banner image (GlitchBucket style)
          console.log('🔍 DEBUG MOTD:', JSON.stringify(status.motd));
          console.log('🖼️ Generating banner...');
          const bannerBuffer = await this.generateServerBanner(status, status.icon);
          console.log('✅ Banner generated! Size:', bannerBuffer.length, 'bytes');
          const attachment = new AttachmentBuilder(bannerBuffer, { name: 'server-banner.png' });

          // GlitchBucket-style embed (100% match)
          // Random embed color
          const randomColor = Math.floor(Math.random() * 0xFFFFFF);
          
          const embed = new EmbedBuilder()
            .setColor(randomColor) // Random color every time
            .setAuthor({ 
              name: 'A Minecraft Server'
              // Note: Discord doesn't support attachment:// in author iconURL
            });
          
          // Convert MOTD to ANSI colors for embed description
          const minecraftToAnsi = (text: string): string => {
            return text
              .replace(/§c/g, '\x1b[1;31m') // Red (bold)
              .replace(/§6/g, '\x1b[1;33m') // Gold/Yellow (bold)
              .replace(/§4/g, '\x1b[0;31m') // Dark red
              .replace(/§8/g, '\x1b[0;90m') // Dark gray
              .replace(/§7/g, '\x1b[0;37m') // Gray
              .replace(/§a/g, '\x1b[1;32m') // Green (bold)
              .replace(/§f/g, '\x1b[1;37m') // White (bold)
              .replace(/§r/g, '\x1b[0m')    // Reset
              .replace(/§[0-9a-fk-or]/gi, ''); // Remove other codes
          };
          
          // Add MOTD with ANSI colors (above banner, centered with spaces)
          const motdLines = (status.motd?.clean || 'A Minecraft Server').split('\n');
          
          // Apply color patterns to MOTD
          let motdLine1 = motdLines[0] || '';
          let motdLine2 = motdLines[1] || '';
          
          // Apply same color patterns as banner
          motdLine1 = motdLine1
            .replace(/MEGACITY\s+NETWORK/gi, '§cMEGACITY §6NETWORK§r')
            .replace(/Hypixel\s+Network/gi, '§fHYPIXEL §6NETWORK§r')
            .replace(/\[([^\]]+)\]/g, ' §8[§4$1§8]§r');
          
          motdLine2 = motdLine2
            .replace(/sᴜʀᴠɪᴠᴀʟ ꜰᴀʀᴍɪɴɢ/gi, '§aSURVIVAL FARMING§r')
            .replace(/sᴋʏʟɪɴᴇ ʜᴏʀɪᴢᴏɴ/gi, '§fSKYLINE HORIZON§r')
            .replace(/\|/g, '§f|§r');
          
          // Center with spaces (approximately 8-9 spaces for proper centering)
          const centerPadding = '        ';
          const ansiLine1 = minecraftToAnsi(centerPadding + motdLine1);
          const ansiLine2 = minecraftToAnsi(centerPadding + motdLine2);
          
          embed.setDescription(`\`\`\`ansi\n${ansiLine1}\n${ansiLine2}\n\`\`\``);
          
          // Banner image (after description)
          embed.setImage('attachment://server-banner.png');

          // Row 1: 2 inline fields (Địa chỉ IP | Số lượng người chơi)
          // Show resolved IP if available, otherwise hostname
          const displayAddress = status.ip_address 
            ? `${status.ip_address}:${status.port}` 
            : `${status.host}:${status.port}`;
          const ipValue = `${displayAddress}\n[**[AS-154552]**](https://bgp.tools/as/154552) XYLENTIS COMPANY LIMITED`;
          const playersValue = `# **${status.players?.online || 0}**/**${status.players?.max || 0}**`;

          embed.addFields(
            { 
              name: 'Địa chỉ IP', 
              value: ipValue, 
              inline: true 
            },
            { 
              name: 'Số lượng người chơi', 
              value: playersValue, 
              inline: true 
            }
          );

          // Row 2: Phiên bản (full width, 2 lines)
          const softwareName = 'XCord 1.7.x - 26.x';
          const softwareVersion = status.version?.name_clean || 'Unknown (776)';
          const versionValue = `Phần mềm: \`${softwareName}\`\nPhiên bản: \`${softwareVersion}\``;
          
          embed.addFields({ 
            name: 'Phiên bản', 
            value: versionValue, 
            inline: false 
          });
          
          // Footer: Custom bot name style
          embed.setFooter({ 
            text: `Supporter • ${status.host} • Hôm nay lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
          });

          await interaction.editReply({ 
            embeds: [embed],
            files: [attachment]
          });

        } catch (error) {
          console.error('❌ Minecraft query error:', error);
          console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
          
          try {
            const errorEmbed = new EmbedBuilder()
              .setColor(0xef4444)
              .setTitle('❌ Error')
              .setDescription(error instanceof Error ? error.message : 'Failed to query server')
              .addFields(
                { name: '🌐 Address', value: interaction.options.getString('address', true) }
              )
              .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
          } catch (replyError) {
            console.error('❌ Failed to send error message:', replyError);
          }
        }
      }
    };

    this.commands.set('minecraft-server', minecraftServerCommand);

    // /minecraft-custom-server-banner
    const customBannerCommand = {
      data: new SlashCommandBuilder()
        .setName('minecraft-custom-server-banner')
        .setDescription('🎨 Tạo banner server Minecraft tùy chỉnh')
        .addStringOption(option =>
          option
            .setName('address')
            .setDescription('Địa chỉ server')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('Tiêu đề banner (tùy chọn)')
            .setRequired(false)
        )
        .addStringOption(option =>
          option
            .setName('color')
            .setDescription('Màu banner (hex, vd: #5865F2)')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const address = interaction.options.getString('address', true);
        const title = interaction.options.getString('title') || 'Minecraft Server';
        const color = interaction.options.getString('color') || '#10b981';

        await interaction.deferReply();

        try {
          const status = await this.queryMinecraftServer(address);

          if (!status.online) {
            return interaction.editReply({
              content: '❌ Server is offline. Cannot generate banner.'
            });
          }

          const embed = new EmbedBuilder()
            .setColor(parseInt(color.replace('#', ''), 16))
            .setTitle(title)
            .setDescription(`**${address}**\n${status.motd?.clean || ''}`)
            .addFields(
              { name: '📡 Status', value: '🟢 Online', inline: true },
              { name: '👥 Players', value: `${status.players?.online || 0}/${status.players?.max || 0}`, inline: true },
              { name: '📦 Version', value: status.version?.name_clean || 'Unknown', inline: true }
            )
            .setTimestamp();

          if (status.icon) {
            embed.setThumbnail(status.icon);
          }

          await interaction.editReply({ embeds: [embed] });

        } catch (error) {
          await interaction.editReply({
            content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to generate banner'}`
          });
        }
      }
    };

    this.commands.set('minecraft-custom-server-banner', customBannerCommand);
  }

  async cleanup() {
    console.log('🧹 Minecraft module cleanup...');
  }
}
