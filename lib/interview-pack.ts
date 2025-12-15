// FORGE Interview Pack Generator
// Deterministic + optional LLM interview pack generation

import type { CandidateAnalysis } from "@/lib/scoring"
import { getVerificationProbeQuestions } from "@/lib/verification"
import type { CandidateVerification } from "@/lib/types"

export interface InterviewPack {
  meta: {
    mode: "ai" | "template"
    generatedAt: string
    model?: string
  }
  sections: {
    deepDives: Array<{
      title: string
      question: string
      basedOn: string
      whatGoodLooksLike: string
    }>
    tradeoffs: Array<{
      title: string
      question: string
      basedOn: string
      whatGoodLooksLike: string
    }>
    riskProbes: Array<{
      title: string
      question: string
      basedOn: string
      whatGoodLooksLike: string
    }>
    cultureProbes: Array<{
      title: string
      question: string
      basedOn: string
      whatGoodLooksLike: string
    }>
  }
  scorecard: Array<{
    dimension: string
    signals: string[]
    redFlags: string[]
  }>
  miniTasks: Array<{
    title: string
    prompt: string
    timebox: string
    evaluates: string[]
    scoring: string[]
  }>
  areasToProbe: string[]
}

// Engineering topics for deep dive questions
const ENGINEERING_TOPICS = [
  "architecture decisions",
  "performance optimization",
  "error handling",
  "testing strategy",
  "API design",
  "scalability considerations",
  "code organization",
  "dependency management",
]

// Tradeoff question templates
const TRADEOFF_TEMPLATES = [
  { q: "Why did you choose {tech} over alternatives?", topic: "technology choice" },
  { q: "What would you change if starting {project} from scratch?", topic: "retrospective" },
  { q: "How did you balance speed vs quality in {project}?", topic: "delivery tradeoffs" },
]

/**
 * Generate interview pack (template mode - deterministic)
 */
