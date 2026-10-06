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
    PORT: '3000',
    DASHBOARD_USERNAME: 'admin',
    DASHBOARD_PASSWORD: 'admin123'
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
  
  console.log('✅ Environment variables validated\n');
}
