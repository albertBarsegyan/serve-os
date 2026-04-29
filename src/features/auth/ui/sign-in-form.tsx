import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { authUiMessage } from '#/features/auth/lib/constants/ui-messages.ts'
import {
  type SignInFormValues,
  signInSchema,
} from '#/features/auth/lib/schemas/sign-in-form.schema.ts'
import { useSignInMutation } from '#/features/auth/model/auth-hooks'
import { showError, showSuccess } from '#/shared/libs/hooks/toast.ts'
import { getResponseErrorMessage } from '#/shared/libs/utils/http.utils.ts'
import { Button } from '#/shared/ui/Button'

export function SignInForm() {
  const emailId = useId()
  const passwordId = useId()
  const navigate = useNavigate()
  const signInMutation = useSignInMutation()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: SignInFormValues) => {
    try {
      await signInMutation.mutateAsync(values)

      showSuccess(authUiMessage.SUCCESS_SIGN_IN)
      await navigate({ to: '/admin/dashboard' })
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-5 mt-6'>
      <div className='space-y-2'>
        <label
          htmlFor={emailId}
          className='text-xs font-bold uppercase tracking-widest text-[#B0B0B0] ml-1'
        >
          Email Address
        </label>

        <div className='relative'>
          <Mail className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0B0B0]' />
          <input
            type='email'
            id={emailId}
            required
            autoComplete='email'
            placeholder='name@company.com'
            className='h-14 w-full rounded-2xl border-none bg-[#F5F5F5] pl-12 pr-4 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all'
            {...register('email')}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex justify-between items-center ml-1'>
          <label
            htmlFor={passwordId}
            className='text-xs font-bold uppercase tracking-widest text-[#B0B0B0]'
          >
            Password
          </label>
        </div>
        <div className='relative'>
          <Lock className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#B0B0B0]' />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            id={passwordId}
            autoComplete='current-password'
            placeholder='••••••••'
            className='h-14 w-full rounded-2xl border-none bg-[#F5F5F5] pl-12 pr-12 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 transition-all'
            {...register('password')}
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-4 top-1/2 -translate-y-1/2 text-[#B0B0B0] hover:text-[#2D2D2D] transition-colors'
          >
            {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
          </button>
        </div>
      </div>

      <Button
        type='submit'
        disabled={signInMutation.isPending}
        className='w-full h-14 rounded-2xl shadow-lg shadow-[#5D5FEF]/20 mt-4'
      >
        {signInMutation.isPending ? 'Signing in…' : 'Sign In'}
      </Button>

      <p className='text-center text-sm font-medium text-[#666] mt-8'>
        Don't have an account?{' '}
        <Link to='/auth/sign-up' className='text-[#5D5FEF] font-bold hover:underline'>
          Create an account
        </Link>
      </p>
    </form>
  )
}
