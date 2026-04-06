const { verifyAccessToken } = require("../utils/jwt");
const { findUserById } = require("../services/userService");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Brak tokenu autoryzacyjnego."
    });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = findUserById(Number(payload.sub));

    if (!user) {
      return res.status(401).json({
        message: "Sesja wygasła lub użytkownik nie istnieje."
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Nieprawidłowy token autoryzacyjny."
    });
  }
}

module.exports = {
  requireAuth
};
