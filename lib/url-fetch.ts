// Safe URL Fetch with SSRF Hardening
// ============================================

export type FetchResult = { ok: true; text: string; title?: string } | { ok: false; error: string }

const TIMEOUT_MS = 3000
const MAX_CONTENT_LENGTH = 200_000
const MAX_REDIRECTS = 3

const PRIVATE_IP_RANGES = [
  /^127\./, // 127.0.0.0/8 loopback
  /^0\./, // 0.0.0.0/8
  /^10\./, // 10.0.0.0/8 private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 private
  /^192\.168\./, // 192.168.0.0/16 private
  /^169\.254\./, // 169.254.0.0/16 link-local
  /^::1$/, // IPv6 loopback
  /^fc00:/i, // IPv6 private
  /^fe80:/i, // IPv6 link-local
]

const BLOCKED_HOSTNAMES = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]

const BLOCKED_HOSTNAME_SUFFIXES = [".local", ".internal", ".localhost", ".localdomain"]

const ALLOWED_CONTENT_TYPES = ["text/html", "text/plain", "application/xhtml+xml"]

function isPrivateHost(hostname: string): boolean {
  // Check blocked hostnames
  const lowerHost = hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.includes(lowerHost)) {
    return true
  }

  // Check blocked suffixes
  for (const suffix of BLOCKED_HOSTNAME_SUFFIXES) {
    if (lowerHost.endsWith(suffix)) {
      return true
    }
  }

  // Check if it's an IP literal in private range
  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(hostname)) {
      return true
    }
  }

  // Check IPv6 bracket notation
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    const ipv6 = hostname.slice(1, -1)
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(ipv6)) {
        return true
      }
    }
  }

  return false
}

function validateUrl(url: string): { valid: true; parsed: URL } | { valid: false; error: string } {
  // Empty check
  if (!url || typeof url !== "string") {
    return { valid: false, error: "Empty URL" }
  }

  // Parse URL
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }

  // Protocol check - only HTTPS preferred, HTTP allowed
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, error: "Only HTTP/HTTPS URLs allowed" }
  }

  // Reject URLs with credentials
  if (parsed.username || parsed.password) {
    return { valid: false, error: "URLs with credentials not allowed" }
  }

  // Reject private/internal hosts
  if (isPrivateHost(parsed.hostname)) {
    return { valid: false, error: "Blocked for safety: private network host" }
  }

  // Reject non-standard ports for common internal services
  const port = parsed.port ? Number.parseInt(parsed.port) : parsed.protocol === "https:" ? 443 : 80
  const suspiciousPorts = [22, 23, 25, 110, 143, 445, 3306, 5432, 6379, 27017]
  if (suspiciousPorts.includes(port)) {
    return { valid: false, error: "Blocked for safety: suspicious port" }
  }

  return { valid: true, parsed }
}

function isAllowedContentType(contentType: string | null): boolean {
  if (!contentType) return false
  const lowerType = contentType.toLowerCase().split(";")[0].trim()
  return ALLOWED_CONTENT_TYPES.some((allowed) => lowerType === allowed || lowerType.startsWith(allowed))
}

export async function fetchUrlText(url: string): Promise<FetchResult> {
  const validation = validateUrl(url)
  if (!validation.valid) {
    return { ok: false, error: validation.error }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "FORGE-Bot/1.0 (candidate-analysis)",
        Accept: "text/html,application/xhtml+xml,text/plain",
      },
      redirect: "follow",
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` }
    }

    const contentType = response.headers.get("content-type")
    if (!isAllowedContentType(contentType)) {
      return { ok: false, error: `Blocked content type: ${contentType || "unknown"}` }
    }

    const finalUrl = response.url
    if (finalUrl && finalUrl !== url) {
      const finalValidation = validateUrl(finalUrl)
      if (!finalValidation.valid) {
        return { ok: false, error: `Redirect to blocked URL: ${finalValidation.error}` }
      }
    }
    // If finalUrl is empty, we still got a valid response so continue

    const contentLength = response.headers.get("content-length")
    if (contentLength && Number.parseInt(contentLength) > MAX_CONTENT_LENGTH) {
      return { ok: false, error: "Content too large" }
    }

    const html = await response.text()
    if (html.length > MAX_CONTENT_LENGTH) {
      return { ok: false, error: "Content too large" }
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : undefined

    // Strip scripts, styles, and HTML tags to get visible text
    const text = htmlToText(html)

    return { ok: true, text, title }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { ok: false, error: "Request timeout" }
      }
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "Unknown fetch error" }
  }
}

function htmlToText(html: string): string {
  // Remove scripts
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  // Remove styles
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "")
  // Remove tags but keep content
  text = text.replace(/<[^>]+>/g, " ")
  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim()
  // Truncate to reasonable length
  return text.slice(0, 50000)
}

export { validateUrl, isPrivateHost }
