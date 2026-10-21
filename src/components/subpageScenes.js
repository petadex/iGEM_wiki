/**
 * Art for the parallax subpages (see SubpageScene). Every asset in a scene
 * is a full plate already aligned to the others, so pieces are placed by
 * their bounding box in plate px [x0, y0, x1, y1]; only that window renders.
 */

/**
 * The bottle-carrying crabs pace their tunnel (hole-mid-3) on a loop: walk in
 * from the right edge to the tunnel's left end, stop, turn around, walk back,
 * turn again. Kept slow so it doesn't pull focus from the text.
 */
const DRY_LAB_PATROL = {
  /** Crab's left edge at each end of the walk (plate px). */
  rightX: 765,
  leftX: 55,
  walkS: 22,
  pauseS: 1.4,
  turnS: 0.5,
  /** One wobble (lean one way) every this many seconds while walking. */
  stepS: 0.4,
  leanDeg: 3,
  /** Tunnel floor (plate y) along its length, by the crab's center x. */
  floor: [
    [100, 1930],
    [220, 1940],
    [340, 1949],
    [460, 1952],
    [580, 1953],
    [700, 1946],
    [820, 1941],
    [900, 1942],
  ],
}

const NEEDLEMAN_BASE = "https://static.igem.wiki/teams/6187/wiki/drylab-page/needleman/"

/**
 * Sun, clouds and dunes, painted together on a 3798×1908 canvas that is the
 * full width of the dry-lab plate, so it covers the top of the scene.
 */
const DRY_LAB_NEWTOP_BOX = [0, 0, 918, (1908 * 918) / 3798]

function dryLabNewtop(name, file) {
  return {
    name,
    src: `https://static.igem.wiki/teams/6187/wiki/drylab-page/newtop/${file}`,
    box: DRY_LAB_NEWTOP_BOX,
    // The file fills that window. It isn't a crop of the 918×4000 plate.
    fill: true,
  }
}

/**
 * Needleman the cactus and Wunsch the tumbleweed (see NeedlemanCactus), drawn
 * on their own 2580×1872 plate: `scale` and `at` (where the plate's top-left
 * lands, in scene px) put them on the skyline where the old saguaro stood.
 */
const DRY_LAB_CACTUS = {
  assetBase: NEEDLEMAN_BASE,
  plate: [2580, 1872],
  scale: 0.17,
  at: [512, -8],
  body: { name: "needleman", box: [1507, 472, 2016, 1713] },
  /** Where he sways from: the bottom of his trunk. */
  base: [1820, 1713],
  /** Rests flipped down about the shoulder; flips up on hover. */
  arm: { name: "needleman-arm", box: [1880, 559, 2176, 992], shoulderY: 940 },
  /** `tail`: the tip it pops out from. */
  bubble: { name: "text-box", box: [894, 87, 1616, 726], tail: [1520, 714] },
  /**
   * Wunsch and his scroll share one image; `clip` splits them along a line
   * just left of the scroll's outline, so none of it rolls away with him.
   */
  friend: {
    name: "wunch",
    box: [1930, 1310, 2302, 1745],
    clip: "polygon(0% 0%, 96.77% 0%, 96.24% 20.69%, 94.89% 25.29%, 94.09% 29.89%, 93.55% 34.48%, 92.47% 39.08%, 91.13% 43.68%, 90.05% 48.28%, 88.71% 52.87%, 87.9% 57.47%, 86.56% 62.07%, 85.75% 66.67%, 84.68% 71.26%, 83.06% 75.86%, 81.72% 80.46%, 79.84% 85.06%, 78.23% 89.66%, 77.69% 94.25%, 76.88% 100%, 0% 100%)",
    /** Center of the ball he rolls on, and its radius (plate px). */
    hub: [2100, 1600],
    radius: 118,
  },
  prop: {
    name: "wunch",
    box: [2205, 1310, 2355, 1745],
    clip: "polygon(56.67% 0%, 100% 0%, 100% 100%, 7.33% 100%, 9.33% 94.25%, 10.67% 89.66%, 14.67% 85.06%, 19.33% 80.46%, 22.67% 75.86%, 26.67% 71.26%, 29.33% 66.67%, 31.33% 62.07%, 34.67% 57.47%, 36.67% 52.87%, 40% 48.28%, 42.67% 43.68%, 46% 39.08%, 48.67% 34.48%, 50% 29.89%, 52% 25.29%, 55.33% 20.69%)",
  },
  /** The skyline Wunsch rolls along (scene px), with the painted cactus and tumbleweed smoothed out. */
  floor: [
    [0, 265], [40, 273], [80, 283], [120, 290], [160, 295], [200, 286],
    [240, 275], [280, 266], [320, 263], [360, 258], [400, 255], [440, 253],
    [480, 258], [520, 266], [560, 276], [600, 281], [640, 277], [680, 276],
    [720, 275], [760, 274], [800, 274], [840, 278], [880, 281], [917, 262],
  ],
}

