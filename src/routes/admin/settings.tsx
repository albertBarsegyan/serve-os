import { createFileRoute } from '@tanstack/react-router'
import { AdminSettingsPage } from '#/pages/admin/settings/ui/admin-settings-page'

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettingsPage,
})
