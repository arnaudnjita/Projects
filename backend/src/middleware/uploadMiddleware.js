const multer = require('multer')

const env = require('../config/env')
const { AppError } = require('../errors/AppError')
const { allowedMimeTypes, maxProductImageCount } = require('../services/imageStorageService')

function imageFileFilter(_req, file, callback) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(
      new AppError('Please check the highlighted fields.', {
        code: 'VALIDATION_ERROR',
        fields: [{ field: file.fieldname, message: 'Only JPEG, PNG, and WebP images are allowed.' }],
        statusCode: 422,
      }),
    )
    return
  }

  callback(null, true)
}

const imageUpload = multer({
  fileFilter: imageFileFilter,
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024,
    files: maxProductImageCount,
  },
  storage: multer.memoryStorage(),
})

function profileImageUpload(req, res, next) {
  imageUpload.single('image')(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      next(
        new AppError('Please check the highlighted fields.', {
          code: 'VALIDATION_ERROR',
          fields: [{ field: 'image', message: `Image must be ${env.maxUploadMb}MB or smaller.` }],
          statusCode: 413,
        }),
      )
      return
    }

    next(error)
  })
}

function productImagesUpload(req, res, next) {
  imageUpload.array('images', maxProductImageCount)(req, res, (error) => {
    if (!error) {
      next()
      return
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      next(
        new AppError('Please check the highlighted fields.', {
          code: 'VALIDATION_ERROR',
          fields: [{ field: 'images', message: `Each image must be ${env.maxUploadMb}MB or smaller.` }],
          statusCode: 413,
        }),
      )
      return
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      next(
        new AppError('Please check the highlighted fields.', {
          code: 'VALIDATION_ERROR',
          fields: [{ field: 'images', message: `Upload no more than ${maxProductImageCount} product images.` }],
          statusCode: 422,
        }),
      )
      return
    }

    next(error)
  })
}

module.exports = {
  imageUpload,
  productImagesUpload,
  profileImageUpload,
}
