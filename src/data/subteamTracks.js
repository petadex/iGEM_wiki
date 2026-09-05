/**
 * Subteam track metadata for contribution calendar filters, milestones, and detail links.
 */

/** @typedef {'wetLab' | 'dryLab' | 'hardware' | 'humanPractices' | 'outreach' | 'venture' | 'web'} SubteamId */

/**
 * @typedef {Object} SubteamTrack
 * @property {SubteamId} id
 * @property {string} label
 * @property {string} color
 * @property {string} textColor
 * @property {string} href
 */

/** @type {SubteamTrack[]} */
export const SUBTEAM_TRACKS = [
  {
    id: "wetLab",
    label: "Wet Lab",
    color: "#FFAAAA",
    textColor: "#06202B",
    href: "/wet-lab/overview/",
  },
  {
    id: "dryLab",
    label: "Dry Lab",
    color: "#6DE4C0",
    textColor: "#06202B",
    href: "/dry-lab/overview/",
  },
  {
    id: "hardware",
    label: "Hardware",
    color: "#C5EAFF",
    textColor: "#06202B",
    href: "/hardware/",
  },
  {
    id: "humanPractices",
    label: "Human Practices",
    color: "#2D9194",
    textColor: "#ffffff",
    href: "/human-practices/",
  },
  {
    id: "outreach",
    label: "Outreach",
    color: "#FDD8F1",
    textColor: "#06202B",
    href: "/beyond-the-bench/outreach/",
  },
  {
    id: "venture",
    label: "Venture",
    color: "#06202B",
    textColor: "#ffffff",
    href: "/entrepreneurship/",
  },
  {
    id: "web",
    label: "Web",
    color: "#D2F5E3",
    textColor: "#06202B",
    href: "/software/",
  },
]

export const SUBTEAM_IDS = SUBTEAM_TRACKS.map((t) => t.id)

/** @type {Record<SubteamId, SubteamTrack>} */
export const SUBTEAM_BY_ID = Object.fromEntries(SUBTEAM_TRACKS.map((t) => [t.id, t]))
