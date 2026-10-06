import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ComponentType,
  MessageFlags
} from 'discord.js';
import { emojis } from '../../config/emojis';
import { picture, combineFiles } from '../../utils/pictureHelper';
import Database from 'better-sqlite3';
import path from 'path';

// ==================== CONFIGURATION ====================
const GOLD_CONFIG = {
  emoji: '💛',
  name: 'Vé Vàng',
  rate: 25, // 1 gold = 25 blue
  packs: [4, 20, 40, 100, 200, 500]
};

const BLUE_TO_GOLD_CONFIG = {
  rate: 1000, // 1000 blue = 1 gold
  packs: [1000, 5000, 10000, 25000, 50000, 100000] // Blue amounts to exchange
};

const COIN_CONFIG = {
  emoji: emojis.coin, // Animated coin emoji
  name: 'cowoncy'
};

// ==================== DATABASE ====================
const db = new Database(path.join(process.cwd(), 'data', 'economy.db'));

const stmtGetUser = db.prepare('SELECT * FROM daily_users WHERE user_id = ?');
const stmtUpdateBalance = db.prepare(`
  UPDATE daily_users 
  SET balance = balance + ?, gold_balance = gold_balance + ?
  WHERE user_id = ?
`);
const stmtEnsureUser = db.prepare(`
  INSERT OR IGNORE INTO daily_users (user_id, balance, gold_balance, streak, max_streak, total_checkins)
  VALUES (?, 0, 0, 0, 0, 0)
`);

interface UserData {
  user_id: string;
  balance: number;
  gold_balance: number;
  streak: number;
  max_streak: number;
  total_checkins: number;
  last_daily: string | null;
}

// ==================== HELPER FUNCTIONS ====================
const fmt = (n: number) => n.toLocaleString('vi-VN');

function getUser(userId: string): UserData {
  stmtEnsureUser.run(userId);
  return stmtGetUser.get(userId) as UserData;
}

function updateCurrency(userId: string, blueChange: number, goldChange: number) {
  stmtUpdateBalance.run(blueChange, goldChange, userId);
}

// ==================== BUILD EXCHANGE EMBEDS ====================

// Gold → Blue exchange embed
function buildGoldToBlueEmbed(client: Client, userId: string): {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<any>[];
  files?: any[];
} {
  const user = getUser(userId);
  const gold = user.gold_balance;
  const blue = user.balance;

  // Split packs into 2 columns
  const half = Math.ceil(GOLD_CONFIG.packs.length / 2);
  const col1 = GOLD_CONFIG.packs.slice(0, half);
  const col2 = GOLD_CONFIG.packs.slice(half);

  const formatColumn = (packs: number[]) =>
    packs.map(n => `> \`${fmt(n)}\` ${GOLD_CONFIG.emoji} = \`${fmt(n * GOLD_CONFIG.rate)}\` ${COIN_CONFIG.emoji}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle(`💛➡️${emojis.coin} Đổi Vé Vàng sang Xu`)
    .setDescription(`- Tỷ lệ quy đổi: \`1\` ${GOLD_CONFIG.emoji} = \`${GOLD_CONFIG.rate}\` ${COIN_CONFIG.emoji}\n\n- **Các gói đổi**`)
    .addFields(
      { name: '​', value: formatColumn(col1), inline: true },
      { name: '​', value: formatColumn(col2), inline: true },
      {
        name: '​',
        value: `Bạn đang có:\n💛 **Vé Vàng:** \`${fmt(gold)}\`\n${emojis.coin} **Xu:** \`${fmt(blue)}\`\n\n💡 Muốn đổi ngược lại? Nhấn nút **Đổi Xu → Vàng** bên dưới!`,
        inline: false
      }
    )
    .setFooter({
      text: `Banhcuon-bot • Đổi Vàng sang Xu`,
      iconURL: client.user?.displayAvatarURL()
    });

  // Add thumbnail if available
  const thumbnail = picture(process.env.EXCHANGE_THUMBNAIL, 'exchange-icon.png');
  if (thumbnail) {
    embed.setThumbnail(thumbnail.url);
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`exchange:gold-to-blue:${userId}`)
    .setPlaceholder('Chọn gói đổi...')
    .addOptions(
      GOLD_CONFIG.packs.map(n => ({
        label: `${fmt(n)} Vé Vàng → ${fmt(n * GOLD_CONFIG.rate)} xu`,
        value: String(n),
        emoji: '💛',
        description: gold >= n ? 'Đủ vé để đổi' : `Thiếu ${fmt(n - gold)} vé vàng`
      }))
    );

  // Add switch button
  const switchButton = new ButtonBuilder()
    .setCustomId(`exchange:switch-to-blue-to-gold:${userId}`)
    .setLabel('Đổi Xu → Vàng')
    .setEmoji({ id: '1555111941729681478', name: 'coin', animated: true })
    .setStyle(ButtonStyle.Primary);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(switchButton);

  const result: any = {
    embeds: [embed],
    components: [row1, row2]
  };

  // Add files if thumbnail exists
  if (thumbnail && thumbnail.files.length > 0) {
    result.files = thumbnail.files;
  }

  return result;
}

