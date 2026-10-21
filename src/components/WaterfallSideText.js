import React, { useLayoutEffect, useRef } from "react"
import styled, { css, keyframes } from "styled-components"
import { ExplainTerm } from "./ExplainTermPopover.js"
import { artFont, artPx, inputCopyCss, phone, phoneSize } from "./artScale.js"

/** The popovers' text (drawn as text, in a box like the artwork's: `plain`). */
export const PETASE_EXPLANATION =
  "Specialized enzymes like PETases, MHETases, and engineered LCC cutinases cut the chemical bonds that hold PET together. PET is the plastic in most drink bottles and polyester fibres. These enzymes break the PET down into smaller pieces and finally into its two monomers, terephthalic acid and ethylene glycol, which can be recovered and used to make new plastic."

const MICROPLASTICS_EXPLANATION =
  "Plastic particles have been detected in human blood (Leslie et al., 2022) and lung tissue (Jenner et al., 2022). In a 2024 study of 257 patients after carotid surgery, those with microplastics in plaque had a higher risk of heart attack, stroke or death over 34 months (Marfella et al., NEJM). These are still associations, and further research is being conducted on the extent to the impacts of microplastic pollution."

const EXCLAMATION_SRC =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/exclamation.avif"

/** Horizontal offset from the left edge of the mockup composition (%). */
export const WATERFALL_TEXT_LEFT_PCT = 5

/** Vertical offset from the top of the waterfall band (%). */
export const WATERFALL_TEXT_TOP_PCT = 52

/** Vertical offset for right-side copy. */
export const WATERFALL_TEXT_RIGHT_TOP_PCT = 61

/**
 * Preferred width as % of mockup composition (left column).
 * Right column uses left→right edge fill instead of a fixed %.
 */
export const WATERFALL_TEXT_WIDTH_PCT = 30

/**
 * Type scales with viewport width. Floors are low so mid/narrow windows shrink;
 * maxes keep the current desktop look.
 */
export const WATERFALL_BODY_PX = 29.52
const WATERFALL_BANG_WIDTH = artPx(68)
/** The popup hint's smallest size (px), under the art copy's floor. */
const HINT_FONT_MIN_PX = 9

/** Viewport px from top where faded copy reaches full opacity. */
export const WATERFALL_TEXT_FADE_FULL_AT_PX = 150

/** Viewport px from top where fade begins (0 = screen top; raise to sit below nav). */
export const WATERFALL_TEXT_FADE_START_AT_PX = 0

/** Mask alpha at the top of the fade band (0–1). */
export const WATERFALL_TEXT_FADE_MIN_ALPHA = 0.28

function clearViewportTopFade(el) {
  el.style.maskImage = ""
  el.style.webkitMaskImage = ""
}

/** Opacity at a viewport Y inside the fade band (used for mask gradient stops). */
function viewportFadeAlpha(viewportY, fadeStartVp, fadeEndVp, minA) {
  if (viewportY >= fadeEndVp) return 1
  if (viewportY <= fadeStartVp) return minA
  const t = (viewportY - fadeStartVp) / (fadeEndVp - fadeStartVp)
  return minA + (1 - minA) * t
}

function applyViewportTopFade(el) {
  const rect = el.getBoundingClientRect()
  const fadeStartVp = WATERFALL_TEXT_FADE_START_AT_PX
  const fadeEndVp = WATERFALL_TEXT_FADE_FULL_AT_PX
  const minA = WATERFALL_TEXT_FADE_MIN_ALPHA

  if (rect.bottom <= 0 || rect.top >= fadeEndVp) {
    clearViewportTopFade(el)
    return
  }

  const topAlpha = viewportFadeAlpha(rect.top, fadeStartVp, fadeEndVp, minA)
  const localFadeEnd = fadeEndVp - rect.top

  if (topAlpha >= 0.995 || localFadeEnd <= 0) {
    clearViewportTopFade(el)
    return
  }

  const mask = `linear-gradient(to bottom, rgba(0,0,0,${topAlpha}) 0px, rgba(0,0,0,1) ${localFadeEnd}px)`
  el.style.maskImage = mask
  el.style.webkitMaskImage = mask
}

function useViewportTopFade(mountRef) {
  useLayoutEffect(() => {
    const el = mountRef.current
    if (!el || typeof window === "undefined") return undefined

    const motionMq =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null
    if (motionMq?.matches) return undefined

    let raf = 0
    const update = () => {
      raf = 0
      applyViewportTopFade(el)
    }
    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, {
      passive: true,
      capture: true,
    })
    window.addEventListener("resize", schedule, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("scroll", schedule, { capture: true })
      window.removeEventListener("resize", schedule)
      clearViewportTopFade(el)
    }
  }, [mountRef])
}

/**
 * Waterfall-band copy on the home scroll mockup (left + right of the fall).
 * Positioning is percentage-based so it tracks the waterfall ArtBand on resize.
 */
