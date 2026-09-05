import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { withPrefix } from "gatsby"
import styled, { css, keyframes } from "styled-components"
import { WikiTopBar, WIKI_TOP_BAR_Z_INDEX } from "./WikiTopBar.js"
import { WaterfallSideText, PETASE_EXPLANATION } from "./WaterfallSideText.js"
import { SwipeInBox } from "./SwipeInBox.js"
import { ExplainTerm } from "./ExplainTermPopover.js"

/**
 * Homepage bottle stages (degradation journey).
 * `sky` is used for the waterfall; section1–5 are reserved for later sections.
 */
export const BOTTLE_STAGES = {
  sky: "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/sky.avif",
  section1:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section1.avif",
  section2:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section2.avif",
  section3:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section3.avif",
  section4:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section4.avif",
  section5:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section5.avif",
}

const ASSETS = {
  back: "https://static.igem.wiki/teams/6187/wiki/homepage-components/wiki-front-page-back.avif",
  /** Unified front plate: plaza + waterfall + river + map + forest. */
  front:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/wiki-front-page-top.avif",
  /** Foreground bushes — highest scenery layer (same 563×4000 canvas as front). */
  bush: "https://static.igem.wiki/teams/6187/wiki/homepage-components/wiki-front-page-bush.avif",
  /** Waterfall / sky section bottle (current homepage stage). */
  bottle: BOTTLE_STAGES.sky,
  /** Opaque puddle lip — sits over the bottle so it can tuck behind the water. */
  water: withPrefix("/wiki-mockup/wiki-front-water.png"),
}

/** Nine-frame PETABITE logo loop (same slot + idle float as the old static logo). */
const LOGO_FRAME_COUNT = 9
/** Base hold for frames 1–7. */
const LOGO_FRAME_MS = 170
/** Longer hold for frame 8. */
const LOGO_PENULTIMATE_FRAME_MS = 650
/** Longest hold for the completed PETABITE title (frame 9). */
const LOGO_LAST_FRAME_MS = 1300
const LOGO_FRAMES = Array.from(
  { length: LOGO_FRAME_COUNT },
  (_, i) =>
    `https://static.igem.wiki/teams/6187/wiki/homepage-components/logo-animation-files/untitled-artwork-${i + 1}.avif`,
)

/** Per-frame visibility windows so the last two frames linger, last longest. */
const LOGO_FRAME_TIMING = (() => {
  const durations = Array.from({ length: LOGO_FRAME_COUNT }, (_, i) => {
    if (i === LOGO_FRAME_COUNT - 1) return LOGO_LAST_FRAME_MS
    if (i === LOGO_FRAME_COUNT - 2) return LOGO_PENULTIMATE_FRAME_MS
    return LOGO_FRAME_MS
  })
  const cycleMs = durations.reduce((sum, ms) => sum + ms, 0)
  let acc = 0
  const windows = durations.map(ms => {
    const start = acc / cycleMs
    acc += ms
    return { start, end: acc / cycleMs }
  })
  return { cycleMs, windows }
})()

const LOGO_FRAME_KEYFRAMES = LOGO_FRAME_TIMING.windows.map(({ start, end }) => {
  const s = start * 100
  const e = end * 100
  if (start <= 0) {
    return keyframes`
      0%,
      ${e}% {
        opacity: 1;
      }
      ${e + 0.001}%,
      100% {
        opacity: 0;
      }
    `
  }
  return keyframes`
    0%,
    ${Math.max(0, s - 0.001)}% {
      opacity: 0;
    }
    ${s}%,
    ${e}% {
      opacity: 1;
    }
    ${e + 0.001}%,
    100% {
      opacity: 0;
    }
  `
})

/**
 * Unified front canvas (CDN `wiki-front-page-top.avif`).
 * Overlay bands are fractions of this image so a same-composition re-export
 * (e.g. 1440-wide) keeps placement. Measured on 563×4000:
 *   0–395 transparent sky hole (Toronto shows through)
 *   395–1380 plaza + waterfall (legacy 2440 plate)
 *   1380–2440 river / first sand (legacy shore)
 *   2440–2900 world map
 *   2900–3503 forest
 *   3503–4000 transparent pad
 */
const FRONT_ART_HEIGHT = 4000
const WATERFALL_BAND_TOP = 395 / FRONT_ART_HEIGHT
const WATERFALL_BAND_BOT = 1380 / FRONT_ART_HEIGHT
const SHORE_BAND_BOT = 2440 / FRONT_ART_HEIGHT
const WATERFALL_BAND_HEIGHT = WATERFALL_BAND_BOT - WATERFALL_BAND_TOP
const SHORE_BAND_TOP = WATERFALL_BAND_BOT
const SHORE_BAND_HEIGHT = SHORE_BAND_BOT - SHORE_BAND_TOP
/** Under the world map, through the forest / just above the bushes. */
const FOREST_BAND_TOP = 2660 / FRONT_ART_HEIGHT
const FOREST_BAND_BOT = 3503 / FRONT_ART_HEIGHT
const FOREST_BAND_HEIGHT = FOREST_BAND_BOT - FOREST_BAND_TOP
const CREAM_PAD_TOP = FOREST_BAND_BOT
const CREAM_PAD_HEIGHT = 1 - CREAM_PAD_TOP

/**
 * Scroll-driven bottle: enter from left after shore float, descend the map→forest
 * band, swap+shrink at the topmost section-3 bird, park at the second-topmost crab
 * (above the industry line) during walk-sticky, then fall behind the bushes once
 * non-sticky scrolling resumes. Scroll-up reverses the same path.
 *
 * Landmark tops are % of this band, derived from section-3 painted centroids:
 *   bird-b (topmost bird) ≈ 36.3% of forest → ~49.5% of bottle band
 *   crab-b (2nd-top crab) ≈ 70.9% of forest → ~76.9% of bottle band
 */
const MAP_BOTTLE_BAND_TOP = SHORE_BAND_BOT
const MAP_BOTTLE_BAND_HEIGHT = FOREST_BAND_BOT - SHORE_BAND_BOT
/** Horizontal: slide in from off-left, then hold this % while descending. */
const MAP_BOTTLE_LEFT_ENTER = -16
const MAP_BOTTLE_LEFT_REST = 12
/** Progress (0–1) by which the left-enter finishes and downward travel dominates. */
const MAP_BOTTLE_ENTER_END = 0.12
/** Vertical keyframes within the bottle band (%). */
const MAP_BOTTLE_TOP_START = 8
/** Same Y as topmost section-3 bird — swap to section3 + begin shrink here. */
const MAP_BOTTLE_TOP_SWAP = 49.5
/** Reached as the walk begins (higher = smaller %). Above industry copy. */
const MAP_BOTTLE_TOP_HOLD = 73
/**
 * Comes to rest here, down in the bush line. Measured on the bush plate, its
 * leaves start at 82% of this band and are solid by 86.5%, so this drops the
 * bottle well inside them — only the cap shows through the thinning top edge,
 * and the bird has to dive in after the rest of it.
 */
const MAP_BOTTLE_TOP_BUSH = 86
/** Tuck fully behind bushes after walk sticky releases. */
const MAP_BOTTLE_TOP_EXIT = 98
/** Final scale once fully into the section3 stage (lerps SWAP → HOLD). */
const MAP_BOTTLE_FOREST_SCALE = 0.62

/** Map a band-top % onto 0–1 scroll progress along START → EXIT. */
function mapBottleProgressForTop(topPct) {
  return (
    (topPct - MAP_BOTTLE_TOP_START) /
    Math.max(1e-6, MAP_BOTTLE_TOP_EXIT - MAP_BOTTLE_TOP_START)
  )
}
const MAP_BOTTLE_HOLD_P = mapBottleProgressForTop(MAP_BOTTLE_TOP_HOLD)
const MAP_BOTTLE_BUSH_P = mapBottleProgressForTop(MAP_BOTTLE_TOP_BUSH)
const MAP_BOTTLE_FADE_P = mapBottleProgressForTop(96)
/** Share of the drop into the bushes that happens while he is still walking. */
const MAP_BOTTLE_WALK_FALL_SHARE = 0.85
/**
 * Walk progress by which that share is spent. The drop starts out in the
 * industry line's column, so it clears it in the first stretch of the walk
 * rather than creeping down behind the words.
 */
const MAP_BOTTLE_WALK_FALL_END = 0.4
/** Steal progress by which the bottle has finished settling in the leaves. */
const MAP_BOTTLE_SETTLE_END = 0.17

/**
 * Section4 bottle (after bushes): barrel-rolls in from the right as the cream-pad
 * “advisory lab” copy enters, sticks at viewport center, parks under “Some
 * applications include…”, then after a short hold tilts onto the WWTP ramp and
 * slides off down-left.
 */
const CREAM_BOTTLE_LEFT_ENTER = 120
const CREAM_BOTTLE_LEFT_CENTER = 50
/** Full Z rotations during the right→center approach. */
const CREAM_BOTTLE_ROLLS = 4
/** Gap from the apps lead bottom to the bottle top while parked (px). */
const CREAM_BOTTLE_PARK_GAP_PX = 28
/**
 * Cream-text top vs viewport height: roll starts / reaches center.
 * Wider gap (lower end frac) = slower approach to center.
 */
const CREAM_BOTTLE_ROLL_START_FRAC = 0.95
const CREAM_BOTTLE_ROLL_END_FRAC = 0.05
/**
 * Entry Y as a fraction down the cream-text box (1 = bottom edge).
 * Higher = farther below the advisory-lab copy.
 */
const CREAM_BOTTLE_ENTER_TEXT_FRAC = 1.55
/** Ease on horizontal travel — >1 keeps it right longer, then eases into center. */
const CREAM_BOTTLE_CENTER_EASE = 1.45
/** Extra scroll (vh) after park before the ramp exit begins. */
const CREAM_BOTTLE_RAMP_HOLD_VH = 0.08
/** Scroll span (vh) for tilt + slide off the WWTP ramp. */
const CREAM_BOTTLE_RAMP_SLIDE_VH = 0.9
/** Final lean onto the ramp (deg, CCW = negative). */
const CREAM_BOTTLE_RAMP_TILT_DEG = -45
/** Ramp slope from horizontal (deg) — down-left toward the tank. */
const CREAM_BOTTLE_RAMP_SLOPE_DEG = 20
/** Fraction of exit progress used to ease into the tilt (rest is slide). */
const CREAM_BOTTLE_RAMP_TILT_FRAC = 0.5
/** Travel distance as a fraction of viewport diagonal. */
const CREAM_BOTTLE_RAMP_DIST_FRAC = 1.05
/**
 * Shift the locked / ramp path up (px, negative = higher on screen) so the
 * bottle rides on top of the WWTP ramp instead of under it.
 */
const CREAM_BOTTLE_RAMP_Y_NUDGE_PX = -56
/** Scroll back above park capture (vh) before sticky/center can run again. */
const CREAM_BOTTLE_UNPARK_VH = 0.2

/**
 * Second WWTP bottle path, in % of the section-5 plate.
 *   X: 0 = left edge, 100 = right edge. >100 is off-right, <0 is off-left.
 *   Y: 0 = top of the plate, 100 = bottom. Higher = lower on the page.
 * Slope is the line between these two points — no separate angle to set.
 */
const RAMP2_START_X_PCT = 112
const RAMP2_START_Y_PCT = 15
const RAMP2_END_X_PCT = -14
const RAMP2_END_Y_PCT = 28.5
/**
 * When ramp 2 starts, as a fraction of bottle 1's slide (0 = bottle 1 just
 * leaves the park, 1 = bottle 1 is fully off the left edge).
 */
const RAMP2_ARM_AT = 0.28
/** Scroll span (vh) for the start → end traversal. */
const RAMP2_SLIDE_VH = CREAM_BOTTLE_RAMP_SLIDE_VH

const SECTION5_CDN =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/noorine-section-5-layers"

/** Tall underwater plate (946×4000), stacked back → front. */
const SECTION5_LAYERS = [
  { id: 1, file: "1-bg.avif", z: 1, sizer: true },
  { id: 2, file: "2-mid-trench.avif", z: 2 },
  { id: 3, file: "3-fore-trench.avif", z: 3 },
  { id: 4, file: "4-coral-texture.avif", z: 4 },
  { id: 5, file: "5-coral-blend.avif", z: 5 },
  { id: 7, file: "7-wwtp.avif", z: 7 },
]

/**
 * Layer 8 — sparse fish sprites near the bottom of the plate. Drift + bob on
 * top of the scenery (below apps copy). Not layer 5 (coral-blend is static).
 */
const SECTION5_FISHES = [
  {
    id: "fishes",
    src: `${SECTION5_CDN}/8-fishes-that-can-move-around.avif`,
    z: 9,
    driftMs: 52000,
    driftDelayMs: 1200,
    hoverDelayMs: 0,
  },
]

const SHORE_BOTTLE_IMG =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/bottle-w-ripples.avif"

const CONDITION_CARD_IMAGES = [
  {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/condition-cards/ph.avif",
    alt: "pH",
  },
  {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/condition-cards/temp.avif",
    alt: "Temperature",
  },
  {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/condition-cards/surrounding-env.avif",
    alt: "Environment",
  },
]

const RNALAB_TEXTBOX_IMG =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/text-boxes/rnalab.avif"

const RNALAB_EXPLANATION =
  "RNAlab is our advisory lab partner that helped uncover 215.7 million high-quality plastic-degrading enzymes."

/** Jump to the top on mount / HMR. Turn back on before shipping. */
const RESET_SCROLL_ON_MOUNT = false

