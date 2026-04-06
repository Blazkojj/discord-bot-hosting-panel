const path = require("path");
const multer = require("multer");
const { paths } = require("../config/paths");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, paths.uploadTmpRoot);
  },
  filename: (req, file, callback) => {
    const safeName = path
      .basename(file.originalname)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 100
  }
});

const botUploadMiddleware = upload.fields([
  { name: "archive", maxCount: 1 },
  { name: "files", maxCount: 100 }
]);

module.exports = {
  botUploadMiddleware
};
