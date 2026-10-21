import React, { useEffect, useRef, useState } from "react"
import { withPrefix } from "gatsby"
import styled from "styled-components"
import { readingLine } from "../../SubpageScene.js"
import { FLOWCHART_SVG } from "./datasetFlowchartSvg.js"
import { useFigureViewer, ViewerButton } from "../FigureViewer.js"

/**
 * The Dataset Generation subsections in page order. Each is one stage of the
 * strip, whose data-stage in the SVG is the subsection heading's anchor (from
 * its text, so rewording a heading means updating both).
 */
export const FLOWCHART_SECTIONS = [
  { id: "plasticome-reference-curation", title: "Plasticome Reference Curation" },
  { id: "cath-assignment", title: "CATH Assignment" },
  { id: "component-assignment", title: "Component Assignment" },
  { id: "ncbi-nr-homology-expansion", title: "NCBI-nr Homology Expansion" },
  { id: "seed-msas-and-catalytic-hmms", title: "Seed MSAs and Catalytic HMMs" },
  { id: "logan-query-extraction", title: "Logan Query Extraction" },
  {
    id: "clustering-and-corpus-structure",
    title: "Clustering and Corpus Structure",
  },
]

/**
 * Where each step sits on the vertical figure and the subsection describing
 * it: the band from its arrow down to its box, as top and height in % of the
 * image height.
 */
const FIGURE_STEPS = [
  { label: "PETadex-PAZy", to: 0, top: 7, height: 7.5 },
  { label: "nr query", to: 2, top: 14.5, height: 13.3 },
  { label: "nr raw hits", to: 3, top: 27.8, height: 13.2 },
  { label: "PETadex-nr", to: 4, top: 41, height: 13.7 },
  { label: "Logan query", to: 5, top: 54.7, height: 13.5 },
  { label: "Logan raw hits", to: 5, top: 68.2, height: 13.4 },
  { label: "PETadex-Logan", to: 5, top: 81.6, height: 14.4 },
]

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/** Smooths the jump of a link to a subsection. */
const jumpToSection = e => {
  const id = e.target.closest?.('a[href^="#"]')?.getAttribute("href").slice(1)
  const el = id && document.getElementById(id)
  if (!el) return
  e.preventDefault()
  const top =
    el.getBoundingClientRect().top +
    window.scrollY -
    (parseFloat(getComputedStyle(el).scrollMarginTop) || 0)
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" })
  window.history.replaceState(null, "", `#${id}`)
}

/**
 * The full pipeline figure with each step clickable: a link over every step's
 * band jumps to the subsection that describes it. The links take the image's
 * clicks, so the figure viewer opens from its corner chip alone.
 */
export const DatasetFlowchartFigure = ({ src: rawSrc, alt = "", title, caption, expandable }) => {
  const viewer = useFigureViewer(expandable)
  // Root-relative srcs point into static/, under the build's path prefix.
  const src = rawSrc.startsWith("/") ? withPrefix(rawSrc) : rawSrc
  return (
    <FigureWrap>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the steps are links; this only smooths their jump */}
      <FigureMap onClick={jumpToSection}>
        <img src={src} alt={alt} width={2363} height={2267} />
        {FIGURE_STEPS.map(({ label, to, top, height }) => {
          const section = FLOWCHART_SECTIONS[to]
          return (
            <a
              key={label}
              href={`#${section.id}`}
              aria-label={`${label}: go to ${section.title}`}
              title={section.title}
              style={{ top: `${top}%`, height: `${height}%` }}
            />
          )
        })}
        {viewer && <ViewerButton src={src} alt={alt} title={title} caption={caption} />}
      </FigureMap>
      {caption && <figcaption>{caption}</figcaption>}
    </FigureWrap>
  )
}

/**
 * The Dataset Generation pipeline as a strip pinned under the header. The
 * stage of the subsection being read stays at full strength and the rest dim.
 * Clicking a stage jumps to its subsection.
 */
