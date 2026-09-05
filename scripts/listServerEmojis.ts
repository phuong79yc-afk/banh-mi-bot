import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`✅ Bot ready as ${client.user?.tag}\n`);
  
  const guildId = process.env.GUILD_ID;
  if (!guildId) {
    console.error('❌ GUILD_ID not found');
    process.exit(1);
  }
  
  try {
    const guild = await client.guilds.fetch(guildId);
    const emojis = await guild.emojis.fetch();
    
    console.log(`📊 Server: ${guild.name}`);
    console.log(`🎨 Total Emojis: ${emojis.size}\n`);
    
    // Group by type
    const animated = emojis.filter(e => e.animated);
    const static_emojis = emojis.filter(e => !e.animated);
    
    console.log(`🎬 Animated: ${animated.size}`);
    console.log(`🖼️  Static: ${static_emojis.size}\n`);
    
    // List all emojis
    console.log('━'.repeat(80));
    console.log('ALL EMOJIS:');
    console.log('━'.repeat(80));
    
    emojis.forEach(emoji => {
      const type = emoji.animated ? '🎬 ANIMATED' : '🖼️  STATIC  ';
      const code = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
      console.log(`${type} | ${emoji.name.padEnd(30)} | ${code}`);
    });
    
    console.log('\n' + '━'.repeat(80));
    console.log('FOR customEmoji.ts:');
    console.log('━'.repeat(80) + '\n');
    
    emojis.forEach(emoji => {
      const code = `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
      const comment = emoji.animated ? ' // ANIMATED!' : '';
      console.log(`  ${emoji.name.toUpperCase()}: '${code}',${comment}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
});

console.log('🔐 Logging in...');
client.login(process.env.DISCORD_TOKEN);
