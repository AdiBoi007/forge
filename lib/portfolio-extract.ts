// FORGE - Portfolio Website Extraction
// =====================================
// Fetches and parses portfolio websites to extract structured information:
// - Projects with descriptions, tech stacks, and links
// - Skills mentioned with context
// - Testimonials/recommendations
// - Work history/experience
// - Contact info and social links
//
// Uses existing SSRF-safe url-fetch + deterministic keyword extraction
// with optional OpenAI enhancement for complex portfolios.

import { fetchUrlText } from "@/lib/url-fetch"
import type { ProofTier, EvidenceSource } from "@/lib/types"

export type PortfolioProject = {
  title: string
  description: string
  technologies: string[]
  url?: string
  imageCount: number
  hasLiveDemo: boolean
  hasCaseStudy: boolean
}

export type PortfolioTestimonial = {
  text: string
  author?: string
  company?: string
  role?: string
}

export type PortfolioWorkEntry = {
  company: string
  role: string
  duration?: string
  description?: string
}

export type PortfolioSkillMention = {
  skill: string
  context: string
  frequency: number
  hasProject: boolean
}

export type PortfolioExtraction = {
  url: string
  title?: string
  fetchedAt: string

  // Extracted content
  projects: PortfolioProject[]
  skills: PortfolioSkillMention[]
  testimonials: PortfolioTestimonial[]
  workHistory: PortfolioWorkEntry[]

  // Metadata
  hasAboutSection: boolean
  hasContactInfo: boolean
  socialLinks: { platform: string; url: string }[]

  // Quality signals
  contentLength: number
  projectCount: number
  testimonialCount: number
  overallQuality: "high" | "medium" | "low"

  // For verification
  proofTier: ProofTier
  reliability: number
  warnings: string[]
}

// Common tech/skill keywords to look for
const TECH_KEYWORDS = [
  // Frontend
  "react",
  "vue",
  "angular",
  "svelte",
  "next.js",
  "nextjs",
  "nuxt",
  "gatsby",
  "javascript",
  "typescript",
  "html",
  "css",
  "sass",
  "tailwind",
  "bootstrap",
  // Backend
  "node",
  "node.js",
  "express",
  "fastify",
  "python",
  "django",
  "flask",
  "fastapi",
  "ruby",
  "rails",
  "php",
  "laravel",
  "java",
  "spring",
  "go",
  "golang",
  "rust",
  "c#",
  ".net",
  "dotnet",
  // Databases
  "postgresql",
  "postgres",
  "mysql",
  "mongodb",
  "redis",
  "elasticsearch",
  "dynamodb",
  "firebase",
  "supabase",
  "prisma",
  "drizzle",
  // Cloud/DevOps
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "k8s",
  "terraform",
  "vercel",
  "netlify",
  "heroku",
  "ci/cd",
  "github actions",
  // Mobile
  "react native",
  "flutter",
  "swift",
  "kotlin",
  "ios",
  "android",
  // Design
  "figma",
  "sketch",
  "adobe xd",
  "photoshop",
  "illustrator",
  "ui/ux",
  "user research",
  "wireframing",
  "prototyping",
  // Data
  "machine learning",
  "ml",
  "ai",
  "data science",
  "pandas",
  "numpy",
  "tensorflow",
  "pytorch",
  "sql",
  "tableau",
  "power bi",
  // Other
  "graphql",
  "rest api",
  "microservices",
  "agile",
  "scrum",
  "git",
]

// Patterns to identify project sections
const PROJECT_PATTERNS = [
  /project[s]?/i,
  /work[s]?/i,
  /portfolio/i,
  /case stud(y|ies)/i,
  /built/i,
  /created/i,
  /developed/i,
]

// Patterns to identify testimonials
const TESTIMONIAL_PATTERNS = [
  /testimonial[s]?/i,
  /recommendation[s]?/i,
  /what .* say/i,
  /client[s]? say/i,
  /feedback/i,
  /"[^"]{50,}"/g, // Long quoted text
  /—\s*[A-Z][a-z]+/g, // Attribution pattern
]

