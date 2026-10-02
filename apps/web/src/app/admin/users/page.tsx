"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  ArrowLeft,
  Loader2,
  Search,
  ShieldCheck,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Input,
} from "@/components/ui/input"

import {
  apiRequest,
} from "@/lib/api"

import {
  getStoredUser,
  getToken,
} from "@/lib/auth"

type UserRole =
  | "SUPER_ADMIN"
  | "ORGANIZER"
  | "GATE_MANAGER"
  | "GATE_STAFF"
  | "CUSTOMER"

type AdminUser = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

const roles: UserRole[] = [
  "SUPER_ADMIN",
  "ORGANIZER",
  "GATE_MANAGER",
  "GATE_STAFF",
  "CUSTOMER",
]

export default function AdminUsersPage() {
  const router =
    useRouter()

  const [
    users,
    setUsers,
  ] = useState<AdminUser[]>([])

  const [
    search,
    setSearch,
  ] = useState("")

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    savingUserId,
    setSavingUserId,
  ] = useState<string | null>(
    null,
  )

  const [
    error,
    setError,
  ] = useState("")

  const [
    success,
    setSuccess,
  ] = useState("")

  const currentUser =
    useMemo(
      () => getStoredUser(),
      [],
    )

  useEffect(() => {
    const token =
      getToken()

    if (
      !token ||
      !currentUser
    ) {
      router.replace(
        "/login",
      )

      return
    }

    if (
      currentUser.role !==
      "SUPER_ADMIN"
    ) {
      router.replace(
        "/dashboard",
      )

      return
    }

    apiRequest<AdminUser[]>(
      "/users",
      {
        token,
      },
    )
      .then((result) => {
        setUsers(result)
        setError("")
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os utilizadores",
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }, [
    currentUser,
    router,
  ])

  const filteredUsers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return users
      }

      return users.filter(
        (user) =>
          user.name
            .toLowerCase()
            .includes(query) ||
          user.email
            .toLowerCase()
            .includes(query) ||
          user.role
            .toLowerCase()
            .includes(query),
      )
    }, [
      search,
      users,
    ])

  async function changeRole(
    userId: string,
    role: UserRole,
  ) {
    const token =
      getToken()

    if (!token) {
      router.replace(
        "/login",
      )

      return
    }

    setSavingUserId(
      userId,
    )

    setError("")
    setSuccess("")

    try {
      const updatedUser =
        await apiRequest<AdminUser>(
          `/users/${userId}/role`,
          {
            method: "PATCH",
            token,

            body: JSON.stringify({
              role,
            }),
          },
        )

      setUsers(
        (current) =>
          current.map(
            (user) =>
              user.id ===
              updatedUser.id
                ? updatedUser
                : user,
          ),
      )

      setSuccess(
        `Perfil de ${updatedUser.name} atualizado para ${updatedUser.role}.`,
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a role",
      )
    } finally {
      setSavingUserId(
        null,
      )
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          A carregar utilizadores...
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(
              "/admin",
            )
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          Dashboard
        </Button>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary">
              Super Admin
            </Badge>

            <h1 className="mt-3 flex items-center gap-2 text-3xl font-bold">
              <Users className="size-7" />
              Utilizadores
            </h1>

            <p className="mt-2 text-muted-foreground">
              Consulta utilizadores e gere os seus perfis de acesso.
            </p>
          </div>

          <Badge variant="outline">
            {users.length} utilizador(es)
          </Badge>
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

        {success && (
          <Alert className="mt-6">
            <ShieldCheck className="size-4" />

            <AlertDescription>
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Pesquisar por nome, email ou role..."
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 space-y-4">
          {filteredUsers.length ===
          0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum utilizador encontrado.
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map(
              (user) => {
                const isCurrentUser =
                  user.id ===
                  currentUser?.id

                return (
                  <Card
                    key={
                      user.id
                    }
                  >
                    <CardHeader>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle>
                              {
                                user.name
                              }
                            </CardTitle>

                            {isCurrentUser && (
                              <Badge variant="secondary">
                                Tu
                              </Badge>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {
                              user.email
                            }
                          </p>
                        </div>

                        <Badge variant="outline">
                          {user.role}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Criado em
                          </p>

                          <p className="mt-1 text-sm">
                            {new Date(
                              user.createdAt,
                            ).toLocaleString(
                              "pt-MZ",
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={
                              user.role
                            }
                            disabled={
                              savingUserId ===
                              user.id
                            }
                            onChange={(
                              event,
                            ) =>
                              changeRole(
                                user.id,
                                event
                                  .target
                                  .value as UserRole,
                              )
                            }
                            className="flex h-9 rounded-md border bg-background px-3 text-sm outline-none"
                          >
                            {roles.map(
                              (
                                role,
                              ) => (
                                <option
                                  key={
                                    role
                                  }
                                  value={
                                    role
                                  }
                                  disabled={
                                    isCurrentUser &&
                                    role !==
                                      "SUPER_ADMIN"
                                  }
                                >
                                  {
                                    role
                                  }
                                </option>
                              ),
                            )}
                          </select>

                          {savingUserId ===
                            user.id && (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              },
            )
          )}
        </div>
      </div>
    </main>
  )
}
