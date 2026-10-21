export const ENGINEERING_STAGES = [
  { id: "design", label: "Design", color: "#91aebb", prompt: "Describe the problem, requirements, and design choices for this iteration." },
  { id: "build", label: "Build", color: "#a2b997", prompt: "Describe what the team built or changed, including methods and materials." },
  { id: "test", label: "Test", color: "#d6ba79", prompt: "Add the tests, controls, measurements, and results for this iteration." },
  { id: "learn", label: "Learn", color: "#ce967e", prompt: "Explain what the evidence showed and how it informed the next iteration." },
]

const ART_BASE = "https://static.igem.wiki/teams/6187/wiki/engineering/content/"

// Crops use [x, y, width, height] on the original 1110 × 4000 canvases.
export const ENGINEERING_ART = {
  combinedButtonsImage: `${ART_BASE}petamon-buttons-gears.avif`,
  buttonsImage: `${ART_BASE}buttons-gears.avif`,
  petamonImage: `${ART_BASE}button-petamon.avif`,
  gearImage: `${ART_BASE}buttons-gears.avif`,
  highlightedGearImage: `${ART_BASE}highlight-gear.avif`,
  gearCrop: [187, 1323, 35, 35],
  cycleImage: `${ART_BASE}dbtl-cycle.avif`,
  cycleCrop: [145, 1870, 415, 415],
  // Traced along the white dividers of cycleCrop, normalized to 340 × 340.
  // Adjacent regions use the exact same cubic boundary in reverse. Extend to
  // the crop edges to cover the irregular painted rim. Paths meet inside the
  // white centre hole (behind the centre illustration), leaving no untinted gap.
  cycleRegions: [
    // Design: top right.
    "M164 0 H340 V161 C305 181 263 185 230 170 L170 170 L171 108 C185 78 185 38 164 0 Z",
    // Build: bottom right.
    "M340 161 V340 H180 C151 306 148 261 167 226 L170 170 L230 170 C263 185 305 181 340 161 Z",
    // Test: bottom left.
    "M180 340 H0 V174 C34 151 79 149 111 164 L170 170 L167 226 C148 261 151 306 180 340 Z",
    // Learn: top left.
    "M0 174 V0 H164 C185 38 185 78 171 108 L170 170 L111 164 C79 149 34 151 0 174 Z",
  ],
  speechBubbleImage: `${ART_BASE}speech-bubble.avif`,
  speechBubbleCrop: [174, 2262, 335, 161],
  centerImage: "",
  centerAlt: "Engineering cycle illustration",
  showCycleLabels: true,
}

// Content lives in project/engineering/<team>/_version-N.mdx.
// Register new files in components/engineering/contentRegistry.js.
function initialVersions(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `version-${index + 1}`,
    label: `Version ${index + 1}`,
  }))
}

// centerBounds: [x, y, width, height] on the 340 × 340 wheel.
export const ENGINEERING_TEAMS = [
  // Change versionCount to add/remove gears; each gear is generated separately.
  { centerImage: `${ART_BASE}hw-circle.avif`, centerCrop: [249, 2041, 181, 121],
    centerBounds: [85, 129, 150, 120],
    links: ["https://2026.igem.wiki/toronto/hardware/"],
    buttonCrop: [138, 1120, 220, 196],
    id: "hardware", label: "Hardware", color: "#9a7837", versionCount: 2,
    barCrop: [162, 1259, 178, 55], petamonCrop: [174, 1137, 174, 135] },
  { centerImage: `${ART_BASE}drylab-circle.avif`, centerCrop: [281, 2034, 146, 108],
    centerBounds: [110, 132, 125, 95],
    links: ["https://2026.igem.wiki/toronto/dry-lab/overview/"],
    buttonCrop: [362, 1120, 182, 196],
    id: "dry-lab", label: "Dry Lab", color: "#738555", versionCount: 2,
    barCrop: [364, 1259, 177, 55], petamonCrop: [364, 1137, 174, 131] },
  { centerImage: `${ART_BASE}wetlab-circle.avif`, centerCrop: [217, 1996, 261, 154],
    centerBounds: [92, 116, 150, 140],
    links: ["https://2026.igem.wiki/toronto/wet-lab/overview/"],
    buttonCrop: [550, 1120, 198, 196],
    id: "wet-lab", label: "Wet Lab", color: "#497a68", versionCount: 3,
    barCrop: [567, 1259, 177, 55], petamonCrop: [565, 1137, 174, 134] },
  { centerImage: `${ART_BASE}venhp-circle.avif`, centerCrop: [285, 1993, 142, 158],
    centerBounds: [110, 106, 130, 125],
    links: ["https://2026.igem.wiki/toronto/entrepreneurship/", "https://2026.igem.wiki/toronto/beyond-the-bench/outreach/"],
    petamonOffsetX: "6%",
    buttonCrop: [762, 1120, 182, 196],
    id: "entrepreneurship-outreach", label: "Entrepreneurship & Outreach", color: "#35657b", versionCount: 3,
    barCrop: [764, 1259, 178, 55], petamonCrop: [793, 1137, 178, 128] },
  { centerImage: `${ART_BASE}full-cycle-circle.avif`, centerCrop: [258, 1970, 160, 182],
    centerBounds: [103, 103, 115, 130],
    links: ["https://2026.igem.wiki/toronto/human-practices/", "https://2026.igem.wiki/toronto/wiki/"],
    petamonOverlap: "clamp(-22px, -1.7vw, -6px)",
    buttonCrop: [190, 1370, 718, 208],
    id: "full-team", label: "Full Team", color: "#497a68", versionCount: 3, fullWidth: true,
    barCrop: [192, 1523, 714, 54], petamonCrop: [190, 1409, 680, 136] },
].map(team => ({ barImage: "", ...team, versions: initialVersions(team.versionCount) }))
