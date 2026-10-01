/**
 * Server Generator Module - AI-powered Discord server setup
 * Using Components V2 for modern, beautiful layout
 */

import { 
  Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction,
  PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder,
  TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
  MessageFlags, ContainerBuilder
} from 'discord.js';
import { emojis, EMOJI_IDS } from '../../config/emojis';
import Groq from 'groq-sdk';
import { keyRotator } from '../../utils/aiKeyRotator';

export default class ServerGeneratorModule {
  name = 'server-generator-module';
  description = 'AI-powered Discord server setup generator';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  private groq: Groq | null = null;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    const apiKey = keyRotator.getGroqKey();
    if (apiKey) {
      this.groq = new Groq({ apiKey });
      console.log(`  ${emojis.success} Groq AI initialized for server generator`);
    }

    this.registerCommands();
    this.setupEventHandlers();
    this.setupTextCommand(); // Add text command support
    console.log(`${emojis.success} Server Generator module registered ${this.commands.size} command(s)`);
  }

  private setupTextCommand() {
    this.client.on('messageCreate', async (message: any) => {
      if (message.author.bot) return;
      if (!message.content.startsWith('!gen ')) return;
      if (!message.guild) return;
      
      // Check admin permission
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply(`${emojis.error} Bạn cần quyền Administrator!`);
      }

      const prompt = message.content.slice(5).trim();
      if (prompt.length < 10) {
        return message.reply(`${emojis.error} Prompt quá ngắn! Tối thiểu 10 ký tự.\n\nVí dụ: \`!gen gaming cute Vietnam\``);
      }

      console.log(`${emojis.art} Text command by ${message.author.tag}: ${prompt.substring(0, 100)}`);
      
      const reply = await message.reply(`${emojis.loading} Đang generate với AI...`);
      
      // Call generation directly
      try {
        const design = await this.generateServerDesign(prompt);
        
        // Store design
        (this as any).tempDesign = (this as any).tempDesign || new Map();
        (this as any).tempDesign.set(message.author.id, design);
        
        // Generate preview
        let preview = `\x1b[36m${design.serverName || 'Server Design'}\x1b[0m\n`;
        
        if (design.categories && design.categories.length > 0) {
          design.categories.forEach((cat: any, catIndex: number) => {
            const isCatLast = catIndex === design.categories.length - 1;
            const catPrefix = isCatLast ? '└──' : '├──';
            const catEmoji = cat.emoji || emojis.folder;
            preview += `${catPrefix} \x1b[33m${catIndex + 1}. ${catEmoji} ${cat.name}\x1b[0m\n`;
            
            if (cat.channels && cat.channels.length > 0) {
              cat.channels.forEach((ch: any, chIndex: number) => {
                const isChLast = chIndex === cat.channels.length - 1;
                const lineChar = isCatLast ? '    ' : '│   ';
                const chPrefix = isChLast ? '└──' : '├──';
                const chIcon = ch.type === 2 ? '\x1b[34m🔊\x1b[0m' : '\x1b[32m#\x1b[0m';
                const chEmoji = ch.emoji || '';
                const chName = chEmoji ? `${chEmoji} ${ch.name}` : ch.name;
                preview += `${lineChar}${chPrefix} ${catIndex + 1}.${chIndex + 1} ${chIcon} ${chName}\n`;
              });
            }
          });
        }
        
        // Update with result
        const resultContainer = new ContainerBuilder()
          .setAccentColor(0x5865F2)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `**${design.serverName || 'Server Design'}**\n` +
              `\`\`\`ansi\n${preview}\`\`\``
            )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.export} Export to Server`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_export_${message.author.id}`)
                  .setLabel('Export')
                  .setStyle(ButtonStyle.Success)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.sparkles} More Options`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_menu_${message.author.id}`)
                  .setLabel('Menu')
                  .setStyle(ButtonStyle.Danger)
              )
          );
        
        await reply.edit({
          content: '',
          flags: MessageFlags.IsComponentsV2,
          components: [resultContainer]
        });
        
      } catch (error: any) {
        console.error('Text command generation error:', error);
        await reply.edit(`${emojis.error} Lỗi AI: ${error.message}`);
      }
    });
  }

  /**
   * Send design result with buttons
   * Shared method for both slash command and text command
   */
  private async sendDesignResult(interaction: any, design: any) {
    // Count stats
    const totalCategories = design.categories?.length || 0;
    const totalChannels = design.categories?.reduce((sum: number, cat: any) => 
      sum + (cat.channels?.length || 0), 0) || 0;
    const totalRoles = design.roles?.length || 0;
    const totalVoice = design.categories?.reduce((sum: number, cat: any) => 
      sum + (cat.channels?.filter((ch: any) => ch.type === 2).length || 0), 0) || 0;
    const totalText = totalChannels - totalVoice;
    
    // Generate preview
    let preview = `\x1b[36m${design.serverName || 'Server Design'}\x1b[0m\n`;
    
    if (design.categories && design.categories.length > 0) {
      design.categories.forEach((cat: any, catIndex: number) => {
        const isCatLast = catIndex === design.categories.length - 1;
        const catPrefix = isCatLast ? '└──' : '├──';
        const catEmoji = cat.emoji || emojis.folder;
        preview += `${catPrefix} \x1b[33m${catEmoji} ${cat.name}\x1b[0m\n`;
        
        if (cat.channels && cat.channels.length > 0) {
          cat.channels.forEach((ch: any, chIndex: number) => {
            const isChLast = chIndex === cat.channels.length - 1;
            const lineChar = isCatLast ? '    ' : '│   ';
            const chPrefix = isChLast ? '└──' : '├──';
            const chIcon = ch.type === 2 ? '\x1b[34m🔊\x1b[0m' : '\x1b[32m#\x1b[0m';
            const chEmoji = ch.emoji || '';
            const chName = chEmoji ? `${chEmoji} ${ch.name}` : ch.name;
            preview += `${lineChar}${chPrefix} ${chIcon} ${chName}\n`;
          });
        }
      });
    }
    
    // Create result container with beautiful stats
    const resultContainer = new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(
        (text) => text.setContent(
          `# ${emojis.sparkles} ${design.serverName || 'Server Design'}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${emojis.chart} **Thống kê:**\n` +
          `${emojis.folder} Categories: **${totalCategories}**\n` +
          `${emojis.message} Text Channels: **${totalText}**\n` +
          `${emojis.music} Voice Channels: **${totalVoice}**\n` +
          `${emojis.users} Roles: **${totalRoles}**\n\n` +
          `━━━━━━━━━━━━━━━━━━━━`
        )
      )
      .addTextDisplayComponents(
        (text) => text.setContent(
          `**${emojis.document} Cấu trúc Server:**\n\`\`\`ansi\n${preview}\`\`\``
        )
      )
      .addSectionComponents(
        (section) => section
          .addTextDisplayComponents(
            (text) => text.setContent(`${emojis.export} **Export to Server**\nÁp dụng thiết kế vào server này`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`gen_export_${interaction.user.id}`)
              .setLabel('📤 Export')
              .setStyle(ButtonStyle.Success)
          )
      )
      .addSectionComponents(
        (section) => section
          .addTextDisplayComponents(
            (text) => text.setContent(`${emojis.sparkles} **More Options**\nExport JSON, Import, Delete...`)
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId(`gen_menu_${interaction.user.id}`)
              .setLabel('📋 Menu')
              .setStyle(ButtonStyle.Primary)
          )
      );
    
    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [resultContainer]
    });
  }

  /**
   * Generate server design using AI
   * Extracted method that can be called from both slash commands and text commands
   */
  private async generateServerDesign(prompt: string): Promise<any> {
    if (!this.groq) {
      throw new Error('AI service không khả dụng');
    }

    const systemPrompt = `You are a Discord server structure designer. Generate a JSON design for a Discord server based on user requirements.

Output ONLY valid JSON in this exact format:
{
  "serverName": "Server Name",
  "categories": [
    {
      "name": "CATEGORY NAME",
      "emoji": "👋",
      "channels": [
        {"name": "channel-name", "type": 0, "emoji": "${emojis.message}"},
        {"name": "voice channel", "type": 2, "emoji": "🎙️"}
      ]
    }
  ],
  "roles": [
    {"name": "Owner", "emoji": "${emojis.crown}", "color": "#FF0000", "permissions": []}
  ]
}

CRITICAL RULES:
1. Channel types: 0=Text, 2=Voice, 13=Stage ONLY (do NOT use type 5)
2. Text channels: MUST use lowercase hyphens (general-chat, game-discussion, memes-and-fun)
3. Voice channels: MUST use Title Case spaces (Voice Lobby, Gaming Room, Music Lounge, AFK Room)
4. Add emoji to channels/categories based on user request:
   - If user asks for "cute", "đẹp", "ngầu", "cool" → use MORE decorative characters
   - If user asks for "simple", "clean", "minimal" → use LESS or NO decorative characters
   - Default: use 1 emoji per category, basic emoji for channels
5. Use Vietnamese names if user requests in Vietnamese, otherwise English
6. Keep practical, organized, and visually appealing
7. MATCH THE USER'S STYLE - don't over-decorate unless they ask for it

VIETNAMESE CHANNEL DICTIONARY (Use CORRECT Vietnamese spelling + EMOJI):
Text Channels (lowercase-hyphens + emoji):
- ${emojis.success} ${emojis.message} tro-chuyen (chat/conversation)
- ${emojis.success} 🌐 cong-dong (community)
- ${emojis.success} 📜 quy-dinh (rules)
- ${emojis.success} 📢 thong-bao (announcements)
- ${emojis.success} 💡 goi-y (suggestions)
- ${emojis.success} 🎲 mini-game (mini games)
- ${emojis.success} 🎮 game-chung (general gaming)
- ${emojis.success} 🕹️ game-khac (other games)
- ${emojis.success} ${emojis.trophy} giai-dau (tournament)
- ${emojis.success} 🎉 su-kien (events)
- ${emojis.success} 📸 hinh-anh (images/photos)
- ${emojis.success} 🆘 ho-tro (support)
- ${emojis.success} ❓ cau-hoi (questions)
- ${emojis.success} 🎯 game-owo, esport, ranked
- ${emojis.success} 😂 meme, fun, giai-tri

Voice Channels (Title Case spaces + emoji):
- ${emojis.success} 🎙️ Phong Chat (Chat Room)
- ${emojis.success} 🎮 Phong Game (Game Room)
- ${emojis.success} ${emojis.music} Phong Nhac (Music Room)
- ${emojis.success} 🌙 Phong Chill (Chill Zone)
- ${emojis.success} 💤 Phong AFK (AFK Room)
- ${emojis.success} 📚 Phong Hoc (Study Room)
- ${emojis.success} 🔊 Phong Voice (Voice Lobby)
- ${emojis.success} 🎤 Phong Karaoke

Categories (UPPERCASE + emoji):
- ${emojis.success} 👋 CHAO MUNG (WELCOME)
- ${emojis.success} ${emojis.message} CONG DONG (COMMUNITY)
- ${emojis.success} 🎮 TRO CHOI / GAMING (GAMING)
- ${emojis.success} 🎙️ VOICE CHANNELS / GIONG NOI
- ${emojis.success} 🎉 SU KIEN (EVENTS)
- ${emojis.success} 🆘 HO TRO (SUPPORT)
- ${emojis.success} ${emojis.gift} MINI GAMES
- ${emojis.success} ${emojis.trophy} GIAI DAU (TOURNAMENTS)

CHANNEL NAMING STANDARDS:
${emojis.success} Good Text Channels: general-chat, announcements, off-topic, game-discussion, tech-support, memes-and-fun
${emojis.error} Bad: GeneralChat, general_chat, GENERAL, general (too simple)

${emojis.success} Good Voice Channels: Voice Lobby, Gaming Room, Music Lounge, Chill Zone, AFK Room, Study Session
${emojis.error} Bad: voice-lobby, VOICE1, voice (not descriptive)

SMART DESIGN PATTERNS:
- Gaming servers: welcome, rules, announcements, general-chat, game channels, voice lobbies, support
- Community servers: introductions, rules, general-chat, off-topic, events, giveaways, voice rooms
- Tech servers: announcements, help-desk, projects, resources, code-chat, voice
- Always include: Welcome category, Community category, Voice Channels category
- Voice channels minimum: Voice Lobby, Gaming Room (or General Voice), Music, AFK
- Roles hierarchy: Owner, Admin, Moderator, VIP/Booster, Member

SERVER THEME TEMPLATES (Choose based on user request):

🎮 GAMING SERVER:
Categories: 👋 Welcome, 📜 Rules, 🎮 Gaming, 🎯 Esports, ${emojis.trophy} Tournaments, 🎙️ Voice, 🆘 Support
Channels: general-chat, game-discussion, team-recruitment, tournament-schedule, clips-highlights
Voice: Voice Lobby, Gaming Room 1-3, Tournament Stage, Music, AFK
Roles: Owner, Admin, Mod, Pro Player, VIP, Gamer, Newbie

🌐 COMMUNITY SERVER:
Categories: 👋 Welcome, ${emojis.message} Chat, 🎉 Events, ${emojis.art} Creative, ${emojis.gift} Giveaways, 🎙️ Voice, 🆘 Support
Channels: introductions, general-chat, off-topic, selfies, art-showcase, memes, announcements
Voice: General Voice, Chill Zone, Music Lounge, Study Room, AFK
Roles: Founder, Admin, Moderator, VIP, Booster, Active Member, Member

🎓 STUDY/SCHOOL SERVER:
Categories: 👋 Welcome, 📚 Study, 📝 Homework Help, 🧠 Subjects, 🎙️ Study Rooms, 🎉 Break Time
Channels: rules, study-tips, homework-help, math, science, english, history, announcements
Voice: Study Room 1-5, Group Discussion, Quiet Study, Music Study, Break Room
Roles: Teacher, Senior, Helper, Study Buddy, Student

💼 WORK/BUSINESS SERVER:
Categories: 👋 Welcome, 💼 Work, ${emojis.chart} Projects, 💡 Ideas, 🎙️ Meetings, 🎉 Social
Channels: announcements, general, project-alpha, project-beta, resources, ideas-feedback
Voice: Meeting Room 1-3, Team Voice, Presentation Hall, Break Room
Roles: CEO, Manager, Team Lead, Developer, Designer, Member

${emojis.music} MUSIC/ARTIST SERVER:
Categories: 👋 Welcome, ${emojis.music} Music, ${emojis.art} Art, 🎤 Performances, 🎙️ Voice, ${emojis.message} Social
Channels: releases, feedback, collab-requests, beat-sharing, lyrics, art-showcase
Voice: Studio 1-3, Jam Session, Karaoke, Music Listening, Chill
Roles: Artist, Producer, Singer, Rapper, Designer, Fan

${emojis.art} ART/CREATIVE SERVER:
Categories: 👋 Welcome, ${emojis.art} Art, 💡 Inspiration, ${emojis.image} Gallery, 🎙️ Voice, ${emojis.message} Chat
Channels: showcase, wip-feedback, commissions, resources, tutorials, challenges
Voice: Art Session, Music Vibes, Chill Chat, Critique Corner
Roles: Master Artist, Artist, Designer, Learner, Art Lover

🎬 ANIME/MANGA SERVER:
Categories: 👋 Welcome, 🎬 Anime, 📚 Manga, 🎮 Games, ${emojis.art} Fan Art, 🎙️ Voice, ${emojis.message} Chat
Channels: anime-discussion, manga-recommendations, episode-releases, spoilers, fanart, memes
Voice: Watch Party, General Voice, Music, Gaming, AFK
Roles: Otaku Legend, Weeb, Nakama, Senpai, Kouhai, Newbie

🎮 MINECRAFT SERVER:
Categories: 👋 Welcome, ⛏️ Survival, 🏗️ Creative, 🎯 Minigames, 🎙️ Voice, ${emojis.message} Chat
Channels: rules, server-ip, builds-showcase, trading, help-support, events
Voice: Survival Squad, Creative Zone, Minigame Lobby, Music, AFK
Roles: Owner, Admin, Builder, Redstone Expert, VIP, Player

🎯 ESPORTS/COMPETITIVE:
Categories: 👋 Welcome, ${emojis.trophy} Competitive, 🎮 Practice, ${emojis.chart} Stats, 🎙️ Scrims, ${emojis.message} Chat
Channels: announcements, team-roster, match-schedule, vod-review, strategy, recruitment
Voice: Scrim Room 1-5, Strategy Discussion, Coach Room, Spectator
Roles: Coach, Team Captain, Pro Player, Sub, Analyst, Fan

🎉 PARTY/SOCIAL SERVER:
Categories: 👋 Welcome, 🎉 Party, 🎮 Games, ${emojis.music} Music, 🎙️ Voice Hangout, ${emojis.message} Chat
Channels: events, party-planning, games-lobby, selfies, memes, music-requests
Voice: Party Hall, Game Night, Karaoke, Music DJ, Chill Lounge, AFK
Roles: Party Master, DJ, VIP Guest, Regular, Newbie

${emojis.terminal} TECH/CODING SERVER:
Categories: 👋 Welcome, ${emojis.terminal} Development, 🐛 Help, ${emojis.folder} Projects, 🎙️ Voice, ${emojis.message} Chat
Channels: code-help, project-showcase, job-board, resources, github-updates, off-topic
Voice: Coding Session, Pair Programming, Meeting Room, Music Study
Roles: Senior Dev, Developer, Designer, Junior, Student, Visitor

🎲 ROLEPLAY SERVER:
Categories: 👋 Welcome, 📜 Lore, 🎭 Roleplay, 🗺️ Locations, ${emojis.art} Character Art, 🎙️ Voice RP
Channels: rules, character-creation, story-events, tavern-rp, market-rp, ooc-chat
Voice: RP Session 1-3, Dungeon Master, Music Ambience, OOC Voice
Roles: Game Master, Admin, Veteran RPer, RPer, Character, Observer

Use these templates as inspiration and mix elements based on user's specific request!
Add creative variations and extra channels that fit the theme!

EMOJI SELECTION GUIDE (Use attractive, matching emoji - use 1-2 per item):
- Welcome: 👋, 📜, 📢, ${emojis.success}, 🎉, 🎊, 🌟, ${emojis.star}, 💫, ${emojis.sparkles}
- Community: ${emojis.message}, 🎲, 😂, ${emojis.art}, 📸, ${emojis.music}, 🎬, 🌐, ${emojis.users}, 🗣️, 💭
- Gaming: 🎮, 🕹️, ${emojis.trophy}, 🎯, 👾, 🔥, ⚔️, 🎪, 🎰, 🎱, ♟️, 🃏
- Voice: 🎙️, ${emojis.music}, 🔊, 🎧, 💤, 🌙, 🎤, 📻, 🔉, 🎶
- Support: ❓, 💡, 🐛, 📨, 🎫, ${emojis.copy}, 🆘, 🛠️, ⚙️, 🔧
- Events: 🎉, ${emojis.gift}, ${emojis.trophy}, ${emojis.calendar}, 🎊, 🏅, 🎈, 🎀, 🌺, 🎪
- Media: 📸, 🎬, ${emojis.image}, ${emojis.art}, ${emojis.music}, ${emojis.video}, 📷, 🎞️, 🖌️
- Fun/Meme: 😂, 🤣, 😎, 🤪, 🎭, 🎪, ${emojis.art}, 🎯, 🎲
- Music: ${emojis.music}, 🎶, 🎸, 🎹, 🎤, 🎧, 🎼, 🎺, 🥁, 🎷
- Study/Learn: 📚, 📖, ${emojis.edit}, 📝, 🎓, 🧠, 💡, ${emojis.chart}, 📈

DECORATIVE CHARACTERS USAGE GUIDE:
${emojis.warning} IMPORTANT: Only use decorative characters when user specifically asks for them!

WHEN TO USE DECORATIVE CHARACTERS:
${emojis.success} User says: "đẹp", "cute", "ngầu", "cool", "VIP", "premium", "fancy", "decorated", "ký tự đặc biệt"
${emojis.success} User asks for: "nhiều ký tự", "trang trí đẹp", "ký tự ngầu", "giống Free Fire/Liên Quân"
${emojis.error} DO NOT use when: user asks for "simple", "clean", "minimal", "basic", or doesn't mention decoration

DECORATION LEVELS (match user's request):
Level 1 (Default/Basic): Only emoji, no decorative brackets
  Example: 🎮 Gaming, ${emojis.message} Chat, ${emojis.music} Music

Level 2 (Medium/Cute): Emoji + simple decorations if requested
  Example: ★ Gaming ★, ❃ Chat ❃, ${emojis.sparkles} Music ${emojis.sparkles}

Level 3 (Heavy/VIP): Full decoration only if explicitly requested
  Example: ༺🎮 Gaming༻, ╭──${emojis.message} Chat──╮, ★彡Music

DECORATIVE CHARACTERS (Only use when user wants decoration):
- Box drawings: ┃ ┊ ╎ ├ ┤ ╭ ╮ ╯ ╰ ─ ═
- Brackets: ༺༻ 〘〙 ⦗⦘ ꧁꧂ ︵︶
- Stars: ★ ☆ ${emojis.star} ✦ ✧
- Hearts: ♡ ❤ ღ
- Sparkles: ${emojis.sparkles} ✦ ･ﾟ･
- Special: ツ ㊝ 亗 彡 ☯ ♕ ⚔

SMART MATCHING:
- Gaming/competitive → simple style (just emoji)
- Study/work → minimal decoration
- Community/social → moderate emoji
- VIP/premium → can use more decoration IF REQUESTED
- Anime/cute → emoji + cute symbols IF REQUESTED

Remember: Less is more. Only decorate when the user wants it!`;

    const completion = await this.groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a Discord server structure for: ${prompt}\n\nBe creative, add many relevant channels and categories. Think about what users would actually need and use. Match the theme closely - if it's gaming add game-specific channels, if it's study add subject channels, if it's anime add anime discussion channels, etc.\n\nIMPORTANT DECORATION RULES:\n- Only use basic emoji (like 🎮${emojis.message}${emojis.music}) unless the user specifically asks for "đẹp", "cute", "ngầu", "VIP", "ký tự đặc biệt", or similar decorative requests\n- If user wants simple/clean server, use minimal or no decorations\n- If user asks for decorated/fancy/cute server, then use decorative characters like ༺༻, ★, ${emojis.sparkles}, etc.\n- Default style: clean with just 1 emoji per item` }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.85,
      max_tokens: 4000,
      top_p: 0.95
    });

    const aiResponse = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const design = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return design;
  }

  private registerCommands() {
    const generatorCommand = {
      data: new SlashCommandBuilder()
        .setName('generator')
        .setDescription(`${emojis.sparkles} Tạo cấu trúc Discord server bằng AI`)
        .addStringOption(option =>
          option
            .setName('prompt')
            .setDescription('Mô tả server (Ví dụ: gaming cute, VN English voice)')
            .setRequired(true) // Required to avoid modal timeout
            .setMaxLength(500)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

      execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
          return interaction.reply({
            content: `${emojis.error} **Lỗi!** Command chỉ dùng trong server!`,
            flags: 64
          });
        }

        const promptOption = interaction.options.getString('prompt');
        
        // Kiểm tra nếu không có prompt
        if (!promptOption) {
          return interaction.reply({
            content: `${emojis.warning} **Thiếu prompt!**\n\nVui lòng nhập mô tả server:\n\`\`\`\n/generator prompt:server gaming VN\n\`\`\`\nHoặc dùng text command:\n\`\`\`\n!gen server gaming VN\n\`\`\``,
            flags: 64
          });
        }
        
        // User provided prompt - process directly
        console.log(`${emojis.art} Generator by ${interaction.user.tag}: ${promptOption.substring(0, 100)}`);
        
        await interaction.deferReply({ flags: 64 });
        
        try {
          // Call generation directly
          const design = await this.generateServerDesign(promptOption);
            
            // Store design
            (this as any).tempDesign = (this as any).tempDesign || new Map();
            (this as any).tempDesign.set(interaction.user.id, design);
            
            // Send result
            await this.sendDesignResult(interaction, design);
            
          } catch (error: any) {
            console.error('Direct generation error:', error);
            const errorContainer = new ContainerBuilder()
              .setAccentColor(0xED4245)
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `# ${emojis.error} Lỗi AI!\n\n` +
                  `${emojis.warning} Không thể tạo server design\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `**Error:**\n\`\`\`\n${error.message}\`\`\`\n\n` +
                  `${emojis.info} *Vui lòng thử lại sau*`
                )
              );
            
            await interaction.editReply({
              flags: MessageFlags.IsComponentsV2,
              components: [errorContainer]
            });
          }
      }
    };

    this.commands.set('generator', generatorCommand);
  }

  private setupEventHandlers() {
    // Handle prompt modal submission
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('gen_prompt_modal_')) return;

      const userId = interaction.customId.split('_').pop();
      if (interaction.user.id !== userId) return;

      await interaction.deferReply({ flags: 64 });

      const prompt = interaction.fields.getTextInputValue('prompt');

      // Show loading
      const loadingContainer = new ContainerBuilder()
        .setAccentColor(0xFEE75C)
        .addTextDisplayComponents(
          (text) => text.setContent(
            `# ${emojis.loading} Đang tạo server với AI...\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `**${emojis.sparkles} AI đang làm việc:**\n` +
            `${emojis.chart} Phân tích yêu cầu của bạn\n` +
            `${emojis.art} Thiết kế cấu trúc server\n` +
            `${emojis.star} Chọn emoji phù hợp\n` +
            `${emojis.edit} Tạo tên channels & roles\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `${emojis.clock} *Vui lòng đợi 10-20 giây...*\n` +
            `${emojis.database} *Dùng model: GPT-OSS 120B*`
          )
        );

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [loadingContainer]
      });

      // Generate with AI
      try {
        const design = await this.generateServerDesign(prompt);
        
        // Store design
        (this as any).tempDesign = (this as any).tempDesign || new Map();
        (this as any).tempDesign.set(interaction.user.id, design);
        
        // Send result
        await this.sendDesignResult(interaction, design);
        
      } catch (error: any) {
        console.error('Modal generation error:', error);
        
        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xED4245)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.error} Lỗi AI!\n\n` +
              `${emojis.warning} Không thể tạo server design\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `**Error:**\n\`\`\`\n${error.message}\`\`\`\n\n` +
              `${emojis.info} *Vui lòng thử lại sau*`
            )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        });
      }
    });

    // Handle import JSON modal
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('gen_import_json_modal_')) return;

      const userId = interaction.customId.split('_').pop();
      if (interaction.user.id !== userId) return;

      await interaction.deferReply({ flags: 64 });

      const jsonContent = interaction.fields.getTextInputValue('json_content');

      try {
        // Parse JSON
        const design = JSON.parse(jsonContent);

        // Validate structure
        if (!design.serverName || !design.categories || !Array.isArray(design.categories)) {
          throw new Error('Invalid JSON structure');
        }

        // Store design
        (this as any).tempDesign = (this as any).tempDesign || new Map();
        (this as any).tempDesign.set(interaction.user.id, design);

        // Send result
        await this.sendDesignResult(interaction, design);

      } catch (error: any) {
        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xED4245)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.error} Lỗi Import!\n\n` +
              `${emojis.warning} JSON không hợp lệ\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `**Error:**\n\`\`\`\n${error.message}\`\`\`\n\n` +
              `${emojis.info} *Kiểm tra lại format JSON*`
            )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        });
      }
    });

    // Handle delete confirmation modal
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;
      if (!interaction.customId.startsWith('gen_confirm_delete_all_')) return;

      const userId = interaction.customId.split('_').pop();
      if (interaction.user.id !== userId) return;

      const enteredCode = interaction.fields.getTextInputValue('confirm_code');
      const correctCode = (this as any).deleteConfirmCodes?.get(interaction.user.id);

      if (enteredCode !== correctCode) {
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(0xED4245)
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `# ${emojis.error} Mã xác nhận sai!\n\n` +
                  `${emojis.warning} Code không đúng\n\n` +
                  `${emojis.info} Vui lòng thử lại`
                )
              )
          ]
        });
      }

      // Clear code
      (this as any).deleteConfirmCodes?.delete(interaction.user.id);

      await interaction.deferReply({ flags: 64 });

      const loadingContainer = new ContainerBuilder()
        .setAccentColor(0xED4245)
        .addTextDisplayComponents(
          (text) => text.setContent(
            `# ${emojis.loading} Đang xóa...\n\n` +
            `${emojis.delete} Đang xóa roles...\n` +
            `${emojis.delete} Đang xóa categories...\n` +
            `${emojis.delete} Đang xóa channels...\n` +
            `${emojis.delete} Đang xóa voice channels...\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `${emojis.warning} *Vui lòng không tắt bot...*`
          )
        );

      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [loadingContainer]
      }).catch(() => {});

      try {
        let rolesDeleted = 0;
        let categoriesDeleted = 0;
        let channelsDeleted = 0;
        let voiceDeleted = 0;

        // Delete Roles
        const roles = interaction.guild.roles.cache.filter(
          (r: any) => !r.managed && r.name !== '@everyone' && r.position < interaction.guild.members.me!.roles.highest.position
        );
        for (const [id, role] of roles) {
          try {
            await role.delete();
            rolesDeleted++;
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.error(`Failed to delete role:`, err);
          }
        }

        // Delete Categories
        const categories = interaction.guild.channels.cache.filter(
          (c: any) => c.type === ChannelType.GuildCategory
        );
        for (const [id, category] of categories) {
          try {
            await category.delete();
            categoriesDeleted++;
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.error(`Failed to delete category:`, err);
          }
        }

        // Delete Text Channels (except current channel)
        const textChannels = interaction.guild.channels.cache.filter(
          (c: any) => (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement || c.type === ChannelType.GuildForum) &&
            c.id !== interaction.guild.rulesChannelId &&
            c.id !== interaction.guild.publicUpdatesChannelId &&
            c.id !== interaction.channelId // Keep current channel
        );
        for (const [id, channel] of textChannels) {
          try {
            await channel.delete();
            channelsDeleted++;
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.error(`Failed to delete channel:`, err);
          }
        }

        // Delete Voice Channels
        const voiceChannels = interaction.guild.channels.cache.filter(
          (c: any) => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice
        );
        for (const [id, channel] of voiceChannels) {
          try {
            await channel.delete();
            voiceDeleted++;
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.error(`Failed to delete voice channel:`, err);
          }
        }

        const successContainer = new ContainerBuilder()
          .setAccentColor(0x57F287)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.success} Xóa thành công!\n\n` +
              `${emojis.gift} Đã xóa toàn bộ nội dung server\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `### ${emojis.chart} Thống kê\n` +
              `${emojis.shield} **Roles:** ${rolesDeleted} đã xóa\n` +
              `${emojis.folder} **Categories:** ${categoriesDeleted} đã xóa\n` +
              `${emojis.delete} **Channels:** ${channelsDeleted} đã xóa\n` +
              `${emojis.music} **Voice:** ${voiceDeleted} đã xóa\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${emojis.shield} **Protected:**\n` +
              `• @everyone role\n` +
              `• Bot roles\n` +
              `• System channels\n` +
              `• Channel này (đang dùng)\n\n` +
              `${emojis.sparkles} *Server của bạn giờ đã sạch sẽ!*`
            )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [successContainer]
        }).catch(() => {});

      } catch (error: any) {
        const errorContainer = new ContainerBuilder()
          .setAccentColor(0xED4245)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.error} Lỗi Delete!\n\n` +
              `${emojis.warning} Không thể xóa\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `**Error:**\n\`\`\`\n${error.message}\`\`\``
            )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [errorContainer]
        }).catch(() => {});
      }
    });

    // Handle buttons
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith('gen_')) return;

      const parts = interaction.customId.split('_');
      const action = parts[1];
      const userId = parts[parts.length - 1];

      if (interaction.user.id !== userId) {
        return interaction.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(0xED4245)
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `${emojis.error} **Lỗi!**\n\nĐây không phải button của bạn!`
                )
              )
          ]
        });
      }

      // Export to server
      if (action === 'export') {
        await interaction.deferReply({ flags: 64 });

        const design = (this as any).tempDesign?.get(interaction.user.id);
        if (!design) {
          return interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.error} Không tìm thấy thiết kế\n\n` +
                    `${emojis.info} Vui lòng tạo lại bằng \`/generator\``
                  )
                )
            ]
          });
        }

        const loadingContainer = new ContainerBuilder()
          .setAccentColor(0xFEE75C)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.loading} Đang export vào server...\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `**Tiến trình:**\n` +
              `${emojis.users} Đang tạo roles...\n` +
              `${emojis.folder} Đang tạo categories...\n` +
              `${emojis.message} Đang tạo text channels...\n` +
              `${emojis.music} Đang tạo voice channels...\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${emojis.clock} *Quá trình này mất vài phút...*\n` +
              `${emojis.warning} *Vui lòng KHÔNG tắt bot!*`
            )
          );

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [loadingContainer]
        });

        try {
          let totalRoles = 0;
          let totalChannels = 0;

          // Create roles
          if (design.roles && design.roles.length > 0) {
            for (const roleData of design.roles) {
              try {
                await interaction.guild.roles.create({
                  name: roleData.name,
                  colors: roleData.color ? [roleData.color] : undefined, // Fixed: Use 'colors' array instead of 'color'
                  permissions: roleData.permissions || []
                });
                totalRoles++;
                await new Promise(resolve => setTimeout(resolve, 300));
              } catch (err) {
                console.error(`Failed to create role:`, err);
              }
            }
          }

          // Create categories and channels
          if (design.categories && design.categories.length > 0) {
            for (const category of design.categories) {
              try {
                // Add emoji to category name
                const categoryEmoji = category.emoji || '';
                const categoryName = categoryEmoji ? `${categoryEmoji} ${category.name}` : category.name;
                
                const createdCategory = await interaction.guild.channels.create({
                  name: categoryName,
                  type: ChannelType.GuildCategory
                });
                await new Promise(resolve => setTimeout(resolve, 300));

                if (category.channels && category.channels.length > 0) {
                  for (const channelData of category.channels) {
                    try {
                      // Validate channel type - only allow 0 (Text), 2 (Voice), 13 (Stage)
                      const validTypes = [0, 2, 13];
                      let channelType = channelData.type || ChannelType.GuildText;
                      
                      // If AI returned invalid type (like 5 for Announcement), default to Text
                      if (!validTypes.includes(channelType)) {
                        console.warn(`Invalid channel type ${channelType} for "${channelData.name}", using Text (0)`);
                        channelType = ChannelType.GuildText;
                      }
                      
                      // Add emoji to channel name
                      const emoji = channelData.emoji || '';
                      const channelName = emoji ? `${emoji} ${channelData.name}` : channelData.name;
                      
                      await interaction.guild.channels.create({
                        name: channelName,
                        type: channelType,
                        parent: createdCategory.id
                      });
                      totalChannels++;
                      await new Promise(resolve => setTimeout(resolve, 300));
                    } catch (err) {
                      console.error(`Failed to create channel:`, err);
                    }
                  }
                }
              } catch (err) {
                console.error(`Failed to create category:`, err);
              }
            }
          }

          const successContainer = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(
              (text) => text.setContent(
                `# ${emojis.success} Export thành công!\n\n` +
                `${emojis.gift} Server đã được tạo xong\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `### ${emojis.chart} Thống kê\n` +
                `${emojis.message} **Channels:** ${totalChannels} đã tạo\n` +
                `${emojis.shield} **Roles:** ${totalRoles} đã tạo\n` +
                `${emojis.folder} **Categories:** ${design.categories?.length || 0} đã tạo\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `${emojis.info} *Kiểm tra Discord server để xem kết quả!*\n` +
                `${emojis.sparkles} *Server của bạn đã sẵn sàng!*`
              )
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [successContainer]
          });

        } catch (error: any) {
          const errorContainer = new ContainerBuilder()
            .setAccentColor(0xED4245)
            .addTextDisplayComponents(
              (text) => text.setContent(
                `# ${emojis.error} Lỗi Export!\n\n` +
                `${emojis.warning} Không thể export vào server\n\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `**Error:**\n\`\`\`\n${error.message}\`\`\`\n\n` +
                `${emojis.info} *Kiểm tra quyền bot*`
              )
            );

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [errorContainer]
          });
        }
        return;
      }

      // Export JSON
      if (action === 'json') {
        await interaction.deferReply({ flags: 64 });

        const design = (this as any).tempDesign?.get(interaction.user.id);
        if (!design) {
          return interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.error} Không tìm thấy thiết kế\n\n` +
                    `${emojis.info} Vui lòng tạo lại bằng \`/generator\``
                  )
                )
            ]
          });
        }

        const jsonStr = JSON.stringify(design, null, 2);
        const buffer = Buffer.from(jsonStr, 'utf-8');

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(0x57F287)
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `# ${emojis.success} JSON Export\n\n` +
                  `${emojis.document} File thiết kế server của bạn\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `${emojis.info} *Download file bên dưới*`
                )
              )
          ],
          files: [{ attachment: buffer, name: 'server-design.json' }]
        });
        return;
      }

      // Import JSON
      if (action === 'import') {
        await interaction.deferReply({ flags: 64 });

        // Create example JSON file
        const exampleDesign = {
          "serverName": "🎮 My Gaming Server",
          "roles": [
            {"name": "Owner", "emoji": "${emojis.crown}", "color": "#FF0000"},
            {"name": "Admin", "emoji": "${emojis.shield}", "color": "#FFA500"},
            {"name": "Moderator", "emoji": "⚔️", "color": "#FFFF00"},
            {"name": "VIP", "emoji": "${emojis.star}", "color": "#FFD700"},
            {"name": "Member", "emoji": "${emojis.user}", "color": "#808080"}
          ],
          "categories": [
            {
              "name": "WELCOME",
              "emoji": "👋",
              "channels": [
                {"name": "welcome", "type": 0, "emoji": "👋"},
                {"name": "rules", "type": 0, "emoji": "📜"},
                {"name": "announcements", "type": 5, "emoji": "📢"}
              ]
            },
            {
              "name": "COMMUNITY",
              "emoji": "${emojis.message}",
              "channels": [
                {"name": "general", "type": 0, "emoji": "${emojis.message}"},
                {"name": "off-topic", "type": 0, "emoji": "🎲"},
                {"name": "introductions", "type": 0, "emoji": "🙋"}
              ]
            },
            {
              "name": "GAMING",
              "emoji": "🎮",
              "channels": [
                {"name": "game-discussion", "type": 0, "emoji": "🎮"},
                {"name": "looking-for-group", "type": 0, "emoji": "${emojis.search}"},
                {"name": "tournaments", "type": 0, "emoji": "${emojis.trophy}"}
              ]
            },
            {
              "name": "VOICE CHANNELS",
              "emoji": "🔊",
              "channels": [
                {"name": "lobby voice", "type": 2, "emoji": "🎙️"},
                {"name": "gaming voice", "type": 2, "emoji": "🎮"},
                {"name": "music room", "type": 2, "emoji": "${emojis.music}"},
                {"name": "afk", "type": 2, "emoji": "💤"}
              ]
            }
          ]
        };

        const jsonStr = JSON.stringify(exampleDesign, null, 2);
        const buffer = Buffer.from(jsonStr, 'utf-8');

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            new ContainerBuilder()
              .setAccentColor(0x5865F2)
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `# ${emojis.cloud} Import Template\n\n` +
                  `${emojis.document} File mẫu server design\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `${emojis.info} **Cách dùng:**\n` +
                  `1. Download file bên dưới\n` +
                  `2. Chỉnh sửa theo ý bạn\n` +
                  `3. Dùng \`/generator\` và upload file đã chỉnh sửa\n\n` +
                  `${emojis.sparkles} *Template bao gồm roles, categories, channels mẫu*`
                )
              )
          ],
          files: [{ attachment: buffer, name: 'server-template.json' }]
        });
        return;
      }

      // Menu - show all options
      if (action === 'menu') {
        const design = (this as any).tempDesign?.get(interaction.user.id);
        if (!design) {
          return interaction.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.error} Không tìm thấy thiết kế\n\n` +
                    `${emojis.info} Vui lòng tạo lại bằng \`/generator\``
                  )
                )
            ]
          });
        }

        const menuContainer = new ContainerBuilder()
          .setAccentColor(0x5865F2)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.sparkles} Generator Menu\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `**Chọn tác vụ bên dưới:**`
            )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `${emojis.export} **Export JSON (DM)**\n` +
                  `Gửi file thiết kế vào tin nhắn riêng của bạn`
                )
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_json_dm_${interaction.user.id}`)
                  .setLabel('📤 Send DM')
                  .setStyle(ButtonStyle.Success)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `${emojis.cloud} **Import File**\n` +
                  `Nhập file JSON thiết kế có sẵn để load`
                )
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_import_file_${interaction.user.id}`)
                  .setLabel('📥 Import')
                  .setStyle(ButtonStyle.Primary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `${emojis.refresh} **Tạo lại**\n` +
                  `Tạo thiết kế mới với prompt khác`
                )
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_retry_${interaction.user.id}`)
                  .setLabel('🔄 Retry')
                  .setStyle(ButtonStyle.Secondary)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `${emojis.delete} **Xóa toàn bộ**\n` +
                  `${emojis.warning} Xóa TẤT CẢ channels, categories, roles`
                )
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_delete_${interaction.user.id}`)
                  .setLabel('�️ Delete All')
                  .setStyle(ButtonStyle.Danger)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(
                  `${emojis.refresh} **Quay lại**\n` +
                  `Xem lại thiết kế server`
                )
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_back_to_design_${interaction.user.id}`)
                  .setLabel('⬅️ Back')
                  .setStyle(ButtonStyle.Secondary)
              )
          );

        await interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [menuContainer]
        });
        return;
      }

      // Retry
      if (action === 'retry') {
        const modal = new ModalBuilder()
          .setCustomId(`gen_prompt_modal_${interaction.user.id}`)
          .setTitle('🎨 Server Generator');

        const promptInput = new TextInputBuilder()
          .setCustomId('prompt')
          .setLabel('Mô tả server bạn muốn tạo')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Ví dụ: Server gaming với kênh voice, kênh chat game...')
          .setRequired(true)
          .setMinLength(10)
          .setMaxLength(500);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(promptInput)
        );

        await interaction.showModal(modal);
        return;
      }

      // Back to design
      if (action === 'back' && parts.includes('to') && parts.includes('design')) {
        const design = (this as any).tempDesign?.get(interaction.user.id);
        if (!design) {
          return interaction.update({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.error} Không tìm thấy thiết kế\n\n` +
                    `${emojis.info} Vui lòng tạo lại bằng \`/generator\``
                  )
                )
            ]
          });
        }

        // Count stats
        const totalCategories = design.categories?.length || 0;
        const totalChannels = design.categories?.reduce((sum: number, cat: any) => 
          sum + (cat.channels?.length || 0), 0) || 0;
        const totalRoles = design.roles?.length || 0;
        const totalVoice = design.categories?.reduce((sum: number, cat: any) => 
          sum + (cat.channels?.filter((ch: any) => ch.type === 2).length || 0), 0) || 0;
        const totalText = totalChannels - totalVoice;
        
        // Generate preview
        let preview = `\x1b[36m${design.serverName || 'Server Design'}\x1b[0m\n`;
        
        if (design.categories && design.categories.length > 0) {
          design.categories.forEach((cat: any, catIndex: number) => {
            const isCatLast = catIndex === design.categories.length - 1;
            const catPrefix = isCatLast ? '└──' : '├──';
            const catEmoji = cat.emoji || emojis.folder;
            preview += `${catPrefix} \x1b[33m${catEmoji} ${cat.name}\x1b[0m\n`;
            
            if (cat.channels && cat.channels.length > 0) {
              cat.channels.forEach((ch: any, chIndex: number) => {
                const isChLast = chIndex === cat.channels.length - 1;
                const lineChar = isCatLast ? '    ' : '│   ';
                const chPrefix = isChLast ? '└──' : '├──';
                const chIcon = ch.type === 2 ? '\x1b[34m🔊\x1b[0m' : '\x1b[32m#\x1b[0m';
                const chEmoji = ch.emoji || '';
                const chName = chEmoji ? `${chEmoji} ${ch.name}` : ch.name;
                preview += `${lineChar}${chPrefix} ${chIcon} ${chName}\n`;
              });
            }
          });
        }

        // Update with design
        const resultContainer = new ContainerBuilder()
          .setAccentColor(0x5865F2)
          .addTextDisplayComponents(
            (text) => text.setContent(
              `# ${emojis.sparkles} ${design.serverName || 'Server Design'}\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${emojis.chart} **Thống kê:**\n` +
              `${emojis.folder} Categories: **${totalCategories}**\n` +
              `${emojis.message} Text Channels: **${totalText}**\n` +
              `${emojis.music} Voice Channels: **${totalVoice}**\n` +
              `${emojis.users} Roles: **${totalRoles}**\n\n` +
              `━━━━━━━━━━━━━━━━━━━━`
            )
          )
          .addTextDisplayComponents(
            (text) => text.setContent(
              `**${emojis.document} Cấu trúc Server:**\n\`\`\`ansi\n${preview}\`\`\``
            )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.export} **Export to Server**\nÁp dụng thiết kế vào server này`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_export_${interaction.user.id}`)
                  .setLabel('🚀 Export')
                  .setStyle(ButtonStyle.Success)
              )
          )
          .addSectionComponents(
            (section) => section
              .addTextDisplayComponents(
                (text) => text.setContent(`${emojis.sparkles} **More Options**\nExport JSON, Import, Delete...`)
              )
              .setButtonAccessory(
                new ButtonBuilder()
                  .setCustomId(`gen_menu_${interaction.user.id}`)
                  .setLabel('⚙️ Menu')
                  .setStyle(ButtonStyle.Primary)
              )
          );

        await interaction.update({
          flags: MessageFlags.IsComponentsV2,
          components: [resultContainer]
        });
        return;
      }

      // JSON DM - Send file to user's DM
      if (action === 'json' && parts.includes('dm')) {
        await interaction.deferReply({ flags: 64 });

        const design = (this as any).tempDesign?.get(interaction.user.id);
        if (!design) {
          return interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.error} Không tìm thấy thiết kế\n\n` +
                    `${emojis.info} Vui lòng tạo lại bằng \`/generator\``
                  )
                )
            ]
          });
        }

        try {
          const jsonStr = JSON.stringify(design, null, 2);
          const buffer = Buffer.from(jsonStr, 'utf-8');

          // Send DM
          await interaction.user.send({
            content: `${emojis.success} **Server Design Export**\n\nĐây là file thiết kế server của bạn!`,
            files: [{ attachment: buffer, name: `server-design-${Date.now()}.json` }]
          });

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.success} Đã gửi DM!\n\n` +
                    `${emojis.message} File JSON đã được gửi vào tin nhắn riêng của bạn\n\n` +
                    `${emojis.info} *Kiểm tra DM để tải file*`
                  )
                )
            ]
          });
        } catch (error: any) {
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [
              new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(
                  (text) => text.setContent(
                    `# ${emojis.error} Không thể gửi DM!\n\n` +
                    `${emojis.warning} Bạn có thể đã tắt DM từ server members\n\n` +
                    `${emojis.info} *Vui lòng bật DM trong User Settings → Privacy & Safety*`
                  )
                )
            ]
          });
        }
        return;
      }

      // Import File - Show modal for JSON input
      if (action === 'import' && parts.includes('file')) {
        const modal = new ModalBuilder()
          .setCustomId(`gen_import_json_modal_${interaction.user.id}`)
          .setTitle('📥 Import Server Design');

        const jsonInput = new TextInputBuilder()
          .setCustomId('json_content')
          .setLabel('Paste JSON content')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Paste your server design JSON here...')
          .setRequired(true)
          .setMinLength(50)
          .setMaxLength(4000);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(jsonInput)
        );

        await interaction.showModal(modal);
        return;
      }

      // Delete All (with confirmation)
      if (action === 'delete') {
        const confirmCode = Math.floor(1000 + Math.random() * 9000).toString();
        (this as any).deleteConfirmCodes = (this as any).deleteConfirmCodes || new Map();
        (this as any).deleteConfirmCodes.set(interaction.user.id, confirmCode);

        const modal = new ModalBuilder()
          .setCustomId(`gen_confirm_delete_all_${interaction.user.id}`)
          .setTitle('⚠️ Xác nhận xóa TOÀN BỘ');

        const codeInput = new TextInputBuilder()
          .setCustomId('confirm_code')
          .setLabel(`Nhập mã xác nhận: ${confirmCode}`)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Nhập mã 4 số để xác nhận xóa ALL')
          .setRequired(true)
          .setMinLength(4)
          .setMaxLength(4);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(codeInput)
        );

        await interaction.showModal(modal);
        return;
      }
    });
  }

  async shutdown() {
    console.log(`Shutting down ${this.name}`);
  }
}
