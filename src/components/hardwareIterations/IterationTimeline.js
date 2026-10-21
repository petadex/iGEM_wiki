import React, { useId, useRef } from "react"
import styled from "styled-components"

const TAB_LABEL = {
  "version-1": "v1",
  "version-2": "v2",
  "version-3": "final",
}

/** Which hardware version the page is showing. Same tab pattern as the other section tabs. */
export function IterationTimeline({ iterations, selectedIndex, onChange }) {
  const labelId = useId()
  const tabsRef = useRef([])

  const move = event => {
    const last = iterations.length - 1
    let next = null
    if (event.key === "ArrowRight") next = selectedIndex === last ? 0 : selectedIndex + 1
    else if (event.key === "ArrowLeft") next = selectedIndex === 0 ? last : selectedIndex - 1
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = last
    if (next === null) return
    event.preventDefault()
    onChange(next)
    requestAnimationFrame(() => tabsRef.current[next]?.focus())
  }

  return (
    <Switcher id="hardware-version">
      <Name id={labelId}>Version</Name>
      <Tabs role="tablist" aria-labelledby={labelId} onKeyDown={move}>
        {iterations.map((iteration, index) => {
          const selected = index === selectedIndex
          return (
            <Tab
              key={iteration.id}
              ref={node => {
                tabsRef.current[index] = node
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={iteration.label}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(index)}
            >
              {TAB_LABEL[iteration.id] || iteration.label}
            </Tab>
          )
        })}
      </Tabs>
    </Switcher>
  )
}

const Switcher = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.85rem;
  width: 100%;
  margin: 0 0 var(--space-md);
  scroll-margin-top: 6rem;
  container-type: inline-size;

  @container (max-width: 22rem) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.2rem;
  }
`

const Name = styled.span`
  flex: 0 0 auto;
  padding: 0.55rem 0 0.65rem;
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const Tabs = styled.div`
  display: flex;
  flex: 1 1 auto;
  align-items: flex-end;
  gap: 0.35rem;
  min-width: 0;
  border-bottom: 1px solid var(--color-border);
`

const Tab = styled.button`
  appearance: none;
  flex: 1 1 0;
  min-width: 0;
  min-height: 44px;
  margin-bottom: -1px;
  padding: 0.45rem 0.85rem;
  border: 1px solid transparent;
  border-bottom: 3px solid transparent;
  border-radius: 0.55rem 0.55rem 0 0;
  background: transparent;
  color: var(--color-muted);
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;

  &[aria-selected="true"] {
    color: var(--color-text);
    background: var(--color-surface, #fff);
    border-color: var(--color-border);
    border-bottom-color: var(--color-accent);
  }

  &:hover {
    color: var(--color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`
