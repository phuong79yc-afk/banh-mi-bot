import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  PermissionFlagsBits,
  User
} from 'discord.js';
import fs from 'fs';
import path from 'path';

// Currency types
export type CurrencyType = 'cowoncy' | 'blueTicket' | 'goldTicket';

// Currency balance interface
export interface CurrencyBalance {
  cowoncy: number;
  blueTicket: number;
  goldTicket: number;
}

// Currency data structure
type CurrencyData = Record<string, CurrencyBalance>;

// Data paths
const coinsPath = path.join(process.cwd(), 'data', 'coins.json');
const currenciesPath = path.join(process.cwd(), 'data', 'currencies.json');
const coinsBackupPath = path.join(process.cwd(), 'data', 'coins.json.bak');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Migration function: coins.json → currencies.json
function migrateCoinsToCurrencies(): void {
  console.log('[Migration] Starting coins → currencies migration...');
  
  // Check if migration is needed
  if (fs.existsSync(currenciesPath)) {
    console.log('[Migration] currencies.json already exists, skipping migration.');
    return;
  }
  
  if (!fs.existsSync(coinsPath)) {
    console.log('[Migration] No coins.json found, creating empty currencies.json.');
    fs.writeFileSync(currenciesPath, JSON.stringify({}));
    return;
  }
  
  try {
    // Read old coins data
    const coinsData = fs.readFileSync(coinsPath, 'utf8');
    const coins: Record<string, number> = JSON.parse(coinsData);
    
    // Convert to new currency format (1:1 ratio)
    const currencies: CurrencyData = {};
    for (const [userId, coinAmount] of Object.entries(coins)) {
      currencies[userId] = {
        cowoncy: coinAmount,
        blueTicket: 0,
        goldTicket: 0
      };
    }
    
    // Write new currencies.json
    fs.writeFileSync(currenciesPath, JSON.stringify(currencies, null, 2));
    
    // Backup old coins.json
    fs.copyFileSync(coinsPath, coinsBackupPath);
    
    console.log(`[Migration] ✅ Migrated ${Object.keys(coins).length} users from coins.json to currencies.json`);
    console.log(`[Migration] ✅ Backed up coins.json to coins.json.bak`);
  } catch (error) {
    console.error('[Migration] ❌ Failed to migrate:', error);
    throw error;
  }
}