export const DRY_LAB_SCENE = {
  header: "Dry Lab",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/drylab-page/",
  plate: [918, 4000],
  /** Shown behind the art while it loads. */
  background: "#c9b48a",
  /** Sky band above the boxes where the header sits (plate px). */
  skyBottom: 290,
  headerColor: "#5c3f2e",
  /** Subsection bars and small headings in the text box. */
  accent: "#a0603a",
  /** Background art, back to front. */
  layers: [
    // Ground layers (whole width).
    { name: "layer-1", box: [0, 0, 918, 4000] },
    // Paints out layer-1's saguaro, where Needleman (`cactus`) now stands.
    { name: "cactus-patch", src: `${NEEDLEMAN_BASE}cactus-patch.avif`, box: [760, 85, 918, 300] },
    // Sky over the old horizon (back to front): rays, clouds, then the dunes.
    // The dunes sit in front of the sky and behind Needleman, the sentence
    // and the rest of the header.
    dryLabNewtop("newtop-sunlight", "sunlight.avif"),
    dryLabNewtop("newtop-clouds", "clouds.avif"),
    dryLabNewtop(
      "newtop-dunes",
      "dunes-sandwich-between-sky-and-everything-else.avif",
    ),
    { name: "layer-2", box: [0, 1305, 918, 3136] },
    { name: "layer-3", box: [0, 2567, 918, 4000] },
    // Holes and paths dug into the ground.
    { name: "hole-top-1", box: [0, 278, 918, 1088] },
    { name: "hole-top-2", box: [0, 1218, 273, 1337] },
    { name: "hole-top-3", box: [763, 1076, 918, 1248] },
    { name: "hole-mid-1", box: [0, 1511, 163, 1632] },
    { name: "hole-mid-2", box: [0, 2266, 199, 2528] },
    { name: "hole-mid-3", box: [39, 1814, 918, 1984] },
    { name: "hole-bottom-1", box: [563, 2986, 918, 3121] },
    { name: "microplastic-fragments", box: [32, 327, 918, 3170] },
    // Buried objects.
    { name: "vase-mid", box: [0, 2536, 192, 2848] },
    { name: "fossil-bottom", box: [8, 3696, 296, 3969] },
    { name: "dino-bottom", box: [504, 3266, 918, 3744] },
    { name: "bottle-top", box: [856, 269, 914, 361] },
    { name: "bottle-bottom", box: [0, 3336, 144, 3553] },
    { name: "web-mid", box: [478, 1817, 689, 1952] },
    { name: "web-bottom", box: [803, 2983, 918, 3120] },
    // Critters.
    { name: "crab-2", crab: true, box: [11, 946, 77, 1017] },
    {
      name: "crab-carrying-bottle",
      patrol: DRY_LAB_PATROL,
      box: [99, 1849, 242, 1937],
    },
    { name: "red-crab", crab: true, box: [260, 1875, 320, 1934] },
    { name: "crab-1", crab: true, box: [70, 2407, 145, 2496] },
    // Second crab-1 in the cobweb tunnel (hole-bottom-1), where the mockup has
    // it; `from` is where the sprite sits on its plate.
    {
      name: "crab-cobweb",
      src: "crab-1",
      from: [70, 2407, 145, 2496],
      crab: true,
      box: [655, 3014, 730, 3103],
    },
    // Not in the mockup (three crabs on the path where crab-2 sits) — kept for
    // an animation / easter egg later.
    { name: "crab-in-a-row", box: [11, 855, 232, 1016], hidden: true },
  ],
  /** Side box (subsection list); `caps` are the unstretched top/bottom (plate px). */
  side: {
    name: "subsection-box",
    box: [78, 314, 249, 865],
    caps: [60, 70],
    /** First item's distance below the box top (plate px). */
    navTop: 32,
    /** A little taller than the other boxes shut, so the overview fits. */
    maxHeight: "min(26rem, 56vh)",
    indicator: { name: "box-subsection-indicator", box: [88, 452, 241, 513] },
    /** The highlight's painted colour, for UI that matches it (footer button). */
    highlightColor: "#9c6e56",
    /**
     * Fossil riding on the left end of the highlight. Its own image rather
     * than a plate layer; `crop` is the painted part of its `size` canvas.
     */
    indicatorIcon: {
      name: "https://static.igem.wiki/teams/6187/wiki/drylab-page/icon-dry-lab-small.avif",
      box: [63, 467, 96, 498],
      canvas: { size: [360, 342], crop: [0, 0, 360, 342] },
    },
    /** Crab sitting on the box's bottom edge. */
    crab: { name: "box-crab", box: [144, 804, 195, 860] },
    linkColor: "#fbf3ea",
    /** Narrow screens: the list becomes a sticky strip of this colour. */
    stripColor: "#b0886c",
    /** The compact menu's "Compact" chip. */
    railTag: { bg: "#e9d5bf", text: "#5c3f2e" },
    stripTexture: true,
  },
  /** Text box; it stretches with the text between its caps. */
  text: {
    name: "box-extendable",
    box: [274, 320, 804, 2488],
    caps: [40, 40],
    /** Shortest box (plate px): the mockup's length. */
    minH: 2168,
    /** Callouts, placeholders and other capped blocks span the whole box. */
    fullWidthBlocks: true,
  },
  /**
   * Where the text ends in the art (plate y): just above the cobweb tunnel,
   * so its crab is in view. The art scrolls at whatever pace lands this line
   * on the text box's bottom edge; below it (bottle, dino, fossil) is a
   * decorative ending that scrolls with the page.
   */
  textEndY: 2960,
  cactus: DRY_LAB_CACTUS,
  /**
   * The Dry Lab calendar (overview page) in desert colours: parchment panels,
   * sandstone lines, terracotta for what's selected. Its workstreams carry
   * their own colours (dryLabCalendar.js); "all" is the header's brown.
   */
  vars: {
    "--cal-surface": "#fffaf2",
    "--cal-chrome": "#f4e8d6",
    "--cal-line": "#dcc6a4",
    "--cal-ink": "#3b2a1f",
    "--cal-muted": "#76604c",
    "--cal-accent": "#a0603a",
    "--cal-hover": "#f3e6d2",
    "--cal-tint": "rgba(160, 96, 58, 0.12)",
    "--cal-cell": "#fffaf2",
    "--cal-cell-hover": "#f7ecdc",
    "--cal-cell-line": "rgba(120, 84, 50, 0.2)",
    "--cal-cell-out": "#f3e7d6",
    "--cal-cell-out-hover": "#ebdcc6",
    "--cal-cell-out-line": "rgba(120, 84, 50, 0.1)",
    "--cal-band": "#ecc9a8",
    "--cal-band-out": "#f3dfcb",
    "--cal-band-line": "#a0603a",
    "--cal-band-out-line": "rgba(160, 96, 58, 0.35)",
    "--cal-sunday": "#a0603a",
  },
}

export const VENTURE_SCENE = {
  header: "Entrepreneurship",
  headerSub: "Developing a go-to-market strategy roadmap for post-iGEM season commercialization.",
  /** The header already names the page, so the text box opens with this. */
  boxTitle: "Overview",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/venture/",
  plate: [1110, 4000],
  /** The top of bg.avif has a mock navbar painted in; start the art below it. */
  cropTop: 78,
  background: "#46557a",
  skyBottom: 400,
  headerColor: "#23395b",
  accent: "#c4701f",
  /** Table header rows in the menu highlight's orange. */
  tableHead: "#f2b574",
  layers: [
    { name: "bg", box: [0, 0, 1110, 4000] },
    { name: "coins", box: [11, 1696, 176, 3041] },
    // Hover (tap on touch) a kangaroo: coins burst out from behind it.
    { name: "sad-venturoo", coinBurst: true, box: [16, 1286, 289, 1728] },
    { name: "second-venturoo", coinBurst: true, box: [88, 2564, 352, 2960] },
    // Same spot as second-venturoo with the bag swung behind it; not in the
    // mockup — kept for an animation later.
    { name: "venturoo-reaching", box: [23, 2564, 352, 2985], hidden: true },
  ],
  /** Loose coins on coins.avif used for the kangaroo bursts (plate px). */
  coinSprites: [
    { name: "coins", box: [123, 1995, 157, 2030] },
    { name: "coins", box: [97, 2359, 132, 2387] },
  ],
  // The side column and text box are both flat rectangles on `text-space`.
  side: {
    name: "text-space",
    box: [135, 412, 288, 1225],
    caps: [4, 4],
    navTop: 40,
    linkPadY: 7,
    indicator: { name: "nav-bar-highlight", box: [136, 456, 289, 528] },
    /** The highlight's painted colour, for UI that matches it (footer button). */
    highlightColor: "#f2b574",
    /**
     * Coin that rides on the left end of the highlight; turned so its $
     * stands upright, and drawn 5px left of where it's painted so it clears
     * the item's text.
     */
    indicatorIcon: {
      name: "navbar-icon",
      from: [100, 460, 160, 515],
      box: [95, 460, 155, 515],
      rotate: -30,
    },
    linkColor: "#5b3a1a",
    /** Narrower column than Dry Lab's, so slightly smaller section names. */
    linkSize: 11.5,
    stripColor: "#f6e4aa",
  },
  text: {
    name: "text-space",
    box: [339, 412, 980, 3691],
    caps: [4, 4],
    minH: 2000,
  },
  /** Bottom of the mockup's text box; the river below is the ending. */
  textEndY: 3691,
}

/** Homepage art reused on the subpages (birds). */
const HOME_ART = "https://static.igem.wiki/teams/6187/wiki/homepage-components/"

/**
 * Homepage birds, each with its two flap frames and the window it's drawn
 * in (`from`) on its source image (`plate`). They face left unless `faces`
 * is 1 (right).
 */
