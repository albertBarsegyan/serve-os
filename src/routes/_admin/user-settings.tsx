import { createFileRoute } from '@tanstack/react-router'
import { UserSettingsPage } from '#/pages/admin/user-settings/ui/user-settings-page'
import { ErrorBoundary } from '#/shared/ui/error-boundary'

export const Route = createFileRoute('/_admin/user-settings')({
  component: UserSettingsPage,
  errorComponent: ({ error }) => <ErrorBoundary error={error} />,
})
