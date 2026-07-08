function toPublicUser(user) {
  if (!user) {
    return null
  }

  return {
    email: user.email || null,
    location: user.location || null,
    name: user.name,
    phone: user.phone,
    role: user.role,
    userId: user.user_id ?? user.userId,
  }
}

module.exports = {
  toPublicUser,
}
