import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  AddModifierRequest,
  AssignKitchenTicketRequest,
  AttachModifierGroupsRequest,
  ConfirmPaymentRequest,
  CreateCustomerSessionRequest,
  CreateMenuCategoryRequest,
  CreateModifierGroupRequest,
  CreateOrderRequest,
  CreatePaymentRequest,
  CreateProductRequest,
  CreateStaffInviteRequest,
  CreateTableRequest,
  UpdateKitchenTicketStatusRequest,
  UpdateOrderItemsRequest,
  UpdateOrderStatusRequest,
  UpdateProductRequest,
  UpdateStaffRoleRequest,
  UpdateTableRequest,
  UpsertBusinessPaymentMethodRequest,
} from '#/features/platform/api/platform.types.ts'
import { platformQueryKeys } from '#/features/platform/lib/constants/platform-query-keys.ts'
import {
  acceptStaffInvite,
  addModifierToGroup,
  assignKitchenTicket,
  attachModifierGroupsToProduct,
  confirmPayment,
  createCustomerSession,
  createMenuCategory,
  createModifierGroup,
  createOrder,
  createPayment,
  createProduct,
  createStaffInvite,
  createTable,
  deleteProduct,
  deleteTable,
  removeStaff,
  updateKitchenTicketStatus,
  updateOrderItems,
  updateOrderStatus,
  updateProduct,
  updateStaffRole,
  updateTable,
  upsertBusinessPaymentMethod,
} from '#/shared/api/platform/platform-api.ts'

export function useCreateCustomerSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCustomerSessionRequest) => createCustomerSession(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.customerSessions() })
    },
  })
}

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
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.tableById(variables.tableId) })
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

export function useCreateMenuCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMenuCategoryRequest) => createMenuCategory(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(false) })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.menuCategories(true) })
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

export function useCreateModifierGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateModifierGroupRequest) => createModifierGroup(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.modifierGroups() })
    },
  })
}

export function useAddModifierToGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: AddModifierRequest }) =>
      addModifierToGroup(groupId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.modifierGroups() })
    },
  })
}

export function useAttachModifierGroupsToProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: AttachModifierGroupsRequest }) =>
      attachModifierGroupsToProduct(productId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'products'] })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.modifierGroups() })
    },
  })
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => createOrder(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'kitchen-tickets'] })
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
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orderById(variables.orderId) })
    },
  })
}

export function useUpdateOrderItemsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: UpdateOrderItemsRequest }) =>
      updateOrderItems(orderId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'orders'] })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.orderById(variables.orderId) })
    },
  })
}

export function useAssignKitchenTicketMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: AssignKitchenTicketRequest }) =>
      assignKitchenTicket(ticketId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'kitchen-tickets'] })
    },
  })
}

export function useUpdateKitchenTicketStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: UpdateKitchenTicketStatusRequest }) =>
      updateKitchenTicketStatus(ticketId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'kitchen-tickets'] })
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

export function useCreateStaffInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStaffInviteRequest) => createStaffInvite(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.staffInvites() })
    },
  })
}

export function useAcceptStaffInviteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => acceptStaffInvite(token),
    onSuccess: (_, token) => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.staffInvites() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.inviteByToken(token) })
    },
  })
}

export function useUpdateStaffRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ staffId, data }: { staffId: string; data: UpdateStaffRoleRequest }) =>
      updateStaffRole(staffId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.staff() })
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.staffById(variables.staffId) })
    },
  })
}

export function useRemoveStaffMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (staffId: string) => removeStaff(staffId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.staff() })
    },
  })
}

export function useUpsertBusinessPaymentMethodMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpsertBusinessPaymentMethodRequest) => upsertBusinessPaymentMethod(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformQueryKeys.businessPaymentMethods() })
    },
  })
}

