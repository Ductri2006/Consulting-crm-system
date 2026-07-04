import { apiClient } from '../../lib/apiClient'
import type {
  Customer,
  CustomerDetail,
  CustomerListParams,
  CustomerListResponse,
  CustomerMutationInput,
  CustomerPortalAccount,
  CustomerPortalAccountData,
  CustomerPortalAccountInput,
  CustomerPortalAccountMutationData,
  CustomerPortalPasswordInput,
} from './customers.types'

interface CustomerResponse<TCustomer extends Customer = Customer> {
  customer: TCustomer
}

export function listCustomers(
  params: CustomerListParams,
): Promise<CustomerListResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  if (params.search?.trim()) {
    query.set('search', params.search.trim())
  }

  return apiClient.get<CustomerListResponse>(`/customers?${query.toString()}`)
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  const result = await apiClient.get<CustomerResponse<CustomerDetail>>(
    `/customers/${id}`,
  )
  return result.customer
}

export async function createCustomer(
  input: CustomerMutationInput,
): Promise<Customer> {
  const result = await apiClient.post<
    CustomerResponse,
    CustomerMutationInput
  >('/customers', input)
  return result.customer
}

export async function updateCustomer(
  id: string,
  input: CustomerMutationInput,
): Promise<Customer> {
  const result = await apiClient.patch<
    CustomerResponse,
    CustomerMutationInput
  >(`/customers/${id}`, input)
  return result.customer
}

export async function deleteCustomer(id: string): Promise<Customer> {
  const result = await apiClient.delete<CustomerResponse>(`/customers/${id}`)
  return result.customer
}

export async function getCustomerPortalAccount(
  id: string,
): Promise<CustomerPortalAccount | null> {
  const result = await apiClient.get<CustomerPortalAccountData>(
    `/customers/${id}/portal-account`,
  )

  return result.account
}

export function createCustomerPortalAccount(
  id: string,
  input: CustomerPortalAccountInput,
): Promise<CustomerPortalAccountMutationData> {
  return apiClient.post<
    CustomerPortalAccountMutationData,
    CustomerPortalAccountInput
  >(`/customers/${id}/portal-account`, input)
}

export function resetCustomerPortalPassword(
  id: string,
  input: CustomerPortalPasswordInput,
): Promise<CustomerPortalAccountMutationData> {
  return apiClient.patch<
    CustomerPortalAccountMutationData,
    CustomerPortalPasswordInput
  >(`/customers/${id}/portal-account/password`, input)
}

export async function deactivateCustomerPortalAccount(
  id: string,
): Promise<CustomerPortalAccount> {
  const result = await apiClient.patch<{ account: CustomerPortalAccount }>(
    `/customers/${id}/portal-account/deactivate`,
  )

  return result.account
}

export async function activateCustomerPortalAccount(
  id: string,
): Promise<CustomerPortalAccount> {
  const result = await apiClient.patch<{ account: CustomerPortalAccount }>(
    `/customers/${id}/portal-account/activate`,
  )

  return result.account
}
