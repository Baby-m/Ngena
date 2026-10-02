"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useParams,
  useRouter,
} from "next/navigation"

import {
  QRCodeSVG,
} from "qrcode.react"

import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  MapPin,
  Ticket as TicketIcon,
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
  getStoredUser,
  getToken,
} from "@/lib/auth"

import type {
  Ticket,
} from "@/types/ticket"

export default function CustomerTicketPage() {
  const params =
    useParams<{ id: string }>()

  const router = useRouter()

  const [
    ticket,
    setTicket,
  ] =
    useState<Ticket | null>(
      null,
    )

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

    apiRequest<Ticket>(
      `/tickets/${params.id}`,
      {
        token,
      },
    )
      .then((result) => {
        setTicket(result)
        setError("")
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
  }, [
    params.id,
    router,
  ])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          A carregar bilhete...
        </div>
      </main>
    )
  }

  if (!ticket) {
    return (
      <main className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-xl px-6 py-16">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(
                "/customer/tickets",
              )
            }
          >
            <ArrowLeft className="mr-2 size-4" />
            Meus bilhetes
          </Button>

          <Alert
            variant="destructive"
            className="mt-8"
          >
            <AlertDescription>
              {error ||
                "Bilhete não encontrado."}
            </AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  const event =
    ticket.ticketType.event

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-xl px-6 py-12">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(
              "/customer/tickets",
            )
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          Meus bilhetes
        </Button>

        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="secondary">
                  Bilhete digital
                </Badge>

                <CardTitle className="mt-4 text-2xl">
                  {event.name}
                </CardTitle>

                <CardDescription className="mt-2">
                  {
                    ticket.ticketType
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
                {ticket.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />

                {new Date(
                  event.startsAt,
                ).toLocaleString(
                  "pt-MZ",
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {event.location}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TicketIcon className="size-4" />

                {
                  ticket.ticketType
                    .name
                }
              </div>
            </div>

            <div className="mt-8 rounded-xl border bg-background p-8 text-center">
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

              <p className="mt-2 break-all font-mono text-2xl font-bold tracking-wider">
                {ticket.code}
              </p>
            </div>

            {ticket.status ===
              "VALID" && (
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Apresenta este QR Code no gate de entrada.
              </p>
            )}

            {ticket.status ===
              "USED" && (
              <Alert className="mt-6">
                <AlertDescription>
                  Este bilhete já foi utilizado para entrada.
                </AlertDescription>
              </Alert>
            )}

            {ticket.status ===
              "CANCELLED" && (
              <Alert
                variant="destructive"
                className="mt-6"
              >
                <AlertDescription>
                  Este bilhete foi cancelado e não pode ser utilizado.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
