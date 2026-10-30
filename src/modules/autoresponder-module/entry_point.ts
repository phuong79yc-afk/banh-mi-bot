// Autoresponder Module - Entry Point (Components V2)

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  InteractionContextType,
  ContainerBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { emojis } from '../../config/emojis';
import { V2, V2_EPHEMERAL, txt, sep } from '../../utils/v2Helper';
import { autoresponderManager, MatchMode } from './AutoresponderManager';

// ───────── Helpers ─────────

const COLOR = { main: 0x667eea, success: 0x57f287, error: 0xed4245, warn: 0xfee75c };

const MODES: Record<string, { label: string; emoji: string }> = {
  equal: { label: 'Bằng nhau', emoji: '🟰' },
  contains: { label: 'Chứa', emoji: '🔍' },
  startswith: { label: 'Bắt đầu bằng', emoji: '▶️' },
  endswith: { label: 'Kết thúc bằng', emoji: '⏹️' },
};

const modeOf = (mode: string) => MODES[mode] ?? { label: mode, emoji: '⚙️' };

const ts = (t: number) => Math.floor(t / 1000);

const code = (s: string) => `\`${s.replace(/`/g, 'ˋ')}\``;

// Trích dẫn nhiều dòng, giới hạn độ dài
const quote = (s: string, max = 1000) => {
  const cut = s.length > max ? s.slice(0, max) + '…' : s;
  return cut.split('\n').map(l => `> ${l}`).join('\n');
};

const errorCard = (message: string) =>
  new ContainerBuilder().addTextDisplayComponents(txt(`## ${emojis.error} Có lỗi xảy ra`), txt(message));

const successCard = (title: string, body: string) =>
  new ContainerBuilder().addTextDisplayComponents(txt(`## ${emojis.success} ${title}`), txt(body));

