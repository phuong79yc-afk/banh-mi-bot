const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(projectRoot, '.env') });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ]
});

const shopRoleNames = [
  'Bánh Cuốn Lover',
  'VIP Member',
  'Supporter',
  'Gamer',
  'Music Lover',
  'Artist',
  'Developer',
  'Streamer',
  'Content Creator'
];

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}\n`);
  
  // Get first guild (your server)
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.log('❌ No guild found!');
    process.exit(0);
  }
  
  console.log(`🏰 Server: ${guild.name}\n`);
  console.log('🗑️ Deleting shop roles...\n');
  
  let deletedCount = 0;
  
  for (const roleName of shopRoleNames) {
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (role) {
      try {
        await role.delete('Shop data reset');
        console.log(`  ✅ Deleted: ${roleName}`);
        deletedCount++;
      } catch (error) {
        console.log(`  ❌ Failed to delete ${roleName}: ${error.message}`);
      }
    } else {
      console.log(`  ⚠️ Not found: ${roleName}`);
    }
  }
  
  console.log(`\n✅ Deleted ${deletedCount} roles`);
  console.log('🔄 You can now test shop purchases with fresh roles!');
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
