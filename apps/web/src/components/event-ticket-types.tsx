"use client"

import {
  useRouter,
} from "next/navigation"

import {
  useState,
} from "react"

import {
  Loader2,
  Ticket,
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  apiRequest,
} from "@/lib/api"

import {
  getToken,
} from "@/lib/auth"

import type {
  Order,
} from "@/types/order"

import type {
  TicketType,
} from "@/types/ticket-type"

type Props = {
  ticketTypes: TicketType[]
}

export function EventTicketTypes({
  ticketTypes,
}: Props) {
  const router = useRouter()

  const [
    buyingTicketTypeId,
    setBuyingTicketTypeId,
  ] = useState<string | null>(
    null,
  )

  const [
    error,
    setError,
  ] = useState("")

  async function getTicket(
    ticketTypeId: string,
  ) {
    const token = getToken()

    if (!token) {
      router.push("/login")
      return
    }

    setBuyingTicketTypeId(
      ticketTypeId,
    )

    setError("")

    try {
      const order =
        await apiRequest<Order>(
          "/orders",
          {
            method: "POST",
            token,

            body: JSON.stringify({
              ticketTypeId,
            }),
          },
        )

      const ticket =
        order.tickets?.[0]

      if (!ticket) {
        throw new Error(
          "O bilhete não foi criado.",
        )
      }

      router.push(
        `/customer/tickets/${ticket.id}`,
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível obter o bilhete",
      )
    } finally {
      setBuyingTicketTypeId(
        null,
      )
    }
  }

  return (
    <section className="mt-10">
      <div>
        <h2 className="text-2xl font-semibold">
          Bilhetes
        </h2>

        <p className="mt-2 text-muted-foreground">
          Escolhe o tipo de bilhete para este evento.
        </p>
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

      {ticketTypes.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-muted-foreground">
            Ainda não existem bilhetes disponíveis para este evento.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ticketTypes.map(
            (ticketType) => {
              const soldOut =
                ticketType.quantity <= 0

              const buying =
                buyingTicketTypeId ===
                ticketType.id

              return (
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

                        <CardDescription className="mt-2">
                          {ticketType.description ||
                            "Bilhete para o evento"}
                        </CardDescription>
                      </div>

                      <Ticket className="size-5 text-muted-foreground" />
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xl font-bold">
                          {Number(
                            ticketType.price,
                          ).toLocaleString(
                            "pt-MZ",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            ticketType.quantity
                          }{" "}
                          disponível(is)
                        </p>
                      </div>

                      {soldOut && (
                        <Badge variant="secondary">
                          Esgotado
                        </Badge>
                      )}
                    </div>

                    <Button
                      className="mt-6 w-full"
                      disabled={
                        soldOut ||
                        buying
                      }
                      onClick={() =>
                        getTicket(
                          ticketType.id,
                        )
                      }
                    >
                      {buying ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Ticket className="mr-2 size-4" />
                      )}

                      {soldOut
                        ? "Esgotado"
                        : "Obter bilhete"}
                    </Button>
                  </CardContent>
                </Card>
              )
            },
          )}
        </div>
      )}
    </section>
  )
}
