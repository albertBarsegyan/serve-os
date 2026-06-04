import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Hash, KeyRound, Lock, Mail } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  loginWithPasswordSchema,
  loginWithPinSchema,
} from '#/features/platform/lib/schemas/platform.schemas'
import {
  useLoginStaffWithPasswordMutation,
  useLoginStaffWithPinMutation,
} from '#/features/platform/model/platform-hooks'
import { showError, showSuccess } from '#/shared/libs/hooks/toast'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

type SearchParams = { businessId: string }
type Tab = 'pin' | 'password'
type PinValues = z.infer<typeof loginWithPinSchema>
type PasswordValues = z.infer<typeof loginWithPasswordSchema>

export const Route = createFileRoute('/staff-login')({
  validateSearch: (raw: Record<string, unknown>): SearchParams => ({
    businessId: typeof raw.businessId === 'string' ? raw.businessId : '',
  }),
  component: StaffLoginPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function StaffLoginPage() {
  const { businessId } = Route.useSearch()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('pin')
  const [requiresChange, setRequiresChange] = useState(false)

  const pinMutation = useLoginStaffWithPinMutation()
  const passwordMutation = useLoginStaffWithPasswordMutation()

  const staffIdId = useId()
  const pinId = useId()
  const emailId = useId()
  const passwordId = useId()

  const pinForm = useForm<PinValues>({
    resolver: zodResolver(loginWithPinSchema),
    defaultValues: { staffId: '', pin: '' },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(loginWithPasswordSchema),
    defaultValues: { email: '', password: '' },
  })

  const onPinSubmit = async (values: PinValues) => {
    if (!businessId) return showError('businessId is missing from URL')
    try {
      await pinMutation.mutateAsync({ businessId, data: values })
      showSuccess('Logged in')
      await navigate({ to: '/dashboard' })
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const onPasswordSubmit = async (values: PasswordValues) => {
    if (!businessId) return showError('businessId is missing from URL')
    try {
      const result = await passwordMutation.mutateAsync({ businessId, data: values })
      if ('requirePasswordChange' in result && result.requirePasswordChange) {
        setRequiresChange(true)
        return
      }
      showSuccess('Logged in')
      await navigate({ to: '/dashboard' })
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  if (!businessId) {
    return (
      <StaffAuthLayout>
        <Card className='rounded-2xl'>
          <CardHeader className='pt-10 text-center'>
            <CardTitle className='text-xl font-semibold'>Missing business</CardTitle>
            <CardDescription>
              Open the link provided by your manager. It should include a <code>businessId</code>{' '}
              parameter.
            </CardDescription>
          </CardHeader>
        </Card>
      </StaffAuthLayout>
    )
  }

  if (requiresChange) {
    return (
      <StaffAuthLayout>
        <Card className='rounded-2xl'>
          <CardHeader className='pb-2 pt-10 text-center'>
            <CardTitle className='text-xl font-semibold'>Password change required</CardTitle>
            <CardDescription>
              Your manager set a temporary password. Please change it before continuing.
            </CardDescription>
          </CardHeader>
          <CardContent className='px-8 pb-10'>
            <Link
              to='/staff-change-password'
              className='mt-4 block h-14 w-full rounded-xl bg-primary text-center leading-[3.5rem] text-sm font-semibold text-primary-foreground'
            >
              Change Password
            </Link>
          </CardContent>
        </Card>
      </StaffAuthLayout>
    )
  }

  return (
    <StaffAuthLayout>
      <Card className='rounded-2xl'>
        <CardHeader className='pb-2 pt-10 text-center'>
          <CardTitle className='text-2xl font-semibold tracking-tight'>Staff Login</CardTitle>
          <CardDescription className='text-sm text-muted-foreground'>
            Sign in to access your workspace
          </CardDescription>
        </CardHeader>
        <CardContent className='px-8 pb-10'>
          {/* Tab switcher */}
          <div className='mt-4 flex rounded-xl border border-border bg-muted p-1'>
            {(['pin', 'password'] as Tab[]).map((t) => (
              <button
                key={t}
                type='button'
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'pin' ? 'PIN Login' : 'Password Login'}
              </button>
            ))}
          </div>

          {tab === 'pin' && (
            <form className='mt-6 space-y-5' onSubmit={pinForm.handleSubmit(onPinSubmit)}>
              <div className='space-y-2'>
                <Label
                  htmlFor={staffIdId}
                  className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  Staff ID
                </Label>
                <div className='relative'>
                  <Hash className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id={staffIdId}
                    type='text'
                    placeholder='Provided by your manager'
                    className='h-14 rounded-xl pl-12'
                    {...pinForm.register('staffId')}
                  />
                </div>
                {pinForm.formState.errors.staffId && (
                  <p className='ml-1 text-xs text-red-500'>
                    {pinForm.formState.errors.staffId.message}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label
                  htmlFor={pinId}
                  className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  PIN
                </Label>
                <div className='relative'>
                  <KeyRound className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id={pinId}
                    type='password'
                    inputMode='numeric'
                    maxLength={4}
                    placeholder='••••'
                    className='h-14 rounded-xl pl-12 tracking-[0.5em]'
                    {...pinForm.register('pin')}
                  />
                </div>
                {pinForm.formState.errors.pin && (
                  <p className='ml-1 text-xs text-red-500'>
                    {pinForm.formState.errors.pin.message}
                  </p>
                )}
              </div>
              <Button
                type='submit'
                disabled={pinMutation.isPending}
                className='mt-4 h-14 w-full rounded-xl'
              >
                {pinMutation.isPending ? 'Signing in…' : 'Sign In with PIN'}
              </Button>
            </form>
          )}

          {tab === 'password' && (
            <form className='mt-6 space-y-5' onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <div className='space-y-2'>
                <Label
                  htmlFor={emailId}
                  className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  Email
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id={emailId}
                    type='email'
                    autoComplete='email'
                    placeholder='name@company.com'
                    className='h-14 rounded-xl pl-12'
                    {...passwordForm.register('email')}
                  />
                </div>
                {passwordForm.formState.errors.email && (
                  <p className='ml-1 text-xs text-red-500'>
                    {passwordForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label
                  htmlFor={passwordId}
                  className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                >
                  Password
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    id={passwordId}
                    type='password'
                    autoComplete='current-password'
                    placeholder='••••••••'
                    className='h-14 rounded-xl pl-12'
                    {...passwordForm.register('password')}
                  />
                </div>
                {passwordForm.formState.errors.password && (
                  <p className='ml-1 text-xs text-red-500'>
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type='submit'
                disabled={passwordMutation.isPending}
                className='mt-4 h-14 w-full rounded-xl'
              >
                {passwordMutation.isPending ? 'Signing in…' : 'Sign In with Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </StaffAuthLayout>
  )
}

function StaffAuthLayout({ children }: { children: React.ReactNode }) {
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
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>{children}</div>
      <div className='mt-8 text-center text-sm text-muted-foreground'>
        <p>&copy; {new Date().getFullYear()} ServeOS. All rights reserved.</p>
      </div>
    </div>
  )
}
