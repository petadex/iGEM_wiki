import React, { useEffect, useRef, useState } from "react"
import styled, { keyframes } from "styled-components"
import { POPUP_CLOSED_EVENT } from "./PopupClose"

/**
 * Optional auto-scroll for the homepage: a play button (bottom left; its
 * "Auto-scroll" label slides out on hover, where there is one) makes the page scroll itself at a reading pace. As each popup
 * reaches the middle of the screen it stops and opens it (the red underlined
 * terms, then each petamon's description at the ending), then carries on.
 * Any scroll, tap or key from the reader hands control back, except closing
 * a popup with its ✕: that just skips the rest of its wait.
 *
 * Self-contained: popups are opened through their own hover behaviour, so
 * nothing else knows this exists. To take it out, delete this file, the two
 * `HomeAutoplay` lines and the `data-autoplay-forest` attribute in
 * HomeScrollPrototype.js.
 */

/** Scroll speed, in screen heights per second. */
const SPEED_VH_PER_S = 0.19
/** How long each term's popup stays open. */
const TERM_HOLD_MS = 4500
/** How long each petamon's description stays open at the ending. */
const PETAMON_HOLD_MS = 2600
/** Longest it waits at the bottom for a stop on screen to get ready. */
const END_WAIT_MS = 6000
/** A popup opens once its middle reaches this far down the screen. */
const STOP_AT_VIEW_Y = 0.55
/** Faster while the forest walk holds the page (it's long to sit through). */
const FOREST_SPEED_X = 2
/**
 * The art scales with the window width, so a wider window makes a longer
 * page. Past this width the pace scales up with the width, so a run takes
 * about as long as it does here (~2.5 min of scrolling) instead of growing.
 */
const STEADY_WIDTH = 1000

/**
 * First landing (once per visit): after the loader is gone the button sweeps
 * a shine and a soft ring this many times, with its label out, so it gets
 * noticed. Clicking it ends that early.
 */
const HINT_SWEEPS = 3
const HINT_SWEEP_MS = 2600
const HINT_DELAY_MS = 700
const HINT_SEEN_KEY = "petabite-autoplay-hinted"
/** SiteLoader's overlay, there until the homepage has handed off from it. */
const LOADER_SELECTOR = '[role="progressbar"][aria-label="Loading"]'

/** The red underlined terms (ExplainTermPopover): they open on hover. */
const TERM_SELECTOR = 'span[role="button"][aria-expanded]'
/** The petamon names at the ending (EndingPetamonBottle): they open on hover. */
const PETAMON_LABEL_SELECTOR = "[data-label]"
/** The petamons at the top (HomePlaza): their speech bubbles open on hover. */
const PLAZA_PETAMON_SELECTOR = "[data-petamon-spot]"
/**
 * The plaza's first stops, on their own, in this order (the bird by the
 * logo, then the dragon on the roof); the rest play one after another.
 */
const PLAZA_FIRST = ["humanPractices", "web"]
/** How long each plaza petamon's speech bubble stays open. */
const PLAZA_HOLD_MS = 2600
/** Boxes to stop and read (the journey callout), and for how long. */
const HOLD_SELECTOR = "[data-autoplay-hold]"
const HOLD_MS = 7000
/**
 * Lines that take turns in one spot while the page holds still (the lab's
 * Wet Lab and Hardware lines): it stops on each once it's fully in, for
 * long enough to read it (READ_MS plus READ_MS_PER_WORD a word).
 */
const READ_SELECTOR = "[data-autoplay-read]"
const READ_MS = 1200
const READ_MS_PER_WORD = 250

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const maxScroll = () =>
  document.documentElement.scrollHeight - window.innerHeight

function isShown(el) {
  return el.checkVisibility
    ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    : true
}

/** How opaque `el` really is: its opacity times all its ancestors'. */
function opacityOf(el) {
  let opacity = 1
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    opacity *= parseFloat(getComputedStyle(node).opacity)
  }
  return opacity
}

