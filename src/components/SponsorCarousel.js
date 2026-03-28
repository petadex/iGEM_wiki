import React, { useCallback, useEffect, useRef, useState } from "react"
import styled from "styled-components"
import { SPONSORS } from "../data/sponsors.js"

const AUTO_ADVANCE_MS = 4500
const SLIDE_MS = 480

/** Five strip positions map to active + (pos - 2) with wrap. */
const STRIP_POS = [0, 1, 2, 3, 4]

function wrapIndex(i, len) {
  if (len === 0) return 0
  return ((i % len) + len) % len
}

function sponsorIndexAtStripPos(active, pos, count) {
  return wrapIndex(active + (pos - 2), count)
}

/**
 * Infinite-style strip: 5 sponsors in the track; viewport shows 3.
 * Resting translate shows [active-1, active, active+1]. Next slides to show
 * [active, active+1, active+2] — the +2 card is already in the DOM, so no gap.
 * Then we snap translate back (no transition) and bump active.
 */
export function SponsorCarousel() {
  const count = SPONSORS.length
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  /** 1 = resting (middle trio); 2 = slid next; 0 = slid prev */
  const [offsetMult, setOffsetMult] = useState(1)
  const [instant, setInstant] = useState(false)
  const [slide, setSlide] = useState(null)

  const slideRef = useRef(null)
  slideRef.current = slide

  const startSlide = useCallback(
    (dir) => {
      if (count <= 1 || slideRef.current !== null) return
      setInstant(false)
      if (dir === "next") {
        setSlide("next")
        setOffsetMult(2)
      } else {
        setSlide("prev")
        setOffsetMult(0)
      }
    },
    [count]
  )

  const onTrackTransitionEnd = useCallback(
    (e) => {
      if (e.target !== e.currentTarget) return
      if (e.propertyName !== "transform") return
      if (slide !== "next" && slide !== "prev") return

      const dir = slide
      setInstant(true)
      setActive((a) => wrapIndex(a + (dir === "next" ? 1 : -1), count))
      setOffsetMult(1)
      setSlide(null)

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setInstant(false))
      })
    },
    [slide, count]
  )

  useEffect(() => {
    if (count <= 1 || paused) return
    const id = window.setInterval(() => {
      if (slideRef.current !== null) return
      startSlide("next")
    }, AUTO_ADVANCE_MS)
    return () => window.clearInterval(id)
  }, [count, paused, startSlide])

  if (count === 0) return null

  const showArrows = count > 1

  const trackTransform =
    count === 1 ? "translateX(0)" : `translateX(calc(-1 * ${offsetMult} * var(--sd)))`

  /**
   * While the track is moving, `offsetMult` jumps (1→2 or 1→0) immediately so the next
   * cell is “center” for styling — but the slide hasn’t caught up yet, so scale/opacity
   * fight the transform. Only apply center vs edge when idle (`slide == null`).
   */
  const emphasize = count === 1 || slide === null
  const centerStripPos = offsetMult + 1

  return (
    <Wrap
      aria-label="Sponsors"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Row>
        {showArrows ? (
          <Arrow
            type="button"
            onClick={() => startSlide("prev")}
            disabled={slide !== null}
            aria-label="Previous sponsor"
          >
            ‹
          </Arrow>
        ) : (
          <ArrowSpacer aria-hidden />
        )}
        <Viewport $single={count === 1}>
          <Track
            style={{
              transform: trackTransform,
              transition: instant
                ? "none"
                : `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            }}
            onTransitionEnd={count > 1 ? onTrackTransitionEnd : undefined}
          >
            {count === 1 ? (
              <Slot key="only">
                <SlotVisual $emphasize $center>
                  <SponsorCard sponsor={SPONSORS[0]} $edge={false} />
                </SlotVisual>
              </Slot>
            ) : (
              STRIP_POS.map((pos) => {
                const idx = sponsorIndexAtStripPos(active, pos, count)
                const sponsor = SPONSORS[idx]
                const isCenter = emphasize && pos === centerStripPos
                return (
                  <Slot key={pos}>
                    <SlotVisual $emphasize={emphasize} $center={isCenter}>
                      <SponsorCard sponsor={sponsor} $edge={emphasize && !isCenter} />
                    </SlotVisual>
                  </Slot>
                )
              })
            )}
          </Track>
        </Viewport>
        {showArrows ? (
          <Arrow
            type="button"
            onClick={() => startSlide("next")}
            disabled={slide !== null}
            aria-label="Next sponsor"
          >
            ›
          </Arrow>
        ) : (
          <ArrowSpacer aria-hidden />
        )}
      </Row>
    </Wrap>
  )
}

function SponsorCard({ sponsor, $edge }) {
  const inner = sponsor.logoSrc ? (
    <Logo src={sponsor.logoSrc} alt={sponsor.name} $edge={$edge} />
  ) : (
    <Name $edge={$edge}>{sponsor.name}</Name>
  )

  if (sponsor.href) {
    return (
      <CardLink href={sponsor.href} target="_blank" rel="noopener noreferrer" $edge={$edge}>
        {inner}
      </CardLink>
    )
  }

  return <CardStatic $edge={$edge}>{inner}</CardStatic>
}

const Wrap = styled.div`
  font-family: var(--font-body);
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  user-select: none;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
`

const Viewport = styled.div`
  --slot: 5.35rem;
  --sg: 0.55rem;
  --sd: calc(var(--slot) + var(--sg));

  width: ${(p) =>
    p.$single ? "var(--slot)" : "calc(3 * var(--slot) + 2 * var(--sg))"};
  max-width: 100%;
  overflow: hidden;
  position: relative;
  border-radius: 0.45rem;
`

const Track = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--sg);
  width: max-content;
  will-change: transform;
  backface-visibility: hidden;
`

const Slot = styled.div`
  flex-shrink: 0;
  width: var(--slot);
  height: var(--slot);
  display: flex;
  align-items: center;
  justify-content: center;
`

const SlotVisual = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
  transform: ${(p) =>
    !p.$emphasize ? "scale(1)" : p.$center ? "scale(1.06)" : "scale(0.9)"};
  opacity: ${(p) => (!p.$emphasize ? 1 : p.$center ? 1 : 0.5)};
  transition: ${(p) =>
    p.$emphasize ? "transform 0.28s ease, opacity 0.28s ease" : "none"};
`

const ArrowSpacer = styled.span`
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
`

const Arrow = styled.button`
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 1.05rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const cardBase = `
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0.3rem;
  border: 1px solid var(--color-muted);
  border-radius: 0.4rem;
  background: var(--color-bg);
  text-align: center;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
`

const CardLink = styled.a`
  ${cardBase}
  text-decoration: none;
  color: var(--color-text);

  &:hover {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 1px var(--color-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const CardStatic = styled.div`
  ${cardBase}
  color: var(--color-muted);
`

const Name = styled.span`
  font-size: ${(p) => (p.$edge ? "0.62rem" : "0.72rem")};
  font-weight: 600;
  line-height: 1.2;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Logo = styled.img`
  max-width: 100%;
  max-height: ${(p) => (p.$edge ? "2rem" : "2.5rem")};
  width: auto;
  height: auto;
  object-fit: contain;
`
