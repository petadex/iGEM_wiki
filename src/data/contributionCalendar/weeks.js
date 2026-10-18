import { SUBTEAM_BY_ID, SUBTEAM_IDS } from "../subteamTracks.js"
import { buildWeekSkeleton, formatDayShort } from "./calendarUtils.js"

/** @typedef {import('../subteamTracks.js').SubteamId} SubteamId */
/** @typedef {import('../subteamTracks.js').MilestoneTrackId} MilestoneTrackId */

/**
 * @typedef {Object} WeekMilestone
 * @property {string} date - YYYY-MM-DD
 * @property {string} label
 * @property {MilestoneTrackId} subteamId - a subteam, or "all" for whole-team dates
 */

/**
 * @typedef {Object} SubteamWeekContent
 * @property {string} summary
 * @property {string} [detail]
 * @property {string} [link]
 */

/**
 * @typedef {Object} ContributionWeek
 * @property {string} id
 * @property {string} start
 * @property {string} end
 * @property {string[]} monthKeys
 * @property {string} overview
 * @property {WeekMilestone[]} milestones
 * @property {Record<SubteamId, SubteamWeekContent>} subteams
 */

/*
 * Sources: the leads' weekly updates and announcements on Discord, subteam
 * channels, meeting minutes and slides in the team Drive, and the Hardware and
 * Wet Lab notebooks. Milestones are the important dates (they show on the
 * calendar); the week overview and subteam entries are the sidebar; the day by
 * day specifics live in the notebooks, which the subteam entries link to.
 */

/** Weeks starting before this are past: gaps say "Slow week", not "coming soon". */
const PAST_WEEK_QUIET_BEFORE = "2026-10-11"

/** The calendar opens on the latest week on the record. */
const LATEST_WEEK_ID = "week-2026-10-04"

/** Start of the week each subteam first met; earlier weeks say "Not started yet". */
const SUBTEAM_FIRST_WEEK = {
  venture: "2026-01-04",
  outreach: "2026-01-18",
  dryLab: "2026-02-01",
  humanPractices: "2026-02-15",
  web: "2026-02-22",
  wetLab: "2026-03-08",
  hardware: "2026-03-08",
}

const WL = (date) => `/wet-lab/notebook/#journal-${date}`
const HW = (date) => `/hardware/notebook/#journal-${date}`
const DRY = "/dry-lab/overview/"
const WEB = "/wiki/"
const VENTURE = "/entrepreneurship/"
const HP = "/human-practices/"
const OUTREACH = "/beyond-the-bench/outreach/"

const BEFORE_RECORDS =
  "Before the season's records begin. The 2026 team's announcements start on December 19, 2025."

function defaultSubteams() {
  /** @type {Record<SubteamId, SubteamWeekContent>} */
  const subteams = {}
  for (const id of SUBTEAM_IDS) {
    subteams[id] = {
      summary: "Progress update coming soon.",
      detail: "",
    }
  }
  return subteams
}

/**
 * Week copy keyed by week id (`week-` + Sunday). Outreach and Human Practices
 * come from their own patch layers below.
 */
