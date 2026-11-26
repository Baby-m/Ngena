// Aceita apenas caminhos internos do site (por exemplo /invite/abc).
// Qualquer outra coisa (outro dominio, //site.com, javascript:) cai no destino por omissao.
export function safeNextPath(
  value: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!value) {
    return fallback
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback
  }

  try {
    const url = new URL(value, "http://ngena.local")

    if (url.origin !== "http://ngena.local") {
      return fallback
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
