const { asyncHandler } = require("../utils/asyncHandler");
const {
  createBotRecord,
  findBotByIdForUser,
  listBotsForUser,
  serializeBot,
  updateBotRecord,
  deleteBotRecord
} = require("../services/botService");
const {
  provisionBotWorkspace,
  applyUploadedFiles,
  refreshBotLaunchConfig,
  updateBotLaunchConfig,
  runBotPrestartCommand,
  readBotEnv,
  writeBotEnv,
  installBotDependencies,
  deleteBotWorkspace
} = require("../services/botRuntimeService");
const {
  listProjectTree,
  readProjectFile,
  writeProjectFile,
  createProjectFolder,
  createProjectFile
} = require("../services/projectFileService");
const {
  getBotProcessSnapshot,
  getBotProcessSnapshots,
  startBotProcess,
  stopBotProcess,
  restartBotProcess,
  removeBotProcess,
  readBotLogs
} = require("../services/pm2Service");
const { removeUploadedTempFiles } = require("../services/fileService");

async function hydrateBot(bot) {
  let runtime;

  try {
    runtime = await getBotProcessSnapshot(bot);
  } catch (error) {
    runtime = {
      status: bot.status || "offline",
      cpu: 0,
      memory: 0,
      uptime: null,
      logFiles: null
    };
  }

  if (runtime.status !== bot.status) {
    bot = updateBotRecord(bot.id, {
      status: runtime.status
    });
  }

  return serializeBot(bot, runtime);
}

function requireOwnedBot(req) {
  const bot = findBotByIdForUser(Number(req.params.botId), req.user.id);

  if (!bot) {
    const error = new Error("Nie znaleziono wskazanego bota.");
    error.statusCode = 404;
    throw error;
  }

  return bot;
}

function requirePathValue(rawPath) {
  if (!rawPath || typeof rawPath !== "string" || !rawPath.trim()) {
    const error = new Error("Sciezka jest wymagana.");
    error.statusCode = 400;
    throw error;
  }

  return rawPath.trim();
}

const listBots = asyncHandler(async (req, res) => {
  const bots = listBotsForUser(req.user.id);
  let runtimeSnapshots = {};

  try {
    runtimeSnapshots = await getBotProcessSnapshots(bots);
  } catch (error) {
    runtimeSnapshots = {};
  }

  const items = bots.map((bot) => {
    const runtime = runtimeSnapshots[bot.id] || {
      status: bot.status || "offline",
      cpu: 0,
      memory: 0,
      uptime: null,
      logFiles: null
    };

    if (runtime.status !== bot.status) {
      bot = updateBotRecord(bot.id, {
        status: runtime.status
      });
    }

    return serializeBot(bot, runtime);
  });

  res.json({
    items,
    limit: null,
    unlimitedBots: true
  });
});

const createBot = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      message: "Nazwa bota jest wymagana."
    });
  }

  let bot = createBotRecord({
    userId: req.user.id,
    name: name.trim(),
    path: "pending"
  });

  const botPath = await provisionBotWorkspace(bot.id, bot.name);
  bot = updateBotRecord(bot.id, { path: botPath });

  res.status(201).json({
    bot: await hydrateBot(bot)
  });
});

const getBot = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);

  res.json({
    bot: await hydrateBot(bot)
  });
});

const deleteBot = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);

  await removeBotProcess(bot);
  await deleteBotWorkspace(bot);
  deleteBotRecord(bot.id);

  res.json({
    message: "Bot zostal usuniety razem z procesem PM2 i katalogiem projektu."
  });
});

const uploadFiles = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);

  try {
    const updatedBot = await applyUploadedFiles(bot, req.files);

    res.json({
      message: "Pliki zostały wgrane do katalogu bota.",
      bot: await hydrateBot(updatedBot)
    });
  } finally {
    await removeUploadedTempFiles(req.files || {});
  }
});

const getEnv = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const raw = await readBotEnv(bot);

  res.json({
    raw
  });
});

const updateEnv = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const raw = typeof req.body.raw === "string" ? req.body.raw : "";
  const savedRaw = await writeBotEnv(bot, raw);

  res.json({
    message: "Plik .env został zapisany.",
    raw: savedRaw
  });
});

