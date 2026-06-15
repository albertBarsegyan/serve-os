import { StaffPermission } from '#/shared/libs/permissions/index.ts'
import { usePermissions } from '#/shared/libs/permissions/use-permissions.ts'

export interface TablePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canToggleStatus: boolean
  canManageReservation: boolean
}

export function useTablePermissions(): TablePermissions {
  const { isOwner, hasPermission } = usePermissions()

  if (isOwner()) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canToggleStatus: true,
      canManageReservation: true,
    }
  }

  return {
    canView: hasPermission(StaffPermission.TABLE_VIEW),
    canCreate: hasPermission(StaffPermission.TABLE_CREATE),
    canEdit: hasPermission(StaffPermission.TABLE_UPDATE),
    canDelete: hasPermission(StaffPermission.TABLE_DELETE),
    canToggleStatus: hasPermission(StaffPermission.TABLE_TOGGLE_STATUS),
    canManageReservation: hasPermission(StaffPermission.TABLE_MANAGE_RESERVATION),
  }
}