/** Wholly on screen (a line held in one spot may never reach STOP_AT_VIEW_Y). */
function inView(el) {
  const r = el.getBoundingClientRect()
  return r.top >= 0 && r.bottom <= window.innerHeight
}

/** A mouse moving onto or off a term (React's mouse enter / leave). */
function mouse(el, over) {
  el.dispatchEvent(
    new MouseEvent(over ? "mouseover" : "mouseout", {
      bubbles: true,
      relatedTarget: over ? null : document.body,
    }),
  )
}

/** A pointer moving onto or off a petamon name (pointer enter / leave). */
function hover(el, over) {
  el.dispatchEvent(
    new PointerEvent(over ? "pointerover" : "pointerout", {
      bubbles: true,
      pointerType: "mouse",
      relatedTarget: over ? null : document.body,
    }),
  )
}

export function HomeAutoplay() {
  const [playing, setPlaying] = useState(false)
  const [hint, setHint] = useState(false)
  const buttonRef = useRef(null)

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(HINT_SEEN_KEY)) return undefined
    } catch {}
    let timer = 0
    const start = () => {
      if (document.querySelector(LOADER_SELECTOR)) {
        timer = window.setTimeout(start, 250)
        return
      }
      timer = window.setTimeout(() => {
        setHint(true)
        try {
          window.sessionStorage.setItem(HINT_SEEN_KEY, "1")
        } catch {}
        timer = window.setTimeout(
          () => setHint(false),
          HINT_SWEEPS * HINT_SWEEP_MS,
        )
      }, HINT_DELAY_MS)
    }
    start()
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!playing) return undefined
    const root = buttonRef.current?.parentElement ?? document.body
    let cancelled = false
    let raf = 0
    // Closes whatever popup is open, if the run ends while it's showing.
    let closeOpen = null
    // Ends the current popup's wait early (its ✕ was clicked).
    let skipHold = null
    const hold = ms =>
      new Promise(resolve => {
        const done = () => {
          window.clearTimeout(timer)
          skipHold = null
          resolve()
        }
        const timer = window.setTimeout(done, ms)
        skipHold = done
      })
    const onPopupClosed = () => skipHold?.()
    window.addEventListener(POPUP_CLOSED_EVENT, onPopupClosed)
    // Popups show their ✕ while this runs.
    document.documentElement.dataset.autoplaying = ""

    if (window.scrollY >= maxScroll() - 2) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }

    // A plaza petamon's bubble, opened like a pointer moving onto it.
    const showSpot = async el => {
      hover(el, true)
      closeOpen = () => hover(el, false)
      await wait(PLAZA_HOLD_MS)
      closeOpen()
      closeOpen = null
    }
    const spots = [...root.querySelectorAll(PLAZA_PETAMON_SELECTOR)]
    const spotById = id => spots.find(el => el.dataset.petamonSpot === id)
    const firstSpots = PLAZA_FIRST.map(spotById).filter(Boolean)
    // The rest, top to bottom then left to right, as they're painted.
    const restSpots = spots
      .filter(el => !firstSpots.includes(el))
      .sort((a, b) => {
        const ra = a.getBoundingClientRect()
        const rb = b.getBoundingClientRect()
        return ra.top - rb.top || ra.left - rb.left
      })
    const plaza = [
      ...firstSpots.map(el => ({
        el,
        ready: () => true,
        play: () => showSpot(el),
      })),
      ...(restSpots.length
        ? [
            {
              el: restSpots[0],
              ready: () => true,
              play: async () => {
                for (const el of restSpots) {
                  if (cancelled) return
                  await showSpot(el)
                }
              },
            },
          ]
        : []),
    ]

    const holds = [...root.querySelectorAll(HOLD_SELECTOR)].map(el => ({
      el,
      // Not once it's been closed or scrolled past.
      ready: () => el.dataset.gone !== "1",
      play: () => hold(HOLD_MS),
    }))

    const reads = [...root.querySelectorAll(READ_SELECTOR)].map(el => ({
      el,
      held: true,
      // Once it's fully in (they fade in and out as the page scrolls).
      ready: () => isShown(el) && opacityOf(el) > 0.95,
      play: () =>
        hold(
          READ_MS +
            READ_MS_PER_WORD * el.textContent.trim().split(/\s+/).length,
        ),
    }))

    const terms = [...root.querySelectorAll(TERM_SELECTOR)].map(el => ({
      el,
      held: !!el.closest(READ_SELECTOR),
      // Not while its line is still fading in (or out).
      ready: () => isShown(el) && opacityOf(el) > 0.95,
      play: async () => {
        mouse(el, true)
        closeOpen = () => mouse(el, false)
        await hold(TERM_HOLD_MS)
      },
    }))
    const labels = [...root.querySelectorAll(PETAMON_LABEL_SELECTOR)]
    const petamons = labels.length
      ? [
          {
            el: labels[0].parentElement,
            // Their names fade in once the petamons have burst out.
            ready: () =>
              labels.every(l => parseFloat(getComputedStyle(l).opacity) > 0.9),
            play: async () => {
              for (const label of labels) {
                if (cancelled) return
                hover(label, true)
                closeOpen = () => hover(label, false)
                await wait(PETAMON_HOLD_MS)
                closeOpen()
                closeOpen = null
              }
            },
          },
        ]
      : []
    // Popups already scrolled past when it starts are skipped.
    // A held line is read before its term's popup covers it.
    const stops = [...plaza, ...holds, ...reads, ...terms, ...petamons].map(stop => ({
      ...stop,
      done: stop.el.getBoundingClientRect().bottom < 0,
    }))
    const due = stop => {
      const r = stop.el.getBoundingClientRect()
      return (
        r.bottom > 0 &&
        (r.top + r.height / 2 <= window.innerHeight * STOP_AT_VIEW_Y ||
          (stop.held && inView(stop.el))) &&
        stop.ready()
      )
    }

    let pos = window.scrollY
    let last = performance.now()
    let endWaitFrom = null
    const tick = now => {
      if (cancelled) return
      const stop = stops.find(s => !s.done && due(s))
      if (stop) {
        stop.done = true
        stop.play().then(() => {
          if (cancelled) return
          closeOpen?.()
          closeOpen = null
          pos = window.scrollY
          last = performance.now()
          raf = requestAnimationFrame(tick)
        })
        return
      }
      // The page can move the scroll itself (the forest walk gives back its
      // scroll length once played): carry on from there.
      if (Math.abs(window.scrollY - pos) > 2) pos = window.scrollY
      const dt = Math.min(64, now - last)
      last = now
      // The forest's composition is pinned (fixed) while its walk plays.
      const forest = root.querySelector("[data-autoplay-forest]")
      const speed =
        forest && getComputedStyle(forest).position === "fixed"
          ? SPEED_VH_PER_S * FOREST_SPEED_X
          : SPEED_VH_PER_S
      const widthX = Math.max(1, window.innerWidth / STEADY_WIDTH)
      pos = Math.min(
        maxScroll(),
        pos + (speed * widthX * window.innerHeight * dt) / 1000,
      )
      window.scrollTo({ top: pos, left: 0, behavior: "instant" })
      if (pos >= maxScroll() - 1) {
        // A stop on screen that isn't ready yet (the ending's petamons still
        // bursting out) gets a moment before the tour ends.
        endWaitFrom ??= now
        const pending = stops.some(s => !s.done && inView(s.el))
        if (!pending || now - endWaitFrom > END_WAIT_MS) {
          setPlaying(false)
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // The reader taking over (not this button, not the simulated hovers).
    const takeOver = event => {
      if (!event.isTrusted || buttonRef.current?.contains(event.target)) return
      if (event.target.closest?.("[data-autoplay-skip]")) return
      setPlaying(false)
    }
    const inputs = ["wheel", "touchstart", "keydown", "pointerdown"]
    inputs.forEach(type =>
      window.addEventListener(type, takeOver, { passive: true }),
    )
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      closeOpen?.()
      skipHold?.()
      window.removeEventListener(POPUP_CLOSED_EVENT, onPopupClosed)
      delete document.documentElement.dataset.autoplaying
      inputs.forEach(type => window.removeEventListener(type, takeOver))
    }
  }, [playing])

  return (
    <AutoplayButton
      ref={buttonRef}
      type="button"
      aria-pressed={playing}
      title={
        playing
          ? "Pause (or just scroll)"
          : "Let the page scroll itself; popups open on their own"
      }
      data-hint={hint || undefined}
      onClick={() => {
        setHint(false)
        setPlaying(p => !p)
      }}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        {playing ? (
          <path d="M4 3h3v10H4zM9 3h3v10H9z" />
        ) : (
          <path d="M5 2.5v11l9-5.5z" />
        )}
      </svg>
      <Label>{playing ? "Pause" : "Auto-scroll"}</Label>
    </AutoplayButton>
  )
}