// Load currencies data
function loadCurrencies(): CurrencyData {
  try {
    const data = fs.readFileSync(currenciesPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save currencies data
function saveCurrencies(data: CurrencyData): void {
  fs.writeFileSync(currenciesPath, JSON.stringify(data, null, 2));
}

// Get user balance for a specific currency
function getUserBalance(userId: string, currency: CurrencyType = 'cowoncy'): number {
  const data = loadCurrencies();
  if (!data[userId]) {
    return 0;
  }
  return data[userId][currency] || 0;
}

// Get full balance for a user
function getFullBalance(userId: string): CurrencyBalance {
  const data = loadCurrencies();
  return data[userId] || { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
}

// Set currency for user
function setCurrency(userId: string, amount: number, currency: CurrencyType = 'cowoncy'): number {
  const data = loadCurrencies();
  if (!data[userId]) {
    data[userId] = { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
  }
  data[userId][currency] = Math.max(0, amount);
  saveCurrencies(data);
  return data[userId][currency];
}

// Add currency
function addCurrency(userId: string, amount: number, currency: CurrencyType = 'cowoncy'): number {
  const data = loadCurrencies();
  if (!data[userId]) {
    data[userId] = { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
  }
  data[userId][currency] = (data[userId][currency] || 0) + amount;
  saveCurrencies(data);
  return data[userId][currency];
}

// Remove currency
function removeCurrency(userId: string, amount: number, currency: CurrencyType = 'cowoncy'): number {
  const data = loadCurrencies();
  if (!data[userId]) {
    data[userId] = { cowoncy: 0, blueTicket: 0, goldTicket: 0 };
  }
  const current = data[userId][currency] || 0;
  data[userId][currency] = Math.max(0, current - amount);
  saveCurrencies(data);
  return data[userId][currency];
}

// Backward compatibility functions (using cowoncy as default)
function getCoins(userId: string): number {
  return getUserBalance(userId, 'cowoncy');
}

function setCoins(userId: string, amount: number): number {
  return setCurrency(userId, amount, 'cowoncy');
}

function addCoins(userId: string, amount: number): number {
  return addCurrency(userId, amount, 'cowoncy');
}

function removeCoins(userId: string, amount: number): number {
  return removeCurrency(userId, amount, 'cowoncy');
}

export class CoinsModule {
  public commands: Collection<string, any>;
  private client: Client;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    
    // Run migration if needed
    migrateCoinsToCurrencies();
    
    this.registerCommands();
    console.log(`✅ Coins module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // Coins command with subcommands
    const coinsCommand = {
      data: new SlashCommandBuilder()
        .setName('coins')
        .setDescription('💰 Quản lý coins của users')
        .addSubcommand(subcommand =>
          subcommand
            .setName('check')
            .setDescription('💰 Kiểm tra số coins')
            .addUserOption(option =>
              option
                .setName('user')
                .setDescription('User cần check (để trống = bản thân)')
                .setRequired(false)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('add')
            .setDescription('➕ Cộng coins cho user (Admin only)')
            .addUserOption(option =>
              option
                .setName('user')
                .setDescription('User nhận coins')
                .setRequired(true)
            )
            .addIntegerOption(option =>
              option
                .setName('amount')
                .setDescription('Số coins cộng')
                .setRequired(true)
                .setMinValue(1)
            )
            .addStringOption(option =>
              option
                .setName('currency')
                .setDescription('Loại tiền (mặc định: cowoncy)')
                .setRequired(false)
                .addChoices(
                  { name: '💎 Cowoncy', value: 'cowoncy' },
                  { name: '🎫 Vé Xanh', value: 'blueTicket' },
                  { name: '🏆 Vé Vàng', value: 'goldTicket' }
                )
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('remove')
            .setDescription('➖ Trừ coins của user (Admin only)')
            .addUserOption(option =>
              option
                .setName('user')
                .setDescription('User bị trừ coins')
                .setRequired(true)
            )
            .addIntegerOption(option =>
              option
                .setName('amount')
                .setDescription('Số coins trừ')
                .setRequired(true)
                .setMinValue(1)
            )
            .addStringOption(option =>
              option
                .setName('currency')
                .setDescription('Loại tiền (mặc định: cowoncy)')
                .setRequired(false)
                .addChoices(
                  { name: '💎 Cowoncy', value: 'cowoncy' },
                  { name: '🎫 Vé Xanh', value: 'blueTicket' },
                  { name: '🏆 Vé Vàng', value: 'goldTicket' }
                )
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('set')
            .setDescription('🔧 Set coins cho user (Admin only)')
            .addUserOption(option =>
              option
                .setName('user')
                .setDescription('User được set coins')
                .setRequired(true)
            )
            .addIntegerOption(option =>
              option
                .setName('amount')
                .setDescription('Số coins mới')
                .setRequired(true)
                .setMinValue(0)
            )
            .addStringOption(option =>
              option
                .setName('currency')
                .setDescription('Loại tiền (mặc định: cowoncy)')
                .setRequired(false)
                .addChoices(
                  { name: '💎 Cowoncy', value: 'cowoncy' },
                  { name: '🎫 Vé Xanh', value: 'blueTicket' },
                  { name: '🏆 Vé Vàng', value: 'goldTicket' }
                )
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('leaderboard')
            .setDescription('🏆 Top 10 users có nhiều coins nhất')
            .addStringOption(option =>
              option
                .setName('currency')
                .setDescription('Loại tiền (mặc định: cowoncy)')
                .setRequired(false)
                .addChoices(
                  { name: '💎 Cowoncy', value: 'cowoncy' },
                  { name: '🎫 Vé Xanh', value: 'blueTicket' },
                  { name: '🏆 Vé Vàng', value: 'goldTicket' }
                )
            )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
      
      async execute(interaction: ChatInputCommandInteraction) {
        // DEFER IMMEDIATELY to avoid interaction timeout
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062 || error.code === 40060) {
            console.log('⚠️ Interaction expired for command: coins');
            return;
          }
          throw error;
        }
        
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'check') {
          await handleCheck(interaction);
        } else if (subcommand === 'add') {
          await handleAdd(interaction);
        } else if (subcommand === 'remove') {
          await handleRemove(interaction);
        } else if (subcommand === 'set') {
          await handleSet(interaction);
        } else if (subcommand === 'leaderboard') {
          await handleLeaderboard(interaction);
        }
      }
    };

    this.commands.set('coins', coinsCommand);
  }
}

// Handle check subcommand
async function handleCheck(interaction: ChatInputCommandInteraction) {
  // Already deferred in execute()
  const targetUser = interaction.options.getUser('user') || interaction.user;
  const coins = getCoins(targetUser.id);

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('<a:money_with_wings:1555919069172080650> Coin Balance')
    .setDescription(
      `**${targetUser.username}** có **${coins.toLocaleString()}** <a:money_with_wings:1555919069172080650> coins`
    )
    .setThumbnail(targetUser.displayAvatarURL())
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

// Handle add subcommand
async function handleAdd(interaction: ChatInputCommandInteraction) {
  // Already deferred in execute()
  
  // Check admin permission
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.editReply({
      content: '❌ Bạn cần quyền Administrator để dùng lệnh này!'
    });
  }

  const targetUser = interaction.options.getUser('user', true);
  const amount = interaction.options.getInteger('amount', true);

  const oldBalance = getCoins(targetUser.id);
  const newBalance = addCoins(targetUser.id, amount);

  const embed = new EmbedBuilder()
    .setColor('#43B581')
    .setTitle('<a:white_check_mark:1555921911395909722> Đã Cộng Coins')
    .setDescription(
      `**Admin:** ${interaction.user}\n` +
      `**User:** ${targetUser}\n` +
      `**Cộng:** +${amount.toLocaleString()} <a:money_with_wings:1555919069172080650>\n\n` +
      `**Balance cũ:** ${oldBalance.toLocaleString()} <a:money_with_wings:1555919069172080650>\n` +
      `**Balance mới:** ${newBalance.toLocaleString()} <a:money_with_wings:1555919069172080650>`
    )
    .setThumbnail(targetUser.displayAvatarURL())
    .setFooter({ text: `💎 Powered by ${interaction.guild?.name || 'Bot'}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
  
  console.log(`[Coins] ${interaction.user.tag} added ${amount} coins to ${targetUser.tag}`);
}

// Handle remove subcommand
async function handleRemove(interaction: ChatInputCommandInteraction) {
  // Already deferred in execute()
  
  // Check admin permission
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.editReply({
      content: '❌ Bạn cần quyền Administrator để dùng lệnh này!'
    });
  }

  const targetUser = interaction.options.getUser('user', true);
  const amount = interaction.options.getInteger('amount', true);

  const oldBalance = getCoins(targetUser.id);
  const newBalance = removeCoins(targetUser.id, amount);

  const embed = new EmbedBuilder()
    .setColor('#F04747')
    .setTitle('<a:heavy_minus_sign:1555918969750425682> Đã Trừ Coins')
    .setDescription(
      `**Admin:** ${interaction.user}\n` +
      `**User:** ${targetUser}\n` +
      `**Trừ:** -${amount.toLocaleString()} <a:heavy_minus_sign:1555918969750425682>\n\n` +
      `**Balance cũ:** ${oldBalance.toLocaleString()} <a:money_with_wings:1555919069172080650>\n` +
      `**Balance mới:** ${newBalance.toLocaleString()} <a:money_with_wings:1555919069172080650>`
    )
    .setThumbnail(targetUser.displayAvatarURL())
    .setFooter({ text: `⚠️ Trừ bởi ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
  
  console.log(`[Coins] ${interaction.user.tag} removed ${amount} coins from ${targetUser.tag}`);
}

// Handle set subcommand
async function handleSet(interaction: ChatInputCommandInteraction) {
  // Already deferred in execute()
  
  // Check admin permission
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.editReply({
      content: '❌ Bạn cần quyền Administrator để dùng lệnh này!'
    });
  }

  const targetUser = interaction.options.getUser('user', true);
  const amount = interaction.options.getInteger('amount', true);

  const oldBalance = getCoins(targetUser.id);
  const newBalance = setCoins(targetUser.id, amount);

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🔧 Đã Set Coins')
    .setDescription(
      `**Admin:** ${interaction.user}\n` +
      `**User:** ${targetUser}\n` +
      `**Set:** ${amount.toLocaleString()} <a:money_with_wings:1555919069172080650>\n\n` +
      `**Balance cũ:** ${oldBalance.toLocaleString()} <a:money_with_wings:1555919069172080650>\n` +
      `**Balance mới:** ${newBalance.toLocaleString()} <a:money_with_wings:1555919069172080650>`
    )
    .setThumbnail(targetUser.displayAvatarURL())
    .setFooter({ text: `🔧 Modified by ${interaction.user.tag}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
  
  console.log(`[Coins] ${interaction.user.tag} set ${targetUser.tag} coins to ${amount}`);
}

// Handle leaderboard subcommand
async function handleLeaderboard(interaction: ChatInputCommandInteraction) {
  // Already deferred in execute()
  
  const data = loadCurrencies();
  
  // Sort by cowoncy descending
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => (b as CurrencyBalance).cowoncy - (a as CurrencyBalance).cowoncy)
    .slice(0, 10);

  if (sorted.length === 0) {
    return interaction.editReply({
      content: '📊 Chưa có ai có coins!'
    });
  }

  let description = '';
  
  for (let i = 0; i < sorted.length; i++) {
    const [userId, balance] = sorted[i];
    const cowoncy = (balance as CurrencyBalance).cowoncy;
    
    try {
      const user = await interaction.client.users.fetch(userId);
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      description += `${medal} **${user.username}** • ${cowoncy.toLocaleString()} <a:money_with_wings:1555919069172080650>\n`;
    } catch {
      description += `${i + 1}. User ${userId} • ${cowoncy.toLocaleString()} <a:money_with_wings:1555919069172080650>\n`;
    }
  }

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🏆 Top 10 Coins Leaderboard')
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: `💰 Total: ${Object.keys(data).length} users` });
  
  // Only set thumbnail if guild has icon
  const guildIcon = interaction.guild?.iconURL();
  if (guildIcon) {
    embed.setThumbnail(guildIcon);
  }

  await interaction.editReply({ embeds: [embed] });
}

export default function (client: Client) {
  return new CoinsModule(client);
}
