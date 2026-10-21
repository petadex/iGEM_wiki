import React, { useEffect, useState } from "react"
import styled from "styled-components"
import { CycleContent } from "../engineering/CycleContent.js"
import { ENGINEERING_ART } from "../../data/engineeringCycles.js"
import { HARDWARE_ITERATIONS, HARDWARE_SUBSYSTEMS } from "../../data/hardwareIterations.js"
import { IterationTimeline } from "./IterationTimeline.js"
import { SubsystemTabs } from "./SubsystemTabs.js"
import V1Cycle from "../../content/wiki/hardware/past-iterations/version-1/_cycle.mdx"
import V2Cycle from "../../content/wiki/hardware/past-iterations/version-2/_cycle.mdx"
import V1Rest from "../../content/wiki/hardware/past-iterations/version-1/_overview.mdx"

const CYCLES = { "version-1": V1Cycle, "version-2": V2Cycle }
const REST = { "version-1": V1Rest }

/**
 * A link can open a subsystem: #pumps, or on a version, #version-2-pumps
 * (the Hardware Notebook's photo links here like that). #version-2 alone
 * selects that version and keeps its photo in view.
 */
function fromHash(hash) {
  const body = hash.replace(/^#/, "")
  if (!body) return null
  const versionOnly = body.match(/^(version-\d+)$/)
  if (versionOnly) {
    const version = HARDWARE_ITERATIONS.findIndex(it => it.id === versionOnly[1])
    return version === -1 ? null : { version, subsystem: null }
  }
  const [, versionId, subsystem] =
    body.match(/^(?:(version-\d+)-)?([a-z]+)$/) || []
  if (!HARDWARE_SUBSYSTEMS.some(s => s.id === subsystem)) return null
  const version = HARDWARE_ITERATIONS.findIndex(it => it.id === versionId)
  return { subsystem, version: version === -1 ? null : version }
}

export function HardwareIterations() {
  const [version, setVersion] = useState(0)
  const [subsystem, setSubsystem] = useState("cad")
  // "subsystems" scrolls to the writeups. "photo" scrolls back to the version control.
  const [scrollTo, setScrollTo] = useState(null)
  const iteration = HARDWARE_ITERATIONS[version]
  const Cycle = CYCLES[iteration.id]
  const Rest = REST[iteration.id]

  useEffect(() => {
    const open = () => {
      const target = fromHash(window.location.hash)
      if (!target) return
      if (target.version !== null) setVersion(target.version)
      if (target.subsystem) {
        setSubsystem(target.subsystem)
        setScrollTo("subsystems")
        return
      }
      if (target.version !== null) setScrollTo("photo")
    }
    open()
    window.addEventListener("hashchange", open)
    return () => window.removeEventListener("hashchange", open)
  }, [])

  useEffect(() => {
    if (!scrollTo) return
    const id = scrollTo === "subsystems" ? "iteration-subsystems" : "hardware-version"
    document.getElementById(id)?.scrollIntoView({ block: "start" })
    setScrollTo(null)
  }, [scrollTo, version, subsystem])

  const selectVersion = index => {
    const id = HARDWARE_ITERATIONS[index].id
    setVersion(index)
    setScrollTo("photo")
    const next = `#${id}`
    if (window.location.hash !== next) window.location.hash = next
  }

  return (
    <div>
      <IterationTimeline
        iterations={HARDWARE_ITERATIONS}
        selectedIndex={version}
        onChange={selectVersion}
      />
      <Section>
        <SectionTitle id="iteration-overview">DBTL</SectionTitle>
        {Cycle ? (
          <CycleContent
            Content={Cycle}
            stacked
            wheelWidth="18rem"
            panelId={`hardware-${iteration.id}-cycle-content`}
            titleId="iteration-overview"
            art={{ ...ENGINEERING_ART, centerImage: "" }}
          />
        ) : (
          <Draft>Placeholder: add the Design-Build-Test-Learn notes for the final version.</Draft>
        )}
      </Section>
      {Rest ? <Rest key={iteration.id} /> : null}
      <Section>
        <SectionTitle id="iteration-subsystems">Subsystems</SectionTitle>
        <SubsystemTabs iteration={iteration} selected={subsystem} onSelect={setSubsystem} />
      </Section>
    </div>
  )
}

const Section = styled.section`
  margin-top: var(--space-lg);
`

const SectionTitle = styled.h2`
  scroll-margin-top: 6rem;
`

const Draft = styled.p`
  margin: 0;
  color: var(--color-muted);
`