const BIRD_SPRITES = {
  // White bird gliding, facing left (homepage sky).
  glider: {
    a: `${HOME_ART}birds/wiki-front-page-bird-1.avif`,
    b: `${HOME_ART}birds/wiki-front-page-bird-1-2.avif`,
    plate: [1440, 3239],
    from: [495, 634, 686, 769],
    flapMs: 980,
  },
  // White bird angled into a dive, facing left (homepage sky).
  diver: {
    a: `${HOME_ART}birds/wiki-front-page-bird-2.avif`,
    b: `${HOME_ART}birds/wiki-front-page-bird-2-2.avif`,
    plate: [1440, 3239],
    from: [1242, 228, 1384, 404],
    flapMs: 480,
  },
  // Faint distant birds (homepage sky).
  farGlider: {
    a: `${HOME_ART}birds/wiki-front-page-bird-3.avif`,
    b: `${HOME_ART}birds/wiki-front-page-bird-3-2.avif`,
    plate: [1440, 3239],
    from: [433, 197, 620, 336],
    flapMs: 1100,
  },
  farDiver: {
    a: `${HOME_ART}birds/wiki-front-page-bird-4.avif`,
    b: `${HOME_ART}birds/wiki-front-page-bird-4-2.avif`,
    plate: [1440, 3239],
    from: [74, 346, 211, 514],
    flapMs: 520,
  },
  // Jungle birds (homepage explorer section).
  jungleDiver: {
    a: `${HOME_ART}section-3-animals/section-3-bird-a.avif`,
    b: `${HOME_ART}section-3-animals/section-3-bird-a-2.avif`,
    plate: [2238, 3132],
    from: [1546, 1092, 1688, 1268],
    flapMs: 480,
  },
  // Hovering, facing right.
  hoverer: {
    faces: 1,
    a: `${HOME_ART}section-3-animals/section-3-bird-b.avif`,
    b: `${HOME_ART}section-3-animals/section-3-bird-b-2.avif`,
    plate: [2238, 3132],
    from: [691, 1055, 857, 1209],
    flapMs: 720,
  },
}

/**
 * A bird placed on a scene plate: left/top and width in plate px (height
 * keeps the sprite's shape). `opts` can flip it or change its idle motion.
 */
function bird(name, sprite, x, y, width, opts = {}) {
  const s = BIRD_SPRITES[sprite]
  const [fx0, fy0, fx1, fy1] = s.from
  const height = Math.round((width * (fy1 - fy0)) / (fx1 - fx0))
  return {
    name,
    flyer: { ...s, ...opts },
    box: [x, y, x + width, y + height],
  }
}

export const HP_SCENE = {
  header: "Human Practices",
  headerSub: "Navigating real-world challenges and constraints using stakeholder feedback and ethical guiding principles to inform our technical pipeline.",
  boxTitle: "Overview",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/hp-page/",
  plate: [1110, 4000],
  background: "#cfe6ef",
  skyBottom: 400,
  headerColor: "#2c4f43",
  accent: "#4c8269",
  layers: [
    { name: "bg-w-trees", box: [0, 0, 1110, 4000] },
    // Distant (faint) birds fly behind the scenery: the cloud and trees
    // below are drawn over them.
    bird("bird-far-1", "farGlider", 30, 150, 120, {
      phaseMs: 400,
      cross: { dir: -1, seconds: 95, at: 0.3 },
    }),
    bird("bird-far-2", "farDiver", 25, 960, 80, { phaseMs: 900, sway: 10 }),
    bird("bird-far-3", "farGlider", 985, 3330, 110, {
      phaseMs: 2200,
      cross: { dir: -1, seconds: 90, at: 0.7 },
    }),
    // Same as the cloud painted into bg-w-trees, so drawn over the distant
    // birds it hides them as they pass behind it. (It doesn't move: that
    // would show the painted copy underneath.)
    { name: "cloud-if-u-want-it-to-move", box: [352, 63, 1081, 419] },
    // Just the trees (bg-w-trees minus plain-bg), over the distant birds.
    { name: "trees-only", box: [0, 3023, 1110, 4000] },
    // The other birds fly in front. Five of all the birds cross the page on
    // a loop (slowly, 55–95 s a crossing, in the direction they face); the
    // rest hover in the margins.
    bird("bird-glider-1", "glider", 905, 40, 150, {
      phaseMs: 1800,
      cross: { dir: -1, seconds: 60, at: 0.05 },
    }),
    bird("bird-diver-1", "diver", 995, 1330, 100, { phaseMs: 2600, sway: 10 }),
    bird("bird-hover-1", "hoverer", 12, 1820, 118, { phaseMs: 1300, sway: 10 }),
    bird("bird-glider-2", "glider", 8, 2560, 122, {
      flip: true,
      phaseMs: 3100,
      cross: { dir: 1, seconds: 70, at: 0.55 },
    }),
    bird("bird-jungle-1", "jungleDiver", 996, 2860, 100, {
      phaseMs: 700,
      sway: 8,
    }),
    bird("bird-hover-2", "hoverer", 960, 3560, 120, {
      phaseMs: 1600,
      cross: { dir: 1, seconds: 75, at: 0.2 },
    }),
  ],
  // Side column and text box are flat rectangles on `text`, like Venture's.
  side: {
    name: "text",
    box: [135, 412, 288, 1225],
    caps: [4, 4],
    navTop: 40,
    linkPadY: 7,
    linkSize: 11.5,
    indicator: { name: "nav-bar-highlight", box: [136, 456, 289, 528] },
    /** The highlight's painted colour, for UI that matches it (footer button). */
    highlightColor: "#689581",
    /** Feather riding on the left end of the highlight. */
    indicatorIcon: { name: "new-nav-icon", box: [111, 453, 156, 523] },
    linkColor: "#2e4a3c",
    /** Light text on the dark green highlight. */
    activeLinkColor: "#ffffff",
    stripColor: "#cdd6b7",
  },
  text: {
    name: "text",
    box: [339, 412, 980, 3691],
    caps: [4, 4],
    minH: 2000,
  },
  /** Bottom of the mockup's text box; the treeline below is the ending. */
  textEndY: 3691,
}