function generateTemplatePack(params: {
  jobTitle: string
  requiredSkills: Array<{ name: string; weight: number }>
  candidate: CandidateAnalysis
  verification?: CandidateVerification // Add optional verification param
}): InterviewPack {
  const { jobTitle, requiredSkills, candidate, verification } = params

  const topEvidence = candidate.evidence.slice(0, 3)
  const provenSkills = candidate.capability.skills.filter((s) => s.status === "Proven")
  const weakSkills = candidate.capability.skills.filter((s) => s.status === "Weak" || s.status === "Missing")
  const topWeakSkills = weakSkills.slice(0, 2)

  // Deep Dives (3 questions based on top repos)
  const deepDives = topEvidence.map((ev, i) => {
    const topic = ENGINEERING_TOPICS[i % ENGINEERING_TOPICS.length]
    return {
      title: `${ev.title} Deep Dive`,
      question: `Walk me through the ${topic} in your ${ev.title} project. What problems did you solve and how?`,
      basedOn: `${ev.title} - ${ev.metrics.stars || 0} stars, ${ev.skill} evidence`,
      whatGoodLooksLike: `Clear explanation of technical decisions, awareness of tradeoffs, ability to discuss alternatives considered.`,
    }
  })

  // Fill to 3 if needed
  while (deepDives.length < 3) {
    const skill = provenSkills[deepDives.length] || requiredSkills[0]
    deepDives.push({
      title: `${skill?.name || "Technical"} Experience`,
      question: `Describe a challenging ${skill?.name || "technical"} problem you solved. What was your approach?`,
      basedOn: `Required skill: ${skill?.name || "General"}`,
      whatGoodLooksLike: `Structured problem-solving, clear communication, technical depth.`,
    })
  }

  // Tradeoffs (2 questions)
  const tradeoffs = topEvidence.slice(0, 2).map((ev, i) => {
    const template = TRADEOFF_TEMPLATES[i % TRADEOFF_TEMPLATES.length]
    return {
      title: `${ev.title} Tradeoffs`,
      question: template.q.replace("{tech}", ev.skill).replace("{project}", ev.title),
      basedOn: `${ev.title} project architecture`,
      whatGoodLooksLike: `Awareness of alternatives, clear reasoning, pragmatic decision-making.`,
    }
  })

  while (tradeoffs.length < 2) {
    tradeoffs.push({
      title: "Technology Choices",
      question: `How do you decide between different technologies or frameworks for a new project?`,
      basedOn: "General technical judgment",
      whatGoodLooksLike: `Balanced consideration of team, timeline, maintainability, and requirements.`,
    })
  }

  // Risk Probes (2 questions based on weak/missing skills)
  const riskProbes = topWeakSkills.map((skill) => ({
    title: `${skill.name} Verification`,
    question: `We found limited ${skill.name} evidence in your public work. Can you walk me through your experience with it?`,
    basedOn: `${skill.name} scored ${skill.score}/100 with ${skill.status.toLowerCase()} evidence`,
    whatGoodLooksLike: `Concrete examples, honest assessment of experience level, learning trajectory.`,
  }))

  while (riskProbes.length < 2) {
    riskProbes.push({
      title: "Gap Assessment",
      question: `What areas of ${jobTitle.toLowerCase()} work are you still developing expertise in?`,
      basedOn: "Self-awareness check",
      whatGoodLooksLike: `Honest self-assessment, clear learning plan, growth mindset.`,
    })
  }

  if (verification) {
    const verificationProbes = getVerificationProbeQuestions(verification)
    for (const probe of verificationProbes.slice(0, 2)) {
      riskProbes.push({
        title: "Verification Probe",
        question: probe,
        basedOn: "Unverified resume claim",
        whatGoodLooksLike: "Concrete examples with specific details, ability to walk through implementation",
      })
    }
  }

  // Culture Probes (2 questions based on context signals)
  const cultureProbes = [
    {
      title: "Collaboration Style",
      question:
        candidate.context.teamwork.score < 50
          ? `Your public work shows mostly solo projects. How do you approach collaboration in team settings?`
          : `Tell me about a time you had to resolve a technical disagreement with a teammate.`,
      basedOn: `Teamwork signal: ${candidate.context.teamwork.score}/100`,
      whatGoodLooksLike: `Respectful communication, openness to feedback, conflict resolution skills.`,
    },
    {
      title: "Communication",
      question:
        candidate.context.communication.score < 50
          ? `How do you document your work and share knowledge with others?`
          : `Describe how you explain complex technical concepts to non-technical stakeholders.`,
      basedOn: `Communication signal: ${candidate.context.communication.score}/100`,
      whatGoodLooksLike: `Clear articulation, audience awareness, structured explanation.`,
    },
  ]

  // Scorecard (5 dimensions)
  const scorecard = [
    {
      dimension: "Technical Capability",
      signals: [
        `Demonstrates ${provenSkills.length}/${requiredSkills.length} required skills`,
        `Clear explanation of implementation details`,
        `Awareness of edge cases and error handling`,
      ],
      redFlags: [
        `Cannot explain own code`,
        `No awareness of alternatives`,
        `Overly reliant on frameworks without understanding`,
      ],
    },
    {
      dimension: "Ownership",
      signals: [
        `${candidate.context.ownership.source}`,
        `Takes responsibility for outcomes`,
        `Proactive problem identification`,
      ],
      redFlags: [`Blames others for failures`, `Lacks follow-through examples`, `No maintained projects`],
    },
    {
      dimension: "Communication",
      signals: [
        `${candidate.context.communication.source}`,
        `Clear and structured responses`,
        `Appropriate technical depth for audience`,
      ],
      redFlags: [`Cannot explain decisions clearly`, `Dismissive of questions`, `Overly verbose or unclear`],
    },
    {
      dimension: "Adaptability",
      signals: [
        `${candidate.context.adaptability.source}`,
        `Learns new technologies readily`,
        `Comfortable with ambiguity`,
      ],
      redFlags: [`Rigid thinking`, `Resistance to feedback`, `Single technology focus`],
    },
    {
      dimension: "Risk Assessment",
      signals: [`Honest about limitations`, `Clear growth trajectory`, `Receptive to probing questions`],
      redFlags: [
        `Defensive about gaps`,
        `Overstates experience`,
        `Cannot provide concrete examples for ${topWeakSkills[0]?.name || "weak areas"}`,
      ],
    },
  ]

  // Mini Tasks (2 tasks)
  const strongestSkill = provenSkills[0] || requiredSkills[0]
  const weakestSkill = topWeakSkills[0] || requiredSkills[requiredSkills.length - 1]

  const miniTasks = [
    {
      title: `${strongestSkill?.name || "Core"} Extension`,
      prompt:
        topEvidence.length > 0
          ? `Extend your ${topEvidence[0].title} project to add [specific feature]. Document your approach.`
          : `Build a small ${strongestSkill?.name || "technical"} module that demonstrates best practices.`,
      timebox: "60-90 minutes",
      evaluates: [strongestSkill?.name || "Core skill", "Code organization", "Documentation"],
      scoring: [
        "Functional implementation (40%)",
        "Code quality and structure (30%)",
        "Clear documentation (20%)",
        "Edge case handling (10%)",
      ],
    },
    {
      title: `${weakestSkill?.name || "Gap"} Demonstration`,
      prompt: `Build a small module demonstrating ${weakestSkill?.name || "the required"} capability. Focus on correctness over completeness.`,
      timebox: "45-60 minutes",
      evaluates: [weakestSkill?.name || "Gap skill", "Learning ability", "Problem solving"],
      scoring: [
        "Demonstrates understanding (50%)",
        "Clean implementation (25%)",
        "Asks clarifying questions (15%)",
        "Handles feedback well (10%)",
      ],
    },
  ]

  // Areas to Probe (5-8 bullets)
  const areasToProbe: string[] = []

  if (topWeakSkills.length > 0) {
    areasToProbe.push(`Verify ${topWeakSkills.map((s) => s.name).join(", ")} experience with concrete examples`)
  }

  if (candidate.context.teamwork.score < 50) {
    areasToProbe.push(`Explore collaboration experience - limited team evidence in public work`)
  }

  if (candidate.confidence < 60) {
    areasToProbe.push(`Dig deeper on experience claims - low evidence confidence (${candidate.confidence}%)`)
  }

  if (candidate.yearsActive < 2) {
    areasToProbe.push(`Assess experience depth - ${candidate.yearsActive} year(s) of public activity`)
  }

  areasToProbe.push(`Confirm ${jobTitle} fit with specific past project examples`)
  areasToProbe.push(`Evaluate communication style and technical articulation`)
  areasToProbe.push(`Assess problem-solving approach with hypothetical scenarios`)

  if (candidate.risks.length > 0) {
    areasToProbe.push(`Address flagged risk: ${candidate.risks[0].description}`)
  }

  return {
    meta: {
      mode: "template",
      generatedAt: new Date().toISOString(),
    },
    sections: {
      deepDives: deepDives.slice(0, 3),
      tradeoffs: tradeoffs.slice(0, 2),
      riskProbes: riskProbes.slice(0, 2),
      cultureProbes: cultureProbes.slice(0, 2),
    },
    scorecard,
    miniTasks,
    areasToProbe: areasToProbe.slice(0, 8),
  }
}

