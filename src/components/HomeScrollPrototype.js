import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import styled, { css, keyframes } from "styled-components"
import { Link, withPrefix } from "gatsby"
import { WikiTopBar, WIKI_TOP_BAR_Z_INDEX } from "./WikiTopBar.js"
import { WaterfallSideText, PETASE_EXPLANATION } from "./WaterfallSideText.js"
import { SwipeInBox } from "./SwipeInBox.js"
import { ExplainTerm } from "./ExplainTermPopover.js"
import { HomePlaza, PetamonProvider, usePetamonsMet } from "./HomePlaza.js"
import EndingPetamonBottle from "./EndingPetamonBottle.js"
import { LoopTarget, PetamonAct, TreeHide } from "./petamonHovers.js"
import { HomeAutoplay } from "./HomeAutoplay.js"
import { HomeEcosystemMap } from "./HomeEcosystemMap.js"
import { LabConstellation, WindowSky } from "./LabConstellation.js"
import { LabBench, WET_TIP, wetStage } from "./LabBench.js"
import {
  ART_REF_W,
  ART_WIDTH_VAR,
  artFont,
  artPx,
  phone,
  PHONE_MAX,
  phoneSize,
} from "./artScale.js"
import { LOGO_BOX, LOGO_FRAMES, LOGO_PLATE, LogoFrame } from "./logoFrames.js"
import { PlateImg } from "./PlateImg.js"
import { SiteLoader } from "./SiteLoader.js"

/**
 * Homepage bottle stages (degradation journey). The bottle stays at `sky`
 * (stage 0) through the waterfall, map and forest, then degrades one stage
 * at a time through the later sections:
 *   cream roll-in   sky → section1
 *   ramp 1          section2 → section3 (as it tilts and slides)
 *   ramp 2          section4
 *   chute           section5 → section6 at the fish (bubbles, most degraded)
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
  section6:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section6.avif",
}

/** Stages in order, least → most degraded. */
const BOTTLE_STAGE_ORDER = [
  BOTTLE_STAGES.sky,
  BOTTLE_STAGES.section1,
  BOTTLE_STAGES.section2,
  BOTTLE_STAGES.section3,
  BOTTLE_STAGES.section4,
  BOTTLE_STAGES.section5,
  BOTTLE_STAGES.section6,
]

/**
 * The top of the homepage, sharper for big screens: the front plate's rows
 * 310–1400 (plaza, waterfall) cut from the original 1440 px painting, and the
 * back's rows 0–420 (sky and skyline, all that shows through the sky hole)
 * upscaled 3×. Drawn over the usual art from 520px wide up; phones keep the
 * lighter art. Until they're uploaded, the usual art just shows through.
 */
const HQ_TOP = {
  front: {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/front-top-orig.avif",
    rows: [310, 1400],
  },
  back: {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/back-top-hq.avif",
    rows: [0, 420],
  },
}

const ASSETS = {
  /** Toronto sky + skyline, on the same 563×4000 canvas as the front. */
  back: "https://static.igem.wiki/teams/6187/wiki/homepage-components/wiki-front-page-back-new.avif",
  /** Unified front plate: plaza + waterfall + river + map + forest. */
  front:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/wiki-front-page-top-new.avif",
  /** Turtle petamon on the front canvas (left edge, under the waterfall). */
  turtle:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/turtle.avif",
  /**
   * The same turtle upscaled 4× (Real-ESRGAN anime), cut to TURTLE_HQ_CROP:
   * sharp at his size on screen. Until it's uploaded, the plate's shows.
   */
  turtleHq:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/turtle-hq.avif",
  /** Foreground bushes — highest scenery layer (same 563×4000 canvas as front). */
  bush: "https://static.igem.wiki/teams/6187/wiki/homepage-components/wiki-front-page-bush.avif",
  /** Waterfall / sky section bottle (current homepage stage). */
  bottle: BOTTLE_STAGES.sky,
  /** Opaque puddle lip — sits over the bottle so it can tuck behind the water. */
  water:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/wiki-front-water.avif",
}

/**
 * Unified front canvas (CDN `wiki-front-page-top-new.avif`).
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
const FRONT_ART_WIDTH = 563
/**
 * The back only needs to show through the sky hole. Clip it to the old back's
 * footprint (1440×3239, width-relative) so birds keep the same clip and the
 * new full-height back never shows through the transparent pad below the
 * forest as the parallax drags it down.
 */
const BACK_CLIP_ASPECT = "1440 / 3239"
/** Painted turtle box on the front canvas (px), padded. */
const TURTLE_CROP = { x: 0, y: 1124, w: 130, h: 100 }
/** The front canvas box (px) ASSETS.turtleHq covers. */
const TURTLE_HQ_CROP = { x: 0, y: 1126, w: 132, h: 110 }
/** Turtle size relative to how he's painted. */
const TURTLE_SCALE = 0.8
/**
 * Surfaced pose, left of the painted crop. The lightning shiver reaches
 * about 7% right (plus a small rotation), so this tuck keeps the cut edge
 * of the shell under the bank at the rightmost point of that shake.
 */
const TURTLE_REST_X = "-22%"
/** Turtle surfaces once his spot rises above this share of the view height. */
const TURTLE_SURFACE_VIEW_Y = 0.8
const WATERFALL_BAND_TOP = 395 / FRONT_ART_HEIGHT
const WATERFALL_BAND_BOT = 1380 / FRONT_ART_HEIGHT
const SHORE_BAND_BOT = 2440 / FRONT_ART_HEIGHT
const WATERFALL_BAND_HEIGHT = WATERFALL_BAND_BOT - WATERFALL_BAND_TOP
const SHORE_BAND_TOP = WATERFALL_BAND_BOT
const SHORE_BAND_HEIGHT = SHORE_BAND_BOT - SHORE_BAND_TOP
/**
 * Painted continents in the front plate (under LOGAN copy).
 * The 2440–2900 comment is the whole map scene (cream + land + forest lip);
 * tan land is ~2644–2834. Overlay matches that box so Mercator outlines
 * can fill the painted continents instead of sitting in a squashed band.
 */
const WORLD_MAP_TOP = 2644 / FRONT_ART_HEIGHT
const WORLD_MAP_HEIGHT = (2834 - 2644) / FRONT_ART_HEIGHT
/** Under the world map, through the forest / just above the bushes. */
const FOREST_BAND_TOP = 2660 / FRONT_ART_HEIGHT
const FOREST_BAND_BOT = 3503 / FRONT_ART_HEIGHT
const FOREST_BAND_HEIGHT = FOREST_BAND_BOT - FOREST_BAND_TOP

/**
 * Section 4, the lab: a 1004×4000 plate between the forest and the WWTP. Its
 * row 0 sits on front-plate row 3422.3, so it covers the old cream pad and its
 * top tucks under the jungle's bush fringe, which is redrawn over it.
 */
const SECTION4_PLATE = { w: 1004, h: 4000 }
const SECTION4_FRONT_ROW = 3422.3
/** Front-plate row where the bush fringe ends. */
const SECTION4_FRINGE_END_ROW = 3522
const SECTION4_ASSETS = {
  bg: "https://static.igem.wiki/teams/6187/wiki/homepage-components/section-4-bg.avif",
  umap: "https://static.igem.wiki/teams/6187/wiki/homepage-components/umap-data.avif",
  sand: "https://static.igem.wiki/teams/6187/wiki/homepage-components/sand.avif",
  enzyme:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/enzyme-replacing-bottle.avif",
  /**
   * The enzyme alone, 4× its painted size and sharpened, for when it's shown
   * big (LAB_ENZYME_BIG); the plate's copy shows until it has loaded.
   */
  enzymeHq:
    "https://static.igem.wiki/teams/6187/wiki/homepage-components/enzyme-hq.avif",
}
/** Section-4 row the "1,000,000-fold" line centres on: above the UMAP screen. */
const SECTION4_TEXT_ROW = 255
/**
 * The enzyme's painted box on the plate it's cut from (%): its size, and
 * its place across the lab. It fades in where the constellation shrinks into
 * it (the second of SECTION4_HOLD_ROWS), follows the reader (held at
 * ENZYME_FOLLOW_VIEW_Y), then fades out just before the bottle rolls in,
 * wearing it.
 */
const SECTION4_ENZYME_CROP = {
  x: (441 / 1004) * 100,
  y: (1233 / 4000) * 100,
  w: (109 / 1004) * 100,
  h: (125 / 4000) * 100,
}
/** Its painted size (px), for the cut-out's shape. */
const SECTION4_ENZYME_PX = { w: 109, h: 125 }
/** The window on the lab wall (the PETadex's night sky), on the lab plate. */
const SECTION4_WINDOW = [115, 313, 882, 868]
/**
 * The Dry Lab story, played through two holds where the lab stops scrolling
 * (like the forest walk) while it plays (LabConstellation):
 * 1. With the window filling the screen (row SECTION4_HOLD_ROWS[0] at its
 *    middle) for LAB_HOLD_VH[0] of scrolling: stars are picked off the
 *    clusters and drawn into constellations as the first lines come in.
 * 2. The big blue cluster's constellation comes off the window and rides down
 *    with the reader to row SECTION4_HOLD_ROWS[1], held for LAB_HOLD_VH[1]:
 *    it assembles into the enzyme as the last lines come in, and the enzyme
 *    follows the reader from there, before the first lab bench.
 * Phones hold the lab in one place for both (SECTION4_PHONE_HOLD_ROW): under
 * the window the lines take turns in one spot (SECTION4_PHONE_STORY_ROW), the
 * second hold's on the left, and the constellation rides down to their right,
 * where it assembles (SECTION4_PHONE_PROTEIN_ROW).
 */
const SECTION4_HOLD_ROWS = { at: [590, 1200] }
/** Phones: the row held at the middle, centring the window and what's under it. */
const SECTION4_PHONE_HOLD_ROW = 886
/** Phones: the story lines' one spot (their top) and the protein's middle, right of it. */
const SECTION4_PHONE_STORY_ROW = 1105
const SECTION4_PHONE_PROTEIN_ROW = 1200
/**
 * The first hold centres the window under the site header (about this
 * tall), not the screen, so its top isn't tucked under the header.
 */
const LAB_HEADER_HALF = "2.3rem"
/**
 * Screens too short for the whole window (laptops, landscape tablets) pan
 * it instead: its top under the header for the first lines, then down to
 * its bottom over this share of the first hold, before the last line
 * (`--lab-pan`). The window keeps this gap (px) from the header and the
 * screen's foot.
 */
const LAB_PAN = [0.44, 0.64]
const LAB_PAN_MARGIN = 10
/**
 * How many times the enzyme's size the constellation grows to on its way
 * down and assembles at, beside the second hold's lines; the enzyme takes
 * over at that size and shrinks back over LAB_ENZYME_SHRINK_VH of scrolling
 * after the hold.
 */
const LAB_ENZYME_BIG = { at: 1.9, phone: 1.5 }
const LAB_ENZYME_SHRINK_VH = 0.6
const LAB_HOLD_VH = [180, 160, 200, 180]
/**
 * Then two more holds (LabBench): the Wet Lab shelf, where the enzyme drops
 * into the blue beaker that pours it down to the bioreactor, and the
 * Hardware bench, where the beefed-up PETase pops out of it. These rows are
 * held at the screen's middle, on phones too.
 */
const SECTION4_BENCH_ROWS = [1660, 2780]
/**
 * The next bottle rolls in once its cue is near the screen's foot, so the
 * bench's hold puts a higher row at the middle where it must to keep the cue
 * at least this far (share of vh) below the middle (benchHoldRow).
 */
const LAB_BENCH_CUE_VH = 0.5
/** In the blue beaker's liquid, where the enzyme drops in; and its stream (x, rows). */
const SECTION4_BEAKER = [458, 1830]
const SECTION4_STREAM = { x: 641, rows: [1910, 2708] }
/** The enzyme riding the stream, as a share of its own size. */
const SECTION4_RIDE_SCALE = 0.7
/**
 * The beefed-up PETase: its box on its plate, where it lands when it pops out
 * of the bioreactor (its middle), and its size there.
 */
const SECTION4_BEEFED = {
  src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/lab-stuff/beefeduppetase.avif",
  box: [400, 1200, 195, 193],
  land: [470, 2640],
  scale: 0.8,
}
/** The bioreactor vessel's mouth, which the stream pours into and the PETase pops out of. */
const SECTION4_VESSEL = [641, 2706]
const SECTION4_BEEFED_CROP = {
  x: (SECTION4_BEEFED.box[0] / SECTION4_PLATE.w) * 100,
  y: (SECTION4_BEEFED.box[1] / SECTION4_PLATE.h) * 100,
  w: (SECTION4_BEEFED.box[2] / SECTION4_PLATE.w) * 100,
  h: (SECTION4_BEEFED.box[3] / SECTION4_PLATE.h) * 100,
}
/** The big blue cluster's middle, where its constellation sets off from. */
const SECTION4_BLUE_CLUSTER = [558, 698.2]
/** Its lane: from there to where the lab holds the second time. */
const SECTION4_CONSTELLATION_ROWS = {
  at: [
    SECTION4_BLUE_CLUSTER[1],
    SECTION4_HOLD_ROWS.at[1] + SECTION4_ENZYME_PX.h,
  ],
}
/** On phones the constellation and enzyme sit here (% across), right of the lines. */
const SECTION4_PHONE_RIDE_LEFT = 71.5
/** How far across (plate px) the cluster's middle is from its lane's. */
const SECTION4_RIDE_DX = {
  at: SECTION4_BLUE_CLUSTER[0] - (441 + SECTION4_ENZYME_PX.w / 2),
  phone:
    SECTION4_BLUE_CLUSTER[0] -
    ((SECTION4_PHONE_RIDE_LEFT / 100) * SECTION4_PLATE.w +
      SECTION4_ENZYME_PX.w / 2),
}
/**
 * Each line: which hold it comes in through and when (share of it), and
 * [top row, left %, width %]. The first hold's are in the window's night sky
 * (`sky`); the second's either side of the constellation; the bench holds'
 * take turns in one spot (its middle with `mid`), each going (`out`, [hold,
 * share of it]) as the next comes. On phones the Dry Lab's take turns in one spot under the window:
 * `phone` is when each comes in and goes, just before the next, and `phoneAt`
 * [top row, left %, width %] moves one from that spot. `long` lines are set
 * smaller so they fit a short window.
 */
const SECTION4_STORY = [
  {
    hold: 0,
    in: 0.02,
    sky: true,
    at: [372, 12, 21],
    phone: { in: [0, 0.06], out: [0, 0.28] },
    text: "Each star is a protein in this database.",
  },
  {
    hold: 0,
    in: 0.3,
    sky: true,
    // Top right of the window, right of the red cluster.
    at: [372, 68, 18.3],
    // Up to LAB_NARROW_MAX it takes all the room there is.
    narrow: [65.8, 21],
    phone: { in: [0, 0.32], out: [0, 0.58] },
    text: "We annotated each with signal peptides, protein domains, the temperature and pH of the environment it originates from, and activity data scraped from existing literature.",
  },
  {
    hold: 0,
    in: 0.58,
    sky: true,
    // Bottom right, above the light blue cluster.
    at: [668, 69, 17],
    // Gone before the constellation rides down through its spot.
    phone: { in: [0, 0.62], out: [1, 0] },
    text: "Clusters of related proteins form constellations, each mapping to a different enzyme family.",
  },
  {
    hold: 1,
    in: 0.04,
    at: [1080, 2, 30],
    // Gone as the Wet Lab's hold starts, where tall screens still show it.
    out: [2, 0],
    phone: { in: [1, 0.2], out: [1, 0.46] },
    phoneAt: [SECTION4_PHONE_STORY_ROW, 4, 60],
    text: (
      <>
        Our <Link to="/dry-lab/overview/">Dry Lab</Link> team has trained models
        on this database to rank which candidates to test for each condition.
      </>
    ),
  },
  {
    hold: 1,
    in: 0.3,
    at: [1080, 68, 30],
    out: [2, 0],
    // Fades as the protein slides to the middle, at the hold's end.
    phone: { in: [1, 0.5], out: [1, 0.9] },
    phoneAt: [SECTION4_PHONE_STORY_ROW, 4, 60],
    text: "We also designed a novel algorithm to optimize the DNA library to capture more protein constellations.",
  },
  // The Wet Lab shelf: on the wall right of it, centred between the top of
  // the dark window behind the axolotl and the bench's bottom edge (`mid`:
  // the row is their middle), and under it on phones.
  {
    hold: 2,
    in: 0.02,
    out: [2, 0.24],
    at: [1695, 69.5, 28],
    mid: true,
    long: true,
    phoneAt: [2040, 4, 92],
    text: (
      <>
        Current methods to validate enzymatic performance are inefficient and
        expensive, so we developed our own…
        <br />
        Our <Link to="/wet-lab/overview/">Wet Lab</Link> team designed and
        created two novel high-throughput assays to test and quantify plastic
        degradation!
      </>
    ),
  },
  {
    hold: 2,
    in: 0.26,
    out: [2, 0.48],
    at: [1695, 69.5, 28],
    mid: true,
    long: true,
    phoneAt: [2040, 4, 92],
    text: "In both assays, copper is embedded into PET. When an enzyme begins to degrade the plastic, copper is released and switches on a promoter fused to a marker gene.",
  },
  {
    hold: 2,
    in: 0.5,
    out: [2, 0.72],
    at: [1695, 69.5, 28],
    mid: true,
    phoneAt: [2040, 4, 92],
    text: "In the Biosensor assay, successful breakdown of PET activates the expression of GFP, causing cells to glow green.",
  },
  {
    hold: 2,
    in: 0.74,
    out: [3, 0],
    at: [1695, 69.5, 28],
    mid: true,
    long: true,
    phoneAt: [2040, 4, 92],
    text: "In the Selection assay, PET degradation induces the expression of sul1, which confers resistance to the sulfadiazine antibiotic, enabling the growth of colonies on plates coated with sulfadiazine.",
  },
  // The Hardware bench: on the wall left of the bioreactor, centred on it
  // (above it on phones).
  {
    hold: 3,
    in: 0.02,
    out: [3, 0.26],
    at: [SECTION4_BENCH_ROWS[1], 3, 33],
    mid: true,
    phoneAt: [2300, 4, 92],
    text: "The most efficient PETase candidates then need to be tested under real conditions.",
  },
  {
    hold: 3,
    in: 0.28,
    out: [3, 0.56],
    at: [SECTION4_BENCH_ROWS[1], 3, 33],
    mid: true,
    long: true,
    phoneAt: [2300, 4, 92],
    text: (
      <>
        <Link to="/hardware/">Hardware</Link> engineered a low-cost, open-source
        parallel{" "}
        <ExplainTerm
          term="bioreactor"
          explanation="A bioreactor is a controlled vessel where biological reactions run under stable, adjustable conditions."
          plain
        />
        , drawing inspiration from the Pioreactor. This device is equipped with
        its own optical density sensor, temperature control capabilities,
        pumps, stir bar, and a live dashboard — all for less than $250.
      </>
    ),
  },
  {
    hold: 3,
    in: 0.58,
    at: [SECTION4_BENCH_ROWS[1], 3, 33],
    mid: true,
    long: true,
    phoneAt: [2300, 4, 92],
    text: (
      <>
        We aim to scale up to 8 units, so one experiment can compare several
        enzymes across a range of temperature and pH values.
        <br />
        We can identify which enzymes perform the most efficiently under
        certain parameters, seeing where and when they optimally function.
      </>
    ),
  },
]
/** Up to this width (px) the window's lines use their `narrow` [left %, width %]. */
const LAB_NARROW_MAX = 700
/** The second hold's share over which the enzyme fades in over the constellation. */
const LAB_HANDOFF = [0.74, 0.82]

const ENZYME_FOLLOW_VIEW_Y = 0.5
/** Phones: the second hold's share over which the enzyme slides to the middle and shrinks back. */
const LAB_PHONE_SLIDE = [0.9, 1]
/**
 * The Wet Lab hold's share over which the enzyme drops into the beaker, and
 * where the stream's rider takes over from it, at the tipped beaker's spout
 * (LabBench's WET_TIP ends there).
 */
const LAB_DROP = [0.04, 0.2]
const LAB_RIDE_FROM = WET_TIP[1]
/** The bench hold's share over which the stream's rider goes into the vessel. */
const LAB_RIDE_INTO = 0.06
/** The bench hold's share over which the beefed-up PETase pops out. */
const LAB_POP = [0.62, 0.78]
/** The row the bench's hold puts at the screen's middle (see LAB_BENCH_CUE_VH). */
const benchHoldRow = (vh, plateK) =>
  Math.min(
    SECTION4_BENCH_ROWS[1],
    SECTION4_BOTTLE_CUE[0] - (vh * LAB_BENCH_CUE_VH) / Math.max(1e-6, plateK),
  )

/**
 * The share of the next bottle's roll-in after which the beefed-up PETase
 * flies at it, faster and faster, slamming into it as it stops rolling.
 */
const LAB_ONTO_BOTTLE = 0.55
/**
 * Section-4 rows of the bottle's roll-in cue: a little above the sand (3464),
 * so the bottle rolls in over the sand and is centred in time for the ramp.
 */
const SECTION4_BOTTLE_CUE = [3250, 3350]
/** Front / bush plate offset so their fringe rows fill Section4Fringe. */
const SECTION4_FRINGE_IMG_STYLE = {
  left: 0,
  width: "100%",
  top: `${(-SECTION4_FRONT_ROW / (SECTION4_FRINGE_END_ROW - SECTION4_FRONT_ROW)) * 100}%`,
}

/**
 * Scroll-driven bottle: enter from left after shore float, descend the map→forest
 * band, shrink at the topmost section-3 bird, park at the second-topmost crab
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
/** Same Y as topmost section-3 bird — begin shrink here. */
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
/** Final scale in the forest (lerps SWAP → HOLD). */
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
 * Section4 bottle (enzyme attached): barrel-rolls in from the right as the lab's
 * sand comes up (SECTION4_BOTTLE_CUE), sticks at viewport center, parks under
 * “Some applications include…”, then after a short hold tilts onto the WWTP
 * ramp and slides off down-left.
 */
const CREAM_BOTTLE_LEFT_ENTER = 120
const CREAM_BOTTLE_LEFT_CENTER = 50
/** Full Z rotations during the right→center approach. */
const CREAM_BOTTLE_ROLLS = 4
/** Roll-in progress at which the cream bottle turns section1. */
const CREAM_BOTTLE_STAGE1_AT = 0.5
/** Ramp-1 exit progress at which it turns section2, then section3. */
const CREAM_BOTTLE_STAGE2_AT = 0.02
const CREAM_BOTTLE_STAGE3_AT = 0.45
/** Gap from the apps lead bottom to the bottle top while parked (px). */
const CREAM_BOTTLE_PARK_GAP_PX = 28
/**
 * Cue top vs viewport height: roll starts / reaches center.
 * Wider gap (lower end frac) = slower approach to center.
 */
const CREAM_BOTTLE_ROLL_START_FRAC = 0.95
const CREAM_BOTTLE_ROLL_END_FRAC = 0.05
/**
 * Entry Y as a fraction down the cue box (1 = bottom edge).
 * Higher = farther below the cue.
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
/** Scroll span (see artScrollSpan) for the start → end traversal. Larger = slower. */
const RAMP2_SLIDE_VH = 1.5

/**
 * Section-5 chute bottle (stage 5, then 6 at the fish): starts inside the WWTP pipe (behind the
 * pipe, in front of the repaint and its jet of water, so the pipe masks it), slides the water column at a
 * constant size, slams the pool (stretch/squash), then keeps scrolling with
 * the plate like the waterfall bottle. Coordinates are % of the 946×4000 plate.
 */
const CHUTE_SCROLL_VH = 0.72
/** Share of CHUTE_SCROLL_VH after impact over which the bottle eases to the middle column. */
const CHUTE_CENTER_SPAN = 0.7
/** After the splash the bottle sinks down the art at this share of the scroll (1 = stuck to the view). */
const CHUTE_SINK_RATE = 0.85
/** When the pipe mouth is this far down the viewport, progress is 0. */
const CHUTE_ARM_VIEW_Y = 0.46
/**
 * Sandwich: the repainted plant and its jet of water (7) < chute (8) < the
 * pipe (9), so the bottle starts inside the pipe and slides out over the jet.
 */
const CHUTE_Z = 8
/** Swap to stage 6 once the bottle centroid reaches the fish sprites (~79–82%). */
const CHUTE_STAGE6_Y_PCT = 76.5
/** Foam bob as the bottle squash hits the splash. */
const CHUTE_FOAM_BOB_AT = 0.74
const CHUTE_FOAM_BOB_RESET = 0.6
/** Launch splash droplets as the foam compresses, just before the rebound. */
const CHUTE_SPLASH_LAUNCH_DELAY_MS = 110
const CHUTE_KEYS = [
  { t: 0, x: 40.5, y: 41.2, r: -36, sx: 1, sy: 1 },
  { t: 0.1, x: 43.5, y: 42.4, r: -18, sx: 1, sy: 1 },
  { t: 0.24, x: 48.1, y: 43.2, r: 10, sx: 1, sy: 1 },
  { t: 0.42, x: 53.6, y: 43.55, r: 20, sx: 1, sy: 1 },
  { t: 0.58, x: 55.8, y: 46.35, r: 8, sx: 1, sy: 1 },
  { t: 0.68, x: 57.4, y: 48.85, r: -8, sx: 0.78, sy: 1.2 },
  { t: 0.76, x: 56.8, y: 51.05, r: 16, sx: 1.24, sy: 0.56 },
  { t: 0.86, x: 55.4, y: 52.65, r: -4, sx: 1, sy: 1 },
  { t: 1, x: 54.2, y: 54.2, r: 4, sx: 1, sy: 1 },
]

