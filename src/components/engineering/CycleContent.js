import React, { useRef, useState } from "react"
import styled from "styled-components"
import { ENGINEERING_STAGES } from "../../data/engineeringCycles.js"
import { EngineeringCycleWheel } from "./EngineeringCycleWheel.js"
import { EngineeringStage } from "./EngineeringStage.js"

export function CycleContent({ Content, panelId, titleId, art, stacked = false, wheelWidth }) {
  const [activeStage, setActiveStage] = useState(ENGINEERING_STAGES[0].id)
  const panel = useRef(null)
  const scrollTarget = useRef(null)
  const section = stageId => panel.current?.querySelector(`[data-engineering-stage="${stageId}"]`)

  const selectStage = stageId => {
    const target = section(stageId)
    if (!target || !panel.current) return
    setActiveStage(stageId)
    const root = panel.current
    const top = Math.max(0, Math.min(
      root.scrollHeight - root.clientHeight,
      root.scrollTop + target.getBoundingClientRect().top - root.getBoundingClientRect().top - root.clientTop - 16,
    ))
    scrollTarget.current = Math.abs(root.scrollTop - top) > 1 ? top : null
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    root.scrollTo({ top, behavior: reduceMotion ? "instant" : "smooth" })
  }

  const syncStage = () => {
    const root = panel.current
    if (!root) return
    // A segment click owns the highlight until its smooth scroll arrives.
    // Intermediate sections should only select themselves during manual scrolling.
    if (scrollTarget.current !== null) {
      if (Math.abs(root.scrollTop - scrollTarget.current) <= 1) scrollTarget.current = null
      return
    }
    const line = root.getBoundingClientRect().top + 32
    let current = ENGINEERING_STAGES[0].id
    for (const stage of ENGINEERING_STAGES) {
      if (section(stage.id)?.getBoundingClientRect().top <= line) current = stage.id
    }
    setActiveStage(current)
  }

  const resumeManualScroll = () => {
    if (scrollTarget.current === null || !panel.current) return
    scrollTarget.current = null
    panel.current.scrollTo({ top: panel.current.scrollTop, behavior: "instant" })
    syncStage()
  }

  return (
    <CycleLayout $stacked={stacked}>
      <WheelColumn $width={wheelWidth}>
        <EngineeringCycleWheel activeStage={activeStage} onSelect={selectStage} panelId={panelId} art={art} />
        <Hint>Choose a stage, or scroll through the notes.</Hint>
      </WheelColumn>
      <ScrollPanel id={panelId} ref={panel} role="region" aria-labelledby={titleId}
        tabIndex={0} onScroll={syncStage}
        onWheel={resumeManualScroll} onTouchStart={resumeManualScroll}
        onPointerDown={resumeManualScroll}
        onKeyDown={event => {
          if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) resumeManualScroll()
        }}>
        <Content components={{ EngineeringStage }} />
      </ScrollPanel>
    </CycleLayout>
  )
}

const CycleLayout = styled.div`
  display: grid; grid-template-columns: ${({ $stacked }) => $stacked ? "minmax(0, 1fr)" : "minmax(0, 0.95fr) minmax(0, 1.05fr)"}; gap: 1.25rem; align-items: center;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`
const WheelColumn = styled.div`
  min-width: 0;
  width: 100%;
  max-width: ${({ $width }) => $width || "none"};
  margin-inline: auto;
`
const Hint = styled.p`&& { text-align: center; font-size: 0.85rem; color: #715c47; margin: 0.6rem 0; }`
const ScrollPanel = styled.div`
  position: relative;
  height: 29rem;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 1rem;
  border: 1px solid #c9b493;
  border-radius: 0.5rem;
  background: #fffdf8;
  min-width: 0;
  &:focus-visible { outline: 3px solid #805340; outline-offset: 3px; }
  @media (max-width: 760px) { height: 25rem; }
`