/** Every Hardware page; each box is titled with its page's short name. */
export const HARDWARE_SCENE = {
  header: "Hardware",
  headerSub: "Engineering parallel bioreactor systems that can quantify enzymatic degradation in various conditions.",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/hardware-notebook/",
  plate: [1110, 4000],
  background: "#20222e",
  skyBottom: 400,
  headerColor: "#e6e1ff",
  /** Light title on the dark cave: a soft crystal glow instead of a highlight. */
  headerShadow:
    "0 0 0.4em rgba(135, 123, 199, 0.6), 0 0.08em 0.3em rgba(0, 0, 0, 0.5)",
  accent: "#6b5cb5",
  layers: [
    { name: "bg", box: [0, 0, 1110, 4000] },
    // The cave mouth above the boxes was empty. These three share the plate
    // with `bg` (back to front): crystals, a red dusting, then sparkles.
    {
      name: "newtop-crystals",
      src: "https://static.igem.wiki/teams/6187/wiki/hardware-notebook/newtop/img-3853.avif",
      box: [0, 0, 1110, 4000],
    },
    {
      name: "newtop-red",
      src: "https://static.igem.wiki/teams/6187/wiki/hardware-notebook/newtop/red.avif",
      box: [0, 0, 1110, 4000],
    },
    {
      name: "newtop-sparkle",
      src: "https://static.igem.wiki/teams/6187/wiki/hardware-notebook/newtop/sparkle.avif",
      box: [0, 0, 1110, 4000],
      // A small drift and twinkle. Held still when motion is reduced.
      glitter: true,
    },
    // Extra lighting: glints down the walls and pillars into the pool.
    { name: "bottom-lightning-turtles", box: [127, 1985, 1088, 3942] },
    // Hover (tap on touch) the turtle: it shivers and the lightning on
    // zapzap crackles round it.
    {
      name: "turtle-1",
      box: [76, 1815, 426, 2392],
      hit: [125, 1865, 315, 2150],
      // Just it and its halo shiver: glints on the pipes stay put.
      jolt: [118, 1858, 388, 2166],
      zap: { name: "zapzap", box: [122, 1830, 352, 2133] },
    },
    // The turtle lying in the pool does the same with its own lightning.
    {
      name: "turtle-2",
      box: [173, 3760, 566, 3961],
      hit: [170, 3815, 569, 3950],
      zap: { name: "zapzap", box: [164, 3819, 568, 4000] },
    },
  ],
  // Side column and text box are flat rectangles on `text-space`.
  side: {
    name: "text-space",
    box: [135, 412, 288, 1225],
    caps: [4, 4],
    navTop: 40,
    linkPadY: 7,
    linkSize: 11.5,
    indicator: { name: "nav-bar-highlight", box: [136, 458, 287, 517] },
    /** The highlight's painted colour, for UI that matches it (footer button). */
    highlightColor: "#877bc7",
    /** Crystal riding on the left end of the highlight. */
    indicatorIcon: { name: "navbaricon", box: [107, 452, 164, 520] },
    /** The crystal reaches further in than Venture's coin; clear its text. */
    linkIndent: 20,
    linkColor: "#2a2350",
    activeLinkColor: "#ffffff",
    stripColor: "#a39dcb",
  },
  text: {
    name: "text-space",
    box: [339, 412, 980, 3691],
    caps: [4, 4],
    minH: 2000,
  },
  /** Bottom of the mockup's text box; the pool below is the ending. */
  textEndY: 3691,
}

/**
 * Every Wet Lab page: a sunset sea. Bubbles keep rising, the school of fish
 * keeps swimming laps, and the three axolotls light up when hovered (tapped
 * on touch): two hide behind the text box, peeking out, until the pointer
 * leaves; the one in open water swims a lap round the page.
 */
export const WET_LAB_SCENE = {
  header: "Wet Lab",
  headerSub: "Creating high-throughput, scalable assays to test candidate enzymes retrieved by Dry Lab.",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/wetlab/",
  plate: [1110, 4000],
  background: "#0b8fa6",
  skyBottom: 400,
  /** Deep sea blue: reads on the pink and gold of the sunset. */
  headerColor: "#123540",
  accent: "#0b6f80",
  layers: [
    { name: "1-background", box: [0, 266, 1110, 4000] },
    // Rising from the seafloor to the surface, in the open water either side
    // of the text box, behind everything else in the sea.
    {
      name: "bubbles",
      bubbles: {
        lanes: [
          { x: [15, 315], count: 16 },
          { x: [990, 1095], count: 9 },
        ],
        from: 3480,
        /** The water's surface, under the waves' edge: they fade out there. */
        to: 385,
        seconds: [26, 40],
      },
    },
    { name: "2-sky", box: [0, 0, 1110, 358] },
    { name: "3-sunset-clouds", box: [0, 0, 1110, 353] },
    { name: "4-waves", box: [0, 152, 1110, 396] },
    // Painted on the left; drawn on the right of the text box instead,
    // mirrored so it still dives out towards the page's edge.
    {
      name: "8-shark",
      from: [69, 2411, 261, 2631],
      box: [918, 2411, 1110, 2631],
      flip: true,
    },
    { name: "6-seabed", box: [0, 3349, 1110, 4000] },
    { name: "9-seaweeds", box: [0, 1696, 1110, 4000] },
    { name: "5-kelp", box: [56, 2960, 257, 3475] },
    // The school faces right: off the right edge, back in from the left.
    {
      name: "7-fishies",
      box: [947, 1022, 1093, 1111],
      swim: { ms: 52000, delayMs: 1200, dir: 1 },
    },
    // These two (`box` covers their glow) slide `dx` plate px behind the text
    // box (333–982) when hovered, leaving their heads peeking out.
    // Its painting stops flat where the box covers it: rest it 30px further
    // in than painted, so the pop back out (which overshoots) never shows that
    // edge.
    {
      name: "15-pop-out-glow",
      from: [36, 1357, 429, 1788],
      box: [66, 1357, 459, 1788],
      peek: { plain: "14-pop-out", dx: 131 },
    },
    // Painted beside the other two; drawn up near the top of the text box
    // instead, above the fish, so the three spread down the page.
    {
      name: "11-swimming-right-glow",
      from: [829, 1480, 1110, 1720],
      box: [829, 640, 1110, 880],
      // Its glow runs off the page's edge: faded there, as it slides in.
      peek: { plain: "10-swimming-right", dx: -58, fadeX: [1088, 1110] },
    },
    // This one swims a lap: out the left edge, back in at the right edge to
    // peek, then left again behind the text box to its spot. Drawn lower
    // than it's painted: just above the seabed, in front of the kelp.
    {
      name: "13-swimming-left-glow",
      from: [21, 1934, 331, 2171],
      box: [21, 3080, 331, 3317],
      lap: { plain: "12-swimming-left", out: -340, enter: 1100, peek: 965 },
    },
  ],
  side: {
    name: "17-side-box",
    box: [135, 413, 289, 1224],
    caps: [4, 4],
    navTop: 40,
    linkPadY: 7,
    linkSize: 11.5,
    /** No highlight is painted for this page: a flat one in the axolotls' yellow. */
    indicator: { fill: "#f7e36b", box: [135, 456, 289, 517] },
    highlightColor: "#f7e36b",
    /**
     * A bubble rides on its left end (painted on its own 946×4000 canvas); a
     * soft glow keeps it from getting lost against the water.
     */
    indicatorIcon: {
      name: "bubble",
      box: [89, 457, 147, 512],
      canvas: { size: [946, 4000], crop: [458, 3090, 529, 3157] },
      glow: "rgba(255, 255, 255, 0.9)",
      /** A little bigger than the other pages' icons in the labelled menu. */
      railScale: 1.2,
    },
    linkColor: "#0b4a57",
    activeLinkColor: "#0b4a57",
    stripColor: "#e6f6f8",
  },
  text: {
    // The box's solid edges: its painted top and bottom rows are see-through,
    // and stretched on a long page they'd show as a fade.
    name: "16-main-body-box",
    box: [340, 413, 980, 3691],
    caps: [4, 4],
    minH: 2000,
  },
  /** Bottom of the mockup's text box; the seabed below is the ending. */
  textEndY: 3691,
}

/**
 * Project › Contribution: a greenhouse. The page is one big season calendar,
 * so there's no section list and the text box is wide, ending just above the
 * petamons on the steps (they and the pool below are the ending).
 */
/**
 * The Outreach acorn (drop-acorn.avif): it bonks the squirrels on the head
 * when they're hovered (see BonkLayer), there and on Contribution.
 */
const OUTREACH_ACORN = {
  src: "https://static.igem.wiki/teams/6187/wiki/outreach/drop-acorn.avif",
  plate: [1110, 4000],
  box: [130, 3426, 254, 3550],
}

/**
 * Sharper petamons on the same canvas: all of them in one picture (the bird,
 * bunny, dragon and turtle are drawn from it, each cut out by its `clip`),
 * and the dragon's markings on their own.
 */
const CONTRIBUTION_HQ =
  "https://static.igem.wiki/teams/6187/wiki/contributions/hq-petamon/"

