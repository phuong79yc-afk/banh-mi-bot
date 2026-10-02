// Social Interactions Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';

// Anime GIF APIs
const TENOR_API_KEY = process.env.TENOR_API_KEY || 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ'; // Default public key

interface InteractionType {
  name: string;
  description: string;
  selfText: string;
  targetText: string;
  searchTerm: string;
  color: number;
  emoji: string;
}

const INTERACTIONS: InteractionType[] = [
  {
    name: 'kiss',
    description: 'Hôn ai đó',
    selfText: '{user} hôn chính mình... hơi cô đơn',
    targetText: '{user} hôn {target}',
    searchTerm: 'anime kiss',
    color: 0x1ABC9C,
    emoji: '💋'
  },
  {
    name: 'hug',
    description: 'Ôm ai đó',
    selfText: '{user} ôm chính mình',
    targetText: '{user} ôm {target}',
    searchTerm: 'anime hug',
    color: 0x1ABC9C,
    emoji: '🤗'
  },
  {
    name: 'slap',
    description: 'Tát ai đó',
    selfText: '{user} tát chính mình... đau!',
    targetText: '{user} tát {target}',
    searchTerm: 'anime slap',
    color: 0x1ABC9C,
    emoji: '👋'
  },
  {
    name: 'bite',
    description: 'Cắn ai đó',
    selfText: '{user} cắn chính mình',
    targetText: '{user} cắn {target}',
    searchTerm: 'anime bite',
    color: 0x1ABC9C,
    emoji: '😬'
  },
  {
    name: 'pat',
    description: 'Vỗ đầu ai đó',
    selfText: '{user} vỗ đầu chính mình',
    targetText: '{user} vỗ đầu {target}',
    searchTerm: 'anime pat head',
    color: 0x1ABC9C,
    emoji: '👋'
  },
  {
    name: 'punch',
    description: 'Đấm ai đó',
    selfText: '{user} đấm chính mình... sao lại thế?',
    targetText: '{user} đấm {target}',
    searchTerm: 'anime punch',
    color: 0x1ABC9C,
    emoji: '👊'
  },
  {
    name: 'handhold',
    description: 'Nắm tay ai đó',
    selfText: '{user} nắm tay chính mình',
    targetText: '{user} nắm tay {target}',
    searchTerm: 'anime holding hands',
    color: 0x1ABC9C,
    emoji: '🤝'
  }
];

export default class SocialModule {
  name = 'social-module';
  description = 'Social Interactions - Fun interaction commands';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('🎭 Social Interactions module initialized');
    this.registerCommands();
    console.log(`✅ Social Interactions module registered ${this.commands.size} commands`);
  }

  private async getGif(searchTerm: string): Promise<string> {
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&limit=20&contentfilter=medium`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch GIF');
      }

      const data: any = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Get random GIF from results
        const randomIndex = Math.floor(Math.random() * data.results.length);
        return data.results[randomIndex].media_formats.gif.url;
      }

      // Fallback GIFs if API fails
      return 'https://media.tenor.com/images/placeholder.gif';
    } catch (error) {
      console.error('Error fetching GIF:', error);
      return 'https://media.tenor.com/images/placeholder.gif';
    }
  }

  private registerCommands() {
    for (const interaction of INTERACTIONS) {
      const command = {
        data: new SlashCommandBuilder()
          .setName(interaction.name)
          .setDescription(interaction.description)
          .addUserOption(option =>
            option
              .setName('user')
              .setDescription('Người dùng để tương tác')
              .setRequired(false)
          ),
        execute: async (cmdInteraction: ChatInputCommandInteraction) => {
          const targetUser = cmdInteraction.options.getUser('user');
          
          // Prevent interacting with bots (except self-interaction)
          if (targetUser && targetUser.bot && targetUser.id !== cmdInteraction.user.id) {
            return cmdInteraction.reply({
              content: '${emojis.error} You cannot interact with bots!',
              flags: 64
            });
          }

          await cmdInteraction.deferReply();

          try {
            const gifUrl = await this.getGif(interaction.searchTerm);
            
            const text = targetUser && targetUser.id !== cmdInteraction.user.id
              ? interaction.targetText
                  .replace('{user}', `**${cmdInteraction.user.username}**`)
                  .replace('{target}', `**${targetUser.username}**`)
              : interaction.selfText
                  .replace('{user}', `**${cmdInteraction.user.username}**`);

            const embed = createEnhancedEmbed({
              description: `${interaction.emoji} ${text}`,
              image: gifUrl,
              color: 'random',
              footer: `${interaction.name.charAt(0).toUpperCase() + interaction.name.slice(1)} command`,
            });

            await cmdInteraction.editReply({ embeds: [embed] });
          } catch (error) {
            console.error(`Error executing ${interaction.name} command:`, error);
            await cmdInteraction.editReply({
              content: '${emojis.error} Failed to load interaction GIF. Please try again!'
            });
          }
        }
      };

      this.commands.set(interaction.name, command);
    }
  }

  async cleanup() {
    console.log('🧹 Social Interactions module cleanup');
  }
}
