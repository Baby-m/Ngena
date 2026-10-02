"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import Link from "next/link"

import {
  ArrowLeft,
  CalendarDays,
  DoorOpen,
  Loader2,
  MapPin,
  Search,
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Input,
} from "@/components/ui/input"

import {
  apiRequest,
} from "@/lib/api"

import {
  getStoredUser,
  getToken,
} from "@/lib/auth"

type AdminEvent = {
  id: string
  name: string
  description: string | null
  status: string
  location: string
  startsAt: string
  endsAt: string | null
  createdAt: string

  organizer: {
    id: string
    name: string
    email: string
  }

  stats: {
    ticketTypes: number
    gates: number
    totalTickets: number
    usedTickets: number
    totalCheckIns: number
    estimatedRevenue: number
  }
}

export default function AdminEventsPage() {
  const router =
    useRouter()

  const [
    events,
    setEvents,
  ] = useState<AdminEvent[]>([])

  const [
    search,
    setSearch,
  ] = useState("")

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

    apiRequest<AdminEvent[]>(
      "/dashboard/admin/events",
      {
        token,
      },
    )
      .then((result) => {
        setEvents(result)
        setError("")
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os eventos",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  const filteredEvents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return events
      }

      return events.filter(
        (event) =>
          event.name
            .toLowerCase()
            .includes(query) ||
          event.location
            .toLowerCase()
            .includes(query) ||
          event.status
            .toLowerCase()
            .includes(query) ||
          event.organizer.name
            .toLowerCase()
            .includes(query) ||
          event.organizer.email
            .toLowerCase()
            .includes(query),
      )
    }, [
      events,
      search,
    ])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          A carregar eventos...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(
              "/admin",
            )
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          Dashboard
        </Button>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary">
              Super Admin
            </Badge>

            <h1 className="mt-3 text-3xl font-bold">
              Eventos
            </h1>

            <p className="mt-2 text-muted-foreground">
              Visão global dos eventos registados na plataforma.
            </p>
          </div>

          <Badge variant="outline">
            {events.length} evento(s)
          </Badge>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="mt-6"
          >
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Pesquisar evento, organizer, local ou estado..."
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {filteredEvents.length ===
        0 ? (
          <Card className="mt-8">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum evento encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-5">
            {filteredEvents.map(
              (event) => (
                <Card
                  key={event.id}
                >
                  <CardHeader>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <CardTitle>
                            {event.name}
                          </CardTitle>

                          <Badge variant="outline">
                            {
                              event.status
                            }
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
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
                            {
                              event.location
                            }
                          </div>
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          Organizer
                        </p>

                        <p className="font-medium">
                          {
                            event.organizer
                              .name
                          }
                        </p>

                        <p className="text-muted-foreground">
                          {
                            event.organizer
                              .email
                          }
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tipos
                        </p>

                        <p className="mt-1 flex items-center gap-2 font-semibold">
                          <Ticket className="size-4" />
                          {
                            event.stats
                              .ticketTypes
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Bilhetes
                        </p>

                        <p className="mt-1 font-semibold">
                          {
                            event.stats
                              .totalTickets
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Usados
                        </p>

                        <p className="mt-1 font-semibold">
                          {
                            event.stats
                              .usedTickets
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Gates
                        </p>

                        <p className="mt-1 flex items-center gap-2 font-semibold">
                          <DoorOpen className="size-4" />

                          {
                            event.stats
                              .gates
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Check-ins
                        </p>

                        <p className="mt-1 flex items-center gap-2 font-semibold">
                          <Users className="size-4" />

                          {
                            event.stats
                              .totalCheckIns
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Valor emitido
                        </p>

                        <p className="mt-1 flex items-center gap-2 font-semibold">
                          <Wallet className="size-4" />

                          {event.stats.estimatedRevenue.toLocaleString(
                            "pt-MZ",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        render={
                          <Link
                            href={`/organizer/events/${event.id}/overview`}
                          />
                        }
                      >
                        Ver estatísticas
                      </Button>

                      <Button
                        variant="ghost"
                        render={
                          <Link
                            href={`/events/${event.id}`}
                          />
                        }
                      >
                        Ver página pública
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  )
}
