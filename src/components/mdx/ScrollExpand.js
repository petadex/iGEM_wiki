import React, { useEffect, useRef, useState } from "react"
import { Link } from "gatsby"
import styled from "styled-components"

/**
 * A block that grows to fill the window as the reader scrolls down to it.
 * It starts at its place in the text column and grows out to the window's
 * edges by the time it reaches the top of the screen. Scrolled there by hand,
 * it then holds the page still until the reader presses Continue (bottom
 * right), which glides on to the next such block and holds there (or past
 * this one, if it is the last); Minimize (top right) shrinks it back into the
 * text for good, so it no longer grows or holds for the rest of the visit
 * (a link or Continue still scrolls to it); scrolling up lets go too. A jump (a link, the
 * section menu) passes straight through without holding. Held, a firm
 * scroll either way lets go as well: PUSH px of it in one direction, after a
 * short settle, so the swipe that brought it up doesn't carry straight on.
 *
 * ExpandWindow uses it for its `grow` prop: `children` is a function of
 * `(grown, held)`, so the figure can take its expand-window layout while it is
 * grown, and take the keys and wheel while it is held. `ground` is the panel
 * that fades in behind it as it grows; `dark` picks light text to sit on it;
 * `hint` is a line of how-to beside Continue; `continueButton={false}` leaves
 * Continue out, and `continueTo` makes it a link to another page instead
 * (the last block on a page, which has no next block to go to). `anchor` is an id
 * for links to it: a link to `#anchor` scrolls straight to it grown and held
 * (or, when it doesn't grow, the browser's own jump lands on the figure
 * itself). `minimizeOnLeave` has leaving it downward (Continue, a firm scroll
 * down, or a jump past it) minimize it as well, so it is back in the text
 * once the reader has moved on. Off (`off`), on a narrow screen, or with
 * reduced motion, it stays as `children(false, false)`.
 */

/** Where the grow starts: the block's top this far down the window (0-1). */
const START_AT = 0.6
/** Scroll past the hold point that still snaps back to it (px). */
const HOLD = 360
/** How long Minimize takes to shrink it back (ms). */
const SHRINK_MS = 320
/** Held, scroll this far in one direction (px) to let go... */
const PUSH = 600
/** ...not counting the first moments of the hold (ms), */
const SETTLE_MS = 500
/** ...and starting the count over after a pause (ms). */
const PUSH_QUIET_MS = 600
/** What a key press counts as toward PUSH (px). */
const KEY_PUSH = { ArrowDown: 120, ArrowUp: -120, PageDown: 400, PageUp: -400, " ": 400, End: PUSH, Home: -PUSH }
/** Room round the grown block (px). */
const GUTTER = 24

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const lerp = (a, b, t) => a + (b - a) * t
const ease = t => 1 - (1 - t) ** 3

// Scrolls a click starts (links, the section menu, scroll to top) are jumps,
// and pass through every block; the wheel and keys are the reader's own.
// The flag lasts until the page has been still for a moment.
let jumping = false
let jumpQuiet = 0
const quietJump = ms => {
  clearTimeout(jumpQuiet)
  jumpQuiet = setTimeout(() => (jumping = false), ms)
}
const startJump = () => {
  jumping = true
  quietJump(400)
}
let jumpWatchers = 0
const watchJumps = () => {
  if (jumpWatchers++ === 0) {
    document.addEventListener("click", startJump, true)
    window.addEventListener("scroll", onJumpScroll, { passive: true })
    window.addEventListener("wheel", endJump, { passive: true })
  }
  return () => {
    if (--jumpWatchers === 0) {
      document.removeEventListener("click", startJump, true)
      window.removeEventListener("scroll", onJumpScroll)
      window.removeEventListener("wheel", endJump)
    }
  }
}
function onJumpScroll() {
  if (jumping) quietJump(150)
}
function endJump() {
  jumping = false
}

// The block holding the page right now, so a link to another one can let go.
let releaseHeld = null

// Every live block, so Continue can find the next one down the page.
const blocks = new Set()
const nextBlock = track =>
  [...blocks]
    .filter(b => track.compareDocumentPosition(b.track) & Node.DOCUMENT_POSITION_FOLLOWING)
    .sort((a, b) => (a.track.compareDocumentPosition(b.track) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))[0]

/**
 * Marks the page while a figure is grown or open in its window, so page
 * chrome that would sit over it (the scroll-to-top button) can step aside.
 * Returns the release.
 */
let figuresUp = 0
export const holdFigureUp = () => {
  if (figuresUp++ === 0) document.documentElement.setAttribute("data-figure-up", "")
  return () => {
    if (--figuresUp === 0) document.documentElement.removeAttribute("data-figure-up")
  }
}

