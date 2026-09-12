import React, { useCallback, useEffect, useRef, useState } from "react"
import styled from "styled-components"
import {
  HARDWARE_JOURNAL_ENTRIES,
  journalHashForDate,
  parseJournalHash,
} from "../../data/hardwareJournalEntries.js"

function formatEntryDate(ymd) {
  const parsed = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return ymd
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed)
}

function FieldBlock({ label, children }) {
  if (!children) return null
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <FieldBody>{children}</FieldBody>
    </Field>
  )
}

function JournalEntryPanel({ entry }) {
  if (!entry) return null

  return (
    <EntryArticle id={journalHashForDate(entry.id)} aria-labelledby={`journal-heading-${entry.id}`}>
      <EntryHeading id={`journal-heading-${entry.id}`}>{formatEntryDate(entry.date)}</EntryHeading>
      <FieldBlock label="Goal">{entry.goal}</FieldBlock>
      <FieldBlock label="Work completed">{entry.workCompleted}</FieldBlock>
      <FieldBlock label="Result">{entry.result}</FieldBlock>
      <FieldBlock label="Next step">{entry.nextStep}</FieldBlock>
      {entry.deliverables?.length > 0 && (
        <Field>
          <FieldLabel>Deliverables</FieldLabel>
          <DeliverableList>
            {entry.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </DeliverableList>
        </Field>
      )}
      {entry.images?.length > 0 && (
        <Field>
          <FieldLabel>Figures</FieldLabel>
          <ImageGrid>
            {entry.images.map((image) => (
              <Figure key={image.src}>
                <FigureImg src={image.src} alt={image.alt || ""} loading="lazy" />
                {image.caption ? <FigureCap>{image.caption}</FigureCap> : null}
              </Figure>
            ))}
          </ImageGrid>
        </Field>
      )}
      {entry.links?.length > 0 && (
        <LinkRow>
          {entry.links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        </LinkRow>
      )}
    </EntryArticle>
  )
}

export function HardwareJournal() {
  const rootRef = useRef(null)
  const readyRef = useRef(false)
  const firstId = HARDWARE_JOURNAL_ENTRIES[0]?.id ?? null
  const [activeId, setActiveId] = useState(firstId)

  const scrollToEntry = useCallback((id, { updateHash = true, behavior = "smooth" } = {}) => {
    const el = document.getElementById(journalHashForDate(id))
    if (el) {
      el.scrollIntoView({ behavior, block: "start" })
    }
    setActiveId(id)
    if (updateHash && typeof window !== "undefined") {
      const hash = journalHashForDate(id)
      const base = window.location.pathname + window.location.search
      window.history.replaceState(null, "", `${base}#${hash}`)
    }
  }, [])

  const scrollToTop = useCallback((behavior = "auto") => {
    if (firstId) {
      const el = document.getElementById(journalHashForDate(firstId))
      if (el) {
        el.scrollIntoView({ behavior, block: "start" })
      } else if (rootRef.current) {
        rootRef.current.scrollIntoView({ behavior, block: "start" })
      }
      setActiveId(firstId)
      if (typeof window !== "undefined") {
        const base = window.location.pathname + window.location.search
        window.history.replaceState(null, "", base)
      }
    }
  }, [firstId])

  useEffect(() => {
    if (typeof window === "undefined") return undefined

    readyRef.current = false
    const hashId = parseJournalHash(window.location.hash)
    const timer = window.setTimeout(() => {
      if (hashId) {
        scrollToEntry(hashId, { updateHash: false, behavior: "auto" })
      } else {
        scrollToTop("auto")
      }
      window.setTimeout(() => {
        readyRef.current = true
      }, 100)
    }, 50)

    const onHashChange = () => {
      const id = parseJournalHash(window.location.hash)
      if (id) {
        scrollToEntry(id, { updateHash: false })
      } else {
        scrollToTop("smooth")
      }
    }

    window.addEventListener("hashchange", onHashChange)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("hashchange", onHashChange)
      readyRef.current = false
    }
  }, [scrollToEntry, scrollToTop])

  useEffect(() => {
    const entries = HARDWARE_JOURNAL_ENTRIES.map((entry) => ({
      id: entry.id,
      el: document.getElementById(journalHashForDate(entry.id)),
    })).filter((item) => item.el)

    if (entries.length === 0) return undefined

    const observer = new IntersectionObserver(
      (observed) => {
        if (!readyRef.current) return

        const visible = observed
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length === 0) return

        const topEntry = entries.find((item) => item.el === visible[0].target)
        if (topEntry) setActiveId(topEntry.id)
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: 0 }
    )

    entries.forEach(({ el }) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <JournalRoot ref={rootRef}>
      <Intro>
        Chronological hardware design notes from team meetings, newest first. Scroll through
        each entry below, or use the date list to jump to a session.
      </Intro>
      <JournalLayout>
        <DateNav role="navigation" aria-label="Journal entries by date">
          {HARDWARE_JOURNAL_ENTRIES.map((entry) => {
            const selected = entry.id === activeId
            return (
              <DateButton
                key={entry.id}
                type="button"
                $selected={selected}
                aria-current={selected ? "true" : undefined}
                onClick={() => scrollToEntry(entry.id)}
              >
                {entry.label}
              </DateButton>
            )
          })}
        </DateNav>
        <EntryFeed>
          {HARDWARE_JOURNAL_ENTRIES.map((entry, index) => (
            <EntryBlock key={entry.id}>
              {index > 0 && <EntryDivider aria-hidden />}
              <JournalEntryPanel entry={entry} />
            </EntryBlock>
          ))}
        </EntryFeed>
      </JournalLayout>
    </JournalRoot>
  )
}

export default HardwareJournal

const JournalRoot = styled.div`
  width: 100%;
  margin: var(--space-md) 0 var(--space-lg);
  scroll-margin-top: 6rem;
`

const Intro = styled.p`
  color: var(--color-muted);
  line-height: 1.7;
  max-width: none;
  margin: 0 0 var(--space-lg);
`

const JournalLayout = styled.div`
  display: grid;
  gap: var(--space-xl);
  align-items: start;

  @media (min-width: 721px) {
    grid-template-columns: minmax(9rem, 11rem) minmax(0, 1fr);
  }
`

const DateNav = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (min-width: 721px) {
    position: sticky;
    top: 96px;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-top: 0.25rem;
  }

  @media (max-width: 720px) {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: var(--space-xs);
    border-bottom: 1px solid var(--color-border);
    -webkit-overflow-scrolling: touch;
  }
`

const DateButton = styled.button`
  appearance: none;
  background: none;
  border: none;
  border-left: 3px solid ${({ $selected }) => ($selected ? "var(--color-accent)" : "var(--color-border)")};
  border-radius: 0;
  padding: 2px 0 2px 8px;
  text-align: left;
  font-family: var(--font-body);
  font-size: 1.0625rem;
  line-height: 1.35;
  font-weight: ${({ $selected }) => ($selected ? 600 : 400)};
  color: ${({ $selected }) => ($selected ? "var(--color-accent)" : "var(--color-muted)")};
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: var(--color-accent);
    border-left-color: var(--color-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  @media (max-width: 720px) {
    border-left: none;
    border-bottom: 2px solid ${({ $selected }) => ($selected ? "var(--color-accent)" : "transparent")};
    padding: 0.45rem 0.85rem;
    font-size: 0.9375rem;
    flex-shrink: 0;
  }
`

const EntryFeed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  min-width: 0;
`

const EntryBlock = styled.div`
  width: 100%;
`

const EntryDivider = styled.hr`
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-xl) 0;
`

const EntryArticle = styled.article`
  scroll-margin-top: 6rem;
`

const EntryHeading = styled.h2`
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2.5vw, 1.6rem);
  font-weight: 400;
  color: var(--color-text);
  margin: 0 0 var(--space-md);
  line-height: 1.2;
`

const Field = styled.div`
  & + & {
    margin-top: var(--space-md);
  }
`

const FieldLabel = styled.p`
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 0.35rem;
`

const FieldBody = styled.p`
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--color-muted);
  margin: 0;
  max-width: none;
`

const DeliverableList = styled.ul`
  margin: 0;
  padding-left: 1.2rem;
  color: var(--color-muted);
  font-size: 0.95rem;
  line-height: 1.65;
  max-width: none;

  li + li {
    margin-top: 0.35rem;
  }
`

const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm) var(--space-md);
  margin-top: var(--space-lg);

  a {
    font-size: 0.875rem;
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: var(--space-md);
`

const Figure = styled.figure`
  margin: 0;
  min-width: 0;
`

const FigureImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: #0f0f0f;
`

const FigureCap = styled.figcaption`
  margin-top: 0.4rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--color-muted);
`
