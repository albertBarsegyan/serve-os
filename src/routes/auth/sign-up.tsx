import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { SignUpForm } from '#/features/auth/ui/sign-up-form'
import { m } from '#/paraglide/messages'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUpPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function SignUpPage() {
  return (
    <Card className='rounded-2xl'>
      <CardHeader className='pb-2 pt-10 text-center'>
        <CardTitle className='text-2xl font-semibold tracking-tight'>
          {m.auth_sign_up_title()}
        </CardTitle>
        <CardDescription className='text-sm text-muted-foreground'>
          {m.auth_sign_up_subtitle()}
        </CardDescription>
      </CardHeader>
      <CardContent className='px-8 pb-10'>
        <SignUpForm />
      </CardContent>
    </Card>
  )
}