const WEEK_CONTENT_OVERRIDES = {
  "week-2025-11-30": { overview: BEFORE_RECORDS },
  "week-2025-12-07": { overview: BEFORE_RECORDS },
  "week-2025-12-14": {
    overview:
      "The team's announcements channel opened on December 19, the start of the 2026 season's records. Socials, competitions and team-wide updates are posted there first.",
  },
  "week-2025-12-21": {
    overview: "Winter break. No meetings on the record.",
  },
  "week-2025-12-28": {
    overview:
      "The presidents set up the first General Meeting and called for project proposals, due January 9, to be pitched there.",
  },

  "week-2026-01-04": {
    overview:
      "Recruitment season. The team ran a booth at the EngSci Winter Fair on January 7, and the Tech Futures Challenge, a mentorship and pitch competition, was shared with the team.",
    milestones: [{ date: "2026-01-07", label: "EngSci Winter Fair booth", subteamId: "all" }],
    subteams: {
      venture: {
        summary: "Scouting competitions and incubators.",
        detail:
          "Compared start-up competitions and incubators (Hult Prize, UTEST) against the project timeline, since most incubators expect a commitment beyond the iGEM cycle.",
        link: VENTURE,
      },
    },
  },
  "week-2026-01-11": {
    overview:
      "First General Meeting on January 14, with project pitches. The plastic-degrading enzymes project won the vote with 100% approval from 20 voters on January 16.",
    milestones: [
      { date: "2026-01-14", label: "First GM: project pitches", subteamId: "all" },
      { date: "2026-01-16", label: "Plastic-degrading enzymes project chosen", subteamId: "all" },
    ],
    subteams: {
      venture: {
        summary: "Grant hunting; Tech Futures Challenge team formed.",
        detail:
          "Started the Skule Endowment proposal (due January 31) and flagged the Undergraduate Research Fund. Invites went out to the iGEM Toronto Tech Futures Challenge team on January 16.",
        link: VENTURE,
      },
    },
  },
  "week-2026-01-18": {
    overview:
      "Recruitment. The presidents reviewed external lead applications through January 23, with at least one lead onboarded for every subteam. Member applications were extended by popular request.",
    subteams: {
      venture: {
        summary: "Incubator list and applicant review.",
        detail:
          "Collected incubators with summer programs and started reviewing Venture applicants.",
        link: VENTURE,
      },
    },
  },
  "week-2026-01-25": {
    overview:
      "Hiring continued, including a call for web developers. Venture planned its Tech Futures Challenge commitments and incubator applications.",
    subteams: {
      venture: {
        summary: "Tech Futures Challenge plan and incubator applications.",
        detail:
          "• Tech Futures Challenge members signed on for daily meetings, weekly advisor presentations, business-plan research and pitch decks.\n• Incubator plan: NEST (due January 31), Treefrog, Plug and Play, H2i and Creative Destruction Lab.\n• Planned an Innovation Fair poster and the Tech Futures Challenge pitch video (due February 26).",
        link: VENTURE,
      },
    },
  },

  "week-2026-02-01": {
    overview:
      "iGEM Toronto paid its Stage 1 fees on February 7 (4,950 euros, saved from last year) and is a registered 2026 team. Dry Lab leads scoped the year's work around the PETadex.",
    milestones: [{ date: "2026-02-07", label: "Registered for iGEM 2026", subteamId: "all" }],
    subteams: {
      dryLab: {
        summary: "Dry Lab scoped around the PETadex.",
        detail:
          "The Dry Lab leads planned roles for the year. The focus: use the PETadex, an open database of more than 215 million candidate plastic-degrading enzymes, to find the most efficient ones. Biorecycling of plastic waste was discussed as the real-world application.",
        link: DRY,
      },
      venture: {
        summary: "Research grant strategy.",
        detail:
          "Worked out how to apply for research funding as iGEM while disclosing existing funding: Prof. Babaian's lab covers hardware, but wet lab reagents were not yet funded.",
        link: VENTURE,
      },
    },
  },
  "week-2026-02-08": {
    overview:
      "A quiet stretch around midterms. Venture checked grant eligibility and was pointed to a deep-tech commercialization talk by the team's PI.",
  },
  "week-2026-02-15": {
    overview:
      "Applicant interviews continued, and Human Practices held its first stakeholder conversation.",
  },
  "week-2026-02-22": {
    overview:
      "New members joined on February 25 and signed the team IP agreement. Dry Lab met its new members, and the Tech Futures Challenge pitch video was due February 26.",
    milestones: [
      { date: "2026-02-25", label: "New members join", subteamId: "all" },
      { date: "2026-02-26", label: "Tech Futures Challenge video due", subteamId: "venture" },
    ],
    subteams: {
      dryLab: {
        summary: "Dry Lab team formed.",
        detail:
          "New members introduced themselves and were added to the PETadex and iGEM GitHub organizations, where all Dry Lab work is hosted.",
        link: DRY,
      },
      web: {
        summary: "Joining the PETadex website meetings.",
        detail:
          "Web members were invited to the weekly PETadex website meeting at the Donnelly Centre. The site hosts the plastic-degrading enzyme data from the Logan paper.",
        link: WEB,
      },
      venture: {
        summary: "Tech Futures Challenge pitch video.",
        detail: "The team's Tech Futures Challenge pitch video was due February 26.",
        link: VENTURE,
      },
    },
  },

  "week-2026-03-01": {
    overview:
      "The kickoff General Meeting on March 3 officially started the project cycle. Subteams set their weekly meeting times.",
    milestones: [{ date: "2026-03-03", label: "Kickoff GM: cycle begins", subteamId: "all" }],
    subteams: {
      dryLab: {
        summary: "First Dry Lab meeting.",
        detail:
          "Introductions, a run-down of the PETadex and what its data looks like, and projects members could start right away. Weekly in-person meetings set for the term.",
        link: DRY,
      },
      web: {
        summary: "Informal web dev meeting.",
        detail:
          "An in-person web dev meeting to plan regular meetings separately from the PETadex website team.",
        link: WEB,
      },
    },
  },
  "week-2026-03-08": {
    overview:
      "Web became its own subteam again (March 11). Dry Lab assigned its starter projects, and Hardware chose the Pioreactor, an open-source bioreactor kit, as its starting platform.",
    milestones: [
      { date: "2026-03-11", label: "Web becomes its own subteam", subteamId: "web" },
      { date: "2026-03-14", label: "Dry Lab projects assigned", subteamId: "dryLab" },
    ],
    subteams: {
      wetLab: {
        summary: "Assay brainstorming begins.",
        detail:
          "The first brainstorming sessions on how to screen many PETases for activity at once. Ideas were collected for the March 19 debrief.",
        link: WL("2026-03-19"),
      },
      dryLab: {
        summary: "Starter projects posted and assigned.",
        detail:
          "Ideas went on the GitHub board, labelled machine learning, bioinformatics, website or beginner-friendly. Members got database access and example notebooks, and Meeting #2 on March 14 assigned everyone a project.",
        link: DRY,
      },
      hardware: {
        summary: "Hardware onboarding; Pioreactor chosen as the base.",
        detail:
          "• Oriented the team on the Pioreactor as the starting platform.\n• Flagged a wet lab assay constraint: cells that cut PET without binding to the collector would give false positives.",
        link: HW("2026-03-13"),
      },
      web: {
        summary: "Web split from Outreach.",
        detail:
          "Web is a separate subteam again under its own lead, with Saturday meetings starting March 21. Members can still join Outreach meetings.",
        link: WEB,
      },
    },
  },
  "week-2026-03-15": {
    overview:
      "Outreach launched the logo design competition (March 16) and GM 3 was held March 17. Wet Lab narrowed its assay ideas, and Dry Lab and Web held their first sprint meetings.",
    subteams: {
      wetLab: {
        summary: "Meeting #2: assay ideas narrowed.",
        detail:
          "Debriefed the first two brainstorming sessions. Surface collection and a dropout assay carried forward, with internal controls planned: a catalytically dead PETase plus low- and high-activity PETases.",
        link: WL("2026-03-19"),
      },
      dryLab: {
        summary: "First round of project pitches.",
        detail:
          "Half the team gave two-minute presentations of their projects on March 21. Members joined the PETadex channel on the RNAlab Slack to find earlier work.",
        link: DRY,
      },
      hardware: {
        summary: "Sprint 1 closed after the first Pioreactor build.",
        detail:
          "• Pain points from the build: hard-to-reach screws, unclear instructions, one microcontroller per reactor on the hat board, and materials that hurt accessibility.\n• Planned the software and a second Pioreactor build.",
        link: HW("2026-03-20"),
      },
      venture: {
        summary: "Business plan and grants.",
        detail:
          "Through March, Venture drafted the first quarter of the business plan and applied for three grants.",
        link: VENTURE,
      },
      web: {
        summary: "First Web meeting.",
        detail:
          "First meeting on March 21. The wiki repo lives in the PETadex GitHub organization, with tasks tracked as issues.",
        link: WEB,
      },
    },
  },
  "week-2026-03-22": {
    overview:
      "Biweekly GMs ended in favour of subteam meetings, and the Discord server was reorganized so each subteam has its own category. Venture pitched at the Global BioHackathon (March 27 to 29).",
    subteams: {
      wetLab: {
        summary: "Benchling training.",
        detail:
          "A Benchling tutorial on March 27, recorded for anyone who missed it.",
        link: WL("2026-03-19"),
      },
      dryLab: {
        summary: "Second round of pitches; first sprint underway.",
        detail:
          "The other half of the team presented on March 28. Everyone tagged their current-sprint work on the GitHub board and summarized their project for the PETadex team.",
        link: DRY,
      },
      hardware: {
        summary: "Design criteria for an accessible DIY bioreactor.",
        detail:
          "• Agreed on a friendly UI, clear instructions and safe assembly.\n• Core features: optical density (growth) sensing, mixing, a web interface, pumps and heating. Upstream and downstream separators deprioritized for now.",
        link: HW("2026-03-27"),
      },
      venture: {
        summary: "Global BioHackathon pitch.",
        detail:
          "Six speakers covered problem, value proposition, business model, customers and partner labs. The team made the pitch slides, script and video in 48 hours.",
        link: VENTURE,
      },
      web: {
        summary: "Studying past winning wikis.",
        detail:
          "Each member reviewed at least three past winning wikis and listed features to borrow, for an action plan the following week.",
        link: WEB,
      },
    },
  },
  "week-2026-03-29": {
    overview:
      "Venture won the Judges' Choice Award at the Global BioHackathon, against 60+ start-ups that included teams led by professors and PhD students. Most subteams wound down for exams.",
    milestones: [
      { date: "2026-03-29", label: "BioHackathon Judges' Choice Award", subteamId: "venture" },
    ],
    subteams: {
      wetLab: {
        summary: "Optional brainstorm over Easter.",
        detail: "The Good Friday meeting became an optional online brainstorm.",
        link: WL("2026-03-19"),
      },
      dryLab: {
        summary: "Optional meeting; exam break.",
        detail:
          "An optional online meeting over Easter, then a pause for exams with projects picking up in the summer.",
        link: DRY,
      },
      venture: {
        summary: "Judges' Choice at the Global BioHackathon.",
        detail:
          "In one month Venture drafted a quarter of the business plan, made pitch slides, filmed two pitch videos, applied for three grants and won a global pitch competition. April's focus moved to grants and the Wilbe program.",
        link: VENTURE,
      },
      web: {
        summary: "Pause for exams.",
        detail:
          "Meetings paused until after exams. Members shared features from past winners: a homepage that tells a story, an on-theme loading screen and one colour scheme throughout.",
        link: WEB,
      },
    },
  },

  "week-2026-04-05": {
    overview:
      "Exam season. Venture ran a seven-day Wilbe sprint and needed a PetaScale logo for its booth at Web Summit Vancouver.",
    subteams: {
      venture: {
        summary: "Wilbe sprint and grant editing.",
        detail:
          "Wilbe supports researchers turning their work into companies. Members each took a section of the application while grants were edited, and a corporate PetaScale logo was requested for the Web Summit booth.",
        link: VENTURE,
      },
    },
  },
  "week-2026-04-12": {
    overview:
      "The Grand Jamboree was announced for Paris, November 13 to 16. Venture won the Awesome Foundation research grant, and Hardware debriefed with the Pioreactor CEO.",
    milestones: [
      { date: "2026-04-14", label: "Awesome Foundation grant won", subteamId: "venture" },
      { date: "2026-04-15", label: "Hardware parts-list kickoff", subteamId: "hardware" },
    ],
    subteams: {
      hardware: {
        summary: "Kit vendor debrief and parts-list kickoff.",
        detail:
          "• Met with the Pioreactor CEO; chose cheaper microcontrollers over Raspberry Pi for sensing boards.\n• Assigned owners for the bill of materials (parts list: pumps, optical density (growth) sensors, pH, temperature, fan, glassware) and reviewed written requirements.",
        link: HW("2026-04-15"),
      },
      venture: {
        summary: "Awesome Foundation grant; Web Summit prep.",
        detail:
          "Won the Awesome Foundation research grant, with two more grant applications out. Three members prepared to exhibit at Web Summit Vancouver in May, with conversations open with founders and venture capital firms.",
        link: VENTURE,
      },
    },
  },
  "week-2026-04-19": {
    overview:
      "Dry Lab got its own workspace: five workstations on the Donnelly Centre's 6th floor, next to the RNAlab.",
    milestones: [
      { date: "2026-04-21", label: "Dry Lab workspace at the Donnelly Centre", subteamId: "dryLab" },
    ],
    subteams: {
      wetLab: {
        summary: "Call for assay research help.",
        detail: "Members done with exams were asked to help with assay research.",
        link: "/wet-lab/notebook/",
      },
      dryLab: {
        summary: "Workspace set up next to the RNAlab.",
        detail:
          "The leads set up docking stations on April 22, with direct access to help from the RNAlab next door.",
        link: DRY,
      },
      venture: {
        summary: "Investor and partner list.",
        detail:
          "Started a running list of venture capital firms and organizations interested in working with the team.",
        link: VENTURE,
      },
    },
  },
  "week-2026-04-26": {
    overview:
      "Exams ended April 30. Subteams collected summer availability and set their summer meeting times.",
    subteams: {
      wetLab: {
        summary: "Planning for lab access.",
        detail:
          "Lab access expected in mid to late May; early May goes to assay design and the risk forms (RRFs) needed to work in the lab.",
        link: "/wet-lab/notebook/",
      },
      hardware: {
        summary: "Parts research and clearer requirements.",
        detail:
          "• Compared pumps, sensors, and microcontroller options on the shared parts list (Digikey/Adafruit).\n• Synced with dry lab and wet lab on what the bioreactor must measure; flagged unclear requirement wording.",
        link: HW("2026-04-29"),
      },
      venture: {
        summary: "Weekly meetings return.",
        detail: "Summer meetings set for Thursday evenings.",
        link: VENTURE,
      },
      web: {
        summary: "Summer schedule.",
        detail: "Members shared summer availability as wiki work ramps up.",
        link: WEB,
      },
    },
  },

  "week-2026-05-03": {
    overview:
      "Summer started. Master task trackers went live, the names PetaBite (the iGEM project), PETadex (the database) and PetaScale (the start-up) were set on May 6, and the team joined the Trash Team's Microplastic Blitz on May 9.",
    milestones: [
      { date: "2026-05-06", label: "PetaBite, PETadex and PetaScale named", subteamId: "all" },
      { date: "2026-05-09", label: "Microplastic Blitz with the Trash Team", subteamId: "all" },
      { date: "2026-05-09", label: "First sponsor: HMB", subteamId: "venture" },
    ],
    subteams: {
      wetLab: {
        summary: "Summer meetings restart; assay subgroups formed.",
        detail:
          "Weekly Thursday meetings restarted on May 7. Members joined three assay subgroups, and volunteers took the open research questions.",
        link: WL("2026-05-07"),
      },
      dryLab: {
        summary: "First summer meeting.",
        detail:
          "Set the direction of the project and how meetings run over the summer (May 9). Members were invited to computational biology talks on May 5.",
        link: DRY,
      },
      hardware: {
        summary: "Parts evaluation before May ordering.",
        detail:
          "• Compared sensor wiring options and cable costs for multi-sensor setups.\n• Team assigned to review Pioreactor source code ahead of prototyping.",
      },
      venture: {
        summary: "First sponsor; wastewater tracker and sponsor outreach.",
        detail:
          "• HMB agreed to $1,000 after seeing the sponsorship package.\n• Started a tracker of Canada's 2,000+ municipal wastewater treatment systems, split by province.\n• Sponsor outreach team formed. Members also pitched at the UofT Rendezvous pitch competition on May 9.",
        link: VENTURE,
      },
    },
  },
  "week-2026-05-10": {
    overview:
      "PetaScale won Best Pitch at UATech Vancouver ($25,000 in AWS credits) and took the stage at Web Summit Vancouver on May 14, where it was selected for the showcase (top 8% of 1,200 start-ups).",
    milestones: [
      { date: "2026-05-12", label: "UATech Best Pitch ($25k AWS)", subteamId: "venture" },
      { date: "2026-05-14", label: "PetaScale at Web Summit Vancouver", subteamId: "venture" },
    ],
    subteams: {
      wetLab: {
        summary: "Subgroup roles and office hours.",
        detail:
          "Members took their assay-subgroup roles, and a lead ran weekday office hours for assay design questions.",
        link: WL("2026-05-07"),
      },
      dryLab: {
        summary: "$25,000 in AWS credits.",
        detail:
          "The UATech prize became Dry Lab's main compute, so the team no longer relies on the lab's servers. Saturday meetings set for the summer.",
        link: DRY,
      },
      hardware: {
        summary: "Parts orders decided; prototyping assigned.",
        detail:
          "• May 12: locked ordering path for connectors, an external temperature sensor, and manual pH via a wet-lab probe.\n• May 16: split optical density (culture growth) sensing, heater, and microcontroller connectivity across owners; calibration box work started.",
        link: HW("2026-05-16"),
      },
      venture: {
        summary: "UATech Best Pitch and Web Summit.",
        detail:
          "Best Pitch at UATech Vancouver, then Web Summit: showcase pick (top 8% of 1,200 start-ups) and IMPACT selection for sustainability (top 10%). An early business plan went out to frame the wastewater feasibility conversations.",
        link: VENTURE,
      },
    },
  },
  "week-2026-05-17": {
    overview:
      "The logo competition winner was picked on May 18. Wet Lab members submitted their safety training for the BME teaching lab, and Web looked at a content management system (CMS) so other subteams can edit pages.",
    subteams: {
      wetLab: {
        summary: "Safety training for the BME teaching lab.",
        detail:
          "Members uploaded proof of the lab and biosafety training required to work in the BME teaching lab.",
        link: WL("2026-05-25"),
      },
      dryLab: {
        summary: "Compute set up for every project.",
        detail:
          "Mid-week check-in: everyone set up with compute (Azure for now, with the AWS credits coming online).",
        link: DRY,
      },
      hardware: {
        summary: "Pump and growth-sensor bench tests.",
        detail:
          "• Ran a peristaltic pump test with dyed water; plumbing looked good.\n• Optical density (growth) readings were noisy, so calibration continues; real-time pH sensing deprioritized after wet-lab discussion.",
        link: HW("2026-05-19"),
      },
      venture: {
        summary: "Wastewater repository and competitor analysis.",
        detail:
          "Finished the wastewater plant repository and mapped provincial, federal and municipal rules. Each member profiled one competitor in the enzyme or recycling space (for example Carbios, Loop Industries and Novozymes).",
        link: VENTURE,
      },
      web: {
        summary: "Looking at a CMS.",
        detail:
          "Compared TinaCMS and Strapi so non-web members can write their own pages, weighing the extra hosting a live CMS needs.",
        link: WEB,
      },
    },
  },
  "week-2026-05-24": {
    overview:
      "Weekly leads updates began on May 26. Wet Lab locked in E. coli as its organism, the Plastic Conference became official, and Venture took Silver at the Tech Futures Challenge national final on May 30.",
    milestones: [
      { date: "2026-05-26", label: "Bioreactor requirements aligned", subteamId: "hardware" },
      { date: "2026-05-30", label: "Tech Futures Challenge: Silver", subteamId: "venture" },
    ],
    subteams: {
      wetLab: {
        summary: "Organism locked; lab tour.",
        detail:
          "E. coli confirmed as the working organism and the assay plans rewritten to match. Copper phthalate chosen to load copper into PET. First orders arrived, and the mandatory teaching-lab tour ran May 25.",
        link: WL("2026-05-25"),
      },
      dryLab: {
        summary: "500K structures and 9,000 papers.",
        detail:
          "Scraped 500,000 AlphaFold structures and compiled 9,000 plastic degradation papers; quality control of the ESM Atlas in progress. Started working with Wet Lab toward an enzyme library, targeting July.",
        link: DRY,
      },
      hardware: {
        summary: "Cross-subteam bioreactor requirements aligned.",
        detail:
          "• Filmed a Pioreactor demo; dry lab confirmed temperature sweeps matter more than pH (25–70 °C target).\n• Agreed on continuous flow, growth-sensor feedback, and a 3-pump layout; documented heater power and warm-up time.\n• May 30: started a tradeoff table for connecting several reactors.",
        link: HW("2026-05-26"),
      },
      venture: {
        summary: "Silver at the Tech Futures Challenge; sponsors grow.",
        detail:
          "• CAGEF confirmed $1,800 (May 25) and Twist Bioscience came on as a sponsor (May 28), bringing sponsorship to about $3,000.\n• Provincial wastewater regulatory mapping done; media contacts lined up.\n• Silver at the Tech Futures Challenge national final on May 30.",
        link: VENTURE,
      },
      web: {
        summary: "CMS live on Azure; wiki framework nearly done.",
        detail:
          "Decided to try the CMS and fall back to pull requests if it doesn't work out. The CMS went live on Azure, and the homepage zoom effect was prototyped.",
        link: WEB,
      },
    },
  },
  "week-2026-05-31": {
    overview:
      "Wet Lab's first days in the lab. The PETadex passed 300 million enzyme candidates, Venture added CSB as a sponsor, and the tagline was set: \"Take a Byte out of plastic.\"",
    milestones: [
      { date: "2026-06-02", label: "System architecture drafted", subteamId: "hardware" },
      { date: "2026-06-02", label: "PETadex passes 300M candidates", subteamId: "dryLab" },
      { date: "2026-06-03", label: "First day in the lab", subteamId: "wetLab" },
    ],
    subteams: {
      wetLab: {
        summary: "First lab days: reagents organized, media and plates made.",
        detail:
          "Picked up orders and labelled reagents (June 3), then made liquid and solid growth media (LB), autoclaved them and poured LB, ampicillin and kanamycin plates (June 4). Expert review of the assay plans came back positive, with the idea of melting copper phthalate directly into PET.",
        link: WL("2026-06-03"),
      },
      dryLab: {
        summary: "300 million candidates in the PETadex.",
        detail:
          "• All catalytic open reading frames (100 GB) are on S3.\n• 300M candidates: 18M at high identity, 1.8M at medium, 22K at low.\n• Building a search over all 300M sequences in under a minute with AWS Lambda; ESM-2 UMAP done and ancestral reconstructions in.",
        link: DRY,
      },
      hardware: {
        summary: "System architecture drafted; growth-sensor parts ordered.",
        detail:
          "• Drafted how sensors talk to a microcontroller and then to cloud analytics; split on-device controls (temp, runtime, growth) from cloud charts.\n• Chose a photodiode-based optical density sensor for culture growth; ordered parts and assigned validation experiments.\n• One-on-one check-ins with every member; found a way to hit the 50 °C target.",
        link: HW("2026-06-02"),
      },
      venture: {
        summary: "CSB sponsorship; Roche and Nature applications.",
        detail:
          "CSB confirmed $1,000 (June 3). The Roche application and the Nature awards application went in. Takeaway from the Tech Futures Challenge: every member should be able to speak to every subteam's work.",
        link: VENTURE,
      },
      web: {
        summary: "Wiki framework almost done.",
        detail:
          "The CMS goes to the whole team for review next. A homepage navigation sketch came in from web design.",
        link: WEB,
      },
    },
  },
  "week-2026-06-07": {
    overview:
      "The iGEM Toronto 2026 Manifesto went out to the whole team (June 8). Venture landed its first Diamond sponsor and split into three commercial subteams, and Hardware finished its system architecture.",
    milestones: [
      { date: "2026-06-08", label: "Team manifesto released", subteamId: "all" },
      { date: "2026-06-08", label: "First Diamond sponsor (NEB, IDT)", subteamId: "venture" },
    ],
    subteams: {
      wetLab: {
        summary: "Competent cells and selection-assay design.",
        detail:
          "Competent cells are bacteria prepared so they can take up DNA. Picked up cells and culture, toured the BME teaching lab, made SOB media and the first batch of competent cells (June 11 to 12). Risk forms (RRFs) went to all members, and subgroup leads began running their own meetings.",
        link: WL("2026-06-11"),
      },
      dryLab: {
        summary: "Moved to AWS; split into two groups.",
        detail:
          "Everything migrated from Azure to AWS. The team split into one group building the machine learning pipeline for PETase activity and thermal stability, and one designing the synthesis library for Wet Lab. Meetings moved to Tuesdays.",
        link: DRY,
      },
      hardware: {
        summary: "Validation experiments defined; CAD underway.",
        detail:
          "• Defined design-of-experiment checks for flow rate, temperature accuracy, autoclave (sterilization) path, and sourcing.\n• 3D design underway for caps and optical-density (growth) sensor parts; power budget documented.\n• Control logic defined; three groups (power, data transfer, bioreactor function) working in parallel.",
        link: HW("2026-06-09"),
      },
      venture: {
        summary: "First Diamond sponsor; three commercial subteams.",
        detail:
          "NEB (lab kits) and IDT (up to 40 kb of gene fragments) together made the first Diamond sponsor. Venture split into wastewater, bioremediation and detergent subteams and began joining Human Practices interviews.",
        link: VENTURE,
      },
      web: {
        summary: "Plastic Conference website started.",
        detail: "Building the conference website from Human Practices' specs.",
        link: WEB,
      },
    },
  },
  "week-2026-06-14": {
    overview:
      "Wet Lab ran its first full lab week, the public wiki draft went live, and Human Practices finished a 40+ page conference proposal and presented a poster at Synbio in Waterloo.",
    milestones: [
      { date: "2026-06-15", label: "First full lab week", subteamId: "wetLab" },
      { date: "2026-06-16", label: "Public wiki draft live", subteamId: "web" },
    ],
    subteams: {
      wetLab: {
        summary: "First full lab week: transformations and minipreps.",
        detail:
          "All members BME trained. Monday to Friday: starter cultures (DH5α and BL21), transformations with test and distribution plasmids, glycerol stocks, plasmid cleanup (minipreps) and chloramphenicol and ampicillin selection plates. The first plasmid design was finalized and its insert is ready to order.",
        link: WL("2026-06-15"),
      },
      dryLab: {
        summary: "Modelling direction agreed.",
        detail:
          "An ML meeting brought Dry Lab and cross-team leads together to align on the modelling direction, with AWS compute fully live.",
        link: "/dry-lab/model/",
      },
      hardware: {
        summary: "Optical-sensor housing printed; power architecture reviewed.",
        detail:
          "• First 3D-printed housing for the optical density (growth) sensor sent for print; task tracking moved to Jira.\n• Reviewed wiring diagrams, motor-driver choices, and team power diagram.\n• Filament project: autoclaving at 120 °C carries dye all the way through PET.",
        link: HW("2026-06-16"),
      },
      venture: {
        summary: "60+ sponsors contacted; business plan outline.",
        detail:
          "Reached out to 60+ potential sponsors and secured a $1,000 cheque from HMB. The business plan wiki outline is done, and warm-lead outreach started for the three verticals.",
        link: VENTURE,
      },
      web: {
        summary: "Wiki draft public.",
        detail:
          "The draft wiki went public with a rough homepage design, this team progress calendar and several interactive components; the hardware section went up with help from Web.",
        link: WEB,
      },
    },
  },
  "week-2026-06-21": {
    overview:
      "The official iGEM wiki link went live in June, months ahead of last year. The team left its Toronto Climate Week meeting with a roadmap and bi-weekly mentorship.",
    subteams: {
      wetLab: {
        summary: "Miniprep troubleshooting; selection plasmids finalized.",
        detail:
          "BL21 minipreps gave poor yields, so larger cultures or Terrific Broth and doubled lysis buffers were suggested. DH5α transformed with the distribution plasmids. Selection-assay plasmids finalized with both sulfonamide and trimethoprim (TMP) resistance.",
        link: WL("2026-06-22"),
      },
      dryLab: {
        summary: "Projects folding into the database paper.",
        detail:
          "Members wrapped up individual projects for the database paper; the synthesis library algorithm is close to done and ESM-C training is underway.",
        link: DRY,
      },
      hardware: {
        summary: "Parts handed out; build-session prep.",
        detail:
          "• Distributed subsystem components; reviewed wiring diagrams (growth sensor needs a voltage divider).\n• Borrowed a 36-port, 200 W switch from the Donnelly Centre for the multi-reactor build.\n• Planned an extended build session: circuit diagrams in KiCad and Arduino coding kickoff.",
        link: HW("2026-06-23"),
      },
      venture: {
        summary: "Stakeholder tracker and interviews.",
        detail:
          "The push is to talk to professors, industry and researchers to test the thesis; a stakeholder tracker logs every contact and interview.",
        link: VENTURE,
      },
      web: {
        summary: "Official wiki link live.",
        detail:
          "The official iGEM wiki submission link went live in June; last year it only came together days before the deadline.",
        link: WEB,
      },
    },
  },
  "week-2026-06-28": {
    overview:
      "Dry Lab fine-tuned its first model and sent a letter of intent to the NAR database issue. Wet Lab placed its IDT orders, and Hardware scoped its prototype to eight bioreactors.",
    milestones: [{ date: "2026-06-29", label: "First model fine-tuned (ESM-C)", subteamId: "dryLab" }],
    subteams: {
      wetLab: {
        summary: "Cloning strategy; DH5α transformations working.",
        detail:
          "Held the cloning strategy meeting and placed IDT orders (arriving July 2). Distribution-kit plasmids went into DH5α, and every transformation worked.",
        link: WL("2026-07-03"),
      },
      dryLab: {
        summary: "First fine-tuned model; paper letter of intent.",
        detail:
          "ESM-C was fine-tuned on the PETadex over a six-day run, with the loss coming down nicely. A letter of intent went to the NAR database issue, with every iGEM member welcome as an author. The DNA synthesis algorithm is days from done.",
        link: "/dry-lab/model/",
      },
      hardware: {
        summary: "Prototype scoped to eight reactors.",
        detail:
          "• Locked USB serial connections and a live software dashboard to monitor, record and control each reactor.\n• Circuit diagrams, CAD and KiCad underway; risk-form (RRF) experiment instructions finalized.",
        link: HW("2026-06-28"),
      },
      venture: {
        summary: "University partners for the conference.",
        detail:
          "Opened conference partnership conversations across UofT. Earth Sciences offered support, including a potential speaker and sponsorship; BME and Engineering meetings lined up. Groups may pivot verticals if theirs isn't feasible.",
        link: VENTURE,
      },
      web: {
        summary: "Conference website v1.",
        detail: "Built the first version of the Plastic Conference website.",
        link: WEB,
      },
    },
  },

  "week-2026-07-05": {
    overview:
      "The team voted in its charter update (July 9) and set September 19 for the Plastic Conference. Wet Lab wrote its first assay protocols, Dry Lab solved its degenerate-library design, and Hardware started weekly build nights.",
    milestones: [
      { date: "2026-07-07", label: "Bioreactor code repo and build nights", subteamId: "hardware" },
    ],
    subteams: {
      wetLab: {
        summary: "First assay-specific protocols.",
        detail:
          "Finished the first protocols (making copper compounds, staining fabric and extracting concentrated PETase), wrote the Wet Lab manifesto and placed the next reagent orders.",
        link: WL("2026-07-08"),
      },
      dryLab: {
        summary: "Degenerate library solved; PETadex rebuild.",
        detail:
          "Two working prototypes encode about 80% of a cluster's natural sequences with a handful of oligos, so real sequences can be ordered for Wet Lab. The PETadex is being rebuilt as a versioned, reproducible pipeline, from a curated seed set through Logan's ~39M datasets to hierarchical clustering. Project deadlines were extended to match.",
        link: DRY,
      },
      hardware: {
        summary: "Code repository live; Thursday build nights set.",
        detail:
          "• Created the bioreactor GitHub repo; chose Thursday evenings as recurring in-person build nights.\n• Ordered a wavelength-specific optical density sensor (AS7343) and re-designed its vial holder; one sensor reading over I2C on an Arduino Nano.\n• Pumps soldered and a thermocouple tested near 55 °C.",
        link: HW("2026-07-07"),
      },
      venture: {
        summary: "One-pager and pitch deck done.",
        detail:
          "Completed the business one-pager and pitch deck, opened partnership talks with Earth Sciences, BME, Engineering and the Dean's office, and began customer interviews across six application verticals.",
        link: VENTURE,
      },
      web: {
        summary: "Conference site out for feedback.",
        detail:
          "The Plastic Conference website went to the team for feedback, aiming to be done by the following week.",
        link: WEB,
      },
    },
  },
  "week-2026-07-12": {
    overview:
      "Human Practices hosted the Bioethics Symposium (July 12) and the conference speakers were confirmed. Wet Lab assembled its first assay plasmid.",
    subteams: {
      wetLab: {
        summary: "First assay (AS) plasmid assembled.",
        detail:
          "Assembled the AS plasmid from IDT fragments; the KLD transformation grew colonies on the selection plate, and the plasmid went for sequencing. Subgroup leads now meet weekly.",
        link: WL("2026-07-14"),
      },
      dryLab: {
        summary: "More compute for the rebuild.",
        detail:
          "The AWS on-demand CPU quota went from 32 to 128 vCPUs, so more jobs can run at once for the PETadex rebuild.",
        link: DRY,
      },
      hardware: {
        summary: "Normalized growth readings defined.",
        detail:
          "• Split sensors into a reference and a measuring role: a blank and dark calibration, then a live ratio (normalized OD).\n• Collected single-sensor readings for early math checks.",
        link: HW("2026-07-13"),
      },
      venture: {
        summary: "Research consolidation session.",
        detail: "A work session to pull every vertical's research into the shared documents.",
        link: VENTURE,
      },
    },
  },
  "week-2026-07-19": {
    overview:
      "Wet Lab leads passed their Lawson safety interviews, the conference website went live, and promo video filming ramped up. Hardware set July 30 as the day all subsystems come together.",
    milestones: [
      { date: "2026-07-21", label: "Conference website live", subteamId: "web" },
    ],
    subteams: {
      wetLab: {
        summary: "Safety interviews passed; scope narrowed.",
        detail:
          "All leads and half the team passed their Lawson safety interviews. The scope narrowed to the copper biosensor and selection assays, with an August 1 checkpoint to show at least one assay is likely to work.",
        link: WL("2026-07-20"),
      },
      dryLab: {
        summary: "Logan search wraps; reproducibility rules.",
        detail:
          "The Logan search wrapped up, and members prepared their scripts for the updated dataset, toward a preprint in early September. Notebooks must read and write through the S3 mirror so every analysis can be repeated.",
        link: DRY,
      },
      hardware: {
        summary: "Integration date set; CAD nearly done.",
        detail:
          "• Two AS7343 sensors running; debugging the pump's transistor drive.\n• Host and Arduino talk over serial in JSON; early Grafana setup.\n• Calibration plan: read spectrophotometer OD600 alongside the bioreactor and fit a curve.\n• Thermal tests reaching promising temperatures.",
        link: HW("2026-07-20"),
      },
      venture: {
        summary: "Imperial pitch prep; ASSU donation.",
        detail:
          "Prepared for the Global Pitch Challenge hosted by Imperial College London, secured a $2,000 ASSU donation for the conference, and finished industry interviews across wastewater, oil and gas and more. Wiki writing starts in August.",
        link: VENTURE,
      },
      web: {
        summary: "Conference website live.",
        detail:
          "The UofT Microplastics Conference site went live at uoftmicroplastics.ca. The main wiki homepage is next.",
        link: WEB,
      },
    },
  },
  "week-2026-07-26": {
    overview:
      "Stage 2 fees paid on July 28, securing the team's Grand Jamboree spot and booth. On July 30 Hardware connected every subsystem into its V1 prototype, and Venture pitched live for Imperial College London.",
    milestones: [
      { date: "2026-07-28", label: "Stage 2 paid: Jamboree spot secured", subteamId: "all" },
      { date: "2026-07-30", label: "V1 bioreactor: subsystems connected", subteamId: "hardware" },
      { date: "2026-07-30", label: "Imperial Global Pitch Challenge", subteamId: "venture" },
    ],
    subteams: {
      wetLab: {
        summary: "AS plasmid purified; miniprep fixed; copper tests begin.",
        detail:
          "The AS plasmid is purified, competent cells are made and the failing miniprep protocol is solved. Twist and IDT orders placed. Copper phthalate made (a blue precipitate) and the first PET mesh stained.",
        link: WL("2026-07-27"),
      },
      dryLab: {
        summary: "Plasticome re-curated; reproducibility standard.",
        detail:
          "The Plasticome was re-curated to about 470 validated enzymes. Every script now reads and writes from S3 and records its tool versions and database dates, so any result can be regenerated.",
        link: DRY,
      },
      hardware: {
        summary: "V1 prototype: every subsystem connected.",
        detail:
          "• Pumps running after the transistor fix; bioreactor CAD finished.\n• A working UI prototype reads and displays live sensor data.\n• July 30: all subsystems connected into the V1 prototype. The stirring fan's lowest speed is likely too fast for bacteria.",
        link: HW("2026-07-30"),
      },
      venture: {
        summary: "Imperial College Global Pitch Challenge.",
        detail:
          "Video pitch submitted July 27 and live round July 30. Vertical interviews wrapped with a Newfoundland wastewater plant and Imperial mentors. Foundational research for each vertical due August 3.",
        link: VENTURE,
      },
      web: {
        summary: "Conference domain and SEO; homepage assembly.",
        detail:
          "Domain and SEO configured for the conference site. The iGEM Skule site is being ported over, and the wiki homepage is assembled section by section.",
        link: WEB,
      },
    },
  },

  "week-2026-08-02": {
    overview:
      "The whole Wet Lab roster was cleared for bench work, and the conference venue was booked on August 5. Venture finished research across seven commercial verticals, and the team headed to McMaster for GCM on August 8 and 9.",
    subteams: {
      wetLab: {
        summary: "Whole team cleared; copper plates and Golden Gate.",
        detail:
          "Everyone passed the Lawson interview, all DNA orders were placed, and the leads toured the BioZone. Mueller Hinton plates made across a range of copper concentrations; Golden Gate assembly started on the AS plasmid inserts.",
        link: WL("2026-08-04"),
      },
      dryLab: {
        summary: "Structure prediction at scale.",
        detail:
          "Running protein structure prediction across the PETadex candidates, scaling toward millions of structures, while the activity-scraping pipeline moves forward. Notebook text must now be written by hand.",
        link: DRY,
      },
      hardware: {
        summary: "First integration run surfaced real errors.",
        detail:
          "• The integration run found errors that now feed CAD revisions and a written V2 spec.\n• The multi-reactor dashboard needs per-reactor isolation so one fault can't take down the board.\n• Design-of-experiment data collection underway.",
        link: HW("2026-08-04"),
      },
      venture: {
        summary: "Seven verticals researched; GCM slides.",
        detail:
          "Research done for degreasers, bioremediation, detergent, wastewater treatment, landfill leachate, oil and gas, and regulatory. August goes to turning it into wiki content; GCM slides in progress.",
        link: VENTURE,
      },
      web: {
        summary: "Homepage sections; Skule site port.",
        detail:
          "Homepage assembled section by section; the Skule site port picked up team feedback.",
        link: WEB,
      },
    },
  },
  "week-2026-08-09": {
    overview:
      "Second place at the Great Canadian Meet-up (GCM) at McMaster. The promo video was released, the conference venue (Bahen Centre) was confirmed, and the PlasticOME was finalized for the full Logan search.",
    milestones: [
      { date: "2026-08-09", label: "GCM: 2nd place", subteamId: "all" },
    ],
    subteams: {
      wetLab: {
        summary: "AS variants sequenced; four assays in development.",
        detail:
          "AS-msGFP2 and AS-sul1 confirmed by sequencing; AS-dfr and AS-sul2 redone. Mesh stained with crystal violet for 5 minutes released more dye than longer stains. Four assays in development: copper biosensor, selection, dye release and an in-house halo assay, with a dead PETase as the negative control.",
        link: WL("2026-08-15"),
      },
      dryLab: {
        summary: "PlasticOME finalized; full Logan search.",
        detail:
          "HMM curation added 8 million sequences and new domains before the full Logan DIAMOND search ran. The database was held back until it was QC'd so a search that size wasn't spent on an unfinished corpus. Paper writing starts next.",
        link: DRY,
      },
      hardware: {
        summary: "Electronics on one Arduino Nano.",
        detail:
          "• All subsystem electronics integrated onto a single Arduino Nano; the Python software talks to the sensors end to end.\n• Power figures for V1 drafted for Human Practices' sustainability report; USB hub data path fixed.",
        link: HW("2026-08-11"),
      },
      venture: {
        summary: "GCM second place; wastewater interviews.",
        detail:
          "Second place at GCM, then wastewater interviews in Langley (BC) and York Region. Wiki paragraphs per vertical due August 22.",
        link: VENTURE,
      },
      web: {
        summary: "Wiki material deadline set.",
        detail:
          "Every subteam got an internal deadline to submit wiki material; three started writing the same week.",
        link: WEB,
      },
    },
  },
  "week-2026-08-16": {
    overview:
      "First validated result of the summer: the copper biosensor plasmid responds to copper (August 17). The PETadex website and the iGEM Skule site were rebuilt, and the wiki freeze was set for October 21.",
    milestones: [
      { date: "2026-08-17", label: "Copper biosensor works", subteamId: "wetLab" },
      { date: "2026-08-18", label: "iGEM Skule site rebuilt", subteamId: "web" },
    ],
    subteams: {
      wetLab: {
        summary: "Copper biosensor confirmed.",
        detail:
          "AS-msGFP2 glows in response to copper as designed. Colonies touching washed mesh did not glow, so washed mesh does not leach detectable copper. BioZone tours continued.",
        link: WL("2026-08-17"),
      },
      dryLab: {
        summary: "PETadex website rebuilt.",
        detail:
          "The PETadex site was rebuilt as its own project. A clear definition of an \"experiment\" in the literature unblocked the activity-scraping pipeline.",
        link: "/dry-lab/software/",
      },
      hardware: {
        summary: "V1 post-mortem; moving to V2.",
        detail:
          "• Wrote up V1 (wiki structure, CAD assembly, optical density integration code).\n• Pumps moved into horizontal drawers to shorten the vial height; a new CAD design started.",
        link: HW("2026-08-18"),
      },
      venture: {
        summary: "Wiki drafts per vertical; plant tour.",
        detail:
          "Set up the official Venture wiki drive with good copies for each vertical (drafts due August 29). Lined up a treatment plant tour (August 19) to see sidestream clarifiers and meet City of Toronto Water operators.",
        link: VENTURE,
      },
      web: {
        summary: "Skule site rebuilt.",
        detail:
          "The iGEM Skule website was fully redesigned and shared for feedback; the wiki freeze is October 21.",
        link: WEB,
      },
    },
  },
  "week-2026-08-23": {
    overview:
      "Mandatory General Meeting on August 24. The selection strain outgrew its control, Hardware locked the V2 design, and the team co-hosted cGEM on August 29.",
    milestones: [
      { date: "2026-08-24", label: "General Meeting", subteamId: "all" },
      { date: "2026-08-24", label: "Selection assay: first result", subteamId: "wetLab" },
      { date: "2026-08-29", label: "cGEM (co-hosted)", subteamId: "all" },
    ],
    subteams: {
      wetLab: {
        summary: "Selection data; display plasmid started.",
        detail:
          "AS-sul1 grows at higher sulfadiazine concentrations than the negative control: early evidence that the selection assay works. Copper loads reliably onto PET test plates. All safety forms went to the Safety Committee, and PCR began on the display (PD) plasmid.",
        link: WL("2026-08-24"),
      },
      dryLab: {
        summary: "Final-stretch plan.",
        detail:
          "• Order 100k+ sequences grouped by cluster so Wet Lab can pick how many to test.\n• Papers and schemas ready for the scraping project by August 31; sign-ups for 70 to 100 papers with two scrapers each.\n• PETadex.net pages live before researcher interviews; 200 previously synthesized enzymes used as a control for ranking.",
        link: DRY,
      },
      hardware: {
        summary: "V2 design locked.",
        detail:
          "New CAD with easier maintenance built in, such as removable tubing for autoclaving. Subsystem integration holding steady.",
        link: HW("2026-08-25"),
      },
      venture: {
        summary: "Vertical drafts.",
        detail: "Drafting each vertical's wiki pages for the August 29 deadline.",
        link: VENTURE,
      },
      web: {
        summary: "Skule site live; enzyme battle.",
        detail:
          "The Skule site is live; the competition wiki is built out section by section.\n• August 24: the Dry Lab notebooks set up on the wiki.\n• August 29: the enzyme battle, opened from the PETadex browser.",
        link: WEB,
      },
    },
  },
  "week-2026-08-30": {
    overview:
      "The GoFundMe for the trip to Paris launched on September 1. Dry Lab finished sequence selection and launched the team-wide literature scraping project, and Prof. Milica Radisic joined Hardware as a mentor.",
    milestones: [
      { date: "2026-08-31", label: "Prof. Radisic joins as mentor", subteamId: "hardware" },
      { date: "2026-09-01", label: "GoFundMe launched", subteamId: "all" },
      { date: "2026-09-01", label: "Literature scraping launched", subteamId: "dryLab" },
    ],
    subteams: {
      wetLab: {
        summary: "Display plasmid fragments; last weeks at BME.",
        detail:
          "PD fragments 1 and 2 through PCR, with fragment 1 assembled and transformed. Second BioZone tour as the team prepares to move.",
        link: WL("2026-08-31"),
      },
      dryLab: {
        summary: "Sequence selection done; scraping launched.",
        detail:
          "The sequence-selection algorithm and cluster ranking are done, and the literature scraping project went out to the whole team.",
        link: DRY,
      },
      hardware: {
        summary: "Mentor on board; growth sensor checked against a spectrophotometer.",
        detail:
          "• Prof. Radisic joined with monthly design reviews, plus a research student to scale the reactor down to a faster, lower-volume screening format.\n• Normalized OD tracks OD600 (R² ≈ 0.99), but room light leaking past the cap shifts readings when the vial is moved.",
        link: HW("2026-09-01"),
      },
      venture: {
        summary: "Mini Jamboree prep.",
        detail: "Focus moved to the North American Mini Jamboree on September 12.",
        link: VENTURE,
      },
      web: {
        summary: "Homepage forest walk.",
        detail:
          "• September 4: the forest reveal on the homepage, with the shore art scaling to the window.\n• September 5: the second treatment-plant bottle, and the river bottle now waits for the reader.",
        link: "/",
      },
    },
  },
  "week-2026-09-06": {
    overview:
      "The semester started. iGEM Toronto placed 2nd of 29 universities at the North American Mini Jamboree on September 12, with special-award nominations.",
    milestones: [
      { date: "2026-09-12", label: "NA Mini Jamboree: 2nd of 29", subteamId: "all" },
    ],
    subteams: {
      wetLab: {
        summary: "Moving to BioZone.",
        detail:
          "Moving from BME to the BioZone, with the BioZone risk forms (RRFs) under review.",
        link: WL("2026-09-17"),
      },
      dryLab: {
        summary: "Final figures.",
        detail:
          "New meeting times for the semester and one-on-ones planned with every member. Figures shared in the channel, with final figures due September 14.",
        link: DRY,
      },
      hardware: {
        summary: "Three-point calibration is enough.",
        detail:
          "The first, middle and last points give nearly the same curve as all ten (R² = 0.993), so users only need to calibrate with three vials.",
        link: HW("2026-09-06"),
      },
      venture: {
        summary: "2nd of 29 at the Mini Jamboree.",
        detail:
          "Second place at the North American Mini Jamboree, then back to the verticals: wastewater sections and the financial projections.",
        link: VENTURE,
      },
      web: {
        summary: "Homepage map and splash; citations.",
        detail:
          "• September 6: LOGAN sample pins on the painted homepage map, bubbles on the chute bottle and splash droplets as it lands. The PETadex moved off the homepage onto its own site. Pages can now cite sources in their text and build a reference list.\n• September 10: the map's sample pins can be reached with the keyboard.\n• September 12: the homepage on phones: a fitted shore text box, all three condition cards, a bigger bottle and popups that fit the screen.",
        link: "/",
      },
    },
  },
  "week-2026-09-13": {
    overview:
      "PetaBite organized the UofT Microplastics Conference on September 19: 200+ registrations, 100+ attendees, 15 posters and a keynote from Dr. Kara Lavender Law. The team roster was frozen on September 16.",
    milestones: [
      { date: "2026-09-19", label: "UofT Microplastics Conference", subteamId: "all" },
    ],
    subteams: {
      wetLab: {
        summary: "Conference poster.",
        detail:
          "Presented the Wet Lab poster at the conference on September 19 and submitted wiki drafts for review.",
        link: WL("2026-09-17"),
      },
      dryLab: {
        summary: "Meetings move to Sundays.",
        detail: "Final figures due Monday; meetings moved to Sunday evenings.",
        link: DRY,
      },
      hardware: {
        summary: "Conference poster; temperature control tuning.",
        detail:
          "• Hardware poster printed September 18 for the conference.\n• PID tuning: integral wind-up is large when heating from room temperature, but without it the temperature settles just below target.",
        link: HW("2026-09-17"),
      },
      venture: {
        summary: "Wiki deadline October 9.",
        detail:
          "Finalized content due October 9 to give Web time before the freeze. Assignments: market sizing (TAM/SAM/SOM) for every vertical, financial projections and regulatory edits.",
        link: VENTURE,
      },
      web: {
        summary: "Design sketchbook; pinned top bar.",
        detail:
          "• September 13: the Outreach design sketchbook got its hardcover look and tabs, and the top bar now stays pinned while scrolling, with a back-to-top button.\n• September 19: the Human Practices write-up added to that page's tabs.",
        link: OUTREACH,
      },
    },
  },
  "week-2026-09-20": {
    overview:
      "Wet Lab restarted in the BioZone once its risk forms were approved, and every subteam is now writing for the wiki.",
    milestones: [
      { date: "2026-09-22", label: "Lab work restarts in BioZone", subteamId: "wetLab" },
    ],
    subteams: {
      wetLab: {
        summary: "Back in the lab at BioZone.",
        detail:
          "Risk forms approved and lab shifts restarted in the BioZone. Control PETase inserts are ready for assembly into the display (PD) backbone.",
        link: WL("2026-09-22"),
      },
      dryLab: {
        summary: "Project write-ups for the preprint.",
        detail:
          "Everyone writes up their project with methods, results and discussion for a preprint in early October. S3 buckets were made publicly readable (except the scraped papers), and in-person Saturday meetings start September 26.",
        link: DRY,
      },
      hardware: {
        summary: "Simulated reactor data; telemetry format.",
        detail:
          "Agreed one command and telemetry format for all subsystems and refined the optical density chamber.",
        link: HW("2026-09-21"),
      },
      venture: {
        summary: "Editing to the style guide.",
        detail:
          "Weekly progress reports and status labels on every wiki section, from \"Need draft\" to final review, with a push to write tight.",
        link: VENTURE,
      },
      web: {
        summary: "Pulling the wiki together; homepage story.",
        detail:
          "Every subteam is writing up its work, and Web assembles it section by section.\n• September 26: the homepage copy pinned to the art, the ending bottle assembling, and the logo loading screen.",
        link: WEB,
      },
    },
  },
  "week-2026-09-27": {
    overview:
      "The V2 bioreactor is fully assembled, Wet Lab ordered the first PETase library from Dry Lab, and Venture delivered its whole Entrepreneurship wiki (October 2). Dry Lab's preprint write-ups were due October 3.",
    milestones: [
      { date: "2026-09-28", label: "V2 bioreactor assembled", subteamId: "hardware" },
      { date: "2026-09-30", label: "First PETase library ordered", subteamId: "wetLab" },
      { date: "2026-10-02", label: "Venture wiki content complete", subteamId: "venture" },
      { date: "2026-10-01", label: "Dry Lab page art", subteamId: "web" },
    ],
    subteams: {
      wetLab: {
        summary: "Control display plasmids made; first library ordered.",
        detail:
          "The PD miniprep had high concentration and purity, and all control PD plasmids now exist. The first sequence library from Dry Lab was ordered, and the move from BME to BioZone is nearly complete.",
        link: WL("2026-09-30"),
      },
      dryLab: {
        summary: "Preprint write-ups; Logan search running.",
        detail:
          "Write-ups due October 3 for the PETadex preprint. The Logan search ran on September 30, with HMMsearch and a QC'd dataset to follow. The literature scraping is complete and being checked.",
        link: DRY,
      },
      hardware: {
        summary: "V2 assembled; temperature held to ±0.5 °C.",
        detail:
          "• Custom PID holds within ±0.5 °C (±0.12 °C once stable); 30 °C in 515 s, 50 °C in 2001 s.\n• V2 fully assembled and the pump lid redesigned.\n• October 3: commands and telemetry ran end to end on the demo setup.",
        link: HW("2026-09-28"),
      },
      venture: {
        summary: "All Venture deliverables done.",
        detail:
          "Final edits section by section, then every Venture deliverable was in on October 2, ready for Web to integrate. The team was also selected to pitch at the Food Forward Summit.",
        link: VENTURE,
      },
      web: {
        summary: "Ticket board; Dry Lab page art.",
        detail:
          "Opened a tickets channel to track what's left on the wiki, including notebook figures and filling in this calendar.\n• September 29: new Toronto art and turtle on the homepage.\n• September 30: subteam labels around the ending bottle, each linking to its page.\n• October 1: the Dry Lab page's painted skyline, and DM Sans across the site.\n• October 3: the loading screen counts images further down the page, so its progress is truer.",
        link: WEB,
      },
    },
  },
  "week-2026-10-04": {
    overview:
      "Wet Lab ran its first co-transformations, Dry Lab organized its wiki into five pipeline components, and PetaScale was a Food Forward Summit finalist (October 8). Merch orders opened, and attribution forms are due October 11.",
    milestones: [
      { date: "2026-10-05", label: "Entrepreneurship page live", subteamId: "web" },
      { date: "2026-10-06", label: "Human Practices page live", subteamId: "web" },
      { date: "2026-10-08", label: "Food Forward Summit finalist", subteamId: "venture" },
      { date: "2026-10-10", label: "Contribution and Attributions pages", subteamId: "web" },
    ],
    subteams: {
      wetLab: {
        summary: "Co-transformations.",
        detail:
          "Plated co-transformations that put the assay plasmid and the display plasmid in one strain, with competent cells in progress for the serial-transformation route.",
        link: WL("2026-10-05"),
      },
      dryLab: {
        summary: "Wiki notebooks; five pipeline components.",
        detail:
          "Every member set up a notebook for the wiki. The work is organized into five components that make up the PETadex annotation and characterization pipeline, each with a short summary and a full write-up.",
        link: "/dry-lab/model/",
      },
      hardware: {
        summary: "Component health; V1 and V2 write-ups.",
        detail:
          "Monitoring component health. V2 write-up due October 13 and V1 edits the weekend of October 17 to 18.",
        link: HW("2026-10-05"),
      },
      venture: {
        summary: "Food Forward Summit finalist.",
        detail: "PetaScale was named a Food Forward Summit finalist on October 8.",
        link: VENTURE,
      },
      web: {
        summary: "Entrepreneurship, Human Practices, Dry Lab, Contribution and Attributions pages.",
        detail:
          "The Hardware and Wet Lab notebooks and this calendar filled in from team records, and lighter homepage images for phones.\n• October 5: the Entrepreneurship page, with its kangaroo coin bursts.\n• October 6: the Human Practices page, and the Entrepreneurship content filled in.\n• October 7: sponsor logos, and the Hardware and Entrepreneurship footer art.\n• October 8: the Food Forward appendix on Entrepreneurship.\n• October 9: the homepage's lab section.\n• October 10: the Dry Lab Overview (with its figures), Model and Software pages, the Hardware notebook's source-code dropdowns, the Contribution and Attributions pages, the Project menu, the Wet Lab notebook, the homepage auto-scroll, and a size check that keeps the site under iGEM's upload limit.",
        link: WEB,
      },
    },
  },
  "week-2026-10-11": {
    overview: "Attribution forms close October 11. Wiki editing ahead of the October 21 freeze.",
    milestones: [
      { date: "2026-10-11", label: "Attribution forms due", subteamId: "all" },
      { date: "2026-10-12", label: "Wet Lab, Finance and Safety pages", subteamId: "web" },
      { date: "2026-10-16", label: "Engineering, Project and Wiki pages", subteamId: "web" },
    ],
    subteams: {
      web: {
        summary: "Wet Lab, Outreach, Finance, Safety, Hardware Iterations, Engineering, Project and Wiki pages.",
        detail:
          "• October 11: Meet the Team's waterfall, the logo in the navbar, the enzyme favicon, the Outreach design notebook filled in, and references in IEEE style.\n• October 12: the Wet Lab sea page, the rebuilt Outreach page, the Finance and Safety pages, every image moved to iGEM's servers, and iGEM's CC BY 4.0 licence restored.\n• October 13: the Dry Lab Dataset Generation flowchart, with a section menu that can be minimised.\n• October 14: the Hardware Iterations page, with a timeline and subsystem tabs for versions 1 to 3, and the version 1 temperature page.\n• October 15: the Finance page's content and funding cycle sheet, the version 1 power page, the Outreach sketchbook's covers, inner pages and tabs, and the Attributions background.\n• October 16: the Engineering, Project Description and Wiki pages, dragons that catch fire on the Wiki and Contribution pages, the new treatment plant on the homepage, subteam badges on Meet the Team, and the Human Practices sections with their photos.",
        link: WEB,
      },
    },
  },
  "week-2026-10-18": {
    overview: "Wiki freeze on October 21.",
    milestones: [{ date: "2026-10-21", label: "Wiki freeze", subteamId: "all" }],
  },
}

