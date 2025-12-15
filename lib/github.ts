// GitHub REST API client for FORGE
// Handles user validation, repo fetching, and rate limit handling

export type GitHubUser = {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  created_at: string
  updated_at: string
  type?: "User" | "Organization"
}

export type GitHubRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  fork: boolean
  stargazers_count: number
  forks_count: number
  language: string | null
  pushed_at: string
  created_at: string
  updated_at: string
  owner: { login: string }
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    public rateLimited = false,
  ) {
    super(message)
    this.name = "GitHubError"
  }
}

/**
 * Normalize GitHub username from various input formats
 * Accepts: username, @username, github.com/username, https://github.com/username
 * Remove spaces and invalid characters from usernames
 */
export function normalizeGitHubUsername(input: string): string {
  let cleaned = input.trim()

  // Remove @ prefix
  if (cleaned.startsWith("@")) {
    cleaned = cleaned.slice(1)
  }

  // Handle full URLs: https://github.com/username or github.com/username
  const urlPatterns = [/^https?:\/\/github\.com\/([^/\s]+)\/?.*$/i, /^github\.com\/([^/\s]+)\/?.*$/i]

  for (const pattern of urlPatterns) {
    const match = cleaned.match(pattern)
    if (match && match[1]) {
      cleaned = match[1]
      break
    }
  }

  // Remove any trailing slashes or paths
  cleaned = cleaned.split("/")[0]

  cleaned = cleaned.replace(/\s+/g, "")

  // GitHub usernames can only contain alphanumeric characters and hyphens
  cleaned = cleaned.replace(/[^a-zA-Z0-9-]/g, "")

  cleaned = cleaned.replace(/^-+|-+$/g, "")

  // Final cleanup
  return cleaned.trim().toLowerCase()
}

/**
 * Validate if a string is a valid GitHub username format
 */
export function isValidGitHubUsername(username: string): boolean {
  // GitHub username rules:
  // - 1-39 characters
  // - Alphanumeric or hyphen
  // - Cannot start or end with hyphen
  // - Cannot have consecutive hyphens
  if (!username || username.length === 0 || username.length > 39) {
    return false
  }
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)
}

/**
 * Check if GITHUB_TOKEN is configured
 */
export function hasGitHubToken(): boolean {
  return !!process.env.GITHUB_TOKEN
}

/**
 * Build headers for GitHub API requests
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

/**
 * Fetch a GitHub user by username
 */
export async function getUser(username: string): Promise<GitHubUser> {
  const normalizedUsername = normalizeGitHubUsername(username)

  if (!normalizedUsername || !isValidGitHubUsername(normalizedUsername)) {
    throw new GitHubError("Invalid username", 400)
  }

  const response = await fetch(`https://api.github.com/users/${normalizedUsername}`, { headers: getHeaders() })

  if (!response.ok) {
    if (response.status === 404) {
      throw new GitHubError("User not found", 404)
    }

    if (response.status === 403) {
      const remaining = response.headers.get("x-ratelimit-remaining")
      if (remaining === "0") {
        const resetTime = response.headers.get("x-ratelimit-reset")
        const resetDate = resetTime ? new Date(Number.parseInt(resetTime) * 1000) : null
        const resetMessage = resetDate ? ` Rate limit resets at ${resetDate.toISOString()}` : ""
        throw new GitHubError(
          `GitHub API rate limit exceeded.${resetMessage} Consider adding a GITHUB_TOKEN.`,
          403,
          true,
        )
      }
    }

    throw new GitHubError(`GitHub API error: ${response.statusText}`, response.status)
  }

  const data = await response.json()

  if (data.type === "Organization") {
    throw new GitHubError("Cannot analyze GitHub organizations. Please provide a user account.", 400)
  }

  return {
    login: data.login,
    name: data.name,
    avatar_url: data.avatar_url,
    bio: data.bio,
    public_repos: data.public_repos,
    followers: data.followers,
    created_at: data.created_at,
    updated_at: data.updated_at,
    type: data.type,
  }
}

/**
 * Fetch repositories for a GitHub user
 */
export async function getRepos(username: string): Promise<GitHubRepo[]> {
  const normalizedUsername = normalizeGitHubUsername(username)

  if (!normalizedUsername || !isValidGitHubUsername(normalizedUsername)) {
    throw new GitHubError("Invalid username", 400)
  }

  const response = await fetch(`https://api.github.com/users/${normalizedUsername}/repos?per_page=100&sort=pushed`, {
    headers: getHeaders(),
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new GitHubError("User not found", 404)
    }

    if (response.status === 403) {
      const remaining = response.headers.get("x-ratelimit-remaining")
      if (remaining === "0") {
        throw new GitHubError("GitHub API rate limit exceeded. Consider adding a GITHUB_TOKEN.", 403, true)
      }
    }

    throw new GitHubError(`GitHub API error: ${response.statusText}`, response.status)
  }

  const data = await response.json()

  return data.map((repo: Record<string, unknown>) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    description: repo.description,
    fork: repo.fork,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    language: repo.language,
    pushed_at: repo.pushed_at,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    owner: { login: (repo.owner as { login: string }).login },
  }))
}
