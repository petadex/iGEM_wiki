import React, { useEffect, useState } from "react"
import styled, { css } from "styled-components"

const AUTO_ADVANCE_MS = 7000
const READOUTS = {
  antibiotic: {
    steps: [
      {
        key: "embed",
        label: "Copper is fused into PET",
        caption:
          "Copper is melted into the PET film; the cell carries an un-induced antibiotic resistance plasmid.",
      },
      {
        key: "release",
        label: "PETase releases copper, inducing resistance",
        caption:
          "PETase degrades the PET and releases copper, which induces the resistance plasmid. Cells with good PETases survive.",
      },
    ],
    inducedLabel: "Cell with copper\ninduced antibiotic\nresistance plasmid",
    uninducedLabel: "Cell with\nun induced\nantibiotic\nresistance plasmid",
    inducedColor: "#f5e6ac",
  },
  gfp: {
    steps: [
      {
        key: "embed",
        label: "Copper is fused into PET",
        caption:
          "Copper is melted into the PET film; the cell carries an un-induced GFP plasmid.",
      },
      {
        key: "release",
        label: "PETase releases copper, inducing GFP",
        caption:
          "PETase degrades the PET and releases copper, which induces GFP expression. Cells with good PETases turn green.",
      },
    ],
    inducedLabel: "Cell with\ncopper induced\nGFP plasmid",
    uninducedLabel: "Cell with\nun induced\nGFP\nplasmid",
    inducedColor: "#3fd63f",
  },
}

const DOT_SIZE = 16
const DOT_GAP = 8
const FILM_PAD_X = 9
const FILM_PAD_Y = 40
const FILM_COLS = 2
const FILM_DOT_COUNT = 7

const JITTER_X = [-2, 2, -1, 1, -2, 2, 0]

function buildFilmDots(count) {
  const heroIndex = Math.floor((count - 1) / 2)
  return Array.from({ length: count }, (_, i) => {
    const col = i % FILM_COLS
    const row = Math.floor(i / FILM_COLS)
    const left = FILM_PAD_X + col * (DOT_SIZE + DOT_GAP) + (JITTER_X[i % JITTER_X.length] || 0)
    const top = FILM_PAD_Y + row * (DOT_SIZE + DOT_GAP)
    return { left, top, hero: i === heroIndex }
  })
}

const FILM_DOTS = buildFilmDots(FILM_DOT_COUNT)
const FILM_ROWS = Math.ceil(FILM_DOT_COUNT / FILM_COLS)
const FILM_WIDTH = FILM_PAD_X * 2 + FILM_COLS * DOT_SIZE + (FILM_COLS - 1) * DOT_GAP + 4
const FILM_HEIGHT = FILM_PAD_Y * 2 + FILM_ROWS * DOT_SIZE + (FILM_ROWS - 1) * DOT_GAP

const HERO_DOT = FILM_DOTS.find((d) => d.hero)

const CELL_WIDTH = 110
const CELL_HEIGHT = 110
const CELL_LEFT = 84
const CELL_CENTER_Y = FILM_HEIGHT / 2 + 40
const CELL_TOP = CELL_CENTER_Y - CELL_HEIGHT / 2
const CELL_CENTER_X = FILM_WIDTH + CELL_LEFT + CELL_WIDTH / 2

const COPPER_TARGET_X = CELL_CENTER_X - HERO_DOT.left - 5
const COPPER_TARGET_Y = CELL_CENTER_Y - HERO_DOT.top - 45

const FULL_CLIP = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
const notchTopPct = (((HERO_DOT.top - 6) / FILM_HEIGHT) * 100).toFixed(1)
const notchMidPct = (((HERO_DOT.top + DOT_SIZE / 2) / FILM_HEIGHT) * 100).toFixed(1)
const notchBotPct = (((HERO_DOT.top + DOT_SIZE + 6) / FILM_HEIGHT) * 100).toFixed(1)
const NOTCHED_CLIP = `polygon(0% 0%, 100% 0%, 100% ${notchTopPct}%, 55% ${notchMidPct}%, 100% ${notchBotPct}%, 100% 100%, 0% 100%)`

