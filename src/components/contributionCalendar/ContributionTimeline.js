import React, { useCallback, useEffect, useMemo, useState } from "react"
import styled from "styled-components"
import {
  CONTRIBUTION_WEEK_BY_ID,
  CONTRIBUTION_WEEKS,
  getDefaultWeekId,
  parseWeekHash,
} from "../../data/contributionCalendar/weeks.js"
import { MonthNav } from "./MonthNav.js"
import { WeekNav } from "./WeekNav.js"
import { PanelChrome, RestorePanelBar } from "./PanelChrome.js"
import { SubteamFilterBar } from "./SubteamFilterBar.js"
import { useSplitPane } from "./useSplitPane.js"
import { VintageMonthGrid } from "./VintageMonthGrid.js"
import { WeekDetailPanel } from "./WeekDetailPanel.js"

/** @typedef {null | 'detail' | 'calendar'} HiddenPanel */

function buildMilestonesByDate(weeks) {
  /** @type {Record<string, import('../../data/contributionCalendar/weeks.js').WeekMilestone[]>} */
  const map = {}
  for (const week of weeks) {
    for (const ms of week.milestones) {
      if (!map[ms.date]) map[ms.date] = []
      map[ms.date].push(ms)
    }
  }
  return map
}

function firstWeekIdForMonth(monthKey) {
  // Prefer a week whose primary month is the target (avoids cross-month weeks
  // whose monthKeys[0] is the previous month).
  const preferred = CONTRIBUTION_WEEKS.find((wk) => wk.monthKeys[0] === monthKey)
  if (preferred) return preferred.id
  const w = CONTRIBUTION_WEEKS.find((wk) => wk.monthKeys.includes(monthKey))
  return w?.id ?? getDefaultWeekId()
}

export function ContributionTimeline({ embedded = false }) {
  const initialWeekId = getDefaultWeekId()
  const initialMonth =
    CONTRIBUTION_WEEK_BY_ID[initialWeekId]?.monthKeys[0] ?? "2026-04"

  const [monthKey, setMonthKey] = useState(initialMonth)
  const [selectedWeekId, setSelectedWeekId] = useState(initialWeekId)
  // Subteam filters start off; turning one on shows its progress.
  const [activeSubteams, setActiveSubteams] = useState(() => new Set())
  /** @type {[HiddenPanel, function]} */
  const [hiddenPanel, setHiddenPanel] = useState(null)

  const { splitPct, nudgeSplit, containerRef, onDividerPointerDown } = useSplitPane()

  const milestonesByDate = useMemo(
    () => buildMilestonesByDate(CONTRIBUTION_WEEKS),
    []
  )

  const selectedWeek = CONTRIBUTION_WEEK_BY_ID[selectedWeekId] ?? null
  const showDetail = hiddenPanel !== "detail"
  const showCalendar = hiddenPanel !== "calendar"
  const showDivider = showDetail && showCalendar

  const syncHash = useCallback((weekId) => {
    if (typeof window === "undefined" || !weekId) return
    const next = `#${weekId}`
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next)
    }
  }, [])

  const selectWeek = useCallback(
    (weekId) => {
      if (!CONTRIBUTION_WEEK_BY_ID[weekId]) return
      const week = CONTRIBUTION_WEEK_BY_ID[weekId]
      setSelectedWeekId(weekId)
      syncHash(weekId)
      // Keep the visible month if this week still belongs to it; otherwise follow the week.
      setMonthKey((prev) =>
        week.monthKeys.includes(prev) ? prev : week.monthKeys[0] ?? prev
      )
    },
    [syncHash]
  )

  const selectMonth = useCallback(
    (key) => {
      const nextId = firstWeekIdForMonth(key)
      setMonthKey(key)
      if (nextId) {
        setSelectedWeekId(nextId)
        syncHash(nextId)
      }
    },
    [syncHash]
  )

  const toggleSubteam = useCallback((id) => {
    setActiveSubteams((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const hidePanel = useCallback((panel) => {
    setHiddenPanel(panel)
  }, [])

  const restorePanels = useCallback(() => {
    setHiddenPanel(null)
  }, [])

  // Apply URL hash once on mount — do NOT re-run when selectWeek identity changes,
  // or month navigation gets snapped back to the hash week's monthKeys[0].
  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const initialHashId = parseWeekHash(window.location.hash)
    if (initialHashId) {
      const initialHashWeek = CONTRIBUTION_WEEK_BY_ID[initialHashId]
      setSelectedWeekId(initialHashId)
      if (initialHashWeek?.monthKeys[0]) {
        setMonthKey(initialHashWeek.monthKeys[0])
      }
    }
    return undefined
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return undefined
    const onHash = () => {
      const id = parseWeekHash(window.location.hash)
      if (id) selectWeek(id)
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [selectWeek])

  return (
    <TimelineRoot $embedded={embedded}>
      <SubteamNavRow>
        <SubteamFilterBar
          layout="navbar"
          activeIds={activeSubteams}
          onToggle={toggleSubteam}
        />
      </SubteamNavRow>

      <SplitContainer
        ref={containerRef}
        style={{ "--detail-split": `${splitPct}%` }}
      >
        {showDetail && (
          <DetailHalf $full={hiddenPanel === "calendar"} $split={showDivider}>
            {!showCalendar && (
              <RestorePanelBar
                label="Show calendar →"
                onRestore={() => setHiddenPanel(null)}
              />
            )}
            <PanelChrome
              title="Week details"
              hideLabel="Hide details"
              onHide={() => hidePanel("detail")}
              isHidden={false}
            />
            <WeekNavBar>
              <WeekNav selectedWeekId={selectedWeekId} onSelect={selectWeek} />
            </WeekNavBar>
            <DetailScroll>
              <WeekDetailPanel week={selectedWeek} activeIds={activeSubteams} />
            </DetailScroll>
          </DetailHalf>
        )}

        {showDivider && (
          <ResizeDivider
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
            tabIndex={0}
            onPointerDown={onDividerPointerDown}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") nudgeSplit(-3)
              if (e.key === "ArrowRight") nudgeSplit(3)
            }}
          />
        )}

        {showCalendar && (
          <CalendarHalf $full={hiddenPanel === "detail"}>
            {!showDetail && (
              <RestorePanelBar
                label="← Show week details"
                onRestore={restorePanels}
              />
            )}
            <PanelChrome
              title="Calendar"
              hideLabel="Hide calendar"
              onHide={() => hidePanel("calendar")}
              isHidden={false}
            />
            <CalendarPanel>
              <MonthNav selectedKey={monthKey} onSelect={selectMonth} />
              <VintageMonthGrid
                monthKey={monthKey}
                selectedWeekId={selectedWeekId}
                onSelectWeek={selectWeek}
                milestonesByDate={milestonesByDate}
              />
            </CalendarPanel>
          </CalendarHalf>
        )}
      </SplitContainer>
    </TimelineRoot>
  )
}

const TimelineRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 75vh;
  width: ${({ $embedded }) => ($embedded ? "100%" : "min(96rem, calc(100vw - 1.5rem))")};
  max-width: ${({ $embedded }) => ($embedded ? "100%" : "96rem")};
  min-width: 0;
  margin-inline: auto;
  /* Stacks by its own width, so it also fits a narrow text box. */
  container-type: inline-size;
  padding-inline: ${({ $embedded }) => ($embedded ? "0" : "clamp(0.75rem, 2vw, 1.5rem)")};
  box-sizing: border-box;
  position: relative;
  left: ${({ $embedded }) => ($embedded ? "auto" : "50%")};
  transform: ${({ $embedded }) => ($embedded ? "none" : "translateX(-50%)")};

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
    }
  }
