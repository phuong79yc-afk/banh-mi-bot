// Snipe Module - Entry Point (Components V2)

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  PartialMessage,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
} from 'discord.js';
import { snipeManager } from './SnipeManager';
import { emojis } from '../../config/emojis';

// ==================== COMPONENTS V2 HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const V2_EPH = (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any;
const NO_PING = { parse: [] as never[] };

const txt = (content: string) => new TextDisplayBuilder().setContent(content);
const sep = () => new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
const notice = (content: string, color = 0xed4245) =>
  new ContainerBuilder().addTextDisplayComponents(txt(content));

const isImage = (url: string) => /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url);

// Trích dẫn nhiều dòng, cắt bớt nếu quá dài
const quote = (s: string | undefined, max = 1200) => {
  const t = s?.trim() || '*Không có nội dung chữ*';
  const cut = t.length > max ? `${t.slice(0, max)}…` : t;
  return cut.split('\n').map((l) => `> ${l}`).join('\n');
};

type Kind = 'delete' | 'edit';

// ==================== BUILD SNIPE CARD ====================
async function buildCard(client: Client, kind: Kind, channelId: string, page: number, disabled = false) {
  const isDel = kind === 'delete';
  const list: any[] = isDel ? snipeManager.getDeleted(channelId, page) : snipeManager.getEdited(channelId, page);
  const count: number = isDel ? snipeManager.getDeletedCount(channelId) : snipeManager.getEditedCount(channelId);
  const msg = list[0];

  if (!msg) return null;

  const total = Math.max(1, Math.min(count, 10));
  const ts = Math.floor(((isDel ? msg.deletedAt : msg.editedAt) || 0) / 1000);
  const user = await client.users.fetch(msg.authorId).catch(() => null);

  const header = [
    txt(`## ${isDel ? emojis.delete : emojis.edit} ${isDel ? 'Tin nhắn đã xóa' : 'Tin nhắn đã sửa'}`),
    txt(`<#${channelId}> • <t:${ts}:R>\n👤 **<@${msg.authorId}>** · ${msg.authorUsername}`),
  ];

  const card = new ContainerBuilder();

  if (user) {
    card.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(...header)
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(user.displayAvatarURL({ size: 128 })))
    );
  } else {
    card.addTextDisplayComponents(...header);
  }

  card.addSeparatorComponents(sep());

  if (isDel) {
    card.addTextDisplayComponents(txt(`**Nội dung**\n${quote(msg.content)}`));

    // Đính kèm: ảnh hiện thẳng trong thẻ, tệp khác hiện dạng link
    const urls: string[] = msg.attachments ?? [];
    const images = urls.filter(isImage).slice(0, 4);
    const links = urls.filter((u) => !images.includes(u));

    if (images.length) {
      card.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(...images.map((u) => new MediaGalleryItemBuilder().setURL(u)))
      );
    }

    if (links.length) {
      card.addTextDisplayComponents(txt(links.map((u, i) => `📎 [Tệp đính kèm ${i + 1}](${u})`).join('\n')));
    }
  } else {
    card.addTextDisplayComponents(
      txt(`**Trước khi sửa**\n${quote(msg.editedFrom)}`),
      txt(`**Sau khi sửa**\n${quote(msg.content)}`)
    );
  }

  card.addSeparatorComponents(sep());

  // Nút chuyển trang (chỉ hiện khi có nhiều hơn 1 tin)
  if (total > 1) {
    card.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('snipe:prev')
          .setLabel('◀ Trước')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled || page <= 1),
        new ButtonBuilder()
          .setCustomId('snipe:page')
          .setLabel(`${page}/${total}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('snipe:next')
          .setLabel('Sau ▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled || page >= total)
      )
    );
  }

  card.addTextDisplayComponents(txt(`-# Trang ${page}/${total} • ID: ${msg.messageId}`));

  return { card, total };
}