const installDependencies = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const result = await installBotDependencies(bot);

  res.json({
    message: "Zależności zostały zainstalowane.",
    result
  });
});

const updateStartup = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const updatedBot = await updateBotLaunchConfig(bot, {
    runtimeMode: req.body.runtimeMode,
    entryFile: req.body.entryFile,
    prestartCommand: req.body.prestartCommand
  });

  res.json({
    message: "Parametry startowe zostaly zapisane.",
    bot: await hydrateBot(updatedBot)
  });
});

const detectStartup = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const updatedBot = await refreshBotLaunchConfig(bot);

  res.json({
    message: "Parametry startowe zostaly wykryte automatycznie.",
    bot: await hydrateBot(updatedBot)
  });
});

const startBot = asyncHandler(async (req, res) => {
  let bot = requireOwnedBot(req);
  const startupWasIncomplete = bot.runtime_mode !== "npm" && !bot.entry_file;

  if (startupWasIncomplete) {
    bot = await refreshBotLaunchConfig(bot);
  }

  await runBotPrestartCommand(bot);

  if (startupWasIncomplete && bot.runtime_mode !== "npm" && !bot.entry_file) {
    bot = await refreshBotLaunchConfig(bot);
  }

  const runtime = await startBotProcess(bot);
  bot = updateBotRecord(bot.id, {
    status: runtime.status
  });

  res.json({
    message: "Bot został uruchomiony.",
    bot: serializeBot(bot, runtime)
  });
});

const stopBot = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const runtime = await stopBotProcess(bot);
  const updatedBot = updateBotRecord(bot.id, {
    status: runtime.status
  });

  res.json({
    message: "Bot został zatrzymany.",
    bot: serializeBot(updatedBot, runtime)
  });
});

const restartBot = asyncHandler(async (req, res) => {
  let bot = requireOwnedBot(req);
  const startupWasIncomplete = bot.runtime_mode !== "npm" && !bot.entry_file;

  if (startupWasIncomplete) {
    bot = await refreshBotLaunchConfig(bot);
  }

  await runBotPrestartCommand(bot);

  if (startupWasIncomplete && bot.runtime_mode !== "npm" && !bot.entry_file) {
    bot = await refreshBotLaunchConfig(bot);
  }

  const runtime = await restartBotProcess(bot);
  bot = updateBotRecord(bot.id, {
    status: runtime.status
  });

  res.json({
    message: "Bot został zrestartowany.",
    bot: serializeBot(bot, runtime)
  });
});

const getLogs = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const limit = Math.max(10, Math.min(Number(req.query.lines) || 200, 500));
  const logs = await readBotLogs(bot, limit);

  res.json(logs);
});

const getStatus = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);

  res.json({
    bot: await hydrateBot(bot)
  });
});

const getProjectTree = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const tree = await listProjectTree(bot.path);

  res.json({
    tree
  });
});

const getProjectFileContent = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const filePath = requirePathValue(req.query.path);
  const content = await readProjectFile(bot.path, filePath);

  res.json({
    path: filePath,
    content
  });
});

const saveProjectFileContent = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const filePath = requirePathValue(req.body.path);
  const content = typeof req.body.content === "string" ? req.body.content : "";
  const savedPath = await writeProjectFile(bot.path, filePath, content);

  res.json({
    message: "Plik zostal zapisany.",
    path: savedPath
  });
});

const createProjectFolderAction = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const folderPath = requirePathValue(req.body.path);
  const savedPath = await createProjectFolder(bot.path, folderPath);

  res.status(201).json({
    message: "Folder zostal utworzony.",
    path: savedPath
  });
});

const createProjectFileAction = asyncHandler(async (req, res) => {
  const bot = requireOwnedBot(req);
  const filePath = requirePathValue(req.body.path);
  const content = typeof req.body.content === "string" ? req.body.content : "";
  const savedPath = await createProjectFile(bot.path, filePath, content);

  res.status(201).json({
    message: "Plik zostal utworzony.",
    path: savedPath,
    content
  });
});

module.exports = {
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
};
