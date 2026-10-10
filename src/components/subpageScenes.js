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
    indicator: { name: "box-subsection-indicator", box: [88, 452, 241, 513] },
    /** The highlight's painted colour, for UI that matches it (footer button). */
    highlightColor: "#9c6e56",
    /** Crab sitting on the box's bottom edge. */
    crab: { name: "box-crab", box: [144, 804, 195, 860] },
    linkColor: "#fbf3ea",
    /** Narrow screens: the list becomes a sticky strip of this colour. */
    stripColor: "#b0886c",
    stripTexture: true,
  },
  /** Text box; it stretches with the text between its caps. */
  text: {
    name: "box-extendable",
    box: [274, 320, 804, 2488],
    caps: [40, 40],
    /** Shortest box (plate px): the mockup's length. */
    minH: 2168,
  },
  /**
   * Where the text ends in the art (plate y): just above the cobweb tunnel,
   * so its crab is in view. The art scrolls at whatever pace lands this line
   * on the text box's bottom edge; below it (bottle, dino, fossil) is a
   * decorative ending that scrolls with the page.
   */
  textEndY: 2960,
}

export const VENTURE_SCENE = {
  header: "Entrepreneurship",
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
    /**
     * Sized to its list but capped at about half the window (the list
     * scrolls inside), so the kangaroos on the left stay in view.
     */
    fit: true,
    maxHeight: "min(24rem, 52vh)",
    linkPadY: 7,
    indicator: { name: "nav-bar-highlight", box: [136, 456, 289, 528] },
    /** The highlight's painted colour, for UI that matches it (footer button). */
    highlightColor: "#f2b574",
    /** Coin that rides on the left end of the highlight. */
    indicatorIcon: { name: "navbar-icon", box: [100, 460, 160, 515] },
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
    fit: true,
    maxHeight: "min(24rem, 52vh)",
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
    // Extra lighting: glints down the walls and pillars into the pool.
    { name: "bottom-lightning-turtles", box: [127, 1985, 1088, 3942] },
    // Hover (tap on touch) the turtle: it shivers and the lightning on
    // zapzap crackles round it.
    {
      name: "turtle-1",
      box: [76, 1815, 426, 2392],
      hit: [125, 1865, 315, 2150],
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
    fit: true,
    maxHeight: "min(24rem, 52vh)",
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
 * Project › Contribution: a greenhouse. The page is one big season calendar,
 * so there's no section list and the text box is wide, ending just above the
 * petamons on the steps (they and the pool below are the ending).
 */
export const CONTRIBUTION_SCENE = {
  header: "Contribution",
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
    // Each subteam's petamon on the steps, one file each so they can move
    // on their own. Four do what their subteam's critters do on hover (tap
    // on touch): the kangaroo throws Venture's coins, the bird loops like
    // the Human Practices birds, the crab scuttles like Dry Lab's, and the
    // turtle gets Hardware's lightning.
    { name: "venpetamon", coinBurst: true, box: [0, 2800, 196, 3362] },
    // Faces us; looping "rightward" rolls it counterclockwise.
    { name: "hppetamon", loop: { facing: 1 }, box: [120, 2724, 348, 2822] },
    { name: "orpetamon", box: [222, 2806, 396, 3005] },
    { name: "webpetamon", box: [371, 2755, 644, 3004] },
    { name: "wlpetamon", box: [604, 2783, 805, 2910] },
    { name: "dlpetamon", crab: true, box: [161, 3046, 290, 3148] },
    {
      name: "hwpetamon",
      box: [300, 3006, 541, 3210],
      hit: [304, 3012, 534, 3202],
      // The standing turtle's lightning on the Hardware plate, stretched
      // over this one.
      zap: {
        name: `${HARDWARE_SCENE.assetBase}zapzap.avif`,
        from: [122, 1830, 352, 2133],
        box: [288, 2984, 552, 3218],
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
    box: [90, 412, 1020, 2690],
    minH: 900,
  },
  textEndY: 2690,
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
  },
}

/**
 * Attributions: a sunset over the Toronto skyline. No section list yet; the
 * box ends above the buildings, which (with the birds) are the ending.
 */
export const ATTRIBUTIONS_SCENE = {
  header: "Attributions",
  boxTitle: "Overview",
  assetBase: "https://static.igem.wiki/teams/6187/wiki/attributions/",
  plate: [1110, 4000],
  background: "#c0c0be",
  skyBottom: 400,
  headerColor: "#4f4159",
  accent: "#8a4f60",
  layers: [
    { name: "bg", box: [0, 0, 1110, 4000] },
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
    box: [140, 412, 970, 3400],
    minH: 2000,
  },
  textEndY: 3400,
}
