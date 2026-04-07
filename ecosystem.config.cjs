module.exports = {
  apps: [
    {
      name: "discord-hosting-panel",
      script: "backend/src/index.js",
      cwd: __dirname,
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    }
  ]
};