function chuteLerpKey(a, b, u) {
  const ax = a.sx ?? a.s ?? 1
  const ay = a.sy ?? a.s ?? 1
  const bx = b.sx ?? b.s ?? 1
  const by = b.sy ?? b.s ?? 1
  return {
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
    r: a.r + (b.r - a.r) * u,
    sx: ax + (bx - ax) * u,
    sy: ay + (by - ay) * u,
  }
}

function chutePoseAt(progress) {
  const t = clamp01(progress)
  const path = CHUTE_KEYS
  if (t <= path[0].t) return chuteLerpKey(path[0], path[0], 0)
  for (let i = 1; i < path.length; i++) {
    if (t <= path[i].t) {
      const a = path[i - 1]
      const b = path[i]
      const u = (t - a.t) / Math.max(1e-6, b.t - a.t)
      return chuteLerpKey(a, b, u)
    }
  }
  return chuteLerpKey(path[path.length - 1], path[path.length - 1], 0)
}

/** Map linear scroll 0–1 onto path t: ease-in slide, linger on impact, ease-out sink. */
function chuteScrollToPath(p) {
  const t = clamp01(p)
  if (t <= 0.42) {
    const u = t / 0.42
    return 0.7 * (0.75 * u + 0.25 * u * u)
  }
  if (t <= 0.72) {
    const u = (t - 0.42) / 0.3
    return 0.7 + 0.1 * (u * u * (3 - 2 * u))
  }
  const u = (t - 0.72) / 0.28
  return 0.8 + 0.2 * (1 - (1 - u) * (1 - u))
}

const SECTION5_CDN =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/noorine-section-5-layers"

/** Hex field after the reef. Transparent top (~26%) fades into the honeycomb. */
const HEX_FIELD_SRC =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/bg-new-use-this.avif"
/** Plate % where the hex art starts, low enough to cover the bottom of the reef. */
const HEX_FIELD_TOP_PCT = 70.6
/**
 * Where the same art reads as the blue section. The fade is already the
 * dark field before the fully opaque row, and the chute bottle was painting
 * on that field. Row 1156 of the 3831-tall plate (alpha past ~160).
 */
const CHUTE_BLUE_EDGE = 1156 / 3831
/** How far down the view (share of vh) the ending bottle's bottom is when it is whole. */
const ENDING_ASSEMBLED_AT = 0.9

/**
 * The treatment plant and the sea under it, repainted as one picture on the
 * same plate. It's drawn down to the reef, then fades into the older layers
 * across SECTION5_REPAINT_FADE (plate px), above the coral and the honeycomb
 * that sits between them.
 */
const SECTION5_REPAINT_SRC =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/rerenderee.avif"
const SECTION5_REPAINT_FADE = [2350, 2500]
/** Its cropped copy (rows 0–2500 of the plate). */
const SECTION5_REPAINT_CROP =
  "https://static.igem.wiki/teams/6187/wiki/homepage-cropped/rerenderee.avif"
/** The repaint's pipe and the gush out of it, on their own to go over the bottle. */
const SECTION5_TUBE_CDN =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/new-tube"

/** Tall underwater plate (946×4000), stacked back → front. */
const SECTION5_LAYERS = [
  { id: 1, file: "1-bg.avif", z: 1, sizer: true },
  { id: 2, file: "2-mid-trench.avif", z: 2 },
  { id: 3, file: "3-fore-trench.avif", z: 3 },
  { id: 4, file: "4-coral-texture.avif", z: 6 },
  { id: 5, file: "5-coral-blend.avif", z: 4 },
  { id: 6, file: "6-water-stream-gush-thing.avif", z: 7 },
  { id: 6.5, src: SECTION5_REPAINT_SRC, z: 7, fade: SECTION5_REPAINT_FADE },
  // Under the chute bottle, so it's seen sliding out over the jet of water.
  {
    id: 6.6,
    src: `${SECTION5_TUBE_CDN}/half-of-water-goes-below-tube.avif`,
    z: 7,
  },
  // Over it: the pipe it starts inside.
  { id: 7, src: `${SECTION5_TUBE_CDN}/tube.avif`, z: 9 },
]

const section5Src = layer => layer.src || `${SECTION5_CDN}/${layer.file}`

/** A layer fading out down the plate between `[from, to]` plate px. */
const section5Fade = ([from, to]) => {
  const mask = `linear-gradient(to bottom, #000 ${((from / 4000) * 100).toFixed(2)}%, transparent ${((to / 4000) * 100).toFixed(2)}%)`
  return { maskImage: mask, WebkitMaskImage: mask }
}

/** Splash foam — full plate, above scenery + chute bottle, below apps copy. */
const SECTION5_FOAM_SRC =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/bubbles-foam.avif"
const SECTION5_FOAM_Z = 11
/** Painted bubbles sit on the same 946×4000 plate; y% is the sprite centroid. */
const BUBBLE_CDN =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/bubbles"
const FOAM_BARRIER_Y_PCT = 51.2
/** Painted splash blobs on the same 946×4000 plate as the foam. */
const SPLASH_CDN =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/splash"
const SPLASH_Z = 11
/** Bottle squash / pool hit — droplets launch from here. */
const SPLASH_IMPACT = { x: 56.8, y: 50.9 }
/** Plate-% / ms². Positive y is down, so this pulls droplets back into the foam. */
const SPLASH_GRAVITY = 0.000074
/** Horizontal air drag (1/ms) so they fall more down than sideways after the apex. */
const SPLASH_DRAG = 0.00115
/**
 * `crop` is the painted box inside each full-plate sprite (plate %, padded).
 * Only that window is rendered, so the animated layer is a few hundred px
 * instead of a whole 946×4000 plate re-rastered every frame.
 */
const SPLASH_PLATES = [
  {
    id: 1,
    x: 52.55,
    y: 49.39,
    delay: 20,
    extraRise: 1.15,
    crop: { x: 45.2, y: 48.05, w: 17.4, h: 2.4 },
  },
  {
    id: 2,
    x: 84.38,
    y: 43.76,
    delay: 80,
    extraRise: 1.85,
    crop: { x: 80.9, y: 43.2, w: 7.5, h: 1.15 },
  },
  {
    id: 3,
    x: 44.86,
    y: 47.99,
    delay: 40,
    extraRise: 1.45,
    crop: { x: 42.2, y: 47.25, w: 5.2, h: 1.6 },
  },
  {
    id: 4,
    x: 54.1,
    y: 50.84,
    delay: 0,
    extraRise: 0.75,
    crop: { x: 49.1, y: 50.25, w: 10.4, h: 1.3 },
  },
  {
    id: 5,
    x: 56.86,
    y: 48.19,
    delay: 55,
    extraRise: 2.15,
    crop: { x: 54.05, y: 46.9, w: 6, h: 2.65 },
  },
]
/** Painted foam box, padded for the impact bob's scale. */
const FOAM_CROP = { x: 27.5, y: 46.4, w: 67.5, h: 8.4 }
/** Foam bob pivot on the plate (was `56% 51%` of the full plate). */
const FOAM_BOB_ORIGIN = { x: 56, y: 51 }

/** Window onto a full-plate sprite; see SPLASH_PLATES. */
function plateCropStyle(crop) {
  return {
    left: `${crop.x}%`,
    top: `${crop.y}%`,
    width: `${crop.w}%`,
    height: `${crop.h}%`,
  }
}

/** Full plate image offset so its `crop` box fills the window. */
function plateCropImgStyle(crop) {
  return {
    width: `${(100 / crop.w) * 100}%`,
    left: `${(-crop.x / crop.w) * 100}%`,
    top: `${(-crop.y / crop.h) * 100}%`,
  }
}

function splashLaunchFor(plate) {
  const rise = Math.max(0.35, SPLASH_IMPACT.y - plate.y) + plate.extraRise
  const vy = -Math.sqrt(Math.max(1e-8, 2 * SPLASH_GRAVITY * rise))
  const tApex = -vy / SPLASH_GRAVITY
  const dragSpan = (1 - Math.exp(-SPLASH_DRAG * tApex)) / SPLASH_DRAG
  const vx = (plate.x - SPLASH_IMPACT.x) / Math.max(1e-3, dragSpan)
  return { ...plate, vx, vy, tApex }
}

const SPLASH_LAUNCHES = SPLASH_PLATES.map(splashLaunchFor)

const BUBBLE_PLATES = {
  1: { x: 30.1, y: 80.4 },
  2: { x: 29.25, y: 78.85 },
  3: { x: 52.4, y: 78.1 },
  4: { x: 57.15, y: 79.1 },
  5: { x: 59.25, y: 77.9 },
  6: { x: 56.15, y: 76.8 },
  7: { x: 50.35, y: 74.3 },
  8: { x: 44.05, y: 74.5 },
  9: { x: 46.6, y: 73.1 },
  10: { x: 73.35, y: 75.8 },
  11: { x: 78.7, y: 76.0 },
  12: { x: 78.6, y: 77.2 },
  13: { x: 82.4, y: 74.35 },
}
/**
 * Painted box of each bubble sprite (plate %), padded for its idle bob. Only
 * that window is rendered — see plateCropStyle — so the 13 animated bubbles
 * are small layers instead of whole plates. Moves given in plate % are
 * rescaled to the window (bubbleShift).
 */
const BUBBLE_CROPS = {
  1: { x: 28.05, y: 79.8, w: 3.83, h: 1.05 },
  2: { x: 25.83, y: 78.05, w: 6.05, h: 1.7 },
  3: { x: 48.88, y: 77.225, w: 6.68, h: 1.775 },
  4: { x: 54.8, y: 78.4, w: 4.57, h: 1.35 },
  5: { x: 57.33, y: 77.35, w: 3.84, h: 1.075 },
  6: { x: 54.59, y: 76.35, w: 2.98, h: 0.875 },
  7: { x: 48.24, y: 73.575, w: 4.89, h: 1.375 },
  8: { x: 42.11, y: 73.95, w: 3.73, h: 1.025 },
  9: { x: 44.97, y: 72.6, w: 2.88, h: 0.875 },
  10: { x: 70.55, y: 75.025, w: 5.63, h: 1.6 },
  11: { x: 77.31, y: 75.575, w: 2.67, h: 0.825 },
  12: { x: 76.57, y: 76.525, w: 4.05, h: 1.2 },
  13: { x: 79.85, y: 73.65, w: 4.36, h: 1.225 },
}

/** A move in plate % → the same move as % of bubble `id`'s crop window. */
function bubbleShift(id, dxPct, dyPct) {
  const crop = BUBBLE_CROPS[id]
  return [(dxPct / crop.w) * 100, (dyPct / crop.h) * 100]
}

/** Idle stream rising to the foam; `x` is the lane across the plate. */
const STREAM_BUBBLES = [
  { id: 1, x: 14 },
  { id: 3, x: 32 },
  { id: 8, x: 50 },
  { id: 10, x: 68 },
  { id: 13, x: 86 },
]
/** Cluster that rides under/around the sinking bottle. */
const COMPANION_BUBBLE_SPECS = [
  { id: 2, ox: -7.4, oy: 0.48, cushion: true, followMs: 520 },
  { id: 4, ox: 0.2, oy: 0.78, cushion: true, followMs: 640 },
  { id: 5, ox: 7.6, oy: 0.4, cushion: true, followMs: 480 },
  { id: 6, ox: -11.2, oy: -1.2, cushion: false, followMs: 360 },
  { id: 7, ox: 11.4, oy: -0.9, cushion: false, followMs: 560 },
  { id: 9, ox: -7.1, oy: 0.05, cushion: false, followMs: 300 },
  { id: 11, ox: 7.3, oy: 0.1, cushion: false, followMs: 440 },
  { id: 12, ox: -2.4, oy: -2.15, cushion: false, followMs: 400 },
]
const COMPANION_DETACH_MS = 3200
const COMPANION_RISE_MS = 2600
/** Plate-% distance at which a follower starts idling at the bottle. */
const COMPANION_ARRIVE_PCT = 0.7

/**
 * Layer 8 — sparse fish sprites near the bottom of the plate. Drift + bob on
 * top of the scenery (below apps copy). Not layer 5 (coral-blend is static).
 */
const SECTION5_FISHES = [
  {
    id: "fishes",
    src: `${SECTION5_CDN}/8-fishes-that-can-move-around.avif`,
    z: 10,
    driftMs: 52000,
    driftDelayMs: 1200,
    hoverDelayMs: 0,
    /** Painted box on the plate (%), padded for the bob; only this is rendered. */
    crop: { x: 24.6, y: 78.9, w: 19.4, h: 3.5 },
  },
]

/**
 * Cut-out petamons. Each file is one creature.
 * Hosted on the iGEM CDN; media files must not be bundled in the wiki repository.
 *
 *   outreach-pink-rabbit-right.avif  forest, right branch
 *   outreach-pink-rabbit-left.avif   forest, left edge
 *   section5-tan-fox.avif             plant, upper left sky
 *   section5-kangaroo.avif            plant, sand right of the pipe (coins ride with it)
 *   section5-snail.avif               waterline, right of the pour
 *   section5-turtle.avif              open water, left of the pink axolotl
 *   section5-pink-axolotl.avif        open water
 *   section5-yellow-axolotl.avif      reef, lower middle
 *   section5-green-axolotl.avif       reef, lower right
 */
const BOTTOM_PETAMON_BASE = "https://static.igem.wiki/teams/6187/wiki/homepage-components/added-petamon"

/**
 * Outreach rabbits. The source sheet is the 2360×1640 frame of the pinned
 * forest (nav and browser chrome included, same aspect as that screenshot).
 * Boxes below are that frame mapped onto the forest band (front-plate rows
 * 2660–3503) so the rabbits stay locked to the painting.
 */
const FOREST_PETAMONS = [
  {
    id: "pink-rabbit-right",
    src: `${BOTTOM_PETAMON_BASE}/outreach-pink-rabbit-right.avif`,
    box: { left: 84.07, top: 58.9, width: 9.53, height: 6.88 },
    /** Ears, as a fraction of the cut-out, so the acorn lands on the head. */
    head: { x: 0.7, y: 0.28 },
  },
  {
    id: "pink-rabbit-left",
    src: `${BOTTOM_PETAMON_BASE}/outreach-pink-rabbit-left.avif`,
    box: { left: 3.22, top: 67.76, width: 3.14, height: 6.48 },
    head: { x: 0.5, y: 0.16 },
  },
]

/**
 * Section 5 creatures. The sheet is 1004×4000 with the 946×4000 plate
 * centred in it (29px of empty margin each side); boxes are % of that plate.
 * `aboveHex` creatures sit in the reef, under the hex field's solid backing,
 * so they paint above that backing and under the copy.
 */
const SECTION5_PETAMONS = [
  {
    id: "tan-fox",
    src: `${BOTTOM_PETAMON_BASE}/section5-tan-fox.avif`,
    box: { left: 4.12, top: 6.6, width: 12.26, height: 3 },
  },
  {
    id: "kangaroo",
    src: `${BOTTOM_PETAMON_BASE}/section5-kangaroo.avif`,
    box: { left: 66.81, top: 32.45, width: 24.63, height: 7.08 },
  },
  {
    id: "snail",
    src: `${BOTTOM_PETAMON_BASE}/section5-snail.avif`,
    box: { left: 79.39, top: 41.28, width: 18.39, height: 2.63 },
  },
  {
    id: "turtle",
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/separate-petamon/turtle.avif",
    // Full-plate sprite. Crop is the opaque turtle, with a few pixels of pad.
    crop: { x0: 64, y0: 2282, x1: 207, y1: 2408 },
    box: { left: 6.77, top: 57.05, width: 15.12, height: 3.15 },
  },
  {
    id: "pink-axolotl",
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/separate-petamon/acolotl.avif",
    // Full-plate sprite (filename is acolotl). Crop includes the lower whisker.
    // Right of the open water, between the right-hand ocean lines.
    crop: { x0: 127, y0: 2214, x1: 377, y1: 2486 },
    box: { left: 62, top: 61.5, width: 26.43, height: 6.8 },
  },
  {
    id: "yellow-axolotl",
    src: `${BOTTOM_PETAMON_BASE}/section5-yellow-axolotl.avif`,
    aboveHex: true,
    box: { left: 52.54, top: 78.6, width: 20.51, height: 4.5 },
  },
  {
    id: "green-axolotl",
    src: `${BOTTOM_PETAMON_BASE}/section5-green-axolotl.avif`,
    aboveHex: true,
    box: { left: 73.78, top: 75.65, width: 18.18, height: 4.93 },
  },
]

const petamonSpotStyle = ({ left, top, width, height }) => ({
  left: `${left}%`,
  top: `${top}%`,
  width: `${width}%`,
  height: `${height}%`,
})

/** Show one rectangle of a full-plate sprite, without clipping the spot. */
function plateFillStyle(src, crop) {
  const plateW = 946
  const plateH = 4000
  const w = crop.x1 - crop.x0
  const h = crop.y1 - crop.y0
  return {
    backgroundImage: `url(${src})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${(plateW / w) * 100}% ${(plateH / h) * 100}%`,
    backgroundPosition: `${(crop.x0 / (plateW - w)) * 100}% ${(crop.y0 / (plateH - h)) * 100}%`,
  }
}

/**
 * Section 5 cut-outs, from the treatment plant down through the reef.
 * The plant-rim kangaroo head (tan-fox cutout) throws coins from its mouth.
 * The sitting kangaroo throws coins too. The sewer turtle flashes lightning, biased left so
 * its cropped side stays covered. The shell beside the plant fans three bolts
 * from its head and shivers slightly. Every water axolotl glows and floats clear; the pink one drifts
 * straight down, into the open water under it. The fox does not react. Ocean copy
 * stays above the creatures (`z` 12) and does not take hits.
 */
function section5Act(id) {
  if (id === "kangaroo" || id === "tan-fox") return "coins"
  if (id === "turtle" || id === "snail") return "lightning"
  if (id.endsWith("axolotl")) return "dodge"
  return null
}

function Section5Petamon({ pet, z }) {
  const kind = section5Act(pet.id)
  const shake =
    pet.id === "turtle" ? "left" : pet.id === "snail" ? "slight" : undefined
  return (
    <PetamonSpot
      $z={z}
      style={petamonSpotStyle(pet.box)}
      aria-hidden="true"
    >
      <PetamonAct
        kind={kind}
        hitInset="0"
        glow={kind === "dodge"}
        shake={shake}
        bolt={
          pet.id === "snail" || pet.id === "turtle" ? "fan" : undefined
        }
        fanAt={
          pet.id === "turtle"
            ? { x: 0.14, y: 0.16 }
            : pet.id === "snail"
              ? { x: 0.18, y: 0.2 }
              : undefined
        }
        mouth={pet.id === "tan-fox" ? { x: 0.24, y: 0.56 } : undefined}
        drift={
          pet.id === "pink-axolotl" ? { x: 0, y: 1 } : undefined
        }
        refWidth={pet.id === "tan-fox" ? 150 : kind === "coins" ? 273 : 201}
      >
        {pet.crop ? (
          <PlateFill style={plateFillStyle(pet.src, pet.crop)} />
        ) : (
          <img src={pet.src} alt="" draggable={false} />
        )}
      </PetamonAct>
    </PetamonSpot>
  )
}

/**
 * Floating bottle: the stage-0 bottle above the waterline, and the painted
 * ripples (bottom of bottle-w-ripples, whose bottle is a later stage) below
 * it. Both share the stage canvas (1065 × 1640).
 */
const SHORE_BOTTLE_RIPPLES_IMG =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/bottle-w-ripples.avif"
/** Waterline on the stage canvas (% down the 1640px height). */
const SHORE_BOTTLE_WATERLINE_PCT = (830 / 1640) * 100

/**
 * Where each condition card links. All three go to the BioSample metadata
 * figure for now; point them at their own sections (temperature, pH,
 * environment) once those exist.
 */
const CONDITION_CARD_HREF = "/dry-lab/model/biosample-profiles/#biosample-profiles-figure"

const CONDITION_CARD_IMAGES = [
  {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/newcards/ph.avif",
    alt: "pH",
    href: CONDITION_CARD_HREF,
  },
  {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/newcards/temp.avif",
    alt: "Temperature",
    href: CONDITION_CARD_HREF,
  },
  {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/newcards/surrounding-env.avif",
    alt: "Environment",
    href: CONDITION_CARD_HREF,
  },
]

/** The Logan popover's text. */
const LOGAN_EXPLANATION =
  "Logan is an assembly of all 38.1 million public sequencing datasets in NCBI's Sequence Read Archive, turned into searchable DNA. It was built by our advising lab, the RNALab at UofT, and collaborators, and it's where PETadex finds its enzymes."

/** Delay + slide duration; the RNAlab term is not hoverable until this elapses. */
const RNALAB_REVEAL_MS = 740

/**
 * Jump to the top on mount / HMR. Keep off: back/forward and reloads return
 * the reader to where they were (see readPlayedBeats).
 */
const RESET_SCROLL_ON_MOUNT = false

/**
 * The forest walk and the ending hold give up their scroll length once
 * played, which moves everything below them up. Remembered per history
 * entry, so going back (or reloading) rebuilds the page as it was and the
 * restored scroll position lands where the reader left off.
 */
const playedBeatsKey = () =>
  `home-played|${window.history.state?.key ?? "initial"}`

function readPlayedBeats() {
  try {
    return JSON.parse(window.sessionStorage.getItem(playedBeatsKey())) || {}
  } catch {
    return {}
  }
}

function savePlayedBeats(beats) {
  try {
    window.sessionStorage.setItem(playedBeatsKey(), JSON.stringify(beats))
  } catch {
    // No storage (e.g. blocked): back just lands before the beats instead.
  }
}

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

/** How far (px) below the middle of the view the pinned bottle's spot must be (scrolled back up) before it unpins. */
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
    /**
     * Human Practices' petamon: where its speech bubble spot sits on the bird
     * (canvas px). HomePlaza draws the spot, over the logo, following it.
     */
    petamon: { box: [491, 630, 689, 756] },
    /**
     * Where it's moved to from where it's painted (canvas px): off the logo,
     * into the empty sky right of the church, beside the "Meet the PETamons"
     * line (phones: further right, over the houses there). It doesn't fly
     * across like the other back birds (no `driftMs`), so it can always be
     * hovered.
     */
    home: { at: [600, 170], phone: [640, 310] },
    a: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-1.avif",
    b: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-1-2.avif",
    speed: 0.82,
    flapMs: 980,
    delayMs: 0,
    depth: "back",
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

/** A bird's spot on its 1440×3239 canvas, as % of it. */
/** A bird moved off where it's painted (`home`, canvas px). */
const birdHomeStyle = home => {
  if (!home) return undefined
  const shift = ([x, y]) =>
    `translate3d(${((x / 1440) * 100).toFixed(3)}%, ${((y / 3239) * 100).toFixed(3)}%, 0)`
  return {
    "--bird-home": shift(home.at),
    "--bird-home-phone": shift(home.phone || home.at),
  }
}

const birdSpotStyle = ([x0, y0, x1, y1]) => ({
  left: `${((x0 / 1440) * 100).toFixed(3)}%`,
  top: `${((y0 / 3239) * 100).toFixed(3)}%`,
  width: `${(((x1 - x0) / 1440) * 100).toFixed(3)}%`,
  height: `${(((y1 - y0) / 3239) * 100).toFixed(3)}%`,
})

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
/** Opaque blob top in wiki-front-water (px 2235 / 2440). Shift so it sits on the splash lip. */
const PUDDLE_ART_TOP_FRAC = 2235 / 2440
const PUDDLE_SHIFT_Y_PCT =
  (PUDDLE_ART_TOP_FRAC - WATERFALL_SPLASH_TOP_PCT / 100) * -100
/** Second puddle copy, extra % of the waterfall band downward so the bottle cannot peek under the lip. */
const PUDDLE_UNDER_SHIFT_PCT = 4.5

/**
 * Shore-bottle rematch (section1). Same river path as before, but the drift
 * pauses at three evenly spaced checkpoints until the bottle sits above the
 * viewport midpoint — so it cannot float past the reader on its own.
 */
/** Shore top below this fraction of vh → start the drift (appear as shore peeks in). */
const SHORE_BOTTLE_TRIGGER_FRAC = 1.02
/** Shore top above this → reset so the drift can replay on the next pass. */
const SHORE_BOTTLE_RESET_FRAC = 1.08
/**
 * Travel time (ms) for the path at the 1440px-wide art; pauses at gates are
 * extra. Scaled with the art width so the on-screen speed is the same on
 * narrower views (never below SHORE_BOTTLE_DRIFT_MIN_SCALE of it).
 */
const SHORE_BOTTLE_DRIFT_MS = 9500
const SHORE_BOTTLE_DRIFT_MIN_SCALE = 0.72
/** Sky bottle treated as sunk once fade opacity drops below this. */
const SHORE_BOTTLE_SUNK_OPACITY = 0.2
/**
 * Waypoints as fractions of the drift (left/top % of the shore band).
 * Matches the old CSS keyframe path.
 */
