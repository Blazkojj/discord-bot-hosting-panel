const path = require("path");
const { spawn } = require("child_process");
const { paths } = require("../config/paths");
const { extractArchiveSecure } = require("./archiveService");
const {
  ensureDir,
  slugify,
  copyUploadedFiles,
  normalizeRelativePath,
  removeDirectoryInside,
  readEnvAsObject,
  writeTextFile,
  readTextFile,
  pathExists
} = require("./fileService");
const { updateBotRecord } = require("./botService");

function getNpmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function getNpmSpawnConfig(args) {
  return {
    command: getNpmCommand(),
    args
  };
}

async function readBotPackageJson(botPath) {
  const packageJsonPath = path.join(botPath, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    return null;
  }

  const rawPackageJson = await readTextFile(packageJsonPath, "{}");

  try {
    return JSON.parse(rawPackageJson);
  } catch (error) {
    throw new Error("Plik package.json nie jest poprawnym JSON-em.");
  }
}

async function provisionBotWorkspace(botId, botName) {
  const folderName = `bot-${botId}-${slugify(botName) || "discord-bot"}`;
  const botRoot = path.join(paths.storageRoot, folderName);

  await ensureDir(botRoot);
  await ensureDir(path.join(botRoot, ".runtime"));

  return botRoot;
}

async function inspectBotWorkspace(botPath) {
  const preferredEntries = [
    "index.js",
    "src/index.js",
    "bot.js",
    "src/bot.js",
    "main.js",
    "app.js"
  ];

  let runtimeMode = "node";
  let entryFile = null;
  const packageJson = await readBotPackageJson(botPath);

  if (packageJson) {
    if (packageJson.scripts && packageJson.scripts.start) {
      runtimeMode = "npm";
    }

    if (typeof packageJson.main === "string" && packageJson.main.trim()) {
      entryFile = packageJson.main.trim();
    }
  }

  if (!entryFile) {
    for (const candidate of preferredEntries) {
      if (await pathExists(path.join(botPath, candidate))) {
        entryFile = candidate;
        break;
      }
    }
  }

  return {
    runtimeMode,
    entryFile,
    hasPackageJson: Boolean(packageJson),
    hasStartScript: Boolean(packageJson && packageJson.scripts && packageJson.scripts.start)
  };
}

async function applyUploadedFiles(bot, uploadedFiles = {}) {
  const archiveFiles = uploadedFiles.archive || [];
  const looseFiles = uploadedFiles.files || [];

  if (!archiveFiles.length && !looseFiles.length) {
    throw new Error("Nie przesłano żadnych plików do wdrożenia.");
  }

  for (const archiveFile of archiveFiles) {
    await extractArchiveSecure(archiveFile.path, bot.path, archiveFile.originalname);
  }

  if (looseFiles.length) {
    await copyUploadedFiles(bot.path, looseFiles);
  }

  const launchConfig = await inspectBotWorkspace(bot.path);

  return updateBotRecord(bot.id, {
    runtime_mode: launchConfig.runtimeMode,
    entry_file: launchConfig.entryFile,
    last_uploaded_at: new Date().toISOString()
  });
}

async function refreshBotLaunchConfig(bot) {
  const launchConfig = await inspectBotWorkspace(bot.path);

  return updateBotRecord(bot.id, {
    runtime_mode: launchConfig.runtimeMode,
    entry_file: launchConfig.entryFile
  });
}

async function updateBotLaunchConfig(bot, config = {}) {
  const runtimeMode = config.runtimeMode === "npm" ? "npm" : "node";
  const rawEntryFile = typeof config.entryFile === "string" ? config.entryFile.trim() : "";
  const prestartCommand =
    typeof config.prestartCommand === "string" ? config.prestartCommand.trim() : "";
  const entryFile =
    runtimeMode === "npm"
      ? null
      : rawEntryFile
        ? normalizeRelativePath(rawEntryFile)
        : "";

  if (runtimeMode !== "npm" && !entryFile) {
    throw new Error("Dla trybu node musisz podac plik startowy, np. index.js.");
  }

  await resolvePrestartExecution(bot, prestartCommand);

  return updateBotRecord(bot.id, {
    runtime_mode: runtimeMode,
    entry_file: entryFile,
    prestart_command: prestartCommand
  });
}

