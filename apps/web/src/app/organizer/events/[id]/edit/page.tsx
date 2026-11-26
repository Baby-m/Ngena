"use client"

import {
  FormEvent,
  useEffect,
  useState,
} from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { apiRequest } from "@/lib/api"
import {
  getStoredUser,
  getToken,
} from "@/lib/auth"
import type {
  Event,
  EventStatus,
} from "@/types/event"

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams<{
    id: string
  }>()

  const [name, setName] = useState("")
  const [description, setDescription] =
    useState("")
  const [location, setLocation] =
    useState("")
  const [startsAt, setStartsAt] =
    useState("")
  const [status, setStatus] =
    useState<EventStatus>("DRAFT")

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadEvent() {
      const token = getToken()
      const user = getStoredUser()

      if (!token || !user) {
        router.replace("/login")
        return
      }

      try {
        const event =
          await apiRequest<Event>(
            `/events/${params.id}/manage`,
            {
              token,
            },
          )
       if (
          user.role !== "ORGANIZER" &&
          user.role !== "SUPER_ADMIN"
        ) {
          router.replace("/dashboard")
          return
        }
        setName(event.name)
        setDescription(
          event.description ?? "",
        )
        setLocation(event.location)

        setStartsAt(
          event.startsAt.slice(0, 16),
        )

        setStatus(event.status)
      } catch {
        setError(
          "Não foi possível carregar o evento",
        )
      } finally {
        setLoading(false)
      }
    }

    void loadEvent()
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

    setSaving(true)
    setError("")

    try {
      await apiRequest<Event>(
        `/events/${params.id}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            name,
            description,
            location,
            startsAt: new Date(
              startsAt,
            ).toISOString(),
            status,
          }),
        },
      )

      router.push("/organizer/events")
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o evento",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        A carregar...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 size-4" />
          Voltar
        </Button>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Editar evento
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
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
                    setName(
                      event.target.value,
                    )
                  }
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Local
                </Label>

                <Input
                  id="location"
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startsAt">
                  Início
                </Label>

                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) =>
                    setStartsAt(
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Estado
                </Label>

                <select
                  id="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as EventStatus,
                    )
                  }
                  className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                >
                  <option value="DRAFT">
                    Rascunho
                  </option>

                  <option value="PUBLISHED">
                    Publicado
                  </option>

                  <option value="CANCELLED">
                    Cancelado
                  </option>

                  <option value="COMPLETED">
                    Concluído
                  </option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={saving}
              >
                {saving && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}

                Guardar alterações
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
