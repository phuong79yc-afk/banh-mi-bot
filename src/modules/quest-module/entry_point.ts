import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  User as DiscordUser,
  MessageComponentInteraction,
  StringSelectMenuInteraction,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { emojis, getEmoji } from '../../config/emojis';
import { addTransaction } from '../balance-module/entry_point';
import { addCoins, getCurrencyBalance, spendCoins } from '../../utils/currency';
import fs from 'fs';
import path from 'path';

// For prefix command access
export let questModuleInstance: any = null;

// ==================== TYPES ====================
type Period = 'daily' | 'weekly';

interface Quest {
  id: string;
  period: Period;
  kind: 'message' | 'command';
  text: string;
  target: number;
  reward: number;
  cmd?: string;
  channelId?: string;
}

interface Slot {
  key: string;
  prog: Record<string, number>;
  claimed: Record<string, boolean>;
  earned: number;
}

interface UserData {
  quests?: { daily?: Slot; weekly?: Slot };
  done?: number;
  book?: number;
  coins: number;
}

type UserDB = Record<string, UserData>;

// ==================== CONFIG ====================
const COIN = emojis.coin || '🪙';
const SHOP_COLOR = 0x8068ec;
const SERVER_LINK = ''; // Link invite server (để trống nếu không dùng)
const QUEST_CAP = 1000;
const QUEST_CAP_BOOK = 5000;
const BOOK_PRICE = 2000;
const TZ_OFFSET_H = 7;
const QUEST_THUMBNAIL = ''; // URL ảnh thumbnail (để trống nếu không dùng)

const QUESTS: Quest[] = [
  { id: 'msg_10', period: 'daily', kind: 'message', text: 'Gửi 10 tin nhắn trong {ch}', target: 10, reward: 100 },
  { id: 'msg_50', period: 'daily', kind: 'message', text: 'Gửi 50 tin nhắn trong {ch}', target: 50, reward: 500 },
  { id: 'shop_3', period: 'daily', kind: 'command', cmd: 'shop', text: 'Dùng /shop 3 lần', target: 3, reward: 150 },
  { id: 'daily_1', period: 'daily', kind: 'command', cmd: 'daily', text: 'Dùng /daily hôm nay', target: 1, reward: 200 },
  { id: 'msg_week', period: 'weekly', kind: 'message', text: 'Gửi 200 tin nhắn trong tuần', target: 200, reward: 2000 },
  { id: 'shop_week', period: 'weekly', kind: 'command', cmd: 'shop', text: 'Dùng /shop 10 lần trong tuần', target: 10, reward: 1500 },
];

// Components V2
const V2 = MessageFlags.IsComponentsV2;
const V2_EPH = V2 | MessageFlags.Ephemeral;
const OK = 0x57f287;
const WARN = 0xfee75c;
const ERR = 0xed4245;

const PERIODS: Record<Period, string> = {
  daily: 'Nhiệm Vụ Hằng Ngày',
  weekly: 'Nhiệm Vụ Hằng Tuần',
};

const DAY = 24 * 60 * 60 * 1000;
const OFFSET = TZ_OFFSET_H * 60 * 60 * 1000;

// ==================== HELPERS ====================
const txt = (c: string) => new TextDisplayBuilder().setContent(c);
const sep = () => new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
const fmt = (n: number) => n.toLocaleString('en-US');

const bar = (cur: number, max: number, len = 10) => {
  const filled = Math.round((Math.min(cur, max) / max) * len);
  return '▰'.repeat(filled) + '▱'.repeat(len - filled);
};

const notice = (color: number, ...lines: string[]) => ({
  components: [new ContainerBuilder().addTextDisplayComponents(txt(lines.join('\n')))],
  flags: V2_EPH,
});

// ==================== DATABASE ====================
const dataDir = path.join(process.cwd(), 'data');
const questPath = path.join(dataDir, 'quest-users.json');

fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(questPath)) fs.writeFileSync(questPath, '{}');

