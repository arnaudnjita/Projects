import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import * as categoriesApi from '../api/categoriesApi'
import * as productsApi from '../api/productsApi'
import { queryKeys } from '../api/queryKeys'
import Button from '../components/Button'
import { Badge, Card, ErrorState, Skeleton } from '../components/Feedback'
import { FormField, Select, Textarea, TextInput } from '../components/FormControls'
import {
  buildProductFormData,
  emptyProductForm,
  fieldErrorsFromApi,
  moveItem,
  productToFormValues,
  statusOptions,
  unitOptions,
  validateImageFiles,
  validateProductForm,
} from '../marketplace/productFormUtils'
import { publicAssetUrl } from '../marketplace/productUtils'
import PageTitle from './PageTitle'

function FarmerProductFormPage({ mode }) {
  const isEdit = mode === 'edit'
  const { productId } = useParams()
  const categoriesQuery = useQuery({
    queryFn: ({ signal }) => categoriesApi.listCategories({ signal }),
    queryKey: queryKeys.categories.all,
  })
  const productQuery = useQuery({
    enabled: isEdit,
    queryFn: () => productsApi.getFarmerProduct(productId),
    queryKey: ['farmer', 'products', 'detail', productId],
  })

  const categories = categoriesQuery.data?.categories || []

  if (categoriesQuery.isLoading || (isEdit && productQuery.isLoading)) {
    return (
      <div className="product-form-page">
        <Skeleton lines={7} />
      </div>
    )
  }

  if (categoriesQuery.error) {
    return <ErrorState title="Categories could not load" message={categoriesQuery.error.message} onRetry={() => categoriesQuery.refetch()} />
  }

  if (productQuery.error) {
    return <ErrorState title="Product could not load" message="This listing may have been deleted or may not belong to your account." onRetry={() => productQuery.refetch()} />
  }

  return (
    <FarmerProductForm
      categories={categories}
      initialProduct={isEdit ? productQuery.data?.product : null}
      key={isEdit ? productQuery.data?.product?.productId : 'new-product'}
      mode={mode}
      productId={productId}
    />
  )
}

