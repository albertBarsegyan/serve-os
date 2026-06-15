import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '#/pages/landing/about/ui/about-page'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_site/about')({
  component: AboutPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
