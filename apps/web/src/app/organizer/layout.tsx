import type {
  ReactNode,
} from "react"

import {
  ProfileShell,
} from "@/components/profile-shell/profile-shell"

const allowedRoles = [
  "ORGANIZER",
  "SUPER_ADMIN",
]

const navigation = [
  {
    label: "Dashboard",
    href: "/organizer",
    icon: "dashboard" as const,
  },
  {
    label: "Eventos",
    href: "/organizer/events",
    icon: "events" as const,
  },
]

type Props = {
  children: ReactNode
}

export default function OrganizerLayout({
  children,
}: Props) {
  return (
    <ProfileShell
      profileLabel="Organizer"
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