const SHORE_BOTTLE_PATH = [
  { t: 0, left: 104, top: 10, opacity: 0 },
  { t: 0.04, left: 102, top: 14, opacity: 1 },
  { t: 0.45, left: 96, top: 42, opacity: 1 },
  { t: 0.68, left: 90, top: 64, opacity: 1 },
  { t: 0.82, left: 58, top: 74, opacity: 1 },
  { t: 1, left: -16, top: 82, opacity: 1 },
]
/** Pause the drift here until the bottle is above the viewport midpoint. */
const SHORE_BOTTLE_GATES = [0.25, 0.5, 0.75]
/** Bottle centroid must be above this fraction of the viewport to clear a gate. */
const SHORE_BOTTLE_GATE_VIEW_Y = 0.5

function shoreBottlePoseAt(progress) {
  const t = clamp01(progress)
  const path = SHORE_BOTTLE_PATH
  if (t <= path[0].t) return path[0]
  for (let i = 1; i < path.length; i++) {
    if (t <= path[i].t) {
      const a = path[i - 1]
      const b = path[i]
      const u = (t - a.t) / Math.max(1e-6, b.t - a.t)
      return {
        left: a.left + (b.left - a.left) * u,
        top: a.top + (b.top - a.top) * u,
        opacity: a.opacity + (b.opacity - a.opacity) * u,
      }
    }
  }
  return path[path.length - 1]
}

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
    originX: 68.5,
    originY: 10.4,
    flapMs: 860,
    delayMs: 0,
    /**
     * Bobbing "!" above it (no message) so people notice the crabs react,
     * till it's first scuttled (remembered like the petamons met).
     */
    bang: true,
  },
  {
    id: "b",
    a: `${CRAB_CDN}/crab-section-2-b.avif`,
    b: `${CRAB_CDN}/crab-section-2-b-2.avif`,
    xPct: -50,
    yPct: 30,
    originX: 79.5,
    originY: 13.4,
    flapMs: 640,
    delayMs: 180,
  },
  {
    id: "c",
    a: `${CRAB_CDN}/crab-section-2-c.avif`,
    b: `${CRAB_CDN}/crab-section-2-c-2.avif`,
    xPct: 0,
    yPct: 0,
    originX: 36.4,
    originY: 86.1,
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
    // Lower than the others: down in the bushes rather than floating mid-air.
    yPct: 13,
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
    /** Right-hand bird. Clockwise, and the circle stays left of the perch so the wing is not cropped. */
    loop: { left: "67%", top: "33%", width: "11%", height: "9%" },
    loopSpan: 0.02,
    facing: -1,
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
    /** Left-hand bird. Counterclockwise. */
    loop: { left: "31%", top: "32%", width: "10%", height: "9%" },
    loopSpan: 0.02,
    facing: 1,
    flapMs: 720,
    delayMs: 160,
  },
  {
    id: "crab-a",
    a: `${SECTION3_CDN}/section-3-crab-a.avif`,
    b: `${SECTION3_CDN}/section-3-crab-a-2.avif`,
    xPct: -23,
    yPct: 25,
    originX: 26.5,
    originY: 54.4,
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
    originX: 20.1,
    originY: 70.9,
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
    originX: 79.5,
    originY: 74.0,
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

/**
 * Extra in-flow scroll while the painting is pinned on the world map; maps to
 * the map's four slides (HomeEcosystemMap), the way WALK_TRACK_VH drives the walk.
 */
const MAP_HOLD_VH = 310
/**
 * Soft-cap on scrolling through that hold: a wheel or trackpad moves the page
 * at most this far per second while the map is pinned (so the hold takes at
 * least ~3.5 s), and scroll past the cap is dropped rather than queued. A
 * short burst is allowed, so one notch of a mouse wheel still moves at once.
 */
const MAP_SCROLL_VH_PER_S = 90
const MAP_SCROLL_BURST_S = 0.12
/** Room (px) between the nav bar and the first line of text while the map is pinned. */
const MAP_PIN_NAV_GAP = 28
/**
 * Above the map band, as shares of the art width: the top of the Logan
 * paragraph, its bottom, and the map's slide title (HomeEcosystemMap).
 */
const LOGAN_TOP_ABOVE_MAP = 0.244
const LOGAN_BOTTOM_ABOVE_MAP = 0.0905
/** How far the paint (and the Antarctica tag) runs below the band's top, × art width. */
const MAP_PAINT_BELOW_TOP = 0.385
/** Extra in-flow scroll while the forest frame is sticky; maps to walk progress. */
const WALK_TRACK_VH = 120
/**
 * Freeze after pose 2 + bang. Long enough to read the RNAlab reveal and scrub
 * the bird-steal beat before the forest unpins.
 */
const WALK_HOLD_VH = 240
/**
 * Phones coast on after the finger lifts, and moving the scroll under that
 * coast stutters it (or jumps, on iOS). On touch, the walk and the ending
 * drop their played scroll length only once the page has been still this long.
 */
const TOUCH_SETTLE_MS = 200
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

/**
 * Scroll length for a bottle following a painted path. `share` is tuned as a
 * share of a 900px-tall view at the 1440px-wide art; the length then scales
 * with the art (not the window height), so on narrow/tall windows the bottle
 * keeps pace with the painting instead of falling behind it.
 */
const artScrollSpan = (share, artW) =>
  Math.max(1, share * 900 * (artW / ART_REF_W))
const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2
const smoothstep = t => t * t * (3 - 2 * t)
/** Human / animal overlay plates are 2238×3132. */
const OVERLAY_PLATE_ASPECT = 3132 / 2238
/** Head on the human plate (%), for placing the bang behind it. */
const HUMAN_HEAD_X = 61.5
const HUMAN_HEAD_Y = 22
/** Same "!" as the popup hint by the waterfall. */
const CRAB_BANG_SRC =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/exclamation.avif"

/** Bang centroid on the full-size exclamation plate (%). */
const EXCLAMATION_MARK_X = 55
const EXCLAMATION_MARK_Y = 30
const EXCLAMATION_SRC =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/human/exclamation.avif"

/** Sidestep distance (% of the overlay plate) and lean (deg) per hover scuttle. */
const CRAB_SCUTTLE_X_PCT = 4.5
const CRAB_SCUTTLE_THETA_DEG = 16
const CRAB_SCUTTLE_MS = 480

/**
 * Hover scuttle: first enter sidesteps left, the next right, then left again.
 * Rotation is about the plate normal (CSS rotate / z) from +θ to −θ while moving.
 * With `metId`, scuttling it counts as meeting it (its "!" goes, see CrabBang).
 */
function CrabScuttle({
  originX = 50,
  originY = 50,
  label = "Crab",
  metId,
  children,
}) {
  const [homeX, setHomeX] = useState(0)
  const [dir, setDir] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const busyRef = useRef(false)
  const { meet } = usePetamonsMet()

  const onEnter = () => {
    if (busyRef.current) return
    if (metId) meet(metId)
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setHomeX(x => x + dir * CRAB_SCUTTLE_X_PCT)
      setDir(d => -d)
      return
    }
    busyRef.current = true
    setPlaying(true)
  }

  const onAnimEnd = event => {
    if (event.target !== event.currentTarget) return
    setHomeX(x => x + dir * CRAB_SCUTTLE_X_PCT)
    setDir(d => -d)
    setPlaying(false)
    busyRef.current = false
  }

  return (
    <CrabScuttleShell $homeX={homeX} $ox={originX} $oy={originY}>
      <CrabScuttleMotion
        $playing={playing}
        $dir={dir}
        $ox={originX}
        $oy={originY}
        onAnimationEnd={onAnimEnd}
      >
        {children}
        <CrabHitPad
          type="button"
          aria-label={label}
          $ox={originX}
          $oy={originY}
          onMouseEnter={onEnter}
          onPointerDown={event => {
            // Touch has no hover: a tap scuttles it instead.
            if (event.pointerType !== "mouse") onEnter()
          }}
        />
      </CrabScuttleMotion>
    </CrabScuttleShell>
  )
}

/** Its children (a "!") until petamon `id` has been met. */
function UntilMet({ id, children }) {
  const { met } = usePetamonsMet()
  return met && !met.has(id) ? children : null
}

/**
 * Full-page wiki front compositing: Toronto parallax behind one tall front plate.
 *
 * Site nav uses scroll-driven `position: fixed` while the mockup is on-screen.
 *
 * Bottle touchpoints: (1) when the bottle midpoint crosses the viewport middle, capture scrollY
 * and pin the bottle centered; (2) stay pinned through the bottom of the page so it does not
 * vanish. Unpin only when the user scrolls back up past TP1 (`scrollY` below that capture minus slack).
 */
/** Forest birds loop. Every other plate keeps the plain flap. */
function BirdPlate({ loop, facing, origin, span, children }) {
  const frames = <CrabFlapper>{children}</CrabFlapper>
  if (!loop) return frames
  return (
    <LoopTarget box={loop} facing={facing || 1} origin={origin} span={span}>
      {frames}
    </LoopTarget>
  )
}

function ForestCritter({ animal, stealRef }) {
  let plate = animal.static ? (
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
      <BirdPlate
        loop={animal.loop}
        facing={animal.facing}
        origin={
          animal.originX != null
            ? `${animal.originX}% ${animal.originY}%`
            : undefined
        }
        span={animal.loopSpan}
      >
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
      </BirdPlate>
    </AnimalMotion>
  )

  if (animal.id === "axolotl") {
    plate = (
      <TreeHide
        hit={{ left: "76%", top: "60%", width: "20%", height: "16%" }}
        shift="12%"
      >
        {plate}
      </TreeHide>
    )
  }

  let body = plate
  if (animal.id.startsWith("crab")) {
    body = (
      <CrabScuttle
        originX={animal.originX}
        originY={animal.originY}
        label={`Crab ${animal.id}`}
      >
        {plate}
      </CrabScuttle>
    )
  }
  if (animal.revealOnArrive) {
    body = <PetamonReveal $delayMs={animal.delayMs}>{body}</PetamonReveal>
  } else if (animal.id === STEAL_BIRD_ID) {
    body = <BirdStealMount ref={stealRef}>{body}</BirdStealMount>
  }

  return (
    <CrabMount
      $xPct={animal.xPct}
      $yPct={animal.yPct}
      $z={
        animal.id === STEAL_BIRD_ID ? 12 : animal.id === "axolotl" ? 2 : 0
      }
    >
      {body}
    </CrabMount>
  )
}

