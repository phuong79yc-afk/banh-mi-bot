/**
 * Settings Module - Interactive settings UI
 */

import { 
  Client, 
  Collection, 
  SlashCommandBuilder, 
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { emojis } from '../../config/emojis';


export default class SettingsModule {
  name = 'settings-module';
  description = 'Server settings with interactive UI';
  version = '1.0.0';
  enabled = true;
  client: Client;
  commands: Collection<string, any>;

  // Settings storage (in production, use database)
  private settings = new Map<string, {
    prompt: string;
    enhancedPrompt: boolean;
    enhancedResult: boolean;
  }>();

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
  }

  async initialize() {
    console.log(`⚙️ Settings module initialized`);
    this.registerCommands();
    this.setupInteractionHandlers();
    console.log(`${emojis.success} Settings module registered ${this.commands.size} commands`);
  }

  private registerCommands() {
    const settingsCommand = {
      data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription(`⚙️ Cấu hình server với giao diện tương tác`),

      execute: async (interaction: ChatInputCommandInteraction) => {
        await this.showSettingsPanel(interaction);
      }
    };

    this.commands.set('settings', settingsCommand);
  }

  private async showSettingsPanel(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const currentSettings = this.settings.get(guildId) || {
      prompt: 'bot discord',
      enhancedPrompt: false,
      enhancedResult: false
    };

    const embed = new EmbedBuilder()
      .setTitle(`⚙️ Setting`)
      .setColor(0x5865F2)
      .addFields(
        {
          name: 'Prompt:',
          value: `\`\`\`${currentSettings.prompt || 'Chưa đặt'}\`\`\``,
          inline: false
        },
        {
          name: 'Enhanced Prompt',
          value: currentSettings.enhancedPrompt ? `${emojis.success} Enable` : `${emojis.error} Disable`,
          inline: true
        },
        {
          name: 'Enhanced Result',
          value: currentSettings.enhancedResult ? `${emojis.success} Enable` : `${emojis.error} Disable`,
          inline: true
        }
      );

    // Create buttons
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('settings_change_prompt')
          .setLabel('Đổi Prompt')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId('settings_toggle_enhanced_prompt')
          .setLabel(currentSettings.enhancedPrompt ? 'Disable' : 'Enable')
          .setStyle(currentSettings.enhancedPrompt ? ButtonStyle.Danger : ButtonStyle.Success)
      );

    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('settings_toggle_enhanced_result')
          .setLabel(currentSettings.enhancedResult ? 'Disable' : 'Enable')
          .setStyle(currentSettings.enhancedResult ? ButtonStyle.Danger : ButtonStyle.Success)
      );

    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('settings_start')
          .setLabel('Start')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('settings_exit')
          .setLabel('Exit')
          .setStyle(ButtonStyle.Primary)
      );

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2, row3],
      ephemeral: false
    });
  }

  private setupInteractionHandlers() {
    const self = this;

    // Button interactions
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isButton()) return;
      if (!interaction.customId.startsWith('settings_')) return;

      const guildId = interaction.guildId!;
      const currentSettings = self.settings.get(guildId) || {
        prompt: 'bot discord',
        enhancedPrompt: false,
        enhancedResult: false
      };

      // Change Prompt
      if (interaction.customId === 'settings_change_prompt') {
        const modal = new ModalBuilder()
          .setCustomId('settings_prompt_modal')
          .setTitle('📝 Đổi Prompt');

        const promptInput = new TextInputBuilder()
          .setCustomId('prompt_input')
          .setLabel('Nhập prompt mới')
          .setPlaceholder('Ví dụ: test bot discord')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(200)
          .setValue(currentSettings.prompt || '');

        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(promptInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
        return;
      }

      // Toggle Enhanced Prompt
      if (interaction.customId === 'settings_toggle_enhanced_prompt') {
        currentSettings.enhancedPrompt = !currentSettings.enhancedPrompt;
        self.settings.set(guildId, currentSettings);

        await interaction.update({
          embeds: [self.buildSettingsEmbed(currentSettings)],
          components: self.buildSettingsButtons(currentSettings)
        });
        return;
      }

      // Toggle Enhanced Result
      if (interaction.customId === 'settings_toggle_enhanced_result') {
        currentSettings.enhancedResult = !currentSettings.enhancedResult;
        self.settings.set(guildId, currentSettings);

        await interaction.update({
          embeds: [self.buildSettingsEmbed(currentSettings)],
          components: self.buildSettingsButtons(currentSettings)
        });
        return;
      }

      // Start
      if (interaction.customId === 'settings_start') {
        await interaction.reply({
          content: `${emojis.success} **Settings applied!**\n\n` +
            `📝 Prompt: \`${currentSettings.prompt}\`\n` +
            `⚡ Enhanced Prompt: ${currentSettings.enhancedPrompt ? emojis.success : emojis.error}\n` +
            `${emojis.sparkles} Enhanced Result: ${currentSettings.enhancedResult ? emojis.success : emojis.error}`,
          ephemeral: true
        });
        return;
      }

      // Exit
      if (interaction.customId === 'settings_exit') {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`⚙️ Settings Closed`)
              .setDescription('Đã đóng bảng cấu hình.')
              .setColor(0x99AAB5)
          ],
          components: []
        });
        return;
      }
    });

    // Modal submit
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!interaction.isModalSubmit()) return;
      if (interaction.customId !== 'settings_prompt_modal') return;

      const guildId = interaction.guildId!;
      const newPrompt = interaction.fields.getTextInputValue('prompt_input');
      
      const currentSettings = self.settings.get(guildId) || {
        prompt: '',
        enhancedPrompt: false,
        enhancedResult: false
      };

      currentSettings.prompt = newPrompt;
      self.settings.set(guildId, currentSettings);

      await interaction.update({
        embeds: [self.buildSettingsEmbed(currentSettings)],
        components: self.buildSettingsButtons(currentSettings)
      });
    });
  }

  private buildSettingsEmbed(settings: any): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`⚙️ Setting`)
      .setColor(0x5865F2)
      .addFields(
        {
          name: 'Prompt:',
          value: `\`\`\`${settings.prompt || 'Chưa đặt'}\`\`\``,
          inline: false
        },
        {
          name: 'Enhanced Prompt',
          value: settings.enhancedPrompt ? `${emojis.success} Enable` : `${emojis.error} Disable`,
          inline: true
        },
        {
          name: 'Enhanced Result',
          value: settings.enhancedResult ? `${emojis.success} Enable` : `${emojis.error} Disable`,
          inline: true
        }
      );
  }

  private buildSettingsButtons(settings: any): ActionRowBuilder<ButtonBuilder>[] {
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('settings_change_prompt')
          .setLabel('Đổi Prompt')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId('settings_toggle_enhanced_prompt')
          .setLabel(settings.enhancedPrompt ? 'Disable' : 'Enable')
          .setStyle(settings.enhancedPrompt ? ButtonStyle.Danger : ButtonStyle.Success)
      );

    const row2 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('settings_toggle_enhanced_result')
          .setLabel(settings.enhancedResult ? 'Disable' : 'Enable')
          .setStyle(settings.enhancedResult ? ButtonStyle.Danger : ButtonStyle.Success)
      );

    const row3 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('settings_start')
          .setLabel('Start')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('settings_exit')
          .setLabel('Exit')
          .setStyle(ButtonStyle.Primary)
      );

    return [row1, row2, row3];
  }

  getName() {
    return this.name;
  }

  getCommands() {
    return this.commands;
  }

  async cleanup() {
    console.log('🧹 Settings module cleanup');
  }
}
