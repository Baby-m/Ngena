"use client"

import {
  FormEvent,
  useEffect,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Loader2,
  ScanLine,
  XCircle,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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

import { apiRequest } from "@/lib/api"
import {
  getStoredUser,
  getToken,
} from "@/lib/auth"

type ValidationResponse = {
  success: boolean
  message: string

  ticket: {
    id: string
    code: string
    status: string

    ticketType: {
      name: string

      event: {
        name: string
        location: string
      }
    }
  }
}

type MyGate = {
  id: string

  gate: {
    id: string
    name: string

    event: {
      id: string
      name: string
      location: string
    }
  }
}

export default function GatePage() {
  const router = useRouter()

  const [code, setCode] = useState("")
  const [loading, setLoading] =
    useState(false)

  const [success, setSuccess] =
    useState<ValidationResponse | null>(
      null,
    )

  const [gates, setGates] =
    useState<MyGate[]>([])

  const [gateId, setGateId] =
    useState("")

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
      user.role !== "GATE_MANAGER" &&
      user.role !== "GATE_STAFF" &&
      user.role !== "SUPER_ADMIN"
    ) {
      router.replace("/dashboard")
    }

    apiRequest<MyGate[]>(
      "/gates/mine",
      {
        token,
      },
    )
      .then((result) => {
        setGates(result)

        if (result.length > 0) {
          setGateId(
            result[0].gate.id,
          )
        }
      })
      .catch(console.error)
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
              code: code.trim(),
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

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-xl px-6 py-12">
        <Badge variant="secondary">
          Gate
        </Badge>

        <h1 className="mt-3 text-3xl font-bold">
          Validar entrada
        </h1>

        <p className="mt-2 text-muted-foreground">
          Introduz o código do bilhete.
        </p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="size-5" />
              Validação
            </CardTitle>

            <CardDescription>
              O bilhete será marcado como usado após uma validação bem-sucedida.
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
                  onChange={(event) =>
                    setGateId(
                      event.target.value,
                    )
                  }
                  className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  required
                >
                  {gates.map((assignment) => (
                    <option
                      key={assignment.gate.id}
                      value={assignment.gate.id}
                    >
                      {assignment.gate.event.name}
                      {" — "}
                      {assignment.gate.name}
                    </option>
                  ))}
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
                  placeholder="NGENA-7F4D92A1"
                  autoComplete="off"
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

                Validar
              </Button>
            </form>
          </CardContent>
        </Card>

        {success && (
          <Alert className="mt-6">
            <CheckCircle2 className="size-4" />

            <AlertDescription>
              <strong>
                Entrada autorizada.
              </strong>

              <div className="mt-2">
                {
                  success.ticket
                    .ticketType.event.name
                }
              </div>

              <div>
                {
                  success.ticket
                    .ticketType.name
                }
              </div>

              <div className="font-mono">
                {success.ticket.code}
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
