// Verify Discord role was created
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const GUILD_ID = '1482354951689605150';
const USER_ID = '1144806767595900979';

client.once('ready', async () => {
  console.log('🤖 Bot logged in\n');
  
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`📋 Server: ${guild.name}\n`);
    
    // Get all roles in server
    const roles = guild.roles.cache
      .filter(role => role.name.includes('Bánh Cuốn Lover') || role.name.includes('🥟'))
      .sort((a, b) => b.createdTimestamp - a.createdTimestamp);
    
    console.log(`🎭 Found ${roles.size} role(s) with "Bánh Cuốn Lover":\n`);
    
    roles.forEach(role => {
      console.log(`   ${role.name}`);
      console.log(`   ID: ${role.id}`);
      console.log(`   Color: #${role.color.toString(16).padStart(6, '0')}`);
      console.log(`   Created: ${role.createdAt.toLocaleString()}`);
      console.log(`   Members: ${role.members.size}\n`);
    });
    
    // Check if user has the role
    const member = await guild.members.fetch(USER_ID);
    const hasRole = member.roles.cache.some(r => 
      r.name.includes('Bánh Cuốn Lover') || r.name.includes('🥟')
    );
    
    console.log(`👤 User: ${member.user.tag}`);
    console.log(`   Has role: ${hasRole ? '✅ Yes' : '❌ No'}\n`);
    
    if (hasRole) {
      const userRole = member.roles.cache.find(r => 
        r.name.includes('Bánh Cuốn Lover') || r.name.includes('🥟')
      );
      console.log(`   Role name: ${userRole.name}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