async function resolvePrestartExecution(bot, rawCommand) {
  const normalizedCommand = String(rawCommand || "").trim();

  if (!normalizedCommand) {
    return null;
  }

  if (normalizedCommand === "npm install") {
    const packageJson = await readBotPackageJson(bot.path);

    if (!packageJson) {
      throw new Error("Komenda przed startem `npm install` wymaga pliku package.json.");
    }

    return {
      command: getNpmCommand(),
      args: ["install"],
      displayCommand: "npm install"
    };
  }

  const npmRunMatch = normalizedCommand.match(/^npm\s+run\s+([a-zA-Z0-9:_-]+)$/);

  if (npmRunMatch) {
    const scriptName = npmRunMatch[1];
    const packageJson = await readBotPackageJson(bot.path);

    if (!packageJson || !packageJson.scripts || !packageJson.scripts[scriptName]) {
      throw new Error(
        `Komenda przed startem wymaga istniejacego skryptu npm run ${scriptName} w package.json.`
      );
    }

    return {
      command: getNpmCommand(),
      args: ["run", scriptName],
      displayCommand: `npm run ${scriptName}`
    };
  }

  const nodeMatch = normalizedCommand.match(/^node\s+(.+)$/);

  if (nodeMatch) {
    const relativeEntry = normalizeRelativePath(nodeMatch[1].trim());
    const targetPath = path.join(bot.path, relativeEntry);

    if (!(await pathExists(targetPath))) {
      throw new Error(`Komenda przed startem wskazuje nieistniejacy plik: ${relativeEntry}.`);
    }

    return {
      command: process.execPath,
      args: [relativeEntry],
      displayCommand: `node ${relativeEntry}`
    };
  }

  throw new Error(
    "Dozwolone komendy przed startem to tylko: npm install, npm run <skrypt> albo node <plik>."
  );
}

async function runBotPrestartCommand(bot) {
  const execution = await resolvePrestartExecution(bot, bot.prestart_command);

  if (!execution) {
    return {
      executed: false,
      command: "",
      output: "",
      logFilePath: path.join(bot.path, ".runtime", "prestart.log")
    };
  }

  const logFilePath = path.join(bot.path, ".runtime", "prestart.log");
  await ensureDir(path.dirname(logFilePath));
  const envValues = await readEnvAsObject(path.join(bot.path, ".env"));

  return new Promise((resolve, reject) => {
    const child = spawn(execution.command, execution.args, {
      cwd: bot.path,
      shell: false,
      env: {
        ...process.env,
        ...envValues,
        DISCORD_HOSTING_BOT_ID: String(bot.id)
      }
    });

    let combinedOutput = "";

    child.stdout.on("data", (chunk) => {
      combinedOutput += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      combinedOutput += chunk.toString();
    });

    child.on("error", async (error) => {
      await writeTextFile(logFilePath, combinedOutput);
      reject(
        new Error(`Nie udalo sie uruchomic komendy przed startem: ${error.message}`)
      );
    });

    child.on("close", async (code) => {
      await writeTextFile(logFilePath, combinedOutput);

      if (code !== 0) {
        reject(
          new Error(
            `Komenda przed startem \`${execution.displayCommand}\` zakonczyla sie kodem ${code}.`
          )
        );
        return;
      }

      resolve({
        executed: true,
        command: execution.displayCommand,
        output: combinedOutput,
        logFilePath
      });
    });
  });
}

async function readBotEnv(bot) {
  return readTextFile(path.join(bot.path, ".env"), "");
}

async function writeBotEnv(bot, rawEnv) {
  const finalContents = rawEnv.endsWith("\n") ? rawEnv : `${rawEnv}\n`;
  await writeTextFile(path.join(bot.path, ".env"), finalContents);
  return finalContents;
}

async function installBotDependencies(bot) {
  const packageJsonPath = path.join(bot.path, "package.json");

  if (!(await pathExists(packageJsonPath))) {
    throw new Error("Nie znaleziono pliku package.json. Najpierw wgraj kod bota.");
  }

  const logFilePath = path.join(bot.path, ".runtime", "install.log");
  const npmExecution = getNpmSpawnConfig(["install"]);

  return new Promise((resolve, reject) => {
    const child = spawn(npmExecution.command, npmExecution.args, {
      cwd: bot.path,
      shell: false,
      env: process.env
    });

    let combinedOutput = "";

    child.stdout.on("data", (chunk) => {
      combinedOutput += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      combinedOutput += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Nie udało się uruchomić npm install: ${error.message}`));
    });

    child.on("close", async (code) => {
      await writeTextFile(logFilePath, combinedOutput);

      if (code !== 0) {
        reject(
          new Error(`npm install zakończył się kodem ${code}. Sprawdź log instalacji.`)
        );
        return;
      }

      resolve({
        success: true,
        command: `${npmExecution.command} ${npmExecution.args.join(" ")}`,
        output: combinedOutput,
        logFilePath
      });
    });
  });
}

async function deleteBotWorkspace(bot) {
  await removeDirectoryInside(paths.storageRoot, bot.path);
}

module.exports = {
  provisionBotWorkspace,
  inspectBotWorkspace,
  applyUploadedFiles,
  refreshBotLaunchConfig,
  updateBotLaunchConfig,
  runBotPrestartCommand,
  readBotEnv,
  writeBotEnv,
  installBotDependencies,
  deleteBotWorkspace
};
