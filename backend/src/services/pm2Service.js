const path = require("path");
const pm2 = require("pm2");
const { ensureDir, readEnvAsObject, tailTextFile } = require("./fileService");

function getNpmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function getPm2NpmProcessDefinition() {
  return {
    script: getNpmCommand(),
    args: ["run", "start"],
    interpreter: "none"
  };
}

function getProcessName(bot) {
  return `discord-bot-${bot.id}`;
}

function getDefaultLogFiles(bot) {
  return {
    out: path.join(bot.path, ".runtime", "stdout.log"),
    err: path.join(bot.path, ".runtime", "stderr.log")
  };
}

function connectPm2() {
  return new Promise((resolve, reject) => {
    pm2.connect((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function disconnectPm2() {
  return new Promise((resolve) => {
    pm2.disconnect(() => resolve());
  });
}

function promisifyPm2(method, ...args) {
  return new Promise((resolve, reject) => {
    pm2[method](...args, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

async function withPm2(handler) {
  await connectPm2();

  try {
    return await handler({
      start: (...args) => promisifyPm2("start", ...args),
      stop: (...args) => promisifyPm2("stop", ...args),
      delete: (...args) => promisifyPm2("delete", ...args),
      describe: (...args) => promisifyPm2("describe", ...args),
      list: (...args) => promisifyPm2("list", ...args)
    });
  } finally {
    await disconnectPm2();
  }
}

function normalizeProcessSnapshot(bot, processDescription) {
  const logFiles = getDefaultLogFiles(bot);

  if (!processDescription) {
    return {
      status: "offline",
      cpu: 0,
      memory: 0,
      uptime: null,
      logFiles
    };
  }

  return {
    status: processDescription.pm2_env?.status || "offline",
    cpu: processDescription.monit?.cpu || 0,
    memory: processDescription.monit?.memory || 0,
    uptime: processDescription.pm2_env?.pm_uptime || null,
    logFiles: {
      out: processDescription.pm2_env?.pm_out_log_path || logFiles.out,
      err: processDescription.pm2_env?.pm_err_log_path || logFiles.err
    }
  };
}

async function getBotProcessSnapshot(bot) {
  return withPm2(async (client) => {
    const processes = await client.describe(getProcessName(bot));
    return normalizeProcessSnapshot(bot, processes[0]);
  });
}

async function getBotProcessSnapshots(bots) {
  if (!bots.length) {
    return {};
  }

  return withPm2(async (client) => {
    const processes = await client.list();
    const processMap = new Map(
      processes.map((processDescription) => [processDescription.name, processDescription])
    );

    return bots.reduce((accumulator, bot) => {
      accumulator[bot.id] = normalizeProcessSnapshot(
        bot,
        processMap.get(getProcessName(bot))
      );
      return accumulator;
    }, {});
  });
}

async function startBotProcess(bot) {
  if (bot.runtime_mode !== "npm" && !bot.entry_file) {
    throw new Error(
      "Nie udało się wykryć pliku startowego. Dodaj package.json ze skryptem start lub plik index.js."
    );
  }

  const runtimeDir = path.join(bot.path, ".runtime");
  await ensureDir(runtimeDir);

  const logFiles = getDefaultLogFiles(bot);
  const envFile = path.join(bot.path, ".env");
  const env = await readEnvAsObject(envFile);
  const processName = getProcessName(bot);

  const processDefinition =
    bot.runtime_mode === "npm"
      ? getPm2NpmProcessDefinition()
      : {
          script: bot.entry_file
        };

  return withPm2(async (client) => {
    const existingProcesses = await client.describe(processName);

    if (existingProcesses.length) {
      try {
        await client.delete(processName);
      } catch (error) {
        if (!String(error.message || "").includes("not found")) {
          throw error;
        }
      }
    }

    await client.start({
      name: processName,
      cwd: bot.path,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      merge_logs: true,
      out_file: logFiles.out,
      error_file: logFiles.err,
      env: {
        ...process.env,
        ...env,
        DISCORD_HOSTING_BOT_ID: String(bot.id)
      },
      ...processDefinition
    });

    const processes = await client.describe(processName);
    return normalizeProcessSnapshot(bot, processes[0]);
  });
}

async function stopBotProcess(bot) {
  return withPm2(async (client) => {
    try {
      await client.stop(getProcessName(bot));
    } catch (error) {
      if (!String(error.message || "").includes("not found")) {
        throw error;
      }
    }

    const processes = await client.describe(getProcessName(bot));
    return normalizeProcessSnapshot(bot, processes[0]);
  });
}

async function restartBotProcess(bot) {
  return startBotProcess(bot);
}

async function removeBotProcess(bot) {
  return withPm2(async (client) => {
    try {
      await client.delete(getProcessName(bot));
    } catch (error) {
      if (!String(error.message || "").includes("not found")) {
        throw error;
      }
    }

    return normalizeProcessSnapshot(bot, null);
  });
}

async function readBotLogs(bot, limit = 200) {
  const logFiles = getDefaultLogFiles(bot);
  const stdout = await tailTextFile(logFiles.out, limit);
  const stderr = await tailTextFile(logFiles.err, limit);
  const entries = [
    ...stdout.map((message) => ({ source: "stdout", message })),
    ...stderr.map((message) => ({ source: "stderr", message }))
  ].slice(-limit);

  return {
    entries,
    stdout,
    stderr,
    logFiles
  };
}

module.exports = {
  getProcessName,
  getDefaultLogFiles,
  getBotProcessSnapshot,
  getBotProcessSnapshots,
  startBotProcess,
  stopBotProcess,
  restartBotProcess,
  removeBotProcess,
  readBotLogs
};
