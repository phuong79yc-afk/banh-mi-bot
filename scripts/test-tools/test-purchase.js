// Test purchase flow from dashboard
const USER_ID = '1144806767595900979';
const GUILD_ID = '1482354951689605150';

async function testPurchase() {
  console.log('🧪 Testing Dashboard Shop Purchase Flow\n');
  
  // 1. Get current coins
  console.log('1️⃣ Fetching current coins...');
  const coinsRes = await fetch(`http://localhost:3001/api/user/${USER_ID}/coins`);
  const coinsData = await coinsRes.json();
  console.log(`   Current coins: ${coinsData.coins} 🪙\n`);
  
  // 2. Get shop items
  console.log('2️⃣ Fetching shop items...');
  const itemsRes = await fetch('http://localhost:3001/api/shop/items');
  const itemsData = await itemsRes.json();
  console.log(`   Found ${itemsData.items.length} items`);
  
  // Find an affordable item
  const affordableItem = itemsData.items.find(item => 
    !item.soldOut && item.price <= coinsData.coins
  );
  
  if (!affordableItem) {
    console.log('   ❌ No affordable items found!\n');
    return;
  }
  
  console.log(`   Selected: ${affordableItem.emoji} ${affordableItem.name} (${affordableItem.price} 🪙)\n`);
  
  // 3. Get current inventory
  console.log('3️⃣ Checking current inventory...');
  const invRes = await fetch(`http://localhost:3001/api/user/${USER_ID}/inventory`);
  const invData = await invRes.json();
  console.log(`   Current items: ${Object.keys(invData.inventory || {}).length}`);
  console.log(`   Items: ${Object.keys(invData.inventory || {}).join(', ') || 'None'}\n`);
  
  // 4. Purchase item
  console.log('4️⃣ Purchasing item...');
  const purchaseRes = await fetch('http://localhost:3001/api/shop/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: USER_ID,
      guildId: GUILD_ID,
      itemId: affordableItem.id
    })
  });
  
  const purchaseData = await purchaseRes.json();
  
  if (!purchaseRes.ok) {
    console.log(`   ❌ Purchase failed: ${purchaseData.error}\n`);
    return;
  }
  
  console.log(`   ✅ ${purchaseData.message}\n`);
  
  // 5. Verify coins deducted
  console.log('5️⃣ Verifying coins...');
  const newCoinsRes = await fetch(`http://localhost:3001/api/user/${USER_ID}/coins`);
  const newCoinsData = await newCoinsRes.json();
  console.log(`   New coins: ${newCoinsData.coins} 🪙`);
  console.log(`   Deducted: ${coinsData.coins - newCoinsData.coins} 🪙\n`);
  
  // 6. Verify inventory updated
  console.log('6️⃣ Verifying inventory...');
  const newInvRes = await fetch(`http://localhost:3001/api/user/${USER_ID}/inventory`);
  const newInvData = await newInvRes.json();
  console.log(`   New item count: ${Object.keys(newInvData.inventory || {}).length}`);
  console.log(`   Items: ${Object.keys(newInvData.inventory || {}).join(', ')}\n`);
  
  // 7. Check Discord role
  console.log('7️⃣ Checking Discord role creation...');
  console.log(`   ℹ️ Check Discord server ${GUILD_ID} for new role:\n`);
  console.log(`   Expected role name: ${affordableItem.emoji} ${affordableItem.name}`);
  console.log(`   Expected user to have this role assigned\n`);
  
  console.log('✅ Test completed! Open http://localhost:3001/#/shop to see dashboard updates');
}

testPurchase().catch(console.error);
