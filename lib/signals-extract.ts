// Non-GitHub Signal Extraction with Proof Hierarchy
// ============================================

import type {
  CandidateSignals,
  ExtractedSignals,
  ExtractedSkill,
  ExtractedProof,
  ExtractedTrait,
  ReliabilityReport,
  EvidenceSource,
  ProofTier,
  RoleType,
} from "@/lib/types"
import { SOURCE_WEIGHTS, PROOF_TIER_WEIGHTS } from "@/lib/types"
import { fetchUrlText } from "@/lib/url-fetch"
import { hasOpenAIKey, callOpenAIJson } from "@/lib/openai"
import { SKILL_DICTIONARY } from "@/lib/skills"
import { matchNonDevSkills } from "@/lib/nondev-skills"

interface ExtractResult {
  signals: ExtractedSignals
  reliability: ReliabilityReport
  debug?: { fetchedCount: number; mode: "openai" | "deterministic" }
}

export async function extractSignals(
  candidate: CandidateSignals,
  job: { title: string; description: string; skills: Array<{ name: string; weight: number }> },
  roleType?: RoleType,
): Promise<ExtractResult> {
  // Collect all text sources
  const textSources: { source: EvidenceSource; text: string; url?: string }[] = []

  if (candidate.linkedinText) {
    textSources.push({ source: "linkedin", text: candidate.linkedinText })
  }
  if (candidate.resumeText) {
    textSources.push({ source: "resume", text: candidate.resumeText })
  }
  if (candidate.extracurricularText) {
    textSources.push({ source: "extracurricular", text: candidate.extracurricularText })
  }

  // Fetch portfolio URL
  let fetchedCount = 0
  if (candidate.portfolioUrl) {
    const result = await fetchUrlText(candidate.portfolioUrl)
    if (result.ok) {
      textSources.push({ source: "portfolio", text: result.text, url: candidate.portfolioUrl })
      fetchedCount++
    }
  }

  // Fetch writing links
  if (candidate.writingLinks) {
    for (const url of candidate.writingLinks.slice(0, 3)) {
      const result = await fetchUrlText(url)
      if (result.ok) {
        textSources.push({ source: "writing", text: result.text, url })
        fetchedCount++
      }
    }
  }

  // If OpenAI available and we have substantial text, use AI extraction
  if (hasOpenAIKey() && textSources.length > 0) {
    const aiResult = await extractWithOpenAI(textSources, job, roleType)
    if (aiResult) {
      return {
        signals: aiResult.signals,
        reliability: aiResult.reliability,
        debug: { fetchedCount, mode: "openai" },
      }
    }
  }

  // Fallback: deterministic extraction
  const deterministicResult = extractDeterministic(textSources, job, roleType)
  return {
    ...deterministicResult,
    debug: { fetchedCount, mode: "deterministic" },
  }
}

// ============================================
// OpenAI Extraction with Proof Hierarchy
// ============================================

interface OpenAIExtractResponse {
  skills: Array<{
    name: string
    strength: number
    proofTier: string
    source: string
    receipts: string[]
    reliability: number
  }>
  proof: Array<{
    type: string
    title: string
    url?: string
    claimedImpact: string
    mappedSkills: string[]
    proofTier: string
    receipts: string[]
    reliability: number
  }>
  traits: {
    teamwork: { score: number; proofTier: string; receipts: string[]; reliability: number }
    communication: { score: number; proofTier: string; receipts: string[]; reliability: number }
    adaptability: { score: number; proofTier: string; receipts: string[]; reliability: number }
    ownership: { score: number; proofTier: string; receipts: string[]; reliability: number }
  }
  warnings: string[]
}

