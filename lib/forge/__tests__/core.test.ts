/**
 * FORGE v2 Core Scoring Tests
 * Run with: npx vitest run lib/forge/__tests__/core.test.ts
 */

import { describe, it, expect } from "vitest"
import {
  scoreRequirement,
  scoreCapability,
  computeConfidence,
  verifyEvidenceSnippets,
  scoreContextFromText,
  retrieveTopChunks,
  chunkText,
  type JobSpec,
  type RequirementEvidence,
  type EvidenceItem,
  type ArtifactChunk,
  type ContextWeights,
} from "../core"

describe("scoreRequirement", () => {
  it("returns 0 for empty items", () => {
    expect(scoreRequirement([])).toBe(0)
  })

  it("returns correct score for VERIFIED_ARTIFACT", () => {
    const items: EvidenceItem[] = [
      {
        requirementId: "req-1",
        proofTier: "VERIFIED_ARTIFACT",
        strength: 1,
        relevance: 1,
        recency: 1,
        snippet: "test",
        source: "github",
      },
    ]
    expect(scoreRequirement(items)).toBe(1) // 1.0 * 1 * 1 * 1
  })

  it("returns correct score for STRONG_SIGNAL", () => {
    const items: EvidenceItem[] = [
      {
        requirementId: "req-1",
        proofTier: "STRONG_SIGNAL",
        strength: 1,
        relevance: 1,
        recency: 1,
        snippet: "test",
        source: "resume",
      },
    ]
    expect(scoreRequirement(items)).toBe(0.7) // 0.7 * 1 * 1 * 1
  })

  it("returns 0 for CLAIM_ONLY", () => {
    const items: EvidenceItem[] = [
      {
        requirementId: "req-1",
        proofTier: "CLAIM_ONLY",
        strength: 1,
        relevance: 1,
        recency: 1,
        snippet: "test",
        source: "resume",
      },
    ]
    expect(scoreRequirement(items)).toBe(0) // 0.0 * 1 * 1 * 1
  })

  it("returns best score when multiple items", () => {
    const items: EvidenceItem[] = [
      {
        requirementId: "req-1",
        proofTier: "WEAK_SIGNAL",
        strength: 0.5,
        relevance: 0.5,
        recency: 0.5,
        snippet: "test1",
        source: "resume",
      },
      {
        requirementId: "req-1",
        proofTier: "VERIFIED_ARTIFACT",
        strength: 0.8,
        relevance: 0.9,
        recency: 0.7,
        snippet: "test2",
        source: "github",
      },
    ]
    // Best is VERIFIED_ARTIFACT: 1.0 * 0.8 * 0.9 * 0.7 = 0.504
    expect(scoreRequirement(items)).toBeCloseTo(0.504, 2)
  })
})

describe("scoreCapability", () => {
  const mockJob: JobSpec = {
    title: "Test Job",
    requirements: [
      { id: "req-1", label: "React", type: "skill", importance: "must", weight: 0.5 },
      { id: "req-2", label: "TypeScript", type: "skill", importance: "should", weight: 0.3 },
      { id: "req-3", label: "Testing", type: "skill", importance: "nice", weight: 0.2 },
    ],
  }

  it("returns 0 for empty matrix", () => {
    const result = scoreCapability(mockJob, [])
    expect(result.capabilityScoreVerified).toBe(0)
    expect(result.missingMustHaves).toContain("React")
  })

  it("calculates weighted score correctly", () => {
    const matrix: RequirementEvidence[] = [
      {
        requirementId: "req-1",
        items: [
          {
            requirementId: "req-1",
            proofTier: "VERIFIED_ARTIFACT",
            strength: 1,
            relevance: 1,
            recency: 1,
            snippet: "test",
            source: "github",
          },
        ],
      },
      {
        requirementId: "req-2",
        items: [
          {
            requirementId: "req-2",
            proofTier: "STRONG_SIGNAL",
            strength: 1,
            relevance: 1,
            recency: 1,
            snippet: "test",
            source: "resume",
          },
        ],
      },
      { requirementId: "req-3", items: [] },
    ]

    const result = scoreCapability(mockJob, matrix)
    // (0.5 * 1.0 + 0.3 * 0.7 + 0.2 * 0) / 1.0 * 100 = 71
    expect(result.capabilityScoreVerified).toBe(71)
    expect(result.missingMustHaves).toEqual([])
  })

  it("detects missing must-haves", () => {
    const matrix: RequirementEvidence[] = [
      {
        requirementId: "req-1",
        items: [
          {
            requirementId: "req-1",
            proofTier: "CLAIM_ONLY",
            strength: 0.1,
            relevance: 0.1,
            recency: 0.1,
            snippet: "test",
            source: "resume",
          },
        ],
      },
    ]

    const result = scoreCapability(mockJob, matrix)
    expect(result.missingMustHaves).toContain("React")
  })
})