/**
 * Outreach week copy from meeting minutes, the leads' weekly updates and the
 * outreach channels. Replaces the Outreach entry for each listed week.
 */
const OUTREACH_WEEK_PATCHES = {
  "week-2026-01-18": {
    outreach: {
      summary: "Recruitment posts.",
      detail:
        "Instagram stories announced the extended application deadline after requests from applicants.",
      link: OUTREACH,
    },
  },
  "week-2026-01-25": {
    outreach: {
      summary: "Web developer hiring post.",
      detail:
        "Posted a call for web developers (front end, interactive and animation experience), since most Outreach applicants were social media and graphic design focused.",
      link: OUTREACH,
    },
  },
  "week-2026-03-15": {
    milestones: [
      { date: "2026-03-16", label: "Logo design competition opens", subteamId: "outreach" },
    ],
    outreach: {
      summary: "Logo design competition launched.",
      detail:
        "Theme: Pokémon x synthetic biology, in a 90s retro style. The winning design becomes part of the team identity for outreach, presentations and merch.",
      link: OUTREACH,
    },
  },
  "week-2026-03-29": {
    outreach: {
      summary: "Branding and mascot sketches carry over from March kickoff.",
      detail:
        "March sessions set a whimsical hand-drawn look, plastic-enzyme characters, and wiki art inspiration. Character design brief (trainers + PETamon partners) targeted April 5 sketches.",
      link: OUTREACH,
    },
  },
  "week-2026-04-05": {
    outreach: {
      summary: "Character sheets and wiki design workshopping.",
      detail:
        "Sketch deadline for trainers and PETamon partners. Wiki look-and-feel ideas voted in late March; logo competition still open. Members gathering stories for a Project Intro social post.",
      link: OUTREACH,
    },
  },
  "week-2026-04-12": {
    outreach: {
      summary: "Instagram monitoring and subteam story gathering.",
      detail:
        "Members attending wet lab, hardware, dry lab, venture, and web meetings to gather Project Intro content. Logo submissions encouraged.",
      link: OUTREACH,
    },
  },
  "week-2026-04-19": {
    outreach: {
      summary: "Continuing branding and social prep.",
      detail:
        "Quiet documentation week: character and logo work continues, plus planning photo/video coverage for the May 9 team social.",
      link: OUTREACH,
    },
  },
  "week-2026-04-26": {
    outreach: {
      summary: "Pre-May social and conference logistics.",
      detail:
        "Preparing May 9 photo/video coverage and asking the sustainability office about catering for the microplastics conference.",
      link: OUTREACH,
    },
  },
  "week-2026-05-03": {
    outreach: {
      summary: "May 9 social filming and photo capture.",
      detail:
        "Outreach covered the team social for Instagram and the wiki; photos go in the shared Drive folder after the event. Logo voting opened May 8.",
      link: OUTREACH,
    },
  },
  "week-2026-05-10": {
    outreach: {
      summary: "Summer plan: intro post, weekly reels, newsletter, homepage.",
      detail:
        "Locked owners for the Project Intro Instagram post, Road to Jamboree weekly reels, first newsletter (~May 24), homepage art, and a late-May picnic. Logo vote still open.",
      link: OUTREACH,
    },
  },
  "week-2026-05-17": {
    milestones: [
      { date: "2026-05-18", label: "Logo competition winner", subteamId: "outreach" },
    ],
    outreach: {
      summary: "Logo winner; Project Intro and Road to Jamboree reels.",
      detail:
        "Chinmay's design won the logo competition and is being adapted to read PetaBite. Project Intro post in final design; weekly Road to Jamboree filming and editing begins. Homepage design handed to Abby/Dennis.",
      link: OUTREACH,
    },
  },
  "week-2026-05-24": {
    milestones: [
      { date: "2026-05-26", label: "First team newsletter sent", subteamId: "outreach" },
    ],
    outreach: {
      summary: "Project Intro live; first newsletter and picnic.",
      detail:
        "The first Instagram post, Project Intro, went live (~300 likes). First newsletter sent via Brevo (~May 26) covering Web Summit, campus events, and the May 9 social. Riverdale Park picnic May 29. Wiki art mockup underway; promo-video research assigned.",
      link: OUTREACH,
    },
  },
  "week-2026-05-31": {
    outreach: {
      summary: "Road to Jamboree reels live; promo research continues.",
      detail:
        "The first Road to Jamboree reels went out, and the newsletter is out. Promo video deliverables assigned after reviewing prior years' videos; logo capitalization and animation refined.",
      link: OUTREACH,
    },
  },
  "week-2026-06-07": {
    outreach: {
      summary: "Promo crew staffed; conference and logo redesign.",
      detail:
        "Script, animation, editing, and voiceover owners assigned after reviewing prior-year videos. Microplastics conference planning continues; next Road to Jamboree reel focuses on hardware.",
      link: OUTREACH,
    },
  },
  "week-2026-06-14": {
    outreach: {
      summary: "Promo storyboard draft; homepage sections; hardware reels.",
      detail:
        "Promo storyboard first draft out for comments. Homepage split into six sketched sections. Hardware Road to Jamboree reel filming mid-week. Newsletter prioritizes the conference announcement; Islands outing Jun 26.",
      link: OUTREACH,
    },
  },
  "week-2026-06-21": {
    outreach: {
      summary: "Promo script polish; July shoot plan; Islands outing.",
      detail:
        "One more session to shorten the promo script (~2 minutes) and lock location/props; filming starts in July. Hardware reel filmed around the hardware meeting. Toronto Islands filming and social Jun 26; homepage section sketches due Jun 27.",
      link: OUTREACH,
    },
  },
  "week-2026-06-28": {
    outreach: {
      summary: "Homepage section exports and bottle lifecycle art.",
      detail:
        "Web design sync: line-art exports for each homepage section, bottle lifecycle art, animated logo, and placeholder motion for water/conditions scenes. Next step is rendering and stitching.",
      link: `${OUTREACH}#design`,
    },
  },
  "week-2026-07-05": {
    milestones: [
      { date: "2026-07-05", label: "Second newsletter published", subteamId: "outreach" },
    ],
    outreach: {
      summary: "Newsletter out; promo shot list; conference speaker emails.",
      detail:
        "Newsletter live, and the first Hardware Road to Jamboree reel is up. Promo shot list and roles announced July 10. Conference invites sent to potential speakers; interest and intro social posts scheduled.",
      link: OUTREACH,
    },
  },
  "week-2026-07-12": {
    milestones: [
      { date: "2026-07-12", label: "Conference speakers confirmed", subteamId: "outreach" },
    ],
    outreach: {
      summary: "Conference speakers confirmed; promo filming ramps up.",
      detail:
        "Miriam Diamond (seminar) and Karen Wirsig (panel) confirmed for the Sep 19 microplastics conference. Promo filming batched by location (Centre Island, wet lab, Donnelly Centre); animation work started. Road to Jamboree reels on hold until the promo is done.",
      link: OUTREACH,
    },
  },
  "week-2026-07-19": {
    outreach: {
      summary: "Meet #15: promo filming ramp + animation plan; Aug 3 animation deadline.",
      detail:
        "Jul 20 Meet #15: ~15 of 35 promo filming shots done (8 more from Islands); CapCut + DaVinci Resolve editing; animation meeting 1 done with style refs. Shoot windows: hardware Tue 5:30–7:30, wet lab Fri, Victoria Park wastewater B-roll, VC interviews (Clara done; Anthony Wed, Sania Thu); animations due Aug 3. Jul 19 animation meeting locked TED-Ed mid-section shots 2.1–2.9 + flowchart 3.12; VO Jul 22; zooplankton cut Jul 23; scene 1 film Jul 25. Presentation video (15 min, Oct) staffed separately; July newsletter draft targeted for Jul 30 / Aug 1; merch (hoodies, tees, quarter-zips, stickers) exploration started; RTJ still on hold.",
      link: OUTREACH,
    },
  },
  "week-2026-07-26": {
    outreach: {
      summary: "Hand-drawn promo art sprint; promo 85% done.",
      detail:
        "Pipeline: storyboard (done) → hand-drawn assets (due Mon Jul 27) → render and rig in After Effects. Art covers nets, bottles, microplastics, fish, human/eating frames, and lake/table backgrounds, plus a flowchart animation beat. Centre Island scene filmed Jul 26; the promo went from 35% to 85% in a week. July newsletter finished; merch designs done.",
      link: OUTREACH,
    },
  },
  "week-2026-08-02": {
    outreach: {
      summary: "Promo filming complete; newsletter out.",
      detail:
        "Promo animation due August 3; live filming complete and editing underway in DaVinci Resolve. The newsletter went out August 4, merch designs are finished, and a poll is out for the next team social.",
      link: OUTREACH,
    },
  },
  "week-2026-08-09": {
    milestones: [{ date: "2026-08-11", label: "Promo video released", subteamId: "outreach" }],
    outreach: {
      summary: "Promo video released; merch with Quokka.",
      detail:
        "The promo video is up (August 11). Merch confirmed with Quokka: hoodies, tees and quarter-zips. A conference special-edition newsletter is in the works, and the Venture and Outreach jazz social ran August 11.",
      link: OUTREACH,
    },
  },
  "week-2026-08-16": {
    outreach: {
      summary: "Presentation video staffed; homepage sketches done.",
      detail:
        "Meeting #18: the promo was scheduled for Instagram on Wednesday. The 15-minute Jamboree presentation video got its script, filming and editing crew, with Human Practices to supply stakeholder statements. Homepage front-page sketches done; team pages split between members; conference logo in design. Outdoor team social August 21.",
      link: OUTREACH,
    },
  },
  "week-2026-08-23": {
    outreach: {
      summary: "Promo on Instagram; merch to the supplier.",
      detail:
        "The promo video went up on Instagram. Merch designs went to the supplier for final production, and the next team social was set for August 28.",
      link: OUTREACH,
    },
  },
  "week-2026-08-30": {
    outreach: {
      summary: "Merch and wiki character work.",
      detail: "Merch designs and wiki character art continued as the semester started.",
      link: OUTREACH,
    },
  },
  "week-2026-09-06": {
    outreach: {
      summary: "Conference volunteers; presentation video script.",
      detail:
        "Called for conference volunteers (registration, wayfinding, food and prop setup) and restarted the presentation video script.",
      link: OUTREACH,
    },
  },
  "week-2026-09-13": {
    outreach: {
      summary: "Microplastics Conference (Sep 19).",
      detail:
        "Promotion and volunteers for the conference at the Bahen Centre, with professional headshots taken for Meet the Team.",
      link: OUTREACH,
    },
  },
  "week-2026-09-20": {
    outreach: {
      summary: "Presentation video in production.",
      detail: "The Jamboree presentation video is in production, with filming from October.",
      link: OUTREACH,
    },
  },
  "week-2026-09-27": {
    outreach: {
      summary: "Presentation video script; Wet Lab reel.",
      detail:
        "Subteams commented on the presentation video script; filming starts October 1. Road to Jamboree footage with Wet Lab rolled this week, and the conference newsletter is due.",
      link: OUTREACH,
    },
  },
  "week-2026-10-04": {
    outreach: {
      summary: "Merch orders open; presentation filming.",
      detail:
        "Merch orders opened October 5 (hoodies, shirts and quarter-zips, due October 12) while presentation video filming continued.",
      link: OUTREACH,
    },
  },
}

