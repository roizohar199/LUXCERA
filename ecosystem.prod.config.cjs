// ecosystem.prod.config.cjs - Production configuration
module.exports = {
  apps: [
    {
      name: 'luxcera-server',
      cwd: './server',
      script: 'dist/index.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      out_file: '../logs/server.out.log',
      error_file: '../logs/server.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        PORT: 8787,
        CORS_ORIGIN: 'http://localhost:5173'
      }
    },
    {
      name: 'luxcera-client',
      cwd: './client',
      script: './node_modules/vite/bin/vite.js',
      args: ['preview', '--port', '5173', '--host', '0.0.0.0', '--strictPort'],
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      out_file: '../logs/client.out.log',
      error_file: '../logs/client.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: { 
        NODE_ENV: 'production'
      }
    }
  ]
}
