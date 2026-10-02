"use client"

import {
  useEffect,
  useState,
} from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  MapPin,
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

import type {
  Ticket as TicketData,
} from "@/types/ticket"

export default function CustomerTicketsPage() {
  const router = useRouter()

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
    const token = getToken()
    const user = getStoredUser()

    if (!token || !user) {
      router.replace("/login")
      return
    }

    if (user.role !== "CUSTOMER") {
      router.replace("/dashboard")
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
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          A carregar bilhetes...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(
            "/customer",
            )
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          Dashboard
        </Button>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary">
              Participante
            </Badge>

            <h1 className="mt-3 text-3xl font-bold">
              Meus bilhetes
            </h1>

            <p className="mt-2 text-muted-foreground">
              Consulta os teus bilhetes digitais e respetivos estados.
            </p>
          </div>

          <Button
            render={
              <Link href="/events" />
            }
          >
            <CalendarDays className="mr-2 size-4" />
            Encontrar eventos
          </Button>
        </div>

        {error && (
          <p className="mt-8 text-sm text-destructive">
            {error}
          </p>
        )}

        {tickets.length === 0 ? (
          <Card className="mt-10">
            <CardContent className="flex flex-col items-center py-14 text-center">
              <Ticket className="size-12 text-muted-foreground" />

              <h2 className="mt-4 text-lg font-semibold">
                Nenhum bilhete
              </h2>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Quando obtiveres um bilhete, ele aparecerá aqui.
              </p>

              <Button
                className="mt-6"
                render={
                  <Link href="/events" />
                }
              >
                Explorar eventos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map(
              (ticket) => (
                <Card key={ticket.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle>
                        {
                          ticket.ticketType
                            .event.name
                        }
                      </CardTitle>

                      <Badge
                        variant={
                          ticket.status ===
                          "VALID"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tipo
                      </p>

                      <p className="font-medium">
                        {
                          ticket.ticketType
                            .name
                        }
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" />

                      {new Date(
                        ticket.ticketType
                          .event.startsAt,
                      ).toLocaleString(
                        "pt-MZ",
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4" />

                      {
                        ticket.ticketType
                          .event.location
                      }
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Código
                      </p>

                      <p className="mt-1 font-mono text-sm">
                        {ticket.code}
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
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
      </div>
    </main>
  )
}
