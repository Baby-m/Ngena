const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

type ApiOptions = RequestInit & {
  token?: string
}

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...headers,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data?.message instanceof Array
        ? data.message.join(", ")
        : data?.message ?? "Ocorreu um erro inesperado"

    throw new Error(message)
  }

  return data as T
}
