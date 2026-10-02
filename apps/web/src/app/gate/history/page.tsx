"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  ArrowLeft,
  CheckCircle2,
  History,
  Loader2,
  MapPin,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  apiRequest,
} from "@/lib/api"

import {
  getStoredUser,
  getToken,
} from "@/lib/auth"

type CheckInHistoryItem = {
  id: string
  createdAt: string

  gate: {
    id: string
    name: string

    event: {
      id: string
      name: string
      location: string
    }
  } | null

  ticket: {
    id: string
    code: string
    status: string

    ticketType: {
      id: string
      name: string
    }
  }
}

export default function GateHistoryPage() {
  const router = useRouter()

  const [
    history,
    setHistory,
  ] =
    useState<
      CheckInHistoryItem[]
    >([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState("")

  useEffect(() => {
    const token = getToken()
    const user = getStoredUser()

    if (!token || !user) {
      router.replace("/login")
      return
    }

    if (
      user.role !== "GATE_STAFF" &&
      user.role !== "GATE_MANAGER" &&
      user.role !== "SUPER_ADMIN"
    ) {
      router.replace("/dashboard")
      return
    }

    apiRequest<
      CheckInHistoryItem[]
    >(
      "/checkins/mine",
      {
        token,
      },
    )
      .then((result) => {
        setHistory(result)
        setError("")
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o histórico",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          A carregar histórico...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(
              "/gate",
            )
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          Dashboard
        </Button>

        <div className="mt-8">
          <Badge variant="secondary">
            FlowPass Gate
          </Badge>

          <h1 className="mt-3 flex items-center gap-2 text-3xl font-bold">
            <History className="size-7" />
            Histórico
          </h1>

          <p className="mt-2 text-muted-foreground">
            Bilhetes que validaste anteriormente.
          </p>
        </div>

        {error && (
          <p className="mt-8 text-sm text-destructive">
            {error}
          </p>
        )}

        {history.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="py-12 text-center text-muted-foreground">
              Ainda não realizaste nenhum check-in.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-4">
            {history.map(
              (item) => (
                <Card
                  key={
                    item.id
                  }
                >
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle2 className="size-5" />

                          {item.gate
                            ?.event.name ??
                            "Evento"}
                        </CardTitle>

                        <p className="mt-2 text-sm text-muted-foreground">
                          {new Date(
                            item.createdAt,
                          ).toLocaleString(
                            "pt-MZ",
                          )}
                        </p>
                      </div>

                      <Badge>
                        Validado
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Gate
                        </p>

                        <p className="mt-1 font-medium">
                          {item.gate
                            ?.name ??
                            "Gate antigo"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tipo
                        </p>

                        <p className="mt-1 font-medium">
                          {
                            item.ticket
                              .ticketType
                              .name
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Código
                        </p>

                        <p className="mt-1 font-mono text-sm">
                          {
                            item.ticket
                              .code
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Local
                        </p>

                        <p className="mt-1 flex items-center gap-1 font-medium">
                          <MapPin className="size-3" />

                          {item.gate
                            ?.event
                            .location ??
                            "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  )
}