// Social platform patterns
const SOCIAL_PATTERNS: { platform: string; pattern: RegExp }[] = [
  { platform: "github", pattern: /github\.com\/[\w-]+/i },
  { platform: "linkedin", pattern: /linkedin\.com\/in\/[\w-]+/i },
  { platform: "twitter", pattern: /twitter\.com\/[\w-]+|x\.com\/[\w-]+/i },
  { platform: "dribbble", pattern: /dribbble\.com\/[\w-]+/i },
  { platform: "behance", pattern: /behance\.net\/[\w-]+/i },
  { platform: "medium", pattern: /medium\.com\/@?[\w-]+/i },
  { platform: "dev.to", pattern: /dev\.to\/[\w-]+/i },
]

function extractProjects(text: string): PortfolioProject[] {
  const projects: PortfolioProject[] = []
  const lines = text.split(/[.\n]/)

  // Look for project-like content
  const projectIndicators = [
    /built\s+(?:a\s+)?(.+?)(?:using|with|for)/i,
    /created\s+(?:a\s+)?(.+?)(?:using|with|for)/i,
    /developed\s+(?:a\s+)?(.+?)(?:using|with|for)/i,
    /(?:project|app|application|website|platform|tool|system):\s*(.+)/i,
  ]

  for (const line of lines) {
    for (const pattern of projectIndicators) {
      const match = line.match(pattern)
      if (match) {
        const title = match[1]?.trim().slice(0, 100) || "Unnamed Project"

        // Extract technologies mentioned in same line
        const techs = TECH_KEYWORDS.filter((tech) => line.toLowerCase().includes(tech.toLowerCase()))

        // Check for demo/case study indicators
        const hasDemo = /demo|live|view|visit|try/i.test(line)
        const hasCaseStudy = /case study|read more|learn more|details/i.test(line)

        // Avoid duplicates
        if (!projects.some((p) => p.title.toLowerCase() === title.toLowerCase())) {
          projects.push({
            title,
            description: line.trim().slice(0, 300),
            technologies: techs.slice(0, 8),
            hasLiveDemo: hasDemo,
            hasCaseStudy: hasCaseStudy,
            imageCount: 0, // Can't detect from text
          })
        }
      }
    }
  }

  // Also look for repeated tech mentions as implicit projects
  const techMentions = new Map<string, number>()
  for (const tech of TECH_KEYWORDS) {
    const regex = new RegExp(`\\b${tech}\\b`, "gi")
    const matches = text.match(regex)
    if (matches && matches.length >= 2) {
      techMentions.set(tech, matches.length)
    }
  }

  return projects.slice(0, 10) // Limit to 10 projects
}

function extractSkillMentions(text: string, projects: PortfolioProject[]): PortfolioSkillMention[] {
  const mentions: PortfolioSkillMention[] = []
  const textLower = text.toLowerCase()

  for (const tech of TECH_KEYWORDS) {
    const regex = new RegExp(`\\b${tech}\\b`, "gi")
    const matches = text.match(regex)

    if (matches && matches.length >= 1) {
      // Find context around the mention
      const idx = textLower.indexOf(tech.toLowerCase())
      const contextStart = Math.max(0, idx - 50)
      const contextEnd = Math.min(text.length, idx + tech.length + 100)
      const context = text.slice(contextStart, contextEnd).trim()

      // Check if this skill appears in any project
      const hasProject = projects.some((p) => p.technologies.some((t) => t.toLowerCase() === tech.toLowerCase()))

      mentions.push({
        skill: tech,
        context: context.slice(0, 150),
        frequency: matches.length,
        hasProject,
      })
    }
  }

  // Sort by frequency
  return mentions.sort((a, b) => b.frequency - a.frequency).slice(0, 15)
}

function extractTestimonials(text: string): PortfolioTestimonial[] {
  const testimonials: PortfolioTestimonial[] = []

  // Look for quoted text that's substantial
  const quotePattern = /"([^"]{50,500})"/g
  let match
  while ((match = quotePattern.exec(text)) !== null) {
    const quoteText = match[1]

    // Look for attribution nearby
    const afterQuote = text.slice(match.index + match[0].length, match.index + match[0].length + 100)
    const attrMatch = afterQuote.match(/—\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)

    testimonials.push({
      text: quoteText,
      author: attrMatch?.[1] || undefined,
    })
  }

  // Also look for testimonial section content
  const testimonialSectionMatch = text.match(/testimonials?[:\s]*(.{100,1000}?)(?:contact|footer|copyright)/i)
  if (testimonialSectionMatch) {
    const sectionText = testimonialSectionMatch[1]
    // This section likely contains testimonials even if not quoted
    if (sectionText.length > 100 && testimonials.length === 0) {
      testimonials.push({
        text: sectionText.slice(0, 300).trim(),
      })
    }
  }

  return testimonials.slice(0, 5)
}

