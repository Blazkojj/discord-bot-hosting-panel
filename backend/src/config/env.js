const path = require("path");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "..", "..");

dotenv.config({
  path: path.join(rootDir, ".env"),
});

const config = {
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "change-this-super-secret-key",
  databasePath: process.env.DATABASE_PATH || "./storage/app.db",
  botStoragePath: process.env.BOT_STORAGE_PATH || "./storage/bots",
  botUploadTmpPath: process.env.BOT_UPLOAD_TMP_PATH || "./storage/tmp"
};

module.exports = {
  config,
  rootDir
};
