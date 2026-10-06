import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  Message, 
  User as DiscordUser, 
  MessageComponentInteraction, 
  AttachmentBuilder 
} from 'discord.js';
import { emojis } from '../../config/emojis';
import fs from 'fs';
import path from 'path';

// For prefix command access
export let questModuleInstance: any = null;

// ==================== INTERFACES ====================

interface Quest {
  id: string;
  period: 'daily' | 'weekly';
  kind: 'message' | 'command';
  text: string;
  target: number;
  reward: number;
  cmd?: string;
  channelId?: string;
}

interface UserQuestData {
  quests?: {
    daily?: { key: string; prog: { [questId: string]: number }; claimed: { [questId: string]: boolean }; earned: number; };
    weekly?: { key: string; prog: { [questId: string]: number }; claimed: { [questId: string]: boolean }; earned: number; };
  };
  done?: number;
  book?: boolean;
  bookExpiry?: number; // Timestamp when book expires (7 days after purchase)
}

interface QuestDB { 
  [userId: string]: UserQuestData; 
}

// ==================== CONSTANTS ====================

const QUEST_CAP = 1000;
const QUEST_CAP_BOOK = 5000; // [EXCLUSIVE] Giới hạn Sổ Xịn tăng lên
const BOOK_PRICE = 2000; // Giá Sổ Xịn (giảm từ 5000)
const BOOK_DURATION_DAYS = 7; // Sổ Xịn hết hạn sau 7 ngày
const BOOK_MULTIPLIER = 2; // x2 coin rewards
const TZ_OFFSET_H = 7;

const QUESTS: Quest[] = [
  { id: 'msg_10', period: 'daily', kind: 'message', text: 'Gửi 10 tin nhắn trong {ch}', target: 10, reward: 100 },
  { id: 'msg_50', period: 'daily', kind: 'message', text: 'Gửi 50 tin nhắn trong {ch}', target: 50, reward: 500 },
  { id: 'shop_3', period: 'daily', kind: 'command', cmd: 'shop', text: 'Dùng /shop 3 lần', target: 3, reward: 150 },
  { id: 'daily_1', period: 'daily', kind: 'command', cmd: 'daily', text: 'Dùng /daily hôm nay', target: 1, reward: 200 },
  { id: 'msg_week', period: 'weekly', kind: 'message', text: 'Gửi 200 tin nhắn trong tuần', target: 200, reward: 2000 },
  { id: 'shop_week', period: 'weekly', kind: 'command', cmd: 'shop', text: 'Dùng /shop 10 lần trong tuần', target: 10, reward: 1500 },
];

const dataPath = path.join(process.cwd(), 'data', 'quests.json');

// Ensure data directory and file exist
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({}));
}

// ==================== CURRENCY FUNCTIONS ====================

