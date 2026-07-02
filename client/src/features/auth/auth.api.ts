import { apiClient } from '../../lib/apiClient'
import type {
  CurrentUserData,
  LoginCredentials,
  LoginData,
  User,
} from './auth.types'

export const login = async (
  email: string,
  password: string,
): Promise<LoginData> =>
  apiClient.post<LoginData, LoginCredentials>('/auth/login', {
    email,
    password,
  })

export const getMe = async (): Promise<User> => {
  const result = await apiClient.get<CurrentUserData>('/auth/me')
  return result.user
}

export const logout = async (): Promise<void> => {
  await apiClient.post<Record<string, never>>('/auth/logout')
}
