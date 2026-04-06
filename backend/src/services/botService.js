const db = require("../config/database");

function createBotRecord({ userId, name, path }) {
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `
        INSERT INTO bots (user_id, name, path, runtime_mode, status, created_at, updated_at)
        VALUES (?, ?, ?, 'node', 'offline', ?, ?)
      `
    )
    .run(userId, name.trim(), path, now, now);

  return findBotById(Number(result.lastInsertRowid));
}

function findBotById(id) {
  return db.prepare("SELECT * FROM bots WHERE id = ?").get(id);
}

function findBotByIdForUser(botId, userId) {
  return db
    .prepare("SELECT * FROM bots WHERE id = ? AND user_id = ?")
    .get(botId, userId);
}

function listBotsForUser(userId) {
  return db
    .prepare(
      "SELECT * FROM bots WHERE user_id = ? ORDER BY datetime(created_at) DESC"
    )
    .all(userId);
}

function countBotsForUser(userId) {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM bots WHERE user_id = ?")
    .get(userId);

  return row.count;
}

function updateBotRecord(botId, updates) {
  const allowedKeys = [
    "name",
    "path",
    "entry_file",
    "runtime_mode",
    "prestart_command",
    "status",
    "last_uploaded_at",
    "updated_at"
  ];

  const entries = Object.entries(updates).filter(([key]) =>
    allowedKeys.includes(key)
  );

  if (!entries.length) {
    return findBotById(botId);
  }

  const normalizedUpdates = [...entries];
  if (!updates.updated_at) {
    normalizedUpdates.push(["updated_at", new Date().toISOString()]);
  }

  const setClause = normalizedUpdates.map(([key]) => `${key} = ?`).join(", ");
  const values = normalizedUpdates.map(([, value]) => value);
  values.push(botId);

  db.prepare(`UPDATE bots SET ${setClause} WHERE id = ?`).run(...values);
  return findBotById(botId);
}

function deleteBotRecord(botId) {
  db.prepare("DELETE FROM bots WHERE id = ?").run(botId);
}

function serializeBot(bot, runtime = {}) {
  return {
    id: bot.id,
    userId: bot.user_id,
    name: bot.name,
    path: bot.path,
    entryFile: bot.entry_file,
    runtimeMode: bot.runtime_mode,
    prestartCommand: bot.prestart_command || "",
    status: runtime.status || bot.status,
    createdAt: bot.created_at,
    updatedAt: bot.updated_at,
    lastUploadedAt: bot.last_uploaded_at,
    metrics: {
      cpu: runtime.cpu || 0,
      memory: runtime.memory || 0,
      uptime: runtime.uptime || null
    },
    logFiles: runtime.logFiles || null
  };
}

module.exports = {
  createBotRecord,
  findBotById,
  findBotByIdForUser,
  listBotsForUser,
  countBotsForUser,
  updateBotRecord,
  deleteBotRecord,
  serializeBot
};