/** Overlays inside a band (text above bottle). */
const Z = {
  logo: 2,
  bottle: 3,
  water: 4,
  text: 5,
}

/**
 * Shift painting-locked overlays up within the waterfall band (logo + birds stay).
 * Applied to copy, sky bottle, splash, and the sink lip so they stay in step.
 */
const LANDMARK_NUDGE_UP = 0.07

/**
 * Where the bottle sits in the legacy art band (0 = top, 1 = bottom).
 * Anchors into the waterfall rather than the sky.
 */
const BOTTLE_TOP_FRAC = 0.42 - LANDMARK_NUDGE_UP

/** Pixels scroll must move back above the captured TP1 scrollY before bottle unpins. */
const BOTTLE_PIN_SCROLL_UP_LEAVE = 40

/** FLIP duration (ms) for bottle pick-up / put-down when toggling sticky. */
const BOTTLE_FLIP_MS = 580

/** Back layer scroll speed vs foreground (lower = slower / more depth). */
const BACK_PARALLAX_SPEED = 0.7

/**
 * Full-bleed bird flap pairs (same canvas as the back art).
 * `speed` is parallax vs scroll (between back and foreground).
 * `flapMs` is one full A↔B cycle.
 */
const BIRDS = [
  {
    id: 1,
    a: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-1.avif",
    b: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-1-2.avif",
    speed: 0.82,
    flapMs: 980,
    delayMs: 0,
    depth: "back",
    driftMs: 32000,
    driftDelayMs: 2000,
  },
  {
    id: 2,
    a: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-2.avif",
    b: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-2-2.avif",
    speed: 0.88,
    flapMs: 480,
    delayMs: 140,
    depth: "front",
    z: 4,
  },
  {
    id: 3,
    a: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-3.avif",
    b: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-3-2.avif",
    speed: 0.78,
    flapMs: 1100,
    delayMs: 240,
    depth: "back",
    driftMs: 40000,
    driftDelayMs: 8000,
  },
  {
    id: 4,
    a: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-4.avif",
    b: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-4-2.avif",
    speed: 0.92,
    flapMs: 520,
    delayMs: 80,
    depth: "front",
  },
]

/**
 * Fraction of the waterfall band height where the puddle / ripple sits.
 * Tune against the unified front plate (lip ≈ 1380/4000).
 */
const WATER_RIPPLE_FRAC = 0.98 - LANDMARK_NUDGE_UP - 0.06

/**
 * Visible bottle band as a fraction of its layer height.
 * Higher fracs = fade finishes sooner (before deep water / shore overlap).
 */
const BOTTLE_SUBMERGE_TOP_FRAC = 0.45
const BOTTLE_SUBMERGE_BOT_FRAC = 0.5
/** Extra downward slide (px) as the bottle fades under the water. */
const BOTTLE_SINK_SLIDE_PX = 36
/** CSS splash duration (ms) when the bottle hits the water. */
const BOTTLE_SPLASH_MS = 920
/** Fire splash once the bottle is mostly faded (after fade starts, before full hide). */
const BOTTLE_SPLASH_TRIGGER_OPACITY = 0.35
/**
 * Shore-approach fade: start clearing the pinned sky bottle before the shore
 * enters the viewport so it never overlaps the second art section.
 * Values are shore-top as a fraction of viewport height.
 */
const BOTTLE_SHORE_FADE_START_VH = 0.75
const BOTTLE_SHORE_FADE_END_VH = 0.73
/** Splash anchor on the first (waterfall) art band — puddle / river start. */
const WATERFALL_SPLASH_TOP_PCT = 92 - LANDMARK_NUDGE_UP * 100 - 6
const WATERFALL_SPLASH_LEFT_PCT = 50
/** Opaque blob top in wiki-front-water.png (px 2235 / 2440). Shift so it sits on the splash lip. */
const PUDDLE_ART_TOP_FRAC = 2235 / 2440
const PUDDLE_SHIFT_Y_PCT =
  (PUDDLE_ART_TOP_FRAC - WATERFALL_SPLASH_TOP_PCT / 100) * -100
/** Second puddle copy, extra % of the waterfall band downward so the bottle cannot peek under the lip. */
const PUDDLE_UNDER_SHIFT_PCT = 4.5

/**
 * Autonomous shore-bottle rematch (section1).
 * Triggers once when the river/sand band crosses an early viewport threshold after the sky
 * bottle sinks; then slowly drifts down and exits left on its own.
 */
/** Shore top below this fraction of vh → start the drift (appear as shore peeks in). */
const SHORE_BOTTLE_TRIGGER_FRAC = 1.02
/** Shore top above this → reset so the drift can replay on the next pass. */
const SHORE_BOTTLE_RESET_FRAC = 1.08
/** Total drift duration (continuous path travel). */
const SHORE_BOTTLE_DRIFT_MS = 15000
/** Sky bottle treated as sunk once fade opacity drops below this. */
const SHORE_BOTTLE_SUNK_OPACITY = 0.2

const CRAB_CDN =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/section-2-animals"

/**
 * Section-2 crabs (shore / sand). Each pair is a full transparent plate
 * (2238×3132) with the crab painted in place — same flip idea as the birds.
 * Overlay is full-bleed on the shore band from the top; `xPct` / `yPct` are
 * extra translates (% of that plate) if you need to nudge one.
 *
 * Painted spots on the plate (left%, top% = bbox; also centroid):
 *   a  left 64.4  top 6.9   (centroid 68.5, 10.4)  — upper-right sand
 *   b  left 76.6  top 11.2  (centroid 79.5, 13.4)  — further right, a bit lower
 *   c  left 30.4  top 81.4  (centroid 36.4, 86.1)  — lower-left sand
 */
const CRABS = [
  {
    id: "a",
    a: `${CRAB_CDN}/crab-section-2-a.avif`,
    b: `${CRAB_CDN}/crab-section-2-a-2.avif`,
    xPct: -10,
    yPct: 12,
    flapMs: 860,
    delayMs: 0,
  },
  {
    id: "b",
    a: `${CRAB_CDN}/crab-section-2-b.avif`,
    b: `${CRAB_CDN}/crab-section-2-b-2.avif`,
    xPct: -50,
    yPct: 30,
    flapMs: 640,
    delayMs: 180,
  },
  {
    id: "c",
    a: `${CRAB_CDN}/crab-section-2-c.avif`,
    b: `${CRAB_CDN}/crab-section-2-c-2.avif`,
    xPct: 0,
    yPct: 0,
    flapMs: 980,
    delayMs: 320,
  },
]

const SECTION3_CDN =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/section-3-animals"

/**
 * Section-3 animals (under the map, above the bushes). Same 2238×3132 plates
 * and a↔a-2 flip as the shore crabs. Overlay is full-bleed from the forest
 * band top; `xPct` / `yPct` nudge (% of the plate).
 *
 * Painted spots (bbox left%, top% / centroid):
 *   background-axolotl  25.2, 67.0  (49.6, 71.3)  — wide mid-bottom, static
 *   axolotl             80.3, 64.2  (87.2, 68.4)  — lower right
 *   bird-a              69.1, 34.9  (72.7, 37.5)  — upper right
 *   bird-b              33.3, 33.7  (35.9, 36.3)  — upper left
 *   crab-a              24.5, 53.4  (26.5, 54.4)  — mid left
 *   crab-b              17.9, 69.4  (20.1, 70.9)  — lower left
 *   crab-c              77.3, 72.3  (79.5, 74.0)  — lower right
 */
const SECTION3_ANIMALS = [
  {
    id: "background-axolotl",
    static: true,
    src: `${SECTION3_CDN}/section-3-background-axolotl.avif`,
    xPct: 0,
    yPct: 10,
    revealOnArrive: true,
  },
  {
    id: "axolotl",
    a: `${SECTION3_CDN}/section-3-axolotl.avif`,
    b: `${SECTION3_CDN}/section-3-axolotl-2.avif`,
    xPct: 1,
    yPct: 10,
    flapMs: 1100,
    delayMs: 80,
    revealOnArrive: true,
  },
  {
    id: "bird-a",
    a: `${SECTION3_CDN}/section-3-bird-a.avif`,
    b: `${SECTION3_CDN}/section-3-bird-a-2.avif`,
    xPct: 10,
    yPct: 0,
    scale: 1.32,
    originX: 72.7,
    originY: 37.5,
    hover: true,
    /** Empty transparent column on the right of the plate — drop it so scale doesn't widen the page. */
    clipRightPct: 24,
    flapMs: 480,
    delayMs: 40,
  },
  {
    id: "bird-b",
    a: `${SECTION3_CDN}/section-3-bird-b.avif`,
    b: `${SECTION3_CDN}/section-3-bird-b-2.avif`,
    xPct: -15,
    yPct: 10,
    scale: 1.32,
    originX: 35.9,
    originY: 36.3,
    hover: true,
    flapMs: 720,
    delayMs: 160,
  },
  {
    id: "crab-a",
    a: `${SECTION3_CDN}/section-3-crab-a.avif`,
    b: `${SECTION3_CDN}/section-3-crab-a-2.avif`,
    xPct: -23,
    yPct: 25,
    flapMs: 820,
    delayMs: 0,
    revealOnArrive: true,
  },
  {
    id: "crab-b",
    a: `${SECTION3_CDN}/section-3-crab-b.avif`,
    b: `${SECTION3_CDN}/section-3-crab-b-2.avif`,
    xPct: -1,
    yPct: -8,
    flapMs: 700,
    delayMs: 220,
    revealOnArrive: true,
  },
  {
    id: "crab-c",
    a: `${SECTION3_CDN}/section-3-crab-c.avif`,
    b: `${SECTION3_CDN}/section-3-crab-c-2.avif`,
    xPct: 0,
    yPct: -10,
    flapMs: 940,
    delayMs: 360,
    revealOnArrive: true,
  },
]

/**
 * Section-3 human plate (2238×3132, same overlay as the forest animals).
 * Above the painting + animals, under the bush layer. Tweak `xPct` / `yPct`.
 * Painted bbox ≈ left 31.2% top 17% (centroid 61.5, 51.2).
 */
const HUMAN = {
  src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/human/human-1.avif",
  srcArrived:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/human/human-2.avif",
  xPct: 20,
  yPct: 33,
  scale: 0.47,
  originX: 61.5,
  originY: 51.2,
}

/** Extra in-flow scroll while the forest frame is sticky; maps to walk progress. */
const WALK_TRACK_VH = 120
/**
 * Freeze after pose 2 + bang. Long enough to read the RNAlab reveal and scrub
 * the bird-steal beat before the forest unpins.
 */
const WALK_HOLD_VH = 300
/** Keep the figure centroid at this viewport Y while the forest is frozen. */
const HUMAN_PIN_VIEW_Y = 0.68
/**
 * Stop the figure centroid at this fraction of viewport width (was 0.5).
 * Just left of center so the RNAlab copy has room on his right.
 */
const HUMAN_PIN_VIEW_X = 0.43

/**
 * Bird steal beat, scrubbed by scroll through the arrival hold (0–1):
 * the rightmost forest bird swoops to the parked bottle, grabs it, and carries
 * it off frame. Windows are fractions of the hold.
 */
const STEAL_BIRD_ID = "bird-a"
const STEAL_APPROACH_START = 0.12
const STEAL_GRAB_AT = 0.54
const STEAL_EXIT_END = 0.97
/**
 * The bird's perch sits above the pinned viewport, so the flight starts just
 * off the top-right edge instead (fractions of the viewport).
 */
const STEAL_ENTRY_X_FRAC = 0.92
const STEAL_ENTRY_Y_FRAC = -0.12
/**
 * Dive bow (positive = dips below the straight line, so the bird drops into
 * frame early instead of skimming above it) and exit vector, as fractions of
 * the painting width. Exit runs up and to the left, away from the walker.
 */
const STEAL_ARC_FRAC = 0.07
const STEAL_EXIT_DX_FRAC = -0.28
const STEAL_EXIT_DY_FRAC = -0.38
/**
 * The bird dives all the way onto the bottle now that it lies in the leaves,
 * so it only rides a hair above the bottle at the grab.
 */
const STEAL_GRAB_LIFT_FRAC = 0.015
/**
 * The bottle trails this far behind the bird along the exit path, so the bird
 * climbs out of the bushes first and the bottle swings up after it.
 */
const STEAL_CARRY_LAG = 0.16
/** Fraction of the exit spent fading the bird + carried bottle out. */
const STEAL_FADE_FROM = 0.72
/** Hold fraction over which the "dataset of 200" line clears for the reveal. */
const STEAL_DATASET_FADE = 0.09

const STEAL_BIRD =
  SECTION3_ANIMALS.find(animal => animal.id === STEAL_BIRD_ID) || null

const clamp01 = v => Math.max(0, Math.min(1, v))
const smoothstep = t => t * t * (3 - 2 * t)
/** Human / animal overlay plates are 2238×3132. */
const OVERLAY_PLATE_ASPECT = 3132 / 2238
/** Head on the human plate (%), for placing the bang behind it. */
const HUMAN_HEAD_X = 61.5
const HUMAN_HEAD_Y = 22
/** Bang centroid on the full-size exclamation plate (%). */
const EXCLAMATION_MARK_X = 55
const EXCLAMATION_MARK_Y = 30
const EXCLAMATION_SRC =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/human/exclamation.avif"

