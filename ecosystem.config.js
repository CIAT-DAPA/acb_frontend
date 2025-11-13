module.exports = {
  apps: [
    {
      name: "bulletin_builder_frontend",
      script: "npm",
      args: "start",
      cwd: "./src",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 8005,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8005,
      },
      out_file: "./bulletin_builder_frontend_out.log",
      error_file: "./bulletin_builder_frontend_err.log",
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
  ],
};
