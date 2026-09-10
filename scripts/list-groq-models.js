/**
 * List all available Groq models
 * Run: node scripts/list-groq-models.js
 */

require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function listModels() {
  console.log('🔍 Fetching available Groq models...\n');
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('📊 Available Models:\n');
    console.log('='.repeat(80));
    
    data.data
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach(model => {
        console.log(`${model.id.padEnd(40)} (${model.object})`);
      });
    
    console.log('='.repeat(80));
    console.log(`\n✅ Total: ${data.data.length} models\n`);
    
    // Suggest best model for JSON generation
    const jsonModels = data.data.filter(m => 
      m.id.includes('llama') || 
      m.id.includes('gpt') || 
      m.id.includes('qwen')
    );
    
    console.log('💡 Recommended for JSON generation:');
    jsonModels.slice(0, 5).forEach(m => console.log(`   - ${m.id}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
