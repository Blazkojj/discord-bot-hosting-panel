const fs = require("fs");
const path = require("path");
const { config, rootDir } = require("./env");

const storageRoot = path.resolve(rootDir, config.botStoragePath);
const uploadTmpRoot = path.resolve(rootDir, config.botUploadTmpPath);
const databaseFile = path.resolve(rootDir, config.databasePath);

fs.mkdirSync(storageRoot, { recursive: true });
fs.mkdirSync(uploadTmpRoot, { recursive: true });
fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

const paths = {
  rootDir,
  storageRoot,
  uploadTmpRoot,
  databaseFile
};

module.exports = {
  paths
};
