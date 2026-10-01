"use client"

import {
  useState,
} from "react"
import {
  Loader2,
  Ticket,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { apiRequest } from "@/lib/api"
import { getToken } from "@/lib/auth"

import type { TicketType } from "@/types/ticket-type"

type Props = {
  ticketTypes: TicketType[]
}

type CreateOrderResponse = {
  order: {
    id: string
  }

  ticket: {
    id: string
    code: string
  }
}

export function EventTicketTypes({
  ticketTypes,
}: Props) {
  const router = useRouter()

  const [loadingId, setLoadingId] =
    useState<string | null>(null)

  const [error, setError] =
    useState("")

  async function buyTicket(
    ticketTypeId: string,
  ) {
    const token = getToken()

    if (!token) {
      router.push("/login")
      return
    }

    setLoadingId(ticketTypeId)
    setError("")

    try {
      const result =
        await apiRequest<CreateOrderResponse>(
          "/orders",
          {
            method: "POST",
            token,
            body: JSON.stringify({
              ticketTypeId,
            }),
          },
        )

      router.push(
        `/tickets/${result.ticket.id}`,
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível obter o bilhete",
      )
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <Ticket className="size-5" />

        <h2 className="text-2xl font-bold">
          Bilhetes
        </h2>
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {ticketTypes.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          Ainda não existem bilhetes disponíveis.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ticketTypes.map(
            (ticketType) => (
              <Card key={ticketType.id}>
                <CardHeader>
                  <CardTitle>
                    {ticketType.name}
                  </CardTitle>

                  <CardDescription>
                    {ticketType.description ||
                      "Bilhete para este evento"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <p className="text-2xl font-bold">
                    {Number(
                      ticketType.price,
                    ).toLocaleString(
                      "pt-MZ",
                    )}{" "}
                    MZN
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {ticketType.quantity} disponíveis
                  </p>

                  <Button
                    className="mt-5 w-full"
                    disabled={
                      ticketType.quantity <= 0 ||
                      loadingId ===
                        ticketType.id
                    }
                    onClick={() =>
                      buyTicket(
                        ticketType.id,
                      )
                    }
                  >
                    {loadingId ===
                    ticketType.id ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Ticket className="mr-2 size-4" />
                    )}

                    {ticketType.quantity <= 0
                      ? "Esgotado"
                      : "Obter bilhete"}
                  </Button>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </section>
  )
}
