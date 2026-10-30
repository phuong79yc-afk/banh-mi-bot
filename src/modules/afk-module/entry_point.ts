// AFK Module - Entry Point (Components V2)

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ContainerBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  InteractionContextType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  User,
} from 'discord.js';
import { afkManager, AFKUser } from './AFKManager';
import { emojis } from '../../config/emojis';
import { V2, V2_EPHEMERAL, txt, sep } from '../../utils/v2Helper';

// ───────── Helpers ─────────

const ts = (t: number) => Math.floor(t / 1000);

// Thời gian AFK dạng tiếng Việt, tối đa 2 đơn vị
const formatDuration = (since: number): string => {
  const s = Math.max(1, Math.floor((Date.now() - since) / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return h > 0 ? `${d} ngày ${h} giờ` : `${d} ngày`;
  if (h > 0) return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
  if (m > 0) return `${m} phút`;
  return `${s} giây`;
};

const mentionLines = (mentions: AFKUser['mentions'], limit = 5): string =>
  mentions
    .slice(-limit)
    .reverse()
    .map(m => `• <@${m.userId}> <t:${ts(m.timestamp)}:R> — [Xem tin nhắn](${m.messageUrl})`)
    .join('\n');

const avatarOf = (user: User) => new ThumbnailBuilder().setURL(user.displayAvatarURL({ size: 256 }));

const buildWelcomeBack = (user: User, afk: AFKUser): ContainerBuilder => {
  const count = afk.mentions.length;
  const header = new SectionBuilder()
    .addTextDisplayComponents(
      txt(`## ${emojis.success} Chào mừng trở lại!`),
      txt(`<@${user.id}> đã AFK **${formatDuration(afk.timestamp)}**\n-# Lý do: ${afk.reason}`),
    )
    .setThumbnailAccessory(avatarOf(user));

  return new ContainerBuilder().addSectionComponents(header)
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      txt(
        count > 0
          ? `📬 Bạn được nhắc tên **${count}** lần:\n${mentionLines(afk.mentions)}`
          : '📭 Không có ai nhắc tên bạn trong lúc AFK.',
      ),
    );
};

export default class AFKModule {
  name = 'afk-module';
  description = 'AFK System - Set yourself AFK with auto welcome back';
  version = '1.1.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('💤 AFK module initialized');
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ AFK module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // ───────── /afk ─────────
    const afkCommand = {
      data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Bật trạng thái vắng mặt và thông báo lý do')
        .setContexts(InteractionContextType.Guild)
        .addStringOption(o =>
          o.setName('reason').setDescription('Lý do vắng mặt (tối đa 100 ký tự)').setMaxLength(100).setRequired(false),
        )
        .addBooleanOption(o =>
          o.setName('silent').setDescription('Chỉ hiển thị phản hồi cho bạn').setRequired(false),
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const reason = (interaction.options.getString('reason') || 'AFK').trim() || 'AFK';
        const silent = interaction.options.getBoolean('silent') || false;

        // Lấy member để đổi nickname
        const member = interaction.guild?.members.cache.get(interaction.user.id);
        let originalNickname: string | undefined;

        if (member) {
          originalNickname = member.nickname || undefined;
          try {
            // Đổi nickname thành [AFK] NAME
            const displayName = member.displayName;
            if (!displayName.startsWith('[AFK]')) {
              await member.setNickname(`[AFK] ${displayName}`);
            }
          } catch (error) {
            // Không có quyền đổi nickname (role cao hơn bot hoặc owner)
            console.log('Cannot change nickname for', interaction.user.tag);
          }
        }

        const afk = afkManager.setAFK(interaction.guildId!, interaction.user.id, reason, originalNickname);

        const header = new SectionBuilder()
          .addTextDisplayComponents(txt('## 💤 Đã bật chế độ AFK'), txt(`**${reason}**`))
          .setThumbnailAccessory(avatarOf(interaction.user));

        const container = new ContainerBuilder().addSectionComponents(header)
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            txt(`${emojis.clock} Bắt đầu <t:${ts(afk.timestamp)}:R>`),
            txt('-# Gõ tin nhắn bất kỳ hoặc bấm nút bên dưới để tắt AFK • Mỗi lần bị nhắc tên sẽ được ghi lại'),
          )
          .addActionRowComponents(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`afk_remove:${interaction.user.id}`)
                .setLabel('Tắt AFK')
                .setEmoji('👋')
                .setStyle(ButtonStyle.Secondary),
            ),
          );

        await interaction.reply({
          components: [container],
          flags: silent ? V2_EPHEMERAL : V2,
          allowedMentions: { parse: [] },
        } as any);
      },
    };

    // ───────── /afk-remove ─────────
    const removeCommand = {
      data: new SlashCommandBuilder()
        .setName('afk-remove')
        .setDescription('Tắt trạng thái vắng mặt của bạn')
        .setContexts(InteractionContextType.Guild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const afkUser = afkManager.removeAFK(interaction.guildId!, interaction.user.id);

        if (!afkUser) {
          const container = new ContainerBuilder().addTextDisplayComponents(
              txt(`## ${emojis.error} Bạn không ở trạng thái AFK`),
              txt('-# Dùng `/afk` để bật chế độ AFK.'),
            );
          return interaction.reply({ components: [container], flags: V2_EPHEMERAL } as any);
        }

        // Restore nickname
        try {
          const member = interaction.guild?.members.cache.get(interaction.user.id);
          if (member && member.nickname?.startsWith('[AFK]')) {
            await member.setNickname(afkUser.originalNickname || null);
          }
        } catch (error) {
          console.log('Cannot restore nickname for', interaction.user.tag);
        }

        await interaction.reply({
          components: [buildWelcomeBack(interaction.user, afkUser)],
          flags: V2_EPHEMERAL,
          allowedMentions: { parse: [] },
        } as any);
      },
    };

    // ───────── /afk-list ─────────
    const listCommand = {
      data: new SlashCommandBuilder()
        .setName('afk-list')
        .setDescription('Liệt kê các thành viên đang bật trạng thái vắng mặt')
        .setContexts(InteractionContextType.Guild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const guildAFK = afkManager
          .getAllAFK()
          .filter(a => a.guildId === interaction.guildId)
          .sort((a, b) => a.timestamp - b.timestamp);

        if (guildAFK.length === 0) {
          const container = new ContainerBuilder().addTextDisplayComponents(
              txt('## 😴 Không có ai đang AFK'),
              txt('-# Cả server đang online hết rồi!'),
            );
          return interaction.reply({ components: [container], flags: V2_EPHEMERAL } as any);
        }

        const lines = guildAFK.map(
          (a, i) => `**${i + 1}.** <@${a.userId}> • <t:${ts(a.timestamp)}:R>\n-# ${a.reason}`,
        );

        // Giới hạn text của message V2 (4000 ký tự)
        const shown: string[] = [];
        let len = 0;
        for (const line of lines) {
          if (len + line.length + 1 > 3200) break;
          shown.push(line);
          len += line.length + 1;
        }

        const rest = lines.length - shown.length;
        const container = new ContainerBuilder().addTextDisplayComponents(txt('## 💤 Danh sách AFK'))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(shown.join('\n') + (rest > 0 ? `\n… và **${rest}** người khác` : '')))
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(`-# Tổng: ${guildAFK.length} người đang AFK`));

        await interaction.reply({
          components: [container],
          flags: V2_EPHEMERAL,
          allowedMentions: { parse: [] },
        } as any);
      },
    };

    this.commands.set('afk', afkCommand);
    this.commands.set('afk-remove', removeCommand);
    this.commands.set('afk-list', listCommand);
  }

  private registerEvents() {
    // Nút "Tắt AFK" trên thẻ /afk (xử lý toàn cục nên vẫn hoạt động sau khi bot restart)
    this.client.on('interactionCreate', async interaction => {
      if (!interaction.isButton() || !interaction.customId.startsWith('afk_remove:')) return;
      if (!interaction.guildId) return;

      const ownerId = interaction.customId.split(':')[1];
      if (interaction.user.id !== ownerId) {
        await interaction
          .reply({
            components: [
              new ContainerBuilder().addTextDisplayComponents(txt(`${emojis.error} Nút này không phải của bạn!`)),
            ],
            flags: V2_EPHEMERAL,
          } as any)
          .catch(() => {});
        return;
      }

      const afkUser = afkManager.removeAFK(interaction.guildId, interaction.user.id);

      // Restore nickname
      if (afkUser) {
        try {
          const member = interaction.guild?.members.cache.get(interaction.user.id);
          if (member && member.nickname?.startsWith('[AFK]')) {
            await member.setNickname(afkUser.originalNickname || null);
          }
        } catch (error) {
          console.log('Cannot restore nickname for', interaction.user.tag);
        }
      }

      const container = afkUser
        ? buildWelcomeBack(interaction.user, afkUser)
        : new ContainerBuilder().addTextDisplayComponents(txt('## 👋 Bạn đã tắt AFK rồi'));

      await interaction
        .update({ components: [container], flags: V2, allowedMentions: { parse: [] } } as any)
        .catch(error => console.error('Error handling AFK button:', error));
    });

    this.client.on('messageCreate', async (message: Message) => {
      // Ignore bots and DMs
      if (message.author.bot || !message.guild) return;

      // ── Tác giả đang AFK -> tự gỡ AFK ──
      const authorAFK = afkManager.getAFK(message.guild.id, message.author.id);
      if (authorAFK) {
        afkManager.removeAFK(message.guild.id, message.author.id);

        // Restore nickname
        try {
          const member = message.guild.members.cache.get(message.author.id);
          if (member && member.nickname?.startsWith('[AFK]')) {
            await member.setNickname(authorAFK.originalNickname || null);
          }
        } catch (error) {
          console.log('Cannot restore nickname for', message.author.tag);
        }

        if (!message.channel.isSendable()) return;

        try {
          const replyMsg = await message.channel.send({
            components: [buildWelcomeBack(message.author, authorAFK)],
            flags: V2,
            allowedMentions: { parse: [] },
          } as any);

          // Nếu có người nhắc thì để lâu hơn một chút để kịp đọc
          const delay = authorAFK.mentions.length > 0 ? 20000 : 6000;
          setTimeout(() => replyMsg.delete().catch(() => {}), delay);
        } catch (error) {
          console.error('Error sending AFK welcome back:', error);
        }
        return;
      }

      // ── Có nhắc đến người đang AFK ──
      if (message.mentions.users.size === 0) return;

      const hits: { user: User; afk: AFKUser }[] = [];
      for (const [userId, user] of message.mentions.users) {
        if (userId === message.author.id || user.bot) continue;
        const afk = afkManager.getAFK(message.guild.id, userId);
        if (!afk) continue;

        afkManager.addMention(
          message.guild.id,
          userId,
          message.author.id,
          message.author.username,
          message.channel.id,
          message.url,
        );

        hits.push({ user, afk });
      }

      if (hits.length === 0) return;

      const container = new ContainerBuilder();

      hits.slice(0, 3).forEach(({ user, afk }, i) => {
        if (i > 0) container.addSeparatorComponents(sep(false, false));
        container.addSectionComponents(
          new SectionBuilder()
            .addTextDisplayComponents(
              txt(`### 💤 ${user.displayName} đang AFK`),
              txt(`**${afk.reason}**\n-# Từ <t:${ts(afk.timestamp)}:R>`),
            )
            .setThumbnailAccessory(avatarOf(user)),
        );
      });

      if (hits.length > 3) {
        container.addTextDisplayComponents(txt(`-# … và ${hits.length - 3} người khác cũng đang AFK`));
      }

      try {
        const replyMsg = await message.reply({
          components: [container],
          flags: V2,
          allowedMentions: { parse: [], repliedUser: false },
        } as any);

        setTimeout(() => replyMsg.delete().catch(() => {}), 10000);
      } catch (error) {
        console.error('Error sending AFK notification:', error);
      }
    });
  }

  async cleanup() {
    console.log('🧹 AFK module cleanup');
  }
}
