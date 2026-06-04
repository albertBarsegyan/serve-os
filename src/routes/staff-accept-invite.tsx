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
import { showError, showSuccess } from '#/shared/libs/hooks/toast'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils'
import useActiveBusinessStore from '#/shared/store/use-active-business.store.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

type SearchParams = { token: string }

const acceptInviteFormSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
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
  const activeBusiness = useActiveBusinessStore((s) => s.active)

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
    if (!token) return showError('Invalid invite link — token is missing.')
    try {
      await acceptMutation.mutateAsync({ token, newPassword: values.newPassword })
      showSuccess('Password set — you can now log in.')

      await navigate({ to: '/staff-login', search: { businessId: activeBusiness?.id as string } })
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  return (
    <div className='flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link to='/' className='mb-6 flex items-center justify-center gap-2'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm'>
            S
          </div>
          <span className='text-2xl font-semibold tracking-tight text-foreground uppercase'>
            ServeOS
          </span>
        </Link>
      </div>

      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        {!token ? (
          <Card className='rounded-2xl'>
            <CardHeader className='pt-10 text-center'>
              <CardTitle className='text-xl font-semibold'>Invalid invite link</CardTitle>
              <CardDescription>
                The link you followed is missing the invite token. Please use the original link from
                your invitation email.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className='rounded-2xl'>
            <CardHeader className='pb-2 pt-10 text-center'>
              <CardTitle className='text-2xl font-semibold tracking-tight'>
                Accept Invitation
              </CardTitle>
              <CardDescription className='text-sm text-muted-foreground'>
                Set a password to activate your staff account.
              </CardDescription>
            </CardHeader>
            <CardContent className='px-8 pb-10'>
              <form className='mt-6 space-y-5' onSubmit={handleSubmit(onSubmit)}>
                <div className='space-y-2'>
                  <Label
                    htmlFor={newPasswordId}
                    className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                  >
                    New Password
                  </Label>
                  <div className='relative'>
                    <Lock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id={newPasswordId}
                      type='password'
                      autoComplete='new-password'
                      placeholder='At least 8 characters'
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
                    Confirm Password
                  </Label>
                  <div className='relative'>
                    <Lock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id={confirmPasswordId}
                      type='password'
                      autoComplete='new-password'
                      placeholder='••••••••'
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
                  {acceptMutation.isPending ? 'Activating account…' : 'Activate Account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <div className='mt-8 text-center text-sm text-muted-foreground'>
        <p>&copy; {new Date().getFullYear()} ServeOS. All rights reserved.</p>
      </div>
    </div>
  )
}
