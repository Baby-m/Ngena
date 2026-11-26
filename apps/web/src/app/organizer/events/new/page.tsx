"use client"

import {
  FormEvent,
  useEffect,
  useState,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
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
import {
  getStoredUser,
  getToken,
} from "@/lib/auth"
import type { Event } from "@/types/event"

export default function CreateEventPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [description, setDescription] =
    useState("")
  const [location, setLocation] =
    useState("")
  const [startsAt, setStartsAt] =
    useState("")
  const [endsAt, setEndsAt] =
    useState("")

  const [error, setError] =
    useState("")
  const [loading, setLoading] =
    useState(false)

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
    }
  }, [router])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const token = getToken()

    if (!token) {
      router.push("/login")
      return
    }

    setError("")
    setLoading(true)

    try {
      const createdEvent =
        await apiRequest<Event>("/events", {
          method: "POST",
          token,
          body: JSON.stringify({
            name,
            description:
              description || undefined,
            location,
            startsAt: new Date(
              startsAt,
            ).toISOString(),
            endsAt: endsAt
              ? new Date(
                  endsAt,
                ).toISOString()
              : undefined,
          }),
        })

      router.push(
        `/organizer/events/${createdEvent.id}/edit`,
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o evento",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-2xl">
              Criar evento
            </CardTitle>

            <CardDescription>
              Preenche as informações principais do evento.
            </CardDescription>
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
                  Nome do evento
                </Label>

                <Input
                  id="name"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  placeholder="Festival Ngena 2026"
                  minLength={3}
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
                  placeholder="Descreve o evento..."
                  rows={5}
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
                  placeholder="Maputo"
                  required
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
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
                  <Label htmlFor="endsAt">
                    Fim
                  </Label>

                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) =>
                      setEndsAt(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.back()
                  }
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}

                  Criar evento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