function extractWorkHistory(text: string): PortfolioWorkEntry[] {
  const entries: PortfolioWorkEntry[] = []

  // Common patterns for work history
  const patterns = [
    /(?:worked|employed|engineer|developer|designer|manager)\s+(?:at|for)\s+([A-Z][a-zA-Z\s&]+?)(?:\s+as|\s+for|\s*[,.\n])/g,
    /([A-Z][a-zA-Z\s&]+?)\s*[-–—]\s*((?:Senior\s+|Junior\s+|Lead\s+)?(?:Engineer|Developer|Designer|Manager|Director|VP|CEO|CTO|Founder))/g,
    /(?:experience|career|background)[:\s]*(.{50,500}?)(?:education|skills|projects)/i,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const company = match[1]?.trim()
      const role = match[2]?.trim()

      if (company && company.length > 2 && company.length < 50) {
        if (!entries.some((e) => e.company.toLowerCase() === company.toLowerCase())) {
          entries.push({
            company,
            role: role || "Unknown Role",
          })
        }
      }
    }
  }

  return entries.slice(0, 8)
}

function extractSocialLinks(text: string): { platform: string; url: string }[] {
  const links: { platform: string; url: string }[] = []

  for (const { platform, pattern } of SOCIAL_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      let url = match[0]
      if (!url.startsWith("http")) {
        url = "https://" + url
      }
      links.push({ platform, url })
    }
  }

  return links
}

function assessQuality(extraction: Partial<PortfolioExtraction>): "high" | "medium" | "low" {
  let score = 0

  if ((extraction.projects?.length || 0) >= 3) score += 3
  else if ((extraction.projects?.length || 0) >= 1) score += 1

  if ((extraction.skills?.length || 0) >= 5) score += 2
  else if ((extraction.skills?.length || 0) >= 2) score += 1

  if ((extraction.testimonials?.length || 0) >= 1) score += 2

  if ((extraction.workHistory?.length || 0) >= 1) score += 1

  if ((extraction.contentLength || 0) >= 2000) score += 1

  if (extraction.socialLinks?.some((l) => l.platform === "github")) score += 1

  if (score >= 7) return "high"
  if (score >= 4) return "medium"
  return "low"
}

export async function extractPortfolio(url: string): Promise<PortfolioExtraction> {
  const result = await fetchUrlText(url)

  if (!result.ok) {
    return {
      url,
      fetchedAt: new Date().toISOString(),
      projects: [],
      skills: [],
      testimonials: [],
      workHistory: [],
      hasAboutSection: false,
      hasContactInfo: false,
      socialLinks: [],
      contentLength: 0,
      projectCount: 0,
      testimonialCount: 0,
      overallQuality: "low",
      proofTier: "claim_only",
      reliability: 0.1,
      warnings: [`Failed to fetch: ${result.error}`],
    }
  }

  const text = result.text
  const warnings: string[] = []

  // Extract all components
  const projects = extractProjects(text)
  const skills = extractSkillMentions(text, projects)
  const testimonials = extractTestimonials(text)
  const workHistory = extractWorkHistory(text)
  const socialLinks = extractSocialLinks(text)

  // Check for common sections
  const hasAboutSection = /about\s*(me|us)?/i.test(text)
  const hasContactInfo = /contact|email|@|phone/i.test(text)

  // Quality assessment
  const extraction: Partial<PortfolioExtraction> = {
    projects,
    skills,
    testimonials,
    workHistory,
    socialLinks,
    contentLength: text.length,
  }

  const quality = assessQuality(extraction)

  // Determine proof tier based on content
  let proofTier: ProofTier = "claim_only"
  let reliability = 0.2

  if (projects.length >= 2 && projects.some((p) => p.hasLiveDemo || p.hasCaseStudy)) {
    proofTier = "linked_artifact"
    reliability = 0.7
  } else if (projects.length >= 1 || skills.filter((s) => s.hasProject).length >= 2) {
    proofTier = "third_party"
    reliability = 0.5
  }

  if (testimonials.length >= 1) {
    reliability = Math.min(1, reliability + 0.1)
  }

  // Warnings
  if (text.length < 500) {
    warnings.push("Very short portfolio - limited content to analyze")
  }
  if (projects.length === 0) {
    warnings.push("No projects detected - consider adding project descriptions")
  }
  if (!socialLinks.some((l) => l.platform === "github")) {
    warnings.push("No GitHub link found - adding one would improve verification")
  }

  return {
    url,
    title: result.title,
    fetchedAt: new Date().toISOString(),
    projects,
    skills,
    testimonials,
    workHistory,
    hasAboutSection,
    hasContactInfo,
    socialLinks,
    contentLength: text.length,
    projectCount: projects.length,
    testimonialCount: testimonials.length,
    overallQuality: quality,
    proofTier,
    reliability,
    warnings,
  }
}

