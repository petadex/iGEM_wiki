import React, { useMemo, useState } from "react"
import styled from "styled-components"
import {
  CONTRIBUTION_MONTHS,
  formatDayShort,
  getMonthGrid,
  weekIdForDate,
} from "../../data/contributionCalendar/calendarUtils.js"
import { SUBTEAM_BY_ID } from "../../data/subteamTracks.js"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function MilestoneLabel({ ms }) {
  const [open, setOpen] = useState(false)
  const track = SUBTEAM_BY_ID[ms.subteamId]
  const dateLabel = formatDayShort(ms.date)
  const aria = `${dateLabel}${track ? `, ${track.label}` : ""}: ${ms.label}`

  return (
    <LabelWrap
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <MilestoneBadge
        $color={track?.color ?? "#6de4c0"}
        $text={track?.textColor ?? "#06202b"}
        tabIndex={0}
        aria-label={aria}
      >
        {ms.label}
      </MilestoneBadge>
      {open && (
        <MilestoneTooltip role="tooltip">
          <TooltipMeta>
            {dateLabel}
            {track ? ` · ${track.label}` : ""}
          </TooltipMeta>
          <TooltipText>{ms.label}</TooltipText>
        </MilestoneTooltip>
      )}
    </LabelWrap>
  )
}

export function VintageMonthGrid({
  monthKey,
  selectedWeekId,
  onSelectWeek,
  milestonesByDate,
}) {
  const month = CONTRIBUTION_MONTHS.find((m) => m.key === monthKey)
  const rows = useMemo(() => {
    if (!month) return []
    return getMonthGrid(month.year, month.monthIndex)
  }, [month])

  if (!month) return null

  return (
    <GridWrap>
      <WeekdayRow>
        {WEEKDAYS.map((d) => (
          <Weekday key={d}>{d}</Weekday>
        ))}
      </WeekdayRow>

      {rows.map((row, rowIdx) => (
        <WeekRow key={rowIdx}>
          {row.map((cell, colIdx) => {
            const { ymd, inMonth } = cell
            const weekId = weekIdForDate(ymd)
            const isSelected = weekId === selectedWeekId
            const dayNum = parseInt(ymd.split("-")[2], 10)
            const milestones = milestonesByDate[ymd] || []

            return (
              <Cell
                key={ymd}
                $inBand={isSelected}
                $outOfMonth={!inMonth}
                role="button"
                tabIndex={0}
                aria-label={`${formatDayShort(ymd)}${!inMonth ? ", outside month" : ""}${isSelected ? ", selected week" : ""}`}
                onClick={() => onSelectWeek(weekId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelectWeek(weekId)
                  }
                }}
              >
                <DayNum
                  $sunday={colIdx === 0}
                  $inBand={isSelected}
                  $outOfMonth={!inMonth}
                >
                  {dayNum}
                </DayNum>
                <MilestoneSlot>
                  {milestones.slice(0, 2).map((ms) => (
                    <MilestoneLabel key={`${ymd}-${ms.label}`} ms={ms} />
                  ))}
                </MilestoneSlot>
              </Cell>
            )
          })}
        </WeekRow>
      ))}
    </GridWrap>
  )
}

const GridWrap = styled.div`
  flex: 1;
  min-width: 0;
  width: 100%;
  padding-inline: clamp(0.25rem, 1vw, 0.75rem);
  box-sizing: border-box;
`

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: clamp(6px, 0.9vw, 10px);
  margin-bottom: 8px;
`

const Weekday = styled.div`
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #2d9194;
  padding: 0.35rem 0;
`

const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: clamp(6px, 0.9vw, 10px);
  margin-bottom: clamp(6px, 0.9vw, 10px);
`

const Cell = styled.div`
  position: relative;
  min-height: clamp(5.25rem, 9vw, 7rem);
  padding: 0.55rem 0.5rem 0.4rem;
  background: ${({ $inBand, $outOfMonth }) => {
    if ($inBand) return $outOfMonth ? "#dceee8" : "#6de4c0"
    return $outOfMonth ? "#f3f3f0" : "#ffffff"
  }};
  border: 1px solid
    ${({ $inBand, $outOfMonth }) => {
      if ($inBand) return $outOfMonth ? "rgba(45,145,148,0.35)" : "#2d9194"
      return $outOfMonth ? "rgba(6,32,43,0.08)" : "rgba(6,32,43,0.14)"
    }};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    ${({ $inBand, $outOfMonth }) =>
      !$inBand
        ? `background: ${$outOfMonth ? "#ebebe6" : "#f5f5f2"};`
        : ""}
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
    z-index: 1;
  }
`

const DayNum = styled.span`
  display: block;
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 2vw, 1.45rem);
  font-weight: 700;
  line-height: 1;
  color: ${({ $sunday, $inBand, $outOfMonth }) => {
    if ($outOfMonth) return $inBand ? "rgba(6,32,43,0.55)" : "rgba(6,32,43,0.38)"
    if ($inBand) return "#06202b"
    return $sunday ? "#c44" : "#06202b"
  }};
`

const MilestoneSlot = styled.div`
  position: absolute;
  left: 2px;
  right: 2px;
  bottom: 3px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  pointer-events: none;
`

const LabelWrap = styled.div`
  position: relative;
  pointer-events: auto;
  min-width: 0;
`

const MilestoneBadge = styled.span`
  display: block;
  font-size: 0.62rem;
  line-height: 1.25;
  font-weight: 600;
  padding: 3px 5px;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  color: ${({ $text }) => $text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  cursor: help;

  &:focus-visible {
    outline: 2px solid #2d9194;
    outline-offset: 1px;
  }
`

const MilestoneTooltip = styled.div`
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  z-index: 40;
  min-width: 10rem;
  max-width: min(16rem, 42vw);
  padding: 0.45rem 0.55rem;
  border-radius: 6px;
  background: #06202b;
  color: #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
  pointer-events: none;
  text-align: left;
`

const TooltipMeta = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 0.2rem;
`

const TooltipText = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  word-wrap: break-word;
`

export default VintageMonthGrid
