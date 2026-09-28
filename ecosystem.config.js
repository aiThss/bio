module.exports = {
  apps: [
    {
      name: 'bio-aithss',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '300M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true
    }
  ]
};
