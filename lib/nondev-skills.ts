// Non-Dev Skill Dictionary for HR/Design/PM/Marketing/Ops
// ============================================

export interface NonDevSkill {
  name: string
  category: "recruiting" | "product" | "design" | "marketing" | "data" | "ops" | "general"
  aliases: string[]
  keywords: RegExp[]
  artifacts: string[] // Types of proof that validate this skill
}

export const NONDEV_SKILL_DICTIONARY: NonDevSkill[] = [
  // Recruiting
  {
    name: "Sourcing",
    category: "recruiting",
    aliases: ["talent sourcing", "candidate sourcing", "headhunting"],
    keywords: [/sourc/i, /headhunt/i, /talent.*(acquisition|pipeline)/i, /linkedin.recruiter/i],
    artifacts: ["hire metrics", "pipeline reports", "sourcing strategy deck"],
  },
  {
    name: "ATS Management",
    category: "recruiting",
    aliases: ["applicant tracking", "greenhouse", "lever", "workday recruiting"],
    keywords: [/ats/i, /greenhouse/i, /lever/i, /workday/i, /applicant.track/i, /recruiting.system/i],
    artifacts: ["ATS configuration", "workflow setup", "reporting dashboard"],
  },
  {
    name: "Pipeline Operations",
    category: "recruiting",
    aliases: ["recruiting ops", "hiring pipeline", "talent ops"],
    keywords: [/pipeline/i, /recruiting.ops/i, /hiring.process/i, /candidate.experience/i],
    artifacts: ["pipeline metrics", "process documentation", "SLA reports"],
  },
  {
    name: "Structured Interviews",
    category: "recruiting",
    aliases: ["interview design", "scorecard design", "competency-based interviews"],
    keywords: [/structured.interview/i, /scorecard/i, /competency.based/i, /interview.guide/i, /rubric/i],
    artifacts: ["interview guide", "scorecard template", "calibration notes"],
  },
  {
    name: "Employer Branding",
    category: "recruiting",
    aliases: ["talent brand", "EVP", "employee value proposition"],
    keywords: [/employer.brand/i, /talent.brand/i, /evp/i, /careers.page/i],
    artifacts: ["brand campaign", "careers content", "glassdoor strategy"],
  },

  // Product
  {
    name: "Roadmap Planning",
    category: "product",
    aliases: ["product roadmap", "strategic planning", "prioritization"],
    keywords: [/roadmap/i, /product.strategy/i, /prioritiz/i, /okr/i, /product.planning/i],
    artifacts: ["roadmap deck", "prioritization framework", "OKR doc"],
  },
  {
    name: "Product Discovery",
    category: "product",
    aliases: ["user research", "customer discovery", "problem validation"],
    keywords: [/discovery/i, /user.research/i, /customer.interview/i, /problem.validation/i, /jobs.to.be.done/i],
    artifacts: ["research report", "interview synthesis", "opportunity assessment"],
  },
  {
    name: "Product Analytics",
    category: "product",
    aliases: ["product metrics", "funnel analysis", "user analytics"],
    keywords: [/product.analytics/i, /amplitude/i, /mixpanel/i, /funnel/i, /retention/i, /cohort/i],
    artifacts: ["analytics dashboard", "metrics framework", "experiment results"],
  },
  {
    name: "Experimentation",
    category: "product",
    aliases: ["A/B testing", "growth experiments", "hypothesis testing"],
    keywords: [/experiment/i, /a\/b.test/i, /hypothesis/i, /statistical.significance/i, /optimizely/i],
    artifacts: ["experiment doc", "test results", "learning synthesis"],
  },
  {
    name: "PRD Writing",
    category: "product",
    aliases: ["product requirements", "spec writing", "feature documentation"],
    keywords: [/prd/i, /product.requirement/i, /spec/i, /feature.doc/i, /user.stor/i],
    artifacts: ["PRD doc", "feature spec", "acceptance criteria"],
  },

  // Design
  {
    name: "Figma",
    category: "design",
    aliases: ["figma design", "ui design", "visual design"],
    keywords: [/figma/i, /sketch/i, /ui.design/i, /visual.design/i, /interface.design/i],
    artifacts: ["figma file", "design system", "prototype"],
  },
  {
    name: "Design Systems",
    category: "design",
    aliases: ["component library", "design tokens", "style guide"],
    keywords: [/design.system/i, /component.library/i, /design.token/i, /style.guide/i, /atomic.design/i],
    artifacts: ["design system doc", "component library", "token spec"],
  },
  {
    name: "UX Research",
    category: "design",
    aliases: ["user testing", "usability testing", "user interviews"],
    keywords: [/ux.research/i, /user.test/i, /usability/i, /user.interview/i, /persona/i],
    artifacts: ["research report", "usability findings", "persona doc"],
  },
  {
    name: "Prototyping",
    category: "design",
    aliases: ["interactive prototype", "clickable prototype", "high-fidelity prototype"],
    keywords: [/prototyp/i, /interactive/i, /click.through/i, /invision/i, /principle/i],
    artifacts: ["prototype link", "interaction spec", "flow demo"],
  },
  {
    name: "Information Architecture",
    category: "design",
    aliases: ["IA", "navigation design", "content structure"],
    keywords: [/information.architecture/i, /\bia\b/i, /navigation.design/i, /sitemap/i, /taxonomy/i],
    artifacts: ["sitemap", "IA diagram", "navigation spec"],
  },

  // Marketing
  {
    name: "Growth Marketing",
    category: "marketing",
    aliases: ["growth hacking", "acquisition marketing", "performance marketing"],
    keywords: [/growth/i, /acquisition/i, /performance.market/i, /cac/i, /ltv/i],
    artifacts: ["growth deck", "channel strategy", "attribution report"],
  },
  {
    name: "SEO",
    category: "marketing",
    aliases: ["search optimization", "organic search", "technical SEO"],
    keywords: [/\bseo\b/i, /search.optim/i, /organic/i, /keyword/i, /serp/i],
    artifacts: ["SEO audit", "keyword strategy", "ranking report"],
  },
  {
    name: "Paid Advertising",
    category: "marketing",
    aliases: ["paid media", "PPC", "paid social", "Google Ads", "Facebook Ads"],
    keywords: [/paid/i, /ppc/i, /google.ads/i, /facebook.ads/i, /meta.ads/i, /linkedin.ads/i],
    artifacts: ["campaign report", "ad creative", "ROAS analysis"],
  },
  {
    name: "Lifecycle Marketing",
    category: "marketing",
    aliases: ["email marketing", "CRM marketing", "retention marketing"],
    keywords: [/lifecycle/i, /email.market/i, /crm/i, /retention/i, /drip/i, /nurture/i],
    artifacts: ["email sequence", "lifecycle map", "retention analysis"],
  },
  {
    name: "Content Marketing",
    category: "marketing",
    aliases: ["content strategy", "editorial", "blog management"],
    keywords: [/content.market/i, /content.strategy/i, /editorial/i, /blog/i, /thought.leadership/i],
    artifacts: ["content calendar", "editorial guidelines", "content performance"],
  },

  // Data
  {
    name: "SQL",
    category: "data",
    aliases: ["database querying", "data extraction", "BigQuery", "Snowflake"],
    keywords: [/\bsql\b/i, /bigquery/i, /snowflake/i, /redshift/i, /postgres/i, /query/i],
    artifacts: ["query examples", "data model doc", "analysis notebook"],
  },
  {
    name: "Dashboard Building",
    category: "data",
    aliases: ["data visualization", "Looker", "Tableau", "Metabase"],
    keywords: [/dashboard/i, /looker/i, /tableau/i, /metabase/i, /power.bi/i, /visualization/i],
    artifacts: ["dashboard link", "viz portfolio", "reporting framework"],
  },
  {
    name: "Experiment Design",
    category: "data",
    aliases: ["statistical analysis", "hypothesis testing", "causal inference"],
    keywords: [/experiment.design/i, /statistical/i, /hypothesis/i, /significance/i, /causal/i, /bayesian/i],
    artifacts: ["experiment framework", "analysis doc", "stats methodology"],
  },
  {
    name: "Metrics Definition",
    category: "data",
    aliases: ["KPI design", "north star metrics", "OKR metrics"],
    keywords: [/metric/i, /kpi/i, /north.star/i, /measurement/i, /instrumentation/i],
    artifacts: ["metrics framework", "KPI doc", "data dictionary"],
  },

  // Ops
  {
    name: "Stakeholder Management",
    category: "ops",
    aliases: ["cross-functional collaboration", "executive communication", "alignment"],
    keywords: [/stakeholder/i, /cross.functional/i, /executive/i, /alignment/i, /communication/i],
    artifacts: ["stakeholder map", "comm plan", "status reports"],
  },
  {
    name: "Compliance",
    category: "ops",
    aliases: ["regulatory", "SOC2", "GDPR", "risk management"],
    keywords: [/compliance/i, /regulatory/i, /soc.?2/i, /gdpr/i, /hipaa/i, /risk/i, /audit/i],
    artifacts: ["compliance doc", "audit report", "policy framework"],
  },
  {
    name: "Documentation",
    category: "ops",
    aliases: ["technical writing", "process documentation", "knowledge management"],
    keywords: [/documentation/i, /technical.writ/i, /process.doc/i, /knowledge.base/i, /wiki/i, /notion/i],
    artifacts: ["doc portfolio", "process guide", "knowledge base"],
  },
  {
    name: "Process Improvement",
    category: "ops",
    aliases: ["operational excellence", "efficiency", "automation"],
    keywords: [/process.improv/i, /operational/i, /efficiency/i, /automat/i, /workflow/i, /streamlin/i],
    artifacts: ["process map", "improvement report", "efficiency metrics"],
  },
  {
    name: "Project Management",
    category: "ops",
    aliases: ["program management", "Jira", "Asana", "sprint planning"],
    keywords: [/project.manag/i, /program.manag/i, /jira/i, /asana/i, /sprint/i, /agile/i, /scrum/i],
    artifacts: ["project plan", "gantt chart", "sprint reports"],
  },

  // General
  {
    name: "Presentation Skills",
    category: "general",
    aliases: ["public speaking", "deck creation", "executive presentations"],
    keywords: [/presentation/i, /public.speak/i, /deck/i, /keynote/i, /pitch/i],
    artifacts: ["presentation deck", "talk recording", "pitch deck"],
  },
  {
    name: "Leadership",
    category: "general",
    aliases: ["team management", "people management", "mentorship"],
    keywords: [/leadership/i, /team.manag/i, /people.manag/i, /mentor/i, /coach/i, /direct.report/i],
    artifacts: ["team structure", "1:1 framework", "leadership philosophy"],
  },
]

