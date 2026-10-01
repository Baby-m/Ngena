import type { Ticket } from "./ticket"

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"

export interface Order {
  id: string
  status: OrderStatus
  total: string
  customerId: string
  tickets: Ticket[]
  createdAt: string
  updatedAt: string
}
