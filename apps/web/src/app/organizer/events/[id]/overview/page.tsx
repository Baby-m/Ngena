"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useParams,
  useRouter,
} from "next/navigation"

import Link from "next/link"

import {
  ArrowLeft,
  CalendarDays,
  DoorOpen,
  Loader2,
  MapPin,
  Ticket,
  Users,
  Wallet,
} from "lucide-react"

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import {
  createRealtimeSocket,
} from "@/lib/realtime"

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

type EventDashboardResponse = {
  event: {
    id: string
    name: string
    status: string
    location: string
    startsAt: string
    endsAt: string | null
  }

  ticketTypes: {
    id: string
    name: string
    price: number
    issued: number
    used: number
    available: number
    revenue: number
  }[]

  gates: {
    id: string
    name: string
    checkIns: number

    staff: {
      id: string
      name: string
      email: string
      role: string
    }[]
  }[]
}

export default function OrganizerEventDashboardPage() {
  const params =
    useParams<{ id: string }>()

  const router = useRouter()

  const [
    dashboard,
    setDashboard,
  ] = useState<EventDashboardResponse | null>(
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

    let active = true

    const loadDashboard =
      async (
        showLoading = false,
      ) => {
        if (showLoading) {
          setLoading(true)
        }

        try {
          const result =
            await apiRequest<EventDashboardResponse>(
              `/dashboard/events/${params.id}`,
              {
                token,
              },
            )

          if (!active) {
            return
          }

          setDashboard(result)
          setError("")
        } catch (error) {
          console.error(
            "Failed to load event dashboard:",
            error,
          )

          if (!active) {
            return
          }

          setError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os dados do evento",
          )
        } finally {
          if (
            active &&
            showLoading
          ) {
            setLoading(false)
          }
        }
      }

    void loadDashboard(true)

    const socket =
      createRealtimeSocket(
        token,
      )

    socket.on(
      "connect",
      () => {
        socket.emit(
          "event.join",
          {
            eventId:
              params.id,
          },
        )
      },
    )

    socket.on(
      "event.joined",
      (payload: {
        eventId: string
      }) => {
        if (
          payload.eventId !==
          params.id
        ) {
          return
        }

        console.info(
          "Realtime event joined:",
          payload.eventId,
        )
      },
    )

    socket.on(
      "checkin.created",
      (payload: {
        eventId: string
        gateId: string
        checkInId: string
        createdAt: string
      }) => {
        if (
          payload.eventId !==
          params.id
        ) {
          return
        }

        void loadDashboard()
      },
    )

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Realtime connection failed:",
          error.message,
        )
      },
    )

    return () => {
      active = false

      socket.disconnect()
    }
  }, [
    params.id,
    router,
  ])

  const totals =
    useMemo(() => {
      if (!dashboard) {
        return {
          issued: 0,
          used: 0,
          available: 0,
          revenue: 0,
          checkIns: 0,
          staff: 0,
        }
      }

      const issued =
        dashboard.ticketTypes.reduce(
          (total, item) =>
            total + item.issued,
          0,
        )

      const used =
        dashboard.ticketTypes.reduce(
          (total, item) =>
            total + item.used,
          0,
        )

      const available =
        dashboard.ticketTypes.reduce(
          (total, item) =>
            total + item.available,
          0,
        )

      const revenue =
        dashboard.ticketTypes.reduce(
          (total, item) =>
            total + item.revenue,
          0,
        )

      const checkIns =
        dashboard.gates.reduce(
          (total, gate) =>
            total + gate.checkIns,
          0,
        )

      const uniqueStaff =
        new Set(
          dashboard.gates.flatMap(
            (gate) =>
              gate.staff.map(
                (member) =>
                  member.id,
              ),
          ),
        )

      return {
        issued,
        used,
        available,
        revenue,
        checkIns,
        staff: uniqueStaff.size,
      }
    }, [dashboard])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          A carregar dados do evento...
        </div>
      </main>
    )
  }

  if (!dashboard) {
    return (
      <main className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Button
            variant="ghost"
            onClick={() =>
              router.back()
            }
          >
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Button>

          <Alert
            variant="destructive"
            className="mt-8"
          >
            <AlertDescription>
              {error ||
                "Não foi possível carregar o evento."}
            </AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  const event =
    dashboard.event

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(
                 "/organizer",
              )
            }
          >
            <ArrowLeft className="mr-2 size-4" />
            Dashboard
          </Button>

          <Button
            variant="outline"
            render={
              <Link
                href={`/organizer/events/${event.id}/edit`}
              />
            }
          >
            Editar evento
          </Button>

          <Button
            variant="outline"
            render={
              <Link
                href={`/organizer/events/${event.id}/ticket-types`}
              />
            }
          >
            Gerir bilhetes
          </Button>

          <Button
            variant="outline"
            render={
              <Link
                href={`/organizer/events/${event.id}/gates`}
              />
            }
          >
            Gerir gates
          </Button>
        </div>

        <section className="mt-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge variant="secondary">
                Evento
              </Badge>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                {event.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4" />

                  {new Date(
                    event.startsAt,
                  ).toLocaleString(
                    "pt-MZ",
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />

                  {event.location}
                </div>
              </div>
            </div>

            <Badge variant="outline">
              {event.status}
            </Badge>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Emitidos
              </CardDescription>

              <CardTitle className="flex items-center justify-between text-3xl">
                {totals.issued}

                <Ticket className="size-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Usados
              </CardDescription>

              <CardTitle className="flex items-center justify-between text-3xl">
                {totals.used}

                <DoorOpen className="size-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Disponíveis
              </CardDescription>

              <CardTitle className="text-3xl">
                {totals.available}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Check-ins
              </CardDescription>

              <CardTitle className="text-3xl">
                {totals.checkIns}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Staff
              </CardDescription>

              <CardTitle className="flex items-center justify-between text-3xl">
                {totals.staff}

                <Users className="size-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>
                Receita
              </CardDescription>

              <CardTitle className="flex items-center justify-between text-xl">
                {totals.revenue.toLocaleString(
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

        <section className="mt-12">
          <div>
            <h2 className="text-xl font-semibold">
              Tipos de bilhete
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Desempenho de cada categoria de bilhete.
            </p>
          </div>

          {dashboard.ticketTypes.length ===
          0 ? (
            <Card className="mt-6">
              <CardContent className="py-10 text-center text-muted-foreground">
                Ainda não existem tipos de bilhete neste evento.
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {dashboard.ticketTypes.map(
                (ticketType) => (
                  <Card
                    key={
                      ticketType.id
                    }
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle>
                            {
                              ticketType.name
                            }
                          </CardTitle>

                          <CardDescription className="mt-1">
                            {ticketType.price.toLocaleString(
                              "pt-MZ",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </CardDescription>
                        </div>

                        <Ticket className="size-5 text-muted-foreground" />
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Emitidos
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {
                              ticketType.issued
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Usados
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {
                              ticketType.used
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Disponíveis
                          </p>

                          <p className="mt-1 text-lg font-semibold">
                            {
                              ticketType.available
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Receita
                          </p>

                          <p className="mt-1 font-semibold">
                            {ticketType.revenue.toLocaleString(
                              "pt-MZ",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div>
            <h2 className="text-xl font-semibold">
              Gates
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Entradas e equipa atribuída por gate.
            </p>
          </div>

          {dashboard.gates.length ===
          0 ? (
            <Card className="mt-6">
              <CardContent className="py-10 text-center text-muted-foreground">
                Ainda não existem gates neste evento.
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {dashboard.gates.map(
                (gate) => (
                  <Card key={gate.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <DoorOpen className="size-5" />

                            {gate.name}
                          </CardTitle>

                          <CardDescription className="mt-2">
                            {
                              gate.checkIns
                            }{" "}
                            check-in(s)
                          </CardDescription>
                        </div>

                        <Badge variant="outline">
                          {
                            gate.staff
                              .length
                          }{" "}
                          staff
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {gate.staff
                        .length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum membro da equipa atribuído.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {gate.staff.map(
                            (member) => (
                              <div
                                key={
                                  member.id
                                }
                                className="flex items-center justify-between gap-4 rounded-lg border p-3"
                              >
                                <div>
                                  <p className="font-medium">
                                    {
                                      member.name
                                    }
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    {
                                      member.email
                                    }
                                  </p>
                                </div>

                                <Badge variant="secondary">
                                  {
                                    member.role
                                  }
                                </Badge>
                              </div>
                            ),
                          )}
                        </div>
                      )}
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
