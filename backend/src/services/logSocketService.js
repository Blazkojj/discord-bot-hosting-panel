const fs = require("fs");
const { verifyAccessToken } = require("../utils/jwt");
const { findUserById } = require("./userService");
const { findBotByIdForUser } = require("./botService");
const { getDefaultLogFiles, readBotLogs } = require("./pm2Service");

async function readIncrementalChunk(filePath, offset) {
  try {
    const stats = await fs.promises.stat(filePath);
    const nextOffset = stats.size < offset ? 0 : offset;

    if (stats.size === nextOffset) {
      return {
        nextOffset,
        content: ""
      };
    }

    const length = stats.size - nextOffset;
    const fileHandle = await fs.promises.open(filePath, "r");
    const buffer = Buffer.alloc(length);
    await fileHandle.read(buffer, 0, length, nextOffset);
    await fileHandle.close();

    return {
      nextOffset: stats.size,
      content: buffer.toString("utf8")
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        nextOffset: 0,
        content: ""
      };
    }

    throw error;
  }
}

function setupLogSocket(io) {
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Brak tokenu dla Socket.IO."));
      }

      const payload = verifyAccessToken(token);
      const user = findUserById(Number(payload.sub));

      if (!user) {
        return next(new Error("Uzytkownik nie istnieje."));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Nie mozna uwierzytelnic polaczenia Socket.IO."));
    }
  });

  io.on("connection", (socket) => {
    let streamState = null;

    async function stopStreaming() {
      if (streamState?.interval) {
        clearInterval(streamState.interval);
      }

      streamState = null;
    }

    socket.on("logs:unsubscribe", async () => {
      await stopStreaming();
    });

    socket.on("logs:subscribe", async ({ botId }) => {
      try {
        await stopStreaming();

        const bot = findBotByIdForUser(Number(botId), socket.user.id);

        if (!bot) {
          socket.emit("logs:error", {
            message: "Nie znaleziono bota przypisanego do uzytkownika."
          });
          return;
        }

        const snapshot = await readBotLogs(bot, 150);
        socket.emit("logs:init", {
          botId: bot.id,
          entries: snapshot.entries
        });

        const logFiles = getDefaultLogFiles(bot);
        streamState = {
          botId: bot.id,
          offsets: {
            stdout: 0,
            stderr: 0
          }
        };

        const outStats = await fs.promises.stat(logFiles.out).catch(() => ({ size: 0 }));
        const errStats = await fs.promises.stat(logFiles.err).catch(() => ({ size: 0 }));

        streamState.offsets.stdout = outStats.size;
        streamState.offsets.stderr = errStats.size;

        streamState.interval = setInterval(async () => {
          try {
            const stdoutResult = await readIncrementalChunk(
              logFiles.out,
              streamState.offsets.stdout
            );
            streamState.offsets.stdout = stdoutResult.nextOffset;

            if (stdoutResult.content) {
              socket.emit("logs:chunk", {
                source: "stdout",
                message: stdoutResult.content
              });
            }

            const stderrResult = await readIncrementalChunk(
              logFiles.err,
              streamState.offsets.stderr
            );
            streamState.offsets.stderr = stderrResult.nextOffset;

            if (stderrResult.content) {
              socket.emit("logs:chunk", {
                source: "stderr",
                message: stderrResult.content
              });
            }
          } catch (error) {
            socket.emit("logs:error", {
              message: "Nie udalo sie odczytac kolejnych fragmentow logu."
            });
          }
        }, 1500);
      } catch (error) {
        socket.emit("logs:error", {
          message: error.message || "Nie udalo sie zainicjalizowac streamu logow."
        });
      }
    });

    socket.on("disconnect", async () => {
      await stopStreaming();
    });
  });
}

module.exports = {
  setupLogSocket
};
