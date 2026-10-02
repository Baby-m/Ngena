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
  getStoredUser,
  getToken,
} from "@/lib/auth"

export default function DashboardPage() {
  const router =
    useRouter()

  useEffect(() => {
    const token =
      getToken()

    const user =
      getStoredUser()

    if (
      !token ||
      !user
    ) {
      router.replace(
        "/login",
      )

      return
    }

    switch (
      user.role
    ) {
      case "SUPER_ADMIN":
        router.replace(
          "/admin",
        )
        break

      case "ORGANIZER":
        router.replace(
          "/organizer",
        )
        break

      case "GATE_MANAGER":
      case "GATE_STAFF":
        router.replace(
          "/gate",
        )
        break

      case "CUSTOMER":
        router.replace(
          "/customer",
        )
        break

      default:
        router.replace(
          "/login",
        )
    }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />

        A preparar a tua área...
      </div>
    </main>
  )
}
