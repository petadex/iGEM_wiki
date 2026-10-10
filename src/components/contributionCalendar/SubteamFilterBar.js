import React from "react"
import styled from "styled-components"
import {
  SUBTEAM_TRACKS,
  trackColor,
  trackTextColor,
} from "../../data/subteamTracks.js"

export function SubteamFilterBar({ activeIds, onToggle, layout = "inline" }) {
  const isNavbar = layout === "navbar"

  return (
    <FilterRoot $navbar={isNavbar} role="group" aria-label="Filter subteam details">
      {!isNavbar && <FilterLabel>Subteams</FilterLabel>}
      <ChipRow $navbar={isNavbar}>
        {SUBTEAM_TRACKS.map((track) => {
          const on = activeIds.has(track.id)
          return (
            <Chip
              key={track.id}
              type="button"
              $color={trackColor(track)}
              $text={trackTextColor(track)}
              $on={on}
              $navbar={isNavbar}
              aria-pressed={on}
              onClick={() => onToggle(track.id)}
            >
              {track.label}
            </Chip>
          )
        })}
      </ChipRow>
    </FilterRoot>
  )
}

const FilterRoot = styled.div`
  margin: ${({ $navbar }) => ($navbar ? 0 : "var(--space-md) 0")};
  width: 100%;
  ${({ $navbar }) =>
    $navbar &&
    `
    padding: var(--space-sm) var(--space-md);
    background: var(--cal-surface, #fff);
    border-bottom: 2px solid var(--cal-accent, #2d9194);
  `}
`

const FilterLabel = styled.p`
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cal-muted, var(--color-muted));
  font-weight: 600;
  margin-bottom: var(--space-sm);
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ $navbar }) => ($navbar ? "0.5rem" : "0.4rem")};
  align-items: center;
  ${({ $navbar }) => $navbar && `justify-content: flex-start;`}
`

const Chip = styled.button`
  border: 2px solid ${({ $on, $color }) => ($on ? $color : "var(--cal-line, var(--color-border))")};
  background: ${({ $on, $color }) => ($on ? $color : "transparent")};
  color: ${({ $on, $text }) => ($on ? $text : "var(--cal-ink, var(--color-text))")};
  font-family: var(--font-body);
  font-size: ${({ $navbar }) => ($navbar ? "0.78rem" : "0.72rem")};
  font-weight: 600;
  padding: ${({ $navbar }) => ($navbar ? "0.45rem 0.85rem" : "0.35rem 0.65rem")};
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;

  &:hover {
    border-color: ${({ $color }) => $color};
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

export default SubteamFilterBar
