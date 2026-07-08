import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as authApi from '../api/authApi'
import { useAuth } from '../auth/useAuth'
import {
  bueaLocations,
  createRegistrationPayload,
  fieldErrorsFromApi,
  resolvePostAuthRedirect,
  validateRegistration,
} from '../auth/authFormUtils'
import Button from '../components/Button'
import { Badge, Card } from '../components/Feedback'
import { FormField, PasswordInput, Select, TextInput } from '../components/FormControls'
import PageTitle from './PageTitle'

const initialValues = {
  accuracyConfirmed: false,
  email: '',
  location: '',
  name: '',
  password: '',
  passwordConfirmation: '',
  phone: '+237',
  role: 'farmer',
}

function RegisterPage() {
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const { refreshUser } = useAuth()
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: authApi.register,
  })

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateRegistration(values)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || mutation.isPending) {
      return
    }

    try {
      const result = await mutation.mutateAsync(createRegistrationPayload(values))
      await refreshUser()
      navigate(resolvePostAuthRedirect(result.user), { replace: true })
    } catch (error) {
      setFieldErrors(fieldErrorsFromApi(error))
      setFormError(error.message || 'Registration failed. Please check your details.')
    }
  }

  return (
    <>
      <PageTitle title="Register" description="Create a CultivaX farmer or buyer account." />
      <section className="auth-layout" aria-labelledby="register-title">
        <Card className="auth-card">
          <form className="stack" onSubmit={handleSubmit} noValidate>
            <div className="auth-card__header">
              <Badge tone="accent">Create account</Badge>
              <h1 id="register-title">Join CultivaX</h1>
              <p>Register as a farmer to publish produce, or as a buyer to browse and compare listings.</p>
            </div>

            {formError ? <p className="form-alert" role="alert">{formError}</p> : null}

            <FormField label="Account type" error={fieldErrors.role}>
              <Select value={values.role} onChange={(event) => updateField('role', event.target.value)}>
                <option value="farmer">Farmer</option>
                <option value="buyer">Buyer</option>
              </Select>
            </FormField>

            <FormField label="Full name" required error={fieldErrors.name}>
              <TextInput
                autoComplete="name"
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </FormField>

            <FormField label="WhatsApp phone with country code" required error={fieldErrors.phone}>
              <TextInput
                autoComplete="tel"
                inputMode="tel"
                placeholder="+2376XXXXXXXX"
                value={values.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </FormField>

            <FormField label="Email (optional)" helperText="Needed for password reset." error={fieldErrors.email}>
              <TextInput
                autoComplete="email"
                inputMode="email"
                value={values.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </FormField>

            <FormField label="Location within Buea" required error={fieldErrors.location}>
              <Select value={values.location} onChange={(event) => updateField('location', event.target.value)}>
                <option value="">Choose location</option>
                {bueaLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Password" required error={fieldErrors.password}>
              <PasswordInput
                autoComplete="new-password"
                value={values.password}
                onChange={(event) => updateField('password', event.target.value)}
              />
            </FormField>

            <FormField label="Confirm password" required error={fieldErrors.passwordConfirmation}>
              <PasswordInput
                autoComplete="new-password"
                value={values.passwordConfirmation}
                onChange={(event) => updateField('passwordConfirmation', event.target.value)}
              />
            </FormField>

            <label className="checkbox-field">
              <input
                checked={values.accuracyConfirmed}
                type="checkbox"
                onChange={(event) => updateField('accuracyConfirmed', event.target.checked)}
              />
              <span>I confirm the information I provided is accurate.</span>
            </label>
            {fieldErrors.accuracyConfirmed ? <span className="form-field__error">{fieldErrors.accuracyConfirmed}</span> : null}

            <Button isLoading={mutation.isPending} type="submit">
              Create account
            </Button>
          </form>
        </Card>
      </section>
    </>
  )
}

export default RegisterPage
