import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  Colors,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from 'discord.js';
import path from 'path';
import { emojis } from '../../config/emojis';
import { getTursoDatabase } from '../../database/turso';

// ==================== VIP TIERS ====================
interface VIPTier {
  tier: number;
  name: string;
  minTickets: number;
  maxTickets: number | null;
  icon: string;
  color: number;
  benefits: string[];
  weeklyBonus: number;
}

const VIP_TIERS: VIPTier[] = [
  {
    tier: 0,
    name: 'Thành Viên',
    minTickets: 0,
    maxTickets: 9,
    icon: '👤',
    color: Colors.Grey,
    weeklyBonus: 0,
    benefits: [
      'Truy cập các lệnh cơ bản',
      'Điểm danh hàng ngày (/daily)',
      'Tham gia quest',
      'Mua items trong shop',
    ],
  },
  {
    tier: 1,
    name: 'VIP Bronze',
    minTickets: 10,
    maxTickets: 24,
    icon: '🥉',
    color: 0xcd7f32,
    weeklyBonus: 0,
    benefits: [
      '+3% bonus xu khi điểm danh',
      'Role màu Bronze trong server',
      'Ưu tiên support',
      'Badge VIP 1 trong profile',
    ],
  },
  {
    tier: 2,
    name: 'VIP Silver',
    minTickets: 25,
    maxTickets: 49,
    icon: '🥈',
    color: 0xc0c0c0,
    weeklyBonus: 0,
    benefits: [
      '+5% bonus xu khi điểm danh',
      'Role màu Silver trong server',
      'Custom role (1 role)',
      'Ưu tiên support cao',
    ],
  },
  {
    tier: 3,
    name: 'VIP Gold',
    minTickets: 50,
    maxTickets: 99,
    icon: '🥇',
    color: 0xffd700,
    weeklyBonus: 5000,
    benefits: [
      '+7% bonus xu khi điểm danh',
      '**Weekly Bonus: 5,000 xu** (/vip-bonus)',
      'Role màu Gold trong server',
      'Custom role (2 roles)',
      'Chuyển xu cho người khác (/vip-transfer)',
    ],
  },
  {
    tier: 4,
    name: 'VIP Platinum',
    minTickets: 100,
    maxTickets: 199,
    icon: '💎',
    color: 0xe5e4e2,
    weeklyBonus: 7500,
    benefits: [
      '+10% bonus xu khi điểm danh',
      '**Weekly Bonus: 7,500 xu**',
      'Role màu Platinum với icon',
      'Custom role (3 roles)',
      'VIP Lottery access (vé số VIP)',
      'Priority queue trong games',
    ],
  },
  {
    tier: 5,
    name: 'VIP Diamond',
    minTickets: 200,
    maxTickets: 399,
    icon: '💠',
    color: 0xb9f2ff,
    weeklyBonus: 10000,
    benefits: [
      '+15% bonus xu khi điểm danh',
      '**Weekly Bonus: 10,000 xu**',
      'Role màu Diamond animated',
      'Custom role (5 roles)',
      'Nickname đặc biệt (màu/icon)',
      'Exclusive VIP quests',
    ],
  },
  {
    tier: 6,
    name: 'VIP Master',
    minTickets: 400,
    maxTickets: 699,
    icon: '🌟',
    color: 0xff1493,
    weeklyBonus: 15000,
    benefits: [
      '+20% bonus xu khi điểm danh',
      '**Weekly Bonus: 15,000 xu**',
      'Role Master với badge đặc biệt',
      'Custom role unlimited',
      'Custom bot status (1 lần/ngày)',
      'VIP-only channels access',
    ],
  },
  {
    tier: 7,
    name: 'VIP Grandmaster',
    minTickets: 700,
    maxTickets: 999,
    icon: '👑',
    color: 0x9d00ff,
    weeklyBonus: 20000,
    benefits: [
      '+25% bonus xu khi điểm danh',
      '**Weekly Bonus: 20,000 xu**',
      'Role Grandmaster với animation',
      'Tạo quest cho người khác',
      'Server booster perks',
      'Early access features',
    ],
  },
  {
    tier: 8,
    name: 'VIP Legendary',
    minTickets: 1000,
    maxTickets: 1999,
    icon: '🔥',
    color: 0xff4500,
    weeklyBonus: 30000,
    benefits: [
      '+30% bonus xu khi điểm danh',
      '**Weekly Bonus: 30,000 xu**',
      'Role Legendary với glow effect',
      'Tất cả benefits VIP trước',
      'Tên hiện trong splash screen bot',
      'Vote quyết định features mới',
    ],
  },
  {
    tier: 9,
    name: 'VIP Mythic',
    minTickets: 2000,
    maxTickets: 4999,
    icon: '⚡',
    color: 0x00ffff,
    weeklyBonus: 50000,
    benefits: [
      '+40% bonus xu khi điểm danh',
      '**Weekly Bonus: 50,000 xu**',
      'Role Mythic với rainbow effect',
      'Custom bot commands (3 commands)',
      'Exclusive Mythic avatar frame',
      'Moderator permissions trong VIP zone',
    ],
  },
  {
    tier: 10,
    name: 'VIP Ultimate 🌈',
    minTickets: 5000,
    maxTickets: null,
    icon: '🌈',
    color: 0xffffff,
    weeklyBonus: 100000,
    benefits: [
      '+50% bonus xu khi điểm danh',
      '**Weekly Bonus: 100,000 xu**',
      'Role Ultimate với rainbow animated',
      '**TẤT CẢ benefits VIP**',
      'Tên vĩnh viễn trong Hall of Fame',
      'Co-owner permissions trong VIP zone',
      'Đặt tên cho shop items',
      'Profile banner custom',
    ],
  },
];

