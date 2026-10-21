import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import styled, { createGlobalStyle, css, keyframes } from "styled-components"
import { NeedlemanCactus } from "./NeedlemanCactus.js"

/**
 * Parallax subpage (Dry Lab, Venture, …): a tall painted plate scrolls behind
 * the text slower (or faster) than the page, so the end of the text lands on
 * the scene's `textEndY` line; the art below it is a decorative ending.
 * Subsections (h2) are listed in the sticky side box and the one being read
 * is highlighted. Each scene's art and boxes come from a config in
 * subpageScenes.js.
 */

/**
 * Nav and title type is authored against this art width (the Dry Lab plate),
 * so every scene uses the same sizes at the same window width.
 */
const TYPE_REF_W = 918

/** Type px (at TYPE_REF_W) → share of the scene width. */
const ax = px => `calc(var(--art-w, 100vw) * ${+(px / TYPE_REF_W).toFixed(6)})`

/** Plate px of the current scene → share of the scene width. */
const pp = px => `calc(var(--px) * ${px})`

const NARROW = "@media (max-width: 860px)"
const WIDE = "@media (min-width: 861px)"
// The minimised section menu: its width and the gap to the text box.
const RAIL_W = "12.75rem"
/** Labels hidden: the slim dot track. The text column takes the difference. */
const RAIL_DOT_W = "3.25rem"
const RAIL_GAP = "1rem"

/** Lets `--rail-w` ease, so the text box widens with the collapsing menu. */
const RailWidthProp = createGlobalStyle`
  @property --rail-w {
    syntax: "<length>";
    inherits: true;
    initial-value: 12.75rem;
  }
`

/**
 * The section box starts sized to its list, capped at about half the window
 * (the list scrolls inside) so the art beside it stays in view; its button
 * opens it to the box's full painted height. A scene's `side.maxHeight`
 * overrides the cap.
 */
const SIDE_COLLAPSED_MAX = "min(24rem, 52vh)"

/**
 * Hover scuttle, same as the homepage crabs: sidestep left, then right on the
 * next hover, wobbling ±θ on the way. Distance is a share of the art width
 * (the homepage's 4.5% of its plate), converted to each crab's own width.
 */
const CRAB_SCUTTLE_ART_PCT = 4.5
const CRAB_SCUTTLE_THETA_DEG = 16
const CRAB_SCUTTLE_MS = 480

/** Plate geometry + asset URLs for one scene. */
function plateOf(scene) {
  const [W, H] = scene.plate
  // A full URL borrows art from another scene's plate (same size).
  const asset = name =>
    name.includes("/") ? name : `${scene.assetBase}${name}.avif`

  return {
    W,
    H,
    asset,
    /** Absolute window over `box`, as % of the plate. */
    windowStyle: ([x0, y0, x1, y1]) => ({
      left: `${(x0 / W) * 100}%`,
      top: `${(y0 / H) * 100}%`,
      width: `${((x1 - x0) / W) * 100}%`,
      height: `${((y1 - y0) / H) * 100}%`,
    }),
    /** Full plate offset so `box` fills its window. */
    imgStyle: ([x0, y0, x1, y1]) => {
      const w = x1 - x0
      const h = y1 - y0
      return {
        width: `${(W / w) * 100}%`,
        height: `${(H / h) * 100}%`,
        left: `${(-x0 / w) * 100}%`,
        top: `${(-y0 / h) * 100}%`,
      }
    },
    /**
     * A layer's `clip` (an outline, plate px) on its full-plate image: only
     * what's inside shows, for art sharing one picture with its neighbours.
     */
    clip: points =>
      points && {
        clipPath: `polygon(${points
          .map(([x, y]) => `${((x / W) * 100).toFixed(3)}% ${((y / H) * 100).toFixed(3)}%`)
          .join(", ")})`,
      },
    /**
     * A layer's `fadeY` ([top, bottom], plate px): its window fades out over
     * that much of its top and bottom edges.
     */
    fadeY: ([, y0, , y1], fade) => {
      if (!fade) return null
      const pct = px => `${((px / (y1 - y0)) * 100).toFixed(3)}%`
      const mask = `linear-gradient(to bottom, transparent, #000 ${pct(fade[0])}, #000 calc(100% - ${pct(fade[1])}), transparent)`
      return { maskImage: mask, WebkitMaskImage: mask }
    },
    /** Background that stretches `box` of a plate over the whole element. */
    bg: (name, [x0, y0, x1, y1]) => {
      const w = x1 - x0
      const h = y1 - y0
      return {
        backgroundImage: `url(${asset(name)})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${(W / w) * 100}% ${(H / h) * 100}%`,
        backgroundPosition: `${(x0 / (W - w)) * 100}% ${(y0 / (H - h)) * 100}%`,
      }
    },
  }
}

/** Background showing `crop` of an image painted on its own `size` canvas. */
function canvasBg(url, { size: [W, H], crop: [x0, y0, x1, y1] }) {
  const w = x1 - x0
  const h = y1 - y0
  return {
    backgroundImage: `url(${url})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${(W / w) * 100}% ${(H / h) * 100}%`,
    backgroundPosition: `${(x0 / (W - w)) * 100}% ${(y0 / (H - h)) * 100}%`,
  }
}

function patrolFloorY(floor, cx) {
  if (cx <= floor[0][0]) return floor[0][1]
  for (let i = 1; i < floor.length; i++) {
    if (cx <= floor[i][0]) {
      const [x0, y0] = floor[i - 1]
      const [x1, y1] = floor[i]
      return y0 + ((y1 - y0) * (cx - x0)) / (x1 - x0)
    }
  }
  return floor[floor.length - 1][1]
}

const patrolCache = new Map()
const patrolFor = layer => {
  if (!patrolCache.has(layer)) patrolCache.set(layer, patrolKeyframes(layer))
  return patrolCache.get(layer)
}

/** Keyframes for one full patrol loop of the sprite in `layer.box`. */
function patrolKeyframes({ box, patrol }) {
  const [bx0, by0, bx1, by1] = box
  const w = bx1 - bx0
  const h = by1 - by0
  const { rightX, leftX, walkS, pauseS, turnS, stepS, leanDeg, floor } = patrol
  const baseFloor = patrolFloorY(floor, bx0 + w / 2)
  const frames = []
  let t = 0
  const at = (x, flip, lean) => {
    const dx = ((x - bx0) / w) * 100
    const dy = ((patrolFloorY(floor, x + w / 2) - baseFloor) / h) * 100
    frames.push([
      t,
      `translate(${dx.toFixed(2)}%, ${dy.toFixed(2)}%) scaleX(${flip}) rotate(${lean}deg)`,
    ])
  }
  const walk = (from, to, flip) => {
    const steps = Math.round(walkS / stepS)
    for (let i = 0; i <= steps; i++) {
      at(
        from + ((to - from) * i) / steps,
        flip,
        i === 0 || i === steps ? 0 : i % 2 ? leanDeg : -leanDeg,
      )
      if (i < steps) t += walkS / steps
    }
  }
  const turn = (x, from, to) => {
    t += pauseS
    at(x, from, 0)
    t += turnS
    at(x, to, 0)
    t += pauseS * 0.6
    at(x, to, 0)
  }
  walk(rightX, leftX, 1) // Sprite faces left as painted.
  turn(leftX, 1, -1)
  walk(leftX, rightX, -1)
  turn(rightX, -1, 1)
  const total = t
  const css = frames
    .map(
      ([ft, tf]) => `${((ft / total) * 100).toFixed(3)}% { transform: ${tf}; }`,
    )
    .join("\n")
  return { name: keyframes`${css}`, totalS: total }
}

/** A plate box cut in three: fixed-ratio caps, middle stretched to any height. */
function StretchBox({
  plate,
  name,
  box,
  caps: [capTop, capBottom],
  className,
}) {
  const [x0, y0, x1, y1] = box
  const w = x1 - x0
  return (
    <SliceStack className={className} aria-hidden>
      <SliceCap
        style={{
          aspectRatio: `${w} / ${capTop}`,
          ...plate.bg(name, [x0, y0, x1, y0 + capTop]),
        }}
      />
      <SliceMid style={plate.bg(name, [x0, y0 + capTop, x1, y1 - capBottom])} />
      <SliceCap
        style={{
          aspectRatio: `${w} / ${capBottom}`,
          ...plate.bg(name, [x0, y1 - capBottom, x1, y1]),
        }}
      />
    </SliceStack>
  )
}

/** Wraps a crab; hovering it plays one scuttle and leaves it at the new spot. */
function CrabScuttle({ plateW, box, as, style, children, ...rest }) {
  const [homeX, setHomeX] = useState(0)
  const [dir, setDir] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const busyRef = useRef(false)
  // Sidestep in % of the crab's own width.
  const step = (CRAB_SCUTTLE_ART_PCT * plateW) / (box[2] - box[0])

  const settle = () => {
    setHomeX(x => x + dir * step)
    setDir(d => -d)
    setPlaying(false)
    busyRef.current = false
  }

  const onEnter = () => {
    if (busyRef.current) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      settle()
      return
    }
    busyRef.current = true
    setPlaying(true)
  }

  return (
    <ScuttleShell
      as={as}
      style={{ ...style, transform: `translate3d(${homeX}%, 0, 0)` }}
      onMouseEnter={onEnter}
      onPointerDown={event => {
        // Touch has no hover: a tap scuttles it instead.
        if (event.pointerType !== "mouse") onEnter()
      }}
      {...rest}
    >
      <ScuttleMotion
        $playing={playing}
        $dir={dir}
        style={{ "--scuttle": `${step}%` }}
        onAnimationEnd={e => e.target === e.currentTarget && settle()}
      >
        {children}
      </ScuttleMotion>
    </ScuttleShell>
  )
}

/** Coins per burst, and how long the last one takes to fade (ms). */
const COIN_BURST_COUNT = 12
const COIN_BURST_MAX_MS = 2600
/** Bursts allowed on screen at once per kangaroo. */
const COIN_BURST_MAX_LIVE = 4

/** Little hop the kangaroo does with each burst (from its feet). */
const KANGAROO_HOP = [
  { transform: "translateY(0) scale(1, 1)" },
  { transform: "translateY(0) scale(1.03, 0.96)", offset: 0.15 },
  { transform: "translateY(-4%) scale(0.98, 1.03)", offset: 0.45 },
  { transform: "translateY(0) scale(1.03, 0.97)", offset: 0.78 },
  { transform: "translateY(0) scale(1, 1)" },
]
const KANGAROO_HOP_MS = 520

const rand = (a, b) => a + Math.random() * (b - a)

/** One burst's coins: thrown up and out from the middle, then fall and fade. */
function makeCoins(sprites) {
  return Array.from({ length: COIN_BURST_COUNT }, (_, i) => {
    const sprite = sprites[i % sprites.length]
    return {
      sprite,
      // Plate px: sideways drift, rise to the top of the arc, total drop.
      dx: rand(-200, 200),
      peak: -rand(140, 300),
      fall: rand(260, 460),
      spin: rand(-540, 540),
      scale: rand(0.75, 1.25),
      ms: rand(1400, 2100),
      delay: rand(0, 260),
    }
  })
}

/**
 * A layer that showers coins from behind itself when hovered (tapped on
 * touch). Each hover adds a burst; finished bursts are dropped, so it can
 * be played again and again.
 */
function CoinBurstLayer({ plate, layer, sprites, children }) {
  const [bursts, setBursts] = useState([])
  const nextId = useRef(0)
  const timers = useRef([])
  const triggerRef = useRef(null)
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const burst = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    // Restarts on every hover, even mid-hop.
    triggerRef.current?.animate(KANGAROO_HOP, {
      duration: KANGAROO_HOP_MS,
      easing: "ease-in-out",
    })
    const id = nextId.current++
    setBursts(list =>
      [...list, { id, coins: makeCoins(sprites) }].slice(-COIN_BURST_MAX_LIVE),
    )
    timers.current.push(
      setTimeout(
        () => setBursts(list => list.filter(b => b.id !== id)),
        COIN_BURST_MAX_MS,
      ),
    )
  }

  const [x0, y0, x1, y1] = layer.box
  const w = x1 - x0
  return (
    <>
      {/* Drawn before the kangaroo, so the coins come out from behind it. */}
      <CoinStage aria-hidden style={plate.windowStyle(layer.box)}>
        {bursts.map(b =>
          b.coins.map((c, i) => {
            const [sx0, sy0, sx1, sy1] = c.sprite.box
            return (
              <CoinX
                key={`${b.id}-${i}`}
                style={{
                  width: `${(((sx1 - sx0) / w) * 100 * c.scale).toFixed(2)}%`,
                  aspectRatio: `${sx1 - sx0} / ${sy1 - sy0}`,
                  "--dx": pp(c.dx),
                  "--peak": pp(c.peak),
                  "--fall": pp(c.fall),
                  "--spin": `${c.spin}deg`,
                  "--ms": `${c.ms}ms`,
                  "--delay": `${c.delay}ms`,
                }}
              >
                <CoinY>
                  <CoinSpin style={plate.bg(c.sprite.name, c.sprite.box)} />
                </CoinY>
              </CoinX>
            )
          }),
        )}
      </CoinStage>
      <CoinTrigger
        ref={triggerRef}
        data-layer={layer.name}
        style={plate.windowStyle([x0, y0, x1, y1])}
        onMouseEnter={burst}
        onPointerDown={event => {
          // Touch has no hover: a tap throws the coins instead.
          if (event.pointerType !== "mouse") burst()
        }}
      >
        {children}
      </CoinTrigger>
    </>
  )
}

/** Shiver a zapped layer gives (around its middle). */
const ZAP_JOLT = [
  { transform: "translate(0, 0) rotate(0deg)" },
  { transform: "translate(-1.5%, 0.5%) rotate(-2deg)", offset: 0.12 },
  { transform: "translate(1.5%, -0.5%) rotate(2deg)", offset: 0.26 },
  { transform: "translate(-1%, 0) rotate(-1.5deg)", offset: 0.4 },
  { transform: "translate(1%, 0) rotate(1deg)", offset: 0.54 },
  { transform: "translate(-0.5%, 0) rotate(-0.5deg)", offset: 0.7 },
  { transform: "translate(0, 0) rotate(0deg)" },
]
const ZAP_JOLT_MS = 600

/** Lightning: a few on/off flashes with a little crackle, then it fades. */
const ZAP_FLICKER = [
  { opacity: 0, transform: "translate(0, 0)" },
  { opacity: 1, transform: "translate(1%, -1%)", offset: 0.06 },
  { opacity: 0.15, transform: "translate(-1%, 0)", offset: 0.14 },
  { opacity: 1, transform: "translate(0, 1%)", offset: 0.2 },
  { opacity: 0.3, transform: "translate(1%, 0)", offset: 0.3 },
  { opacity: 1, transform: "translate(0, 0)", offset: 0.36 },
  { opacity: 0.85, transform: "translate(0, 0)", offset: 0.6 },
  { opacity: 0, transform: "translate(0, 0)" },
]
const ZAP_FLICKER_MS = 1100

/**
 * A layer that gets zapped when hovered (tapped on touch): it shivers and
 * `layer.zap` (lightning, hidden until then) flickers over it. Only
 * `layer.hit` takes the hover, so its glow doesn't.
 */