/* Renders the film + PETase/cell pairing for one step. induced=false is
   the "before" state, induced=true is the "after" state. Every visual
   change here is driven by CSS transitions, not one-shot keyframe
   animations, so toggling `induced` in either direction — forward via
   the auto-advance timer, or backward/forward via clicking a step dot —
   always animates cleanly instead of only working one way. */
const AssayScene = ({ induced, config }) => (
  <Scene>
    <PetFilm $eaten={induced}>
      {FILM_DOTS.map((dot, i) => (
        <FilmDot
          key={i}
          style={{ left: dot.left, top: dot.top }}
          $hidden={dot.hero && induced}
        />
      ))}
    </PetFilm>

    <Track>
      {/* Permanent link — PETase is produced by this same reporter cell */}
      <Bind />
      <PetaseIcon />
      <ReporterCell $induced={induced} $color={config.inducedColor}>
        {(induced ? config.inducedLabel : config.uninducedLabel)
          .split("\n")
          .map((line, i) => (
            <span key={i}>{line}</span>
          ))}
      </ReporterCell>
    </Track>

    {/* The copper particle that escapes the film and ends up visible
        inside the cell. Transitions between its start (at the hero dot)
        and end (inside the cell) positions, so it works both ways. */}
    <HeroCopper $active={induced} />
  </Scene>
)

const CopperReleaseAnimation = ({ readout }) => {
  const config = READOUTS[readout]
  const steps = config.steps
  const [step, setStep] = useState(0)

  // Auto-advance every 7s; resets whenever `step` changes, whether that
  // change came from the timer, an arrow click, or a step-dot click.
  useEffect(() => {
    const t = setTimeout(() => {
      setStep((s) => (s + 1) % steps.length)
    }, AUTO_ADVANCE_MS)
    return () => clearTimeout(t)
  }, [step, steps.length])

  const goTo = (delta) => setStep((s) => (s + delta + steps.length) % steps.length)

  return (
    <Wrap>
      <StageRow>
        <ArrowButton type="button" aria-label="Previous step" onClick={() => goTo(-1)}>
          ‹
        </ArrowButton>

        <Stage role="img" aria-label={steps[step].label}>
          <AssayScene induced={step === 1} config={config} />
        </Stage>

        <ArrowButton type="button" aria-label="Next step" onClick={() => goTo(1)}>
          ›
        </ArrowButton>
      </StageRow>

      <CaptionRow>
        <StepLabel>{steps[step].label}</StepLabel>
        <StepCaption>{steps[step].caption}</StepCaption>
      </CaptionRow>

      <Dots>
        {steps.map((s, idx) => (
          <Dot
            key={s.key}
            type="button"
            aria-label={`Skip to: ${s.label}`}
            $active={idx === step}
            onClick={() => setStep(idx)}
          />
        ))}
      </Dots>
    </Wrap>
  )
}

export const AntibioticSelectionAnimation = () => (
  <CopperReleaseAnimation readout="antibiotic" />
)

export const GfpBiosensorAnimation = () => <CopperReleaseAnimation readout="gfp" />

export default CopperReleaseAnimation

/* ---------------------------------- styling ---------------------------------- */

/* Outer box — fixed size regardless of the artwork inside. */
const Wrap = styled.div`
  max-width: 54rem;
  margin: var(--space-lg) 0;
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.24);

  @media (max-width: 520px) {
    padding: var(--space-md) var(--space-sm);
  }
`

/* Holds the stage plus its flanking prev/next arrows. */
const StageRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);

  @media (max-width: 520px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }
`

/* Single always-mounted stage — no scrolling/swiping, just one scene
   whose internal state (and therefore its CSS transitions) changes
   when `step` changes. */
const Stage = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  height: 260px;
  overflow: hidden;

  @media (max-width: 520px) {
    grid-column: 1 / -1;
    grid-row: 1;
    display: flex;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-inline: contain;
  }
`

const ArrowButton = styled.button`
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.6);
  color: var(--color-text);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }

  @media (max-width: 520px) {
    grid-row: 2;

    &:first-child {
      justify-self: end;
    }

    &:last-child {
      justify-self: start;
    }
  }
`

