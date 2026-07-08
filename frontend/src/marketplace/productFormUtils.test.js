import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildProductFormData,
  fieldErrorsFromApi,
  moveItem,
  productToFormValues,
  validateImageFiles,
  validateProductForm,
} from './productFormUtils.js'

function file(name, type = 'image/png', size = 1024) {
  return { name, size, type }
}

test('validates create product requirements', () => {
  const errors = validateProductForm(
    { categoryId: '', name: '', price: '-1', quantityAvailable: '', status: 'active', unit: '' },
    { existingImages: [], newImages: [] },
  )

  assert.equal(errors.name, 'Enter a product name.')
  assert.equal(errors.images, 'Add at least one product image.')
  assert.equal(errors.price, 'Price must be a valid non-negative number.')
})

test('accepts a valid create product form', () => {
  const errors = validateProductForm(
    { categoryId: '1', name: 'Fresh tomatoes', price: '1500', quantityAvailable: '3', status: 'active', unit: 'basket' },
    { newImages: [{ file: file('tomatoes.png') }] },
  )

  assert.deepEqual(errors, {})
})

test('rejects too many or invalid images', () => {
  assert.deepEqual(validateImageFiles([file('bad.txt', 'text/plain')]), ['bad.txt must be a JPEG, PNG, or WebP image.'])
  assert.deepEqual(validateImageFiles([file('large.png', 'image/png', 6 * 1024 * 1024)]), ['large.png is larger than 5 MB.'])
  assert.deepEqual(validateImageFiles([file('new.png')], 5), ['A product can have no more than 5 images.'])
})

test('maps server field errors for display beside fields', () => {
  const errors = fieldErrorsFromApi({
    fields: [
      { field: 'price', message: 'Price must be a valid non-negative number.' },
      { field: 'images', message: 'A product must have at least one image.' },
    ],
  })

  assert.equal(errors.price, 'Price must be a valid non-negative number.')
  assert.equal(errors.images, 'A product must have at least one image.')
})

test('supports edit form values and image reordering', () => {
  const values = productToFormValues({
    category: { categoryId: 2 },
    description: 'Fresh',
    name: 'Tomato',
    price: 1200,
    quantityAvailable: 4,
    status: 'active',
    unit: 'basket',
  })

  assert.equal(values.categoryId, '2')
  assert.deepEqual(moveItem(['a', 'b', 'c'], 1, -1), ['b', 'a', 'c'])
})

test('builds FormData for retaining and deleting images while adding another', () => {
  const formData = buildProductFormData(
    {
      categoryId: '1',
      description: 'Fresh',
      name: 'Tomato',
      price: '1200',
      quantityAvailable: '4',
      status: 'active',
      unit: 'basket',
    },
    {
      deleteImageIds: [9],
      existingImages: [{ productImageId: 3 }],
      newImages: [{ file: new Blob(['x'], { type: 'image/png' }) }],
    },
  )

  assert.equal(formData.get('deleteImageIds'), '[9]')
  assert.equal(formData.get('imageSortOrders'), '[{"productImageId":3,"sortOrder":0}]')
  assert.equal(formData.getAll('images').length, 1)
})
