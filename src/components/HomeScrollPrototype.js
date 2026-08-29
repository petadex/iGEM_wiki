import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { withPrefix } from "gatsby"
import styled, { css, keyframes } from "styled-components"
import { WikiTopBar, WIKI_TOP_BAR_Z_INDEX } from "./WikiTopBar.js"
import { WaterfallSideText } from "./WaterfallSideText.js"
import Petadex from "./Petadex.js"
import PetadexBottlePath from "./PetadexBottlePath.js"
import { SwipeInBox } from "./SwipeInBox.js"
import { ExplainTerm } from "./ExplainTermPopover.js"
import EnzymeBattle from "./EnzymeBattle.js"

/**
 * Homepage bottle stages (degradation journey).
 * `sky` is used for the waterfall; section1–5 are reserved for later sections.
 */
export const BOTTLE_STAGES = {
  sky: "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/sky.avif",
  section1: "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section1.avif",
  section2: "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section2.avif",
  section3: "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section3.avif",
  section4: "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section4.avif",
  section5: "https://static.igem.wiki/teams/6187/wiki/homepage-components/bottle-stages/section5.avif",
}

/**
 * Mockups live under /static/wiki-mockup/ so the browser loads predictable URLs
 * (avoids webpack + long filenames with spaces, and respects pathPrefix via withPrefix).
 */
const ASSETS = {
  back: "https://static.igem.wiki/teams/6187/wiki/homepage-components/wiki-front-page-back.avif",
  front: withPrefix("/wiki-mockup/wiki-front-front.png"),
  logo: "https://static.igem.wiki/teams/6187/wiki/homepage-components/logo-draft-5.avif",
  /** Waterfall / sky section bottle (current homepage stage). */
  bottle: BOTTLE_STAGES.sky,
  water: withPrefix("/wiki-mockup/wiki-front-water.png"),
}

/**
 * New back art is taller than the previous plate — extra canvas was added at the top.
 * Keep overlays/text in the legacy art band so they stay aligned with front/water/bottle.
 */
const BACK_ART_HEIGHT_PREV = 2440
const BACK_ART_HEIGHT = 3239
const BACK_TOP_EXTENSION_FRAC = (BACK_ART_HEIGHT - BACK_ART_HEIGHT_PREV) / BACK_ART_HEIGHT
const BACK_LEGACY_BAND_FRAC = BACK_ART_HEIGHT_PREV / BACK_ART_HEIGHT

/** Full-bleed shore section layers (iGEM team static CDN). */
const SHORE_ASSETS = {
  waterBg: "https://static.igem.wiki/teams/6187/wiki/homepage-components/5-water-bg.avif",
  waterDetails: "https://static.igem.wiki/teams/6187/wiki/homepage-components/4-water-details.avif",
  sand: "https://static.igem.wiki/teams/6187/wiki/homepage-components/3-sand.avif",
  grass: "https://static.igem.wiki/teams/6187/wiki/homepage-components/2-grass.avif",
}

const CONDITION_CARD_IMAGES = [
  {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/condition-cards/ph.avif",
    alt: "pH",
  },
  {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/condition-cards/temp.avif",
    alt: "Temperature",
  },
  {
    src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/condition-cards/surrounding-env.avif",
    alt: "Environment",
  },
]

const RNALAB_TEXTBOX_IMG =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/text-boxes/rnalab.avif"

const RNALAB_EXPLANATION =
  "RNAlab is our advisory lab partner that helped uncover 215.7 million high-quality plastic-degrading enzymes."

/** Overlays above the in-flow back plate. Text/popover above water so the glossary box is visible. */
const Z = {
  front: 1,
  logo: 2,
  bottle: 3,
  water: 4,
  text: 5,
}

/**
 * Where the bottle sits in the legacy art band (0 = top, 1 = bottom).
 * Anchors into the waterfall rather than the sky.
 */
const BOTTLE_TOP_FRAC = 0.42

/** Pixels scroll must move back above the captured TP1 scrollY before bottle unpins. */
const BOTTLE_PIN_SCROLL_UP_LEAVE = 40

/** FLIP duration (ms) for bottle pick-up / put-down when toggling sticky. */
const BOTTLE_FLIP_MS = 580

/** Back layer scroll speed vs foreground (lower = slower / more depth). */
const BACK_PARALLAX_SPEED = 0.7