/**
 * Full-page wiki front compositing: Toronto parallax behind one tall front plate.
 *
 * Site nav uses scroll-driven `position: fixed` while the mockup is on-screen.
 *
 * Bottle touchpoints: (1) when the bottle midpoint crosses the viewport middle, capture scrollY
 * and pin the bottle centered; (2) stay pinned through the bottom of the page so it does not
 * vanish. Unpin only when the user scrolls back up past TP1 (`scrollY` below that capture minus slack).
 */
export function HomeScrollPrototype() {
  const stackRef = useRef(null)
  const bottleTouchRef = useRef(null)
  const bottleFlipRef = useRef(null)
  const bottleTouchPinnedRef = useRef(false)
  const bottlePinEnterScrollYRef = useRef(null)
  const flipUnpinFirstRef = useRef(null)
  const flipPinFirstRef = useRef(null)
  const flipCleanupRef = useRef(null)
  const parallaxBackRef = useRef(null)
  const birdParallaxRefs = useRef([])
  const waterRef = useRef(null)
  const shoreRef = useRef(null)
  const mapBottleBandRef = useRef(null)
  const mapBottleMountRef = useRef(null)
  const mapBottleImgRef = useRef(null)
  const mapBottleInForestRef = useRef(false)
  /** Band progress when forest walk begins — ease from here to the crab hold. */
  const mapBottleWalkStartPRef = useRef(null)
  const creamPadTextRef = useRef(null)
  const section5RootRef = useRef(null)
  const section5LeadRef = useRef(null)
  const creamBottleMountRef = useRef(null)
  const creamBottleParkedRef = useRef(false)
  /** scrollY when the bottle first parks under the apps lead. */
  const creamBottleParkScrollYRef = useRef(null)
  /** Document Y (scrollY + viewport top) frozen at lock — scrolls with the art. */
  const creamBottleParkDocYRef = useRef(null)
  const ramp2BottleMountRef = useRef(null)
  /** scrollY when ramp-2 bottle activates (first bottle fully exited). */
  const ramp2StartScrollYRef = useRef(null)
  const walkTrackRef = useRef(null)
  const compositionRef = useRef(null)
  const humanWalkRef = useRef(null)
  const humanBobRef = useRef(null)
  const forestDatasetRef = useRef(null)
  const birdStealRef = useRef(null)
  /** Last steal progress (0–1); persists past unpin so the bottle stays stolen. */
  const birdStealPRef = useRef(0)
  const walkArrivedRef = useRef(false)
  const walkLatchedRef = useRef(false)
  const walkReleasedRef = useRef(false)
  const shoreBottlePlayedRef = useRef(false)
  /** True after the sky bottle finishes its waterfall sink (near-bottom unpin). */
  const skyBottleHasSunkRef = useRef(false)
  /** Keep the overlay bottle hidden after sink so it cannot reappear through the fall. */
  const skyBottleHiddenRef = useRef(false)
  /** Splash plays once per sink; reset when the sky bottle is restored. */
  const splashPlayedRef = useRef(false)
  const bottleSinkMotionRef = useRef(null)
  const bottleVisualRef = useRef(null)
  const [navPinned, setNavPinned] = useState(false)
  const [bottleTouchPinned, setBottleTouchPinned] = useState(false)
  const [shoreBottlePlaying, setShoreBottlePlaying] = useState(false)
  const [splashPlaying, setSplashPlaying] = useState(false)
  const [walkArrived, setWalkArrived] = useState(false)
  const reduceMotionParallaxRef = useRef(false)

  bottleTouchPinnedRef.current = bottleTouchPinned

  const applyBottleSinkVisual = useCallback(opacity => {
    const visual = bottleVisualRef.current
    const sink = bottleSinkMotionRef.current
    const op = Math.max(0, Math.min(1, opacity))
    if (visual) {
      visual.style.opacity = String(op)
    }
    if (sink) {
      const slide = (1 - op) * BOTTLE_SINK_SLIDE_PX
      sink.style.transform = slide > 0.1 ? `translate3d(0, ${slide}px, 0)` : ""
    }
  }, [])

  const triggerBottleSplash = useCallback(() => {
    if (splashPlayedRef.current) return
    splashPlayedRef.current = true
    setSplashPlaying(true)
  }, [])

  const hideSkyBottle = useCallback(() => {
    skyBottleHasSunkRef.current = true
    skyBottleHiddenRef.current = true
    applyBottleSinkVisual(0)
    triggerBottleSplash()
  }, [applyBottleSinkVisual, triggerBottleSplash])

  const restoreSkyBottle = useCallback(() => {
    skyBottleHasSunkRef.current = false
    skyBottleHiddenRef.current = false
    splashPlayedRef.current = false
    setSplashPlaying(false)
    applyBottleSinkVisual(1)
  }, [applyBottleSinkVisual])

  // Reset scroll before paint so a restored mid-page scroll cannot flash a pinned/sunk bottle.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return
    if (!RESET_SCROLL_ON_MOUNT) return
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }
    window.scrollTo(0, 0)
    skyBottleHasSunkRef.current = false
    skyBottleHiddenRef.current = false
    splashPlayedRef.current = false
    bottleTouchPinnedRef.current = false
    bottlePinEnterScrollYRef.current = null
    applyBottleSinkVisual(1)
  }, [applyBottleSinkVisual])

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return undefined
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      reduceMotionParallaxRef.current = mq.matches
      if (mq.matches) {
        if (parallaxBackRef.current) {
          parallaxBackRef.current.style.transform = "translate3d(0, 0, 0)"
          parallaxBackRef.current.style.willChange = "auto"
        }
        birdParallaxRefs.current.forEach(el => {
          if (!el) return
          el.style.transform = "translate3d(0, 0, 0)"
          el.style.willChange = "auto"
        })
      }
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useLayoutEffect(() => {
    const tick = () => {
      const stack = stackRef.current
      const bottleSpot = bottleTouchRef.current
      const y = window.scrollY

      // Use ScrollStack bottom to know where the mockup section is in the viewport
      const stackBottom = stack
        ? stack.getBoundingClientRect().bottom
        : window.innerHeight

      // Release the bottle when the ScrollStack bottom crosses 45% of viewport height
      const UNPIN_THRESHOLD = window.innerHeight * 0.45
      const nearBottom = stackBottom <= UNPIN_THRESHOLD

      if (bottleTouchPinnedRef.current && nearBottom) {
        const flip = bottleFlipRef.current
        if (flip) flipUnpinFirstRef.current = flip.getBoundingClientRect()
        else flipUnpinFirstRef.current = null
        hideSkyBottle()
        bottleTouchPinnedRef.current = false
        bottlePinEnterScrollYRef.current = null
        setBottleTouchPinned(false)
        // Fall through — still run parallax / shore rematch this frame.
      }

      if (stack) {
        const rect = stack.getBoundingClientRect()
        setNavPinned(rect.top < 0 && rect.bottom > 0)
      }

      const painting = compositionRef.current
      const track = walkTrackRef.current
      const walker = humanWalkRef.current
      const reduceWalk = reduceMotionParallaxRef.current
      const walkPx = reduceWalk ? 0 : window.innerHeight * (WALK_TRACK_VH / 100)
      const holdPx =
        reduceWalk || walkPx <= 0
          ? 0
          : window.innerHeight * (WALK_HOLD_VH / 100)
      const freezePx = walkPx + holdPx
      let walkProgress = 0
      /** Scroll through the arrival hold (0–1) — drives the bird steal. */
      let stealProgress = 0
      /** Offset + fade the bottle inherits once the bird has grabbed it. */
      let stealCarryDx = 0
      let stealCarryDy = 0
      let stealCarryFade = 1

      if (painting) {
        const artH = painting.offsetHeight
        const artW = painting.offsetWidth
        const plateH = artW * OVERLAY_PLATE_ASPECT
        const humanOriginY =
          FOREST_BAND_TOP * artH + ((HUMAN.originY + HUMAN.yPct) / 100) * plateH
        const forestPinY = Math.max(
          0,
          humanOriginY - window.innerHeight * HUMAN_PIN_VIEW_Y,
        )
        if (reduceWalk || freezePx <= 0) {
          if (track) {
            track.style.height = ""
            track.style.paddingBottom = "0px"
          }
          painting.style.position = "relative"
          painting.style.top = "0px"
          painting.style.left = ""
          painting.style.width = ""
        } else if (track) {
          track.style.paddingBottom = "0px"
          if (walkReleasedRef.current) {
            // The whole beat ran to completion before unpin — keep it that way,
            // so scrolling back up here is just an ordinary scroll.
            walkProgress = 1
            walkLatchedRef.current = true
            stealProgress = birdStealPRef.current
            track.style.height = `${artH}px`
            painting.style.position = "relative"
            painting.style.top = "0px"
            painting.style.left = ""
            painting.style.width = ""
          } else {
            track.style.height = `${artH + freezePx}px`
            const trackDocTop = track.getBoundingClientRect().top + y
            const pinAt = trackDocTop + forestPinY
            walkProgress = Math.max(
              0,
              Math.min(1, (y - pinAt) / Math.max(1, walkPx)),
            )
            // Tracks the scroll in both directions: backing out of the pin
            // before the beat is spent rewinds the walk, the reveal, and the
            // steal. Only clearing the pin entirely (below) locks it in.
            walkLatchedRef.current = walkProgress >= 0.995
            stealProgress =
              holdPx > 0
                ? clamp01((y - (pinAt + walkPx)) / holdPx)
                : 0
            birdStealPRef.current = stealProgress
            painting.style.left = "0px"
            painting.style.width = "100%"
            if (walkLatchedRef.current && y > pinAt + freezePx) {
              walkReleasedRef.current = true
              window.scrollTo({
                top: y - freezePx,
                left: 0,
                behavior: "instant",
              })
              track.style.height = `${artH}px`
              painting.style.position = "relative"
              painting.style.top = "0px"
              painting.style.left = ""
              painting.style.width = ""
            } else if (y < pinAt) {
              painting.style.position = "absolute"
              painting.style.top = "0px"
            } else if (y <= pinAt + freezePx) {
              painting.style.position = "fixed"
              painting.style.top = `${-forestPinY}px`
            } else {
              painting.style.position = "absolute"
              painting.style.top = `${freezePx}px`
            }
          }
        }
        if (walker) {
          const latched = walkLatchedRef.current
          const p = latched ? 1 : walkProgress
          const paintingLeft = painting.getBoundingClientRect().left
          const startX =
            ((HUMAN.originX + HUMAN.xPct) / 100) * painting.offsetWidth
          const extraXMax =
            window.innerWidth * HUMAN_PIN_VIEW_X - (paintingLeft + startX)
          const extraX = extraXMax * p
          walker.style.transform = extraX
            ? `translate3d(${extraX}px, 0, 0)`
            : ""
          walker.style.willChange =
            !latched && p > 0 && p < 1 ? "transform" : "auto"
          if (humanBobRef.current) {
            humanBobRef.current.dataset.walking =
              !latched && walkProgress > 0.02 && walkProgress < 0.995 ? "1" : ""
          }
          if (forestDatasetRef.current) {
            // Clears as the bang lands so the RNAlab line can take its place.
            const datasetFade = latched
              ? 1 - clamp01(stealProgress / STEAL_DATASET_FADE)
              : walkProgress
            forestDatasetRef.current.style.opacity = reduceWalk
              ? "1"
              : String(datasetFade)
          }
          if (latched !== walkArrivedRef.current) {
            walkArrivedRef.current = latched
            setWalkArrived(latched)
          }
        }

        // Bird steal: swoop from the perch to the parked bottle, then carry it
        // off frame. Both paths are painting-local so they track any art width.
        const stealBird = birdStealRef.current
        if (stealBird && STEAL_BIRD) {
          if (reduceWalk || stealProgress <= 0) {
            stealBird.style.transform = ""
            stealBird.style.opacity = ""
            stealBird.style.willChange = "auto"
          } else {
            const birdX =
              ((STEAL_BIRD.originX + STEAL_BIRD.xPct) / 100) * artW
            const birdY =
              FOREST_BAND_TOP * artH +
              ((STEAL_BIRD.originY + STEAL_BIRD.yPct) / 100) * plateH
            const bottleX = (MAP_BOTTLE_LEFT_REST / 100) * artW
            const bottleY =
              MAP_BOTTLE_BAND_TOP * artH +
              (MAP_BOTTLE_TOP_BUSH / 100) * (MAP_BOTTLE_BAND_HEIGHT * artH)

            const approach = smoothstep(
              clamp01(
                (stealProgress - STEAL_APPROACH_START) /
                  Math.max(1e-6, STEAL_GRAB_AT - STEAL_APPROACH_START),
              ),
            )
            const rawExit = clamp01(
              (stealProgress - STEAL_GRAB_AT) /
                Math.max(1e-6, STEAL_EXIT_END - STEAL_GRAB_AT),
            )
            const exit = smoothstep(rawExit)
            const carryExit = smoothstep(
              clamp01(
                (rawExit - STEAL_CARRY_LAG) /
                  Math.max(1e-6, 1 - STEAL_CARRY_LAG),
              ),
            )
            const exitDx = STEAL_EXIT_DX_FRAC * artW
            const exitDy = STEAL_EXIT_DY_FRAC * artW
            const fadeFor = e =>
              1 -
              clamp01(
                (e - STEAL_FADE_FROM) / Math.max(1e-6, 1 - STEAL_FADE_FROM),
              )
            const fade = fadeFor(exit)

            // Screen-space path: off-frame top-right → bottle → off-frame again.
            const paintRect = painting.getBoundingClientRect()
            const restX = paintRect.left + birdX
            const restY = paintRect.top + birdY
            const entryX = window.innerWidth * STEAL_ENTRY_X_FRAC
            const entryY = window.innerHeight * STEAL_ENTRY_Y_FRAC
            const grabX = paintRect.left + bottleX
            const grabY =
              paintRect.top + bottleY - STEAL_GRAB_LIFT_FRAC * artW

            const dx =
              entryX + (grabX - entryX) * approach - restX + exitDx * exit
            const dy =
              entryY +
              (grabY - entryY) * approach +
              STEAL_ARC_FRAC * artW * Math.sin(Math.PI * approach) -
              restY +
              exitDy * exit

            stealBird.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
            stealBird.style.opacity = String(fade)
            stealBird.style.willChange =
              exit < 1 ? "transform, opacity" : "auto"

            // Bottle rides along only once grabbed, trailing the bird.
            stealCarryDx = exitDx * carryExit
            stealCarryDy = exitDy * carryExit
            stealCarryFade = fadeFor(carryExit)
          }
        }
      }

      const paintingRect = painting ? painting.getBoundingClientRect() : null
      if (painting && paintingRect) {
        const scrolledInto = Math.max(0, -paintingRect.top)
        const offset = reduceMotionParallaxRef.current
          ? 0
          : scrolledInto * (1 - BACK_PARALLAX_SPEED)
        if (parallaxBackRef.current) {
          parallaxBackRef.current.style.transform = `translate3d(0, ${offset}px, 0)`
          parallaxBackRef.current.style.willChange =
            offset > 0 ? "transform" : "auto"
        }
        BIRDS.forEach((bird, i) => {
          const el = birdParallaxRefs.current[i]
          if (!el) return
          const birdOffset = reduceMotionParallaxRef.current
            ? 0
            : scrolledInto * (1 - bird.speed)
          el.style.transform = `translate3d(0, ${birdOffset}px, 0)`
          el.style.willChange = birdOffset > 0 ? "transform" : "auto"
        })
      }

      // Water surface (ripple) viewport position — the "barrier" the bottle sinks behind.
      const water = waterRef.current
      let rippleY = null
      if (water) {
        const wr = water.getBoundingClientRect()
        rippleY = wr.top + wr.height * WATER_RIPPLE_FRAC
      }

      // Clear the sky bottle before the shore (2nd section) overlaps the pinned bottle.
      let shoreApproachOp = 1
      const shoreEl = shoreRef.current
      if (shoreEl) {
        const shoreTop = shoreEl.getBoundingClientRect().top
        const vh = window.innerHeight
        const fadeStart = vh * BOTTLE_SHORE_FADE_START_VH
        const fadeEnd = vh * BOTTLE_SHORE_FADE_END_VH
        shoreApproachOp = Math.max(
          0,
          Math.min(1, (shoreTop - fadeEnd) / Math.max(1, fadeStart - fadeEnd)),
        )
      }

      if (bottleTouchPinnedRef.current) {
        const pin0 = bottlePinEnterScrollYRef.current
        if (pin0 != null && y < pin0 - BOTTLE_PIN_SCROLL_UP_LEAVE) {
          const flip = bottleFlipRef.current
          if (flip) {
            flipUnpinFirstRef.current = flip.getBoundingClientRect()
          } else {
            flipUnpinFirstRef.current = null
          }
          restoreSkyBottle()
          bottleTouchPinnedRef.current = false
          bottlePinEnterScrollYRef.current = null
          setBottleTouchPinned(false)
        } else {
          // Fade from water ripple + shore approach (whichever clears the bottle first).
          if (skyBottleHiddenRef.current) {
            applyBottleSinkVisual(0)
          } else {
            const flip = bottleFlipRef.current
            let rippleOp = 1
            if (flip && rippleY != null) {
              const fr = flip.getBoundingClientRect()
              const topY = fr.top + BOTTLE_SUBMERGE_TOP_FRAC * fr.height
              const botY = fr.top + BOTTLE_SUBMERGE_BOT_FRAC * fr.height
              const span = Math.max(1, botY - topY)
              rippleOp = Math.max(0, Math.min(1, (rippleY - topY) / span))
            }
            const op = Math.min(rippleOp, shoreApproachOp)
            applyBottleSinkVisual(op)
            // Splash after fade is underway, still on the waterfall section.
            if (op < BOTTLE_SPLASH_TRIGGER_OPACITY) {
              triggerBottleSplash()
            }
            if (op < SHORE_BOTTLE_SUNK_OPACITY) {
              hideSkyBottle()
            }
          }
        }
      } else if (bottleSpot) {
        const flip = bottleFlipRef.current
        const br = bottleSpot.getBoundingClientRect()
        const bottleMidY = br.top + br.height / 2
        const viewMidY = window.innerHeight / 2

        if (skyBottleHiddenRef.current) {
          // Stay hidden after sink. Restore only once scrolled back up past the pin zone.
          applyBottleSinkVisual(0)
          if (
            !nearBottom &&
            shoreApproachOp >= 0.98 &&
            (bottleMidY > viewMidY + 24 || y < 64)
          ) {
            restoreSkyBottle()
          }
        } else {
          if (flip && !skyBottleHiddenRef.current) {
            // Idle / pre-pin: fully visible (do not clear a mid-fade if somehow present).
            applyBottleSinkVisual(1)
          }
          if (!nearBottom && bottleMidY <= viewMidY && br.bottom > 32) {
            if (flip) flipPinFirstRef.current = flip.getBoundingClientRect()
            else flipPinFirstRef.current = null
            bottlePinEnterScrollYRef.current = y
            bottleTouchPinnedRef.current = true
            setBottleTouchPinned(true)
          }
        }
      }

      // Shore rematch: trigger a slow autonomous drift once the sky bottle has sunk
      // and the shore is just entering the viewport (earlier than a mid-shore scrub).
      const shore = shoreRef.current
      if (shore) {
        const rect = shore.getBoundingClientRect()
        const vh = window.innerHeight
        if (rect.top > vh * SHORE_BOTTLE_RESET_FRAC) {
          if (shoreBottlePlayedRef.current) {
            shoreBottlePlayedRef.current = false
            setShoreBottlePlaying(false)
          }
        } else if (
          skyBottleHasSunkRef.current &&
          !shoreBottlePlayedRef.current &&
          rect.top < vh * SHORE_BOTTLE_TRIGGER_FRAC
        ) {
          shoreBottlePlayedRef.current = true
          setShoreBottlePlaying(true)
        }
      }

      // Map→forest bottle: enter left → descend → swap/shrink at bird → park at
      // crab/industry during walk-sticky → fall behind bushes after release.
      // Scroll-up reverses the same progress (no latch freeze).
      const mapBand = mapBottleBandRef.current
      const mapMount = mapBottleMountRef.current
      if (mapBand && mapMount) {
        const rect = mapBand.getBoundingClientRect()
        const vh = window.innerHeight
        const span = Math.max(1, rect.height * 0.92)
        let p = Math.max(0, Math.min(1, (vh * 0.5 - rect.top) / span))

        // Until walk sticky releases: cap at the crab/industry hold. The band
        // itself stops advancing once the painting pins, so the walk and the
        // arrival hold drive the rest of the drop — it keeps falling while he
        // walks and settles into the leaves early in the hold. Scrolling back
        // up rewinds the same path.
        if (!walkReleasedRef.current) {
          if (walkProgress > 0.02) {
            if (mapBottleWalkStartPRef.current == null) {
              mapBottleWalkStartPRef.current = Math.min(p, MAP_BOTTLE_HOLD_P)
            }
            const startP = mapBottleWalkStartPRef.current
            // Front-loaded so it falls past the industry line at roughly the
            // pace of the scroll, then eases the last bit into the leaves.
            const walkFall =
              1 -
              Math.pow(
                1 -
                  clamp01(
                    (walkProgress - 0.02) /
                      Math.max(1e-6, MAP_BOTTLE_WALK_FALL_END - 0.02),
                  ),
                2.2,
              )
            const fallT = walkLatchedRef.current
              ? MAP_BOTTLE_WALK_FALL_SHARE +
                (1 - MAP_BOTTLE_WALK_FALL_SHARE) *
                  smoothstep(clamp01(stealProgress / MAP_BOTTLE_SETTLE_END))
              : MAP_BOTTLE_WALK_FALL_SHARE * walkFall
            p = startP + (MAP_BOTTLE_BUSH_P - startP) * fallT
          } else {
            mapBottleWalkStartPRef.current = null
            p = Math.min(p, MAP_BOTTLE_HOLD_P)
          }
        } else {
          mapBottleWalkStartPRef.current = null
        }

        let left = MAP_BOTTLE_LEFT_REST
        if (p < MAP_BOTTLE_ENTER_END) {
          const t = p / MAP_BOTTLE_ENTER_END
          left =
            MAP_BOTTLE_LEFT_ENTER +
            (MAP_BOTTLE_LEFT_REST - MAP_BOTTLE_LEFT_ENTER) * t
        }

        const top =
          MAP_BOTTLE_TOP_START +
          (MAP_BOTTLE_TOP_EXIT - MAP_BOTTLE_TOP_START) * p

        const inForest = top >= MAP_BOTTLE_TOP_SWAP
        if (inForest !== mapBottleInForestRef.current) {
          mapBottleInForestRef.current = inForest
          const img = mapBottleImgRef.current
          if (img) {
            img.src = inForest ? BOTTLE_STAGES.section3 : BOTTLE_STAGES.section2
          }
        }

        let scale = 1
        if (top >= MAP_BOTTLE_TOP_HOLD) {
          scale = MAP_BOTTLE_FOREST_SCALE
        } else if (top > MAP_BOTTLE_TOP_SWAP) {
          const t =
            (top - MAP_BOTTLE_TOP_SWAP) /
            Math.max(1e-6, MAP_BOTTLE_TOP_HOLD - MAP_BOTTLE_TOP_SWAP)
          scale = 1 + (MAP_BOTTLE_FOREST_SCALE - 1) * t
        }

        let opacity = 0
        if (p > 0.01) {
          if (p >= MAP_BOTTLE_FADE_P) {
            opacity = Math.max(
              0,
              1 - (p - MAP_BOTTLE_FADE_P) / Math.max(1e-6, 1 - MAP_BOTTLE_FADE_P),
            )
          } else {
            opacity = 1
          }
        }

        // Carried off by the bird once stolen; fades out with it.
        const carried =
          stealCarryDx !== 0 || stealCarryDy !== 0
            ? ` translate3d(${stealCarryDx}px, ${stealCarryDy}px, 0)`
            : ""
        opacity *= stealCarryFade

        mapMount.style.left = `${left}%`
        mapMount.style.top = `${top}%`
        mapMount.style.transform = `translate3d(-50%, -50%, 0)${carried} scale(${scale})`
        mapMount.style.opacity = String(opacity)
        mapMount.style.visibility = opacity > 0.02 ? "visible" : "hidden"
      }

      // Section4 bottle: barrel-roll in over advisory-lab copy → sticky center →
      // park under “Some applications include…” → hold → tilt + slide down WWTP ramp.
      const creamBottle = creamBottleMountRef.current
      const creamText = creamPadTextRef.current
      const appsLead = section5LeadRef.current
      if (creamBottle && creamText) {
        const vh = window.innerHeight
        const vw = window.innerWidth
        const cream = creamText.getBoundingClientRect()
        const startY = vh * CREAM_BOTTLE_ROLL_START_FRAC
        const endY = vh * CREAM_BOTTLE_ROLL_END_FRAC
        let rollP = (startY - cream.top) / Math.max(1, startY - endY)
        rollP = Math.max(0, Math.min(1, rollP))

        const lead = appsLead ? appsLead.getBoundingClientRect() : null
        const liveParkTop =
          lead != null ? lead.bottom + CREAM_BOTTLE_PARK_GAP_PX : null
        const parkLeft = vw * 0.5
        const baseRotate = CREAM_BOTTLE_ROLLS * 360

        // Once locked under the apps lead, freeze in document space (moves with
        // the WWTP art — no viewport sticky follow) until scroll-back unpark.
        if (creamBottleParkedRef.current) {
          const parkAt = creamBottleParkScrollYRef.current
          if (
            parkAt != null &&
            y < parkAt - vh * CREAM_BOTTLE_UNPARK_VH
          ) {
            creamBottleParkedRef.current = false
            creamBottleParkScrollYRef.current = null
            creamBottleParkDocYRef.current = null
            ramp2StartScrollYRef.current = null
          }
        } else if (
          rollP >= 1 &&
          liveParkTop != null &&
          liveParkTop <= vh * 0.5
        ) {
          creamBottleParkedRef.current = true
          creamBottleParkScrollYRef.current = y
          creamBottleParkDocYRef.current =
            y + liveParkTop + CREAM_BOTTLE_RAMP_Y_NUDGE_PX
        }

        let leftPx
        let topPx
        let rotateDeg = 0
        let opacity = 0
        let transformOrigin = "50% 50%"
        let firstExitP = 0

        if (creamBottleParkedRef.current) {
          if (creamBottleParkScrollYRef.current == null) {
            creamBottleParkScrollYRef.current = y
          }
          if (creamBottleParkDocYRef.current == null && liveParkTop != null) {
            creamBottleParkDocYRef.current =
              y + liveParkTop + CREAM_BOTTLE_RAMP_Y_NUDGE_PX
          }
          // Document-locked anchor → viewport. Stays put on the art as you scroll.
          const anchorTop =
            creamBottleParkDocYRef.current != null
              ? creamBottleParkDocYRef.current - y
              : liveParkTop != null
                ? liveParkTop + CREAM_BOTTLE_RAMP_Y_NUDGE_PX
                : vh * 0.22
          const holdPx = vh * CREAM_BOTTLE_RAMP_HOLD_VH
          const slidePx = Math.max(1, vh * CREAM_BOTTLE_RAMP_SLIDE_VH)
          const past = y - creamBottleParkScrollYRef.current
          firstExitP = Math.max(
            0,
            Math.min(1, (past - holdPx) / slidePx),
          )
          // Smoothstep for slide travel.
          const slideEase = firstExitP * firstExitP * (3 - 2 * firstExitP)
          const tiltP = Math.max(
            0,
            Math.min(
              1,
              firstExitP / Math.max(1e-6, CREAM_BOTTLE_RAMP_TILT_FRAC),
            ),
          )
          const tiltEase = tiltP * tiltP * (3 - 2 * tiltP)

          const slopeRad = (CREAM_BOTTLE_RAMP_SLOPE_DEG * Math.PI) / 180
          const dist =
            slideEase *
            Math.hypot(vw, vh) *
            CREAM_BOTTLE_RAMP_DIST_FRAC
          // Along the ramp: left (+ a little down from slope). Y stays art-locked.
          leftPx = parkLeft - Math.cos(slopeRad) * dist
          topPx = anchorTop + Math.sin(slopeRad) * dist
          rotateDeg = baseRotate + CREAM_BOTTLE_RAMP_TILT_DEG * tiltEase
          opacity =
            firstExitP >= 1
              ? 0
              : firstExitP > 0.88
                ? Math.max(0, 1 - (firstExitP - 0.88) / 0.12)
                : 1
          transformOrigin = "50% 40%"
          creamBottle.style.transform = `translate3d(-50%, 0, 0) rotate(${rotateDeg}deg)`
        } else if (rollP <= 0.001) {
          leftPx = (CREAM_BOTTLE_LEFT_ENTER / 100) * vw
          topPx = Math.min(
            vh * 0.82,
            cream.top + cream.height * CREAM_BOTTLE_ENTER_TEXT_FRAC,
          )
          opacity = 0
          creamBottle.style.transform = `translate3d(-50%, -50%, 0) rotate(0deg)`
        } else if (rollP < 1) {
          const easeP = Math.pow(rollP, CREAM_BOTTLE_CENTER_EASE)
          const leftPct =
            CREAM_BOTTLE_LEFT_ENTER +
            (CREAM_BOTTLE_LEFT_CENTER - CREAM_BOTTLE_LEFT_ENTER) * easeP
          leftPx = (leftPct / 100) * vw
          const fromTop = Math.min(
            vh * 0.82,
            cream.top + cream.height * CREAM_BOTTLE_ENTER_TEXT_FRAC,
          )
          topPx = fromTop + (vh * 0.5 - fromTop) * rollP
          rotateDeg = rollP * baseRotate
          opacity = Math.min(1, rollP / 0.1)
          creamBottle.style.transform = `translate3d(-50%, -50%, 0) rotate(${rotateDeg}deg)`
        } else {
          // Sticky at viewport center — only before the apps-lead lock.
          leftPx = (CREAM_BOTTLE_LEFT_CENTER / 100) * vw
          topPx = vh * 0.5
          rotateDeg = baseRotate
          opacity = 1
          creamBottle.style.transform = `translate3d(-50%, -50%, 0) rotate(${rotateDeg}deg)`
        }

        creamBottle.style.left = `${leftPx}px`
        creamBottle.style.top = `${topPx}px`
        creamBottle.style.opacity = String(opacity)
        creamBottle.style.visibility = opacity > 0.02 ? "visible" : "hidden"
        creamBottle.style.transformOrigin = transformOrigin

        // Ramp-2 bottle: same stage + slope as ramp 1. Arms the frame bottle 1
        // has left the screen; scrolling back rewinds it off the right, then
        // hands off to bottle 1 coming back from the left.
        const ramp2 = ramp2BottleMountRef.current
        const section5 = section5RootRef.current
        if (ramp2 && section5) {
          if (
            creamBottleParkedRef.current &&
            firstExitP >= RAMP2_ARM_AT &&
            ramp2StartScrollYRef.current == null
          ) {
            ramp2StartScrollYRef.current = y
          }

          const ramp2Start = ramp2StartScrollYRef.current
          const ramp2Span = Math.max(1, vh * RAMP2_SLIDE_VH)
          const ramp2P =
            ramp2Start == null ? 0 : (y - ramp2Start) / ramp2Span

          if (ramp2P <= 0 && firstExitP < RAMP2_ARM_AT) {
            ramp2StartScrollYRef.current = null
          }

          if (ramp2Start == null || ramp2P <= 0) {
            ramp2.style.opacity = "0"
            ramp2.style.visibility = "hidden"
          } else {
            const p = Math.max(0, Math.min(1, ramp2P))
            const slideEase = p * p * (3 - 2 * p)
            const tiltP = Math.max(
              0,
              Math.min(
                1,
                p / Math.max(1e-6, CREAM_BOTTLE_RAMP_TILT_FRAC),
              ),
            )
            const tiltEase = tiltP * tiltP * (3 - 2 * tiltP)
            const s5 = section5.getBoundingClientRect()
            const xPct =
              RAMP2_START_X_PCT +
              (RAMP2_END_X_PCT - RAMP2_START_X_PCT) * slideEase
            const yPct =
              RAMP2_START_Y_PCT +
              (RAMP2_END_Y_PCT - RAMP2_START_Y_PCT) * slideEase
            const r2Left = s5.left + (xPct / 100) * s5.width
            const r2Top = s5.top + (yPct / 100) * s5.height
            const r2Rot = CREAM_BOTTLE_RAMP_TILT_DEG * tiltEase
            let r2Op = 1
            if (p <= 0.06) r2Op = p / 0.06
            else if (p >= 0.88)
              r2Op = Math.max(0, 1 - (p - 0.88) / 0.12)

            ramp2.style.left = `${r2Left}px`
            ramp2.style.top = `${r2Top}px`
            ramp2.style.transform = `translate3d(-50%, -50%, 0) rotate(${r2Rot}deg)`
            ramp2.style.opacity = String(r2Op)
            ramp2.style.visibility = r2Op > 0.02 ? "visible" : "hidden"
            ramp2.style.transformOrigin = "50% 40%"
          }
        }
      }
    }

    tick()
    window.addEventListener("scroll", tick, { passive: true })
    window.addEventListener("resize", tick, { passive: true })
    const paintingEl = compositionRef.current
    const section5El = section5RootRef.current
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && (paintingEl || section5El)
        ? new ResizeObserver(() => tick())
        : null
    if (resizeObserver && paintingEl) resizeObserver.observe(paintingEl)
    if (resizeObserver && section5El) resizeObserver.observe(section5El)
    return () => {
      window.removeEventListener("scroll", tick)
      window.removeEventListener("resize", tick)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [
    applyBottleSinkVisual,
    hideSkyBottle,
    restoreSkyBottle,
    triggerBottleSplash,
  ])

  // Reduced-motion path has no CSS animationend — clear the quiet mid-pose after a beat.
  useEffect(() => {
    if (!shoreBottlePlaying || typeof window === "undefined") return undefined
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!reduce) return undefined
    const t = window.setTimeout(() => setShoreBottlePlaying(false), 2200)
    return () => window.clearTimeout(t)
  }, [shoreBottlePlaying])

  useLayoutEffect(() => {
    if (typeof window === "undefined") return
    const el = bottleFlipRef.current
    if (!el) return

    if (flipCleanupRef.current) {
      flipCleanupRef.current()
      flipCleanupRef.current = null
    }

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) {
      el.style.transition = ""
      el.style.transform = ""
      el.style.willChange = ""
      flipUnpinFirstRef.current = null
      flipPinFirstRef.current = null
      return undefined
    }

    const runFlip = (first, ease) => {
      const last = el.getBoundingClientRect()
      const dx = first.left - last.left
      const dy = first.top - last.top

      let raf2 = 0
      let timeoutId = 0

      const clearTimers = () => {
        cancelAnimationFrame(raf2)
        window.clearTimeout(timeoutId)
      }

      const finish = () => {
        el.style.transition = ""
        el.style.transform = ""
        el.style.willChange = ""
        el.removeEventListener("transitionend", onEnd)
      }

      function onEnd(ev) {
        if (ev.propertyName !== "transform") return
        clearTimers()
        finish()
      }

      el.style.willChange = "transform"
      el.style.transition = "none"
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`

      requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          el.style.transition = `transform ${BOTTLE_FLIP_MS}ms ${ease}`
          el.style.transform = "translate3d(0, 0, 0)"
        })
      })

      el.addEventListener("transitionend", onEnd)
      timeoutId = window.setTimeout(() => {
        clearTimers()
        finish()
      }, BOTTLE_FLIP_MS + 120)

      flipCleanupRef.current = () => {
        clearTimers()
        finish()
      }
    }

    if (!bottleTouchPinned && flipUnpinFirstRef.current) {
      const first = flipUnpinFirstRef.current
      flipUnpinFirstRef.current = null
      runFlip(first, "cubic-bezier(0.22, 1, 0.36, 1)")
    } else if (bottleTouchPinned && flipPinFirstRef.current) {
      const first = flipPinFirstRef.current
      flipPinFirstRef.current = null
      runFlip(first, "cubic-bezier(0.34, 1.28, 0.64, 1)")
    }

    return () => {
      if (flipCleanupRef.current) {
        flipCleanupRef.current()
        flipCleanupRef.current = null
      }
    }
  }, [bottleTouchPinned])

  return (
    <WikiFrontRoot>
      <ScrollStack ref={stackRef}>
        <WalkTrack ref={walkTrackRef}>
          <CompositionRoot ref={compositionRef}>
            <BackScene>
              <ParallaxBack ref={parallaxBackRef}>
                <BackRailImg
                  src={ASSETS.back}
                  alt="Wiki front — background scenery"
                />
              </ParallaxBack>
              <BirdsStack aria-hidden="true">
                {BIRDS.map((bird, i) => (
                  <BirdParallax
                    key={bird.id}
                    $z={bird.z ?? (bird.depth === "front" ? 2 : 1)}
                    ref={el => {
                      birdParallaxRefs.current[i] = el
                    }}
                  >
                    <BirdDrift
                      $enabled={bird.depth === "back"}
                      $durationMs={bird.driftMs || 36000}
                      $delayMs={bird.driftDelayMs || 0}
                    >
                      <BirdHoverMotion $delayMs={bird.delayMs}>
                        <BirdFlapper>
                          <BirdFrame
                            $phase="a"
                            $durationMs={bird.flapMs}
                            $delayMs={bird.delayMs}
                            src={bird.a}
                            alt=""
                          />
                          <BirdFrame
                            $phase="b"
                            $durationMs={bird.flapMs}
                            $delayMs={bird.delayMs}
                            src={bird.b}
                            alt=""
                          />
                        </BirdFlapper>
                      </BirdHoverMotion>
                    </BirdDrift>
                  </BirdParallax>
                ))}
              </BirdsStack>
            </BackScene>

            <FlowSizer>
              <RailImg src={ASSETS.front} alt="" />
            </FlowSizer>

            <ArtBand
              ref={waterRef}
              $top={WATERFALL_BAND_TOP}
              $height={WATERFALL_BAND_HEIGHT}
              $z={2}
            >
              <OverlayStack>
                <OverlaySlice $z={Z.text} $interactive>
                  <WaterfallSideText />
                </OverlaySlice>
                <OverlaySlice $z={Z.logo}>
                  <LogoShiftWrap>
                    <LogoFloatWrap>
                      <LogoFlapper aria-label="PETABITE">
                        {LOGO_FRAMES.map((src, i) => (
                          <LogoFrame
                            key={src}
                            src={src}
                            alt={i === 0 ? "PETABITE" : ""}
                            aria-hidden={i !== 0}
                            $index={i}
                          />
                        ))}
                      </LogoFlapper>
                    </LogoFloatWrap>
                  </LogoShiftWrap>
                </OverlaySlice>
                <OverlaySlice $z={Z.bottle}>
                  <BottlePinSpot
                    ref={bottleTouchRef}
                    $touchPinned={bottleTouchPinned}
                  >
                    <BottleFlipSurface ref={bottleFlipRef}>
                      <BottleStickyRock $active={bottleTouchPinned}>
                        <BottleShiftWrap>
                          <BottleSinkMotion ref={bottleSinkMotionRef}>
                            <BottleFloatWrap>
                              <BottleVisual ref={bottleVisualRef}>
                                <RailImg src={ASSETS.bottle} alt="" />
                              </BottleVisual>
                            </BottleFloatWrap>
                          </BottleSinkMotion>
                        </BottleShiftWrap>
                      </BottleStickyRock>
                    </BottleFlipSurface>
                  </BottlePinSpot>
                </OverlaySlice>
                <OverlaySlice $z={Z.water}>
                  <PuddleImg src={ASSETS.water} alt="" />
                  <PuddleImg $under src={ASSETS.water} alt="" />
                </OverlaySlice>
                <OverlaySlice $z={Z.text}>
                  {splashPlaying ? (
                    <WaterfallSplashAnchor
                      key="bottle-splash"
                      aria-hidden="true"
                      onAnimationEnd={e => {
                        if (e.target !== e.currentTarget) return
                        setSplashPlaying(false)
                      }}
                    >
                      <SplashRipple $delay={0} />
                      <SplashRipple $delay={120} $large />
                      <SplashDrop $n={0} />
                      <SplashDrop $n={1} />
                      <SplashDrop $n={2} />
                      <SplashDrop $n={3} />
                      <SplashDrop $n={4} />
                      <SplashDrop $n={5} />
                      <SplashDrop $n={6} />
                      <SplashFoam />
                    </WaterfallSplashAnchor>
                  ) : null}
                </OverlaySlice>
              </OverlayStack>
            </ArtBand>

            <ArtBand
              ref={shoreRef}
              $top={SHORE_BAND_TOP}
              $height={SHORE_BAND_HEIGHT}
              $z={3}
            >
              <ShoreOverlayStack>
                <CrabsStack aria-hidden="true">
                  {CRABS.map(crab => (
                    <CrabMount
                      key={crab.id}
                      $xPct={crab.xPct}
                      $yPct={crab.yPct}
                    >
                      <CrabFlapper>
                        <CrabFrame
                          $phase="a"
                          $durationMs={crab.flapMs}
                          $delayMs={crab.delayMs}
                          src={crab.a}
                          alt=""
                        />
                        <CrabFrame
                          $phase="b"
                          $durationMs={crab.flapMs}
                          $delayMs={crab.delayMs}
                          src={crab.b}
                          alt=""
                        />
                      </CrabFlapper>
                    </CrabMount>
                  ))}
                </CrabsStack>
                <ShoreBottleLayer $z={3}>
                  <ShoreBottleMount
                    $playing={shoreBottlePlaying}
                    onAnimationEnd={e => {
                      if (e.target !== e.currentTarget) return
                      setShoreBottlePlaying(false)
                    }}
                  >
                    <ShoreBottleSize>
                      <ShoreBottleRock $playing={shoreBottlePlaying}>
                        <ShoreBottleImg src={SHORE_BOTTLE_IMG} alt="" />
                      </ShoreBottleRock>
                    </ShoreBottleSize>
                  </ShoreBottleMount>
                </ShoreBottleLayer>
                <ShoreTextLayer $z={4}>
                  <ShorePetaseMount>
                    <ShorePetaseBody>
                      To combat this, we are engineering plastic-degrading
                      enzymes or{" "}
                      <ExplainTerm
                        term="PETases"
                        explanation={PETASE_EXPLANATION}
                      />
                      .
                    </ShorePetaseBody>
                  </ShorePetaseMount>
                  <ShoreTextMount>
                    <ShoreBody>
                      However, PETases currently in industry have a major
                      limitation...
                    </ShoreBody>
                  </ShoreTextMount>
                  <ShoreMidTextMount>
                    <ShoreMidBody>
                      ...the current enzymes only work under…
                    </ShoreMidBody>
                  </ShoreMidTextMount>
                  <ShoreCardsMount>
                    <SwipeInBox stationary title="...3 specific conditions">
                      <ConditionImageRow>
                        {CONDITION_CARD_IMAGES.map(image => (
                          <ConditionFigure key={image.alt}>
                            <ConditionImage src={image.src} alt={image.alt} />
                            <ConditionCaption>{image.alt}</ConditionCaption>
                          </ConditionFigure>
                        ))}
                      </ConditionImageRow>
                    </SwipeInBox>
                  </ShoreCardsMount>
                  <ShoreLoganMount>
                    <ShoreLoganBody>
                      That&apos;s why our team has developed the LOGAN index: a
                      planetary sequence search that discovers novel
                      plastic-degrading enzymes.
                    </ShoreLoganBody>
                  </ShoreLoganMount>
                </ShoreTextLayer>
              </ShoreOverlayStack>
            </ArtBand>

            <ArtBand
              ref={mapBottleBandRef}
              $top={MAP_BOTTLE_BAND_TOP}
              $height={MAP_BOTTLE_BAND_HEIGHT}
              $z={2}
            >
              <MapBottleLayer aria-hidden="true">
                <MapBottleMount ref={mapBottleMountRef}>
                  <MapBottleRock>
                    <MapBottleImg
                      ref={mapBottleImgRef}
                      src={BOTTLE_STAGES.section2}
                      alt=""
                    />
                  </MapBottleRock>
                </MapBottleMount>
              </MapBottleLayer>
            </ArtBand>

            <ArtBand $top={FOREST_BAND_TOP} $height={FOREST_BAND_HEIGHT} $z={3}>
              <ForestAnimalsStack aria-hidden="true">
                {SECTION3_ANIMALS.map(animal => {
                  const plate = animal.static ? (
                    <CrabFlapper>
                      <StaticPlateImg src={animal.src} alt="" />
                    </CrabFlapper>
                  ) : (
                    <AnimalMotion
                      $scale={animal.scale || 1}
                      $ox={animal.originX}
                      $oy={animal.originY}
                      $hover={animal.hover}
                      $delayMs={animal.delayMs}
                      $clipRightPct={animal.clipRightPct || 0}
                    >
                      <CrabFlapper>
                        <CrabFrame
                          $phase="a"
                          $durationMs={animal.flapMs}
                          $delayMs={animal.delayMs}
                          $hoverFlap={animal.hover}
                          src={animal.a}
                          alt=""
                        />
                        <CrabFrame
                          $phase="b"
                          $durationMs={animal.flapMs}
                          $delayMs={animal.delayMs}
                          $hoverFlap={animal.hover}
                          src={animal.b}
                          alt=""
                        />
                      </CrabFlapper>
                    </AnimalMotion>
                  )

                  let body = plate
                  if (animal.revealOnArrive) {
                    body = (
                      <PetamonReveal
                        $show={walkArrived}
                        $delayMs={animal.delayMs}
                      >
                        {plate}
                      </PetamonReveal>
                    )
                  } else if (animal.id === STEAL_BIRD_ID) {
                    body = (
                      <BirdStealMount ref={birdStealRef}>{plate}</BirdStealMount>
                    )
                  }

                  return (
                    <CrabMount
                      key={animal.id}
                      $xPct={animal.xPct}
                      $yPct={animal.yPct}
                    >
                      {body}
                    </CrabMount>
                  )
                })}
              </ForestAnimalsStack>
            </ArtBand>

            <ArtBand
              $top={FOREST_BAND_TOP}
              $height={FOREST_BAND_HEIGHT}
              $z={20}
            >
              <HumanWalkLayer ref={humanWalkRef} aria-hidden="true">
                <HumanBob ref={humanBobRef} $arrived={walkArrived}>
                  <CrabMount $xPct={HUMAN.xPct} $yPct={HUMAN.yPct}>
                    <AnimalMotion
                      $scale={HUMAN.scale}
                      $ox={HUMAN.originX}
                      $oy={HUMAN.originY}
                    >
                      <CrabFlapper>
                        <ExclamationMark
                          $dx={HUMAN_HEAD_X - EXCLAMATION_MARK_X}
                          $dy={HUMAN_HEAD_Y - EXCLAMATION_MARK_Y}
                        >
                          <ExclamationPop $show={walkArrived}>
                            <StaticPlateImg src={EXCLAMATION_SRC} alt="" />
                          </ExclamationPop>
                        </ExclamationMark>
                        <HumanPose $show={!walkArrived}>
                          <StaticPlateImg src={HUMAN.src} alt="" />
                        </HumanPose>
                        <HumanPose $show={walkArrived} $fill>
                          <StaticPlateImg src={HUMAN.srcArrived} alt="" />
                        </HumanPose>
                      </CrabFlapper>
                    </AnimalMotion>
                  </CrabMount>
                </HumanBob>
              </HumanWalkLayer>
            </ArtBand>

            <ArtBand
              $top={FOREST_BAND_TOP}
              $height={FOREST_BAND_HEIGHT}
              $z={21}
            >
              <ForestDatasetMount ref={forestDatasetRef}>
                <ForestDatasetBody>
                  Before, the industry was using an enzyme dataset of roughly
                  200.
                </ForestDatasetBody>
              </ForestDatasetMount>
              <ForestRnalabMount $show={walkArrived}>
                <ForestDatasetBody>
                  With our advisory lab, the{" "}
                  <ExplainTerm
                    term="RNAlab"
                    explanation={RNALAB_EXPLANATION}
                    imageSrc={RNALAB_TEXTBOX_IMG}
                    imageAlt="RNAlab"
                  />
                  , the team uncovered 215.7 million high-quality
                  plastic‑degrading enzymes.
                </ForestDatasetBody>
              </ForestRnalabMount>
            </ArtBand>

            <BushLayer>
              <RailImg src={ASSETS.bush} alt="" />
            </BushLayer>

            <ArtBand $top={CREAM_PAD_TOP} $height={CREAM_PAD_HEIGHT} $z={4}>
              <CreamPadTextMount ref={creamPadTextRef}>
                <CreamPadBody>
                  A 1,000,000‑fold increase from the enzyme landscape previously
                  known.
                </CreamPadBody>
              </CreamPadTextMount>
            </ArtBand>
          </CompositionRoot>
        </WalkTrack>

        <Section5Root ref={section5RootRef}>
          <Section5Sizer>
            <RailImg src={`${SECTION5_CDN}/1-bg.avif`} alt="" />
          </Section5Sizer>
          {SECTION5_LAYERS.filter(layer => !layer.sizer).map(layer => (
            <Section5Layer
              key={layer.id}
              $z={layer.z}
              src={`${SECTION5_CDN}/${layer.file}`}
              alt=""
            />
          ))}
          <Section5FishStack aria-hidden="true">
            {SECTION5_FISHES.map(fish => (
              <Section5FishPlane key={fish.id} $z={fish.z}>
                <BirdDrift
                  $enabled
                  $durationMs={fish.driftMs}
                  $delayMs={fish.driftDelayMs}
                >
                  <Section5FishHover $delayMs={fish.hoverDelayMs}>
                    <RailImg src={fish.src} alt="" />
                  </Section5FishHover>
                </BirdDrift>
              </Section5FishPlane>
            ))}
          </Section5FishStack>
          <Section5AppsBottleLayer aria-hidden="true">
            <Section5AppsBottleMount ref={creamBottleMountRef}>
              <Section5AppsBottleImg
                src={BOTTLE_STAGES.section4}
                alt=""
              />
            </Section5AppsBottleMount>
            <Section5AppsBottleMount ref={ramp2BottleMountRef}>
              <Section5AppsBottleImg
                src={BOTTLE_STAGES.section4}
                alt=""
              />
            </Section5AppsBottleMount>
          </Section5AppsBottleLayer>
          <Section5TextStack aria-hidden="false">
            <Section5Lead ref={section5LeadRef}>
              Some applications include...
            </Section5Lead>
            <Section5WwtpLine>
              PETases in wastewater treatment,...
            </Section5WwtpLine>
            <Section5RecyclingLine>
              ..., Breaking down plastics in trash and recycling bins,...
            </Section5RecyclingLine>
            <Section5AndMoreLine>...and more.</Section5AndMoreLine>
            <Section5Cta>Discover more about Petabite.</Section5Cta>
          </Section5TextStack>
        </Section5Root>

        <HomeNavMount $pinned={navPinned}>
          <WikiTopBar />
        </HomeNavMount>
      </ScrollStack>
    </WikiFrontRoot>
  )
}

export default HomeScrollPrototype

const WikiFrontRoot = styled.div`
  width: 100%;
  min-width: 0;
  background: var(--color-bg);
`

const ScrollStack = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`

/** Absolute at rest; `fixed` while scrolling through mockup so nav stays reachable. */
const HomeNavMount = styled.div`
  position: ${({ $pinned }) => ($pinned ? "fixed" : "absolute")};
  top: 0;
  left: 0;
  right: 0;
  z-index: ${WIKI_TOP_BAR_Z_INDEX};
`

const WalkTrack = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`

const Section5Root = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  overflow: visible;
  background: var(--color-bg);
`

const Section5Sizer = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  pointer-events: none;
`

const Section5Layer = styled.img`
  position: absolute;
  left: 0;
  top: 0;
  z-index: ${({ $z }) => $z};
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  pointer-events: none;
  user-select: none;
`

const Section5FishStack = styled.div`
  position: absolute;
  inset: 0;
  z-index: 9;
  pointer-events: auto;
  overflow: hidden;
`

const Section5FishPlane = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${({ $z }) => $z ?? 5};
  pointer-events: none;
`

const fishHoverBob = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -8px, 0);
  }
`

const fishHoverBobStrong = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -14px, 0);
  }
`

const Section5FishHover = styled.div`
  position: absolute;
  inset: 0;
  animation: ${fishHoverBob} 4.8s ease-in-out infinite;
  animation-delay: ${({ $delayMs }) => `${($delayMs || 0) * 0.5}ms`};

  ${Section5FishStack}:hover & {
    animation-name: ${fishHoverBobStrong};
    animation-duration: 3.2s;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Copy locked to % of the tall section-5 plate (946×4000). Above apps bottle. */
const Section5TextStack = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
`

/**
 * Section4 bottle slot: in front of underwater art, behind apps copy.
 * Mount is `position: fixed` and driven by scroll in the tick handler.
 */
const Section5AppsBottleLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
`

const Section5AppsBottleMount = styled.div`
  position: fixed;
  top: 50%;
  left: 118%;
  width: clamp(3.25rem, 12vw, 9.5rem);
  transform: translate3d(-50%, -50%, 0);
  transform-origin: 50% 50%;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  will-change: left, top, opacity, transform;
  z-index: 8;
`

const Section5AppsBottleImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
`

const Section5Lead = styled.p`
  position: absolute;
  top: 5%;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  width: min(78%, 42rem);
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: clamp(1.35rem, 2.8vw, 2.85rem);
  font-weight: 800;
  line-height: 1.25;
  text-align: center;
  overflow-wrap: break-word;
`

const section5AppLineBase = `
  position: absolute;
  transform: translate3d(-50%, 0, 0);
  width: min(72%, 40rem);
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: clamp(1.35rem, 2.8vw, 2.85rem);
  font-weight: 600;
  line-height: 1.35;
  text-align: center;
  overflow-wrap: break-word;
`

/** WWTP callout — edit top/left here. */
const Section5WwtpLine = styled.p`
  ${section5AppLineBase}
  top: 16%;
  left: 55%;
`

/** Trash / recycling bins callout — edit top/left independently. */
const Section5RecyclingLine = styled.p`
  ${section5AppLineBase}
  top: 33%;
  left: 45%;
`

/** “...and more.” — edit top/left independently. */
const Section5AndMoreLine = styled.p`
  ${section5AppLineBase}
  top: 47%;
  left: 65%;
`

const Section5Cta = styled.p`
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  width: min(86%, 48rem);
  margin: 0;
  color: #fff;
  font-family: var(--font-body);
  font-size: clamp(1.65rem, 3.6vw, 3.6rem);
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: break-word;
  text-shadow:
    0 0 12px rgba(255, 255, 255, 0.85),
    0 0 28px rgba(170, 230, 255, 0.75),
    0 0 48px rgba(90, 190, 255, 0.45),
    0 2px 4px rgba(0, 0, 0, 0.35);
`

const CompositionRoot = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  overflow: hidden;
`

const HumanWalkLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

const humanWalkBob = keyframes`
  0%,
  49.9% {
    transform: translate3d(0, 0, 0);
  }
  50%,
  100% {
    transform: translate3d(0, -12px, 0);
  }
`

const humanArriveJump = keyframes`
  0% {
    transform: translate3d(0, 0, 0);
  }
  32% {
    transform: translate3d(0, -26px, 0);
  }
  52% {
    transform: translate3d(0, 5px, 0);
  }
  72% {
    transform: translate3d(0, -11px, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
`

const HumanBob = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;

  &[data-walking="1"] {
    animation: ${humanWalkBob} 0.4s steps(1, end) infinite;
  }

  ${({ $arrived }) =>
    $arrived &&
    css`
      animation: ${humanArriveJump} 0.64s cubic-bezier(0.22, 1.35, 0.32, 1) 1;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const bangPopIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(-8deg);
  }
  45% {
    opacity: 1;
    transform: scale(1.14) rotate(4deg);
  }
  70% {
    transform: scale(0.94) rotate(-3deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(-2deg);
  }
`

const bangIdleSway = keyframes`
  0%,
  49.9% {
    transform: rotate(-8deg);
  }
  50%,
  100% {
    transform: rotate(8deg);
  }
`

const ExclamationMark = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 1;
  transform: translate3d(
    ${({ $dx }) => $dx || 0}%,
    ${({ $dy }) => $dy || 0}%,
    0
  );
  pointer-events: none;
`

const ExclamationPop = styled.div`
  width: 100%;
  transform-origin: ${EXCLAMATION_MARK_X}% ${EXCLAMATION_MARK_Y}%;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  /* Only bites on the way out — the pop-in keyframes own the entry. */
  transition: opacity 200ms ease;

  ${({ $show }) =>
    $show
      ? css`
          animation:
            ${bangPopIn} 420ms cubic-bezier(0.34, 1.45, 0.64, 1) both,
            ${bangIdleSway} 1.4s steps(1, end) 420ms infinite;
        `
      : css`
          animation: none;
        `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: ${({ $show }) => ($show ? 1 : 0)};
    transform: none;
    transition: none;
  }
`

const HumanPose = styled.div`
  position: ${({ $fill }) => ($fill ? "absolute" : "relative")};
  left: 0;
  top: 0;
  width: 100%;
  z-index: 2;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  pointer-events: none;
`

/** Toronto + birds, height from the back plate — sits in the transparent sky hole. */
const BackScene = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
`

const FlowSizer = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  pointer-events: none;
`

/** Frontmost scenery (bushes). Above Toronto, painting, and animals; below site nav. */
const BushLayer = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 30;
  pointer-events: none;
`

/** Overlay band as a fraction of the unified front canvas. */
const ArtBand = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  top: ${({ $top }) => `${$top * 100}%`};
  height: ${({ $height }) => `${$height * 100}%`};
  z-index: ${({ $z }) => $z};
  pointer-events: none;
  overflow: visible;
`

const CrabsStack = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: visible;
`

const ForestAnimalsStack = styled(CrabsStack)`
  pointer-events: auto;
`

const petamonPopIn = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(0, 16px, 0);
  }
  62% {
    opacity: 1;
    transform: translate3d(0, -5px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`

/** Crabs + axolotls stay off the plate until the walker is surprised. */
const PetamonReveal = styled.div`
  width: 100%;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  /* Only bites on the way out — the pop-in keyframes own the entry. */
  transition: opacity 240ms ease;

  ${({ $show, $delayMs }) =>
    $show &&
    css`
      animation: ${petamonPopIn} 620ms cubic-bezier(0.34, 1.4, 0.64, 1) both;
      animation-delay: ${$delayMs || 0}ms;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
    transition: none;
  }
`

/** Steal-flight transform target for the rightmost bird (driven by scroll). */
const BirdStealMount = styled.div`
  width: 100%;
`

const animalHoverBob = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(var(--animal-scale, 1));
  }
  50% {
    transform: translate3d(0, -10px, 0) scale(var(--animal-scale, 1));
  }
`

const animalHoverBobStrong = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(var(--animal-scale, 1));
  }
  50% {
    transform: translate3d(0, -18px, 0) scale(calc(var(--animal-scale, 1) * 1.08));
  }
`

const AnimalMotion = styled.div`
  width: 100%;
  transform-origin: ${({ $ox, $oy }) =>
    `${$ox != null ? $ox : 50}% ${$oy != null ? $oy : 50}%`};
  --animal-scale: ${({ $scale }) => $scale || 1};
  transform: scale(var(--animal-scale));
  clip-path: ${({ $clipRightPct }) =>
    $clipRightPct > 0 ? `inset(0 ${$clipRightPct}% 0 0)` : "none"};

  ${({ $hover, $delayMs }) =>
    $hover &&
    css`
      animation: ${animalHoverBob} 3.6s ease-in-out infinite;
      animation-delay: ${($delayMs || 0) * 0.5}ms;

      ${ForestAnimalsStack}:hover & {
        animation-name: ${animalHoverBobStrong};
        animation-duration: 2.4s;
      }
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const CrabMount = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  transform: translate3d(
    ${({ $xPct }) => $xPct || 0}%,
    ${({ $yPct }) => $yPct || 0}%,
    0
  );
  pointer-events: none;
`

const CrabFlapper = styled.div`
  position: relative;
  width: 100%;
`

const crabFlapA = keyframes`
  0%,
  49.9% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
`

const crabFlapB = keyframes`
  0%,
  49.9% {
    opacity: 0;
  }
  50%,
  100% {
    opacity: 1;
  }
`

const CrabFrame = styled.img`
  position: absolute;
  left: 0;
  top: 0;
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
  opacity: ${({ $phase }) => ($phase === "a" ? 1 : 0)};
  animation-name: ${({ $phase }) => ($phase === "a" ? crabFlapA : crabFlapB)};
  animation-duration: ${({ $durationMs }) => `${$durationMs || 720}ms`};
  animation-delay: ${({ $delayMs }) => `${$delayMs || 0}ms`};
  animation-timing-function: steps(1, end);
  animation-iteration-count: infinite;

  &:first-child {
    position: relative;
  }

  ${({ $hoverFlap, $durationMs }) =>
    $hoverFlap &&
    css`
      ${ForestAnimalsStack}:hover & {
        animation-duration: ${Math.round(($durationMs || 720) * 0.72)}ms;
      }
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: ${({ $phase }) => ($phase === "a" ? 1 : 0)};
  }
`

const StaticPlateImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
`

const ShoreOverlayStack = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
`

const ShoreTextLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${({ $z }) => $z};
  pointer-events: none;
`

/** Rematched section1 bottle: autonomous slow drift along the river, under shore copy. */
const ShoreBottleLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${({ $z }) => $z};
  pointer-events: none;
  overflow: hidden;
`

/**
 * Path: appear high on the right early, drift mostly downward for a long stretch,
 * then sweep left to exit near the end.
 * Linear timing so it does not ease/idle at each waypoint.
 */
const shoreBottleDrift = keyframes`
  0% {
    left: 104%;
    top: 10%;
    opacity: 0;
  }
  4% {
    left: 102%;
    top: 14%;
    opacity: 1;
  }
  45% {
    left: 96%;
    top: 42%;
    opacity: 1;
  }
  68% {
    left: 90%;
    top: 64%;
    opacity: 1;
  }
  82% {
    left: 58%;
    top: 74%;
    opacity: 1;
  }
  100% {
    left: -16%;
    top: 82%;
    opacity: 1;
  }
`

const ShoreBottleMount = styled.div`
  position: absolute;
  left: 104%;
  top: 10%;
  /* Same desktop max as the sky bottle; shrink with the window below ~1440px. */
  width: min(12rem, 13.3vw);
  max-width: 18%;
  transform: translate3d(-50%, -55%, 0);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  ${({ $playing }) =>
    $playing
      ? css`
          visibility: visible;
          animation: ${shoreBottleDrift} ${SHORE_BOTTLE_DRIFT_MS}ms linear
            forwards;
        `
      : css`
          animation: none;
        `}

  @media (prefers-reduced-motion: reduce) {
    ${({ $playing }) =>
      $playing
        ? css`
            /* Keep a quiet mid-path pose; no long drift. */
            visibility: visible;
            animation: none;
            left: 92%;
            top: 48%;
            opacity: 0.9;
          `
        : css`
            animation: none;
          `}
  }
`

/** Match sky bottle display size (width set on mount vs shore box). */
const ShoreBottleSize = styled.div`
  width: 100%;
`

const shoreBottleRock = keyframes`
  0%,
  100% {
    transform: rotate(-5deg) translate3d(0, 0, 0);
  }
  50% {
    transform: rotate(5deg) translate3d(0, -4px, 0);
  }
`

const ShoreBottleRock = styled.div`
  width: 100%;
  transform-origin: 50% 70%;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.28));

  ${({ $playing }) =>
    $playing
      ? css`
          animation: ${shoreBottleRock} 2.4s ease-in-out infinite;
        `
      : css`
          animation: none;
        `}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`

const ShoreBottleImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
`