export function HomeScrollPrototype() {
  const stackRef = useRef(null)
  const bottleTouchRef = useRef(null)
  const bottleFlipRef = useRef(null)
  const bottleTouchPinnedRef = useRef(false)
  const flipUnpinFirstRef = useRef(null)
  const flipPinFirstRef = useRef(null)
  const flipCleanupRef = useRef(null)
  const parallaxBackRef = useRef(null)
  const birdParallaxRefs = useRef([])
  /** The Human Practices bird: where its spot goes, and its drift (see HomePlaza). */
  const hpBirdAnchorRef = useRef(null)
  const waterRef = useRef(null)
  const shoreRef = useRef(null)
  const mapBottleBandRef = useRef(null)
  const mapBottleMountRef = useRef(null)
  const mapBottleImgRef = useRef(null)
  /** Band progress when forest walk begins — ease from here to the crab hold. */
  const mapBottleWalkStartPRef = useRef(null)
  const section4CueRef = useRef(null)
  /**
   * The lab's two holds (see SECTION4_HOLD_ROWS): the tracks and spacers
   * they stick through, and how far through each the reader is (0–1).
   */
  const labHoldsRef = useRef(null)
  const labBenchRef = useRef(null)
  const labTrackRef = useRef(null)
  const labInnerRef = useRef(null)
  const labSpacerRefs = useRef([])
  const section4RootRef = useRef(null)
  const labHoldRef = useRef({ h1: 0, h2: 0 })
  /** The lab's story lines; hidden once faded, so those sharing a spot don't take its clicks. */
  const labLineRefs = useRef([])
  const section4EnzymeLaneRef = useRef(null)
  const section4EnzymeRef = useRef(null)
  const section4RideRef = useRef(null)
  const section4BeefedRef = useRef(null)
  const section5RootRef = useRef(null)
  const section5LeadRef = useRef(null)
  const creamBottleMountRef = useRef(null)
  const creamBottleImgRef = useRef(null)
  const creamBottleStageRef = useRef(0)
  const creamBottleParkedRef = useRef(false)
  /** scrollY when the bottle first parks under the apps lead. */
  const creamBottleParkScrollYRef = useRef(null)
  /** Document Y (scrollY + viewport top) frozen at lock — scrolls with the art. */
  const creamBottleParkDocYRef = useRef(null)
  const ramp2BottleMountRef = useRef(null)
  /** scrollY when ramp-2 bottle activates (first bottle fully exited). */
  const ramp2StartScrollYRef = useRef(null)
  const chuteBottleMountRef = useRef(null)
  const chuteBottlePoseRef = useRef(null)
  const chuteBottleImgRef = useRef(null)
  const chuteBottleStage6Ref = useRef(false)
  const frontRootRef = useRef(null)
  const turtleRef = useRef(null)
  const conditionRowRef = useRef(null)
  const [conditionShine, setConditionShine] = useState(false)
  const [turtleOut, setTurtleOut] = useState(false)
  const turtleHqRef = useRef(null)
  const [turtleHqReady, setTurtleHqReady] = useState(false)
  const hexOverlapRef = useRef(null)
  const endingSlotRef = useRef(null)
  const endingBottleRef = useRef(null)
  const endingReleasedRef = useRef(false)
  const section5FoamRef = useRef(null)
  const section5SplashLayerRef = useRef(null)
  const chuteFoamBobPlayedRef = useRef(false)
  const startChuteSplashRef = useRef(() => {})
  const resetChuteSplashRef = useRef(() => {})
  const companionBubbleLayerRef = useRef(null)
  const companionBubbleLastTsRef = useRef(0)
  const companionLastScrollYRef = useRef(0)
  const companionScrollActRef = useRef(0)
  const companionBubbleStateRef = useRef(
    COMPANION_BUBBLE_SPECS.map((spec, i) => ({
      ...spec,
      mode: "follow",
      x: null,
      y: null,
      arrived: false,
      riseT: 0,
      fromX: 0,
      fromY: 0,
      driftX: (i % 2 === 0 ? 1 : -1) * (1.15 + (i % 3) * 0.35),
      cooldown: 2200 + i * 1500,
      phase: i * 0.85,
      spawnT: 0,
    })),
  )
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
  const ecosystemMapRef = useRef(null)
  /** The map's slides have played and its hold has been dropped. */
  const mapReleasedRef = useRef(false)
  /** The map hold's scroll range while it is armed, for the wheel soft-cap. */
  const mapHoldRangeRef = useRef(null)
  // Before any scroll effect runs: the beats this visit already played.
  useLayoutEffect(() => {
    const played = readPlayedBeats()
    if (played.map) mapReleasedRef.current = true
    if (played.walk) {
      walkReleasedRef.current = true
      birdStealPRef.current = played.steal ?? 1
    }
  }, [])
  const shoreBottlePlayedRef = useRef(false)
  const shoreBottleMountRef = useRef(null)
  const shoreBottleProgressRef = useRef(0)
  const shoreBottleGateRef = useRef(0)
  /** True after the sky bottle finishes its waterfall sink (near-bottom unpin). */
  const skyBottleHasSunkRef = useRef(false)
  /** Keep the overlay bottle hidden after sink so it cannot reappear through the fall. */
  const skyBottleHiddenRef = useRef(false)
  /** Splash plays once per sink; reset when the sky bottle is restored. */
  const splashPlayedRef = useRef(false)
  const bottleSinkMotionRef = useRef(null)
  const bottleVisualRef = useRef(null)
  const [logoLanded, setLogoLanded] = useState(false)
  const heroLogoRef = useRef(null)
  const homeNavMountRef = useRef(null)
  const [bottleTouchPinned, setBottleTouchPinned] = useState(false)
  const [shoreBottlePlaying, setShoreBottlePlaying] = useState(false)
  const [splashPlaying, setSplashPlaying] = useState(false)
  /** The forest copy band (its `data-arrived` swaps the dataset line out). */
  const forestTextBandRef = useRef(null)
  const labLiveTimerRef = useRef(0)
  const reduceMotionParallaxRef = useRef(false)

  bottleTouchPinnedRef.current = bottleTouchPinned

  // Warm the cache with every bottle stage so the cream bottle's stage swaps
  // never flash an empty frame.
  useEffect(() => {
    for (const src of BOTTLE_STAGE_ORDER) {
      const img = new Image()
      img.decoding = "async"
      img.src = src
    }
  }, [])

  // Condition cards: shine once as they scroll into view; re-arm once
  // they're fully out of view so the next pass shines again.
  useEffect(() => {
    const el = conditionRowRef.current
    if (!el || typeof IntersectionObserver === "undefined") return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) setConditionShine(true)
        else if (!entry.isIntersecting) setConditionShine(false)
      },
      { threshold: [0, 0.6] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The sharp turtle may have loaded before hydration (its onLoad missed).
  useEffect(() => {
    const img = turtleHqRef.current
    if (img?.complete && img.naturalWidth > 0) setTurtleHqReady(true)
  }, [])

  // Turtle surfaces once his spot is well into view and stays out (floating)
  // while it's on screen or above it; with his spot back below the view
  // (reader scrolled up above his section) he tucks away to resurface later.
  useEffect(() => {
    const el = turtleRef.current
    if (!el) return undefined
    let raf = 0
    const check = () => {
      raf = 0
      const top = el.getBoundingClientRect().top
      setTurtleOut(top < window.innerHeight * TURTLE_SURFACE_VIEW_Y)
    }
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(check)
    }
    check()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    // The painting loads after mount; re-check once it has its real height.
    const ro =
      typeof ResizeObserver !== "undefined" && compositionRef.current
        ? new ResizeObserver(schedule)
        : null
    ro?.observe(compositionRef.current)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      ro?.disconnect()
    }
  }, [])

  // Decode the underwater section's images while idle, so the first scroll
  // through the chute/splash doesn't decode them mid-animation.
  useEffect(() => {
    const decodeAll = () =>
      section5RootRef.current
        ?.querySelectorAll("img")
        .forEach(img => img.decode?.().catch(() => {}))
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(decodeAll, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const t = window.setTimeout(decodeAll, 2000)
    return () => window.clearTimeout(t)
  }, [])

  // Copy sizes (artPx) track the painted art's width, not the viewport's.
  useLayoutEffect(() => {
    const root = frontRootRef.current
    const art = compositionRef.current
    if (!root || !art) return undefined
    const sync = () => {
      root.style.setProperty(
        ART_WIDTH_VAR,
        `${art.getBoundingClientRect().width}px`,
      )
    }
    sync()
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", sync)
      return () => window.removeEventListener("resize", sync)
    }
    const ro = new ResizeObserver(sync)
    ro.observe(art)
    return () => ro.disconnect()
  }, [])

  // Loader → hero handoff: the loader's logo springs into the hero's painted
  // logo box, then the hero loop resumes from the loader's frozen frame.
  const logoHandoff = useCallback(
    () => ({
      getRect: () => {
        const el = heroLogoRef.current
        if (!el) return null
        const r = el.getBoundingClientRect()
        const sx = r.width / LOGO_PLATE.w
        const sy = r.height / LOGO_PLATE.h
        return {
          left: r.left + LOGO_BOX.x * sx,
          top: r.top + LOGO_BOX.y * sy,
          width: LOGO_BOX.w * sx,
          height: LOGO_BOX.h * sy,
          bottom: r.top + (LOGO_BOX.y + LOGO_BOX.h) * sy,
        }
      },
      onLand: phaseMs => {
        heroLogoRef.current
          ?.querySelectorAll("[data-logo-frame]")
          .forEach(frame => {
            frame.style.animation = "none"
            void frame.offsetWidth
            frame.style.animation = ""
            frame.style.animationDelay = `-${Math.round(phaseMs)}ms`
          })
        setLogoLanded(true)
      },
    }),
    [],
  )

  /**
   * The walk arriving (or backing out): flags on the forest composition that
   * the explorer, the "!", the revealed petamons and the RNAlab line style
   * themselves from, set straight on the DOM. As React state they re-rendered
   * the whole homepage right at the hand-off to the lab, which stuttered on
   * phones. The RNAlab highlight goes live once its slide-in has finished.
   */
  const applyWalkArrived = useCallback(arrived => {
    const root = compositionRef.current
    const band = forestTextBandRef.current
    window.clearTimeout(labLiveTimerRef.current)
    if (root) {
      if (arrived) root.dataset.walk = "arrived"
      else {
        delete root.dataset.walk
        delete root.dataset.labLive
      }
    }
    if (band) {
      if (arrived) band.dataset.arrived = "1"
      else delete band.dataset.arrived
    }
    if (!arrived) return
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    labLiveTimerRef.current = window.setTimeout(
      () => {
        if (walkArrivedRef.current && compositionRef.current) {
          compositionRef.current.dataset.labLive = "1"
        }
      },
      reduce ? 0 : RNALAB_REVEAL_MS,
    )
  }, [])
  useEffect(() => () => window.clearTimeout(labLiveTimerRef.current), [])

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
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false
    let touching = false
    let lastScrollAt = 0
    let settleTimer = 0
    let previousScrollY = window.scrollY
    const settled = () =>
      !coarse ||
      (!touching && performance.now() - lastScrollAt > TOUCH_SETTLE_MS)
    const tickWhenSettled = () => {
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(tick, TOUCH_SETTLE_MS + 30)
    }

    const tick = () => {
      const stack = stackRef.current
      const bottleSpot = bottleTouchRef.current
      const y = window.scrollY
      const scrollingUp = y < previousScrollY
      previousScrollY = y

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
        setBottleTouchPinned(false)
        // Fall through — still run parallax / shore rematch this frame.
      }

      if (stack) {
        const rect = stack.getBoundingClientRect()
        // Set on the DOM, not as state: no re-render of the page to pin it.
        const nav = homeNavMountRef.current
        const pinned = rect.top < 0 && rect.bottom > 0
        if (nav && (nav.dataset.pinned === "1") !== pinned) {
          if (pinned) nav.dataset.pinned = "1"
          else delete nav.dataset.pinned
        }
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
      const mapPx = reduceWalk ? 0 : window.innerHeight * (MAP_HOLD_VH / 100)
      let mapProgress = 1
      mapHoldRangeRef.current = null
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
        // Pin with the Logan paragraph whole under the nav when it and the map
        // both fit; otherwise tuck the paragraph behind the nav, so the slide
        // title is the first line, a clear gap under the bar. Never a line cut
        // in half by the nav.
        const navBottom = homeNavMountRef.current?.offsetHeight ?? 75
        const withParagraph =
          navBottom + MAP_PIN_NAV_GAP + LOGAN_TOP_ABOVE_MAP * artW
        const mapBandTop =
          withParagraph + MAP_PAINT_BELOW_TOP * artW <= window.innerHeight
            ? withParagraph
            : navBottom + LOGAN_BOTTOM_ABOVE_MAP * artW
        const mapPinY = Math.max(0, WORLD_MAP_TOP * artH - mapBandTop)
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
          const trackDocTop = track.getBoundingClientRect().top + y
          const mapPinAt = trackDocTop + mapPinY
          // Re-arm above the map, as the walk does above the forest.
          if (mapReleasedRef.current && scrollingUp && y < mapPinAt - 32) {
            mapReleasedRef.current = false
            savePlayedBeats({
              map: false,
              walk: walkReleasedRef.current,
              steal: birdStealPRef.current,
            })
          }
          if (!mapReleasedRef.current && y > mapPinAt + mapPx) {
            if (!settled()) tickWhenSettled()
            else {
              // Past the end of the hold: drop its scroll length and pull the
              // scroll back by the same amount so nothing on screen moves.
              mapReleasedRef.current = true
              savePlayedBeats({
                map: true,
                walk: walkReleasedRef.current,
                steal: birdStealPRef.current,
              })
              ecosystemMapRef.current?.update(1)
              previousScrollY = y - mapPx
              window.scrollTo({ top: y - mapPx, left: 0, behavior: "instant" })
              return tick()
            }
          }
          const mapHoldPx = mapReleasedRef.current ? 0 : mapPx
          if (!mapReleasedRef.current && mapPx > 0) {
            mapHoldRangeRef.current = { start: mapPinAt, end: mapPinAt + mapPx }
          }
          mapProgress = mapReleasedRef.current
            ? 1
            : clamp01((y - mapPinAt) / Math.max(1, mapPx))
          const pinAt = trackDocTop + forestPinY + mapHoldPx
          // Re-arm above the forest, where adding the hold is below the reader.
          // Do not reset during restoration of a saved position farther down.
          if (walkReleasedRef.current && scrollingUp && y < pinAt - 32) {
            walkReleasedRef.current = false
            walkLatchedRef.current = false
            birdStealPRef.current = 0
            savePlayedBeats({
              map: mapReleasedRef.current,
              walk: false,
              steal: 0,
            })
          }
          if (walkReleasedRef.current) {
            // The whole beat ran to completion before unpin — keep it that way,
            // so scrolling back up here is just an ordinary scroll.
            walkProgress = 1
            walkLatchedRef.current = true
            stealProgress = birdStealPRef.current
            track.style.height = `${artH + mapHoldPx}px`
            if (mapHoldPx > 0) {
              // Walk played on an earlier pass; the map was re-armed above it.
              painting.style.left = "0px"
              painting.style.width = "100%"
              if (y < mapPinAt) {
                painting.style.position = "absolute"
                painting.style.top = "0px"
              } else if (y <= mapPinAt + mapHoldPx) {
                painting.style.position = "fixed"
                painting.style.top = `${-mapPinY}px`
              } else {
                painting.style.position = "absolute"
                painting.style.top = `${mapHoldPx}px`
              }
            } else {
              painting.style.position = "relative"
              painting.style.top = "0px"
              painting.style.left = ""
              painting.style.width = ""
            }
          } else {
            track.style.height = `${artH + mapHoldPx + freezePx}px`
            walkProgress = Math.max(
              0,
              Math.min(1, (y - pinAt) / Math.max(1, walkPx)),
            )
            // Tracks the scroll in both directions: backing out of the pin
            // before the beat is spent rewinds the walk, the reveal, and the
            // steal. Only clearing the pin entirely (below) locks it in.
            walkLatchedRef.current = walkProgress >= 0.995
            stealProgress =
              holdPx > 0 ? clamp01((y - (pinAt + walkPx)) / holdPx) : 0
            birdStealPRef.current = stealProgress
            painting.style.left = "0px"
            painting.style.width = "100%"
            const walkPlayed = walkLatchedRef.current && y > pinAt + freezePx
            if (walkPlayed && !settled()) tickWhenSettled()
            if (walkPlayed && settled()) {
              walkReleasedRef.current = true
              savePlayedBeats({
                map: mapReleasedRef.current,
                walk: true,
                steal: stealProgress,
              })
              window.scrollTo({
                top: y - freezePx,
                left: 0,
                behavior: "instant",
              })
              track.style.height = `${artH + mapHoldPx}px`
              painting.style.position = "relative"
              painting.style.top = "0px"
              painting.style.left = ""
              painting.style.width = ""
            } else if (y < mapPinAt) {
              painting.style.position = "absolute"
              painting.style.top = "0px"
            } else if (y <= mapPinAt + mapHoldPx) {
              painting.style.position = "fixed"
              painting.style.top = `${-mapPinY}px`
            } else if (y < pinAt) {
              painting.style.position = "absolute"
              painting.style.top = `${mapHoldPx}px`
            } else if (y <= pinAt + freezePx) {
              painting.style.position = "fixed"
              painting.style.top = `${-forestPinY}px`
            } else {
              painting.style.position = "absolute"
              painting.style.top = `${mapHoldPx + freezePx}px`
            }
          }
        }
        ecosystemMapRef.current?.update(mapProgress)
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
            applyWalkArrived(latched)
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
            const birdX = ((STEAL_BIRD.originX + STEAL_BIRD.xPct) / 100) * artW
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
            const grabY = paintRect.top + bottleY - STEAL_GRAB_LIFT_FRAC * artW

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
        // Back above where it pins: judged by where its spot is on the page
        // now, not by the scroll it pinned at. That goes stale when the page
        // grows after (as its art loads, coming back to it), which left it
        // pinned mid-screen over the sky at the top.
        const slice = bottleSpot?.parentElement
        const sliceRect = slice?.getBoundingClientRect()
        const homeMidY = sliceRect
          ? sliceRect.top +
            BOTTLE_TOP_FRAC * sliceRect.height +
            bottleSpot.offsetHeight / 2
          : -Infinity
        if (homeMidY > window.innerHeight / 2 + BOTTLE_PIN_SCROLL_UP_LEAVE) {
          const flip = bottleFlipRef.current
          if (flip) {
            flipUnpinFirstRef.current = flip.getBoundingClientRect()
          } else {
            flipUnpinFirstRef.current = null
          }
          restoreSkyBottle()
          bottleTouchPinnedRef.current = false
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
              1 -
                (p - MAP_BOTTLE_FADE_P) / Math.max(1e-6, 1 - MAP_BOTTLE_FADE_P),
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

      // The lab's holds: how far through each the reader is. The lab sticks
      // in its inner track while the first spacer goes by, then the inner
      // track sticks in the next while the second does, and so on out.
      const labHolds = labHoldsRef.current
      const labBench = labBenchRef.current
      const labTrack = labTrackRef.current
      const labInner = labInnerRef.current
      const labRoot = section4RootRef.current
      const [labSpacer1, labSpacer2, labSpacer3, labSpacer4] =
        labSpacerRefs.current
      if (
        labHolds &&
        labBench &&
        labTrack &&
        labInner &&
        labRoot &&
        labSpacer4
      ) {
        const through = (stuckAt, top, spacer) =>
          clamp01((stuckAt - top) / Math.max(1, spacer.offsetHeight))
        // Through the first hold against the lab's unpanned top.
        const was = labHoldRef.current
        const h1 = through(
          (parseFloat(getComputedStyle(labRoot).top) || 0) - (was.pan || 0),
          labInner.getBoundingClientRect().top,
          labSpacer1,
        )
        // How far the window overflows the screen under the header (see LAB_PAN).
        const vh = window.innerHeight
        const headerH =
          parseFloat(LAB_HEADER_HALF) *
          2 *
          parseFloat(getComputedStyle(document.documentElement).fontSize)
        const over =
          window.innerWidth <= PHONE_MAX
            ? 0
            : Math.max(
                0,
                (labRoot.offsetWidth *
                  (SECTION4_WINDOW[3] - SECTION4_WINDOW[1])) /
                  SECTION4_PLATE.w +
                  2 * LAB_PAN_MARGIN -
                  (vh - headerH),
              )
        const pan = Math.round(
          over / 2 -
            over *
              smoothstep(
                clamp01((h1 - LAB_PAN[0]) / (LAB_PAN[1] - LAB_PAN[0])),
              ),
        )
        const stuck2 = parseFloat(getComputedStyle(labInner).top) || 0
        const track2 = labTrack.getBoundingClientRect().top
        const h2 = through(stuck2, track2, labSpacer2)
        // Scrolled on past the second hold (px), as the enzyme shrinks back.
        const past = Math.max(0, stuck2 - track2 - labSpacer2.offsetHeight)
        const h3 = through(
          parseFloat(getComputedStyle(labTrack).top) || 0,
          labBench.getBoundingClientRect().top,
          labSpacer3,
        )
        const h4 = through(
          parseFloat(getComputedStyle(labBench).top) || 0,
          labHolds.getBoundingClientRect().top,
          labSpacer4,
        )
        if (
          h1 !== was.h1 ||
          h2 !== was.h2 ||
          h3 !== was.h3 ||
          h4 !== was.h4 ||
          past !== was.past ||
          pan !== was.pan
        ) {
          labHoldRef.current = { h1, h2, h3, h4, past, pan }
          labRoot.style.setProperty("--lab-hold-1", h1.toFixed(4))
          labRoot.style.setProperty("--lab-hold-2", h2.toFixed(4))
          labRoot.style.setProperty("--lab-hold-3", h3.toFixed(4))
          labRoot.style.setProperty("--lab-hold-4", h4.toFixed(4))
          labRoot.style.setProperty("--lab-pan", `${pan}px`)
          // The Wet Lab axolotl pops up, then jumps (LabBench).
          const stage = wetStage(h3)
          if (labRoot.dataset.wetStage !== stage)
            labRoot.dataset.wetStage = stage
          for (const line of labLineRefs.current) {
            if (!line) continue
            const shown = parseFloat(getComputedStyle(line).opacity) > 0.02
            line.style.visibility = shown ? "" : "hidden"
          }
        }
      }

      // Lab enzyme: fades in where the constellation shrinks into it at the
      // end of the second hold and follows the reader (sticky) down to the
      // Wet Lab shelf, where it drops into the blue beaker. Phones: it slides
      // from beside the lines to the middle before the hold ends.
      const enzymeLane = section4EnzymeLaneRef.current
      const enzyme = section4EnzymeRef.current
      const bottleCue = section4CueRef.current
      const onPhone = window.innerWidth <= PHONE_MAX
      const { h2 = 0, h3 = 0, h4 = 0, past = 0 } = labHoldRef.current
      const plateK = labRoot ? labRoot.offsetWidth / SECTION4_PLATE.w : 1
      if (enzymeLane && enzyme) {
        const vh = window.innerHeight
        // In over the constellation as it hands over (LabConstellation).
        const fadeIn = clamp01(
          (h2 - LAB_HANDOFF[0]) / (LAB_HANDOFF[1] - LAB_HANDOFF[0]),
        )
        // Taking over at the constellation's size, back to its own after.
        const big = onPhone ? LAB_ENZYME_BIG.phone : LAB_ENZYME_BIG.at
        const back = onPhone
          ? clamp01(
              (h2 - LAB_PHONE_SLIDE[0]) /
                (LAB_PHONE_SLIDE[1] - LAB_PHONE_SLIDE[0]),
            )
          : clamp01(past / (vh * LAB_ENZYME_SHRINK_VH))
        const eased = smoothstep(back)
        const size = 1 + (big - 1) * (1 - eased)
        // Phones: across from its lane, beside the lines, to the middle.
        const laneMid = onPhone
          ? (SECTION4_PHONE_RIDE_LEFT / 100) * SECTION4_PLATE.w +
            SECTION4_ENZYME_PX.w / 2
          : (SECTION4_ENZYME_CROP.x / 100) * SECTION4_PLATE.w +
            SECTION4_ENZYME_PX.w / 2
        const across = onPhone ? (SECTION4_PLATE.w / 2 - laneMid) * eased : 0
        // Into the beaker: down into its liquid, shrinking to the stream
        // rider's size. It stays there till the beaker tips, then goes to its
        // spout, where the rider takes it on down the stream.
        const drop = smoothstep(
          clamp01((h3 - LAB_DROP[0]) / (LAB_DROP[1] - LAB_DROP[0])),
        )
        const tip = smoothstep(
          clamp01((h3 - WET_TIP[0]) / (WET_TIP[1] - WET_TIP[0])),
        )
        const [beakerX, beakerY] = SECTION4_BEAKER
        const toX = beakerX + (SECTION4_STREAM.x - beakerX) * tip
        const toY = beakerY + (SECTION4_STREAM.rows[0] - beakerY) * tip
        const dx = (across + (toX - (laneMid + across)) * drop) * plateK
        const dy = (toY - SECTION4_BENCH_ROWS[0]) * drop * plateK
        const opacity = h3 < LAB_RIDE_FROM ? fadeIn : 0
        const scale = size * (1 - (1 - SECTION4_RIDE_SCALE) * drop)
        enzyme.style.opacity = String(opacity)
        enzyme.style.transform = `translate3d(${dx.toFixed(1)}px, calc(-50% + ${dy.toFixed(1)}px), 0) scale(${scale.toFixed(4)})`
        enzyme.style.visibility = opacity > 0.01 ? "visible" : "hidden"
      }

      // The enzyme riding the stream: at its spout once the beaker pours,
      // then down it as the reader scrolls on, reaching the vessel as the
      // bench's hold starts, and into it.
      const ride = section4RideRef.current
      if (ride && labRoot) {
        const [fromRow, toRow] = SECTION4_STREAM.rows
        const shelfRow = SECTION4_BENCH_ROWS[0]
        const benchRow = benchHoldRow(window.innerHeight, plateK)
        const travel = clamp01(
          (window.innerHeight / 2 -
            shelfRow * plateK -
            labRoot.getBoundingClientRect().top) /
            Math.max(1, (benchRow - shelfRow) * plateK),
        )
        const row = fromRow + (toRow - fromRow) * travel
        const into = clamp01(h4 / LAB_RIDE_INTO)
        const opacity = (h3 >= LAB_RIDE_FROM ? 1 : 0) * (1 - into)
        ride.style.top = `${((row / SECTION4_PLATE.h) * 100).toFixed(3)}%`
        ride.style.opacity = String(opacity)
        ride.style.transform = `translate3d(0, -50%, 0) scale(${(1 - 0.6 * into).toFixed(3)})`
        ride.style.visibility = opacity > 0.01 ? "visible" : "hidden"
      }

      // The beefed-up PETase: pops out of the vessel in an arc to where it
      // lands, then follows the reader (sticky) until the next bottle rolls
      // in, and slams into it, where it sticks (the bottle's own copy takes
      // over, `data-stuck`).
      const beefed = section4BeefedRef.current
      const bottleMount = creamBottleMountRef.current
      if (beefed && bottleCue && bottleMount) {
        const vh = window.innerHeight
        const pop = smoothstep(
          clamp01((h4 - LAB_POP[0]) / (LAB_POP[1] - LAB_POP[0])),
        )
        const arc = Math.sin(Math.PI * pop)
        const [vx, vy] = SECTION4_VESSEL
        const [lx, ly] = SECTION4_BEEFED.land
        let dx = (vx - lx) * (1 - pop) * plateK
        let dy = ((vy - ly) * (1 - pop) - 70 * arc) * plateK
        let scale = 0.25 + 0.75 * pop + 0.15 * arc
        // Into the rolling bottle: held where it is while the bottle rolls
        // in (its lane scrolls away under it), then flung at the bottle's
        // copy (BottleBeefed: 50% across, 20% down, 76% wide), which it
        // reaches as the bottle stops rolling, upright.
        const rollStart = vh * CREAM_BOTTLE_ROLL_START_FRAC
        const roll = clamp01(
          (rollStart - bottleCue.getBoundingClientRect().top) /
            Math.max(1, rollStart - vh * CREAM_BOTTLE_ROLL_END_FRAC),
        )
        const fling = clamp01((roll - LAB_ONTO_BOTTLE) / (1 - LAB_ONTO_BOTTLE))
        const onto = fling * fling
        const stuck = roll >= 1
        if (roll > 0) {
          const lane = beefed.parentElement.getBoundingClientRect()
          const h = beefed.offsetHeight
          const stuckAt = vh / 2 - (benchHoldRow(vh, plateK) - ly) * plateK
          const home = Math.max(lane.top, stuckAt)
          const atY = Math.min(home, lane.bottom - h)
          const atX = lane.left + lane.width / 2
          const b = bottleMount.getBoundingClientRect()
          dy += home - atY
          dx += (b.left + b.width / 2 - atX) * onto
          dy += (b.top + b.height * 0.2 - home) * onto
          scale *=
            1 +
            ((bottleMount.offsetWidth * 0.76) / beefed.offsetWidth - 1) * onto
        }
        const opacity = stuck ? 0 : clamp01(pop * 5)
        beefed.style.opacity = String(opacity)
        beefed.style.transform = `translate3d(${dx.toFixed(1)}px, calc(-50% + ${dy.toFixed(1)}px), 0) scale(${scale.toFixed(3)})`
        beefed.style.visibility = opacity > 0.01 ? "visible" : "hidden"
        const stuckFlag = stuck ? "1" : ""
        if (bottleMount.dataset.stuck !== stuckFlag)
          bottleMount.dataset.stuck = stuckFlag
      }

      // Section4 bottle (enzyme attached): barrel-roll in as the lab's sand comes
      // up → sticky center → park under “Some applications include…” → hold →
      // tilt + slide down WWTP ramp.
      const creamBottle = creamBottleMountRef.current
      const appsLead = section5LeadRef.current
      if (creamBottle && bottleCue) {
        const vh = window.innerHeight
        const vw = window.innerWidth
        const cue = bottleCue.getBoundingClientRect()
        const startY = vh * CREAM_BOTTLE_ROLL_START_FRAC
        const endY = vh * CREAM_BOTTLE_ROLL_END_FRAC
        let rollP = (startY - cue.top) / Math.max(1, startY - endY)
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
          if (parkAt != null && y < parkAt - vh * CREAM_BOTTLE_UNPARK_VH) {
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
          firstExitP = Math.max(0, Math.min(1, (past - holdPx) / slidePx))
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
            slideEase * Math.hypot(vw, vh) * CREAM_BOTTLE_RAMP_DIST_FRAC
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
            cue.top + cue.height * CREAM_BOTTLE_ENTER_TEXT_FRAC,
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
            cue.top + cue.height * CREAM_BOTTLE_ENTER_TEXT_FRAC,
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

        // sky → section1 while rolling in, section2 → section3 down ramp 1.
        let stage
        if (creamBottleParkedRef.current) {
          if (firstExitP >= CREAM_BOTTLE_STAGE3_AT) stage = 3
          else if (firstExitP >= CREAM_BOTTLE_STAGE2_AT) stage = 2
          else stage = 1
        } else {
          stage = rollP >= CREAM_BOTTLE_STAGE1_AT ? 1 : 0
        }
        if (stage !== creamBottleStageRef.current) {
          creamBottleStageRef.current = stage
          if (creamBottleImgRef.current) {
            creamBottleImgRef.current.src = BOTTLE_STAGE_ORDER[stage]
          }
        }

        creamBottle.style.left = `${leftPx}px`
        creamBottle.style.top = `${topPx}px`
        creamBottle.style.opacity = String(opacity)
        creamBottle.style.visibility = opacity > 0.02 ? "visible" : "hidden"
        creamBottle.style.transformOrigin = transformOrigin

        // Ramp-2 bottle (section4): same slope as ramp 1. Arms the frame bottle 1
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
          // Capped so it's off the ramp before the chute bottle leaves the
          // pipe (on phones the chute comes sooner after ramp 2 starts).
          const s5Box = section5.getBoundingClientRect()
          const chuteArmScroll =
            y +
            s5Box.top +
            (CHUTE_KEYS[0].y / 100) * s5Box.height -
            window.innerHeight * CHUTE_ARM_VIEW_Y
          const ramp2Span = Math.max(
            1,
            Math.min(
              artScrollSpan(
                RAMP2_SLIDE_VH,
                section5RootRef.current?.offsetWidth || window.innerWidth,
              ),
              ramp2Start == null ? Infinity : chuteArmScroll - ramp2Start,
            ),
          )
          const ramp2P = ramp2Start == null ? 0 : (y - ramp2Start) / ramp2Span

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
              Math.min(1, p / Math.max(1e-6, CREAM_BOTTLE_RAMP_TILT_FRAC)),
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
            else if (p >= 0.88) r2Op = Math.max(0, 1 - (p - 0.88) / 0.12)

            ramp2.style.left = `${r2Left}px`
            ramp2.style.top = `${r2Top}px`
            ramp2.style.transform = `translate3d(-50%, -50%, 0) rotate(${r2Rot}deg)`
            ramp2.style.opacity = String(r2Op)
            ramp2.style.visibility = r2Op > 0.02 ? "visible" : "hidden"
            ramp2.style.transformOrigin = "50% 40%"
          }
        }
      }

      // Chute bottle: masked by WWTP, art-locked down the stream, then
      // viewport-locked after impact so it keeps following scroll (waterfall).
      const chute = chuteBottleMountRef.current
      const chutePlate = section5RootRef.current
      if (chute && chutePlate) {
        const vh = window.innerHeight
        const s5 = chutePlate.getBoundingClientRect()
        const mouthY = s5.top + (CHUTE_KEYS[0].y / 100) * s5.height
        const span = artScrollSpan(CHUTE_SCROLL_VH, s5.width)
        const rawP = (vh * CHUTE_ARM_VIEW_Y - mouthY) / span
        const p = clamp01(rawP)
        const reduce =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const pathT = reduce ? (rawP > 0.2 ? 1 : 0) : chuteScrollToPath(p)
        const pose = chutePoseAt(pathT)
        let xPct = pose.x
        let yPct = pose.y
        if (!reduce && rawP > 1) {
          const extra = rawP - 1
          // Sinks with the water: drifts down the art at a fraction of the
          // scroll, so it moves with the page instead of sticking to the view.
          yPct =
            pose.y +
            extra * CHUTE_SINK_RATE * (span / Math.max(1, s5.height)) * 100
          xPct = pose.x + Math.sin(extra * 1.35) * 1.15
        }
        let left = s5.left + (xPct / 100) * s5.width
        const top = s5.top + (yPct / 100) * s5.height
        if (!reduce && rawP > 1) {
          // After the splash, drift over to the middle column as it sinks
          // (the wobble carries over).
          const c = easeInOutSine(clamp01((rawP - 1) / CHUTE_CENTER_SPAN))
          const wobble = Math.sin((rawP - 1) * 1.35) * 0.0115 * s5.width
          left += (window.innerWidth / 2 + wobble - left) * c
        }
        const onPlate = yPct > -4 && yPct < 160
        const inBand = s5.bottom > -vh * 0.2 && s5.top < vh * 1.35
        const show = onPlate && inBand
        chute.style.left = `${left}px`
        chute.style.top = `${top}px`
        // The mount is position:fixed inside the chute layer, so its own
        // z-index never leaves that layer. The layer has to rise. Foam
        // (z 11) stays in front through the splash. In the reef the layer
        // paints over the axolotls (also z 11), glow included. Copy is
        // z 12 and later in the tree, so it stays in front. The layer is
        // otherwise empty, so an axolotl that does not touch the bottle
        // still shows.
        const overReef = yPct >= 68
        const chuteZ = overReef ? "12" : String(CHUTE_Z)
        chute.style.zIndex = chuteZ
        if (chute.parentElement) chute.parentElement.style.zIndex = chuteZ
        // Rotation stays on the inner pose so this box stays axis-aligned.
        // The clip below is a horizontal cut in that box.
        chute.style.transform = "translate3d(-50%, -50%, 0)"
        chute.style.transformOrigin = "50% 50%"
        const poseEl = chuteBottlePoseRef.current
        if (poseEl) {
          poseEl.style.transform = `rotate(${pose.r}deg) scale(${pose.sx}, ${pose.sy})`
        }
        chute.style.opacity = show ? "1" : "0"
        chute.style.visibility = show ? "visible" : "hidden"
        chute.dataset.sunk = pathT >= 0.86 ? "1" : ""
        // The reef lift (z 12) also puts the bottle over the hex field.
        // The field's last fade is already the dark blue, so the cut is
        // a little above the fully opaque row. Above that line the bottle
        // still covers the axolotl. Below it, the bottle slides under.
        const hex = hexOverlapRef.current
        if (overReef && hex && hex.offsetHeight > 0) {
          const edge =
            hex.getBoundingClientRect().top +
            CHUTE_BLUE_EDGE * hex.offsetHeight
          const y = edge - chute.getBoundingClientRect().top
          chute.style.clipPath = `polygon(-150% -300%, 250% -300%, 250% ${y}px, -150% ${y}px)`
        } else {
          chute.style.clipPath = ""
        }

        const foam = section5FoamRef.current
        if (pathT < CHUTE_FOAM_BOB_RESET) {
          chuteFoamBobPlayedRef.current = false
          resetChuteSplashRef.current()
        } else if (
          !reduce &&
          show &&
          pathT >= CHUTE_FOAM_BOB_AT &&
          !chuteFoamBobPlayedRef.current
        ) {
          chuteFoamBobPlayedRef.current = true
          if (foam) {
            foam.dataset.impact = ""
            void foam.offsetWidth
            foam.dataset.impact = "1"
          }
          startChuteSplashRef.current()
        }

        const useStage6 = show && yPct >= CHUTE_STAGE6_Y_PCT
        if (useStage6 !== chuteBottleStage6Ref.current) {
          chuteBottleStage6Ref.current = useStage6
          const img = chuteBottleImgRef.current
          if (img) {
            img.src = useStage6
              ? BOTTLE_STAGES.section6
              : BOTTLE_STAGES.section5
          }
        }
      }

      // Ending bottle: assembles in place under the closing line as it
      // scrolls into view (no hold), then the petamons pop out. Pieces start
      // flying in as its slot enters the view and land once its bottom is
      // ENDING_ASSEMBLED_AT down the view. Once whole, it stays whole.
      const endingSlot = endingSlotRef.current
      const endingBottle = endingBottleRef.current
      if (endingSlot && endingBottle) {
        const vh = window.innerHeight
        const slot = endingSlot.getBoundingClientRect()
        const assemble =
          reduceMotionParallaxRef.current || endingReleasedRef.current
            ? 1
            : clamp01(
                (vh - slot.top) /
                  Math.max(1, vh * (1 - ENDING_ASSEMBLED_AT) + slot.height),
              )
        // Not saved with the played beats: there is no hold to skip on a
        // reload, so it plays again each time the page loads.
        if (assemble >= 1) endingReleasedRef.current = true
        endingBottle.update({
          assemble,
          burst: assemble >= 1 ? 1 : 0,
          // Lands where it is once whole (bottom at ENDING_ASSEMBLED_AT), not
          // mid-view, so the pieces don't jump when they reach it.
          arrivalShift:
            assemble >= 1
              ? 0
              : Math.max(0, slot.bottom - vh * ENDING_ASSEMBLED_AT),
        })
      }
    }

    const onScroll = () => {
      lastScrollAt = performance.now()
      tick()
    }
    // The map hold's soft-cap. Only the wheel is capped: moving the scroll
    // under a phone's coast stutters it, as with the releases above.
    let wheelBudget = 0
    let wheelBudgetAt = 0
    const onWheel = event => {
      const hold = mapHoldRangeRef.current
      if (!hold || event.ctrlKey || event.deltaY === 0) return
      const dy =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)
      const y = window.scrollY
      const down = dy > 0
      // Scroll up to the hold's edge is free; only travel inside it is capped.
      const free = Math.max(0, down ? hold.start - y : y - hold.end)
      if (down ? y + dy <= hold.start || y >= hold.end : y + dy >= hold.end || y <= hold.start)
        return
      event.preventDefault()
      const now = performance.now()
      const rate = window.innerHeight * (MAP_SCROLL_VH_PER_S / 100)
      wheelBudget = Math.min(
        rate * MAP_SCROLL_BURST_S,
        wheelBudget + (rate * (now - wheelBudgetAt)) / 1000,
      )
      wheelBudgetAt = now
      const step = Math.min(Math.abs(dy), free + wheelBudget)
      wheelBudget -= Math.max(0, step - free)
      if (step > 0) {
        window.scrollTo({ top: y + (down ? step : -step), left: 0, behavior: "instant" })
      }
    }
    const onTouch = event => {
      touching = event.touches.length > 0
      lastScrollAt = performance.now()
      if (!touching) tickWhenSettled()
    }

    tick()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", tick, { passive: true })
    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouch, { passive: true })
    window.addEventListener("touchend", onTouch, { passive: true })
    window.addEventListener("touchcancel", onTouch, { passive: true })
    const paintingEl = compositionRef.current
    const section5El = section5RootRef.current
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && (paintingEl || section5El)
        ? new ResizeObserver(() => tick())
        : null
    if (resizeObserver && paintingEl) resizeObserver.observe(paintingEl)
    if (resizeObserver && section5El) resizeObserver.observe(section5El)
    return () => {
      window.clearTimeout(settleTimer)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", tick)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouch)
      window.removeEventListener("touchend", onTouch)
      window.removeEventListener("touchcancel", onTouch)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [
    applyBottleSinkVisual,
    hideSkyBottle,
    restoreSkyBottle,
    triggerBottleSplash,
  ])

  // Splash droplets: ballistic burst from the pool hit, timed with the foam bob.
  useEffect(() => {
    if (typeof window === "undefined") return undefined
    let raf = 0
    let startAt = 0

    const nodes = () => {
      const layer = section5SplashLayerRef.current
      return layer ? layer.querySelectorAll("[data-splash]") : []
    }

    const hideAll = () => {
      nodes().forEach(el => {
        el.style.opacity = "0"
        el.style.visibility = "hidden"
      })
    }

    const stop = () => {
      if (raf) {
        window.cancelAnimationFrame(raf)
        raf = 0
      }
      startAt = 0
      hideAll()
    }

    const step = now => {
      raf = 0
      const layer = section5SplashLayerRef.current
      const plate = section5RootRef.current
      if (!layer || !startAt) return
      const s5 = plate ? plate.getBoundingClientRect() : null
      if (!s5 || s5.width < 1) {
        raf = window.requestAnimationFrame(step)
        return
      }
      const aspect = s5.height / s5.width
      let alive = false

      layer.querySelectorAll("[data-splash]").forEach(el => {
        const id = Number(el.getAttribute("data-splash"))
        const drop = SPLASH_LAUNCHES.find(item => item.id === id)
        if (!drop) return
        const t = now - startAt - CHUTE_SPLASH_LAUNCH_DELAY_MS - drop.delay
        if (t < 0) {
          el.style.opacity = "0"
          el.style.visibility = "hidden"
          alive = true
          return
        }
        const dragX = (1 - Math.exp(-SPLASH_DRAG * t)) / SPLASH_DRAG
        const x = SPLASH_IMPACT.x + drop.vx * dragX
        const y = SPLASH_IMPACT.y + drop.vy * t + 0.5 * SPLASH_GRAVITY * t * t
        const vyNow = drop.vy + SPLASH_GRAVITY * t
        const vxNow = drop.vx * Math.exp(-SPLASH_DRAG * t)
        const underFoam = y >= FOAM_BARRIER_Y_PCT + 0.2 && t > drop.tApex
        const done = underFoam || t > drop.tApex * 2.15 + 80
        if (done) {
          el.style.opacity = "0"
          el.style.visibility = "hidden"
          return
        }
        alive = true
        const appear = Math.min(1, t / 70)
        const fade =
          t > drop.tApex
            ? Math.max(0, 1 - (t - drop.tApex) / (drop.tApex * 1.05 + 40))
            : 1
        const angle = (Math.atan2(vyNow * aspect, vxNow) * 180) / Math.PI
        const speed = Math.hypot(vxNow, vyNow * aspect)
        const stretch = 1 + Math.min(0.28, speed * 9)
        const pop = t < 90 ? 0.62 + 0.38 * (t / 90) : 1
        el.style.opacity = String(appear * fade)
        el.style.visibility = "visible"
        const { crop } = drop
        el.style.transformOrigin = `${((drop.x - crop.x) / crop.w) * 100}% ${
          ((drop.y - crop.y) / crop.h) * 100
        }%`
        el.style.transform = `translate3d(${((x - drop.x) / 100) * s5.width}px, ${
          ((y - drop.y) / 100) * s5.height
        }px, 0) rotate(${angle}deg) scale(${pop * stretch}, ${
          pop / Math.sqrt(stretch)
        })`
      })

      if (alive) raf = window.requestAnimationFrame(step)
      else stop()
    }

    // Droplets stay hidden until impact, so decode them now rather than
    // on the impact frame.
    section5SplashLayerRef.current
      ?.querySelectorAll("img")
      .forEach(img => img.decode?.().catch(() => {}))

    startChuteSplashRef.current = () => {
      if (raf) window.cancelAnimationFrame(raf)
      startAt = performance.now()
      hideAll()
      raf = window.requestAnimationFrame(step)
    }
    resetChuteSplashRef.current = stop

    return () => {
      startChuteSplashRef.current = () => {}
      resetChuteSplashRef.current = () => {}
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  // Companion bubbles: cling under/around the chute bottle, idle-float, and
  // occasionally detach toward the foam, then respawn at the bottle.
  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let running = true
    let active = false

    const step = now => {
      raf = 0
      if (!running || !active) return
      const chute = chuteBottleMountRef.current
      const plate = section5RootRef.current
      const layer = companionBubbleLayerRef.current
      const companions = companionBubbleStateRef.current
      if (!chute || !plate || !layer || !companions) {
        raf = window.requestAnimationFrame(step)
        return
      }

      const s5 = plate.getBoundingClientRect()

      const primed = companionBubbleLastTsRef.current !== 0
      const last = companionBubbleLastTsRef.current || now
      const dt = Math.min(64, Math.max(0, now - last))
      companionBubbleLastTsRef.current = now

      const scrollY = window.scrollY
      const prevScrollY = companionLastScrollYRef.current
      companionLastScrollYRef.current = scrollY
      const instSpeed = !primed
        ? 0
        : Math.abs(scrollY - prevScrollY) / Math.max(1, dt)
      let activity = companionScrollActRef.current
      if (instSpeed > 0.035) {
        activity = Math.min(1, activity + dt / 80)
      } else {
        activity = Math.max(0, activity - dt / 240)
      }
      companionScrollActRef.current = activity
      const detachRate = 0.42 + activity * 2.7
      const maxRising = activity > 0.3 ? 2 : 1

      const bottleRect = chute.getBoundingClientRect()
      const bottleCxPct =
        ((bottleRect.left + bottleRect.width * 0.5 - s5.left) /
          Math.max(1, s5.width)) *
        100
      const bottleCyPct =
        ((bottleRect.top + bottleRect.height * 0.5 - s5.top) /
          Math.max(1, s5.height)) *
        100
      const bottleBottomPct =
        ((bottleRect.bottom - s5.top) / Math.max(1, s5.height)) * 100
      const chuteVisible = chute.style.visibility !== "hidden"
      const inWater =
        chuteVisible &&
        bottleCyPct >= FOAM_BARRIER_Y_PCT + 0.8 &&
        bottleCyPct < 92

      if (bottleCyPct < 48) {
        companions.forEach((c, i) => {
          c.mode = "follow"
          c.x = null
          c.y = null
          c.arrived = false
          c.riseT = 0
          c.spawnT = 0
          c.cooldown = COMPANION_DETACH_MS + i * 1500
        })
      }

      let rising = companions.filter(c => c.mode === "rise").length
      if (inWater && !reduce) {
        for (const c of companions) {
          if (c.mode === "follow" && c.arrived && !c.cushion) {
            c.cooldown = (c.cooldown || 0) - dt * detachRate
          }
          if (
            c.mode === "follow" &&
            c.arrived &&
            !c.cushion &&
            c.cooldown <= 0 &&
            rising < maxRising
          ) {
            c.mode = "rise"
            c.arrived = false
            c.riseT = 0
            c.fromX = c.x
            c.fromY = c.y
            rising += 1
          }
        }
      }

      const nodes = layer.querySelectorAll("[data-companion]")
      nodes.forEach(el => {
        const id = Number(el.getAttribute("data-companion"))
        const c = companions.find(item => item.id === id)
        const painted = BUBBLE_PLATES[id]
        if (!c || !painted) return
        if (!inWater) {
          el.style.opacity = "0"
          el.style.visibility = "hidden"
          el.dataset.arrived = ""
          return
        }
        const targetX = bottleCxPct + c.ox
        const targetY = (c.cushion ? bottleBottomPct : bottleCyPct) + c.oy
        const wobX = reduce ? 0 : Math.sin(now / 640 + c.phase) * 0.42
        const wobY = reduce ? 0 : Math.cos(now / 780 + c.phase) * 0.28
        let tx
        let ty
        let opacity = 0.92
        if (c.mode === "rise" && !reduce) {
          c.riseT += dt
          const u = Math.min(1, c.riseT / COMPANION_RISE_MS)
          const ease = 1 - (1 - u) * (1 - u)
          tx = c.fromX + Math.sin(u * Math.PI) * c.driftX
          ty = c.fromY + (FOAM_BARRIER_Y_PCT - 0.35 - c.fromY) * ease
          c.x = tx
          c.y = ty
          if (u > 0.86) opacity = 0.92 * (1 - (u - 0.86) / 0.14)
          if (u >= 1) {
            opacity = 0
            c.mode = "follow"
            c.arrived = false
            c.riseT = 0
            c.spawnT = 0
            c.x = targetX + c.driftX * 0.9
            c.y = targetY + 2.8 + (id % 3) * 0.35
            c.cooldown = COMPANION_DETACH_MS + 900 + (id % 5) * 500
          }
        } else {
          if (c.x == null || c.y == null) {
            c.x = targetX + Math.sin(c.phase) * 2.1
            c.y = targetY + 2.6 + (id % 3) * 0.45
            c.arrived = false
            c.spawnT = 0
          }
          if (reduce) {
            c.x = targetX
            c.y = targetY
            c.arrived = true
          } else {
            const k = 1 - Math.exp(-dt / Math.max(120, c.followMs || 400))
            c.x += (targetX - c.x) * k
            c.y += (targetY - c.y) * k
            c.arrived =
              Math.hypot(targetX - c.x, targetY - c.y) < COMPANION_ARRIVE_PCT
          }
          c.spawnT = Math.min(480, (c.spawnT || 0) + dt)
          tx = c.x
          ty = c.y
          if (c.arrived && !reduce) {
            tx += wobX
            ty += wobY + (c.cushion ? Math.sin(now / 900 + c.phase) * 0.12 : 0)
          }
          opacity = 0.92 * Math.min(1, c.spawnT / 280)
        }
        el.dataset.arrived = c.arrived ? "1" : ""
        el.style.opacity = String(opacity)
        el.style.visibility = opacity > 0.02 ? "visible" : "hidden"
        const [sx, sy] = bubbleShift(id, tx - painted.x, ty - painted.y)
        el.style.transform = `translate3d(${sx}%, ${sy}%, 0)`
      })

      if (running && active) raf = window.requestAnimationFrame(step)
    }

    const setActive = nextActive => {
      if (active === nextActive) return
      active = nextActive
      companionBubbleLastTsRef.current = 0
      companionLastScrollYRef.current = window.scrollY
      if (active && !raf) {
        raf = window.requestAnimationFrame(step)
      } else if (!active && raf) {
        window.cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const plate = section5RootRef.current
    const observer =
      plate && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            entries => setActive(entries.some(entry => entry.isIntersecting)),
            { rootMargin: "120px 0px" },
          )
        : null

    if (observer && plate) observer.observe(plate)
    else setActive(true)

    return () => {
      running = false
      if (observer) observer.disconnect()
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  // River bottle: time-based drift along SHORE_BOTTLE_PATH, pausing at each
  // gate until the bottle centroid is above the viewport midpoint.
  useEffect(() => {
    if (!shoreBottlePlaying || typeof window === "undefined") return undefined
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      const t = window.setTimeout(() => setShoreBottlePlaying(false), 2200)
      return () => window.clearTimeout(t)
    }

    shoreBottleProgressRef.current = 0
    shoreBottleGateRef.current = 0
    const mount = shoreBottleMountRef.current
    if (!mount) return undefined

    const applyPose = p => {
      const pose = shoreBottlePoseAt(p)
      mount.style.left = `${pose.left}%`
      mount.style.top = `${pose.top}%`
      mount.style.opacity = String(pose.opacity)
      mount.style.visibility = pose.opacity > 0.02 ? "visible" : "hidden"
    }

    const bottleAboveMid = () => {
      const r = mount.getBoundingClientRect()
      const midY = r.top + r.height * 0.5
      return midY <= window.innerHeight * SHORE_BOTTLE_GATE_VIEW_Y
    }

    const artW = compositionRef.current?.offsetWidth || ART_REF_W
    const driftMs =
      SHORE_BOTTLE_DRIFT_MS *
      Math.max(SHORE_BOTTLE_DRIFT_MIN_SCALE, Math.min(1, artW / ART_REF_W))

    applyPose(0)
    let last = performance.now()
    let raf = 0
    let finished = false

    const step = now => {
      if (finished) return
      const dt = Math.max(0, Math.min(64, now - last))
      last = now
      let p = shoreBottleProgressRef.current
      let gate = shoreBottleGateRef.current

      // Clear any gates already in front of the reader (or just reached).
      while (
        gate < SHORE_BOTTLE_GATES.length &&
        p >= SHORE_BOTTLE_GATES[gate]
      ) {
        if (bottleAboveMid()) {
          gate += 1
        } else {
          p = SHORE_BOTTLE_GATES[gate]
          break
        }
      }

      const blocked =
        gate < SHORE_BOTTLE_GATES.length && p >= SHORE_BOTTLE_GATES[gate]
      if (!blocked) {
        p = Math.min(1, p + dt / driftMs)
        // Don't skip through a gate on this frame — land on it and wait.
        if (gate < SHORE_BOTTLE_GATES.length && p >= SHORE_BOTTLE_GATES[gate]) {
          p = SHORE_BOTTLE_GATES[gate]
        }
      }

      shoreBottleProgressRef.current = p
      shoreBottleGateRef.current = gate
      applyPose(p)

      if (p >= 1) {
        finished = true
        setShoreBottlePlaying(false)
        return
      }
      raf = window.requestAnimationFrame(step)
    }

    raf = window.requestAnimationFrame(step)
    return () => {
      window.cancelAnimationFrame(raf)
      mount.style.left = ""
      mount.style.top = ""
      mount.style.opacity = ""
      mount.style.visibility = ""
    }
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
    <PetamonProvider>
      <WikiFrontRoot ref={frontRootRef}>
        <SiteLoader handoff={logoHandoff} always />
        <ScrollStack ref={stackRef}>
          <WalkTrack ref={walkTrackRef}>
            <CompositionRoot ref={compositionRef} data-autoplay-forest="">
              <BackScene>
                <BackClip>
                  <ParallaxBack ref={parallaxBackRef}>
                    <RailImg
                      src={ASSETS.back}
                      alt="Homepage background scenery"
                    />
                    <HqTop $part="back" aria-hidden="true" />
                  </ParallaxBack>
                </BackClip>
                <BirdsStack aria-hidden="true" data-birds="">
                  {BIRDS.map((bird, i) => (
                    <BirdParallax
                      key={bird.id}
                      $z={bird.z ?? (bird.depth === "front" ? 2 : 1)}
                      ref={el => {
                        birdParallaxRefs.current[i] = el
                      }}
                    >
                      <BirdHome style={birdHomeStyle(bird.home)}>
                        <BirdDrift
                          $enabled={!!bird.driftMs}
                          $durationMs={bird.driftMs || 36000}
                          $delayMs={bird.driftDelayMs || 0}
                        >
                          <BirdHoverMotion $delayMs={bird.delayMs}>
                            {bird.petamon && (
                              <BirdSpotAnchor
                                ref={hpBirdAnchorRef}
                                style={birdSpotStyle(bird.petamon.box)}
                              />
                            )}
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
                      </BirdHome>
                    </BirdParallax>
                  ))}
                </BirdsStack>
              </BackScene>

              <FlowSizer>
                <RailImg src={ASSETS.front} alt="" />
                <HqTop $part="front" aria-hidden="true" />
              </FlowSizer>

              <TurtleWindow
                ref={turtleRef}
                $out={turtleOut}
                aria-hidden="true"
                style={{
                  left: `${(TURTLE_CROP.x / FRONT_ART_WIDTH) * 100}%`,
                  top: `${(TURTLE_CROP.y / FRONT_ART_HEIGHT) * 100}%`,
                  width: `${(TURTLE_CROP.w / FRONT_ART_WIDTH) * 100}%`,
                  height: `${(TURTLE_CROP.h / FRONT_ART_HEIGHT) * 100}%`,
                }}
              >
                <TurtleSneak $out={turtleOut}>
                  <TurtleFloat $out={turtleOut}>
                    <PetamonAct
                      kind="lightning"
                      hitInset="0"
                      bolt="fan"
                      fanAt={{ x: 0.8, y: 0.28 }}
                    >
                    <TurtleImg
                      src={ASSETS.turtle}
                      alt=""
                      style={{
                        width: `${(FRONT_ART_WIDTH / TURTLE_CROP.w) * 100}%`,
                        left: `${(-TURTLE_CROP.x / TURTLE_CROP.w) * 100}%`,
                        top: `${(-TURTLE_CROP.y / TURTLE_CROP.h) * 100}%`,
                        visibility: turtleHqReady ? "hidden" : undefined,
                      }}
                    />
                    <TurtleHqImg
                      ref={turtleHqRef}
                      src={ASSETS.turtleHq}
                      alt=""
                      onLoad={() => setTurtleHqReady(true)}
                      style={{
                        width: `${(TURTLE_HQ_CROP.w / TURTLE_CROP.w) * 100}%`,
                        left: `${((TURTLE_HQ_CROP.x - TURTLE_CROP.x) / TURTLE_CROP.w) * 100}%`,
                        top: `${((TURTLE_HQ_CROP.y - TURTLE_CROP.y) / TURTLE_CROP.h) * 100}%`,
                        visibility: turtleHqReady ? undefined : "hidden",
                      }}
                    />
                    </PetamonAct>
                  </TurtleFloat>
                </TurtleSneak>
              </TurtleWindow>

              <HomePlaza hpAnchorRef={hpBirdAnchorRef} />

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
                      <LogoFloatWrap $landed={logoLanded}>
                        <LogoFlapper
                          ref={heroLogoRef}
                          aria-label="PETABITE"
                          $landed={logoLanded}
                        >
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
                        <CrabScuttle
                          originX={crab.originX}
                          originY={crab.originY}
                          label={`Crab ${crab.id}`}
                          metId={crab.bang ? `crab-${crab.id}` : undefined}
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
                          {crab.bang && (
                            <UntilMet id={`crab-${crab.id}`}>
                              <CrabBang
                                style={{
                                  left: `${crab.originX}%`,
                                  top: `${crab.originY}%`,
                                }}
                              >
                                <CrabBangImg src={CRAB_BANG_SRC} alt="" />
                              </CrabBang>
                            </UntilMet>
                          )}
                        </CrabScuttle>
                      </CrabMount>
                    ))}
                  </CrabsStack>
                  <ShoreBottleLayer $z={3}>
                    <ShoreBottleMount
                      ref={shoreBottleMountRef}
                      $playing={shoreBottlePlaying}
                    >
                      <ShoreBottleSize>
                        <ShoreBottleRock $playing={shoreBottlePlaying}>
                          <ShoreBottleImg
                            src={BOTTLE_STAGES.sky}
                            alt=""
                            style={{
                              clipPath: `inset(0 0 ${100 - SHORE_BOTTLE_WATERLINE_PCT}% 0)`,
                            }}
                          />
                          <ShoreBottleRipples
                            src={SHORE_BOTTLE_RIPPLES_IMG}
                            alt=""
                            style={{
                              clipPath: `inset(${SHORE_BOTTLE_WATERLINE_PCT}% 0 0 0)`,
                            }}
                          />
                        </ShoreBottleRock>
                      </ShoreBottleSize>
                    </ShoreBottleMount>
                  </ShoreBottleLayer>
                  <ShoreTextLayer $z={4}>
                    <ShorePetaseMount>
                      <ShorePetaseBody>
                        To fight the growing accumulation of microplastics
                        everywhere, we&apos;re revolutionizing the field of
                        plastic-degrading enzymes.
                      </ShorePetaseBody>
                    </ShorePetaseMount>
                    <ShoreTextMount>
                      <ShoreBody>
                        <ExplainTerm
                          term="PETases"
                          explanation={PETASE_EXPLANATION}
                          plain
                        />{" "}
                        are enzymes capable of degrading polyethylene
                        terephthalate (PET). Current PETases used in the plastic
                        degradation industry have a major limitation:
                      </ShoreBody>
                    </ShoreTextMount>
                    <ShoreMidTextMount>
                      <ShoreMidBody>
                        they only function under highly specific conditions…
                      </ShoreMidBody>
                    </ShoreMidTextMount>
                    <ShoreCardsMount>
                      <SwipeInBox
                        stationary
                        title="…their efficacy is dictated by which pH, temperature, and environment they optimally function in."
                      >
                        <ConditionImageRow
                          ref={conditionRowRef}
                          data-shine={conditionShine ? "1" : undefined}
                        >
                          {CONDITION_CARD_IMAGES.map(image => (
                            // The card itself is the link (not wrapped in
                            // one), so the shine's :nth-child stagger holds.
                            <ConditionFigure
                              key={image.alt}
                              as="a"
                              href={withPrefix(image.href)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${image.alt}: BioSample Metadata Profiles`}
                            >
                              <ConditionImageWrap>
                                <ConditionImage
                                  src={image.src}
                                  alt={image.alt}
                                />
                                <CardShine
                                  aria-hidden="true"
                                  $src={image.src}
                                />
                              </ConditionImageWrap>
                              <ConditionCaption as="span">
                                {image.alt}
                              </ConditionCaption>
                            </ConditionFigure>
                          ))}
                        </ConditionImageRow>
                      </SwipeInBox>
                    </ShoreCardsMount>
                    <ShoreLoganMount>
                      <ShoreLoganBody>
                        To find PETases that work across a wider range of
                        conditions, our team is using the{" "}
                        <ExplainTerm
                          term="Logan"
                          explanation={LOGAN_EXPLANATION}
                          plain
                        />{" "}
                        index (developed by our advisory lab, the RNAlab at UofT
                        and collaborators): a planetary-scale genome search that
                        can discover novel plastic-degrading enzymes. This
                        grants us the ability to find PETases from all over the
                        world.
                      </ShoreLoganBody>
                    </ShoreLoganMount>
                  </ShoreTextLayer>
                </ShoreOverlayStack>
              </ArtBand>

              <ArtBand
                $top={WORLD_MAP_TOP}
                $height={WORLD_MAP_HEIGHT}
                $z={10}
              >
                <HomeEcosystemMap ref={ecosystemMapRef} />
              </ArtBand>

              <ArtBand
                ref={mapBottleBandRef}
                $top={MAP_BOTTLE_BAND_TOP}
                $height={MAP_BOTTLE_BAND_HEIGHT}
                $z={11}
              >
                <MapBottleLayer aria-hidden="true">
                  <MapBottleMount ref={mapBottleMountRef}>
                    <MapBottleRock>
                      <MapBottleImg
                        ref={mapBottleImgRef}
                        src={BOTTLE_STAGES.sky}
                        alt=""
                      />
                    </MapBottleRock>
                  </MapBottleMount>
                </MapBottleLayer>
              </ArtBand>

              <ArtBand
                $top={FOREST_BAND_TOP}
                $height={FOREST_BAND_HEIGHT}
                $z={3}
              >
                <ForestAnimalsStack aria-hidden="true">
                  {SECTION3_ANIMALS.filter(animal => !animal.loop).map(animal => (
                    <ForestCritter
                      key={animal.id}
                      animal={animal}
                      stealRef={birdStealRef}
                    />
                  ))}
                </ForestAnimalsStack>
                {/* Same pixels as the right trunk, above the axolotl (z 2)
                    so the slide goes under the bark. Birds stay in a higher band. */}
                <TrunkCover aria-hidden="true">
                  <img src={ASSETS.front} alt="" />
                </TrunkCover>
              </ArtBand>

              <ArtBand
                $top={FOREST_BAND_TOP}
                $height={FOREST_BAND_HEIGHT}
                $z={6}
              >
                {FOREST_PETAMONS.map(pet => (
                  <PetamonReveal
                    key={pet.id}
                    $placed
                    style={petamonSpotStyle(pet.box)}
                    aria-hidden="true"
                  >
                    <PetamonAct kind="acorn" head={pet.head} hitInset="4%">
                      <img src={pet.src} alt="" draggable={false} />
                    </PetamonAct>
                  </PetamonReveal>
                ))}
              </ArtBand>

              <ArtBand
                $top={FOREST_BAND_TOP}
                $height={FOREST_BAND_HEIGHT}
                $z={7}
              >
                <ForestAnimalsStack $pass aria-hidden="true">
                  {SECTION3_ANIMALS.filter(animal => animal.loop).map(animal => (
                    <ForestCritter
                      key={animal.id}
                      animal={animal}
                      stealRef={birdStealRef}
                    />
                  ))}
                </ForestAnimalsStack>
              </ArtBand>

              <ArtBand
                $top={FOREST_BAND_TOP}
                $height={FOREST_BAND_HEIGHT}
                $z={20}
              >
                <HumanWalkLayer ref={humanWalkRef} aria-hidden="true">
                  <HumanBob ref={humanBobRef}>
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
                            <ExclamationPop>
                              <StaticPlateImg src={EXCLAMATION_SRC} alt="" />
                            </ExclamationPop>
                          </ExclamationMark>
                          <HumanPose>
                            <StaticPlateImg src={HUMAN.src} alt="" />
                          </HumanPose>
                          <HumanPose $arrivedPose $fill>
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
                ref={forestTextBandRef}
              >
                <ForestDatasetMount ref={forestDatasetRef}>
                  <ForestDatasetBody>
                    Before, the field consisted of roughly 495 known
                    plastic-degrading enzymes.
                  </ForestDatasetBody>
                </ForestDatasetMount>
                <ForestRnalabMount>
                  <ForestDatasetBody>
                    Using Logan, we found <BigFigure>300 million</BigFigure>{" "}
                    unique candidate enzymes. That&apos;s a{" "}
                    <BigFigure>600,000-fold increase</BigFigure> in enzyme
                    diversity.
                  </ForestDatasetBody>
                </ForestRnalabMount>
              </ArtBand>

              <BushLayer>
                <RailImg src={ASSETS.bush} alt="" />
              </BushLayer>
            </CompositionRoot>
          </WalkTrack>

          <Section4HoldTrack ref={labHoldsRef}>
            <Section4HoldBench ref={labBenchRef} $hold={3}>
              <Section4HoldBench ref={labTrackRef} $hold={2}>
                <Section4HoldInner ref={labInnerRef}>
                  <Section4Root ref={section4RootRef}>
                    <RailImg src={SECTION4_ASSETS.bg} alt="" />
                    <Section4Layer $z={2} src={SECTION4_ASSETS.umap} alt="" />
                    <Section4Sky
                      holdRef={labHoldRef}
                      style={{
                        left: `${(SECTION4_WINDOW[0] / SECTION4_PLATE.w) * 100}%`,
                        top: `${(SECTION4_WINDOW[1] / SECTION4_PLATE.h) * 100}%`,
                        width: `${((SECTION4_WINDOW[2] - SECTION4_WINDOW[0]) / SECTION4_PLATE.w) * 100}%`,
                        height: `${((SECTION4_WINDOW[3] - SECTION4_WINDOW[1]) / SECTION4_PLATE.h) * 100}%`,
                      }}
                    />
                    <LabBench />
                    <Section4Layer $z={2} src={SECTION4_ASSETS.sand} alt="" />
                    <Section4Fringe aria-hidden="true">
                      <PlateCropImg
                        src={ASSETS.front}
                        alt=""
                        style={SECTION4_FRINGE_IMG_STYLE}
                      />
                      <PlateCropImg
                        src={ASSETS.bush}
                        alt=""
                        style={SECTION4_FRINGE_IMG_STYLE}
                      />
                    </Section4Fringe>
                    <Section4ButtonMount>
                      <BrowseButton
                        href="https://petadex.net"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Check out the full PETadex here!
                      </BrowseButton>
                    </Section4ButtonMount>
                    <Section4TextMount>
                      <Section4Body>
                        We created a database of these candidates and named it
                        the PETadex. It is entirely open-source, and freely
                        available to browse.
                      </Section4Body>
                    </Section4TextMount>
                    {SECTION4_STORY.map((line, i) => (
                      <Section4StoryLine
                        key={`${line.hold}-${line.in}`}
                        ref={el => {
                          labLineRefs.current[i] = el
                        }}
                        $at={line}
                        data-autoplay-read={line.hold >= 2 ? "" : undefined}
                      >
                        {line.text}
                      </Section4StoryLine>
                    ))}
                    <Section4Constellation
                      holdRef={labHoldRef}
                      dx={SECTION4_RIDE_DX.at}
                      phoneDx={SECTION4_RIDE_DX.phone}
                      phoneDy={
                        SECTION4_PHONE_PROTEIN_ROW - SECTION4_BLUE_CLUSTER[1]
                      }
                      big={LAB_ENZYME_BIG.at}
                      phoneBig={LAB_ENZYME_BIG.phone}
                    />
                    <Section4EnzymeLane
                      ref={section4EnzymeLaneRef}
                      aria-hidden="true"
                    >
                      <Section4EnzymeFollow ref={section4EnzymeRef}>
                        <EnzymeSprite />
                      </Section4EnzymeFollow>
                    </Section4EnzymeLane>
                    <Section4Rider ref={section4RideRef} aria-hidden="true">
                      <EnzymeSprite />
                    </Section4Rider>
                    <Section4BeefedLane aria-hidden="true">
                      <Section4BeefedStick ref={section4BeefedRef}>
                        <BeefedPetase />
                      </Section4BeefedStick>
                    </Section4BeefedLane>
                    <Section4BottleCue
                      ref={section4CueRef}
                      aria-hidden="true"
                    />
                    <Section4Lead>
                      But finding optimal enzyme candidates without knowing
                      where to use them doesn&apos;t solve the problem.
                    </Section4Lead>
                  </Section4Root>
                  <Section4HoldSpacer
                    ref={el => {
                      labSpacerRefs.current[0] = el
                    }}
                    $vh={LAB_HOLD_VH[0]}
                    aria-hidden="true"
                  />
                </Section4HoldInner>
                <Section4HoldSpacer
                  ref={el => {
                    labSpacerRefs.current[1] = el
                  }}
                  $vh={LAB_HOLD_VH[1]}
                  aria-hidden="true"
                />
              </Section4HoldBench>
              <Section4HoldSpacer
                ref={el => {
                  labSpacerRefs.current[2] = el
                }}
                $vh={LAB_HOLD_VH[2]}
                aria-hidden="true"
              />
            </Section4HoldBench>
            <Section4HoldSpacer
              ref={el => {
                labSpacerRefs.current[3] = el
              }}
              $vh={LAB_HOLD_VH[3]}
              aria-hidden="true"
            />
          </Section4HoldTrack>

          <EndingHoldTrack>
            <EndingHoldSticky>
              <Section5Root ref={section5RootRef}>
                <Section5Sizer>
                  <RailImg src={`${SECTION5_CDN}/1-bg.avif`} alt="" />
                </Section5Sizer>
                {SECTION5_LAYERS.filter(
                  layer => !layer.sizer && layer.id < 4,
                ).map(layer => (
                  <Section5Layer
                    key={layer.id}
                    $z={layer.z}
                    src={section5Src(layer)}
                    style={layer.fade ? section5Fade(layer.fade) : undefined}
                    alt=""
                  />
                ))}
                <HexFieldOverlap
                  ref={hexOverlapRef}
                  $topPct={HEX_FIELD_TOP_PCT}
                >
                  <HexFieldImg src={HEX_FIELD_SRC} alt="" />
                </HexFieldOverlap>
                {SECTION5_LAYERS.filter(
                  layer => layer.id >= 4 && layer.id < 7,
                ).map(layer => (
                  <Section5Layer
                    key={layer.id}
                    $z={layer.z}
                    src={section5Src(layer)}
                    style={layer.fade ? section5Fade(layer.fade) : undefined}
                    alt=""
                  />
                ))}
                {SECTION5_PETAMONS.filter(pet => !pet.aboveHex).map(pet => (
                  <Section5Petamon
                    key={pet.id}
                    pet={pet}
                    z={
                      pet.id === "kangaroo" || pet.id === "tan-fox"
                        ? 11
                        : pet.id === "turtle"
                          ? 8
                          : 7
                    }
                  />
                ))}
                <Section5ChuteBottleLayer aria-hidden="true">
                  <ChuteBottleMount ref={chuteBottleMountRef}>
                    <ChuteBottlePose ref={chuteBottlePoseRef}>
                      <ChuteBottleIdle>
                        <ChuteBottleImg
                          ref={chuteBottleImgRef}
                          src={BOTTLE_STAGES.section5}
                          alt=""
                        />
                        <BottleBeefed />
                      </ChuteBottleIdle>
                    </ChuteBottlePose>
                  </ChuteBottleMount>
                </Section5ChuteBottleLayer>
                {SECTION5_LAYERS.filter(layer => layer.id >= 7).map(layer => (
                  <Section5Layer
                    key={layer.id}
                    $z={layer.z}
                    src={section5Src(layer)}
                    style={layer.fade ? section5Fade(layer.fade) : undefined}
                    alt=""
                  />
                ))}
                <Section5FishStack aria-hidden="true">
                  {SECTION5_FISHES.map(fish => (
                    <Section5FishPlane
                      key={fish.id}
                      $z={fish.z}
                      style={plateCropStyle(fish.crop)}
                    >
                      <FishDrift
                        $durationMs={fish.driftMs}
                        $delayMs={fish.driftDelayMs}
                        style={{ "--swim": `${(115 / fish.crop.w) * 100}%` }}
                      >
                        <Section5FishHover $delayMs={fish.hoverDelayMs}>
                          <PlateCropImg
                            src={fish.src}
                            alt=""
                            style={plateCropImgStyle(fish.crop)}
                          />
                        </Section5FishHover>
                      </FishDrift>
                    </Section5FishPlane>
                  ))}
                </Section5FishStack>
                <Section5BubbleStack aria-hidden="true">
                  {STREAM_BUBBLES.map((bubble, i) => {
                    const painted = BUBBLE_PLATES[bubble.id]
                    const [shiftX, riseDy] = bubbleShift(
                      bubble.id,
                      bubble.x - painted.x,
                      FOAM_BARRIER_Y_PCT - 0.4 - painted.y,
                    )
                    const [wobbleX] = bubbleShift(
                      bubble.id,
                      (i % 2 === 0 ? 1 : -1) * (1.15 + i * 0.35),
                      0,
                    )
                    return (
                      <Section5StreamBubble
                        key={`stream-${bubble.id}`}
                        style={{
                          ...plateCropStyle(BUBBLE_CROPS[bubble.id]),
                          "--shift-x": `${shiftX}%`,
                          "--rise-dy": `${riseDy}%`,
                          "--wobble-x": `${wobbleX}%`,
                        }}
                        $dur={6.6 + i * 1.05}
                        $delay={-i * 1.7}
                      >
                        <Section5BubbleIdle
                          $delay={i * 0.35}
                          $dur={3.1 + (i % 3) * 0.4}
                        >
                          <PlateCropImg
                            src={`${BUBBLE_CDN}/bubble${bubble.id}.avif`}
                            alt=""
                            style={plateCropImgStyle(BUBBLE_CROPS[bubble.id])}
                          />
                        </Section5BubbleIdle>
                      </Section5StreamBubble>
                    )
                  })}
                  <Section5CompanionLayer ref={companionBubbleLayerRef}>
                    {COMPANION_BUBBLE_SPECS.map(spec => (
                      <Section5CompanionBubble
                        key={`companion-${spec.id}`}
                        data-companion={spec.id}
                        style={plateCropStyle(BUBBLE_CROPS[spec.id])}
                      >
                        <Section5BubbleIdle
                          $delay={spec.id * 0.18}
                          $dur={2.8 + (spec.id % 4) * 0.35}
                        >
                          <PlateCropImg
                            src={`${BUBBLE_CDN}/bubble${spec.id}.avif`}
                            alt=""
                            style={plateCropImgStyle(BUBBLE_CROPS[spec.id])}
                          />
                        </Section5BubbleIdle>
                      </Section5CompanionBubble>
                    ))}
                  </Section5CompanionLayer>
                </Section5BubbleStack>
                <Section5AppsBottleLayer aria-hidden="true">
                  <Section5AppsBottleMount ref={creamBottleMountRef}>
                    <Section5AppsBottleImg
                      ref={creamBottleImgRef}
                      src={BOTTLE_STAGES.sky}
                      alt=""
                    />
                    {/* The beefed-up PETase from the lab slams into this one
                      and sticks (the next two carry it too). */}
                    <BottleBeefed $waits />
                    <SlamBurst aria-hidden="true" />
                  </Section5AppsBottleMount>
                  <Section5AppsBottleMount ref={ramp2BottleMountRef}>
                    <Section5AppsBottleImg
                      src={BOTTLE_STAGES.section4}
                      alt=""
                    />
                    <BottleBeefed />
                  </Section5AppsBottleMount>
                </Section5AppsBottleLayer>
                <Section5FoamMount
                  ref={section5FoamRef}
                  aria-hidden="true"
                  style={plateCropStyle(FOAM_CROP)}
                  onAnimationEnd={e => {
                    if (e.target !== e.currentTarget) return
                    e.currentTarget.dataset.impact = ""
                  }}
                >
                  <PlateCropImg
                    src={SECTION5_FOAM_SRC}
                    alt=""
                    style={plateCropImgStyle(FOAM_CROP)}
                  />
                </Section5FoamMount>
                <Section5SplashLayer
                  ref={section5SplashLayerRef}
                  aria-hidden="true"
                >
                  {SPLASH_PLATES.map(splash => (
                    <Section5SplashDrop
                      key={splash.id}
                      data-splash={splash.id}
                      style={plateCropStyle(splash.crop)}
                    >
                      <PlateCropImg
                        src={`${SPLASH_CDN}/splash${splash.id}.avif`}
                        alt=""
                        style={plateCropImgStyle(splash.crop)}
                      />
                    </Section5SplashDrop>
                  ))}
                </Section5SplashLayer>
                {SECTION5_PETAMONS.filter(pet => pet.aboveHex).map(pet => (
                  <Section5Petamon key={pet.id} pet={pet} z={11} />
                ))}
                <Section5RampPatch aria-hidden="true" />
                <Section5TextStack aria-hidden="false">
                  {/* Where the ramp bottle parks under (the bottom of the
                    one-line lead that used to sit here), so the lead's
                    length doesn't move it. */}
                  <Section5ParkAnchor
                    ref={section5LeadRef}
                    aria-hidden="true"
                  />
                  <Section5WwtpLine>
                    Conversations and interviews with customers and recycling
                    plant operators pointed us towards the{" "}
                    <Link to="/entrepreneurship/">
                      wastewater treatment plant
                    </Link>{" "}
                    industry as a highly lucrative use-case, as microplastics
                    continuously accumulate in treatment plants&apos;{" "}
                    <ExplainTerm
                      term="biosolid"
                      plain
                      explanation={<>Biosolids are nutrient-rich, organic materials derived from treated municipal wastewater solids (sewage sludge). They are also a known reservoir for microplastics. Learn more in <Link to="/entrepreneurship/#wastewater-treatment-plants">section 5.1: Wastewater Treatment Plants (WWTPs)</Link> on our entrepreneurship page.</>}
                    />{" "}
                    sludge.
                  </Section5WwtpLine>
                  <Section5RecyclingLine>
                    In addition to wastewater treatment plants, additional
                    verticals can benefit from our enzymes, such as textiles,
                    filtration, and trash recycling streams.
                  </Section5RecyclingLine>
                  <Section5OceanLine $at={SECTION5_OCEAN_LINES[0]}>
                    But scientific innovation can only have real impact if it
                    leaves the lab.
                  </Section5OceanLine>
                  <Section5OceanLine $long $at={SECTION5_OCEAN_LINES[1]}>
                    Working with regulators, stakeholders, and researchers,
                    our <Link to="/human-practices/">project</Link> unites the
                    broader microplastics community. We advocate for
                    responsible solutions to solve the microplastics crisis, and
                    PetaBite provides a viable enzymatic approach to do just
                    that.
                  </Section5OceanLine>
                  <Section5OceanLine $long $at={SECTION5_OCEAN_LINES[2]}>
                    In creating the PETadex — the most comprehensive
                    plastic-degrading enzyme database — we combine data and
                    lessons learned into a single resource that can transform
                    the landscape of plastic-active enzymes.
                  </Section5OceanLine>
                  <Section5Cta>
                    Discover more about{" "}
                    <Link to="/project/description/">PetaBite</Link>.
                  </Section5Cta>
                </Section5TextStack>
              </Section5Root>

              <HexFieldRoot>
                <EndingBottleSlot ref={endingSlotRef}>
                  <EndingPetamonBottle ref={endingBottleRef} />
                </EndingBottleSlot>
              </HexFieldRoot>
            </EndingHoldSticky>
          </EndingHoldTrack>

          <HomeNavMount ref={homeNavMountRef}>
            <WikiTopBar />
          </HomeNavMount>
        </ScrollStack>
        <HomeAutoplay />
      </WikiFrontRoot>
    </PetamonProvider>
  )
}

export default HomeScrollPrototype

const WikiFrontRoot = styled.div`
  width: 100%;
  min-width: 0;
  background: var(--color-bg);
  /* No glyph hinting, so art-locked copy wraps the same at every width. */
  text-rendering: geometricPrecision;
`

const ScrollStack = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`

/** Absolute at rest; `fixed` while scrolling through mockup so nav stays reachable. */
const HomeNavMount = styled.div`
  position: absolute;
  &[data-pinned="1"] {
    position: fixed;
  }
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

/** Section 5, the hex field and the ending bottle under it. */
const EndingHoldTrack = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
  /* Overlaps the lab's sand by a pixel: where the two plates meet on a half
     pixel, both edges come out half see-through and leave a pale line. */
  margin-top: -1px;
`

/**
 * Above the lab (Section4Root), so the WWTP's fixed bottles roll in over its
 * sand. Clips the hex art where the ending bottle's strip ends, so the
 * honeycomb stops just under the bottle.
 */
const EndingHoldSticky = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  min-width: 0;
  overflow: clip;
`

/**
 * Right under "Discover more about PetaBite". The negative margin (a share
 * of the width, like the plate's height) pulls it up from the bottom of
 * section 5 to just below that line.
 */
const EndingBottleSlot = styled.div`
  position: relative;
  /* Frame is 1340×1060. */
  width: 40%;
  margin: -14% auto 0;
  /* Nudged left: the labels reach further right than left (Entrepreneurship). */
  transform: translateX(-3%);
  pointer-events: none;

  ${phone} {
    width: 88%;
    margin-top: -10%;
  }
`

const Section5Root = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  overflow: visible;
  background: transparent;
`

/** No z-index of its own, so the hex image and the bottle can stack apart. */
const HexFieldOverlap = styled.div`
  position: absolute;
  left: 0;
  top: ${({ $topPct }) => `${$topPct}%`};
  width: 100%;
  pointer-events: none;
`

const HexFieldImg = styled(PlateImg)`
  position: relative;
  z-index: 11;
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  pointer-events: none;
  user-select: none;
`

/**
 * The strip under section 5 that holds the ending bottle. See-through, over
 * the hex art spilling down from section 5, which is clipped where it ends.
 */
const HexFieldRoot = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  min-width: 0;
  /* Room for the hint that hangs under the bottle. */
  padding-bottom: 6rem;
  /* The bottle's margin pulls this up over the bottom of section 5; only
     the bottle's own pieces and labels take the pointer. */
  pointer-events: none;
`

const Section5Sizer = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  pointer-events: none;
`

const Section5Layer = styled(PlateImg)`
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

const crabBangBob = keyframes`
  0%,
  100% {
    transform: translate3d(-50%, 0, 0);
  }
  50% {
    transform: translate3d(-50%, -5px, 0);
  }
`

/** Sits just above the crab's head; moves with it when it scuttles. */
const CrabBang = styled.span`
  position: absolute;
  display: block;
  width: ${artPx(52)};
  margin-top: ${artPx(-124)};
  pointer-events: none;
  animation: ${crabBangBob} 2.4s ease-in-out infinite;
  transform: translate3d(-50%, 0, 0);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const CrabBangImg = styled(PlateImg)`
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
`

const foamImpactBob = keyframes`
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  22% {
    transform: translate3d(0, 10px, 0) scale(1.02);
  }
  58% {
    transform: translate3d(0, -5px, 0) scale(1.008);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
`

const Section5FoamMount = styled.div`
  position: absolute;
  z-index: ${SECTION5_FOAM_Z};
  overflow: hidden;
  pointer-events: none;
  transform-origin: ${((FOAM_BOB_ORIGIN.x - FOAM_CROP.x) / FOAM_CROP.w) * 100}%
    ${((FOAM_BOB_ORIGIN.y - FOAM_CROP.y) / FOAM_CROP.h) * 100}%;
  will-change: transform;

  &[data-impact="1"] {
    animation: ${foamImpactBob} 620ms ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Section5SplashLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${SPLASH_Z};
  pointer-events: none;
  overflow: visible;
`

const Section5SplashDrop = styled.div`
  position: absolute;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  will-change: transform, opacity;
`

/** Full-plate sprite inside a plateCropStyle window (offsets come from style). */
const PlateCropImg = styled(PlateImg)`
  position: absolute;
  display: block;
  height: auto;
  max-width: none;
  pointer-events: none;
  user-select: none;
`

const Section5FishStack = styled.div`
  position: absolute;
  inset: 0;
  /* Under the chute bottle (z 8) so the school passes behind it and behind
     the burst riding on that bottle. Still above the reef painting. */
  z-index: 7;
  /* The fish themselves take the pointer. The rest of the plate stays
     click-through so the petamons under this stack can still be hovered. */
  pointer-events: none;
  overflow: hidden;
`

/**
 * Same swim-across as birdFlyAcross (off the left, wrap to the right, back),
 * but by --swim: the plate's 115% expressed in the crop window's width.
 */
const fishSwimAcross = keyframes`
  0%,
  18% {
    transform: translate3d(0, 0, 0);
  }
  72% {
    transform: translate3d(calc(var(--swim) * -1), 0, 0);
  }
  72.01% {
    transform: translate3d(var(--swim), 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
`

const FishDrift = styled.div`
  position: absolute;
  inset: 0;
  animation: ${fishSwimAcross} ${({ $durationMs }) => $durationMs}ms linear
    infinite;
  animation-delay: ${({ $delayMs }) => $delayMs || 0}ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Sized to the fish crop window via style (SECTION5_FISHES[].crop). */
const Section5FishPlane = styled.div`
  position: absolute;
  z-index: ${({ $z }) => $z ?? 5};
  pointer-events: auto;
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

/**
 * One cut-out petamon. The box is its plate slot. Creatures that react do it
 * through PetamonAct; nothing here lifts on hover.
 */
const PlateFill = styled.div`
  width: 100%;
  height: 100%;
  pointer-events: none;
`

const PetamonSpot = styled.div`
  position: absolute;
  z-index: ${({ $z }) => $z ?? 1};
  pointer-events: none;
  overflow: visible;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
  }
`

/** Bob; also clips the plate-sized sprite to its window (moves with the bob). */
const Section5FishHover = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
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

const streamRise = keyframes`
  0% {
    transform: translate3d(var(--shift-x), 0, 0);
    opacity: 0;
  }
  7% {
    opacity: 0.95;
  }
  24% {
    transform: translate3d(
      calc(var(--shift-x) + var(--wobble-x) * 0.7),
      calc(var(--rise-dy) * 0.2),
      0
    );
  }
  50% {
    transform: translate3d(
      calc(var(--shift-x) + var(--wobble-x) * -0.5),
      calc(var(--rise-dy) * 0.5),
      0
    );
  }
  76% {
    transform: translate3d(
      calc(var(--shift-x) + var(--wobble-x) * 0.35),
      calc(var(--rise-dy) * 0.78),
      0
    );
  }
  88% {
    opacity: 0.95;
  }
  100% {
    transform: translate3d(
      calc(var(--shift-x) + var(--wobble-x)),
      var(--rise-dy),
      0
    );
    opacity: 0;
  }
`

const bubbleIdleFloat = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  35% {
    transform: translate3d(5px, -6px, 0);
  }
  68% {
    transform: translate3d(-6px, 4px, 0);
  }
`

const Section5BubbleStack = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  overflow: hidden;
`

/** Positioned/sized to its crop window via style (BUBBLE_CROPS). */
const Section5StreamBubble = styled.div`
  position: absolute;
  --rise-dy: 0%;
  --wobble-x: 0%;
  --shift-x: 0%;
  animation: ${streamRise} ${({ $dur }) => $dur}s linear infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  will-change: transform, opacity;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0;
    visibility: hidden;
  }
`

/** Clips the plate-sized sprite to its crop window; moves with the bob, so the bob never clips. */
const Section5BubbleIdle = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  animation: ${bubbleIdleFloat} ${({ $dur }) => $dur || 3.2}s ease-in-out
    infinite;
  animation-delay: ${({ $delay }) => `${$delay || 0}s`};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Section5CompanionLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

/** Positioned/sized to its crop window via style (BUBBLE_CROPS). */
const Section5CompanionBubble = styled.div`
  position: absolute;
  opacity: 0;
  visibility: hidden;
  will-change: transform, opacity;

  ${Section5BubbleIdle} {
    animation-play-state: paused;
  }

  &[data-arrived="1"] ${Section5BubbleIdle} {
    animation-play-state: running;
  }
`

/** Copy locked to % of the tall section-5 plate (946×4000). Above foam art. */
const Section5TextStack = styled.div`
  position: absolute;
  inset: 0;
  z-index: 12;
  pointer-events: none;
`

/**
 * Section4 bottle slot: in front of underwater art, behind apps copy.
 * Mount is `position: fixed` and driven by scroll in the tick handler.
 */
const Section5AppsBottleLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
`

const Section5AppsBottleMount = styled.div`
  position: fixed;
  top: 50%;
  left: 118%;
  width: ${artPx(152)};
  transform: translate3d(-50%, -50%, 0);
  transform-origin: 50% 50%;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  will-change: left, top, opacity, transform;
  z-index: 10;
`

const Section5ChuteBottleLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${CHUTE_Z};
  pointer-events: none;
`

const ChuteBottleMount = styled(Section5AppsBottleMount)`
  z-index: ${CHUTE_Z};
  width: ${artPx(196)};
`

/** Spin and squash live here, so the mount can be clipped on a level line. */
const ChuteBottlePose = styled.div`
  width: 100%;
  transform-origin: 50% 45%;
`

const Section5AppsBottleImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
`

const ChuteBottleImg = styled(Section5AppsBottleImg)`
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35)) saturate(1.08)
    contrast(0.96);
`

const chuteSinkIdle = keyframes`
  0% {
    transform: translate3d(0, 4px, 0) rotate(-4deg);
  }
  40% {
    transform: translate3d(0, 14px, 0) rotate(5deg);
  }
  70% {
    transform: translate3d(0, 8px, 0) rotate(-2deg);
  }
  100% {
    transform: translate3d(0, 4px, 0) rotate(-4deg);
  }
`

const ChuteBottleIdle = styled.div`
  position: relative;
  width: 100%;
  transform-origin: 50% 70%;

  ${ChuteBottleMount}[data-sunk="1"] & {
    animation: ${chuteSinkIdle} 3.1s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/**
 * Ramp 1's painted end stops a few px short of the plate's left edge (rows
 * 438–562), leaving a sliver of sand. Its end column (x 18–22) is stretched
 * over x 0–18 to close it.
 */
const RAMP_PATCH = { x: [0, 18], src: [18, 22], rows: [436, 564] }
const RAMP_PATCH_W = RAMP_PATCH.x[1] - RAMP_PATCH.x[0]
const RAMP_PATCH_H = RAMP_PATCH.rows[1] - RAMP_PATCH.rows[0]
const RAMP_SRC_W = RAMP_PATCH.src[1] - RAMP_PATCH.src[0]
/** The crop is the plate's rows 0–2500, so 946 × 2500. */
const RAMP_IMG = { w: 946, h: 2500 }
/** Stretched across: the source columns fill the patch's width. */
const rampSizeX = (RAMP_IMG.w / RAMP_SRC_W) * 100
const rampPosX =
  (RAMP_PATCH.src[0] / RAMP_SRC_W / (RAMP_IMG.w / RAMP_SRC_W - 1)) * 100
/** Down: drawn at the plate's own scale. */
const rampSizeY = (RAMP_IMG.h / RAMP_PATCH_H) * 100
const rampPosY = (RAMP_PATCH.rows[0] / (RAMP_IMG.h - RAMP_PATCH_H)) * 100

const Section5RampPatch = styled.div`
  position: absolute;
  z-index: 7;
  left: 0;
  top: ${(RAMP_PATCH.rows[0] / 4000) * 100}%;
  width: ${(RAMP_PATCH_W / RAMP_IMG.w) * 100}%;
  height: ${(RAMP_PATCH_H / 4000) * 100}%;
  pointer-events: none;
  background-image: url(${SECTION5_REPAINT_CROP});
  background-repeat: no-repeat;
  background-size: ${rampSizeX}% ${rampSizeY}%;
  background-position: ${rampPosX}% ${rampPosY}%;
`

/** The ramp bottle parks just under this: 5% down, one lead line tall. */
const Section5ParkAnchor = styled.div`
  position: absolute;
  top: 5%;
  left: 50%;
  width: 1px;
  height: calc(${artPx(40.32)} * 1.25);
  pointer-events: none;

  ${phone} {
    height: calc(${phoneSize(1.05)} * 1.25);
  }
`

/**
 * The treatment plant's lines all share one style: dark with a cream glow on
 * the sand, white with a dark shadow on the water. Each is clear of the
 * bottle, which comes down the middle (held at the window's centre as the
 * plant scrolls past it), so they sit to its left or right.
 */
const section5LineBase = `
  position: absolute;
  margin: 0;
  font-family: var(--font-body);
  ${artFont(34)}
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  overflow-wrap: break-word;
  pointer-events: none;

  a {
    pointer-events: auto;
    color: inherit;
    text-decoration: underline;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }

  ${phone} {
    font-size: ${phoneSize(0.8)};
  }
`

const onSand = `
  color: #10202a;
  text-shadow:
    0 0 6px rgba(255, 252, 240, 0.95),
    0 0 14px rgba(255, 248, 220, 0.7),
    0 1px 3px rgba(255, 255, 255, 0.85);
`

const onWater = `
  color: #fff;
  text-shadow:
    0 1px 3px rgba(4, 30, 40, 0.85),
    0 0 14px rgba(4, 36, 52, 0.7);
`

/**
 * The treatment plant's lead-in, up on the lab's bare wall under the
 * Hardware bench (its middle at this row), left of where the next bottle
 * rolls in.
 */
const SECTION4_LEAD_ROW = 3370
const Section4Lead = styled.p`
  ${section5LineBase}
  ${onSand}
  z-index: 4;
  top: ${(SECTION4_LEAD_ROW / SECTION4_PLATE.h) * 100}%;
  left: 4%;
  width: 40%;
  transform: translate3d(0, -50%, 0);

  ${phone} {
    left: 3%;
    width: 42%;
  }
`

/** On the sand at the top, right of the bottle, level with it. */
const Section5WwtpLine = styled.p`
  ${section5LineBase}
  ${onSand}
  top: 1.6%;
  left: 56%;
  width: 40%;

  ${phone} {
    top: 1.2%;
    left: 55%;
    width: 42%;
  }
`

/** Centred on the second tank's broad grey wall (about 10–77% across, 30–36.5% down). */
const Section5RecyclingLine = styled.p`
  ${section5LineBase}
  ${onSand}
  top: 33.2%;
  left: 41%;
  width: 46%;
  transform: translate3d(-50%, -50%, 0);

  ${phone} {
    width: 58%;
  }
`

/**
 * The closing words, split down the open water under the foam, either side
 * of the sinking bottle in turn, above the coral (from 81%). Long ones are
 * `$long` (smaller). [top, left, width] in % of the plant,
 * then the same on phones.
 */
const SECTION5_OCEAN_LINES = [
  { at: [50, 4, 40], phone: [48, 3, 43] },
  { at: [53, 56, 41], phone: [51, 55, 42] },
  // Phones: the long lines run ~16% of the plant tall, so each column
  // starts its next line only once the one above it has ended.
  { at: [61, 4, 41], phone: [53, 3, 43] },
]

const Section5OceanLine = styled.p`
  ${section5LineBase}
  ${onWater}
  ${({ $long }) =>
    $long &&
    css`
      ${artFont(28)}
      font-weight: 600;

      /* After the base's phone size, so restate it (a little smaller). */
      ${phone} {
        font-size: ${phoneSize(0.72)};
      }
    `}
  top: ${({ $at }) => $at.at[0]}%;
  left: ${({ $at }) => $at.at[1]}%;
  width: ${({ $at }) => $at.at[2]}%;

  ${phone} {
    top: ${({ $at }) => $at.phone[0]}%;
    left: ${({ $at }) => $at.phone[1]}%;
    width: ${({ $at }) => $at.phone[2]}%;
  }
`

/** Last, centred in the dark water under the coral (from 92.5%): bigger, glowing. */
const Section5Cta = styled.p`
  ${section5LineBase}
  top: 94.5%;
  left: 50%;
  width: 70%;
  transform: translate3d(-50%, 0, 0);
  color: #fff;
  ${artFont(48)}
  font-weight: 800;
  line-height: 1.2;
  text-shadow:
    0 0 12px rgba(255, 255, 255, 0.85),
    0 0 28px rgba(170, 230, 255, 0.75),
    0 0 48px rgba(90, 190, 255, 0.45),
    0 2px 4px rgba(0, 0, 0, 0.35);

  ${phone} {
    top: 94%;
    width: 90%;
    font-size: ${phoneSize(0.95)};
  }
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

  [data-walk="arrived"] & {
    animation: ${humanArriveJump} 0.64s cubic-bezier(0.22, 1.35, 0.32, 1) 1;
  }

  @media (prefers-reduced-motion: reduce) {
    &,
    [data-walk="arrived"] & {
      animation: none;
    }
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
  opacity: 0;
  /* Only bites on the way out — the pop-in keyframes own the entry. */
  transition: opacity 200ms ease;
  animation: none;

  [data-walk="arrived"] & {
    opacity: 1;
    animation:
      ${bangPopIn} 420ms cubic-bezier(0.34, 1.45, 0.64, 1) both,
      ${bangIdleSway} 1.4s steps(1, end) 420ms infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &,
    [data-walk="arrived"] & {
      animation: none;
      transform: none;
      transition: none;
    }
  }
`

/** The walking pose, or (`$arrivedPose`) the one swapped in on arrival. */
const HumanPose = styled.div`
  position: ${({ $fill }) => ($fill ? "absolute" : "relative")};
  left: 0;
  top: 0;
  width: 100%;
  z-index: 2;
  opacity: ${({ $arrivedPose }) => ($arrivedPose ? 0 : 1)};
  pointer-events: none;

  [data-walk="arrived"] & {
    opacity: ${({ $arrivedPose }) => ($arrivedPose ? 1 : 0)};
  }
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

/** A sharper copy of part of a plate, over it (see HQ_TOP). */
const HqTop = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  top: ${({ $part }) => (HQ_TOP[$part].rows[0] / FRONT_ART_HEIGHT) * 100}%;
  height: ${({ $part }) =>
    ((HQ_TOP[$part].rows[1] - HQ_TOP[$part].rows[0]) / FRONT_ART_HEIGHT) *
    100}%;
  pointer-events: none;
  background-repeat: no-repeat;
  background-size: 100% 100%;

  /* Only where it's worth the download (phones keep the lighter art). */
  @media (min-width: 520px) {
    background-image: ${({ $part }) => `url(${HQ_TOP[$part].src})`};
  }
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
/**
 * The right forest trunk, copied from the front plate and stacked above the
 * yellow axolotl. Clipped to the bark so the face still peeks out beside it
 * at rest; on hover the axolotl eases under this layer.
 */
const TrunkCover = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  z-index: 5;
  height: ${(1 / FOREST_BAND_HEIGHT) * 100}%;
  top: ${-(FOREST_BAND_TOP / FOREST_BAND_HEIGHT) * 100}%;
  pointer-events: none;
  clip-path: polygon(
    92.4% 80.4%,
    92.2% 80.9%,
    92% 81.6%,
    92% 82.2%,
    91% 82.6%,
    90.2% 83.1%,
    88.6% 83.6%,
    87% 84.1%,
    92% 84.6%,
    100% 84.8%,
    100% 80.2%
  );

  img {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
    user-select: none;
  }
`

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
  pointer-events: ${({ $pass }) => ($pass ? "none" : "auto")};
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
/** Shown once the walk arrives (`data-walk` on the forest composition). */
const PetamonReveal = styled.div`
  width: ${({ $placed }) => ($placed ? "auto" : "100%")};
  opacity: 0;
  pointer-events: none;
  /* Only bites on the way out — the pop-in keyframes own the entry. */
  transition: opacity 240ms ease;

  ${({ $placed }) =>
    $placed &&
    css`
      position: absolute;
      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
        user-select: none;
      }
    `}

  button {
    pointer-events: none;
  }

  [data-walk="arrived"] & {
    opacity: 1;
    animation: ${petamonPopIn} 620ms cubic-bezier(0.34, 1.4, 0.64, 1) both;
    animation-delay: ${({ $delayMs }) => $delayMs || 0}ms;

    button {
      pointer-events: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &,
    [data-walk="arrived"] & {
      animation: none;
      transform: none;
      transition: none;
    }
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
  pointer-events: none;
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
  z-index: ${({ $z }) => $z || 0};
  /* 2D: a 3D translate would give every mount its own plate-sized layer. */
  transform: translate(
    ${({ $xPct }) => $xPct || 0}%,
    ${({ $yPct }) => $yPct || 0}%
  );
  pointer-events: none;
`

const crabScuttleLeft = keyframes`
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  18% {
    transform: translate3d(-0.9%, 0, 0) rotate(${CRAB_SCUTTLE_THETA_DEG}deg);
  }
  38% {
    transform: translate3d(-2.1%, 0, 0) rotate(-${CRAB_SCUTTLE_THETA_DEG}deg);
  }
  58% {
    transform: translate3d(-3.3%, 0, 0) rotate(${CRAB_SCUTTLE_THETA_DEG}deg);
  }
  78% {
    transform: translate3d(-4.1%, 0, 0) rotate(-${CRAB_SCUTTLE_THETA_DEG}deg);
  }
  100% {
    transform: translate3d(-${CRAB_SCUTTLE_X_PCT}%, 0, 0) rotate(0deg);
  }
`

const crabScuttleRight = keyframes`
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  18% {
    transform: translate3d(0.9%, 0, 0) rotate(-${CRAB_SCUTTLE_THETA_DEG}deg);
  }
  38% {
    transform: translate3d(2.1%, 0, 0) rotate(${CRAB_SCUTTLE_THETA_DEG}deg);
  }
  58% {
    transform: translate3d(3.3%, 0, 0) rotate(-${CRAB_SCUTTLE_THETA_DEG}deg);
  }
  78% {
    transform: translate3d(4.1%, 0, 0) rotate(${CRAB_SCUTTLE_THETA_DEG}deg);
  }
  100% {
    transform: translate3d(${CRAB_SCUTTLE_X_PCT}%, 0, 0) rotate(0deg);
  }
`

const CrabScuttleShell = styled.div`
  position: relative;
  width: 100%;
  pointer-events: none;
  transform: ${({ $homeX }) => ($homeX ? `translateX(${$homeX}%)` : "none")};
  transform-origin: ${({ $ox, $oy }) => `${$ox}% ${$oy}%`};
`

const CrabScuttleMotion = styled.div`
  position: relative;
  width: 100%;
  pointer-events: none;
  transform-origin: ${({ $ox, $oy }) => `${$ox}% ${$oy}%`};

  ${({ $playing, $dir }) =>
    $playing &&
    css`
      animation: ${$dir < 0 ? crabScuttleLeft : crabScuttleRight}
        ${CRAB_SCUTTLE_MS}ms cubic-bezier(0.45, 0.05, 0.25, 1) both;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`

const CrabHitPad = styled.button`
  position: absolute;
  left: ${({ $ox }) => $ox}%;
  top: ${({ $oy }) => $oy}%;
  width: clamp(3.25rem, 11%, 7.5rem);
  height: clamp(2.75rem, 8%, 5.75rem);
  transform: translate(-50%, -50%);
  border: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  z-index: 5;
  appearance: none;

  &:focus-visible {
    outline: 2px solid rgba(20, 20, 20, 0.45);
    outline-offset: 3px;
  }
`

const CrabFlapper = styled.div`
  position: relative;
  width: 100%;
  pointer-events: none;
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

/**
 * Two-frame flap on a PlateImg. The steps run on the drawn crop inside the
 * plate-sized box (or on the image itself, for a plate without a crop):
 * Safari gives each animated element a layer the size of its box, and a
 * screen-sized layer per flapping frame is what made phones lag.
 */
const plateFlap = (
  { $phase, $durationMs, $delayMs },
  flapA,
  flapB,
  fallbackMs,
) => css`
  &:is(img),
  & > img {
    opacity: ${$phase === "a" ? 1 : 0};
    animation: ${$phase === "a" ? flapA : flapB} ${$durationMs || fallbackMs}ms
      steps(1, end) ${$delayMs || 0}ms infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
`

/** The flap at `share` of its usual length, while `parent` is hovered. */
const plateFlapFaster = (parent, durationMs, share) => css`
  ${parent}:hover &:is(img),
  ${parent}:hover & > img {
    animation-duration: ${Math.round(durationMs * share)}ms;
  }
`

const CrabFrame = styled(PlateImg)`
  position: absolute;
  left: 0;
  top: 0;
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
  ${props => plateFlap(props, crabFlapA, crabFlapB, 720)}

  &:first-child {
    position: relative;
  }

  ${({ $hoverFlap, $durationMs }) =>
    $hoverFlap && plateFlapFaster(ForestAnimalsStack, $durationMs || 720, 0.72)}
`

const StaticPlateImg = styled(PlateImg)`
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
 * Path: appear high on the right, drift mostly downward, then sweep left.
 * Progress and the three scroll-gates are driven in JS (see SHORE_BOTTLE_PATH).
 */
const ShoreBottleMount = styled.div`
  position: absolute;
  left: 104%;
  top: 10%;
  /* Same size as the sky bottle; scales with the art. */
  width: ${artPx(192)};
  transform: translate3d(-50%, -55%, 0);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  ${({ $playing }) =>
    $playing
      ? css`
          visibility: visible;
        `
      : css`
          opacity: 0;
          visibility: hidden;
        `}

  @media (prefers-reduced-motion: reduce) {
    ${({ $playing }) =>
      $playing
        ? css`
            /* Keep a quiet mid-path pose; no long drift. */
            visibility: visible;
            left: 92%;
            top: 48%;
            opacity: 0.9;
          `
        : css`
            visibility: hidden;
            opacity: 0;
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
  position: relative;
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

const ShoreBottleImg = styled(PlateImg)`
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
`

const ShoreBottleRipples = styled(ShoreBottleImg)`
  position: absolute;
  inset: 0;
`

/** Scroll-scrubbed bottle: above forest animals, under bushes (z:30). */
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
  width: ${artPx(176)};
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

const MapBottleImg = styled(PlateImg)`
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
`

/** Extra drop for the PETases + LOGAN lines (px at the 1440 reference). */
const SHORE_COPY_NUDGE = artPx(12)

/** Centered PETases line where the condition cards used to sit (top of shore). */
const ShorePetaseMount = styled.div`
  position: absolute;
  top: calc(-16% + ${SHORE_COPY_NUDGE});
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  width: ${artPx(768)};
  box-sizing: border-box;
  pointer-events: auto;
  text-align: center;

  /* Clear of the waterfall's right-hand column, which runs longer on phones,
     and nudged right so it stays on the water, off the rocks on the left bank. */
  ${phone} {
    top: calc(-20% + ${phoneSize(1.75)});
    left: 56%;
    width: 86%;
  }
`

const ShorePetaseBody = styled.p`
  margin: 0;
  color: #fff;
  font-family: var(--font-body);
  ${artFont(36)}
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: break-word;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 0 14px rgba(0, 0, 0, 0.35);

  ${phone} {
    font-size: ${phoneSize(0.95)};
  }
`

/** Sits on the sand bank (left/center of the shore art). */
const ShoreTextMount = styled.div`
  position: absolute;
  top: 14%;
  left: 5%;
  width: ${artPx(448)};
  box-sizing: border-box;
  pointer-events: none;

  ${phone} {
    top: 12%;
    left: 4%;
    width: 46%;
  }
`

const ShoreBody = styled.p`
  margin: 0;

  /* Its mount lets the pointer through; the PETases popup takes it back. */
  span[role="button"] {
    pointer-events: auto;
  }
  color: #0a0a0a;
  font-family: var(--font-body);
  ${artFont(31.68)}
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: break-word;

  ${phone} {
    font-size: ${phoneSize(0.95)};
  }
`

/** Short line on the right, along the bottle’s downward path (between LOGAN and RNAlab). */
const ShoreMidTextMount = styled.div`
  position: absolute;
  top: 42%;
  right: 5%;
  left: auto;
  width: ${artPx(448)};
  box-sizing: border-box;
  pointer-events: none;
  text-align: center;

  ${phone} {
    top: 40%;
    right: 4%;
    width: 44%;
  }
`

const ShoreMidBody = styled.p`
  margin: 0;
  color: #fff;
  font-family: var(--font-body);
  ${artFont(33.12)}
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: break-word;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 0 14px rgba(0, 0, 0, 0.35);

  ${phone} {
    font-size: ${phoneSize(0.95)};
  }
`

/** Condition cards + “...3 specific conditions” on the lower sand. */
const ShoreCardsMount = styled.div`
  pointer-events: none;

  /* SwipeInBox AnchoredStage defaults to top: -16% (old card slot). */
  & > div {
    top: 70%;
  }

  /* Scales with the shore art; 1100px wide at the 1440 reference. */
  & > div > div {
    width: ${artPx(1100)};
    box-sizing: border-box;
    padding: ${artPx(20)} ${artPx(28)};
  }

  & h3 {
    ${artFont(34.56)}
  }

  ${phone} {
    & > div > div {
      width: 94%;
      padding: ${phoneSize(0.5)} ${phoneSize(0.6)};
    }

    & h3 {
      font-size: ${phoneSize(1)};
    }
  }
`

/** Centered LOGAN line just above the world map. */
const ShoreLoganMount = styled.div`
  position: absolute;
  top: auto;
  bottom: calc(-14% - ${SHORE_COPY_NUDGE});
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  width: ${artPx(736)};
  box-sizing: border-box;
  pointer-events: none;
  text-align: center;

  /* Phones: down into the open sand above the map, clear of the grass. */
  ${phone} {
    bottom: calc(-17% - ${SHORE_COPY_NUDGE});
    width: 94%;
  }
`

const ShoreLoganBody = styled.p`
  margin: 0;

  /* The Logan popup takes the pointer; the rest lets it through. */
  span[role="button"] {
    pointer-events: auto;
  }
  color: #0a0a0a;
  font-family: var(--font-body);
  ${artFont(31.68)}
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: break-word;

  ${phone} {
    font-size: ${phoneSize(0.8)};
  }
`

/** Phones: forest lines sit in the white space just under the bushes. */
const FOREST_PHONE_TEXT_TOP = "103%"

/** Dataset line left of the walker; opacity driven by walk progress. */
const ForestDatasetMount = styled.div`
  position: absolute;
  top: 66%;
  left: 8%;
  width: ${artPx(300)};
  box-sizing: border-box;
  pointer-events: none;
  text-align: left;
  opacity: 0;

  /* Phones: no room beside the explorer, so both forest lines share the white
     space just under the bushes (still in view while the forest is pinned).
     This one hands over to the RNAlab line on arrival. */
  ${phone} {
    top: ${FOREST_PHONE_TEXT_TOP};
    left: 5%;
    width: 90%;
    text-align: center;

    [data-arrived="1"] > & {
      opacity: 0 !important;
      transition: opacity 400ms ease;
    }
  }
`

const discoveryShimmer = keyframes`
  from { background-position: 200% center; }
  to { background-position: -200% center; }
`

/** Matching emphasis for the candidate count and fold increase. */
const BigFigure = styled.strong`
  font-size: 1.45em;

  /* Keeps "300 million" on one line; phones are too narrow for that. */
  @media (min-width: ${PHONE_MAX + 1}px) {
    white-space: nowrap;
  }
  font-weight: 800;
  line-height: 1.15;
  color: #553273;
  @supports (background-clip: text) or (-webkit-background-clip: text) {
    background: linear-gradient(110deg, #553273 20%, #80502a 40%, #ffe694 50%, #80502a 60%, #553273 80%);
    background-size: 250% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    animation: ${discoveryShimmer} 5s linear infinite;
    filter: drop-shadow(0 1px 1px #fff7d9);
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-position: 0 center;
  }
`

const ForestDatasetBody = styled.p`
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-body);
  ${artFont(31.68)}
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: break-word;
  pointer-events: none;

  ${phone} {
    font-size: ${phoneSize(0.8)};
  }
`

/** RNAlab payoff on the walker's right; swaps in when the bang pops. */
/** Left of the axolotl that pops up by the right edge on arrival. */
const ForestRnalabMount = styled.div`
  position: absolute;
  top: 63%;
  right: 6%;
  width: ${artPx(470)};
  box-sizing: border-box;
  text-align: left;
  opacity: 0;
  transform: translate3d(20px, 0, 0);
  transition:
    opacity 520ms ease 180ms,
    transform 560ms cubic-bezier(0.22, 1.2, 0.36, 1) 180ms;
  pointer-events: none;

  p,
  button {
    pointer-events: none;
  }

  /* Set smaller than the line before it, so "300 million" stays on one line
     and the paragraph clears the explorer's backpack. */
  @media (min-width: ${PHONE_MAX + 1}px) {
    p {
      ${artFont(26)}
    }
  }

  [data-walk="arrived"] & {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  /* Live once it has slid in (data-lab-live, a beat after arriving). */
  [data-lab-live="1"] & {
    pointer-events: auto;

    p,
    button {
      pointer-events: auto;
    }
  }

  ${phone} {
    top: ${FOREST_PHONE_TEXT_TOP};
    right: 5%;
    width: 90%;
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

/** RNAlab copy on the cream pad below the bushes. */
/**
 * The lab and its holds: pulled up over the old cream pad so its row 0 sits
 * on front row SECTION4_FRONT_ROW. The lab sticks in Section4HoldInner (with
 * the first of SECTION4_HOLD_ROWS at the window's middle) while the first
 * spacer goes by; then that sticks in here (with the second there) while
 * the second spacer does.
 */
const Section4HoldTrack = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  margin-top: ${(-(FRONT_ART_HEIGHT - SECTION4_FRONT_ROW) / FRONT_ART_WIDTH) * 100}%;
`

/**
 * The bench holds' tracks (`$hold`: 2 for the Wet Lab shelf, 3 for the
 * Hardware bench): each sticks, with its row of SECTION4_BENCH_ROWS at the
 * screen's middle, while the spacer after it goes by.
 */
const Section4HoldBench = styled.div`
  position: sticky;
  top: calc(
    50vh -
      ${({ $hold }) => ($hold === 3 ? BENCH_HOLD_ROW_CSS : labRowPx(SECTION4_BENCH_ROWS[0]))} -
      ${({ $hold }) => LAB_HOLD_VH.slice(0, $hold).reduce((a, b) => a + b, 0)}vh
  );
`

const Section4HoldSpacer = styled.div`
  height: ${({ $vh }) => $vh}vh;
  pointer-events: none;
`

/** A row of the lab's plate, as a length on the page. */
const labRowPx = row =>
  `var(${ART_WIDTH_VAR}, 100vw) * ${row / SECTION4_PLATE.w}`

/** The bench hold's row (benchHoldRow), as a length on the page. */
const BENCH_HOLD_ROW_CSS = `min(${labRowPx(SECTION4_BENCH_ROWS[1])}, ${labRowPx(
  SECTION4_BOTTLE_CUE[0],
)} - ${LAB_BENCH_CUE_VH * 100}vh)`

const Section4HoldInner = styled.div`
  position: sticky;
  top: calc(50vh - ${labRowPx(SECTION4_HOLD_ROWS.at[1])} - ${LAB_HOLD_VH[0]}vh);

  /* Phones: the lab stays where the first hold put it. */
  ${phone} {
    top: calc(
      50vh + ${LAB_HEADER_HALF} - ${labRowPx(SECTION4_PHONE_HOLD_ROW)} -
        ${LAB_HOLD_VH[0]}vh
    );
  }
`

const Section4Root = styled.div`
  position: sticky;
  top: calc(
    50vh + ${LAB_HEADER_HALF} - ${labRowPx(SECTION4_HOLD_ROWS.at[0])} +
      var(--lab-pan, 0px)
  );
  z-index: 1;
  width: 100%;
  min-width: 0;

  ${phone} {
    top: calc(
      50vh + ${LAB_HEADER_HALF} - ${labRowPx(SECTION4_PHONE_HOLD_ROW)} +
        var(--lab-pan, 0px)
    );
  }
`

/** Same full-plate overlay as the WWTP's layers. */
const Section4Layer = Section5Layer

/** The jungle's bottom fringe (front + bush plates), redrawn over the lab wall's top. */
const Section4Fringe = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  width: 100%;
  aspect-ratio: ${FRONT_ART_WIDTH} /
    ${SECTION4_FRINGE_END_ROW - SECTION4_FRONT_ROW};
  overflow: hidden;
  pointer-events: none;
`

/**
 * Phones: under the window instead, above the button. Above the window it
 * would meet the forest's lines, which sit just under the bushes there. As
 * the first hold starts it goes and the button moves up towards its place
 * (phoneMakeRoom), making room for the story lines' spot under them.
 */
const SECTION4_PHONE_TEXT_ROW = 1050
const SECTION4_PHONE_BUTTON_ROW = 1180
/** Where the button moves up to on phones, clear of the sill. */
const SECTION4_PHONE_BUTTON_UP_ROW = 1022
const phoneMakeRoom = `clamp(0, calc(var(--lab-hold-1, 0) * 20), 1)`

const Section4TextMount = styled.div`
  position: absolute;
  top: ${(SECTION4_TEXT_ROW / SECTION4_PLATE.h) * 100}%;
  left: 50%;
  z-index: 4;
  transform: translate3d(-50%, -50%, 0);
  width: ${artPx(768)};
  box-sizing: border-box;
  pointer-events: auto;
  text-align: center;

  ${phone} {
    top: ${(SECTION4_PHONE_TEXT_ROW / SECTION4_PLATE.h) * 100}%;
    width: 88%;
    opacity: calc(1 - ${phoneMakeRoom});
  }
`

/** Under the window's sill, on the tiled wall. */
const SECTION4_BUTTON_ROW = 985

const Section4ButtonMount = styled.div`
  position: absolute;
  top: ${(SECTION4_BUTTON_ROW / SECTION4_PLATE.h) * 100}%;
  left: 50%;
  /* Over the constellation as it lifts out of the window past it. */
  z-index: 6;
  transform: translate3d(-50%, -50%, 0);
  pointer-events: auto;

  ${phone} {
    top: ${(SECTION4_PHONE_BUTTON_ROW / SECTION4_PLATE.h) * 100}%;
    transform: translate3d(
      -50%,
      calc(
        -50% - ${phoneMakeRoom} *
          ${labRowPx(SECTION4_PHONE_BUTTON_ROW - SECTION4_PHONE_BUTTON_UP_ROW)}
      ),
      0
    );
  }
`

/** A night-sky button, like the window's view of the PETadex. */
const BrowseButton = styled.a`
  display: inline-block;
  padding: 0.7em 1.5em;
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  background: linear-gradient(180deg, #24305e, #141c3c);
  box-shadow:
    0 6px 16px rgba(10, 20, 50, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  color: #fff;
  font-family: var(--font-body);
  ${artFont(24)}
  font-weight: 800;
  letter-spacing: 0.01em;
  text-decoration: none;
  white-space: nowrap;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    box-shadow:
      0 10px 22px rgba(10, 20, 50, 0.45),
      0 0 18px rgba(140, 170, 255, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  ${phone} {
    font-size: ${phoneSize(0.85)};
  }
`

const Section4Body = styled.p`
  margin: 0;

  a {
    color: inherit;
    text-decoration: underline;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }
  color: #0a0a0a;
  font-family: var(--font-body);
  ${artFont(31.68)}
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: break-word;

  ${phone} {
    font-size: ${phoneSize(0.9)};
  }
`

/** From the enzyme's painted centre down to the bottle cue: where it follows the reader. */
const Section4EnzymeLane = styled.div`
  position: absolute;
  z-index: 5;
  left: ${SECTION4_ENZYME_CROP.x}%;
  width: ${SECTION4_ENZYME_CROP.w}%;
  top: ${(SECTION4_HOLD_ROWS.at[1] / SECTION4_PLATE.h) * 100}%;
  /* Down to the Wet Lab shelf's hold, where it drops into the beaker. */
  bottom: ${(1 - (SECTION4_BENCH_ROWS[0] + SECTION4_ENZYME_PX.h) / SECTION4_PLATE.h) * 100}%;
  pointer-events: none;

  ${phone} {
    left: ${SECTION4_PHONE_RIDE_LEFT}%;
    top: ${(SECTION4_PHONE_PROTEIN_ROW / SECTION4_PLATE.h) * 100}%;
  }
`

/** The enzyme riding the beaker's stream down to the bioreactor; the scroll handler moves it. */
const SECTION4_RIDE_W = SECTION4_ENZYME_PX.w * SECTION4_RIDE_SCALE
const Section4Rider = styled.div`
  position: absolute;
  z-index: 5;
  left: ${((SECTION4_STREAM.x - SECTION4_RIDE_W / 2) / SECTION4_PLATE.w) * 100}%;
  top: ${(SECTION4_STREAM.rows[0] / SECTION4_PLATE.h) * 100}%;
  width: ${(SECTION4_RIDE_W / SECTION4_PLATE.w) * 100}%;
  transform: translate3d(0, -50%, 0);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
`

/**
 * The beefed-up PETase: pops out of the vessel to where it lands, holds there
 * through the bench's hold, then follows the reader at that height down to
 * the bottle, which it rides on into the treatment plant.
 */
const SECTION4_BEEFED_W = SECTION4_BEEFED.box[2] * SECTION4_BEEFED.scale
const Section4BeefedLane = styled.div`
  position: absolute;
  z-index: 5;
  left: ${((SECTION4_BEEFED.land[0] - SECTION4_BEEFED_W / 2) / SECTION4_PLATE.w) * 100}%;
  width: ${(SECTION4_BEEFED_W / SECTION4_PLATE.w) * 100}%;
  top: ${(SECTION4_BEEFED.land[1] / SECTION4_PLATE.h) * 100}%;
  bottom: ${(1 - SECTION4_BOTTLE_CUE[0] / SECTION4_PLATE.h) * 100}%;
  pointer-events: none;
`

const Section4BeefedStick = styled.div`
  position: sticky;
  top: calc(
    50vh + ${labRowPx(SECTION4_BEEFED.land[1])} - ${BENCH_HOLD_ROW_CSS}
  );
  transform: translate3d(0, -50%, 0);
  opacity: 0;
  visibility: hidden;
`

const BeefedSprite = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: ${SECTION4_BEEFED.box[2]} / ${SECTION4_BEEFED.box[3]};
  overflow: hidden;
  pointer-events: none;
`

/** The beefed-up PETase (with its sparkles), as wide as its parent. */
function BeefedPetase({ className }) {
  return (
    <BeefedSprite className={className}>
      <PlateCropImg
        src={SECTION4_BEEFED.src}
        alt=""
        style={plateCropImgStyle(SECTION4_BEEFED_CROP)}
      />
    </BeefedSprite>
  )
}

/** The constellation's lane: the enzyme's left and width, from the window's middle. */
const Section4Constellation = styled(LabConstellation)`
  z-index: 5;
  left: ${SECTION4_ENZYME_CROP.x}%;
  width: ${SECTION4_ENZYME_CROP.w}%;
  top: ${(SECTION4_CONSTELLATION_ROWS.at[0] / SECTION4_PLATE.h) * 100}%;
  height: ${((SECTION4_CONSTELLATION_ROWS.at[1] - SECTION4_CONSTELLATION_ROWS.at[0]) / SECTION4_PLATE.h) * 100}%;

  ${phone} {
    left: ${SECTION4_PHONE_RIDE_LEFT}%;
    top: ${(SECTION4_PHONE_PROTEIN_ROW / SECTION4_PLATE.h) * 100}%;
    height: ${(SECTION4_ENZYME_PX.h / SECTION4_PLATE.h) * 100}%;
  }
`

const Section4Sky = styled(WindowSky)`
  z-index: 3;
`

/** How far a story line has come in (0–1), through its hold. */
const storyIn = ({ $at }) =>
  `clamp(0, calc((var(--lab-hold-${$at.hold + 1}, 0) - ${$at.in}) * 14), 1)`

/** Phones: how far through `[hold, share]` the lab is (0–1), quickly. */
const phoneStoryAt = ([hold, at]) =>
  `clamp(0, calc((var(--lab-hold-${hold + 1}, 0) - ${at}) * 20), 1)`

/** How far a line has gone (0–1) by its `out`, as the next comes in. */
const storyOut = ({ $at }) => ($at.out ? phoneStoryAt($at.out) : "0")

/** Phones: when it comes in and goes; the bench's lines as on wider screens. */
const phoneTiming = $at => $at.phone || { in: [$at.hold, $at.in], out: $at.out }

/**
 * The lab's story lines, each coming in at its point in its hold: the first
 * hold's in the window's night sky, the second's either side of the
 * constellation (on phones, taking turns in one spot under the window), the
 * bench holds' taking turns beside their scenes.
 */
const Section4StoryLine = styled.p`
  position: absolute;
  z-index: 4;
  opacity: calc(${storyIn} - ${storyOut});
  transform: translate3d(
    0,
    calc(${({ $at }) => ($at.mid ? "-50% + " : "")}(1 - ${storyIn}) * 0.6em),
    0
  );

  a {
    color: inherit;
    text-decoration: underline;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }

  /* Match the hardware camera's held row, including its viewport adjustment,
     so the text midpoint stays at the screen midpoint on wide screens. */
  top: ${({ $at }) => $at.hold === 3
    ? `calc(${BENCH_HOLD_ROW_CSS})`
    : `${($at.at[0] / SECTION4_PLATE.h) * 100}%`};
  left: ${({ $at }) => $at.at[1]}%;
  width: ${({ $at }) => $at.at[2]}%;
  margin: 0;
  color: #0a0a0a;
  font-family: var(--font-body);
  ${artFont(36)}
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  overflow-wrap: break-word;
  text-shadow:
    0 0 6px rgba(255, 255, 255, 0.95),
    0 0 14px rgba(240, 248, 248, 0.8);

  ${({ $at }) =>
    $at.long &&
    css`
      ${artFont(28)}
      line-height: 1.35;
    `}

  /* In the night sky: pale, a little smaller to fit its clear patches. */
  ${({ $at }) =>
    $at.sky &&
    css`
      color: #fffbe8;
      ${artFont(25)}
      line-height: 1.35;
      text-shadow:
        0 1px 3px rgba(6, 12, 40, 0.9),
        0 0 10px rgba(6, 12, 40, 0.7);
    `}

  /* Just above phone widths the sky's text stops shrinking: set tighter. */
  ${({ $at }) =>
    $at.sky &&
    css`
      @media (min-width: ${PHONE_MAX + 1}px) and (max-width: ${LAB_NARROW_MAX}px) {
        line-height: 1.25;
        ${
          $at.narrow &&
          css`
            left: ${$at.narrow[0]}%;
            width: ${$at.narrow[1]}%;
          `
        }
      }
    `}

  /* Phones: all in one spot under the window, each giving way to the next. */
  ${phone} {
    top: ${({ $at }) => (($at.phoneAt || [SECTION4_PHONE_STORY_ROW])[0] / SECTION4_PLATE.h) * 100}%;
    left: ${({ $at }) => ($at.phoneAt || [0, 4])[1]}%;
    width: ${({ $at }) => ($at.phoneAt || [0, 4, 92])[2]}%;
    opacity: calc(
      ${({ $at }) => phoneStoryAt(phoneTiming($at).in)} -
        ${({ $at }) => (phoneTiming($at).out ? phoneStoryAt(phoneTiming($at).out) : 0)}
    );
    transform: translate3d(
      0,
      calc((1 - ${({ $at }) => phoneStoryAt(phoneTiming($at).in)}) * 0.6em),
      0
    );
    color: #0a0a0a;
    font-size: ${phoneSize(0.8)};
    /* A tight halo keeps them crisp on the tiles. */
    text-shadow:
      0 0 2px #fff,
      0 0 4px #fff,
      0 0 10px rgba(240, 248, 248, 0.9);
  }
`

/** Sticks with its centre at ENZYME_FOLLOW_VIEW_Y; the scroll handler fades it. */
const Section4EnzymeFollow = styled.div`
  position: sticky;
  top: ${ENZYME_FOLLOW_VIEW_Y * 100}vh;
  transform: translate3d(0, -50%, 0);
  opacity: 0;
  visibility: hidden;
  will-change: opacity;
`

/** Invisible box the bottle's roll-in is timed against. */
const Section4BottleCue = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  top: ${(SECTION4_BOTTLE_CUE[0] / SECTION4_PLATE.h) * 100}%;
  height: ${((SECTION4_BOTTLE_CUE[1] - SECTION4_BOTTLE_CUE[0]) / SECTION4_PLATE.h) * 100}%;
  visibility: hidden;
  pointer-events: none;
`

/**
 * The lab enzyme, as wide as its parent: cut from its plate, then its
 * sharper copy over that once loaded.
 */
function EnzymeSprite({ className }) {
  const hqRef = useRef(null)
  const [sharp, setSharp] = useState(false)
  useEffect(() => {
    const img = hqRef.current
    if (img?.complete && img.naturalWidth > 0) setSharp(true)
  }, [])
  return (
    <EnzymeWindow
      className={className}
      style={{
        aspectRatio: `${SECTION4_ENZYME_PX.w} / ${SECTION4_ENZYME_PX.h}`,
      }}
    >
      {!sharp && (
        <PlateCropImg
          src={SECTION4_ASSETS.enzyme}
          alt=""
          style={plateCropImgStyle(SECTION4_ENZYME_CROP)}
        />
      )}
      <EnzymeHqImg
        ref={hqRef}
        src={SECTION4_ASSETS.enzymeHq}
        alt=""
        decoding="async"
        $shown={sharp}
        onLoad={() => setSharp(true)}
      />
    </EnzymeWindow>
  )
}

const EnzymeHqImg = styled.img`
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  opacity: ${({ $shown }) => ($shown ? 1 : 0)};
`

/** The PETase hitting the bottle: in big, squashed flat, then settling. */
const slamIn = keyframes`
  0% { transform: translate3d(-50%, -50%, 0) scale(1.35); }
  35% { transform: translate3d(-50%, -42%, 0) scale(1.18, 0.78); }
  62% { transform: translate3d(-50%, -54%, 0) scale(0.94, 1.08); }
  100% { transform: translate3d(-50%, -50%, 0) scale(1); }
`

const slamRing = keyframes`
  0% { opacity: 0.95; transform: translate3d(-50%, -50%, 0) scale(0.3); }
  100% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(1.5); }
`

const EnzymeWindow = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  pointer-events: none;
`

/**
 * The beefed-up PETase riding a WWTP bottle, sitting over its top end (the
 * bottle spans 16–84% of its image), with a shadow to lift it off; its
 * sparkles make its box wider than the bottle. With `$waits` (the bottle
 * the lab hands it to) it shows once the lab's copy slams into the bottle
 * (`data-stuck` on the mount), squashing on impact.
 */
const BottleBeefed = styled(BeefedPetase)`
  position: absolute;
  left: 50%;
  top: 20%;
  width: 76%;
  transform: translate3d(-50%, -50%, 0);
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45));

  ${({ $waits }) =>
    $waits &&
    css`
      visibility: hidden;

      [data-stuck="1"] > & {
        visibility: visible;
        animation: ${slamIn} 420ms ease-out;
      }

      @media (prefers-reduced-motion: reduce) {
        animation: none !important;
      }
    `}
`

/** Over the bottle's top end, where the PETase hits it: a ring flashes out. */
const SlamBurst = styled.span`
  position: absolute;
  left: 50%;
  top: 20%;
  width: 90%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 240, 0.95);
  box-shadow: 0 0 12px rgba(255, 250, 200, 0.8);
  transform: translate3d(-50%, -50%, 0) scale(0.3);
  opacity: 0;
  pointer-events: none;

  [data-stuck="1"] > & {
    animation: ${slamRing} 480ms ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`

const ConditionImageRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${artPx(28)};
  margin-top: ${artPx(28)};
  align-items: start;

  /* Keep all 3 cards visible together (no swipe) on phones too. */
  ${phone} {
    gap: ${phoneSize(0.4)};
    margin-top: ${phoneSize(0.5)};
  }
`

const ConditionFigure = styled.figure`
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${artPx(8.8)};
  min-width: 0;

  /* Rendered as a link: clickable inside ShoreCardsMount's pointer-events:
     none, and lifted a little on hover. */
  &[href] {
    color: inherit;
    text-decoration: none;
    pointer-events: auto;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  &[href]:hover {
    transform: translateY(-${artPx(4)});
  }

  &[href]:focus-visible {
    outline: 2px solid #fff;
    outline-offset: ${artPx(6)};
    border-radius: ${artPx(8)};
  }

  @media (prefers-reduced-motion: reduce) {
    &[href] {
      transition: none;
    }

    &[href]:hover {
      transform: none;
    }
  }

  ${phone} {
    gap: ${phoneSize(0.3)};
  }
`

/** Sized like the image, so the shine can sit exactly on top of it. */
const ConditionImageWrap = styled.span`
  position: relative;
  display: block;
  width: 100%;
`

/**
 * A glint that sweeps across each card (masked to the painted card) when the
 * row scrolls into view; staggered left to right. See conditionShine.
 */
const cardShineSweep = keyframes`
  0% {
    background-position: 160% 0;
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    background-position: -60% 0;
    opacity: 0;
  }
`

const CardShine = styled.span`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(
    110deg,
    transparent 38%,
    rgba(255, 255, 255, 0.15) 44%,
    rgba(255, 255, 255, 0.85) 50%,
    rgba(255, 255, 255, 0.15) 56%,
    transparent 62%
  );
  background-size: 250% 100%;
  background-repeat: no-repeat;
  mask: url(${({ $src }) => $src}) center / contain no-repeat;
  -webkit-mask: url(${({ $src }) => $src}) center / contain no-repeat;

  [data-shine="1"] & {
    animation: ${cardShineSweep} 950ms ease-in-out both;
  }

  [data-shine="1"] ${ConditionFigure}:nth-child(2) & {
    animation-delay: 180ms;
  }

  [data-shine="1"] ${ConditionFigure}:nth-child(3) & {
    animation-delay: 360ms;
  }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`

const ConditionImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-height: ${artPx(384)};
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));

  ${phone} {
    max-height: 22vw;
  }
`

const ConditionCaption = styled.figcaption`
  margin: 0;
  color: #fff;
  font-family: var(--font-body);
  ${artFont(29.6)}
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 0 12px rgba(0, 0, 0, 0.35);

  ${phone} {
    font-size: ${phoneSize(0.75)};
  }
`

const RailImg = styled(PlateImg)`
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
`

const ParallaxBack = styled.div`
  position: relative;
  width: 100%;
  will-change: auto;

  @media (prefers-reduced-motion: reduce) {
    transform: none !important;
    will-change: auto;
  }
`

/** See BACK_CLIP_ASPECT. In flow, so it also sizes BackScene (and the birds' clip). */
const BackClip = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: ${BACK_CLIP_ASPECT};
  overflow: hidden;
`

/** Idle float once the turtle has surfaced. */
const turtleFloat = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  50% {
    transform: translate3d(0, -7%, 0) rotate(-2deg);
  }
`

const TurtleWindow = styled.div`
  position: absolute;
  /* Above the waterfall copy band (z 2) so the bolt and its hit aren't
     covered by that band's full-bleed pointer layer. */
  z-index: 3;
  /* Clipped while he is still behind the page edge. Once he has surfaced,
     the lightning bolt is allowed to extend past the crop. */
  overflow: ${({ $out }) => ($out ? "visible" : "hidden")};
  pointer-events: none;
`

/**
 * Slides out from behind the page edge when the reader reaches the waterfall
 * (see turtleOut), and back behind it if they scroll up above his section.
 * He eases in without overshooting the tucked pose. He's painted cut off
 * at the page edge, so the rest pose stays left of that cut: the shiver
 * can travel right and the cropped back still stays under the bank.
 */
const TurtleSneak = styled.div`
  position: absolute;
  inset: 0;
  transform: translate3d(${({ $out }) => ($out ? TURTLE_REST_X : "-100%")}, 0, 0);
  transition: transform
    ${({ $out }) =>
      $out
        ? "1100ms cubic-bezier(0.22, 1, 0.36, 1)"
        : "600ms cubic-bezier(0.5, 0, 0.75, 0)"};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

/** A bit smaller than painted, anchored at the edge so he stays on the waterline. */
const TurtleFloat = styled.div`
  position: absolute;
  inset: 0;
  transform-origin: 0% 60%;
  scale: ${TURTLE_SCALE};
  animation: ${turtleFloat} 3.4s ease-in-out infinite;
  animation-play-state: ${({ $out }) => ($out ? "running" : "paused")};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const TurtleImg = styled(PlateImg)`
  position: absolute;
  display: block;
  height: auto;
  max-width: none;
  pointer-events: none;
  user-select: none;
`

const TurtleHqImg = styled.img`
  position: absolute;
  display: block;
  height: auto;
  max-width: none;
  pointer-events: none;
  user-select: none;
`

/** Where a bird's petamon spot goes; it moves with the bird. */
const BirdSpotAnchor = styled.div`
  position: absolute;
  visibility: hidden;
  pointer-events: none;
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

/** Moves a bird off its painted spot (birdHomeStyle). */
const BirdHome = styled.div`
  position: absolute;
  inset: 0;
  transform: var(--bird-home, none);

  ${phone} {
    transform: var(--bird-home-phone, none);
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
  transition: filter 0.25s ease;

  /* Human Practices' bird while its bubble is open (HomePlaza's BirdSpot),
     lit like the plaza petamons' spotlights, with a faint halo since it's
     pale. */
  [data-lit="1"] > & {
    filter: brightness(1.04) saturate(1.3)
      drop-shadow(0 0 4px rgba(255, 250, 225, 0.6));
  }
`

const BirdFrame = styled(PlateImg)`
  position: absolute;
  left: 0;
  top: 0;
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
  ${props => plateFlap(props, birdFlapA, birdFlapB, 520)}
  ${({ $durationMs }) => plateFlapFaster(BirdsStack, $durationMs || 520, 0.72)}
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

/** Float is held until the loader's logo lands here (see logoHandoff). */
const LogoFloatWrap = styled.div`
  width: 100%;
  animation: ${logoIdleFloat} 4.2s ease-in-out infinite;
  animation-play-state: ${({ $landed }) => ($landed ? "running" : "paused")};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Stacked frames; first image stays in-flow so the rail keeps its height. */
const LogoFlapper = styled.div`
  position: relative;
  width: 100%;
  visibility: ${({ $landed }) => ($landed ? "visible" : "hidden")};
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
  /* Scales with the art (192px at the 1440 reference), phones included. */
  width: ${artPx(192)};
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
  width: ${artPx(224)};
  height: ${artPx(128)};
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
