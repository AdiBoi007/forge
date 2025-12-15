/**
 * Quick FORGE v2 validation script
 * Run with: npx tsx scripts/test-forge.ts
 */

import {
  scoreRequirement,
  verifyEvidenceSnippets,
  runForgeAnalysisDeterministic,
  type ArtifactChunk,
  type ContextWeights,
  type ForgeConfig,
} from "../lib/forge/core"
import { DEMO_JOB_SPEC, DEMO_CANDIDATES, getDemoChunks } from "../lib/forge/demo-data"

console.log("=== FORGE v2 Validation ===\n")

// Test 1: Score requirement
console.log("1. Testing scoreRequirement...")
const testItems = [
  {
    requirementId: "req-1",
    proofTier: "VERIFIED_ARTIFACT" as const,
    strength: 0.9,
    relevance: 0.8,
    recency: 0.7,
    snippet: "test",
    source: "github" as const,
  },
]
const score = scoreRequirement(testItems)
console.log(`   Score: ${score.toFixed(3)} (expected ~0.504)`)
console.log(`   ${score > 0.4 && score < 0.6 ? "PASS" : "FAIL"}\n`)

// Test 2: Verify evidence snippets (anti-hallucination)
console.log("2. Testing verifyEvidenceSnippets (anti-hallucination)...")
const chunks: ArtifactChunk[] = [{ id: "1", source: "resume", text: "Expert in React and TypeScript" }]
const fakeEvidence = {
  requirementId: "req-1",
  items: [
    {
      requirementId: "req-1",
      proofTier: "VERIFIED_ARTIFACT" as const,
      strength: 0.9,
      relevance: 0.9,
      recency: 0.9,
      snippet: "This is a hallucinated snippet",
      source: "resume" as const,
    },
  ],
}
const verified = verifyEvidenceSnippets(fakeEvidence, chunks, false)
console.log(`   Original tier: VERIFIED_ARTIFACT`)
console.log(`   After verification: ${verified.items[0].proofTier}`)
console.log(`   ${verified.items[0].proofTier !== "VERIFIED_ARTIFACT" ? "PASS (downgraded)" : "FAIL"}\n`)

// Test 3: Full deterministic analysis
console.log("3. Testing full deterministic analysis...")
const cfg: ForgeConfig = {
  capabilityThreshold: 40,
  topKChunksPerReq: 8,
  strictEvidenceMode: false,
}
const weights: ContextWeights = {
  teamwork: 0.25,
  communication: 0.25,
  adaptability: 0.25,
  ownership: 0.25,
}

for (const candidate of DEMO_CANDIDATES) {
  const candidateChunks = getDemoChunks(candidate)
  const result = runForgeAnalysisDeterministic({
    job: DEMO_JOB_SPEC,
    chunks: candidateChunks,
    contextWeights: weights,
    cfg,
  })

  console.log(`\n   Candidate: ${candidate.name}`)
  console.log(`   CS_verified: ${result.capabilityScoreVerified}`)
  console.log(`   XS: ${result.contextScore.toFixed(2)}`)
  console.log(`   FORGE Score: ${result.forgeScore}`)
  console.log(`   Pass Gate: ${result.passGate ? "YES" : "NO"}`)
  console.log(`   Missing must-haves: ${result.missingMustHaves.join(", ") || "None"}`)
  console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`)
}

console.log("\n=== Validation Complete ===")
