export const categories = {
  OVERCROWDED: "Bar lotado",
  DRINKS_SHORTAGE: "Falta de bebidas",
  ICE_SHORTAGE: "Falta de gelo",
  SECURITY: "Segurança",
  OTHER: "Outro",
} as const
export type SosCategory = keyof typeof categories
export const statuses = {
  PENDING: "Pendente",
  FORWARDED: "Encaminhado",
  RESOLVED: "Resolvido",
  CANCELLED: "Cancelado",
} as const
export type SosStatus = keyof typeof statuses
export type BarSos = {
  id: string
  eventId: string
  category: SosCategory
  message: string | null
  status: SosStatus
  createdAt: string
}
export function isActive(sos: BarSos) {
  return sos.status === "PENDING" || sos.status === "FORWARDED"
}
