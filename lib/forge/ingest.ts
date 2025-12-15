import { type ArtifactChunk, chunkText } from "./core"
import { getUser, getRepos, normalizeGitHubUsername } from "../github"

const GITHUB_CACHE = new Map<string, { chunks: ArtifactChunk[]; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export async function ingestGitHub(githubInput: string): Promise<ArtifactChunk[]> {
  const username = normalizeGitHubUsername(githubInput)
  if (!username) return []

  // Check cache
  const cached = GITHUB_CACHE.get(username)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.chunks
  }

  try {
    const [user, repos] = await Promise.all([getUser(username), getRepos(username)])

    const chunks: ArtifactChunk[] = []

    // User profile chunk
    if (user) {
      const profileText = [
        `GitHub Profile: ${user.login}`,
        user.name ? `Name: ${user.name}` : "",
        user.bio ? `Bio: ${user.bio}` : "",
        user.company ? `Company: ${user.company}` : "",
        user.location ? `Location: ${user.location}` : "",
        `Public repos: ${user.public_repos}`,
        `Followers: ${user.followers}`,
        `Following: ${user.following}`,
        user.blog ? `Website: ${user.blog}` : "",
      ]
        .filter(Boolean)
        .join("\n")

      chunks.push({
        id: `github-profile-${username}`,
        source: "github",
        url: `https://github.com/${username}`,
        text: profileText,
      })
    }

    // Repo chunks (top 10 by stars, then by recent update)
    const sortedRepos = repos
      .filter((r: any) => !r.fork)
      .sort((a: any, b: any) => {
        const starDiff = (b.stargazers_count || 0) - (a.stargazers_count || 0)
        if (starDiff !== 0) return starDiff
        return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      })
      .slice(0, 10)

    for (const repo of sortedRepos) {
      const repoText = [
        `Repository: ${repo.name}`,
        repo.description ? `Description: ${repo.description}` : "",
        repo.language ? `Primary language: ${repo.language}` : "",
        `Stars: ${repo.stargazers_count || 0}`,
        `Forks: ${repo.forks_count || 0}`,
        `Last updated: ${repo.updated_at}`,
        repo.topics?.length ? `Topics: ${repo.topics.join(", ")}` : "",
        `URL: ${repo.html_url}`,
      ]
        .filter(Boolean)
        .join("\n")

      chunks.push({
        id: `github-repo-${repo.name}`,
        source: "github",
        url: repo.html_url,
        text: repoText,
      })
    }

    // Cache result
    GITHUB_CACHE.set(username, { chunks, timestamp: Date.now() })
    return chunks
  } catch (error) {
    console.error(`[FORGE Ingest] GitHub error for ${username}:`, error)
    return []
  }
}

export function ingestResume(resumeText: string): ArtifactChunk[] {
  if (!resumeText || resumeText.trim().length < 50) return []
  return chunkText(resumeText, "resume")
}

export function ingestPortfolio(portfolioText: string, url?: string): ArtifactChunk[] {
  if (!portfolioText || portfolioText.trim().length < 50) return []
  return chunkText(portfolioText, "portfolio", url)
}

export function ingestWriting(writingText: string, url?: string): ArtifactChunk[] {
  if (!writingText || writingText.trim().length < 50) return []
  return chunkText(writingText, "writing", url)
}

export async function ingestAllSources(args: {
  resumeText?: string
  githubUsername?: string
  portfolioText?: string
  portfolioUrl?: string
  writingText?: string
  writingUrl?: string
}): Promise<ArtifactChunk[]> {
  const chunks: ArtifactChunk[] = []

  // Resume
  if (args.resumeText) {
    chunks.push(...ingestResume(args.resumeText))
  }

  // GitHub
  if (args.githubUsername) {
    const githubChunks = await ingestGitHub(args.githubUsername)
    chunks.push(...githubChunks)
  }

  // Portfolio
  if (args.portfolioText) {
    chunks.push(...ingestPortfolio(args.portfolioText, args.portfolioUrl))
  }

  // Writing
  if (args.writingText) {
    chunks.push(...ingestWriting(args.writingText, args.writingUrl))
  }

  return chunks
}
