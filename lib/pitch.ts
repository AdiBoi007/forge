// FORGE Pitch Mode
// Curated demo job configs and candidates for one-click demo

export const PITCH_JOB_FRONTEND = {
  title: "Senior Frontend Engineer",
  description: `We're looking for a Senior Frontend Engineer to join our product team.

Requirements:
• 5+ years of experience with React and TypeScript
• Strong understanding of modern JavaScript/ES6+
• Experience building responsive, accessible web applications
• Familiarity with REST APIs and GraphQL
• Testing experience with Jest, Cypress, or similar
• Good communication skills and ability to work in a team

Nice to have:
• Experience with Next.js or similar SSR frameworks
• Contributions to open source projects
• Experience with CI/CD pipelines
• Knowledge of system design and architecture patterns`,
  skills: [
    { name: "React", weight: 30 },
    { name: "TypeScript", weight: 25 },
    { name: "JavaScript", weight: 15 },
    { name: "Testing", weight: 10 },
    { name: "REST API", weight: 10 },
    { name: "CSS", weight: 10 },
  ],
}

export const PITCH_JOB_FOUNDING = {
  title: "Founding Engineer (Startup)",
  description: `Early-stage startup seeking a Founding Engineer to build our core product.

You'll be employee #3 and own significant technical decisions.

Requirements:
• Full-stack experience - comfortable with frontend and backend
• Strong JavaScript/TypeScript skills
• Database experience (SQL or NoSQL)
• Ability to ship fast and iterate quickly
• Self-directed, can work with ambiguity
• Strong ownership mentality

What we offer:
• Significant equity stake
• Direct impact on product direction
• Small, fast-moving team
• Competitive base salary`,
  skills: [
    { name: "JavaScript", weight: 20 },
    { name: "TypeScript", weight: 20 },
    { name: "Node.js", weight: 20 },
    { name: "SQL", weight: 15 },
    { name: "React", weight: 15 },
    { name: "System Design", weight: 10 },
  ],
}

export const PITCH_CANDIDATES = ["vercel", "shadcn", "leerob", "rauchg"]

export const PITCH_CANDIDATES_ALT = ["sindresorhus", "tj", "getify", "addyosmani"]

export type PitchRole = "frontend" | "founding"

export function getPitchJob(role: PitchRole) {
  return role === "founding" ? PITCH_JOB_FOUNDING : PITCH_JOB_FRONTEND
}

export function writePitchSeedToLocalStorage(role: PitchRole = "frontend"): void {
  const job = getPitchJob(role)

  // Write job config
  const jobConfig = {
    title: job.title,
    description: job.description,
    skills: job.skills,
    critique: { score: 82, issues: [] },
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem("forge_job_config", JSON.stringify(jobConfig))

  // Write candidates
  localStorage.setItem("forge_candidates", JSON.stringify(PITCH_CANDIDATES))

  // Clear any existing analysis so fresh run happens
  localStorage.removeItem("forge_analysis")
}

export function isPitchSeeded(): boolean {
  const job = localStorage.getItem("forge_job_config")
  const candidates = localStorage.getItem("forge_candidates")
  return !!job && !!candidates
}
