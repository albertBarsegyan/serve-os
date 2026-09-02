import { useMutation, useQueryClient } from '@tanstack/react-query'
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
  CreateStaffOrderRequest,
  CreateStaffWithInviteRequest,
  CreateStaffWithPasswordRequest,
  CreateStaffWithPinRequest,
  CreateTableRequest,
  Order,
  ProcessPaymentRequest,
  RefundOrderRequest,
  ScanSessionRequest,
  SetTableReservationRequest,
  StaffLoginWithPasswordRequest,
  StaffLoginWithPinRequest,
  ToggleTableStatusRequest,
  UpdateMenuCategoryRequest,
  UpdateModifierGroupRequest,
  UpdateModifierRequest,
  UpdateOrderStatusRequest,
  UpdateStaffRequest,
  UpdateStaffRoleRequest,
  UpdateTableRequest,
} from '#/features/platform/api/platform.types.ts'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'
import {
  acceptStaffInvite,
  acknowledgeWaiterCall,
  addModifierToGroup,
  changePassword,
  closeSession,
  confirmOrder,
  confirmPayment,
  createMenuCategory,
  createModifierGroup,
  createOrder,
  createPayment,
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
  joinSessions,
  loginStaffWithPassword,
  loginStaffWithPin,
  logoutStaff,
  processCashPayment,
  processPosPayment,
  refundOrder,
  removeStaff,
  scanSession,
  setProductAvailability,
  setTableReservation,
  splitSession,
  syncProductModifierGroups,
  toggleTableStatus,
  unlockStaff,
  updateMenuCategory,
  updateModifier,
  updateModifierGroup,
  updateOrderStatus,
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
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() })
    },
  })
}

export function useUpdateTableMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: UpdateTableRequest }) =>
      updateTable(tableId, data),
    onSuccess: () => {
      // Covers both the list and the per-table detail key underneath it.
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() })
    },
  })
}

export function useDeleteTableMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tableId: string) => deleteTable(tableId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() })
    },
  })
}

export function useToggleTableStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: ToggleTableStatusRequest }) =>
      toggleTableStatus(tableId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() })
    },
  })
}

export function useSetTableReservationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: SetTableReservationRequest }) =>
      setTableReservation(tableId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() })
    },
  })
}

export function useUploadTableImageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tableId, file }: { tableId: string; file: File }) =>
      uploadTableImage(tableId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() })
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
    // Returning the invalidation promises (not `void`-ing them) makes mutateAsync only
    // resolve once these queries have finished refetching — otherwise a caller's `await
    // mutateAsync()` resolves while the old cached data (a still-active session) is still
    // what every reader sees for one more render, which is what let a stale "Close session"
    // button re-render enabled/showing the previous stage for a beat. See the identical
    // comment on useUpdateOrderStatusMutation below for the general pattern.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.sessions() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.activeSessionsRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() }),
      ]),
  })
}

export function useJoinSessionsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      targetSessionId,
      sourceSessionId,
    }: {
      targetSessionId: string
      sourceSessionId: string
    }) => joinSessions(targetSessionId, { sourceSessionId }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.activeSessionsRoot() }),
  })
}

export function useSplitSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => splitSession(sessionId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.activeSessionsRoot() }),
  })
}

export function useAcknowledgeWaiterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => acknowledgeWaiterCall(sessionId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.activeSessionsRoot() }),
  })
}

export function useCreateMenuCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMenuCategoryRequest) => createMenuCategory(data),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategoriesRoot() })
      await queryClient.invalidateQueries({ queryKey: ['customer-menu', data.businessId] })
    },
  })
}

export function useUpdateMenuCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: UpdateMenuCategoryRequest }) =>
      updateMenuCategory(categoryId, data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategoriesRoot() })
      void queryClient.invalidateQueries({ queryKey: ['customer-menu', data.businessId] })
    },
  })
}

export function useDeleteMenuCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: string) => deleteMenuCategory(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategoriesRoot() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.productsRoot() })
      // Deleted category's businessId isn't returned by the API — invalidate broadly.
      void queryClient.invalidateQueries({ queryKey: ['customer-menu'] })
    },
  })
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.productsRoot() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategoriesRoot() })
      // Deleted product's businessId isn't returned by the API — invalidate broadly.
      void queryClient.invalidateQueries({ queryKey: ['customer-menu'] })
    },
  })
}

