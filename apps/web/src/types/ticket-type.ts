export interface TicketType {
  id: string
  name: string
  description: string | null
  price: string
  quantity: number
  eventId: string
  createdAt: string
  updatedAt: string
}
