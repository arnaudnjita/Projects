import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import * as authApi from '../api/authApi'
import { fieldErrorsFromApi, validateForgotPassword } from '../auth/authFormUtils'
import Button from '../components/Button'
import { Badge, Card } from '../components/Feedback'
import { FormField, TextInput } from '../components/FormControls'
import PageTitle from './PageTitle'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [message, setMessage] = useState('')
  const mutation = useMutation({ mutationFn: authApi.forgotPassword })

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateForgotPassword({ email })
    setFieldErrors(nextErrors)
    setMessage('')

    if (Object.keys(nextErrors).length > 0 || mutation.isPending) {
      return
    }

    try {
      const result = await mutation.mutateAsync({ email: email.trim() })
      setMessage(result.message || 'If that email is registered, a reset link has been sent.')
    } catch (error) {
      setFieldErrors(fieldErrorsFromApi(error))
      setMessage(error.message || 'If that email is registered, a reset link has been sent.')
    }
  }

  return (
    <>
      <PageTitle title="Forgot Password" description="Request a CultivaX password reset link." />
      <section className="auth-layout" aria-labelledby="forgot-title">
        <Card className="auth-card">
          <form className="stack" onSubmit={handleSubmit} noValidate>
            <div className="auth-card__header">
              <Badge tone="accent">Password reset</Badge>
              <h1 id="forgot-title">Forgot password</h1>
              <p>Reset links can only be sent to accounts that have an email address.</p>
            </div>

            {message ? <p className="form-success">{message}</p> : null}

            <FormField label="Email" required error={fieldErrors.email}>
              <TextInput
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setFieldErrors({})
                  setMessage('')
                }}
              />
            </FormField>

            <Button isLoading={mutation.isPending} type="submit">
              Send reset link
            </Button>
          </form>
        </Card>
      </section>
    </>
  )
}

export default ForgotPasswordPage
