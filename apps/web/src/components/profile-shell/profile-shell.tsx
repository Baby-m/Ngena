"use client"

import {
  useEffect,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  Loader2,
} from "lucide-react"

import {
  useAuthSession,
} from "@/hooks/use-auth-session"

import {
  ProfileHeader,
} from "./profile-header"

import {
  ProfileSidebar,
} from "./profile-sidebar"

import type {
  ProfileNavigationItem,
} from "./profile-sidebar"

type Props = {
  children:
    React.ReactNode

  profileLabel:
    string

  allowedRoles:
    string[]

  navigation:
    ProfileNavigationItem[]
}

export function ProfileShell({
  children,
  profileLabel,
  allowedRoles,
  navigation,
}: Props) {
  const router =
    useRouter()

  const {
    token,
    user,
  } = useAuthSession()

  const hasSession =
    Boolean(
      token &&
      user,
    )

  const authorized =
    Boolean(
      hasSession &&
      user &&
      allowedRoles.includes(
        user.role,
      ),
    )

  useEffect(() => {
    if (!user || !token) {
      router.replace(
        "/login",
      )

      return
    }

    if (
      !allowedRoles.includes(
        user.role,
      )
    ) {
      router.replace(
        "/dashboard",
      )
    }
  }, [
    allowedRoles,
    router,
    token,
    user,
  ])

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />

          A verificar acesso...
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <ProfileSidebar
          profileLabel={
            profileLabel
          }
          navigation={
            navigation
          }
        />

        <div className="min-w-0 flex-1">
          <ProfileHeader
            profileLabel={
              profileLabel
            }
            navigation={
              navigation
            }
          />

          {children}
        </div>
      </div>
    </div>
  )
}
