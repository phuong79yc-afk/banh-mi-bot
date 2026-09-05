// Giveaway Module - Entry Point
import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} from 'discord.js';
import { giveawayManager } from './GiveawayManager';

export default class GiveawayModule {
  name = 'giveaway-module';
  description = 'Giveaway System';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log('🎁 Giveaway module initialized');
    this.registerCommands();
    this.registerEvents();
    console.log(`✅ Giveaway module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    // /giveaway-migrate
    const migrateCommand = {
      data: new SlashCommandBuilder()
        .setName('giveaway-migrate')
        .setDescription('🔄 Chuyển giveaway sang server khác')
        .addStringOption(option =>
          option
            .setName('target-guild-id')
            .setDescription('ID server đích')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const targetGuildId = interaction.options.getString('target-guild-id', true);

        await interaction.deferReply({ flags: 64 });

        try {
          const targetGuild = await this.client.guilds.fetch(targetGuildId);
          
          if (!targetGuild) {
            return interaction.editReply({
              content: '❌ Bot is not in that server!'
            });
          }

          const migrated = giveawayManager.migrateToGuild(
            interaction.guildId!,
            targetGuildId
          );

          const embed = new EmbedBuilder()
            .setColor(0x10b981)
            .setTitle('✅ Migration Complete')
            .setDescription(
              `Migrated **${migrated}** giveaway(s) from **${interaction.guild!.name}** to **${targetGuild.name}**`
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });

        } catch (error) {
          await interaction.editReply({
            content: `❌ Error: ${error instanceof Error ? error.message : 'Migration failed'}`
          });
        }
      }
    };

    this.commands.set('giveaway-migrate', migrateCommand);
  }

  private registerEvents() {
    // Button interaction handler for giveaway entries
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;
      
      if (interaction.customId.startsWith('giveaway_enter_')) {
        const giveawayId = interaction.customId.replace('giveaway_enter_', '');
        const giveaway = giveawayManager.get(giveawayId);

        if (!giveaway) {
          return interaction.reply({
            content: '❌ This giveaway no longer exists!',
            flags: 64
          });
        }

        if (giveaway.ended) {
          return interaction.reply({
            content: '❌ This giveaway has ended!',
            flags: 64
          });
        }

        if (Date.now() > giveaway.endsAt) {
          return interaction.reply({
            content: '❌ This giveaway has expired!',
            flags: 64
          });
        }

        const added = giveawayManager.addEntry(giveawayId, interaction.user.id);

        if (added) {
          await interaction.reply({
            content: `✅ You've entered the giveaway for **${giveaway.prize}**!`,
            flags: 64
          });
        } else {
          await interaction.reply({
            content: '⚠️ You\'re already entered in this giveaway!',
            flags: 64
          });
        }
      }
    });
  }

  async cleanup() {
    console.log('🧹 Giveaway module cleanup...');
  }
}