// ==================== DATABASE ====================
interface UserData {
  user_id: string;
  gold_balance: number;
  balance: number;
}

async function getWealth(userId: string): Promise<{ gold: number; coins: number }> {
  const db = getTursoDatabase();
  const result = await db.execute({
    sql: 'SELECT gold_balance, balance FROM daily_users WHERE user_id = ?',
    args: [userId]
  });
  
  if (result.rows.length === 0) {
    return { gold: 0, coins: 0 };
  }
  
  const row = result.rows[0];
  return {
    gold: Number(row[0]) || 0,  // gold_balance is first column
    coins: Number(row[1]) || 0  // balance is second column
  };
}

// ==================== TIER HELPERS ====================
function getVIPTier(goldTickets: number): VIPTier {
  for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
    if (goldTickets >= VIP_TIERS[i].minTickets) return VIP_TIERS[i];
  }
  return VIP_TIERS[0];
}

function getNextVIPTier(currentTier: number): VIPTier | null {
  return VIP_TIERS[currentTier + 1] ?? null;
}

const formatNumber = (num: number) => num.toLocaleString('en-US');

const formatRange = (t: VIPTier) =>
  t.maxTickets === null
    ? `${formatNumber(t.minTickets)}+ vé`
    : `${formatNumber(t.minTickets)}-${formatNumber(t.maxTickets)} vé`;

const formatBenefits = (list: string[]) => list.map((b) => `✅ ${b}`).join('\n');

function createProgressBar(ratio: number, length = 15): string {
  const filled = Math.round(Math.min(Math.max(ratio, 0), 1) * length);
  return '▰'.repeat(filled) + '▱'.repeat(length - filled);
}

// ==================== COMPONENTS V2 HELPERS ====================
type Block = TextDisplayBuilder | SectionBuilder | SeparatorBuilder;

const text = (content: string) => new TextDisplayBuilder().setContent(content);

const divider = () =>
  new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true);

/** Header có ảnh nhỏ bên phải, không cần Container. */
function header(content: string, thumbnailURL?: string): Block {
  if (!thumbnailURL) return text(content);

  return new SectionBuilder()
    .addTextDisplayComponents(text(content))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailURL));
}

/** Gói các block vào Container có thanh màu bên trái (giống embed). */
function box(color: number, blocks: Block[]): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(color);
  for (const block of blocks) {
    if (block instanceof SectionBuilder) container.addSectionComponents(block);
    else if (block instanceof SeparatorBuilder) container.addSeparatorComponents(block);
    else container.addTextDisplayComponents(block);
  }
  return container;
}

async function sendV2(interaction: ChatInputCommandInteraction, container: ContainerBuilder) {
  const payload = {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  };

  return interaction.replied || interaction.deferred
    ? interaction.followUp(payload)
    : interaction.reply(payload);
}

function fail(interaction: ChatInputCommandInteraction, label: string, error: unknown) {
  console.error(`[VIPModule] Error in ${label}:`, error);
  return sendV2(
    interaction,
    box(Colors.Red, [text(`${emojis.error || '❌'} Có lỗi khi ${label}. Vui lòng thử lại sau!`)]),
  ).catch(() => {});
}

// ==================== VIEWS ====================
async function buildVipInfo(interaction: ChatInputCommandInteraction): Promise<ContainerBuilder> {
  const { gold, coins } = await getWealth(interaction.user.id);
  const current = getVIPTier(gold);
  const next = getNextVIPTier(current.tier);

  const blocks: Block[] = [
    header(
      [
        `## ${current.icon} ${current.name}`,
        `-# VIP Info • ${interaction.user.username}`,
        `Hạng VIP tính theo số **Vé Vàng** bạn sở hữu. Mua vé tại \`/shop\`!`,
      ].join('\n'),
      interaction.user.displayAvatarURL({ size: 256 }),
    ),
    divider(),
    text(
      [
        '### 💰 Tài sản hiện tại',
        `${emojis.coin || '🪙'} **Xu:** ${formatNumber(coins)}`,
        `${emojis.ticket || '🎫'} **Vé Vàng:** ${formatNumber(gold)}`,
      ].join('\n'),
    ),
    divider(),
  ];

  const perks = [`### ${current.icon} Quyền lợi ${current.name}`, formatBenefits(current.benefits)];

  if (current.weeklyBonus > 0) {
    perks.push(
      '',
      `🎁 Nhận **${formatNumber(current.weeklyBonus)} xu** mỗi tuần với \`/vip-bonus\``,
    );
  }

  blocks.push(text(perks.join('\n')), divider());

  if (next) {
    const span = next.minTickets - current.minTickets;
    const ratio = (gold - current.minTickets) / span;
    const preview = next.benefits.slice(0, 3).map((b) => `• ${b}`);
    const more = next.benefits.length - preview.length;

    blocks.push(
      text(
        [
          `### 📈 Tiến độ đến ${next.icon} ${next.name}`,
          `${createProgressBar(ratio)} **${(Math.min(Math.max(ratio, 0), 1) * 100).toFixed(1)}%**`,
          `Cần thêm **${formatNumber(next.minTickets - gold)} vé vàng** để lên hạng!`,
          '',
          `**${next.name}** (${formatNumber(next.minTickets)}+ vé):`,
          ...preview,
          more > 0 ? `• ...và ${more} quyền lợi khác` : '',
        ]
          .filter((line, i, arr) => line !== '' || arr[i - 1] !== '')
          .join('\n'),
      ),
    );
  } else {
    blocks.push(text('### 🌟 Chúc mừng!\nBạn đã đạt **hạng VIP cao nhất**! 🎉'));
  }

  blocks.push(divider(), text('-# Dùng /vip-tiers để xem tất cả hạng VIP • /shop để mua vé vàng'));

  return box(current.color, blocks);
}