function loadDB(): UserDB {
  try {
    return JSON.parse(fs.readFileSync(questPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveDB(db: UserDB): void {
  fs.writeFileSync(questPath, JSON.stringify(db, null, 2));
}

function getUser(userId: string): UserData {
  const db = loadDB();
  return db[userId] ?? { coins: 0, done: 0 };
}

function saveUser(userId: string, data: UserData): void {
  const db = loadDB();
  db[userId] = data;
  saveDB(db);
}

async function getUserBalance(userId: string): Promise<number> {
  return (await getCurrencyBalance(userId)).coins;
}

// ==================== PERIOD LOGIC ====================
function periodInfo(period: Period) {
  const l = new Date(Date.now() + OFFSET);
  let start = Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate());
  if (period === 'weekly') start -= ((l.getUTCDay() + 6) % 7) * DAY;
  const len = period === 'weekly' ? 7 * DAY : DAY;
  return { key: new Date(start).toISOString().slice(0, 10), resetAt: start + len - OFFSET };
}

function slot(u: UserData, period: Period): Slot {
  const { key } = periodInfo(period);
  u.quests ??= {};
  if (u.quests[period]?.key !== key) {
    u.quests[period] = { key, prog: {}, claimed: {}, earned: 0 };
  }
  return u.quests[period]!;
}

const capOf = (u: UserData) => (u.book ? QUEST_CAP_BOOK : QUEST_CAP);

const questText = (q: Quest) => q.text.replace('{ch}', q.channelId ? `<#${q.channelId}>` : 'bất kỳ kênh nào');

// ==================== TRACKING ====================
function track(userId: string, kind: 'message' | 'command', key: string, amount = 1): void {
  const u = getUser(userId);
  let changed = false;

  for (const q of QUESTS) {
    if (q.kind !== kind) continue;
    if (kind === 'command' && q.cmd !== key) continue;
    if (kind === 'message' && q.channelId && q.channelId !== key) continue;

    const s = slot(u, q.period);
    const cur = s.prog[q.id] ?? 0;
    if (s.claimed[q.id] || cur >= q.target) continue;

    s.prog[q.id] = Math.min(q.target, cur + amount);
    changed = true;
  }

  if (changed) saveUser(userId, u);
}

export function trackCommand(userId: string, commandName: string): void {
  track(userId, 'command', commandName);
}

const lastMsg = new Map<string, number>();

function onMessage(m: Message): void {
  if (m.author.bot || !m.guild) return;
  const now = Date.now();
  if (now - (lastMsg.get(m.author.id) ?? 0) < 5000) return;
  lastMsg.set(m.author.id, now);
  track(m.author.id, 'message', m.channelId);
}

// ==================== UI ====================
function buildQuest(client: Client, user: DiscordUser, period: Period) {
  const u = getUser(user.id);
  const s = slot(u, period);
  const daily = period === 'daily';
  const { resetAt } = periodInfo(period);

  const head = txt(
    [
      `# ${u.book ? '📗 Sổ Nhiệm Vụ Xịn' : '📒 Sổ Nhiệm Vụ'}`,
      `**${PERIODS[period]}** • làm mới <t:${Math.floor(resetAt / 1000)}:R>`,
      '',
      `🏆 Đã hoàn thành: **${fmt(u.done ?? 0)}** nhiệm vụ`,
      `${COIN} ${daily ? 'Xu hôm nay' : 'Xu tuần này'}: **${daily ? `${fmt(s.earned)}/${fmt(capOf(u))}` : fmt(s.earned)}**`,
    ].join('\n'),
  );

  const box = new ContainerBuilder();

  if (QUEST_THUMBNAIL) {
    box.addSectionComponents(
      new SectionBuilder().addTextDisplayComponents(head).setThumbnailAccessory(new ThumbnailBuilder().setURL(QUEST_THUMBNAIL)),
    );
  } else {
    box.addTextDisplayComponents(head);
  }

  box.addSeparatorComponents(sep());

  for (const q of QUESTS.filter(x => x.period === period)) {
    const p = Math.min(s.prog[q.id] ?? 0, q.target);
    const ok = p >= q.target;
    const status = s.claimed[q.id] ? `${emojis.success} Đã nhận` : ok ? `${emojis.gift} Chờ nhận` : `${p}/${q.target}`;

    box.addTextDisplayComponents(
    txt(`${emojis.document} **${questText(q)}**\n-# ${bar(p, q.target)} \`${status}\` • ${emojis.gift} ${fmt(q.reward)} ${COIN}`),
    );
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`quest:view:${user.id}:${period}`)
    .setPlaceholder(PERIODS[period])
    .addOptions(
      Object.entries(PERIODS).map(([value, label]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(label)
          .setValue(value)
          .setEmoji(getEmoji('ledger'))
          .setDefault(value === period),
      ),
    );

  const buttons = [
    new ButtonBuilder()
      .setCustomId(`quest:upgrade:${user.id}:${period}`)
      .setStyle(ButtonStyle.Success)
      .setLabel(u.book ? 'Sổ Xịn Đã Mở' : 'Nâng Cấp Sổ Xịn')
      .setEmoji(getEmoji('document'))
      .setDisabled(!!u.book),
    new ButtonBuilder()
      .setCustomId(`quest:claim:${user.id}:${period}`)
      .setStyle(ButtonStyle.Danger)
      .setLabel('Hoàn Thành')
      .setEmoji(getEmoji('success')),
    new ButtonBuilder()
      .setCustomId(`quest:guide:${user.id}:${period}`)
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Hướng Dẫn')
      .setEmoji(getEmoji('sparkles')),
  ];

  box
    .addSeparatorComponents(sep())
    .addActionRowComponents(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu) as any)
    .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons) as any);

  if (SERVER_LINK) {
    box.addTextDisplayComponents(txt(`-# Banhcuon-bot • ${SERVER_LINK}`));
  }

  return { components: [box], flags: V2 as any };
}

// ==================== HANDLERS ====================
async function onComponent(i: MessageComponentInteraction | StringSelectMenuInteraction): Promise<any> {
  const [, action, uid, period] = i.customId.split(':');

  if (i.user.id !== uid) {
    // Defer trước khi reply để tránh timeout
    try {
      await i.deferReply({ flags: V2_EPH as any });
    } catch (error: any) {
      if (error.code === 10062) return; // interaction đã hết hạn
      throw error;
    }
    return i.editReply(notice(ERR, 'Đây không phải sổ nhiệm vụ của bạn.', '-# Dùng `/quest` để mở sổ của riêng mình nhé.'));
  }

  const u = getUser(uid);

  if (action === 'view') {
    const p = (i as StringSelectMenuInteraction).values?.[0] as Period;
    if (!PERIODS[p]) return i.deferUpdate();
    return i.update(buildQuest(i.client, i.user, p));
  }

  if (!PERIODS[period as Period]) return i.deferUpdate();

  if (action === 'guide') {
    // Defer để tránh timeout
    try {
      await i.deferReply({ flags: V2_EPH as any });
    } catch (error: any) {
      if (error.code === 10062) return;
      throw error;
    }

    const box = new ContainerBuilder().addTextDisplayComponents(txt('# 💡 Hướng dẫn nhiệm vụ'))
      .addSeparatorComponents(sep())
      .addTextDisplayComponents(
        txt(
          [
            '1. Làm nhiệm vụ bằng cách dùng lệnh hoặc nhắn tin như mô tả, tiến độ tự cộng.',
            '2. Khi tiến độ đầy, bấm **Hoàn Thành** để nhận xu.',
            '3. Hằng ngày làm mới lúc 0h mỗi ngày, hằng tuần làm mới 0h thứ Hai.',
            `4. Xu từ nhiệm vụ hằng ngày tối đa **${fmt(QUEST_CAP)}** ${COIN}/ngày. **Nâng Cấp Sổ Xịn** (${fmt(BOOK_PRICE)} ${COIN}, mua một lần) nâng lên **${fmt(QUEST_CAP_BOOK)}** ${COIN}/ngày.`,
            '5. Mỗi người chỉ được tính 1 tin nhắn mỗi 5 giây.',
          ].join('\n'),
        ),
      );

    return i.editReply({ components: [box], flags: V2_EPH as any });
  }

  if (action === 'claim') {
    // Defer update sớm để tránh timeout
    try {
      await i.deferUpdate();
    } catch (error: any) {
      if (error.code === 10062) return;
      throw error;
    }

    const s = slot(u, period as Period);
    const ready = QUESTS.filter(q => q.period === period && (s.prog[q.id] ?? 0) >= q.target && !s.claimed[q.id]);

    if (!ready.length) {
      return i.followUp(notice(WARN, `⚠️ **Chưa có nhiệm vụ nào hoàn thành**`, '-# Làm thêm nhiệm vụ rồi quay lại nhận thưởng nhé.'));
    }

    let room = period === 'daily' ? Math.max(0, capOf(u) - s.earned) : Infinity;
    let gained = 0;
    let count = 0;
    let clipped = false;

    for (const q of ready.sort((a, b) => b.reward - a.reward)) {
      if (room <= 0) {
        clipped = true;
        break;
      }
      const g = Math.min(q.reward, room);
      if (g < q.reward) clipped = true;
      gained += g;
      room -= g;
      count++;
      s.claimed[q.id] = true;
      u.done = (u.done ?? 0) + 1;
    }

    if (!count) {
      return i.followUp(
        notice(WARN, `⚠️ **Đã chạm giới hạn xu hôm nay** (${fmt(capOf(u))} ${COIN})`, '-# Nâng cấp Sổ Xịn để tăng giới hạn.'),
      );
    }

    s.earned += gained;
    await addCoins(uid, gained);
    await addTransaction(uid, 'earn', gained, 'coins', `Quest rewards: ${count} completed`).catch((error) => {
      console.error('[Quest] Failed to record reward transaction:', error);
    });
    saveUser(uid, u);

    await i.editReply(buildQuest(i.client, i.user, period as Period));

    const lines = [
      `✅ **Nhận thưởng thành công!**`,
      `🏆 Hoàn thành **${count}** nhiệm vụ`,
      `${COIN} Nhận **+${fmt(gained)}**`,
    ];

    if (clipped) {
      lines.push(`-# ⚠️ Đã chạm giới hạn xu hôm nay, nhiệm vụ còn lại nhận vào ngày mai.`);
    }

    return i.followUp(notice(OK, ...lines));
  }

  if (action === 'upgrade') {
    // Defer update sớm
    try {
      await i.deferUpdate();
    } catch (error: any) {
      if (error.code === 10062) return;
      throw error;
    }

    if (u.book) return i.followUp(notice(OK, `✅ Bạn đã có Sổ Xịn rồi.`));

    const balance = await getUserBalance(uid);
    if (balance < BOOK_PRICE) {
      return i.followUp(notice(ERR, `❌ **Không đủ xu**`, `Cần **${fmt(BOOK_PRICE)}** ${COIN}, bạn đang có **${fmt(balance)}** ${COIN}.`));
    }

    if (!(await spendCoins(uid, BOOK_PRICE))) {
      return i.followUp(notice(ERR, `❌ **Không đủ xu**`));
    }
    await addTransaction(uid, 'spend', BOOK_PRICE, 'coins', 'Quest book upgrade').catch((error) => {
      console.error('[Quest] Failed to record book purchase transaction:', error);
    });

    u.book = 1;
    saveUser(uid, u);

    await i.editReply(buildQuest(i.client, i.user, period as Period));

    const newBalance = await getUserBalance(uid);
    return i.followUp(
      notice(OK, '📗 **Đã nâng cấp Sổ Xịn!**', `📊 Giới hạn xu hằng ngày: **${fmt(QUEST_CAP_BOOK)}** ${COIN}`, `${COIN} Số dư: **${fmt(newBalance)}**`),
    );
  }
}

// ==================== MODULE ====================
export default class QuestModule {
  name = 'quest-module';
  description = 'Hệ thống nhiệm vụ hàng ngày và hàng tuần';
  version = '3.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;
  private messageHandler?: (message: Message) => void;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    questModuleInstance = this;
  }

  async initialize() {
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Quest module initialized with ${this.commands.size} commands`);
  }

  private registerCommands() {
    this.commands.set('quest', {
      data: new SlashCommandBuilder().setName('quest').setDescription('Xem nhiệm vụ và tiến độ hoàn thành của bạn'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const startTime = Date.now();
        
        // ⚡ Defer immediately to prevent timeout
        try {
          await interaction.deferReply({ flags: V2 as any });
          const deferTime = Date.now() - startTime;
          if (deferTime > 1000) {
            console.warn(`⚠️ [Quest] Slow defer: ${deferTime}ms`);
          }
        } catch (error: any) {
          if (error.code === 10062) {
            console.warn(`⚠️ [Quest] Interaction expired before defer (${Date.now() - startTime}ms)`);
            return;
          }
          throw error;
        }
        
        const payload = buildQuest(interaction.client, interaction.user, 'daily');
        const buildTime = Date.now() - startTime;
        if (buildTime > 2000) {
          console.warn(`⚠️ [Quest] Slow build: ${buildTime}ms total`);
        }
        
        return interaction.editReply(payload);
      },
    });
  }

  private registerEvents() {
    this.messageHandler = onMessage;
    this.client.on('messageCreate', this.messageHandler);

    // Component interaction handler
    this.client.on('interactionCreate', async interaction => {
      if (!interaction.isMessageComponent() && !interaction.isStringSelectMenu()) return;
      if (!interaction.customId.startsWith('quest:')) return;
      try {
        await onComponent(interaction);
      } catch (err) {
        console.error('[Quest] Component error:', err);
      }
    });

    console.log('✅ Quest message tracking registered');
  }

  async cleanup() {
    if (this.messageHandler) {
      this.client.off('messageCreate', this.messageHandler);
    }
    lastMsg.clear();
    console.log('Quest module cleanup');
  }
}
