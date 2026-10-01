"use client"

import { FormEvent, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Textarea } from "@/components/ui/textarea"

import { apiRequest } from "@/lib/api"
import { getStoredUser, getToken } from "@/lib/auth"
import type { TicketType } from "@/types/ticket-type"

export default function TicketTypesPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [ticketTypes, setTicketTypes] =
    useState<TicketType[]>([])

  const [name, setName] = useState("")
  const [description, setDescription] =
    useState("")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] =
    useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] =
    useState(true)
  const [saving, setSaving] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState<string | null>(null)

  async function refreshTicketTypes() {
    const result =
      await apiRequest<TicketType[]>(
        `/events/${params.id}/ticket-types`,
      )

    setTicketTypes(result)
  }

  useEffect(() => {
    const token = getToken()
    const user = getStoredUser()

    if (!token || !user) {
      router.replace("/login")
      return
    }

    if (
      user.role !== "ORGANIZER" &&
      user.role !== "SUPER_ADMIN"
    ) {
      router.replace("/dashboard")
      return
    }

    apiRequest<TicketType[]>(
      `/events/${params.id}/ticket-types`,
    )
      .then((result) => {
        setTicketTypes(result)
        setError("")
      })
      .catch((error) => {
        console.error(
          "Failed to load ticket types:",
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os tipos de bilhete",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [params.id, router])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const token = getToken()

    if (!token) {
      router.replace("/login")
      return
    }

    const numericPrice = Number(price)
    const numericQuantity = Number(quantity)

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setError(
        "O preço deve ser um número válido maior ou igual a zero.",
      )
      return
    }

    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 1
    ) {
      setError(
        "A quantidade deve ser um número inteiro maior que zero.",
      )
      return
    }

    setSaving(true)
    setError("")

    try {
      await apiRequest<TicketType>(
        `/events/${params.id}/ticket-types`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            name: name.trim(),
            description:
              description.trim() || undefined,
            price: numericPrice,
            quantity: numericQuantity,
          }),
        },
      )

      setName("")
      setDescription("")
      setPrice("")
      setQuantity("")

      await refreshTicketTypes()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o tipo de bilhete",
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeTicketType(
    id: string,
  ) {
    const token = getToken()

    if (!token) {
      router.replace("/login")
      return
    }

    const confirmed = window.confirm(
      "Tens a certeza que queres eliminar este tipo de bilhete?",
    )

    if (!confirmed) {
      return
    }

    setDeletingId(id)
    setError("")

    try {
      await apiRequest<{ message: string }>(
        `/ticket-types/${id}`,
        {
          method: "DELETE",
          token,
        },
      )

      await refreshTicketTypes()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível eliminar o tipo de bilhete",
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 size-4" />
          Voltar
        </Button>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle>
                Novo tipo de bilhete
              </CardTitle>

              <CardDescription>
                Define o nome, preço e quantidade disponível.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nome
                  </Label>

                  <Input
                    id="name"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="VIP"
                    minLength={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Descrição
                  </Label>

                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    placeholder="Acesso VIP..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Preço (MZN)
                    </Label>

                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) =>
                        setPrice(
                          event.target.value,
                        )
                      }
                      placeholder="5000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">
                      Quantidade
                    </Label>

                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(
                          event.target.value,
                        )
                      }
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 size-4" />
                  )}

                  Adicionar tipo
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Tipos disponíveis
              </CardTitle>

              <CardDescription>
                Tipos de bilhete configurados para este evento.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">
                  A carregar...
                </p>
              ) : ticketTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ainda não existem tipos de bilhete.
                </p>
              ) : (
                <div className="space-y-4">
                  {ticketTypes.map(
                    (ticketType) => (
                      <div
                        key={ticketType.id}
                        className="flex items-center justify-between gap-4 rounded-lg border p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">
                            {ticketType.name}
                          </p>

                          {ticketType.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {
                                ticketType.description
                              }
                            </p>
                          )}

                          <p className="mt-2 text-sm text-muted-foreground">
                            {Number(
                              ticketType.price,
                            ).toLocaleString(
                              "pt-MZ",
                            )}{" "}
                            MZN
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {
                              ticketType.quantity
                            }{" "}
                            disponíveis
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={
                            deletingId ===
                            ticketType.id
                          }
                          onClick={() =>
                            removeTicketType(
                              ticketType.id,
                            )
                          }
                          aria-label={`Eliminar ${ticketType.name}`}
                        >
                          {deletingId ===
                          ticketType.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
