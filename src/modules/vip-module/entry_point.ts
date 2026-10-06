import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  ColorResolvable
} from 'discord.js';
import { emojis } from '../../config/emojis';
import fs from 'fs';
import path from 'path';

// Limited VIP role names
const LIMITED_VIP_ROLES = [
  '👑 Chủ Bánh Cuốn',
  '👨‍🍳 Đầu Bếp',
  '✨ Huyền Thoại',
  '🌟 Người Sáng Lập'
];

// Path to store custom role data
const customRolesPath = path.join(process.cwd(), 'data', 'vip_custom_roles.json');

interface CustomRoleData {
  [userId: string]: {
    roleId: string;
    roleName: string;
    color: number;
    created: number;
  };
}

// Load custom roles data
function loadCustomRoles(): CustomRoleData {
  try {
    if (!fs.existsSync(customRolesPath)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(customRolesPath, 'utf8'));
  } catch {
    return {};
  }
}

// Save custom roles data
function saveCustomRoles(data: CustomRoleData): void {
  const dir = path.dirname(customRolesPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(customRolesPath, JSON.stringify(data, null, 2));
}

// Helper to check if user has Limited VIP role
function hasLimitedVIP(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  return member?.roles.cache.some(role => LIMITED_VIP_ROLES.includes(role.name)) || false;
}

export default class VIPModule {
  name = 'vip-module';
  description = 'Các lệnh đặc quyền cho Limited VIP';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`👑 VIP module initialized`);
    this.registerCommands();
    console.log(`✅ VIP module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /customrole command - Tạo role riêng (chỉ 1 lần, chỉ Limited VIP)
    const customroleCommand = {
      data: new SlashCommandBuilder()
        .setName('customrole')
        .setDescription('🎨 Tạo role riêng của bạn (Limited VIP only - chỉ 1 lần)')
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('📝 Tên role (tối đa 32 ký tự)')
            .setRequired(true)
            .setMaxLength(32)
        )
        .addStringOption(option =>
          option
            .setName('icon')
            .setDescription('✨ Chọn icon cho role')
            .setRequired(true)
            .addChoices(
              { name: '⭐ Ngôi Sao', value: '⭐' },
              { name: '👑 Vương Miện', value: '👑' },
              { name: '💎 Kim Cương', value: '💎' },
              { name: '🔥 Lửa', value: '🔥' },
              { name: '⚡ Sét', value: '⚡' },
              { name: '🌟 Sao Sáng', value: '🌟' },
              { name: '✨ Lấp Lánh', value: '✨' },
              { name: '🎯 Mục Tiêu', value: '🎯' },
              { name: '🏆 Cúp Vàng', value: '🏆' },
              { name: '🎖️ Huy Chương', value: '🎖️' },
              { name: '🛡️ Khiên', value: '🛡️' },
              { name: '⚔️ Kiếm', value: '⚔️' },
              { name: '🎪 Lều', value: '🎪' },
              { name: '🎨 Nghệ Thuật', value: '🎨' },
              { name: '🎭 Mặt Nạ', value: '🎭' },
              { name: '🎮 Game', value: '🎮' },
              { name: '🎵 Âm Nhạc', value: '🎵' },
              { name: '🌈 Cầu Vồng', value: '🌈' },
              { name: '☀️ Mặt Trời', value: '☀️' },
              { name: '🌙 Mặt Trăng', value: '🌙' },
              { name: '🦋 Bướm', value: '🦋' },
              { name: '🐉 Rồng', value: '🐉' },
              { name: '🦅 Đại Bàng', value: '🦅' },
              { name: '🦁 Sư Tử', value: '🦁' },
              { name: '🌸 Hoa', value: '🌸' }
            )
        )
        .addStringOption(option =>
          option
            .setName('color')
            .setDescription('🎨 Chọn màu sắc cho role')
            .setRequired(true)
            .addChoices(
              { name: '❤️ Đỏ', value: 'FF0000' },
              { name: '💙 Xanh Dương', value: '0000FF' },
              { name: '💚 Xanh Lá', value: '00FF00' },
              { name: '💛 Vàng', value: 'FFFF00' },
              { name: '💜 Tím', value: '9B59B6' },
              { name: '💗 Hồng', value: 'FF69B4' },
              { name: '🧡 Cam', value: 'FFA500' },
              { name: '🤍 Trắng', value: 'FFFFFF' },
              { name: '🖤 Đen', value: '000000' },
              { name: '💰 Vàng Kim', value: 'FFD700' },
              { name: '🌊 Xanh Ngọc', value: '1ABC9C' },
              { name: '🔥 Đỏ Cam', value: 'E74C3C' },
              { name: '🌸 Hồng Phấn', value: 'FFC0CB' },
              { name: '🍊 Cam Nhạt', value: 'F39C12' },
              { name: '🌿 Xanh Mint', value: '98FB98' },
              { name: '🌌 Tím Đậm', value: '8B00FF' },
              { name: '☁️ Xám Nhạt', value: '95A5A6' },
              { name: '⚫ Xám Đậm', value: '34495E' },
              { name: '🌹 Đỏ Thẫm', value: '8B0000' },
              { name: '🍇 Tím Nho', value: '6A0DAD' },
              { name: '🌲 Xanh Rừng', value: '228B22' },
              { name: '🌅 Vàng Hoàng Hôn', value: 'FF8C00' },
              { name: '❄️ Xanh Băng', value: '00CED1' },
              { name: '🌺 Hồng Sen', value: 'DB7093' },
              { name: '🎨 Màu Ngẫu Nhiên', value: 'RANDOM' }
            )
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply({ flags: 64 });
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        // Check Limited VIP
        if (!hasLimitedVIP(interaction)) {
          return interaction.editReply({
            content: `${emojis.error} **Lệnh này chỉ dành cho Limited VIP!**\n\n` +
              `${emojis.gift} Mua role VIP tại \`/shop\`:\n` +
              `👑 Chủ Bánh Cuốn (1500 coins)\n` +
              `👨‍🍳 Đầu Bếp (2000 coins)\n` +
              `✨ Huyền Thoại (2500 coins)\n` +
              `🌟 Người Sáng Lập (3000 coins)`
          });
        }
        
        const userId = interaction.user.id;
        const customRoles = loadCustomRoles();
        
        // Check if user already created a custom role
        if (customRoles[userId]) {
          const existingRole = interaction.guild?.roles.cache.get(customRoles[userId].roleId);
          return interaction.editReply({
            content: `${emojis.error} **Bạn đã tạo role riêng rồi!**\n\n` +
              `${emojis.info} Role hiện tại: ${existingRole ? `<@&${existingRole.id}>` : customRoles[userId].roleName}\n` +
              `${emojis.warning} Bạn chỉ được tạo **1 lần duy nhất**!\n\n` +
              `${emojis.sparkles} Khi bị thu hồi Limited VIP, role này sẽ bị xóa và bạn có thể tạo lại.`
          });
        }
        
        const roleName = interaction.options.getString('name', true);
        const icon = interaction.options.getString('icon', true);
        const colorInput = interaction.options.getString('color', true);
        
        // Parse color
        let color: number;
        if (colorInput === 'RANDOM') {
          // Random color
          color = Math.floor(Math.random() * 0xFFFFFF);
        } else {
          color = parseInt(colorInput, 16);
        }
        
        try {
          // Create role with icon in name
          const guild = interaction.guild!;
          const fullRoleName = `${icon} ${roleName}`;
          
          const newRole = await guild.roles.create({
            name: fullRoleName,
            colors: { primaryColor: color as ColorResolvable },
            hoist: true,
            mentionable: true,
            reason: `Custom role for Limited VIP: ${interaction.user.tag}`
          });
          
          // Assign to user
          const member = guild.members.cache.get(userId);
          if (member) {
            await member.roles.add(newRole);
          }
          
          // Save to database
          customRoles[userId] = {
            roleId: newRole.id,
            roleName: fullRoleName,
            color: color,
            created: Date.now()
          };
          saveCustomRoles(customRoles);
          
          const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emojis.success} Tạo Custom Role Thành Công!`)
            .setDescription(
              `${emojis.sparkles} **Role:** <@&${newRole.id}>\n` +
              `${icon} **Icon:** ${icon}\n` +
              `🎨 **Màu sắc:** \`#${color.toString(16).toUpperCase().padStart(6, '0')}\`\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${emojis.info} **Lưu ý:**\n` +
              `• Bạn chỉ được tạo **1 lần duy nhất**\n` +
              `• Khi bị thu hồi Limited VIP, role này sẽ bị xóa\n` +
              `• Role đã được thêm vào profile của bạn!\n\n` +
              `${emojis.crown} Quyền lợi Limited VIP`
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({ text: `Tạo bởi ${interaction.user.tag}` })
            .setTimestamp();
          
          await interaction.editReply({ embeds: [embed] });
          
        } catch (error: any) {
          console.error('[CustomRole] Error:', error);
          await interaction.editReply({
            content: `${emojis.error} Không thể tạo role: ${error.message}`
          });
        }
      }
    };
    
    // /nickname command - Đổi nickname (chỉ Limited VIP)
    const nicknameCommand = {
      data: new SlashCommandBuilder()
        .setName('nickname')
        .setDescription('👑 Đổi nickname của bạn (Limited VIP only)')
        .addStringOption(option =>
          option
            .setName('nickname')
            .setDescription('📝 Nickname mới (để trống để reset)')
            .setRequired(false)
            .setMaxLength(32)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply({ flags: 64 }); // 64 = ephemeral flag
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        // Check Limited VIP
        if (!hasLimitedVIP(interaction)) {
          return interaction.editReply({
            content: `${emojis.error} **Lệnh này chỉ dành cho Limited VIP!**\n\n` +
              `${emojis.gift} Mua role VIP tại \`/shop\`:\n` +
              `👑 Chủ Bánh Cuốn (1500 coins)\n` +
              `👨‍🍳 Đầu Bếp (2000 coins)\n` +
              `✨ Huyền Thoại (2500 coins)\n` +
              `🌟 Người Sáng Lập (3000 coins)`
          });
        }
        
        const newNickname = interaction.options.getString('nickname');
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        
        if (!member) {
          return interaction.editReply({
            content: `${emojis.error} Không tìm thấy member!`
          });
        }
        
        try {
          const oldNick = member.nickname || member.user.username;
          
          if (newNickname) {
            await member.setNickname(newNickname);
            
            const embed = new EmbedBuilder()
              .setColor('#57F287')
              .setTitle(`${emojis.success} Đổi Nickname Thành Công!`)
              .setDescription(
                `${emojis.user} **Nickname cũ:** ${oldNick}\n` +
                `${emojis.sparkles} **Nickname mới:** ${newNickname}\n\n` +
                `${emojis.crown} Quyền lợi Limited VIP`
              )
              .setThumbnail(interaction.user.displayAvatarURL())
              .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
          } else {
            // Reset nickname
            await member.setNickname(null);
            
            const embed = new EmbedBuilder()
              .setColor('#5865F2')
              .setTitle(`${emojis.success} Reset Nickname Thành Công!`)
              .setDescription(
                `${emojis.user} **Nickname cũ:** ${oldNick}\n` +
                `${emojis.sparkles} **Đã reset về:** ${member.user.username}\n\n` +
                `${emojis.crown} Quyền lợi Limited VIP`
              )
              .setThumbnail(interaction.user.displayAvatarURL())
              .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
          }
        } catch (error: any) {
          await interaction.editReply({
            content: `${emojis.error} Không thể đổi nickname: ${error.message}`
          });
        }
      }
    };
    
    // /vipinfo command - Xem thông tin VIP
    const vipinfoCommand = {
      data: new SlashCommandBuilder()
        .setName('vipinfo')
        .setDescription('👑 Xem thông tin về quyền lợi Limited VIP'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        try {
          await interaction.deferReply();
        } catch (error: any) {
          if (error.code === 10062) return;
          throw error;
        }
        
        const isVIP = hasLimitedVIP(interaction);
        
        const embed = new EmbedBuilder()
          .setColor(isVIP ? '#FFD700' : '#5865F2')
          .setTitle(`${emojis.crown} Limited VIP - Quyền Lợi Đặc Biệt`)
          .setDescription(
            `${isVIP ? `${emojis.success} **Bạn là Limited VIP!**` : `${emojis.info} Mua Limited VIP tại \`/shop\``}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `**${emojis.sparkles} LỆNH ĐẶC BIỆT:**\n` +
            `• \`/nickname\` - Đổi nickname của bạn\n` +
            `• \`/customrole\` - Tạo role riêng (1 lần duy nhất)\n\n` +
            `**${emojis.coin} KINH TẾ:**\n` +
            `• x2 coins từ \`/daily\` (gấp đôi thưởng!)\n` +
            `• Bonus đặc biệt từ events\n\n` +
            `**${emojis.crown} ROLE ĐẸP & HIẾM:**\n` +
            `• Hiển thị riêng biệt trong member list\n` +
            `• Có thể mention được (@role)\n` +
            `• Màu sắc độc đáo\n\n` +
            `**${emojis.gift} CÁC ROLE VIP:**\n` +
            `👑 **Chủ Bánh Cuốn** - 1500 coins\n` +
            `👨‍🍳 **Đầu Bếp** - 2000 coins\n` +
            `✨ **Huyền Thoại** - 2500 coins\n` +
            `🌟 **Người Sáng Lập** - 3000 coins`
          )
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: 'Mua ngay tại /shop!' })
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
      }
    };
    
    this.commands.set('customrole', customroleCommand);
    this.commands.set('nickname', nicknameCommand);
    this.commands.set('vipinfo', vipinfoCommand);
  }

  async cleanup() {
    console.log('🧹 VIP module cleanup');
  }
}
