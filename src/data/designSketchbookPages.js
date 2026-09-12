/**
 * Design outreach sketchbook — sections (colored tabs) + ordered pages.
 *
 * Optional per spread page:
 * - imageSrc / imageAlt / caption — single hero image
 * - imagePlaceholder — label shown when imageSrc is missing
 * - sectionId — which tab this page belongs to
 * - tocHalf — "left" | "right" for the two-page table of contents
 *
 * With showCover + landscape, spreads are [0], [1,2], [3,4], …
 * Each section starts on a LEFT page and pairs with a soft notes page on the right
 * so two different section tabs never share one open spread.
 */

export const DESIGN_SKETCHBOOK_SECTIONS = [
  {
    id: "web-design",
    label: "Web Design",
    color: "#3B82A0",
    progress: "Section sketches in; homepage stitch + placeholder animations underway.",
    startPageId: "web-design",
  },
  {
    id: "animation",
    label: "Animation",
    color: "#E07A3A",
    progress: "Promo mid-section assets due Jul 27; internal deadline Aug 3.",
    startPageId: "animation",
  },
  {
    id: "character-design",
    label: "Character Design",
    color: "#5A9E4B",
    progress: "Trainer + PETamon briefs sketched; sheets awaiting upload.",
    startPageId: "character-design",
  },
  {
    id: "social",
    label: "Social",
    color: "#C45B8C",
    progress: "Project Intro shipped; RTJ paused until promo lands.",
    startPageId: "social",
  },
  {
    id: "branding",
    label: "Branding",
    color: "#7B5EA7",
    progress: "Logo competition closed; Cindy redesign + animation polish.",
    startPageId: "branding",
  },
  {
    id: "other",
    label: "Other",
    color: "#8A8680",
    progress: "Reserved for upcoming design notes and process dumps.",
    startPageId: "other",
  },
]

function sectionNotesPage(sectionId, title) {
  return {
    id: `${sectionId}-notes`,
    title: `${title} — notes`,
    sectionId,
    body: "Space for sketches, links, and follow-ups. Paste CDN image URLs into designSketchbookPages.js when assets are ready.",
    density: "soft",
    variant: "notes",
  }
}

