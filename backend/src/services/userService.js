const db = require("../config/database");

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at
  };
}

function findUserByEmail(email) {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase());
}

function findUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function createUser(email, passwordHash) {
  const now = new Date().toISOString();
  const normalizedEmail = email.trim().toLowerCase();

  const result = db
    .prepare(
      "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)"
    )
    .run(normalizedEmail, passwordHash, now);

  return findUserById(Number(result.lastInsertRowid));
}

module.exports = {
  sanitizeUser,
  findUserByEmail,
  findUserById,
  createUser
};
