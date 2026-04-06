const jwt = require("jsonwebtoken");
const { config } = require("../config/env");

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email
    },
    config.jwtSecret,
    {
      expiresIn: "7d"
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  createAccessToken,
  verifyAccessToken
};
