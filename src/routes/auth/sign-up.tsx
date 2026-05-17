import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { SignUpForm } from '#/features/auth/ui/sign-up-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUpPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function SignUpPage() {
  return (
    <Card className='rounded-2xl'>
      <CardHeader className='pb-2 pt-10 text-center'>
        <CardTitle className='text-2xl font-semibold tracking-tight'>Create Account</CardTitle>
        <CardDescription className='text-sm text-muted-foreground'>
          Start managing your venue with ServeOS today
        </CardDescription>
      </CardHeader>
      <CardContent className='px-8 pb-10'>
        <SignUpForm />
      </CardContent>
    </Card>
  )
}
