"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Ticket } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/api"
import { getStoredUser, getToken } from "@/lib/auth"
import { useAvailability } from "@/lib/use-availability"
import type { TicketType } from "@/types/ticket-type"

type Props = {
  eventId: string
  ticketTypes: TicketType[]
}

type PaymentMethod = "MPESA" | "EMOLA" | "MKESH" | "CARD"

type PaymentResponse = {
  payment: {
    status: "PAID" | "FAILED"
    failureReason: string | null
  }
  ticket: { id: string } | null
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "MPESA", label: "M-Pesa" },
  { value: "EMOLA", label: "e-Mola" },
  { value: "MKESH", label: "mKesh" },
  { value: "CARD", label: "Cartão" },
]

// A caixa "Simular falha" so aparece se NEXT_PUBLIC_PAYMENTS_MODE=simulated
const SIMULATED = process.env.NEXT_PUBLIC_PAYMENTS_MODE === "simulated"

export function EventTicketTypes({ eventId, ticketTypes }: Props) {
  const router = useRouter()

  // percentagem vendida e "esgotado", atualizados de 5 em 5 segundos
  const { byId } = useAvailability(eventId)

  const [openId, setOpenId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethod>("MPESA")
  const [phone, setPhone] = useState("")
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [error, setError] = useState("")

  // Perfil de quem esta logado. Le do localStorage, por isso so no browser.
  // undefined = ainda nao sabemos; null = sem sessao
  const [role, setRole] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    setRole(getStoredUser()?.role ?? null)
  }, [])

  async function pay(ticketTypeId: string) {
    const token = getToken()

    if (!token) {
      router.push("/login")
      return
    }

    const phoneValue = phone.trim()

    if (method !== "CARD" && !/^\+?\d{9,15}$/.test(phoneValue)) {
      setError("Indica um número de telemóvel válido (9 a 15 dígitos).")
      return
    }

    setPayingId(ticketTypeId)
    setError("")

    try {
      const result = await apiRequest<PaymentResponse>("/payments", {
        method: "POST",
        token,
        body: JSON.stringify({
          ticketTypeId,
          method,
          phone: phoneValue || undefined,
          ...(SIMULATED && simulateFailure ? { simulate: "failure" } : {}),
        }),
      })

      if (result.payment.status !== "PAID" || !result.ticket) {
        throw new Error("Pagamento recusado. Tenta outra vez.")
      }

      router.push(`/customer/tickets/${result.ticket.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : ""

      if (
        message.includes("Authentication required") ||
        message.includes("Invalid or expired token")
      ) {
        router.push("/login")
        return
      }

      setError(
        message === "This ticket type is sold out"
          ? "Este tipo de bilhete esgotou."
          : message || "Não foi possível concluir o pagamento.",
      )
    } finally {
      setPayingId(null)
    }
  }

  return (
    <section className="mt-10">
      <div>
        <h2 className="text-2xl font-semibold">Bilhetes</h2>

        <p className="mt-2 text-muted-foreground">
          Escolhe o tipo de bilhete para este evento.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
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
          {ticketTypes.map((ticketType) => {
            const area = byId[ticketType.id]

            // enquanto os dados em tempo real nao chegam, usa a quantidade da pagina
            const soldOut = area ? area.soldOut : ticketType.quantity <= 0

            const paying = payingId === ticketType.id
            const open = openId === ticketType.id && !soldOut

            // organizador, porteiro ou admin: nao podem comprar
            const notCustomer = typeof role === "string" && role !== "CUSTOMER"

            return (
              <Card key={ticketType.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{ticketType.name}</CardTitle>

                      <CardDescription className="mt-2">
                        {ticketType.description || "Bilhete para o evento"}
                      </CardDescription>
                    </div>

                    <Ticket className="size-5 text-muted-foreground" />
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xl font-bold">
                      {Number(ticketType.price).toLocaleString("pt-MZ", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      MZN
                    </p>

                    {soldOut && <Badge variant="destructive">Esgotado</Badge>}
                  </div>

                  {area && (
                    <div className="mt-4 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {soldOut ? "Esgotado" : `${area.percentSold}% vendido`}
                      </p>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={
                            "h-full rounded-full transition-all duration-500 " +
                            (soldOut ? "bg-destructive" : "bg-primary")
                          }
                          style={{ width: `${area.percentSold}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {open ? (
                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`method-${ticketType.id}`}>
                          Método de pagamento
                        </Label>

                        <select
                          id={`method-${ticketType.id}`}
                          value={method}
                          onChange={(e) =>
                            setMethod(e.target.value as PaymentMethod)
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {METHODS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {method !== "CARD" && (
                        <div className="space-y-2">
                          <Label htmlFor={`phone-${ticketType.id}`}>
                            Telemóvel
                          </Label>

                          <Input
                            id={`phone-${ticketType.id}`}
                            inputMode="tel"
                            placeholder="841234567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      )}

                      {SIMULATED && (
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={simulateFailure}
                            onChange={(e) =>
                              setSimulateFailure(e.target.checked)
                            }
                          />
                          Simular falha (só para testes)
                        </label>
                      )}

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          disabled={paying}
                          onClick={() => pay(ticketType.id)}
                        >
                          {paying && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          )}
                          Pagar
                        </Button>

                        <Button
                          variant="ghost"
                          disabled={paying}
                          onClick={() => setOpenId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : notCustomer && !soldOut ? (
                    <p className="mt-6 text-sm text-muted-foreground">
                      Só contas de cliente podem comprar bilhetes.
                    </p>
                  ) : (
                    <Button
                      className="mt-6 w-full"
                      disabled={soldOut}
                      onClick={() => {
                        if (role === null) {
                          router.push("/login")
                          return
                        }

                        setError("")
                        setOpenId(ticketType.id)
                      }}
                    >
                      <Ticket className="mr-2 size-4" />
                      {soldOut
                        ? "Esgotado"
                        : role === null
                          ? "Entrar para comprar"
                          : "Comprar"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
