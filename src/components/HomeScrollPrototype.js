import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { withPrefix } from "gatsby"
import styled, { css, keyframes } from "styled-components"
import { WikiTopBar } from "./WikiTopBar.js"

/**
 * Mockups live under /static/wiki-mockup/ so the browser loads predictable URLs
 * (avoids webpack + long filenames with spaces, and respects pathPrefix via withPrefix).
 */
const ASSETS = {
  background: withPrefix("/wiki-mockup/wiki-front-background.png"),
  blur: withPrefix("/wiki-mockup/wiki-front-blur.png"),
  bottle: withPrefix("/wiki-mockup/wiki-front-bottle.png"),
  title: withPrefix("/wiki-mockup/wiki-front-title.png"),
}

/** Overlays above the in-flow back plate (water on top). */
const Z = {
  front: 1,
  logo: 2,
  bottle: 3,
  water: 4,
}

/**
 * Fraction of the bottle layer height: positive `translateY` moves the bottle layer down
 * (toward the waterfall base / yellow figure). Increase if it still sits too high.
 */
const BOTTLE_SHIFT_FRAC = -0.1

/** Pixels scroll must move back above the captured touchpoint before the bottle unpins. */
const BOTTLE_PIN_SCROLL_UP_LEAVE = 40

/** FLIP duration (ms) for bottle pick-up / put-down when toggling sticky. */
const BOTTLE_FLIP_MS = 580

/**
 * Full-page wiki front compositing: layered mockup PNGs plus a gentle idle float on the logo.
 *
 * Site nav uses scroll-driven `position: fixed` while the mockup is on-screen.
 *
 * Bottle touchpoints: (1) when the bottle midpoint crosses the viewport middle, capture scrollY
 * and pin the bottle centered; (2) stay pinned through the bottom of the page so it does not
 * vanish. Unpin only when the user scrolls back up past TP1 (`scrollY` below that capture minus slack).
 */
