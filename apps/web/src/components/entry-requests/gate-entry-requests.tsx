"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { apiRequest } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { createRealtimeSocket } from "@/lib/realtime"

type PendingRequest = {
  id: string
  customer: { name: string }
  ticket: { ticketType: { name: string } }
}

export function GateEntryRequests({ gateId }: { gateId: string }) {
  const [requests, setRequests] = useState<PendingRequest[] | null>(null)
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
        const result = await apiRequest<PendingRequest[]>(`/gates/${gateId}/entry-requests`, { token })
        if (active) {
          setRequests(result)
          setLoadError("")
        }
      } catch (cause) {
        if (active) setLoadError(cause instanceof Error ? cause.message : "Falha ao carregar pedidos")
      } finally {
        running = false
      }
    }
    const socket = createRealtimeSocket(token)
    socket.on("connect", refresh)
    socket.on("entry-request.created", refresh)
    socket.on("entry-request.resolved", refresh)
    const timer = window.setInterval(refresh, 5000)
    void refresh()
    return () => {
      active = false
      window.clearInterval(timer)
      socket.disconnect()
    }
  }, [gateId, revision])

  async function decide(id: string, decision: "confirm" | "reject") {
    const token = getToken()
    if (!token || busy) return
    setBusy(true)
    setError("")
    try {
      await apiRequest(`/entry-requests/${id}/${decision}`, { token, method: "POST" })
      setRequests(previous => previous?.filter(request => request.id !== id) ?? null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível resolver o pedido")
    } finally {
      setRevision(value => value + 1)
      setBusy(false)
    }
  }

  return (
    <section className="space-y-3 rounded-xl border bg-background p-4">
      <h2 className="font-semibold">Pedidos de entrada pendentes</h2>
      {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {requests === null && !loadError && <p>A carregar pedidos...</p>}
      {requests?.length === 0 && <p className="text-sm text-muted-foreground">Sem pedidos pendentes.</p>}
      {requests?.map(request => (
        <div key={request.id} className="space-y-2 rounded-md border p-3">
          <p className="font-medium">{request.customer.name}</p>
          <p className="text-sm text-muted-foreground">{request.ticket.ticketType.name}</p>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !!loadError} onClick={() => void decide(request.id, "confirm")}>Confirmar entrada</Button>
            <Button variant="outline" disabled={busy || !!loadError} onClick={() => void decide(request.id, "reject")}>Rejeitar</Button>
          </div>
        </div>
      ))}
    </section>
  )
}