/** Scroll-scrubbed bottle: behind forest animals (z:2), under bushes (z:30). */
const MapBottleLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
`

const MapBottleMount = styled.div`
  position: absolute;
  top: ${MAP_BOTTLE_TOP_START}%;
  left: ${MAP_BOTTLE_LEFT_ENTER}%;
  width: 22%;
  max-width: 11rem;
  transform: translate3d(-50%, -50%, 0) scale(1);
  transform-origin: 50% 50%;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  will-change: left, top, opacity, transform;
`

const mapBottleRock = keyframes`
  0%,
  100% {
    transform: rotate(-4deg) translate3d(0, 0, 0);
  }
  50% {
    transform: rotate(4deg) translate3d(0, -3px, 0);
  }
`

const MapBottleRock = styled.div`
  width: 100%;
  transform-origin: 50% 70%;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.28));
  animation: ${mapBottleRock} 2.2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const MapBottleImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
`

/** Centered PETases line where the condition cards used to sit (top of shore). */
const ShorePetaseMount = styled.div`
  position: absolute;
  top: -16%;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  width: min(72%, 48rem);
  max-width: calc(100% - 10%);
  box-sizing: border-box;
  pointer-events: auto;
  text-align: center;

  @media (max-width: 720px) {
    top: -20%;
    width: min(86%, 92vw);
  }
