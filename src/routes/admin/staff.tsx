import { createFileRoute } from '@tanstack/react-router'
import { AdminStaffPage } from '#/pages/admin/staff/ui/admin-staff-page'

export const Route = createFileRoute('/admin/staff')({
  component: AdminStaffPage,
})