export default HomeAutoplay

/** A pastel band (the logo's pink and blue) crossing the button. */
const shine = keyframes`
  0% { transform: translateX(-110%) skewX(-20deg); }
  45%, 100% { transform: translateX(320%) skewX(-20deg); }
`

const BUTTON_SHADOW = "0 4px 14px rgba(6, 32, 43, 0.18)"

/** A soft ring spreading out from the button. */
const halo = keyframes`
  0% { box-shadow: ${BUTTON_SHADOW}, 0 0 0 0 rgba(107, 127, 230, 0.5); }
  60%, 100% { box-shadow: ${BUTTON_SHADOW}, 0 0 0 0.9rem rgba(107, 127, 230, 0); }
`

/**
 * A circle like the back-to-top button (bottom right), on the other side,
 * with just the play / pause icon; hovering or focusing it slides out what
 * it does.
 */
const AutoplayButton = styled.button`
  position: fixed;
  left: max(1rem, env(safe-area-inset-left));
  bottom: max(1rem, env(safe-area-inset-bottom));
  z-index: 105;
  display: inline-flex;
  align-items: center;
  height: 3rem;
  min-width: 3rem;
  /* Centres the icon in the circle while the label is tucked away. */
  padding: 0 calc((3rem - 2px - 0.95rem) / 2);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: ${BUTTON_SHADOW};
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background-color 0.2s ease;

  svg {
    flex: none;
    width: 0.95rem;
    height: 0.95rem;
    fill: currentColor;
  }

  /* Only a real hover slides the label out: on a phone a tap would show it
     instead of pressing the button. */
  @media (hover: hover) {
    &:hover {
      background: var(--color-surface);
      transform: translateY(-1px);
    }

    &:hover > span {
      max-width: 8rem;
      margin-left: 0.45rem;
      opacity: 1;
    }
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 45%;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(247, 178, 212, 0.75) 30%,
      rgba(255, 255, 255, 0.95) 50%,
      rgba(158, 196, 255, 0.75) 70%,
      transparent
    );
    transform: translateX(-110%) skewX(-20deg);
  }

  &[data-hint] {
    animation: ${halo} ${HINT_SWEEP_MS}ms ease-out ${HINT_SWEEPS};
  }

  &[data-hint]::after {
    animation: ${shine} ${HINT_SWEEP_MS}ms ease-in-out ${HINT_SWEEPS};
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-hint],
    &[data-hint]::after {
      animation: none;
    }
  }

  &[data-hint] > span,
  &:focus-visible > span {
    max-width: 8rem;
    margin-left: 0.45rem;
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }
`

/** Still read out by screen readers while tucked away. */
const Label = styled.span`
  max-width: 0;
  margin-left: 0;
  overflow: hidden;
  white-space: nowrap;
  opacity: 0;
  transition:
    max-width 0.25s ease,
    margin-left 0.25s ease,
    opacity 0.2s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`
