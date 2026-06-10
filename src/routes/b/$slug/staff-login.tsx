import { createFileRoute } from '@tanstack/react-router'
import { getStaffRosterFn } from '#/features/staff-auth/api/staff-auth.fns.ts'
import { StaffLoginPage } from '#/features/staff-auth/ui/StaffLoginPage.tsx'
import { ErrorBoundary } from '#/shared/ui/error-boundary.tsx'

export const Route = createFileRoute('/b/$slug/staff-login')({
  loader: ({ params }) => getStaffRosterFn({ data: { slug: params.slug } }),
  component: StaffLoginRoute,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})

function StaffLoginRoute() {
  const { slug } = Route.useParams()
  const roster = Route.useLoaderData()
  return <StaffLoginPage slug={slug} roster={roster} />
}
