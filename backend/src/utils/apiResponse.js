function sendSuccess(res, data, options = {}) {
  const body = {
    success: true,
    data,
  }

  if (options.meta) {
    body.meta = options.meta
  }

  return res.status(options.statusCode || 200).json(body)
}

function sendError(res, error, statusCode) {
  return res.status(statusCode).json({
    success: false,
    error,
  })
}

module.exports = {
  sendError,
  sendSuccess,
}
