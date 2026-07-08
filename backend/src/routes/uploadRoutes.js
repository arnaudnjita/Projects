const express = require('express')
const { ensurePlaceholderImage, uploadRoot } = require('../services/imageStorageService')

const router = express.Router()

router.use(
  '/',
  express.static(uploadRoot, {
    dotfiles: 'deny',
    etag: true,
    fallthrough: true,
    immutable: true,
    index: false,
    maxAge: '7d',
    setHeaders(res) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable')
      res.setHeader('X-Content-Type-Options', 'nosniff')
    },
  }),
)

router.get('/placeholder', async (_req, res, next) => {
  try {
    res.redirect(await ensurePlaceholderImage())
  } catch (error) {
    next(error)
  }
})

module.exports = router