`

const ShorePetaseBody = styled.p`
  margin: 0;
  color: #fff;
  font-family: var(--font-body);
  font-size: clamp(1.25rem, 2.5vw, 2.55rem);
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: break-word;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 0 14px rgba(0, 0, 0, 0.35);
`

/** Sits on the sand bank (left/center of the shore art). */
const ShoreTextMount = styled.div`
  position: absolute;
  top: 14%;
  left: max(env(safe-area-inset-left, 0px), 5%);
  width: min(38%, 28rem);
  max-width: calc(100% - 14%);
  box-sizing: border-box;
  pointer-events: none;

  @media (max-width: 720px) {
    top: 12%;
    left: max(env(safe-area-inset-left, 0px), 4%);
    width: min(46%, 44vw);
  }
`

const ShoreBody = styled.p`
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: clamp(1.15rem, 2.2vw, 2.3rem);
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: break-word;
`

/** Short line on the right, along the bottle’s downward path (between LOGAN and RNAlab). */
const ShoreMidTextMount = styled.div`
  position: absolute;
  top: 42%;
  right: max(env(safe-area-inset-right, 0px), 5%);
  left: auto;
  width: min(36%, 28rem);
  box-sizing: border-box;
  pointer-events: none;
  text-align: center;

  @media (max-width: 720px) {
    top: 40%;
    width: min(44%, 42vw);
    right: max(env(safe-area-inset-right, 0px), 4%);
  }
