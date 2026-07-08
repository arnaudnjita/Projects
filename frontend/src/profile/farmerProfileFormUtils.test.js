import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildFarmerProfilePayload,
  buildProfilePhotoFormData,
  fieldErrorsFromApi,
  profileToFormValues,
  validateFarmerProfileForm,
  validateProfileImage,
} from './farmerProfileFormUtils.js'

function file(name, type = 'image/png', size = 1024) {
  return { name, size, type }
}

test('maps loaded farmer profile into editable form values', () => {
  const values = profileToFormValues({
    accountLocation: 'Molyko',
    bio: 'Vegetable farmer',
    farmLocation: 'Muea',
    name: 'Amina',
    phone: '+237612345678',
    produceSpecialty: 'Tomatoes',
  })

  assert.equal(values.name, 'Amina')
  assert.equal(values.whatsappPhone, '+237612345678')
})

test('validates required farmer profile text fields', () => {
  const errors = validateFarmerProfileForm({
    accountLocation: '',
    bio: '',
    farmLocation: '',
    name: '',
    phone: '',
    produceSpecialty: '',
    whatsappPhone: '',
  })

  assert.equal(errors.name, 'Enter your name.')
  assert.equal(errors.phone, 'Enter your WhatsApp phone number.')
  assert.equal(errors.farmLocation, 'Enter your farm location.')
})

test('builds update payload without editable email', () => {
  const payload = buildFarmerProfilePayload({
    accountLocation: ' Molyko ',
    bio: '',
    email: 'not-supported@example.com',
    farmLocation: ' Muea ',
    name: ' Amina ',
    phone: ' +237612345678 ',
    produceSpecialty: ' Tomatoes ',
    whatsappPhone: '',
  })

  assert.deepEqual(payload, {
    accountLocation: 'Molyko',
    bio: null,
    farmLocation: 'Muea',
    name: 'Amina',
    phone: '+237612345678',
    produceSpecialty: 'Tomatoes',
    whatsappPhone: null,
  })
})

test('validates replacement profile photos', () => {
  assert.equal(validateProfileImage(file('photo.png')), '')
  assert.equal(validateProfileImage(file('photo.txt', 'text/plain')), 'Profile photo must be a JPEG, PNG, or WebP image.')
  assert.equal(validateProfileImage(file('large.png', 'image/png', 6 * 1024 * 1024)), 'Profile photo must be 5 MB or smaller.')
})

test('builds profile photo form data using backend image field', () => {
  const formData = buildProfilePhotoFormData(new Blob(['x'], { type: 'image/png' }))

  assert.equal(formData.getAll('image').length, 1)
})

test('maps backend phone uniqueness and validation errors', () => {
  const errors = fieldErrorsFromApi({
    fields: [
      { field: 'phone', message: 'That phone number is already registered.' },
      { field: 'whatsappPhone', message: 'Enter a valid WhatsApp phone number.' },
    ],
  })

  assert.equal(errors.phone, 'That phone number is already registered.')
  assert.equal(errors.whatsappPhone, 'Enter a valid WhatsApp phone number.')
})