/**
 * Human Practices week copy from HP meeting slides and notes, the leads'
 * weekly updates and the HP channels. Replaces the HP entry for each listed week.
 */
const HUMAN_PRACTICES_WEEK_PATCHES = {
  "week-2026-02-15": {
    humanPractices: {
      summary: "First stakeholder conversation.",
      detail:
        "Met the founder of a resource-recovery company, who connected the team with another contact.",
      link: HP,
    },
  },
  "week-2026-02-22": {
    humanPractices: {
      summary: "Follow-up stakeholder interview.",
      detail: "A follow-up interview with the new contact on February 27.",
      link: HP,
    },
  },
  "week-2026-03-29": {
    humanPractices: {
      summary: "March kickoff: what human practices is, winner case studies, stakeholder map.",
      detail:
        "Early meetings covered how human practices differs from outreach, award criteria, and assigned readings. Members presented past winning projects and began country stakeholder lists (India, Nigeria, Indonesia, China, Indigenous communities of Canada). Plastic-degrading enzyme (PETase) goals framed for HP: wastewater contacts and government/agency outreach.",
      link: HP,
    },
  },
  "week-2026-04-05": {
    humanPractices: {
      summary: "Stakeholder list growing; members sit in on other subteams.",
      detail:
        "Continuing literature review and adding contacts to the stakeholder sheet. Members attending wet lab, dry lab, hardware, and venture meetings so interviews stay grounded in project needs.",
      link: HP,
    },
  },
  "week-2026-04-12": {
    humanPractices: {
      summary: "Building the stakeholder contact list.",
      detail:
        "Country-assigned stakeholder research continues; preparing tailored outreach emails ahead of the May interview campaign.",
      link: HP,
    },
  },
  "week-2026-04-19": {
    humanPractices: {
      summary: "Stakeholder prep and subteam sync.",
      detail:
        "Quiet documentation week: expanding the contact sheet and liaison notes that feed May email templates and interview guides.",
      link: HP,
    },
  },
  "week-2026-04-26": {
    humanPractices: {
      summary: "Pre-May outreach and conference speaker search.",
      detail:
        "Finalizing stakeholder categories and email templates. Microplastics conference planning begins in parallel (venues and seminar/panel speakers).",
      link: HP,
    },
  },
  "week-2026-05-03": {
    humanPractices: {
      summary: "Accepted to Synbio conference; start stakeholder emails.",
      detail:
        "Accepted for a poster at Synbio (a synthetic biology conference at Waterloo, Jun 15–17). Email templates for stakeholder outreach; about ten tailored emails per member. Opened the search for microplastics-conference keynote and seminar speakers.",
      link: HP,
    },
  },
  "week-2026-05-10": {
    humanPractices: {
      summary: "First-wave stakeholder emails and interview scheduling.",
      detail:
        "Members send tailored outreach; formal interviews wait until the interview guide lands next meeting. Synbio registration (Waterloo, Jun 15–17) and conference venue search continue.",
      link: HP,
    },
  },
  "week-2026-05-17": {
    humanPractices: {
      summary: "Interview guide ready; three season reports defined.",
      detail:
        "Interview workflow locked May 21: background research → tailored questions → follow-up. Season deliverables set (a regulatory framework report, a sustainability report, and a socioeconomic report) toward a global deployment framing. Conference venue search (on- and off-campus). Wet/dry/hardware liaison updates continue.",
      link: HP,
    },
  },
  "week-2026-05-24": {
    humanPractices: {
      summary: "70 outreach emails; conference venues shortlisted.",
      detail:
        "Sent 70 stakeholder outreach emails, though only about one in ten was answered, so follow-ups and tailored questions continue. Hardware and dry-lab liaison briefings. Venues for 250 to 500 people shortlisted for the conference, now officially a go.",
      link: HP,
    },
  },
  "week-2026-05-31": {
    humanPractices: {
      summary: "First two stakeholder meetings; ethics framing.",
      detail:
        "Held the first two stakeholder meetings. Discussed biosafety, environmental safety, regulation, public perception, and open science for enzyme use in wastewater treatment. Shared a stakeholder guide and short interview pitch deck; on-campus venue tours arranged.",
      link: HP,
    },
  },
  "week-2026-06-07": {
    milestones: [
      { date: "2026-06-11", label: "Three policy and impact reports launched", subteamId: "humanPractices" },
    ],
    humanPractices: {
      summary: "Three written reports launched; keynote secured.",
      detail:
        "New workstreams: regulatory frameworks, socioeconomic analysis, and sustainability (short report / infographic style). Kara Lavender Law secured as conference keynote, so the date can be locked. Defined how to bring scientists onto petadex.net. Stakeholder sheet tracks email, response, and interview status.",
      link: HP,
    },
  },
  "week-2026-06-14": {
    milestones: [
      { date: "2026-06-15", label: "Synbio poster (Waterloo)", subteamId: "humanPractices" },
    ],
    humanPractices: {
      summary: "40-page conference proposal; Synbio poster at Waterloo.",
      detail:
        "Synbio is a synthetic biology conference (Jun 15–17, Waterloo). The conference proposal reached 40+ pages (manifesto, sponsorship package and outreach doc) for the Toronto Climate Week meeting. Report owners assigned for regulatory, socioeconomic, and sustainability drafts.",
      link: HP,
    },
  },
  "week-2026-06-21": {
    humanPractices: {
      summary: "Annotated sources for reports; Bioethics Symposium announced.",
      detail:
        "Add 2–3 reference links per outline point. A data-consortium approach invites other labs to share data on petadex.net. Virtual Bioethics Symposium Jul 12 (2–4pm EST): a 10–15 minute ethics presentation plus Q&A.",
      link: HP,
    },
  },
  "week-2026-06-28": {
    humanPractices: {
      summary: "Symposium prep and interview tracker.",
      detail:
        "Built a stakeholder-interview tracker. Continuing annotated bibliographies, report outlines, and Bioethics Symposium slides ahead of Jul 12.",
      link: HP,
    },
  },
  "week-2026-07-05": {
    humanPractices: {
      summary: "Bioethics Symposium prep week.",
      detail:
        "Finalize slides on the four bioethics pillars (beneficence, non-maleficence, justice, autonomy) for enzyme-based wastewater remediation. Report drafts continue in parallel.",
      link: HP,
    },
  },
  "week-2026-07-12": {
    milestones: [
      { date: "2026-07-12", label: "Bioethics Symposium (virtual)", subteamId: "humanPractices" },
    ],
    humanPractices: {
      summary: "Bioethics Symposium: present project ethics.",
      detail:
        "Virtual symposium Jul 12: team presents ethical principles behind enzymatic microplastic cleanup and discusses fair access, scale-up, and industry design changes.",
      link: HP,
    },
  },
  "week-2026-07-19": {
    humanPractices: {
      summary: "Symposium reflection; feedback on PETadex site and reports.",
      detail:
        "Two kinds of stakeholder meetings going forward: feedback on PETadex (our public enzyme database / website) and feedback on the regulatory, socioeconomic, and sustainability reports. Follow up with PETase scientists met earlier; choose final report formats and start rough drafts.",
      link: HP,
    },
  },
  "week-2026-07-26": {
    humanPractices: {
      summary: "STEAM-D mentorship wraps; PETadex survey prep.",
      detail:
        "The STEAM-D mentorship program run with the Temerty Faculty of Medicine wrapped up. A large-scale PETadex survey is being prepared, and report drafts continue.",
      link: HP,
    },
  },
  "week-2026-08-02": {
    milestones: [{ date: "2026-08-05", label: "Conference venue booked", subteamId: "humanPractices" }],
    humanPractices: {
      summary: "Mentored team took 1st; PETadex survey; venue booked.",
      detail:
        "The high school team mentored through STEAM-D took 1st place. The PETadex outreach email is finished, with the first large send going to corresponding authors drawn from about 4,000 plastic-degrading enzyme papers. A sustainability report will measure the project's own emissions and waste. The conference venue was booked August 5.",
      link: HP,
    },
  },
  "week-2026-08-09": {
    humanPractices: {
      summary: "Interviews with Lund, Patras and Fudan; Best Education case.",
      detail:
        "PETadex outreach template finalized and assigned; interviews running with Lund University, the University of Patras and Fudan University, among others. Between STEAM-D, co-hosting cGEM and the Mini Jamboree, and the conference, the team is building a case for the Best Education award. Conference: Bahen Centre confirmed, poster submissions open, weekly meetings with the UofT Trash Team.",
      link: HP,
    },
  },
  "week-2026-08-16": {
    humanPractices: {
      summary: "Researcher campaign live; fairness in the regulatory framework.",
      detail:
        "The outreach campaign to plastic-degrading enzyme researchers went live at 20 scientists per member each week, with a PETadex demo in every interview. The regulatory framework gained a section on data representation and fairness. Conference abstracts open until September 7.",
      link: HP,
    },
  },
  "week-2026-08-23": {
    humanPractices: {
      summary: "Campaign steady; cGEM co-hosted.",
      detail:
        "The researcher campaign continued at a steady pace, and the regulatory framework section took shape. Co-hosted cGEM on August 29 with the high school students the team mentored.",
      link: HP,
    },
  },
  "week-2026-09-06": {
    humanPractices: {
      summary: "Conference abstracts close; Mini Jamboree co-hosted.",
      detail:
        "Abstract submissions closed September 7. Co-hosted the North American Mini Jamboree on September 12 while finalizing the conference programme.",
      link: HP,
    },
  },
  "week-2026-09-13": {
    humanPractices: {
      summary: "Microplastics Conference (Sep 19).",
      detail:
        "A full day at the Bahen Centre: keynote from Dr. Kara Lavender Law, a seminar from Dr. Miriam Diamond and a panel with Karen Wirsig. 200+ registrations, 100+ attendees and 15 posters.",
      link: HP,
    },
  },
  "week-2026-09-20": {
    humanPractices: {
      summary: "Conference write-up; new meeting time.",
      detail:
        "Writing up the conference for the wiki (attendance, experience and feedback). Stakeholder emails are no longer the priority; meetings move to Monday evenings from September 28.",
      link: HP,
    },
  },
  "week-2026-09-27": {
    humanPractices: {
      summary: "Writing the Education and Conference sections.",
      detail:
        "Fully in writing mode, drafting the Education section and the Microplastics Conference part of the wiki, with a reflection requested from the UofT Trash Team.",
      link: HP,
    },
  },
  "week-2026-10-04": {
    humanPractices: {
      summary: "HP wiki sections due October 9.",
      detail:
        "Assigned the mission statement, commitment to inclusivity and stakeholder outreach sections, shared the HP wiki outline and collected stakeholder images.",
      link: HP,
    },
  },
}

