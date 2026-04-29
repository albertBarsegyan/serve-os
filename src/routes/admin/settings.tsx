import { createFileRoute } from '@tanstack/react-router'
import { ErrorBoundary } from '#/shared/ui/ErrorBoundary'
import { AdminSettingsPage } from '#/pages/admin/settings/ui/admin-settings-page'

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettingsPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
