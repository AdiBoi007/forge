import { type NextRequest, NextResponse } from "next/server"
import { getUser, normalizeGitHubUsername, hasGitHubToken, GitHubError } from "@/lib/github"

// Types for the validate endpoint
type ValidateRequest = {
  usernames: string[]
}

type ValidatedCandidate = {
  input: string
  username: string
  valid: true
  name: string | null
  avatar: string
  bio: string | null
  publicRepos: number
  followers: number
  createdAt: string
  updatedAt: string
  meta: {
    rateLimited: boolean
    usedToken: boolean
  }
}

type InvalidCandidate = {
  input: string
  username: string
  valid: false
  error: string
  meta: {
    rateLimited: boolean
    usedToken: boolean
  }
}

type CandidateResult = ValidatedCandidate | InvalidCandidate

type ValidateResponse = {
  success: boolean
  results: CandidateResult[]
  meta?: {
    total: number
    valid: number
    invalid: number
  }
}

const MAX_USERNAMES = 25

export async function POST(request: NextRequest): Promise<NextResponse<ValidateResponse>> {
  try {
    const body = (await request.json()) as ValidateRequest

    // Validate request
    if (!body.usernames || !Array.isArray(body.usernames)) {
      return NextResponse.json(
        {
          success: false,
          results: [],
          meta: { total: 0, valid: 0, invalid: 0 },
        },
        { status: 400 },
      )
    }

    // Filter out empty strings and limit to MAX_USERNAMES
    const usernames = body.usernames
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .filter((u) => u.length > 0)
      .slice(0, MAX_USERNAMES)

    if (usernames.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        meta: { total: 0, valid: 0, invalid: 0 },
      })
    }

    const usedToken = hasGitHubToken()
    const results: CandidateResult[] = []

    // Process each username
    for (const input of usernames) {
      const username = normalizeGitHubUsername(input)

      try {
        const user = await getUser(username)

        results.push({
          input,
          username: user.login,
          valid: true,
          name: user.name,
          avatar: user.avatar_url,
          bio: user.bio,
          publicRepos: user.public_repos,
          followers: user.followers,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          meta: {
            rateLimited: false,
            usedToken,
          },
        })
      } catch (error) {
        const isGitHubError = error instanceof GitHubError
        const errorMessage = isGitHubError ? error.message : "Unknown error"
        const rateLimited = isGitHubError ? error.rateLimited : false

        results.push({
          input,
          username,
          valid: false,
          error: errorMessage,
          meta: {
            rateLimited,
            usedToken,
          },
        })
      }
    }

    const validCount = results.filter((r) => r.valid).length

    return NextResponse.json({
      success: true,
      results,
      meta: {
        total: results.length,
        valid: validCount,
        invalid: results.length - validCount,
      },
    })
  } catch (error) {
    console.error("[validate] Error:", error)
    return NextResponse.json(
      {
        success: false,
        results: [],
        meta: { total: 0, valid: 0, invalid: 0 },
      },
      { status: 500 },
    )
  }
}

// Handle non-POST methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}

/*
 * HOW TO TEST:
 *
 * curl -X POST http://localhost:3000/api/candidates/validate \
 *   -H "Content-Type: application/json" \
 *   -d '{"usernames": ["vercel", "https://github.com/shadcn", "@invalid-user-xyz-123"]}'
 *
 * Expected output shape:
 * {
 *   "success": true,
 *   "results": [
 *     { "input": "vercel", "username": "vercel", "valid": true, "name": "Vercel", ... },
 *     { "input": "https://github.com/shadcn", "username": "shadcn", "valid": true, ... },
 *     { "input": "@invalid-user-xyz-123", "username": "invalid-user-xyz-123", "valid": false, "error": "User not found", ... }
 *   ],
 *   "meta": { "total": 3, "valid": 2, "invalid": 1 }
 * }
 */
