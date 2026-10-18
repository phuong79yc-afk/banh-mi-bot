// Load all modules and get their commands exactly like the bot does
const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'dist', 'src', 'modules');

// Mock client
const mockClient = {
  on: () => {},
  once: () => {},
  emit: () => {},
  guilds: { cache: new Map() }
};

async function loadAllCommands() {
  const allCommands = [];
  
  const moduleNames = fs.readdirSync(modulesDir).filter(name => {
    const modulePath = path.join(modulesDir, name);
    return fs.statSync(modulePath).isDirectory();
  });
  
  console.log(`📦 Found ${moduleNames.length} modules\n`);
  
  for (const moduleName of moduleNames) {
    try {
      const entryPoint = path.join(modulesDir, moduleName, 'entry_point.js');
      
      if (!fs.existsSync(entryPoint)) {
        console.log(`⚠️  ${moduleName} - no entry_point.js`);
        continue;
      }
      
      // Clear require cache
      delete require.cache[require.resolve(entryPoint)];
      
      const ModuleClass = require(entryPoint).default || require(entryPoint);
      
      if (!ModuleClass) {
        console.log(`⚠️  ${moduleName} - no default export`);
        continue;
      }
      
      let instance;
      if (typeof ModuleClass === 'function') {
        // Try as constructor
        try {
          instance = new ModuleClass(mockClient);
        } catch (e) {
          // Try as factory function
          instance = ModuleClass(mockClient);
        }
      } else {
        instance = ModuleClass;
      }
      
      if (instance && instance.commands) {
        let count = 0;
        instance.commands.forEach((cmd, name) => {
          if (cmd.data && cmd.data.name && cmd.data.description) {
            allCommands.push({
              module: moduleName,
              name: cmd.data.name,
              description: cmd.data.description
            });
            count++;
          }
        });
        console.log(`✅ ${moduleName.padEnd(30)} - ${count} commands`);
      } else {
        console.log(`⚠️  ${moduleName.padEnd(30)} - no commands collection`);
      }
      
    } catch (error) {
      console.log(`❌ ${moduleName.padEnd(30)} - ${error.message}`);
    }
  }
  
  return allCommands;
}

(async () => {
  try {
    const commands = await loadAllCommands();
    
    // Sort by name
    commands.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`\n${'='.repeat(120)}`);
    console.log(`📋 Total: ${commands.length} commands\n`);
    
    // Group by category (based on your categorize function)
    const categories = {
      'Hệ thống xử lí tin nhắn': [],
      'Moderation': [],
      'Giải trí': [],
      'Management': [],
      'Economy': [],
      'Utility': [],
      'Khác': []
    };
    
    for (const cmd of commands) {
      const name = cmd.name;
      let category = 'Khác';
      
      if (name.startsWith('ticket-') || name.startsWith('sticky-') || name.startsWith('autoresponder-')) {
        category = 'Hệ thống xử lí tin nhắn';
      } else if (name.startsWith('moderation-')) {
        category = 'Moderation';
      } else if (name.startsWith('ai-') || name === 'ai' || 
                 ['kiss', 'hug', 'slap', 'bite', 'pat', 'punch', 'handhold'].includes(name) ||
                 name.startsWith('gtn-') || name.startsWith('giveaway-')) {
        category = 'Giải trí';
      } else if (name.startsWith('customrole-') || name.startsWith('donation-') || 
                 name.startsWith('quickreport-') || name === 'Report Message' || 
                 name.startsWith('generator') || name.startsWith('admin-')) {
        category = 'Management';
      } else if (name.startsWith('daily') || name.startsWith('balance') || 
                 name.startsWith('shop-') || name.startsWith('quest-') ||
                 name.startsWith('vip-') || name.startsWith('coins-') || 
                 name === 'shop' || name === 'inventory' || name === 'balance' || name === 'revoke') {
        category = 'Economy';
      } else if (['poll', 'calc', 'random', 'choose', 'information', 'help', 'rule', 'rule-setup'].includes(name) ||
                 name.startsWith('afk-') || name.startsWith('minecraft-') || 
                 name.startsWith('snipe') || name === 'editsnipe' ||
                 name.startsWith('convert-')) {
        category = 'Utility';
      }
      
      categories[category].push(cmd);
    }
    
    // Print by category
    let output = `DANH SÁCH ${commands.length} LỆNH - PHÂN LOẠI THEO CATEGORY\n\n`;
    
    for (const [catName, cmds] of Object.entries(categories)) {
      if (cmds.length > 0) {
        output += `\n## ${catName} (${cmds.length} lệnh)\n\n`;
        console.log(`\n## ${catName} (${cmds.length} lệnh)`);
        
        for (const cmd of cmds) {
          const line = `/${cmd.name.padEnd(35)} ${cmd.description}`;
          output += `${line}\n`;
          console.log(line);
        }
      }
    }
    
    // Save to file
    fs.writeFileSync(path.join(__dirname, 'commands-by-category.txt'), output);
    
    console.log(`\n${'='.repeat(120)}`);
    console.log('\n✅ Full categorized list saved to commands-by-category.txt');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
