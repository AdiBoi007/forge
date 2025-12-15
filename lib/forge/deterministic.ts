import type { JobSpec, Requirement } from "./core"
import { SKILL_DICTIONARY, type SkillCategory } from "../skills"

const IMPORTANCE_KEYWORDS = {
  must: ["must", "required", "essential", "mandatory", "need", "critical"],
  should: ["should", "preferred", "ideal", "strong", "important"],
  nice: ["nice", "plus", "bonus", "helpful", "familiarity"],
}

function detectImportance(context: string): "must" | "should" | "nice" {
  const lower = context.toLowerCase()
  for (const [imp, keywords] of Object.entries(IMPORTANCE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return imp as "must" | "should" | "nice"
    }
  }
  return "should"
}

function mapTypeFromCategory(category: SkillCategory): Requirement["type"] {
  if (category === "soft") return "responsibility"
  return "skill"
}

export function extractJobSpecDeterministic(args: { jobTitle: string; jobDescription: string }): JobSpec {
  const text = args.jobDescription.toLowerCase()
  const requirements: Requirement[] = []
  const seen = new Set<string>()

  // Detect seniority
  let seniority: JobSpec["seniority"] = undefined
  if (/\b(intern|internship)\b/i.test(text)) seniority = "intern"
  else if (/\b(junior|entry[- ]level|graduate)\b/i.test(text)) seniority = "junior"
  else if (/\b(senior|sr\.?)\b/i.test(text)) seniority = "senior"
  else if (/\b(staff|principal)\b/i.test(text)) seniority = "staff"
  else if (/\b(lead|manager|director)\b/i.test(text)) seniority = "lead"
  else if (/\bmid[- ]?(level|senior)?\b/i.test(text)) seniority = "mid"

  // Extract skills from dictionary
  for (const skill of SKILL_DICTIONARY) {
    const patterns = [skill.name.toLowerCase(), ...(skill.aliases?.map((a) => a.toLowerCase()) || [])]
    for (const pattern of patterns) {
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
      if (regex.test(text) && !seen.has(skill.name)) {
        seen.add(skill.name)

        // Find context around the match
        const idx = text.indexOf(pattern)
        const contextStart = Math.max(0, idx - 100)
        const contextEnd = Math.min(text.length, idx + pattern.length + 100)
        const context = text.slice(contextStart, contextEnd)

        const importance = detectImportance(context)
        const baseWeight = importance === "must" ? 0.18 : importance === "should" ? 0.1 : 0.05

        requirements.push({
          id: `req-${skill.name.toLowerCase().replace(/\s+/g, "-")}`,
          label: skill.name,
          type: mapTypeFromCategory(skill.category),
          importance,
          weight: baseWeight,
          synonyms: skill.aliases || [],
          evidenceHints: skill.keywords || [],
        })
        break
      }
    }
  }

  // Normalize weights to sum to ~1
  const totalWeight = requirements.reduce((sum, r) => sum + r.weight, 0)
  if (totalWeight > 0) {
    for (const req of requirements) {
      req.weight = Math.round((req.weight / totalWeight) * 100) / 100
    }
  }

  // Ensure at least some requirements
  if (requirements.length === 0) {
    requirements.push({
      id: "req-general",
      label: "Relevant experience",
      type: "experience",
      importance: "must",
      weight: 1,
      synonyms: ["experience", "background", "skills"],
      evidenceHints: ["years", "projects", "work"],
    })
  }

  return {
    title: args.jobTitle,
    seniority,
    domain: undefined,
    requirements: requirements.slice(0, 15), // Max 15 requirements
  }
}