/** True when the wheel at `el` scrolls something inside the figure instead. */
const scrollsInside = (el, dy) => {
  for (; el && el.nodeType === 1 && el !== el.ownerDocument.documentElement; el = el.parentElement) {
    const { overflowY } = el.ownerDocument.defaultView.getComputedStyle(el)
    if (!/(auto|scroll)/.test(overflowY) || el.scrollHeight <= el.clientHeight) continue
    if (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true
  }
  return false
}

export const ScrollExpand = ({
  off = false,
  ground,
  dark = false,
  hint,
  continueButton = true,
  continueTo,
  anchor,
  minimizeOnLeave = false,
  children,
}) => {
  const [wide, setWide] = useState(false)
  const [grown, setGrown] = useState(false)
  const [held, setHeld] = useState(false)
  const trackRef = useRef(null)
  const pinRef = useRef(null)
  const frameRef = useRef(null)
  const restH = useRef(0)
  const proceed = useRef(() => {})
  const minimize = useRef(() => {})
  const live = wide && !off

  // Only on a screen wide enough for the grow to be worth it, and only for
  // readers who don't ask for less motion.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 861px) and (prefers-reduced-motion: no-preference)")
    const sync = () => setWide(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (!grown) return undefined
    return holdFigureUp()
  }, [grown])

  useEffect(() => {
    if (!live) return undefined
    const track = trackRef.current
    const pin = pinRef.current
    const frame = frameRef.current
    const root = document.documentElement
    const stopWatching = watchJumps()
    let frameId = 0
    let wasGrown = false
    let holding = false
    // Let go by Continue: no holding again until the block is back at rest.
    let passed = false
    let lastTop = Infinity
    // On the way here from a link to the anchor: hold on arrival.
    let arriving = false
    // Shrinking by Minimize, since this time.
    let shrunkAt = 0
    // Minimized: it stays at rest for good, and once shrunk its track gives
    // back the scroll it held, so the page reads straight past it.
    let minimized = false
    // What to do once a shrink has finished and the track collapsed.
    let afterShrink = null
    // Scroll toward letting go while held (see PUSH).
    let heldAt = 0
    let push = 0
    let pushQuiet = 0
    // The figure's own frames, heard while held: their wheel never reaches us.
    let frameWheels = []

    const pinTopPx = () => parseFloat(getComputedStyle(pin).top) || 0

    const hold = top => {
      holding = true
      setHeld(true)
      // The wheel can carry past the hold point before this runs; go back to it.
      window.scrollTo({ top: window.scrollY + top - pinTopPx(), behavior: "instant" })
      root.style.overflow = "hidden"
      root.style.scrollbarGutter = "stable"
      releaseHeld = letGo
      heldAt = performance.now()
      push = 0
      for (const iframe of frame.querySelectorAll("iframe")) {
        try {
          const win = iframe.contentWindow
          const onFrameWheel = e => {
            // A wheel the figure used itself (the landscape's steps) isn't ours.
            if (!e.defaultPrevented) nudge(wheelPx(e), e.target)
          }
          win.addEventListener("wheel", onFrameWheel, { passive: true })
          frameWheels.push(() => win.removeEventListener("wheel", onFrameWheel))
        } catch {
          // A cross-origin frame keeps its wheel to itself.
        }
      }
    }
    function letGo() {
      if (releaseHeld === letGo) releaseHeld = null
      for (const off of frameWheels) off()
      frameWheels = []
      clearTimeout(pushQuiet)
      holding = false
      setHeld(false)
      root.style.overflow = ""
      root.style.scrollbarGutter = ""
    }
    // Let go of any block holding the page, glide to this one's hold point,
    // and hold there (update() catches the arrival).
    const arrive = () => {
      releaseHeld?.()
      // A minimized block is only scrolled to, not grown again.
      if (minimized) {
        startJump()
        window.scrollBy({ top: track.getBoundingClientRect().top - pinTopPx(), behavior: "smooth" })
        return
      }
      passed = false
      arriving = true
      startJump()
      const by = track.getBoundingClientRect().top - pinTopPx()
      if (Math.abs(by) < 2) schedule()
      else window.scrollBy({ top: by, behavior: "smooth" })
    }
    const self = { track, arrive }
    blocks.add(self)

    const goOn = () => {
      const next = nextBlock(track)
      if (next) {
        next.arrive()
        return
      }
      startJump()
      const by = track.getBoundingClientRect().bottom - pinTopPx()
      window.scrollBy({ top: by, behavior: "smooth" })
    }
    const shrinkAway = then => {
      if (holding) letGo()
      passed = true
      arriving = false
      minimized = true
      shrunkAt = performance.now()
      afterShrink = then || null
      schedule()
    }
    proceed.current = () => {
      // Shrunk back into the text first, then on from where it now ends.
      if (minimizeOnLeave && !minimized) {
        shrinkAway(goOn)
        return
      }
      if (holding) letGo()
      passed = true
      goOn()
    }
    minimize.current = () => shrinkAway()
    // The track back to the block's own height, keeping what is on screen
    // where it is: if the page was scrolled into the track, it scrolls up by
    // as much as the block had been pinned past its place, and never by more
    // than the track gave back.
    const collapse = () => {
      const was = track.offsetHeight
      const by = track.getBoundingClientRect().top - pinTopPx()
      track.style.height = ""
      pin.style.height = ""
      const gaveBack = was - track.offsetHeight
      if (by < 0) window.scrollBy({ top: -Math.min(-by, gaveBack), behavior: "instant" })
    }

    const update = () => {
      frameId = 0
      const vw = root.clientWidth
      const vh = window.innerHeight
      const pinTop = pinTopPx()
      const fullH = vh - pinTop - GUTTER
      // The pin is as tall as the grown block, and the track adds the overshoot.
      if (!minimized || shrunkAt) {
        track.style.height = `${fullH + HOLD}px`
        pin.style.height = `${fullH}px`
      }

      const { top, bottom } = track.getBoundingClientRect()
      // Gone past it by a jump or the scroll: minimized at once, off screen.
      if (minimizeOnLeave && !minimized && !holding && bottom < 0) {
        minimized = true
        passed = true
        collapse()
        frame.style.left = frame.style.width = frame.style.height = ""
        frame.style.setProperty("--grow", 0)
        if (wasGrown) {
          wasGrown = false
          setGrown(false)
        }
        lastTop = track.getBoundingClientRect().top
        return
      }
      if (top >= vh * START_AT) passed = false
      if (arriving && !holding && !minimized && Math.abs(top - pinTop) < 2) {
        arriving = false
        hold(top)
      }
      // Crossing the hold point on the way down, by the reader's own scroll.
      if (!holding && !passed && !minimized && !jumping && lastTop > pinTop && top <= pinTop && top > pinTop - HOLD) {
        lastTop = pinTop
        hold(top)
        schedule()
        return
      }
      lastTop = top

      let p = ease(clamp((vh * START_AT - top) / (vh * START_AT - pinTop), 0, 1))
      if (shrunkAt) {
        const t = clamp((performance.now() - shrunkAt) / SHRINK_MS, 0, 1)
        p = Math.min(p, 1 - ease(t))
        if (t < 1) schedule()
        else if (minimized) {
          shrunkAt = 0
          collapse()
          if (afterShrink) {
            const then = afterShrink
            afterShrink = null
            then()
          }
        }
      }
      if (minimized && !shrunkAt) p = 0
      // At rest the block is its natural height; measure it there (not while
      // its expand window has lifted it out of the frame).
      if (p === 0 && !wasGrown && frame.offsetHeight) restH.current = frame.offsetHeight
      const rect = pin.getBoundingClientRect()

      frame.style.left = `${lerp(0, GUTTER - rect.left, p)}px`
      frame.style.width = p > 0 ? `${lerp(rect.width, vw - 2 * GUTTER, p)}px` : ""
      frame.style.height = p > 0 ? `${lerp(restH.current, fullH, p)}px` : ""
      frame.style.setProperty("--grow", p)

      if (p > 0 !== wasGrown) {
        wasGrown = p > 0
        setGrown(wasGrown)
      }
    }
    function schedule() {
      if (!frameId) frameId = requestAnimationFrame(update)
    }

    // Held, a firm scroll lets go: down passes on, up shrinks it back as the
    // page scrolls (the page can't scroll while held, so this hears the wheel
    // and keys directly, and the figure's frames through hold()).
    const wheelPx = e => e.deltaY * (e.deltaMode === 1 ? 30 : e.deltaMode === 2 ? window.innerHeight : 1)
    function nudge(dy, target) {
      if (!holding || !dy || performance.now() - heldAt < SETTLE_MS) return
      if (scrollsInside(target, dy)) {
        push = 0
        return
      }
      if (Math.sign(dy) !== Math.sign(push)) push = 0
      push += dy
      clearTimeout(pushQuiet)
      pushQuiet = setTimeout(() => (push = 0), PUSH_QUIET_MS)
      if (Math.abs(push) < PUSH) return
      const down = push > 0
      if (down && minimizeOnLeave) {
        shrinkAway()
        return
      }
      letGo()
      if (down) passed = true
    }
    const onWheel = e => {
      arriving = false
      nudge(wheelPx(e), e.target)
    }

    // A link to the anchor: let go of any block holding the page, glide to
    // this one's hold point, and hold there (update() catches the arrival).
    const onLink = e => {
      const link = anchor && e.target.closest?.(`a[href="#${anchor}"]`)
      if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return
      e.preventDefault()
      arrive()
      window.history.pushState(null, "", `#${anchor}`)
    }
    const onKey = e => {
      if (!holding || e.metaKey || e.ctrlKey || e.altKey || !(e.key in KEY_PUSH)) return
      if (e.target.closest?.("input, textarea, select, button")) return
      e.preventDefault()
      nudge(KEY_PUSH[e.key], e.target)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    window.addEventListener("wheel", onWheel, { passive: true })
    document.addEventListener("keydown", onKey)
    document.addEventListener("click", onLink)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("wheel", onWheel)
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("click", onLink)
      stopWatching()
      blocks.delete(self)
      if (holding) letGo()
      for (const el of [track, pin, frame]) el.removeAttribute("style")
      setGrown(false)
    }
  }, [live, anchor, minimizeOnLeave])

  // Always the same wrappers, live or not: changing them would remount the
  // figure and reload its iframe. Without the script's heights they are inert.
  return (
    <Track ref={trackRef} id={anchor}>
      <Pin ref={pinRef}>
        <Frame ref={frameRef} $grown={grown} style={{ "--ground": ground }}>
          {grown && (
            <Header $dark={dark}>
              <Minimize type="button" onClick={() => minimize.current()}>
                Minimize <span aria-hidden="true">⤡</span>
              </Minimize>
            </Header>
          )}
          {children(grown, held)}
          {grown && (hint || continueButton || continueTo) && (
            <Footer $dark={dark}>
              {hint && <Hint>{hint}</Hint>}
              {continueTo ? (
                <Continue as={Link} to={continueTo}>
                  Continue <span aria-hidden="true">›</span>
                </Continue>
              ) : (
                continueButton && (
                  <Continue type="button" onClick={() => proceed.current()}>
                    Continue <span aria-hidden="true">›</span>
                  </Continue>
                )
              )}
            </Footer>
          )}
        </Frame>
      </Pin>
    </Track>
  )
}

