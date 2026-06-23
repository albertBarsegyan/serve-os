export function parseSetCookie(raw: string) {
  const [nameValue, ...attrs] = raw.split('; ')
  const eqIdx = nameValue.indexOf('=')
  const name = nameValue.slice(0, eqIdx)
  const value = nameValue.slice(eqIdx + 1)

  const opts: Record<string, string | boolean> = {}
  for (const attr of attrs) {
    const eqIdx = attr.indexOf('=')
    if (eqIdx === -1) {
      opts[attr.toLowerCase()] = true
    } else {
      opts[attr.slice(0, eqIdx).toLowerCase()] = attr.slice(eqIdx + 1)
    }
  }

  return { name, value, opts }
}

export function getCookieValue({
  cookieData,
  cookieName,
}: {
  cookieName: string
  cookieData: string | null | undefined
}): string | null {
  if (!cookieData) return null

  const len = cookieData.length
  let i = 0

  while (i < len) {
    // skip leading spaces
    while (i < len && cookieData[i] === ' ') i++

    const keyStart = i
    while (i < len && cookieData[i] !== '=') i++
    const key = cookieData.slice(keyStart, i)

    i++ // skip '='

    const valueStart = i
    while (i < len && cookieData[i] !== ';') i++
    const value = cookieData.slice(valueStart, i)

    if (key === cookieName) return value

    i++ // skip ';'
  }

  return null
}
