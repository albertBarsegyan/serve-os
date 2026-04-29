import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { SignInForm } from '#/features/auth/ui/sign-in-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/Card'

export const Route = createFileRoute('/auth/sign-in')({
  component: SignInPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function SignInPage() {
  return (
    <Card className='border-none shadow-xl shadow-[#5D5FEF]/5 rounded-[2.5rem] bg-white'>
      <CardHeader className='pt-10 pb-2 text-center'>
        <CardTitle className='text-2xl font-black text-[#2D2D2D]'>Welcome Back</CardTitle>
        <CardDescription className='text-sm font-medium text-[#666]'>
          Enter your credentials to access your restaurant dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className='px-8 pb-10'>
        <SignInForm />
      </CardContent>
    </Card>
  )
}