const Track = styled.div`
  position: relative;
  scroll-margin-top: calc(var(--dl-header, 0px) + ${GUTTER}px);
`

const Pin = styled.div`
  position: sticky;
  top: calc(var(--dl-header, 0px) + ${GUTTER}px);
`

/* Grown past the text box, it brings its own ground: a panel that fades in
   as it grows, so what's round the figure isn't the art behind. */
const Frame = styled.div`
  position: ${({ $grown }) => ($grown ? "absolute" : "relative")};
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  background: color-mix(in srgb, var(--ground, var(--color-bg)) calc(var(--grow, 0) * 100%), transparent);
  box-shadow: 0 24px 60px rgba(0, 0, 0, calc(var(--grow, 0) * 0.35));
`

/* Under the figure, so it never covers the figure's own controls. */
const Footer = styled.div`
  flex: none;
  display: flex;
  align-items: center;
  gap: 1rem;
  /* Opens with the grow, so it doesn't squeeze a figure that has barely
     started growing. */
  max-height: calc(var(--grow, 0) * 4rem);
  overflow: hidden;
  padding: calc(var(--grow, 0) * 0.6rem) 0.9rem;
  border-top: 1px solid ${({ $dark }) => ($dark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)")};
  color: ${({ $dark }) => ($dark ? "#e6edf7" : "var(--color-text)")};
  opacity: var(--grow, 0);
`