export function WaterfallSideText() {
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  useViewportTopFade(leftRef)
  useViewportTopFade(rightRef)

  return (
    <>
      <TextMount ref={leftRef} $side="left">
        <Body>
          The world produces over 400 million tonnes of plastic each year —
          only a fraction of that is disposed of responsibly. The rest are left
          to degrade, fragmenting into{" "}
          <ExplainTerm
            term="microplastics"
            explanation={MICROPLASTICS_EXPLANATION}
            plain
          />{" "}
          (plastic {"<"}5 millimetres in size).
        </Body>
        <PopupHintBlock />
      </TextMount>

      <TextMount ref={rightRef} $side="right">
        <Body $side="right">
          Microplastics have been found in ecosystems, infrastructure, and human
          tissue. Elevated levels of microplastics found in human tissue have
          been associated with adverse health outcomes, like increased risk of
          heart disease.
        </Body>
      </TextMount>
    </>
  )
}

/** How to open the red underlined words: under the left bank's lines, where there's room. */
function PopupHintBlock() {
  return (
    <PopupHint>
      <BangHover aria-hidden>
        <BangImg src={EXCLAMATION_SRC} alt="" />
      </BangHover>
      <HintText>
        <span className="hover-copy">
          Hover red underlined words for a popup, click to pin it open / close.
        </span>
        <span className="touch-copy">
          <span className="wide-copy">
            Tap red underlined words for a popup, tap again to close.
          </span>
          <span className="phone-copy">
            Tap red words for a popup, and again to close.
          </span>
        </span>
      </HintText>
    </PopupHint>
  )
}

export default WaterfallSideText

const TextMount = styled.div`
  position: absolute;
  top: ${({ $side }) =>
    $side === "right" ? WATERFALL_TEXT_RIGHT_TOP_PCT : WATERFALL_TEXT_TOP_PCT}%;
  box-sizing: border-box;
  container-type: inline-size;
  pointer-events: auto;
  z-index: 1;
  overflow: visible;
  mask-size: 100% 100%;
  -webkit-mask-size: 100% 100%;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;

  /* Phones get shorter copy. */
  .phone-copy {
    display: none;
  }

  ${phone} {
    .wide-copy {
      display: none;
    }

    .phone-copy {
      display: inline;
    }
  }

  ${({ $side }) =>
    $side === "left"
      ? css`
          left: ${WATERFALL_TEXT_LEFT_PCT}%;
          width: ${WATERFALL_TEXT_WIDTH_PCT}%;
          max-width: 100%;
          padding-right: 2%;
          padding-left: 2%;

          /* Phones: fits the left bank, clear of the falls, well under the
             dark sewer mouth (its copy's shorter, so the popup hint under it
             still stays on the bank). */
          ${phone} {
            top: ${WATERFALL_TEXT_TOP_PCT + 2}%;
            left: 4%;
            width: 34%;
          }
        `
      : css`
          /* Compact column on the right bank — not full remaining width. */
          left: auto;
          right: 3%;
          width: ${artPx(416)};

          /* Only on the bank (from 65% across), clear of the falls and the
             edge, and well under the yellow pipe. */
          ${phone} {
            top: ${WATERFALL_TEXT_RIGHT_TOP_PCT + 2}%;
            width: 29%;
            right: 3%;
            padding-left: 0;
          }
          padding-left: 2%;
          padding-right: 0;
          text-align: center;
        `}
`

const Body = styled.p`
  margin: ${({ $spaced }) => ($spaced ? "0.75em 0 0" : "0")};
  color: rgba(255, 255, 255, 0.92);
  font-family: var(--font-body);
  ${artFont(WATERFALL_BODY_PX)}
  font-weight: 400;
  line-height: 1.4;
  overflow-wrap: break-word;
  overflow: visible;

  ${phone} {
    font-size: ${({ $side }) => phoneSize($side === "right" ? 0.44 : 0.56)};
  }
`

const bangHover = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -5px, 0);
  }
`

const bangHoverStrong = keyframes`
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -8px, 0);
  }
`

const PopupHint = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: ${artPx(7.2)};
  margin: ${artPx(16)} 0 0;
  width: 100%;
  max-width: 100%;

  ${phone} {
    margin-top: 0.3em;
  }
`

const BangHover = styled.span`
  flex: 0 0 auto;
  display: block;
  animation: ${bangHover} 2.4s ease-in-out infinite;

  ${PopupHint}:hover & {
    animation-name: ${bangHoverStrong};
    animation-duration: 1.6s;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const BangImg = styled.img`
  display: block;
  width: ${WATERFALL_BANG_WIDTH};
  height: auto;
  user-select: none;
  pointer-events: none;
`

const HintText = styled.span`
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
  color: #e63946;
  font-family: var(--font-body);
  /* Less important than the lines around it, so it may shrink below their floor. */
  font-size: max(${HINT_FONT_MIN_PX}px, ${artPx(18)});
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: break-word;

  ${phone} {
    font-size: ${phoneSize(0.55)};
  }

  ${inputCopyCss}
`
