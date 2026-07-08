import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  createRegistrationPayload,
  resolvePostAuthRedirect,
  validateForgotPassword,
  validateLogin,
  validateRegistration,
  validateResetPassword,
} from './authFormUtils.js'

test('validates registration inputs', () => {
  const errors = validateRegistration({
    accuracyConfirmed: false,
    email: 'bad-email',
    location: '',
    name: '',
    password: 'password',
    passwordConfirmation: 'different',
    phone: '123',
    role: 'admin',
  })

  assert.equal(errors.role, 'Choose Farmer or Buyer.')
  assert.equal(errors.phone.includes('country code'), true)
  assert.equal(errors.password.includes('8 characters'), true)
  assert.equal(errors.accuracyConfirmed.includes('accurate'), true)
})

test('creates farmer and buyer registration payloads', () => {
  const farmerPayload = createRegistrationPayload({
    email: '',
    location: 'Molyko',
    name: ' Farmer User ',
    password: 'Password1',
    passwordConfirmation: 'Password1',
    phone: ' +237655667788 ',
    role: 'farmer',
  })
  const buyerPayload = createRegistrationPayload({ ...farmerPayload, email: 'buyer@example.com', role: 'buyer' })

  assert.deepEqual(farmerPayload, {
    email: null,
    location: 'Molyko',
    name: 'Farmer User',
    password: 'Password1',
    passwordConfirmation: 'Password1',
    phone: '+237655667788',
    role: 'farmer',
  })
  assert.equal(buyerPayload.role, 'buyer')
  assert.equal(buyerPayload.email, 'buyer@example.com')
})

test('validates login and forgot/reset password flows', () => {
  assert.equal(validateLogin({ identifier: '', password: '' }).identifier, 'Enter your phone number or email.')
  assert.equal(validateForgotPassword({ email: 'bad' }).email, 'Enter the email attached to your account.')
  assert.equal(validateResetPassword({ password: 'Password1', passwordConfirmation: 'Password2', token: '' }).token, 'Reset token is missing. Use the link from your email.')
})

test('resolves post-auth redirects by role and requested route', () => {
  assert.equal(resolvePostAuthRedirect({ role: 'farmer' }, '/marketplace'), '/farmer/dashboard')
  assert.equal(resolvePostAuthRedirect({ role: 'buyer' }, '/products/4'), '/products/4')
  assert.equal(resolvePostAuthRedirect({ role: 'buyer' }, '/farmer/dashboard'), '/marketplace')
})
