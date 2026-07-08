import { useMutation } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import * as authApi from '../api/authApi'
import { fieldErrorsFromApi, resolvePostAuthRedirect, validateLogin } from '../auth/authFormUtils'
import { useAuth } from '../auth/useAuth'
import Button from '../components/Button'
import { Badge, Card } from '../components/Feedback'
import { FormField, PasswordInput, TextInput } from '../components/FormControls'
import PageTitle from './PageTitle'

function LoginPage() {
  const [values, setValues] = useState({ identifier: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser } = useAuth()
  const mutation = useMutation({ mutationFn: authApi.login })
  const successMessage = location.state?.message

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateLogin(values)
    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || mutation.isPending) {
      return
    }

    try {
      const result = await mutation.mutateAsync({
        identifier: values.identifier.trim(),
        password: values.password,
      })
      await refreshUser()
      navigate(resolvePostAuthRedirect(result.user, location.state?.from?.pathname), { replace: true })
    } catch (error) {
      setFieldErrors(fieldErrorsFromApi(error))
      setFormError(error.message || 'Invalid phone/email or password.')
    }
  }

  return (
    <>
      <PageTitle title="Login" description="Log in to CultivaX with phone or email." />
      <section className="auth-layout" aria-labelledby="login-title">
        <Card className="auth-card">
          <form className="stack" onSubmit={handleSubmit} noValidate>
            <div className="auth-card__header">
              <Badge tone="accent">Welcome back</Badge>
              <h1 id="login-title">Log in</h1>
              <p>Use your phone number or email and password.</p>
            </div>

            {successMessage ? <p className="form-success">{successMessage}</p> : null}
            {formError ? <p className="form-alert" role="alert">{formError}</p> : null}

            <FormField label="Phone number or email" required error={fieldErrors.identifier}>
              <TextInput
                autoComplete="username"
                value={values.identifier}
                onChange={(event) => updateField('identifier', event.target.value)}
              />
            </FormField>

            <FormField label="Password" required error={fieldErrors.password}>
              <PasswordInput
                autoComplete="current-password"
                value={values.password}
                onChange={(event) => updateField('password', event.target.value)}
              />
            </FormField>

            <Link className="inline-link" to="/forgot-password">
              Forgot password?
            </Link>

            <Button isLoading={mutation.isPending} type="submit">
              Log in
            </Button>
          </form>
        </Card>
      </section>
    </>
  )
}

export default LoginPage
