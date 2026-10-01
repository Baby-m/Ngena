export type UserRole =
  | "SUPER_ADMIN"
  | "ORGANIZER"
  | "GATE_MANAGER"
  | "GATE_STAFF"
  | "CUSTOMER"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export interface RegisterResponse {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}