function quietPlaceholderFor(subteamId) {
  const track = SUBTEAM_BY_ID[subteamId]
  const label = track?.label || "team"
  return {
    summary: "Slow week",
    detail: `Quiet week for ${label}, continuing work from previous sessions.`,
    link: track?.href || "/",
  }
}

function notStartedPlaceholderFor(subteamId) {
  const track = SUBTEAM_BY_ID[subteamId]
  return {
    summary: "Not started yet",
    detail: `${track.label} work began the week of ${formatDayShort(SUBTEAM_FIRST_WEEK[subteamId])}.`,
    link: track.href,
  }
}

/** Swap in one subteam's entry (and add its milestones) from a patch layer. */
function applySubteamPatch(week, patches, subteamId) {
  const patch = patches[week.id]
  if (!patch) return week

  const milestones = [...(week.milestones || [])]
  for (const milestone of patch.milestones || []) {
    const exists = milestones.some(
      (m) => m.date === milestone.date && m.label === milestone.label && m.subteamId === milestone.subteamId
    )
    if (!exists) milestones.push(milestone)
  }

  return {
    ...week,
    milestones,
    subteams: {
      ...week.subteams,
      [subteamId]: { ...patch[subteamId] },
    },
  }
}

/** Replace "Progress update coming soon." on past weeks for every subteam. */
function applyPastWeekQuietPlaceholders(week) {
  if (week.start >= PAST_WEEK_QUIET_BEFORE) return week

  let changed = false
  const subteams = { ...week.subteams }
  for (const id of SUBTEAM_IDS) {
    if (subteams[id]?.summary === "Progress update coming soon.") {
      subteams[id] =
        week.start < SUBTEAM_FIRST_WEEK[id] ? notStartedPlaceholderFor(id) : quietPlaceholderFor(id)
      changed = true
    }
  }
  return changed ? { ...week, subteams } : week
}

