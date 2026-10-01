const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001/api"

type ApiOptions = RequestInit & {
  token?: string
}

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options

  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  } catch {
    throw new Error(
      "Não foi possível ligar à API. Confirma se o backend está a correr na porta 3001.",
    )
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data?.message instanceof Array
        ? data.message.join(", ")
        : data?.message ?? `Pedido falhou (${response.status})`

    throw new Error(message)
  }

  return data as T
}
