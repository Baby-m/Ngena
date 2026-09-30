import Link from "next/link"
import {
  CalendarDays,
  MapPin,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { Event } from "@/types/event"

async function getEvents(): Promise<Event[]> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001/api"

  const response = await fetch(
    `${apiUrl}/events`,
    {
      cache: "no-store",
    },
  )

  if (!response.ok) {
    return []
  }

  return response.json()
}

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <main className="min-h-screen">
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <Badge variant="secondary">
            Eventos
          </Badge>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Descobre eventos
          </h1>

          <p className="mt-3 max-w-xl text-muted-foreground">
            Explora eventos disponíveis na plataforma.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Ainda não existem eventos.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                href={`/events/${event.id}`}
                key={event.id}
              >
                <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
                  <CardHeader>
                    <Badge
                      variant="outline"
                      className="w-fit"
                    >
                      {event.status}
                    </Badge>

                    <CardTitle>
                      {event.name}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4" />

                      {new Date(
                        event.startsAt,
                      ).toLocaleString()}
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      {event.location}
                    </div>

                    <p>
                      Organizado por{" "}
                      {event.organizer.name}
                    </p>
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
