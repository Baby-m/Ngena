"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { apiRequest } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { createRealtimeSocket } from "@/lib/realtime"
import type { Ticket } from "@/types/ticket"

type Gate = { id: string; name: string }
type EntryRequest = {
  id: string
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED"
  gate: Gate
  resolvedAt: string | null
}
const labels = {
  PENDING: "A aguardar confirmação",
  CONFIRMED: "Entrada confirmada",
  REJECTED: "Pedido rejeitado",
  CANCELLED: "Pedido cancelado",
}

export function CustomerEntryRequests({ ticket, onTicket }: {
  ticket: Ticket
  onTicket: (ticket: Ticket) => void
}) {
  const ticketId = ticket.id
  const [requests, setRequests] = useState<EntryRequest[] | null>(null)
  const [gates, setGates] = useState<Gate[]>([])
  const [gateId, setGateId] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [loadError, setLoadError] = useState("")
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const storedToken = getToken()
    if (!storedToken) return
    const token = storedToken
    let active = true
    let running = false
    async function refresh() {
      if (!active || running) return
      running = true
      try {
        const [current, history] = await Promise.all([
          apiRequest<Ticket>(`/tickets/${ticketId}`, { token }),
          apiRequest<EntryRequest[]>(`/tickets/${ticketId}/entry-requests`, { token }),
        ])
        if (!active) return
        onTicket(current)
        setRequests(history)
        const available = current.status === "VALID"
          ? await apiRequest<Gate[]>(`/tickets/${ticketId}/entry-gates`, { token })
          : []
        if (!active) return
        setGates(available)
        setGateId(previous => available.some(gate => gate.id === previous)
          ? previous : available[0]?.id ?? "")
        setLoadError("")
      } catch (cause) {
        if (active) setLoadError(cause instanceof Error ? cause.message : "Falha ao carregar pedidos")
      } finally {
        running = false
      }
    }
    const socket = createRealtimeSocket(token)
    socket.on("connect", refresh)
    socket.on("entry-request.resolved", refresh)
    const timer = window.setInterval(refresh, 5000)
    void refresh()
    return () => {
      active = false
      window.clearInterval(timer)
      socket.disconnect()
    }
  }, [ticketId, onTicket, revision])

  async function submit(requestId?: string) {
    const token = getToken()
    if (!token || busy) return
    setBusy(true)
    setError("")
    try {
      await apiRequest(`/tickets/${ticketId}/entry-requests${requestId ? `/${requestId}/cancel` : ""}`, {
        token,
        method: "POST",
        ...(requestId ? {} : { body: JSON.stringify({ gateId }) }),
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir o pedido")
    } finally {
      setRevision(value => value + 1)
      setBusy(false)
    }
  }

  const pending = requests?.find(request => request.status === "PENDING")
  return (
    <section className="mt-6 space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Pedido de entrada</h2>
      {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {requests === null && !loadError && <p>A carregar pedidos...</p>}
      {pending ? (
        <div className="space-y-2">
          <p>A aguardar confirmação em {pending.gate.name}.</p>
          <Button variant="outline" disabled={busy} onClick={() => void submit(pending.id)}>
            Cancelar pedido
          </Button>
        </div>
      ) : ticket.status === "VALID" && requests !== null && (
        <div className="space-y-2">
          <label htmlFor="entry-gate" className="text-sm">Escolhe o gate de entrada</label>
          <select id="entry-gate" className="w-full rounded-md border bg-background p-2" value={gateId}
            onChange={event => setGateId(event.target.value)} disabled={busy}>
            {!gates.length && <option value="">Sem gates disponíveis</option>}
            {gates.map(gate => <option key={gate.id} value={gate.id}>{gate.name}</option>)}
          </select>
          <Button disabled={busy || !gateId || !!loadError} onClick={() => void submit()}>
            Solicitar entrada
          </Button>
          <p className="text-xs text-muted-foreground">Após uma rejeição, aguarda 60 segundos antes de tentar novamente.</p>
        </div>
      )}
      {!!requests?.length && (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {requests.map(request => <li key={request.id}>{request.gate.name} — {labels[request.status]}</li>)}
        </ul>
      )}
    </section>
  )
}