describe("verifyEvidenceSnippets", () => {
  const chunks: ArtifactChunk[] = [
    { id: "1", source: "resume", text: "I have 5 years of experience with React and TypeScript" },
    { id: "2", source: "github", text: "Built a dashboard using Next.js and Tailwind CSS" },
  ]

  it("keeps valid snippets unchanged", () => {
    const evidence: RequirementEvidence = {
      requirementId: "req-1",
      items: [
        {
          requirementId: "req-1",
          proofTier: "VERIFIED_ARTIFACT",
          strength: 0.9,
          relevance: 0.9,
          recency: 0.8,
          snippet: "5 years of experience with React",
          source: "resume",
        },
      ],
    }

    const result = verifyEvidenceSnippets(evidence, chunks, false)
    expect(result.items[0].proofTier).toBe("VERIFIED_ARTIFACT")
    expect(result.items[0].strength).toBe(0.9)
  })

  it("downgrades hallucinated snippets in normal mode", () => {
    const evidence: RequirementEvidence = {
      requirementId: "req-1",
      items: [
        {
          requirementId: "req-1",
          proofTier: "VERIFIED_ARTIFACT",
          strength: 0.9,
          relevance: 0.9,
          recency: 0.8,
          snippet: "This snippet does not exist in the chunks",
          source: "resume",
        },
      ],
    }

    const result = verifyEvidenceSnippets(evidence, chunks, false)
    expect(result.items[0].proofTier).toBe("STRONG_SIGNAL") // Downgraded
    expect(result.items[0].strength).toBe(0.3)
    expect(result.items[0].notes).toContain("downgraded")
  })

  it("sets NONE for hallucinated snippets in strict mode", () => {
    const evidence: RequirementEvidence = {
      requirementId: "req-1",
      items: [
        {
          requirementId: "req-1",
          proofTier: "VERIFIED_ARTIFACT",
          strength: 0.9,
          relevance: 0.9,
          recency: 0.8,
          snippet: "This snippet does not exist",
          source: "resume",
        },
      ],
    }

    const result = verifyEvidenceSnippets(evidence, chunks, true)
    expect(result.items[0].proofTier).toBe("NONE")
    expect(result.items[0].strength).toBe(0)
    expect(result.items[0].notes).toContain("strict mode")
  })
})

describe("scoreContextFromText", () => {
  const weights: ContextWeights = {
    teamwork: 0.25,
    communication: 0.25,
    adaptability: 0.25,
    ownership: 0.25,
  }

  it("returns 0 for empty text", () => {
    const result = scoreContextFromText("", weights)
    expect(result.contextScore).toBe(0)
  })

  it("detects teamwork signals", () => {
    const result = scoreContextFromText(
      "I collaborated with cross-functional teams and mentored junior developers",
      weights,
    )
    expect(result.contextScores.teamwork).toBeGreaterThan(0)
  })

  it("detects communication signals", () => {
    const result = scoreContextFromText("Wrote design documents and presented to stakeholders", weights)
    expect(result.contextScores.communication).toBeGreaterThan(0)
  })

  it("detects ownership signals", () => {
    const result = scoreContextFromText("Owned the end-to-end development and launched the product", weights)
    expect(result.contextScores.ownership).toBeGreaterThan(0)
  })
})

describe("retrieveTopChunks", () => {
  const chunks: ArtifactChunk[] = [
    { id: "1", source: "resume", text: "Expert in React and TypeScript development" },
    { id: "2", source: "resume", text: "Managed a team of 5 engineers" },
    { id: "3", source: "github", text: "React component library with hooks" },
    { id: "4", source: "resume", text: "Skilled in Python and machine learning" },
  ]

  it("retrieves most relevant chunks", () => {
    const req = {
      id: "req-1",
      label: "React",
      type: "skill" as const,
      importance: "must" as const,
      weight: 0.5,
      synonyms: ["ReactJS", "React.js"],
    }

    const result = retrieveTopChunks(req, chunks, 2)
    expect(result.length).toBe(2)
    // Should prioritize chunks with "React"
    expect(result.some((c) => c.text.includes("React"))).toBe(true)
  })
})

describe("chunkText", () => {
  it("splits long text into chunks", () => {
    const longText = "A".repeat(2000)
    const chunks = chunkText(longText, "resume")
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every((c) => c.source === "resume")).toBe(true)
  })

  it("preserves short text as single chunk", () => {
    const shortText = "Short resume text"
    const chunks = chunkText(shortText, "resume")
    expect(chunks.length).toBe(1)
    expect(chunks[0].text).toBe(shortText)
  })
})

describe("computeConfidence", () => {
  const mockJob: JobSpec = {
    title: "Test",
    requirements: [
      { id: "req-1", label: "A", type: "skill", importance: "must", weight: 0.5 },
      { id: "req-2", label: "B", type: "skill", importance: "should", weight: 0.5 },
    ],
  }

  it("returns higher confidence with more coverage", () => {
    const fullMatrix: RequirementEvidence[] = [
      {
        requirementId: "req-1",
        items: [
          {
            requirementId: "req-1",
            proofTier: "VERIFIED_ARTIFACT",
            strength: 1,
            relevance: 1,
            recency: 1,
            snippet: "x",
            source: "github",
          },
        ],
      },
      {
        requirementId: "req-2",
        items: [
          {
            requirementId: "req-2",
            proofTier: "STRONG_SIGNAL",
            strength: 1,
            relevance: 1,
            recency: 1,
            snippet: "y",
            source: "resume",
          },
        ],
      },
    ]

    const partialMatrix: RequirementEvidence[] = [
      {
        requirementId: "req-1",
        items: [
          {
            requirementId: "req-1",
            proofTier: "VERIFIED_ARTIFACT",
            strength: 1,
            relevance: 1,
            recency: 1,
            snippet: "x",
            source: "github",
          },
        ],
      },
    ]

    const fullConf = computeConfidence(mockJob, fullMatrix)
    const partialConf = computeConfidence(mockJob, partialMatrix)

    expect(fullConf).toBeGreaterThan(partialConf)
  })
})
