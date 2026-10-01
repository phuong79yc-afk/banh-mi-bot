import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { emojis } from './config/emojis';

export default {
  data: new SlashCommandBuilder()
    .setName('test-emoji')
    .setDescription('Test animated emoji display'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    // Method 1: Emoji in text (small - 48x48px)
    const embedSmall = new EmbedBuilder()
      .setTitle('📝 Method 1: Emoji trong text (48x48px)')
      .setDescription([
        `${emojis.success} Success emoji`,
        `${emojis.error} Error emoji`,
        `${emojis.loading} Loading emoji`,
        `${emojis.sparkles} Sparkles emoji`,
      ].join('\n'))
      .setColor(0x5865F2);

    // Method 2: Standalone emoji (large - tự động scale)
    const embedLarge = new EmbedBuilder()
      .setTitle('🔥 Method 2: Emoji standalone (lớn hơn)')
      .setDescription([
        'Gửi emoji riêng lẻ không có text:',
        '',
        emojis.success,
        emojis.error,
        emojis.loading,
        emojis.sparkles,
        emojis.rocket,
        emojis.coin,
      ].join('\n'))
      .setColor(0xfee75c);

    // Send with plain message có emoji standalone
    await interaction.reply({ 
      content: `${emojis.trophy} **Emoji Test** ${emojis.trophy}\n\n` +
               `${emojis.success} ${emojis.error} ${emojis.loading}\n\n` +
               `**3 emoji lớn riêng biệt:**\n` +
               `${emojis.sparkles}\n` +
               `${emojis.rocket}\n` +
               `${emojis.coin}`,
      embeds: [embedSmall, embedLarge]
    });
  }
};
