module.exports = {
  apps: [{
    name: 'discord-bot',
    script: 'ts-node',
    args: 'src/index.ts',
    watch: ['src'],
    ignore_watch: ['node_modules', 'logs', '*.log'],
    watch_delay: 1000,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
