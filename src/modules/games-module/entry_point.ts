// Games Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  Message
} from 'discord.js';
import { gtnManager } from './GuessTheNumberManager';
import { createEnhancedEmbed } from '../../utils/embedHelper';

export default class GamesModule {
  name = 'games-module';
  description = 'Games - Fun games like Guess The Number';
  version = '1.0.0';
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
        .setDescription('Bắt đầu trò chơi Đoán Số')
        .addIntegerOption(option =>
          option
            .setName('rounds')
            .setDescription('Số vòng chơi (1-10)')
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addIntegerOption(option =>
          option
            .setName('duration')
            .setDescription('Thời gian mỗi vòng (30-300 giây)')
            .setMinValue(30)
            .setMaxValue(300)
        )
        .addIntegerOption(option =>
          option
            .setName('range')
            .setDescription('Phạm vi số tối đa (10-1000)')
            .setMinValue(10)
            .setMaxValue(1000)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const channelId = interaction.channelId;

        // Check if game already running
        if (gtnManager.hasGame(channelId)) {
          return interaction.reply({
            content: '❌ A game is already running in this channel! Wait for it to finish.',
            flags: 64
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

        const embed = createEnhancedEmbed({
          title: '🎮 Guess The Number - Game Started!',
          description: `I'm thinking of a number between **${game.minRange}** and **${game.maxRange}**!\n\n` +
            `Type your guess in the chat to play.\n` +
            `First person to guess correctly wins!`,
          color: 'random',
          fields: [
            { name: '⏱️ Duration', value: `${game.duration} seconds`, inline: true },
            { name: '🎯 Range', value: `${game.minRange}-${game.maxRange}`, inline: true },
            { name: '🔄 Rounds', value: `${game.currentRound}/${game.rounds}`, inline: true }
          ],
          footer: `Started by ${interaction.user.username}`,
        });

        await interaction.reply({ embeds: [embed] });

        // Set auto-end timeout
        gtnManager.setAutoEnd(channelId, async () => {
          const endedGame = gtnManager.endGame(channelId);
          if (!endedGame) return;

          const stats = gtnManager.getStats(endedGame);

          const endEmbed = createEnhancedEmbed({
            title: '⏰ Time\'s Up!',
            description: `The game has ended! Nobody guessed the number.\n\n` +
              `The correct number was: **${endedGame.targetNumber}**`,
            color: 'error',
            fields: [
              { name: '📊 Total Guesses', value: stats.totalGuesses.toString(), inline: true },
              { name: '👥 Participants', value: stats.totalParticipants.toString(), inline: true },
              { name: '⏱️ Duration', value: `${stats.elapsedTime}s`, inline: true }
            ],
          });

          try {
            const channel = await this.client.channels.fetch(channelId);
            if (channel && 'send' in channel && typeof channel.send === 'function') {
              await channel.send({ embeds: [endEmbed] });
            }
          } catch (error) {
            console.error('Error sending game end message:', error);
          }
        });
      }
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
          
          const winEmbed = createEnhancedEmbed({
            title: '🎉 We Have a Winner!',
            description: `**${message.author.username}** guessed the correct number: **${guess}**!`,
            color: 'success',
            fields: [
              { name: '🏆 Winner', value: `<@${message.author.id}>`, inline: true },
              { name: '🎯 Attempts', value: result.game!.winnerAttempts!.toString(), inline: true },
              { name: '⏱️ Time', value: `${stats.elapsedTime}s`, inline: true },
              { name: '📊 Total Guesses', value: stats.totalGuesses.toString(), inline: true },
              { name: '👥 Participants', value: stats.totalParticipants.toString(), inline: true },
              { name: '📈 Avg Attempts', value: stats.avgAttempts.toString(), inline: true }
            ],
          });

          await message.reply({ embeds: [winEmbed] });

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