/**
 * Generate interview pack with optional AI enhancement
 */
export async function generateInterviewPack(params: {
  jobTitle: string
  jobDescription: string
  requiredSkills: Array<{ name: string; weight: number }>
  candidate: CandidateAnalysis
  mode: "auto" | "ai" | "template"
}): Promise<InterviewPack> {
  const { jobTitle, requiredSkills, candidate, mode } = params

  // Template mode - always deterministic
  if (mode === "template") {
    return generateTemplatePack({ jobTitle, requiredSkills, candidate })
  }

  // Check for OpenAI key
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY

  // If mode is "auto" and no key, or if AI call fails, use template
  if (mode === "auto" && !hasOpenAIKey) {
    const pack = generateTemplatePack({ jobTitle, requiredSkills, candidate })
    pack.areasToProbe.unshift("AI pack unavailable — using deterministic interview templates.")
    return pack
  }

  if (mode === "ai" && !hasOpenAIKey) {
    const pack = generateTemplatePack({ jobTitle, requiredSkills, candidate })
    pack.areasToProbe.unshift("OpenAI key not configured — using deterministic interview templates.")
    return pack
  }

  // Try AI generation
  try {
    // Prepare sanitized input (limit evidence, truncate descriptions)
    const sanitizedEvidence = candidate.evidence.slice(0, 6).map((e) => ({
      title: e.title,
      skill: e.skill,
      impact: e.impact,
      description: e.description?.slice(0, 140) || null,
      stars: e.metrics.stars,
    }))

    const topSkills = candidate.capability.skills.slice(0, 5)
    const weakestSkills = candidate.capability.skills
      .filter((s) => s.status === "Weak" || s.status === "Missing")
      .slice(0, 2)

    const prompt = `Generate a JSON interview pack for a ${jobTitle} candidate.

Candidate summary:
- Overall score: ${candidate.finalScore}/100
- Verdict: ${candidate.verdict}
- Proven skills: ${
      topSkills
        .filter((s) => s.status === "Proven")
        .map((s) => s.name)
        .join(", ") || "None"
    }
- Weak/missing: ${weakestSkills.map((s) => s.name).join(", ") || "None"}

Evidence (repos):
${sanitizedEvidence.map((e) => `- ${e.title}: ${e.skill}, ${e.stars || 0} stars`).join("\n")}

Required skills (by weight):
${requiredSkills
  .slice(0, 5)
  .map((s) => `- ${s.name}: ${s.weight}%`)
  .join("\n")}

Generate interview pack JSON with:
- sections.deepDives: 3 questions grounded in their actual repos
- sections.tradeoffs: 2 questions about technical decisions
- sections.riskProbes: 2 questions about weak/missing skills
- sections.cultureProbes: 2 questions about collaboration
- scorecard: 5 dimensions with signals and red flags
- miniTasks: 2 take-home tasks (60-90 min each)
- areasToProbe: 5-8 bullet points

Return ONLY valid JSON, no markdown or explanation.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.FORGE_AI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are generating interview pack JSON for a hiring platform. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error("No content in OpenAI response")
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content
    if (content.includes("```json")) {
      jsonStr = content.split("```json")[1]?.split("```")[0] || content
    } else if (content.includes("```")) {
      jsonStr = content.split("```")[1]?.split("```")[0] || content
    }

    const aiPack = JSON.parse(jsonStr.trim())

    return {
      meta: {
        mode: "ai",
        generatedAt: new Date().toISOString(),
        model: process.env.FORGE_AI_MODEL || "gpt-4o-mini",
      },
      sections: aiPack.sections || generateTemplatePack({ jobTitle, requiredSkills, candidate }).sections,
      scorecard: aiPack.scorecard || generateTemplatePack({ jobTitle, requiredSkills, candidate }).scorecard,
      miniTasks: aiPack.miniTasks || generateTemplatePack({ jobTitle, requiredSkills, candidate }).miniTasks,
      areasToProbe: aiPack.areasToProbe || generateTemplatePack({ jobTitle, requiredSkills, candidate }).areasToProbe,
    }
  } catch (error) {
    // Fallback to template on any error
    console.error("AI interview pack generation failed:", error)
    const pack = generateTemplatePack({ jobTitle, requiredSkills, candidate })
    pack.areasToProbe.unshift(
      `AI generation failed — using deterministic templates. Error: ${error instanceof Error ? error.message : "Unknown"}`,
    )
    return pack
  }
}
