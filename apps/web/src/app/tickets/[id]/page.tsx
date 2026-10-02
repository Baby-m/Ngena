"use client"

import {
  useEffect,
} from "react"

import {
  useParams,
  useRouter,
} from "next/navigation"

import {
  Loader2,
} from "lucide-react"

export default function TicketRedirectPage() {
  const params =
    useParams<{ id: string }>()

  const router = useRouter()

  useEffect(() => {
    router.replace(
      `/customer/tickets/${params.id}`,
    )
  }, [
    params.id,
    router,
  ])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        A abrir bilhete...
      </div>
    </main>
  )
}
