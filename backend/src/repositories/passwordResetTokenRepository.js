const { pool } = require('../config/database')

async function invalidateUnusedTokensForUser(userId, connection = pool) {
  await connection.execute(
    `UPDATE password_reset_tokens
     SET used_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND used_at IS NULL`,
    [userId],
  )
}

async function createPasswordResetToken(token, connection = pool) {
  const [result] = await connection.execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [token.userId, token.tokenHash, token.expiresAt],
  )

  return result.insertId
}

async function findUsableTokenByHash(tokenHash, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT password_reset_token_id, user_id, token_hash, expires_at, used_at
     FROM password_reset_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > UTC_TIMESTAMP()
     LIMIT 1`,
    [tokenHash],
  )

  return rows[0] || null
}

async function markTokenUsed(tokenId, connection = pool) {
  await connection.execute(
    `UPDATE password_reset_tokens
     SET used_at = CURRENT_TIMESTAMP
     WHERE password_reset_token_id = ?`,
    [tokenId],
  )
}

async function findLatestTokenForUser(userId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT password_reset_token_id, user_id, token_hash, expires_at, used_at, created_at
     FROM password_reset_tokens
     WHERE user_id = ?
     ORDER BY created_at DESC, password_reset_token_id DESC
     LIMIT 1`,
    [userId],
  )

  return rows[0] || null
}

module.exports = {
  createPasswordResetToken,
  findLatestTokenForUser,
  findUsableTokenByHash,
  invalidateUnusedTokensForUser,
  markTokenUsed,
}
