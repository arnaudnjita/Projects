const { normalizePhoneNumber, toWhatsAppDigits } = require('../src/utils/phone')

describe('phone utilities', () => {
  it('normalizes Cameroon local numbers to E.164', () => {
    expect(normalizePhoneNumber('6 12 34 56 78')).toBe('+237612345678')
  })

  it('keeps valid international numbers in E.164', () => {
    expect(normalizePhoneNumber('+234 803 123 4567')).toBe('+2348031234567')
  })

  it('returns null for invalid phone numbers', () => {
    expect(normalizePhoneNumber('123')).toBeNull()
  })

  it('formats WhatsApp numbers as digits only', () => {
    expect(toWhatsAppDigits('+237 612 345 678')).toBe('237612345678')
  })
})
