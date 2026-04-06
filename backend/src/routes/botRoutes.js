const express = require("express");
const {
  listBots,
  createBot,
  getBot,
  deleteBot,
  uploadFiles,
  getEnv,
  updateEnv,
  installDependencies,
  updateStartup,
  detectStartup,
  startBot,
  stopBot,
  restartBot,
  getLogs,
  getStatus,
  getProjectTree,
  getProjectFileContent,
  saveProjectFileContent,
  createProjectFolderAction,
  createProjectFileAction
} = require("../controllers/botController");
const { requireAuth } = require("../middleware/auth");
const { botUploadMiddleware } = require("../middleware/upload");

const router = express.Router();

router.use(requireAuth);
router.get("/", listBots);
router.post("/", createBot);
router.get("/:botId", getBot);
router.delete("/:botId", deleteBot);
router.post("/:botId/upload", botUploadMiddleware, uploadFiles);
router.get("/:botId/env", getEnv);
router.put("/:botId/env", updateEnv);
router.post("/:botId/install", installDependencies);
router.put("/:botId/startup", updateStartup);
router.post("/:botId/startup/detect", detectStartup);
router.post("/:botId/start", startBot);
router.post("/:botId/stop", stopBot);
router.post("/:botId/restart", restartBot);
router.get("/:botId/logs", getLogs);
router.get("/:botId/status", getStatus);
router.get("/:botId/files/tree", getProjectTree);
router.get("/:botId/files/content", getProjectFileContent);
router.put("/:botId/files/content", saveProjectFileContent);
router.post("/:botId/files/folder", createProjectFolderAction);
router.post("/:botId/files/file", createProjectFileAction);

module.exports = router;
