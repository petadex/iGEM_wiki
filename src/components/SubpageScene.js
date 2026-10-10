import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import styled, { css, keyframes } from "styled-components"

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
      <ZapBody
        ref={bodyRef}
        data-layer={layer.name}
        style={plate.windowStyle(layer.box)}
      >
        {children}
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
    "--side-max": scene.side.maxHeight || "100vh",
    "--strip-color": scene.side.stripColor,
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
    // Room left of the list for an icon hanging off the highlight (the coin),
    // so the scrolling list doesn't clip it.
    "--nav-bleed": scene.side.indicatorIcon
      ? pp(scene.side.indicator.box[0] - scene.side.indicatorIcon.box[0])
      : "0px",
    "--text-offset": pp(text[1] - side[1]),
  }
}

export function SubpageScene({ scene, title, description, children }) {
  const plate = plateOf(scene)
  const { side, text } = scene
  const sceneRef = useRef(null)
  const artRef = useRef(null)
  const frameRef = useRef(null)
  const textBoxRef = useRef(null)
  const bodyRef = useRef(null)
  const navRef = useRef(null)
  const headerH = useHeaderHeight()
  const [sections, setSections] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [activeSubId, setActiveSubId] = useState(null)
  const [indicator, setIndicator] = useState(null)

  // Sections = the h2s in the text box, each with its h3 subsections.
  useEffect(() => {
    const heads = Array.from(
      bodyRef.current?.querySelectorAll("h2, h3") || [],
    ).filter(el => !el.closest("details, [data-nav-skip]"))
    const list = []
    heads.forEach((el, i) => {
      if (!el.id) el.id = `section-${i + 1}`
      const item = { id: el.id, label: el.textContent.trim() }
      if (el.tagName === "H2") list.push({ ...item, subs: [] })
      else list[list.length - 1]?.subs.push(item)
    })
    setSections(list)
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
      const line = headerH + view * 0.35
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
  }, [headerH, sections])

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
    // Keep the active item in view when the list scrolls: sideways in the
    // narrow strip, up/down when there are more sections than fit.
    if (nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({
        left: item.offsetLeft - nav.clientWidth / 2 + item.offsetWidth / 2,
        behavior: "smooth",
      })
    } else if (nav.scrollHeight > nav.clientHeight) {
      nav.scrollTo({
        top: item.offsetTop - nav.clientHeight / 2 + item.offsetHeight / 2,
        behavior: "smooth",
      })
    }
    updateNavFade(nav)
    const ro = new ResizeObserver(() => {
      place()
      updateNavFade(nav)
    })
    ro.observe(nav)
    return () => ro.disconnect()
  }, [activeId, sections])

  const goTo = (e, id) => {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 24
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" })
    window.history.replaceState(null, "", `#${id}`)
  }

  const [ix0, iy0, ix1, iy1] = side?.indicator.box ?? []
  const icon = side?.indicatorIcon
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
    <Scene
      ref={sceneRef}
      style={{ "--dl-header": `${headerH}px`, ...sceneVars(scene, plate) }}
    >
      <BgTrack aria-hidden>
        <BgFrame ref={frameRef}>
          <Art ref={artRef} style={{ aspectRatio: `${plate.W} / ${plate.H}` }}>
            {scene.layers
              .filter(l => !l.hidden)
              .map(layer => {
                const img = (
                  <CropImg
                    src={plate.asset(layer.src || layer.name)}
                    alt=""
                    decoding="async"
                    draggable={false}
                    style={plate.imgStyle(layer.from || layer.box)}
                  />
                )
                if (layer.flyer) {
                  return (
                    <BirdLayer key={layer.name} plate={plate} layer={layer} />
                  )
                }
                if (layer.loop) {
                  return (
                    <LoopLayer key={layer.name} plate={plate} layer={layer}>
                      {img}
                    </LoopLayer>
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
                ) : (
                  <CropWindow
                    key={layer.name}
                    data-layer={layer.name}
                    style={plate.windowStyle(layer.box)}
                  >
                    {img}
                  </CropWindow>
                )
              })}
          </Art>
        </BgFrame>
      </BgTrack>

      {scene.header && (
        <SectionHeader>
          <SectionTitle>{scene.header}</SectionTitle>
        </SectionHeader>
      )}

      <Content>
        {side && (
          <SideColumn>
            {/* A page with no sections yet has nothing to list. */}
            <SideBox
              $stripCss={stripCss}
              $fit={side.fit}
              style={sections.length ? undefined : { display: "none" }}
            >
              <SideBoxArt
                plate={plate}
                name={side.name}
                box={side.box}
                caps={side.caps}
              />
              <SideNav
                ref={navRef}
                aria-label="Sections on this page"
                onScroll={e => updateNavFade(e.currentTarget)}
              >
                {indicator && (
                  <Indicator
                    aria-hidden
                    style={{
                      ...plate.bg(side.indicator.name, side.indicator.box),
                      transform: `translate(${indicator.left}px, ${indicator.top}px)`,
                      width: indicator.width,
                      height: indicator.height,
                    }}
                  >
                    {icon && (
                      <IndicatorIcon
                        style={{
                          ...plate.bg(icon.name, icon.box),
                          left: `${((icon.box[0] - ix0) / (ix1 - ix0)) * 100}%`,
                          width: `${((icon.box[2] - icon.box[0]) / (ix1 - ix0)) * 100}%`,
                          aspectRatio: `${icon.box[2] - icon.box[0]} / ${icon.box[3] - icon.box[1]}`,
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
              {side.crab && (
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

        <TextBox ref={textBoxRef} $solo={!side}>
          {/* A box the art doesn't paint is a flat colour. */}
          {text.fill ? (
            <TextFill aria-hidden style={{ background: text.fill }} />
          ) : (
            <StretchBox
              plate={plate}
              name={text.name}
              box={text.box}
              caps={text.caps}
            />
          )}
          <TextInner ref={bodyRef}>
            <TitleBlock>
              <Title>{scene.boxTitle || title}</Title>
              {description && <Lede>{description}</Lede>}
            </TitleBlock>
            {children}
          </TextInner>
        </TextBox>
      </Content>
    </Scene>
  )
}

export default SubpageScene

const Scene = styled.div`
  position: relative;
  width: 100%;
  min-height: calc(100vh - var(--dl-header, 0px));
  background: var(--scene-bg);
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

const CropWindow = styled.div`
  position: absolute;
  overflow: hidden;
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

const ZapBody = styled.div`
  position: absolute;
  overflow: hidden;
  transform-origin: 50% 40%;
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

/** The section name across the sky, above the side box and text box. */
const SectionHeader = styled.div`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  height: var(--sky-h);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  ${NARROW} {
    height: max(4.5rem, var(--sky-h));
  }
`

/** Big and heavy, with a light top edge and a soft drop so it sits on the art. */
const SectionTitle = styled.p`
  margin: 0;
  color: var(--header-color);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: min(max(3.25rem, ${ax(108)}), var(--title-fit));
  line-height: 0.95;
  letter-spacing: -0.025em;
  text-shadow: var(--header-shadow);
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

  /* Only as tall as its list (up to the window), so the art beside the
     text stays in view. */
  ${({ $fit }) =>
    $fit &&
    css`
      height: auto;
      max-height: min(
        var(--side-max),
        calc(100vh - var(--dl-header, 0px) - 2.5rem)
      );
      min-height: 0;
      padding-bottom: var(--nav-top);
    `}

  ${NARROW} {
    position: relative;
    top: auto;
    height: auto;
    min-height: 0;
    border-radius: 0.6rem;
    background-color: var(--strip-color);
    box-shadow: 0 2px 10px rgba(30, 30, 40, 0.25);
    ${({ $stripCss }) => $stripCss}
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
  padding: var(--nav-top) ${ax(6)} 0 calc(var(--nav-bleed) + ${ax(6)});

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

  ${NARROW} {
    display: none;
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
`

/** The little crab sitting on the bottom edge of the side box. */
const SideCrab = styled.span`
  position: absolute;

  ${NARROW} {
    display: none;
  }
`

const TextBox = styled.div`
  pointer-events: auto;
  position: relative;
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
  padding: max(1.5rem, ${ax(34)}) max(1.25rem, ${ax(36)}) max(2rem, ${ax(48)});

  h2,
  h3 {
    scroll-margin-top: calc(var(--dl-header, 0px) + 1.5rem);
  }

  && h2 {
    margin-top: var(--space-xl);
    font-size: clamp(1.9rem, 2.8vw, 2.6rem);
  }

  && h3 {
    margin-top: 2.5rem;
    padding-left: 0.75rem;
    border-left: 4px solid var(--accent);
    font-size: clamp(1.3rem, 1.9vw, 1.6rem);
  }

  && h2 + h3 {
    margin-top: var(--space-md);
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
