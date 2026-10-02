"use client"

import Link from "next/link"

import {
  usePathname,
  useRouter,
} from "next/navigation"

import {
  CalendarDays,
  History,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Ticket,
  UserCircle2,
  Users,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  clearAuth,
} from "@/lib/auth"

import {
  useAuthSession,
} from "@/hooks/use-auth-session"

import type {
  ProfileNavigationIcon,
  ProfileNavigationItem,
} from "./profile-sidebar"

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

export function ProfileHeader({
  profileLabel,
  navigation,
}: Props) {
  const router =
    useRouter()

  const pathname =
    usePathname()

  const {
    user,
  } = useAuthSession()

  function handleLogout() {
    clearAuth()

    window.dispatchEvent(
      new Event(
        "ngena-auth-change",
      ),
    )

    router.replace(
      "/login",
    )

    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div>
          <Link
            href="/"
            className="font-bold lg:hidden"
          >
            FlowPass
          </Link>

          <p className="hidden text-sm font-medium lg:block">
            {profileLabel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {user.name}
              </p>

              <p className="text-xs text-muted-foreground">
                {user.role}
              </p>
            </div>
          )}

          <UserCircle2 className="size-6 text-muted-foreground" />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={
              handleLogout
            }
          >
            <LogOut className="mr-2 size-4" />

            Sair
          </Button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 lg:hidden">
        {navigation.map(
          (item) => {
            const active =
              item.href === pathname ||
              (
                item.href !==
                  pathname
                &&
                item.href.split("/")
                  .filter(Boolean)
                  .length > 1
                &&
                pathname.startsWith(
                  `${item.href}/`,
                )
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
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",

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
    </header>
  )
}
