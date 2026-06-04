import {zodResolver} from '@hookform/resolvers/zod'
import {Link, useNavigate} from '@tanstack/react-router'
import {Eye, EyeOff, Lock, Mail} from 'lucide-react'
import {useId, useState} from 'react'
import {useForm} from 'react-hook-form'
import {Button} from '#/components/ui/button'
import {Input} from '#/components/ui/input'
import {Label} from '#/components/ui/label'
import {authUiMessage} from '#/features/auth/lib/constants/ui-messages.ts'
import {type SignInFormValues, signInSchema,} from '#/features/auth/lib/schemas/sign-in-form.schema.ts'
import {useSignInMutation} from '#/features/auth/model/auth-hooks'
import {getPostAuthDestination} from '#/features/business/lib/utils/business-routing.ts'
import {showError, showSuccess} from '#/shared/libs/hooks/toast.ts'
import {getResponseErrorMessage} from '#/shared/libs/utils/http.utils.ts'

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
      const { user } = await signInMutation.mutateAsync({ data: values })

      showSuccess(authUiMessage.SUCCESS_SIGN_IN)

      await navigate({ to: getPostAuthDestination(user) })
    } catch (error) {
      showError(getResponseErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mt-6 space-y-5'>
      <div className='space-y-2'>
        <Label
          htmlFor={emailId}
          className='ml-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground'
        >
          Email Address
        </Label>

        <div className='relative'>
          <Mail className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='email'
            id={emailId}
            required
            autoComplete='email'
            placeholder='name@company.com'
            className='h-14 rounded-xl pl-12'
            {...register('email')}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex justify-between items-center ml-1'>
          <Label
            htmlFor={passwordId}
            className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'
          >
            Password
          </Label>
        </div>
        <div className='relative'>
          <Lock className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground' />
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            id={passwordId}
            autoComplete='current-password'
            placeholder='••••••••'
            className='h-14 rounded-xl pl-12 pr-12'
            {...register('password')}
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground'
          >
            {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
          </button>
        </div>
      </div>

      <Button
        type='submit'
        disabled={signInMutation.isPending}
        className='mt-4 h-14 w-full rounded-xl'
      >
        {signInMutation.isPending ? 'Signing in…' : 'Sign In'}
      </Button>

      <p className='mt-8 text-center text-sm font-medium text-muted-foreground'>
        Don't have an account?{' '}
        <Link to='/auth/sign-up' className='font-semibold text-primary hover:underline'>
          Create an account
        </Link>
      </p>
    </form>
  )
}
