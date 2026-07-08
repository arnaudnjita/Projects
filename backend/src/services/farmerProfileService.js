const { withTransaction } = require('../config/database')
const { AppError, NotFoundError } = require('../errors/AppError')
const farmerProfileRepository = require('../repositories/farmerProfileRepository')
const imageStorageService = require('./imageStorageService')
const userRepository = require('../repositories/userRepository')
const { normalizePhoneNumber } = require('../utils/phone')

function toFarmerProfileResponse(profile) {
  if (!profile) {
    return null
  }

  return {
    accountLocation: profile.account_location,
    bio: profile.bio,
    email: profile.email,
    farmLocation: profile.farm_location,
    name: profile.name,
    phone: profile.phone,
    produceSpecialty: profile.produce_specialty,
    profilePhotoUrl: profile.profile_photo_url,
    userId: profile.user_id,
    whatsappPhone: profile.whatsapp_phone,
  }
}

function nullableTrimmed(value) {
  if (value === undefined) {
    return undefined
  }

  const trimmed = String(value || '').trim()
  return trimmed === '' ? null : trimmed
}

function validateInternalProfilePhotoUrl(value) {
  const photoUrl = nullableTrimmed(value)

  if (photoUrl === undefined || photoUrl === null) {
    return photoUrl
  }

  if (!/^\/uploads\/profile-photos\/[A-Za-z0-9/_.,-]+\.(jpg|jpeg|png|webp)$/i.test(photoUrl)) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [
        {
          field: 'profilePhotoUrl',
          message: 'Profile photo URL must be an internal uploaded image path.',
        },
      ],
      statusCode: 422,
    })
  }

  return photoUrl
}

async function getMyFarmerProfile(userId) {
  const profile = await farmerProfileRepository.findProfileByUserId(userId)

  if (!profile) {
    throw new NotFoundError('Farmer profile was not found.')
  }

  return toFarmerProfileResponse(profile)
}

async function updateMyFarmerProfile(userId, input) {
  return withTransaction(async (connection) => {
    const currentProfile = await farmerProfileRepository.findProfileByUserId(userId, connection)

    if (!currentProfile) {
      throw new NotFoundError('Farmer profile was not found.')
    }

    const nextPhone =
      input.phone === undefined ? currentProfile.phone : normalizePhoneNumber(input.phone)

    if (!nextPhone) {
      throw new AppError('Please check the highlighted fields.', {
        code: 'VALIDATION_ERROR',
        fields: [{ field: 'phone', message: 'Enter a valid phone number.' }],
        statusCode: 422,
      })
    }

    if (nextPhone !== currentProfile.phone) {
      const existingPhoneUser = await userRepository.findUserByPhone(nextPhone, connection)

      if (existingPhoneUser && Number(existingPhoneUser.user_id) !== Number(userId)) {
        throw new AppError('Please check the highlighted fields.', {
          code: 'VALIDATION_ERROR',
          fields: [{ field: 'phone', message: 'That phone number is already registered.' }],
          statusCode: 422,
        })
      }
    }

    const nextWhatsappPhone =
      input.whatsappPhone === undefined
        ? currentProfile.whatsapp_phone
        : input.whatsappPhone
          ? normalizePhoneNumber(input.whatsappPhone)
          : null

    if (input.whatsappPhone !== undefined && input.whatsappPhone && !nextWhatsappPhone) {
      throw new AppError('Please check the highlighted fields.', {
        code: 'VALIDATION_ERROR',
        fields: [{ field: 'whatsappPhone', message: 'Enter a valid WhatsApp phone number.' }],
        statusCode: 422,
      })
    }

    await farmerProfileRepository.updateUserProfileFields(
      userId,
      {
        accountLocation:
          input.accountLocation === undefined
            ? currentProfile.account_location
            : String(input.accountLocation).trim(),
        name: input.name === undefined ? currentProfile.name : String(input.name).trim(),
        phone: nextPhone,
      },
      connection,
    )

    await farmerProfileRepository.updateFarmerProfileFields(
      userId,
      {
        bio: input.bio === undefined ? currentProfile.bio : nullableTrimmed(input.bio),
        farmLocation:
          input.farmLocation === undefined
            ? currentProfile.farm_location
            : String(input.farmLocation).trim(),
        produceSpecialty:
          input.produceSpecialty === undefined
            ? currentProfile.produce_specialty
            : nullableTrimmed(input.produceSpecialty),
        profilePhotoUrl: currentProfile.profile_photo_url,
        whatsappPhone: nextWhatsappPhone,
      },
      connection,
    )

    return toFarmerProfileResponse(await farmerProfileRepository.findProfileByUserId(userId, connection))
  })
}

async function updateMyProfilePhoto(userId, uploadResult) {
  let previousPhotoUrl = null

  try {
    const updatedProfile = await withTransaction(async (connection) => {
      const currentProfile = await farmerProfileRepository.findProfileByUserId(userId, connection)

      if (!currentProfile) {
        throw new NotFoundError('Farmer profile was not found.')
      }

      previousPhotoUrl = currentProfile.profile_photo_url

      await farmerProfileRepository.updateUserProfileFields(
        userId,
        {
          accountLocation: currentProfile.account_location,
          name: currentProfile.name,
          phone: currentProfile.phone,
        },
        connection,
      )

      await farmerProfileRepository.updateFarmerProfileFields(
        userId,
        {
          bio: currentProfile.bio,
          farmLocation: currentProfile.farm_location,
          produceSpecialty: currentProfile.produce_specialty,
          profilePhotoUrl: uploadResult.publicUrl,
          whatsappPhone: currentProfile.whatsapp_phone,
        },
        connection,
      )

      return toFarmerProfileResponse(await farmerProfileRepository.findProfileByUserId(userId, connection))
    })

    if (previousPhotoUrl && previousPhotoUrl !== uploadResult.publicUrl) {
      await imageStorageService.deleteStoredFileByPublicUrl(previousPhotoUrl)
    }

    return updatedProfile
  } catch (error) {
    await imageStorageService.deleteStoredFiles(uploadResult)
    throw error
  }
}

module.exports = {
  getMyFarmerProfile,
  updateMyProfilePhoto,
  updateMyFarmerProfile,
  validateInternalProfilePhotoUrl,
}
