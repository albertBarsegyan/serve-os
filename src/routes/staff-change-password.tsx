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
import { useChangePasswordMutation } from '#/features/platform/model/platform-hooks'
import { m } from '#/paraglide/messages'
import { showError, showSuccess } from '#/shared/libs/hooks/toast'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils'
import { ErrorBoundary } from '#/shared/ui/error-boundary'
import { Logo } from '#/shared/ui/logo.tsx'

const changePasswordFormSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, { error: () => m.staff_change_password_validation_current_required() }),
    newPassword: z.string().min(8, { error: () => m.staff_change_password_validation_new_min() }),
    confirmPassword: z
      .string()
      .min(1, { error: () => m.staff_change_password_validation_confirm_required() }),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    error: () => m.staff_change_password_validation_passwords_mismatch(),
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof changePasswordFormSchema>

export const Route = createFileRoute('/staff-change-password')({
  validateSearch: (raw: Record<string, unknown>): { slug: string } => ({
    slug: typeof raw.slug === 'string' ? raw.slug : '',
  }),
  component: StaffChangePasswordPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function StaffChangePasswordPage() {
  const { slug } = Route.useSearch()
  const navigate = useNavigate()
  const changeMutation = useChangePasswordMutation()

  const oldPasswordId = useId()
  const newPasswordId = useId()
  const confirmPasswordId = useId()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await changeMutation.mutateAsync({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })

      showSuccess(m.staff_change_password_success())
      await navigate({ to: '/b/$slug/staff-login', params: { slug } })
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
        <Card className='rounded-2xl'>
          <CardHeader className='pb-2 pt-10 text-center'>
            <CardTitle className='text-2xl font-semibold tracking-tight'>
              {m.staff_change_password_title()}
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              {m.staff_change_password_subtitle()}
            </CardDescription>
          </CardHeader>
          <CardContent className='px-8 pb-10'>
            <form className='mt-6 space-y-5' onSubmit={handleSubmit(onSubmit)}>
              <div className='space-y-2'>
                <Label
                  htmlFor={oldPasswordId}
                  className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  {m.staff_change_password_current_label()}
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id={oldPasswordId}
                    type='password'
                    autoComplete='current-password'
                    placeholder={m.staff_change_password_mask_placeholder()}
                    className='h-14 rounded-xl pl-12'
                    {...register('oldPassword')}
                  />
                </div>
                {errors.oldPassword && (
                  <p className='ml-1 text-xs text-red-500'>{errors.oldPassword.message}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor={newPasswordId}
                  className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  {m.staff_change_password_new_label()}
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id={newPasswordId}
                    type='password'
                    autoComplete='new-password'
                    placeholder={m.staff_change_password_new_placeholder()}
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
                  {m.staff_change_password_confirm_label()}
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id={confirmPasswordId}
                    type='password'
                    autoComplete='new-password'
                    placeholder={m.staff_change_password_mask_placeholder()}
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
                disabled={changeMutation.isPending}
                className='mt-4 h-14 w-full rounded-xl'
              >
                {changeMutation.isPending
                  ? m.staff_change_password_updating()
                  : m.staff_change_password_update()}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className='mt-8 text-center text-sm text-muted-foreground'>
        <p>{m.staff_auth_footer_copyright({ year: new Date().getFullYear() })}</p>
      </div>
    </div>
  )
}