/* Centers the scene inside the stage. */
const Scene = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;

  @media (max-width: 520px) {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
    flex: none;
    margin: 0 auto;
  }
`

const PetFilm = styled.div`
  position: relative;
  width: ${FILM_WIDTH}px;
  height: ${FILM_HEIGHT}px;
  flex: none;
  background: #e8c9c9;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  clip-path: ${({ $eaten }) => ($eaten ? NOTCHED_CLIP : FULL_CLIP)};
  transition: clip-path 0.4s ease-in-out;

  &::after {
    content: "PET";
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%) rotate(-90deg);
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    color: var(--color-muted);
    white-space: nowrap;
  }
`

const FilmDot = styled.div`
  position: absolute;
  width: ${DOT_SIZE}px;
  height: ${DOT_SIZE}px;
  border-radius: 50%;
  background: #5b3fa6;
  opacity: ${({ $hidden }) => ($hidden ? 0 : 1)};
  transition: opacity 0.3s ease-in-out;
`

/* Fixed-width lane holding the PETase + reporter cell pairing, sized to
   match the film's (now dynamic) height so Scene's flex centering
   doesn't shift Track relative to PetFilm. */
const Track = styled.div`
  position: relative;
  width: 230px;
  height: ${FILM_HEIGHT}px;
`

const PetaseIcon = styled.div`
  position: absolute;
  left: 20px;
  top: ${Math.max(0, FILM_HEIGHT / 2 - 65)}px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #d5e8cc;
  border: 1px solid var(--color-border);

  &::after {
    content: "PETase";
    position: absolute;
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.85rem;
    color: var(--color-muted);
    white-space: nowrap;
  }
`

/* Permanent connector — PETase is produced by/fused to this reporter
   cell, so unlike the surface-collection assay this link never breaks. */
const Bind = styled.div`
  position: absolute;
  left: 41px;
  top: ${Math.max(0, FILM_HEIGHT / 2 - 44)}px;
  width: 126px;
  height: 2px;
  background: var(--color-border);
  transform-origin: 0 50%;
  transform: rotate(41.8deg);
`

const ReporterCell = styled.div`
  position: absolute;
  z-index: 1;
  left: ${CELL_LEFT}px;
  top: ${CELL_TOP}px;
  width: ${CELL_WIDTH}px;
  height: ${CELL_HEIGHT}px;
  border-radius: 50%;
  background: ${({ $induced, $color }) => ($induced ? $color : "#f5e6ac")};
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.68rem;
  line-height: 1.25;
  color: var(--color-text);
  padding: 0 10px;
  transition: background 0.4s ease-in-out;
`

/* Transitions from the hero dot's position (inside the film) to the
   middle of the reporter cell. Using a plain CSS transition rather than
   a one-shot keyframe animation means toggling `$active` off (skipping
   back to the "embed" step) reverses smoothly instead of just snapping.
   z-index is higher than ReporterCell's so the particle visibly sits on
   top of the cell (and its text) once it arrives, rather than landing
   underneath it. */
const HeroCopper = styled.div`
  position: absolute;
  z-index: 2;
  left: ${HERO_DOT.left}px;
  top: ${HERO_DOT.top}px;
  width: ${DOT_SIZE}px;
  height: ${DOT_SIZE}px;
  border-radius: 50%;
  background: #5b3fa6;
  opacity: 0;
  transform: translate(0, 0);
  transition: transform 0.6s ease-in-out, opacity 0.6s ease-in-out;

  ${({ $active }) =>
    $active &&
    css`
      opacity: 1;
      transform: translate(${COPPER_TARGET_X}px, ${COPPER_TARGET_Y}px);
    `}
`

const CaptionRow = styled.div`
  margin-top: var(--space-sm);
`

const StepLabel = styled.p`
  color: var(--color-text) !important;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`

const StepCaption = styled.p`
  color: var(--color-muted);
  font-size: 1rem;
`

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: var(--space-sm);
`

const Dot = styled.button`
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: ${({ $active }) => ($active ? "var(--color-accent)" : "var(--color-border)")};
`