// Blue → Gold exchange embed
function buildBlueToGoldEmbed(client: Client, userId: string): {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<any>[];
  files?: any[];
} {
  const user = getUser(userId);
  const gold = user.gold_balance;
  const blue = user.balance;

  // Split packs into 2 columns
  const half = Math.ceil(BLUE_TO_GOLD_CONFIG.packs.length / 2);
  const col1 = BLUE_TO_GOLD_CONFIG.packs.slice(0, half);
  const col2 = BLUE_TO_GOLD_CONFIG.packs.slice(half);

  const formatColumn = (packs: number[]) =>
    packs.map(n => {
      const goldAmount = n / BLUE_TO_GOLD_CONFIG.rate;
      return `> \`${fmt(n)}\` ${COIN_CONFIG.emoji} = \`${fmt(goldAmount)}\` ${GOLD_CONFIG.emoji}`;
    }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x4f9dff)
    .setTitle(`${emojis.coin}➡️💛 Đổi Xu sang Vé Vàng`)
    .setDescription(`- Tỷ lệ quy đổi: \`${fmt(BLUE_TO_GOLD_CONFIG.rate)}\` ${COIN_CONFIG.emoji} = \`1\` ${GOLD_CONFIG.emoji}\n\n- **Các gói đổi**`)
    .addFields(
      { name: '​', value: formatColumn(col1), inline: true },
      { name: '​', value: formatColumn(col2), inline: true },
      {
        name: '​',
        value: `Bạn đang có:\n${emojis.coin} **Xu:** \`${fmt(blue)}\`\n💛 **Vé Vàng:** \`${fmt(gold)}\`\n\n💡 Muốn đổi ngược lại? Nhấn nút **Đổi Vàng → Xu** bên dưới!`,
        inline: false
      }
    )
    .setFooter({
      text: `Banhcuon-bot • Đổi Xu sang Vàng`,
      iconURL: client.user?.displayAvatarURL()
    });

  // Add thumbnail if available
  const thumbnail = picture(process.env.EXCHANGE_THUMBNAIL, 'exchange-icon.png');
  if (thumbnail) {
    embed.setThumbnail(thumbnail.url);
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`exchange:blue-to-gold:${userId}`)
    .setPlaceholder('Chọn gói đổi...')
    .addOptions(
      BLUE_TO_GOLD_CONFIG.packs.map(n => {
        const goldAmount = n / BLUE_TO_GOLD_CONFIG.rate;
        return {
          label: `${fmt(n)} xu → ${fmt(goldAmount)} Vé Vàng`,
          value: String(n),
          emoji: { id: '1555111941729681478', name: 'coin', animated: true },
          description: blue >= n ? 'Đủ xu để đổi' : `Thiếu ${fmt(n - blue)} xu`
        };
      })
    );

  // Add switch button
  const switchButton = new ButtonBuilder()
    .setCustomId(`exchange:switch-to-gold-to-blue:${userId}`)
    .setLabel('Đổi Vàng → Xu')
    .setEmoji('💛')
    .setStyle(ButtonStyle.Success);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(switchButton);

  const result: any = {
    embeds: [embed],
    components: [row1, row2]
  };

  // Add files if thumbnail exists
  if (thumbnail && thumbnail.files.length > 0) {
    result.files = thumbnail.files;
  }

  return result;
}

// ==================== SLASH COMMAND ====================
const convertCommand = {
  data: new SlashCommandBuilder()
    .setName('convert')
    .setDescription('💱 Đổi tiền: Vé Vàng ⇄ Xu'),

  async execute(interaction: ChatInputCommandInteraction) {
    // Default to Gold → Blue
    const payload = buildGoldToBlueEmbed(interaction.client, interaction.user.id);
    await interaction.reply(payload);
  }
};

// ==================== INTERACTION HANDLERS ====================

