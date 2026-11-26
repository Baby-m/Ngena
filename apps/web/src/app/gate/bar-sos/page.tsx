"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useAuthSession } from "@/hooks/use-auth-session"
import { apiRequest } from "@/lib/api"
import { createRealtimeSocket } from "@/lib/realtime"
import { categories, statuses, type BarSos } from "@/lib/bar-sos"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AssignedSos = BarSos & {
  event: { id: string; name: string }
  requestedBy: { id: string; name: string }
  forwardedAt: string | null
  resolvedAt: string | null
}

export default function GateBarSosPage() {
  const { token, user } = useAuthSession()
  if (user?.role !== "GATE_MANAGER" || !token) {
    return <main className="mx-auto max-w-3xl space-y-4 p-6"><p>Área exclusiva do gestor de segurança.</p><Link href="/gate" className="underline">Voltar ao dashboard</Link></main>
  }
  return <AssignedRequests key={user.id + token} token={token} />
}

function AssignedRequests({ token }: { token: string }) {
  const [requests, setRequests] = useState<AssignedSos[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [syncError, setSyncError] = useState("")
  const refresh = useRef<() => void>(() => {})
  const actionLock = useRef(false)

  useEffect(() => {
    let stopped = false
    let running = false
    let queued = false
    async function load() {
      if (stopped) return
      if (running) { queued = true; return }
      running = true
      try {
        const result = await apiRequest<AssignedSos[]>("/bar-sos/assigned", { token })
        if (!stopped) { setRequests(result); setSyncError("") }
      } catch (e) {
        if (!stopped) setSyncError(e instanceof Error ? e.message : "Falha ao atualizar pedidos")
      } finally {
        running = false
        if (!stopped) setLoading(false)
        if (queued && !stopped) { queued = false; void load() }
      }
    }
    const reload = () => { void load() }
    refresh.current = reload
    const socket = createRealtimeSocket(token)
    socket.on("connect", reload)
    socket.on("bar-sos.updated", reload)
    const timer = window.setInterval(reload, 5000)
    reload()
    return () => {
      stopped = true
      window.clearInterval(timer)
      socket.disconnect()
      refresh.current = () => {}
    }
  }, [token])

  async function resolve(id: string) {
    if (actionLock.current || syncError || !window.confirm("Confirmas que este pedido de assistência foi resolvido?")) return
    actionLock.current = true
    setBusy(true); setError("")
    try {
      await apiRequest(`/bar-sos/${id}/resolve`, { token, method: "POST" })
      setRequests(old => old.map(s => s.id === id ? { ...s, status: "RESOLVED" } : s))
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível resolver o SOS") }
    finally { actionLock.current = false; setBusy(false); refresh.current() }
  }

  const active = requests.filter(s => s.status === "FORWARDED")
  const history = requests.filter(s => s.status !== "FORWARDED")
  function renderRequest(s: AssignedSos) {
    return <article key={s.id} className="space-y-2 rounded-md border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>{categories[s.category]}</strong><span className="rounded-full border px-3 py-1 text-xs">{statuses[s.status]}</span></div>
      <p className="font-medium">{s.event.name}</p>
      <p className="text-sm text-muted-foreground">{s.requestedBy.name} · {new Date(s.createdAt).toLocaleString("pt-MZ")}</p>
      {s.message && <p className="whitespace-pre-wrap break-words text-sm">{s.message}</p>}
      {s.forwardedAt && <p className="text-xs text-muted-foreground">Encaminhado: {new Date(s.forwardedAt).toLocaleString("pt-MZ")}</p>}
      {s.resolvedAt && <p className="text-xs text-muted-foreground">Encerrado: {new Date(s.resolvedAt).toLocaleString("pt-MZ")}</p>}
      {s.status === "FORWARDED" && <Button disabled={busy || !!syncError} onClick={() => void resolve(s.id)}>Confirmar resolução</Button>}
    </article>
  }
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
    <header className="space-y-2"><Link href="/gate" className="text-sm underline">Voltar ao dashboard</Link><h1 className="text-3xl font-bold">Assistência no bar</h1><p className="text-muted-foreground">Pedidos encaminhados para ti pelo organizador.</p></header>
    {error && <p role="alert" className="rounded-md border border-red-500 p-3">{error}</p>}
    {syncError && <p role="alert" className="rounded-md border p-3">Dados possivelmente desatualizados: {syncError} <Button variant="outline" onClick={() => refresh.current()}>Atualizar</Button></p>}
    <Card><CardHeader><CardTitle>Pedidos ativos ({active.length})</CardTitle></CardHeader><CardContent className="space-y-3" aria-live="polite">
      {loading ? <p>A carregar pedidos...</p> : !syncError && active.length === 0 ? <p>Não tens pedidos ativos.</p> : null}
      {active.map(renderRequest)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Histórico</CardTitle></CardHeader><CardContent className="space-y-3">
      {!loading && !syncError && history.length === 0 && <p>Não existem pedidos encerrados.</p>}
      {history.map(renderRequest)}
    </CardContent></Card>
  </main>
}