export const CONTRIBUTION_SCENE = {
  header: "Contribution",
  headerSub: "Reusable outputs and lessons from PetaBite that can contribute to future teams and microplastics research.",
  boxTitle: "Overview",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/contributions/",
  plate: [1110, 4000],
  background: "#c0dad3",
  skyBottom: 400,
  headerColor: "#2e5247",
  accent: "#46725f",
  layers: [
    { name: "bg", box: [0, 0, 1110, 4000] },
    // Seedlings in the planter, behind the Dry Lab bug.
    { name: "sprouts", box: [70, 2997, 290, 3090] },
    // Each subteam's petamon on the steps, a layer each so they can move
    // on their own. Six do what their subteam's critters do on hover (tap
    // on touch): the kangaroo throws Venture's coins, the bird loops like
    // the Human Practices birds, Outreach's gets bonked by an acorn, the
    // crab scuttles like Dry Lab's, the turtle gets Hardware's lightning and
    // the axolotl hides like Wet Lab's.
    { name: "venpetamon", coinBurst: true, box: [0, 2800, 196, 3362] },
    // Faces us; looping "rightward" rolls it counterclockwise. Cut round the
    // kangaroo's ring, painted over its wing.
    {
      name: "hppetamon",
      src: `${CONTRIBUTION_HQ}petamon.avif`,
      loop: { facing: 1 },
      box: [60, 2650, 370, 2834],
      clip: [
        [60, 2650], [370, 2650], [370, 2834], [126, 2834], [126, 2807],
        [120, 2806], [114, 2809], [108, 2815], [102, 2821], [96, 2827],
        [90, 2830], [84, 2832], [60, 2832],
      ],
    },
    // Outreach's: bonked by an acorn, like the Outreach squirrels.
    {
      name: "orpetamon",
      src: `${CONTRIBUTION_HQ}petamon.avif`,
      box: [211, 2850, 393, 3009],
      // Not the edge of the dragon's haze, above its tail.
      clip: [
        [211, 2850], [387, 2850], [387, 2938], [393, 2938], [393, 3009],
        [211, 3009],
      ],
      // A smaller acorn for this smaller critter, between its ears.
      bonk: { head: [259, 2898], acorn: { ...OUTREACH_ACORN, scale: 0.5 } },
    },
    // Catches fire like the Wiki dragons: a fiery glow spreads out from
    // behind it, from its head, its eyes glow, its swirls light up and it
    // trembles.
    // The axolotl hides like the Wet Lab ones: it lights up, hops back over
    // the floor's back edge (where the water starts) and sinks behind it,
    // peeking over, until the pointer leaves. Its arm's over the dragon's
    // tail: it hops high enough for its whisker to clear the tail, and goes
    // behind the dragon from there.
    {
      name: "wlpetamon",
      box: [604, 2783, 805, 2910],
      // The floor's back edge slopes down to the right under it.
      duck: { edge: [[600, 2881], [800, 2893]], show: 60, hop: 62, over: true },
    },
    {
      name: "webpetamon",
      // On its own, tail and all (the axolotl's arm goes over it). Its
      // flames' wisps left of the box are over the bunny, so they're left
      // to the bunny's crop.
      src: "https://static.igem.wiki/teams/6187/wiki/contributions/img-3782.avif",
      box: [386, 2815, 646, 3022],
      dragon: {
        // Its glow fades out to the left, off the bunny.
        heat: { pad: 60, fade: [376, 404] },
        markings: [
          `${CONTRIBUTION_HQ}scales.avif`,
          `${CONTRIBUTION_HQ}swirls.avif`,
          `${CONTRIBUTION_HQ}eyes.avif`,
        ],
        swirls: `${CONTRIBUTION_HQ}swirls.avif`,
        from: [440, 2945],
        reach: 260,
        eyes: [
          [420.5, 2966],
          [448.5, 2969.5],
        ],
        eyeSize: 18,
        hits: [[392, 2815, 646, 3020]],
      },
    },
    { name: "dlpetamon", crab: true, box: [161, 3046, 290, 3148] },
    {
      name: "hwpetamon",
      src: `${CONTRIBUTION_HQ}petamon.avif`,
      box: [326, 3024, 540, 3203],
      hit: [328, 3028, 538, 3201],
      // The standing turtle's lightning on the Hardware plate, stretched
      // over this one.
      zap: {
        name: `${HARDWARE_SCENE.assetBase}zapzap.avif`,
        from: [122, 1830, 352, 2133],
        box: [314, 3004, 545, 3210],
      },
    },
  ],
  /** Loose coins on Venture's coins.avif, for the kangaroo (same plate size). */
  coinSprites: VENTURE_SCENE.coinSprites.map(coin => ({
    ...coin,
    name: `${VENTURE_SCENE.assetBase}${coin.name}.avif`,
  })),
  side: null,
  /** No menu highlight to match, so the footer button takes the accent. */
  footerButton: { bg: "#46725f", text: "#ffffff" },
  /** Not painted: a flat box in the greenhouse's paper colour. */
  text: {
    fill: "#fdf9f0",
    box: [90, 412, 1020, 2640],
    minH: 900,
  },
  textEndY: 2640,
  /**
   * The calendar in greenhouse colours: paper panels, sandstone lines, sage
   * for what's selected, terracotta Sundays. Subteams take the team's painted
   * swatches (Hardware, Venture and Human Practices match their pages' menu
   * highlights), each with a dark label that reads on it.
   */
  vars: {
    "--cal-surface": "#fffdf7",
    "--cal-chrome": "#f3ecdc",
    "--cal-line": "#d9c9a8",
    "--cal-ink": "#2b3a30",
    "--cal-muted": "#6a6650",
    "--cal-accent": "#46725f",
    "--cal-hover": "#f1ead9",
    "--cal-tint": "rgba(70, 114, 95, 0.12)",
    "--cal-cell": "#fffdf7",
    "--cal-cell-hover": "#f5eee0",
    "--cal-cell-line": "rgba(120, 96, 60, 0.2)",
    "--cal-cell-out": "#f1eadb",
    "--cal-cell-out-hover": "#e8dfcc",
    "--cal-cell-out-line": "rgba(120, 96, 60, 0.1)",
    "--cal-band": "#bcdccf",
    "--cal-band-out": "#dce9e1",
    "--cal-band-line": "#46725f",
    "--cal-band-out-line": "rgba(70, 114, 95, 0.35)",
    "--cal-sunday": "#b0543c",
    "--cal-team-wetLab": "#76b8c8",
    "--cal-team-wetLab-text": "#0c2a32",
    "--cal-team-dryLab": "#f5e5b2",
    "--cal-team-dryLab-text": "#3d3112",
    "--cal-team-hardware": "#877bc3",
    "--cal-team-hardware-text": "#17122e",
    "--cal-team-humanPractices": "#648b80",
    "--cal-team-humanPractices-text": "#0b1d18",
    "--cal-team-outreach": "#cd7261",
    "--cal-team-outreach-text": "#2a0d08",
    "--cal-team-venture": "#eab781",
    "--cal-team-venture-text": "#3a230e",
    "--cal-team-web": "#afbc90",
    "--cal-team-web-text": "#1f2914",
    "--cal-team-all": "#2b3a30",
    "--cal-team-all-text": "#fffdf7",
  },
}

/**
 * Attributions: a sunset over the Toronto skyline. No section list yet; the
 * box runs down over the empty sunset to the dome's top, and the dome and the
 * buildings round it (with the birds) are the ending.
 */
