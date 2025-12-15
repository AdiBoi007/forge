// FORGE - Link Verifier
// Checks portfolio/writing links reachability + extracts titles automatically

export interface LinkVerificationResult {
  url: string
  reachable: boolean
  statusCode?: number
  title?: string
  description?: string
  type: "portfolio" | "writing" | "github" | "linkedin" | "other"
  error?: string
  checkedAt: string
  responseTimeMs?: number
}

export interface VerificationSummary {
  total: number
  reachable: number
  unreachable: number
  results: LinkVerificationResult[]
}

// Detect link type from URL
function detectLinkType(url: string): LinkVerificationResult["type"] {
  const lower = url.toLowerCase()
  if (lower.includes("github.com")) return "github"
  if (lower.includes("linkedin.com")) return "linkedin"
  if (
    lower.includes("medium.com") ||
    lower.includes("dev.to") ||
    lower.includes("hashnode") ||
    lower.includes("substack") ||
    lower.includes("blog")
  )
    return "writing"
  if (
    lower.includes("dribbble") ||
    lower.includes("behance") ||
    lower.includes("figma.com") ||
    lower.includes("portfolio") ||
    lower.includes("notion.site")
  )
    return "portfolio"
  return "other"
}

// Extract title from HTML (simple regex, no heavy parsing)
function extractTitleFromHTML(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim().substring(0, 200)
  }

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
  if (ogTitleMatch && ogTitleMatch[1]) {
    return ogTitleMatch[1].trim().substring(0, 200)
  }

  return undefined
}

// Extract description from HTML
function extractDescriptionFromHTML(html: string): string | undefined {
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  if (metaMatch && metaMatch[1]) {
    return metaMatch[1].trim().substring(0, 300)
  }

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
  if (ogDescMatch && ogDescMatch[1]) {
    return ogDescMatch[1].trim().substring(0, 300)
  }

  return undefined
}

// Verify a single link
export async function verifyLink(url: string): Promise<LinkVerificationResult> {
  const type = detectLinkType(url)

  // Basic URL validation
  try {
    new URL(url)
  } catch {
    return {
      url,
      reachable: false,
      type,
      error: "Invalid URL format",
      checkedAt: new Date().toISOString(),
    }
  }

  try {
    // Call our server-side API to bypass CORS
    const response = await fetch("/api/verify-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })

    const data = await response.json()

    return {
      url,
      reachable: data.reachable ?? false,
      statusCode: data.statusCode,
      title: data.title,
      description: data.description,
      type,
      error: data.error,
      checkedAt: new Date().toISOString(),
      responseTimeMs: data.responseTimeMs,
    }
  } catch (error) {
    return {
      url,
      reachable: false,
      type,
      error: error instanceof Error ? error.message : "Verification failed",
      checkedAt: new Date().toISOString(),
    }
  }
}

// Verify multiple links
export async function verifyLinks(urls: string[]): Promise<VerificationSummary> {
  const results = await Promise.all(urls.map(verifyLink))

  return {
    total: results.length,
    reachable: results.filter((r) => r.reachable).length,
    unreachable: results.filter((r) => !r.reachable).length,
    results,
  }
}

// Extract links from candidate input
export function extractLinksFromCandidate(candidate: {
  signals?: {
    portfolioUrls?: string[]
    writingUrls?: string[]
    linkedinUrl?: string
  }
  evidence?: Array<{ url: string }>
}): string[] {
  const links: string[] = []

  if (candidate.signals?.portfolioUrls) {
    links.push(...candidate.signals.portfolioUrls)
  }
  if (candidate.signals?.writingUrls) {
    links.push(...candidate.signals.writingUrls)
  }
  if (candidate.signals?.linkedinUrl) {
    links.push(candidate.signals.linkedinUrl)
  }
  if (candidate.evidence) {
    candidate.evidence.forEach((e) => {
      if (e.url && !links.includes(e.url)) {
        links.push(e.url)
      }
    })
  }

  return [...new Set(links)] // Dedupe
}