// Handle button interactions (switch between modes)
async function handleButton(interaction: ButtonInteraction) {
  if (!interaction.customId.startsWith('exchange:switch-to-')) return;

  const parts = interaction.customId.split(':');
  const mode = parts[1]; // "switch-to-gold-to-blue" or "switch-to-blue-to-gold"
  const userId = parts[2];

  // Verify user owns this menu
  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: `❌ Đây không phải bảng đổi của bạn. Dùng \`/convert\` để mở bảng riêng nhé.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Switch mode
  if (mode === 'switch-to-gold-to-blue') {
    const payload = buildGoldToBlueEmbed(interaction.client, userId);
    await interaction.update(payload);
  } else if (mode === 'switch-to-blue-to-gold') {
    const payload = buildBlueToGoldEmbed(interaction.client, userId);
    await interaction.update(payload);
  }
}

// Handle select menu interactions
async function handleSelectMenu(interaction: StringSelectMenuInteraction) {
  if (!interaction.customId.startsWith('exchange:')) return;

  const parts = interaction.customId.split(':');
  const mode = parts[1]; // "gold-to-blue" or "blue-to-gold"
  const userId = parts[2];

  // Verify user owns this menu
  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: `❌ Đây không phải bảng đổi của bạn. Dùng \`/convert\` để mở bảng riêng nhé.`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const selectedAmount = Number(interaction.values[0]);
  const user = getUser(userId);

  if (mode === 'gold-to-blue') {
    // Gold → Blue exchange
    if (!GOLD_CONFIG.packs.includes(selectedAmount)) {
      await interaction.deferUpdate();
      return;
    }

    const gold = user.gold_balance;

    // Check if user has enough gold
    if (gold < selectedAmount) {
      await interaction.update(buildGoldToBlueEmbed(interaction.client, userId));
      await interaction.followUp({
        content: `❌ Gói này cần **${fmt(selectedAmount)}** 💛 nhưng bạn chỉ có **${fmt(gold)}** 💛.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Perform exchange: deduct gold, add blue
    const blueAmount = selectedAmount * GOLD_CONFIG.rate;
    updateCurrency(userId, blueAmount, -selectedAmount);

    // Update embed
    await interaction.update(buildGoldToBlueEmbed(interaction.client, userId));

    // Confirm transaction
    const newUser = getUser(userId);
    await interaction.followUp({
      content: `✅ Đã đổi **${fmt(selectedAmount)}** 💛 thành **${fmt(blueAmount)}** ${emojis.coin}. Còn **${fmt(newUser.gold_balance)}** 💛, **${fmt(newUser.balance)}** ${emojis.coin}.`,
      flags: MessageFlags.Ephemeral
    });

  } else if (mode === 'blue-to-gold') {
    // Blue → Gold exchange
    if (!BLUE_TO_GOLD_CONFIG.packs.includes(selectedAmount)) {
      await interaction.deferUpdate();
      return;
    }

    const blue = user.balance;

    // Check if user has enough blue
    if (blue < selectedAmount) {
      await interaction.update(buildBlueToGoldEmbed(interaction.client, userId));
      await interaction.followUp({
        content: `❌ Gói này cần **${fmt(selectedAmount)}** ${emojis.coin} xu nhưng bạn chỉ có **${fmt(blue)}** ${emojis.coin} xu.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Perform exchange: deduct blue, add gold
    const goldAmount = selectedAmount / BLUE_TO_GOLD_CONFIG.rate;
    updateCurrency(userId, -selectedAmount, goldAmount);

    // Update embed
    await interaction.update(buildBlueToGoldEmbed(interaction.client, userId));

    // Confirm transaction
    const newUser = getUser(userId);
    await interaction.followUp({
      content: `✅ Đã đổi **${fmt(selectedAmount)}** ${emojis.coin} xu thành **${fmt(goldAmount)}** 💛. Còn **${fmt(newUser.balance)}** ${emojis.coin} xu, **${fmt(newUser.gold_balance)}** 💛.`,
      flags: MessageFlags.Ephemeral
    });
  }
}

// ==================== MODULE CLASS ====================
export class ConvertModule {
  public commands: Collection<string, any>;
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    this.commands.set(convertCommand.data.name, convertCommand);
    
    // Register interaction handlers
    this.registerInteractionHandlers();
    
    console.log('💱 Convert module initialized');
  }

  private registerInteractionHandlers() {
    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
      } else if (interaction.isButton()) {
        await handleButton(interaction);
      }
    });
  }
}

export default function (client: Client) {
  return new ConvertModule(client);
}
