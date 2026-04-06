const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { config } = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const botRoutes = require("./routes/botRoutes");
const systemRoutes = require("./routes/systemRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: [config.frontendUrl, "http://localhost:5173"],
    credentials: false
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/bots", botRoutes);
app.use("/api/system", systemRoutes);
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "Nie znaleziono wskazanego endpointu API."
  });
});

const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const hasFrontendDist = fs.existsSync(frontendDistPath);

if (hasFrontendDist) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.redirect(config.frontendUrl);
  });

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.status(503).send(`
      <!doctype html>
      <html lang="pl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Frontend not built</title>
          <style>
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              background: #05080f;
              color: #e5eefb;
              display: grid;
              place-items: center;
              min-height: 100vh;
              padding: 24px;
            }
            .card {
              max-width: 720px;
              width: 100%;
              background: #0c1421;
              border: 1px solid #1f2f44;
              border-radius: 20px;
              padding: 24px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
            }
            a {
              color: #64f6d3;
            }
            code {
              background: #09111c;
              padding: 2px 6px;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Frontend is not being served from Express yet</h1>
            <p>
              In development, open the panel on
              <a href="${config.frontendUrl}">${config.frontendUrl}</a>.
            </p>
            <p>
              If you want the backend on port <code>${config.port}</code> to serve the UI,
              build the frontend first with <code>npm run build</code>.
            </p>
          </div>
        </body>
      </html>
    `);
  });
}

app.use(errorHandler);

module.exports = app;
