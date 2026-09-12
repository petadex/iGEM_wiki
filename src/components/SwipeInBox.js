import React, { useEffect, useRef } from "react"
import styled from "styled-components"

/**
 * Scroll-driven "swipe-in" card.
 *
 * Track mode (default): tall in-flow section; progress = scroll through that track.
 * Anchored mode (`getProgress`): fixed overlay; parent supplies 0–1 progress so the
 * card can sync to page landmarks (e.g. waterfall puddle → shore sand).
 *
 * Progress maps to: slide in from left → hold center → slide out to the right.
 */

/** Scroll length of the whole enter → hold → exit cycle (viewport heights). */
const DEFAULT_TRACK_VH = 150

/** Progress (0–1) checkpoints: finish entering, then start exiting. */
const DEFAULT_ENTER_END = 0.28
const DEFAULT_HOLD_END = 0.58

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const lerp = (a, b, t) => a + (b - a) * t

function xForProgress(p, off, enterEnd, holdEnd) {
  if (p <= 0) return -off
  if (p >= 1) return off
  // No hold: one continuous pass from left → right.
  if (holdEnd <= enterEnd) return lerp(-off, off, p)
  if (p <= enterEnd) return lerp(-off, 0, p / enterEnd)
  if (p <= holdEnd) return 0
  return lerp(0, off, (p - holdEnd) / (1 - holdEnd))
}

export function SwipeInBox({
  eyebrow,
  title,
  body,
  children,
  /** Optional: return 0–1 scroll progress. When set, card is a fixed overlay (no tall track). */
  getProgress,
  enterEnd = DEFAULT_ENTER_END,
  holdEnd = DEFAULT_HOLD_END,
  trackVh = DEFAULT_TRACK_VH,
  /** Skip L→R motion; keep the card centered (handy while prototyping). */
  stationary = false,
  className,
}) {
  const trackRef = useRef(null)
  const boxRef = useRef(null)
  const anchored = typeof getProgress === "function"

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    // Stationary: no scroll motion or show/hide — always centered in place.
    if (stationary) return undefined

    const box = boxRef.current
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduceMotion) {
      if (box) {
        box.style.transform = "translate3d(0, 0, 0)"
        box.style.visibility = "visible"
      }
      return undefined
    }

    let raf = 0
    const update = () => {
      raf = 0
      const b = boxRef.current
      if (!b) return

      let p
      if (anchored) {
        p = clamp(Number(getProgress()) || 0, 0, 1)
      } else {
        const track = trackRef.current
        if (!track) return
        const rect = track.getBoundingClientRect()
        const vh = window.innerHeight
        const span = Math.max(1, rect.height - vh)
        p = clamp(-rect.top / span, 0, 1)
      }

      const off = window.innerWidth / 2 + b.offsetWidth / 2 + 24
      const x = xForProgress(p, off, enterEnd, holdEnd)
      b.style.transform = `translate3d(${x}px, 0, 0)`
      b.style.visibility = p <= 0 || p >= 1 ? "hidden" : "visible"
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [anchored, getProgress, enterEnd, holdEnd, stationary])

  const card = (
    <Box ref={boxRef} $stationary={stationary} className={anchored && !stationary ? undefined : className}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && <Title>{title}</Title>}
      {body && <Body>{body}</Body>}
      {children}
    </Box>
  )

  if (stationary) {
    // Absolute within a positioned parent (e.g. shore section) — scrolls with the art.
    return (
      <AnchoredStage className={className} aria-hidden="true">
        {card}
      </AnchoredStage>
    )
  }

  if (anchored) {
    return (
      <FixedStage className={className} aria-hidden="true">
        {card}
      </FixedStage>
    )
  }

  return (
    <Track ref={trackRef} $vh={trackVh} className={className}>
      <StickyViewport>{card}</StickyViewport>
    </Track>
  )
}

export default SwipeInBox

const Track = styled.div`
  position: relative;
  width: 100%;
  height: ${({ $vh }) => $vh}vh;
  overflow: clip;
`

const StickyViewport = styled.div`
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`

const FixedStage = styled.div`
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`

/**
 * Page-anchored overlay: fills the relative parent (shore / composition band)
 * and centers the card there — no viewport-fixed stickiness, no blank in-flow section.
 * Nudge with `top` if you want it higher/lower on the shore art.
 */
const AnchoredStage = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: -16%;
  bottom: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  pointer-events: none;
`

const Box = styled.div`
  width: min(1100px, 98vw);
  padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 2.5vw, 1.75rem);
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  will-change: ${({ $stationary }) => ($stationary ? "auto" : "transform")};
  transform: ${({ $stationary }) =>
    $stationary ? "translate3d(0, 0, 0)" : "translate3d(-100vw, 0, 0)"};
  visibility: ${({ $stationary }) => ($stationary ? "visible" : "hidden")};
`

const Eyebrow = styled.p`
  margin: 0 0 var(--space-xs, 0.5rem);
  font-size: clamp(0.78rem, 1.4vw, 0.9rem);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-accent);
`

const Title = styled.h3`
  margin: 0;
  font-family: var(--font-body);
  font-size: clamp(1.55rem, 3.4vw, 2.35rem);
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
  text-align: center;
  letter-spacing: normal;
  text-transform: none;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 0 14px rgba(0, 0, 0, 0.35);
`

const Body = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: clamp(1.1rem, 2.2vw, 1.35rem);
  line-height: 1.65;
`
