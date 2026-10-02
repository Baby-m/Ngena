"use client"

import {
  useEffect,
  useState,
} from "react"

import Link from "next/link"

import {
  useRouter,
} from "next/navigation"

import {
  CalendarDays,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  apiRequest,
} from "@/lib/api"

import {
  getStoredUser,
  getToken,
} from "@/lib/auth"

type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export default function AdminDashboardPage() {
  const router =
    useRouter()

  const [
    users,
    setUsers,
  ] = useState<AdminUser[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")

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

    if (
      user.role !==
      "SUPER_ADMIN"
    ) {
      router.replace(
        "/dashboard",
      )

      return
    }

    apiRequest<AdminUser[]>(
      "/users",
      {
        token,
      },
    )
      .then((result) => {
        setUsers(result)
        setError("")
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o dashboard",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          A carregar dashboard...
        </div>
      </main>
    )
  }

  const organizers =
    users.filter(
      (user) =>
        user.role ===
        "ORGANIZER",
    ).length

  const gateStaff =
    users.filter(
      (user) =>
        user.role ===
          "GATE_STAFF" ||
        user.role ===
          "GATE_MANAGER",
    ).length

  const customers =
    users.filter(
      (user) =>
        user.role ===
        "CUSTOMER",
    ).length

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary">
              Super Admin
            </Badge>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Administração
            </h1>

            <p className="mt-2 text-muted-foreground">
              Visão global da plataforma e gestão administrativa.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={
                <Link href="/admin/events" />
              }
            >
              <CalendarDays className="mr-2 size-4" />
              Eventos
            </Button>

            <Button
              render={
                <Link href="/admin/users" />
              }
            >
              <Users className="mr-2 size-4" />
              Utilizadores
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-8 text-sm text-destructive">
            {error}
          </p>
        )}

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>
                Utilizadores
              </CardDescription>

              <CardTitle className="flex items-center justify-between text-4xl">
                {users.length}

                <Users className="size-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>
                Organizers
              </CardDescription>

              <CardTitle className="text-4xl">
                {organizers}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>
                Equipa Gate
              </CardDescription>

              <CardTitle className="text-4xl">
                {gateStaff}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>
                Customers
              </CardDescription>

              <CardTitle className="text-4xl">
                {customers}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Utilizadores
              </CardTitle>

              <CardDescription>
                Consulta contas e altera os perfis de acesso.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button
                variant="outline"
                render={
                  <Link href="/admin/users" />
                }
              >
                Gerir utilizadores
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5" />
                Eventos
              </CardTitle>

              <CardDescription>
                Consulta todos os eventos e respetivas métricas.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button
                variant="outline"
                render={
                  <Link href="/admin/events" />
                }
              >
                Ver eventos
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" />
                Administração FlowPass
              </CardTitle>

              <CardDescription>
                Esta área é exclusiva de utilizadores SUPER_ADMIN.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </div>
    </main>
  )
}
