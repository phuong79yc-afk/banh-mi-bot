// Autoresponder Module - Entry Point
import { Client, Collection, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { emojis } from '../../config/emojis';
import { createEnhancedEmbed } from '../../utils/embedHelper';
import { autoresponderManager, MatchMode } from './AutoresponderManager';

export default class AutoresponderModule {
  name = 'autoresponder-module';
  description = 'Autoresponder - Auto-reply based on keywords';
  version = '1.0.0';
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
    // /autoresponder add
    const addCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-add')
        .setDescription('➕ Thêm tự động trả lời')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
          option
            .setName('trigger')
            .setDescription('🔑 Từ khóa kích hoạt')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('response')
            .setDescription('💬 Nội dung trả lời')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('mode')
            .setDescription('⚙️ Chế độ khớp')
            .setRequired(false)
            .addChoices(
              { name: 'Bằng nhau', value: 'equal' },
              { name: 'Chứa', value: 'contains' },
              { name: 'Bắt đầu bằng', value: 'startswith' },
              { name: 'Kết thúc bằng', value: 'endswith' }
            )
        )
        .addBooleanOption(option =>
          option
            .setName('ignorecase')
            .setDescription('🔤 Bỏ qua chữ hoa/thường')
            .setRequired(false)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const trigger = interaction.options.getString('trigger', true);
        const response = interaction.options.getString('response', true);
        const mode = (interaction.options.getString('mode') || 'contains') as MatchMode;
        const ignoreCase = interaction.options.getBoolean('ignorecase') ?? true;

        const result = autoresponderManager.add(
          interaction.guildId!,
          trigger,
          response,
          mode,
          ignoreCase,
          interaction.user.id
        );

        if (!result.success) {
          return interaction.reply({
            content: `${emojis.error} ${result.error}`,
            flags: 64
          });
        }

        const embed = createEnhancedEmbed({
          title: '${emojis.success} Autoresponder Added',
          description: 'Successfully created autoresponder!',
          color: 'success'
        })
          .addFields(
            { name: 'Trigger', value: `\`${trigger}\``, inline: true },
            { name: 'Mode', value: mode, inline: true },
            { name: 'Case Sensitive', value: ignoreCase ? 'No' : 'Yes', inline: true },
            { name: 'Response', value: response.substring(0, 1024) }
          )
          .setFooter({ text: `ID: ${result.autoresponder!.id}` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    // /autoresponder remove
    const removeCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-remove')
        .setDescription('➖ Xóa tự động trả lời')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
          option
            .setName('trigger')
            .setDescription('🔑 Từ khóa kích hoạt')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const trigger = interaction.options.getString('trigger', true);

        const result = autoresponderManager.remove(interaction.guildId!, trigger);

        if (!result.success) {
          return interaction.reply({
            content: `${emojis.error} ${result.error}`,
            flags: 64
          });
        }

        await interaction.reply({
          content: `${emojis.success} Successfully deleted autoresponder with trigger \`${trigger}\`!`,
          flags: 64
        });
      }
    };

    // /autoresponder list
    const listCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-list')
        .setDescription('📃 Xem danh sách tự động trả lời'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const autoresponders = autoresponderManager.getAll(interaction.guildId!);

        if (autoresponders.length === 0) {
          return interaction.reply({
            content: "This guild doesn't have any autoresponders!",
            flags: 64
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x667eea)
          .setTitle('${emojis.copy} Autoresponders')
          .setDescription(
            `This guild has **${autoresponders.length}** autoresponder(s).\n\n` +
            autoresponders
              .map((ar, i) => `${i + 1}. \`${ar.trigger}\` → ${ar.mode} (${ar.ignoreCase ? 'ignore case' : 'case sensitive'})`)
              .join('\n')
          )
          .setFooter({ text: `Use /autoresponder-view to see details` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    // /autoresponder view
    const viewCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-view')
        .setDescription('🔍 Xem chi tiết tự động trả lời')
        .addStringOption(option =>
          option
            .setName('trigger')
            .setDescription('🔑 Từ khóa kích hoạt')
            .setRequired(true)
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const trigger = interaction.options.getString('trigger', true);
        const autoresponder = autoresponderManager.get(interaction.guildId!, trigger);

        if (!autoresponder) {
          return interaction.reply({
            content: `${emojis.error} No autoresponder found with trigger \`${trigger}\``,
            flags: 64
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x667eea)
          .setTitle('${emojis.search} Autoresponder Details')
          .addFields(
            { name: 'Trigger', value: `\`${autoresponder.trigger}\``, inline: true },
            { name: 'Mode', value: autoresponder.mode, inline: true },
            { name: 'Case Sensitive', value: autoresponder.ignoreCase ? 'No' : 'Yes', inline: true },
            { name: 'Response', value: autoresponder.response.substring(0, 1024) },
            { name: 'Created By', value: `<@${autoresponder.createdBy}>`, inline: true },
            { name: 'Created At', value: `<t:${Math.floor(autoresponder.createdAt / 1000)}:R>`, inline: true }
          )
          .setFooter({ text: `ID: ${autoresponder.id}` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    // /autoresponder matchmode
    const matchmodeCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-matchmode')
        .setDescription('Chỉnh sửa chế độ khớp')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
          option
            .setName('trigger')
            .setDescription('Từ khóa kích hoạt')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('mode')
            .setDescription('Chọn chế độ khớp')
            .setRequired(true)
            .addChoices(
              { name: 'Bằng nhau', value: 'equal' },
              { name: 'Chứa', value: 'contains' },
              { name: 'Bắt đầu bằng', value: 'startswith' },
              { name: 'Kết thúc bằng', value: 'endswith' }
            )
        ),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const trigger = interaction.options.getString('trigger', true);
        const mode = interaction.options.getString('mode', true) as MatchMode;

        const result = autoresponderManager.updateMatchMode(
          interaction.guildId!,
          trigger,
          mode
        );

        if (!result.success) {
          return interaction.reply({
            content: `${emojis.error} ${result.error}`,
            flags: 64
          });
        }

        await interaction.reply({
          content: `${emojis.success} Successfully updated match mode to **${mode}** for trigger \`${trigger}\`!`,
          flags: 64
        });
      }
    };

    // /autoresponder placeholders
    const placeholdersCommand = {
      data: new SlashCommandBuilder()
        .setName('autoresponder-placeholders')
        .setDescription('Hiện các biến có sẵn'),
      execute: async (interaction: ChatInputCommandInteraction) => {
        const embed = new EmbedBuilder()
          .setColor(0x667eea)
          .setTitle('📝 Autoresponder Placeholders')
          .setDescription('Use these placeholders in your autoresponder responses:')
          .addFields(
            {
              name: '${emojis.user} User Placeholders',
              value: 
                '`{user}` - Username\n' +
                '`{user.mention}` - Mention user\n' +
                '`{user.id}` - User ID\n' +
                '`{user.name}` - Username\n' +
                '`{user.displayname}` - Display name'
            },
            {
              name: '🏠 Server Placeholders',
              value: 
                '`{server}` - Server name\n' +
                '`{server.name}` - Server name'
            },
            {
              name: '${emojis.message} Channel & Message Placeholders',
              value: 
                '`{channel}` - Channel name\n' +
                '`{channel.name}` - Channel name\n' +
                '`{message}` - Message content\n' +
                '`{message.content}` - Message content'
            }
          )
          .setFooter({ text: 'Example: Welcome {user.mention} to {server}!' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    };

    this.commands.set('autoresponder-add', addCommand);
    this.commands.set('autoresponder-remove', removeCommand);
    this.commands.set('autoresponder-list', listCommand);
    this.commands.set('autoresponder-view', viewCommand);
    this.commands.set('autoresponder-matchmode', matchmodeCommand);
    this.commands.set('autoresponder-placeholders', placeholdersCommand);
  }

  private registerEvents() {
    // Message listener for autoresponder
    this.client.on('messageCreate', async (message) => {
      // Ignore bots and DMs
      if (message.author.bot || !message.guild) return;

      // Check for autoresponder match
      const response = autoresponderManager.checkMessage(
        message.guild.id,
        message.content
      );

      if (response) {
        // Replace placeholders
        const finalResponse = autoresponderManager.replacePlaceholders(response, {
          userId: message.author.id,
          username: message.author.username,
          displayName: message.member?.displayName || message.author.username,
          guildName: message.guild.name,
          channelName: (message.channel as any).name || 'Unknown',
          messageContent: message.content
        });

        try {
          await message.reply(finalResponse);
        } catch (error) {
          console.error('Autoresponder error:', error);
        }
      }
    });
  }

  async cleanup() {
    console.log('🧹 Autoresponder module cleanup');
  }
}
