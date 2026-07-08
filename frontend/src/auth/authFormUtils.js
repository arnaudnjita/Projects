const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+[1-9]\d{7,14}$/

export const bueaLocations = [
  'Buea Town',
  'Molyko',
  'Muea',
  'Mile 16',
  'Great Soppo',
  'Bonduma',
  'Bokwai',
  'Sandpit',
  'Clerks Quarter',
  'Wotutu',
]

export function isStrongPassword(password) {
  return /[A-Za-z]/.test(password) && /\d/.test(password) && String(password || '').length >= 8
}

export function validateRegistration(values) {
  const errors = {}

  if (!['farmer', 'buyer'].includes(values.role)) {
    errors.role = 'Choose Farmer or Buyer.'
  }

  if (!values.name.trim()) {
    errors.name = 'Enter your full name.'
  }

  if (!phonePattern.test(values.phone.trim())) {
    errors.phone = 'Enter a valid phone number with country code, such as +2376XXXXXXXX.'
  }

  if (values.email.trim() && !emailPattern.test(values.email.trim())) {
    errors.email = 'Enter a valid email address or leave it blank.'
  }

  if (!values.location.trim()) {
    errors.location = 'Choose your location in Buea.'
  }

  if (!isStrongPassword(values.password)) {
    errors.password = 'Use at least 8 characters with a letter and a number.'
  }

  if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = 'Passwords must match.'
  }

  if (!values.accuracyConfirmed) {
    errors.accuracyConfirmed = 'Confirm that your information is accurate.'
  }

  return errors
}

export function validateLogin(values) {
  const errors = {}

  if (!values.identifier.trim()) {
    errors.identifier = 'Enter your phone number or email.'
  }

  if (!values.password) {
    errors.password = 'Enter your password.'
  }

  return errors
}

export function validateForgotPassword(values) {
  if (!values.email.trim() || !emailPattern.test(values.email.trim())) {
    return { email: 'Enter the email attached to your account.' }
  }

  return {}
}

export function validateResetPassword(values) {
  const errors = {}

  if (!values.token) {
    errors.token = 'Reset token is missing. Use the link from your email.'
  }

  if (!isStrongPassword(values.password)) {
    errors.password = 'Use at least 8 characters with a letter and a number.'
  }

  if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = 'Passwords must match.'
  }

  return errors
}

export function createRegistrationPayload(values) {
  return {
    email: values.email.trim() || null,
    location: values.location.trim(),
    name: values.name.trim(),
    password: values.password,
    passwordConfirmation: values.passwordConfirmation,
    phone: values.phone.trim(),
    role: values.role,
  }
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

export function resolvePostAuthRedirect(user, fromPathname) {
  if (user?.role === 'farmer') {
    return '/farmer/dashboard'
  }

  if (fromPathname && !fromPathname.startsWith('/farmer') && !['/login', '/register'].includes(fromPathname)) {
    return fromPathname
  }

  return '/marketplace'
}
