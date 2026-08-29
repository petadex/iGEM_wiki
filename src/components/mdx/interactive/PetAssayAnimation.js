import React, { useEffect, useState } from "react"
import styled, { keyframes, css } from "styled-components"

const STEPS = [
  {
    key: "bind",
    label: "TA2 binds PET film",
    caption:
      "TA2 displayed on the cell surface binds directly to the PET film.",
  },
  {
    key: "wash",
    label: "Wash removes unbound cells",
    caption:
      "A wash step clears away cells that never attached, leaving only PET-bound cells.",
  },
  {
    key: "digest",
    label: "PETase eats PET and releases TA2",
    caption:
      "PETase eats PET and releases TA2, thereby releasing the cell. Collect freed cells.",
  },
]

const AUTO_ADVANCE_MS = 7000

const FULL_CLIP = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
const NOTCHED_CLIP =
  "polygon(0% 0%, 100% 0%, 100% 40%, 55% 50%, 100% 60%, 100% 100%, 0% 100%)"

export const PetAssayAnimation = () => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setStep((s) => (s + 1) % STEPS.length)
    }, AUTO_ADVANCE_MS)
    return () => clearTimeout(t)
  }, [step])

  const goTo = (delta) => setStep((s) => (s + delta + STEPS.length) % STEPS.length)

  const current = STEPS[step].key

  return (
    <Wrap>
      <StageRow>
        <ArrowButton type="button" aria-label="Previous step" onClick={() => goTo(-1)}>
          ‹
        </ArrowButton>

        <Stage role="img" aria-label={STEPS[step].label}>
          <Scene>
            <PetFilm $eaten={current === "digest"} />

            <Track>
              <BoundComplex $phase={current}>
                <Ta2Anchor />
                <Bind />
                <CellBody $tag="bound" />
              </BoundComplex>

              <StrayCell $visible={current === "bind"} />

              <PetaseIcon $active={current === "digest"} />
            </Track>
          </Scene>
        </Stage>

        <ArrowButton type="button" aria-label="Next step" onClick={() => goTo(1)}>
          ›
        </ArrowButton>
      </StageRow>

      <CaptionRow>
        <StepLabel>{STEPS[step].label}</StepLabel>
        <StepCaption>{STEPS[step].caption}</StepCaption>
      </CaptionRow>

      <Dots>
        {STEPS.map((s, idx) => (
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

export default PetAssayAnimation

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
`

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

const Track = styled.div`
  position: relative;
  width: 230px;
  height: 190px;
`

const PetFilm = styled.div`
  position: relative;
  width: 46px;
  height: 190px;
  flex: none;
  background: #e8c9c9;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  clip-path: ${({ $eaten }) => ($eaten ? NOTCHED_CLIP : FULL_CLIP)};
  transition: clip-path 0.4s ease-in-out;

  &::after {
    content: "PET";
    position: absolute;
    left: 23px;
    top: 50%;
    transform: translate(-50%, -50%) rotate(-90deg);
    font-size: 0.95rem;
    letter-spacing: 0.04em;
    color: var(--color-muted);
    white-space: nowrap;
  }
`

const Ta2Anchor = styled.div`
  width: 34px;
  height: 28px;
  background: #7b2fd6;
  border-radius: 0 14px 14px 0;
  flex: none;
`

const CellBody = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f5e6ac;
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: var(--color-text);

  &::after {
    content: "cell";
  }
`

const Bind = styled.div`
  width: 16px;
  height: 2px;
  background: var(--color-border);
  flex: none;
`

const BoundComplex = styled.div`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  transition: transform 0.5s ease-in-out 0.4s;

  ${({ $phase }) =>
    $phase === "digest" &&
    css`
      transform: translateY(-50%) translate(110px, -16px);
    `}
`

const StrayCell = styled(CellBody)`
  position: absolute;
  left: 130px;
  top: 8px;
  width: 42px;
  height: 42px;
  opacity: ${({ $visible }) => ($visible ? 0.85 : 0)};
  transition: opacity 0.25s ease;
`

const PetaseIcon = styled.div`
  position: absolute;
  left: 150px;
  top: 4px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #d5e8cc;
  border: 1px solid var(--color-border);
  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transition: opacity 0.2s ease;
  animation: ${({ $active }) => ($active ? css`${bob} 0.5s ease-in-out infinite` : "none")};

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
