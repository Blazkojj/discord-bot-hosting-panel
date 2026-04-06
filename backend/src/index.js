const http = require("http");
const { Server } = require("socket.io");
require("./config/database");
const app = require("./app");
const { config } = require("./config/env");
const { setupLogSocket } = require("./services/logSocketService");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [config.frontendUrl, "http://localhost:5173"]
  }
});

setupLogSocket(io);

server.listen(config.port, () => {
  console.log(`Discord bot hosting API listening on port ${config.port}`);
});
