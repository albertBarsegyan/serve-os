import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import type {
  StaffLookupResult,
  StaffRosterResponse,
} from '#/features/staff-auth/api/staff-auth.types.ts'
import {
  type EmailPasswordValues,
  emailPasswordSchema,
} from '#/features/staff-auth/lib/schemas/staff-auth.schema.ts'
import {
  useLoginStaffBySlugMutation,
  useStaffLookupMutation,
  useStaffPinLoginMutation,
} from '#/features/staff-auth/model/staff-auth-hooks.ts'
import { adminRoutePathname } from '#/shared/libs/constants/route-pathname/admin.ts'
import { showError } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Logo } from '#/shared/ui/logo.tsx'
import { PinPad } from './PinPad.tsx'

type Mode = 'employeeId' | 'pin' | 'email'

interface StaffLoginPageProps {
  slug: string
  roster: StaffRosterResponse
}

export function StaffLoginPage({ slug, roster }: Readonly<StaffLoginPageProps>) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('employeeId')
  const [lookedUpStaff, setLookedUpStaff] = useState<StaffLookupResult | null>(null)
  const [employeeIdInput, setEmployeeIdInput] = useState('')
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinAttemptsRemaining, setPinAttemptsRemaining] = useState<number | null>(null)
  const [pinLocked, setPinLocked] = useState(false)

  const lookupMutation = useStaffLookupMutation()
  const pinLoginMutation = useStaffPinLoginMutation()
  const emailLoginMutation = useLoginStaffBySlugMutation()

  const emailForm = useForm<EmailPasswordValues>({
    resolver: zodResolver(emailPasswordSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleEmployeeIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeIdInput.trim()) return
    setLookupError(null)

    try {
      const result = await lookupMutation.mutateAsync({
        employeeId: employeeIdInput.trim().toUpperCase(),
        businessId: roster.business.id,
      })
      setLookedUpStaff(result)
      setPinError(null)
      setPinAttemptsRemaining(null)
      setPinLocked(false)
      setMode('pin')
    } catch (err) {
      const msg = getResponseErrorMessage(err)
      if (msg.toLowerCase().includes('lock')) {
        setLookupError('Account locked. Contact your manager.')
      } else if (msg.toLowerCase().includes('not found')) {
        setLookupError('Employee ID not found.')
      } else {
        setLookupError(msg)
      }
    }
  }

  const handlePinSubmit = async (pin: string) => {
    if (!lookedUpStaff) return
    setPinError(null)

    try {
      await pinLoginMutation.mutateAsync({
        staffId: lookedUpStaff.id,
        pin,
        businessId: roster.business.id,
      })
      await navigate({ to: adminRoutePathname.DASHBOARD })
    } catch (err) {
      const msg = getResponseErrorMessage(err)

      if (msg.toLowerCase().includes('lock')) {
        setPinLocked(true)
        setPinError(null)
        setPinAttemptsRemaining(null)
      } else {
        setPinError(msg)
        const match = msg.match(/(\d+) attempt/)
        setPinAttemptsRemaining(match ? Number(match[1]) : null)
      }
    }
  }

  const handleEmailSubmit = async (values: EmailPasswordValues) => {
    try {
      const result = await emailLoginMutation.mutateAsync({
        slug,
        identifier: values.email,
        secret: values.password,
      })
      if (result.requiresPasswordChange) {
        await navigate({ to: '/staff-change-password', search: { slug } })
      } else {
        await navigate({ to: adminRoutePathname.DASHBOARD })
      }
    } catch (err) {
      showError(getResponseErrorMessage(err))
    }
  }

  const handleBackToEmployeeId = () => {
    setLookedUpStaff(null)
    setPinError(null)
    setPinAttemptsRemaining(null)
    setPinLocked(false)
    setMode('employeeId')
  }

  return (
    <div className='flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link to='/' className='mb-6 flex items-center justify-center gap-2'>
          <Logo size='lg' />
        </Link>
      </div>

      <div className='sm:mx-auto sm:w-full sm:max-w-lg'>
        <Card className='rounded-2xl'>
          <CardHeader className='pb-2 pt-10 text-center'>
            <CardTitle className='text-2xl font-semibold tracking-tight'>
              {roster.business.name}
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              {mode === 'employeeId' && 'Enter your Employee ID to sign in'}
              {mode === 'pin' && 'Confirm your identity'}
              {mode === 'email' && 'Sign in with email and password'}
            </CardDescription>
          </CardHeader>

          <CardContent className='px-8 pb-10'>
            {mode === 'employeeId' && (
              <form className='mt-4 space-y-5' onSubmit={handleEmployeeIdSubmit}>
                <div className='space-y-2'>
                  <Label
                    htmlFor='employeeId'
                    className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                  >
                    Employee ID
                  </Label>
                  <Input
                    id='employeeId'
                    type='text'
                    autoComplete='off'
                    placeholder='EMP-XXXXXX'
                    className='h-14 rounded-xl text-center text-lg font-mono uppercase tracking-widest'
                    value={employeeIdInput}
                    onChange={(e) => {
                      setEmployeeIdInput(e.target.value)
                      setLookupError(null)
                    }}
                  />
                  {lookupError && <p className='ml-1 text-xs text-destructive'>{lookupError}</p>}
                </div>

                <Button
                  type='submit'
                  disabled={lookupMutation.isPending || !employeeIdInput.trim()}
                  className='mt-4 h-14 w-full rounded-xl'
                >
                  {lookupMutation.isPending ? 'Looking up…' : 'Continue'}
                </Button>

                <div className='flex justify-center'>
                  <Button type='button' variant='ghost' size='sm' onClick={() => setMode('email')}>
                    Sign in with email instead
                  </Button>
                </div>
              </form>
            )}

            {mode === 'pin' && lookedUpStaff && (
              <div className='flex justify-center'>
                <PinPad
                  staffName={lookedUpStaff.displayName}
                  staffRole={lookedUpStaff.role}
                  staffAvatarUrl={lookedUpStaff.avatarUrl}
                  isPending={pinLoginMutation.isPending}
                  errorMessage={pinError}
                  attemptsRemaining={pinAttemptsRemaining}
                  isLocked={pinLocked}
                  onSubmit={handlePinSubmit}
                  onBack={handleBackToEmployeeId}
                />
              </div>
            )}

            {mode === 'email' && (
              <form className='mt-4 space-y-5' onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
                <div className='space-y-2'>
                  <Label
                    htmlFor='email'
                    className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                  >
                    Email
                  </Label>
                  <div className='relative'>
                    <Mail className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='email'
                      type='email'
                      autoComplete='email'
                      placeholder='name@company.com'
                      className='h-14 rounded-xl pl-12'
                      {...emailForm.register('email')}
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className='ml-1 text-xs text-red-500'>
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='password'
                    className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
                  >
                    Password
                  </Label>
                  <div className='relative'>
                    <Lock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      id='password'
                      type='password'
                      autoComplete='current-password'
                      placeholder='••••••••'
                      className='h-14 rounded-xl pl-12'
                      {...emailForm.register('password')}
                    />
                  </div>
                  {emailForm.formState.errors.password && (
                    <p className='ml-1 text-xs text-red-500'>
                      {emailForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type='submit'
                  disabled={emailLoginMutation.isPending}
                  className='mt-4 h-14 w-full rounded-xl'
                >
                  {emailLoginMutation.isPending ? 'Signing in…' : 'Sign In'}
                </Button>

                <div className='flex justify-center'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setMode('employeeId')}
                    disabled={emailLoginMutation.isPending}
                  >
                    ← Back
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <div className='mt-8 text-center text-sm text-muted-foreground'>
        <p>&copy; {new Date().getFullYear()} ServeOS. All rights reserved.</p>
      </div>
    </div>
  )
}
