import { apiClient } from '../../lib/apiClient'
import type {
  Appointment,
  AppointmentDetail,
  AppointmentListParams,
  AppointmentListResponse,
  AppointmentStatusUpdateValues,
  CaseOptionListResponse,
  CreateAppointmentInput,
  CustomerOptionListResponse,
  TodayAppointmentListResponse,
  TodayAppointmentParams,
  UpdateAppointmentInput,
  UserOptionListResponse,
} from './appointments.types'

interface AppointmentResponse<
  TAppointment extends Appointment = Appointment,
> {
  appointment: TAppointment
}

const setOptionalParam = (
  query: URLSearchParams,
  key: string,
  value?: string,
): void => {
  const trimmed = value?.trim()

  if (trimmed) {
    query.set(key, trimmed)
  }
}

const buildAppointmentListQuery = (
  params: AppointmentListParams,
): string => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  setOptionalParam(query, 'search', params.search)
  setOptionalParam(query, 'status', params.status)
  setOptionalParam(query, 'method', params.method)
  setOptionalParam(query, 'customerId', params.customerId)
  setOptionalParam(query, 'caseProfileId', params.caseProfileId)
  setOptionalParam(query, 'staffId', params.staffId)
  setOptionalParam(query, 'date', params.date)
  setOptionalParam(query, 'fromDate', params.fromDate)
  setOptionalParam(query, 'toDate', params.toDate)

  return query.toString()
}

export const listAppointments = (
  params: AppointmentListParams,
): Promise<AppointmentListResponse> =>
  apiClient.get<AppointmentListResponse>(
    `/appointments?${buildAppointmentListQuery(params)}`,
  )

export const listTodayAppointments = (
  params: TodayAppointmentParams = {},
): Promise<TodayAppointmentListResponse> => {
  const query = new URLSearchParams()
  setOptionalParam(query, 'staffId', params.staffId)
  const queryString = query.toString()

  return apiClient.get<TodayAppointmentListResponse>(
    queryString ? `/appointments/today?${queryString}` : '/appointments/today',
  )
}

export const getAppointment = async (
  id: string,
): Promise<AppointmentDetail> => {
  const response = await apiClient.get<
    AppointmentResponse<AppointmentDetail>
  >(`/appointments/${id}`)
  return response.appointment
}

export const createAppointment = async (
  input: CreateAppointmentInput,
): Promise<Appointment> => {
  const response = await apiClient.post<
    AppointmentResponse,
    CreateAppointmentInput
  >('/appointments', input)
  return response.appointment
}

export const updateAppointment = async (
  id: string,
  input: UpdateAppointmentInput,
): Promise<Appointment> => {
  const response = await apiClient.patch<
    AppointmentResponse,
    UpdateAppointmentInput
  >(`/appointments/${id}`, input)
  return response.appointment
}

export const updateAppointmentStatus = async (
  id: string,
  input: AppointmentStatusUpdateValues,
): Promise<Appointment> => {
  const response = await apiClient.patch<
    AppointmentResponse,
    AppointmentStatusUpdateValues
  >(`/appointments/${id}/status`, input)
  return response.appointment
}

export const deleteAppointment = async (
  id: string,
): Promise<Appointment> => {
  const response = await apiClient.delete<AppointmentResponse>(
    `/appointments/${id}`,
  )
  return response.appointment
}

export const listAppointmentCustomers = (
  search = '',
): Promise<CustomerOptionListResponse> => {
  const query = new URLSearchParams({ page: '1', limit: '100' })
  setOptionalParam(query, 'search', search)

  return apiClient.get<CustomerOptionListResponse>(
    `/customers?${query.toString()}`,
  )
}

export const listAppointmentCases = (
  search = '',
): Promise<CaseOptionListResponse> => {
  const query = new URLSearchParams({ page: '1', limit: '100' })
  setOptionalParam(query, 'search', search)

  return apiClient.get<CaseOptionListResponse>(
    `/cases?${query.toString()}`,
  )
}

export const listAppointmentAssignableUsers =
  (): Promise<UserOptionListResponse> =>
    apiClient.get<UserOptionListResponse>('/users/assignable')
