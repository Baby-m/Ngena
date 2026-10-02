"use client"

import Link from "next/link"

import {
  usePathname,
} from "next/navigation"

import {
  CalendarDays,
  History,
  LayoutDashboard,
  ScanLine,
  Ticket,
  Users,
} from "lucide-react"

export type ProfileNavigationIcon =
  | "dashboard"
  | "events"
  | "tickets"
  | "checkin"
  | "history"
  | "users"

export type ProfileNavigationItem = {
  label: string
  href: string
  icon: ProfileNavigationIcon
}

type Props = {
  profileLabel: string
  navigation: ProfileNavigationItem[]
}

function NavigationIcon({
  icon,
}: {
  icon: ProfileNavigationIcon
}) {
  switch (icon) {
    case "dashboard":
      return (
        <LayoutDashboard className="size-4" />
      )

    case "events":
      return (
        <CalendarDays className="size-4" />
      )

    case "tickets":
      return (
        <Ticket className="size-4" />
      )

    case "checkin":
      return (
        <ScanLine className="size-4" />
      )

    case "history":
      return (
        <History className="size-4" />
      )

    case "users":
      return (
        <Users className="size-4" />
      )

    default:
      return (
        <LayoutDashboard className="size-4" />
      )
  }
}

export function ProfileSidebar({
  profileLabel,
  navigation,
}: Props) {
  const pathname =
    usePathname()

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r bg-background lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b px-6 py-6">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
          >
            FlowPass
          </Link>

          <p className="mt-1 text-xs text-muted-foreground">
            {profileLabel}
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map(
            (item) => {
              /*
               * Para /admin, /gate, /customer,
               * /organizer:
               *
               * só marcamos Dashboard como ativo
               * quando estamos exatamente na raiz.
               *
               * Caso contrário /admin ficaria ativo
               * também em /admin/users.
               */
              const isRootItem =
                item.href
                  .split("/")
                  .filter(Boolean)
                  .length === 1

              const active =
                isRootItem
                  ? pathname ===
                    item.href
                  : pathname ===
                      item.href ||
                    pathname.startsWith(
                      `${item.href}/`,
                    )

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",

                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")}
                >
                  <NavigationIcon
                    icon={
                      item.icon
                    }
                  />

                  {
                    item.label
                  }
                </Link>
              )
            },
          )}
        </nav>

        <div className="border-t px-6 py-4">
          <p className="text-xs text-muted-foreground">
            FlowPass
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Gestão de eventos e acessos
          </p>
        </div>
      </div>
    </aside>
  )
}
