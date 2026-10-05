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
    /** Sized to its list, so the kangaroos on the left aren't covered. */
    fit: true,
    indicator: { name: "nav-bar-highlight", box: [136, 456, 289, 528] },
    /** Coin that rides on the left end of the highlight. */
    indicatorIcon: { name: "navbar-icon", box: [100, 460, 160, 515] },
    linkColor: "#5b3a1a",
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
