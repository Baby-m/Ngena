"use client"

import {
  useEffect,
  useState,
} from "react"
import Link from "next/link"
import {
  CalendarDays,
  MapPin,
  Ticket as TicketIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { apiRequest } from "@/lib/api"
import { getToken } from "@/lib/auth"
import type { Ticket } from "@/types/ticket"

export default function TicketsPage() {
  const router = useRouter()

  const [tickets, setTickets] =
    useState<Ticket[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    const token = getToken()

    if (!token) {
      router.replace("/login")
      return
    }

    apiRequest<Ticket[]>(
      "/tickets/mine",
      {
        token,
      },
    )
      .then((result) => {
        setTickets(result)
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os bilhetes",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Badge variant="secondary">
          Participante
        </Badge>

        <h1 className="mt-3 text-3xl font-bold">
          Meus bilhetes
        </h1>

        <p className="mt-2 text-muted-foreground">
          Consulta os bilhetes associados à tua conta.
        </p>

        {loading ? (
          <p className="mt-10">
            A carregar...
          </p>
        ) : error ? (
          <p className="mt-10 text-destructive">
            {error}
          </p>
        ) : tickets.length === 0 ? (
          <Card className="mt-10">
            <CardContent className="py-12 text-center">
              <TicketIcon className="mx-auto size-10 text-muted-foreground" />

              <p className="mt-4 font-medium">
                Ainda não tens bilhetes.
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Explora os eventos disponíveis.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {tickets.map((ticket) => (
              <Link
                href={`/tickets/${ticket.id}`}
                key={ticket.id}
              >
                <Card className="h-full transition hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle>
                        {
                          ticket.ticketType
                            .event.name
                        }
                      </CardTitle>

                      <Badge variant="outline">
                        {ticket.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {ticket.ticketType.name}
                    </p>

                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4" />

                      {new Date(
                        ticket.ticketType
                          .event.startsAt,
                      ).toLocaleString(
                        "pt-MZ",
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="size-4" />

                      {
                        ticket.ticketType
                          .event.location
                      }
                    </div>

                    <p className="font-mono text-xs">
                      {ticket.code}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