export const DESIGN_SKETCHBOOK_PAGES = [
  {
    id: "cover",
    title: "Design Team Sketchbook",
    subtitle: "iGEM Toronto 2026",
    body: "Web Design · Animation · Character Design · Social · Branding · Other",
    density: "hard",
    variant: "cover",
  },
  {
    id: "toc-left",
    title: "Contents",
    subtitle: "Jump to a section",
    density: "soft",
    variant: "toc",
    tocHalf: "left",
  },
  {
    id: "toc-right",
    title: "Contents",
    subtitle: "Continued",
    density: "soft",
    variant: "toc",
    tocHalf: "right",
  },
  {
    id: "web-design",
    title: "Web Design",
    sectionId: "web-design",
    body:
      "Homepage split into six sketched sections (Kathleen, Noorine, Cindy, Sara H) with Kathleen on final render/colour so the scroll story stays cohesive. DM Sans for UI type. Bottle lifecycle art (Noorine); keep the PETadex bottle from degrading too far before the battle beat. Section sketches targeted Jun 27; stitching and placeholder animations (conditions card, waterfall sink/rematch) followed in late June / July.",
    density: "soft",
    variant: "spread",
    imagePlaceholder: "Awaiting upload: homepage section lineart / rendered composite",
  },
  sectionNotesPage("web-design", "Web Design"),
  {
    id: "animation",
    title: "Animation",
    sectionId: "animation",
    body:
      "Promo mid-section (shots 2.1–2.9, ~25–30s) plus flowchart shot 3.12: simple TED-Ed / charming style, textured brushes like the PetaBite site (no lineart). Pipeline — storyboard done → hand-drawn assets (due Jul 27) → Kathleen render/rig in After Effects. Owners: Angirmaa (net, bottle, fragments, anemone, microplastic, trout); Kathleen (hand/fork, eating human, stomach/heart + microplastic rigs); Sara P (lake + table BGs); Cindy (3.12 flowchart). Shot 2.1 splash transition waits on scene 1 film (Jul 25). Zooplankton cut Jul 23. Internal deadline Aug 3 midnight. Tools: Procreate, After Effects, OpenToonz.",
    density: "soft",
    variant: "spread",
    imagePlaceholder: "Awaiting upload: TED-Ed style frame, asset sheet, or shot 2.x still",
  },
  sectionNotesPage("animation", "Animation"),
  {
    id: "character-design",
    title: "Character Design",
    sectionId: "character-design",
    body:
      "Brief: break stereotypes (e.g. hardware not defaulting to a male lead). Two paths — PETase-linked mascots vs subteam-specific trainers — with each trainer owning a PETamon partner. Assignments sketched across dry lab, hardware, venture, HP, outreach/web, and wet lab. Rough sketches targeted Apr 5; Google Form collected subteam feature wishes.",
    density: "soft",
    variant: "spread",
    imagePlaceholder: "Awaiting upload: trainer + PETamon character sheets",
  },
  sectionNotesPage("character-design", "Character Design"),
  {
    id: "social",
    title: "Social",
    sectionId: "social",
    body:
      "Project Intro post shipped mid-May. Road to Jamboree weekly cadence (ideate Sunday → film mid-week → edit → post) with hardware reels filmed first; series paused until the promo video lands. Newsletter mirrors RTJ in a more formal monthly voice (Brevo; Mailchimp considered later). Interest / motivation / conference posts scheduled around speaker outreach.",
    density: "soft",
    variant: "spread",
    imagePlaceholder: "Awaiting upload: Project Intro post screenshot or RTJ reel still",
  },
  sectionNotesPage("social", "Social"),
  {
    id: "branding",
    title: "Branding",
    sectionId: "branding",
    body:
      "Season opened with earthy, personal branding (no AI art). Logo competition ran through spring (Chinmay early leader); Cindy led redesign and animation polish, including capitalization fixes. Grass / line-art feedback explored to stay closer to classic iGEM mark energy while keeping our own voice.",
    density: "soft",
    variant: "spread",
    imagePlaceholder: "Awaiting upload: final logo still (+ animated frame if available)",
  },
  sectionNotesPage("branding", "Branding"),
  {
    id: "other",
    title: "Other",
    sectionId: "other",
    body:
      "A catch-all for design notes that don’t fit the main tabs yet — workshop dumps, tool experiments, and merch. Meet #15 (Jul 20) opened merch scouting for hoodies, tees, quarter-zips, and stickers (local sticker shop + Alibaba apparel options). Add pages here as they land.",
    density: "soft",
    variant: "spread",
    imagePlaceholder: "Awaiting upload: misc design process notes",
  },
  sectionNotesPage("other", "Other"),
  {
    id: "back",
    title: "More pages soon",
    subtitle: "Flip back or tap a tab",
    body:
      "Drop CDN image URLs into designSketchbookPages.js as lineart, mockups, and character sheets are uploaded. Until then, spreads hold process notes from outreach and web-design meetings.",
    density: "hard",
    variant: "back",
  },
]

/** Map section id → first page index in DESIGN_SKETCHBOOK_PAGES. */
export function getSectionStartIndex(sectionId) {
  const section = DESIGN_SKETCHBOOK_SECTIONS.find((s) => s.id === sectionId)
  if (!section) return -1
  return DESIGN_SKETCHBOOK_PAGES.findIndex((p) => p.id === section.startPageId)
}

/** Sections shown on the left vs right TOC page (3 + 3). */
export function getTocSections(half) {
  const mid = Math.ceil(DESIGN_SKETCHBOOK_SECTIONS.length / 2)
  if (half === "left") return DESIGN_SKETCHBOOK_SECTIONS.slice(0, mid)
  if (half === "right") return DESIGN_SKETCHBOOK_SECTIONS.slice(mid)
  return DESIGN_SKETCHBOOK_SECTIONS
}

/** StPageFlip / page-flip — https://github.com/Nodlik/StPageFlip (MIT, Copyright 2020 Nodlik) */
export const PAGE_FLIP_ATTRIBUTION = {
  name: "StPageFlip",
  author: "Nodlik (Oleg Litovski)",
  url: "https://github.com/Nodlik/StPageFlip",
  license: "MIT",
  npmPackage: "page-flip",
}