export const ATTRIBUTIONS_SCENE = {
  header: "Attributions",
  headerSub: "The specific tasks each member was responsible for, entirely documented.",
  boxTitle: "Overview",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/attributions/",
  plate: [1110, 4000],
  background: "#c0c0be",
  skyBottom: 400,
  headerColor: "#4f4159",
  accent: "#8a4f60",
  layers: [
    { name: "bg1", box: [0, 0, 1110, 4000] },
    // Loop-the-loop on hover (tap on touch), counterclockwise like the
    // Contribution bird.
    { name: "birds", loop: { facing: 1 }, box: [1020, 3388, 1108, 3484] },
  ],
  side: null,
  /** No menu highlight to match: the skyline's purple. */
  footerButton: { bg: "#584960", text: "#ffffff" },
  /** Not painted: a flat, faintly warm box on the sunset. */
  text: {
    fill: "#fffbf7",
    box: [140, 412, 970, 3720],
    minH: 2000,
  },
  textEndY: 3720,
}

/** Finance: one painting of snowy peaks with a mine cart of gold coins. */
export const FINANCE_SCENE = {
  header: "Finance",
  headerSub: "Securing sponsorships and funding from industry, academic, and community partners to advance our scientific innovation.",
  hideIntro: true,
  assetBase: "https://static.igem.wiki/teams/6187/wiki/finance/",
  plate: [1216, 4000],
  background: "#c0d8db",
  skyBottom: 400,
  headerColor: "#2f3b52",
  accent: "#94651a",
  layers: [{ name: "img-3638", box: [0, 0, 1216, 4000] }],
  side: {
    fill: "#f8fafb",
    box: [70, 412, 365, 1100],
    navTop: 24,
    linkColor: "#2f3b52",
    activeLinkColor: "#ffffff",
    linkSize: 15,
    linkIndent: 18,
    stripColor: "#f8fafb",
    highlightColor: "#94651a",
    indicator: { fill: "#94651a", box: [80, 442, 355, 492] },
  },
  /** No menu highlight to match: the valley's navy. */
  footerButton: { bg: "#3a4760", text: "#ffffff" },
  /** Not painted: a flat, cool white box, right of the mine cart. */
  text: {
    fill: "#f8fafb",
    box: [400, 412, 1140, 3400],
    minH: 2000,
  },
  textEndY: 3400,
}

/** Safety and Security: a murky swamp, caution tape strung through the trees. */
export const SAFETY_SCENE = {
  header: "Safety",
  headerSub: "Technical challenges and security considerations that informed the development of PetaBite, and how we mitigated risk.",
  boxTitle: "Overview",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/safety/",
  plate: [1110, 4000],
  background: "#578b7d",
  skyBottom: 400,
  /** The tape's cream, lifted off the teal with a dark shadow. */
  headerColor: "#f4e6a8",
  headerShadow:
    "0 0.06em 0 rgba(16, 32, 48, 0.55), 0 0.1em 0.4em rgba(0, 0, 0, 0.35)",
  accent: "#a8483a",
  layers: [
    { name: "bg", box: [0, 0, 1110, 4000] },
    // Strung either side of the box (the right-hand strands run behind it):
    // each hanging strand sways in the wind from where it's tied, a little
    // out of step with the others. The short one is hung a little right of
    // where it's painted, so its curl clears the box's edge as it sways.
    ...[
      [[0, 1716, 120, 2300], 1.2, 5200, 0],
      [[968, 1692, 1076, 1848], 3, 3900, 0.4, 16],
      [[976, 2988, 1060, 3708], 1, 4600, 0.7],
    ].map(([from, deg, ms, at, dx = 0]) => ({
      name: `caution-tape-${from[1]}`,
      src: "caution-tape",
      from,
      box: [from[0] + dx, from[1], from[2] + dx, from[3]],
      sway: { deg, ms, at },
    })),
  ],
  side: null,
  /** No menu highlight to match: the caution tape. */
  footerButton: { bg: "#e9d684", text: "#102030" },
  text: {
    name: "text-space",
    box: [135, 413, 979, 3691],
    caps: [4, 4],
    minH: 2000,
  },
  /** Bottom of the painted box; the pond below is the ending. */
  textEndY: 3691,
}

/**
 * The Engineering winch: the gear turns, winding the rope in over it and
 * lifting the bucket WINCH_LIFT plate px, holds, then lets it back down.
 * The gear is centred on the rope's curve over it (radius WINCH_ROPE_R), so
 * its turn is the rope's travel.
 */
const WINCH_MS = 16000
const WINCH_LIFT = 400
const WINCH_ROPE_R = 124
const WINCH_GEAR = [1143.6, 971.2]
/** The full gear's hole, where it's painted on its plate. */
const GEAR_HOLE = [495.4, 1013.1]
const around = ([x, y], r) => [x - r, y - r, x + r, y + r]

/** Engineering: a sunset quarry, a bucket hung on a rope from a gear. */
export const ENGINEERING_SCENE = {
  header: "Engineering",
  headerSub: "How we’ve integrated the Design, Build, Test, and Learn pipeline into every stage of PetaBite.",
  boxTitle: "Overview",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/engineering/",
  plate: [1110, 4000],
  background: "#fee7c5",
  skyBottom: 400,
  /** The mountain's dark brown, on the pale sunset. */
  headerColor: "#3e3128",
  accent: "#b04a38",
  layers: [
    { name: "bg", box: [0, 0, 1110, 4000] },
    // The rope runs up behind the gear. Over it, in its shadow, the rope's
    // plain red, so that part stays put; the striped rope below rides up
    // and down with the bucket. The two cross-fade where they meet.
    {
      name: "rope-over-gear",
      src: "full-rope",
      box: [985, 840, 1110, 1075],
      fadeY: [0, 30],
    },
    {
      name: "rope-bucket",
      src: "full-rope",
      box: [960, 1045, 1110, 2462],
      fadeY: [30, 0],
      winch: {
        ms: WINCH_MS,
        lift: WINCH_LIFT,
        // The rope bends right a little as it comes off the gear; slid up
        // past the join, it's moved back by that much to line up with it.
        drift: [[0, 0], [30, 1.9], [60, 3.4], [80, 4.8]],
      },
    },
    {
      name: "gear",
      src: "full-gear",
      from: around(GEAR_HOLE, 165),
      box: around(WINCH_GEAR, 165),
      winch: {
        ms: WINCH_MS,
        turn: (WINCH_LIFT / WINCH_ROPE_R) * (180 / Math.PI),
        // Turned as the old, cut-off gear was painted.
        rest: 105.5,
      },
    },
  ],
  side: null,
  /** No menu highlight to match: the girders' red. */
  footerButton: { bg: "#b04a38", text: "#ffffff" },
  text: {
    name: "text-space",
    box: [135, 413, 979, 3691],
    caps: [4, 4],
    minH: 2000,
  },
  /** Bottom of the painted box; the quarry below is the ending. */
  textEndY: 3691,
}

/**
 * Outreach: an autumn forest. The squirrel on the box's right edge slides
 * down it with the reader, leaves drift across on the wind (left to right)
 * and an acorn rolls down the log at the bottom. Hovered (tapped), each
 * squirrel gets bonked on the head by an acorn from the top of the window.
 */