/**
 * Full-bleed bird flap pairs (same canvas as the back art).
 * `speed` is parallax vs scroll (between back and foreground).
 * `flapMs` is one full A↔B cycle.
 */
const BIRDS = [
  {
    id: 1,
    a: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-1.avif",
    b: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-1-2.avif",
    speed: 0.82,
    flapMs: 980,
    delayMs: 0,
    depth: "back",
    driftMs: 32000,
    driftDelayMs: 2000,
  },
  {
    id: 2,
    a: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-2.avif",
    b: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-2-2.avif",
    speed: 0.88,
    flapMs: 480,
    delayMs: 140,
    depth: "front",
  },
  {
    id: 3,
    a: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-3.avif",
    b: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-3-2.avif",
    speed: 0.78,
    flapMs: 1100,
    delayMs: 240,
    depth: "back",
    driftMs: 40000,
    driftDelayMs: 8000,
  },
  {
    id: 4,
    a: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-4.avif",
    b: "https://static.igem.wiki/teams/6187/wiki/homepage-components/birds/wiki-front-page-bird-4-2.avif",
    speed: 0.92,
    flapMs: 520,
    delayMs: 80,
    depth: "front",
  },
]

/**
 * Fraction of the composition (layer) height where the water surface / ripple sits.
 * Once this line rises above the anchored bottle, the bottle is treated as submerged.
 * Tune against wiki-front-water.png (ripple ≈ 0.92 down the 1440×2440 canvas).
 * Pushed to 0.98 so the bottle stays fully opaque until it's deep under the water.
 */
const WATER_RIPPLE_FRAC = 0.98

/**
 * Visible bottle band as a fraction of its layer height.
 * The bottle fades from opaque→hidden as the ripple sweeps
 * from BOT_FRAC up to TOP_FRAC — a narrow gap makes the fade snap 100→0 fast.
 */
const BOTTLE_SUBMERGE_TOP_FRAC = 0.49
const BOTTLE_SUBMERGE_BOT_FRAC = 0.52

/**
 * Conditions card: enter late on the waterfall (near the puddle),
 * exit early once the sand comes into view.
 */
const CONDITIONS_ENTER_VH = 0.95
const CONDITIONS_EXIT_SAND_FRAC = 0.2
const CONDITIONS_EXIT_VH = 0.35
/** Continuous left→right pass (no centered hold) so the card covers less screen time. */
const CONDITIONS_ENTER_END = 1
const CONDITIONS_HOLD_END = 0.3

/**
 * Autonomous shore-bottle rematch (section1).
 * Triggers once when the shore crosses an early viewport threshold after the sky
 * bottle sinks; then slowly drifts down and exits left on its own.
 */
/** Shore top below this fraction of vh → start the drift (appear as shore peeks in). */
const SHORE_BOTTLE_TRIGGER_FRAC = 1.02
/** Shore top above this → reset so the drift can replay on the next pass. */
const SHORE_BOTTLE_RESET_FRAC = 1.08
/** Total drift duration (continuous path travel). */
const SHORE_BOTTLE_DRIFT_MS = 15000
/** Sky bottle treated as sunk once fade opacity drops below this. */
const SHORE_BOTTLE_SUNK_OPACITY = 0.2

