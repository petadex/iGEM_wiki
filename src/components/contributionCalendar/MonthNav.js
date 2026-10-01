import React, { useCallback, useEffect, useId, useRef, useState } from "react"
import styled from "styled-components"
import { CONTRIBUTION_MONTHS } from "../../data/contributionCalendar/calendarUtils.js"

export function MonthNav({ selectedKey, onSelect }) {
  const listboxId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)

  const index = CONTRIBUTION_MONTHS.findIndex((m) => m.key === selectedKey)
  const current = CONTRIBUTION_MONTHS[index >= 0 ? index : 0]

  const goPrev = useCallback(() => {
    if (index > 0) onSelect(CONTRIBUTION_MONTHS[index - 1].key)
  }, [index, onSelect])

  const goNext = useCallback(() => {
    if (index < CONTRIBUTION_MONTHS.length - 1) {
      onSelect(CONTRIBUTION_MONTHS[index + 1].key)
    }
  }, [index, onSelect])

  const pickMonth = useCallback(
    (key) => {
      onSelect(key)
      setOpen(false)
    },
    [onSelect]
  )

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
        aria-label="Previous month"
      >
        ‹
      </ArrowBtn>

      <MonthTriggerWrap>
        <MonthTrigger
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
        >
          {current.label}
          <YearSpan>2026</YearSpan>
          <Chevron $open={open} aria-hidden>
            ▾
          </Chevron>
        </MonthTrigger>

        {open && (
          <MonthDropdown id={listboxId} role="listbox" aria-label="Choose month">
            {CONTRIBUTION_MONTHS.map((m) => (
              <MonthOption
                key={m.key}
                type="button"
                role="option"
                aria-selected={m.key === selectedKey}
                $active={m.key === selectedKey}
                onClick={() => pickMonth(m.key)}
              >
                {m.label}
              </MonthOption>
            ))}
          </MonthDropdown>
        )}
      </MonthTriggerWrap>

      <ArrowBtn
        type="button"
        onClick={goNext}
        disabled={index >= CONTRIBUTION_MONTHS.length - 1}
        aria-label="Next month"
      >
        ›
      </ArrowBtn>
    </Header>
  )
}

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  position: relative;
  flex-shrink: 0;
`

const ArrowBtn = styled.button`
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: #fff;
  color: #2d9194;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #f5f5f2;
    border-color: #2d9194;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const MonthTriggerWrap = styled.div`
  position: relative;
  min-width: 10rem;
`

const MonthTrigger = styled.button`
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  border: none;
  background: transparent;
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 2.5vw, 1.75rem);
  font-weight: 700;
  color: #06202b;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;

  &:hover {
    color: #2d9194;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }
`

const YearSpan = styled.span`
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--color-muted);
  font-weight: 500;
`

const Chevron = styled.span`
  font-size: 0.75rem;
  color: #2d9194;
  margin-left: 0.15rem;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "none")};
  transition: transform 0.15s ease;
`

const MonthDropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 11rem;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 0.35rem;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const MonthOption = styled.button`
  text-align: left;
  border: none;
  background: ${({ $active }) => ($active ? "rgba(45,145,148,0.12)" : "transparent")};
  color: ${({ $active }) => ($active ? "#2d9194" : "#06202b")};
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  padding: 0.5rem 0.65rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: rgba(45, 145, 148, 0.1);
    color: #2d9194;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }
`

export default MonthNav
