"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import Link from "next/link"

import {
  useRouter,
} from "next/navigation"

import {
  DoorOpen,
  History,
  Loader2,
  MapPin,
  ScanLine,
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
  CardDescription,
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

import type {
  MyGateAssignment,
} from "@/types/gate"

export default function GateDashboardPage() {
  const router = useRouter()

  const [
    assignments,
    setAssignments,
  ] = useState<MyGateAssignment[]>([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")

  const user =
    useMemo(
      () => getStoredUser(),
      [],
    )

  useEffect(() => {
    const token = getToken()
    const currentUser =
      getStoredUser()

    if (
      !token ||
      !currentUser
    ) {
      router.replace("/login")
      return
    }

    if (
      currentUser.role !== "GATE_STAFF" &&
      currentUser.role !== "GATE_MANAGER" &&
      currentUser.role !== "SUPER_ADMIN"
    ) {
      router.replace("/dashboard")
      return
    }

    apiRequest<MyGateAssignment[]>(
      "/gates/mine",
      {
        token,
      },
    )
      .then((result) => {
        setAssignments(result)
        setError("")
      })
      .catch((error) => {
        console.error(
          "Failed to load gate assignments:",
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os gates atribuídos",
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
          A carregar dashboard...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary">
              FlowPass Gate
            </Badge>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-2 text-muted-foreground">
              Olá
              {user?.name
                ? `, ${user.name}`
                : ""}
              . Gere os teus pontos de acesso e validações.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              render={
                <Link href="/gate/history" />
              }
            >
              <History className="mr-2 size-4" />
              Histórico
            </Button>

            <Button
              render={
                <Link href="/gate/checkin" />
              }
            >
              <ScanLine className="mr-2 size-4" />
              Validar bilhete
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-8 text-sm text-destructive">
            {error}
          </p>
        )}

        <section className="mt-10">
          <Card>
            <CardHeader>
              <CardDescription>
                Gates atribuídos
              </CardDescription>

              <CardTitle className="text-4xl">
                {assignments.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-10">
          <div>
            <h2 className="text-xl font-semibold">
              Meus gates
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Eventos e pontos de entrada aos quais estás atribuído.
            </p>
          </div>

          {assignments.length === 0 ? (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <DoorOpen className="size-10 text-muted-foreground" />

                <p className="mt-4 font-medium">
                  Nenhum gate atribuído
                </p>

                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Um organizer precisa atribuir-te a um gate antes de poderes validar entradas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {assignments.map(
                (assignment) => (
                  <Card
                    key={
                      assignment.id
                    }
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <DoorOpen className="size-5" />
                            {
                              assignment.gate
                                .name
                            }
                          </CardTitle>

                          <CardDescription className="mt-2">
                            {
                              assignment.gate
                                .event.name
                            }
                          </CardDescription>
                        </div>

                        <Badge variant="outline">
                          Ativo
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4" />

                        {
                          assignment.gate
                            .event.location
                        }
                      </div>

                      <Button
                        className="mt-5 w-full"
                        render={
                          <Link
                            href={`/gate/checkin?gateId=${assignment.gate.id}`}
                          />
                        }
                      >
                        <ScanLine className="mr-2 size-4" />
                        Iniciar validação
                      </Button>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