function ZapLayer({ plate, layer, children }) {
  const bodyRef = useRef(null)
  // `jolt`: just this part of the layer shivers (the critter and its halo);
  // the rest, like glints painted on the pipes round it, stays put.
  const jolt = layer.jolt
  const [x0, y0, x1, y1] = layer.box
  const holePct =
    jolt &&
    [
      ((jolt[0] - x0) / (x1 - x0)) * 100,
      ((jolt[1] - y0) / (y1 - y0)) * 100,
      ((jolt[2] - x0) / (x1 - x0)) * 100,
      ((jolt[3] - y0) / (y1 - y0)) * 100,
    ].map(v => `${v.toFixed(2)}%`)
  const boltRef = useRef(null)
  const zap = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    bodyRef.current?.animate(ZAP_JOLT, {
      duration: ZAP_JOLT_MS,
      easing: "ease-out",
    })
    boltRef.current?.animate(ZAP_FLICKER, {
      duration: ZAP_FLICKER_MS,
      easing: "linear",
    })
  }
  const bolt = layer.zap
  return (
    <>
      {jolt && (
        <ZapStill
          style={{
            ...plate.windowStyle(layer.box),
            // Everything but the jolting part (a hole where it is).
            clipPath: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${holePct[0]} ${holePct[1]}, ${holePct[2]} ${holePct[1]}, ${holePct[2]} ${holePct[3]}, ${holePct[0]} ${holePct[3]}, ${holePct[0]} ${holePct[1]})`,
          }}
        >
          {children}
        </ZapStill>
      )}
      <ZapBody
        ref={bodyRef}
        data-layer={layer.name}
        style={plate.windowStyle(jolt || layer.box)}
      >
        {jolt
          ? React.cloneElement(children, {
              style: { ...children.props.style, ...plate.imgStyle(jolt) },
            })
          : children}
      </ZapBody>
      <ZapBolt ref={boltRef} style={plate.windowStyle(bolt.box)}>
        <CropImg
          src={plate.asset(bolt.name)}
          alt=""
          decoding="async"
          draggable={false}
          // `from`: lightning drawn for another spot, stretched over `box`.
          style={plate.imgStyle(bolt.from || bolt.box)}
        />
      </ZapBolt>
      <ZapHit
        style={plate.windowStyle(layer.hit || layer.box)}
        onMouseEnter={zap}
        onPointerDown={event => {
          if (event.pointerType !== "mouse") zap()
        }}
      />
    </>
  )
}

/** On touch, a tapped critter stays hidden this long before popping back out. */
const PEEK_TOUCH_MS = 2500

/**
 * A swimmer that hides (the Wet Lab axolotls): hovered (tapped on touch), it
 * lights up (the layer itself is its glow, over `layer.peek.plain`) and slides
 * `layer.peek.dx` plate px behind the text box, leaving a little peeking out;
 * when the pointer leaves it pops back out and the glow fades. The hover area
 * stays where it started, so it doesn't chase the pointer. With `from`, it's
 * drawn from there on its plates into `box`. `peek.fadeX` [from, to] (plate
 * px, in `box`): the glow fades out across these columns, for a glow painted
 * cut off at the page's edge, which would show as a line as it slides in.
 */
function PeekLayer({ plate, layer, children }) {
  const [hidden, setHidden] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const [x0, , x1] = layer.box
  const fade = layer.peek.fadeX?.map(
    x => `${(((x - x0) / (x1 - x0)) * 100).toFixed(2)}%`,
  )
  const fadeMask =
    fade && `linear-gradient(to right, #000 ${fade[0]}, transparent ${fade[1]})`
  const hide = state => {
    window.clearTimeout(timer.current)
    setHidden(state)
  }
  return (
    <>
      <PeekWindow
        data-layer={layer.name}
        $hidden={hidden}
        style={{
          ...plate.windowStyle(layer.box),
          "--peek-x": `${((layer.peek.dx / (x1 - x0)) * 100).toFixed(2)}%`,
        }}
      >
        <CropImg
          src={plate.asset(layer.peek.plain)}
          alt=""
          decoding="async"
          draggable={false}
          style={plate.imgStyle(layer.from || layer.box)}
        />
        <PeekGlow
          $hidden={hidden}
          style={fadeMask && { maskImage: fadeMask, WebkitMaskImage: fadeMask }}
        >
          {children}
        </PeekGlow>
      </PeekWindow>
      <PeekHit
        style={plate.windowStyle(layer.peek.hit || layer.box)}
        onMouseEnter={() => hide(true)}
        onMouseLeave={() => hide(false)}
        onPointerDown={event => {
          if (event.pointerType === "mouse") return
          hide(true)
          timer.current = window.setTimeout(() => setHidden(false), PEEK_TOUCH_MS)
        }}
      />
    </>
  )
}

/** Fireworks: sparks per ring, rings per burst, and timings (ms). */
const FIREWORK_SPARKS = 24
const FIREWORK_RINGS = [
  { delay: 0, reach: [170, 270] },
  { delay: 280, reach: [90, 160] },
]
const FIREWORK_MS = [1100, 1600]
/** Lit up in each burst's own colour, with gold and white. */
const FIREWORK_COLOURS = ["#ffd36b", "#fff6dc"]
/** The rocket's finale: every colour, and how long it all takes (ms). */
const GRAND_COLOURS = [
  "#ff6ad5",
  "#ffd36b",
  "#fff6dc",
  "#ff8a3d",
  "#7dffc4",
]
const GRAND_RINGS = [
  { n: 40, reach: [270, 400], delay: 0 },
  { n: 28, reach: [150, 240], delay: 120 },
]
const GRAND_CRACKLES = 4
const SHOW_MAX_MS = { burst: 2200, grand: 3600 }

/** A ring of `n` sparks thrown out from `[ox, oy]` (plate px). */
function sparkRing(n, reach, ring, extra) {
  return Array.from({ length: n }, (_, i) => {
    const angle =
      ((i + (ring % 2) * 0.5) / n) * Math.PI * 2 + rand(-0.06, 0.06)
    const dist = rand(...reach)
    return {
      ox: 0,
      oy: 0,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      angle,
      ...extra(i),
    }
  })
}

/** A comet's burst: rings of round sparks, drooping as they fade. */
function makeBurst(colour) {
  const colours = [colour, colour, ...FIREWORK_COLOURS]
  const sparks = FIREWORK_RINGS.flatMap(({ delay, reach }, ring) =>
    sparkRing(FIREWORK_SPARKS, reach, ring, i => ({
      droop: rand(30, 60),
      size: rand(8, 14),
      colour: colours[(i + ring) % colours.length],
      ms: rand(...FIREWORK_MS),
      delay: delay + rand(0, 60),
    })),
  )
  return { sparks, flashes: [] }
}

/**
 * The rocket's grand finale: a white flash and a shockwave, a big burst of
 * long streaks in every colour, then smaller bursts crackling around it,
 * each its own colour, twinkling out.
 */
function makeGrandShow(colour) {
  const colours = [colour, ...GRAND_COLOURS]
  const flashes = [
    { ox: 0, oy: 0, size: 280, delay: 0 },
    { ox: 0, oy: 0, size: 220, delay: 40, ring: true },
  ]
  const sparks = GRAND_RINGS.flatMap(({ n, reach, delay }, ring) =>
    sparkRing(n, reach, ring, i => ({
      droop: rand(50, 90),
      size: rand(7, 11),
      streak: true,
      glitter: i % 3 === 0,
      colour: colours[(i + ring) % colours.length],
      ms: rand(1300, 1900),
      delay: delay + rand(0, 50),
    })),
  )
  for (let k = 0; k < GRAND_CRACKLES; k++) {
    const ox = rand(-240, 240)
    const oy = rand(-230, 110)
    const delay = 380 + k * 190 + rand(0, 80)
    const crackle = GRAND_COLOURS[k % GRAND_COLOURS.length]
    flashes.push({ ox, oy, size: 130, delay })
    sparks.push(
      ...sparkRing(16, [70, 130], k, () => ({
        droop: rand(20, 40),
        size: rand(6, 9),
        glitter: true,
        colour: crackle,
        ms: rand(800, 1200),
        delay: delay + rand(0, 40),
      })).map(sp => ({ ...sp, ox, oy })),
    )
  }
  return { sparks, flashes }
}

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/**
 * Fireworks over the whole plate: `burst(x, y, colour, grand)` sets one off
 * at a point on screen (client px), the rocket's finale when `grand`; render
 * `stage` among the layers.
 */
function useFireworks() {
  const stageRef = useRef(null)
  const [shows, setShows] = useState([])
  const nextId = useRef(0)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const burst = (x, y, colour, grand = false) => {
    const stage = stageRef.current?.getBoundingClientRect()
    if (!stage) return
    const id = nextId.current++
    setShows(list => [
      ...list,
      {
        id,
        x: ((x - stage.left) / stage.width) * 100,
        y: ((y - stage.top) / stage.height) * 100,
        ...(grand ? makeGrandShow(colour) : makeBurst(colour)),
      },
    ])
    timers.current.push(
      setTimeout(
        () => setShows(list => list.filter(b => b.id !== id)),
        SHOW_MAX_MS[grand ? "grand" : "burst"],
      ),
    )
  }
  const at = b => ({ left: `${b.x.toFixed(3)}%`, top: `${b.y.toFixed(3)}%` })
  const stage = (
    <FireworkStage ref={stageRef} aria-hidden>
      {shows.map(b => (
        <React.Fragment key={b.id}>
          {b.flashes.map((f, i) => (
            <Flash
              key={`f${i}`}
              $ring={f.ring}
              style={{
                ...at(b),
                width: pp(f.size),
                height: pp(f.size),
                "--ox": pp(f.ox),
                "--oy": pp(f.oy),
                "--delay": `${f.delay.toFixed(0)}ms`,
              }}
            />
          ))}
          {b.sparks.map((k, i) => (
            <Spark
              key={i}
              $glitter={k.glitter}
              style={{
                ...at(b),
                // A streak is long and thin, bright end leading.
                width: pp(k.streak ? k.size * 3.4 : k.size),
                height: pp(k.streak ? k.size * 0.8 : k.size),
                background: k.streak
                  ? `linear-gradient(90deg, transparent, ${k.colour})`
                  : k.colour,
                boxShadow: `0 0 ${pp(k.size)} ${k.colour}`,
                "--rot": k.streak ? `${k.angle.toFixed(3)}rad` : "0rad",
                "--ox": pp(k.ox),
                "--oy": pp(k.oy),
                "--dx": pp(k.dx),
                "--dy": pp(k.dy),
                "--droop": pp(k.droop),
                "--ms": `${k.ms.toFixed(0)}ms`,
                "--delay": `${k.delay.toFixed(0)}ms`,
              }}
            />
          ))}
        </React.Fragment>
      ))}
    </FireworkStage>
  )
  return { burst, stage }
}

/** Where plate point `[px, py]` is on screen, given a window over `box`. */
function screenPoint(el, [x0, y0, x1, y1], [px, py]) {
  const r = el.getBoundingClientRect()
  return [
    r.left + ((px - x0) / (x1 - x0)) * r.width,
    r.top + ((py - y0) / (y1 - y0)) * r.height,
  ]
}

/**
 * Something flying across the sky (the Project comets): head first along
 * `fly.slope` (plate px down per px left), it comes in past the plate's right
 * edge, crosses through where it's painted and out past the left edge, then
 * waits out of sight. `fly.ms` per pass; `fly.delayMs` offsets the start.
 * Clicked (tapped), it bursts into fireworks at its head (`fly.head`, plate
 * px, in `fly.colour`) and is gone until its next pass.
 */
function FlyLayer({ plate, layer, children }) {
  const [x0, , x1] = layer.box
  const { slope = 0, ms = 14000, delayMs = 0, head, colour } = layer.fly
  const inX = plate.W - x0
  const winRef = useRef(null)
  const [gone, setGone] = useState(false)
  const { burst, stage } = useFireworks()

  const explode = () => {
    if (gone || !head || prefersReducedMotion()) return
    burst(...screenPoint(winRef.current, layer.box, head), colour)
    setGone(true)
  }

  return (
    <>
      <FlyWindow
        ref={winRef}
        data-layer={layer.name}
        $gone={gone}
        $clickable={Boolean(head)}
        // Back for its next pass.
        onAnimationIteration={() => setGone(false)}
        onClick={explode}
        style={{
          ...plate.windowStyle(layer.box),
          "--fly-in-x": pp(inX),
          "--fly-in-y": pp(-inX * slope),
          "--fly-out-x": pp(-x1),
          "--fly-out-y": pp(x1 * slope),
          "--fly-ms": `${ms}ms`,
          "--fly-delay": `${-delayMs}ms`,
        }}
      >
        {children}
      </FlyWindow>
      {stage}
    </>
  )
}

/** Hovering: each rise or dip (ms), and how far it rises (plate px). */
const ROCKET_HOVER_MS = 2200
const ROCKET_HOVER_RISE = 14
/** After bursting, how long until the rocket is back (ms). */
const ROCKET_BACK_MS = 3200

/**
 * A rocket on its smoke trail (the Project CN Tower): it hovers, bobbing on
 * its trail (`rocket.trail`, a layer name, painted in `rocket.trailBox`),
 * which stretches from the ground to keep up. Hovered, it rattles like it's
 * about to go off; clicked (tapped), it bursts into fireworks from
 * `rocket.head` (plate px, in `rocket.colour`), trail and all, and is back a
 * few seconds later.
 */
function RocketLayer({ plate, layer, children }) {
  const rocketRef = useRef(null)
  const [rattle, setRattle] = useState(false)
  const [gone, setGone] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const { burst, stage } = useFireworks()
  const { trail, trailBox, hit, head, colour } = layer.rocket
  const [, ty0, , ty1] = trailBox

  const explode = () => {
    if (gone || prefersReducedMotion()) return
    burst(...screenPoint(rocketRef.current, layer.box, head), colour, true)
    setGone(true)
    setRattle(false)
    timer.current = window.setTimeout(() => setGone(false), ROCKET_BACK_MS)
  }

  return (
    <>
      <HoverBob
        $trail
        $gone={gone}
        aria-hidden
        style={{
          ...plate.windowStyle(trailBox),
          transformOrigin: "50% 100%",
          "--hover-stretch": (
            (ty1 - ty0 + ROCKET_HOVER_RISE) /
            (ty1 - ty0)
          ).toFixed(4),
        }}
      >
        <CropImg
          src={plate.asset(trail)}
          alt=""
          decoding="async"
          draggable={false}
          style={plate.imgStyle(trailBox)}
        />
      </HoverBob>
      <HoverBob
        $gone={gone}
        style={{
          ...plate.windowStyle(layer.box),
          "--hover-rise": -ROCKET_HOVER_RISE,
        }}
      >
        <RocketRattle
          ref={rocketRef}
          data-layer={layer.name}
          $rattle={rattle && !gone}
        >
          {children}
        </RocketRattle>
      </HoverBob>
      {stage}
      <PeekHit
        style={plate.windowStyle(hit || layer.box)}
        onMouseEnter={() => setRattle(true)}
        onMouseLeave={() => setRattle(false)}
        onClick={explode}
      />
    </>
  )
}

/** A dragon catching fire (ms): hovered until fully alight, and going out. */
const DRAGON_SPREAD_MS = 2600
const DRAGON_FADE_MS = 900
/** Moving between a dragon's hover areas doesn't put it out. */
const DRAGON_LEAVE_MS = 200

/**
 * A dragon's hover areas: a mouse lights it while over them; on touch, a
 * tap lights it and another puts it out. Pointer (not mouse) events, so the
 * mouse events a tap also fires don't undo it.
 */
const dragonHover = light => ({
  onPointerEnter: event => {
    if (event.pointerType === "mouse") light(true)
  },
  onPointerLeave: event => {
    if (event.pointerType === "mouse") light(false, DRAGON_LEAVE_MS)
  },
  onPointerDown: event => {
    if (event.pointerType !== "mouse") light("toggle")
  },
})
/** The fire's spread is solid out to this share of its edge, then feathers. */
const DRAGON_FIRE_SOLID = 0.75

/**
 * A dragon that catches fire (the Wiki dragons). Hovered (tapped on and off
 * on touch) it glows (`dragon.glow`, behind it), fire (`dragon.fire`) spreads across
 * it from `dragon.from` the longer it's hovered until all of it within
 * `dragon.reach` plate px is burning, and its markings light up
 * (`dragon.highlights`, each `{ name, box }`, faded in over it all); let go,
 * it dies down. `dragon.tail` is drawn over the dragon; `dragon.hits` are its
 * hover areas (where it shows round the boxes). It trembles while it burns.
 *
 * A dragon painted as one picture (the Contribution one) gives `heat` in
 * place of the glow and fire art: a fiery glow spreads out from behind it,
 * from its head, and `eyes` (plate px) glow in and out. Its `markings`
 * (pictures on the same canvas) are drawn over it, and `swirls` (one of
 * them) lights up violet-blue while it burns.
 */
function DragonLayer({ plate, layer, split, onLit, lightRef, children }) {
  const d = layer.dragon
  const [lit, setLit] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => onLit?.(lit), [lit])
  // Part of it drawn over the text box (text.front): here, only the rest.
  const keep = (box, part) =>
    split ? (
      <ZoneSide
        style={{
          ...plate.windowStyle(box),
          ...zoneMask(box, split.above, split.feather),
        }}
      >
        {part({ inset: 0 })}
      </ZoneSide>
    ) : (
      part(plate.windowStyle(box))
    )
  // `on`: true, false, or "toggle" (a tap).
  const light = (on, ms = 0) => {
    window.clearTimeout(timer.current)
    const set = () => setLit(was => (on === "toggle" ? !was : on))
    if (ms) timer.current = window.setTimeout(set, ms)
    else set()
  }
  // Its front part (text.front) lights it from its own hover areas.
  if (lightRef) lightRef.current = light
  const crop = (name, box, clip) => (
    <CropImg
      src={plate.asset(name)}
      alt=""
      decoding="async"
      draggable={false}
      style={{ ...plate.imgStyle(box), ...plate.clip(clip) }}
    />
  )
  // The fire shows through a soft circle on the head, grown to cover it.
  const fireBox = d.fireBox || layer.box
  const [cx, cy] = [d.from[0] - fireBox[0], d.from[1] - fireBox[1]]
  const size = lit ? (d.reach * 2) / DRAGON_FIRE_SOLID : 0
  const spread = {
    "--fire-size": pp(size),
    "--fire-x": pp(cx - size / 2),
    "--fire-y": pp(cy - size / 2),
  }
  // A one-picture dragon's glow: its own picture glowing, behind it, in a
  // box with room round it for the glow.
  const heatPad = d.heat ? d.heat.pad || 40 : 0
  const [lx0, ly0, lx1, ly1] = layer.box
  const haloBox = [lx0 - heatPad, ly0 - heatPad, lx1 + heatPad, ly1 + heatPad]
  const haloSize = lit ? (d.reach * 2) / DRAGON_FIRE_SOLID : 0
  const haloSpread = {
    "--fire-size": pp(haloSize),
    "--fire-x": pp(d.from[0] - haloBox[0] - haloSize / 2),
    "--fire-y": pp(d.from[1] - haloBox[1] - haloSize / 2),
  }
  // `heat.fade`: [x from, x to] plate px over which the glow fades in from
  // the left, past a hard edge in the picture's painted haze.
  const haloFade = (() => {
    if (!d.heat?.fade) return undefined
    const w = haloBox[2] - haloBox[0]
    const at = x => `${(((x - haloBox[0]) / w) * 100).toFixed(2)}%`
    const m = `linear-gradient(to right, transparent ${at(d.heat.fade[0])}, #000 ${at(d.heat.fade[1])})`
    return { maskImage: m, WebkitMaskImage: m }
  })()
  const inHalo = ([x0, y0, x1, y1]) => {
    const w = haloBox[2] - haloBox[0]
    const h = haloBox[3] - haloBox[1]
    return {
      left: `${(((x0 - haloBox[0]) / w) * 100).toFixed(3)}%`,
      top: `${(((y0 - haloBox[1]) / h) * 100).toFixed(3)}%`,
      width: `${(((x1 - x0) / w) * 100).toFixed(3)}%`,
      height: `${(((y1 - y0) / h) * 100).toFixed(3)}%`,
    }
  }
  return (
    <>
      {d.glow &&
        keep(d.glowBox, style => (
          <DragonGlow $lit={lit} style={style}>
            {crop(d.glow, d.glowBox)}
          </DragonGlow>
        ))}
      {d.fire &&
        keep(fireBox, style => (
          <DragonFire $lit={lit} style={{ ...style, ...spread }}>
            {crop(d.fire, fireBox)}
          </DragonFire>
        ))}
      {d.heat && (
        <DragonFire
          aria-hidden
          $lit={lit}
          style={{ ...plate.windowStyle(haloBox), ...haloSpread }}
        >
          <HaloFade style={haloFade}>
            <HeatHalo $lit={lit} style={inHalo(layer.box)}>
              {crop(layer.src || layer.name, layer.box, layer.clip)}
            </HeatHalo>
          </HaloFade>
        </DragonFire>
      )}
      <DragonPart
        data-layer={layer.name}
        $lit={lit}
        style={plate.windowStyle(layer.box)}
      >
        {children}
        {(d.markings || []).map(name => (
          <React.Fragment key={name}>{crop(name, layer.box)}</React.Fragment>
        ))}
      </DragonPart>
      {(d.eyes || []).map(([x, y]) => (
        <DragonEye
          key={`${x},${y}`}
          aria-hidden
          $lit={lit}
          style={{
            left: `${((x / plate.W) * 100).toFixed(3)}%`,
            top: `${((y / plate.H) * 100).toFixed(3)}%`,
            width: pp(d.eyeSize || 16),
            height: pp(d.eyeSize || 16),
          }}
        />
      ))}
      {d.tail && (
        <DragonPart
          $lit={lit}
          $narrowOnly={d.tailNarrowOnly}
          style={plate.windowStyle(d.tailBox)}
        >
          {crop(d.tail, d.tailBox)}
        </DragonPart>
      )}
      {d.swirls && (
        <DragonHighlight aria-hidden $lit={lit} style={plate.windowStyle(layer.box)}>
          <SwirlGlow>{crop(d.swirls, layer.box)}</SwirlGlow>
        </DragonHighlight>
      )}
      {(d.highlights || []).map(h => (
        <React.Fragment key={`${h.name}${h.box.join()}`}>
          {keep(h.box, style => (
            <DragonHighlight aria-hidden $lit={lit} style={style}>
              {crop(h.name, h.box)}
            </DragonHighlight>
          ))}
        </React.Fragment>
      ))}
      {d.hits.map(hit => (
        <PeekHit
          key={hit.join()}
          style={plate.windowStyle(hit)}
          {...dragonHover(light)}
        />
      ))}
      {/* The tail's, here only where it isn't drawn over the box. */}
      {(d.tailHits || []).map(hit => (
        <TailHit
          key={hit.join()}
          $narrowOnly={Boolean(split)}
          style={plate.windowStyle(hit)}
          {...dragonHover(light)}
        />
      ))}
    </>
  )
}

/**
 * A mask over `box` (plate px) showing only the plate-px `polygon`, its edge
 * feathered by `feather` plate px.
 */
function zoneMask([x0, y0, x1, y1], polygon, feather) {
  const pts = polygon.map(([x, y]) => `${x},${y}`).join(" ")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" preserveAspectRatio="none"><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${feather}"/></filter><polygon points="${pts}" fill="#000" filter="url(#f)"/></svg>`
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  return { "--zone-mask": url }
}

/**
 * The two sides of a line across the plate (`[[x0, y0], [x1, y1]]`, left to
 * right): `above` and `below`, as polygons reaching well past the plate.
 */
function splitPlate([[ax, ay], [bx, by]], { W, H }) {
  const far = Math.max(W, H)
  // The line carried on past both ends at its own slope.
  const yAt = x => ay + ((by - ay) * (x - ax)) / (bx - ax)
  const [lx, rx] = [ax - far, bx + far]
  return {
    above: [[lx, -far], [rx, -far], [rx, yAt(rx)], [lx, yAt(lx)]],
    below: [[lx, yAt(lx)], [rx, yAt(rx)], [rx, H + far], [lx, H + far]],
  }
}

/** A dragon's part masked to one side of its split (wide screens only). */
const ZoneSide = styled.div`
  position: absolute;
  pointer-events: none;

  @media (min-width: 861px) {
    -webkit-mask-image: var(--zone-mask);
    mask-image: var(--zone-mask);
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
`

/** A dragon's front part (see `text.front`), positioned off the box's bottom. */
function TextFrontArt({ plate, text, d, split, lit, light }) {
  const dy = text.front.dy || 0
  // Across: where it's painted on the plate (--box-x is the box's own left,
  // which moves when the menu shrinks to a rail). Down: off the box's bottom.
  const at = ([x0, y0, x1, y1]) => ({
    left: `calc(${pp(x0)} - var(--box-x, ${pp(text.box[0])}))`,
    top: `calc(100% + ${pp(y0 + dy - text.box[3])})`,
    width: pp(x1 - x0),
    height: pp(y1 - y0),
  })
  const crop = (name, box) => (
    <CropImg
      src={plate.asset(name)}
      alt=""
      decoding="async"
      draggable={false}
      style={plate.imgStyle(box)}
    />
  )
  const below = (box, part) => (
    <ZoneSide style={{ ...at(box), ...zoneMask(box, split.below, split.feather) }}>
      {part}
    </ZoneSide>
  )
  // The fire spreads from the head, which the front part is lowered with.
  const fireBox = d.fireBox
  const size = lit ? (d.reach * 2) / DRAGON_FIRE_SOLID : 0
  const spread = {
    "--fire-size": pp(size),
    "--fire-x": pp(d.from[0] - fireBox[0] - size / 2),
    "--fire-y": pp(d.from[1] - fireBox[1] - size / 2),
  }
  return (
    <TextFront aria-hidden>
      {d.glow &&
        below(
          d.glowBox,
          <DragonGlow $lit={lit} style={{ inset: 0 }}>
            {crop(d.glow, d.glowBox)}
          </DragonGlow>,
        )}
      {d.fire &&
        below(
          fireBox,
          <DragonFire $lit={lit} style={{ inset: 0, ...spread }}>
            {crop(d.fire, fireBox)}
          </DragonFire>,
        )}
      <FrontShadow style={at(d.tailBox)}>
        <DragonPart $lit={lit} style={{ inset: 0 }}>
          {crop(d.tail, d.tailBox)}
        </DragonPart>
      </FrontShadow>
      {(d.highlights || []).map(h => (
        <React.Fragment key={`${h.name}${h.box.join()}`}>
          {below(
            h.box,
            <DragonHighlight $lit={lit} style={{ inset: 0 }}>
              {crop(h.name, h.box)}
            </DragonHighlight>,
          )}
        </React.Fragment>
      ))}
      {(d.tailHits || []).map(hit => (
        <PeekHit
          key={hit.join()}
          style={at(hit)}
          {...dragonHover(light)}
        />
      ))}
    </TextFront>
  )
}

/** How far wound in (0–1) a winch is `t` (0–1) through its cycle. */
function winchAt(t) {
  const ease = p => (p < 0.5 ? 4 * p ** 3 : 1 - (2 - 2 * p) ** 3 / 2)
  if (t < 0.05 || t >= 0.95) return 0
  if (t < 0.45) return ease((t - 0.05) / 0.4)
  if (t < 0.55) return 1
  return 1 - ease((t - 0.55) / 0.4)
}

/** `table` ([[x, y], …], x rising) at `x`, straight between its points. */
function lerpTable(table, x) {
  if (x <= table[0][0]) return table[0][1]
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i]
    if (x <= x1) {
      const [x0, y0] = table[i - 1]
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    }
  }
  return table[table.length - 1][1]
}

/** Keyframes per winch cycle (the easing's sampled, so the parts keep step). */
const WINCH_STEPS = 96

/**
 * One part of a winch (the Engineering gear, and the rope and bucket), all on
 * the same cycle (`winch.ms`): wound in, held, let back out. `winch.turn`:
 * it turns that many degrees about its box's centre, from `winch.rest` (how
 * it's turned at rest). `winch.lift`: it rides up that many plate px inside
 * its window (which can fade at its edges, `layer.fadeY`), moved across by
 * `winch.drift` ([[lift, px left], …]) on the way.
 */
function WinchLayer({ plate, layer, children }) {
  const ref = useRef(null)
  const { ms, turn, rest = 0, lift, drift } = layer.winch
  const [x0, y0, x1, y1] = layer.box
  const w = x1 - x0
  const h = y1 - y0
  const pose = k =>
    turn != null
      ? `rotate(${(rest + turn * k).toFixed(3)}deg)`
      : `translate(${(((drift ? -lerpTable(drift, lift * k) : 0) / w) * 100).toFixed(3)}%, ${(((-lift * k) / h) * 100).toFixed(3)}%)`

  useEffect(() => {
    const el = ref.current
    if (!el?.animate || stillPlease()) return undefined
    const frames = Array.from({ length: WINCH_STEPS + 1 }, (_, i) => ({
      transform: pose(winchAt(i / WINCH_STEPS)),
    }))
    const anim = el.animate(frames, { duration: ms, iterations: Infinity })
    // On the page's clock, so every part of the winch is at the same point.
    anim.startTime = 0
    return () => anim.cancel()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `pose` only reads the layer's (fixed) config
  }, [layer])

  if (turn != null) {
    return (
      <CropWindow
        ref={ref}
        data-layer={layer.name}
        style={{ ...plate.windowStyle(layer.box), transform: pose(0) }}
      >
        {children}
      </CropWindow>
    )
  }
  return (
    <CropWindow
      data-layer={layer.name}
      style={{
        ...plate.windowStyle(layer.box),
        ...plate.fadeY(layer.box, layer.fadeY),
      }}
    >
      <WinchSlide ref={ref}>{children}</WinchSlide>
    </CropWindow>
  )
}

const stillPlease = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/** `part` of a layer's `box`, as a window inside the layer's own (%). */
const partStyle = ([x0, y0, x1, y1], [px0, py0, px1, py1]) => ({
  left: `${(((px0 - x0) / (x1 - x0)) * 100).toFixed(3)}%`,
  top: `${(((py0 - y0) / (y1 - y0)) * 100).toFixed(3)}%`,
  width: `${(((px1 - px0) / (x1 - x0)) * 100).toFixed(3)}%`,
  height: `${(((py1 - py0) / (y1 - y0)) * 100).toFixed(3)}%`,
})

/** Hover (tap on touch) handlers for an art layer's hit area. */
const hoverOrTap = act => ({
  onMouseEnter: act,
  onPointerDown: event => {
    if (event.pointerType !== "mouse") act()
  },
})

/** How long the streak lingers after the last scroll that moved the slider. */
const SLIDE_STREAK_MS = 220

/**
 * A critter sliding down the text box's edge (Outreach's squirrel), with its
 * motion streak painted above it (`slide.outline`: plate points, left to
 * right, along the critter's top, between the two). Drawn over the box
 * (`front`), it rides down with the reader between two of the box's
 * headings (`slide.between`, their ids): its body starts level with the
 * first; once scrolled up to `slide.view` under the header it stays there,
 * sliding down the box's edge as the box goes up, and it stops level with
 * the second, where the box carries it off. The streak only shows while it
 * slides. `layer.from` is where it's painted, if `box` (where it's drawn)
 * differs. Hovered (tapped), an acorn bonks it (`layer.bonk`, see
 * BonkLayer; `bonk.hit` is on its painted box). In the art (narrow
 * screens) it just clings there.
 */
function SlideLayer({ plate, layer, at, follow = false }) {
  const laneRef = useRef(null)
  const stickRef = useRef(null)
  const streakRef = useRef(null)
  const { box } = layer
  const from = layer.from || box
  const [fx0, fy0, fx1, fy1] = from
  const { outline } = layer.slide
  // The two sides of the outline, as clip paths over the whole crop.
  const pt = ([x, y]) =>
    `${(((x - fx0) / (fx1 - fx0)) * 100).toFixed(2)}% ${(((y - fy0) / (fy1 - fy0)) * 100).toFixed(2)}%`
  const line = outline.map(pt).join(", ")
  const lineBack = [...outline].reverse().map(pt).join(", ")
  const streakClip = `polygon(0% 0%, 100% 0%, ${lineBack})`
  const bodyClip = `polygon(${line}, 100% 100%, 0% 100%)`
  // Its streak's height above the critter's top (for where it rides).
  const streakH = Math.min(...outline.map(([, y]) => y)) - fy0
  useEffect(() => {
    const stick = stickRef.current
    const streak = streakRef.current
    if (!follow || !stick || !streak) return undefined
    let off = 0
    let raf = 0
    let lastTop = null
    const check = () => {
      raf = 0
      const top = stick.getBoundingClientRect().top
      // Riding with the reader: still on screen while the page moves.
      const lane = stick.parentElement.getBoundingClientRect()
      const sliding =
        lastTop !== null &&
        Math.abs(top - lastTop) < 0.5 &&
        top > lane.top + 1 &&
        top + stick.offsetHeight < lane.bottom - 1
      lastTop = top
      if (!sliding || stillPlease()) return
      streak.style.opacity = "1"
      window.clearTimeout(off)
      off = window.setTimeout(() => {
        streak.style.opacity = "0"
      }, SLIDE_STREAK_MS)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    lastTop = stick.getBoundingClientRect().top
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
      window.clearTimeout(off)
    }
  }, [follow])
  // Its lane, from the first heading to the second (as the box's text lays
  // out, so again whenever the box changes size).
  const between = layer.slide.between
  useLayoutEffect(() => {
    const lane = laneRef.current
    const stick = stickRef.current
    const box = lane?.offsetParent
    if (!follow || !lane || !stick || !box || !between) return undefined
    const fit = () => {
      const [a, b] = between.map(id => box.parentElement.querySelector(`#${id}`))
      if (!a || !b) return
      const o = box.getBoundingClientRect().top
      const streakPx = (stick.offsetHeight * streakH) / (fy1 - fy0)
      const top = a.getBoundingClientRect().top - o - streakPx
      lane.style.top = `${top.toFixed(1)}px`
      lane.style.height = `${(b.getBoundingClientRect().top - o - streakPx - top + stick.offsetHeight).toFixed(1)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [follow, between, streakH, fy0, fy1])
  const bonk = layer.bonk
  const bonkMe = () =>
    dropAcornOn(stickRef.current, layer.box, [
      // The head, from its painted box onto where it's drawn.
      layer.box[0] + ((bonk.head[0] - fx0) * (layer.box[2] - layer.box[0])) / (fx1 - fx0),
      layer.box[1] + ((bonk.head[1] - fy0) * (layer.box[3] - layer.box[1])) / (fy1 - fy0),
    ], bonk.acorn, false)
  const part = clip => (
    <CropWindow style={{ inset: 0, clipPath: clip }}>
      <CropImg
        src={plate.asset(layer.src || layer.name)}
        alt=""
        decoding="async"
        draggable={false}
        style={plate.imgStyle(from)}
      />
    </CropWindow>
  )
  const critter = (
    <>
      <SlideStreak ref={streakRef}>{part(streakClip)}</SlideStreak>
      {part(bodyClip)}
    </>
  )
  if (!follow) {
    return (
      <SlideWindow data-layer={layer.name} style={at(box)}>
        {critter}
      </SlideWindow>
    )
  }
  const [, y0, , y1] = box
  const lane = at(box)
  return (
    <SlideLane
      ref={laneRef}
      data-layer={layer.name}
      style={{ left: lane.left, width: lane.width, top: lane.top, height: pp(y1 - y0) }}
    >
      <SlideStick
        ref={stickRef}
        style={{
          // Its body (under the streak) held `slide.view` under the header.
          top: `calc(var(--dl-header, 0px) + ${layer.slide.view || "16vh"} - ${pp(
            (streakH * (y1 - y0)) / (fy1 - fy0),
          )})`,
          height: pp(y1 - y0),
        }}
      >
        {critter}
        {bonk && (
          <PeekHit style={partStyle(from, bonk.hit || from)} {...hoverOrTap(bonkMe)} />
        )}
      </SlideStick>
    </SlideLane>
  )
}

/**
 * Leaves on the wind: each crosses from `wind.from` to `wind.to` (plate px
 * from where it's painted), bobbing and turning, over `wind.ms`, again and
 * again. Both ends are out of sight (off the window, or behind the text
 * box), so none is ever seen popping in. `wind.at` (0–1) is how far along
 * it is when the page opens, so they're spread out. `layer.from` is the
 * leaf on its plate, if it's drawn somewhere else (`box`). `at` places it.
 */
function WindLayer({ plate, layer, at }) {
  const ref = useRef(null)
  const [x0, y0, x1, y1] = layer.box
  const {
    from: [fx, fy],
    to: [tx, ty],
    ms = 12000,
    at: startAt = 0,
    bob = 30,
    spin = 120,
    wobble = 18,
  } = layer.wind
  useEffect(() => {
    const el = ref.current
    if (!el || stillPlease()) return undefined
    const w = x1 - x0
    const h = y1 - y0
    const steps = 12
    const frames = Array.from({ length: steps + 1 }, (_, i) => {
      const k = i / steps
      const x = fx + (tx - fx) * k
      const y = fy + (ty - fy) * k + bob * Math.sin(k * Math.PI * 4)
      const r = spin * k + wobble * Math.sin(k * Math.PI * 3)
      return {
        transform: `translate(${((x / w) * 100).toFixed(1)}%, ${((y / h) * 100).toFixed(1)}%) rotate(${r.toFixed(1)}deg)`,
      }
    })
    const anim = el.animate(frames, {
      duration: ms,
      iterations: Infinity,
      easing: "linear",
      delay: -startAt * ms,
    })
    return () => anim.cancel()
  }, [x0, y0, x1, y1, fx, fy, tx, ty, ms, startAt, bob, spin, wobble])
  return (
    <WindWindow
      ref={ref}
      data-layer={layer.name}
      style={{
        ...at(layer.box),
        // Out of sight at its start until the wind has it.
        transform: `translate(${((fx / (x1 - x0)) * 100).toFixed(1)}%, ${((fy / (y1 - y0)) * 100).toFixed(1)}%)`,
      }}
    >
      <CropImg
        src={plate.asset(layer.src || layer.name)}
        alt=""
        decoding="async"
        draggable={false}
        style={plate.imgStyle(layer.from || layer.box)}
      />
    </WindWindow>
  )
}

/** A bonked critter's squash, from its feet. */
const BONK_SQUASH = [
  { transform: "scale(1, 1)" },
  { transform: "scale(1.06, 0.88)", offset: 0.2 },
  { transform: "scale(0.96, 1.05) rotate(-2deg)", offset: 0.5 },
  { transform: "scale(1, 1) rotate(1.5deg)", offset: 0.75 },
  { transform: "scale(1, 1)" },
].map(k => ({ ...k, transformOrigin: "50% 100%" }))
const BONK_BOUNCE_MS = 900

/**
 * Drops an acorn (`acorn`: its `src` and `box` on a `plate`-sized canvas,
 * drawn at `scale` of its size) from the top of the window, under the site
 * header, onto `head` (plate px, on the `box` that `el` draws). It bonks
 * the critter, which squashes, and bounces off. Drawn fixed over the page
 * for the moment it takes. Not when the head is hidden under the text box
 * or the section menu (`behind`: it's in the art behind them).
 */
function dropAcornOn(el, box, head, acorn, behind = true) {
  if (!el || el.dataset.bonked || stillPlease()) return
  const r = el.getBoundingClientRect()
  const k = r.width / (box[2] - box[0])
  const hx = r.left + (head[0] - box[0]) * k
  const hy = r.top + (head[1] - box[1]) * k
  if (behind) {
    const over = document.elementFromPoint(hx, hy + 6 * k)
    if (over?.closest("[data-scene-text], [data-scene-strip]")) return
  }
  const [ax0, ay0, ax1, ay1] = acorn.box
  const [W, H] = acorn.plate
  const size = (ax1 - ax0) * k * (acorn.scale ?? 0.8)
  const left = hx - size / 2
  // It lands with its bottom just on the head.
  const top = hy - size * 0.9
  const header = parseFloat(getComputedStyle(el).getPropertyValue("--dl-header")) || 0
  const fall = top - (header - size)
  if (fall <= 0) return
  const nut = document.createElement("div")
  Object.assign(nut.style, {
    position: "fixed",
    left: `${left}px`,
    top: `${top}px`,
    width: `${size}px`,
    height: `${size}px`,
    zIndex: "40",
    pointerEvents: "none",
    backgroundImage: `url(${acorn.src})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${(W / (ax1 - ax0)) * 100}% ${(H / (ay1 - ay0)) * 100}%`,
    backgroundPosition: `${(ax0 / (W - (ax1 - ax0))) * 100}% ${(ay0 / (H - (ay1 - ay0))) * 100}%`,
  })
  document.body.appendChild(nut)
  // Falling faster the further it drops, as things do.
  const fallMs = Math.min(1100, Math.max(380, Math.sqrt(fall) * 30))
  const total = fallMs + BONK_BOUNCE_MS
  const landed = fallMs / total
  nut.animate(
    [
      { transform: `translate(0, ${-fall}px) rotate(-25deg)`, offset: 0, easing: "cubic-bezier(0.55, 0, 1, 0.8)" },
      { transform: "translate(0, 0) rotate(0deg)", offset: landed, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" },
      {
        transform: `translate(${-size * 0.9}px, ${-size * 1.2}px) rotate(-110deg)`,
        offset: landed + (1 - landed) * 0.4,
        easing: "cubic-bezier(0.55, 0, 1, 0.6)",
      },
      { transform: `translate(${-size * 1.7}px, ${size * 1.4}px) rotate(-250deg)`, opacity: 0, offset: 1 },
    ],
    { duration: total },
  ).onfinish = () => nut.remove()
  el.dataset.bonked = "1"
  el.animate(BONK_SQUASH, { duration: 700, delay: fallMs - 30, easing: "ease-out" }).onfinish =
    () => delete el.dataset.bonked
}

/**
 * A critter that gets bonked by an acorn when hovered (tapped on touch):
 * `bonk.head` is where it lands (plate px), `bonk.acorn` the acorn,
 * `bonk.hit` the hover area (else the layer).
 */
function BonkLayer({ plate, layer, children }) {
  const ref = useRef(null)
  const { head, acorn, hit } = layer.bonk
  const bonk = () => dropAcornOn(ref.current, layer.box, head, acorn)
  return (
    <>
      <BonkWindow ref={ref} data-layer={layer.name} style={plate.windowStyle(layer.box)}>
        {children}
      </BonkWindow>
      <PeekHit style={plate.windowStyle(hit || layer.box)} {...hoverOrTap(bonk)} />
    </>
  )
}

/** Ducking (ms): the hop back over the edge, and the sink behind it. */
const DUCK_HOP_MS = 200
const DUCK_SINK_MS = 550
const DUCK_RISE_MS = 380
const DUCK_LAND_MS = 200
/** Room (plate px) round a ducking critter for its glow. */
const DUCK_GLOW_PAD = 30

/**
 * A critter standing in front of an edge it can hide behind (the
 * Contribution axolotl, before the water): hovered (tapped on touch), it
 * glows, hops back over the edge and sinks behind it, leaving `duck.show`
 * plate px of its head peeking over; when the pointer leaves it rises and
 * hops back down. `duck.edge` is two plate points on the edge (it can slope);
 * while the critter's behind it, everything below that line is cut off.
 * `duck.over`: at rest it's drawn over the layers after it (and its hover
 * area stays on top of theirs); from the top of its hop it's behind them,
 * until it's back at the top on its way home.
 */
function DuckLayer({ plate, layer, children }) {
  const winRef = useRef(null)
  const [glow, setGlow] = useState(false)
  const [clipped, setClipped] = useState(false)
  const [away, setAway] = useState(false)
  const timers = useRef([])
  const touch = useRef(0)
  const anim = useRef(null)
  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout)
      window.clearTimeout(touch.current)
    },
    [],
  )
  const [x0, y0, x1, y1] = layer.box
  const { edge, show, hop } = layer.duck
  const [[ex0, ey0], [ex1, ey1]] = edge
  const edgeAt = x => ey0 + ((ey1 - ey0) * (x - ex0)) / (ex1 - ex0)
  const clip = [
    x0 - DUCK_GLOW_PAD,
    y0 - DUCK_GLOW_PAD,
    x1 + DUCK_GLOW_PAD,
    y1 + DUCK_GLOW_PAD,
  ]
  const h = clip[3] - clip[1]
  // Shifts as a share of the critter's own height.
  const y = px => `${((px / (y1 - y0)) * 100).toFixed(2)}%`
  // Sinks until `show` px of it is above the edge, measured at its middle.
  const sink = edgeAt((x0 + x1) / 2) - show - y0
  const cutAt = x => (((edgeAt(x) - clip[1]) / h) * 100).toFixed(2)
  const later = (fn, ms) => timers.current.push(window.setTimeout(fn, ms))
  const reduce = () =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  const move = (frames, ms) => {
    anim.current?.commitStyles?.()
    anim.current?.cancel()
    anim.current = winRef.current?.animate(frames, {
      duration: ms,
      fill: "forwards",
    })
  }
  const duck = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    setGlow(true)
    if (reduce()) return
    move(
      [
        { transform: "translate3d(0, 0, 0)", easing: "ease-out" },
        { transform: `translate3d(0, ${y(-hop)}, 0)`, offset: DUCK_HOP_MS / (DUCK_HOP_MS + DUCK_SINK_MS), easing: "cubic-bezier(0.45, 0, 0.3, 1)" },
        { transform: `translate3d(0, ${y(sink)}, 0)` },
      ],
      DUCK_HOP_MS + DUCK_SINK_MS,
    )
    // Its feet are over the edge by now: cut off what goes behind it.
    later(() => {
      setClipped(true)
      setAway(true)
    }, DUCK_HOP_MS)
  }
  const rise = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    if (reduce()) {
      setGlow(false)
      return
    }
    move(
      [
        { transform: `translate3d(0, ${y(sink)}, 0)`, easing: "cubic-bezier(0.3, 0, 0.4, 1)" },
        { transform: `translate3d(0, ${y(-hop)}, 0)`, offset: DUCK_RISE_MS / (DUCK_RISE_MS + DUCK_LAND_MS), easing: "ease-in" },
        { transform: "translate3d(0, 0, 0)" },
      ],
      DUCK_RISE_MS + DUCK_LAND_MS,
    )
    later(() => {
      setClipped(false)
      setAway(false)
    }, DUCK_RISE_MS)
    later(() => setGlow(false), DUCK_RISE_MS + DUCK_LAND_MS)
  }
  return (
    <>
      <DuckClip
        style={{
          ...plate.windowStyle(clip),
          zIndex: layer.duck.over && !away ? 1 : undefined,
          clipPath: clipped
            ? `polygon(0 -100%, 100% -100%, 100% ${cutAt(clip[2])}%, 0 ${cutAt(clip[0])}%)`
            : "none",
        }}
      >
        <DuckWindow
          ref={winRef}
          data-layer={layer.name}
          $glow={glow}
          style={{
            left: `${(DUCK_GLOW_PAD / (clip[2] - clip[0])) * 100}%`,
            top: `${(DUCK_GLOW_PAD / h) * 100}%`,
            width: `${((x1 - x0) / (clip[2] - clip[0])) * 100}%`,
            height: `${((y1 - y0) / h) * 100}%`,
          }}
        >
          {children}
        </DuckWindow>
      </DuckClip>
      <PeekHit
        style={{
          ...plate.windowStyle(layer.duck.hit || layer.box),
          zIndex: layer.duck.over ? 1 : undefined,
        }}
        onMouseEnter={duck}
        onMouseLeave={rise}
        onPointerDown={event => {
          if (event.pointerType === "mouse") return
          window.clearTimeout(touch.current)
          duck()
          touch.current = window.setTimeout(rise, PEEK_TOUCH_MS)
        }}
      />
    </>
  )
}

/** Legs of a lap (ms): out the left edge, in at the right to peek, a pause, home. */
const LAP_OUT_MS = 1000
const LAP_IN_MS = 700
const LAP_PAUSE_MS = 1000
const LAP_HOME_MS = 2600

/**
 * A swimmer that does a lap (the Wet Lab's open-water axolotl): hovered
 * (tapped on touch), it lights up, swims out the left edge of the page,
 * comes back in at the right edge just far enough to peek, then swims on
 * left behind the text box to where it started. `layer.lap` gives the
 * shifts in plate px: `out` (off the left), `enter` (off the right) and
 * `peek`. The hover area stays put.
 */
function LapLayer({ plate, layer, children }) {
  const winRef = useRef(null)
  const glowRef = useRef(null)
  const busy = useRef(false)
  const [x0, , x1] = layer.box
  const pct = dx => `${((dx / (x1 - x0)) * 100).toFixed(2)}%`
  const go = () => {
    if (busy.current) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const { out, enter, peek } = layer.lap
    const total = LAP_OUT_MS + LAP_IN_MS + LAP_PAUSE_MS + LAP_HOME_MS
    const at = ms => ms / total
    const x = dx => ({ transform: `translate3d(${pct(dx)}, 0, 0)` })
    const t1 = at(LAP_OUT_MS)
    const t2 = at(LAP_OUT_MS + LAP_IN_MS)
    const t3 = at(LAP_OUT_MS + LAP_IN_MS + LAP_PAUSE_MS)
    busy.current = true
    const swim = winRef.current?.animate(
      [
        { ...x(0), offset: 0, easing: "cubic-bezier(0.5, 0, 0.9, 0.6)" },
        { ...x(out), offset: t1 },
        // Off the left edge, then straight round to off the right edge.
        { ...x(enter), offset: t1, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)" },
        { ...x(peek), offset: t2 },
        { ...x(peek), offset: t3, easing: "cubic-bezier(0.45, 0, 0.35, 1)" },
        { ...x(0), offset: 1 },
      ],
      { duration: total },
    )
    glowRef.current?.animate(
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.06 },
        { opacity: 1, offset: 0.88 },
        { opacity: 0 },
      ],
      { duration: total },
    )
    const done = () => {
      busy.current = false
    }
    if (swim) swim.onfinish = swim.oncancel = done
    else done()
  }
  return (
    <>
      <LapWindow
        ref={winRef}
        data-layer={layer.name}
        style={plate.windowStyle(layer.box)}
      >
        <CropImg
          src={plate.asset(layer.lap.plain)}
          alt=""
          decoding="async"
          draggable={false}
          style={plate.imgStyle(layer.from || layer.box)}
        />
        <LapGlow ref={glowRef}>{children}</LapGlow>
      </LapWindow>
      <PeekHit
        style={plate.windowStyle(layer.lap.hit || layer.box)}
        onMouseEnter={go}
        onPointerDown={event => {
          if (event.pointerType !== "mouse") go()
        }}
      />
    </>
  )
}

/**
 * A school that keeps swimming (like the homepage fish): it holds a while,
 * swims off one edge, comes round from the other and back to its spot,
 * bobbing all the way (harder when hovered). `layer.swim.ms` is one loop;
 * `layer.swim.dir` is the way it faces (1 right, -1 left; left by default).
 */
function SwimLayer({ plate, layer, children }) {
  const [x0, , x1] = layer.box
  // Far enough to clear the page both ways: 115% of the plate, in the
  // window's own widths.
  const swim = ((1.15 * plate.W) / (x1 - x0)) * 100
  const dir = layer.swim.dir === 1 ? 1 : -1
  return (
    <SwimWindow
      data-layer={layer.name}
      style={{
        ...plate.windowStyle(layer.box),
        "--swim-out": `${dir * swim}%`,
        "--swim-in": `${-dir * swim}%`,
        "--swim-ms": `${layer.swim.ms}ms`,
        "--swim-delay": `${layer.swim.delayMs || 0}ms`,
      }}
    >
      <SwimBob>{children}</SwimBob>
    </SwimWindow>
  )
}

/** Sizes (plate px, on the homepage's 946px plate) of the homepage bubble sprites. */
const BUBBLE_SPRITES = {
  1: [29, 34],
  3: [68, 61],
  5: [27, 30],
  7: [43, 42],
  8: [35, 30],
  9: [21, 28],
  10: [50, 51],
  13: [45, 42],
}
const BUBBLE_SRC = id =>
  `https://static.igem.wiki/teams/6187/wiki/homepage-cropped/bubbles-bubble${id}.avif`

/** Same numbers every render (and on the server): a small seeded generator. */
function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/**
 * The homepage's bubbles as a constant stream rising through the water.
 * `layer.bubbles`: `lanes` ([x0, x1] plate-px bands they rise in, with a
 * share of the bubbles each), `from` / `to` (plate y they rise between),
 * `count`, and `seconds` ([min, max] for one rise).
 */
function BubbleStream({ plate, layer }) {
  const cfg = layer.bubbles
  const bubbles = useMemo(() => {
    const rand = seeded(cfg.seed || 11)
    const ids = Object.keys(BUBBLE_SPRITES)
    const list = []
    cfg.lanes.forEach(({ x: [a, b], count }) => {
      for (let i = 0; i < count; i++) {
        const id = ids[Math.floor(rand() * ids.length)]
        const [w, h] = BUBBLE_SPRITES[id]
        const scale = (plate.W / 946) * (0.55 + rand() * 0.6)
        const seconds = cfg.seconds[0] + rand() * (cfg.seconds[1] - cfg.seconds[0])
        const from = cfg.from - rand() * 220
        list.push({
          key: `${a}-${i}`,
          id,
          x: a + rand() * (b - a),
          y: from,
          w: w * scale,
          h: h * scale,
          rise: from - cfg.to,
          seconds,
          delay: -rand() * seconds,
          wobble: (rand() < 0.5 ? -1 : 1) * (8 + rand() * 18),
          wobbleS: 2.6 + rand() * 2,
        })
      }
    })
    return list
  }, [cfg, plate.W])
  return (
    <BubbleLayer aria-hidden>
      {bubbles.map(b => (
        <BubbleRise
          key={b.key}
          style={{
            left: `${(b.x / plate.W) * 100}%`,
            top: `${(b.y / plate.H) * 100}%`,
            width: `${(b.w / plate.W) * 100}%`,
            "--rise": `calc(var(--px) * ${-b.rise.toFixed(0)})`,
            "--rise-s": `${b.seconds.toFixed(2)}s`,
            "--rise-delay": `${b.delay.toFixed(2)}s`,
          }}
        >
          <BubbleWobble
            style={{
              "--wobble": `calc(var(--px) * ${b.wobble.toFixed(1)})`,
              "--wobble-s": `${b.wobbleS.toFixed(2)}s`,
            }}
          >
            <img src={BUBBLE_SRC(b.id)} alt="" decoding="async" draggable={false} />
          </BubbleWobble>
        </BubbleRise>
      ))}
    </BubbleLayer>
  )
}

/** Marks which ends of a scrollable list have more beyond them (for the fade). */
function updateNavFade(nav) {
  if (!nav) return
  const above = nav.scrollTop > 2
  const below = nav.scrollTop + nav.clientHeight < nav.scrollHeight - 2
  const fade = above && below ? "both" : above ? "above" : below ? "below" : ""
  if (nav.dataset.fade !== fade) nav.dataset.fade = fade
}

/** Full image offset so `box` of a `[W, H]` image fills its window. */
function cropStyle([x0, y0, x1, y1], [W, H]) {
  const w = x1 - x0
  const h = y1 - y0
  return {
    width: `${(W / w) * 100}%`,
    height: `${(H / h) * 100}%`,
    left: `${(-x0 / w) * 100}%`,
    top: `${(-y0 / h) * 100}%`,
  }
}

/** Loop-the-loop a bird flies on every hover (tap on touch). */
const BIRD_LOOP_MS = 1400
/** Loop radius as a share of the bird's height. */
const BIRD_LOOP_RADIUS = 0.8

/**
 * Keyframes for one vertical loop: forward, up and over, back down to the
 * start, nose following the circle. `facing` -1 = left, 1 = right.
 */
function loopKeyframes(radius, facing) {
  const steps = 24
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = (i / steps) * 2 * Math.PI
    const x = facing * radius * Math.sin(t)
    const y = -radius * (1 - Math.cos(t))
    const turn = -facing * (i / steps) * 360
    return {
      transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${turn.toFixed(1)}deg)`,
    }
  })
}

/**
 * A bird reused from the homepage art: flaps between its two frames, bobs,
 * and either sways in place or (with `cross`) keeps flying across the page,
 * looping; it flies a loop-the-loop when hovered. `layer.flyer` points at the source
 * image (any plate) and the window in it.
 */
function BirdLayer({ plate, layer }) {
  const f = layer.flyer
  const startleRef = useRef(null)
  const startle = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const el = startleRef.current
    if (!el) return
    // Which way it's pointing on screen: the sprite's own facing, mirrored
    // if the bird is flipped.
    const facing = (f.faces ?? -1) * (f.flip ? -1 : 1)
    el.animate(loopKeyframes(el.offsetHeight * BIRD_LOOP_RADIUS, facing), {
      duration: BIRD_LOOP_MS,
      easing: "cubic-bezier(0.4, 0, 0.3, 1)",
    })
  }
  const crop = cropStyle(f.from, f.plate)
  // Crossing: from just past one edge of the art to just past the other, in
  // the direction the bird faces (dir 1 = rightward).
  const cross = f.cross
  const [x0, , x1] = layer.box
  const crossVars = cross
    ? {
        "--cross-from": pp(cross.dir > 0 ? -x1 : plate.W - x0),
        "--cross-to": pp(cross.dir > 0 ? plate.W - x0 : -x1),
        "--cross-ms": `${cross.seconds * 1000}ms`,
        // Start partway along, so they don't all enter at once.
        "--cross-delay": `${-(cross.at ?? 0) * cross.seconds * 1000}ms`,
      }
    : {}
  return (
    <BirdWindow
      data-layer={layer.name}
      style={{
        ...plate.windowStyle(layer.box),
        "--flap": `${f.flapMs}ms`,
        "--sway": pp(f.sway ?? 18),
        "--sway-ms": `${f.swayMs ?? 7000}ms`,
        "--bob-ms": `${f.bobMs ?? 3200}ms`,
        "--phase": `${-(f.phaseMs ?? 0)}ms`,
        ...crossVars,
      }}
      onMouseEnter={startle}
      onPointerDown={event => {
        if (event.pointerType !== "mouse") startle()
      }}
    >
      <BirdSway $cross={!!cross}>
        <BirdBob>
          <BirdStartle ref={startleRef}>
            <BirdCrop style={{ transform: f.flip ? "scaleX(-1)" : undefined }}>
              <BirdFrame
                src={f.a}
                alt=""
                draggable={false}
                decoding="async"
                style={crop}
              />
              <BirdFrame
                src={f.b}
                alt=""
                draggable={false}
                decoding="async"
                style={crop}
                $second
              />
            </BirdCrop>
          </BirdStartle>
        </BirdBob>
      </BirdSway>
    </BirdWindow>
  )
}

/**
 * A still layer (no flap frames) that flies the birds' loop-the-loop when
 * hovered (tapped on touch). `layer.loop.facing`: -1 left (default), 1 right.
 */
function LoopLayer({ plate, layer, children }) {
  const ref = useRef(null)
  const loop = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const el = ref.current
    if (!el) return
    el.animate(
      loopKeyframes(
        el.offsetHeight * BIRD_LOOP_RADIUS,
        layer.loop.facing ?? -1,
      ),
      { duration: BIRD_LOOP_MS, easing: "cubic-bezier(0.4, 0, 0.3, 1)" },
    )
  }
  return (
    <LoopWindow
      ref={ref}
      data-layer={layer.name}
      style={plate.windowStyle(layer.box)}
      onMouseEnter={loop}
      onPointerDown={event => {
        if (event.pointerType !== "mouse") loop()
      }}
    >
      {children}
    </LoopWindow>
  )
}

function useHeaderHeight() {
  const [h, setH] = useState(0)
  useLayoutEffect(() => {
    const header = document.querySelector("header")
    if (!header) return undefined
    const measure = () => setH(header.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])
  return h
}

/**
 * The line a heading crosses to count as the one being read: 35% down the
 * view, or just under a figure pinned at the top of the text (marked
 * `data-reading-pin`), since what sits above that is covered. The pinned
 * figure's own height counts, so the line follows it as it opens and closes.
 */
export function readingLine(root, headerH) {
  const normal = headerH + (window.innerHeight - headerH) * 0.35
  const pin = root?.querySelector("[data-reading-pin]")
  if (!pin) return normal
  const style = getComputedStyle(pin)
  const box = pin.getBoundingClientRect()
  if (style.visibility === "hidden" || box.height === 0) return normal
  // Room for a heading's own top margin, so the first one under the figure
  // is already the one being read.
  const under = box.bottom + 48
  if (Math.abs(box.top - parseFloat(style.top)) < 2) return under
  // Still scrolling up to where it pins: the line rises with it, so nothing
  // below the figure is read early and then handed back.
  return box.bottom > 0 && box.top < window.innerHeight
    ? Math.min(normal, under)
    : normal
}

/** The grid with the section menu as a rail. The text box is whatever is
    left of the painted text's right edge after the rail and its gap, so a
    slimmer rail (the dot track) widens the text box by the same amount. */
function railCols(scene, plate) {
  const pct = n => `${((n / plate.W) * 100).toFixed(4)}%`
  const [side, text] = [scene.side.box, scene.text.box]
  const rail = "var(--rail-w)"
  return {
    "--grid-cols": [
      pct(side[0]),
      rail,
      RAIL_GAP,
      `calc(${pct(text[2] - side[0])} - ${rail} - ${RAIL_GAP})`,
      "1fr",
    ].join(" "),
  }
}

/** Scene-specific sizes as CSS variables on the scene root. */
function sceneVars(scene, plate) {
  const { W, H } = plate
  const text = scene.text.box
  const pct = n => `${((n / W) * 100).toFixed(4)}%`
  const crop = scene.cropTop || 0
  const shared = {
    "--px": `calc(var(--art-w, 100vw) / ${W})`,
    "--scene-bg": scene.background,
    "--header-color": scene.headerColor,
    "--header-shadow":
      scene.headerShadow ||
      "0 0.04em 0 rgba(255, 255, 255, 0.55), 0 0.1em 0.35em rgba(0, 0, 0, 0.2)",
    "--accent": scene.accent,
    "--wiki-block-max": scene.text.fullWidthBlocks ? "none" : undefined,
    "--crop-top": pp(crop),
    "--sky-h": pp(scene.skyBottom - crop),
    // Long headers shrink to stay inside ~88% of the width (≈0.6em a letter).
    "--title-fit": `calc(var(--art-w, 100vw) * ${(0.88 / ((scene.header || "").length * 0.6 || 1)).toFixed(5)})`,
    "--pad-bottom": pp(H - scene.textEndY),
    "--text-min-h": pp(scene.text.minH),
    // Anything else the scene themes (e.g. the contribution calendar).
    ...scene.vars,
  }
  // No section list: just the text box, where the scene draws it.
  if (!scene.side) {
    return {
      ...shared,
      "--grid-cols": [pct(text[0]), pct(text[2] - text[0]), "1fr"].join(" "),
      "--pad-top": pp(text[1] - crop),
      "--text-offset": "0px",
    }
  }
  const side = scene.side.box
  return {
    ...shared,
    "--link-color": scene.side.linkColor,
    "--link-active": scene.side.activeLinkColor || scene.side.linkColor,
    "--link-size": ax(scene.side.linkSize || 12.5),
    "--link-pad-y": ax(scene.side.linkPadY || 10),
    "--link-indent": ax(scene.side.linkIndent || 12),
    "--side-max": scene.side.maxHeight || SIDE_COLLAPSED_MAX,
    // Under the list when the crab shows, so it never sits on the titles.
    "--crab-room": scene.side.crab
      ? pp(scene.side.box[3] - scene.side.crab.box[1] + 4)
      : "0px",
    "--strip-color": scene.side.stripColor,
    "--rail-active": scene.side.highlightColor,
    "--rail-tag-bg": scene.side.railTag?.bg,
    "--rail-tag-text": scene.side.railTag?.text,
    "--grid-cols": [
      pct(side[0]),
      pct(side[2] - side[0]),
      pct(text[0] - side[2]),
      pct(text[2] - text[0]),
      "1fr",
    ].join(" "),
    "--pad-top": pp(side[1] - crop),
    "--side-h": pp(side[3] - side[1]),
    "--nav-top": pp(scene.side.navTop),
    // Room under the last title, for a marker taller than its bar.
    "--nav-bottom": pp(scene.side.navBottom || 0),
    // Room left of the list for an icon hanging off the highlight (the coin),
    // so the scrolling list doesn't clip it.
    "--nav-bleed": scene.side.indicatorIcon
      ? pp(scene.side.indicator.box[0] - scene.side.indicatorIcon.box[0])
      : "0px",
    "--text-offset": pp(text[1] - side[1]),
  }
}

/**
 * `opening`: the page's intro line. The first screen becomes a hero of exactly
 * the window under the site header: the title in its sky, the line centred in
 * its sand (OpeningSand), the boxes starting below the fold. The section
 * subtitle is left off, so the header is the title alone.
 * `hideHeaderSub`: leave the section subtitle off without an opening line.
 */
export function SubpageScene({
  scene,
  title,
  description,
  opening,
  hideHeaderSub,
  children,
}) {
  const whiteFilterId = `scene-white-${useId().replace(/:/g, "")}`
  const plate = plateOf(scene)
  const { side, text } = scene
  // A dragon partly drawn over the text box (text.front.dragon): the line
  // its two parts split along, and whether it's burning (both parts follow).
  const front = text.front
  const frontDragon =
    front?.dragon && scene.layers.find(l => l.name === front.dragon)
  const split = frontDragon && {
    ...splitPlate(front.line, plate),
    feather: front.feather ?? 10,
  }
  const [frontLit, setFrontLit] = useState(false)
  const frontLightRef = useRef(null)
  /**
   * Layers painted over the text box (`layer.front`): on wide screens they're
   * drawn on the box, off its right edge and its top (`front: "top"`) or
   * bottom (`"bottom"`) as painted, so they stay with it as it grows.
   */
  const boxFront = scene.layers.filter(l => l.front && !l.hidden)
  const frontAt = ([x0, y0, x1, y1], from) => ({
    left: `calc(100% + ${pp(x0 - text.box[2])})`,
    top:
      from === "top"
        ? pp(y0 - text.box[1])
        : `calc(100% + ${pp(y0 - text.box[3])})`,
    width: pp(x1 - x0),
    height: pp(y1 - y0),
  })
  const sceneRef = useRef(null)
  const artRef = useRef(null)
  const frameRef = useRef(null)
  const textBoxRef = useRef(null)
  // The box's left edge from the scene's (for text.front, which is painted
  // against the plate): it moves when the menu shrinks to a rail.
  useLayoutEffect(() => {
    const box = textBoxRef.current
    const sceneEl = sceneRef.current
    if (!front || !box || !sceneEl) return undefined
    const measure = () => {
      const x = box.getBoundingClientRect().left - sceneEl.getBoundingClientRect().left
      box.style.setProperty("--box-x", `${x.toFixed(2)}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    ro.observe(sceneEl)
    return () => ro.disconnect()
  }, [front])
  const bodyRef = useRef(null)
  const navRef = useRef(null)
  const sideColumnRef = useRef(null)
  const headerH = useHeaderHeight()
  const [sections, setSections] = useState([])
  // Set once the headings are read, so a page with none keeps the full box
  // rather than an empty rail.
  const scannedRef = useRef(false)
  const [activeId, setActiveId] = useState(null)
  // The section last picked from the menu: it stays the current one until the
  // reader scrolls, even when a short section leaves the next heading above
  // the reading line.
  const pickedRef = useRef(null)
  // The pending follow-up scroll of the last click, so a newer click (or the
  // reader scrolling) cancels it instead of being pulled back.
  const settleRef = useRef(null)
  const [activeSubId, setActiveSubId] = useState(null)
  const [indicator, setIndicator] = useState(null)
  // The section menu shrunk to a rail, giving its width to the text.
  // The compact rail is the default; the full box opens from its button.
  const [sideMin, setSideMin] = useState(true)
  // The button that swaps the rail and the box hides itself, so focus moves
  // to the one that swaps them back.
  const expandRef = useRef(null)
  const minimiseRef = useRef(null)
  const toggledRef = useRef(false)
  const toggleSide = min => {
    toggledRef.current = true
    setSideMin(min)
  }
  /** Section box opened to full height; and whether, shut, it hides sections. */
  const [sideOpen, setSideOpen] = useState(false)
  const [sideMore, setSideMore] = useState(false)
  const sideToggle = sideOpen || sideMore
  // Labels hidden: a slim track of one dot per section. The X toggles it.
  const [railDots, setRailDots] = useState(false)
  // Half the window, or the viewport under the header when the list is longer.
  const [railTall, setRailTall] = useState(false)
  const [railClipped, setRailClipped] = useState(false)
  // Headings with subsections start shut so the half-height rail can hold them.
  const [openSubs, setOpenSubs] = useState({})
  const railListRef = useRef(null)
  const railNavRef = useRef(null)
  const [dotIconTop, setDotIconTop] = useState(null)
  /**
   * The box's crab sits under the list, so it's left off while the shut box
   * is too short for every section; opening the box brings it back.
   */
  const crabShown = Boolean(side?.crab) && (sideOpen || !sideMore)

  const measureNav = nav => {
    updateNavFade(nav)
    setSideMore(nav.scrollHeight > nav.clientHeight + 2)
  }

  // Sections = the h2s in the text box, each with its h3 subsections.
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return undefined
    const scan = () => {
      const heads = Array.from(
        bodyRef.current?.querySelectorAll("h2, h3") || [],
      ).filter(el => !el.closest("details, [data-nav-skip]"))
      const list = []
      heads.forEach((el, i) => {
        if (!el.id) el.id = `section-${i + 1}`
        // A heading can name itself shorter for the menu (journal dates).
        const item = {
          id: el.id,
          label: (el.dataset.navLabel || el.textContent).trim(),
        }
        if (el.tagName === "H2") list.push({ ...item, subs: [] })
        else list[list.length - 1]?.subs.push(item)
      })
      scannedRef.current = true
      setSections(previous => JSON.stringify(previous) === JSON.stringify(list) ? previous : list)
    }
    scan()
    // Gatsby navigation and embedded MDX can render headings after mount.
    const observer = new MutationObserver(scan)
    observer.observe(body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [children])

  // Scroll-linked background + active subsection.
  useEffect(() => {
    const sceneEl = sceneRef.current
    const art = artRef.current
    if (!sceneEl || !art) return undefined
    let raf = 0
    // Where the browser has scroll timelines, the drift runs as a
    // scroll-driven animation: the compositor moves the art in step with the
    // scroll, so it never trails it. The script only keeps the keyframes up
    // to date; elsewhere it moves the art itself.
    const timeline =
      typeof window.ScrollTimeline === "function"
        ? new window.ScrollTimeline({
            source: document.documentElement,
            axis: "block",
          })
        : null
    let drift = null
    let driftKey = ""

    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const rect = sceneEl.getBoundingClientRect()
      const view = vh - headerH
      const boxBottom = textBoxRef.current
        ? textBoxRef.current.getBoundingClientRect().bottom - rect.top
        : sceneEl.offsetHeight
      // The art sits in a sticky frame pinned under the header, so scrolling
      // doesn't move it and the script only adds the slow parallax drift (no
      // per-frame tug-of-war with the page). The frame is one screen plus the
      // decorative ending tall, so it unpins exactly when the box's bottom
      // edge reaches the screen bottom; the ending then scrolls natively.
      const sceneH = sceneEl.offsetHeight
      const tail = sceneH - boxBottom
      const frameH = Math.round(view + tail)
      // Art offset once the text ends: its bottom on the frame's bottom, which
      // puts textEndY on the box's bottom edge. Exact (sub-pixel) size and top,
      // so the art meets the footer's painting without a hairline gap.
      const endOffset =
        frameH -
        art.getBoundingClientRect().height -
        parseFloat(getComputedStyle(art).top)
      // Scrolled into the scene, from the page top to the box's bottom edge
      // meeting the viewport bottom.
      const start = -headerH
      const lockAt = boxBottom - vh
      const scrolled = -rect.top
      const range = lockAt - start
      const progress =
        range > 0 ? Math.min(1, Math.max(0, (scrolled - start) / range)) : 1
      // A short box over a long stretch of art (e.g. Contribution) moves the
      // art about as fast as the page or faster, and a script-moved layer
      // that fast visibly trails the scroll. Then the frame scrolls with the
      // page instead and the script adds only the difference: same art
      // position, far less to catch up each frame.
      const native = range > 0 && -endOffset / range > 0.5
      const frame = frameRef.current
      if (frame) {
        const h = native ? sceneH : frameH
        if (frame.offsetHeight !== h) frame.style.height = `${h}px`
        frame.style.position = native ? "relative" : ""
        frame.style.top = native ? "0px" : ""
      }
      // Pinned, the frame is what the page scrolls past; scrolling with the
      // page, the art also takes back that scroll (until the box ends).
      const ride = native ? Math.min(range, Math.max(0, scrolled - start)) : 0
      const maxScroll = document.documentElement.scrollHeight - vh
      if (timeline && maxScroll > 0) {
        // Still from the page top to the drift's start (y0), linear to its
        // end (y1), still after: as page scroll offsets along the timeline.
        const y0 = window.scrollY + rect.top + start
        const y1 = y0 + Math.max(0, range)
        const endY = range > 0 ? (native ? range : 0) + endOffset : endOffset
        const key = [y0, y1, endY, maxScroll].map(n => n.toFixed(1)).join()
        if (key !== driftKey) {
          driftKey = key
          drift?.cancel()
          const at = y => Math.min(1, Math.max(0, y / maxScroll))
          const still = "translate3d(0, 0, 0)"
          const moved = `translate3d(0, ${endY.toFixed(2)}px, 0)`
          drift = art.animate(
            [
              { transform: range > 0 ? still : moved, offset: 0 },
              { transform: range > 0 ? still : moved, offset: at(y0) },
              { transform: moved, offset: Math.max(at(y0), at(y1)) },
              { transform: moved, offset: 1 },
            ],
            { timeline, fill: "both" },
          )
        }
      } else {
        art.style.transform = `translate3d(0, ${(ride + progress * endOffset).toFixed(2)}px, 0)`
      }

      // No section list, nothing to track.
      if (!side) return

      const heads = Array.from(
        bodyRef.current?.querySelectorAll("h2, h3") || [],
      ).filter(el => !el.closest("details, [data-nav-skip]"))
      const line = readingLine(bodyRef.current, headerH)
      let current = heads.find(h => h.tagName === "H2")?.id ?? null
      let currentSub = null
      for (const h of heads) {
        if (h.getBoundingClientRect().top > line) break
        if (h.tagName === "H2") {
          current = h.id
          currentSub = null
        } else currentSub = h.id
      }
      // Bottom of the page: the last section is the one being read.
      const atEnd = rect.top + boxBottom <= vh + 2
      if (atEnd) {
        const lastTop = heads.filter(h => h.tagName === "H2").pop()
        if (lastTop && lastTop.id !== current) {
          current = lastTop.id
          currentSub = null
        }
      }
      // Once the click's scroll is done, the pick holds only while its heading
      // is still near the top (dragging the scrollbar sends no input event).
      const picked = pickedRef.current && document.getElementById(pickedRef.current)
      if (
        picked &&
        !settleRef.current &&
        Math.abs(picked.getBoundingClientRect().top - headerH) > vh / 3
      )
        pickedRef.current = null
      if (pickedRef.current) {
        current = pickedRef.current
        currentSub = null
      }
      setActiveId(prev => (prev === current ? prev : current))
      setActiveSubId(prev => (prev === currentSub ? prev : currentSub))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    const setArtWidth = () => {
      sceneEl.style.setProperty("--art-w", `${sceneEl.clientWidth}px`)
      schedule()
    }
    setArtWidth()
    const ro = new ResizeObserver(setArtWidth)
    ro.observe(sceneEl)
    // The page's length sets where the drift falls along the scroll.
    ro.observe(document.body)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      drift?.cancel()
      ro.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [headerH, sections, side])

  // Slide the highlight onto the active item.
  useLayoutEffect(() => {
    const nav = navRef.current
    const item = nav?.querySelector(`[data-id="${CSS.escape(activeId || "")}"]`)
    if (!item) {
      setIndicator(null)
      return undefined
    }
    const place = () =>
      setIndicator({
        top: item.offsetTop,
        left: item.offsetLeft,
        width: item.offsetWidth,
        height: item.offsetHeight,
      })
    place()
    // Keep the item being read in view when the list scrolls (the open
    // subsection, if any): sideways in the narrow strip, up/down when there
    // are more sections than fit.
    const focus =
      (activeSubId &&
        nav.querySelector(`[href="#${CSS.escape(activeSubId)}"]`)) ||
      item
    const follow = () => {
      // Measured on screen: a subsection's offsets are from its own list.
      const f = focus.getBoundingClientRect()
      const n = nav.getBoundingClientRect()
      if (nav.scrollWidth > nav.clientWidth) {
        nav.scrollTo({
          left:
            nav.scrollLeft + f.left - n.left - nav.clientWidth / 2 + f.width / 2,
          behavior: "smooth",
        })
      } else if (nav.scrollHeight > nav.clientHeight) {
        nav.scrollTo({
          top:
            nav.scrollTop + f.top - n.top - nav.clientHeight / 2 + f.height / 2,
          behavior: "smooth",
        })
      }
    }
    follow()
    measureNav(nav)
    // The list resizing (opened, shut, or the button showing up after it
    // shuts) moves where the item sits, so it's followed again.
    const ro = new ResizeObserver(() => {
      place()
      follow()
      measureNav(nav)
    })
    ro.observe(nav)
    return () => ro.disconnect()
  }, [activeId, activeSubId, sections, sideOpen])

  const stopSettle = () => {
    settleRef.current?.()
    settleRef.current = null
  }
  useEffect(() => {
    // The reader taking over: no more follow-up scroll, and the menu goes back
    // to tracking what's on screen.
    const inputs = ["wheel", "touchstart", "keydown", "pointerdown"]
    const release = () => {
      stopSettle()
      pickedRef.current = null
    }
    inputs.forEach(t => window.addEventListener(t, release, { passive: true }))
    return () => {
      stopSettle()
      inputs.forEach(t => window.removeEventListener(t, release))
    }
  }, [])

  const goTo = (e, id) => {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    stopSettle()
    pickedRef.current = id
    setActiveId(id)
    setActiveSubId(null)
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")
      .matches
      ? "auto"
      : "smooth"
    // On narrow screens the section strip is stuck under the header too.
    const strip = window.matchMedia?.("(max-width: 860px)").matches
      ? sideColumnRef.current?.offsetHeight || 0
      : 0
    // Respect heading-specific spacing for pinned figures as well as the mobile menu.
    const offset = () => {
      const margin = Math.max(
        parseFloat(getComputedStyle(el).scrollMarginTop) || 0,
        headerH + strip + 24,
      )
      return el.getBoundingClientRect().top - margin
    }
    window.scrollTo({ top: window.scrollY + offset(), behavior })
    window.history.replaceState(null, "", `#${id}`)
    // Images loading on the way (lazy ones above it) push the heading down
    // mid-scroll: once it stops, scroll the rest of the way.
    let tries = 0
    let timer
    const settle = () => {
      if (Math.abs(offset()) <= 4 || tries++ >= 4) return stopSettle()
      window.scrollTo({ top: window.scrollY + offset(), behavior })
      timer = window.setTimeout(settle, 700)
    }
    timer = window.setTimeout(settle, 900)
    settleRef.current = () => window.clearTimeout(timer)
  }

  const compact = sideMin && (sections.length > 0 || !scannedRef.current)
  useEffect(() => {
    if (!toggledRef.current) return
    toggledRef.current = false
    ;(compact ? expandRef : minimiseRef).current?.focus()
  }, [compact])

  // Hidden scrollport: the wheel over the rail moves the headings and the
  // page stays put. On the short menu the fade follows that scroll — solid
  // at the top until the first heading moves up, solid at the bottom once
  // the last heading is in view.
  useEffect(() => {
    const nav = railNavRef.current
    const list = railListRef.current
    if (!nav || !list) return undefined
    const sync = () => {
      const overflow = list.scrollHeight > list.clientHeight + 2
      setRailClipped(prev => (prev === overflow ? prev : overflow))
      let edge = ""
      if (overflow) {
        if (railDots || railTall) edge = "both"
        else {
          const above = list.scrollTop > 0
          const below =
            list.scrollTop + list.clientHeight < list.scrollHeight - 2
          edge = above && below ? "both" : above ? "above" : below ? "below" : ""
        }
      }
      if (list.dataset.edge !== edge) list.dataset.edge = edge
    }
    const onWheel = event => {
      let dy = event.deltaY
      if (event.deltaMode === 1) dy *= 16
      else if (event.deltaMode === 2) dy *= list.clientHeight || 0
      if (dy === 0) return
      const max = list.scrollHeight - list.clientHeight
      if (max > 1)
        list.scrollTop = Math.min(max, Math.max(0, list.scrollTop + dy))
      event.preventDefault()
    }
    sync()
    list.addEventListener("scroll", sync, { passive: true })
    nav.addEventListener("wheel", onWheel, { passive: false })
    const ro = new ResizeObserver(sync)
    ro.observe(list)
    return () => {
      list.removeEventListener("scroll", sync)
      nav.removeEventListener("wheel", onWheel)
      ro.disconnect()
    }
  }, [compact, sections, railDots, railTall, openSubs])

  useLayoutEffect(() => {
    const list = railListRef.current
    if (!list || !railDots) {
      setDotIconTop(null)
      return undefined
    }
    const item = list.querySelector("[aria-current]")
    setDotIconTop(item ? item.offsetTop + item.offsetHeight / 2 : null)
    return undefined
  }, [railDots, activeId, activeSubId, sections, railTall, railClipped])
  const [ix0, iy0, ix1, iy1] = side?.indicator.box ?? []
  const icon = side?.indicatorIcon
  const iconBg = !icon
    ? null
    : icon.layers
    ? {
        ...plate.bg(icon.layers[0], icon.from || icon.box),
        // Stacked layers of one canvas, top first.
        backgroundImage: icon.layers
          .map(n => `url(${plate.asset(n)})`)
          .join(", "),
      }
    : icon.canvas
    ? canvasBg(plate.asset(icon.name), icon.canvas)
    : // `from`: painted elsewhere on its plate than `box`.
      plate.bg(icon.name, icon.from || icon.box)
  const railIconStyle = !icon
    ? null
    : {
        ...iconBg,
        aspectRatio: `${icon.box[2] - icon.box[0]} / ${icon.box[3] - icon.box[1]}`,
        filter: icon.glow ? `drop-shadow(0 0 4px ${icon.glow})` : undefined,
        transform:
          [
            icon.rotate && `rotate(${icon.rotate}deg)`,
            icon.railScale && `scale(${icon.railScale})`,
          ]
            .filter(Boolean)
            .join(" ") || undefined,
      }
  const sideW = side ? side.box[2] - side.box[0] : 0
  // Narrow strip: plain colour, or the side box's stretchy middle on top of it.
  const stripCss = side?.stripTexture
    ? cssObject(
        plate.bg(side.name, [
          side.box[0],
          side.box[1] + side.caps[0],
          side.box[2],
          side.box[3] - side.caps[1],
        ]),
      )
    : ""

  return (
    <>
    <RailWidthProp />
    <Scene
      ref={sceneRef}
      style={{
        "--dl-header": `${headerH}px`,
        ...sceneVars(scene, plate),
        ...(side && compact ? railCols(scene, plate) : null),
        "--rail-w": railDots ? RAIL_DOT_W : RAIL_W,
      }}
    >
      {scene.layers.some(layer => layer.removeWhite) && <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <filter id={whiteFilterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {/* Remove the white canvas without darkening the coloured lights. */}
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -3 -3 -3 0 9" />
          </filter>
        </defs>
      </svg>}
      <BgTrack aria-hidden>
        <BgFrame ref={frameRef}>
          <Art ref={artRef} style={{ aspectRatio: `${plate.W} / ${plate.H}` }}>
            {scene.layers
              .filter(l => !l.hidden)
              .map(layer => {
                // Not a cropped image (no box): its own bubbles.
                if (layer.bubbles) {
                  return (
                    <BubbleStream key={layer.name} plate={plate} layer={layer} />
                  )
                }
                const img = (
                  <CropImg
                    src={plate.asset(layer.src || layer.name)}
                    alt=""
                    decoding="async"
                    draggable={false}
                    style={{
                      // `fill`: the file is its own canvas and fills the window.
                      // Otherwise it's a crop of the scene plate.
                      ...(layer.fill
                        ? { left: 0, top: 0, width: "100%", height: "100%" }
                        : plate.imgStyle(layer.from || layer.box)),
                      ...plate.clip(layer.clip),
                      filter: layer.removeWhite ? `url(#${whiteFilterId})` : undefined,
                    }}
                  />
                )
                if (layer.flyer) {
                  return (
                    <BirdLayer key={layer.name} plate={plate} layer={layer} />
                  )
                }
                if (layer.slide || layer.wind) {
                  const Moving = layer.slide ? SlideLayer : WindLayer
                  const moving = (
                    <Moving
                      key={layer.name}
                      plate={plate}
                      layer={layer}
                      at={plate.windowStyle}
                    />
                  )
                  // `front`: over the text box on wide screens (see BoxFront).
                  return layer.front ? (
                    <ArtOnNarrow key={layer.name}>{moving}</ArtOnNarrow>
                  ) : (
                    moving
                  )
                }
                if (layer.bonk) {
                  return (
                    <BonkLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </BonkLayer>
                  )
                }
                if (layer.loop) {
                  return (
                    <LoopLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </LoopLayer>
                  )
                }
                if (layer.lap) {
                  return (
                    <LapLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </LapLayer>
                  )
                }
                if (layer.swim) {
                  return (
                    <SwimLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </SwimLayer>
                  )
                }
                if (layer.fly) {
                  return (
                    <FlyLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </FlyLayer>
                  )
                }
                if (layer.rocket) {
                  return (
                    <RocketLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </RocketLayer>
                  )
                }
                if (layer.dragon) {
                  return (
                    <DragonLayer
                      key={layer.name}
                      plate={plate}
                      layer={layer}
                      split={layer === frontDragon ? split : undefined}
                      onLit={layer === frontDragon ? setFrontLit : undefined}
                      lightRef={layer === frontDragon ? frontLightRef : undefined}
                    >
                      {img}
                    </DragonLayer>
                  )
                }
                if (layer.winch) {
                  return (
                    <WinchLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </WinchLayer>
                  )
                }
                if (layer.duck) {
                  return (
                    <DuckLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </DuckLayer>
                  )
                }
                if (layer.peek) {
                  return (
                    <PeekLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </PeekLayer>
                  )
                }
                if (layer.zap) {
                  return (
                    <ZapLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </ZapLayer>
                  )
                }
                if (layer.coinBurst) {
                  return (
                    <CoinBurstLayer
                      key={layer.name}
                      plate={plate}
                      layer={layer}
                      sprites={scene.coinSprites}
                    >
                      {img}
                    </CoinBurstLayer>
                  )
                }
                if (layer.patrol) {
                  return (
                    <PatrolWindow
                      key={layer.name}
                      data-layer={layer.name}
                      $patrol={patrolFor(layer)}
                      style={plate.windowStyle(layer.box)}
                    >
                      <CropWindow style={{ inset: 0 }}>{img}</CropWindow>
                    </PatrolWindow>
                  )
                }
                return layer.crab ? (
                  <CrabScuttle
                    key={layer.name}
                    data-layer={layer.name}
                    plateW={plate.W}
                    box={layer.box}
                    style={plate.windowStyle(layer.box)}
                  >
                    <CropWindow style={{ inset: 0 }}>{img}</CropWindow>
                  </CrabScuttle>
                ) : layer.sway ? (
                  // `sway`: hanging (tape, a vine), it sways in the wind
                  // `deg` either way from its top, a whole sway every `ms`,
                  // `at` (0–1) of the way through at the start.
                  <HangWindow
                    key={layer.name}
                    data-layer={layer.name}
                    style={{
                      ...plate.windowStyle(layer.box),
                      "--sway-deg": `${layer.sway.deg}deg`,
                      "--sway-ms": `${layer.sway.ms}ms`,
                      "--sway-delay": `${-(layer.sway.at || 0) * layer.sway.ms}ms`,
                    }}
                  >
                    {img}
                  </HangWindow>
                ) : layer.glitter ? (
                  // `glitter`: a slow drift and twinkle on this layer only.
                  <CropWindow
                    key={layer.name}
                    data-layer={layer.name}
                    style={plate.windowStyle(layer.box)}
                  >
                    <GlitterDrift>{img}</GlitterDrift>
                  </CropWindow>
                ) : (
                  <CropWindow
                    key={layer.name}
                    data-layer={layer.name}
                    $fadePulse={layer.fadePulse}
                    style={{
                      ...plate.windowStyle(layer.box),
                      ...plate.fadeY(layer.box, layer.fadeY),
                      // `flip`: mirrored, to face the other way.
                      transform: layer.flip ? "scaleX(-1)" : undefined,
                    }}
                  >
                    {img}
                  </CropWindow>
                )
              })}
            {scene.cactus && <NeedlemanCactus plate={plate} cfg={scene.cactus} />}
          </Art>
        </BgFrame>
      </BgTrack>

      {scene.header && (
        <SectionHeader $opening={!!opening}>
          <SectionTitle>{scene.header}</SectionTitle>
          {!opening && !hideHeaderSub && scene.headerSub && (
            <SectionSub>
              <span>{scene.headerSub}</span>
            </SectionSub>
          )}
        </SectionHeader>
      )}
      {opening && (
        <OpeningSand>
          <OpeningLine>{opening}</OpeningLine>
        </OpeningSand>
      )}

      <Content $opening={!!opening}>
        {side && (
          <SideColumn ref={sideColumnRef} data-scene-strip>
            {/* A page with no sections yet has nothing to list. */}
            {compact && sections.length > 0 && (
              <SideRail
                ref={railNavRef}
                $dots={railDots}
                $tall={railTall}
                aria-label="Sections on this page"
              >
                <RailHead $dots={railDots}>
                  <RailClose
                    ref={expandRef}
                    type="button"
                    aria-pressed={railDots}
                    aria-label={
                      railDots ? "Expand sections" : "Collapse sections"
                    }
                    title={railDots ? "Expand sections" : "Collapse sections"}
                    onClick={() => setRailDots(dots => !dots)}
                  >
                    {railDots ? (
                      <Chevron aria-hidden viewBox="0 0 16 16">
                        <path d="M6 3l5 5-5 5" />
                      </Chevron>
                    ) : (
                      <RailX aria-hidden viewBox="0 0 16 16">
                        <path d="M4 4l8 8M12 4L4 12" />
                      </RailX>
                    )}
                  </RailClose>
                </RailHead>
                {!railDots && <RailRule aria-hidden />}
                <RailList ref={railListRef} $dots={railDots}>
                  {sections.map(s => {
                    const hasSubs = s.subs.length > 0
                    const open = Boolean(openSubs[s.id])
                    const subOn = s.subs.some(
                      sub => sub.id === activeSubId || sub.id === activeId,
                    )
                    const sectionOn = s.id === activeId && !subOn
                    const dotOn = s.id === activeId || subOn
                    return (
                      <React.Fragment key={s.id}>
                        <RailRow $dots={railDots}>
                          <RailLink
                            href={`#${s.id}`}
                            $dots={railDots}
                            aria-current={
                              railDots
                                ? dotOn
                                  ? "location"
                                  : undefined
                                : sectionOn || (subOn && !open)
                                  ? "location"
                                  : undefined
                            }
                            aria-label={railDots ? s.label : undefined}
                            title={railDots ? s.label : undefined}
                            onClick={e => goTo(e, s.id)}
                          >
                            {icon && !railDots && (sectionOn || (subOn && !open)) ? (
                              <RailIcon aria-hidden style={railIconStyle} />
                            ) : (
                              <RailDot aria-hidden $on={railDots && dotOn} />
                            )}
                            {!railDots && <RailLabel>{s.label}</RailLabel>}
                          </RailLink>
                          {!railDots && hasSubs && (
                            <RailDisclosure
                              type="button"
                              $open={open}
                              aria-expanded={open}
                              aria-label={
                                open
                                  ? `Hide subsections of ${s.label}`
                                  : `Show subsections of ${s.label}`
                              }
                              onClick={() =>
                                setOpenSubs(prev => ({
                                  ...prev,
                                  [s.id]: !prev[s.id],
                                }))
                              }
                            >
                              <Chevron aria-hidden viewBox="0 0 16 16">
                                <path d="M6 3l5 5-5 5" />
                              </Chevron>
                            </RailDisclosure>
                          )}
                        </RailRow>
                        {!railDots &&
                          open &&
                          s.subs.map(sub => {
                            const on =
                              sub.id === activeSubId || sub.id === activeId
                            return (
                              <RailLink
                                key={sub.id}
                                href={`#${sub.id}`}
                                $sub
                                aria-current={on ? "location" : undefined}
                                onClick={e => goTo(e, sub.id)}
                              >
                                {icon && on ? (
                                  <RailIcon aria-hidden style={railIconStyle} />
                                ) : (
                                  <RailDot aria-hidden />
                                )}
                                <RailLabel>{sub.label}</RailLabel>
                              </RailLink>
                            )
                          })}
                      </React.Fragment>
                    )
                  })}
                  {railDots && icon && dotIconTop != null && (
                    <RailTraveler
                      aria-hidden
                      style={{
                        ...railIconStyle,
                        top: dotIconTop,
                        transform: `translate(-50%, -50%)${
                          railIconStyle.transform
                            ? ` ${railIconStyle.transform}`
                            : ""
                        }`,
                      }}
                    />
                  )}
                </RailList>
                {(railClipped || railTall) && (
                  <RailExtend
                    type="button"
                    aria-expanded={railTall}
                    aria-label={
                      railTall
                        ? "Collapse the section menu"
                        : "Extend the section menu"
                    }
                    title={railTall ? "Show less" : "Show more"}
                    onClick={() => setRailTall(tall => !tall)}
                  >
                    <Chevron
                      aria-hidden
                      viewBox="0 0 16 16"
                      style={{
                        transform: railTall ? "rotate(-90deg)" : "rotate(90deg)",
                      }}
                    >
                      <path d="M6 3l5 5-5 5" />
                    </Chevron>
                  </RailExtend>
                )}
              </SideRail>
            )}
            <SideBox
              $stripCss={stripCss}
              $min={compact}
              $fit={!sideOpen}
              style={{
                backgroundColor: side.fill,
                // A drawn-in box: rounded like the narrow strip.
                borderRadius: side.radius,
                "--side-bottom": crabShown
                  ? "var(--crab-room)"
                  : sideToggle
                    ? "0.3rem"
                    : "var(--nav-top)",
                ...(sections.length ? null : { display: "none" }),
              }}
            >
              <SideMinimise
                ref={minimiseRef}
                type="button"
                aria-label="Minimise the section menu"
                title="Minimise the section menu"
                onClick={() => toggleSide(true)}
              >
                <Chevron aria-hidden viewBox="0 0 16 16">
                  <path d="M10 3L5 8l5 5" />
                </Chevron>
              </SideMinimise>
              {side.name && <SideBoxArt
                plate={plate}
                name={side.name}
                box={side.box}
                caps={side.caps}
              />}
              <SideNav
                ref={navRef}
                aria-label="Sections on this page"
                onScroll={e => updateNavFade(e.currentTarget)}
              >
                {indicator && (
                  <Indicator
                    aria-hidden
                    style={{
                      ...(side.indicator.fill
                        ? {
                            background: side.indicator.fill,
                            borderRadius: "0.3em",
                          }
                        : plate.bg(side.indicator.name, side.indicator.box)),
                      transform: `translate(${indicator.left}px, ${indicator.top}px)`,
                      width: indicator.width,
                      height: indicator.height,
                    }}
                  >
                    {icon && (
                      <IndicatorIcon
                        style={{
                          ...iconBg,
                          left: `${((icon.box[0] - ix0) / (ix1 - ix0)) * 100}%`,
                          width: `${((icon.box[2] - icon.box[0]) / (ix1 - ix0)) * 100}%`,
                          aspectRatio: `${icon.box[2] - icon.box[0]} / ${icon.box[3] - icon.box[1]}`,
                          filter: icon.glow
                            ? `drop-shadow(0 0 calc(var(--px) * 5) ${icon.glow})`
                            : undefined,
                          // Shared hang: the icon's outer edge meets the
                          // highlight's outside border (the wiki rock). Plate
                          // boxes put the coin and feather too far inside.
                          transform: `translate(-0.85rem, -50%)${
                            icon.rotate ? ` rotate(${icon.rotate}deg)` : ""
                          }`,
                          // Centre offset from the highlight's, as drawn.
                          marginTop: pp(
                            (icon.box[1] + icon.box[3]) / 2 - (iy0 + iy1) / 2,
                          ),
                        }}
                      />
                    )}
                  </Indicator>
                )}
                {sections.map(s => (
                  <React.Fragment key={s.id}>
                    <SideLink
                      href={`#${s.id}`}
                      data-id={s.id}
                      aria-current={
                        s.id === activeId && !activeSubId
                          ? "location"
                          : undefined
                      }
                      $on={s.id === activeId}
                      onClick={e => goTo(e, s.id)}
                    >
                      {s.label}
                    </SideLink>
                    {/* Subsections open under the section being read. */}
                    {s.id === activeId && s.subs.length > 0 && (
                      <SubList>
                        {s.subs.map(sub => (
                          <SubLink
                            key={sub.id}
                            href={`#${sub.id}`}
                            aria-current={
                              sub.id === activeSubId ? "location" : undefined
                            }
                            onClick={e => goTo(e, sub.id)}
                          >
                            {sub.label}
                          </SubLink>
                        ))}
                      </SubList>
                    )}
                  </React.Fragment>
                ))}
              </SideNav>
              {sideToggle && (
                <SideMore
                  type="button"
                  aria-expanded={sideOpen}
                  aria-label={
                    sideOpen ? "Show fewer sections" : "Show all sections"
                  }
                  title={sideOpen ? "Show fewer" : "Show all"}
                  $open={sideOpen}
                  onClick={() => setSideOpen(open => !open)}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3.5 3 8 7.5 12.5 3M3.5 8.5 8 13l4.5-4.5" />
                  </svg>
                </SideMore>
              )}
              {crabShown && (
                <SideCrab
                  aria-hidden
                  style={{
                    left: `${((side.crab.box[0] - side.box[0]) / sideW) * 100}%`,
                    bottom: pp(side.box[3] - side.crab.box[3]),
                    width: `${((side.crab.box[2] - side.crab.box[0]) / sideW) * 100}%`,
                    aspectRatio: `${side.crab.box[2] - side.crab.box[0]} / ${side.crab.box[3] - side.crab.box[1]}`,
                  }}
                >
                  <CrabScuttle plateW={plate.W} box={side.crab.box}>
                    <CrabArt style={plate.bg(side.crab.name, side.crab.box)} />
                  </CrabScuttle>
                </SideCrab>
              )}
            </SideBox>
          </SideColumn>
        )}

        <TextBox ref={textBoxRef} $solo={!side} data-scene-text>
          {/* A box the art doesn't paint is a flat colour. */}
          {text.fill ? (
            <TextFill
              aria-hidden
              style={{ background: text.fill, borderRadius: text.radius }}
            />
          ) : (
            <StretchBox
              plate={plate}
              name={text.name}
              box={text.artBox || text.box}
              caps={text.caps}
            />
          )}
          {/* `layer.front`: art painted over the box, under its text. */}
          {boxFront.length > 0 && (
            <BoxFront aria-hidden>
              {boxFront.map(layer => {
                const Moving = layer.slide ? SlideLayer : WindLayer
                return (
                  <Moving
                    key={layer.name}
                    plate={plate}
                    layer={layer}
                    at={box => frontAt(box, layer.front)}
                    follow
                  />
                )
              })}
            </BoxFront>
          )}
          {/* `text.front`: a dragon's tail (and its glow, fire and markings
              below `line`) over the box's lower edge, below the text, `dy`
              plate px lower than painted. It moves with the box, so it
              never covers text. */}
          {frontDragon && (
            <TextFrontArt
              plate={plate}
              text={text}
              d={frontDragon.dragon}
              split={split}
              lit={frontLit}
              light={(...args) => frontLightRef.current?.(...args)}
            />
          )}
          <TextInner
            ref={bodyRef}
            $hideIntro={scene.hideIntro}
            // `text.inset`: [top, right, bottom, left] plate px more padding.
            style={{
              ...(text.inset && {
                "--inset-t": pp(text.inset[0]),
                "--inset-r": pp(text.inset[1]),
                "--inset-b": pp(text.inset[2]),
                "--inset-l": pp(text.inset[3]),
              }),
              // `scene.tableHead`: table header rows in the menu's colour.
              "--table-head": scene.tableHead,
            }}
          >
            {!scene.hideIntro && (
            <TitleBlock>
              <Title>{scene.boxTitle || title}</Title>
              {description && <Lede>{description}</Lede>}
            </TitleBlock>
            )}
            {children}
          </TextInner>
        </TextBox>
      </Content>
    </Scene>
    </>
  )
}

export default SubpageScene

const Scene = styled.div`
  /* The first screen under the site header, and the sky's share of it (an
     opening page's hero): the art's horizon, so the line below lands on sand,
     but never past 80% of the screen, so a very short window keeps a strip of
     sand for it. */
  --hero-h: calc(100svh - var(--dl-header, 0px));
  --hero-sky: min(var(--sky-h), calc(var(--hero-h) * 0.8));

  position: relative;
  width: 100%;
  min-height: calc(100vh - var(--dl-header, 0px));
  background: var(--scene-bg);
  /* Art over the box (text.front) reaches the window's edges; a tremble
     mustn't widen the page. Clip, unlike hidden, keeps the menu sticky. */
  overflow-x: clip;
  /* The rail column and the text box both read --rail-w, so the text box
     eases into the space the menu gives up. */
  transition: --rail-w 0.4s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

/** Spans the scene; the art inside is shifted by the scroll handler. */
const BgTrack = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

/** Pinned under the header while reading (height set by the scroll handler). */
const BgFrame = styled.div`
  position: sticky;
  top: var(--dl-header, 0px);
  height: calc(100vh - var(--dl-header, 0px));
  overflow: hidden;
`

/** Starts `cropTop` plate px up, so that strip of the art never shows. */
const Art = styled.div`
  position: absolute;
  top: calc(-1 * var(--crop-top, 0px));
  left: 0;
  width: 100%;
  will-change: transform;
`

const PatrolWindow = styled.div`
  position: absolute;
  transform-origin: 50% 85%;
  animation: ${({ $patrol }) => $patrol.name}
    ${({ $patrol }) => $patrol.totalS}s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const layerFadePulse = keyframes`
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
`

const CropWindow = styled.div`
  position: absolute;
  overflow: hidden;
  ${({ $fadePulse }) => $fadePulse && css`
    animation: ${layerFadePulse} ${$fadePulse}ms ease-in-out infinite;
    @media (prefers-reduced-motion: reduce) {
      animation: none;
      opacity: 0.65;
    }
  `}
`

const hangSway = keyframes`
  0%,
  100% {
    transform: rotate(calc(-1 * var(--sway-deg)));
  }
  50% {
    transform: rotate(var(--sway-deg));
  }
`

/** A hanging layer swaying from its top (`layer.sway`). */
/** The rope and bucket, riding up and down inside their window. */
const WinchSlide = styled.div`
  position: absolute;
  inset: 0;
`

const HangWindow = styled(CropWindow)`
  transform-origin: 50% 0;
  animation: ${hangSway} var(--sway-ms) ease-in-out var(--sway-delay) infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** A few plate-pixels of drift, with a soft opacity twinkle. */
const glitterDrift = keyframes`
  0%,
  100% {
    opacity: 0.82;
    transform: translate3d(0, 0, 0);
  }
  45% {
    opacity: 1;
    transform: translate3d(calc(var(--px) * 8), calc(var(--px) * -6), 0);
  }
  72% {
    opacity: 0.9;
    transform: translate3d(calc(var(--px) * -5), calc(var(--px) * 4), 0);
  }
`

const GlitterDrift = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  animation: ${glitterDrift} 9s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
    transform: none;
  }
`

const SlideWindow = styled.div`
  position: absolute;
  pointer-events: none;
`

/** From where it's painted down to where it stops (see SlideLayer). */
const SlideLane = styled.div`
  position: absolute;
  pointer-events: none;
`

const SlideStick = styled.div`
  position: sticky;
  left: 0;
  width: 100%;
`

/** Only while it slides (see SlideLayer). */
const SlideStreak = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.25s ease;
`

const WindWindow = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: none;
  will-change: transform;
`

const BonkWindow = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: none;
`

/** Its own place in the art on narrow screens, over the text box on wide ones. */
const ArtOnNarrow = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;

  ${WIDE} {
    display: none;
  }
`

/** Art over the text box (\`layer.front\`): over its fill, under its text. */
const BoxFront = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;

  ${NARROW} {
    display: none;
  }
`

const BirdWindow = styled.div`
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
`

const LoopWindow = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: auto;
  cursor: pointer;
`

const birdSway = keyframes`
  from {
    transform: translate3d(calc(-1 * var(--sway)), 0, 0);
  }
  to {
    transform: translate3d(var(--sway), 0, 0);
  }
`

const birdBob = keyframes`
  from {
    transform: translate3d(0, -4%, 0);
  }
  to {
    transform: translate3d(0, 4%, 0);
  }
`

/** Frame A shows for the first half of each flap, frame B for the second. */
const flapA = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0; }
`
const flapB = keyframes`
  0% { opacity: 0; }
  50% { opacity: 1; }
`

const birdCross = keyframes`
  from {
    transform: translate3d(var(--cross-from), 0, 0);
  }
  to {
    transform: translate3d(var(--cross-to), 0, 0);
  }
`

const BirdSway = styled.div`
  position: absolute;
  inset: 0;
  animation: ${birdSway} var(--sway-ms) ease-in-out var(--phase) infinite
    alternate;

  ${({ $cross }) =>
    $cross &&
    css`
      animation: ${birdCross} var(--cross-ms) linear var(--cross-delay) infinite;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const BirdBob = styled.div`
  position: absolute;
  inset: 0;
  animation: ${birdBob} var(--bob-ms) ease-in-out var(--phase) infinite
    alternate;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const BirdStartle = styled.div`
  position: absolute;
  inset: 0;
`

const BirdCrop = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
`

const BirdFrame = styled.img`
  position: absolute;
  display: block;
  max-width: none;
  user-select: none;
  animation: ${({ $second }) => ($second ? flapB : flapA)} var(--flap)
    steps(1, end) var(--phase) infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: ${({ $second }) => ($second ? 0 : 1)};
  }
`

const CoinStage = styled.div`
  position: absolute;
  pointer-events: none;
`

/** Window for a coin-bursting layer; it takes the hover itself. */
const CoinTrigger = styled.div`
  position: absolute;
  transform-origin: 50% 100%;
  overflow: hidden;
  pointer-events: auto;
  cursor: pointer;
`

/**
 * Hiding: the glow comes up first, then the swimmer slides back. Coming out:
 * it pops out (a slight overshoot) and the glow fades once it's back.
 */
const PeekWindow = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: none;
  transform: translate3d(${({ $hidden }) => ($hidden ? "var(--peek-x)" : "0")}, 0, 0);
  transition: ${({ $hidden }) =>
    $hidden
      ? "transform 650ms cubic-bezier(0.45, 0, 0.3, 1) 220ms"
      : "transform 480ms cubic-bezier(0.3, 1.45, 0.5, 1)"};

  @media (prefers-reduced-motion: reduce) {
    transform: none;
    transition: none;
  }
`

/** Still window round a ducking critter; cut off at the edge while it's behind. */
const DuckClip = styled.div`
  position: absolute;
  pointer-events: none;
`

/** Light round the outline while it's hiding (it has no painted glow). */
const DuckWindow = styled.div`
  position: absolute;
  overflow: hidden;
  filter: ${({ $glow }) =>
    $glow
      ? "drop-shadow(0 0 calc(var(--px) * 8) rgba(255, 244, 150, 0.95)) drop-shadow(0 0 calc(var(--px) * 20) rgba(255, 226, 90, 0.6))"
      : "none"};
  transition: filter 300ms ease;
`

const PeekGlow = styled.div`
  position: absolute;
  inset: 0;
  opacity: ${({ $hidden }) => ($hidden ? 1 : 0)};
  transition: ${({ $hidden }) =>
    $hidden ? "opacity 220ms ease-out" : "opacity 420ms ease-in 420ms"};
`

/** In past the right, out past the left, then out of sight till the next. */
const flyAcross = keyframes`
  0% {
    transform: translate3d(var(--fly-in-x), var(--fly-in-y), 0);
  }
  62%,
  100% {
    transform: translate3d(var(--fly-out-x), var(--fly-out-y), 0);
  }
`

const FlyWindow = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: ${({ $clickable }) => ($clickable ? "auto" : "none")};
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "auto")};
  opacity: ${({ $gone }) => ($gone ? 0 : 1)};
  animation: ${flyAcross} var(--fly-ms) linear var(--fly-delay) infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** The whole plate, for sparks to fly anywhere on it. */
const FireworkStage = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

/** Thrown out fast, slowing as it falls a little and fades. */
const sparkFrom = css`
  transform: translate(-50%, -50%) translate3d(var(--ox), var(--oy), 0)
    rotate(var(--rot)) scale(1);
`
const sparkTo = css`
  transform: translate(-50%, -50%)
    translate3d(
      calc(var(--ox) + var(--dx)),
      calc(var(--oy) + var(--dy) + var(--droop)),
      0
    )
    rotate(var(--rot)) scale(0.35);
`

const sparkFly = keyframes`
  0% {
    opacity: 1;
    ${sparkFrom}
  }
  55% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    ${sparkTo}
  }
`

/** The same, twinkling as it goes out. */
const sparkGlitter = keyframes`
  0% {
    opacity: 1;
    ${sparkFrom}
  }
  55% {
    opacity: 1;
  }
  64% {
    opacity: 0.15;
  }
  71% {
    opacity: 1;
  }
  79% {
    opacity: 0.2;
  }
  87% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    ${sparkTo}
  }
`

const Spark = styled.span`
  position: absolute;
  border-radius: 999px;
  opacity: 0;
  /* Unseen until its delay is up (forwards, not both), then out for good. */
  animation: ${({ $glitter }) => ($glitter ? sparkGlitter : sparkFly)}
    var(--ms) cubic-bezier(0.12, 0.75, 0.35, 1) var(--delay) forwards;
`

/** A burst's flash of light, or (ring) its shockwave. */
const flashPop = keyframes`
  from {
    opacity: 1;
    transform: translate(-50%, -50%) translate3d(var(--ox), var(--oy), 0)
      scale(0.2);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) translate3d(var(--ox), var(--oy), 0)
      scale(1.4);
  }
`

const ringOut = keyframes`
  from {
    opacity: 0.9;
    transform: translate(-50%, -50%) translate3d(var(--ox), var(--oy), 0)
      scale(0.15);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) translate3d(var(--ox), var(--oy), 0)
      scale(2);
  }
`

const Flash = styled.span`
  position: absolute;
  border-radius: 50%;
  opacity: 0;
  ${({ $ring }) =>
    $ring
      ? css`
          border: calc(var(--px) * 4) solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 calc(var(--px) * 18) rgba(160, 190, 255, 0.8);
          animation: ${ringOut} 0.8s ease-out var(--delay) forwards;
        `
      : css`
          background: radial-gradient(
            circle,
            #ffffff 0%,
            rgba(255, 244, 214, 0.9) 22%,
            rgba(255, 196, 120, 0.3) 50%,
            transparent 70%
          );
          animation: ${flashPop} 0.5s ease-out var(--delay) forwards;
        `}
`

/** The rocket hovering on its trail; the trail stretches to keep up. */
const rocketHover = keyframes`
  to {
    transform: translate3d(0, calc(var(--px) * var(--hover-rise)), 0);
  }
`

const trailHover = keyframes`
  to {
    transform: scaleY(var(--hover-stretch));
  }
`

const HoverBob = styled.div`
  position: absolute;
  /* The trail crops here; the rocket inside its rattle, so a shake isn't cut. */
  overflow: ${({ $trail }) => ($trail ? "hidden" : "visible")};
  pointer-events: none;
  opacity: ${({ $gone }) => ($gone ? 0 : 1)};
  /* Gone at once when it bursts; back slowly. */
  transition: opacity ${({ $gone }) => ($gone ? "0s" : "0.8s")} ease;
  animation: ${({ $trail }) => ($trail ? trailHover : rocketHover)}
    ${ROCKET_HOVER_MS}ms ease-in-out infinite alternate;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** About to go off: a quick, small shake. */
const rocketRattle = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  25% {
    transform: translate3d(calc(var(--px) * -2.5), calc(var(--px) * 1), 0)
      rotate(-2.5deg);
  }
  50% {
    transform: translate3d(calc(var(--px) * 2.5), calc(var(--px) * -1), 0)
      rotate(2deg);
  }
  75% {
    transform: translate3d(calc(var(--px) * -1.5), 0, 0) rotate(-1.5deg);
  }
`

const RocketRattle = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  transform-origin: 50% 80%;
  ${({ $rattle }) =>
    $rattle &&
    css`
      animation: ${rocketRattle} 0.16s linear infinite;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/**
 * A burning dragon trembles: every part of it (glow, fire, body, tail,
 * markings) shakes on the same keyframes, started together, so they stay put
 * on each other. Small steps of a plate px or so.
 */
const dragonShake = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  20% {
    transform: translate3d(calc(var(--px) * -0.7), calc(var(--px) * 0.4), 0);
  }
  40% {
    transform: translate3d(calc(var(--px) * 0.6), calc(var(--px) * -0.5), 0);
  }
  60% {
    transform: translate3d(calc(var(--px) * -0.5), calc(var(--px) * -0.3), 0);
  }
  80% {
    transform: translate3d(calc(var(--px) * 0.7), calc(var(--px) * 0.4), 0);
  }
`

const shakeWhenLit = css`
  ${({ $lit }) =>
    $lit &&
    css`
      animation: ${dragonShake} 0.22s linear infinite;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const DragonPart = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: none;
  ${shakeWhenLit}

  /* Drawn over the text box instead, where there's room beside it. */
  ${({ $narrowOnly }) =>
    $narrowOnly &&
    css`
      @media (min-width: 861px) {
        display: none;
      }
    `}
`

/** Flames licking: the glow behind a one-picture dragon flickers. */
const haloFlicker = keyframes`
  0%,
  100% {
    opacity: 1;
  }
  30% {
    opacity: 0.8;
  }
  55% {
    opacity: 0.95;
  }
  75% {
    opacity: 0.7;
  }
`

const HaloFade = styled.div`
  position: absolute;
  inset: 0;
`

/**
 * A one-picture dragon glowing like fire behind itself: its picture, with
 * fiery glows round it (the picture is hidden under the dragon itself).
 */
const HeatHalo = styled.div`
  position: absolute;
  overflow: hidden;
  filter: drop-shadow(0 0 calc(var(--px) * 6) #ffd45a)
    drop-shadow(0 0 calc(var(--px) * 14) #ff7a1e)
    drop-shadow(0 0 calc(var(--px) * 22) rgba(230, 50, 20, 0.8));
  ${({ $lit }) =>
    $lit &&
    css`
      animation: ${haloFlicker} 1.1s ease-in-out infinite;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const DragonGlow = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: none;
  ${shakeWhenLit}
  opacity: ${({ $lit }) => ($lit ? 1 : 0)};
  transition: opacity ${({ $lit }) => ($lit ? "0.7s" : "0.9s")} ease;
`

/**
 * The fire, seen through a soft circle that grows from the head. Its size
 * and corner move on the same timing, so it stays centred on the head.
 */
const DragonFire = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: none;
  ${shakeWhenLit}
  --fire-mask: radial-gradient(
    circle closest-side,
    #000 ${DRAGON_FIRE_SOLID * 100}%,
    transparent 100%
  );
  -webkit-mask-image: var(--fire-mask);
  mask-image: var(--fire-mask);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: var(--fire-size) var(--fire-size);
  mask-size: var(--fire-size) var(--fire-size);
  -webkit-mask-position: var(--fire-x) var(--fire-y);
  mask-position: var(--fire-x) var(--fire-y);
  transition-property: mask-size, mask-position, -webkit-mask-size,
    -webkit-mask-position;
  transition-duration: ${({ $lit }) =>
    $lit ? DRAGON_SPREAD_MS : DRAGON_FADE_MS}ms;
  transition-timing-function: ${({ $lit }) => ($lit ? "linear" : "ease-in")};

  @media (prefers-reduced-motion: reduce) {
    transition-duration: 0s;
  }
`

/** A one-picture dragon's eye, glowing in and out while it burns. */
const eyeGlow = keyframes`
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  to {
    opacity: 0.35;
    transform: translate(-50%, -50%) scale(0.85);
  }
`

const DragonEye = styled.span`
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    #fffbe0 0%,
    #ffd23f 30%,
    rgba(255, 120, 0, 0.55) 55%,
    transparent 72%
  );
  mix-blend-mode: screen;
  opacity: ${({ $lit }) => ($lit ? 1 : 0)};
  transition: opacity 0.9s ease;
  ${({ $lit }) =>
    $lit &&
    css`
      animation: ${eyeGlow} 2.4s ease-in-out 0.9s infinite alternate;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Lit markings (eyes and scales): glowing in and out, slowly, while it burns. */
const highlightBreathe = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0.3;
  }
`

const DragonHighlight = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: none;
  ${shakeWhenLit}
  opacity: ${({ $lit }) => ($lit ? 1 : 0)};
  transition: opacity ${({ $lit }) => ($lit ? "0.9s" : "0.6s")} ease;

  > * {
    ${({ $lit }) =>
      $lit &&
      css`
        animation: ${highlightBreathe} 2.4s ease-in-out 0.9s infinite alternate;
      `}
  }

  @media (prefers-reduced-motion: reduce) {
    > * {
      animation: none;
    }
  }
`

/**
 * Painted markings (\`dragon.swirls\`), lit: their dark violet brightened to
 * lavender and glowing violet-blue, like the Wiki's.
 */
const SwirlGlow = styled.div`
  position: absolute;
  inset: 0;
  filter: brightness(3.4) drop-shadow(0 0 calc(var(--px) * 1.5) #6f5bff)
    drop-shadow(0 0 calc(var(--px) * 3) #5b3dff)
    drop-shadow(0 0 calc(var(--px) * 6) rgba(90, 60, 255, 0.8));
`

/** A tail's hover area; with \`$narrowOnly\`, only where it's in the art. */
const TailHit = styled.div`
  position: absolute;
  pointer-events: auto;
  cursor: pointer;

  ${({ $narrowOnly }) =>
    $narrowOnly &&
    css`
      @media (min-width: 861px) {
        display: none;
      }
    `}
`

const PeekHit = styled.div`
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
`

const LapWindow = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: none;
`

const LapGlow = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0;
`

/** Same swim as the homepage fish (fishSwimAcross): out one edge, in the other. */
const swimAcross = keyframes`
  0%,
  18% {
    transform: translate3d(0, 0, 0);
  }
  72% {
    transform: translate3d(var(--swim-out), 0, 0);
  }
  72.01% {
    transform: translate3d(var(--swim-in), 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
`

const swimBob = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -8px, 0);
  }
`

const swimBobStrong = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -14px, 0);
  }
`

const SwimWindow = styled.div`
  position: absolute;
  pointer-events: auto;
  animation: ${swimAcross} var(--swim-ms) linear var(--swim-delay) infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Bobs, and crops the plate-sized image to the window (moving with it). */
const SwimBob = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  animation: ${swimBob} 4.8s ease-in-out infinite;

  ${SwimWindow}:hover & {
    animation-name: ${swimBobStrong};
    animation-duration: 3.2s;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const BubbleLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

/** Fades in off the seafloor; stays until the surface, then fades there. */
const bubbleRise = keyframes`
  0% {
    transform: translate3d(0, 0, 0);
    opacity: 0;
  }
  4%,
  97% {
    opacity: 0.9;
  }
  100% {
    transform: translate3d(0, var(--rise), 0);
    opacity: 0;
  }
`

const bubbleWobble = keyframes`
  from {
    transform: translate3d(calc(var(--wobble) * -1), 0, 0);
  }
  to {
    transform: translate3d(var(--wobble), 0, 0);
  }
`

/** One bubble rising from its start to the surface, over and over. */
const BubbleRise = styled.div`
  position: absolute;
  animation: ${bubbleRise} var(--rise-s) linear var(--rise-delay) infinite;

  img {
    display: block;
    width: 100%;
    height: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`

const BubbleWobble = styled.div`
  animation: ${bubbleWobble} var(--wobble-s) ease-in-out infinite alternate;
`

const ZapBody = styled.div`
  position: absolute;
  overflow: hidden;
  transform-origin: 50% 40%;
`

/** The still rest of a zapped layer round its jolting part. */
const ZapStill = styled.div`
  position: absolute;
  overflow: hidden;
  pointer-events: none;
`

/** Lightning over a zapped layer; invisible until it flickers. */
const ZapBolt = styled.div`
  position: absolute;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
`

const ZapHit = styled.div`
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
`

const coinX = keyframes`
  from {
    transform: translate3d(-50%, -50%, 0);
  }
  to {
    transform: translate3d(calc(-50% + var(--dx)), -50%, 0);
  }
`

/** Up to the top of the arc (easing out), then down (easing in). */
const coinY = keyframes`
  0% {
    transform: translate3d(0, 0, 0) scale(0.4);
    opacity: 0;
    animation-timing-function: cubic-bezier(0.2, 0.7, 0.35, 1);
  }
  8% {
    opacity: 1;
  }
  35% {
    transform: translate3d(0, var(--peak), 0) scale(1);
    animation-timing-function: cubic-bezier(0.55, 0, 0.85, 0.4);
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translate3d(0, calc(var(--peak) + var(--fall)), 0) scale(1);
    opacity: 0;
  }
`

const coinSpin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(var(--spin));
  }
`

/** Starts at the middle of the layer; drifts sideways at a steady pace. */
const CoinX = styled.span`
  position: absolute;
  left: 50%;
  top: 45%;
  animation: ${coinX} var(--ms) linear var(--delay) both;
`

const CoinY = styled.span`
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: ${coinY} var(--ms) linear var(--delay) both;
`

const CoinSpin = styled.span`
  position: absolute;
  inset: 0;
  animation: ${coinSpin} var(--ms) linear var(--delay) both;
`

const CropImg = styled.img`
  position: absolute;
  display: block;
  max-width: none;
  user-select: none;
`

/**
 * Header lockup. The column is the title's own width (`fit-content`), and
 * the subtitle is taken out of that measurement (`width: 0; min-width: 100%`)
 * so it can sit a little wider than the title without stretching it.
 */
const SectionHeader = styled.div`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  height: var(--sky-h);
  display: grid;
  grid-template-columns: fit-content(100%);
  justify-content: center;
  align-content: center;
  text-align: center;
  pointer-events: none;
  container-type: inline-size;

  ${NARROW} {
    height: max(4.5rem, var(--sky-h));
  }

  /* With an opening line the header is the hero's sky: never more than its
     share of the first screen, so the sand below keeps room for the line. */
  ${({ $opening }) =>
    $opening &&
    css`
      &&& {
        height: var(--hero-sky);
      }
    `}
`

/** Big and heavy, with a light top edge and a soft drop so it sits on the art. */
const SectionTitle = styled.p`
  margin: 0;
  justify-self: center;
  width: max-content;
  max-width: 100%;
  color: var(--header-color);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: min(max(3.25rem, ${ax(108)}), var(--title-fit));
  line-height: 0.95;
  letter-spacing: -0.025em;
  text-shadow: var(--header-shadow);
`

/**
 * A scene's `headerSub`. Same rule on every scene: a step down from the
 * title, wrapping in a block 1.35× that title's width (and never the full
 * header).
 */
const SectionSub = styled.p`
  width: 0;
  min-width: 100%;
  margin: ${ax(8)} 0 0;
  color: var(--header-color);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: max(0.9rem, ${ax(20)});
  line-height: 1.25;
  text-shadow: var(--header-shadow);

  span {
    display: block;
    position: relative;
    left: 50%;
    width: min(135%, 92cqi);
    transform: translateX(-50%);
    text-wrap: balance;
  }
`

/**
 * The first screen's sand: from the bottom of the hero's sky down to the fold
 * (where Content's boxes begin). The line is centred in it and its type is
 * capped by the box's height (cqh) as well as the art's width, so a wide, short
 * window shrinks it instead of pushing it up into the title.
 */
const OpeningSand = styled.div`
  position: absolute;
  z-index: 1;
  top: var(--hero-sky);
  left: 0;
  right: 0;
  height: calc(var(--hero-h) - var(--hero-sky));
  display: flex;
  align-items: center;
  justify-content: center;
  container-type: size;
  pointer-events: none;
`

const OpeningLine = styled.p`
  width: min(80%, 60rem);
  margin: 0;
  color: var(--header-color);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: max(0.95rem, min(${ax(28)}, 11cqh));
  line-height: 1.3;
  text-align: center;
  text-wrap: balance;
  text-shadow: var(--header-shadow);

  ${NARROW} {
    width: 88%;
  }
`

const scuttleKeyframes = sign => keyframes`
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  18% {
    transform: translate3d(calc(var(--scuttle) * ${sign * 0.2}), 0, 0) rotate(${sign * -CRAB_SCUTTLE_THETA_DEG}deg);
  }
  38% {
    transform: translate3d(calc(var(--scuttle) * ${sign * 0.467}), 0, 0) rotate(${sign * CRAB_SCUTTLE_THETA_DEG}deg);
  }
  58% {
    transform: translate3d(calc(var(--scuttle) * ${sign * 0.733}), 0, 0) rotate(${sign * -CRAB_SCUTTLE_THETA_DEG}deg);
  }
  78% {
    transform: translate3d(calc(var(--scuttle) * ${sign * 0.911}), 0, 0) rotate(${sign * CRAB_SCUTTLE_THETA_DEG}deg);
  }
  100% {
    transform: translate3d(calc(var(--scuttle) * ${sign}), 0, 0) rotate(0deg);
  }
`
const crabScuttleLeft = scuttleKeyframes(-1)
const crabScuttleRight = scuttleKeyframes(1)

const ScuttleShell = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: auto;
  cursor: pointer;
`

const ScuttleMotion = styled.div`
  position: absolute;
  inset: 0;
  transform-origin: 50% 60%;

  ${({ $playing, $dir }) =>
    $playing &&
    css`
      animation: ${$dir < 0 ? crabScuttleLeft : crabScuttleRight}
        ${CRAB_SCUTTLE_MS}ms cubic-bezier(0.45, 0.05, 0.25, 1) both;
    `}
`

const CrabArt = styled.span`
  position: absolute;
  inset: 0;
`

const Content = styled.div`
  position: relative;
  z-index: 1;
  /* Only the boxes take the pointer, so the crabs behind stay hoverable. */
  pointer-events: none;
  display: grid;
  grid-template-columns: var(--grid-cols);
  align-items: start;
  padding: var(--pad-top) 0 var(--pad-bottom);

  ${NARROW} {
    grid-template-columns: 5% 90% 5%;
    padding-top: max(1.5rem, var(--pad-top));
  }

  /* One screen of art under the site header before the boxes. */
  &&& {
    ${({ $opening }) =>
      $opening &&
      css`
        padding-top: max(var(--pad-top), var(--hero-h));
      `}
  }
`

/** Spans the whole text height (for the sticky box); only the box takes the pointer. */
const SideColumn = styled.div`
  pointer-events: none;
  grid-column: 2;
  align-self: stretch;

  ${NARROW} {
    grid-column: 1 / -1;
    position: sticky;
    top: var(--dl-header, 0px);
    z-index: 2;
    padding: 0.5rem 5%;
  }
`

const SideBox = styled.div`
  pointer-events: auto;
  position: sticky;
  top: calc(var(--dl-header, 0px) + 1.25rem);
  height: min(var(--side-h), calc(100vh - var(--dl-header, 0px) - 2.5rem));
  min-height: 14rem;
  display: flex;
  flex-direction: column;
  /* Room under the list: the crab's, the button's, or the box's margin. */
  padding-bottom: var(--side-bottom, 0px);

  /* Only as tall as its list (up to the window), so the art beside the
     text stays in view. The cap is for the list; the room under it is extra. */
  ${({ $fit }) =>
    $fit &&
    css`
      height: auto;
      max-height: calc(
        min(var(--side-max), calc(100vh - var(--dl-header, 0px) - 2.5rem)) +
          var(--side-bottom, 0px)
      );
      min-height: 0;
    `}

  ${NARROW} {
    position: relative;
    top: auto;
    height: auto;
    min-height: 0;
    /* The fitted box's room under the list is for the painted box only. */
    padding-bottom: 0;
    border-radius: 0.6rem;
    background-color: var(--strip-color);
    box-shadow: 0 2px 10px rgba(30, 30, 40, 0.25);
    ${({ $stripCss }) => $stripCss}
  }

  /* Minimised, the rail stands in for it (the narrow strip is unaffected). */
  ${({ $min }) =>
    $min &&
    css`
      ${WIDE} {
        display: none;
      }
    `}
`

const Chevron = styled.svg`
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
`

const SideToggle = styled.button`
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--link-color);
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid var(--link-color);
    outline-offset: -2px;
  }
`

/** Sits in the menu's top corner; the narrow strip has no use for it. */
const SideMinimise = styled(SideToggle)`
  position: absolute;
  z-index: 2;
  top: 0.4rem;
  right: 0.4rem;
  /* Its corner can lie outside the painted box, over the sky or sand, so it
     carries the menu's colour itself. */
  background-color: var(--strip-color);
  box-shadow: 0 1px 6px rgba(30, 30, 40, 0.3);
  opacity: 1;

  ${NARROW} {
    display: none;
  }
`

/** The section menu. Half the window by default; the list clips instead of
    scrolling. The X is the only control in its header. */
const SideRail = styled.nav`
  pointer-events: auto;
  position: sticky;
  top: calc(var(--dl-header, 0px) + 0.75rem);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-height: ${({ $tall }) =>
    $tall
      ? "calc(100vh - var(--dl-header, 0px) - 1.5rem)"
      : "min(50vh, calc(100vh - var(--dl-header, 0px) - 1.5rem))"};
  /* Clip the panel itself so a long list never grows a scrollbar. The icon
     hangs inside the padding, so this does not cut it off. */
  overflow: hidden;
  box-sizing: border-box;
  padding: ${({ $dots }) => ($dots ? "8px 6px 8px" : "12px 10px 10px")};
  text-align: left;
  border-radius: ${({ $dots }) => ($dots ? "1rem" : "1.25rem")};
  background-color: var(--strip-color);
  box-shadow: 0 2px 10px rgba(30, 30, 40, 0.25);

  ${NARROW} {
    display: none;
  }
`

const RailHead = styled.div`
  display: flex;
  flex: none;
  align-items: center;
  justify-content: ${({ $dots }) => ($dots ? "center" : "flex-start")};
  padding: 0 2px 8px;
`

/** Same control: an X collapses the menu, a right arrow opens it again. */
const RailClose = styled.button`
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--rail-active, #9c6e56);
  color: var(--link-active, #fff);
  cursor: pointer;

  svg {
    width: 0.85rem;
    height: 0.85rem;
  }

  &:hover {
    filter: brightness(1.08);
  }

  &:focus-visible {
    outline: 2px solid var(--link-color);
    outline-offset: 2px;
  }
`

const RailX = styled.svg`
  width: 0.85rem;
  height: 0.85rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
`

const RailRule = styled.div`
  flex: none;
  height: 1px;
  margin: 0 6px 6px;
  background: color-mix(in srgb, var(--link-color) 28%, transparent);
`

const RailList = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 3px;
  min-height: 0;
  /* Scrolls under the pointer; the bar stays hidden, no gutter. */
  overflow-x: hidden;
  overflow-y: scroll;
  scrollbar-width: none;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  ${({ $dots }) =>
    $dots &&
    css`
      align-items: center;
      gap: 12px;
      padding: 4px 0 2px;
    `}

  ${({ $dots }) =>
    !$dots &&
    css`
      padding-left: 10px;
    `}

  &[data-edge="below"] {
    mask-image: linear-gradient(to bottom, #000 calc(100% - 1.15rem), transparent);
    -webkit-mask-image: linear-gradient(
      to bottom,
      #000 calc(100% - 1.15rem),
      transparent
    );
  }
  &[data-edge="above"] {
    mask-image: linear-gradient(to bottom, transparent, #000 1.15rem);
    -webkit-mask-image: linear-gradient(to bottom, transparent, #000 1.15rem);
  }
  &[data-edge="both"] {
    mask-image: linear-gradient(
      to bottom,
      transparent,
      #000 1.15rem,
      #000 calc(100% - 1.15rem),
      transparent
    );
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent,
      #000 1.15rem,
      #000 calc(100% - 1.15rem),
      transparent
    );
  }
`

const RailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  width: 100%;

  ${({ $dots }) =>
    $dots &&
    css`
      width: auto;
      justify-content: center;
    `}
`

const RailDot = styled.span`
  flex: none;
  width: 10px;
  height: 10px;
  margin: 0 4px;
  border-radius: 50%;
  background: var(--link-color);
  opacity: ${({ $on }) => ($on ? 0 : 0.6)};
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
`

/** Sits on the active title. Its left edge meets the pill's outside edge. */
const RailIcon = styled.span`
  position: relative;
  z-index: 1;
  flex: none;
  width: 34px;
  margin: -10px -8px -10px -16px;
  pointer-events: none;
`

/** The same icon, travelling along the dots when the labels are hidden. */
const RailTraveler = styled.span`
  position: absolute;
  z-index: 1;
  left: 50%;
  width: 30px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  transition: top 0.35s cubic-bezier(0.3, 0.9, 0.3, 1.1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const RailLabel = styled.span`
  font-family: var(--font-body);
  font-size: 16.5px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-align: left;
  text-wrap: pretty;
`

const RailLink = styled.a`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  min-width: 0;
  padding: 8px 8px 8px 10px;
  border-radius: 12px;
  color: var(--link-color);
  text-decoration: none;
  transition: background-color 0.2s ease;

  ${({ $dots }) =>
    $dots &&
    css`
      flex: none;
      gap: 0;
      padding: 4px;
      border-radius: 999px;
      background: none !important;
    `}

  ${({ $sub }) =>
    $sub &&
    css`
      margin-left: 1.15rem;
      padding-top: 4px;
      padding-bottom: 4px;

      ${RailLabel} {
        font-size: 14px;
      }
    `}

  &:hover {
    background: color-mix(in srgb, var(--rail-active, #9c6e56) 55%, transparent);
  }

  &[aria-current] {
    background: var(--rail-active, #9c6e56);
    color: var(--link-active);
  }
  &[aria-current] ${RailDot} {
    background: var(--link-active);
    opacity: 1;
    transform: scale(1.45);
  }
  &[aria-current] ${RailLabel} {
    font-weight: 700;
  }

  ${({ $dots }) =>
    $dots &&
    css`
      &[aria-current] {
        background: none;
      }
      &[aria-current] ${RailDot} {
        opacity: 0;
        transform: none;
      }
    `}

  &:focus-visible {
    outline: 2px solid var(--link-color);
    outline-offset: -2px;
  }
`

/** Opens or shuts the subsections under a heading. Flat lists have none. */
const RailDisclosure = styled.button`
  flex: none;
  display: grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 2px;
  padding: 0;
  border: 0;
  border-radius: 0.3rem;
  background: none;
  color: var(--link-color);
  cursor: pointer;
  opacity: 0.8;

  ${Chevron} {
    width: 0.8rem;
    height: 0.8rem;
    transform: rotate(${({ $open }) => ($open ? 90 : 0)}deg);
    transition: transform 0.2s ease;
  }

  &:hover,
  &:focus-visible {
    opacity: 1;
    background: color-mix(in srgb, var(--link-color) 12%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--link-color);
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    ${Chevron} {
      transition: none;
    }
  }
`

/** Bottom arrow: a taller rail, or back to half height. Never a scrollbar. */
const RailExtend = styled.button`
  flex: none;
  align-self: center;
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.35rem;
  margin-top: 4px;
  padding: 0;
  border: 0;
  border-radius: 0.4rem;
  background: none;
  color: var(--link-color);
  cursor: pointer;
  opacity: 0.9;

  ${Chevron} {
    width: 1rem;
    height: 1rem;
  }

  &:hover,
  &:focus-visible {
    opacity: 1;
    background: color-mix(in srgb, var(--link-color) 14%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--link-color);
    outline-offset: 1px;
  }
`

const SliceStack = styled.div`
  position: absolute;
  z-index: 0;
  inset: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
`

const SliceCap = styled.div`
  position: relative;
  z-index: 1;
  flex: none;
  width: 100%;
`

/** Overlaps the caps by a pixel so no seam shows between slices. */
const SliceMid = styled.div`
  flex: 1 1 auto;
  margin: -1px 0;
`

const TextFill = styled.div`
  position: absolute;
  z-index: 0;
  inset: 0;
  pointer-events: none;
`

const SideBoxArt = styled(StretchBox)`
  ${NARROW} {
    display: none;
  }
`

/** Scrolls when the sections don't all fit; bleeds left (unseen) for the coin. */
const SideNav = styled.nav`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  margin-left: calc(-1 * var(--nav-bleed));
  padding: var(--nav-top) ${ax(6)} var(--nav-bottom, 0px)
    calc(var(--nav-bleed) + ${ax(6)});

  /* Beside the text, only the links take the pointer: the list's unseen
     edge (room for the marker) mustn't block the art under it. */
  @media (min-width: 861px) {
    pointer-events: none;

    a,
    button {
      pointer-events: auto;
    }
  }

  &::-webkit-scrollbar {
    display: none;
  }

  /* Fade the edge(s) with more list beyond them, so it reads as scrollable. */
  &[data-fade="below"] {
    mask-image: linear-gradient(to bottom, #000 calc(100% - 2rem), transparent);
  }
  &[data-fade="above"] {
    mask-image: linear-gradient(to bottom, transparent, #000 2rem);
  }
  &[data-fade="both"] {
    mask-image: linear-gradient(
      to bottom,
      transparent,
      #000 2rem,
      #000 calc(100% - 2rem),
      transparent
    );
  }

  ${NARROW} {
    flex-direction: row;
    gap: 0.25rem;
    margin-left: 0;
    mask-image: none !important;
    padding: 0.35rem;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`

const Indicator = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  transition:
    transform 0.35s cubic-bezier(0.3, 0.9, 0.3, 1.1),
    height 0.35s ease,
    width 0.35s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

/** Double chevron under the list: opens the box to full height, or shuts it. */
const SideMore = styled.button`
  position: relative;
  z-index: 1;
  flex: none;
  align-self: center;
  display: grid;
  place-items: center;
  width: 2.1rem;
  height: 1.8rem;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0.4rem;
  background: none;
  color: var(--link-color);
  opacity: 0.9;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    background-color 0.15s ease;

  svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transform: rotate(${({ $open }) => ($open ? 180 : 0)}deg);
    transition: transform 0.25s ease;
  }

  &:hover,
  &:focus-visible {
    opacity: 1;
    background: rgba(255, 255, 255, 0.16);
  }

  &:focus-visible {
    outline: 2px solid var(--link-color);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    svg {
      transition: none;
    }
  }

  ${NARROW} {
    display: none;
  }
`

/** Rides on the highlight's left end (the Venture coin). */
const IndicatorIcon = styled.span`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);

  ${NARROW} {
    display: none;
  }
`

const SideLink = styled.a`
  position: relative;
  display: block;
  padding: var(--link-pad-y) ${ax(10)} var(--link-pad-y) var(--link-indent);
  color: var(--link-color);
  font-family: var(--font-body);
  font-size: max(0.75rem, var(--link-size));
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
  text-decoration: none;
  /* Wrap between words; hyphenate a word that can't fit on its own line. */
  overflow-wrap: break-word;
  hyphens: auto;
  opacity: 0.85;
  transition: opacity 0.2s ease;

  &:hover,
  &[aria-current] {
    opacity: 1;
  }

  ${({ $on }) =>
    $on &&
    css`
      opacity: 1;
      color: var(--link-active);
    `}

  &:focus-visible {
    outline: 2px solid var(--link-color);
    outline-offset: -2px;
    border-radius: 4px;
  }

  ${NARROW} {
    flex: none;
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
    white-space: nowrap;
    overflow-wrap: normal;
  }
`

const subIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`

/** The open section's subsections, indented under it. */
const SubList = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${ax(2)} 0 ${ax(8)} ${ax(22)};
  animation: ${subIn} 0.25s ease both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  /* The narrow strip: the open section's subsections sit in the row after it. */
  ${NARROW} {
    display: contents;
  }
`

const SubLink = styled.a`
  position: relative;
  display: block;
  padding: ${ax(5)} ${ax(8)} ${ax(5)} ${ax(10)};
  color: var(--link-color);
  font-family: var(--font-body);
  font-size: max(0.72rem, ${ax(11)});
  font-weight: 500;
  line-height: 1.25;
  text-decoration: none;
  overflow-wrap: break-word;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  /* Dot on the subsection being read. */
  &::before {
    content: "";
    position: absolute;
    left: ${ax(-3)};
    top: 50%;
    width: ${ax(5)};
    height: ${ax(5)};
    border-radius: 50%;
    background: currentColor;
    transform: translateY(-50%) scale(0);
    transition: transform 0.2s ease;
  }

  &:hover {
    opacity: 1;
  }

  &[aria-current] {
    opacity: 1;
    font-weight: 700;

    &::before {
      transform: translateY(-50%) scale(1);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--link-color);
    outline-offset: -2px;
    border-radius: 4px;
  }

  ${NARROW} {
    flex: none;
    white-space: nowrap;
    padding: 0.35rem 0.5rem 0.35rem 0.7rem;
  }
`

/** The little crab sitting on the bottom edge of the side box. */
const SideCrab = styled.span`
  position: absolute;

  ${NARROW} {
    display: none;
  }
`

/**
 * Art over the text box's lower edge (\`text.front\`), as if coming out of
 * it. Narrow screens keep it in the art.
 */
const TextFront = styled.div`
  position: absolute;
  z-index: 2;
  inset: 0;
  pointer-events: none;

  ${NARROW} {
    display: none;
  }
`

/** The tail's soft shadow on the box. */
const FrontShadow = styled.div`
  position: absolute;
  pointer-events: none;
  filter: drop-shadow(
    0 calc(var(--px) * 3) calc(var(--px) * 4) rgba(20, 10, 10, 0.45)
  );
`

const TextBox = styled.div`
  pointer-events: auto;
  position: relative;
  /* Its own layer group: things inside that stack themselves high (the
     draggable sticky notes) stay under the section menu and site header. */
  isolation: isolate;
  grid-column: ${({ $solo }) => ($solo ? 2 : 4)};
  min-height: var(--text-min-h);
  margin-top: var(--text-offset);

  ${NARROW} {
    grid-column: 2;
    margin-top: 1rem;
    min-height: 60vh;
  }
`

/**
 * Heading levels read as layers: h2 opens a section (rule above, largest),
 * h3 is a subsection (accent bar), h4 a small label inside it.
 */
const TextInner = styled.div`
  position: relative;
  /* Full-bleed components (e.g. the sticky-note board) stay inside the box. */
  --page-padding: 0px;
  /* Plus the scene's \`text.inset\`, for a box painted with a soft edge. */
  padding: calc(max(1.5rem, ${ax(34)}) + var(--inset-t, 0px))
    calc(max(1.25rem, ${ax(36)}) + var(--inset-r, 0px))
    calc(max(2rem, ${ax(48)}) + var(--inset-b, 0px))
    calc(max(1.25rem, ${ax(36)}) + var(--inset-l, 0px));

  h2,
  h3 {
    scroll-margin-top: calc(var(--dl-header, 0px) + 1.5rem);
  }

  && h2 {
    margin-top: var(--space-xl);
    font-size: clamp(1.9rem, 2.8vw, 2.6rem);
  }

  ${({ $hideIntro }) => $hideIntro && css`
    && h2:first-of-type {
      margin-top: 0;
      padding-top: 0;
      border-top: 0;
    }
  `}

  && h3 {
    margin-top: 2.5rem;
    padding-left: 0.75rem;
    border-left: 4px solid var(--accent);
    font-size: clamp(1.3rem, 1.9vw, 1.6rem);
  }

  && h2 + h3 {
    margin-top: var(--space-md);
  }

  && th {
    background: var(--table-head, color-mix(in srgb, var(--color-accent) 15%, transparent));
  }

  && h4 {
    margin-top: 1.75rem;
    color: var(--accent);
  }
`

const TitleBlock = styled.header`
  margin-bottom: var(--space-lg);
`

const Title = styled.h1`
  margin: 0 0 var(--space-sm);
  color: var(--color-text);
  font-size: clamp(2rem, 3.4vw, 3rem);
`

const Lede = styled.p`
  margin: 0;
  color: var(--color-body);
  font-size: 1.05rem;
  line-height: 1.7;
`

/** Inline style object → CSS declarations (for media-query overrides). */
function cssObject(obj) {
  return Object.entries(obj)
    .map(
      ([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${v};`,
    )
    .join("\n")
}
