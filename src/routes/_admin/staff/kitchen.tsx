import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_admin/staff/kitchen')({
  beforeLoad: () => {
    throw redirect({ to: '/kitchen', replace: true })
  },
  component: () => null,
})
