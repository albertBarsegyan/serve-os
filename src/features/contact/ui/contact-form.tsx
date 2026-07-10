import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import {
  type ContactRequestFormValues,
  contactRequestSchema,
} from '#/features/contact/lib/schemas/contact-request.schema.ts'
import { useSubmitContactRequestMutation } from '#/features/contact/model/use-submit-contact-request'
import { m } from '#/paraglide/messages'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'

export function ContactForm() {
  const nameId = useId()
  const emailId = useId()
  const messageId = useId()
  const submitMutation = useSubmitContactRequestMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactRequestFormValues>({
    resolver: zodResolver(contactRequestSchema),
    defaultValues: { name: '', email: '', message: '' },
  })

  const onSubmit = async (values: ContactRequestFormValues) => {
    try {
      await submitMutation.mutateAsync(values)
      showSuccess(m.landing_pricing_form_success())
      reset()
    } catch {
      showError(m.landing_pricing_form_error())
    }
  }

  return (
    <form className='contact-form' onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className='cf-field'>
        <label htmlFor={nameId}>{m.landing_pricing_form_name_label()}</label>
        <input
          id={nameId}
          type='text'
          autoComplete='name'
          placeholder={m.landing_pricing_form_name_placeholder()}
          {...register('name')}
        />
        {errors.name && <span className='cf-error'>{errors.name.message}</span>}
      </div>

      <div className='cf-field'>
        <label htmlFor={emailId}>{m.landing_pricing_form_email_label()}</label>
        <input
          id={emailId}
          type='email'
          autoComplete='email'
          placeholder={m.landing_pricing_form_email_placeholder()}
          {...register('email')}
        />
        {errors.email && <span className='cf-error'>{errors.email.message}</span>}
      </div>

      <div className='cf-field'>
        <label htmlFor={messageId}>{m.landing_pricing_form_message_label()}</label>
        <textarea
          id={messageId}
          placeholder={m.landing_pricing_form_message_placeholder()}
          {...register('message')}
        />
        {errors.message && <span className='cf-error'>{errors.message.message}</span>}
      </div>

      <button
        type='submit'
        className='btn primary lg cf-submit'
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending
          ? m.landing_pricing_form_submitting()
          : m.landing_pricing_form_submit()}
      </button>
    </form>
  )
}
