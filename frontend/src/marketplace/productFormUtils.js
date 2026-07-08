export const maxProductImages = 5
export const maxUploadBytes = 5 * 1024 * 1024
export const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
export const unitOptions = ['kg', 'bag', 'basket', 'bunch', 'piece', 'crate', 'litre', 'other']
export const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Sold out', value: 'sold_out' },
  { label: 'Inactive', value: 'inactive' },
]

export const emptyProductForm = {
  categoryId: '',
  description: '',
  name: '',
  price: '',
  quantityAvailable: '',
  status: 'active',
  unit: 'kg',
}

export function productToFormValues(product) {
  return {
    categoryId: String(product?.category?.categoryId || ''),
    description: product?.description || '',
    name: product?.name || '',
    price: product?.price === undefined ? '' : String(product.price),
    quantityAvailable: product?.quantityAvailable === undefined ? '' : String(product.quantityAvailable),
    status: product?.status || 'active',
    unit: product?.unit || 'kg',
  }
}

export function validateImageFiles(files, existingImageCount = 0) {
  const errors = []

  if (existingImageCount + files.length > maxProductImages) {
    errors.push(`A product can have no more than ${maxProductImages} images.`)
  }

  for (const file of files) {
    if (!allowedImageTypes.includes(file.type)) {
      errors.push(`${file.name} must be a JPEG, PNG, or WebP image.`)
    }

    if (file.size > maxUploadBytes) {
      errors.push(`${file.name} is larger than 5 MB.`)
    }
  }

  return errors
}

export function validateProductForm(values, { existingImages = [], newImages = [] } = {}) {
  const errors = {}
  const price = Number(values.price)
  const quantity = Number(values.quantityAvailable)

  if (!values.name.trim()) {
    errors.name = 'Enter a product name.'
  }

  if (!values.categoryId) {
    errors.categoryId = 'Choose a category.'
  }

  if (!Number.isFinite(price) || price < 0) {
    errors.price = 'Price must be a valid non-negative number.'
  }

  if (!values.unit.trim()) {
    errors.unit = 'Enter a unit of measure.'
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    errors.quantityAvailable = 'Quantity must be a valid non-negative number.'
  }

  if (values.status === 'active' && quantity === 0) {
    errors.status = 'A zero-quantity product cannot be active. Use sold out or add quantity.'
  }

  if (existingImages.length + newImages.length === 0) {
    errors.images = 'Add at least one product image.'
  }

  return errors
}

export function moveItem(items, fromIndex, direction) {
  const toIndex = fromIndex + direction

  if (toIndex < 0 || toIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [item] = nextItems.splice(fromIndex, 1)
  nextItems.splice(toIndex, 0, item)
  return nextItems
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

export function buildProductFormData(values, { deleteImageIds = [], existingImages = [], newImages = [] } = {}) {
  const formData = new FormData()

  formData.set('name', values.name.trim())
  formData.set('categoryId', values.categoryId)
  formData.set('description', values.description.trim())
  formData.set('price', values.price)
  formData.set('unit', values.unit.trim())
  formData.set('quantityAvailable', values.quantityAvailable)
  formData.set('status', values.status)

  for (const image of newImages) {
    formData.append('images', image.file)
  }

  if (deleteImageIds.length > 0) {
    formData.set('deleteImageIds', JSON.stringify(deleteImageIds))
  }

  if (existingImages.length > 0) {
    formData.set(
      'imageSortOrders',
      JSON.stringify(
        existingImages.map((image, index) => ({
          productImageId: image.productImageId,
          sortOrder: index,
        })),
      ),
    )
  }

  return formData
}