// ==================== COMMAND RUNNER ====================
async function runSnipe(interaction: ChatInputCommandInteraction, kind: Kind) {
  const page = interaction.options.getInteger('page') || 1;
  const channel = interaction.options.getChannel('channel');
  const channelId = channel?.id || interaction.channelId;

  const what = kind === 'delete' ? 'đã xóa' : 'đã sửa';

  const built = await buildCard(interaction.client, kind, channelId, page);

  if (!built) {
    return interaction.reply({
      components: [
        notice(
          page === 1
            ? `Không có tin nhắn ${what} nào gần đây ở <#${channelId}> trong 28 ngày qua.`
            : `Không có tin nhắn nào ở trang **${page}**.`,
          0xfaa61a
        ),
      ],
      flags: V2_EPH,
      allowedMentions: NO_PING,
    });
  }

  await interaction.reply({ components: [built.card], flags: V2_EPH, allowedMentions: NO_PING });

  if (built.total <= 1) return;

  // Chuyển trang bằng nút
  let current = page;
  const reply = await interaction.fetchReply();
  const collector = reply.createMessageComponentCollector({ time: 300_000 });

  collector.on('collect', async (i) => {
    if (i.customId === 'snipe:prev') current = Math.max(1, current - 1);
    else if (i.customId === 'snipe:next') current += 1;
    else return;

    const next = await buildCard(interaction.client, kind, channelId, current);
    if (!next) {
      await i.deferUpdate().catch(() => {});
      return;
    }

    await i.update({ components: [next.card], flags: V2, allowedMentions: NO_PING });
  });

  // Hết giờ: khóa nút
  collector.on('end', async () => {
    const last = await buildCard(interaction.client, kind, channelId, current, true);
    if (last) {
      await interaction
        .editReply({ components: [last.card], flags: V2, allowedMentions: NO_PING })
        .catch(() => {});
    }
  });
}

export default class SnipeModule {
  name = 'snipe-module';
  description = 'Snipe - Track deleted and edited messages';
  version = '1.1.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('👀 Snipe module initialized (Components V2)');
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Snipe module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /snipe
    const snipeCommand = {
      data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Xem tin nhắn đã xóa gần đây')
        .addIntegerOption((option) =>
          option
            .setName('page')
            .setDescription('� Số trang (1-10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('� Chọn kênh')
            .setRequired(false)
        ),
      execute: (interaction: ChatInputCommandInteraction) => runSnipe(interaction, 'delete'),
    };

    // /editsnipe
    const editsnipeCommand = {
      data: new SlashCommandBuilder()
        .setName('editsnipe')
        .setDescription('Xem tin nhắn đã chỉnh sửa gần đây')
        .addIntegerOption((option) =>
          option
            .setName('page')
            .setDescription('� Số trang (1-10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('� Chọn kênh')
            .setRequired(false)
        ),
      execute: (interaction: ChatInputCommandInteraction) => runSnipe(interaction, 'edit'),
    };

    this.commands.set('snipe', snipeCommand);
    this.commands.set('editsnipe', editsnipeCommand);
  }

  private registerEvents() {
    // Message delete handler
    this.client.on('messageDelete', async (message: Message | PartialMessage) => {
      // Ignore bots, DMs, and partial messages without content
      if (!message.guild || message.author?.bot) return;
      if (!message.content && message.attachments.size === 0) return;

      const attachments = Array.from(message.attachments.values()).map((a) => a.url);

      snipeManager.addDeleted(
        message.id,
        message.channel.id,
        message.guild.id,
        message.author?.id || 'Unknown',
        message.author?.username || 'Unknown',
        message.content || '',
        attachments,
        message.createdTimestamp
      );
    });

    // Message edit handler
    this.client.on('messageUpdate', async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
      // Ignore bots, DMs, and partial messages
      if (!newMessage.guild || newMessage.author?.bot) return;
      if (!oldMessage.content || !newMessage.content) return;

      // Ignore if content didn't change
      if (oldMessage.content === newMessage.content) return;

      const attachments = Array.from(newMessage.attachments.values()).map((a) => a.url);

      snipeManager.addEdited(
        newMessage.id,
        newMessage.channel.id,
        newMessage.guild.id,
        newMessage.author?.id || 'Unknown',
        newMessage.author?.username || 'Unknown',
        oldMessage.content,
        newMessage.content,
        attachments,
        newMessage.createdTimestamp
      );
    });
  }

  async cleanup() {
    console.log('🧹 Snipe module cleanup');
  }
}

