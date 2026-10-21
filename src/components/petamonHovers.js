import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import styled, { keyframes } from "styled-components"

/**
 * Homepage copies of the subteam / contribution hover motions
 * (SubpageScene.js). Same timings, same hosted art. Not a new motion.
 *
 *   coins     Venture kangaroo coin burst
 *   lightning Hardware turtle shiver + zapzap (drawn large enough to read
 *             on the small homepage turtles)
 *   acorn     Outreach acorn bonk
 *   loop      Human Practices / contribution bird loop-the-loop
 *   duck      Contribution axolotl: glow, hop, sink until the head peeks
 *   dodge     Shift away from the cursor, then come back
 */

const reduceMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

function usePlatePx(ref, refW) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !refW) return undefined
    const apply = () => {
      const w = el.offsetWidth
      if (w > 0) el.style.setProperty("--px", `${w / refW}px`)
    }
    apply()
    if (typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, refW])
}

/** Fires when a controlled hover (`active` boolean) turns on, and off. */
function useActivate(active, on, off) {
  const onRef = useRef(on)
  const offRef = useRef(off)
  onRef.current = on
  offRef.current = off
  const prev = useRef(false)
  useEffect(() => {
    if (typeof active !== "boolean") return undefined
    if (active && !prev.current) onRef.current()
    if (!active && prev.current) offRef.current?.()
    prev.current = active
    return undefined
  }, [active])
}

const ActRoot = styled.div`
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
`

/** Stays put while the critter sinks, so the clip is the edge it hides behind. */
const DuckClip = styled.div`
  position: absolute;
  inset: 0;
  overflow: ${({ $clip }) => ($clip ? "hidden" : "visible")};
  pointer-events: none;
`

const ActBody = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  transform-origin: ${({ $origin }) => $origin || "50% 50%"};
  filter: ${({ $glow }) =>
    $glow
      ? "drop-shadow(0 0 calc(var(--px) * 8) rgba(255, 244, 150, 0.95)) drop-shadow(0 0 calc(var(--px) * 20) rgba(255, 226, 90, 0.6))"
      : "none"};
  transition: filter 300ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const ActHit = styled.button`
  position: absolute;
  inset: ${({ $inset }) => $inset || "0"};
  z-index: 3;
  margin: 0;
  padding: 0;
  border: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
`

function Hit({ inset, onEnter, onLeave, onTap }) {
  return (
    <ActHit
      type="button"
      tabIndex={-1}
      $inset={inset}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onPointerDown={event => {
        if (event.pointerType === "mouse") return
        if (onTap) onTap()
        else onEnter?.()
      }}
    />
  )
}

/* ------------------------------------------------------------------ coins */

const COIN_BURST_COUNT = 12
const COIN_BURST_MAX_MS = 2600
const COIN_BURST_MAX_LIVE = 4
const COIN_PLATE = [1110, 4000]
const COIN_SRC = "https://static.igem.wiki/teams/6187/wiki/venture/coins.avif"
const COIN_SPRITES = [
  [123, 1995, 157, 2030],
  [97, 2359, 132, 2387],
]

const KANGAROO_HOP = [
  { transform: "translateY(0) scale(1, 1)" },
  { transform: "translateY(0) scale(1.03, 0.96)", offset: 0.15 },
  { transform: "translateY(-4%) scale(0.98, 1.03)", offset: 0.45 },
  { transform: "translateY(0) scale(1.03, 0.97)", offset: 0.78 },
  { transform: "translateY(0) scale(1, 1)" },
]
const KANGAROO_HOP_MS = 520

const rand = (a, b) => a + Math.random() * (b - a)

