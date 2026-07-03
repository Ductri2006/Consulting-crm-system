import { apiClient } from '../../lib/apiClient'
import type {
  CaseOptionListResponse,
  CreateTaskInput,
  OverdueTaskListParams,
  Task,
  TaskDetail,
  TaskListParams,
  TaskListResponse,
  TaskStatusUpdateValues,
  UpdateTaskInput,
  UserOptionListResponse,
} from './tasks.types'

interface TaskResponse<TTask extends Task = Task> {
  task: TTask
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

const buildTaskListQuery = (params: TaskListParams): string => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  setOptionalParam(query, 'search', params.search)
  setOptionalParam(query, 'status', params.status)
  setOptionalParam(query, 'priority', params.priority)
  setOptionalParam(query, 'assignedToId', params.assignedToId)
  setOptionalParam(query, 'createdById', params.createdById)
  setOptionalParam(query, 'caseProfileId', params.caseProfileId)

  return query.toString()
}

export const listTasks = (
  params: TaskListParams,
): Promise<TaskListResponse> =>
  apiClient.get<TaskListResponse>(`/tasks?${buildTaskListQuery(params)}`)

export const listOverdueTasks = (
  params: OverdueTaskListParams,
): Promise<TaskListResponse> => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  setOptionalParam(query, 'assignedToId', params.assignedToId)

  return apiClient.get<TaskListResponse>(
    `/tasks/overdue?${query.toString()}`,
  )
}

export const getTask = async (id: string): Promise<TaskDetail> => {
  const response = await apiClient.get<TaskResponse<TaskDetail>>(
    `/tasks/${id}`,
  )
  return response.task
}

export const createTask = async (
  input: CreateTaskInput,
): Promise<Task> => {
  const response = await apiClient.post<TaskResponse, CreateTaskInput>(
    '/tasks',
    input,
  )
  return response.task
}

export const updateTask = async (
  id: string,
  input: UpdateTaskInput,
): Promise<Task> => {
  const response = await apiClient.patch<TaskResponse, UpdateTaskInput>(
    `/tasks/${id}`,
    input,
  )
  return response.task
}

export const updateTaskStatus = async (
  id: string,
  input: TaskStatusUpdateValues,
): Promise<Task> => {
  const response = await apiClient.patch<
    TaskResponse,
    TaskStatusUpdateValues
  >(`/tasks/${id}/status`, input)
  return response.task
}

export const deleteTask = async (id: string): Promise<Task> => {
  const response = await apiClient.delete<TaskResponse>(`/tasks/${id}`)
  return response.task
}

export const listTaskCases = (
  search = '',
): Promise<CaseOptionListResponse> => {
  const query = new URLSearchParams({ page: '1', limit: '100' })
  setOptionalParam(query, 'search', search)

  return apiClient.get<CaseOptionListResponse>(
    `/cases?${query.toString()}`,
  )
}

export const listTaskAssignableUsers =
  (): Promise<UserOptionListResponse> =>
    apiClient.get<UserOptionListResponse>('/users/assignable')
