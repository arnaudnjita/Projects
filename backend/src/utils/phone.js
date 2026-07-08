const { parsePhoneNumberFromString } = require('libphonenumber-js')

function normalizePhoneNumber(value, defaultCountry = 'CM') {
  const phoneNumber = parsePhoneNumberFromString(String(value || '').trim(), defaultCountry)

  if (!phoneNumber || !phoneNumber.isValid()) {
    return null
  }

  return phoneNumber.number
}

function toWhatsAppDigits(value, defaultCountry = 'CM') {
  const normalized = normalizePhoneNumber(value, defaultCountry)

  if (!normalized) {
    return null
  }

  return normalized.replace(/\D/g, '')
}

module.exports = {
  normalizePhoneNumber,
  toWhatsAppDigits,
}