async function extractWithOpenAI(
  textSources: Array<{ source: EvidenceSource; text: string; url?: string }>,
  job: { title: string; skills: Array<{ name: string }> },
  roleType?: RoleType,
): Promise<{ signals: ExtractedSignals; reliability: ReliabilityReport } | null> {
  const skillNames = job.skills.map((s) => s.name).join(", ")
  const roleContext = roleType ? `Role type: ${roleType}. ` : ""

  const systemPrompt = `You are a hiring signal extractor with strict proof hierarchy rules.

PROOF TIERS (critical):
- owned_artifact: Candidate created/owns the thing (repo owner, paper author, primary creator)
- linked_artifact: Portfolio links to real artifact (doc, live demo, case study)
- third_party: Award listing, conference site, org directory
- claim_only: Text claims without receipts

RULES:
- If unsure, lower reliability and set proofTier=claim_only
- NEVER invent links or achievements
- Prefer extracting receipts (specific project names, metrics, artifacts)
- If only generic statements exist, return low confidence
- Source must be: github, portfolio, writing, linkedin, resume, extracurricular, other

Output JSON:
{
  "skills": [{"name":"X","strength":0-1,"proofTier":"owned_artifact|linked_artifact|third_party|claim_only","source":"...","receipts":["specific evidence"],"reliability":0-1}],
  "proof": [{"type":"case_study|deck|paper|design|campaign|ops|product|research|certification|award|talk|publication","title":"...","url":"optional","claimedImpact":"...","mappedSkills":["..."],"proofTier":"...","receipts":["..."],"reliability":0-1}],
  "traits": {
    "teamwork": {"score":0-1,"proofTier":"...","receipts":[...],"reliability":0-1},
    "communication": {"score":0-1,"proofTier":"...","receipts":[...],"reliability":0-1},
    "adaptability": {"score":0-1,"proofTier":"...","receipts":[...],"reliability":0-1},
    "ownership": {"score":0-1,"proofTier":"...","receipts":[...],"reliability":0-1}
  },
  "warnings": ["uncertainty notes"]
}`

  const textBundle = textSources
    .map((s) => `[${s.source.toUpperCase()}${s.url ? ` - ${s.url}` : ""}]\n${s.text.slice(0, 3000)}`)
    .join("\n\n---\n\n")

  const userPrompt = `${roleContext}Job: ${job.title}
Required skills: ${skillNames}

Candidate text:
${textBundle}

Extract signals with proof hierarchy. Be conservative.`

  const result = await callOpenAIJson<OpenAIExtractResponse>(systemPrompt, userPrompt)

  if (!result.ok) {
    return null
  }

  const data = result.data

  const signals: ExtractedSignals = {
    skills: data.skills.map((s) => ({
      name: s.name,
      strength: Math.min(1, Math.max(0, s.strength)),
      proofTier: (s.proofTier as ProofTier) || "claim_only",
      source: (s.source as EvidenceSource) || "resume",
      receipts: s.receipts || [],
      reliability: Math.min(1, Math.max(0, s.reliability)),
    })),
    proof: data.proof.map((p) => ({
      type: p.type as ExtractedProof["type"],
      title: p.title,
      url: p.url,
      claimedImpact: p.claimedImpact,
      mappedSkills: p.mappedSkills,
      proofTier: (p.proofTier as ProofTier) || "claim_only",
      receipts: p.receipts || [],
      reliability: Math.min(1, Math.max(0, p.reliability)),
    })),
    traits: {
      teamwork: transformTrait(data.traits.teamwork),
      communication: transformTrait(data.traits.communication),
      adaptability: transformTrait(data.traits.adaptability),
      ownership: transformTrait(data.traits.ownership),
    },
    warnings: data.warnings || [],
  }

  const reliability: ReliabilityReport = {
    overall: computeOverallReliability(signals),
    sources: textSources.map((s) => ({
      source: s.source,
      reliability: SOURCE_WEIGHTS[s.source] || 0.2,
    })),
  }

  return { signals, reliability }
}

function transformTrait(trait: {
  score: number
  proofTier: string
  receipts: string[]
  reliability: number
}): ExtractedTrait {
  return {
    score: Math.min(1, Math.max(0, trait.score)),
    proofTier: (trait.proofTier as ProofTier) || "claim_only",
    receipts: trait.receipts || [],
    reliability: Math.min(1, Math.max(0, trait.reliability)),
  }
}

function computeOverallReliability(signals: ExtractedSignals): number {
  const skillReliabilities = signals.skills.map((s) => s.reliability * PROOF_TIER_WEIGHTS[s.proofTier])
  const proofReliabilities = signals.proof.map((p) => p.reliability * PROOF_TIER_WEIGHTS[p.proofTier])

  const all = [...skillReliabilities, ...proofReliabilities]
  if (all.length === 0) return 0.2

  return all.reduce((a, b) => a + b, 0) / all.length
}

// ============================================
// Deterministic Fallback with Proof Hierarchy
// ============================================

