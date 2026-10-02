"use client"

import {
  useMemo,
  useSyncExternalStore,
} from "react"

import {
  getStoredUser,
  getToken,
} from "@/lib/auth"

export type AuthSessionUser = {
  id: string
  name: string
  email: string
  role: string
}

type AuthSession = {
  token: string | null
  user: AuthSessionUser | null
}

const SERVER_SNAPSHOT = ""

function subscribe(
  callback: () => void,
) {
  window.addEventListener(
    "storage",
    callback,
  )

  window.addEventListener(
    "ngena-auth-change",
    callback,
  )

  return () => {
    window.removeEventListener(
      "storage",
      callback,
    )

    window.removeEventListener(
      "ngena-auth-change",
      callback,
    )
  }
}

function getSnapshot() {
  return JSON.stringify({
    token: getToken(),
    user: getStoredUser(),
  })
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT
}

export function useAuthSession(): AuthSession {
  const snapshot =
    useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot,
    )

  return useMemo(() => {
    if (!snapshot) {
      return {
        token: null,
        user: null,
      }
    }

    try {
      const parsed =
        JSON.parse(
          snapshot,
        ) as AuthSession

      return {
        token:
          parsed.token ??
          null,

        user:
          parsed.user ??
          null,
      }
    } catch {
      return {
        token: null,
        user: null,
      }
    }
  }, [snapshot])
}