export const DatasetFlowchart = () => {
  const rootRef = useRef(null)
  const scrollerRef = useRef(null)
  const [activeId, setActiveId] = useState(null)
  const [past, setPast] = useState(false)
  const [open, setOpen] = useState(true)

  // Follow the reading position with the same line the section menu uses.
  useEffect(() => {
    const root = rootRef.current
    const heads = FLOWCHART_SECTIONS.map(s => {
      const el = document.getElementById(s.id)
      if (!el && process.env.NODE_ENV !== "production") {
        console.warn(`DatasetFlowchart: no heading with id "${s.id}"`)
      }
      return el
    }).filter(Boolean)
    if (!root || heads.length === 0) return undefined

    // The pipeline ends where the next top-level section begins.
    let end = heads[heads.length - 1].nextElementSibling
    while (end && end.tagName !== "H2") end = end.nextElementSibling

    let raf = 0
    const update = () => {
      raf = 0
      const headerH =
        parseFloat(getComputedStyle(root).getPropertyValue("--dl-header")) || 0
      // On narrow screens the section menu is itself a strip pinned under the
      // header, so this one sits below it.
      const menu = document.querySelector("[data-scene-strip]")
      const menuH =
        menu && getComputedStyle(menu).position === "sticky"
          ? menu.offsetHeight
          : 0
      const top = headerH + menuH
      root.style.setProperty("--fc-top", `${top}px`)
      // Jumps to a subsection land its heading below the strip.
      const margin = `${top + root.offsetHeight + 16}px`
      heads.forEach(h => {
        h.style.scrollMarginTop = margin
      })

      // Shared with the section menu: just under this strip while it is
      // pinned, whether open or collapsed.
      const line = readingLine(document, headerH)
      let current = null
      for (const h of heads) {
        if (h.getBoundingClientRect().top > line) break
        current = h.id
      }
      const isPast = !!end && end.getBoundingClientRect().top <= line
      setActiveId(prev => (prev === current ? prev : current))
      setPast(prev => (prev === isPast ? prev : isPast))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    // Images loading above move the headings without a scroll.
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      heads.forEach(h => {
        h.style.scrollMarginTop = ""
      })
    }
  }, [])

  // Mark the active stage; on narrow screens, where the chart scrolls
  // sideways, bring it to the middle.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    let active = null
    scroller.querySelectorAll(".fc-stage").forEach(el => {
      if (el.dataset.stage === activeId) {
        el.setAttribute("aria-current", "step")
        active = el.querySelector(".fc-node") || el
      } else el.removeAttribute("aria-current")
    })
    if (!active || scroller.scrollWidth <= scroller.clientWidth) return
    const frame = scroller.getBoundingClientRect()
    const box = active.getBoundingClientRect()
    scroller.scrollTo({
      left:
        box.left -
        frame.left +
        scroller.scrollLeft +
        box.width / 2 -
        scroller.clientWidth / 2,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }, [activeId, open])

  const activeTitle = FLOWCHART_SECTIONS.find(s => s.id === activeId)?.title

  return (
    <Strip ref={rootRef} data-reading-pin $tracking={!!activeId} $past={past}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the stages are links; this only smooths their jump */}
      <Scroller
        id="dataset-flowchart"
        ref={scrollerRef}
        hidden={!open}
        onClick={jumpToSection}
        dangerouslySetInnerHTML={{ __html: FLOWCHART_SVG }}
      />
      <Toggle
        type="button"
        aria-expanded={open}
        aria-controls="dataset-flowchart"
        $open={open}
        onClick={() => setOpen(o => !o)}
      >
        {!open && (
          <span>
            Pipeline{activeTitle && <b>{activeTitle}</b>}
          </span>
        )}
        {open ? "Hide" : "Show"}
        <svg aria-hidden viewBox="0 0 16 16">
          <path d={open ? "M3 10l5-5 5 5" : "M3 6l5 5 5-5"} />
        </svg>
      </Toggle>
    </Strip>
  )
}

/* About as tall as it is wide, so held to the default figure width (as
   <Figure>) and centred in the column; the viewer shows it full size. */
const FigureWrap = styled.figure`
  width: 100%;
  max-width: 32rem;
  margin: var(--space-lg) auto;

  figcaption {
    margin-top: var(--space-sm);
    font-size: 0.875rem;
  }
`

const FigureMap = styled.div`
  position: relative;

  img {
    width: 100%;
    height: auto;
    border: 1px solid var(--color-border);
    background: rgba(255, 255, 255, 0.28);
  }

  /* One link per step, laid over its band of the image. The extra & outranks
     the article's link underline and hover tint. */
  &&& a {
    position: absolute;
    left: 18.4%;
    width: 64%;
    border: 0;
    border-radius: 0.5rem;
    background: none;
    transition: background-color 0.15s ease;
  }

  &&& a:hover,
  &&& a:focus-visible {
    background: rgba(255, 255, 255, 0.35);
    outline: 2px solid var(--link-active, var(--color-text));
    outline-offset: -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    &&& a {
      transition: none;
    }
  }
`

const Strip = styled.div`
  position: sticky;
  top: calc(var(--fc-top, var(--dl-header, 0px)) + 0.5rem);
  z-index: 1;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
  box-shadow: 0 2px 10px rgba(30, 30, 40, 0.12);
  transition:
    opacity 0.2s ease,
    visibility 0.2s;

  /* Past the pipeline's subsections the strip gets out of the way. */
  ${({ $past }) =>
    $past &&
    `
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    `}

  .fc-stage {
    cursor: pointer;
    transition: opacity 0.2s ease;
    opacity: ${({ $tracking }) => ($tracking ? 0.35 : 1)};
  }

  .fc-stage[aria-current],
  .fc-stage:hover,
  .fc-stage:focus-visible {
    opacity: 1;
  }

  .fc-stage:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    .fc-stage {
      transition: none;
    }
  }
`

/* Open, a small button in the chart's empty top corner; closed, the whole
   strip, naming the subsection being read. */
const Toggle = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  border: 0;
  background: none;
  color: var(--color-muted);
  font: 600 0.75rem / 1 var(--font-body);
  cursor: pointer;

  ${({ $open }) =>
    $open
      ? `
        position: absolute;
        top: 0.3rem;
        right: 0.3rem;
        padding: 0.3rem 0.4rem;
        border-radius: 0.35rem;
        background: var(--color-surface);
      `
      : `
        width: 100%;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
      `}

  span {
    display: flex;
    gap: 0.5rem;
    margin-right: auto;
    overflow: hidden;
    white-space: nowrap;
  }

  b {
    overflow: hidden;
    color: var(--color-text);
    text-overflow: ellipsis;
  }

  svg {
    flex: none;
    width: 0.8rem;
    height: 0.8rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &:hover {
    color: var(--color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: -2px;
  }
`

/* The whole chart fits the text column. Only on narrow screens, where it would
   be too small to read, does it keep a minimum width and scroll sideways. */
const Scroller = styled.div`
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  /* The padding is on the chart itself: a scroller drops its own padding
     after the last item, which would leave the final stage against the edge. */
  .fc {
    display: block;
    box-sizing: border-box;
    width: 100%;
    min-width: 36rem;
    height: auto;
    padding: 0.6rem 0.9rem;
    font-family: var(--font-body);
  }
`