function FarmerProductForm({ categories, initialProduct, mode, productId }) {
  const isEdit = mode === 'edit'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [values, setValues] = useState(() => (initialProduct ? productToFormValues(initialProduct) : emptyProductForm))
  const [existingImages, setExistingImages] = useState(() => initialProduct?.images || [])
  const [removedImageIds, setRemovedImageIds] = useState([])
  const [newImages, setNewImages] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const newImagesRef = useRef(newImages)
  const imageCount = existingImages.length + newImages.length
  const pageTitle = isEdit ? 'Edit Product' : 'New Product'

  useEffect(() => {
    newImagesRef.current = newImages
  }, [newImages])

  useEffect(() => {
    return () => {
      newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  useEffect(() => {
    function beforeUnload(event) {
      if (!isDirty) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [isDirty])

  const mutation = useMutation({
    mutationFn: (formData) =>
      isEdit ? productsApi.updateFarmerProduct(productId, formData) : productsApi.createFarmerProduct(formData),
    onError(error) {
      setFieldErrors(fieldErrorsFromApi(error))
      setFormError(error.message || 'Product could not be saved.')
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['farmer', 'products'] })
      setIsDirty(false)
      navigate('/farmer/dashboard', {
        replace: true,
        state: { message: isEdit ? 'Product updated.' : 'Product created.' },
      })
    },
  })

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
    setIsDirty(true)
  }

  function addImages(files) {
    const selectedFiles = Array.from(files || [])
    const errors = validateImageFiles(selectedFiles, imageCount)

    if (errors.length > 0) {
      setFieldErrors((current) => ({ ...current, images: errors.join(' ') }))
      return
    }

    const nextImages = selectedFiles.map((file) => ({
      file,
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      previewUrl: URL.createObjectURL(file),
    }))

    setNewImages((current) => [...current, ...nextImages])
    setFieldErrors((current) => ({ ...current, images: undefined }))
    setIsDirty(true)
  }

  function removeExistingImage(image) {
    setExistingImages((current) => current.filter((item) => item.productImageId !== image.productImageId))
    setRemovedImageIds((current) => [...current, image.productImageId])
    setIsDirty(true)
  }

  function removeNewImage(image) {
    URL.revokeObjectURL(image.previewUrl)
    setNewImages((current) => current.filter((item) => item.id !== image.id))
    setIsDirty(true)
  }

  function moveExistingImage(index, direction) {
    setExistingImages((current) => moveItem(current, index, direction))
    setIsDirty(true)
  }

  function moveNewImage(index, direction) {
    setNewImages((current) => moveItem(current, index, direction))
    setIsDirty(true)
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (mutation.isPending) {
      return
    }

    const nextErrors = validateProductForm(values, { existingImages, newImages })
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    mutation.mutate(buildProductFormData(values, { deleteImageIds: removedImageIds, existingImages, newImages }))
  }

  return (
    <>
      <PageTitle title={pageTitle} description={`${pageTitle} on CultivaX.`} />
      <section className="product-form-page" aria-labelledby="product-form-title">
        <form className="product-form" onSubmit={handleSubmit} noValidate>
          <div className="section-heading">
            <div>
              <Badge tone="accent">Farmer listing</Badge>
              <h1 id="product-form-title">{pageTitle}</h1>
              <p>Add clear produce details. The backend will still validate everything before saving.</p>
            </div>
            <Button isLoading={mutation.isPending} type="submit">
              {isEdit ? 'Save changes' : 'Create listing'}
            </Button>
          </div>

          {formError ? <p className="form-alert" role="alert">{formError}</p> : null}

          <div className="product-form__grid">
            <Card className="product-form__section">
              <FormField label="Product name" required error={fieldErrors.name}>
                <TextInput value={values.name} onChange={(event) => updateValue('name', event.target.value)} />
              </FormField>

              <FormField label="Category" required error={fieldErrors.categoryId}>
                <Select value={values.categoryId} onChange={(event) => updateValue('categoryId', event.target.value)}>
                  <option value="">Choose category</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Description" helperText="Keep it short and useful for buyers.">
                <Textarea value={values.description} onChange={(event) => updateValue('description', event.target.value)} />
              </FormField>
            </Card>

            <Card className="product-form__section">
              <FormField label="Price in XAF" required error={fieldErrors.price} helperText="Enter only the number, for example 1500.">
                <TextInput inputMode="decimal" value={values.price} onChange={(event) => updateValue('price', event.target.value)} />
              </FormField>

              <FormField label="Unit of measure" required error={fieldErrors.unit} helperText="Choose how buyers should read the price.">
                <Select value={values.unit} onChange={(event) => updateValue('unit', event.target.value)}>
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Quantity available" required error={fieldErrors.quantityAvailable} helperText="Use 0 only when the product is sold out.">
                <TextInput
                  inputMode="decimal"
                  value={values.quantityAvailable}
                  onChange={(event) => updateValue('quantityAvailable', event.target.value)}
                />
              </FormField>

              <FormField label="Status" required error={fieldErrors.status}>
                <Select value={values.status} onChange={(event) => updateValue('status', event.target.value)}>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </Card>
          </div>

          <Card className="product-form__section">
            <div className="image-uploader__header">
              <div>
                <h2>Images</h2>
                <p>Upload one to five JPEG, PNG, or WebP images. The first image is the primary image.</p>
                {isEdit && existingImages.length > 0 && newImages.length > 0 ? (
                  <p>New uploads are saved after retained images in this version.</p>
                ) : null}
              </div>
              <label className="btn btn--ghost image-uploader__button">
                <ImagePlus size={17} aria-hidden="true" />
                Add images
                <input
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  type="file"
                  onChange={(event) => {
                    addImages(event.target.files)
                    event.target.value = ''
                  }}
                />
              </label>
            </div>
            <p className="image-uploader__count">{imageCount} of 5 images selected.</p>
            {fieldErrors.images ? <p className="form-field__error">{fieldErrors.images}</p> : null}
            <ImageList
              existingImages={existingImages}
              moveExistingImage={moveExistingImage}
              moveNewImage={moveNewImage}
              newImages={newImages}
              removeExistingImage={removeExistingImage}
              removeNewImage={removeNewImage}
            />
          </Card>
        </form>
      </section>
    </>
  )
}

function ImageList({ existingImages, moveExistingImage, moveNewImage, newImages, removeExistingImage, removeNewImage }) {
  const combinedImages = [
    ...existingImages.map((image, index) => ({
      id: `existing-${image.productImageId}`,
      image,
      index,
      isExisting: true,
      src: publicAssetUrl(image.thumbnailUrl || image.imageUrl),
    })),
    ...newImages.map((image, index) => ({
      id: `new-${image.id}`,
      image,
      index,
      isExisting: false,
      src: image.previewUrl,
    })),
  ]

  if (combinedImages.length === 0) {
    return <p className="image-uploader__empty">No images selected yet.</p>
  }

  return (
    <div className="image-list">
      {combinedImages.map((item, displayIndex) => {
        const canMoveUp = item.index > 0
        const canMoveDown = item.isExisting ? item.index < existingImages.length - 1 : item.index < newImages.length - 1

        return (
          <div className="image-list__item" key={item.id}>
            <img alt="" height="120" src={item.src} width="160" />
            <div>
              <strong>{displayIndex === 0 ? 'Primary image' : `Image ${displayIndex + 1}`}</strong>
              <div className="image-list__actions">
                <button
                  aria-label={`Move image ${displayIndex + 1} up`}
                  className="icon-button"
                  disabled={!canMoveUp}
                  type="button"
                  onClick={() => (item.isExisting ? moveExistingImage(item.index, -1) : moveNewImage(item.index, -1))}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  aria-label={`Move image ${displayIndex + 1} down`}
                  className="icon-button"
                  disabled={!canMoveDown}
                  type="button"
                  onClick={() => (item.isExisting ? moveExistingImage(item.index, 1) : moveNewImage(item.index, 1))}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  aria-label={`Remove image ${displayIndex + 1}`}
                  className="icon-button"
                  type="button"
                  onClick={() => (item.isExisting ? removeExistingImage(item.image) : removeNewImage(item.image))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default FarmerProductFormPage
