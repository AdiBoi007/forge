import type { JobSpec, ArtifactChunk } from "./core"

export const DEMO_JOB_SPEC: JobSpec = {
  title: "Senior Frontend Engineer",
  seniority: "senior",
  domain: "Web Development",
  requirements: [
    {
      id: "req-react",
      label: "React.js expertise",
      type: "skill",
      importance: "must",
      weight: 0.2,
      synonyms: ["React", "ReactJS", "React.js", "React hooks", "React components"],
      evidenceHints: ["useState", "useEffect", "custom hooks", "React 18", "concurrent mode"],
    },
    {
      id: "req-typescript",
      label: "TypeScript proficiency",
      type: "skill",
      importance: "must",
      weight: 0.15,
      synonyms: ["TypeScript", "TS", "typed JavaScript"],
      evidenceHints: ["type safety", "interfaces", "generics", "strict mode"],
    },
    {
      id: "req-testing",
      label: "Testing experience",
      type: "skill",
      importance: "should",
      weight: 0.1,
      synonyms: ["unit tests", "integration tests", "Jest", "Vitest", "React Testing Library"],
      evidenceHints: ["test coverage", "TDD", "mocking", "E2E tests"],
    },
    {
      id: "req-performance",
      label: "Performance optimization",
      type: "skill",
      importance: "should",
      weight: 0.1,
      synonyms: ["web performance", "optimization", "Core Web Vitals", "Lighthouse"],
      evidenceHints: ["lazy loading", "code splitting", "memoization", "bundle size"],
    },
    {
      id: "req-nextjs",
      label: "Next.js experience",
      type: "skill",
      importance: "should",
      weight: 0.1,
      synonyms: ["Next.js", "NextJS", "Vercel"],
      evidenceHints: ["SSR", "SSG", "App Router", "API routes", "ISR"],
    },
    {
      id: "req-leadership",
      label: "Technical leadership",
      type: "responsibility",
      importance: "should",
      weight: 0.1,
      synonyms: ["mentoring", "code reviews", "architecture decisions", "tech lead"],
      evidenceHints: ["led team", "mentored juniors", "design documents", "RFC"],
    },
    {
      id: "req-ci-cd",
      label: "CI/CD experience",
      type: "skill",
      importance: "nice",
      weight: 0.05,
      synonyms: ["CI/CD", "GitHub Actions", "Jenkins", "CircleCI"],
      evidenceHints: ["automated pipelines", "deployment automation", "continuous integration"],
    },
    {
      id: "req-accessibility",
      label: "Accessibility knowledge",
      type: "skill",
      importance: "nice",
      weight: 0.05,
      synonyms: ["a11y", "WCAG", "accessibility", "screen readers"],
      evidenceHints: ["ARIA", "keyboard navigation", "semantic HTML", "accessibility audits"],
    },
  ],
}

export const DEMO_CANDIDATES = [
  {
    id: "demo-1",
    name: "Sarah Chen",
    resumeText: `
SARAH CHEN
Senior Frontend Engineer

EXPERIENCE

Stripe (2021-Present) - Senior Frontend Engineer
• Led the redesign of Stripe Dashboard using React 18 and TypeScript, improving page load times by 40%
• Architected a component library used by 15+ teams, with 95% test coverage using Jest and React Testing Library
• Mentored 4 junior engineers and established code review guidelines
• Implemented performance monitoring using Core Web Vitals, achieving 98+ Lighthouse scores

Airbnb (2018-2021) - Frontend Engineer
• Built the booking flow using React hooks and Next.js with SSR
• Reduced bundle size by 35% through code splitting and lazy loading
• Collaborated with design team on accessibility improvements, achieving WCAG AA compliance
• Set up CI/CD pipelines with GitHub Actions for automated testing and deployment

SKILLS
React.js, TypeScript, Next.js, Node.js, GraphQL, Jest, Vitest, Playwright, Tailwind CSS

EDUCATION
BS Computer Science, Stanford University

GITHUB: github.com/sarahchen-dev
    `,
    githubUsername: "sarahchen-dev",
  },
  {
    id: "demo-2",
    name: "Marcus Johnson",
    resumeText: `
MARCUS JOHNSON
Frontend Developer

EXPERIENCE

TechStartup Inc (2022-Present) - Frontend Developer
• Developed web applications using React and JavaScript
• Worked on improving user interfaces
• Participated in code reviews

Freelance (2020-2022)
• Built websites for small businesses
• Used various technologies including React

SKILLS
React, JavaScript, HTML, CSS, Git

EDUCATION
Bootcamp Graduate, General Assembly
    `,
    githubUsername: "marcusj-code",
  },
  {
    id: "demo-3",
    name: "Elena Rodriguez",
    resumeText: `
ELENA RODRIGUEZ
Staff Frontend Engineer

EXPERIENCE

Meta (2019-Present) - Staff Frontend Engineer
• Architected React-based design system serving 200+ engineers, with comprehensive TypeScript types
• Led performance initiative reducing First Contentful Paint by 60% across Instagram web
• Designed and implemented A/B testing framework with React hooks, running 50+ experiments monthly
• Published internal RFC for micro-frontend architecture, adopted by 3 product teams
• Mentored 8 engineers, with 3 promotions to senior level

Google (2016-2019) - Senior Software Engineer
• Built accessibility tools for Google Workspace achieving WCAG AAA compliance
• Developed Next.js-based internal tools with SSR and ISR caching
• Created automated visual regression testing pipeline with 99.9% accuracy
• Contributed to open-source React testing utilities (2k+ GitHub stars)

SKILLS
React, TypeScript, Next.js, GraphQL, Performance Optimization, Design Systems, Accessibility (WCAG), 
Testing (Jest, Playwright, Cypress), CI/CD (GitHub Actions, BuildKite)

PUBLICATIONS
• "Scaling Design Systems at Meta" - React Conf 2023
• "Micro-frontends in Practice" - Frontend Masters workshop

GITHUB: github.com/elenarodriguez
    `,
    githubUsername: "elenarodriguez",
  },
]

export function getDemoChunks(candidate: (typeof DEMO_CANDIDATES)[0]): ArtifactChunk[] {
  const chunks: ArtifactChunk[] = []

  // Resume chunks
  const lines = candidate.resumeText.split("\n").filter((l) => l.trim())
  let buffer = ""
  let chunkIndex = 0

  for (const line of lines) {
    buffer += line + "\n"
    if (buffer.length >= 600) {
      chunks.push({
        id: `resume-${candidate.id}-${chunkIndex++}`,
        source: "resume",
        text: buffer.trim(),
      })
      buffer = ""
    }
  }
  if (buffer.trim()) {
    chunks.push({
      id: `resume-${candidate.id}-${chunkIndex}`,
      source: "resume",
      text: buffer.trim(),
    })
  }

  // Simulated GitHub chunks based on resume mentions
  if (candidate.githubUsername) {
    chunks.push({
      id: `github-${candidate.id}-profile`,
      source: "github",
      url: `https://github.com/${candidate.githubUsername}`,
      text: `GitHub Profile: ${candidate.githubUsername}\nPublic repos: 25\nFollowers: 150`,
    })
  }

  return chunks
}
