import type { ReactNode } from 'react'

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF'

export interface User {
  id: string
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
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

export interface AuthProviderProps {
  children: ReactNode
}
