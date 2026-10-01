require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot ready: ${client.user.tag}`);
  console.log('📝 Send message "!testemoji" in any channel to test emojis\n');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content !== '!testemoji') return;
  
  const emojis = {
    success: '<a:success:1554844011653496842>',
    error: '<a:error:1554843556349345973>',
    loading: '<a:loading:1554843693293244447>',
    warning: '<a:warning:1554843977276985365>',
    coin: '<a:coin:1555075964919226449>',
    gift: '<a:gift:1554842003466883142>',
    sparkles: '<a:sparkles:1554843063333949521>',
  };
  
  const embed = new EmbedBuilder()
    .setTitle('🧪 Emoji Test')
    .setDescription([
      '**Testing Animated Emojis:**',
      '',
      `${emojis.success} Success emoji`,
      `${emojis.error} Error emoji`,
      `${emojis.loading} Loading emoji`,
      `${emojis.warning} Warning emoji`,
      `${emojis.coin} Coin emoji`,
      `${emojis.gift} Gift emoji`,
      `${emojis.sparkles} Sparkles emoji`,
      '',
      '**If you see animated emojis above, it works! ✅**',
      'If you see text like `<a:success:123>`, there\'s a problem ❌'
    ].join('\n'))
    .setColor(0x00ff00)
    .setFooter({ text: 'Emoji Test' });
  
  await message.reply({ embeds: [embed] });
  console.log(`✅ Sent test embed to ${message.guild.name} (#${message.channel.name})`);
});

client.login(process.env.DISCORD_TOKEN);

console.log('🚀 Starting bot...');
console.log('📝 Instructions:');
console.log('   1. Go to Discord');
console.log('   2. Send message: !testemoji');
console.log('   3. Check if emojis are animated or show as text\n');