function mergeWeek(skeleton, override = {}) {
  const subteams = { ...defaultSubteams(), ...(override.subteams || {}) }
  return {
    ...skeleton,
    overview:
      override.overview ||
      "Team progress for this week will be updated soon. Use subteam filters below when detailed entries are available.",
    milestones: override.milestones || [],
    subteams,
  }
}

/** @type {ContributionWeek[]} */
export const CONTRIBUTION_WEEKS = buildWeekSkeleton()
  .map((sk) => mergeWeek(sk, WEEK_CONTENT_OVERRIDES[sk.id]))
  .map((week) => applySubteamPatch(week, OUTREACH_WEEK_PATCHES, "outreach"))
  .map((week) => applySubteamPatch(week, HUMAN_PRACTICES_WEEK_PATCHES, "humanPractices"))
  .map(applyPastWeekQuietPlaceholders)

/** @type {Record<string, ContributionWeek>} */
export const CONTRIBUTION_WEEK_BY_ID = Object.fromEntries(
  CONTRIBUTION_WEEKS.map((w) => [w.id, w])
)

export function getDefaultWeekId() {
  if (CONTRIBUTION_WEEK_BY_ID[LATEST_WEEK_ID]) return LATEST_WEEK_ID
  return CONTRIBUTION_WEEKS[CONTRIBUTION_WEEKS.length - 1]?.id ?? null
}

export function parseWeekHash(hash) {
  const raw = (hash || "").replace(/^#/, "")
  if (!raw.startsWith("week-")) return null
  return CONTRIBUTION_WEEK_BY_ID[raw] ? raw : null
}
