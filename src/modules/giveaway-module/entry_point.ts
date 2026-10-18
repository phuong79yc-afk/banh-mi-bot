// Giveaway Module - Entry Point (Components V2)

import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  escapeMarkdown,
} from 'discord.js';
import { giveawayManager } from './GiveawayManager';
import { emojis } from '../../config/emojis';

// ==================== COMPONENTS V2 HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const V2_EPH = (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) as any;
const NO_PING = { parse: [] as never[] };

const txt = (content: string) => new TextDisplayBuilder().setContent(content);
const sep = () => new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
const card = (color: number, ...texts: string[]) =>
  new ContainerBuilder().addTextDisplayComponents(...texts.map(txt));
const notice = (content: string, color = 0xed4245) => card(color, content);

const GREEN = 0x57f287;
const ORANGE = 0xfaa61a;

export default class GiveawayModule {
  name = 'giveaway-module';
  description = 'Giveaway System';
  version = '1.1.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('🎁 Giveaway module initialized (Components V2)');
    this.registerCommands();
    this.registerEvents();
    this.scheduleActiveGiveaways();
    console.log(`✅ Giveaway module registered ${this.commands.size} commands`);
  }

  // Schedule tất cả giveaway đang active
  private scheduleActiveGiveaways() {
    const active = giveawayManager.getAllActive();
    let scheduled = 0;

    active.forEach((giveaway) => {
      const timeLeft = giveaway.endsAt - Date.now();
      if (timeLeft > 0) {
        setTimeout(() => this.endGiveaway(giveaway.id), timeLeft);
        scheduled++;
      } else {
        // Giveaway đã quá hạn nhưng chưa kết thúc
        this.endGiveaway(giveaway.id);
      }
    });

    if (scheduled > 0) {
      console.log(`⏰ Scheduled ${scheduled} active giveaway(s)`);
    }
  }

  private registerCommands() {
    // /giveaway-create
    const createCommand = {
      data: new SlashCommandBuilder()
        .setName('giveaway-create')
        .setDescription('Tạo giveaway với phần thưởng và thời gian')
        .addStringOption((option) =>
          option.setName('prize').setDescription('Phần thưởng').setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('duration')
            .setDescription('Thời gian (phút)')
            .setRequired(true)
            .setMinValue(1)
        )
        .addIntegerOption((option) =>
          option
            .setName('winners')
            .setDescription('Số người thắng')
            .setRequired(true)
            .setMinValue(1)
        )
        .addChannelOption((option) =>
          option.setName('channel').setDescription('� Kênh đăng giveaway').setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const prize = interaction.options.getString('prize', true);
        const duration = interaction.options.getInteger('duration', true);
        const winners = interaction.options.getInteger('winners', true);
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        if (!channel || !('send' in channel)) {
          return interaction.reply({
            components: [notice(`${emojis.error} Kênh không hợp lệ!`)],
            flags: V2_EPH,
          });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const endsAt = Date.now() + duration * 60 * 1000;
        const giveawayId = `${interaction.guildId}_${Date.now()}`;

        try {
          // Tạo embed giveaway
          const giveawayEmbed = new ContainerBuilder().addTextDisplayComponents(
              txt(`## 🎉 GIVEAWAY: ${escapeMarkdown(prize)}`),
              txt(
                `🎁 **Phần thưởng:** ${escapeMarkdown(prize)}\n` +
                  `🏆 **Người thắng:** ${winners} người\n` +
                  `⏰ **Kết thúc:** <t:${Math.floor(endsAt / 1000)}:R>\n` +
                  `👤 **Host:** ${interaction.user}`
              )
            )
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`### 🎊 Bấm nút bên dưới để tham gia!`))
            .addActionRowComponents(
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(`giveaway_enter_${giveawayId}`)
                  .setLabel('Tham gia giveaway')
                  .setEmoji('🎉')
                  .setStyle(ButtonStyle.Success)
              )
            );

          const message = await (channel as any).send({
            components: [giveawayEmbed],
            flags: V2,
            allowedMentions: NO_PING,
          } as any);

          // Lưu giveaway
          giveawayManager.create({
            id: giveawayId,
            guildId: interaction.guildId!,
            channelId: channel.id,
            messageId: message.id,
            prize,
            hostId: interaction.user.id,
            winners,
            entries: [],
            endsAt,
            ended: false,
          });

          // Schedule kết thúc
          setTimeout(() => this.endGiveaway(giveawayId), duration * 60 * 1000);

          await interaction.editReply({
            components: [
              new ContainerBuilder().addTextDisplayComponents(
                  txt(`## ${emojis.success} Giveaway đã được tạo!`),
                  txt(
                    `🎁 **${escapeMarkdown(prize)}**\n` +
                      `📺 Kênh: ${channel}\n` +
                      `⏰ Kết thúc: <t:${Math.floor(endsAt / 1000)}:R>`
                  )
                )
                .addSeparatorComponents(sep())
                .addTextDisplayComponents(txt(`-# ID: ${giveawayId}`)),
            ],
            flags: V2,
          });
        } catch (error: any) {
          await interaction.editReply({
            components: [notice(`${emojis.error} Lỗi: ${error.message}`)],
            flags: V2,
          });
        }
      },
    };

    // /giveaway-end
    const endCommand = {
      data: new SlashCommandBuilder()
        .setName('giveaway-end')
        .setDescription('� Kết thúc giveaway sớm')
        .addStringOption((option) =>
          option.setName('giveaway-id').setDescription('� ID của giveaway').setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const giveawayId = interaction.options.getString('giveaway-id', true).trim();
        const giveaway = giveawayManager.get(giveawayId);

        if (!giveaway) {
          return interaction.reply({
            components: [notice(`${emojis.error} Không tìm thấy giveaway với ID này!`)],
            flags: V2_EPH,
          });
        }

        if (giveaway.ended) {
          return interaction.reply({
            components: [notice(`${emojis.warning} Giveaway này đã kết thúc rồi!`, ORANGE)],
            flags: V2_EPH,
          });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
          await this.endGiveaway(giveawayId);
          await interaction.editReply({
            components: [
              card(GREEN, `## ${emojis.success} Đã kết thúc giveaway`, `🎁 **${escapeMarkdown(giveaway.prize)}**`),
            ],
            flags: V2,
          });
        } catch (error: any) {
          await interaction.editReply({
            components: [notice(`${emojis.error} Lỗi: ${error.message}`)],
            flags: V2,
          });
        }
      },
    };

    // /giveaway-reroll
    const rerollCommand = {
      data: new SlashCommandBuilder()
        .setName('giveaway-reroll')
        .setDescription('Chọn lại người thắng ngẫu nhiên')
        .addStringOption((option) =>
          option.setName('giveaway-id').setDescription('� ID của giveaway').setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const giveawayId = interaction.options.getString('giveaway-id', true).trim();
        const giveaway = giveawayManager.get(giveawayId);

        if (!giveaway) {
          return interaction.reply({
            components: [notice(`${emojis.error} Không tìm thấy giveaway với ID này!`)],
            flags: V2_EPH,
          });
        }

        if (!giveaway.ended) {
          return interaction.reply({
            components: [notice(`${emojis.warning} Giveaway này chưa kết thúc!`, ORANGE)],
            flags: V2_EPH,
          });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
          const winners = giveawayManager.pickWinners(giveawayId);

          if (winners.length === 0) {
            return interaction.editReply({
              components: [notice(`${emojis.warning} Không có người tham gia nào!`, ORANGE)],
              flags: V2,
            });
          }

          giveawayManager.end(giveawayId, winners);

          const channel = await this.client.channels.fetch(giveaway.channelId);
          if (channel?.isTextBased() && 'send' in channel) {
            await (channel as any).send({
              components: [
                new ContainerBuilder().addTextDisplayComponents(
                    txt(`## 🔄 GIVEAWAY REROLL`),
                    txt(`🎁 **${escapeMarkdown(giveaway.prize)}**`)
                  )
                  .addSeparatorComponents(sep())
                  .addTextDisplayComponents(
                    txt(`### 🎊 Người thắng mới:`),
                    txt(winners.map((id) => `<@${id}>`).join('\n'))
                  )
                  .addSeparatorComponents(sep())
                  .addTextDisplayComponents(txt(`-# Chúc mừng các bạn! 🎉`)),
              ],
              flags: V2,
            } as any);
          }

          await interaction.editReply({
            components: [
              card(
                GREEN,
                `## ${emojis.success} Đã chọn lại người thắng`,
                `🎁 **${escapeMarkdown(giveaway.prize)}**\n🏆 ${winners.length} người thắng mới`
              ),
            ],
            flags: V2,
          });
        } catch (error: any) {
          await interaction.editReply({
            components: [notice(`${emojis.error} Lỗi: ${error.message}`)],
            flags: V2,
          });
        }
      },
    };

    // /giveaway-list
    const listCommand = {
      data: new SlashCommandBuilder()
        .setName('giveaway-list')
        .setDescription('Xem tất cả giveaways đang chạy')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const giveaways = giveawayManager.getAllGuild(interaction.guildId!);

        if (giveaways.length === 0) {
          return interaction.reply({
            components: [
              card(
                ORANGE,
                `## ${emojis.warning} Chưa có giveaway nào`,
                `-# Dùng \`/giveaway-create\` để tạo giveaway đầu tiên`
              ),
            ],
            flags: V2_EPH,
          });
        }

        const active = giveaways.filter((g) => !g.ended && g.endsAt > Date.now());
        const ended = giveaways.filter((g) => g.ended || g.endsAt <= Date.now());

        const lines: string[] = [];

        if (active.length > 0) {
          lines.push(`### 🟢 Đang chạy (${active.length})`);
          active.forEach((g) => {
            lines.push(
              `**${escapeMarkdown(g.prize)}**\n` +
                `└ ${g.entries.length} người • <t:${Math.floor(g.endsAt / 1000)}:R> • \`${g.id}\``
            );
          });
        }

        if (ended.length > 0) {
          if (lines.length > 0) lines.push('');
          lines.push(`### 🔴 Đã kết thúc (${ended.length})`);
          ended.slice(0, 5).forEach((g) => {
            lines.push(
              `**${escapeMarkdown(g.prize)}**\n` +
                `└ ${g.winnerIds?.length || 0} người thắng • \`${g.id}\``
            );
          });
          if (ended.length > 5) lines.push(`-# ... và ${ended.length - 5} giveaway khác`);
        }

        await interaction.reply({
          components: [
            new ContainerBuilder().addTextDisplayComponents(txt(`## 🎁 Danh sách Giveaway`))
              .addSeparatorComponents(sep())
              .addTextDisplayComponents(txt(lines.join('\n'))),
          ],
          flags: V2_EPH,
        });
      },
    };

    // /giveaway-delete
    const deleteCommand = {
      data: new SlashCommandBuilder()
        .setName('giveaway-delete')
        .setDescription('Xóa giveaway và hủy hoàn toàn')
        .addStringOption((option) =>
          option.setName('giveaway-id').setDescription('� ID của giveaway').setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const giveawayId = interaction.options.getString('giveaway-id', true).trim();
        const giveaway = giveawayManager.get(giveawayId);

        if (!giveaway) {
          return interaction.reply({
            components: [notice(`${emojis.error} Không tìm thấy giveaway với ID này!`)],
            flags: V2_EPH,
          });
        }

        const deleted = giveawayManager.delete(giveawayId);

        if (deleted) {
          return interaction.reply({
            components: [
              card(GREEN, `## ${emojis.success} Đã xóa giveaway`, `🎁 **${escapeMarkdown(giveaway.prize)}**`),
            ],
            flags: V2_EPH,
          });
        }

        return interaction.reply({
          components: [notice(`${emojis.error} Không thể xóa giveaway!`)],
          flags: V2_EPH,
        });
      },
    };

    this.commands.set('giveaway-create', createCommand);
    this.commands.set('giveaway-end', endCommand);
    this.commands.set('giveaway-reroll', rerollCommand);
    this.commands.set('giveaway-list', listCommand);
    this.commands.set('giveaway-delete', deleteCommand);

    // /giveaway-migrate
    const migrateCommand = {
      data: new SlashCommandBuilder()
        .setName('giveaway-migrate')
        .setDescription('Chuyển giveaway sang server khác')
        .addStringOption((option) =>
          option
            .setName('target-guild-id')
            .setDescription('� ID server đích')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const targetGuildId = interaction.options.getString('target-guild-id', true).trim();

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const reply = (container: ContainerBuilder) =>
          interaction.editReply({ components: [container], flags: V2, allowedMentions: NO_PING });

        if (targetGuildId === interaction.guildId) {
          return reply(notice(`${emojis.warning} Server đích trùng với server hiện tại.`, ORANGE));
        }

        try {
          const targetGuild = await this.client.guilds.fetch(targetGuildId);
          const migrated = giveawayManager.migrateToGuild(interaction.guildId!, targetGuildId);

          if (migrated === 0) {
            return reply(notice(`${emojis.warning} Không có giveaway nào để chuyển từ **${escapeMarkdown(interaction.guild!.name)}**.`, ORANGE));
          }

          await reply(
            new ContainerBuilder().addTextDisplayComponents(
                txt(`## ${emojis.success} Chuyển giveaway thành công`),
                txt(`**${migrated}** giveaway đã được chuyển`)
              )
              .addSeparatorComponents(sep())
              .addTextDisplayComponents(
                txt(
                  `🏠 **${escapeMarkdown(interaction.guild!.name)}**\n` +
                    `⬇️\n` +
                    `🏠 **${escapeMarkdown(targetGuild.name)}**`
                ),
                txt(`-# <t:${Math.floor(Date.now() / 1000)}:R>`)
              )
          );
        } catch (error: any) {
          // 10004 = Unknown Guild (bot không ở server đó hoặc ID sai)
          if (error?.code === 10004) {
            await reply(notice(`${emojis.error} Bot không ở trong server đó (hoặc ID không đúng)!`));
            return;
          }

          await reply(
            notice(`${emojis.error} Lỗi: ${error instanceof Error ? error.message : 'Không thể chuyển giveaway'}`)
          );
        }
      }
    };

    this.commands.set('giveaway-migrate', migrateCommand);
  }

  // Method để kết thúc giveaway
  private async endGiveaway(giveawayId: string) {
    const giveaway = giveawayManager.get(giveawayId);
    if (!giveaway || giveaway.ended) return;

    const winners = giveawayManager.pickWinners(giveawayId);
    giveawayManager.end(giveawayId, winners);

    try {
      const channel = await this.client.channels.fetch(giveaway.channelId);
      if (!channel?.isTextBased() || !('send' in channel)) return;

      const message = await channel.messages.fetch(giveaway.messageId);

      // Update message gốc
      await message.edit({
        components: [
          new ContainerBuilder().addTextDisplayComponents(
              txt(`## 🎉 GIVEAWAY: ${escapeMarkdown(giveaway.prize)}`),
              txt(
                `🎁 **Phần thưởng:** ${escapeMarkdown(giveaway.prize)}\n` +
                  `🏆 **Người thắng:** ${giveaway.winners} người\n` +
                  `👤 **Host:** <@${giveaway.hostId}>\n` +
                  `👥 **Tham gia:** ${giveaway.entries.length} người`
              )
            )
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(txt(`### ✅ Giveaway đã kết thúc!`)),
        ],
        flags: V2,
      } as any);

      // Gửi thông báo người thắng
      if (winners.length > 0) {
        await (channel as any).send({
          components: [
            new ContainerBuilder().addTextDisplayComponents(
                txt(`## 🎊 GIVEAWAY KẾT THÚC!`),
                txt(`🎁 **${escapeMarkdown(giveaway.prize)}**`)
              )
              .addSeparatorComponents(sep())
              .addTextDisplayComponents(
                txt(`### 🏆 Người thắng:\n${winners.map((id) => `<@${id}>`).join('\n')}`)
              )
              .addSeparatorComponents(sep())
              .addTextDisplayComponents(txt(`-# Chúc mừng các bạn! Hãy liên hệ <@${giveaway.hostId}> để nhận thưởng 🎉`)),
          ],
          flags: V2,
        } as any);
      } else {
        await (channel as any).send({
          components: [
            card(
              ORANGE,
              `## ${emojis.warning} Giveaway kết thúc`,
              `🎁 **${escapeMarkdown(giveaway.prize)}**\n-# Không có người tham gia nào!`
            ),
          ],
          flags: V2,
        } as any);
      }
    } catch (error) {
      console.error(`❌ Error ending giveaway ${giveawayId}:`, error);
    }
  }

  private registerEvents() {
    // Button interaction handler for giveaway entries
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      const id = interaction.customId;

      // ---------- Tham gia ----------
      if (id.startsWith('giveaway_enter_')) {
        const giveawayId = id.replace('giveaway_enter_', '');
        const giveaway = giveawayManager.get(giveawayId);

        const reject = (message: string) =>
          interaction.reply({ components: [notice(message)], flags: V2_EPH, allowedMentions: NO_PING });

        if (!giveaway) return reject(`${emojis.error} Giveaway này không còn tồn tại!`);
        if (giveaway.ended) return reject(`${emojis.error} Giveaway này đã kết thúc!`);
        if (Date.now() > giveaway.endsAt) return reject(`${emojis.error} Giveaway này đã hết hạn!`);

        const added = giveawayManager.addEntry(giveawayId, interaction.user.id);

        const prize = escapeMarkdown(giveaway.prize);
        const ends = `<t:${Math.floor(giveaway.endsAt / 1000)}:R>`;
        const count = giveaway.entries.length;

        if (added) {
          return interaction.reply({
            components: [
              card(
                GREEN,
                `### 🎉 Đã tham gia!\nBạn đã vào giveaway **${prize}**.`,
                `-# ${count} người tham gia • kết thúc ${ends}`
              ),
            ],
            flags: V2_EPH,
            allowedMentions: NO_PING,
          });
        }

        // Đã tham gia rồi: cho phép rút nếu muốn
        return interaction.reply({
          components: [
            card(
              ORANGE,
              `### ${emojis.warning} Bạn đã tham gia rồi\nGiveaway **${prize}**.`,
              `-# ${count} người tham gia • kết thúc ${ends}`
            ).addActionRowComponents(
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(`giveaway_leave_${giveawayId}`)
                  .setLabel('Rút khỏi giveaway')
                  .setEmoji('🚪')
                  .setStyle(ButtonStyle.Secondary)
              )
            ),
          ],
          flags: V2_EPH,
          allowedMentions: NO_PING,
        });
      }

      // ---------- Rút khỏi giveaway ----------
      if (id.startsWith('giveaway_leave_')) {
        const giveawayId = id.replace('giveaway_leave_', '');
        const giveaway = giveawayManager.get(giveawayId);

        if (!giveaway || giveaway.ended || Date.now() > giveaway.endsAt) {
          return interaction.update({
            components: [notice(`${emojis.error} Giveaway đã kết thúc, không thể rút nữa.`)],
            flags: V2,
          });
        }

        const removed = giveawayManager.removeEntry(giveawayId, interaction.user.id);

        return interaction.update({
          components: [
            removed
              ? card(
                  ORANGE,
                  `### 👋 Đã rút khỏi giveaway\n**${escapeMarkdown(giveaway.prize)}**`,
                  `-# Còn ${giveaway.entries.length} người tham gia • bấm lại nút ở giveaway nếu muốn vào lại`
                )
              : notice(`${emojis.warning} Bạn chưa tham gia giveaway này.`, ORANGE),
          ],
          flags: V2,
        });
      }
    });
  }

  async cleanup() {
    console.log('🧹 Giveaway module cleanup...');
  }
}

