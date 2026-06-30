import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CATEGORIES_QUERY_KEY } from '#/entities/product/api/category-hooks.ts'
import { authUserQueryOptions } from '#/features/auth/lib/query-options.ts'
import type {
  AcceptInviteRequest,
  AddModifierRequest,
  ChangePasswordRequest,
  ConfirmPaymentRequest,
  CreateMenuCategoryRequest,
  CreateModifierGroupRequest,
  CreateOrderRequest,
  CreatePaymentRequest,
  CreateProductRequest,
  CreateStaffOrderRequest,
  CreateStaffWithInviteRequest,
  CreateStaffWithPasswordRequest,
  CreateStaffWithPinRequest,
  CreateTableRequest,
  ProcessPaymentRequest,
  ScanSessionRequest,
  SetTableReservationRequest,
  StaffLoginWithPasswordRequest,
  StaffLoginWithPinRequest,
  ToggleTableStatusRequest,
  UpdateMenuCategoryRequest,
  UpdateModifierGroupRequest,
  UpdateModifierRequest,
  UpdateOrderStatusRequest,
  UpdateProductRequest,
  UpdateStaffRequest,
  UpdateStaffRoleRequest,
  UpdateTableRequest,
} from '#/features/platform/api/platform.types.ts'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'
import {
  acceptStaffInvite,
  addModifierToGroup,
  changePassword,
  closeSession,
  confirmOrder,
  confirmPayment,
  createMenuCategory,
  createModifierGroup,
  createOrder,
  createPayment,
  createProduct,
  createStaffOrder,
  createStaffWithInvite,
  createStaffWithPassword,
  createStaffWithPin,
  createTable,
  deleteMenuCategory,
  deleteModifier,
  deleteModifierGroup,
  deleteProduct,
  deleteTable,
  loginStaffWithPassword,
  loginStaffWithPin,
  logoutStaff,
  processCashPayment,
  processPosPayment,
  removeStaff,
  scanSession,
  setProductAvailability,
  setTableReservation,
  syncProductModifierGroups,
  toggleTableStatus,
  unlockStaff,
  updateMenuCategory,
  updateModifier,
  updateModifierGroup,
  updateOrderStatus,
  updateProduct,
  updateStaff,
  updateStaffRole,
  updateTable,
  uploadTableImage,
} from '#/shared/api/platform/platform-api.ts'

export function useCreateTableMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTableRequest) => createTable(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tables() })
    },
  })
}

export function useUpdateTableMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: UpdateTableRequest }) =>
      updateTable(tableId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tables() })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tableById(variables.tableId),
      })
    },
  })
}

export function useDeleteTableMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tableId: string) => deleteTable(tableId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tables() })
    },
  })
}

export function useToggleTableStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: ToggleTableStatusRequest }) =>
      toggleTableStatus(tableId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tables() })
    },
  })
}

export function useSetTableReservationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: SetTableReservationRequest }) =>
      setTableReservation(tableId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tables() })
    },
  })
}

export function useUploadTableImageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tableId, file }: { tableId: string; file: File }) =>
      uploadTableImage(tableId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tables() })
    },
  })
}

export function useScanSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ScanSessionRequest) => scanSession(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.sessions() })
    },
  })
}

export function useCloseSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => closeSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.sessions() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tables() })
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
    },
  })
}

export function useCreateMenuCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMenuCategoryRequest) => createMenuCategory(data),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY, data.businessId] })
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(false) })
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
    },
  })
}

export function useUpdateMenuCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: UpdateMenuCategoryRequest }) =>
      updateMenuCategory(categoryId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(false) })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
    },
  })
}

export function useDeleteMenuCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: string) => deleteMenuCategory(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(false) })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'products'] })
    },
  })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'products'] })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
    },
  })
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: UpdateProductRequest }) =>
      updateProduct(productId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'products'] })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'products'] })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
    },
  })
}

export function useSetProductAvailabilityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, isAvailable }: { productId: string; isAvailable: boolean }) =>
      setProductAvailability(productId, isAvailable),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'products'] })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
    },
  })
}

export function useSyncProductModifierGroupsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, groupIds }: { productId: string; groupIds: string[] }) =>
      syncProductModifierGroups(productId, groupIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'products'] })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
    },
  })
}

export function useCreateModifierGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, data }: { businessId: string; data: CreateModifierGroupRequest }) =>
      createModifierGroup(businessId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.modifierGroups(variables.businessId),
      })
    },
  })
}

export function useUpdateModifierGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      groupId,
      data,
    }: {
      businessId: string
      groupId: string
      data: UpdateModifierGroupRequest
    }) => updateModifierGroup(businessId, groupId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.modifierGroups(variables.businessId),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.modifierGroupById(variables.businessId, variables.groupId),
      })
    },
  })
}