`

const ShoreMidBody = styled.p`
  margin: 0;
  color: #fff;
  font-family: var(--font-body);
  font-size: clamp(1.2rem, 2.3vw, 2.4rem);
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: break-word;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 0 14px rgba(0, 0, 0, 0.35);
`

/** Condition cards + “...3 specific conditions” on the lower sand. */
const ShoreCardsMount = styled.div`
  pointer-events: none;

  /* SwipeInBox AnchoredStage defaults to top: -16% (old card slot). */
  & > div {
    top: 70%;
  }

  /* Track the shore/art width. 1100px is the current full-desktop size. */
  & > div > div {
    width: min(76.4%, 1100px);
    box-sizing: border-box;
    padding: clamp(0.4rem, 1.4vw, 1.25rem) clamp(0.45rem, 2vw, 1.75rem);
  }

  & h3 {
    font-size: clamp(0.95rem, 2.4vw, 2.35rem);
  }

  @media (max-width: 720px) {
    & > div {
      top: 67%;
    }
  }
`

/** Centered LOGAN line just above the world map. */
const ShoreLoganMount = styled.div`
  position: absolute;
  top: auto;
  bottom: -14%;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  width: min(70%, 46rem);
  max-width: calc(100% - 10%);
  box-sizing: border-box;
  pointer-events: none;
  text-align: center;

  @media (max-width: 720px) {
    bottom: -11%;
    width: min(84%, 92vw);
  }