export const OUTREACH_SCENE = {
  header: "Outreach",
  headerSub: "Publicizing PetaBite to audiences beyond the scientific community, while perfecting the project’s internal and external identity.",
  hideIntro: true,
  assetBase: "https://static.igem.wiki/teams/6187/wiki/outreach/",
  plate: [1110, 4000],
  background: "#3d4423",
  skyBottom: 400,
  /** Cream on the sunlit canopy, lifted off it with a dark shadow. */
  headerColor: "#fff2d6",
  headerShadow:
    "0 0.06em 0 rgba(30, 36, 14, 0.6), 0 0.1em 0.45em rgba(0, 0, 0, 0.45)",
  accent: "#a8642c",
  layers: [
    { name: "background", box: [0, 0, 1110, 4000] },
    // The leaves on the left blow right, in behind the box; the painted
    // ones and a few more along the page.
    ...[
      [[26, 2210, 238, 2318], null, [-268, -40], [334, 100], 9000, 0],
      [[186, 2322, 310, 2414], null, [-340, -20], [174, 140], 8000, 0.45],
      [[226, 2682, 358, 2758], null, [-388, 0], [134, 90], 8500, 0.75],
      [[26, 1300, 238, 1408], [26, 2210, 238, 2318], [-268, 0], [334, 120], 10000, 0.2],
      [[186, 3000, 310, 3092], [186, 2322, 310, 2414], [-340, 0], [174, 100], 9000, 0.6],
      [[226, 1000, 358, 1076], [226, 2682, 358, 2758], [-388, 0], [134, 80], 9500, 0.1],
    ].map(([box, from, a, b, ms, at]) => ({
      name: `leaf-1-${box[0]}-${box[1]}`,
      src: "leaf-1",
      box,
      ...(from && { from }),
      wind: { from: a, to: b, ms, at },
    })),
    {
      name: "branch-squirrel",
      box: [84, 1636, 348, 1916],
      bonk: { head: [282, 1738], acorn: OUTREACH_ACORN },
    },
    // Rolling slowly down the log (it slopes down to the left), behind the
    // bottom squirrel's feet, from off the window's right to off its left.
    {
      name: "rolling-acorn",
      src: "drop-acorn",
      from: OUTREACH_ACORN.box,
      box: [556, 3652, 644, 3740],
      wind: {
        from: [550, -94],
        to: [-700, 119],
        ms: 18000,
        at: 0.3,
        bob: 0,
        wobble: 0,
        // Rolling, not sliding: its turn is the distance over its radius.
        spin: -1628,
      },
    },
    {
      name: "bottom-squirrel",
      box: [4, 3524, 292, 3862],
      bonk: { head: [178, 3562], acorn: OUTREACH_ACORN },
    },
    // The green leaves on the right: some come out from behind the box and
    // blow off the window, some cross from one side of the window to the
    // other (the small ones over the box, under its text and the sketchbook;
    // the big ones behind it, so they don't sweep over the section menu).
    ...[
      [[996, 3162, 1108, 3278], [-133, -20], [124, 80], 4500, 0],
      [[1050, 2970, 1108, 3100], [-133, 0], [70, 60], 4000, 0.5],
      [[948, 3036, 996, 3092], [-21, -10], [172, 70], 4500, 0.3],
      [[972, 3262, 1052, 3388], [-77, 0], [148, 90], 4200, 0.7],
    ].map(([box, a, b, ms, at]) => ({
      name: `leaf-2-${box[0]}-${box[1]}`,
      src: "leaf-2",
      box,
      wind: { from: a, to: b, ms, at, spin: 90 },
    })),
    ...[
      [[754, 3162, 974, 3334], [-994, -40], [371, 60], 22000, 0, false],
      [[730, 3410, 830, 3500], [-850, -30], [395, 50], 20000, 0.5, false],
      [[676, 3340, 780, 3390], [-800, -20], [449, 70], 21000, 0.25, true],
      [[586, 3402, 662, 3446], [-682, -30], [539, 40], 19000, 0.75, true],
    ].map(([box, a, b, ms, at, over]) => ({
      name: `leaf-2-${box[0]}-${box[1]}`,
      src: "leaf-2",
      box,
      wind: { from: a, to: b, ms, at, spin: 200 },
      ...(over && { front: "bottom" }),
    })),
    // Hugging the box's right edge (its paw and head on it), a third
    // smaller than painted; it slides down with the reader from Promo Video
    // to Road to Jamboree (see SlideLayer). Its outline (traced 4 plate px above its top, every
    // 4 columns) runs over its ears and raised paw.
    {
      name: "slide-squirrel",
      from: [884, 1176, 1106, 2044],
      box: [952, 1176, 1099, 1749],
      slide: {
        outline: [
          [884, 1640], [888, 1640], [892, 1653], [896, 1650], [900, 1650], [904, 1649],
          [908, 1649], [912, 1602], [916, 1590], [920, 1586], [924, 1515], [928, 1518],
          [932, 1522], [936, 1525], [940, 1525], [944, 1523], [948, 1528], [952, 1534],
          [956, 1534], [960, 1537], [964, 1543], [968, 1550], [972, 1560], [976, 1559],
          [980, 1557], [984, 1555], [988, 1554], [992, 1554], [996, 1558], [1000, 1574],
          [1004, 1575], [1008, 1509], [1012, 1506], [1016, 1503], [1020, 1500], [1024, 1500],
          [1028, 1501], [1032, 1505], [1036, 1507], [1040, 1518], [1044, 1700], [1048, 1700],
          [1052, 1700], [1056, 1700], [1060, 1700], [1064, 1700], [1068, 1700], [1072, 1700],
          [1076, 1700], [1080, 1700], [1084, 1700], [1088, 1700], [1092, 1700], [1096, 1700],
          [1100, 1700], [1106, 1700],
        ],
        view: "16vh",
        between: ["promo-video", "road-to-jamboree-series"],
      },
      bonk: {
        head: [955, 1530],
        // Where it's off the box, so the box's text keeps the pointer.
        hit: [1000, 1500, 1106, 2044],
        acorn: OUTREACH_ACORN,
      },
      front: "top",
    },
  ],
  side: {
    name: "small-block",
    box: [135, 409, 291, 1226],
    caps: [4, 4],
    navTop: 40,
    linkPadY: 7,
    linkSize: 11.5,
    indicator: { fill: "#a8642c", box: [136, 456, 290, 518] },
    /** The highlight's colour, for UI that matches it (footer button). */
    highlightColor: "#a8642c",
    /** The acorn sticker rides on the highlight's left end, drawn smaller. */
    indicatorIcon: {
      name: "tab-acorn",
      from: [72, 448, 208, 584],
      box: [98, 453, 162, 517],
    },
    linkIndent: 20,
    linkColor: "#33401f",
    activeLinkColor: "#ffffff",
    stripColor: "#efe3c8",
  },
  text: {
    name: "big-block",
    box: [339, 404, 988, 3693],
    caps: [4, 4],
    minH: 2000,
  },
  /**
   * Above the painted box's bottom (3693), so the ending shows the bottom
   * squirrel and its acorn whole, under the box and the section menu that
   * follows it down.
   */
  textEndY: 3420,
}

/**
 * Project Description: a night sky with two comets (the bottle and Gemy)
 * flying over the box, and the CN Tower rocket hovering over a planet below.
 * Comets and rocket burst into fireworks when clicked.
 */
