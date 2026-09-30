import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Ticket,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const features = [
  {
    title: "Bilhetes digitais",
    description:
      "Crie e distribua bilhetes digitais com códigos únicos para cada participante.",
    icon: Ticket,
  },
  {
    title: "Validação rápida",
    description:
      "Valide entradas através de QR Code, código do bilhete ou pesquisa do participante.",
    icon: QrCode,
  },
  {
    title: "Acesso seguro",
    description:
      "Evite reutilização de bilhetes e mantenha o controlo de cada entrada.",
    icon: ShieldCheck,
  },
  {
    title: "Monitorização",
    description:
      "Acompanhe vendas, entradas e fluxo por gate através do dashboard do organizador.",
    icon: BarChart3,
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Ngena
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Funcionalidades
            </a>
            <a href="#how-it-works" className="hover:text-foreground">
              Como funciona
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              render={<Link href="/login" />}
            >
              Entrar
            </Button>

            <Button
              render={<Link href="/register" />}
            >
              Criar conta
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
        <div>
          <Badge variant="secondary" className="mb-6">
            Gestão inteligente de eventos
          </Badge>

          <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
            Venda bilhetes.
            <br />
            Controle entradas.
            <br />
            Acompanhe tudo.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            O Ngena ajuda organizadores a gerir eventos, emitir bilhetes
            digitais e controlar o acesso de participantes de forma rápida,
            segura e organizada.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="outline"
              render={<a href="#how-it-works" />}
            >
              Ver como funciona
            </Button>

            <Button
              size="lg"
              variant="outline"
              render={<a href="#how-it-works" />}
            >
              Ver como funciona
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Bilhetes digitais
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Check-in seguro
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Monitorização em tempo real
            </span>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <Badge className="w-fit">Evento em andamento</Badge>
            <CardTitle className="text-2xl">Festival Ngena</CardTitle>
            <CardDescription>
              Visão geral da entrada de participantes
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-3xl font-semibold">2,000</p>
                <p className="text-sm text-muted-foreground">Bilhetes</p>
              </div>

              <div>
                <p className="text-3xl font-semibold">1,350</p>
                <p className="text-sm text-muted-foreground">Entraram</p>
              </div>

              <div>
                <p className="text-3xl font-semibold">650</p>
                <p className="text-sm text-muted-foreground">Restantes</p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Gate A</span>
                <strong>800 entradas</strong>
              </div>

              <div className="flex items-center justify-between">
                <span>Gate B</span>
                <strong>550 entradas</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        id="features"
        className="border-y bg-muted/40"
      >
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <Badge variant="outline">Plataforma completa</Badge>

            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Tudo o que precisas para controlar o acesso ao teu evento
            </h2>

            <p className="mt-4 text-muted-foreground">
              Do primeiro bilhete vendido até ao último participante que entra
              no recinto.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon

              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Icon className="size-5" />
                    </div>

                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-6 py-24"
      >
        <div className="text-center">
          <Badge variant="secondary">Como funciona</Badge>

          <h2 className="mt-4 text-3xl font-bold tracking-tight">
            Do evento ao check-in
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                01
              </Badge>
              <CardTitle>Cria o evento</CardTitle>
              <CardDescription>
                Configura o evento, gates, tipos e quantidade de bilhetes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                02
              </Badge>
              <CardTitle>Emite bilhetes</CardTitle>
              <CardDescription>
                Participantes recebem bilhetes digitais com identificação
                única.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                03
              </Badge>
              <CardTitle>Controla a entrada</CardTitle>
              <CardDescription>
                Valida cada participante e acompanha entradas através do
                dashboard.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight">
            Uma forma melhor de gerir a entrada do teu próximo evento.
          </h2>

          <p className="mt-4 max-w-xl text-muted-foreground">
            Começa com uma experiência simples para participantes, equipas de
            acesso e organizadores.
          </p>

          <Button
            size="lg"
            className="mt-8"
            render={<Link href="/register" />}
          >
            Criar conta
            <ArrowRight className="ml-2 size-4" />
          </Button>

          <Link href="/events">
            Eventos
          </Link>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Ngena</span>
          <span>Bilhetes, acesso e gestão de eventos.</span>
        </div>
      </footer>
    </main>
  )
}
