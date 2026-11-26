"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useAuthSession } from "@/hooks/use-auth-session"
import { apiRequest } from "@/lib/api"
import { createRealtimeSocket } from "@/lib/realtime"
import { categories, statuses, isActive, type BarSos } from "@/lib/bar-sos"
import type { Gate } from "@/types/gate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Person = { id: string; name: string }
type Assignment = { id: string; userId: string; user: Person }
type Request = BarSos & { requestedBy: Person; assignedManagerId: string | null }
type Data = { staff: Assignment[]; candidates: Person[]; managers: Person[]; requests: Request[] }

export default function OrganizerBarSosPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const { token } = useAuthSession()
  const [data, setData] = useState<Data | null>(null)
  const [candidate, setCandidate] = useState("")
  const [targets, setTargets] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [syncError, setSyncError] = useState("")
  const [activeOnly, setActiveOnly] = useState(true)
  const refresh = useRef<() => void>(() => {})
  const lock = useRef(false)

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
        const [staff, candidates, gates, requests] = await Promise.all([
          apiRequest<Assignment[]>(`/events/${eventId}/bar-staff`, { token: authToken }),
          apiRequest<Person[]>(`/events/${eventId}/bar-staff-candidates`, { token: authToken }),
          apiRequest<Gate[]>(`/events/${eventId}/gates`, { token: authToken }),
          apiRequest<Request[]>(`/events/${eventId}/bar-sos`, { token: authToken }),
        ])
        const managers = Array.from(new Map(gates.flatMap(g => g.staff)
          .filter(a => a.user.role === "GATE_MANAGER").map(a => [a.user.id, a.user] as const)).values())
        if (!stopped) { setData({ staff, candidates, managers, requests }); setSyncError("") }
      } catch (e) {
        if (!stopped) setSyncError(e instanceof Error ? e.message : "Falha ao atualizar dados")
      } finally {
        running = false
        if (queued && !stopped) { queued = false; void load() }
      }
    }
    const reload = () => { void load() }
    refresh.current = reload
    const socket = createRealtimeSocket(authToken)
    socket.on("connect", () => { socket.emit("event.join", { eventId }); reload() })
    socket.on("event.joined", reload)
    socket.on("bar-sos.updated", (payload: { eventId: string }) => { if (payload.eventId === eventId) reload() })
    const timer = window.setInterval(reload, 5000)
    reload()
    return () => { stopped = true; window.clearInterval(timer); socket.disconnect(); refresh.current = () => {} }
  }, [token, eventId])

  async function act(path: string, method: "POST" | "DELETE", body?: object) {
    if (!token || lock.current) return
    lock.current = true; setBusy(true); setError("")
    try {
      await apiRequest(path, { token, method, ...(body ? { body: JSON.stringify(body) } : {}) })
      setCandidate("")
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir a ação") }
    finally { lock.current = false; setBusy(false); refresh.current() }
  }

  const available = data?.candidates.filter(c => !data.staff.some(a => a.userId === c.id)) ?? []
  const disabled = busy || !!syncError
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
    <Button variant="outline" render={<Link href={`/organizer/events/${eventId}/overview`} />}>Voltar ao evento</Button>
    <header><h1 className="text-3xl font-bold">Assistência no bar</h1><p className="text-muted-foreground">Gerir funcionários e pedidos de assistência deste evento.</p></header>
    {error && <p role="alert" className="rounded-md border border-red-500 p-3">{error}</p>}
    {syncError && <p role="alert" className="rounded-md border p-3">Falha de sincronização: {syncError} <Button variant="outline" onClick={() => refresh.current()}>Atualizar</Button></p>}
    {!data ? <p>{syncError ? "Não foi possível carregar os dados." : "A carregar..."}</p> : <>
      <Card><CardHeader><CardTitle>Funcionários do bar</CardTitle></CardHeader><CardContent className="space-y-3">
        <label htmlFor="staff-candidate" className="block text-sm font-medium">Atribuir funcionário</label>
        <div className="flex flex-wrap gap-2"><select id="staff-candidate" className="min-w-48 flex-1 rounded-md border bg-background p-2" value={candidate} onChange={e => setCandidate(e.target.value)} disabled={disabled}>
          <option value="">Selecionar funcionário</option>{available.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id.slice(0, 8)})</option>)}
        </select><Button disabled={disabled || !available.some(c => c.id === candidate)} onClick={() => void act(`/events/${eventId}/bar-staff`, "POST", { userId: candidate })}>Atribuir</Button></div>
        {!available.length && <p className="text-sm text-muted-foreground">Sem candidatos disponíveis. O administrador pode atribuir o perfil BAR_STAFF.</p>}
        {!data.staff.length && <p>Nenhum funcionário atribuído.</p>}
        {data.staff.map(a => <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"><span>{a.user.name}</span><Button variant="outline" disabled={disabled} onClick={() => { if (window.confirm("Remover este funcionário do evento?")) void act(`/events/${eventId}/bar-staff/${a.userId}`, "DELETE") }}>Remover</Button></div>)}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Pedidos SOS ({data.requests.filter(isActive).length} ativos)</CardTitle></CardHeader><CardContent className="space-y-3">
        <label className="flex items-center gap-2"><input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} /> Mostrar apenas pedidos ativos</label>
        {!data.requests.some(s => !activeOnly || isActive(s)) && <p className="text-muted-foreground">Sem pedidos neste filtro.</p>}
        {data.requests.filter(s => !activeOnly || isActive(s)).map(s => <article key={s.id} className="space-y-3 rounded-md border p-4">
          <div className="flex flex-wrap justify-between gap-2"><strong>{categories[s.category]}</strong><span className="rounded-full border px-3 py-1 text-xs">{statuses[s.status]}</span></div>
          <p className="text-sm text-muted-foreground">{s.requestedBy.name} · {new Date(s.createdAt).toLocaleString("pt-MZ")}</p>
          {s.message && <p className="whitespace-pre-wrap break-words">{s.message}</p>}
          {s.assignedManagerId && <p className="text-sm">Gestor: {data.managers.find(m => m.id === s.assignedManagerId)?.name ?? s.assignedManagerId}</p>}
          {s.status === "PENDING" && <div className="space-y-2"><label htmlFor={`manager-${s.id}`} className="block text-sm font-medium">Gestor de segurança</label><div className="flex flex-wrap gap-2"><select id={`manager-${s.id}`} className="min-w-48 flex-1 rounded-md border bg-background p-2" disabled={disabled} value={targets[s.id] ?? ""} onChange={e => setTargets(old => ({ ...old, [s.id]: e.target.value }))}><option value="">Selecionar gestor</option>{data.managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><Button disabled={disabled || !data.managers.some(m => m.id === targets[s.id])} onClick={() => void act(`/bar-sos/${s.id}/forward`, "POST", { managerId: targets[s.id] })}>Encaminhar</Button></div>{!data.managers.length && <p className="text-sm text-muted-foreground">Atribui um gestor a uma gate deste evento primeiro.</p>}</div>}
          {isActive(s) && <div className="flex flex-wrap gap-2"><Button disabled={disabled} onClick={() => { if (window.confirm("Marcar este SOS como resolvido?")) void act(`/bar-sos/${s.id}/resolve`, "POST") }}>Resolver</Button><Button variant="outline" disabled={disabled} onClick={() => { if (window.confirm("Cancelar este SOS?")) void act(`/bar-sos/${s.id}/cancel`, "POST") }}>Cancelar</Button></div>}
        </article>)}
      </CardContent></Card>
    </>}
  </main>
}