// Merge portfolio extraction into verification evidence
export function portfolioToEvidence(extraction: PortfolioExtraction): Array<{
  skill: string
  source: EvidenceSource
  proofTier: ProofTier
  reliability: number
  description: string
  url?: string
}> {
  const evidence: Array<{
    skill: string
    source: EvidenceSource
    proofTier: ProofTier
    reliability: number
    description: string
    url?: string
  }> = []

  // Add project-backed skills
  for (const project of extraction.projects) {
    for (const tech of project.technologies) {
      evidence.push({
        skill: tech,
        source: "portfolio",
        proofTier: project.hasCaseStudy ? "linked_artifact" : "third_party",
        reliability: project.hasCaseStudy ? 0.7 : 0.5,
        description: `Used in project: ${project.title}`,
        url: extraction.url,
      })
    }
  }

  // Add frequently mentioned skills without projects (weaker evidence)
  for (const mention of extraction.skills) {
    if (!mention.hasProject && mention.frequency >= 2) {
      evidence.push({
        skill: mention.skill,
        source: "portfolio",
        proofTier: "claim_only",
        reliability: 0.2,
        description: `Mentioned ${mention.frequency}x: "${mention.context.slice(0, 80)}..."`,
        url: extraction.url,
      })
    }
  }

  return evidence
}

export function extractFromHtml(html: string, url: string): PortfolioExtraction {
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const warnings: string[] = []

  // Extract title from HTML
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch?.[1]?.trim()

  // Extract all components
  const projects = extractProjects(text)
  const skills = extractSkillMentions(text, projects)
  const testimonials = extractTestimonials(text)
  const workHistory = extractWorkHistory(text)
  const socialLinks = extractSocialLinks(html) // Use raw HTML for URLs

  // Check for common sections
  const hasAboutSection = /about\s*(me|us)?/i.test(text)
  const hasContactInfo = /contact|email|@|phone/i.test(text)

  // Quality assessment
  const extraction: Partial<PortfolioExtraction> = {
    projects,
    skills,
    testimonials,
    workHistory,
    socialLinks,
    contentLength: text.length,
  }

  const quality = assessQuality(extraction)

  // Determine proof tier based on content
  let proofTier: ProofTier = "claim_only"
  let reliability = 0.2

  if (projects.length >= 2 && projects.some((p) => p.hasLiveDemo || p.hasCaseStudy)) {
    proofTier = "linked_artifact"
    reliability = 0.7
  } else if (projects.length >= 1 || skills.filter((s) => s.hasProject).length >= 2) {
    proofTier = "third_party"
    reliability = 0.5
  }

  if (testimonials.length >= 1) {
    reliability = Math.min(1, reliability + 0.1)
  }

  // Warnings
  if (text.length < 500) {
    warnings.push("Very short portfolio - limited content to analyze")
  }
  if (projects.length === 0) {
    warnings.push("No projects detected - consider adding project descriptions")
  }
  if (!socialLinks.some((l) => l.platform === "github")) {
    warnings.push("No GitHub link found - adding one would improve verification")
  }

  return {
    url,
    title,
    fetchedAt: new Date().toISOString(),
    projects,
    skills,
    testimonials,
    workHistory,
    hasAboutSection,
    hasContactInfo,
    socialLinks,
    contentLength: text.length,
    projectCount: projects.length,
    testimonialCount: testimonials.length,
    overallQuality: quality,
    proofTier,
    reliability,
    warnings,
  }
}
