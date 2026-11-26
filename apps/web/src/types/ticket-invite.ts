import type { Ticket } from "@/types/ticket"

export type TicketInviteInfo = {
  status: "PENDING" | "CLAIMED"
  // So vem preenchido para quem comprou, enquanto o convite estiver pendente
  token: string | null
}

export type TicketWithInvite = Ticket & {
  invite?: TicketInviteInfo | null
}

export type InvitePreview = {
  status: "PENDING" | "CLAIMED"
  claimable: boolean
  ticketType: {
    name: string
  }
  event: {
    id: string
    name: string
    location: string
    startsAt: string
    endsAt: string | null
  }
}
