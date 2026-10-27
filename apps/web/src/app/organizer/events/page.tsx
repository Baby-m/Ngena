"use client"

import {
  useEffect,
  useState,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  DoorOpen,
  Edit3,
  MapPin,
  Plus,
  Ticket,
} from "lucide-react"

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
  getStoredUser,
  getToken,
} from "@/lib/auth"

import type { Event } from "@/types/event"

export default function OrganizerEventsPage() {
  const router = useRouter()

  const [events, setEvents] =
    useState<Event[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

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

    const request =
      user.role === "SUPER_ADMIN"
        ? apiRequest<Event[]>(
            "/dashboard/admin/events",
            {
              token,
            },
          )
        : apiRequest<Event[]>(
            "/events/mine",
            {
              token,
            },
          )

    request
      .then((result) => {
        setEvents(result)
        setError("")
      })
      .catch((error) => {
        console.error(
          "Failed to load organizer events:",
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os teus eventos",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary">
              Organizer
            </Badge>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Meus eventos
            </h1>

            <p className="mt-2 text-muted-foreground">
              Gere os teus eventos, bilhetes, gates e configurações.
            </p>
          </div>

          <Button
            render={
              <Link href="/organizer/events/new" />
            }
          >
            <Plus className="mr-2 size-4" />
            Criar evento
          </Button>
        </div>

        {error && (
          <p className="mt-8 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-10 text-muted-foreground">
            A carregar...
          </p>
        ) : events.length === 0 ? (
          <Card className="mt-10">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <CalendarDays className="size-10 text-muted-foreground" />

              <h2 className="mt-4 text-lg font-semibold">
                Ainda não tens eventos
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Cria o teu primeiro evento para começar.
              </p>

              <Button
                className="mt-6"
                render={
                  <Link href="/organizer/events/new" />
                }
              >
                <Plus className="mr-2 size-4" />
                Criar evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle>
                      {event.name}
                    </CardTitle>

                    <Badge variant="outline">
                      {event.status}
                    </Badge>
                  </div>

                  <CardDescription>
                    {event.description ||
                      "Sem descrição"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4" />

                      {new Date(
                        event.startsAt,
                      ).toLocaleString("pt-MZ")}
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      {event.location}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <Link
                          href={`/organizer/events/${event.id}/edit`}
                        />
                      }
                    >
                      <Edit3 className="mr-2 size-4" />
                      Editar
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <Link
                          href={`/organizer/events/${event.id}/ticket-types`}
                        />
                      }
                    >
                      <Ticket className="mr-2 size-4" />
                      Bilhetes
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      render={
                        <Link
                          href={`/organizer/events/${event.id}/gates`}
                        />
                      }
                    >
                      <DoorOpen className="mr-2 size-4" />
                      Gates
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      render={
                        <Link
                          href={`/events/${event.id}`}
                        />
                      }
                    >
                      Ver público
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
