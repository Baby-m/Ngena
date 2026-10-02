import type {
  ReactNode,
} from "react"

import {
  ProfileShell,
} from "@/components/profile-shell/profile-shell"

const allowedRoles = [
  "GATE_STAFF",
  "GATE_MANAGER",
  "SUPER_ADMIN",
]

const navigation = [
  {
    label: "Dashboard",
    href: "/gate",
    icon: "dashboard" as const,
  },
  {
    label: "Check-in",
    href: "/gate/checkin",
    icon: "checkin" as const,
  },
  {
    label: "Histórico",
    href: "/gate/history",
    icon: "history" as const,
  },
]

type Props = {
  children: ReactNode
}

export default function GateLayout({
  children,
}: Props) {
  return (
    <ProfileShell
      profileLabel="FlowPass Gate"
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
