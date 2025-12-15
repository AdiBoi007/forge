export function promptExtractJobSpec(args: { jobTitle: string; jobDescription: string }) {
  return `
SYSTEM:
You are an expert technical recruiter. Convert job descriptions into a structured requirements rubric.
Output MUST be valid JSON and MUST match this schema:
{
  "title": string,
  "seniority": "intern"|"junior"|"mid"|"senior"|"staff"|"lead"|null,
  "domain": string|null,
  "requirements": Array<{
    "id": string,
    "label": string,
    "type": "skill"|"experience"|"responsibility"|"constraint",
    "importance": "must"|"should"|"nice",
    "weight": number (0-1, must items should be 0.15-0.25, should 0.08-0.15, nice 0.03-0.08),
    "synonyms": string[]|null,
    "evidenceHints": string[]|null
  }>
}
Rules:
- Prefer capability signals over credentials unless JD mandates credentials.
- "must" items should have higher weights than "should", and "nice" the lowest.
- Requirements must be short and specific.
- Provide synonyms and evidenceHints for better retrieval.
- Weights across all requirements should sum to approximately 1.0.
- Extract 8-15 requirements maximum.

USER:
Job title: ${args.jobTitle}
Job description:
${args.jobDescription}
`.trim()
}

export function promptScoreRequirementEvidence(args: { requirementJson: string; chunksJson: string }) {
  return `
SYSTEM:
You are a strict evidence grader. You receive:
1) One requirement
2) Evidence chunks (resume/GitHub/portfolio)

You MUST grade ONLY using provided chunks.
Output MUST be valid JSON matching:
{
  "requirementId": string,
  "items": Array<{
    "requirementId": string,
    "proofTier": "VERIFIED_ARTIFACT"|"STRONG_SIGNAL"|"WEAK_SIGNAL"|"CLAIM_ONLY"|"NONE",
    "strength": number (0-1),
    "relevance": number (0-1),
    "recency": number (0-1),
    "snippet": string,
    "source": "resume"|"github"|"portfolio"|"writing"|"linkedin"|"other",
    "url": string|null,
    "notes": string|null
  }>
}

Proof tier rules:
- VERIFIED_ARTIFACT: verifiable repo/link/deployed artifact directly supports requirement (GitHub repos, live projects, PRs).
- STRONG_SIGNAL: detailed evidence with specifics (metrics, project names, technologies) but not directly verifiable.
- WEAK_SIGNAL: vague/partial mention without specifics.
- CLAIM_ONLY: just says "I know X" without any supporting detail.
- NONE: no evidence found for this requirement.

CRITICAL:
- snippet MUST be an exact quote from a chunk (copy/paste substring, 20-150 chars).
- If you cannot quote an exact snippet, set proofTier="NONE" and strength=0.
- Do NOT infer. Do NOT use external knowledge.
- Return 1-3 items maximum per requirement.

USER:
Requirement:
${args.requirementJson}

Evidence chunks:
${args.chunksJson}
`.trim()
}

export function promptInterviewPack(args: {
  jobSpecJson: string
  evidenceMatrixJson: string
  missingMustHavesJson: string
}) {
  return `
SYSTEM:
Create an interview pack that reduces time-to-hire and probes gaps.
Output in JSON:
{
  "plan15": string[] (3-4 questions for 15-min screen),
  "plan30": string[] (5-7 questions for 30-min interview),
  "plan60": string[] (8-12 questions for 60-min deep dive),
  "miniTasks": string[] (2-3 small take-home tasks, 1-2 hours each),
  "screeningQuestions": string[] (3-5 yes/no or short answer knockout questions)
}
Rules:
- Every question must reference either:
  (a) a receipt snippet from the evidence matrix (quote it), OR
  (b) a missing requirement that needs probing.
- Keep miniTasks practical, relevant to the job, and completable in 1-2 hours.
- Focus questions on VERIFIED_ARTIFACT and gaps (NONE/CLAIM_ONLY).

USER:
Job: ${args.jobSpecJson}
Evidence matrix: ${args.evidenceMatrixJson}
Missing must-haves: ${args.missingMustHavesJson}
`.trim()
}

export function promptExtractJobSpecDeterministic(args: { jobTitle: string; jobDescription: string }) {
  // Fallback prompt for when we need simpler extraction
  return promptExtractJobSpec(args)
}