// Thẻ chi tiết dùng chung cho /add và /view
const detailCard = (ar: any, title: string, color = COLOR.main) => {
  const mode = modeOf(ar.mode);
  const footer = [
    ar.createdBy ? `Tạo bởi <@${ar.createdBy}>` : null,
    ar.createdAt ? `<t:${ts(ar.createdAt)}:R>` : null,
    `ID: ${ar.id}`,
  ].filter(Boolean).join(' • ');

  return new ContainerBuilder().addTextDisplayComponents(txt(`## ${title}`), txt(`**Trigger:** ${code(ar.trigger)}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      txt(
        `**${mode.emoji} Chế độ khớp:** ${mode.label}\n` +
        `**🔤 Phân biệt hoa/thường:** ${ar.ignoreCase ? 'Không' : 'Có'}\n` +
        `**⏱️ Cooldown:** ${ar.cooldownSeconds ?? 10}s\n` +
        `**${ar.enabled === false ? '🔴' : '🟢'} Trạng thái:** ${ar.enabled === false ? 'Tắt' : 'Bật'}`,
      ),
    )
    .addSeparatorComponents(sep(false, false))
    .addTextDisplayComponents(txt(`**💬 Phản hồi**\n${quote(ar.response)}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(txt(`-# ${footer}`));
};

export default class AutoresponderModule {
  name = 'autoresponder-module';
  description = 'Autoresponder - Auto-reply based on keywords';
  version = '1.1.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('🤖 Autoresponder module initialized');
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Autoresponder module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    const modeChoices = [
      { name: 'Bằng nhau', value: 'equal' },
      { name: 'Chứa', value: 'contains' },
      { name: 'Bắt đầu bằng', value: 'startswith' },
      { name: 'Kết thúc bằng', value: 'endswith' },
    ];

    // ───────── /autoresponder-add ─────────
    const addCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-add')
        .setDescription('Tạo câu trả lời tự động theo từ khóa')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild)
        .addStringOption(o => o.setName('trigger').setDescription('Từ khóa hoặc cụm từ kích hoạt phản hồi').setRequired(true))
        .addStringOption(o => o.setName('response').setDescription('Nội dung bot sẽ gửi khi khớp từ khóa').setRequired(true))
        .addStringOption(o =>
          o.setName('mode').setDescription('Cách so khớp từ khóa với tin nhắn').setRequired(false).addChoices(...modeChoices),
        )
        .addBooleanOption(o =>
          o.setName('ignorecase').setDescription('Không phân biệt chữ hoa và chữ thường').setRequired(false),
        )
        .addIntegerOption(o => o.setName('cooldown').setDescription('Thời gian chờ mỗi người dùng, tính bằng giây (0–3600)').setMinValue(0).setMaxValue(3600).setRequired(false)),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const trigger = interaction.options.getString('trigger', true);
        const response = interaction.options.getString('response', true);
        const mode = (interaction.options.getString('mode') || 'contains') as MatchMode;
        const ignoreCase = interaction.options.getBoolean('ignorecase') ?? true;
        const cooldown = interaction.options.getInteger('cooldown') ?? 10;

        const result = autoresponderManager.add(
          interaction.guildId!, trigger, response, mode, ignoreCase, interaction.user.id, cooldown,
        );

        if (!result.success) {
          const replyMethod = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
          return interaction[replyMethod]({ components: [errorCard(String(result.error))], flags: V2_EPHEMERAL } as any);
        }

        const replyMethod = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
        await interaction[replyMethod]({
          components: [detailCard(result.autoresponder!, `${emojis.success} Đã thêm Autoresponder`, COLOR.success)],
          flags: V2,
          allowedMentions: { parse: [] },
        } as any);
      },
    };

    // ───────── /autoresponder-edit ─────────
    const editCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-edit')
        .setDescription('Cập nhật từ khóa, phản hồi hoặc cách khớp')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild)
        .addStringOption(o => o.setName('trigger').setDescription('Từ khóa hiện tại cần chỉnh sửa').setRequired(true))
        .addStringOption(o => o.setName('new-trigger').setDescription('Từ khóa kích hoạt mới'))
        .addStringOption(o => o.setName('response').setDescription('Nội dung phản hồi mới'))
        .addStringOption(o => o.setName('mode').setDescription('Cách so khớp từ khóa mới').addChoices(...modeChoices))
        .addBooleanOption(o => o.setName('ignorecase').setDescription('Có phân biệt chữ hoa và chữ thường không'))
        .addIntegerOption(o => o.setName('cooldown').setDescription('Thời gian chờ mỗi người dùng, tính bằng giây (0–3600)').setMinValue(0).setMaxValue(3600)),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const trigger = interaction.options.getString('trigger', true);
        const updates: Parameters<typeof autoresponderManager.edit>[2] = {};
        const newTrigger = interaction.options.getString('new-trigger');
        const response = interaction.options.getString('response');
        const mode = interaction.options.getString('mode') as MatchMode | null;
        const ignoreCase = interaction.options.getBoolean('ignorecase');
        const cooldown = interaction.options.getInteger('cooldown');
        if (newTrigger !== null) updates.trigger = newTrigger;
        if (response !== null) updates.response = response;
        if (mode !== null) updates.mode = mode;
        if (ignoreCase !== null) updates.ignoreCase = ignoreCase;
        if (cooldown !== null) updates.cooldownSeconds = cooldown;
        if (!Object.keys(updates).length) {
          return interaction.reply({ components: [errorCard('Hãy nhập ít nhất một trường cần chỉnh sửa.')], flags: V2_EPHEMERAL } as any);
        }
        const result = autoresponderManager.edit(interaction.guildId!, trigger, updates);
        if (!result.success) {
          return interaction.reply({ components: [errorCard(String(result.error))], flags: V2_EPHEMERAL } as any);
        }
        await interaction.reply({
          components: [detailCard(result.autoresponder!, `${emojis.success} Đã chỉnh sửa Autoresponder`, COLOR.success)],
          flags: V2_EPHEMERAL,
          allowedMentions: { parse: [] },
        } as any);
      },
    };

    // ───────── /autoresponder-toggle ─────────
    const toggleCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-toggle')
        .setDescription('Bật hoặc tắt phản hồi tự động theo từ khóa')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild)
        .addStringOption(o => o.setName('trigger').setDescription('Từ khóa của phản hồi cần đổi trạng thái').setRequired(true))
        .addBooleanOption(o => o.setName('enabled').setDescription('Bật phản hồi nếu chọn Có, tắt nếu chọn Không').setRequired(true)),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const trigger = interaction.options.getString('trigger', true);
        const enabled = interaction.options.getBoolean('enabled', true);
        const result = autoresponderManager.setEnabled(interaction.guildId!, trigger, enabled);
        if (!result.success) {
          return interaction.reply({ components: [errorCard(String(result.error))], flags: V2_EPHEMERAL } as any);
        }
        await interaction.reply({
          components: [successCard('Đã cập nhật trạng thái', `${code(trigger)} → **${enabled ? '🟢 Đang bật' : '🔴 Đã tắt'}**`)],
          flags: V2_EPHEMERAL,
          allowedMentions: { parse: [] },
        } as any);
      },
    };

    // ───────── /autoresponder-remove ─────────
    const removeCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-remove')
        .setDescription('Xóa phản hồi tự động theo từ khóa')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild)
        .addStringOption(o => o.setName('trigger').setDescription('Từ khóa của phản hồi cần xóa').setRequired(true)),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const trigger = interaction.options.getString('trigger', true);
        const result = autoresponderManager.remove(interaction.guildId!, trigger);

        if (!result.success) {
          return interaction.reply({ components: [errorCard(String(result.error))], flags: V2_EPHEMERAL } as any);
        }

        await interaction.reply({
          components: [successCard('Đã xóa Autoresponder', `Trigger ${code(trigger)} đã được xóa.`)],
          flags: V2_EPHEMERAL,
          allowedMentions: { parse: [] },
        } as any);
      },
    };

    // ───────── /autoresponder-list ─────────
    const listCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-list')
        .setDescription('Liệt kê các phản hồi tự động trong máy chủ')
        .setContexts(InteractionContextType.Guild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const list = autoresponderManager.getAll(interaction.guildId!);

        if (list.length === 0) {
          return interaction.reply({
            components: [
              new ContainerBuilder().addTextDisplayComponents(
                  txt('## 📭 Chưa có autoresponder nào'),
                  txt('-# Dùng `/autoresponder-add` để tạo cái đầu tiên.'),
                ),
            ],
            flags: V2_EPHEMERAL,
          } as any);
        }

        const lines = list.map((ar: any, i: number) => {
          const mode = modeOf(ar.mode);
          return `**${i + 1}.** ${code(ar.trigger)}\n-# ${mode.emoji} ${mode.label} • ${ar.ignoreCase ? 'Aa = aa' : 'Phân biệt hoa/thường'}`;
        });

        // Giới hạn text của message V2 (4000 ký tự)
        const shown: string[] = [];
        let len = 0;
        for (const line of lines) {
          if (len + line.length + 1 > 3000) break;
          shown.push(line);
          len += line.length + 1;
        }

        const rest = lines.length - shown.length;

        const options = list.slice(0, 25).map((ar: any, i: number) => ({
          label: `${i + 1}. ${ar.trigger}`.slice(0, 100),
          description: modeOf(ar.mode).label,
          value: String(i),
        }));

        const container = new ContainerBuilder().addTextDisplayComponents(
            txt(`## ${emojis.copy} Autoresponders`),
            txt(`-# Server có **${list.length}** autoresponder`),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt(shown.join('\n') + (rest > 0 ? `\n… và **${rest}** cái khác` : '')))
          .addSeparatorComponents(sep())
          .addActionRowComponents(
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('ar_view')
                .setPlaceholder('Chọn để xem chi tiết...')
                .addOptions(options),
            ),
          )
          .addTextDisplayComponents(
            txt(`-# Dùng /autoresponder-view để xem chi tiết${list.length > 25 ? ' (menu chỉ hiện 25 cái đầu)' : ''}`),
          );

        await interaction.reply({ components: [container], flags: V2_EPHEMERAL, allowedMentions: { parse: [] } } as any);
      },
    };

    // ───────── /autoresponder-view ─────────
    const viewCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-view')
        .setDescription('Xem cấu hình của một phản hồi tự động')
        .setContexts(InteractionContextType.Guild)
        .addStringOption(o => o.setName('trigger').setDescription('Từ khóa của phản hồi cần xem').setRequired(true)),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const trigger = interaction.options.getString('trigger', true);
        const ar = autoresponderManager.get(interaction.guildId!, trigger);

        if (!ar) {
          return interaction.reply({
            components: [errorCard(`Không tìm thấy autoresponder với trigger ${code(trigger)}`)],
            flags: V2_EPHEMERAL,
            allowedMentions: { parse: [] },
          } as any);
        }

        await interaction.reply({
          components: [detailCard(ar, `${emojis.search} Chi tiết Autoresponder`)],
          flags: V2_EPHEMERAL,
          allowedMentions: { parse: [] },
        } as any);
      },
    };

    // ───────── /autoresponder-matchmode ─────────
    const matchmodeCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-matchmode')
        .setDescription('Thay đổi cách so khớp từ khóa')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild)
        .addStringOption(o => o.setName('trigger').setDescription('Từ khóa cần đổi cách so khớp').setRequired(true))
        .addStringOption(o =>
          o.setName('mode').setDescription('Chọn cách so khớp mới').setRequired(true).addChoices(...modeChoices),
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const trigger = interaction.options.getString('trigger', true);
        const mode = interaction.options.getString('mode', true) as MatchMode;

        const result = autoresponderManager.updateMatchMode(interaction.guildId!, trigger, mode);

        if (!result.success) {
          return interaction.reply({ components: [errorCard(String(result.error))], flags: V2_EPHEMERAL } as any);
        }

        const m = modeOf(mode);
        await interaction.reply({
          components: [
            successCard('Đã cập nhật chế độ khớp', `Trigger ${code(trigger)} → **${m.emoji} ${m.label}**`),
          ],
          flags: V2_EPHEMERAL,
          allowedMentions: { parse: [] },
        } as any);
      },
    };

    // ───────── /autoresponder-placeholders ─────────
    const placeholdersCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-placeholders')
        .setDescription('Xem các biến có thể dùng trong nội dung phản hồi'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const group = (title: string, items: [string, string][]) =>
          txt(`### ${title}\n` + items.map(([k, v]) => `${code(k)} — ${v}`).join('\n'));

        const container = new ContainerBuilder().addTextDisplayComponents(
            txt('## 📝 Autoresponder Placeholders'),
            txt('-# Dùng các biến này trong nội dung trả lời'),
          )
          .addSeparatorComponents(sep(true))
          .addTextDisplayComponents(
            group(`${emojis.user} Người dùng`, [
              ['{user}', 'Username'],
              ['{user.mention}', 'Mention người dùng'],
              ['{user.id}', 'User ID'],
              ['{user.name}', 'Username'],
              ['{user.displayname}', 'Tên hiển thị'],
            ]),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            group('🏠 Server', [
              ['{server}', 'Tên server'],
              ['{server.name}', 'Tên server'],
            ]),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            group(`${emojis.message} Kênh & Tin nhắn`, [
              ['{channel}', 'Tên kênh'],
              ['{channel.name}', 'Tên kênh'],
              ['{message}', 'Nội dung tin nhắn'],
              ['{message.content}', 'Nội dung tin nhắn'],
            ]),
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(txt('-# Ví dụ: Welcome {user.mention} to {server}!'));

        await interaction.reply({ components: [container], flags: V2_EPHEMERAL } as any);
      },
    };

    this.commands.set('autoresponder-add', addCommand);
    this.commands.set('autoresponder-edit', editCommand);
    this.commands.set('autoresponder-toggle', toggleCommand);
    this.commands.set('autoresponder-remove', removeCommand);
    this.commands.set('autoresponder-list', listCommand);
    this.commands.set('autoresponder-view', viewCommand);
    this.commands.set('autoresponder-matchmode', matchmodeCommand);
    this.commands.set('autoresponder-placeholders', placeholdersCommand);
  }

  private registerEvents() {
    // Menu chọn trong /autoresponder-list -> xem chi tiết
    this.client.on('interactionCreate', async interaction => {
      if (!interaction.isStringSelectMenu() || interaction.customId !== 'ar_view' || !interaction.guildId) return;

      try {
        const list = autoresponderManager.getAll(interaction.guildId);
        const ar = list[Number(interaction.values[0])];

        await interaction.reply({
          components: [
            ar
              ? detailCard(ar, `${emojis.search} Chi tiết Autoresponder`)
              : errorCard('Không tìm thấy autoresponder này (danh sách có thể đã thay đổi). Hãy dùng lại `/autoresponder-list`.'),
          ],
          flags: V2_EPHEMERAL,
          allowedMentions: { parse: [] },
        } as any);
      } catch (error) {
        console.error('Autoresponder select error:', error);
      }
    });

    // Message listener for autoresponder
    this.client.on('messageCreate', async message => {
      // Ignore bots and DMs
      if (message.author.bot || !message.guild) return;

      // Check for autoresponder match
      const response = autoresponderManager.checkMessage(
        message.guild.id,
        message.content,
        message.channelId,
        message.author.id,
      );
      if (!response) return;

      // Replace placeholders
      const finalResponse = autoresponderManager.replacePlaceholders(response, {
        userId: message.author.id,
        username: message.author.username,
        displayName: message.member?.displayName || message.author.username,
        guildName: message.guild.name,
        channelName: (message.channel as any).name || 'Unknown',
        messageContent: message.content,
      });

      try {
        await message.reply({
          content: finalResponse.slice(0, 2000),
          // Chỉ cho phép ping user (vd {user.mention}); chặn @everyone/@here và role
          allowedMentions: { parse: ['users'], repliedUser: false },
        });
      } catch (error) {
        console.error('Autoresponder error:', error);
      }
    });
  }

  async cleanup() {
    console.log('🧹 Autoresponder module cleanup');
  }
}