export function useSetProductAvailabilityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, isAvailable }: { productId: string; isAvailable: boolean }) =>
      setProductAvailability(productId, isAvailable),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.productsRoot() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategoriesRoot() })
      void queryClient.invalidateQueries({ queryKey: ['customer-menu', data.businessId] })
    },
  })
}

export function useSyncProductModifierGroupsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, groupIds }: { productId: string; groupIds: string[] }) =>
      syncProductModifierGroups(productId, groupIds),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.productsRoot() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategoriesRoot() })
      void queryClient.invalidateQueries({ queryKey: ['customer-menu', data.businessId] })
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
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() })
    },
  })
}

export function useCreateStaffOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStaffOrderRequest) => createStaffOrder(data),
    // A staff order with no sessionId attaches to (or creates) the table's default session —
    // activeSessionsRoot must refetch too, not just ordersRoot, or SessionCard keeps showing
    // "no session" for a table that now has one. Returned (not void-ed) so the dialog's
    // `await mutateAsync()` only resolves once both have actually refetched.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.activeSessionsRoot() }),
      ]),
  })
}

export function useConfirmOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => confirmOrder(orderId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.kitchenOrders() }),
      ]),
  })
}

export function useRefundOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: RefundOrderRequest }) =>
      refundOrder(orderId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.paymentsRoot() })
    },
  })
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string
      data: UpdateOrderStatusRequest
      businessId: string
    }) => updateOrderStatus(orderId, data),
    onMutate: async ({ orderId, data, businessId }) => {
      await queryClient.cancelQueries({ queryKey: platformQueryKeys.kitchenOrders(businessId) })
      const previousKitchenOrders = queryClient.getQueryData<Order[]>(
        platformQueryKeys.kitchenOrders(businessId),
      )
      queryClient.setQueryData<Order[]>(platformQueryKeys.kitchenOrders(businessId), (current) =>
        current?.map((order) => (order.id === orderId ? { ...order, status: data.status } : order)),
      )
      return { previousKitchenOrders }
    },
    onError: (_error, variables, context) => {
      if (context?.previousKitchenOrders) {
        queryClient.setQueryData(
          platformQueryKeys.kitchenOrders(variables.businessId),
          context.previousKitchenOrders,
        )
      }
    },
    onSettled: (_data, _error, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() }),
        queryClient.invalidateQueries({
          queryKey: platformQueryKeys.kitchenOrders(variables.businessId),
        }),
      ]),
  })
}

// Cash/POS submission (processStaffPayment on the backend) can transition the order straight
// to CLOSED and auto-close its session in the same request — paymentsRoot/ordersRoot alone
// left a closed session looking active in the cache (this is why the card used to need a
// second interaction to show "paid": the mutation resolved, but the queries whose data
// actually determines the derived status hadn't refetched yet).
export function useProcessCashPaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: ProcessPaymentRequest }) =>
      processCashPayment(orderId, data),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.paymentsRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.activeSessionsRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() }),
      ]),
  })
}

export function useProcessPosPaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: ProcessPaymentRequest }) =>
      processPosPayment(orderId, data),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.paymentsRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.activeSessionsRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() }),
      ]),
  })
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => createPayment(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.paymentsRoot() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() })
    },
  })
}

// Confirming the cashier's pending payment transitions DELIVERED → CLOSED and auto-closes the
// session (TableSessionsService.refreshLifecycle) in the same request — see the comment on
// useProcessCashPaymentMutation above for why activeSessionsRoot/tablesRoot must be invalidated
// here directly rather than relying solely on the session-closed socket echo to arrive later.
export function useConfirmPaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: ConfirmPaymentRequest }) =>
      confirmPayment(paymentId, data),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.paymentsRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.ordersRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.activeSessionsRoot() }),
        queryClient.invalidateQueries({ queryKey: platformQueryKeys.tablesRoot() }),
      ]),
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
        queryKey: platformQueryKeys.staffRoot(variables.businessId),
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
        queryKey: platformQueryKeys.staffRoot(variables.businessId),
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
        queryKey: platformQueryKeys.staffRoot(variables.businessId),
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (businessId: string) => logoutStaff(businessId),
    onSuccess: async () => {
      await queryClient.cancelQueries()
      queryClient.clear()
    },
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
        queryKey: platformQueryKeys.staffRoot(variables.businessId),
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
        queryKey: platformQueryKeys.staffRoot(variables.businessId),
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
        queryKey: platformQueryKeys.staffRoot(variables.businessId),
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
        queryKey: platformQueryKeys.staffRoot(variables.businessId),
      })
    },
  })
}