export const PROJECT_SCENE = {
  header: "Project",
  headerSub:
    "PetaBite: Mapping Earth's Biodiversity to Discover Room-Temperature Plastic-Degrading Enzymes",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/project/",
  plate: [918, 4000],
  background: "#111926",
  skyBottom: 256,
  /** The box's cream, glowing like the planets. */
  headerColor: "#f1e6d4",
  headerShadow:
    "0 0 0.35em rgba(80, 130, 255, 0.55), 0 0.08em 0.3em rgba(0, 0, 0, 0.6)",
  accent: "#2f4fa0",
  layers: [
    { name: "project-back", box: [0, 0, 918, 4000] },
    // Flying through the sky head first, along their tails; clicked, they
    // burst into fireworks from their heads.
    {
      name: "project-gemy",
      box: [113, 101, 603, 224],
      fly: {
        slope: 0.17,
        ms: 34000,
        delayMs: 11000,
        head: [173, 178],
        colour: "#3fd94a",
      },
    },
    {
      name: "project-bottle",
      box: [321, 110, 793, 256],
      fly: {
        slope: 0.24,
        ms: 42000,
        delayMs: 30000,
        head: [360, 209],
        colour: "#4f86f0",
      },
    },
    // Hovers on its trail; rattles when hovered, bursts when clicked.
    {
      name: "cn-tower-rocket",
      box: [418, 2070, 492, 2364],
      rocket: {
        trail: "project-smoke-rocket",
        trailBox: [418, 2360, 495, 3620],
        hit: [395, 2050, 515, 2380],
        head: [455, 2190],
        colour: "#6f9cff",
      },
    },
  ],
  side: {
    fill: "#f1e6d4",
    box: [63, 256, 265, 1000],
    navTop: 24,
    linkColor: "#111926",
    activeLinkColor: "#111926",
    linkSize: 12.5,
    linkIndent: 14,
    stripColor: "#f1e6d4",
    highlightColor: "#e2662c",
    indicator: { fill: "#e2662c", box: [73, 286, 255, 336] },
  },
  /** Match the section menu's planet-orange highlight. */
  footerButton: { bg: "#e2662c", text: "#111926" },
  text: {
    name: "project-box",
    box: [285, 256, 864, 2001],
    // Preserve the full painted border when the menu narrows the text column.
    artBox: [63, 256, 864, 2001],
    // The speckled edges reach 68 (top) and 105 (bottom) plate px in, so
    // they stay out of the stretched middle.
    caps: [75, 110],
    minH: 1500,
    // Clear of the speckled edges (on top of the box's usual padding).
    inset: [50, 50, 80, 36],
  },
  /** Bottom of the painted box; the rocket and planet below are the ending. */
  textEndY: 2001,
}

/**
 * Wiki: two fire dragons in a volcano. Hovered (tapped), a dragon glows,
 * fire spreads across it from its head and its markings light up. Painted on a
 * 451×1476 canvas (positions below); the sharper files are the same canvas
 * scaled up, so they line up as is.
 */
/** The Wiki's sharper dragons and fire, on the same canvas at 1222×4000. */
const WIKI_HQ = "https://static.igem.wiki/teams/6187/wiki/wiki/higher-qual/"

export const WIKI_SCENE = {
  header: "Wiki",
  headerSub: "The journey behind building the PetaBite Wiki for the iGEM 2026 cycle.",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/wiki/",
  plate: [451, 1476],
  /**
   * Shows through the small gaps between the painting's strokes (mostly in
   * the lava): the dark of its outlines, so they read as painted, not holes.
   */
  background: "#211619",
  skyBottom: 156,
  /** Firelight on the smoky sky. */
  headerColor: "#ffe7c2",
  headerShadow:
    "0 0 0.35em rgba(240, 96, 0, 0.65), 0 0.08em 0.3em rgba(0, 0, 0, 0.6)",
  accent: "#b8430e",
  layers: [
    { name: "sky", src: `${WIKI_HQ}skygood.avif`, box: [0, 0, 451, 1223] },
    {
      name: "mountains",
      src: `${WIKI_HQ}mountainsgood.avif`,
      box: [0, 0, 451, 1476],
    },
    {
      name: "dragon1",
      src: `${WIKI_HQ}dragon1good.avif`,
      box: [300, 36, 451, 540],
      dragon: {
        glow: "dragon1glow",
        glowBox: [270, 0, 451, 548],
        fire: `${WIKI_HQ}fire1good.avif`,
        fireBox: [264, 0, 451, 250],
        from: [395, 70],
        reach: 240,
        // A few of its neck markings were drawn on dragon 2's highlight.
        highlights: [
          { name: `${WIKI_HQ}dragon1higlight.avif`, box: [330, 25, 451, 192] },
          { name: `${WIKI_HQ}dragon2higlight.avif`, box: [400, 170, 451, 206] },
        ],
        hits: [[300, 30, 451, 210]],
      },
    },
    {
      name: "dragon2",
      src: `${WIKI_HQ}dragon2good.avif`,
      box: [0, 537, 451, 1197],
      dragon: {
        glow: "dragon2glow",
        glowBox: [0, 633, 451, 1195],
        fire: `${WIKI_HQ}fire2good.avif`,
        fireBox: [0, 588, 451, 1202],
        tail: `${WIKI_HQ}dragon2tailgood.avif`,
        // Beside the box it's drawn over the box's end instead (text.front).
        tailNarrowOnly: true,
        tailBox: [0, 896, 451, 1152],
        from: [58, 760],
        reach: 640,
        highlights: [
          { name: `${WIKI_HQ}dragon2higlight.avif`, box: [0, 600, 451, 1120] },
        ],
        // Where it shows round the boxes: head (left) and coil (right).
        hits: [
          [0, 680, 136, 880],
          [392, 740, 451, 892],
        ],
        // Along the tail, where it's painted (lowered with it over the box).
        tailHits: [
          [0, 1085, 136, 1160],
          [136, 1030, 200, 1105],
          [200, 1005, 260, 1095],
          [260, 980, 330, 1088],
          [330, 945, 392, 1075],
          [392, 910, 451, 1052],
        ],
      },
    },
  ],
  side: {
    // A plain box (crisp at any size), a shade deeper than the text box's
    // peach so the two read apart, as on the other pages.
    fill: "#e6c4ab",
    radius: "0.6rem",
    box: [55, 160, 121, 594],
    navTop: 16,
    navBottom: 6,
    linkPadY: 7,
    linkSize: 11.5,
    /** No highlight is painted for this page: a flat one in the fire's orange. */
    indicator: { fill: "#f39a3d", box: [55, 178, 121, 203] },
    highlightColor: "#f39a3d",
    /**
     * A glowing dragon scale rides on its left end (three layers, top first),
     * a bit taller than the bar and clear of the titles; the list leaves
     * room under its last title for it (navBottom).
     */
    indicatorIcon: {
      layers: [
        `${WIKI_HQ}layer-29.avif`,
        `${WIKI_HQ}layer-28.avif`,
        `${WIKI_HQ}layer-27.avif`,
      ],
      from: [24, 167, 71, 217],
      box: [38.5, 179.3, 59.5, 201.7],
    },
    linkColor: "#4a2418",
    activeLinkColor: "#2a120a",
    stripColor: "#f6e6da",
  },
  text: {
    fill: "#f1dece",
    radius: "0.6rem",
    box: [136, 156, 392, 1047],
    minH: 700,
    // The lower dragon's tail, hung a little lower than painted, comes out
    // over the box's bottom corner, below the last text; its glow, fire and
    // markings below \`line\` (just above the tail) come with it.
    front: {
      dragon: "dragon2",
      line: [
        [0, 1067],
        [451, 872],
      ],
      dy: 50,
    },
    // Room under the text for the tail (it reaches ~70 plate px up the box).
    inset: [0, 0, 56, 0],
  },
  /** Bottom of the box; the lava below is the ending. */
  textEndY: 1047,
}
