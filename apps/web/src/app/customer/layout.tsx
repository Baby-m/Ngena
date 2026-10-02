import type {
  ReactNode,
} from "react"

import {
  ProfileShell,
} from "@/components/profile-shell/profile-shell"

const allowedRoles = [
  "CUSTOMER",
]

const navigation = [
  {
    label: "Dashboard",
    href: "/customer",
    icon: "dashboard" as const,
  },
  {
    label: "Eventos",
    href: "/customer/events",
    icon: "events" as const,
  },
  {
    label: "Bilhetes",
    href: "/customer/tickets",
    icon: "tickets" as const,
  },
]

type Props = {
  children: ReactNode
}

export default function CustomerLayout({
  children,
}: Props) {
  return (
    <ProfileShell
      profileLabel="Participante"
      allowedRoles={
        allowedRoles
      }
      navigation={
        navigation
      }
    >
      {children}
    </ProfileShell>
  )
}
