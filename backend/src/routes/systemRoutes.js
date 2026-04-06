const express = require("express");

const router = express.Router();

router.get("/meta", (req, res) => {
  res.json({
    maxBotsPerUser: null,
    unlimitedBots: true,
    socketEnabled: true,
    pm2Managed: true,
    uploadLimits: {
      maxFileSizeMb: 50,
      maxFiles: 100
    }
  });
});

module.exports = router;