const clamp01 = (v) => Math.max(0, Math.min(1, v))

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
  const parallaxBackRef = useRef(null)
  const birdParallaxRefs = useRef([])
  const waterRef = useRef(null)
  const compositionRef = useRef(null)
  const shoreRef = useRef(null)
  const shoreBottlePlayedRef = useRef(false)
  /** True after the sky bottle finishes its waterfall sink (near-bottom unpin). */
  const skyBottleHasSunkRef = useRef(false)
  const [navPinned, setNavPinned] = useState(false)
  const [bottleTouchPinned, setBottleTouchPinned] = useState(false)
  const [shoreBottlePlaying, setShoreBottlePlaying] = useState(false)
  const [battleOpen, setBattleOpen] = useState(false)
  const reduceMotionParallaxRef = useRef(false)
  const petadexRef = useRef(null)

  bottleTouchPinnedRef.current = bottleTouchPinned

  /** 0–1 progress from past the puddle → a little into the sand. */
  const getConditionsProgress = useCallback(() => {
    const comp = compositionRef.current
    const shore = shoreRef.current
    if (!comp || !shore || typeof window === "undefined") return 0

    const vh = window.innerHeight
    const y = window.scrollY
    const compBottomDoc = y + comp.getBoundingClientRect().bottom
    const shoreRect = shore.getBoundingClientRect()
    const shoreTopDoc = y + shoreRect.top

    const enterScroll = compBottomDoc - vh * CONDITIONS_ENTER_VH
    const exitScroll =
      shoreTopDoc + shoreRect.height * CONDITIONS_EXIT_SAND_FRAC - vh * CONDITIONS_EXIT_VH

    return clamp01((y - enterScroll) / Math.max(1, exitScroll - enterScroll))
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      reduceMotionParallaxRef.current = mq.matches
      if (mq.matches) {
        if (parallaxBackRef.current) {
          parallaxBackRef.current.style.transform = "translate3d(0, 0, 0)"
          parallaxBackRef.current.style.willChange = "auto"
        }
        birdParallaxRefs.current.forEach((el) => {
          if (!el) return
          el.style.transform = "translate3d(0, 0, 0)"
          el.style.willChange = "auto"
        })
      }
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useLayoutEffect(() => {
    const tick = () => {
      const stack = stackRef.current
      const bottleSpot = bottleTouchRef.current
      const y = window.scrollY

      // Use ScrollStack bottom to know where the mockup section is in the viewport
      const stackBottom = stack ? stack.getBoundingClientRect().bottom : window.innerHeight

      // Release the bottle when the ScrollStack bottom crosses 45% of viewport height
      const UNPIN_THRESHOLD = window.innerHeight * 0.45
      const nearBottom = stackBottom <= UNPIN_THRESHOLD

      if (bottleTouchPinnedRef.current && nearBottom) {
        const flip = bottleFlipRef.current
        if (flip) flipUnpinFirstRef.current = flip.getBoundingClientRect()
        else flipUnpinFirstRef.current = null
        skyBottleHasSunkRef.current = true
        bottleTouchPinnedRef.current = false
        bottlePinEnterScrollYRef.current = null
        setBottleTouchPinned(false)
        // Fall through — still run parallax / shore rematch this frame.
      }

      if (stack) {
        const rect = stack.getBoundingClientRect()
        setNavPinned(rect.top < 0 && rect.bottom > 0)
        const scrolledInto = Math.max(0, -rect.top)
        const offset = reduceMotionParallaxRef.current
          ? 0
          : scrolledInto * (1 - BACK_PARALLAX_SPEED)
        if (parallaxBackRef.current) {
          parallaxBackRef.current.style.transform = `translate3d(0, ${offset}px, 0)`
          parallaxBackRef.current.style.willChange = offset > 0 ? "transform" : "auto"
        }
        BIRDS.forEach((bird, i) => {
          const el = birdParallaxRefs.current[i]
          if (!el) return
          const birdOffset = reduceMotionParallaxRef.current
            ? 0
            : scrolledInto * (1 - bird.speed)
          el.style.transform = `translate3d(0, ${birdOffset}px, 0)`
          el.style.willChange = birdOffset > 0 ? "transform" : "auto"
        })
      }

      // Water surface (ripple) viewport position — the "barrier" the bottle sinks behind.
      const water = waterRef.current
      let rippleY = null
      if (water) {
        const wr = water.getBoundingClientRect()
        rippleY = wr.top + wr.height * WATER_RIPPLE_FRAC
      }

      if (bottleTouchPinnedRef.current) {
        const pin0 = bottlePinEnterScrollYRef.current
        if (pin0 != null && y < pin0 - BOTTLE_PIN_SCROLL_UP_LEAVE) {
          const flip = bottleFlipRef.current
          if (flip) {
            flipUnpinFirstRef.current = flip.getBoundingClientRect()
            flip.style.opacity = ""
          } else {
            flipUnpinFirstRef.current = null
          }
          bottleTouchPinnedRef.current = false
          bottlePinEnterScrollYRef.current = null
          setBottleTouchPinned(false)
        } else {
          // Anchored at the barrier: fade the bottle out as the rising water sweeps
          // up over it, so it disappears behind the water and stays hidden past this
          // point. Fades back in (and later unpins) only when the user scrolls up.
          const flip = bottleFlipRef.current
          if (flip && rippleY != null) {
            const fr = flip.getBoundingClientRect()
            const topY = fr.top + BOTTLE_SUBMERGE_TOP_FRAC * fr.height
            const botY = fr.top + BOTTLE_SUBMERGE_BOT_FRAC * fr.height
            const span = Math.max(1, botY - topY)
            const op = Math.max(0, Math.min(1, (rippleY - topY) / span))
            flip.style.opacity = String(op)
            if (op < SHORE_BOTTLE_SUNK_OPACITY) {
              skyBottleHasSunkRef.current = true
            }
          }
        }
      } else if (bottleSpot) {
        const flip = bottleFlipRef.current
        if (flip) flip.style.opacity = ""
        const br = bottleSpot.getBoundingClientRect()
        const bottleMidY = br.top + br.height / 2
        const viewMidY = window.innerHeight / 2
        if (!nearBottom && bottleMidY <= viewMidY && br.bottom > 32) {
          if (flip) flipPinFirstRef.current = flip.getBoundingClientRect()
          else flipPinFirstRef.current = null
          bottlePinEnterScrollYRef.current = y
          bottleTouchPinnedRef.current = true
          setBottleTouchPinned(true)
        }
      }

      // Shore rematch: trigger a slow autonomous drift once the sky bottle has sunk
      // and the shore is just entering the viewport (earlier than a mid-shore scrub).
      const shore = shoreRef.current
      if (shore) {
        const rect = shore.getBoundingClientRect()
        const vh = window.innerHeight
        if (rect.top > vh * SHORE_BOTTLE_RESET_FRAC) {
          if (shoreBottlePlayedRef.current) {
            shoreBottlePlayedRef.current = false
            setShoreBottlePlaying(false)
          }
        } else if (
          skyBottleHasSunkRef.current &&
          !shoreBottlePlayedRef.current &&
          rect.top < vh * SHORE_BOTTLE_TRIGGER_FRAC
        ) {
          shoreBottlePlayedRef.current = true
          setShoreBottlePlaying(true)
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

  // Reduced-motion path has no CSS animationend — clear the quiet mid-pose after a beat.
  useEffect(() => {
    if (!shoreBottlePlaying || typeof window === "undefined") return undefined
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!reduce) return undefined
    const t = window.setTimeout(() => setShoreBottlePlaying(false), 2200)
    return () => window.clearTimeout(t)
  }, [shoreBottlePlaying])

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
        <CompositionRoot ref={compositionRef}>
          <FlowSizer>
            <ParallaxBack
              ref={parallaxBackRef}
            >
              <BackRailImg src={ASSETS.back} alt="Wiki front — background scenery" />
            </ParallaxBack>
          </FlowSizer>
          <BirdsStack aria-hidden="true">
            {BIRDS.map((bird, i) => (
              <BirdParallax
                key={bird.id}
                ref={(el) => {
                  birdParallaxRefs.current[i] = el
                }}
              >
                <BirdDrift
                  $enabled={bird.depth === "back"}
                  $durationMs={bird.driftMs || 36000}
                  $delayMs={bird.driftDelayMs || 0}
                >
                  <BirdHoverMotion $delayMs={bird.delayMs}>
                    <BirdFlapper>
                      <BirdFrame
                        $phase="a"
                        $durationMs={bird.flapMs}
                        $delayMs={bird.delayMs}
                        src={bird.a}
                        alt=""
                      />
                      <BirdFrame
                        $phase="b"
                        $durationMs={bird.flapMs}
                        $delayMs={bird.delayMs}
                        src={bird.b}
                        alt=""
                      />
                    </BirdFlapper>
                  </BirdHoverMotion>
                </BirdDrift>
              </BirdParallax>
            ))}
          </BirdsStack>
          <ForegroundBand
            $topFrac={BACK_TOP_EXTENSION_FRAC}
            $heightFrac={BACK_LEGACY_BAND_FRAC}
          >
            <OverlayStack>
              <OverlaySlice $z={Z.front}>
                <RailImg src={ASSETS.front} alt="" />
              </OverlaySlice>
              <OverlaySlice $z={Z.text} $interactive>
                <WaterfallSideText />
              </OverlaySlice>
              <OverlaySlice $z={Z.logo}>
                <LogoShiftWrap>
                  <LogoFloatWrap>
                    <RailImg src={ASSETS.logo} alt="PETABITE" />
                  </LogoFloatWrap>
                </LogoShiftWrap>
              </OverlaySlice>
              <OverlaySlice $z={Z.bottle}>
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
              </OverlaySlice>
              <OverlaySlice $z={Z.water}>
                <RailImg ref={waterRef} src={ASSETS.water} alt="" />
              </OverlaySlice>
            </OverlayStack>
          </ForegroundBand>
        </CompositionRoot>

        <SwipeInBox
          getProgress={getConditionsProgress}
          enterEnd={CONDITIONS_ENTER_END}
          holdEnd={CONDITIONS_HOLD_END}
          title="... we need 3 specific conditions:"
        >
          <ConditionImageRow>
            {CONDITION_CARD_IMAGES.map((image) => (
              <ConditionFigure key={image.alt}>
                <ConditionImage src={image.src} alt={image.alt} />
                <ConditionCaption>{image.alt}</ConditionCaption>
              </ConditionFigure>
            ))}
          </ConditionImageRow>
        </SwipeInBox>

        <DrawnShoreSection ref={shoreRef}>
          <ShoreFlowSizer>
            <ShoreRailImg src={SHORE_ASSETS.waterBg} alt="" />
          </ShoreFlowSizer>
          <ShoreOverlayStack>
            <ShoreLayer $z={1}>
              <ShoreRailImg src={SHORE_ASSETS.waterDetails} alt="" />
            </ShoreLayer>
            <ShoreLayer $z={2}>
              <ShoreStackImg src={SHORE_ASSETS.sand} alt="" />
              <ShoreStackImg src={SHORE_ASSETS.grass} alt="" />
            </ShoreLayer>
            <ShoreBottleLayer $z={3}>
              <ShoreBottleMount
                $playing={shoreBottlePlaying}
                onAnimationEnd={(e) => {
                  if (e.target !== e.currentTarget) return
                  setShoreBottlePlaying(false)
                }}
              >
                <ShoreBottleSize>
                  <ShoreBottleCrop>
                    <ShoreBottleRock $playing={shoreBottlePlaying}>
                      <ShoreBottleImg src={BOTTLE_STAGES.section1} alt="" />
                    </ShoreBottleRock>
                  </ShoreBottleCrop>
                </ShoreBottleSize>
              </ShoreBottleMount>
            </ShoreBottleLayer>
            <ShoreTextLayer $z={4}>
              <ShoreTextMount>
                <ShoreBody>
                  That&apos;s why our team has developed the LOGAN index: a planetary sequence
                  search that discovers novel plastic-degrading enzymes.
                </ShoreBody>
                <ShoreBody $spaced>
                  Before, the industry was using an enzyme dataset of roughly 200. With our
                  advisory lab, the{" "}
                  <ExplainTerm
                    term="RNAlab"
                    explanation={RNALAB_EXPLANATION}
                    imageSrc={RNALAB_TEXTBOX_IMG}
                    imageAlt="RNAlab"
                  />
                  , the team uncovered 215.7 million high-quality plastic‑degrading enzymes — a
                  1,000,000‑fold increase from the enzyme landscape previously known.
                </ShoreBody>
              </ShoreTextMount>
            </ShoreTextLayer>
          </ShoreOverlayStack>
        </DrawnShoreSection>

        <HomeNavMount $pinned={navPinned}>
          <WikiTopBar />
        </HomeNavMount>
      </ScrollStack>

      <PetadexBottlePath petadexRef={petadexRef} onBattle={() => setBattleOpen(true)}>
        <div ref={petadexRef}>
          <Petadex />
        </div>
      </PetadexBottlePath>

      <EnzymeBattle isOpen={battleOpen} onClose={() => setBattleOpen(false)} />

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

/** Absolute at rest; `fixed` while scrolling through mockup so nav stays reachable. */
const HomeNavMount = styled.div`
  position: ${({ $pinned }) => ($pinned ? "fixed" : "absolute")};
  top: 0;
  left: 0;
  right: 0;
  z-index: ${WIKI_TOP_BAR_Z_INDEX};
`

const CompositionRoot = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
  overflow: visible;
`

/** Full-bleed shore under the waterfall; height from water-bg art. */
const DrawnShoreSection = styled.section`
  position: relative;
  z-index: 0;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  background: #000;
`

const ShoreFlowSizer = styled.div`
  width: 100%;
  pointer-events: none;
`

const ShoreOverlayStack = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
`

const ShoreLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${({ $z }) => $z};
  display: flex;
  align-items: flex-start;
  justify-content: center;
`

const ShoreTextLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${({ $z }) => $z};
  pointer-events: none;
`

/** Rematched section1 bottle: autonomous slow drift along the river, under shore copy. */
const ShoreBottleLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${({ $z }) => $z};
  pointer-events: none;
  overflow: hidden;
`

/**
 * Path: appear high on the right early, drift mostly downward for a long stretch,
 * then sweep left to exit near the end.
 * Linear timing so it does not ease/idle at each waypoint.
 */
const shoreBottleDrift = keyframes`
  0% {
    left: 104%;
    top: 10%;
    opacity: 0;
  }
  4% {
    left: 102%;
    top: 14%;
    opacity: 1;
  }
  45% {
    left: 96%;
    top: 42%;
    opacity: 1;
  }
  68% {
    left: 90%;
    top: 64%;
    opacity: 1;
  }
  82% {
    left: 58%;
    top: 74%;
    opacity: 1;
  }
  100% {
    left: -16%;
    top: 82%;
    opacity: 1;
  }
`

const ShoreBottleMount = styled.div`
  position: absolute;
  left: 104%;
  top: 10%;
  width: 25%;
  max-width: 12rem;
  transform: translate3d(-50%, -55%, 0);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  ${({ $playing }) =>
    $playing
      ? css`
          visibility: visible;
          animation: ${shoreBottleDrift} ${SHORE_BOTTLE_DRIFT_MS}ms linear forwards;
        `
      : css`
          animation: none;
        `}

  @media (prefers-reduced-motion: reduce) {
    ${({ $playing }) =>
      $playing
        ? css`
            /* Keep a quiet mid-path pose; no long drift. */
            visibility: visible;
            animation: none;
            left: 92%;
            top: 48%;
            opacity: 0.9;
          `
        : css`
            animation: none;
          `}
  }
`

/** Match sky bottle display size (width set on mount vs shore box). */
const ShoreBottleSize = styled.div`
  width: 100%;
`

/** Top-third crop via overflow so rock/drop-shadow stay natural. */
const ShoreBottleCrop = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  line-height: 0;
`

const shoreBottleRock = keyframes`
  0%,
  100% {
    transform: rotate(-5deg) translate3d(0, 0, 0);
  }
  50% {
    transform: rotate(5deg) translate3d(0, -4px, 0);
  }
`

const ShoreBottleRock = styled.div`
  width: 100%;
  transform-origin: 50% 70%;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.28));

  ${({ $playing }) =>
    $playing
      ? css`
          animation: ${shoreBottleRock} 2.4s ease-in-out infinite;
        `
      : css`
          animation: none;
        `}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
`

const ShoreBottleImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
`

/** Sits on the sand bank (left/center of the shore art). */
const ShoreTextMount = styled.div`
  position: absolute;
  top: 20%;
  left: max(env(safe-area-inset-left, 0px), 5%);
  width: min(34%, 26rem);
  max-width: calc(100% - 14%);
  box-sizing: border-box;
  pointer-events: auto;

  @media (max-width: 720px) {
    top: 20%;
    left: max(env(safe-area-inset-left, 0px), 4%);
    width: min(42%, 40vw);
  }
`

const ShoreBody = styled.p`
  margin: ${({ $spaced }) => ($spaced ? "0.75em 0 0" : "0")};
  color: #51594a;
  font-family: var(--font-body);
  /* Scale with page width (vw), not the capped textbox, so type grows as the art widens. */
  font-size: clamp(1.05rem, 2vw, 2.1rem);
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: break-word;
`

const ConditionImageRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1rem, 2.4vw, 1.75rem);
  margin-top: clamp(1.1rem, 2.2vw, 1.75rem);
  align-items: start;
`

const ConditionFigure = styled.figure`
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
`

const ConditionImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-height: clamp(14rem, 36vw, 24rem);
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
`

const ConditionCaption = styled.figcaption`
  margin: 0;
  color: #fff;
  font-family: var(--font-body);
  font-size: clamp(1.2rem, 2.8vw, 1.85rem);
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 0 12px rgba(0, 0, 0, 0.35);
`

const ShoreRailImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
`

/** Sand and grass share the foreground frame; stacked absolute. */
const ShoreStackImg = styled(ShoreRailImg)`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: auto;
`

const RailImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
`

const FlowSizer = styled.div`
  width: 100%;
  pointer-events: none;
  overflow: hidden;
`

const ParallaxBack = styled.div`
  width: 100%;
  will-change: auto;

  @media (prefers-reduced-motion: reduce) {
    transform: none !important;
    will-change: auto;
  }
`

const BackRailImg = styled(RailImg)`
  transform: scale(1.04);
  transform-origin: center top;
`

const BirdsStack = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: auto;
  overflow: hidden;
`

const BirdParallax = styled.div`
  position: absolute;
  inset: 0;
  will-change: auto;
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    transform: none !important;
    will-change: auto;
  }
`

const birdFlapA = keyframes`
  0%,
  49.9% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
`

const birdFlapB = keyframes`
  0%,
  49.9% {
    opacity: 0;
  }
  50%,
  100% {
    opacity: 1;
  }
`

const birdHoverBob = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -10px, 0);
  }
`

const birdHoverBobStrong = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, -18px, 0) scale(1.02);
  }
`

const birdFlyAcross = keyframes`
  0%,
  18% {
    transform: translate3d(0, 0, 0);
  }
  72% {
    transform: translate3d(-115%, 0, 0);
  }
  72.01% {
    transform: translate3d(115%, 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
`

const BirdDrift = styled.div`
  position: absolute;
  inset: 0;

  ${({ $enabled, $durationMs, $delayMs }) =>
    $enabled &&
    css`
      animation: ${birdFlyAcross} ${$durationMs || 36000}ms linear infinite;
      animation-delay: ${$delayMs || 0}ms;
    `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const BirdHoverMotion = styled.div`
  position: absolute;
  inset: 0;
  transform-origin: center center;
  animation: ${birdHoverBob} 3.6s ease-in-out infinite;
  animation-delay: ${({ $delayMs }) => `${($delayMs || 0) * 0.5}ms`};

  ${BirdsStack}:hover & {
    animation-name: ${birdHoverBobStrong};
    animation-duration: 2.4s;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const BirdFlapper = styled.div`
  position: absolute;
  inset: 0;
`

const BirdFrame = styled.img`
  position: absolute;
  left: 0;
  top: 0;
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  user-select: none;
  pointer-events: none;
  opacity: ${({ $phase }) => ($phase === "a" ? 1 : 0)};
  animation-name: ${({ $phase }) => ($phase === "a" ? birdFlapA : birdFlapB)};
  animation-duration: ${({ $durationMs }) => `${$durationMs || 520}ms`};
  animation-delay: ${({ $delayMs }) => `${$delayMs || 0}ms`};
  animation-timing-function: steps(1, end);
  animation-iteration-count: infinite;

  ${BirdsStack}:hover & {
    animation-duration: ${({ $durationMs }) => `${Math.round(($durationMs || 520) * 0.72)}ms`};
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: ${({ $phase }) => ($phase === "a" ? 1 : 0)};
  }
`

/** Positions legacy overlays in the lower band of the taller back art. */
const ForegroundBand = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  top: ${({ $topFrac }) => `${$topFrac * 100}%`};
  height: ${({ $heightFrac }) => `${$heightFrac * 100}%`};
  z-index: 2;
  pointer-events: none;
  overflow: visible;
`

const OverlayStack = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
`

const OverlaySlice = styled.div`
  position: absolute;
  inset: 0;
  z-index: ${({ $z }) => $z};
  display: flex;
  align-items: flex-start;
  justify-content: center;
  pointer-events: ${({ $interactive }) => ($interactive ? "auto" : "none")};
  overflow: visible;
`

/** Nudge PETABITE title up within the legacy art band (negative = higher). */
const LOGO_SHIFT_FRAC = -0.3

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

/** Very slow, subtle sway only while the bottle is in touch "sticky" (fixed) mode. */
const bottleStickyRock = keyframes`
  0%,
  100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(10deg);
  }
`

/** Subtle idle rotation while bottle is pinned (fixed); off during normal scroll. */
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

const LogoShiftWrap = styled.div`
  width: 100%;
  height: 100%;
  transform: translate3d(0, ${LOGO_SHIFT_FRAC * 100}%, 0);
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
          position: absolute;
          left: 0;
          right: 0;
          top: ${BOTTLE_TOP_FRAC * 100}%;
        `}
`

/** Centers the bottle; inner wrap adds idle float. */
const BottleShiftWrap = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`

const BottleFloatWrap = styled.div`
  width: 25%;
  max-width: 12rem;
  animation: ${bottleIdleFloat} 1.5s ease-in-out infinite;
  animation-delay: -0.7s;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`