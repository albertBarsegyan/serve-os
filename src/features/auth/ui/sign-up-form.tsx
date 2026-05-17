import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, LucideLock, Mail, User } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { authUiMessage } from '#/features/auth/lib/constants/ui-messages.ts'
import { type SignUpFormValues, signUpSchema } from '#/features/auth/lib/schemas/sign-up.schema.ts'
import { signUpAdapter } from '#/features/auth/lib/utils/auth-forms-adapter.ts'
import { getPostAuthDestination } from '#/features/business/lib/utils/business-routing.ts'
import { useSignUpMutation } from '#/features/auth/model/auth-hooks.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export function SignUpForm() {
  const firstNameId = useId()
  const lastNameId = useId()
  const mailId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()

  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const { mutateAsync } = useSignUpMutation()

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      const authUser = await mutateAsync({ data: signUpAdapter.toApi(values) })

      showSuccess(authUiMessage.SUCCESS_SIGN_UP)
      await navigate({ to: getPostAuthDestination(authUser) })
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const inputErrorClass = 'border-destructive focus-visible:ring-destructive'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mt-6 space-y-4'>
      {/* First Name */}
      <div className='space-y-1.5'>
        <Label htmlFor={firstNameId} className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
          First Name
        </Label>
        <div className='relative'>
          <User className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
          <Input
            id={firstNameId}
            type='text'
            placeholder='John'
            className={`h-14 rounded-xl pl-12 pr-4 ${
              errors.firstName ? inputErrorClass : ''
            }`}
            {...register('firstName')}
          />
        </div>
        {errors.firstName && (
          <p className='text-xs text-red-500 ml-1'>{errors.firstName.message}</p>
        )}
      </div>

      {/* Last Name */}
      <div className='space-y-1.5'>
        <Label htmlFor={lastNameId} className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
          Last Name
        </Label>
        <div className='relative'>
          <User className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
          <Input
            id={lastNameId}
            type='text'
            placeholder='Doe'
            className={`h-14 rounded-xl pl-12 pr-4 ${
              errors.lastName ? inputErrorClass : ''
            }`}
            {...register('lastName')}
          />
        </div>
        {errors.lastName && <p className='text-xs text-red-500 ml-1'>{errors.lastName.message}</p>}
      </div>

      {/* Email */}
      <div className='space-y-1.5'>
        <Label htmlFor={mailId} className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
          Email Address
        </Label>
        <div className='relative'>
          <Mail className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
          <Input
            id={mailId}
            type='email'
            placeholder='name@company.com'
            className={`h-14 rounded-xl pl-12 pr-4 ${
              errors.email ? inputErrorClass : ''
            }`}
            {...register('email')}
          />
        </div>
        {errors.email && <p className='text-xs text-red-500 ml-1'>{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className='space-y-1.5'>
        <Label htmlFor={passwordId} className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
          Password
        </Label>
        <div className='relative'>
          <LucideLock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
          <Input
            id={passwordId}
            type={showPassword ? 'text' : 'password'}
            placeholder='••••••••'
            className={`h-14 rounded-xl pl-12 pr-12 ${
              errors.password ? inputErrorClass : ''
            }`}
            {...register('password')}
          />
          <button
            type='button'
            onClick={() => setShowPassword((prev) => !prev)}
            className='absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
          >
            {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
          </button>
        </div>
        {errors.password && <p className='text-xs text-red-500 ml-1'>{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div className='space-y-1.5'>
        <Label htmlFor={confirmPasswordId} className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
          Confirm Password
        </Label>
        <div className='relative'>
          <LucideLock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
          <Input
            id={confirmPasswordId}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder='••••••••'
            className={`h-14 rounded-xl pl-12 pr-12 ${
              errors.confirmPassword ? inputErrorClass : ''
            }`}
            {...register('confirmPassword')}
          />
          <button
            type='button'
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className='absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
          >
            {showConfirmPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className='text-xs text-red-500 ml-1'>{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className='pt-2'>
        <Button type='submit' className='h-14 w-full rounded-xl'>
          Create Account
        </Button>
      </div>

      <p className='mt-8 text-center text-sm font-medium text-muted-foreground'>
        Do You have an account?{' '}
        <Link to='/auth/sign-in' className='font-semibold text-primary hover:underline'>
          Sign in
        </Link>
      </p>
    </form>
  )
}
