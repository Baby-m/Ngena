"use client"

import {
  useEffect,
  useState,
} from "react"
import { useParams, useRouter } from "next/navigation"
import {
  CalendarDays,
  MapPin,
  Ticket as TicketIcon,
} from "lucide-react"

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
import { QRCodeSVG } from "qrcode.react"

export default function TicketPage() {
  const params = useParams<{
    id: string
  }>()

  const router = useRouter()

  const [ticket, setTicket] =
    useState<Ticket | null>(null)

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

    apiRequest<Ticket>(
      `/tickets/${params.id}`,
      {
        token,
      },
    )
      .then((result) => {
        setTicket(result)
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o bilhete",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [params.id, router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        A carregar...
      </main>
    )
  }

  if (error || !ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">
          {error ||
            "Bilhete não encontrado"}
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">
                  {
                    ticket.ticketType
                      .event.name
                  }
                </CardTitle>

                <p className="mt-2 text-sm text-muted-foreground">
                  {ticket.ticketType.name}
                </p>
              </div>

              <Badge variant="outline">
                {ticket.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-xl border bg-background p-6 text-center">
              <div className="flex justify-center">
                <QRCodeSVG
                  value={ticket.code}
                  size={220}
                  level="M"
                />
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Código do bilhete
              </p>

              <p className="mt-2 font-mono text-2xl font-bold tracking-wider">
                {ticket.code}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <CalendarDays className="mt-1 size-5 text-muted-foreground" />

                <div>
                  <p className="font-medium">
                    Data
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      ticket.ticketType
                        .event.startsAt,
                    ).toLocaleString(
                      "pt-MZ",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="mt-1 size-5 text-muted-foreground" />

                <div>
                  <p className="font-medium">
                    Local
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {
                      ticket.ticketType
                        .event.location
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
