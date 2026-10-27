import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Ticket,
  User,
} from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Event } from "@/types/event"
import type { TicketType } from "@/types/ticket-type"
import { EventTicketTypes } from "@/components/event-ticket-types"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001/api"

async function getEvent(id: string): Promise<Event | null> {
  try {
    const response = await fetch(`${API_URL}/events/${id}`, {
      cache: "no-store",
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error("Failed to load event:", error)
    throw new Error("API_UNAVAILABLE")
  }
}

async function getTicketTypes(id: string): Promise<TicketType[]> {
  try {
    const response = await fetch(`${API_URL}/events/${id}/ticket-types`, {
      cache: "no-store",
    })

    if (!response.ok) {
      return []
    }

    return response.json()
  } catch (error) {
    console.error("Failed to load ticket types:", error)
    return []
  }
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EventDetailsPage({ params }: PageProps) {
  const { id } = await params

  let event: Event | null

  try {
    event = await getEvent(id)
  } catch {
    return (
      <main className="min-h-screen bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Button variant="ghost" render={<Link href="/events" />}>
            <ArrowLeft className="mr-2 size-4" />
            Voltar aos eventos
          </Button>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Não foi possível carregar o evento</CardTitle>
              <CardDescription>
                Confirma se o backend está a correr em http://127.0.0.1:3001.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  if (
    !event ||
    (event.status !== "PUBLISHED" &&
      event.status !== "COMPLETED")
  ) {
    notFound()
  }

  const ticketTypes =
    event.status === "PUBLISHED"
      ? await getTicketTypes(id)
      : []

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Button variant="ghost" render={<Link href="/events" />}>
          <ArrowLeft className="mr-2 size-4" />
          Voltar aos eventos
        </Button>

        <div className="mt-8">
          <Badge variant="secondary">{event.status}</Badge>

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
            <CardTitle>Informações do evento</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="flex gap-3">
              <CalendarDays className="mt-1 size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Início</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.startsAt).toLocaleString("pt-MZ")}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <MapPin className="mt-1 size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Local</p>
                <p className="text-sm text-muted-foreground">
                  {event.location}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <User className="mt-1 size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Organizador</p>
                <p className="text-sm text-muted-foreground">
                  {event.organizer.name}
                </p>
              </div>
            </div>

            {event.endsAt && (
              <div className="flex gap-3">
                <CalendarDays className="mt-1 size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Fim</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.endsAt).toLocaleString("pt-MZ")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {event.status === "PUBLISHED" ? (
          <EventTicketTypes
            eventId={id}
            ticketTypes={ticketTypes}
          />
        ) : (
          <Card className="mt-10">
            <CardHeader>
              <CardTitle>Evento concluído</CardTitle>
              <CardDescription>
                Este evento já terminou. A compra de bilhetes não está disponível.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </main>
  )
}
