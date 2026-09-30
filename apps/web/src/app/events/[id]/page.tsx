import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  User,
} from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { Event } from "@/types/event"

async function getEvent(id: string): Promise<Event | null> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001/api"

  const response = await fetch(
    `${apiUrl}/events/${id}`,
    {
      cache: "no-store",
    },
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error("Failed to load event")
  }

  return response.json()
}

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EventDetailsPage({
  params,
}: PageProps) {
  const { id } = await params

  const event = await getEvent(id)

  if (!event) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Button
          variant="ghost"
          render={<Link href="/events" />}
        >
          <ArrowLeft className="mr-2 size-4" />
          Voltar aos eventos
        </Button>

        <div className="mt-8">
          <Badge variant="secondary">
            {event.status}
          </Badge>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            {event.name}
          </h1>

          {event.description && (
            <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
              {event.description}
            </p>
          )}
        </div>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>
              Informações do evento
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="flex gap-3">
              <CalendarDays className="mt-1 size-5 text-muted-foreground" />

              <div>
                <p className="font-medium">
                  Início
                </p>

                <p className="text-sm text-muted-foreground">
                  {new Date(
                    event.startsAt,
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <MapPin className="mt-1 size-5 text-muted-foreground" />

              <div>
                <p className="font-medium">
                  Local
                </p>

                <p className="text-sm text-muted-foreground">
                  {event.location}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <User className="mt-1 size-5 text-muted-foreground" />

              <div>
                <p className="font-medium">
                  Organizador
                </p>

                <p className="text-sm text-muted-foreground">
                  {event.organizer.name}
                </p>
              </div>
            </div>

            {event.endsAt && (
              <div>
                <p className="font-medium">
                  Fim
                </p>

                <p className="text-sm text-muted-foreground">
                  {new Date(
                    event.endsAt,
                  ).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
