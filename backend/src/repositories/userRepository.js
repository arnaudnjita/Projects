const { pool } = require('../config/database')

const safeUserColumns = 'user_id, name, phone, email, role, location, created_at, updated_at'
const privateUserColumns = `${safeUserColumns}, password_hash`

async function createUser(user, connection = pool) {
  const [result] = await connection.execute(
    `INSERT INTO users (name, phone, email, password_hash, role, location)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user.name, user.phone, user.email, user.passwordHash, user.role, user.location],
  )

  return findUserById(result.insertId, connection)
}

async function createFarmerProfile(profile, connection = pool) {
  await connection.execute(
    `INSERT INTO farmer_profiles (user_id, farm_location, produce_specialty, bio, profile_photo_url)
     VALUES (?, ?, ?, ?, ?)`,
    [profile.userId, profile.farmLocation, profile.produceSpecialty || null, profile.bio || null, null],
  )
}

async function findUserById(userId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${safeUserColumns}
     FROM users
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  )

  return rows[0] || null
}

async function findUserByPhone(phone, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${privateUserColumns}
     FROM users
     WHERE phone = ?
     LIMIT 1`,
    [phone],
  )

  return rows[0] || null
}

async function findUserByEmail(email, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT ${privateUserColumns}
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  )

  return rows[0] || null
}

async function countFarmerProfilesForUser(userId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS count
     FROM farmer_profiles
     WHERE user_id = ?`,
    [userId],
  )

  return Number(rows[0]?.count || 0)
}

async function updatePasswordHash(userId, passwordHash, connection = pool) {
  await connection.execute(
    `UPDATE users
     SET password_hash = ?
     WHERE user_id = ?`,
    [passwordHash, userId],
  )
}

module.exports = {
  countFarmerProfilesForUser,
  createFarmerProfile,
  createUser,
  findUserByEmail,
  findUserById,
  findUserByPhone,
  updatePasswordHash,
}
