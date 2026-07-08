function parseAllowedSort(value, allowedSorts, fallback) {
  if (!allowedSorts || typeof allowedSorts !== 'object') {
    throw new Error('allowedSorts must be an object')
  }

  if (value && Object.prototype.hasOwnProperty.call(allowedSorts, value)) {
    return allowedSorts[value]
  }

  return allowedSorts[fallback]
}

module.exports = {
  parseAllowedSort,
}
