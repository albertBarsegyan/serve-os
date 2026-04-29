import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, LucideLock, Mail, User } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { authQueryKey } from '#/features/auth/lib/constants/auth-query-keys.ts'
import { authUiMessage } from '#/features/auth/lib/constants/ui-messages.ts'
import {
  type SignUpFormValues,
  signUpFormSchema,
} from '#/features/auth/lib/schemas/sign-up-form.schema.ts'
import { signUpAdapter } from '#/features/auth/lib/utils/auth-forms-adapter.ts'
import { useSignUpMutation } from '#/features/auth/model/auth-hooks.ts'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Button } from '#/shared/ui/Button'

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
    resolver: zodResolver(signUpFormSchema),
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
      await mutateAsync(signUpAdapter.toApi(values))

      await navigate({ to: '/admin/dashboard' })

      showSuccess(authUiMessage.SUCCESS_SIGN_UP)
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  const inputErrorClass = 'ring-2 ring-red-400 bg-red-50'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 mt-6'>
      {/* First Name */}
      <div className='space-y-1.5'>
        <label
          htmlFor={firstNameId}
          className='text-xs font-bold uppercase tracking-widest text-[#B0B0B0] ml-1'
        >
          First Name
        </label>
        <div className='relative'>
          <User className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0B0B0]' />
          <input
            id={firstNameId}
            type='text'
            placeholder='John'
            className={`h-14 w-full rounded-2xl border-none bg-[#F5F5F5] pl-12 pr-4 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all ${
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
        <label
          htmlFor={lastNameId}
          className='text-xs font-bold uppercase tracking-widest text-[#B0B0B0] ml-1'
        >
          Last Name
        </label>
        <div className='relative'>
          <User className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0B0B0]' />
          <input
            id={lastNameId}
            type='text'
            placeholder='Doe'
            className={`h-14 w-full rounded-2xl border-none bg-[#F5F5F5] pl-12 pr-4 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all ${
              errors.lastName ? inputErrorClass : ''
            }`}
            {...register('lastName')}
          />
        </div>
        {errors.lastName && <p className='text-xs text-red-500 ml-1'>{errors.lastName.message}</p>}
      </div>

      {/* Email */}
      <div className='space-y-1.5'>
        <label
          htmlFor={mailId}
          className='text-xs font-bold uppercase tracking-widest text-[#B0B0B0] ml-1'
        >
          Email Address
        </label>
        <div className='relative'>
          <Mail className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0B0B0]' />
          <input
            id={mailId}
            type='email'
            placeholder='name@company.com'
            className={`h-14 w-full rounded-2xl border-none bg-[#F5F5F5] pl-12 pr-4 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all ${
              errors.email ? inputErrorClass : ''
            }`}
            {...register('email')}
          />
        </div>
        {errors.email && <p className='text-xs text-red-500 ml-1'>{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className='space-y-1.5'>
        <label
          htmlFor={passwordId}
          className='text-xs font-bold uppercase tracking-widest text-[#B0B0B0] ml-1'
        >
          Password
        </label>
        <div className='relative'>
          <LucideLock className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0B0B0]' />
          <input
            id={passwordId}
            type={showPassword ? 'text' : 'password'}
            placeholder='••••••••'
            className={`h-14 w-full rounded-2xl border-none bg-[#F5F5F5] pl-12 pr-12 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all ${
              errors.password ? inputErrorClass : ''
            }`}
            {...register('password')}
          />
          <button
            type='button'
            onClick={() => setShowPassword((prev) => !prev)}
            className='absolute right-4 top-1/2 -translate-y-1/2 text-[#B0B0B0] hover:text-[#2D2D2D]'
          >
            {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
          </button>
        </div>
        {errors.password && <p className='text-xs text-red-500 ml-1'>{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div className='space-y-1.5'>
        <label
          htmlFor={confirmPasswordId}
          className='text-xs font-bold uppercase tracking-widest text-[#B0B0B0] ml-1'
        >
          Confirm Password
        </label>
        <div className='relative'>
          <LucideLock className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0B0B0]' />
          <input
            id={confirmPasswordId}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder='••••••••'
            className={`h-14 w-full rounded-2xl border-none bg-[#F5F5F5] pl-12 pr-12 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all ${
              errors.confirmPassword ? inputErrorClass : ''
            }`}
            {...register('confirmPassword')}
          />
          <button
            type='button'
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className='absolute right-4 top-1/2 -translate-y-1/2 text-[#B0B0B0] hover:text-[#2D2D2D]'
          >
            {showConfirmPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className='text-xs text-red-500 ml-1'>{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className='pt-2'>
        <Button type='submit' className='w-full h-14 rounded-2xl shadow-lg shadow-[#5D5FEF]/20'>
          Create Account
        </Button>
      </div>

      <p className='text-center text-sm font-medium text-[#666] mt-8'>
        Do You have an account?{' '}
        <Link to='/auth/sign-in' className='text-[#5D5FEF] font-bold hover:underline'>
          Sign in
        </Link>
      </p>
    </form>
  )
}
