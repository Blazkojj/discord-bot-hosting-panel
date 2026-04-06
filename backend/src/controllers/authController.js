const { asyncHandler } = require("../utils/asyncHandler");
const { createAccessToken } = require("../utils/jwt");
const { hashPassword, verifyPassword } = require("../utils/password");
const {
  createUser,
  findUserByEmail,
  sanitizeUser
} = require("../services/userService");

const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email i hasło są wymagane."
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Hasło musi mieć co najmniej 8 znaków."
    });
  }

  const existingUser = findUserByEmail(email);

  if (existingUser) {
    return res.status(409).json({
      message: "Konto z takim adresem email już istnieje."
    });
  }

  const passwordHash = await hashPassword(password);
  const user = createUser(email, passwordHash);
  const token = createAccessToken(user);

  res.status(201).json({
    token,
    user: sanitizeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email i hasło są wymagane."
    });
  }

  const user = findUserByEmail(email);

  if (!user) {
    return res.status(401).json({
      message: "Nieprawidłowy email lub hasło."
    });
  }

  const passwordMatches = await verifyPassword(password, user.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({
      message: "Nieprawidłowy email lub hasło."
    });
  }

  const token = createAccessToken(user);

  res.json({
    token,
    user: sanitizeUser(user)
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    user: sanitizeUser(req.user)
  });
});

module.exports = {
  register,
  login,
  me
};
