import { createFileRoute } from '@tanstack/react-router'
import { VenueDisplayPage } from '#/pages/display/ui/venue-display-page'
import { noIndexMeta } from '#/shared/libs/seo/meta.ts'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/display/$token')({
  component: DisplayRoute,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
  head: () => ({ meta: noIndexMeta }),
})

function DisplayRoute() {
  const { token } = Route.useParams()
  return <VenueDisplayPage token={token} />
}
