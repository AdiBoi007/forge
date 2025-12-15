// FORGE - Server-side link verification (bypasses CORS)
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({
        reachable: false,
        error: "Invalid URL format",
        statusCode: 0,
      })
    }

    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      // Use HEAD request first (faster), fallback to GET
      let response: Response
      try {
        response = await fetch(url, {
          method: "HEAD",
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; FORGE-LinkVerifier/1.0)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          redirect: "follow",
        })
      } catch {
        // Some servers don't support HEAD, try GET
        response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; FORGE-LinkVerifier/1.0)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          redirect: "follow",
        })
      }

      clearTimeout(timeoutId)
      const responseTimeMs = Date.now() - startTime

      let title: string | undefined
      let description: string | undefined

      // Only try to extract title/description for successful HTML responses
      if (response.ok) {
        const contentType = response.headers.get("content-type") || ""
        if (contentType.includes("text/html") && response.body) {
          try {
            const html = await response.text()

            // Extract title
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
            if (titleMatch?.[1]) {
              title = titleMatch[1].trim().substring(0, 200)
            } else {
              const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
              if (ogTitleMatch?.[1]) {
                title = ogTitleMatch[1].trim().substring(0, 200)
              }
            }

            // Extract description
            const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
            if (metaMatch?.[1]) {
              description = metaMatch[1].trim().substring(0, 300)
            } else {
              const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
              if (ogDescMatch?.[1]) {
                description = ogDescMatch[1].trim().substring(0, 300)
              }
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }

      return NextResponse.json({
        reachable: response.ok,
        statusCode: response.status,
        title,
        description,
        responseTimeMs,
      })
    } catch (error) {
      const responseTimeMs = Date.now() - startTime
      const message = error instanceof Error ? error.message : "Failed to fetch"

      // Provide more helpful error messages
      let friendlyError = message
      if (message.includes("abort")) {
        friendlyError = "Request timed out (8s)"
      } else if (message.includes("ENOTFOUND") || message.includes("getaddrinfo")) {
        friendlyError = "Domain not found"
      } else if (message.includes("ECONNREFUSED")) {
        friendlyError = "Connection refused"
      } else if (message.includes("certificate")) {
        friendlyError = "SSL certificate error"
      }

      return NextResponse.json({
        reachable: false,
        error: friendlyError,
        responseTimeMs,
      })
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 })
  }
}
