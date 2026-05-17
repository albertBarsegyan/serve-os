import { createFileRoute } from '@tanstack/react-router'
import { SignInForm } from '#/features/auth/ui/sign-in-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'

export const Route = createFileRoute('/auth/sign-in')({
  component: SignInPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function SignInPage() {
  return (
    <Card className='rounded-2xl'>
      <CardHeader className='pb-2 pt-10 text-center'>
        <CardTitle className='text-2xl font-semibold tracking-tight'>Welcome Back</CardTitle>
        <CardDescription className='text-sm text-muted-foreground'>
          Enter your credentials to access your restaurant dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className='px-8 pb-10'>
        <SignInForm />
      </CardContent>
    </Card>
  )
}
