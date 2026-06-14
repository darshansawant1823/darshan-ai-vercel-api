const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini"

const baseContext = {
  name: "Darshan Sawant",
  summary:
    "Darshan Sawant designs intelligent digital experiences across UX, AI, visual design, and product systems.",
  sources: [
    ["Home", "https://darshansawant.com/"],
    ["Works", "https://darshansawant.com/works"],
    ["AI Lab", "https://darshansawant.com/labs"],
    ["About", "https://darshansawant.com/about"],
    ["Experience", "https://darshansawant.com/about"],
    ["Visual Design", "https://darshansawant.com/visual-design"],
  ],
  projects: [
    "Eltropy: BFSI communication and customer engagement product work.",
    "Multiplyrr: product experience for growth, creators, and operational workflows.",
    "Sugarlogger: healthcare/LIMS reporting experience and product design.",
    "Oracle: UX work across dashboard and waitlist experiences.",
    "Tekhne: enterprise admin panel work that scaled to 500+ active users per instance.",
    "Godrej: corporate, product, and visual design context.",
  ],
  skills: [
    "UX",
    "AI",
    "BFSI",
    "product design",
    "visual design",
    "design systems",
    "dashboards",
    "enterprise",
    "LIMS",
    "agentic interfaces",
  ],
}

const recruiterPitch =
  "Hiring angle: Darshan is worth a recruiter or hiring manager conversation when the role needs someone who can connect UX craft, enterprise product thinking, AI curiosity, and visual polish without needing every requirement to be spoon-fed."

function setCors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*")
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  response.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

function sourceStrings(labels = []) {
  const selected = labels.length
    ? baseContext.sources.filter(([label]) =>
        labels.some((item) => label.toLowerCase().includes(item.toLowerCase()))
      )
    : baseContext.sources.slice(0, 4)

  return selected.map(([label, url]) => `${label}|${url}`)
}

function fallbackChat(question = "", page = "") {
  const q = `${question} ${page}`.toLowerCase()
  let content = `${baseContext.name} ${baseContext.summary}`
  let labels = ["Home", "About"]

  if (q.includes("eltropy")) {
    content =
      "Eltropy is a BFSI-focused case study in Darshan's portfolio, showing product thinking around customer communication, enterprise workflows, and UX clarity. " +
      recruiterPitch
    labels = ["Works"]
  } else if (q.includes("multiplyrr")) {
    content =
      "Multiplyrr highlights Darshan's product experience across growth, creator, and operational workflows, with emphasis on clear interaction design. " +
      recruiterPitch
    labels = ["Works"]
  } else if (q.includes("sugarlogger")) {
    content =
      "Sugarlogger shows Darshan's healthcare and LIMS-facing product work, including reporting workflows and interface design for complex information. " +
      recruiterPitch
    labels = ["Works"]
  } else if (q.includes("lab") || q.includes("ai")) {
    content =
      "Darshan's AI Lab explores agentic interfaces, AI-assisted UX workflows, and practical product experiments. " +
      recruiterPitch
    labels = ["AI Lab"]
  } else if (q.includes("visual")) {
    content =
      "Darshan's visual design work spans brand, campaign, interface, and polished communication design across product contexts. " +
      recruiterPitch
    labels = ["Visual Design"]
  } else if (q.includes("work") || q.includes("project") || q.includes("case")) {
    content = `${baseContext.projects.join(" ")} ${recruiterPitch}`
    labels = ["Works", "AI Lab"]
  }

  return {
    message: {
      role: "assistant",
      content,
      sources: sourceStrings(labels),
    },
  }
}

function fallbackRecruiter(jobDescription = "") {