export function HomeScrollPrototype() {
  const stackRef = useRef(null)
  const bottleTouchRef = useRef(null)
  const bottleFlipRef = useRef(null)
  const bottleTouchPinnedRef = useRef(false)
  const bottlePinEnterScrollYRef = useRef(null)
  const flipUnpinFirstRef = useRef(null)
  const flipPinFirstRef = useRef(null)
  const flipCleanupRef = useRef(null)
  const [navPinned, setNavPinned] = useState(false)
  const [bottleTouchPinned, setBottleTouchPinned] = useState(false)

  bottleTouchPinnedRef.current = bottleTouchPinned

  useEffect(() => {
    if (typeof window === "undefined") return
    window.scrollTo(0, 0)
  }, [])

  useLayoutEffect(() => {
    const tick = () => {
      const stack = stackRef.current
      const bottleSpot = bottleTouchRef.current
      const doc = document.documentElement
      const y = window.scrollY
      const maxY = Math.max(0, doc.scrollHeight - window.innerHeight)
      const nearBottom = y >= maxY - 8

      if (stack) {
        const rect = stack.getBoundingClientRect()
        setNavPinned(rect.top < 0 && rect.bottom > 0)
      }

      if (bottleTouchPinnedRef.current) {
        const pin0 = bottlePinEnterScrollYRef.current
        if (pin0 != null && y < pin0 - BOTTLE_PIN_SCROLL_UP_LEAVE) {
          const flip = bottleFlipRef.current
          if (flip) flipUnpinFirstRef.current = flip.getBoundingClientRect()
          else flipUnpinFirstRef.current = null
          bottleTouchPinnedRef.current = false
          bottlePinEnterScrollYRef.current = null
          setBottleTouchPinned(false)
        }
      } else if (bottleSpot) {
        const br = bottleSpot.getBoundingClientRect()
        const bottleMidY = br.top + br.height / 2
        const viewMidY = window.innerHeight / 2
        if (!nearBottom && bottleMidY <= viewMidY && br.bottom > 32) {
          const flip = bottleFlipRef.current
          if (flip) flipPinFirstRef.current = flip.getBoundingClientRect()
          else flipPinFirstRef.current = null
          bottlePinEnterScrollYRef.current = y
          bottleTouchPinnedRef.current = true
          setBottleTouchPinned(true)
        }
      }
    }

    tick()
    window.addEventListener("scroll", tick, { passive: true })
    window.addEventListener("resize", tick, { passive: true })
    return () => {
      window.removeEventListener("scroll", tick)
      window.removeEventListener("resize", tick)
    }
  }, [])

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
    <WikiFrontRoot>
      <ScrollStack ref={stackRef}>
        <CompositionRoot>
          <BlurFill aria-hidden>
            <BlurImg src={ASSETS.blur} alt="background blur" />
          </BlurFill>

          <ArtRail>
            <RailImg src={ASSETS.background} alt="front-page illustration - background scenery" />
            <TitleLayer aria-hidden>
              <LogoFloatWrap>
                <RailImg src={ASSETS.title} alt="PETABITE" />
              </LogoFloatWrap>
            </TitleLayer>
            <BottleLayer aria-hidden>
              <BottlePinSpot ref={bottleTouchRef} $touchPinned={bottleTouchPinned}>
                <BottleFlipSurface ref={bottleFlipRef}>
                  <BottleStickyRock $active={bottleTouchPinned}>
                    <BottleShiftWrap>
                      <BottleFloatWrap>
                        <RailImg src={ASSETS.bottle} alt="" />
                      </BottleFloatWrap>
                    </BottleShiftWrap>
                  </BottleStickyRock>
                </BottleFlipSurface>
              </BottlePinSpot>
            </BottleLayer>
            <OverlaySlice $z={Z.water}>
              <RailImg src={ASSETS.water} alt="" />
            </OverlaySlice>
          </ArtRail>
        </CompositionRoot>

        <HomeNavMount $pinned={navPinned}>
          <WikiTopBar />
        </HomeNavMount>
      </ScrollStack>
    </WikiFrontRoot>
  )
}

export default HomeScrollPrototype

const WikiFrontRoot = styled.div`
  width: 100%;
  min-width: 0;
  background: var(--color-bg);
  overflow: visible;
`

const ScrollStack = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`


const OverlaySlice = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${({ $z }) => $z};
  display: flex;
  align-items: flex-start;
  justify-content: center;
  pointer-events: none;
`


/** Absolute at rest; `fixed` while scrolling through mockup so nav stays reachable. */
const HomeNavMount = styled.div`
  position: ${({ $pinned }) => ($pinned ? "fixed" : "absolute")};
  top: 0;
  left: 0;
  right: 0;
  z-index: 110;
`

const CompositionRoot = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
  display: flex;
  justify-content: center;
  overflow: hidden;
`

const BlurFill = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

const BlurImg = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
`

const ArtRail = styled.div`
  position: relative;
  z-index: 1;
  width: min(620px, 100vw);
  flex: 0 1 620px;
`

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

const bottleStickyRock = keyframes`
  0%,
  100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(10deg);
  }
`


const TitleLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
`

const BottleLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
`




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

const LogoFloatWrap = styled.div`
  width: 100%;
  animation: ${logoIdleFloat} 4.2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Owns FLIP `transform` so parent pin spot can stay `position: fixed` without fighting this layer. */
const BottleFlipSurface = styled.div`
  width: 100%;
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
          position: relative;
        `}
`

/** Nudges the bottle PNG down (see `BOTTLE_SHIFT_FRAC`); inner wrap adds idle float. */

const BottleShiftWrap = styled.div`
  width: 100%;
  transform: translateY(${BOTTLE_SHIFT_FRAC * 100}%);
`

const BottleFloatWrap = styled.div`
  width: 100%;
  animation: ${bottleIdleFloat} 1.5s ease-in-out infinite;
  animation-delay: -0.7s;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const RailImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
`