`

const ShoreLoganBody = styled.p`
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: clamp(1.15rem, 2.2vw, 2.3rem);
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: break-word;
`

/** Dataset line left of the walker; opacity driven by walk progress. */
const ForestDatasetMount = styled.div`
  position: absolute;
  top: 66%;
  left: max(env(safe-area-inset-left, 0px), 8%);
  width: min(22%, 16.5rem);
  max-width: calc(42% - 8%);
  box-sizing: border-box;
  pointer-events: none;
  text-align: left;
  opacity: 0;

  @media (max-width: 720px) {
    top: 63%;
    left: max(env(safe-area-inset-left, 0px), 6%);
    width: min(32%, 30vw);
  }
`

const ForestDatasetBody = styled.p`
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: clamp(1.15rem, 2.2vw, 2.3rem);
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: break-word;
`

/** RNAlab payoff on the walker's right; swaps in when the bang pops. */
const ForestRnalabMount = styled.div`
  position: absolute;
  top: 66%;
  right: max(env(safe-area-inset-right, 0px), 9%);
  width: min(36%, 30rem);
  box-sizing: border-box;
  text-align: left;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transform: translate3d(${({ $show }) => ($show ? "0" : "20px")}, 0, 0);
  transition:
    opacity 520ms ease 180ms,
    transform 560ms cubic-bezier(0.22, 1.2, 0.36, 1) 180ms;
  pointer-events: ${({ $show }) => ($show ? "auto" : "none")};

  @media (max-width: 720px) {
    top: 64%;
    width: min(44%, 42vw);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

/** RNAlab copy on the cream pad below the bushes. */
const CreamPadTextMount = styled.div`
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  width: min(72%, 48rem);
  max-width: calc(100% - 10%);
  box-sizing: border-box;
  pointer-events: auto;
  text-align: center;
`

const CreamPadBody = styled.p`
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-body);
  font-size: clamp(1.15rem, 2.2vw, 2.3rem);
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: break-word;
`

const ConditionImageRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.35rem, 2.4vw, 1.75rem);
  margin-top: clamp(0.45rem, 2.2vw, 1.75rem);
  align-items: start;
