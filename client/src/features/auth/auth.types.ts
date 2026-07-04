import type { ReactNode } from 'react'

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF'

export interface UserOrganization {
  id: string
  name: string
  slug: string
}

export interface User {
  id: string
  organizationId?: string | null
  organization?: UserOrganization | null
  fullName: string
  email: string
  phone?: string | null
  role: UserRole
  avatarUrl?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ApiResponse<T> {
  success: true
  message: string
  data: T
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginData {
  accessToken: string
  user: User
}

export type LoginResponse = ApiResponse<LoginData>

export interface CurrentUserData {
  user: User
}

export interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  acceptSession: (accessToken: string, user: User) => void
  login: (email: string, password: string) => Promise<User>
  refreshCurrentUser: () => Promise<User>
  logout: () => Promise<void>
}

export interface AuthProviderProps {
  children: ReactNode
}
