import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import * as profileApi from '../api/profileApi'
import { queryKeys } from '../api/queryKeys'
import { useAuth } from '../auth/useAuth'
import Button from '../components/Button'
import { Badge, Card, ErrorState, Skeleton, ToastRegion } from '../components/Feedback'
import { FormField, Textarea, TextInput } from '../components/FormControls'
import { publicAssetUrl } from '../marketplace/productUtils'
import {
  buildFarmerProfilePayload,
  buildProfilePhotoFormData,
  fieldErrorsFromApi,
  profileToFormValues,
  validateFarmerProfileForm,
  validateProfileImage,
} from '../profile/farmerProfileFormUtils'
import PageTitle from './PageTitle'

function FarmerProfilePage() {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()
  const [toasts, setToasts] = useState([])
  const profileQuery = useQuery({
    queryFn: profileApi.getFarmerProfile,
    queryKey: queryKeys.profile.farmer,
  })

  function addToast(message, tone = 'success') {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, message, tone }].slice(-3))
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3500)
  }

  if (profileQuery.isLoading) {
    return (
      <section className="profile-page">
        <Skeleton lines={7} />
      </section>
    )
  }

  if (profileQuery.error) {
    return (
      <ErrorState
        title="Profile could not load"
        message={profileQuery.error.message || 'Your farmer profile could not be loaded.'}
        onRetry={() => profileQuery.refetch()}
      />
    )
  }

  return (
    <>
      <PageTitle title="Farmer Profile" description="Manage your CultivaX farmer profile." />
      <FarmerProfileForm
        addToast={addToast}
        profile={profileQuery.data?.profile}
        queryClient={queryClient}
        refreshUser={refreshUser}
      />
      <ToastRegion toasts={toasts} />
    </>
  )
}

function FarmerProfileForm({ addToast, profile, queryClient, refreshUser }) {
  const [values, setValues] = useState(() => profileToFormValues(profile))
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const photoPreviewRef = useRef(photoPreviewUrl)
  const currentPhotoUrl = publicAssetUrl(profile?.profilePhotoUrl)

  useEffect(() => {
    photoPreviewRef.current = photoPreviewUrl
  }, [photoPreviewUrl])

  useEffect(() => {
    return () => {
      if (photoPreviewRef.current) {
        URL.revokeObjectURL(photoPreviewRef.current)
      }
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

  const saveMutation = useMutation({
    mutationFn: async ({ payload, photo }) => {
      const updatedProfile = await profileApi.updateFarmerProfile(payload)

      if (photo) {
        return profileApi.uploadFarmerProfilePhoto(buildProfilePhotoFormData(photo))
      }

      return updatedProfile
    },
    async onSuccess() {
      addToast('Profile updated.')
      if (selectedPhoto) {
        clearSelectedPhoto()
      }
      setIsDirty(false)
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.farmer })
      await refreshUser()
    },
    async onError(error) {
      setFieldErrors(fieldErrorsFromApi(error))
      setFormError(error.message || 'Profile could not be updated.')
      addToast(error.message || 'Profile could not be updated.', 'error')
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.farmer })
      await refreshUser()
    },
  })

  const isSubmitting = saveMutation.isPending

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
    setIsDirty(true)
  }

  function clearSelectedPhoto() {
    if (photoPreviewRef.current) {
      URL.revokeObjectURL(photoPreviewRef.current)
    }

    photoPreviewRef.current = ''
    setPhotoPreviewUrl('')
    setSelectedPhoto(null)
  }

  function selectPhoto(file) {
    const error = validateProfileImage(file)

    if (error) {
      setFieldErrors((current) => ({ ...current, image: error }))
      return
    }

    clearSelectedPhoto()
    setSelectedPhoto(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
    setFieldErrors((current) => ({ ...current, image: undefined }))
    setIsDirty(true)
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const nextErrors = validateFarmerProfileForm(values)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    saveMutation.mutate({ payload: buildFarmerProfilePayload(values), photo: selectedPhoto })
  }

  return (
    <section className="profile-page" aria-labelledby="profile-title">
      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <div className="section-heading">
          <div>
            <Badge tone="accent">Farmer profile</Badge>
            <h1 id="profile-title">Farmer Profile</h1>
            <p>Your phone number is visible to buyers so they can contact you about your produce.</p>
          </div>
          <Button isLoading={isSubmitting} type="submit">
            Save profile
          </Button>
        </div>

        {formError ? <p className="form-alert" role="alert">{formError}</p> : null}

        <div className="profile-form__grid">
          <Card className="profile-form__section profile-photo-card">
            <div className="profile-photo-card__preview">
              {photoPreviewUrl || currentPhotoUrl ? (
                <img alt="Current farmer profile" src={photoPreviewUrl || currentPhotoUrl} />
              ) : (
                <UserRound size={42} aria-hidden="true" />
              )}
            </div>
            <div>
              <h2>Profile photo</h2>
              <p>Use a clear JPEG, PNG, or WebP image up to 5 MB.</p>
              <label className="btn btn--ghost profile-photo-card__upload">
                <Camera size={17} aria-hidden="true" />
                Choose photo
                <input
                  accept="image/jpeg,image/png,image/webp"
                  type="file"
                  onChange={(event) => {
                    selectPhoto(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
              {selectedPhoto ? <Button variant="secondary" type="button" onClick={clearSelectedPhoto}>Remove selected photo</Button> : null}
              {fieldErrors.image ? <p className="form-field__error">{fieldErrors.image}</p> : null}
            </div>
          </Card>

          <Card className="profile-form__section">
            <FormField label="Name" required error={fieldErrors.name}>
              <TextInput autoComplete="name" value={values.name} onChange={(event) => updateValue('name', event.target.value)} />
            </FormField>

            <FormField
              label="WhatsApp phone"
              required
              error={fieldErrors.phone}
              helperText="Use international format, for example +2376XXXXXXXX."
            >
              <TextInput
                autoComplete="tel"
                inputMode="tel"
                value={values.phone}
                onChange={(event) => updateValue('phone', event.target.value)}
              />
            </FormField>

            <FormField
              label="Alternate WhatsApp phone"
              error={fieldErrors.whatsappPhone}
              helperText="Leave blank to use your account phone."
            >
              <TextInput
                autoComplete="tel"
                inputMode="tel"
                value={values.whatsappPhone}
                onChange={(event) => updateValue('whatsappPhone', event.target.value)}
              />
            </FormField>

            <FormField label="Email" helperText="Email editing is not supported for this MVP.">
              <TextInput value={profile?.email || 'No email added'} disabled readOnly />
            </FormField>
          </Card>

          <Card className="profile-form__section">
            <FormField label="Account location" required error={fieldErrors.accountLocation}>
              <TextInput value={values.accountLocation} onChange={(event) => updateValue('accountLocation', event.target.value)} />
            </FormField>

            <FormField label="Farm location" required error={fieldErrors.farmLocation}>
              <TextInput value={values.farmLocation} onChange={(event) => updateValue('farmLocation', event.target.value)} />
            </FormField>

            <FormField label="Produce specialty" error={fieldErrors.produceSpecialty} helperText="Example: tomatoes, plantains, or spices.">
              <TextInput value={values.produceSpecialty} onChange={(event) => updateValue('produceSpecialty', event.target.value)} />
            </FormField>

            <FormField label="Bio" error={fieldErrors.bio} helperText="A short note buyers can read on your listings.">
              <Textarea value={values.bio} onChange={(event) => updateValue('bio', event.target.value)} />
            </FormField>
          </Card>
        </div>
      </form>
    </section>
  )
}

export default FarmerProfilePage
