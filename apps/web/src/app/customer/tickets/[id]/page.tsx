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
  Check,
  Copy,
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
  TicketWithInvite as Ticket,
} from "@/types/ticket-invite"

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

  const [
    copied,
    setCopied,
  ] = useState(false)

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

  async function copyInviteLink(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2500)
    } catch {
      setError(
        "Não foi possível copiar o link. Seleciona-o e copia-o à mão.",
      )
    }
  }

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

  // Link do convite: só existe para quem comprou, enquanto estiver pendente
  const inviteLink = ticket.invite?.token
    ? `${window.location.origin}/invite/${ticket.invite.token}`
    : null

  const whatsappHref = inviteLink
    ? `https://wa.me/?text=${encodeURIComponent(
        `Tenho um bilhete para ${event.name} para ti! Aceita-o aqui: ${inviteLink}`,
      )}`
    : null

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

            {inviteLink && whatsappHref && (
              <div className="mt-6 space-y-3 rounded-xl border border-dashed p-5">
                <Badge variant="outline">
                  Convite pendente
                </Badge>

                <p className="text-sm text-muted-foreground">
                  Este bilhete é para quem vai contigo. Envia-lhe o
                  link: a pessoa cria conta (ou entra) e aceita, e o
                  bilhete passa para a conta dela. Até lá, o bilhete
                  continua teu.
                </p>

                <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
                  {inviteLink}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      copyInviteLink(inviteLink)
                    }
                  >
                    {copied ? (
                      <Check className="mr-2 size-4" />
                    ) : (
                      <Copy className="mr-2 size-4" />
                    )}

                    {copied
                      ? "Link copiado"
                      : "Copiar link"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    render={
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    Partilhar no WhatsApp
                  </Button>
                </div>
              </div>
            )}

            {ticket.invite?.status ===
              "CLAIMED" && (
              <p className="mt-5 text-center text-xs text-muted-foreground">
                Bilhete recebido por convite.
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
