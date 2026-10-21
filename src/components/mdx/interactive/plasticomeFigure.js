import React from "react"
import styled from "styled-components"

/**
 * Palette, panel and small chart pieces shared by the plasticome figures
 * (PlasticomeCuration.js) and the CATH figures (CathAssignment.js), so the
 * Dataset Generation sections read as one set. Colours follow the Dry Lab
 * figure style guide.
 */

export const PANEL = "#f5efe8"
export const SUNK = "#e5d9cd"
export const LINE = "#d3c4b3"
export const FRAME = "#c8b388"
export const INK = "#5f3928"
export const INK_SOFT = "#805340"
export const MUTED = "#8a6c57"
export const fmt = (n) => n.toLocaleString("en-US")

/** Below and right of the pointer, flipped near the viewport's edges. */
export const tipTransform = ({ x, y }) => {
  const pad = 14
  const flipX = x + 290 > window.innerWidth
  const flipY = y + 80 > window.innerHeight
  return `translate(${flipX ? `calc(${x - pad}px - 100%)` : `${x + pad}px`}, ${
    flipY ? `calc(${y - pad}px - 100%)` : `${y + pad}px`
  })`
}

export const ext = (href, text) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {text}
  </a>
)

export const MiniBar = ({ parts }) => {
  const total = parts.reduce((a, p) => a + p.n, 0)
  return (
    <Mini>
      {parts.map((p) => (
        <i
          key={p.label}
          style={{ flex: p.n, background: p.color }}
          title={`${p.label}: ${fmt(p.n)} (${Math.round((100 * p.n) / total)}%)`}
        />
      ))}
    </Mini>
  )
}

export const Box = styled.div`
  && {
    position: relative;
    display: grid;
    gap: 0.85rem;
    min-width: 0;
    margin: var(--space-lg) 0;
    padding: 1.1rem 1.25rem;
    border: 2px solid ${FRAME};
    border-radius: 12px;
    background: ${PANEL};
    color: ${INK};
    font-size: 0.95rem;
    line-height: 1.5;
  }

  p {
    margin: 0;
  }

  @media (max-width: 640px) {
    && {
      padding: 1rem;
    }
  }
`

export const BoxTitle = styled.div`
  color: ${INK_SOFT};
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

/** Title of a chart. Picks up the page colour; bar and axis colours stay put. */
export const ChartHeading = styled(BoxTitle).attrs({ "data-chart-heading": "true" })``

export const Sub = styled.p`
  && {
    margin: 0;
    color: ${INK_SOFT};
    font-size: 0.82rem;
  }
`

export const Stats = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 0.75rem;
  margin: var(--space-lg) 0;

  @media (max-width: 640px) {
    grid-template-columns: 1fr 1fr;

    & > :first-child {
      grid-column: 1 / -1;
    }
  }
`

export const Stat = styled.div`
  padding: 0.9rem 1rem;
  border: 2px solid ${FRAME};
  border-radius: 12px;
  background: ${({ $hero }) => ($hero ? SUNK : PANEL)};
  color: ${INK};
`

export const StatValue = styled.div`
  font-family: var(--font-display), serif;
  font-size: 2.2rem;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`

export const StatLabel = styled.div`
  margin-top: 0.2rem;
  color: ${INK_SOFT};
  font-size: 0.85rem;
  line-height: 1.35;
`

export const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
`

export const fieldStyle = `
  min-width: 0;
  padding: 0.35rem 0.55rem;
  border: 1px solid ${FRAME};
  border-radius: 7px;
  background: #fffaf6;
  color: ${INK};
  font: inherit;
  font-size: 0.85rem;
`

export const Picker = styled.label`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  color: ${INK_SOFT};
  font-size: 0.82rem;

  select {
    ${fieldStyle}
    max-width: 100%;
  }
`

export const LegendRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  color: ${INK_SOFT};
  font-size: 0.8rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
`

export const Swatch = styled.i`
  width: 11px;
  height: 11px;
  border-radius: 3px;
`

export const TableToggle = styled.details`
  border-top: 1px solid ${LINE};

  summary {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: fit-content;
    padding: 0.5rem 0 0.25rem;
    color: ${INK_SOFT};
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::before {
    content: "";
    width: 0.4rem;
    height: 0.4rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(-45deg);
    transition: transform 0.15s;
  }

  &[open] summary::before {
    transform: rotate(45deg);
  }

  summary:focus-visible {
    outline: 2px solid ${INK_SOFT};
    outline-offset: 2px;
  }

  &[open] > :not(summary) {
    margin-top: 0.4rem;
  }

  @media (prefers-reduced-motion: reduce) {
    summary::before {
      transition: none;
    }
  }
`

export const Tip = styled.div`
  position: fixed;
  z-index: 50;
  top: 0;
  left: 0;
  display: grid;
  gap: 0.2rem;
  max-width: min(280px, calc(100vw - 32px));
  padding: 0.5rem 0.7rem;
  border-radius: 8px;
  background: ${INK};
  box-shadow: 0 8px 24px -8px rgba(40, 20, 10, 0.45);
  color: ${PANEL};
  font-size: 0.8rem;
  line-height: 1.4;
  pointer-events: none;
`

export const Mono = styled.span`
  color: ${MUTED};
  font-family: var(--font-mono), monospace;
  font-size: 0.8em;
`

export const Flow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.6rem;
  align-items: center;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

export const Lane = styled.div`
  display: grid;
  gap: 0.6rem;
`

export const Arrow = styled.span`
  color: ${MUTED};
  font-size: 1.3rem;
  text-align: center;

  @media (max-width: 760px) {
    transform: rotate(90deg);
  }
`

export const Node = styled.div`
  padding: 0.7rem 0.8rem;
  border: ${({ $out }) => ($out ? `2px solid ${INK_SOFT}` : `1px solid ${LINE}`)};
  border-radius: 10px;
  background: #fffaf6;
`

export const NodeN = styled.div`
  font-family: var(--font-display), serif;
  font-size: 1.6rem;
  line-height: 1.1;
`

export const NodeT = styled.div`
  font-weight: 700;
  font-size: 0.86rem;
`

export const NodeD = styled.div`
  color: ${INK_SOFT};
  font-size: 0.78rem;
  line-height: 1.4;
`

export const Mini = styled.div`
  display: flex;
  height: 8px;
  margin-top: 0.5rem;
  border-radius: 3px;
  overflow: hidden;

  i + i {
    box-shadow: inset 1px 0 0 #fffaf6;
  }
`

export const ChartScroll = styled.div`
  overflow-x: auto;

  svg {
    display: block;
    width: 100%;
    min-width: 520px;
    height: auto;
  }
`

export const Trail = styled.ol`
  display: grid;
  gap: 0.5rem;
  margin: 0.3rem 0 0;
  padding: 0 0 0 1rem;
  border-left: 2px solid ${LINE};
  list-style: none;
  font-size: 0.83rem;
`

export const TrailStep = styled.li`
  position: relative;
  color: ${({ $skip }) => ($skip ? MUTED : INK)};

  &::before {
    content: "";
    position: absolute;
    top: 0.35rem;
    left: calc(-1rem - 6px);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ $skip }) => ($skip ? LINE : INK_SOFT)};
  }
`

export const TrailTitle = styled.span`
  display: block;
  font-weight: 700;
`

export const LinkButton = styled.button`
  all: unset;
  color: ${INK};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${INK_SOFT};
  }
`
