export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CANCELLED"
  | "COMPLETED"

export interface EventOrganizer {
  id: string
  name: string
}

export interface Event {
  id: string
  name: string
  description: string | null
  location: string
  startsAt: string
  endsAt: string | null
  status: EventStatus
  organizerId: string

  organizer: EventOrganizer

  createdAt: string
  updatedAt: string
}
