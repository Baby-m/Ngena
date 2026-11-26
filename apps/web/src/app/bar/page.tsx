"use client"

import { useEffect, useRef, useState } from "react"
import { useAuthSession } from "@/hooks/use-auth-session"
import { apiRequest } from "@/lib/api"
import { createRealtimeSocket } from "@/lib/realtime"
import { categories, statuses, isActive, type BarSos, type SosCategory } from "@/lib/bar-sos"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Assignment = { event: { id: string; name: string; location: string; startsAt: string; status: string } }

export default function BarPage() {
  const { token } = useAuthSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [requests, setRequests] = useState<BarSos[]>([])
  const [selected, setSelected] = useState("")
  const [category, setCategory] = useState<SosCategory | "">("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [syncError, setSyncError] = useState("")
  const refresh = useRef<() => void>(() => {})
  const actionLock = useRef(false)
  const eventId = assignments.some(a => a.event.id === selected) ? selected : assignments[0]?.event.id ?? ""
  const active = requests.some(s => s.eventId === eventId && isActive(s))

  useEffect(() => {
    if (!token) return
    const authToken = token
    let stopped = false
    let running = false
    let queued = false
    async function load() {
      if (stopped) return
      if (running) { queued = true; return }
      running = true
      try {
        const [events, sos] = await Promise.all([
          apiRequest<Assignment[]>("/bar-sos/my-events", { token: authToken }),
          apiRequest<BarSos[]>("/bar-sos/mine", { token: authToken }),
        ])
        if (!stopped) { setAssignments(events); setRequests(sos); setSyncError("") }
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
    const socket = createRealtimeSocket(authToken)
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

  async function send() {
    if (!token || !eventId || !category || active || actionLock.current) return
    actionLock.current = true
    setBusy(true); setError("")
    try {
      const result = await apiRequest<BarSos>(`/events/${eventId}/bar-sos`, {
        token, method: "POST", body: JSON.stringify({ category, message: message.trim() || undefined }),
      })
      setRequests(old => [result, ...old.filter(s => s.id !== result.id)])
      setMessage(""); setCategory("")
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível enviar o SOS") }
    finally { actionLock.current = false; setBusy(false); refresh.current() }
  }

  async function cancel(id: string) {
    if (!token || actionLock.current || !window.confirm("Cancelar este pedido de assistência?")) return
    actionLock.current = true
    setBusy(true); setError("")
    try {
      await apiRequest(`/bar-sos/${id}/cancel`, { token, method: "POST" })
      setRequests(old => old.map(s => s.id === id ? { ...s, status: "CANCELLED" } : s))
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível cancelar o SOS") }
    finally { actionLock.current = false; setBusy(false); refresh.current() }
  }

  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
    <header><h1 className="text-3xl font-bold">Assistência no bar</h1><p className="text-muted-foreground">Solicita apoio e acompanha os teus pedidos.</p></header>
    {error && <p role="alert" className="rounded-md border border-red-500 p-3">{error}</p>}
    {syncError && <p role="alert" className="rounded-md border p-3">Dados possivelmente desatualizados: {syncError} <Button variant="outline" onClick={() => refresh.current()}>Atualizar</Button></p>}
    <Card><CardHeader><CardTitle>Novo SOS</CardTitle></CardHeader><CardContent className="space-y-4">
      {loading ? <p>A carregar eventos...</p> : assignments.length === 0 ? <p>Não tens eventos atribuídos.</p> : <>
        <label className="block text-sm font-medium" htmlFor="bar-event">Evento</label>
        <select id="bar-event" className="w-full rounded-md border bg-background p-3" value={eventId} disabled={busy} onChange={e => setSelected(e.target.value)}>
          {assignments.map(({event}) => <option key={event.id} value={event.id}>{event.name} — {event.location}</option>)}
        </select>
        {active ? <p>Já existe um SOS ativo para este evento.</p> : <>
          <fieldset disabled={busy || !!syncError} className="space-y-2"><legend className="mb-2 text-sm font-medium">Motivo do pedido</legend><div className="grid grid-cols-2 gap-2">
            {(Object.keys(categories) as SosCategory[]).map(c => <Button key={c} type="button" variant={category === c ? "default" : "outline"} aria-pressed={category === c} className="h-auto min-h-12 whitespace-normal" onClick={() => setCategory(c)}>{categories[c]}</Button>)}
          </div></fieldset>
          <label htmlFor="bar-message" className="block text-sm font-medium">Descrição complementar (opcional)</label>
          <textarea id="bar-message" className="w-full rounded-md border bg-background p-3" rows={3} maxLength={500} value={message} disabled={busy} onChange={e => setMessage(e.target.value)} />
          <p className="text-right text-xs text-muted-foreground">{message.length}/500</p>
          <Button variant="destructive" className="w-full" disabled={busy || !category || !!syncError} onClick={() => void send()}>Enviar SOS</Button>
        </>}
      </>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Os meus pedidos</CardTitle></CardHeader><CardContent className="space-y-3" aria-live="polite">
      {!loading && requests.length === 0 && <p className="text-muted-foreground">Ainda não existem pedidos.</p>}
      {requests.map(s => <div key={s.id} className="space-y-2 rounded-md border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>{categories[s.category]}</strong><span className="rounded-full border px-3 py-1 text-xs">{statuses[s.status]}</span></div>
        <p className="text-sm text-muted-foreground">{assignments.find(a => a.event.id === s.eventId)?.event.name ?? s.eventId} · {new Date(s.createdAt).toLocaleString("pt-MZ")}</p>
        {s.message && <p className="whitespace-pre-wrap break-words text-sm">{s.message}</p>}
        {isActive(s) && <Button variant="outline" disabled={busy} onClick={() => void cancel(s.id)}>Cancelar pedido</Button>}
      </div>)}
    </CardContent></Card>
  </main>
}
