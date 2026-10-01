import type { TicketType } from "./ticket-type"

export type TicketStatus =
  | "VALID"
  | "USED"
  | "CANCELLED"

export interface Ticket {
  id: string
  code: string
  status: TicketStatus

  orderId: string
  customerId: string
  ticketTypeId: string

  ticketType: TicketType & {
    event: {
      id: string
      name: string
      location: string
      startsAt: string
      endsAt: string | null
    }
  }

  createdAt: string
  updatedAt: string
}