function extractDeterministic(
  textSources: Array<{ source: EvidenceSource; text: string; url?: string }>,
  job: { skills: Array<{ name: string }> },
  roleType?: RoleType,
): { signals: ExtractedSignals; reliability: ReliabilityReport } {
  const allText = textSources.map((s) => s.text).join(" ")
  const allTextLower = allText.toLowerCase()
  const skills: ExtractedSkill[] = []
  const proof: ExtractedProof[] = []
  const warnings: string[] = []

  for (const skill of job.skills) {
    const skillLower = skill.name.toLowerCase()
    const dictEntry = SKILL_DICTIONARY.find(
      (d) => d.name.toLowerCase() === skillLower || d.aliases.some((a) => a.toLowerCase() === skillLower),
    )

    const patterns = dictEntry ? [dictEntry.name, ...dictEntry.aliases] : [skill.name]
    let found = false
    let foundSource: EvidenceSource = "resume"
    let hasUrl = false

    for (const pattern of patterns) {
      if (allTextLower.includes(pattern.toLowerCase())) {
        found = true
        // Determine source and if there's a linked URL
        for (const src of textSources) {
          if (src.text.toLowerCase().includes(pattern.toLowerCase())) {
            foundSource = src.source
            if (src.url) hasUrl = true
            break
          }
        }
        break
      }
    }

    if (found) {
      let proofTier: ProofTier = "claim_only"
      if (foundSource === "portfolio" && hasUrl) {
        proofTier = "linked_artifact"
      } else if (foundSource === "writing" && hasUrl) {
        proofTier = "linked_artifact"
      }

      skills.push({
        name: skill.name,
        strength: 0.4, // Low strength for keyword match only
        proofTier,
        source: foundSource,
        receipts: hasUrl ? ["Has linked URL"] : ["Keyword match only"],
        reliability: hasUrl ? 0.5 : 0.3,
      })
    }
  }

  if (roleType && roleType !== "engineer") {
    const nonDevMatches = matchNonDevSkills(allText)
    for (const match of nonDevMatches.slice(0, 5)) {
      // Check if skill already added from job requirements
      if (skills.some((s) => s.name.toLowerCase() === match.skill.name.toLowerCase())) continue

      // Check for artifact evidence
      let hasArtifact = false
      for (const artifact of match.skill.artifacts) {
        if (allTextLower.includes(artifact.toLowerCase())) {
          hasArtifact = true
          break
        }
      }

      skills.push({
        name: match.skill.name,
        strength: match.confidence,
        proofTier: hasArtifact ? "linked_artifact" : "claim_only",
        source: "resume",
        receipts: hasArtifact ? ["Artifact mentioned"] : ["Keyword match"],
        reliability: hasArtifact ? 0.5 : 0.3,
      })
    }
  }

  const proofPatterns = [
    { type: "case_study" as const, patterns: [/case.study/i, /client.project/i, /engagement/i] },
    { type: "deck" as const, patterns: [/presentation/i, /deck/i, /slides/i, /pitch/i] },
    { type: "paper" as const, patterns: [/paper/i, /publication/i, /research/i, /journal/i] },
    { type: "design" as const, patterns: [/design.system/i, /prototype/i, /figma/i, /portfolio/i] },
    { type: "campaign" as const, patterns: [/campaign/i, /launch/i, /initiative/i] },
    { type: "certification" as const, patterns: [/certif/i, /credential/i, /licensed/i] },
    { type: "award" as const, patterns: [/award/i, /recognition/i, /winner/i, /honored/i] },
    { type: "talk" as const, patterns: [/talk/i, /speaker/i, /conference/i, /meetup/i] },
  ]

  for (const { type, patterns } of proofPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(allText)) {
        // Look for a URL near the match
        const hasUrl = textSources.some((s) => s.url && pattern.test(s.text))

        proof.push({
          type,
          title: `${type.replace("_", " ")} mentioned`,
          claimedImpact: "Details need verification",
          mappedSkills: [],
          proofTier: hasUrl ? "linked_artifact" : "claim_only",
          receipts: hasUrl ? ["Has URL"] : ["Text mention only"],
          reliability: hasUrl ? 0.4 : 0.2,
        })
        break
      }
    }
  }

  const hasPortfolio = textSources.some((s) => s.source === "portfolio")
  const hasWriting = textSources.some((s) => s.source === "writing")
  const hasUrls = textSources.some((s) => s.url)

  const traits: ExtractedSignals["traits"] = {
    ownership: {
      score: hasPortfolio ? 0.5 : 0.3,
      proofTier: hasPortfolio ? "linked_artifact" : "claim_only",
      receipts: hasPortfolio ? ["Has portfolio"] : ["No portfolio"],
      reliability: hasPortfolio ? 0.5 : 0.25,
    },
    communication: {
      score: hasWriting ? 0.5 : 0.3,
      proofTier: hasWriting ? "linked_artifact" : "claim_only",
      receipts: hasWriting ? ["Has writing samples"] : ["No writing samples"],
      reliability: hasWriting ? 0.5 : 0.25,
    },
    teamwork: {
      score: 0.3,
      proofTier: "claim_only",
      receipts: ["Needs verification"],
      reliability: 0.2,
    },
    adaptability: {
      score: 0.3,
      proofTier: "claim_only",
      receipts: ["Needs verification"],
      reliability: 0.2,
    },
  }

  // Add warning for claim-only extraction
  warnings.push("Deterministic extraction - most claims need interview verification")
  if (!hasUrls) {
    warnings.push("No linked artifacts found - reliability is low")
  }

  const signals: ExtractedSignals = { skills, proof, traits, warnings }

  // Reliability based on sources present
  const sourceReliability = textSources.map((s) => ({
    source: s.source,
    reliability: SOURCE_WEIGHTS[s.source] || 0.2,
    note: "Deterministic mode",
  }))

  const overall = computeOverallReliability(signals)

  return {
    signals,
    reliability: { overall, sources: sourceReliability },
  }
}
