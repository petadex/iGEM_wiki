import React, { useId, useRef } from "react"
import styled from "styled-components"
import { SUBSYSTEM_CONTENT } from "./subsystemRegistry.js"
import { HARDWARE_SUBSYSTEMS } from "../../data/hardwareIterations.js"

export function SubsystemTabs({ iteration, selected, onSelect }) {
  const id = useId()
  const buttons = useRef([])
  const Content = SUBSYSTEM_CONTENT[iteration.id]?.[selected]
  const onKeyDown = (event, index) => {
    const last = HARDWARE_SUBSYSTEMS.length - 1
    const next = { ArrowRight: (index + 1) % (last + 1), ArrowLeft: (index + last) % (last + 1), Home: 0, End: last }[event.key]
    if (next === undefined) return
    event.preventDefault()
    onSelect(HARDWARE_SUBSYSTEMS[next].id)
    buttons.current[next]?.focus()
  }
  return (
    <section aria-label="Subsystem designs">
      <Tabs role="tablist" aria-label="Hardware subsystems">
        {HARDWARE_SUBSYSTEMS.map((item, index) => (
          <button key={item.id} ref={node => { buttons.current[index] = node }}
            type="button" role="tab" id={`${id}-tab-${item.id}`}
            aria-selected={selected === item.id} aria-controls={`${id}-panel-${item.id}`}
            tabIndex={selected === item.id ? 0 : -1}
            onKeyDown={event => onKeyDown(event, index)} onClick={() => onSelect(item.id)}>
            {item.label}
          </button>
        ))}
      </Tabs>
      {HARDWARE_SUBSYSTEMS.map(item => (
        <Panel key={item.id} role="tabpanel" id={`${id}-panel-${item.id}`}
          aria-labelledby={`${id}-tab-${item.id}`} hidden={selected !== item.id} tabIndex={0}>
          {selected === item.id && (
            Content
              ? <Content />
              : <Missing>Placeholder: add the {item.label} notes for this version.</Missing>
          )}
        </Panel>
      ))}
    </section>
  )
}
const Tabs = styled.div`
  display: flex; overflow-x: auto; gap: 0.4rem; padding: 0.4rem;
  border-bottom: 2px solid var(--color-border);
  button { flex: 0 0 auto; min-height: 44px; padding: 0.6rem 0.9rem; border: 1px solid var(--color-border); border-radius: 0.6rem 0.6rem 0 0; font: inherit; background: transparent; color: inherit; cursor: pointer; }
  button[aria-selected="true"] { background: var(--table-head, var(--color-accent)); color: var(--table-head-text, white); }
  button:focus-visible { outline: 3px solid var(--color-accent); outline-offset: 2px; }
`
const Missing = styled.p`
  margin: 0;
  color: var(--color-muted);
`
const Panel = styled.div`
  padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--color-border); border-radius: 0 0 1rem 1rem;
  h3 { margin-top: 0; }
  :focus-visible { outline: 3px solid var(--color-accent); outline-offset: 2px; }
`
