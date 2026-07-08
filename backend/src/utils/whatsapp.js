const { toWhatsAppDigits } = require('./phone')

function createDefaultWhatsAppMessage(productName) {
  return `Hello, I saw your ${productName} listing on CultivaX. Is it still available?`
}

function mapWhatsAppContactFields(product) {
  const phone = product.whatsapp_phone || product.farmer_phone

  return {
    messageTemplate: createDefaultWhatsAppMessage(product.name),
    phone,
    whatsappDigits: toWhatsAppDigits(phone),
  }
}

module.exports = {
  createDefaultWhatsAppMessage,
  mapWhatsAppContactFields,
}
