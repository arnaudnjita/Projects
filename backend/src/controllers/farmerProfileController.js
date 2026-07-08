const farmerProfileService = require('../services/farmerProfileService')
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

module.exports = {
  getMyProfile,
  updateMyProfile,
}
