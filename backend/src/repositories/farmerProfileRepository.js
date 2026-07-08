const { pool } = require('../config/database')

async function findProfileByUserId(userId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT
       u.user_id,
       u.name,
       u.location AS account_location,
       u.phone,
       u.email,
       fp.farmer_profile_id,
       fp.farm_location,
       fp.produce_specialty,
       fp.bio,
       fp.whatsapp_phone,
       fp.profile_photo_url
     FROM users u
     INNER JOIN farmer_profiles fp ON fp.user_id = u.user_id
     WHERE u.user_id = ?
     LIMIT 1`,
    [userId],
  )

  return rows[0] || null
}

async function updateUserProfileFields(userId, fields, connection = pool) {
  await connection.execute(
    `UPDATE users
     SET name = ?, location = ?, phone = ?
     WHERE user_id = ?`,
    [fields.name, fields.accountLocation, fields.phone, userId],
  )
}

async function updateFarmerProfileFields(userId, fields, connection = pool) {
  await connection.execute(
    `UPDATE farmer_profiles
     SET farm_location = ?,
         produce_specialty = ?,
         bio = ?,
         whatsapp_phone = ?,
         profile_photo_url = ?
     WHERE user_id = ?`,
    [
      fields.farmLocation,
      fields.produceSpecialty,
      fields.bio,
      fields.whatsappPhone,
      fields.profilePhotoUrl,
      userId,
    ],
  )
}

module.exports = {
  findProfileByUserId,
  updateFarmerProfileFields,
  updateUserProfileFields,
}
