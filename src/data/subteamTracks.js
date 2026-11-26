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
    href: "/outreach/",
  },
  {
    id: "venture",
    label: "Entrepreneurship",
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

/** @typedef {SubteamId | 'all'} MilestoneTrackId */

/** Whole-team milestones: a calendar colour only, not a filter. */
export const WHOLE_TEAM_TRACK = {
  id: "all",
  label: "Whole team",
  color: "#F6C945",
  textColor: "#06202B",
  href: "/contribution/",
}

/** Tracks a milestone can belong to: every subteam plus the whole team. */
export const MILESTONE_TRACK_BY_ID = { ...SUBTEAM_BY_ID, all: WHOLE_TEAM_TRACK }

/** A track's colour, which a page can override with `--cal-team-<id>`. */
export const trackColor = (track) => `var(--cal-team-${track.id}, ${track.color})`

/** Text on a track's colour, overridable with `--cal-team-<id>-text`. */
export const trackTextColor = (track) =>
  `var(--cal-team-${track.id}-text, ${track.textColor})`
