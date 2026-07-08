import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import * as authApi from '../api/authApi'
import { fieldErrorsFromApi, validateResetPassword } from '../auth/authFormUtils'
import Button from '../components/Button'
import { Badge, Card } from '../components/Feedback'
import { FormField, PasswordInput } from '../components/FormControls'
import PageTitle from './PageTitle'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [values, setValues] = useState({ password: '', passwordConfirmation: '', token })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()
  const mutation = useMutation({ mutationFn: authApi.resetPassword })

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateResetPassword(values)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || mutation.isPending) {
      return
    }

    try {
      await mutation.mutateAsync(values)
      navigate('/login', {
        replace: true,
        state: { message: 'Password updated. Log in with your new password.' },
      })
    } catch (error) {
      setFieldErrors(fieldErrorsFromApi(error))
      setFormError(error.message || 'The reset link is invalid or expired.')
    }
  }

  return (
    <>
      <PageTitle title="Reset Password" description="Set a new CultivaX account password." />
      <section className="auth-layout" aria-labelledby="reset-title">
        <Card className="auth-card">
          <form className="stack" onSubmit={handleSubmit} noValidate>
            <div className="auth-card__header">
              <Badge tone="accent">New password</Badge>
              <h1 id="reset-title">Reset password</h1>
              <p>Use a password with at least 8 characters, including a letter and a number.</p>
            </div>

            {fieldErrors.token ? <p className="form-alert" role="alert">{fieldErrors.token}</p> : null}
            {formError ? <p className="form-alert" role="alert">{formError}</p> : null}

            <FormField label="New password" required error={fieldErrors.password}>
              <PasswordInput
                autoComplete="new-password"
                value={values.password}
                onChange={(event) => updateField('password', event.target.value)}
              />
            </FormField>

            <FormField label="Confirm new password" required error={fieldErrors.passwordConfirmation}>
              <PasswordInput
                autoComplete="new-password"
                value={values.passwordConfirmation}
                onChange={(event) => updateField('passwordConfirmation', event.target.value)}
              />
            </FormField>

            <Button isLoading={mutation.isPending} type="submit">
              Update password
            </Button>
          </form>
        </Card>
      </section>
    </>
  )
}

export default ResetPasswordPage
