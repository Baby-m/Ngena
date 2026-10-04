import type {
  UserRole,
} from "./auth"

export interface GateStaffUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface GateStaffAssignment {
  id: string
  gateId: string
  userId: string

  user: GateStaffUser

  createdAt?: string
}

export interface Gate {
  id: string
  name: string
  eventId: string

  staff: GateStaffAssignment[]

  createdAt: string
  updatedAt: string
}

export interface MyGateAssignment {
  id: string
  gateId: string
  userId: string

  gate: {
    id: string
    name: string

    event: {
      id: string
      name: string
      location: string
    }
  }

  createdAt?: string
}
