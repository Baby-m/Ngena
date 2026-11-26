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
  CalendarDays,
  Loader2,
  MapPin,
  Ticket,
} from "lucide-react"

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { apiRequest } from "@/lib/api"
import {
  clearAuth,
  getStoredUser,
  getToken,
} from "@/lib/auth"

import type { AuthUser } from "@/types/auth"
import type { InvitePreview } from "@/types/ticket-invite"

// Mensagens da API traduzidas para o utilizador
const CLAIM_ERRORS: Record<string, string> = {
  "You cannot claim your own invite":
    "Não podes aceitar o teu próprio convite. Envia o link a quem vai contigo.",
  "Invite already claimed": "Este convite já foi aceite.",
  "Ticket is no longer available":
    "Este bilhete já não está disponível.",
  "Invite not found": "Este convite não existe.",
}

export default function InvitePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()

  const [preview, setPreview] =
    useState<InvitePreview | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // undefined = ainda nao sabemos; null = sem sessao
  const [user, setUser] =
    useState<AuthUser | null | undefined>(undefined)

  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState("")

  const returnPath = `/invite/${params.token}`
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`
  const registerHref = `/register?next=${encodeURIComponent(returnPath)}`

  useEffect(() => {
    setUser(getStoredUser())

    apiRequest<InvitePreview>(`/invites/${params.token}`)
      .then((result) => {
        setPreview(result)
        setError("")
      })
      .catch((error) => {
        setError(
          error instanceof Error &&
            error.message === "Invite not found"
            ? "Este convite não existe ou o link está incompleto."
            : error instanceof Error
              ? error.message
              : "Não foi possível carregar o convite.",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [params.token])

  async function claim() {
    const token = getToken()

    if (!token) {
      router.push(loginHref)
      return
    }

    setClaiming(true)
    setClaimError("")

    try {
      const ticket = await apiRequest<{ id: string }>(
        `/invites/${params.token}/claim`,
        {
          method: "POST",
          token,
        },
      )

      router.push(`/customer/tickets/${ticket.id}`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ""

      if (
        message.includes("Authentication required") ||
        message.includes("Invalid or expired token")
      ) {
        clearAuth()
        router.push(loginHref)
        return
      }

      setClaimError(
        CLAIM_ERRORS[message] ||
          message ||
          "Não foi possível aceitar o bilhete.",
      )
      setClaiming(false)
    }
  }

  function switchAccount() {
    clearAuth()
    setUser(null)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          A carregar convite...
        </div>
      </main>
    )
  }

  if (!preview) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {error || "Convite não encontrado."}
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            Convite de bilhete
          </Badge>

          <CardTitle className="mt-3 text-2xl">
            {preview.event.name}
          </CardTitle>

          <CardDescription>
            Alguém partilhou contigo um bilhete{" "}
            {preview.ticketType.name}.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              {new Date(
                preview.event.startsAt,
              ).toLocaleString("pt-MZ")}
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="size-4" />
              {preview.event.location}
            </div>

            <div className="flex items-center gap-2">
              <Ticket className="size-4" />
              {preview.ticketType.name}
            </div>
          </div>

          {!preview.claimable ? (
            <Alert>
              <AlertDescription>
                {preview.status === "CLAIMED"
                  ? "Este convite já foi aceite."
                  : "Este bilhete já não está disponível."}
              </AlertDescription>
            </Alert>
          ) : user === undefined ? null : user === null ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Para ficares com o bilhete precisas de uma conta
                Ngena. Depois voltas aqui para o aceitar.
              </p>

              <Button
                className="w-full"
                onClick={() => router.push(registerHref)}
              >
                Criar conta
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push(loginHref)}
              >
                Já tenho conta, entrar
              </Button>
            </div>
          ) : user.role !== "CUSTOMER" ? (
            <div className="space-y-3">
              <Alert>
                <AlertDescription>
                  Só contas de cliente podem receber bilhetes.
                  Entra com uma conta de cliente para aceitar.
                </AlertDescription>
              </Alert>

              <Button
                className="w-full"
                variant="outline"
                onClick={switchAccount}
              >
                Mudar de conta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {claimError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {claimError}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full"
                disabled={claiming}
                onClick={claim}
              >
                {claiming && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Aceitar bilhete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
