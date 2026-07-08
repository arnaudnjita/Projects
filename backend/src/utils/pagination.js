function parsePositiveInteger(value, fallback, max) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, max)
}

function parsePagination(query = {}) {
  const page = parsePositiveInteger(query.page, 1, 100000)
  const pageSize = parsePositiveInteger(query.pageSize, 20, 100)

  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    page,
    pageSize,
  }
}

module.exports = {
  parsePagination,
}
