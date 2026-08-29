import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Lock } from 'lucide-react'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useAcceptStaffInviteMutation } from '#/features/platform/model/platform-hooks'
import { m } from '#/paraglide/messages'
import { showError, showSuccess } from '#/shared/libs/hooks/toast'
import { useActiveBusiness } from '#/shared/libs/hooks/use-active-business.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils'
import { ErrorBoundary } from '#/shared/ui/error-boundary'
import { Logo } from '#/shared/ui/logo.tsx'

type SearchParams = { token: string }

const acceptInviteFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { error: () => m.staff_accept_invite_validation_password_min() }),
    confirmPassword: z
      .string()
      .min(1, { error: () => m.staff_accept_invite_validation_confirm_required() }),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    error: () => m.staff_accept_invite_validation_passwords_mismatch(),
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof acceptInviteFormSchema>

export const Route = createFileRoute('/staff-accept-invite')({
  validateSearch: (raw: Record<string, unknown>): SearchParams => ({
    token: typeof raw.token === 'string' ? raw.token : '',
  }),
  component: StaffAcceptInvitePage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function StaffAcceptInvitePage() {
  const { token } = Route.useSearch()
  const activeBusiness = useActiveBusiness()

  const navigate = useNavigate()
  const acceptMutation = useAcceptStaffInviteMutation()

  const newPasswordId = useId()
  const confirmPasswordId = useId()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(acceptInviteFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values: FormValues) => {
    if (!token) return showError(m.staff_accept_invite_error_missing_token())
    try {
      await acceptMutation.mutateAsync({ token, newPassword: values.newPassword })
      showSuccess(m.staff_accept_invite_success())

      await navigate({ to: `/b/${activeBusiness?.slug}/staff-login` })
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  return (
    <div className='flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link to='/' className='mb-6 flex items-center justify-center gap-2'>
          <Logo size='lg' />
        </Link>
      </div>

      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        {!token ? (
          <Card className='rounded-2xl'>
            <CardHeader className='pt-10 text-center'>
              <CardTitle className='text-xl font-semibold'>
                {m.staff_accept_invite_invalid_title()}
              </CardTitle>
              <CardDescription>{m.staff_accept_invite_invalid_body()}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className='rounded-2xl'>
            <CardHeader className='pb-2 pt-10 text-center'>
              <CardTitle className='text-2xl font-semibold tracking-tight'>
                {m.staff_accept_invite_title()}
              </CardTitle>
              <CardDescription className='text-sm text-muted-foreground'>
                {m.staff_accept_invite_subtitle()}
              </CardDescription>
            </CardHeader>
            <CardContent className='px-8 pb-10'>
              <form className='mt-6 space-y-5' onSubmit={handleSubmit(onSubmit)}>
                <div className='space-y-2'>
                  <Label
                    htmlFor={newPasswordId}
                    className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                  >
                    {m.staff_accept_invite_new_password_label()}
                  </Label>
                  <div className='relative'>
                    <Lock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id={newPasswordId}
                      type='password'
                      autoComplete='new-password'
                      placeholder={m.staff_accept_invite_password_placeholder()}
                      className='h-14 rounded-xl pl-12'
                      {...register('newPassword')}
                    />
                  </div>
                  {errors.newPassword && (
                    <p className='ml-1 text-xs text-red-500'>{errors.newPassword.message}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor={confirmPasswordId}
                    className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                  >
                    {m.staff_accept_invite_confirm_password_label()}
                  </Label>
                  <div className='relative'>
                    <Lock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id={confirmPasswordId}
                      type='password'
                      autoComplete='new-password'
                      placeholder={m.staff_accept_invite_password_mask_placeholder()}
                      className='h-14 rounded-xl pl-12'
                      {...register('confirmPassword')}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className='ml-1 text-xs text-red-500'>{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type='submit'
                  disabled={acceptMutation.isPending}
                  className='mt-4 h-14 w-full rounded-xl'
                >
                  {acceptMutation.isPending
                    ? m.staff_accept_invite_activating()
                    : m.staff_accept_invite_activate()}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <div className='mt-8 text-center text-sm text-muted-foreground'>
        <p>{m.staff_auth_footer_copyright({ year: new Date().getFullYear() })}</p>
      </div>
    </div>
  )
}