async function buildVipTiers(client: Client, userId: string): Promise<ContainerBuilder> {
  const mine = getVIPTier((await getWealth(userId)).gold).tier;

  const lines = VIP_TIERS.map((t) => {
    const bonus = t.weeklyBonus > 0 ? ` • 🎁 ${formatNumber(t.weeklyBonus)} xu/tuần` : '';
    const you = t.tier === mine ? '  ◀ **Bạn**' : '';
    return `${t.icon} **${t.name}** — ${formatRange(t)}${bonus}${you}`;
  });

  return box(Colors.Gold, [
    header(
      [
        '## 👑 Hệ Thống VIP Tiers',
        `-# Hạng VIP dựa trên số Vé Vàng ${emojis.ticket || '🎫'} bạn sở hữu`,
      ].join('\n'),
      client.user?.displayAvatarURL({ size: 256 }),
    ),
    divider(),
    text(lines.join('\n')),
    divider(),
    text('-# Dùng /vipinfo để xem chi tiết quyền lợi hạng của bạn • /shop để mua vé vàng'),
  ]);
}

async function buildVipBonus(interaction: ChatInputCommandInteraction): Promise<ContainerBuilder> {
  const current = getVIPTier((await getWealth(interaction.user.id)).gold);

  if (current.weeklyBonus === 0) {
    const required = VIP_TIERS.find((t) => t.weeklyBonus > 0);
    return box(Colors.Red, [
      text(
        [
          `${emojis.error || '❌'} Bạn cần **${required?.icon} ${required?.name}** (${formatNumber(required?.minTickets ?? 50)}+ vé vàng) để nhận weekly bonus!`,
          '',
          '-# Dùng /shop để mua vé vàng • /vip-tiers để xem các hạng VIP',
        ].join('\n'),
      ),
    ]);
  }

  // TODO: kiểm tra cooldown tuần và cộng xu thật sự
  return box(current.color, [
    text(
      [
        `## ${current.icon} ${current.name}`,
        `🎁 Weekly bonus của bạn: **${formatNumber(current.weeklyBonus)} xu**`,
      ].join('\n'),
    ),
    divider(),
    text(
      `${emojis.success || '✅'} Chức năng claim đang phát triển, sẽ có trong bản cập nhật tiếp theo.`,
    ),
  ]);     
}

// ==================== MODULE ====================
export default class VIPModule {
  name = 'vip-module';
  description = 'Hệ thống VIP tiers và quyền lợi';
  commands: Collection<string, any>;

  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    this.registerCommands();
  }

  private registerCommands() {
    const vipInfoCommand = {
      data: new SlashCommandBuilder()
        .setName('vipinfo')
        .setDescription('Xem hạng VIP và quyền lợi của bạn'),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await sendV2(interaction, await buildVipInfo(interaction));
        } catch (error) {
          await fail(interaction, 'xem VIP info', error);
        }
      },
    };

    const vipTiersCommand = {
      data: new SlashCommandBuilder()
        .setName('vip-tiers')
        .setDescription('Xem tất cả hạng VIP và quyền lợi từng tier'),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await sendV2(interaction, await buildVipTiers(this.client, interaction.user.id));
        } catch (error) {
          await fail(interaction, 'xem VIP tiers', error);
        }
      },
    };

    const vipBonusCommand = {
      data: new SlashCommandBuilder()
        .setName('vip-bonus')
        .setDescription('Nhận weekly bonus xu (VIP Gold trở lên)'),

      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await sendV2(interaction, await buildVipBonus(interaction));
        } catch (error) {
          await fail(interaction, 'nhận VIP bonus', error);
        }
      },
    };

    this.commands.set('vipinfo', vipInfoCommand);
    this.commands.set('vip-tiers', vipTiersCommand);
    this.commands.set('vip-bonus', vipBonusCommand);
  }
}
