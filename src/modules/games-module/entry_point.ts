// Games Module - Entry Point (Components V2)
import {
  Client,
  Collection,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Message,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  escapeMarkdown,
} from 'discord.js';
import { gtnManager } from './GuessTheNumberManager';
import { emojis } from '../../config/emojis';

// ==================== COMPONENTS V2 HELPERS ====================
const V2 = MessageFlags.IsComponentsV2;
const V2_EPH = [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] as const;
const NO_PING = { parse: [] as never[] };

const txt = (content: string) => new TextDisplayBuilder().setContent(content);
const sep = () => new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);

const PALETTE = [0x5865f2, 0x57f287, 0xfee75c, 0xeb459e, 0x3498db];
const randomColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

export default class GamesModule {
  name = 'games-module';
  description = 'Games - Fun games like Guess The Number';
  version = '1.1.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('🎮 Games module initialized');
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Games module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /gtn-start (Guess The Number)
    const gtnCommand = {
      data: new SlashCommandBuilder()
        .setName('gtn-start')
        .setDescription('Bắt đầu trò chơi đoán số cùng thành viên trong kênh')
        .addIntegerOption((option) =>
          option
            .setName('rounds')
            .setDescription('Số vòng chơi (1–10)')
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addIntegerOption((option) =>
          option
            .setName('duration')
            .setDescription('Thời gian mỗi vòng tính bằng giây (30–300)')
            .setMinValue(30)
            .setMaxValue(300)
        )
        .addIntegerOption((option) =>
          option
            .setName('range')
            .setDescription('Số lớn nhất có thể xuất hiện (10–1000)')
            .setMinValue(10)
            .setMaxValue(1000)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const channelId = interaction.channelId;

        // Check if game already running
        if (gtnManager.hasGame(channelId)) {
          return interaction.reply({
            components: [
              new ContainerBuilder()
                .addTextDisplayComponents(
                  txt(`${emojis.error} Kênh này đang có một ván chơi rồi! Chờ ván đó kết thúc nhé.`)
                ),
            ],
            flags: V2_EPH,
          });
        }

        const rounds = interaction.options.getInteger('rounds') || 1;
        const duration = interaction.options.getInteger('duration') || 60;
        const range = interaction.options.getInteger('range') || 100;

        // Start game
        const game = gtnManager.startGame(
          channelId,
          interaction.guildId!,
          interaction.user.id,
          rounds,
          duration,
          1,
          range
        );

        const endsAt = Math.floor(Date.now() / 1000) + game.duration;

        const startCard = new ContainerBuilder()
          .addTextDisplayComponents(
            txt('## 🎮 Đoán Số'),
            txt(
              `Mình đang nghĩ một số từ **${game.minRange}** đến **${game.maxRange}**!\n` +
                `Gõ số bạn đoán vào kênh này, ai đoán đúng đầu tiên sẽ thắng!`
            )
          )
          .addSeparatorComponents(sep())
          .addTextDisplayComponents(
            txt(
              `⏱️ **${game.duration}** giây  •  🎯 **${game.minRange}–${game.maxRange}**  •  ` +
                `${emojis.refresh} Vòng **${game.currentRound}/${game.rounds}**`
            ),
            txt(
              `-# ⬆️ = số cần tìm lớn hơn · ⬇️ = nhỏ hơn\n` +
                `-# Bắt đầu bởi ${escapeMarkdown(interaction.user.username)} • hết giờ <t:${endsAt}:R>`
            )
          );

        await interaction.reply({ components: [startCard], flags: V2, allowedMentions: NO_PING });

        // Set auto-end timeout
        gtnManager.setAutoEnd(channelId, async () => {
          const endedGame = gtnManager.endGame(channelId);
          if (!endedGame) return;

          const stats = gtnManager.getStats(endedGame);

          const endCard = new ContainerBuilder()
            .addTextDisplayComponents(
              txt(`## ${emojis.clock} Hết giờ!`),
              txt(`Không ai đoán đúng số.\nSố cần tìm là: **${endedGame.targetNumber}**`)
            )
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(
                `${emojis.chart} **${stats.totalGuesses}** lượt đoán  •  ` +
                  `${emojis.users} **${stats.totalParticipants}** người chơi  •  ` +
                  `⏱️ **${stats.elapsedTime}s**`
              )
            );

          try {
            const channel = await this.client.channels.fetch(channelId);
            if (channel && 'send' in channel && typeof channel.send === 'function') {
              await channel.send({ components: [endCard], flags: V2, allowedMentions: NO_PING });
            }
          } catch (error) {
            console.error('Error sending game end message:', error);
          }
        });
      },
    };

    this.commands.set('gtn-start', gtnCommand);
  }

  private registerEvents() {
    // Message handler for guesses
    this.client.on('messageCreate', async (message: Message) => {
      // Ignore bots and DMs
      if (message.author.bot || !message.guild) return;

      const game = gtnManager.getGame(message.channelId);
      if (!game) return;

      // Check if message is a number
      const guess = parseInt(message.content.trim());
      if (isNaN(guess)) return;

      // Make guess
      const result = gtnManager.makeGuess(
        message.channelId,
        message.author.id,
        message.author.username,
        guess
      );

      if (result.result === 'invalid') {
        return; // Silently ignore invalid guesses
      }

      try {
        if (result.result === 'correct') {
          // Winner!
          const stats = gtnManager.getStats(result.game!);

          const winCard = new ContainerBuilder()
            .addTextDisplayComponents(
              txt('## 🎉 Có người thắng rồi!'),
              txt(`${emojis.trophy} <@${message.author.id}> đã đoán đúng số **${guess}**!`)
            )
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(
              txt(
                `🎯 **${result.game!.winnerAttempts}** lần đoán  •  ⏱️ **${stats.elapsedTime}s**\n` +
                  `${emojis.chart} **${stats.totalGuesses}** lượt đoán  •  ` +
                  `${emojis.users} **${stats.totalParticipants}** người chơi  •  ` +
                  `📈 TB **${stats.avgAttempts}** lượt/người`
              )
            );

          await message.reply({ components: [winCard], flags: V2, allowedMentions: NO_PING });

          // End game
          gtnManager.endGame(message.channelId);
        } else if (result.result === 'too_low') {
          await message.react('⬆️');
        } else if (result.result === 'too_high') {
          await message.react('⬇️');
        }
      } catch (error) {
        console.error('Error handling guess:', error);
      }
    });
  }

  async cleanup() {
    console.log('🧹 Games module cleanup');
  }
}