`

const SubteamNavRow = styled.div`
  width: 100%;
  margin-bottom: 0;
  border: 1px solid var(--cal-line, var(--color-border));
  border-radius: 8px 8px 0 0;
  border-bottom: none;
  background: var(--cal-surface, #fff);
  box-sizing: border-box;
`

const SplitContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 72vh;
  border: 1px solid var(--cal-line, var(--color-border));
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  width: 100%;

  @container (max-width: 720px) {
    flex-direction: column;
    min-height: auto;
  }
`

const DetailHalf = styled.div`
  min-width: min(14rem, 100%);
  display: flex;
  flex-direction: column;
  flex: ${({ $full, $split }) =>
    $full ? "1 1 100%" : $split ? "0 0 var(--detail-split)" : "0 0 auto"};
  max-width: ${({ $full, $split }) =>
    $full ? "100%" : $split ? "var(--detail-split)" : "none"};

  @container (max-width: 720px) {
    flex: 1 1 auto;
    max-width: 100%;
  }
`

const WeekNavBar = styled.div`
  flex-shrink: 0;
  padding: var(--space-sm) var(--space-md) var(--space-md);
  background: var(--cal-surface, #fff);
`

const DetailScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* Its content doesn't size the panels: beside the calendar it takes the
     calendar's height and scrolls, so picking a week or a subteam never
     changes the page's length. */
  contain: size;

  /* Stacked over the calendar: a fixed height of its own. */
  @container (max-width: 720px) {
    flex: none;
    height: min(24rem, 55vh);
  }
`

const ResizeDivider = styled.div`
  flex: 0 0 8px;
  width: 8px;
  cursor: col-resize;
  background: var(--cal-line, var(--color-border));
  position: relative;
  touch-action: none;
  user-select: none;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 2.5rem;
    border-radius: 2px;
    background: var(--cal-accent, #2d9194);
    opacity: 0.5;
  }

  &:hover,
  &:focus-visible {
    background: var(--cal-accent, #2d9194);

    &::after {
      opacity: 1;
      background: #fff;
    }
  }

  @container (max-width: 720px) {
    display: none;
  }
`

const CalendarHalf = styled.div`
  min-width: min(28rem, 100%);
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  border-left: ${({ $full }) => ($full ? "none" : "1px solid var(--cal-line, var(--color-border))")};

  @container (max-width: 720px) {
    border-left: none;
    border-top: 1px solid var(--cal-line, var(--color-border));
  }
`

const CalendarPanel = styled.div`
  background: var(--cal-surface, #fff);
  padding: var(--space-md) clamp(1.25rem, 3.5vw, 2.75rem) var(--space-lg);
  min-height: 68vh;
  flex: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`


export default ContributionTimeline