export function useDeleteModifierGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, groupId }: { businessId: string; groupId: string }) =>
      deleteModifierGroup(businessId, groupId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.modifierGroups(variables.businessId),
      })
    },
  })
}

export function useAddModifierToGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      groupId,
      data,
    }: {
      businessId: string
      groupId: string
      data: AddModifierRequest
    }) => addModifierToGroup(businessId, groupId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.modifiers(variables.businessId, variables.groupId),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.modifierGroups(variables.businessId),
      })
    },
  })
}

export function useUpdateModifierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      groupId,
      modifierId,
      data,
    }: {
      businessId: string
      groupId: string
      modifierId: string
      data: UpdateModifierRequest
    }) => updateModifier(businessId, groupId, modifierId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.modifiers(variables.businessId, variables.groupId),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.modifierGroups(variables.businessId),
      })
    },
  })
}

export function useDeleteModifierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      groupId,
      modifierId,
    }: {
      businessId: string
      groupId: string
      modifierId: string
    }) => deleteModifier(businessId, groupId, modifierId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.modifiers(variables.businessId, variables.groupId),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.modifierGroups(variables.businessId),
      })
    },
  })
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => createOrder(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
    },
  })
}

export function useCreateStaffOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStaffOrderRequest) => createStaffOrder(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
    },
  })
}

export function useConfirmOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => confirmOrder(orderId),
    onSuccess: (_, orderId) => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orderById(orderId) })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.kitchenOrders() })
    },
  })
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: UpdateOrderStatusRequest }) =>
      updateOrderStatus(orderId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.orderById(variables.orderId),
      })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.kitchenOrders() })
    },
  })
}

export function useProcessCashPaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: ProcessPaymentRequest }) =>
      processCashPayment(orderId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.payments() })
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
    },
  })
}

export function useProcessPosPaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: ProcessPaymentRequest }) =>
      processPosPayment(orderId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.payments() })
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
    },
  })
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => createPayment(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.payments() })
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
    },
  })
}

export function useConfirmPaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: ConfirmPaymentRequest }) =>
      confirmPayment(paymentId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.payments() })
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
    },
  })
}

export function useCreateStaffWithInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      data,
    }: {
      businessId: string
      data: CreateStaffWithInviteRequest
    }) => createStaffWithInvite(businessId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.staff(variables.businessId),
      })
    },
  })
}

export function useCreateStaffWithPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      data,
    }: {
      businessId: string
      data: CreateStaffWithPasswordRequest
    }) => createStaffWithPassword(businessId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.staff(variables.businessId),
      })
    },
  })
}

export function useCreateStaffWithPinMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, data }: { businessId: string; data: CreateStaffWithPinRequest }) =>
      createStaffWithPin(businessId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.staff(variables.businessId),
      })
    },
  })
}

export function useLoginStaffWithPasswordMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      businessId,
      data,
    }: {
      businessId: string
      data: StaffLoginWithPasswordRequest
    }) => loginStaffWithPassword(businessId, data),
    onSuccess: (data) => {
      if (!('requiresPasswordChange' in data)) {
        queryClient.setQueryData(authUserQueryOptions().queryKey, data)
      }
    },
  })
}

export function useLoginStaffWithPinMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, data }: { businessId: string; data: StaffLoginWithPinRequest }) =>
      loginStaffWithPin(businessId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(authUserQueryOptions().queryKey, data)
    },
  })
}

export function useLogoutStaffMutation() {
  return useMutation({
    mutationFn: (businessId: string) => logoutStaff(businessId),
  })
}

export function useAcceptStaffInviteMutation() {
  return useMutation({
    mutationFn: (data: AcceptInviteRequest) => acceptStaffInvite(data),
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
  })
}

export function useUpdateStaffRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      staffId,
      data,
    }: {
      businessId: string
      staffId: string
      data: UpdateStaffRoleRequest
    }) => updateStaffRole(businessId, staffId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.staff(variables.businessId),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.staffById(variables.businessId, variables.staffId),
      })
    },
  })
}

export function useUpdateStaffMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      businessId,
      staffId,
      data,
    }: {
      businessId: string
      staffId: string
      data: UpdateStaffRequest
    }) => updateStaff(businessId, staffId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.staff(variables.businessId),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.staffById(variables.businessId, variables.staffId),
      })
    },
  })
}

export function useRemoveStaffMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, staffId }: { businessId: string; staffId: string }) =>
      removeStaff(businessId, staffId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.staff(variables.businessId),
      })
    },
  })
}

export function useUnlockStaffMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, staffId }: { businessId: string; staffId: string }) =>
      unlockStaff(businessId, staffId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.staff(variables.businessId),
      })
    },
  })
}
