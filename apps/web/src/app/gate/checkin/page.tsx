"use client"

import {
  FormEvent,
  useEffect,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ScanLine,
  XCircle,
} from "lucide-react"

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"

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
  Input,
} from "@/components/ui/input"

import {
  Label,
} from "@/components/ui/label"

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

type ValidationResponse = {
  success: boolean
  message: string

  gate: {
    id: string
    name: string
  }

  ticket: {
    id: string
    code: string
    status: string

    ticketType: {
      name: string

      event: {
        id: string
        name: string
        location: string
      }
    }
  }

  checkIn: {
    id: string
    createdAt: string
  }
}

export default function GateCheckInPage() {
  const router = useRouter()

  const [
    assignments,
    setAssignments,
  ] = useState<MyGateAssignment[]>([])

  const [
    gateId,
    setGateId,
  ] = useState("")

  const [
    code,
    setCode,
  ] = useState("")

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    loadingGates,
    setLoadingGates,
  ] = useState(true)

  const [
    success,
    setSuccess,
  ] = useState<ValidationResponse | null>(
    null,
  )

  const [
    error,
    setError,
  ] = useState("")

  useEffect(() => {
    const token = getToken()
    const user = getStoredUser()

    if (!token || !user) {
      router.replace("/login")
      return
    }

    if (
      user.role !== "GATE_MANAGER" &&
      user.role !== "GATE_STAFF" &&
      user.role !== "SUPER_ADMIN"
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

        const search =
          new URLSearchParams(
            window.location.search,
          )

        const requestedGateId =
          search.get("gateId")

        const requestedGate =
          result.find(
            (assignment) =>
              assignment.gate.id ===
              requestedGateId,
          )

        if (requestedGate) {
          setGateId(
            requestedGate.gate.id,
          )
        } else if (result.length > 0) {
          setGateId(
            result[0].gate.id,
          )
        }

        setError("")
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os gates",
        )
      })
      .finally(() => {
        setLoadingGates(false)
      })
  }, [router])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const token = getToken()

    if (!token) {
      router.replace("/login")
      return
    }

    if (!gateId) {
      setError(
        "Seleciona um gate.",
      )
      return
    }

    const normalizedCode =
      code.trim().toUpperCase()

    if (!normalizedCode) {
      setError(
        "Introduz o código do bilhete.",
      )
      return
    }

    setLoading(true)
    setError("")
    setSuccess(null)

    try {
      const result =
        await apiRequest<ValidationResponse>(
          "/checkins/validate",
          {
            method: "POST",
            token,

            body: JSON.stringify({
              code: normalizedCode,
              gateId,
            }),
          },
        )

      setSuccess(result)
      setCode("")
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível validar o bilhete",
      )
    } finally {
      setLoading(false)
    }
  }

  if (loadingGates) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />

          A carregar gates...
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="mx-auto max-w-xl px-6 py-12">
        <Button
          variant="ghost"
          onClick={() =>
            router.push("/gate")
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          Dashboard
        </Button>

        <div className="mt-8">
          <Badge variant="secondary">
            FlowPass Gate
          </Badge>

          <h1 className="mt-3 text-3xl font-bold">
            Check-in
          </h1>

          <p className="mt-2 text-muted-foreground">
            Valida o código do bilhete no gate selecionado.
          </p>
        </div>

        {assignments.length === 0 ? (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>
                Sem gates atribuídos
              </CardTitle>

              <CardDescription>
                Não podes realizar check-ins enquanto não fores atribuído a um gate.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="size-5" />

                Validar entrada
              </CardTitle>

              <CardDescription>
                Um ticket válido será marcado como utilizado.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="gate">
                    Gate
                  </Label>

                  <select
                    id="gate"
                    value={gateId}
                    onChange={(event) => {
                      setGateId(
                        event.target.value,
                      )

                      setError("")
                      setSuccess(null)
                    }}
                    className="flex h-9 w-full rounded-md border bg-background px-3 text-sm outline-none"
                    required
                  >
                    {assignments.map(
                      (assignment) => (
                        <option
                          key={
                            assignment.id
                          }
                          value={
                            assignment.gate.id
                          }
                        >
                          {
                            assignment.gate
                              .event.name
                          }
                          {" — "}
                          {
                            assignment.gate
                              .name
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">
                    Código do bilhete
                  </Label>

                  <Input
                    id="code"
                    value={code}
                    onChange={(event) =>
                      setCode(
                        event.target.value,
                      )
                    }
                    placeholder="NGENA-XXXXXXXX"
                    autoComplete="off"
                    autoFocus
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <ScanLine className="mr-2 size-4" />
                  )}

                  Validar entrada
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {success && (
          <Alert className="mt-6">
            <CheckCircle2 className="size-4" />

            <AlertDescription>
              <p className="font-semibold">
                Entrada autorizada
              </p>

              <div className="mt-3 space-y-1 text-sm">
                <p>
                  Evento:{" "}
                  <strong>
                    {
                      success.ticket
                        .ticketType.event.name
                    }
                  </strong>
                </p>

                <p>
                  Tipo:{" "}
                  <strong>
                    {
                      success.ticket
                        .ticketType.name
                    }
                  </strong>
                </p>

                <p>
                  Gate:{" "}
                  <strong>
                    {success.gate.name}
                  </strong>
                </p>

                <p className="font-mono">
                  {success.ticket.code}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert
            variant="destructive"
            className="mt-6"
          >
            <XCircle className="size-4" />

            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  )
}
