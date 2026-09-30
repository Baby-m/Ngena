"use client"

import {
  FormEvent,
  Suspense,
  useState,
} from "react"
import Link from "next/link"
import {
  useRouter,
  useSearchParams,
} from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { saveAuth } from "@/lib/auth"
import type { LoginResponse } from "@/types/auth"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const registered =
    searchParams.get("registered") === "true"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError("")

    try {
      const response = await apiRequest<LoginResponse>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        },
      )

      saveAuth(
        response.accessToken,
        response.user,
      )

      router.push("/dashboard")
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar sessão",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Bem-vindo de volta
          </CardTitle>

          <CardDescription>
            Entra na tua conta Ngena.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {registered && (
              <Alert>
                <CheckCircle2 className="size-4" />

                <AlertDescription>
                  Conta criada com sucesso. Agora podes entrar.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                Email
              </Label>

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password
              </Label>

              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}

              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tens conta?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
