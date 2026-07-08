const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')
const sharp = require('sharp')

const env = require('../config/env')
const { AppError } = require('../errors/AppError')

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const uploadRoot = path.resolve(__dirname, '..', '..', env.uploadRoot)
const profileFolder = 'profile-photos'
const productFolder = 'product-images'
const maxProductImageCount = 5

function ensureSafeRelativePath(relativePath) {
  const resolvedPath = path.resolve(uploadRoot, relativePath)

  if (!resolvedPath.startsWith(uploadRoot + path.sep)) {
    throw new AppError('Invalid upload path.', {
      code: 'INVALID_UPLOAD_PATH',
      statusCode: 400,
    })
  }

  return resolvedPath
}

function createImageError(message = 'Upload a valid JPEG, PNG, or WebP image.') {
  return new AppError('Please check the highlighted fields.', {
    code: 'VALIDATION_ERROR',
    fields: [{ field: 'image', message }],
    statusCode: 422,
  })
}

async function ensureUploadFolders() {
  await fs.mkdir(path.join(uploadRoot, profileFolder), { recursive: true })
  await fs.mkdir(path.join(uploadRoot, productFolder), { recursive: true })
  await fs.mkdir(path.join(uploadRoot, 'placeholders'), { recursive: true })
}

function makeFilename(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}.webp`
}

function toPublicUrl(relativePath) {
  return `/uploads/${relativePath.replace(/\\/g, '/')}`
}

function publicUrlToRelativePath(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) {
    return null
  }

  return publicUrl.replace('/uploads/', '')
}

async function processImage(file, options) {
  if (!file || !allowedMimeTypes.has(file.mimetype)) {
    throw createImageError()
  }

  let image

  try {
    image = sharp(file.buffer, { failOn: 'error' }).rotate()
    await image.metadata()
  } catch {
    throw createImageError('The uploaded file could not be decoded as an image.')
  }

  const processed = await image
    .clone()
    .resize({
      fit: 'inside',
      height: options.maxDimension,
      withoutEnlargement: true,
      width: options.maxDimension,
    })
    .webp({ effort: 4, quality: options.quality })
    .toBuffer()

  const thumbnail = await image
    .clone()
    .resize({
      fit: 'cover',
      height: options.thumbnailSize,
      position: 'center',
      width: options.thumbnailSize,
    })
    .webp({ effort: 4, quality: 70 })
    .toBuffer()

  return {
    processed,
    thumbnail,
  }
}

async function storeImage(file, options) {
  await ensureUploadFolders()

  const folder = options.folder
  const filename = makeFilename(options.prefix)
  const thumbFilename = filename.replace('.webp', '-thumb.webp')
  const relativePath = path.join(folder, filename)
  const thumbnailRelativePath = path.join(folder, thumbFilename)
  const outputPath = ensureSafeRelativePath(relativePath)
  const thumbnailPath = ensureSafeRelativePath(thumbnailRelativePath)
  const processedImages = await processImage(file, options)

  await fs.writeFile(outputPath, processedImages.processed)
  await fs.writeFile(thumbnailPath, processedImages.thumbnail)

  return {
    path: outputPath,
    publicUrl: toPublicUrl(relativePath),
    thumbnailPath,
    thumbnailUrl: toPublicUrl(thumbnailRelativePath),
  }
}

async function storeProfileImage(file) {
  return storeImage(file, {
    folder: profileFolder,
    maxDimension: 800,
    prefix: 'profile',
    quality: 78,
    thumbnailSize: 240,
  })
}

async function storeProductImage(file) {
  return storeImage(file, {
    folder: productFolder,
    maxDimension: 1400,
    prefix: 'product',
    quality: 76,
    thumbnailSize: 360,
  })
}

async function deleteStoredFileByPublicUrl(publicUrl) {
  const relativePath = publicUrlToRelativePath(publicUrl)

  if (!relativePath) {
    return
  }

  const fullPath = ensureSafeRelativePath(relativePath)
  const thumbnailPath = fullPath.replace(/\.webp$/i, '-thumb.webp')

  await Promise.allSettled([fs.unlink(fullPath), fs.unlink(thumbnailPath)])
}

async function deleteStoredFiles(uploadResult) {
  if (!uploadResult) {
    return
  }

  await Promise.allSettled([fs.unlink(uploadResult.path), fs.unlink(uploadResult.thumbnailPath)])
}

async function ensurePlaceholderImage() {
  await ensureUploadFolders()
  const placeholderPath = ensureSafeRelativePath(path.join('placeholders', 'image-placeholder.svg'))

  try {
    await fs.access(placeholderPath)
  } catch {
    await fs.writeFile(
      placeholderPath,
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F7F8F4"/><path d="M80 210h240L250 130l-55 65-35-40-80 55z" fill="#123F2D"/><circle cx="135" cy="105" r="28" fill="#F28C28"/></svg>',
      'utf8',
    )
  }

  return toPublicUrl(path.join('placeholders', 'image-placeholder.svg'))
}

module.exports = {
  allowedMimeTypes,
  deleteStoredFileByPublicUrl,
  deleteStoredFiles,
  ensurePlaceholderImage,
  ensureSafeRelativePath,
  ensureUploadFolders,
  maxProductImageCount,
  storeProductImage,
  storeProfileImage,
  uploadRoot,
}
