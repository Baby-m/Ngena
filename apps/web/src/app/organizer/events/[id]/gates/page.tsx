"use client"

import {
  FormEvent,
  useEffect,
  useState,
} from "react"

import {
  useParams,
  useRouter,
} from "next/navigation"

import {
  ArrowLeft,
  DoorOpen,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
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
  UserRole,
} from "@/types/auth"

import type {
  Gate,
} from "@/types/gate"

type StaffCandidate = {
  id: string
  name: string
  email: string
  role: UserRole
}

export default function GatesPage() {
  const params =
    useParams<{ id: string }>()

  const router = useRouter()

  const [gates, setGates] =
    useState<Gate[]>([])

  const [
    staffCandidates,
    setStaffCandidates,
  ] = useState<StaffCandidate[]>([])

  const [
    selectedStaff,
    setSelectedStaff,
  ] = useState<Record<string, string>>(
    {},
  )

  const [name, setName] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    assigningGateId,
    setAssigningGateId,
  ] = useState<string | null>(null)

  const [
    removingAssignmentId,
    setRemovingAssignmentId,
  ] = useState<string | null>(null)

  const [error, setError] =
    useState("")

  async function refreshGates() {
    const token = getToken()

    if (!token) {
      router.replace("/login")
      return
    }

    const result =
      await apiRequest<Gate[]>(
        `/events/${params.id}/gates`,
        {
          token,
        },
      )

    setGates(result)
  }

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

    Promise.all([
      apiRequest<Gate[]>(
        `/events/${params.id}/gates`,
        {
          token,
        },
      ),

      apiRequest<StaffCandidate[]>(
        "/users/gate-staff-candidates",
        {
          token,
        },
      ),
    ])
      .then(
        ([
          gatesResult,
          staffResult,
        ]) => {
          setGates(gatesResult)
          setStaffCandidates(
            staffResult,
          )

          setError("")
        },
      )
      .catch((error) => {
        console.error(
          "Failed to load gate management:",
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os gates",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [
    params.id,
    router,
  ])

  async function handleCreateGate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const token = getToken()

    if (!token) {
      router.replace("/login")
      return
    }

    const trimmedName =
      name.trim()

    if (trimmedName.length < 2) {
      setError(
        "O nome do gate deve ter pelo menos 2 caracteres.",
      )
      return
    }

    setSaving(true)
    setError("")

    try {
      await apiRequest(
        `/events/${params.id}/gates`,
        {
          method: "POST",
          token,

          body: JSON.stringify({
            name: trimmedName,
          }),
        },
      )

      setName("")

      await refreshGates()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o gate",
      )
    } finally {
      setSaving(false)
    }
  }

  async function assignStaff(
    gateId: string,
  ) {
    const token = getToken()

    if (!token) {
      router.replace("/login")
      return
    }

    const userId =
      selectedStaff[gateId]

    if (!userId) {
      setError(
        "Seleciona um membro da equipa.",
      )
      return
    }

    setAssigningGateId(
      gateId,
    )

    setError("")

    try {
      await apiRequest(
        `/gates/${gateId}/staff`,
        {
          method: "POST",
          token,

          body: JSON.stringify({
            userId,
          }),
        },
      )

      setSelectedStaff(
        (current) => ({
          ...current,
          [gateId]: "",
        }),
      )

      await refreshGates()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível atribuir o staff",
      )
    } finally {
      setAssigningGateId(
        null,
      )
    }
  }

  async function removeStaff(
    gateId: string,
    userId: string,
    assignmentId: string,
  ) {
    const token = getToken()

    if (!token) {
      router.replace("/login")
      return
    }

    const confirmed =
      window.confirm(
        "Remover este membro do gate?",
      )

    if (!confirmed) {
      return
    }

    setRemovingAssignmentId(
      assignmentId,
    )

    setError("")

    try {
      await apiRequest(
        `/gates/${gateId}/staff/${userId}`,
        {
          method: "DELETE",
          token,
        },
      )

      await refreshGates()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível remover o staff",
      )
    } finally {
      setRemovingAssignmentId(
        null,
      )
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />

          A carregar gates...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Button
          variant="ghost"
          onClick={() =>
            router.back()
          }
        >
          <ArrowLeft className="mr-2 size-4" />

          Voltar
        </Button>

        <div className="mt-8">
          <Badge variant="secondary">
            Gestão de acesso
          </Badge>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Gates
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Cria pontos de entrada e
            atribui membros da equipa que
            poderão validar os bilhetes
            neste evento.
          </p>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="mt-6"
          >
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              Criar gate
            </CardTitle>

            <CardDescription>
              Adiciona um novo ponto de
              acesso ao evento.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={
                handleCreateGate
              }
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">
                  Nome
                </Label>

                <Input
                  id="name"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  placeholder="Gate A"
                  minLength={2}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}

                Criar gate
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="mt-10">
          <div className="flex items-center gap-2">
            <DoorOpen className="size-5" />

            <h2 className="text-xl font-semibold">
              Gates configurados
            </h2>
          </div>

          {gates.length === 0 ? (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <DoorOpen className="size-10 text-muted-foreground" />

                <p className="mt-4 font-medium">
                  Ainda não existem
                  gates.
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Cria o primeiro ponto
                  de entrada deste
                  evento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {gates.map(
                (gate) => {
                  const availableStaff =
                    staffCandidates.filter(
                      (candidate) =>
                        !gate.staff.some(
                          (
                            assignment,
                          ) =>
                            assignment.user
                              .id ===
                            candidate.id,
                        ),
                    )

                  return (
                    <Card
                      key={gate.id}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <DoorOpen className="size-5" />

                              {gate.name}
                            </CardTitle>

                            <CardDescription className="mt-2">
                              {
                                gate.staff
                                  .length
                              }{" "}
                              membro(s)
                              atribuído(s)
                            </CardDescription>
                          </div>

                          <Badge variant="outline">
                            {
                              gate.staff
                                .length
                            }{" "}
                            staff
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <Users className="size-4" />

                            <p className="font-medium">
                              Equipa
                              atribuída
                            </p>
                          </div>

                          {gate.staff
                            .length ===
                          0 ? (
                            <div className="rounded-lg border border-dashed p-4">
                              <p className="text-sm text-muted-foreground">
                                Nenhum
                                membro
                                atribuído
                                a este
                                gate.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {gate.staff.map(
                                (
                                  assignment,
                                ) => (
                                  <div
                                    key={
                                      assignment.id
                                    }
                                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-medium">
                                        {
                                          assignment
                                            .user
                                            .name
                                        }
                                      </p>

                                      <p className="truncate text-xs text-muted-foreground">
                                        {
                                          assignment
                                            .user
                                            .email
                                        }
                                      </p>

                                      <Badge
                                        variant="secondary"
                                        className="mt-2"
                                      >
                                        {
                                          assignment
                                            .user
                                            .role
                                        }
                                      </Badge>
                                    </div>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      disabled={
                                        removingAssignmentId ===
                                        assignment.id
                                      }
                                      onClick={() =>
                                        removeStaff(
                                          gate.id,
                                          assignment
                                            .user
                                            .id,
                                          assignment.id,
                                        )
                                      }
                                      aria-label={`Remover ${assignment.user.name}`}
                                    >
                                      {removingAssignmentId ===
                                      assignment.id ? (
                                        <Loader2 className="size-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="size-4" />
                                      )}
                                    </Button>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>

                        <div className="border-t pt-5">
                          <div className="mb-3 flex items-center gap-2">
                            <UserPlus className="size-4" />

                            <p className="font-medium">
                              Atribuir
                              staff
                            </p>
                          </div>

                          {availableStaff.length ===
                          0 ? (
                            <p className="text-sm text-muted-foreground">
                              Não
                              existem
                              outros
                              membros
                              disponíveis
                              para
                              atribuir.
                            </p>
                          ) : (
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <select
                                value={
                                  selectedStaff[
                                    gate.id
                                  ] ??
                                  ""
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setSelectedStaff(
                                    (
                                      current,
                                    ) => ({
                                      ...current,

                                      [gate.id]:
                                        event
                                          .target
                                          .value,
                                    }),
                                  )
                                }
                                className="flex h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none"
                              >
                                <option value="">
                                  Selecionar
                                  staff
                                </option>

                                {availableStaff.map(
                                  (
                                    staff,
                                  ) => (
                                    <option
                                      key={
                                        staff.id
                                      }
                                      value={
                                        staff.id
                                      }
                                    >
                                      {
                                        staff.name
                                      }
                                      {" — "}
                                      {
                                        staff.role
                                      }
                                    </option>
                                  ),
                                )}
                              </select>

                              <Button
                                type="button"
                                variant="outline"
                                disabled={
                                  !selectedStaff[
                                    gate
                                      .id
                                  ] ||
                                  assigningGateId ===
                                    gate.id
                                }
                                onClick={() =>
                                  assignStaff(
                                    gate.id,
                                  )
                                }
                              >
                                {assigningGateId ===
                                gate.id ? (
                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                  <UserPlus className="mr-2 size-4" />
                                )}

                                Atribuir
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                },
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