/* Over the figure, top right; opens with the grow like the footer. */
const Header = styled.div`
  flex: none;
  display: flex;
  justify-content: flex-end;
  max-height: calc(var(--grow, 0) * 3rem);
  overflow: hidden;
  padding: calc(var(--grow, 0) * 0.4rem) 0.9rem;
  border-bottom: 1px solid ${({ $dark }) => ($dark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)")};
  color: ${({ $dark }) => ($dark ? "#e6edf7" : "var(--color-text)")};
  opacity: var(--grow, 0);
`

/* The expand window's Close, as Minimize. */
const Minimize = styled.button`
  padding: 0.3rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  opacity: 0.75;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`

/* Low-key on purpose: the figure is the thing to use, and this is the way
   out. Bottom right, on the panel's own ground, as an underlined link. */
const Continue = styled.button`
  flex: none;
  margin-left: auto;
  padding: 0.3rem 0.2rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  opacity: 0.85;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  /* As a link (continueTo) it sits in the text box, whose link rule would
     recolour it and draw its own underline; &&& outranks that. */
  &&& {
    border: 0;
    color: inherit;
    text-decoration: underline;
  }
`

const Hint = styled.span`
  min-width: 0;
  font-size: 0.85rem;
  line-height: 1.35;
  opacity: 0.8;
`
