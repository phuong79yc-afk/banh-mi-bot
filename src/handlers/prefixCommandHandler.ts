import { Client, Message, EmbedBuilder } from 'discord.js';
import { createEnhancedEmbed } from '../utils/embedHelper';
import { emojis } from '../config/emojis';

const PREFIX = '!';

export function setupPrefixCommands(client: Client) {
  client.on('messageCreate', async (message: Message) => {
    // Ignore bots and non-prefix messages
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    try {
      // Ping command
      if (commandName === 'ping') {
        const startTime = Date.now();
        const msg = await message.reply('🏓 Pinging...');
        const latency = Date.now() - startTime;
        const apiLatency = Math.round(client.ws.ping);

        const embed = createEnhancedEmbed({
          title: '🏓 Pong!',
          description: 
            `**Bot Latency:** ${latency}ms\n` +
            `**API Latency:** ${apiLatency}ms`,
          color: 0x1ABC9C,
        });

        await msg.edit({ content: '', embeds: [embed] });
      }

      // Avatar command
      else if (commandName === 'avatar' || commandName === 'av') {
        const user = message.mentions.users.first() || message.author;
        const avatarURL = user.displayAvatarURL({ size: 4096, extension: 'png' });

        const embed = createEnhancedEmbed({
          title: `🖼️ Avatar của ${user.username}`,
          description: `[Download](${avatarURL})`,
          color: 0x1ABC9C,
          image: avatarURL,
        });

        await message.reply({ embeds: [embed] });
      }

      // Userinfo command
      else if (commandName === 'userinfo' || commandName === 'ui') {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild?.members.cache.get(user.id);

        if (!member) {
          return message.reply(`${emojis.error} Không tìm thấy user trong server này!`);
        }

        const roles = member.roles.cache
          .filter(role => role.id !== message.guild?.id)
          .sort((a, b) => b.position - a.position)
          .map(role => role.toString())
          .slice(0, 10);

        const embed = createEnhancedEmbed({
          title: ` Thông tin user: ${user.username}`,
          color: 0x1ABC9C,
          thumbnail: user.displayAvatarURL({ size: 256 }),
          fields: [
            {
              name: ' Tên hiển thị',
              value: member.displayName,
              inline: true
            },
            {
              name: ' User ID',
              value: user.id,
              inline: true
            },
            {
              name: ' Tham gia Discord',
              value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
              inline: true
            },
            {
              name: ' Tham gia server',
              value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Không xác định',
              inline: true
            },
            {
              name: ` Roles (${member.roles.cache.size - 1})`,
              value: roles.length > 0 ? roles.join(', ') : 'Không có role',
              inline: false
            }
          ]
        });

        await message.reply({ embeds: [embed] });
      }

      // Serverinfo command
      else if (commandName === 'serverinfo' || commandName === 'si') {
        const guild = message.guild;
        if (!guild) return;

        const owner = await guild.fetchOwner();
        const channels = guild.channels.cache;
        const textChannels = channels.filter(c => c.isTextBased()).size;
        const voiceChannels = channels.filter(c => c.isVoiceBased()).size;

        const embed = createEnhancedEmbed({
          title: ` ${guild.name}`,
          color: 0x1ABC9C,
          thumbnail: guild.iconURL({ size: 256 }) || undefined,
          fields: [
            {
              name: ' Owner',
              value: owner.user.tag,
              inline: true
            },
            {
              name: ' Server ID',
              value: guild.id,
              inline: true
            },
            {
              name: ' Ngày tạo',
              value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
              inline: true
            },
            {
              name: ' Members',
              value: `${guild.memberCount.toLocaleString()} members`,
              inline: true
            },
            {
              name: ' Channels',
              value: `${textChannels} text • ${voiceChannels} voice`,
              inline: true
            },
            {
              name: ' Roles',
              value: `${guild.roles.cache.size} roles`,
              inline: true
            },
            {
              name: ' Emojis',
              value: `${guild.emojis.cache.size} emojis`,
              inline: true
            },
            {
              name: ' Boost',
              value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`,
              inline: true
            },
            {
              name: ' Verification',
              value: guild.verificationLevel.toString(),
              inline: true
            }
          ]
        });

        await message.reply({ embeds: [embed] });
      }

      // Uptime command
      else if (commandName === 'uptime') {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const embed = createEnhancedEmbed({
          title: ' Bot Uptime',
          description: 
            `Bot đã online được:\n` +
            `**${days}** ngày **${hours}** giờ **${minutes}** phút **${seconds}** giây`,
          color: 0x1ABC9C,
        });

        await message.reply({ embeds: [embed] });
      }

      // Invite command
      else if (commandName === 'invite') {
        const invite = `https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands`;

        const embed = createEnhancedEmbed({
          title: '📨 Invite Bot',
          description: 
            `Cảm ơn bạn đã quan tâm đến **${client.user?.username}**!\n\n` +
            `[👉 Click để invite bot](${invite})\n\n` +
            `**Quyền cần thiết:**\n` +
            `• Manage Server\n` +
            `• Manage Channels\n` +
            `• Manage Roles\n` +
            `• Send Messages\n` +
            `• Embed Links`,
          color: 0x1ABC9C,
        });

        await message.reply({ embeds: [embed] });
      }

      // Embed test command
      else if (commandName === 'embed') {
        const type = args[0]?.toLowerCase() || 'help';

        if (type === '1') {
          // Embed với màu
          const embed = new EmbedBuilder()
            .setTitle(`${emojis.art} Embed Type 1: Có viền màu`)
            .setDescription('Đây là embed bình thường với viền màu xanh ngọc')
            .setColor(0x1ABC9C)
            .addFields(
              { name: 'Field 1', value: 'Giá trị 1', inline: true },
              { name: 'Field 2', value: 'Giá trị 2', inline: true }
            )
            .setFooter({ text: 'Footer text' })
            .setTimestamp();
          
          await message.reply({ embeds: [embed] });
        }
        else if (type === '2') {
          // Embed không set color (xám nhạt)
          const embed = new EmbedBuilder()
            .setTitle('⚪ Embed Type 2: Không màu')
            .setDescription('Đây là embed không set color (viền xám nhạt mặc định)')
            .addFields(
              { name: 'Field 1', value: 'Giá trị 1', inline: true },
              { name: 'Field 2', value: 'Giá trị 2', inline: true }
            )
            .setFooter({ text: 'Footer text' })
            .setTimestamp();
          
          await message.reply({ embeds: [embed] });
        }
        else if (type === '3') {
          // Embed màu tối gần nền Discord
          const embed = new EmbedBuilder()
            .setTitle('🌑 Embed Type 3: Màu tối')
            .setDescription('Đây là embed với màu viền gần nền Discord')
            .setColor(0x2B2D31)
            .addFields(
              { name: 'Field 1', value: 'Giá trị 1', inline: true },
              { name: 'Field 2', value: 'Giá trị 2', inline: true }
            )
            .setFooter({ text: 'Footer text' })
            .setTimestamp();
          
          await message.reply({ embeds: [embed] });
        }
        else if (type === '4') {
          // Message thường (không embed)
          await message.reply(
            `**📝 Type 4: Message thường (không embed)**\n\n` +
            `Đây là message thường không có viền\n` +
            `**Field 1:** Giá trị 1\n` +
            `**Field 2:** Giá trị 2\n\n` +
            `_Footer text_`
          );
        }
        else if (type === '5') {
          // Embed màu đen
          const embed = new EmbedBuilder()
            .setTitle('⚫ Embed Type 5: Màu đen')
            .setDescription('Đây là embed với viền màu đen (#000000)')
            .setColor(0x000000)
            .addFields(
              { name: 'Field 1', value: 'Giá trị 1', inline: true },
              { name: 'Field 2', value: 'Giá trị 2', inline: true }
            )
            .setFooter({ text: 'Footer text' })
            .setTimestamp();
          
          await message.reply({ embeds: [embed] });
        }
        else if (type === '6') {
          // Embed màu nền Discord (giống không viền)
          const embed = new EmbedBuilder()
            .setTitle('Alone - Marshmello')
            .setDescription('04:34\n\nRequested by flytri')
            .setColor(0x2F3136) // Màu nền Discord chính xác
            .setThumbnail('https://i.scdn.co/image/ab67616d0000b273a1c77682c126bd92dbb8d912') // Marshmello album art
            .setTimestamp();
          
          await message.reply({ embeds: [embed] });
        }
        else if (type === '7') {
          // Embed KHÔNG SET COLOR (gần nhất với không viền)
          const embed = new EmbedBuilder()
            .setTitle('Alone - Marshmello')
            .setDescription('04:34\n\nRequested by flytri')
            // Không set color!
            .setThumbnail('https://i.scdn.co/image/ab67616d0000b273a1c77682c126bd92dbb8d912')
            .setTimestamp();
          
          await message.reply({ embeds: [embed] });
        }
        else {
          await message.reply(
            `**${emojis.art} Test các loại Embed:**\n\n` +
            `\`!embed 1\` - Embed với màu xanh ngọc (0x1ABC9C)\n` +
            `\`!embed 2\` - Embed không màu (xám nhạt mặc định)\n` +
            `\`!embed 3\` - Embed màu tối gần nền Discord (0x2B2D31)\n` +
            `\`!embed 4\` - Message thường (không embed, không viền)\n` +
            `\`!embed 5\` - Embed màu đen (0x000000)\n` +
            `\`!embed 6\` - Embed màu nền Discord (0x2F3136) ✨\n` +
            `\`!embed 7\` - Embed không set color (gần nhất không viền) ✨\n`
          );
        }
      }

      // Mute command
      else if (commandName === 'mute') {
        if (!message.guild || !message.member) return;

        // Check permissions
        if (!message.member.permissions.has('ModerateMembers')) {
          return message.reply(`${emojis.error} Bạn không có quyền mute members!`);
        }

        // Get user by mention or ID
        let targetUser = message.mentions.users.first();
        let userId = args[0];
        
        if (!targetUser && userId) {
          // Try to fetch by ID
          if (/^\d{17,19}$/.test(userId)) {
            try {
              targetUser = await client.users.fetch(userId);
            } catch {
              return message.reply(`${emojis.error} Không tìm thấy user với ID này!`);
            }
          } else {
            return message.reply(`${emojis.error} Vui lòng mention user hoặc nhập User ID!\n**Cách dùng:** \`!mute @user <time> [reason]\` hoặc \`!mute <user ID> <time> [reason]\``);
          }
        }

        if (!targetUser) {
          return message.reply(`${emojis.error} Vui lòng mention user hoặc nhập User ID!\n**Cách dùng:** \`!mute @user <time> [reason]\` hoặc \`!mute <user ID> <time> [reason]\``);
        }

        const targetMember = message.guild.members.cache.get(targetUser.id);
        if (!targetMember) {
          return message.reply(`${emojis.error} Không tìm thấy user trong server!`);
        }

        // Parse duration (default 10 minutes)
        const durationArg = args[1];
        let duration = 10 * 60 * 1000; // 10 minutes in ms
        
        if (durationArg) {
          const match = durationArg.match(/^(\d+)([smhd])$/);
          if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            switch (unit) {
              case 's': duration = value * 1000; break;
              case 'm': duration = value * 60 * 1000; break;
              case 'h': duration = value * 60 * 60 * 1000; break;
              case 'd': duration = value * 24 * 60 * 60 * 1000; break;
            }
          }
        }

        const reason = args.slice(durationArg ? 2 : 1).join(' ') || 'Không có lý do';

        try {
          await targetMember.timeout(duration, reason);

          // Send DM to user
          try {
            const dmEmbed = createEnhancedEmbed({
              title: '🔇 Bạn đã bị mute',
              description: 
                `Bạn đã bị mute trong **${message.guild.name}**\n\n` +
                `**Thời gian:** ${Math.floor(duration / 1000 / 60)} phút\n` +
                `**Lý do:** ${reason}\n` +
                `**Moderator:** ${message.author.tag}`,
              color: 0xFF6B6B,
            });
            await targetUser.send({ embeds: [dmEmbed] });
          } catch (dmError) {
            console.log(`Cannot DM user ${targetUser.tag} - DMs might be disabled`);
          }

          const embed = createEnhancedEmbed({
            title: '🔇 User đã bị mute',
            description: 
              `**User:** ${targetUser.tag}\n` +
              `**Thời gian:** ${Math.floor(duration / 1000 / 60)} phút\n` +
              `**Lý do:** ${reason}\n` +
              `**Moderator:** ${message.author.tag}`,
            color: 0x1ABC9C,
          });

          await message.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error muting user:', error);
          await message.reply(`${emojis.error} Không thể mute user này!`);
        }
      }

      // Unmute command
      else if (commandName === 'unmute') {
        if (!message.guild || !message.member) return;

        // Check permissions
        if (!message.member.permissions.has('ModerateMembers')) {
          return message.reply(`${emojis.error} Bạn không có quyền unmute members!`);
        }

        // Get user by mention or ID
        let targetUser = message.mentions.users.first();
        let userId = args[0];
        
        if (!targetUser && userId) {
          // Try to fetch by ID
          if (/^\d{17,19}$/.test(userId)) {
            try {
              targetUser = await client.users.fetch(userId);
            } catch {
              return message.reply(`${emojis.error} Không tìm thấy user với ID này!`);
            }
          } else {
            return message.reply(`${emojis.error} Vui lòng mention user hoặc nhập User ID!\n**Cách dùng:** \`!unmute @user [reason]\` hoặc \`!unmute <user ID> [reason]\``);
          }
        }

        if (!targetUser) {
          return message.reply(`${emojis.error} Vui lòng mention user hoặc nhập User ID!\n**Cách dùng:** \`!unmute @user [reason]\` hoặc \`!unmute <user ID> [reason]\``);
        }

        const targetMember = message.guild.members.cache.get(targetUser.id);
        if (!targetMember) {
          return message.reply(`${emojis.error} Không tìm thấy user trong server!`);
        }

        // Check if user is actually muted
        if (!targetMember.isCommunicationDisabled()) {
          return message.reply(`${emojis.error} User này không bị mute!`);
        }

        const reason = args.slice(1).join(' ') || 'Không có lý do';

        try {
          await targetMember.timeout(null, reason);

          // Send DM to user
          try {
            const dmEmbed = createEnhancedEmbed({
              title: '🔊 Bạn đã được unmute',
              description: 
                `Bạn đã được unmute trong **${message.guild.name}**\n\n` +
                `**Lý do:** ${reason}\n` +
                `**Moderator:** ${message.author.tag}`,
              color: 0x51CF66,
            });
            await targetUser.send({ embeds: [dmEmbed] });
          } catch (dmError) {
            console.log(`Cannot DM user ${targetUser.tag} - DMs might be disabled`);
          }

          const embed = createEnhancedEmbed({
            title: '🔊 User đã được unmute',
            description: 
              `**User:** ${targetUser.tag}\n` +
              `**Lý do:** ${reason}\n` +
              `**Moderator:** ${message.author.tag}`,
            color: 0x1ABC9C,
          });

          await message.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error unmuting user:', error);
          await message.reply(`${emojis.error} Không thể unmute user này!`);
        }
      }

      // Ban command
      else if (commandName === 'ban') {
        if (!message.guild || !message.member) return;

        // Check permissions
        if (!message.member.permissions.has('BanMembers')) {
          return message.reply(`${emojis.error} Bạn không có quyền ban members!`);
        }

        // Get user by mention or ID
        let targetUser = message.mentions.users.first();
        let userId = args[0];
        
        if (!targetUser && userId) {
          // Try to fetch by ID
          if (/^\d{17,19}$/.test(userId)) {
            try {
              targetUser = await client.users.fetch(userId);
            } catch {
              return message.reply(`${emojis.error} Không tìm thấy user với ID này!`);
            }
          } else {
            return message.reply(`${emojis.error} Vui lòng mention user hoặc nhập User ID!\n**Cách dùng:** \`!ban @user [reason]\` hoặc \`!ban <user ID> [reason]\``);
          }
        }

        if (!targetUser) {
          return message.reply(`${emojis.error} Vui lòng mention user hoặc nhập User ID!\n**Cách dùng:** \`!ban @user [reason]\` hoặc \`!ban <user ID> [reason]\``);
        }

        const targetMember = message.guild.members.cache.get(targetUser.id);
        if (targetMember && !targetMember.bannable) {
          return message.reply(`${emojis.error} Không thể ban user này!`);
        }

        const reason = args.slice(1).join(' ') || 'Không có lý do';

        try {
          // Send DM before banning
          try {
            const dmEmbed = createEnhancedEmbed({
              title: '🔨 Bạn đã bị ban',
              description: 
                `Bạn đã bị ban khỏi **${message.guild.name}**\n\n` +
                `**Lý do:** ${reason}\n` +
                `**Moderator:** ${message.author.tag}\n\n` +
                `Nếu bạn nghĩ đây là nhầm lẫn, vui lòng liên hệ ban quản trị.`,
              color: 0xFF6B6B,
            });
            await targetUser.send({ embeds: [dmEmbed] });
          } catch (dmError) {
            console.log(`Cannot DM user ${targetUser.tag} - DMs might be disabled`);
          }

          await message.guild.members.ban(targetUser.id, { reason, deleteMessageDays: 1 });

          const embed = createEnhancedEmbed({
            title: '🔨 User đã bị ban',
            description: 
              `**User:** ${targetUser.tag}\n` +
              `**Lý do:** ${reason}\n` +
              `**Moderator:** ${message.author.tag}`,
            color: 0x1ABC9C,
          });

          await message.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error banning user:', error);
          await message.reply(`${emojis.error} Không thể ban user này!`);
        }
      }

      // Unban command
      else if (commandName === 'unban') {
        if (!message.guild || !message.member) return;

        // Check permissions
        if (!message.member.permissions.has('BanMembers')) {
          return message.reply(`${emojis.error} Bạn không có quyền unban members!`);
        }

        const userId = args[0];
        if (!userId) {
          return message.reply(`${emojis.error} Vui lòng nhập User ID cần unban!\n**Cách dùng:** \`!unban <user ID> [lý do]\``);
        }

        // Validate user ID format
        if (!/^\d{17,19}$/.test(userId)) {
          return message.reply(`${emojis.error} User ID không hợp lệ! (phải là 17-19 chữ số)`);
        }

        const reason = args.slice(1).join(' ') || 'Không có lý do';

        try {
          // Check if user is actually banned
          const bans = await message.guild.bans.fetch();
          const bannedUser = bans.get(userId);
          
          if (!bannedUser) {
            return message.reply(`${emojis.error} User này không bị ban trong server!`);
          }

          await message.guild.members.unban(userId, reason);

          // Send DM to user
          try {
            const user = await client.users.fetch(userId);
            const dmEmbed = createEnhancedEmbed({
              title: `${emojis.success} Bạn đã được unban`,
              description: 
                `Bạn đã được unban khỏi **${message.guild.name}**\n\n` +
                `**Lý do:** ${reason}\n` +
                `**Moderator:** ${message.author.tag}\n\n` +
                `Bạn có thể join lại server nếu muốn.`,
              color: 0x51CF66,
            });
            await user.send({ embeds: [dmEmbed] });
          } catch (dmError) {
            console.log(`Cannot DM user ${userId} - DMs might be disabled`);
          }

          const embed = createEnhancedEmbed({
            title: `${emojis.success} User đã được unban`,
            description: 
              `**User:** ${bannedUser.user.tag} (${userId})\n` +
              `**Lý do:** ${reason}\n` +
              `**Moderator:** ${message.author.tag}`,
            color: 0x1ABC9C,
          });

          await message.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error unbanning user:', error);
          await message.reply(`${emojis.error} Không thể unban user này!`);
        }
      }

      // Lock command
      else if (commandName === 'lock') {
        if (!message.guild || !message.member) return;

        // Check permissions
        if (!message.member.permissions.has('ManageChannels')) {
          return message.reply(`${emojis.error} Bạn không có quyền quản lý channels!`);
        }

        const channel = message.channel;
        if (!channel.isTextBased() || channel.isDMBased() || channel.isThread()) {
          return message.reply(`${emojis.error} Không thể lock channel này!`);
        }

        const reason = args.join(' ') || 'Không có lý do';

        try {
          const guildChannel = channel as any;
          await guildChannel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: false,
          });

          const embed = createEnhancedEmbed({
            title: '🔒 Channel đã bị lock',
            description: 
              `**Channel:** ${channel.toString()}\n` +
              `**Lý do:** ${reason}\n` +
              `**Moderator:** ${message.author.tag}`,
            color: 0x1ABC9C,
          });

          await message.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error locking channel:', error);
          await message.reply(`${emojis.error} Không thể lock channel này!`);
        }
      }

      // Unlock command
      else if (commandName === 'unlock') {
        if (!message.guild || !message.member) return;

        // Check permissions
        if (!message.member.permissions.has('ManageChannels')) {
          return message.reply(`${emojis.error} Bạn không có quyền quản lý channels!`);
        }

        const channel = message.channel;
        if (!channel.isTextBased() || channel.isDMBased() || channel.isThread()) {
          return message.reply(`${emojis.error} Không thể unlock channel này!`);
        }

        const reason = args.join(' ') || 'Không có lý do';

        try {
          const guildChannel = channel as any;
          await guildChannel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: null,
          });

          const embed = createEnhancedEmbed({
            title: '🔓 Channel đã được unlock',
            description: 
              `**Channel:** ${channel.toString()}\n` +
              `**Lý do:** ${reason}\n` +
              `**Moderator:** ${message.author.tag}`,
            color: 0x1ABC9C,
          });

          await message.reply({ embeds: [embed] });
        } catch (error) {
          console.error('Error unlocking channel:', error);
          await message.reply(`${emojis.error} Không thể unlock channel này!`);
        }
      }

      // AFK command - Disabled (module removed)
      else if (commandName === 'afk') {
        await message.reply(`${emojis.error} AFK module đã bị gỡ bỏ!`);
      }

      // Help command
      else if (commandName === 'help') {
        const embed = createEnhancedEmbed({
          title: '📖 Prefix Commands Help',
          description: 
            `**Prefix:** \`${PREFIX}\`\n\n` +
            `**Available Commands:**\n\n` +
            `**Utility (9):**\n` +
            `\`${PREFIX}help\` - Hiển thị help menu\n` +
            `\`${PREFIX}ping\` - Kiểm tra ping bot\n` +
            `\`${PREFIX}avatar [@user]\` - Xem avatar\n` +
            `\`${PREFIX}userinfo [@user]\` - Thông tin user\n` +
            `\`${PREFIX}serverinfo\` - Thông tin server\n` +
            `\`${PREFIX}uptime\` - Xem uptime bot\n` +
            `\`${PREFIX}invite\` - Invite bot\n` +
            `\`${PREFIX}profile [@user]\` - Xem profile\n` +
            `\`${PREFIX}afk [reason]\` - Set AFK status\n\n` +
            `**Moderation (6):**\n` +
            `\`${PREFIX}mute @user|<ID> <time> [reason]\` - Mute user\n` +
            `\`${PREFIX}unmute @user|<ID> [reason]\` - Unmute user\n` +
            `\`${PREFIX}ban @user|<ID> [reason]\` - Ban user\n` +
            `\`${PREFIX}unban <user ID> [reason]\` - Unban user\n` +
            `\`${PREFIX}lock [reason]\` - Lock channel\n` +
            `\`${PREFIX}unlock [reason]\` - Unlock channel\n\n` +
            `**Time format:** \`10s\`, \`5m\`, \`1h\`, \`2d\`\n` +
            `**Note:** Bot sẽ tự động DM cho user khi bị mute/ban\n\n` +
            `**Slash Commands:**\n` +
            `Sử dụng \`/help\` để xem tất cả slash commands!`,
          color: 0x1ABC9C,
        });

        await message.reply({ embeds: [embed] });
      }

      // Profile command - with premium upsell
      else if (commandName === 'profile') {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild?.members.cache.get(user.id);

        if (!member) {
          return message.reply(`${emojis.error} Không tìm thấy user trong server này!`);
        }

        // Check if user has any shop role
        const shopRoleNames = [
          'Bánh Cuốn Lover',
          'VIP Member',
          'Supporter',
          'Gamer',
          'Music Lover',
          'Night Owl',
          'Early Bird',
          'Artist',
          'Foodie'
        ];

        const hasShopRole = member.roles.cache.some(role => 
          shopRoleNames.includes(role.name)
        );

        // Get user's banner
        const fetchedUser = await user.fetch();
        const banner = fetchedUser.bannerURL({ size: 1024, extension: 'png' });
        const accentColor = fetchedUser.accentColor;

        // Get roles
        const roles = member.roles.cache
          .filter(role => role.id !== message.guild?.id)
          .sort((a, b) => b.position - a.position)
          .map(role => role.toString())
          .slice(0, 5);

        const embed = new EmbedBuilder()
          .setColor(hasShopRole ? (accentColor || 0x5865F2) : 0x99AAB5)
          .setAuthor({
            name: hasShopRole ? `${user.username}'s Profile 💎` : `${user.username}'s Profile`,
            iconURL: user.displayAvatarURL()
          })
          .setThumbnail(user.displayAvatarURL({ size: 256 }))
          .addFields(
            {
              name: `${emojis.user} Username`,
              value: `\`${user.tag}\``,
              inline: true
            },
            {
              name: `${emojis.id} ID`,
              value: `\`${user.id}\``,
              inline: true
            },
            {
              name: `${emojis.calendar} Created`,
              value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
              inline: true
            },
            {
              name: `${emojis.rocket} Joined Server`,
              value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown',
              inline: true
            },
            {
              name: `${emojis.gift} Roles (${member.roles.cache.size - 1})`,
              value: roles.length > 0 ? roles.join(' ') : 'No roles',
              inline: false
            }
          )
          .setTimestamp();

        // Add banner if exists
        if (banner) {
          embed.setImage(banner);
        }

        // Add avatar download link
        const avatarURL = user.displayAvatarURL({ size: 4096, extension: 'png' });
        let description = `${emojis.art} **Avatar:** [Download](${avatarURL})`;
        if (banner) {
          description += `\n${emojis.sparkles} **Banner:** [Download](${banner})`;
        }

        // Premium upsell or thank you message
        if (!hasShopRole && user.id === message.author.id) {
          description += `\n\n━━━━━━━━━━━━━━━━━━━\n` +
            `${emojis.gift} **Upgrade to Premium!**\n\n` +
            `Mua role từ \`/shop\` để unlock:\n` +
            `💎 Premium badge on profile\n` +
            `🎨 Custom accent color\n` +
            `✨ Enhanced profile styling\n` +
            `🎁 Exclusive shop roles\n` +
            `💖 Support bot development`;
          
          embed.setFooter({
            text: `💎 Use /shop to unlock premium features!`,
            iconURL: client.user?.displayAvatarURL()
          });
        } else if (hasShopRole) {
          embed.setFooter({
            text: `💎 Premium Member - Thank you for your support!`,
            iconURL: client.user?.displayAvatarURL()
          });
        } else {
          embed.setFooter({
            text: `Profile Card`,
            iconURL: client.user?.displayAvatarURL()
          });
        }

        embed.setDescription(description);

        await message.reply({ embeds: [embed] });
      }

    } catch (error) {
      console.error(`❌ Error executing prefix command ${commandName}:`, error);
      await message.reply(`${emojis.error} Có lỗi xảy ra khi thực hiện lệnh này!`).catch(() => {});
    }
  });

  console.log(`✅ Prefix command handler initialized with prefix: ${PREFIX}`);
}
