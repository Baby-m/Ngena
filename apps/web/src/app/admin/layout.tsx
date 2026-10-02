import type {
  ReactNode,
} from "react"

import {
  ProfileShell,
} from "@/components/profile-shell/profile-shell"

const allowedRoles = [
  "SUPER_ADMIN",
]

const navigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "dashboard" as const,
  },
  {
    label: "Utilizadores",
    href: "/admin/users",
    icon: "users" as const,
  },
  {
    label: "Eventos",
    href: "/admin/events",
    icon: "events" as const,
  },
]

type Props = {
  children: ReactNode
}

export default function AdminLayout({
  children,
}: Props) {
  return (
    <ProfileShell
      profileLabel="Super Admin"
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