function addCurrencyToUser(userId: string, amount: number): void {
  const currPath = path.join(process.cwd(), 'data', 'currencies.json');
  let data: any = {};
  try { 
    if (fs.existsSync(currPath)) {
      data = JSON.parse(fs.readFileSync(currPath, 'utf8')); 
    }
  } catch {}
  const bal = data[userId] ?? { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
  bal.cowoncy += amount;
  data[userId] = bal;
  fs.writeFileSync(currPath, JSON.stringify(data, null, 2));
}

function getUserBalanceLocal(userId: string): { cowoncy: number; blueTicket: number; goldTicket: number } {
  const currPath = path.join(process.cwd(), 'data', 'currencies.json');
  try { 
    if (fs.existsSync(currPath)) {
      const d = JSON.parse(fs.readFileSync(currPath, 'utf8')); 
      return d[userId] ?? { cowoncy: 0, blueTicket: 0, goldTicket: 0 }; 
    }
  } catch {}
  return { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
}

function subtractCurrencyFromUser(userId: string, amount: number): boolean {
  const currPath = path.join(process.cwd(), 'data', 'currencies.json');
  let data: any = {};
  try { 
    if (fs.existsSync(currPath)) {
      data = JSON.parse(fs.readFileSync(currPath, 'utf8')); 
    }
  } catch {}
  const bal = data[userId] ?? { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
  if (bal.cowoncy < amount) return false;
  bal.cowoncy -= amount;
  data[userId] = bal;
  fs.writeFileSync(currPath, JSON.stringify(data, null, 2));
  return true;
}

// ==================== PERIOD MANAGEMENT ====================

function periodInfo(period: 'daily' | 'weekly') {
  const DAY = 24 * 60 * 60 * 1000;
  const OFFSET = TZ_OFFSET_H * 60 * 60 * 1000;
  const vnNow = Date.now() + OFFSET;
  const vnDate = new Date(vnNow);
  let start = Date.UTC(vnDate.getUTCFullYear(), vnDate.getUTCMonth(), vnDate.getUTCDate()) - OFFSET;
  if (period === 'weekly') {
    const dayOfWeek = new Date(vnNow).getUTCDay();
    start -= ((dayOfWeek + 6) % 7) * DAY;
  }
  const len = period === 'weekly' ? 7 * DAY : DAY;
  return {
    key: new Date(start).toISOString().slice(0, 10),
    resetAt: start + len
  };
}

// ==================== DATA ACCESS ====================

function checkBookExpiry(userId: string): void {
  const user = loadUser(userId);
  if (user.book && user.bookExpiry) {
    const now = Date.now();
    if (now >= user.bookExpiry) {
      console.log(`[Quest] Book expired for user ${userId}, revoking...`);
      user.book = false;
      delete user.bookExpiry;
      saveUser(userId, user);
    }
  }
}

function loadUser(userId: string): UserQuestData {
  try {
    const data: QuestDB = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return data[userId] ?? {};
  } catch {
    return {};
  }
}

function saveUser(userId: string, userData: UserQuestData): void {
  let data: QuestDB = {};
  try {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch {}
  data[userId] = userData;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getSlot(userId: string, period: 'daily' | 'weekly') {
  const user = loadUser(userId);
  const { key } = periodInfo(period);
  user.quests ??= {};
  if (user.quests[period]?.key !== key) {
    user.quests[period] = { key, prog: {}, claimed: {}, earned: 0 };
    saveUser(userId, user);
  }
  return user.quests[period]!;
}

// ==================== TRACKING ====================

const lastMessageTime = new Map<string, number>();

/**
 * Track command usage for quests. Call this from any command that should count towards quest progress.
 * Example: trackCommand(interaction.user.id, 'shop') after /shop executes.
 * @param userId - Discord user ID
 * @param commandName - Name of command executed (e.g., 'shop', 'daily')
 */
export function trackCommand(userId: string, commandName: string): void {
  trackProgress(userId, 'command', commandName);
}

function trackProgress(userId: string, kind: 'message' | 'command', key: string): void {
  const user = loadUser(userId);
  let changed = false;
  console.log(`[Quest] trackProgress: userId=${userId}, kind=${kind}, key=${key}`);
  
  // Pre-load all slots to avoid multiple getSlot calls
  const dailySlot = getSlot(userId, 'daily');
  const weeklySlot = getSlot(userId, 'weekly');
  
  for (const quest of QUESTS) {
    if (quest.kind !== kind) continue;
    if (kind === 'command' && quest.cmd !== key) continue;
    if (kind === 'message' && quest.channelId && quest.channelId !== key) continue;
    
    const sl = quest.period === 'daily' ? dailySlot : weeklySlot;
    const current = sl.prog[quest.id] ?? 0;
    if (sl.claimed[quest.id] || current >= quest.target) continue;
    console.log(`[Quest] Updating ${quest.id}: ${current} → ${current + 1}`);
    sl.prog[quest.id] = Math.min(quest.target, current + 1);
    changed = true;
  }
  
  if (changed) {
    console.log(`[Quest] Saving progress for user ${userId}`);
    user.quests ??= {};
    user.quests.daily = dailySlot;
    user.quests.weekly = weeklySlot;
    saveUser(userId, user);
  }
}

// ==================== UI BUILDING ====================

// Helper: Parse emoji string to Discord emoji object for buttons
function parseEmojiForButton(emojiString: string): { id: string; name: string; animated: boolean } | string {
  // If it's animated format: <a:name:id>
  const animatedMatch = emojiString.match(/<a:([^:]+):(\d+)>/);
  if (animatedMatch) {
    return { name: animatedMatch[1], id: animatedMatch[2], animated: true };
  }
  
  // If it's static format: <:name:id>
  const staticMatch = emojiString.match(/<:([^:]+):(\d+)>/);
  if (staticMatch) {
    return { name: staticMatch[1], id: staticMatch[2], animated: false };
  }
  
  // Otherwise return as-is (unicode emoji)
  return emojiString;
}

function buildQuestEmbed(client: Client, user: DiscordUser, period: 'daily' | 'weekly'): EmbedBuilder {
  // Check book expiry first
  checkBookExpiry(user.id);
  
  const userData = loadUser(user.id);
  const sl = getSlot(user.id, period);
  const { resetAt } = periodInfo(period);
  const cap = userData.book ? QUEST_CAP_BOOK : QUEST_CAP;
  const isDaily = period === 'daily';

  const fields: any[] = [
    { name: `${emojis.trophy} Đã hoàn thành`, value: `> \`${userData.done ?? 0}\` nhiệm vụ`, inline: true },
    { name: isDaily ? `${emojis.coin} Xu hôm nay` : `${emojis.coin} Xu tuần này`, value: `> \`${isDaily ? `${sl.earned}/${cap}` : sl.earned}\` ${emojis.coin}`, inline: true },
    { name: `${emojis.clock} Làm mới sau`, value: `> <t:${Math.floor(resetAt / 1000)}:R>`, inline: true },
  ];
  
  // Add book expiry info if active
  if (userData.book && userData.bookExpiry) {
    fields.push({
      name: '📗 Sổ Xịn VIP',
      value: `> Hết hạn: <t:${Math.floor(userData.bookExpiry / 1000)}:R>\n> Thưởng: **x${BOOK_MULTIPLIER}** coins`,
      inline: false
    });
  }

  const periodQuests = QUESTS.filter(q => q.period === period);
  for (const quest of periodQuests) {
    const progress = sl.prog[quest.id] ?? 0;
    const completed = progress >= quest.target;
    const bar = completed ? '[ ✓ ]' : `[ ${progress}/${quest.target} ]`;
    const note = sl.claimed[quest.id] ? ` ${emojis.success} đã nhận` : completed ? ` ${emojis.sparkles} chờ nhận` : '';
    const questIcon = quest.kind === 'message' ? emojis.message : emojis.terminal;
    fields.push({
      name: '\u200B',
      value: [
        `${questIcon} ${quest.text.replace('{ch}', quest.channelId ? `<#${quest.channelId}>` : 'bất kỳ kênh nào')}`,
        `${emojis.gift} Phần thưởng: **${quest.reward}** ${emojis.coin}`,
        `${emojis.chart} Tiến độ: \`${bar}\`${note}`,
      ].join('\n'),
      inline: false,
    });
  }

  return new EmbedBuilder()
    .setColor('#5865F2')
    .setAuthor({ name: period === 'daily' ? '📅 Nhiệm Vụ Hằng Ngày' : '📆 Nhiệm Vụ Hằng Tuần', iconURL: user.displayAvatarURL() })
    .setTitle(userData.book ? '📗 Sổ Nhiệm Vụ Xịn' : '📒 Sổ Nhiệm Vụ')
    .addFields(fields)
    .setFooter({ text: '✨ Banhcuon-bot' });
}

function buildComponents(user: DiscordUser, period: 'daily' | 'weekly', userData: UserQuestData): ActionRowBuilder<any>[] {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`quest:view:${user.id}:${period}`)
    .setPlaceholder('Chọn loại nhiệm vụ')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Nhiệm Vụ Hằng Ngày')
        .setDescription('Làm mới mỗi ngày lúc 00:00')
        .setValue('daily')
        .setEmoji('📅')
        .setDefault(period === 'daily'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Nhiệm Vụ Hằng Tuần')
        .setDescription('Làm mới mỗi tuần vào thứ Hai')
        .setValue('weekly')
        .setEmoji('📆')
        .setDefault(period === 'weekly')
    );

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`quest:upgrade:${user.id}:${period}`)
      .setLabel('Nâng cấp Sổ Xịn')
      .setEmoji(parseEmojiForButton(emojis.ledger))
      .setStyle(ButtonStyle.Success)
      .setDisabled(userData.book ?? false),
    new ButtonBuilder()
      .setCustomId(`quest:claim:${user.id}:${period}`)
      .setLabel('Nhận Thưởng')
      .setEmoji(parseEmojiForButton(emojis.gift))
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`quest:guide:${user.id}:${period}`)
      .setLabel('Hướng Dẫn')
      .setEmoji(parseEmojiForButton(emojis.info))
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

// ==================== INTERACTION HANDLERS ====================

async function handleClaim(interaction: MessageComponentInteraction, uid: string, period: 'daily' | 'weekly', client: Client) {
  // Check book expiry
  checkBookExpiry(uid);
  
  const userData = loadUser(uid);
  const sl = getSlot(uid, period);
  const cap = userData.book ? QUEST_CAP_BOOK : QUEST_CAP;
  const multiplier = userData.book ? BOOK_MULTIPLIER : 1;
  const ready = QUESTS.filter(q => q.period === period && (sl.prog[q.id] ?? 0) >= q.target && !sl.claimed[q.id]);
  if (!ready.length) {
    return interaction.reply({ content: `${emojis.warning} Chưa có nhiệm vụ nào hoàn thành!`, flags: 64 });
  }
  // Sort by descending reward to maximize payout when cap limited
  ready.sort((a, b) => b.reward - a.reward);
  let room = period === 'daily' ? Math.max(0, cap - sl.earned) : Infinity;
  let gained = 0;
  let clipped = false;
  for (const quest of ready) {
    const baseReward = quest.reward * multiplier; // Apply multiplier
    const reward = Math.min(baseReward, room);
    if (reward < baseReward) clipped = true;
    gained += reward;
    room = isFinite(room) ? Math.max(0, room - reward) : Infinity;
    sl.claimed[quest.id] = true;
    userData.done = (userData.done ?? 0) + 1;
  }
  sl.earned += gained;
  userData.quests ??= {};
  userData.quests[period] = sl;
  addCurrencyToUser(uid, gained);
  saveUser(uid, userData);
  await interaction.update({ embeds: [buildQuestEmbed(client, interaction.user, period)], components: buildComponents(interaction.user, period, userData) });
  
  const bonusText = multiplier > 1 ? ` (x${multiplier} từ Sổ Xịn 📗)` : '';
  return interaction.followUp({
    content: `${emojis.success} Hoàn thành **${ready.length}** nhiệm vụ, nhận **${gained}** ${emojis.coin}${bonusText}!` +
      (clipped ? `\n${emojis.warning} Đã chạm giới hạn xu hôm nay. Nâng cấp Sổ Xịn để tăng!` : ''),
    flags: 64
  });
}

async function handleUpgrade(interaction: MessageComponentInteraction, uid: string, period: 'daily' | 'weekly', client: Client) {
  const userData = loadUser(uid);
  if (userData.book) return interaction.reply({ content: `${emojis.success} Bạn đã có Sổ Xịn rồi!`, flags: 64 });
  const bal = getUserBalanceLocal(uid);
  if (bal.cowoncy < BOOK_PRICE) {
    return interaction.reply({ content: `${emojis.error} Cần **${BOOK_PRICE}** ${emojis.coin} để nâng cấp!`, flags: 64 });
  }
  const success = subtractCurrencyFromUser(uid, BOOK_PRICE);
  if (!success) {
    return interaction.reply({ content: `${emojis.error} Không đủ xu để nâng cấp!`, flags: 64 });
  }
  
  // Activate book with 7-day expiry
  const now = Date.now();
  const expiryTime = now + (BOOK_DURATION_DAYS * 24 * 60 * 60 * 1000);
  userData.book = true;
  userData.bookExpiry = expiryTime;
  saveUser(uid, userData);
  
  await interaction.update({ embeds: [buildQuestEmbed(client, interaction.user, period)], components: buildComponents(interaction.user, period, userData) });
  return interaction.followUp({ 
    content: `${emojis.sparkles} Đã nâng cấp Sổ Xịn!\n` +
      `📗 Thưởng **x${BOOK_MULTIPLIER}** coins từ quest\n` +
      `⏰ Hết hạn: <t:${Math.floor(expiryTime / 1000)}:R>\n` +
      `📊 Giới hạn tăng lên **${QUEST_CAP_BOOK}** ${emojis.coin}/ngày!`, 
    flags: 64 
  });
}

async function handleGuide(interaction: MessageComponentInteraction) {
  const guideEmbed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle(`${emojis.sparkles} Hướng Dẫn Nhiệm Vụ`)
    .setDescription([
      '**Cách hoàn thành nhiệm vụ:**',
      '',
      `📨 **Gửi tin nhắn** - Chat trong server để tích điểm`,
      `⌨️ **Dùng lệnh** - Sử dụng /shop, /daily để hoàn thành nhiệm vụ`,
      '',
      `${emojis.info} **Lưu ý:**`,
      `• Nhiệm vụ hàng ngày reset mỗi ngày lúc 00:00 (UTC+7)`,
      `• Nhiệm vụ hàng tuần reset vào thứ Hai hàng tuần`,
      `• Phần thưởng được cộng vào tài khoản khi nhận`,
      `• Giới hạn xu hàng ngày: **${QUEST_CAP}** ${emojis.coin} (nâng cấp lên **${QUEST_CAP_BOOK}** ${emojis.coin} với Sổ Xịn)`,
      '',
      `${emojis.sparkles} **Mẹo:**`,
      `• Hoàn thành nhiệm vụ dễ trước`,
      `• Nâng cấp Sổ Xịn (${BOOK_PRICE} ${emojis.coin}) để tăng giới hạn hàng ngày`,
      `• Nhiệm vụ tuần không có giới hạn xu`,
    ].join('\n'))
    .setFooter({ text: 'Chúc bạn hoàn thành nhiệm vụ thành công!' })
    .setTimestamp();

  return interaction.reply({ embeds: [guideEmbed], flags: 64 });
}

// ==================== MODULE CLASS ====================

export default class QuestModule {
  name = 'quest-module';
  description = 'Hệ thống nhiệm vụ hàng ngày và hàng tuần';
  version = '2.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  private messageHandler?: (message: Message) => void;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Quest module initialized with ${this.commands.size} commands`);
  }

  private registerCommands() {
    const questCommand = {
      data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('Xem nhiệm vụ hàng ngày và hàng tuần'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }

        let currentPeriod: 'daily' | 'weekly' = 'daily';
        checkBookExpiry(interaction.user.id);
        const userData = loadUser(interaction.user.id);
        
        // Check if all quests are claimed for current period
        const allQuestsClaimed = this.checkAllQuestsClaimed(interaction.user.id, currentPeriod);
        
        if (allQuestsClaimed) {
          // Show summary embed (like daily's "already claimed")
          const summaryEmbed = this.buildSummaryEmbed(interaction.user, currentPeriod);
          await interaction.editReply({ embeds: [summaryEmbed] });
          return;
        }

        const embed = buildQuestEmbed(this.client, interaction.user, currentPeriod);
        const components = buildComponents(interaction.user, currentPeriod, userData);

        const response = await interaction.editReply({
          embeds: [embed],
          components: components
        });

        const collector = response.createMessageComponentCollector({
          time: 900000 // 15 minutes
        });

        collector.on('collect', async (i) => {
          const parts = i.customId.split(':');
          const [, action, uid, periodFromId] = parts;

          // Owner check
          if (i.user.id !== uid) {
            return i.reply({ content: '❌ Bạn không thể sử dụng button này!', flags: 64 });
          }

          if (action === 'view' && i.isStringSelectMenu()) {
            const newPeriod = i.values[0] as 'daily' | 'weekly';
            currentPeriod = newPeriod;
            const newUserData = loadUser(uid);
            const newEmbed = buildQuestEmbed(this.client, i.user, newPeriod);
            const newComponents = buildComponents(i.user, newPeriod, newUserData);
            await i.update({ embeds: [newEmbed], components: newComponents });
          } else if (action === 'claim') {
            await handleClaim(i, uid, periodFromId as 'daily' | 'weekly', this.client);
          } else if (action === 'upgrade') {
            await handleUpgrade(i, uid, periodFromId as 'daily' | 'weekly', this.client);
          } else if (action === 'guide') {
            await handleGuide(i);
          }
        });

        collector.on('end', () => {
          // Disable components after timeout
          interaction.editReply({ components: [] }).catch(() => {});
        });
      }
    };

    this.commands.set('quest', questCommand);
  }

  private registerEvents() {
    this.messageHandler = (message: Message) => {
      if (message.author.bot || !message.guild) return;
      const now = Date.now();
      const userId = message.author.id;
      if (now - (lastMessageTime.get(userId) ?? 0) < 5000) return;
      lastMessageTime.set(userId, now);
      console.log(`[Quest] Tracking message from ${message.author.tag} in channel ${message.channelId}`);
      trackProgress(userId, 'message', message.channelId);
    };

    this.client.on('messageCreate', this.messageHandler);
    console.log('✅ Quest message tracking registered');
  }

  async cleanup() {
    if (this.messageHandler) {
      this.client.off('messageCreate', this.messageHandler);
    }
    lastMessageTime.clear();
    console.log('Quest module cleanup');
  }
  
  // Check if all available quests are claimed
  private checkAllQuestsClaimed(userId: string, period: 'daily' | 'weekly'): boolean {
    const sl = getSlot(userId, period);
    const periodQuests = QUESTS.filter(q => q.period === period);
    
    // If no quests exist, return false
    if (periodQuests.length === 0) return false;
    
    // Check if all quests are either claimed or not completed
    for (const quest of periodQuests) {
      const progress = sl.prog[quest.id] ?? 0;
      const completed = progress >= quest.target;
      const claimed = sl.claimed[quest.id] ?? false;
      
      // If any quest is completed but not claimed, return false
      if (completed && !claimed) {
        return false;
      }
    }
    
    // All quests are either claimed or not completed yet
    return true;
  }
  
  // Build summary embed when all quests claimed
  private buildSummaryEmbed(user: DiscordUser, period: 'daily' | 'weekly'): EmbedBuilder {
    checkBookExpiry(user.id);
    const userData = loadUser(user.id);
    const sl = getSlot(user.id, period);
    const { resetAt } = periodInfo(period);
    const isDaily = period === 'daily';
    
    return new EmbedBuilder()
      .setColor('#5865F2')
      .setAuthor({ name: isDaily ? '📅 Nhiệm Vụ Hằng Ngày' : '📆 Nhiệm Vụ Hằng Tuần', iconURL: user.displayAvatarURL() })
      .setDescription([
        `${emojis.success} **Bạn đã hoàn thành tất cả nhiệm vụ!**`,
        '',
        `━━━━━━━━━━━━━━━━━━━━`,
        '',
        `${emojis.trophy} **Đã hoàn thành:** ${userData.done ?? 0} nhiệm vụ`,
        `${emojis.coin} **Xu ${isDaily ? 'hôm nay' : 'tuần này'}:** ${sl.earned} ${emojis.coin}`,
        userData.book && userData.bookExpiry ? `${emojis.sparkles} **Sổ Xịn VIP:** Hết hạn <t:${Math.floor(userData.bookExpiry / 1000)}:R>` : '',
        '',
        `${emojis.clock} **Nhiệm vụ mới:** <t:${Math.floor(resetAt / 1000)}:R>`
      ].filter(Boolean).join('\n'))
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ 
        text: `${user.username} • Banhcuon-bot`,
        iconURL: user.displayAvatarURL()
      })
      .setTimestamp();
  }
}