// Get skills by category
export function getSkillsByCategory(category: NonDevSkill["category"]): NonDevSkill[] {
  return NONDEV_SKILL_DICTIONARY.filter((s) => s.category === category)
}

// Get all skill names
export function getAllNonDevSkillNames(): string[] {
  return NONDEV_SKILL_DICTIONARY.map((s) => s.name)
}

// Match text against non-dev skills
export function matchNonDevSkills(text: string): Array<{ skill: NonDevSkill; confidence: number }> {
  const matches: Array<{ skill: NonDevSkill; confidence: number }> = []
  const lowerText = text.toLowerCase()

  for (const skill of NONDEV_SKILL_DICTIONARY) {
    let matched = false
    let confidence = 0.3 // Base confidence for keyword match

    // Check direct name match
    if (lowerText.includes(skill.name.toLowerCase())) {
      matched = true
      confidence = 0.5
    }

    // Check aliases
    for (const alias of skill.aliases) {
      if (lowerText.includes(alias.toLowerCase())) {
        matched = true
        confidence = Math.max(confidence, 0.45)
      }
    }

    // Check keywords
    for (const keyword of skill.keywords) {
      if (keyword.test(text)) {
        matched = true
        confidence = Math.max(confidence, 0.4)
      }
    }

    // Check for artifact mentions (boosts confidence)
    for (const artifact of skill.artifacts) {
      if (lowerText.includes(artifact.toLowerCase())) {
        matched = true
        confidence = Math.min(1, confidence + 0.2)
      }
    }

    if (matched) {
      matches.push({ skill, confidence })
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence)
}