function makeCoins() {
  return Array.from({ length: COIN_BURST_COUNT }, (_, i) => {
    const box = COIN_SPRITES[i % COIN_SPRITES.length]
    return {
      box,
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

function coinBg([x0, y0, x1, y1]) {
  const [W, H] = COIN_PLATE
  const w = x1 - x0
  const h = y1 - y0
  return {
    backgroundImage: `url(${COIN_SRC})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${(W / w) * 100}% ${(H / h) * 100}%`,
    backgroundPosition: `${(x0 / (W - w)) * 100}% ${(y0 / (H - h)) * 100}%`,
  }
}

const coinX = keyframes`
  from {
    transform: translate3d(-50%, -50%, 0);
  }
  to {
    transform: translate3d(calc(-50% + var(--dx)), -50%, 0);
  }
`

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

const CoinStage = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
`

const CoinX = styled.span`
  position: absolute;
  left: ${({ $x }) => $x || "50%"};
  top: ${({ $y }) => $y || "28%"};
  animation: ${coinX} var(--ms) linear var(--delay) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const CoinY = styled.span`
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: ${coinY} var(--ms) linear var(--delay) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const CoinSpin = styled.span`
  position: absolute;
  inset: 0;
  animation: ${coinSpin} var(--ms) linear var(--delay) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

function CoinAct({ active, refWidth, hitInset, mouth, children }) {
  const rootRef = useRef(null)
  const bodyRef = useRef(null)
  const [bursts, setBursts] = useState([])
  const nextId = useRef(0)
  const timers = useRef([])
  usePlatePx(rootRef, refWidth)
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const burst = () => {
    if (reduceMotion()) return
    const w = rootRef.current?.offsetWidth
    if (w > 0) rootRef.current.style.setProperty("--px", `${w / refWidth}px`)
    bodyRef.current?.animate(KANGAROO_HOP, {
      duration: KANGAROO_HOP_MS,
      easing: "ease-in-out",
    })
    const id = nextId.current++
    setBursts(list =>
      [...list, { id, coins: makeCoins() }].slice(-COIN_BURST_MAX_LIVE),
    )
    timers.current.push(
      setTimeout(
        () => setBursts(list => list.filter(b => b.id !== id)),
        COIN_BURST_MAX_MS,
      ),
    )
  }
  useActivate(active, burst)

  return (
    <ActRoot ref={rootRef}>
      <CoinStage aria-hidden>
        {bursts.map(b =>
          b.coins.map((c, i) => {
            const [sx0, sy0, sx1, sy1] = c.box
            return (
              <CoinX
                key={`${b.id}-${i}`}
                $x={mouth ? `${mouth.x * 100}%` : undefined}
                $y={mouth ? `${mouth.y * 100}%` : undefined}
                style={{
                  width: `${(((sx1 - sx0) / refWidth) * 100 * c.scale).toFixed(2)}%`,
                  aspectRatio: `${sx1 - sx0} / ${sy1 - sy0}`,
                  "--dx": `calc(var(--px) * ${c.dx})`,
                  "--peak": `calc(var(--px) * ${c.peak})`,
                  "--fall": `calc(var(--px) * ${c.fall})`,
                  "--spin": `${c.spin}deg`,
                  "--ms": `${c.ms}ms`,
                  "--delay": `${c.delay}ms`,
                }}
              >
                <CoinY>
                  <CoinSpin style={coinBg(c.box)} />
                </CoinY>
              </CoinX>
            )
          }),
        )}
      </CoinStage>
      <ActBody ref={bodyRef} $origin="50% 100%">
        {children}
      </ActBody>
      {typeof active !== "boolean" && (
        <Hit inset={hitInset} onEnter={burst} />
      )}
    </ActRoot>
  )
}

/* -------------------------------------------------------------- lightning */

const ZAP_JOLT = [
  { transform: "translate(0, 0) rotate(0deg)" },
  { transform: "translate(-6%, 2%) rotate(-8deg)", offset: 0.1 },
  { transform: "translate(7%, -2%) rotate(9deg)", offset: 0.22 },
  { transform: "translate(-5%, 1%) rotate(-6deg)", offset: 0.36 },
  { transform: "translate(5%, -1%) rotate(5deg)", offset: 0.52 },
  { transform: "translate(-2%, 0) rotate(-2deg)", offset: 0.7 },
  { transform: "translate(0, 0) rotate(0deg)" },
]
const ZAP_JOLT_MS = 900
const ZAP_FLICKER = [
  { opacity: 0 },
  { opacity: 1, offset: 0.06 },
  { opacity: 0.2, offset: 0.14 },
  { opacity: 1, offset: 0.24 },
  { opacity: 0.35, offset: 0.36 },
  { opacity: 1, offset: 0.48 },
  { opacity: 0.8, offset: 0.72 },
  { opacity: 0 },
]
const ZAP_FLICKER_MS = 1500
/** Snail shell: stay bright. The shared flicker dips so low it disappears on the dark spiral. */
const ZAP_FLICKER_BRIGHT = [
  { opacity: 0 },
  { opacity: 1, offset: 0.05 },
  { opacity: 0.92, offset: 0.18 },
  { opacity: 1, offset: 0.32 },
  { opacity: 0.95, offset: 0.55 },
  { opacity: 1, offset: 0.74 },
  { opacity: 0 },
]
/**
 * zapzap.avif's "bolt" crop is a cyan glow around a creature, not a stroke.
 * A drawn bolt is used instead so the shell and turtles show lightning.
 */
function BoltMark() {
  return (
    <svg viewBox="0 0 48 84" width="100%" height="100%" aria-hidden="true">
      <path
        d="M30 2 L10 36 H22 L8 82 L44 32 H30 L40 2 Z"
        fill="#f4feff"
        stroke="#3ee7ff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Section 5 turtle: three small bolts sharing a point on the head. */
const FAN_ANGLES = [-42, -8, 30]

function BoltFan() {
  return FAN_ANGLES.map(angle => (
    <FanRay key={angle} $angle={angle}>
      <BoltMark />
    </FanRay>
  ))
}

const FanRay = styled.span`
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 20%;
  height: 68%;
  margin-left: -10%;
  transform-origin: 50% 100%;
  transform: rotate(${({ $angle }) => $angle}deg);
  pointer-events: none;
`

const ZAP_JOLT_LEFT = [
  { transform: "translate(0, 0) rotate(0deg)" },
  { transform: "translate(-4%, 1.2%) rotate(-5deg)", offset: 0.16 },
  { transform: "translate(-7%, -1%) rotate(-7deg)", offset: 0.34 },
  { transform: "translate(-3%, 0.8%) rotate(-3deg)", offset: 0.55 },
  { transform: "translate(-5.5%, -0.4%) rotate(-4deg)", offset: 0.76 },
  { transform: "translate(0, 0) rotate(0deg)" },
]
/** A small shiver. Stays near the perch so a cropped edge does not swing out. */
const ZAP_JOLT_SLIGHT = [
  { transform: "translate(0, 0) rotate(0deg)" },
  { transform: "translate(-1.4%, 0.5%) rotate(-1.4deg)", offset: 0.22 },
  { transform: "translate(-0.4%, -0.5%) rotate(1deg)", offset: 0.48 },
  { transform: "translate(-1.6%, 0.3%) rotate(-1deg)", offset: 0.72 },
  { transform: "translate(0, 0) rotate(0deg)" },
]

function joltFor(shake) {
  if (shake === "left") return ZAP_JOLT_LEFT
  if (shake === "slight") return ZAP_JOLT_SLIGHT
  return ZAP_JOLT
}

const FAN_W = 40
const FAN_H = 44

const ZapBolt = styled.div`
  position: absolute;
  /* Drawn bolt, inset on the creature so the whole stroke stays visible.
     $fan is a three-bolt head fan: the box's bottom-center is the shared
     origin, placed with --fan-left / --fan-top. */
  left: ${({ $bright, $large, $fan }) =>
    $fan ? "var(--fan-left)" : $bright ? "36%" : $large ? "32%" : "30%"};
  top: ${({ $bright, $large, $fan }) =>
    $fan ? "var(--fan-top)" : $bright ? "4%" : $large ? "8%" : "10%"};
  width: ${({ $bright, $large, $fan }) =>
    $fan ? `${FAN_W}%` : $bright ? "26%" : $large ? "30%" : "28%"};
  height: ${({ $bright, $large, $fan }) =>
    $fan ? `${FAN_H}%` : $bright ? "58%" : $large ? "62%" : "58%"};
  z-index: 2;
  overflow: visible;
  opacity: 0;
  pointer-events: none;
  filter: drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #7ef6ff);
`

function fanOriginStyle(fanAt) {
  const x = fanAt?.x ?? 0.14
  const y = fanAt?.y ?? 0.16
  return {
    "--fan-left": `${x * 100 - FAN_W / 2}%`,
    "--fan-top": `${y * 100 - FAN_H}%`,
  }
}

function ZapAct({ active, hitInset, shake, bolt, fanAt, children }) {
  const bodyRef = useRef(null)
  const boltRef = useRef(null)
  const zap = () => {
    if (reduceMotion()) return
    bodyRef.current?.animate(joltFor(shake), {
      duration: shake === "slight" ? 640 : ZAP_JOLT_MS,
      easing: "ease-out",
    })
    boltRef.current?.animate(
      bolt === "bright" || bolt === "large" || bolt === "fan"
        ? ZAP_FLICKER_BRIGHT
        : ZAP_FLICKER,
      {
        duration: ZAP_FLICKER_MS,
        easing: "linear",
      },
    )
  }
  useActivate(active, zap)
  return (
    <ActRoot>
      <ActBody ref={bodyRef} $origin="50% 40%">
        {children}
      </ActBody>
      <ZapBolt
        ref={boltRef}
        $large={bolt === "large"}
        $bright={bolt === "bright"}
        $fan={bolt === "fan"}
        style={bolt === "fan" ? fanOriginStyle(fanAt) : undefined}
        aria-hidden
      >
        {bolt === "fan" ? <BoltFan /> : <BoltMark />}
      </ZapBolt>
      {typeof active !== "boolean" && <Hit inset={hitInset} onEnter={zap} />}
    </ActRoot>
  )
}

/* ------------------------------------------------------------------ acorn */

const BONK_SQUASH = [
  { transform: "scale(1, 1)" },
  { transform: "scale(1.06, 0.88)", offset: 0.2 },
  { transform: "scale(0.96, 1.05) rotate(-2deg)", offset: 0.5 },
  { transform: "scale(1, 1) rotate(1.5deg)", offset: 0.75 },
  { transform: "scale(1, 1)" },
].map(k => ({ ...k, transformOrigin: "50% 100%" }))
const BONK_BOUNCE_MS = 900
const ACORN = {
  src: "https://static.igem.wiki/teams/6187/wiki/outreach/drop-acorn.avif",
  plate: [1110, 4000],
  box: [130, 3426, 254, 3550],
  scale: 0.5,
}
/** Contribution outreach petamon: where the acorn lands, between its ears. */
const ACORN_BOX = [211, 2850, 393, 3009]
const ACORN_HEAD = [259, 2898]

function dropAcornOn(el, headFrac) {
  if (!el || el.dataset.bonked || reduceMotion()) return
  const box = ACORN_BOX
  const head = ACORN_HEAD
  const acorn = ACORN
  const r = el.getBoundingClientRect()
  const span = box[2] - box[0]
  // A clipped edge-peek is much narrower than it is tall; size the nut from
  // the longer side so it still reads as an acorn.
  const k = (headFrac ? Math.max(r.width, r.height * 0.9) : r.width) / span
  const hx = headFrac
    ? r.left + r.width * headFrac.x
    : r.left + (head[0] - box[0]) * (r.width / span)
  const hy = headFrac
    ? r.top + r.height * headFrac.y
    : r.top + (head[1] - box[1]) * (r.width / span)
  const [ax0, ay0, ax1, ay1] = acorn.box
  const [W, H] = acorn.plate
  const size = (ax1 - ax0) * k * (acorn.scale ?? 0.8)
  const left = hx - size / 2
  const top = hy - size * 0.9
  const header =
    parseFloat(getComputedStyle(el).getPropertyValue("--dl-header")) || 0
  // A landing point above the viewport used to return before the squash, so
  // the creature did not react at all. Always drop at least one nut-height.
  const fall = Math.max(size * 1.15, top - (header - size))
  if (size < 2) return
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
  const fallMs = Math.min(1100, Math.max(380, Math.sqrt(fall) * 30))
  const total = fallMs + BONK_BOUNCE_MS
  const landed = fallMs / total
  nut
    .animate(
      [
        {
          transform: `translate(0, ${-fall}px) rotate(-25deg)`,
          offset: 0,
          easing: "cubic-bezier(0.55, 0, 1, 0.8)",
        },
        {
          transform: "translate(0, 0) rotate(0deg)",
          offset: landed,
          easing: "cubic-bezier(0.2, 0.7, 0.4, 1)",
        },
        {
          transform: `translate(${-size * 0.9}px, ${-size * 1.2}px) rotate(-110deg)`,
          offset: landed + (1 - landed) * 0.4,
          easing: "cubic-bezier(0.55, 0, 1, 0.6)",
        },
        {
          transform: `translate(${-size * 1.7}px, ${size * 1.4}px) rotate(-250deg)`,
          opacity: 0,
          offset: 1,
        },
      ],
      { duration: total },
    )
    .finished.then(() => nut.remove())
    .catch(() => nut.remove())
  el.dataset.bonked = "1"
  el.animate(BONK_SQUASH, {
    duration: 700,
    delay: fallMs - 30,
    easing: "ease-out",
  }).onfinish = () => delete el.dataset.bonked
}

function AcornAct({ active, hitInset, head, children }) {
  const bodyRef = useRef(null)
  const bonk = () => dropAcornOn(bodyRef.current, head)
  useActivate(active, bonk)
  return (
    <ActRoot>
      <ActBody ref={bodyRef} $origin="50% 100%">
        {children}
      </ActBody>
      {typeof active !== "boolean" && <Hit inset={hitInset} onEnter={bonk} />}
    </ActRoot>
  )
}

/* ------------------------------------------------------------------- loop */

const BIRD_LOOP_MS = 1400
const BIRD_LOOP_RADIUS = 0.8

function loopKeyframes(radius, facing, { inside = false } = {}) {
  const steps = 24
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = (i / steps) * 2 * Math.PI
    // `inside` keeps the circle on the left of the perch (through the start)
    // so a bird already near the right edge never swings out of frame.
    const x = inside
      ? -radius * (1 - Math.cos(t))
      : facing * radius * Math.sin(t)
    const y = inside ? -radius * Math.sin(t) : -radius * (1 - Math.cos(t))
    const turn = -facing * (i / steps) * 360
    return {
      transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${turn.toFixed(1)}deg)`,
    }
  })
}

function LoopAct({ active, facing = 1, hitInset, children }) {
  const bodyRef = useRef(null)
  const loop = () => {
    if (reduceMotion()) return
    const el = bodyRef.current
    if (!el) return
    el.animate(loopKeyframes(el.offsetHeight * BIRD_LOOP_RADIUS, facing), {
      duration: BIRD_LOOP_MS,
      easing: "cubic-bezier(0.4, 0, 0.3, 1)",
    })
  }
  useActivate(active, loop)
  return (
    <ActRoot>
      <ActBody ref={bodyRef}>{children}</ActBody>
      {typeof active !== "boolean" && <Hit inset={hitInset} onEnter={loop} />}
    </ActRoot>
  )
}

/* ------------------------------------------------------------------- duck */

const DUCK_HOP_MS = 200
const DUCK_SINK_MS = 550
const DUCK_RISE_MS = 380
const DUCK_LAND_MS = 200
const PEEK_TOUCH_MS = 2500
/** Contribution axolotl (127px tall): hop 62 up, then sink until ~47% peeks. */
const DUCK_HOP = "-49%"
const DUCK_SINK = "53%"

function DuckAct({ active, refWidth, hitInset, children }) {
  const rootRef = useRef(null)
  const bodyRef = useRef(null)
  const anim = useRef(null)
  const timers = useRef([])
  const touch = useRef(0)
  const [glow, setGlow] = useState(false)
  const [clipped, setClipped] = useState(false)
  usePlatePx(rootRef, refWidth)
  useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout)
      window.clearTimeout(touch.current)
    },
    [],
  )
  const later = (fn, ms) => timers.current.push(window.setTimeout(fn, ms))
  const move = (frames, ms) => {
    anim.current?.commitStyles?.()
    anim.current?.cancel()
    anim.current = bodyRef.current?.animate(frames, {
      duration: ms,
      fill: "forwards",
    })
  }
  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
  }
  const duck = () => {
    clearTimers()
    setGlow(true)
    if (reduceMotion()) return
    move(
      [
        { transform: "translate3d(0, 0, 0)", easing: "ease-out" },
        {
          transform: `translate3d(0, ${DUCK_HOP}, 0)`,
          offset: DUCK_HOP_MS / (DUCK_HOP_MS + DUCK_SINK_MS),
          easing: "cubic-bezier(0.45, 0, 0.3, 1)",
        },
        { transform: `translate3d(0, ${DUCK_SINK}, 0)` },
      ],
      DUCK_HOP_MS + DUCK_SINK_MS,
    )
    later(() => setClipped(true), DUCK_HOP_MS)
  }
  const rise = () => {
    clearTimers()
    window.clearTimeout(touch.current)
    if (reduceMotion()) {
      setGlow(false)
      setClipped(false)
      return
    }
    move(
      [
        {
          transform: `translate3d(0, ${DUCK_SINK}, 0)`,
          easing: "cubic-bezier(0.3, 0, 0.4, 1)",
        },
        {
          transform: `translate3d(0, ${DUCK_HOP}, 0)`,
          offset: DUCK_RISE_MS / (DUCK_RISE_MS + DUCK_LAND_MS),
          easing: "ease-in",
        },
        { transform: "translate3d(0, 0, 0)" },
      ],
      DUCK_RISE_MS + DUCK_LAND_MS,
    )
    later(() => setClipped(false), DUCK_RISE_MS)
    later(() => setGlow(false), DUCK_RISE_MS + DUCK_LAND_MS)
  }
  useActivate(active, duck, rise)
  const tap = () => {
    duck()
    window.clearTimeout(touch.current)
    touch.current = window.setTimeout(rise, PEEK_TOUCH_MS)
  }
  return (
    <ActRoot ref={rootRef}>
      <ActBody $glow={glow}>
        <DuckClip $clip={clipped}>
          <ActBody ref={bodyRef}>{children}</ActBody>
        </DuckClip>
      </ActBody>
      {typeof active !== "boolean" && (
        <Hit
          inset={hitInset}
          onEnter={duck}
          onLeave={rise}
          onTap={tap}
        />
      )}
    </ActRoot>
  )
}

/**
 * Shift, then ease back. Does not hide the creature.
 * `drift` is a preferred direction ({x, y}); otherwise it moves away
 * from the pointer.
 */
export function playDodge(el, event, drift) {
  if (!el || reduceMotion()) return
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return
  const dist = Math.max(16, Math.min(28, Math.min(r.width, r.height) * 0.32))
  let dx
  let dy
  if (drift) {
    const len = Math.hypot(drift.x, drift.y) || 1
    dx = (drift.x / len) * dist
    dy = (drift.y / len) * dist
  } else {
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const px = event?.clientX ?? cx
    const py = event?.clientY ?? cy - 8
    dx = cx - px
    dy = cy - py
    const len = Math.hypot(dx, dy) || 1
    dx = (dx / len) * dist
    dy = (dy / len) * dist
  }
  el.getAnimations().forEach(anim => {
    if (anim.id === "petamon-dodge") anim.cancel()
  })
  const anim = el.animate(
    [
      { transform: "translate3d(0, 0, 0)" },
      {
        transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`,
        offset: 0.46,
        easing: "cubic-bezier(0.22, 0.8, 0.28, 1)",
      },
      {
        transform: "translate3d(0, 0, 0)",
        easing: "cubic-bezier(0.3, 0, 0.2, 1)",
      },
    ],
    { duration: 1080 },
  )
  anim.id = "petamon-dodge"
}

function DodgeAct({ hitInset, glow = false, refWidth, drift, children }) {
  const rootRef = useRef(null)
  const bodyRef = useRef(null)
  const [lit, setLit] = useState(false)
  usePlatePx(rootRef, glow ? refWidth || 201 : undefined)
  return (
    <ActRoot ref={rootRef}>
      <ActBody ref={bodyRef} $glow={glow && lit}>
        {children}
      </ActBody>
      <Hit
        inset={hitInset}
        onEnter={event => {
          if (glow) setLit(true)
          playDodge(bodyRef.current, event, drift)
        }}
        onLeave={() => setLit(false)}
      />
    </ActRoot>
  )
}

const SpotHit = styled.button`
  position: absolute;
  z-index: 4;
  margin: 0;
  padding: 0;
  border: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
`

const GLOW_FILTER =
  "drop-shadow(0 0 8px rgba(255, 244, 150, 0.95)) drop-shadow(0 0 18px rgba(255, 226, 90, 0.62))"

function GlowAct({ hitInset, refWidth, children }) {
  const rootRef = useRef(null)
  const [lit, setLit] = useState(false)
  usePlatePx(rootRef, refWidth || 201)
  return (
    <ActRoot ref={rootRef}>
      <ActBody $glow={lit}>{children}</ActBody>
      <Hit
        inset={hitInset}
        onEnter={() => setLit(true)}
        onLeave={() => setLit(false)}
      />
    </ActRoot>
  )
}

const TreeShell = styled.div`
  position: relative;
  width: 100%;
  pointer-events: none;
`

const TreeBody = styled.div`
  width: 100%;
  pointer-events: none;
  filter: ${({ $glow }) => ($glow ? GLOW_FILTER : "none")};
  transform: translate3d(${({ $away, $shift }) => ($away ? $shift : "0")}, 0, 0);
  transition:
    transform 860ms cubic-bezier(0.45, 0, 0.2, 1),
    filter 280ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    transform: none;
  }
`

/**
 * Forest axolotl: glow, then ease sideways under the trunk. The trunk art
 * itself is a higher layer (see the forest band), so this only slides.
 */
export function TreeHide({ hit, shift = "12%", children }) {
  const [on, setOn] = useState(false)
  const touch = useRef(0)
  useEffect(() => () => window.clearTimeout(touch.current), [])
  return (
    <TreeShell>
      <TreeBody $away={on} $glow={on} $shift={shift}>
        {children}
      </TreeBody>
      <SpotHit
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          left: hit.left,
          top: hit.top,
          width: hit.width,
          height: hit.height,
        }}
        onMouseEnter={() => setOn(true)}
        onMouseLeave={() => setOn(false)}
        onPointerDown={event => {
          if (event.pointerType === "mouse") return
          setOn(true)
          window.clearTimeout(touch.current)
          touch.current = window.setTimeout(() => setOn(false), 1600)
        }}
      />
    </TreeShell>
  )
}

/**
 * Dodge for a creature painted on a full-plate layer. `box` is the painted
 * spot (percent strings) inside that plate; only that spot takes the pointer.
 */
/**
 * Loop-the-loop for one bird painted on a full plate.
 * Spin around the bird (`origin`), and size the circle from the bird (`span`,
 * a fraction of the plate) so the rest of the plate doesn't swing into the middle.
 */
export function LoopTarget({
  box,
  facing = 1,
  origin = "50% 50%",
  span = 0.03,
  children,
}) {
  const rootRef = useRef(null)
  const bodyRef = useRef(null)
  const loop = () => {
    if (reduceMotion()) return
    const root = rootRef.current
    const el = bodyRef.current
    if (!root || !el) return
    const radius = root.offsetHeight * span * BIRD_LOOP_RADIUS
    el.getAnimations().forEach(anim => {
      if (anim.id === "petamon-loop") anim.cancel()
    })
    const anim = el.animate(
      loopKeyframes(radius, facing, { inside: facing < 0 }),
      {
        duration: BIRD_LOOP_MS,
        easing: "cubic-bezier(0.4, 0, 0.3, 1)",
      },
    )
    anim.id = "petamon-loop"
  }
  return (
    <div
      ref={rootRef}
      style={{ position: "relative", width: "100%", pointerEvents: "none" }}
    >
      <div
        ref={bodyRef}
        style={{ width: "100%", transformOrigin: origin, pointerEvents: "none" }}
      >
        {children}
      </div>
      <SpotHit
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
        }}
        onMouseEnter={loop}
      />
    </div>
  )
}

