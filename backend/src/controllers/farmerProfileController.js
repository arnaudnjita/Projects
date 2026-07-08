const farmerProfileService = require('../services/farmerProfileService')
const imageStorageService = require('../services/imageStorageService')
const { AppError } = require('../errors/AppError')
const { sendSuccess } = require('../utils/apiResponse')
const { throwIfValidationFailed } = require('../utils/validation')

async function getMyProfile(req, res) {
  return sendSuccess(res, {
    profile: await farmerProfileService.getMyFarmerProfile(req.user.userId),
  })
}

async function updateMyProfile(req, res) {
  throwIfValidationFailed(req)
  return sendSuccess(res, {
    profile: await farmerProfileService.updateMyFarmerProfile(req.user.userId, req.body),
  })
}

async function uploadMyProfilePhoto(req, res) {
  if (!req.file) {
    throw new AppError('Please check the highlighted fields.', {
        code: 'VALIDATION_ERROR',
        fields: [{ field: 'image', message: 'Profile image is required.' }],
        statusCode: 422,
    })
  }

  const uploadResult = await imageStorageService.storeProfileImage(req.file)
  return sendSuccess(res, {
    profile: await farmerProfileService.updateMyProfilePhoto(req.user.userId, uploadResult),
  })
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadMyProfilePhoto,
}
