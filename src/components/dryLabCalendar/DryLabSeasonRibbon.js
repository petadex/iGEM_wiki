import React from "react"
import styled from "styled-components"
import { DRY_LAB_TRACKS, DRY_LAB_WEEKS } from "../../data/dryLabCalendar.js"
import { trackColor } from "../../data/subteamTracks.js"

/*
 * The whole Dry Lab season at a glance, for the overview's calendar card:
 * the calendar's workstream chips over one column per week, a row per
 * workstream filled where it has an entry that week, and a dot under each
 * week with a milestone. Drawn from the calendar's own data, so it stays in
 * step with it, and as SVG, so it is sharp at any size the card takes.
 */

// The weeks from the first with anything on the record to the last.
const busy = w => w.milestones.length > 0 || DRY_LAB_TRACKS.some(t => !w.subteams[t.id].quiet)
const first = DRY_LAB_WEEKS.findIndex(busy)
const last = DRY_LAB_WEEKS.length - 1 - [...DRY_LAB_WEEKS].reverse().findIndex(busy)
const WEEKS = DRY_LAB_WEEKS.slice(first, last + 1)

// Layout, in viewBox units.
const CELL_W = 10
const CELL_H = 20
const GAP = 3
const CHIP_H = 22
const CHIP_GAP = 6
const CHIP_PAD = 10
const CHIP_FONT = 11.5
const GRID_W = WEEKS.length * (CELL_W + GAP) - GAP
const CHIPS_PER_ROW = 3
const CHIP_W = (GRID_W - (CHIPS_PER_ROW - 1) * CHIP_GAP) / CHIPS_PER_ROW
const CHIPS_H = Math.ceil(DRY_LAB_TRACKS.length / CHIPS_PER_ROW) * (CHIP_H + CHIP_GAP) - CHIP_GAP
const MONTH_Y = CHIPS_H + 26
const GRID_Y = MONTH_Y + 8
const GRID_H = DRY_LAB_TRACKS.length * (CELL_H + GAP) - GAP
const DOT_Y = GRID_Y + GRID_H + 10
const MARGIN = 18
const VIEW_W = GRID_W + 2 * MARGIN
const VIEW_H = DOT_Y + 6 + MARGIN

const MONTH = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" })
// A month is labelled over the first week that starts in it.
const monthLabels = WEEKS.flatMap((w, i) => {
  const start = new Date(`${w.start}T00:00:00Z`)
  return start.getUTCDate() <= 7 ? [{ i, label: MONTH.format(start) }] : []
})

export const DryLabSeasonRibbon = () => (
  <Ground>
    <svg viewBox={`${-MARGIN} ${-MARGIN} ${VIEW_W} ${VIEW_H}`} role="img" aria-label="The Dry Lab season, week by week">
      {DRY_LAB_TRACKS.map((t, k) => {
        const x = (k % CHIPS_PER_ROW) * (CHIP_W + CHIP_GAP)
        const y = Math.floor(k / CHIPS_PER_ROW) * (CHIP_H + CHIP_GAP)
        return (
          <g key={t.id}>
            <rect x={x} y={y} width={CHIP_W} height={CHIP_H} rx={CHIP_H / 2} fill={trackColor(t)} />
            <text x={x + CHIP_PAD} y={y + CHIP_H / 2} dy="0.35em" fontSize={CHIP_FONT} fill={t.textColor}>
              {t.label}
            </text>
          </g>
        )
      })}

      {monthLabels.map(({ i, label }) => (
        <text key={label} className="month" x={i * (CELL_W + GAP)} y={MONTH_Y} fontSize={11}>
          {label}
        </text>
      ))}

      {WEEKS.map((w, i) => {
        const x = i * (CELL_W + GAP)
        return (
          <g key={w.id}>
            {DRY_LAB_TRACKS.map((t, r) => {
              const on = !w.subteams[t.id].quiet
              return (
                <rect
                  key={t.id}
                  className={on ? undefined : "off"}
                  x={x}
                  y={GRID_Y + r * (CELL_H + GAP)}
                  width={CELL_W}
                  height={CELL_H}
                  rx={2.5}
                  fill={on ? trackColor(t) : undefined}
                />
              )
            })}
            {w.milestones.length > 0 && <circle className="milestone" cx={x + CELL_W / 2} cy={DOT_Y} r={2.6} />}
          </g>
        )
      })}
    </svg>
  </Ground>
)

export default DryLabSeasonRibbon

const Ground = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--cal-cell-out, #f3e7d6);

  svg {
    display: block;
    width: 100%;
    max-height: 100%;
    font-family: var(--font-body);
    font-weight: 600;
  }

  .month {
    fill: var(--cal-accent, #a0603a);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .off {
    fill: var(--cal-cell, #fffaf2);
    stroke: var(--cal-cell-line, rgba(120, 84, 50, 0.2));
    stroke-width: 0.75;
  }

  .milestone {
    fill: var(--cal-ink, #3b2a1f);
  }
`
