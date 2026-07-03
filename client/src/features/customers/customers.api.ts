import { apiClient } from '../../lib/apiClient'
import type {
  Customer,
  CustomerDetail,
  CustomerListParams,
  CustomerListResponse,
  CustomerMutationInput,
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
