import {
  Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction,
  PermissionFlagsBits, ChannelType, MessageFlags, AttachmentBuilder,
  ContainerBuilder, SectionBuilder, ThumbnailBuilder,
  ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { emojis, EMOJI_IDS } from '../../config/emojis';
import { V2, txt, sep, gallery } from '../../utils/v2Helper';
import testEmojiCommand from './test-emoji';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

export default class UtilityModule {
  name = 'utility';
  description = 'Utility commands (poll, calc, random, choose)';
  version = '1.0.0';
  enabled = true;

  client: Client;
  commands: Collection<string, any>;
  private gitInfoCache?: {
    expiresAt: number;
    value: { repoUrl: string; branchInfo: string; commitsText: string };
  };

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('🚀 Utility module initialized');
    this.registerCommands();
    console.log(`✅ Utility module registered ${this.commands.size} commands`);
  }

  // Generate Help Banner
  private async generateHelpBanner(): Promise<Buffer> {
    const width = 940;
    const height = 96;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Load Minecraft font
    try {
      const minecraftFontPath = path.resolve(__dirname, '../../../assets/fonts/Minecraft.ttf');
      GlobalFonts.registerFromPath(minecraftFontPath, 'Minecraft');
    } catch (e) {
      console.log('⚠️ Minecraft font not found, using default');
    }

    // Load Moss Block texture background
    try {
      const texturePath = path.resolve(__dirname, '../../../assets/textures/moss_block.png');
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
      // Darker overlay
      ctx.fillStyle = 'rgba(10, 20, 10, 0.4)';
      ctx.fillRect(0, 0, width, height);
    } catch (e) {
      // Fallback green gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#527F4E');
      gradient.addColorStop(1, '#3E5F3B');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw text with shadow
    const drawText = (text: string, x: number, y: number, fontSize: number, color: string) => {
      ctx.font = `${fontSize}px "Minecraft", monospace`;
      ctx.textBaseline = 'top';
      // Shadow
      ctx.fillStyle = '#222222';
      ctx.fillText(text, x + 2, y + 2);
      // Main text
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    // Help icon (book)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(20, 24, 48, 48);
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(24, 28, 40, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(32, 36, 8, 24);
    ctx.fillRect(44, 36, 8, 24);

    // Title
    drawText('HELP MENU', 88, 20, 28, '#FFFFFF');

    // Subtitle
    drawText('View all available commands', 88, 56, 16, '#AAAAAA');

    // Command count badge (right side)
    const totalCommands = '72+';
    ctx.fillStyle = '#5865F2';
    ctx.fillRect(820, 24, 100, 48);
    ctx.fillStyle = '#4752C4';
    ctx.fillRect(822, 26, 96, 44);
    drawText(totalCommands, 845, 32, 24, '#FFFFFF');
    drawText('COMMANDS', 832, 58, 12, '#AAAAAA');

    return canvas.toBuffer('image/png');
  }

  // Generate Info Banner
  private async generateInfoBanner(): Promise<Buffer> {
    const width = 940;
    const height = 96;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Load Minecraft font
    try {
      const minecraftFontPath = path.resolve(__dirname, '../../../assets/fonts/Minecraft.ttf');
      GlobalFonts.registerFromPath(minecraftFontPath, 'Minecraft');
    } catch (e) {
      console.log('⚠️ Minecraft font not found, using default');
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
        ctx.fillRect(0, 0, width, height);
      }
      // Darker overlay
      ctx.fillStyle = 'rgba(15, 18, 10, 0.35)';
      ctx.fillRect(0, 0, width, height);
    } catch (e) {
      // Fallback gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#8a8560');
      gradient.addColorStop(1, '#6B6847');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw text with shadow
    const drawText = (text: string, x: number, y: number, fontSize: number, color: string) => {
      ctx.font = `${fontSize}px "Minecraft", monospace`;
      ctx.textBaseline = 'top';
      // Shadow
      ctx.fillStyle = '#222222';
      ctx.fillText(text, x + 2, y + 2);
      // Main text
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    // Info icon (i in circle)
    ctx.fillStyle = '#5865F2';
    ctx.beginPath();
    ctx.arc(44, 48, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(40, 36, 8, 8); // dot
    ctx.fillRect(40, 48, 8, 16); // line

    // Title
    drawText('BOT INFORMATION', 88, 20, 28, '#FFFFFF');

    // Subtitle
    drawText('TypeScript-based Discord Bot with AI', 88, 56, 16, '#AAAAAA');

    // Version badge (right side)
    const uptime = Math.floor(process.uptime() / 3600);
    ctx.fillStyle = '#57F287';
    ctx.fillRect(780, 24, 140, 48);
    ctx.fillStyle = '#3BA55D';
    ctx.fillRect(782, 26, 136, 44);
    drawText('ONLINE', 810, 32, 20, '#FFFFFF');
    drawText(`${uptime}h uptime`, 792, 58, 12, '#E0E0E0');

    return canvas.toBuffer('image/png');
  }

  // Generate Rule Banner
  private async generateRuleBanner(): Promise<Buffer> {
    const width = 940;
    const height = 96;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Load Minecraft font
    try {
      const minecraftFontPath = path.resolve(__dirname, '../../../assets/fonts/Minecraft.ttf');
      GlobalFonts.registerFromPath(minecraftFontPath, 'Minecraft');
    } catch (e) {
      console.log('⚠️ Minecraft font not found, using default');
    }

    // Red gradient background (rule theme)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ED4245');
    gradient.addColorStop(1, '#A32D30');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Darker overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Draw text with shadow
    const drawText = (text: string, x: number, y: number, fontSize: number, color: string) => {
      ctx.font = `${fontSize}px "Minecraft", monospace`;
      ctx.textBaseline = 'top';
      // Shadow
      ctx.fillStyle = '#222222';
      ctx.fillText(text, x + 2, y + 2);
      // Main text
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    // Scroll icon (left)
    ctx.fillStyle = '#F4E4C1';
    ctx.fillRect(20, 20, 56, 56);
    ctx.fillStyle = '#E8D4A8';
    ctx.fillRect(24, 24, 48, 48);

    // Scroll lines
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(32, 32, 32, 4);
    ctx.fillRect(32, 40, 32, 4);
    ctx.fillRect(32, 48, 24, 4);
    ctx.fillRect(32, 56, 28, 4);
    ctx.fillRect(32, 64, 32, 4);

    // Title
    drawText('SERVER RULES', 96, 20, 28, '#FFFFFF');

    // Subtitle
    drawText('Read and follow these guidelines', 96, 56, 16, '#FFCCCC');

    // Warning badge (right side)
    ctx.fillStyle = '#FEE75C';
    ctx.fillRect(800, 24, 120, 48);
    ctx.fillStyle = '#E6D054';
    ctx.fillRect(802, 26, 116, 44);

    // Warning triangle
    ctx.fillStyle = '#ED4245';
    ctx.beginPath();
    ctx.moveTo(860, 36);
    ctx.lineTo(850, 52);
    ctx.lineTo(870, 52);
    ctx.closePath();
    ctx.fill();

    // Exclamation mark
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(858, 40, 4, 6);
    ctx.fillRect(858, 48, 4, 2);

    drawText('IMPORTANT', 812, 58, 12, '#8B4513');

    return canvas.toBuffer('image/png');
  }

  // Phân loại lệnh cho /help
  private categorize(allCommands: any[]) {
    const categories: Record<string, { emoji: string; commands: { name: string; description: string }[] }> = {};

    for (const cmd of allCommands) {
      const name = cmd.data.name;
      const description = cmd.data.description || 'No description';
      let category = 'Khác';
      let emoji = `${emojis.art}`;

      // Hệ thống xử lí tin nhắn
      if (name.startsWith('ticket-') || name.startsWith('sticky-') || name.startsWith('autoresponder-')) {
        category = 'Hệ thống xử lí tin nhắn'; emoji = `${emojis.message}`;
      } 
      // Moderation
      else if (name.startsWith('moderation-')) {
        category = 'Moderation'; emoji = `${emojis.shield}`;
      } 
      // Giải trí
      else if (
        name.startsWith('ai-') || name === 'ai' ||
        ['kiss', 'hug', 'slap', 'bite', 'pat', 'punch', 'handhold'].includes(name) ||
        name.startsWith('gtn-') || name.startsWith('giveaway-')
      ) {
        category = 'Giải trí'; emoji = `${emojis.sparkles}`;
      } 
      // Management
      else if (
        name.startsWith('customrole-') || name.startsWith('donation-') || 
        name.startsWith('quickreport-') || name === 'Report Message' || 
        name.startsWith('generator') || name.startsWith('admin-')
      ) {
        category = 'Management'; emoji = `${emojis.gear}`;
      } 
      // Economy & Shop
      else if (
        name.startsWith('daily') || name.startsWith('balance') || 
        name.startsWith('shop-') || name.startsWith('quest-') ||
        name.startsWith('vip-') || name.startsWith('coins-')
      ) {
        category = 'Economy'; emoji = `${emojis.coins}`;
      }
      // Utility
      else if (
        ['poll', 'calc', 'random', 'choose', 'information', 'help', 'rule', 'rule-setup'].includes(name) ||
        name.startsWith('afk-') || name.startsWith('minecraft-') || 
        name.startsWith('snipe') || name === 'editsnipe' ||
        name.startsWith('convert-')
      ) {
        category = 'Utility'; emoji = `${emojis.wrench}`;
      }

      (categories[category] ??= { emoji, commands: [] }).commands.push({ name, description });
    }

    return categories;
  }

  // Convert emoji string to dropdown-compatible format
  private getCategoryEmojiForDropdown(category: string): { id: string; name: string } | string {
    // Map category names to emoji IDs
    const emojiMap: Record<string, { id: string; name: string }> = {
      'Hệ thống xử lí tin nhắn': { id: EMOJI_IDS.message, name: 'message' },
      'Giải trí': { id: EMOJI_IDS.sparkles, name: 'sparkles' },
      'Economy': { id: EMOJI_IDS.coin, name: 'coin' },
      'Management': { id: EMOJI_IDS.gear, name: 'gear' },
      'Moderation': { id: EMOJI_IDS.shield, name: 'shield' },
      'Utility': { id: EMOJI_IDS.wrench, name: 'wrench' },
      'Khác': { id: EMOJI_IDS.art, name: 'art' },
    };

    return emojiMap[category] || '📦';
  }

  // Lấy thông tin git cho /information
  private async getGitInfo() {
    const repoOwner = 'phuong79yc-afk';
    const repoName = 'banh-mi-bot';
    const repoUrl = `https://github.com/${repoOwner}/${repoName}`;
    if (this.gitInfoCache && this.gitInfoCache.expiresAt > Date.now()) {
      return this.gitInfoCache.value;
    }

    const railwayCommit = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7);
    const railwayBranch = process.env.RAILWAY_GIT_BRANCH || 'main';
    let branchInfo = `Branch: \`${railwayBranch}\``;
    if (railwayCommit) {
      branchInfo += ` • Commit \`${railwayCommit}\``;
    }

    let commitsText = railwayCommit
      ? `-# Latest commit [\`${railwayCommit}\`](${repoUrl}/commit/${railwayCommit})`
      : '-# Chưa tải được thông tin commit mới nhất.';
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=5`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'BanhCuonBot',
          ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

      const commits: unknown = await response.json();
      if (!Array.isArray(commits)) throw new Error('GitHub API returned an invalid commit list');

      const toVi = (date: string) => {
        const diff = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
        if (diff < 60) return `${diff} giây trước`;
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
        if (diff < 2592000) return `${Math.floor(diff / 604800)} tuần trước`;
        if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
        return `${Math.floor(diff / 31536000)} năm trước`;
      };

      const entries = commits
        .filter((commit): commit is {
          sha: string;
          commit: { message: string; author: { date: string } };
        } => Boolean(
          commit &&
          typeof commit === 'object' &&
          'sha' in commit && typeof commit.sha === 'string' &&
          'commit' in commit && commit.commit &&
          typeof commit.commit === 'object' &&
          'message' in commit.commit && typeof commit.commit.message === 'string' &&
          'author' in commit.commit && commit.commit.author &&
          typeof commit.commit.author === 'object' &&
          'date' in commit.commit.author && typeof commit.commit.author.date === 'string'
        ))
        .slice(0, 5);

      if (!entries.length) throw new Error('GitHub API returned no usable commits');
      commitsText = entries.map((commit) => {
        const hash = commit.sha.slice(0, 7);
        const message = commit.commit.message.split('\n')[0].slice(0, 60);
        return `-# ${toVi(commit.commit.author.date)} [\`${hash}\`](${repoUrl}/commit/${commit.sha}) ${message}`;
      }).join('\n');
    } catch (error) {
      console.warn('[Git] Failed to fetch latest commits from GitHub:', error);
    }

    const value = { repoUrl, branchInfo, commitsText };
    this.gitInfoCache = { expiresAt: Date.now() + 60_000, value };
    return value;
  }

  private registerCommands() {
    const self = this;

    // ───────── POLL ─────────
    const pollCommand = {
      data: new SlashCommandBuilder()
        .setName('poll').setDescription('Tạo bình chọn')
        .addStringOption(o => o.setName('question').setDescription('❓ Câu hỏi bình chọn').setRequired(true))
        .addStringOption(o => o.setName('options').setDescription('Các lựa chọn (phân cách bằng dấu phẩy, tối đa 10)').setRequired(true)),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const question = interaction.options.getString('question', true);
        const options = interaction.options.getString('options', true).split(',').map(o => o.trim()).filter(Boolean);

        if (options.length < 2 || options.length > 10) {
          return interaction.reply({
            content: options.length < 2 ? `${emojis.error} Cần ít nhất 2 options!` : `${emojis.error} Tối đa 10 options!`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const nums = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        const container = new ContainerBuilder().addTextDisplayComponents(txt(`## ${emojis.chart} Poll`), txt(`### ${question}`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(options.map((o, i) => `${nums[i]}  ${o}`).join('\n')))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`-# ${emojis.users} React để vote • Poll by ${interaction.user.username}`));

        const res = await interaction.reply({ components: [container], flags: V2, withResponse: true });
        const message = res.resource!.message!;
        for (let i = 0; i < options.length; i++) await message.react(nums[i]);
      },
    };

    // ───────── CALC ─────────
    const calcCommand = {
      data: new SlashCommandBuilder()
        .setName('calc').setDescription('� Tính toán biểu thức')
        .addStringOption(o => o.setName('expression').setDescription('� Biểu thức toán học (vd: 2+2, 5*10)').setRequired(true)),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const expression = interaction.options.getString('expression', true);

        try {
          // Chỉ cho phép số và toán tử cơ bản
          const sanitized = expression.replace(/[^0-9+\-*/.()%\s]/g, '');
          const result = eval(sanitized);

          if (typeof result !== 'number' || !isFinite(result)) throw new Error('Kết quả không hợp lệ');

          const container = new ContainerBuilder().addTextDisplayComponents(txt(`## ${emojis.terminal} Calculator`))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`**Expression**\n\`${expression}\``), txt(`# ${result}`));

          await interaction.reply({ components: [container], flags: V2 });
        } catch (error: any) {
          await interaction.reply({ content: `${emojis.error} Invalid expression: ${error.message}`, flags: MessageFlags.Ephemeral });
        }
      },
    };

    // ───────── RANDOM ─────────
    const randomCommand = {
      data: new SlashCommandBuilder()
        .setName('random').setDescription('� Tạo số ngẫu nhiên')
        .addIntegerOption(o => o.setName('min').setDescription('� Giá trị tối thiểu').setRequired(false))
        .addIntegerOption(o => o.setName('max').setDescription('� Giá trị tối đa').setRequired(false)),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const min = interaction.options.getInteger('min') ?? 1;
        const max = interaction.options.getInteger('max') ?? 100;

        if (min >= max) {
          return interaction.reply({ content: `${emojis.error} Min phải nhỏ hơn Max!`, flags: MessageFlags.Ephemeral });
        }

        const result = Math.floor(Math.random() * (max - min + 1)) + min;

        const container = new ContainerBuilder().addTextDisplayComponents(txt(`## ${emojis.sparkles} Random Number`), txt(`-# Range: ${min} – ${max}`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`# ${result}`));

        await interaction.reply({ components: [container], flags: V2 });
      },
    };

    // ───────── CHOOSE ─────────
    const chooseCommand = {
      data: new SlashCommandBuilder()
        .setName('choose').setDescription('Chọn giữa các lựa chọn với hiệu ứng')
        .addStringOption(o => o.setName('options').setDescription('Các lựa chọn (phân cách bằng dấu phẩy, vd: pizza, burger, sushi)').setRequired(true)),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const options = interaction.options.getString('options', true).split(',').map(o => o.trim()).filter(Boolean);

        if (options.length < 2) {
          return interaction.reply({ content: `${emojis.error} Cần ít nhất 2 options phân cách bởi dấu phẩy!`, flags: MessageFlags.Ephemeral });
        }

        try { await interaction.deferReply(); }
        catch (error: any) { if (error.code === 10062 || error.code === 40060) return; throw error; }

        const frame = (text: string, color = 0xFEE75C) => ({
          components: [new ContainerBuilder().addTextDisplayComponents(txt(`## ${text}`))],
          flags: V2 as any,
        });

        const frames = [
          `${emojis.loading} Đang suy nghĩ...`, `${emojis.loading} Đang cân nhắc...`,
          `${emojis.loading} Hmmm...`, `${emojis.sparkles} Quyết định thôi...`,
        ];

        for (const f of frames) {
          await interaction.editReply(frame(f));
          await new Promise(r => setTimeout(r, 600));
        }

        const chosen = options[Math.floor(Math.random() * options.length)];

        const container = new ContainerBuilder().addTextDisplayComponents(txt(`## ${emojis.search} Decision Maker`))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`**Options**\n${options.map(o => ` • ${o}`).join('\n')}`))
          .addSeparatorComponents(sep(true))
          .addTextDisplayComponents(txt(`${emojis.star} **Kết quả**\n# ➤ ${chosen}`))
          .addSeparatorComponents(sep(false, false))
          .addTextDisplayComponents(txt(`-# ${emojis.success} Chọn từ ${options.length} lựa chọn`));

        await interaction.editReply({ components: [container], flags: V2 });
      },
    };

    // ───────── HELP ─────────
    const helpCommand = {
      data: new SlashCommandBuilder().setName('help').setDescription('� Menu Trợ Giúp - Xem tất cả lệnh'),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try { await interaction.deferReply(); }
        catch (error: any) { if (error.code === 10062 || error.code === 40060) return; throw error; }

        let bannerAttachment: AttachmentBuilder | null = null;
        try {
          bannerAttachment = new AttachmentBuilder(await self.generateHelpBanner(), { name: 'help-banner.png' });
        } catch (error) { console.error('❌ Error generating help banner:', error); }

        const allCommands: any[] = [];
        interaction.client.emit('getAllCommands' as any, allCommands);

        const categories = self.categorize(allCommands);
        const order = ['Hệ thống xử lí tin nhắn', 'Giải trí', 'Economy', 'Management', 'Moderation', 'Utility', 'Khác'];
        const stamp = `<t:${Math.floor(Date.now() / 1000)}:R>`;
        const footer = `-# 🥟 Bánh Cuốn Bot • Tổng: ${allCommands.length} lệnh • Cập nhật ${stamp}`;

        const selectRow = (disabled = false) =>
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('help_category')
              .setPlaceholder('Chọn module lệnh...')
              .setDisabled(disabled)
              .addOptions(Object.keys(categories).sort().map(cat => ({
                label: cat, 
                description: `${categories[cat].commands.length} lệnh`, 
                value: cat,
                emoji: self.getCategoryEmojiForDropdown(cat),
              }))),
          );

        const homeRow = (disabled = false) =>
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('help_home').setLabel('Trang chủ').setEmoji('🏠')
              .setStyle(ButtonStyle.Primary).setDisabled(disabled),
          );

        const buildMain = (disabled = false) => {
          const c = new ContainerBuilder();
          if (bannerAttachment) c.addMediaGalleryComponents(gallery('attachment://help-banner.png'));

          const stats = order
            .filter(n => categories[n])
            .map(n => `${categories[n].emoji} **${n}** — \`${categories[n].commands.length}\` lệnh`)
            .join('\n');

          return c
            .addTextDisplayComponents(txt(
              `## ${emojis.document} Menu Trợ Giúp\n` +
              `**🥟 Bánh Cuốn Bot** — Bot Discord đa năng với AI, kinh tế, mini-games, và nhiều tính năng khác!`,
            ))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `[Server Discord](https://discord.gg/support) • [Hướng dẫn sử dụng](https://docs.bot.com) • ` +
              `[Mời bot](https://invite.bot.com) • [Website](https://banhcuonbot.com)`,
            ))
            .addSeparatorComponents(sep(true))
            .addTextDisplayComponents(txt(stats), txt(`**Lệnh slash:** \`${allCommands.length}\`  •  **Lệnh prefix:** \`13\``))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `### ${emojis.music} Music Commands (Prefix: \`!bc\`)\n` +
              `\`play\` \`pause\` \`resume\` \`skip\` \`stop\` \`queue\` \`volume\` \`loop\`\n` +
              `\`shuffle\` \`nowplaying/np\` \`seek\` \`pin\` \`pinned\`\n` +
              `-# ${emojis.info} Ví dụ: \`!bc play never gonna give you up\``
            ))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(
              `### ⚡ Phím tắt hữu ích\n` +
              `\`!bc q\` — Xem nhiệm vụ  •  \`!bc bal\` — Xem số dư\n` +
              `\`!bc s\` — Mở shop  •  \`!bc cv\` — Đổi tiền\n` +
              `-# ${emojis.info} Gõ \`!help\` để xem tất cả prefix commands`
            ))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt('📋 Chọn module ở dropdown bên dưới để xem chi tiết slash commands.'))
            .addActionRowComponents(selectRow(disabled))
            .addTextDisplayComponents(txt(footer));
        };

        const buildCategory = (name: string) => {
          const data = categories[name];
          let list = data.commands
            .map((cmd, i) => `**${i + 1}. ${cmd.description}**\n-# \`/${cmd.name}\``)
            .join('\n');

          // Giới hạn tổng text của message V2 là 4000 ký tự
          if (list.length > 3300) list = list.slice(0, 3300).replace(/\n[^\n]*$/, '') + '\n…';

          return new ContainerBuilder().addTextDisplayComponents(txt(`## ${data.emoji} ${name}`), txt(`-# ${data.commands.length} lệnh trong module này`))
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(list))
            .addSeparatorComponents(sep())
            .addActionRowComponents(selectRow())
            .addActionRowComponents(homeRow())
            .addTextDisplayComponents(txt(footer));
        };

        const message = await interaction.editReply({
          components: [buildMain()],
          files: bannerAttachment ? [bannerAttachment] : [],
          flags: V2,
        });

        const collector = message.createMessageComponentCollector({
          filter: i => i.customId.startsWith('help_') && i.user.id === interaction.user.id,
          time: 300_000,
        });

        collector.on('collect', async i => {
          try {
            if (i.isStringSelectMenu()) {
              await i.update({ components: [buildCategory(i.values[0])], flags: V2 });
            } else if (i.customId === 'help_home') {
              await i.update({ components: [buildMain()], flags: V2 });
            }
          } catch (error) { console.error('Error updating help:', error); }
        });

        collector.on('end', async () => {
          try { await interaction.editReply({ components: [buildMain(true)], flags: V2 }); } catch {}
        });
      },
    };

    // ───────── INFORMATION ─────────
    const infoCommand = {
      data: new SlashCommandBuilder().setName('information').setDescription('ℹ️ Thông tin về bot'),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try { await interaction.deferReply(); }
        catch (error: any) { if (error.code === 10062 || error.code === 40060) return; throw error; }

        // Skip banner generation - too slow (4+ seconds blocking event loop)
        let bannerAttachment: AttachmentBuilder | null = null;
        // try {
        //   bannerAttachment = new AttachmentBuilder(await self.generateInfoBanner(), { name: 'info-banner.png' });
        // } catch (error) { console.error('❌ Error generating info banner:', error); }

        const client = interaction.client;
        const hours = Math.floor(process.uptime() / 3600);
        const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        const mem = process.memoryUsage();
        const memUsage = (mem.heapUsed / 1024 / 1024).toFixed(0);
        const memPercent = ((mem.heapUsed / mem.heapTotal) * 100).toFixed(1);

        const { repoUrl, branchInfo, commitsText } = await self.getGitInfo();

        let helpMention = '/help';
        try {
          const cmds = await client.application?.commands.fetch();
          const helpCmd = cmds?.find(c => c.name === 'help');
          if (helpCmd) helpMention = `</help:${helpCmd.id}>`;
        } catch {}

        const header = new SectionBuilder()
          .addTextDisplayComponents(
            txt(`## ${emojis.info} Bot Information`),
            txt(`**${client.user?.username}** — Discord bot TypeScript-based với AI integration\n${emojis.tag} ${branchInfo}`),
          )
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.user!.displayAvatarURL({ size: 256 })));

        const container = new ContainerBuilder();
        if (bannerAttachment) container.addMediaGalleryComponents(gallery('attachment://info-banner.png'));

        container
          .addSectionComponents(header)
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            txt(
              `### ${emojis.chart} Stats\n` +
              `${emojis.server} **${client.guilds.cache.size.toLocaleString()}** servers\n` +
              `${emojis.users} **${totalMembers.toLocaleString()}** members`,
            ),
            txt(
              `### ${emojis.database} Resources\n` +
              `${emojis.terminal} **${memUsage} MiB** (${memPercent}%)\n` +
              `${emojis.clock} **${hours}h** uptime`,
            ),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`### ${emojis.refresh} Latest Git Updates\n${commitsText}`))
          .addSeparatorComponents(sep())
          .addActionRowComponents(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('GitHub').setURL(repoUrl),
            ),
          )
          .addTextDisplayComponents(txt(`-# Dùng ${helpMention} để xem danh sách lệnh`));

        await interaction.editReply({
          components: [container],
          files: bannerAttachment ? [bannerAttachment] : [],
          flags: V2,
        });
      },
    };

    // ───────── RULE ─────────
    const ruleCommand = {
      data: new SlashCommandBuilder().setName('rule').setDescription('Xem luật server'),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try { await interaction.deferReply({ flags: MessageFlags.Ephemeral }); }
        catch (error: any) { if (error.code === 10062 || error.code === 40060) return; throw error; }

        const rulesChannel = interaction.guild?.channels.cache.find(
          ch => ch.name === 'rules' || ch.name === '📜rules' || ch.name === 'luật-server',
        );

        const container = new ContainerBuilder().addTextDisplayComponents(txt(
            rulesChannel
              ? `## 📜 Luật Server\nRules channel: <#${rulesChannel.id}>`
              : `## ${emojis.error} Chưa có rules channel!`,
          ))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt('-# Dùng `/rule-setup` để tạo rules channel mới.'));

        await interaction.editReply({ components: [container], flags: V2 });
      },
    };

    // ───────── RULE SETUP ─────────
    const ruleSetupCommand = {
      data: new SlashCommandBuilder()
        .setName('rule-setup').setDescription('Tạo danh mục và kênh rules riêng')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(o => o.setName('force').setDescription('Buộc tạo lại từ đầu (xóa rules cũ)').setRequired(false)),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try { await interaction.deferReply(); }
        catch (error: any) { if (error.code === 10062 || error.code === 40060) return; throw error; }

        const guild = interaction.guild!;
        const force = interaction.options.getBoolean('force') || false;

        // Tìm tất cả channel / category liên quan đến rules
        const existingRulesChannels = guild.channels.cache.filter(
          ch => ch.type !== ChannelType.GuildCategory &&
            (ch.name.toLowerCase().includes('rule') || ch.name === 'luật-server'),
        );

        const existingRulesCategories = guild.channels.cache.filter(
          ch => ch.type === ChannelType.GuildCategory && ch.name.toLowerCase().includes('rule'),
        );

        const totalExisting = existingRulesChannels.size + existingRulesCategories.size;

        if (totalExisting > 0 && !force) {
          const channelList = existingRulesChannels.map(ch => `<#${ch.id}>`).join(', ') || 'Không có';
          const categoryList = existingRulesCategories.map(ch => `**${ch.name}**`).join(', ') || 'Không có';

          return interaction.editReply({
            components: [
              new ContainerBuilder()
                .addTextDisplayComponents(txt(`## ${emojis.warning} Đã tìm thấy rules channel/category cũ`))
                .addSeparatorComponents(sep())
                .addTextDisplayComponents(txt(`**Channels:** ${channelList}\n**Categories:** ${categoryList}`))
                .addTextDisplayComponents(txt('-# Dùng `force: True` để xóa tất cả và tạo lại.')),
            ],
            flags: V2,
          });
        }

        const progress = (l1: string, l2: string, l3: string, color = 0x5865F2, extra = '') => ({
          components: [
            new ContainerBuilder()
              .addTextDisplayComponents(txt('## ⚙️ Thiết lập Rules Channel'))
              .addSeparatorComponents(sep())
              .addTextDisplayComponents(txt(`\`[1/3]\` ${l1}\n\`[2/3]\` ${l2}\n\`[3/3]\` ${l3}${extra}`)),
          ],
          flags: V2 as any,
        });

        const wait = () => new Promise(r => setTimeout(r, 500));
        const L = emojis.loading, OK = emojis.success;

        await interaction.editReply(progress(`${L} Đang tạo danh mục...`, `${L} Đang chuẩn bị...`, `${L} Đang chuẩn bị...`) as any);
        await wait();

        // STEP 1: Rules category
        const category = await guild.channels.create({
          name: '📜 RULES', type: ChannelType.GuildCategory, position: 0,
          permissionOverwrites: [{ id: guild.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }],
        });

        await interaction.editReply(progress(`${OK} Đã tạo danh mục **📜 RULES**`, `${L} Đang tạo kênh rules...`, `${L} Đang chuẩn bị...`) as any);
        await wait();

        // STEP 2: Rules channel
        const rulesChannel = await guild.channels.create({
          name: '📜rules', type: ChannelType.GuildText, parent: category.id, position: 0,
          topic: 'Server Rules - Please read and follow',
          permissionOverwrites: [{
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
          }],
        });

        await interaction.editReply(progress(`${OK} Đã tạo danh mục **📜 RULES**`, `${OK} Đã tạo kênh <#${rulesChannel.id}>`, `${L} Đang gửi rules...`) as any);
        await wait();

        // STEP 3: Gửi rules với banner GIF (nếu có)
        const gifPath = path.resolve(__dirname, '../../../assets/banners/rule-banner.gif');
        const hasGif = fs.existsSync(gifPath);
        if (!hasGif) console.log('⚠️ rule-banner.gif not found in assets/banners/');

        const rules = [
          ['Tôn trọng mọi người', 'Không spam, flood, hoặc quấy rối thành viên khác. Hãy lịch sự và tôn trọng.'],
          ['Không nội dung không phù hợp', 'Cấm chia sẻ nội dung NSFW, bạo lực, hoặc vi phạm pháp luật.'],
          ['Không quảng cáo', 'Không quảng cáo server/sản phẩm khác trừ khi được cho phép.'],
          ['Sử dụng đúng kênh', 'Đăng nội dung vào đúng kênh chuyên đề.'],
          ['Không gian lận', 'Cấm sử dụng bot spam, tự động hóa không được phép.'],
          ['Tuân thủ Discord ToS', 'Tuân thủ [Discord Terms of Service](https://discord.com/terms) và [Community Guidelines](https://discord.com/guidelines).'],
        ];

        const rulesContainer = new ContainerBuilder();
        if (hasGif) rulesContainer.addMediaGalleryComponents(gallery('attachment://rule-banner.gif'));

        rulesContainer
          .addTextDisplayComponents(txt(`## 📜 Luật Server\nChào mừng đến **${guild.name}**! 🎉\nVui lòng đọc và tuân thủ các quy tắc sau:`))
          .addSeparatorComponents(sep(true));

        rules.forEach(([title, desc], i) => {
          rulesContainer.addTextDisplayComponents(txt(`### ${i + 1}. ${title}\n${desc}`));
          if (i < rules.length - 1) rulesContainer.addSeparatorComponents(sep(false, false));
        });

        rulesContainer
          .addSeparatorComponents(sep(true))
          .addTextDisplayComponents(
            txt(`${emojis.warning} **Vi phạm sẽ bị:** Cảnh cáo → Timeout → Kick → Ban`),
            txt(`-# Cảm ơn bạn đã giúp giữ cho server thân thiện và an toàn! 💚 • ${guild.name}`),
          );

        await rulesChannel.send({
          components: [rulesContainer],
          files: hasGif ? [new AttachmentBuilder(gifPath, { name: 'rule-banner.gif' })] : [],
          flags: V2,
        });

        await interaction.editReply(progress(
          `${OK} Đã tạo danh mục **📜 RULES**`,
          `${OK} Đã tạo kênh <#${rulesChannel.id}>`,
          `${OK} Đã gửi rules và khóa kênh (read-only)`,
          0x57F287,
          `\n\n**Rules channel:** <#${rulesChannel.id}>\nBạn có thể chỉnh sửa rules bằng cách edit tin nhắn trong kênh đó.`,
        ) as any);

        // Cleanup old rules (nếu force) - xóa TẤT CẢ channel và category cũ
        if (force && totalExisting > 0) {
          setTimeout(async () => {
            try {
              console.log(`${emojis.delete} Cleaning up ${totalExisting} old rules channels/categories...`);

              // Bước 1: Xóa category cũ (child channel sẽ tự bị xóa theo)
              for (const [id, oldCategory] of existingRulesCategories) {
                if (id === category.id) continue;
                try {
                  const fresh = await guild.channels.fetch(id).catch(() => null);
                  if (fresh) {
                    await fresh.delete('Rules setup: cleanup old category');
                    console.log(`${emojis.success} Deleted old category: ${oldCategory.name}`);
                  }
                } catch (err: any) {
                  if (err.code !== 10003) console.error(`${emojis.error} Error deleting category ${oldCategory.name}:`, err);
                }
              }

              // Bước 2: Xóa các channel rules lẻ còn lại
              for (const [id, oldChannel] of existingRulesChannels) {
                if (id === rulesChannel.id) continue;
                try {
                  const fresh = await guild.channels.fetch(id).catch(() => null);
                  if (fresh) {
                    await fresh.delete('Rules setup: cleanup old channel');
                    console.log(`${emojis.success} Deleted old standalone channel: ${oldChannel.name}`);
                  }
                } catch (err: any) {
                  if (err.code !== 10003) console.error(`${emojis.error} Error deleting channel ${oldChannel.name}:`, err);
                }
              }

              console.log(`${emojis.success} Cleanup complete!`);
            } catch (error) {
              console.error(`${emojis.error} Error during cleanup:`, error);
            }
          }, 3000);
        }
      },
    };

    // ───────── EVENT TEST ─────────
    const eventTestCommand = {
      data: new SlashCommandBuilder()
        .setName('event-test')
        .setDescription('� Test event embeds (welcome, goodbye, giveaway-end, level-up)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o => o.setName('event')
          .setDescription('Event type to test')
          .setRequired(true)
          .addChoices(
            { name: 'Welcome', value: 'welcome' },
            { name: 'Goodbye', value: 'goodbye' },
            { name: 'Giveaway End', value: 'giveaway-end' },
            { name: 'Level Up', value: 'level-up' }
          ))
        .addUserOption(o => o.setName('user')
          .setDescription('Target user (defaults to you)')
          .setRequired(false)),

      execute: async (interaction: ChatInputCommandInteraction) => {
        const eventType = interaction.options.getString('event', true);
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guildId!;

        // Check admin permission
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: `${emojis.error} You need Administrator permission to use this command.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        const testHeader = '-# 🧪 TEST MODE - This is a test preview\n';

        if (eventType === 'welcome') {
          // Read welcome config
          const configPath = path.resolve(process.cwd(), 'data', 'welcome-config.json');
          let config: any = {};
          
          try {
            if (fs.existsSync(configPath)) {
              config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            }
          } catch (error) {
            console.error('Error reading welcome config:', error);
          }

          const guildConfig = config[guildId];
          
          if (guildConfig?.embedEnabled) {
            // Try to read custom design
            const designPath = path.resolve(process.cwd(), 'data', 'welcome-designs.json');
            let designs: any = {};
            
            try {
              if (fs.existsSync(designPath)) {
                designs = JSON.parse(fs.readFileSync(designPath, 'utf-8'));
              }
            } catch (error) {
              console.error('Error reading welcome designs:', error);
            }

            const customDesign = designs[guildId]?.welcome;
            
            if (customDesign) {
              // Use custom design
              const container = new ContainerBuilder()
                .addTextDisplayComponents(txt(testHeader))
                .addTextDisplayComponents(
                  txt(`## ${customDesign.title || 'Welcome!'}`),
                  txt((customDesign.description || `Welcome ${targetUser.username}!`)
                    .replace('{user}', `<@${targetUser.id}>`)
                    .replace('{username}', targetUser.username)
                    .replace('{server}', interaction.guild?.name || 'Server'))
                );
              
              return interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | V2 });
            }
            
            // Default welcome embed
            const container = new ContainerBuilder().addTextDisplayComponents(txt(testHeader))
              .addTextDisplayComponents(
                txt(`## ${emojis.sparkles} Welcome!`),
                txt(`${guildConfig.message || `Welcome <@${targetUser.id}> to **${interaction.guild?.name}**!`}`)
              )
              .addSeparatorComponents(sep())
              .addTextDisplayComponents(txt(`-# ${emojis.users} Member #${interaction.guild?.memberCount || '???'}`));
            
            return interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | V2 });
          }
          
          // Simple default message
          const container = new ContainerBuilder().addTextDisplayComponents(
              txt(testHeader),
              txt(`## ${emojis.sparkles} Welcome!`),
              txt(`Welcome ${targetUser.username}!`)
            );
          
          return interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | V2 });
        }

        if (eventType === 'goodbye') {
          // Read goodbye config
          const configPath = path.resolve(process.cwd(), 'data', 'goodbye-config.json');
          let config: any = {};
          
          try {
            if (fs.existsSync(configPath)) {
              config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            }
          } catch (error) {
            console.error('Error reading goodbye config:', error);
          }

          const guildConfig = config[guildId];
          
          if (guildConfig?.embedEnabled) {
            // Try to read custom design
            const designPath = path.resolve(process.cwd(), 'data', 'welcome-designs.json');
            let designs: any = {};
            
            try {
              if (fs.existsSync(designPath)) {
                designs = JSON.parse(fs.readFileSync(designPath, 'utf-8'));
              }
            } catch (error) {
              console.error('Error reading welcome designs:', error);
            }

            const customDesign = designs[guildId]?.goodbye;
            
            if (customDesign) {
              // Use custom design
              const container = new ContainerBuilder()
                .addTextDisplayComponents(txt(testHeader))
                .addTextDisplayComponents(
                  txt(`## ${customDesign.title || 'Goodbye!'}`),
                  txt((customDesign.description || `Goodbye ${targetUser.username}!`)
                    .replace('{user}', `<@${targetUser.id}>`)
                    .replace('{username}', targetUser.username)
                    .replace('{server}', interaction.guild?.name || 'Server'))
                );
              
              return interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | V2 });
            }
            
            // Default goodbye embed
            const container = new ContainerBuilder().addTextDisplayComponents(txt(testHeader))
              .addTextDisplayComponents(
                txt(`## 👋 Goodbye!`),
                txt(guildConfig.message || `Goodbye <@${targetUser.id}>! Thanks for being part of **${interaction.guild?.name}**.`)
              )
              .addSeparatorComponents(sep())
              .addTextDisplayComponents(txt(`-# ${emojis.users} We'll miss you!`));
            
            return interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | V2 });
          }
          
          // Simple default message
          const container = new ContainerBuilder().addTextDisplayComponents(
              txt(testHeader),
              txt(`## 👋 Goodbye!`),
              txt(`Goodbye ${targetUser.username}!`)
            );
          
          return interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | V2 });
        }

        if (eventType === 'giveaway-end') {
          // Fake giveaway end announcement
          const container = new ContainerBuilder().addTextDisplayComponents(txt(testHeader))
            .addTextDisplayComponents(
              txt(`## 🎊 GIVEAWAY KẾT THÚC!`),
              txt(`🎁 **Test Prize**`)
            )
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(`### 🏆 Người thắng:\n<@${targetUser.id}>`)
            )
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`-# Chúc mừng! Hãy liên hệ host để nhận thưởng 🎉`));
          
          return interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | V2 });
        }

        if (eventType === 'level-up') {
          // Fake level-up celebration
          const container = new ContainerBuilder().addTextDisplayComponents(txt(testHeader))
            .addTextDisplayComponents(
              txt(`## ${emojis.star} Level Up!`),
              txt(`🎉 Congratulations <@${targetUser.id}>!`)
            )
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(`### ${emojis.trophy} Level 4 → Level 5`),
              txt(`Keep chatting to earn more XP!`)
            )
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`-# ${emojis.fire} You're on fire! Keep it up!`));
          
          return interaction.reply({ components: [container], flags: MessageFlags.Ephemeral | V2 });
        }

        // Should never reach here
        await interaction.reply({
          content: `${emojis.error} Unknown event type`,
          flags: MessageFlags.Ephemeral,
        });
      },
    };

    // Đăng ký tất cả command
    this.commands.set('poll', pollCommand);
    this.commands.set('calc', calcCommand);
    this.commands.set('random', randomCommand);
    this.commands.set('choose', chooseCommand);
    this.commands.set('help', helpCommand);
    this.commands.set('information', infoCommand);
    this.commands.set('rule', ruleCommand);
    this.commands.set('rule-setup', ruleSetupCommand);
    this.commands.set('test-emoji', testEmojiCommand);
    this.commands.set('event-test', eventTestCommand);
  }

  async cleanup() {
    console.log('🧹 Utility module cleanup');
  }
}
