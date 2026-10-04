"use client"

import {
  useEffect,
  useState,
} from "react"

import Link from "next/link"

import {
  CalendarDays,
  Loader2,
  Ticket,
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
  useAuthSession,
} from "@/hooks/use-auth-session"

import {
  apiRequest,
} from "@/lib/api"

import type {
  Ticket as TicketData,
} from "@/types/ticket"

export default function CustomerPage() {
  const {
    token,
    user,
  } = useAuthSession()

  const [
    tickets,
    setTickets,
  ] = useState<TicketData[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")

  useEffect(() => {
    if (!token) {
      return
    }

    apiRequest<TicketData[]>(
      "/tickets/mine",
      {
        token,
      },
    )
      .then((result) => {
        setTickets(result)
        setError("")
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os teus bilhetes",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  const validTickets =
    tickets.filter(
      (ticket) =>
        ticket.status ===
        "VALID",
    ).length

  const usedTickets =
    tickets.filter(
      (ticket) =>
        ticket.status ===
        "USED",
    ).length

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />

          A carregar dashboard...
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary">
              Participante
            </Badge>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Olá
              {user?.name
                ? `, ${user.name}`
                : ""}
            </h1>

            <p className="mt-2 text-muted-foreground">
              Encontra eventos e gere os teus bilhetes.
            </p>
          </div>

          <Button
            render={
              <Link href="/events" />
            }
          >
            <CalendarDays className="mr-2 size-4" />

            Ver eventos
          </Button>
        </div>

        {error && (
          <p className="mt-8 text-sm text-destructive">
            {error}
          </p>
        )}

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>
                Meus bilhetes
              </CardDescription>

              <CardTitle className="text-4xl">
                {
                  tickets.length
                }
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>
                Válidos
              </CardDescription>

              <CardTitle className="text-4xl">
                {
                  validTickets
                }
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>
                Utilizados
              </CardDescription>

              <CardTitle className="text-4xl">
                {
                  usedTickets
                }
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Bilhetes recentes
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Os últimos bilhetes associados à tua conta.
              </p>
            </div>

            <Button
              variant="outline"
              render={
                <Link href="/customer/tickets" />
              }
            >
              <Ticket className="mr-2 size-4" />

              Ver todos
            </Button>
          </div>

          {tickets.length ===
          0 ? (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Ticket className="size-10 text-muted-foreground" />

                <p className="mt-4 font-medium">
                  Ainda não tens bilhetes
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Explora os eventos disponíveis para obter o teu primeiro bilhete.
                </p>

                <Button
                  className="mt-6"
                  render={
                    <Link href="/events" />
                  }
                >
                  Ver eventos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {tickets
                .slice(0, 4)
                .map(
                  (
                    ticket,
                  ) => (
                    <Card
                      key={
                        ticket.id
                      }
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle>
                              {
                                ticket
                                  .ticketType
                                  .event
                                  .name
                              }
                            </CardTitle>

                            <CardDescription className="mt-2">
                              {
                                ticket
                                  .ticketType
                                  .name
                              }
                            </CardDescription>
                          </div>

                          <Badge
                            variant={
                              ticket.status ===
                              "VALID"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {
                              ticket.status
                            }
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <p className="font-mono text-sm">
                          {
                            ticket.code
                          }
                        </p>

                        <Button
                          variant="outline"
                          className="mt-5 w-full"
                          render={
                            <Link
                              href={`/customer/tickets/${ticket.id}`}
                            />
                          }
                        >
                          Ver bilhete
                        </Button>
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
