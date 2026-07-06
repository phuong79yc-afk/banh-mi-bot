import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Xem danh sách các lệnh');

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ 
      name: 'Bot Commands', 
      iconURL: interaction.client.user?.displayAvatarURL() 
    })
    .setTitle('📚 Danh sách lệnh')
    .setDescription(
      `Tổng cộng **43 lệnh** có sẵn\n` +
      `Sử dụng \`/\` để xem chi tiết từng lệnh`
    )
    .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
    .addFields(
      { 
        name: '🎮 Giải trí', 
        value: '`/8ball` `/avatar` `/poll` `/hello` `/vietmeme`', 
        inline: false 
      },
      { 
        name: '🎲 Mini Games', 
        value: '`/coinflip` `/dice` `/rps` `/guess` `/slots` `/blackjack` `/tictactoe`', 
        inline: false 
      },
      { 
        name: '💰 Kinh tế', 
        value: '`/balance` `/daily` `/shop` `/leaderboard`', 
        inline: false 
      },
      { 
        name: 'ℹ️ Thông tin', 
        value: '`/server` `/user` `/info` `/dashboard` `/ping` `/stats` `/activity`', 
        inline: false 
      },
      { 
        name: '🛡️ Quản lý Members', 
        value: '`/kick` `/ban` `/warn` `/mute` `/unmute` `/timeout` `/nickname`', 
        inline: false 
      },
      { 
        name: '⚙️ Quản lý Server', 
        value: '`/clear` `/purge` `/slowmode` `/lockdown` `/nuke` `/role` `/maintenance`', 
        inline: false 
      },
      { 
        name: '📢 Tiện ích', 
        value: '`/announce` `/say` `/embed` `/ticket` `/weather`', 
        inline: false 
      },
      { 
        name: '❓ Hỗ trợ', 
        value: '`/help` - Xem danh sách lệnh này', 
        inline: false 
      }
    )
    .setFooter({ 
      text: `Requested by ${interaction.user.tag}`, 
      iconURL: interaction.user.displayAvatarURL() 
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
