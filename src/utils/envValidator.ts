interface EnvConfig {
  required: string[];
  optional: string[];
  defaults: Record<string, string>;
}

const config: EnvConfig = {
  required: [
    'DISCORD_TOKEN',
    'CLIENT_ID'
  ],
  optional: [
    'GUILD_ID',
    'PORT',
    'GROQ_API_KEYS',
    'ADMIN_PASSWORD',
    'JWT_SECRET',
    'DASHBOARD_USERNAME',
    'DASHBOARD_PASSWORD',
    'OWNER_ID'
  ],
  defaults: {
    PORT: '3000'
  }
};

export function validateEnv(): void {
  const missing: string[] = [];
  
  for (const key of config.required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\nPlease check your .env file.');
    process.exit(1);
  }
  
  // Set defaults for optional variables
  for (const [key, value] of Object.entries(config.defaults)) {
    if (!process.env[key]) {
      process.env[key] = value;
      console.warn(`⚠️  Using default value for ${key}: ${value}`);
    }
  }
  
  // Warn about missing optional but recommended variables
  const missingOptional = config.optional.filter(key => 
    !process.env[key] && !config.defaults[key]
  );
  
  if (missingOptional.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    missingOptional.forEach(key => console.warn(`  - ${key}`));
  }
  
  // Check for sensitive credentials - fail if not set
  const sensitiveVars = ['ADMIN_PASSWORD', 'JWT_SECRET', 'DASHBOARD_PASSWORD'];
  const missingSensitive = sensitiveVars.filter(key => !process.env[key]);
  
  if (missingSensitive.length > 0) {
    console.error('❌ Missing sensitive credentials (required for web server security):');
    missingSensitive.forEach(key => console.error(`  - ${key}`));
    console.error('\nThese MUST be set in production. Set them in .env file.');
    console.error('The web server will not start without these credentials.\n');
  }
  
  console.log('✅ Environment variables validated\n');
}
