"use client"

import Link from "next/link"

import {
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  CalendarPlus,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { apiRequest } from "@/lib/api"
import {
  clearAuth,
  getToken,
} from "@/lib/auth"
import type { AuthUser } from "@/types/auth"

export default function DashboardPage() {
  const router = useRouter()

  const [user, setUser] =
    useState<AuthUser | null>(null)

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    async function loadUser() {
      const token = getToken()

      if (!token) {
        router.replace("/login")
        return
      }

      try {
        const currentUser =
          await apiRequest<AuthUser>("/auth/me", {
            token,
          })

        setUser(currentUser)
      } catch {
        clearAuth()
        router.replace("/login")
      } finally {
        setLoading(false)
      }
    }

    void loadUser()
  }, [router])

  function logout() {
    clearAuth()
    router.push("/")
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          A carregar...
        </p>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <strong className="text-xl">
            Ngena
          </strong>

          <Button
            variant="ghost"
            onClick={logout}
          >
            <LogOut className="mr-2 size-4" />
            Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <Badge className="mb-4">
          Dashboard
        </Badge>

        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {user.name}
        </h1>

        <p className="mt-2 text-muted-foreground">
          A tua sessão está autenticada através da API Ngena.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Conta
              </CardTitle>

              <CardDescription>
                Informação devolvida por GET /auth/me
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Nome
                </p>

                <p className="font-medium">
                  {user.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Email
                </p>

                <p className="font-medium">
                  {user.email}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" />
                Permissão
              </CardTitle>

              <CardDescription>
                Role atual da conta
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Badge variant="secondary">
                {user.role}
              </Badge>
            </CardContent>
          </Card>

          {(
            user.role === "ORGANIZER" ||
            user.role === "SUPER_ADMIN"
            ) && (
            <Card className="mt-6">
                <CardHeader>
                <CardTitle>
                    Gestão de eventos
                </CardTitle>

                <CardDescription>
                    Cria e administra os teus eventos.
                </CardDescription>
                </CardHeader>

                <CardContent>
                <Button
                    render={
                    <Link href="/organizer/events/new" />
                    }
                >
                    <CalendarPlus className="mr-2 size-4" />
                    Criar evento
                </Button>
                </CardContent>
            </Card>
            )}
        </div>
      </div>
    </main>
  )
}
