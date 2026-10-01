"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiRequest } from "@/lib/api"
import type { Event } from "@/types/event"

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiRequest<Event[]>("/events")
      .then((result) => {
        setEvents(result)
        setError("")
      })
      .catch((error) => {
        console.error("Failed to load events:", error)

        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os eventos",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <Badge variant="secondary">
            Eventos
          </Badge>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Descobre eventos
          </h1>

          <p className="mt-3 max-w-xl text-muted-foreground">
            Explora os eventos disponíveis na plataforma.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {loading ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              A carregar eventos...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="font-medium">
              Não foi possível carregar os eventos.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              {error}
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Ainda não existem eventos.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block"
              >
                <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle>
                        {event.name}
                      </CardTitle>

                      <Badge variant="outline">
                        {event.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 shrink-0" />

                      {new Date(
                        event.startsAt,
                      ).toLocaleString("pt-MZ")}
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0" />

                      {event.location}
                    </div>

                    {event.organizer && (
                      <p>
                        Organizado por{" "}
                        <span className="font-medium text-foreground">
                          {event.organizer.name}
                        </span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
