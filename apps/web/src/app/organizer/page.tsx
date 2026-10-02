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
  DoorOpen,
  Loader2,
  Ticket,
  Users,
  Wallet,
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

type DashboardResponse = {
  summary: {
    totalEvents: number
    totalTickets: number
    usedTickets: number
    unusedTickets: number
    checkInsToday: number
    totalRevenue: number
  }

  events: {
    id: string
    name: string
    status: string
    startsAt: string
    location: string
    tickets: number
    usedTickets: number
    checkIns: number
    revenue: number
  }[]
}

export default function OrganizerDashboardPage() {
  const router = useRouter()

  const [
    dashboard,
    setDashboard,
  ] =
    useState<DashboardResponse | null>(
      null,
    )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    const token = getToken()
    const user = getStoredUser()

    if (!token || !user) {
      router.replace("/login")
      return
    }

    if (
      user.role !== "ORGANIZER" &&
      user.role !== "SUPER_ADMIN"
    ) {
      router.replace("/dashboard")
      return
    }

    apiRequest<DashboardResponse>(
      "/dashboard/organizer",
      {
        token,
      },
    )
      .then((result) => {
        setDashboard(result)
        setError("")
      })
      .catch((error) => {
        console.error(
          "Failed to load organizer dashboard:",
          error,
        )

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

  if (!dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">
            Não foi possível carregar o dashboard
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>
        </div>
      </main>
    )
  }

  const summary =
    dashboard.summary

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary">
              Organizer
            </Badge>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-2 text-muted-foreground">
              Acompanha eventos, bilhetes e entradas.
            </p>
          </div>

          <Button
            render={
              <Link href="/organizer/events" />
            }
          >
            <CalendarDays className="mr-2 size-4" />
            Gerir eventos
          </Button>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Eventos
              </CardDescription>

              <CardTitle className="flex items-center justify-between text-3xl">
                {
                  summary.totalEvents
                }

                <CalendarDays className="size-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Bilhetes emitidos
              </CardDescription>

              <CardTitle className="flex items-center justify-between text-3xl">
                {
                  summary.totalTickets
                }

                <Ticket className="size-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Bilhetes usados
              </CardDescription>

              <CardTitle className="flex items-center justify-between text-3xl">
                {
                  summary.usedTickets
                }

                <DoorOpen className="size-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Entradas hoje
              </CardDescription>

              <CardTitle className="flex items-center justify-between text-3xl">
                {
                  summary.checkInsToday
                }

                <Users className="size-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Receita estimada
              </CardDescription>

              <CardTitle className="flex items-center justify-between text-2xl">
                {summary.totalRevenue.toLocaleString(
                  "pt-MZ",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}

                <Wallet className="size-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-10">
          <div>
            <h2 className="text-xl font-semibold">
              Desempenho dos eventos
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Resumo de vendas e entradas por evento.
            </p>
          </div>

          {dashboard.events.length ===
          0 ? (
            <Card className="mt-6">
              <CardContent className="py-10 text-center text-muted-foreground">
                Ainda não existem eventos.
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 space-y-4">
              {dashboard.events.map(
                (event) => (
                  <Card
                    key={event.id}
                  >
                    <CardContent className="py-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold">
                              {
                                event.name
                              }
                            </h3>

                            <Badge variant="outline">
                              {
                                event.status
                              }
                            </Badge>
                          </div>

                          <p className="mt-2 text-sm text-muted-foreground">
                            {
                              event.location
                            }
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Date(
                              event.startsAt,
                            ).toLocaleString(
                              "pt-MZ",
                            )}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Bilhetes
                            </p>

                            <p className="font-semibold">
                              {
                                event.tickets
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Usados
                            </p>

                            <p className="font-semibold">
                              {
                                event.usedTickets
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Entradas
                            </p>

                            <p className="font-semibold">
                              {
                                event.checkIns
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Receita
                            </p>

                            <p className="font-semibold">
                              {event.revenue.toLocaleString(
                                "pt-MZ",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          render={
                            <Link
                              href={`/organizer/events/${event.id}/overview`}
                            />
                          }
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