export function DodgeTarget({ box, children }) {
  const ref = useRef(null)
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {children}
      <SpotHit
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
        }}
        onMouseEnter={event => playDodge(ref.current, event)}
      />
    </div>
  )
}

/**
 * `kind`: "coins" | "lightning" | "acorn" | "loop" | "duck" | "dodge" | "glow".
 * Omit `active` and the creature's own hit area plays it.
 * `refWidth` is the subpage plate width the motion was tuned against.
 * `head` is where an acorn should land, as fractions of this creature's box.
 * `shake`: "left" keeps a lightning shiver from crossing the right edge;
 * "slight" is a small vibrate.
 */
export function PetamonAct({
  kind,
  active,
  refWidth,
  facing = 1,
  hitInset = "18%",
  head,
  glow = false,
  shake,
  bolt,
  drift,
  mouth,
  fanAt,
  children,
}) {
  if (kind === "coins") {
    return (
      <CoinAct
        active={active}
        refWidth={refWidth || 273}
        hitInset={hitInset}
        mouth={mouth}
      >
        {children}
      </CoinAct>
    )
  }
  if (kind === "lightning") {
    return (
      <ZapAct
        active={active}
        hitInset={hitInset}
        shake={shake}
        bolt={bolt}
        fanAt={fanAt}
      >
        {children}
      </ZapAct>
    )
  }
  if (kind === "glow") {
    return (
      <GlowAct hitInset={hitInset} refWidth={refWidth}>
        {children}
      </GlowAct>
    )
  }
  if (kind === "acorn") {
    return (
      <AcornAct active={active} hitInset={hitInset} head={head}>
        {children}
      </AcornAct>
    )
  }
  if (kind === "loop") {
    return (
      <LoopAct active={active} facing={facing} hitInset={hitInset}>
        {children}
      </LoopAct>
    )
  }
  if (kind === "duck") {
    return (
      <DuckAct active={active} refWidth={refWidth || 201} hitInset={hitInset}>
        {children}
      </DuckAct>
    )
  }
  if (kind === "dodge") {
    return (
      <DodgeAct
        hitInset={hitInset}
        glow={glow}
        refWidth={refWidth}
        drift={drift}
      >
        {children}
      </DodgeAct>
    )
  }
  return children
}
