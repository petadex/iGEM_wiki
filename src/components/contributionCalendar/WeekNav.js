import React, { useCallback, useEffect, useId, useRef, useState } from "react"
import styled from "styled-components"
import { formatWeekRange } from "../../data/contributionCalendar/calendarUtils.js"
import { CONTRIBUTION_WEEKS } from "../../data/contributionCalendar/weeks.js"

export function WeekNav({ selectedWeekId, onSelect }) {
  const listboxId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)

  const index = CONTRIBUTION_WEEKS.findIndex((w) => w.id === selectedWeekId)
  const current = CONTRIBUTION_WEEKS[index >= 0 ? index : 0]
  const label = current ? formatWeekRange(current.start, current.end) : "Select week"

  const goPrev = useCallback(() => {
    if (index > 0) onSelect(CONTRIBUTION_WEEKS[index - 1].id)
  }, [index, onSelect])

  const goNext = useCallback(() => {
    if (index < CONTRIBUTION_WEEKS.length - 1) {
      onSelect(CONTRIBUTION_WEEKS[index + 1].id)
    }
  }, [index, onSelect])

  const pickWeek = useCallback(
    (id) => {
      onSelect(id)
      setOpen(false)
    },
    [onSelect]
  )

  useEffect(() => {
    if (!open || !rootRef.current) return undefined
    const active = rootRef.current.querySelector('[aria-selected="true"]')
    active?.scrollIntoView({ block: "nearest" })
    return undefined
  }, [open, selectedWeekId])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <Header ref={rootRef}>
      <ArrowBtn
        type="button"
        onClick={goPrev}
        disabled={index <= 0}
        aria-label="Previous week"
      >
        ‹
      </ArrowBtn>

      <WeekTriggerWrap>
        <WeekTrigger
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
        >
          <WeekLabel>{label}</WeekLabel>
          <Chevron $open={open} aria-hidden>
            ▾
          </Chevron>
        </WeekTrigger>

        {open && (
          <WeekDropdown id={listboxId} role="listbox" aria-label="Choose week">
            {CONTRIBUTION_WEEKS.map((w) => (
              <WeekOption
                key={w.id}
                type="button"
                role="option"
                aria-selected={w.id === selectedWeekId}
                $active={w.id === selectedWeekId}
                onClick={() => pickWeek(w.id)}
              >
                {formatWeekRange(w.start, w.end)}
              </WeekOption>
            ))}
          </WeekDropdown>
        )}
      </WeekTriggerWrap>

      <ArrowBtn
        type="button"
        onClick={goNext}
        disabled={index >= CONTRIBUTION_WEEKS.length - 1}
        aria-label="Next week"
      >
        ›
      </ArrowBtn>
    </Header>
  )
}

const Header = styled.div`
  display: grid;
  grid-template-columns: 2.25rem 1fr 2.25rem;
  align-items: center;
  column-gap: var(--space-sm);
  margin-bottom: 0;
  position: relative;
  flex-shrink: 0;
  width: 100%;
`

const ArrowBtn = styled.button`
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--cal-line, var(--color-border));
  border-radius: 6px;
  background: var(--cal-surface, #fff);
  color: var(--cal-accent, #2d9194);
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: var(--cal-hover, #f5f5f2);
    border-color: var(--cal-accent, #2d9194);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const WeekTriggerWrap = styled.div`
  position: relative;
  min-width: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

const WeekTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: none;
  background: transparent;
  font-family: var(--font-display);
  font-size: clamp(1rem, 1.4vw, 1.25rem);
  font-weight: 700;
  color: var(--cal-ink, #06202b);
  cursor: pointer;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  max-width: 100%;
  text-align: center;

  &:hover {
    color: var(--cal-accent, #2d9194);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }
`

const WeekLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Chevron = styled.span`
  font-size: 0.75rem;
  color: var(--cal-accent, #2d9194);
  flex-shrink: 0;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "none")};
  transition: transform 0.15s ease;
`

const WeekDropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 13rem;
  max-width: min(20rem, 90vw);
  max-height: 14rem;
  overflow-y: auto;
  background: var(--cal-surface, #fff);
  border: 1px solid var(--cal-line, var(--color-border));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 0.35rem;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const WeekOption = styled.button`
  text-align: left;
  border: none;
  background: ${({ $active }) => ($active ? "var(--cal-tint, rgba(45, 145, 148, 0.12))" : "transparent")};
  color: ${({ $active }) => ($active ? "var(--cal-accent, #2d9194)" : "var(--cal-ink, #06202b)")};
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  padding: 0.45rem 0.55rem;
  border-radius: 4px;
  cursor: pointer;
  line-height: 1.3;

  &:hover {
    background: var(--cal-tint, rgba(45, 145, 148, 0.1));
    color: var(--cal-accent, #2d9194);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }
`

export default WeekNav
