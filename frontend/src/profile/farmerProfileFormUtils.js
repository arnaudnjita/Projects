export const maxProfileImageBytes = 5 * 1024 * 1024
export const allowedProfileImageTypes = ['image/jpeg', 'image/png', 'image/webp']

export const emptyFarmerProfileForm = {
  accountLocation: '',
  bio: '',
  farmLocation: '',
  name: '',
  phone: '',
  produceSpecialty: '',
  whatsappPhone: '',
}

export function profileToFormValues(profile = {}) {
  return {
    accountLocation: profile.accountLocation || '',
    bio: profile.bio || '',
    farmLocation: profile.farmLocation || '',
    name: profile.name || '',
    phone: profile.phone || '',
    produceSpecialty: profile.produceSpecialty || '',
    whatsappPhone: profile.whatsappPhone || profile.phone || '',
  }
}

export function validateFarmerProfileForm(values) {
  const errors = {}

  if (!values.name.trim()) {
    errors.name = 'Enter your name.'
  }

  if (!values.phone.trim()) {
    errors.phone = 'Enter your WhatsApp phone number.'
  }

  if (!values.accountLocation.trim()) {
    errors.accountLocation = 'Enter your account location.'
  }

  if (!values.farmLocation.trim()) {
    errors.farmLocation = 'Enter your farm location.'
  }

  if (values.name.length > 120) {
    errors.name = 'Name is too long.'
  }

  if (values.accountLocation.length > 160) {
    errors.accountLocation = 'Account location is too long.'
  }

  if (values.farmLocation.length > 160) {
    errors.farmLocation = 'Farm location is too long.'
  }

  if (values.produceSpecialty.length > 160) {
    errors.produceSpecialty = 'Produce specialty is too long.'
  }

  if (values.bio.length > 1000) {
    errors.bio = 'Bio is too long.'
  }

  return errors
}

export function validateProfileImage(file) {
  if (!file) {
    return ''
  }

  if (!allowedProfileImageTypes.includes(file.type)) {
    return 'Profile photo must be a JPEG, PNG, or WebP image.'
  }

  if (file.size > maxProfileImageBytes) {
    return 'Profile photo must be 5 MB or smaller.'
  }

  return ''
}

export function buildFarmerProfilePayload(values) {
  return {
    accountLocation: values.accountLocation.trim(),
    bio: values.bio.trim() || null,
    farmLocation: values.farmLocation.trim(),
    name: values.name.trim(),
    phone: values.phone.trim(),
    produceSpecialty: values.produceSpecialty.trim() || null,
    whatsappPhone: values.whatsappPhone.trim() || null,
  }
}

export function buildProfilePhotoFormData(file) {
  const formData = new FormData()
  formData.set('image', file)
  return formData
}

export function fieldErrorsFromApi(error) {
  if (!Array.isArray(error?.fields)) {
    return {}
  }

  return error.fields.reduce((fields, item) => {
    if (item.field) {
      fields[item.field] = item.message
    }

    return fields
  }, {})
}
