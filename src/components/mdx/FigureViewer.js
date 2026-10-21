import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import styled from "styled-components"
import { Backdrop, Close, windowIn } from "./ExpandWindow.js"

/**
 * Whether figures on the current page open into the figure viewer. The MDX
 * template turns this on for the Dry Lab pages; a <Figure expandable> can
 * still ask for it anywhere, and expandable={false} turns it off for one.
 */
const FigureViewerContext = createContext(false)

export const FigureViewers = ({ enabled, children }) => (
  <FigureViewerContext.Provider value={Boolean(enabled)}>{children}</FigureViewerContext.Provider>
)

export const useFigureViewer = (expandable) => {
  const onPage = useContext(FigureViewerContext)
  return expandable ?? onPage
}

/**
 * A static image that opens into a window over the page, like the overview's
 * expandable figures: the image as large as the window allows, its caption
 * along the bottom. Clicking the image or its Expand chip opens it; clicking
 * the image again, the backdrop, Close or Escape shuts it.
 *
 * Unlike ExpandWindow this renders a copy in a portal rather than pinning the
 * inline figure, since an image has no state to lose, and the portal clears
 * every stacking layer on the page without lifting ancestors.
 */
export const ViewableImage = ({ src, alt = "", title, caption, credit, className }) => {
  const viewer = useViewerWindow()
  const label = title || alt || "Figure"

  return (
    <>
      <Opener
        ref={viewer.openerRef}
        type="button"
        className={className}
        onClick={viewer.show}
        aria-label={`Expand figure: ${label}`}
        aria-haspopup="dialog"
      >
        <img src={src} alt={alt} />
        <Chip aria-hidden="true">Expand ⤢</Chip>
      </Opener>
      <ViewerWindow viewer={viewer} src={src} alt={alt} title={title} caption={caption} credit={credit} />
    </>
  )
}

/**
 * The chip alone, for a figure whose image is already taken up by clicks of
 * its own (the dataset flowchart's step links). It sits in the top-right
 * corner of its nearest positioned ancestor.
 */
export const ViewerButton = ({ src, alt = "", title, caption, credit }) => {
  const viewer = useViewerWindow()
  return (
    <>
      <Chip
        as="button"
        ref={viewer.openerRef}
        type="button"
        onClick={viewer.show}
        aria-label={`Expand figure: ${title || alt || "Figure"}`}
        aria-haspopup="dialog"
      >
        Expand ⤢
      </Chip>
      <ViewerWindow viewer={viewer} src={src} alt={alt} title={title} caption={caption} credit={credit} />
    </>
  )
}

/** Open state for one viewer, and the opener to hand focus back to. */
const useViewerWindow = () => {
  const [open, setOpen] = useState(false)
  const openerRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = e => {
      if (e.key === "Escape") setOpen(false)
    }
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    root.style.overflow = "hidden"
    document.addEventListener("keydown", onKey)
    closeRef.current?.focus({ preventScroll: true })

    const opener = openerRef.current
    return () => {
      root.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
      opener?.focus({ preventScroll: true })
    }
  }, [open])

  return { open, show: () => setOpen(true), hide: () => setOpen(false), openerRef, closeRef }
}

const ViewerWindow = ({ viewer, src, alt, title, caption, credit }) =>
  viewer.open &&
  createPortal(
    <>
      <Backdrop onClick={viewer.hide} aria-hidden="true" />
      <Window role="dialog" aria-modal="true" aria-label={title || alt || "Figure"}>
        <Bar>
          {title && <Title>{title}</Title>}
          <Close ref={viewer.closeRef} type="button" onClick={viewer.hide}>
            Close <span aria-hidden="true">✕</span>
          </Close>
        </Bar>
        <Stage onClick={viewer.hide}>
          <img src={src} alt={alt} />
        </Stage>
        {(caption || credit) && (
          <Caption>
            {caption && <span>{caption}</span>}
            {credit && <small>{credit}</small>}
          </Caption>
        )}
      </Window>
    </>,
    document.body
  )

/* Inline it is the image itself, with a chip in the corner that shows on
   hover or keyboard focus (and always on touch screens, which can't hover). */
const Opener = styled.button`
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  cursor: zoom-in;

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }
`

/* Shows while its figure is hovered or holds focus. Inside the Opener it is
   a span, so a click on it is a click on the image. */
const Chip = styled.span`
  position: absolute;
  z-index: 1;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.6rem;
  border: 0;
  border-radius: 999px;
  background: rgba(10, 10, 10, 0.72);
  color: #fff;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.4;
  opacity: 0;
  transition: opacity 0.15s ease;
  cursor: zoom-in;

  :hover > &,
  :focus-within > &,
  &:focus-visible {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  @media (hover: none) {
    opacity: 1;
  }
`

const Window = styled.div`
  position: fixed;
  z-index: 10001;
  inset: max(2.5vh, 16px) max(2.5vw, 16px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
  background: var(--color-bg);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08);
  animation: ${windowIn} 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: none;
  padding: 0.7rem 0.9rem 0.7rem 1.1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--color-text);
`

const Title = styled.span`
  font-weight: 700;
`

/* The image fills what the bar and caption leave, scaled to fit whole. */
const Stage = styled.div`
  flex: 1;
  min-height: 0;
  padding: 1rem 1.5rem;
  cursor: zoom-out;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

/* A long caption scrolls on its own rather than squeezing the image away. */
const Caption = styled.div`
  flex: none;
  max-height: 30vh;
  overflow: auto;
  padding: 0.9rem 1.5rem 1.1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--color-text);
  font-size: 0.95rem;
  line-height: 1.55;

  > span,
  > small {
    display: block;
    max-width: 72rem;
    margin: 0 auto;
  }

  > small {
    margin-top: 0.35rem;
    color: var(--color-muted);
    font-size: 0.85rem;
  }
`
