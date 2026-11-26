import type { ReactNode } from "react"
import { ProfileShell } from "@/components/profile-shell/profile-shell"

const allowedRoles = ["BAR_STAFF"]
const navigation = [{ label: "Pedidos SOS", href: "/bar", icon: "dashboard" as const }]

export default function BarLayout({ children }: { children: ReactNode }) {
  return <ProfileShell profileLabel="FlowPass Bar" allowedRoles={allowedRoles} navigation={navigation}>{children}</ProfileShell>
}