`

const ConditionFigure = styled.figure`
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.3rem, 0.8vw, 0.55rem);
  min-width: 0;
`

const ConditionImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  /* Desktop max stays 24rem; shrink with the window below ~1440px. */
  max-height: min(24rem, 26.7vw);
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
`

const ConditionCaption = styled.figcaption`
  margin: 0;
  color: #fff;
  font-family: var(--font-body);
  font-size: clamp(0.65rem, 2.2vw, 1.85rem);
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 0 12px rgba(0, 0, 0, 0.35);
`

const RailImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
`

const ParallaxBack = styled.div`
  width: 100%;
  will-change: auto;

  @media (prefers-reduced-motion: reduce) {
    transform: none !important;
    will-change: auto;
  }
`

const BackRailImg = styled(RailImg)`
  transform: scale(1.04);
  transform-origin: center top;
`

const BirdsStack = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: auto;
  overflow: hidden;
`

const BirdParallax = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${({ $z }) => $z ?? 1};
  will-change: auto;
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    transform: none !important;
    will-change: auto;
  }
`

const birdFlapA = keyframes`
  0%,
  49.9% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
`

const birdFlapB = keyframes`
  0%,
  49.9% {
    opacity: 0;
  }
  50%,
  100% {
    opacity: 1;
  }
`

const birdHoverBob = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -10px, 0);
  }
`

const birdHoverBobStrong = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, -18px, 0) scale(1.02);
  }
`

const birdFlyAcross = keyframes`
  0%,
  18% {
    transform: translate3d(0, 0, 0);
  }
  72% {
    transform: translate3d(-115%, 0, 0);
  }
  72.01% {
    transform: translate3d(115%, 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
`

const BirdDrift = styled.div`
  position: absolute;
  inset: 0;

  ${({ $enabled, $durationMs, $delayMs }) =>
    $enabled &&
    css`
      animation: ${birdFlyAcross} ${$durationMs || 36000}ms linear infinite;
      animation-delay: ${$delayMs || 0}ms;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const BirdHoverMotion = styled.div`
  position: absolute;
  inset: 0;
  transform-origin: center center;
  animation: ${birdHoverBob} 3.6s ease-in-out infinite;
  animation-delay: ${({ $delayMs }) => `${($delayMs || 0) * 0.5}ms`};

  ${BirdsStack}:hover & {
    animation-name: ${birdHoverBobStrong};
    animation-duration: 2.4s;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const BirdFlapper = styled.div`
  position: absolute;
  inset: 0;
`

const BirdFrame = styled.img`
  position: absolute;
  left: 0;
  top: 0;
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
  opacity: ${({ $phase }) => ($phase === "a" ? 1 : 0)};
  animation-name: ${({ $phase }) => ($phase === "a" ? birdFlapA : birdFlapB)};
  animation-duration: ${({ $durationMs }) => `${$durationMs || 520}ms`};
  animation-delay: ${({ $delayMs }) => `${$delayMs || 0}ms`};
  animation-timing-function: steps(1, end);
  animation-iteration-count: infinite;

  ${BirdsStack}:hover & {
    animation-duration: ${({ $durationMs }) =>
      `${Math.round(($durationMs || 520) * 0.72)}ms`};
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: ${({ $phase }) => ($phase === "a" ? 1 : 0)};
  }
`

const OverlayStack = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
`

const OverlaySlice = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${({ $z }) => $z};
  display: flex;
  align-items: flex-start;
  justify-content: center;
  pointer-events: ${({ $interactive }) => ($interactive ? "auto" : "none")};
  overflow: visible;
`

/** Legacy water plate, shifted so the puddle blob covers the waterfall basin. */
const PuddleImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  transform: translateY(
    ${({ $under }) =>
      PUDDLE_SHIFT_Y_PCT + ($under ? PUDDLE_UNDER_SHIFT_PCT : 0)}%
  );
  user-select: none;
  pointer-events: none;
`

/** Nudge PETABITE title up within the legacy art band (negative = higher). */
const LOGO_SHIFT_FRAC = -0.38

const logoIdleFloat = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -7px, 0);
  }
`

const bottleIdleFloat = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -5px, 0);
  }
`

/** Very slow, subtle sway only while the bottle is in touch "sticky" (fixed) mode. */
const bottleStickyRock = keyframes`
  0%,
  100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(10deg);
  }
`

/** Subtle idle rotation while bottle is pinned (fixed); off during normal scroll. */
const BottleStickyRock = styled.div`
  width: 100%;
  transform-origin: 50% 42%;

  ${({ $active }) =>
    $active
      ? css`
          animation: ${bottleStickyRock} 2s ease-in-out infinite;
        `
      : css`
          animation: none;
        `}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`

const LogoShiftWrap = styled.div`
  width: 100%;
  height: 100%;
  transform: translate3d(0, ${LOGO_SHIFT_FRAC * 100}%, 0);
`

const LogoFloatWrap = styled.div`
  width: 100%;
  animation: ${logoIdleFloat} 4.2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Stacked frames; first image stays in-flow so the rail keeps its height. */
const LogoFlapper = styled.div`
  position: relative;
  width: 100%;
`

const LogoFrame = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
  opacity: 0;
  animation-name: ${({ $index }) =>
    LOGO_FRAME_KEYFRAMES[$index] || LOGO_FRAME_KEYFRAMES[0]};
  animation-duration: ${LOGO_FRAME_TIMING.cycleMs}ms;
  animation-timing-function: steps(1, end);
  animation-iteration-count: infinite;

  ${({ $index }) =>
    $index > 0 &&
    css`
      position: absolute;
      left: 0;
      top: 0;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: ${({ $index }) => ($index === 0 ? 1 : 0)};
  }
`

/** Owns FLIP `transform` so parent pin spot can stay `position: fixed` without fighting this layer. */
const BottleFlipSurface = styled.div`
  width: 100%;
`

/** Scroll-driven sink slide (separate from FLIP transform on BottleFlipSurface). */
const BottleSinkMotion = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  will-change: transform;
`

/** Scroll touch: pins bottle to viewport center while stack scrolls; releases near page bottom. */
const BottlePinSpot = styled.div`
  width: 100%;
  pointer-events: none;

  ${({ $touchPinned }) =>
    $touchPinned
      ? css`
          position: fixed;
          left: 0;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 95;
        `
      : css`
          position: absolute;
          left: 0;
          right: 0;
          top: ${BOTTLE_TOP_FRAC * 100}%;
        `}
`

/** Centers the bottle; inner wrap adds idle float. */
const BottleShiftWrap = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`

const BottleFloatWrap = styled.div`
  position: relative;
  /* Desktop stays ~12rem; shrinks with the painting below ~1440px. */
  width: min(12rem, 13.3vw);
  max-width: 18%;
  animation: ${bottleIdleFloat} 1.5s ease-in-out infinite;
  animation-delay: -0.7s;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Opacity target for the sky bottle image (splash stays as a sibling so it can play). */
const BottleVisual = styled.div`
  width: 100%;
  will-change: opacity;
`

const splashBurst = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.55);
  }
  18% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.05);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.2);
  }
`

const splashRipple = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(0.2);
    opacity: 0.95;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.85);
    opacity: 0;
  }
`

const splashDrop = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(0.55);
    opacity: 1;
  }
  40% {
    opacity: 0.95;
  }
  100% {
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.2);
    opacity: 0;
  }
`

const splashFoam = keyframes`
  0% {
    transform: translate(-50%, -40%) scale(0.4);
    opacity: 0;
  }
  20% {
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -70%) scale(1.35);
    opacity: 0;
  }
`

/** Splash anchored on the first art band at the river / puddle start. */
const WaterfallSplashAnchor = styled.div`
  position: absolute;
  left: ${WATERFALL_SPLASH_LEFT_PCT}%;
  top: ${WATERFALL_SPLASH_TOP_PCT}%;
  z-index: 6;
  width: min(28vw, 14rem);
  height: min(16vw, 8rem);
  transform: translate(-50%, -50%);
  pointer-events: none;
  overflow: visible;
  animation: ${splashBurst} ${BOTTLE_SPLASH_MS}ms ease-out forwards;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`

const SplashRipple = styled.span`
  position: absolute;
  left: 50%;
  top: 58%;
  width: ${({ $large }) => ($large ? "95%" : "70%")};
  aspect-ratio: 2.2 / 1;
  border: ${({ $large }) => ($large ? "3px" : "2.5px")} solid
    rgba(230, 248, 255, ${({ $large }) => ($large ? 0.55 : 0.95)});
  border-radius: 50%;
  box-shadow:
    0 0 18px rgba(190, 230, 255, 0.65),
    inset 0 0 12px rgba(255, 255, 255, 0.35);
  animation: ${splashRipple} ${BOTTLE_SPLASH_MS}ms ease-out forwards;
  animation-delay: ${({ $delay }) => `${$delay || 0}ms`};
`

const SPLASH_DROP_OFFSETS = [
  { dx: "-28px", dy: "-42px" },
  { dx: "24px", dy: "-46px" },
  { dx: "-42px", dy: "-14px" },
  { dx: "40px", dy: "-12px" },
  { dx: "0px", dy: "-54px" },
  { dx: "-16px", dy: "-30px" },
  { dx: "18px", dy: "-28px" },
]

const SplashDrop = styled.span`
  position: absolute;
  left: 50%;
  top: 52%;
  width: 14px;
  height: 20px;
  border-radius: 50% 50% 45% 45%;
  background: radial-gradient(
    circle at 35% 30%,
    #ffffff 0%,
    #b7e6f8 50%,
    #4a9fc4 100%
  );
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
  --dx: ${({ $n }) => SPLASH_DROP_OFFSETS[$n]?.dx || "0px"};
  --dy: ${({ $n }) => SPLASH_DROP_OFFSETS[$n]?.dy || "-36px"};
  animation: ${splashDrop} ${BOTTLE_SPLASH_MS}ms ease-out forwards;
  animation-delay: ${({ $n }) => `${($n || 0) * 30}ms`};
`

const SplashFoam = styled.span`
  position: absolute;
  left: 50%;
  top: 55%;
  width: 78%;
  height: 42%;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(180, 225, 245, 0.55) 42%,
    rgba(120, 190, 220, 0) 72%
  );
  filter: blur(1px);
  animation: ${splashFoam} ${BOTTLE_SPLASH_MS}ms ease-out forwards;
`
