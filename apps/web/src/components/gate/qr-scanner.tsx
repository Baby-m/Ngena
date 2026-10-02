"use client"

import {
  useEffect,
  useRef,
  useState,
} from "react"

import type {
  Html5Qrcode,
} from "html5-qrcode"

import {
  Camera,
  CameraOff,
  Loader2,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

type Props = {
  disabled?: boolean

  onDetected: (
    value: string,
  ) => void
}

const READER_ID =
  "flowpass-qr-reader"

export function QrScanner({
  disabled = false,
  onDetected,
}: Props) {
  const scannerRef =
    useRef<Html5Qrcode | null>(
      null,
    )

  const [
    active,
    setActive,
  ] = useState(false)

  const [
    starting,
    setStarting,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  async function stopScanner() {
    const scanner =
      scannerRef.current

    if (!scanner) {
      setActive(false)
      return
    }

    try {
      await scanner.stop()
    } catch {
      // Pode já estar parado.
    }

    try {
      scanner.clear()
    } catch {
      // Pode já estar limpo.
    }

    scannerRef.current =
      null

    setActive(false)
  }

  async function startScanner() {
    if (
      starting ||
      active ||
      disabled
    ) {
      return
    }

    setStarting(true)
    setError("")

    try {
      const {
        Html5Qrcode,
      } = await import(
        "html5-qrcode"
      )

      const scanner =
        new Html5Qrcode(
          READER_ID,
        )

      scannerRef.current =
        scanner

      await scanner.start(
        {
          facingMode:
            "environment",
        },
        {
          fps: 10,

          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (
          decodedText,
        ) => {
          const value =
            decodedText
              .trim()
              .toUpperCase()

          if (!value) {
            return
          }

          await stopScanner()

          onDetected(
            value,
          )
        },
        () => {
          // Frames sem QR são esperados.
        },
      )

      setActive(true)
    } catch (error) {
      console.error(
        "Failed to start QR scanner:",
        error,
      )

      scannerRef.current =
        null

      setActive(false)

      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a câmara.",
      )
    } finally {
      setStarting(false)
    }
  }

  useEffect(() => {
    return () => {
      const scanner =
        scannerRef.current

      if (!scanner) {
        return
      }

      scanner
        .stop()
        .catch(() => null)
        .finally(() => {
          try {
            scanner.clear()
          } catch {
            // Ignorar limpeza no unmount.
          }
        })
    }
  }, [])

  return (
    <div className="space-y-4">
      <div
        id={READER_ID}
        className={[
          "overflow-hidden rounded-xl border bg-black",
          active
            ? "min-h-64"
            : "hidden",
        ].join(" ")}
      />

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!active ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={
            disabled ||
            starting
          }
          onClick={
            startScanner
          }
        >
          {starting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Camera className="mr-2 size-4" />
          )}

          {starting
            ? "A iniciar câmara..."
            : "Ler QR com câmara"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={
            stopScanner
          }
        >
          <CameraOff className="mr-2 size-4" />

          Fechar câmara
        </Button>
      )}
    </div>
  )
}
