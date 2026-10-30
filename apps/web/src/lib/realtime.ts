import {
  io,
  type Socket,
} from "socket.io-client"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:3001/api"

const REALTIME_URL =
  API_URL.replace(/\/api\/?$/, "")

export function createRealtimeSocket(
  token: string,
): Socket {
  return io(
    `${REALTIME_URL}/realtime`,
    {
      auth: {
        token,
      },

      transports: [
        "websocket",
        "polling",
      ],
    },
  )
}
