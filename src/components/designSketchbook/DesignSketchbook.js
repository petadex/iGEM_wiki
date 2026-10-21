import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import styled from "styled-components"
import { PopupClose } from "../PopupClose"
import { flashConferenceMentions } from "../mdx/embeds.js"
import {
  DESIGN_SKETCHBOOK_PAGES,
  DESIGN_SKETCHBOOK_SECTIONS,
  PAGE_FLIP_ATTRIBUTION,
  buildSketchbookPages,
  continuedTitle,
  getTocSections,
} from "../../data/designSketchbookPages.js"

// import "page-flip/src/Style/stPageFlip.css"

const COVER_BOARD = "#4a3426"
const PAPER = "#f5f0e6"
const PAPER_ART = "https://static.igem.wiki/teams/6187/wiki/outreach/sketchbook/paper-open.avif"
// The 2360×1640 canvas contains a spread at [476, 433, 1566, 1488].
// Show one 545×1055 half per leaf, excluding the transparent margins.
const PAPER_LEFT = `${476 / (2360 - 545) * 100}%`
const PAPER_RIGHT = `${1021 / (2360 - 545) * 100}%`
/** How far the static hardcover peeks past the paper on each outer edge. */
const COVER_OVERHANG_PX = 14

const FLIP_SETTINGS = {
  // Tall page aspect: stretch sizes by width first, then height = width / (w/h).
  // Midway between the earlier short pages and the too-tall pass.
  width: 490,
  height: 950,
  size: "stretch",
  // Narrow enough that the book plus its tab rails fits a phone screen.
  minWidth: 220,
  maxWidth: 800,
  // Low enough that the height cap on BookHost (not this) decides on short screens.
  minHeight: 320,
  maxHeight: 1500,
  showCover: true,
  drawShadow: true,
  flippingTime: 700,
  usePortrait: true,
  mobileScrollSupport: true,
  autoSize: true,
}

const FLIP_WAIT_MS = FLIP_SETTINGS.flippingTime + 80
/** The turning page's shading: a deeper shade of the paper, not black (r, g, b). */
const FLIP_SHADE = "184, 164, 134"
/** page-flip's shading elements, which it restyles every frame. */
const FLIP_SHADOW = /^stf__(outer|inner|hard|hardInner)Shadow$/
/** Black in a style as the browser writes it back (rgb at full opacity). */
const FLIP_BLACK = /rgba?\(0, 0, 0(, [\d.]+)?\)/g

/**
 * A section's photo moves to its own page when, beside the text, it would be
 * shrunk below this share of the page's height (or its own size, if smaller).
 */
const MIN_PHOTO_SHARE = 0.4
/** The page's padding and text get remeasured this long after a resize. */
const RESIZE_SETTLE_MS = 200

/** Each section's first page, whose photo's shape is read as it loads. */
const SPREAD_PAGES = DESIGN_SKETCHBOOK_PAGES.filter((p) => p.variant === "spread")
/** The pages with text, which are measured so none ever has to scroll. */
const TEXT_PAGES = DESIGN_SKETCHBOOK_PAGES.filter(
  (p) => ["spread", "notes", "aside"].includes(p.variant) && typeof p.body === "string" && p.body
)
/** Kept clear under a page's text when it's measured (px), for rounding. */
const FIT_SLACK_PX = 6
/** A run-on page ends on a full stop if one ends in this last share of it. */
const SENTENCE_REACH = 0.4

/** A notes page's small heading: its section, then its own title. */
function pageLabel(page, title = page.title) {
  const section = DESIGN_SKETCHBOOK_SECTIONS.find((s) => s.id === page.sectionId)
  return section ? `${section.label} / ${title}` : title
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Pictures open bigger when clicked (or Enter on them): see the root's
 * capture listeners, since page-flip moves the pages out of React's tree and
 * would otherwise take the press as a page turn.
 */
const ZOOM_SELECTOR = "[data-zoom-src]"
const zoomProps = (src, alt) => ({
  "data-zoom-src": src,
  "data-zoom-alt": alt || "",
  role: "button",
  tabIndex: 0,
  "aria-label": alt ? `Enlarge: ${alt}` : "Enlarge picture",
})

/** Zooming in the enlarged view: up to twice the picture's own pixels, or 4×. */
const ZOOM_MAX_MIN = 4
/** Each −/+ (button or key) step. */
const ZOOM_STEP = 1.6
/** Pointer travel (px) past which a press is a drag, not a click. */
const DRAG_SLOP = 5

/**
 * A picture enlarged over the page, closed with its ✕, Escape or a click
 * outside. It zooms with its −/+ buttons (or the + and − keys), a pinch, or
 * ⌘/Ctrl and scroll, at the pointer; zoomed in, it moves with a drag, scroll
 * or the arrow keys. A click on it zooms in there (a tall one to the
 * screen's width) or back out to fit.
 */
function SketchZoom({ zoom, onClose }) {
  const closeRef = useRef(null)
  const backdropRef = useRef(null)
  const imgRef = useRef(null)
  const [view, setView] = useState({ s: 1, x: 0, y: 0 })
  const [smooth, setSmooth] = useState(true)
  const [dragging, setDragging] = useState(false)
  const viewRef = useRef(view)
  viewRef.current = view
  /** Set by a drag or pinch, so the click that ends it does nothing. */
  const movedRef = useRef(false)

  // The picture's fitted size (transforms aside); it's centred on the screen.
  const fitted = () => ({
    w: Math.max(1, imgRef.current?.offsetWidth || 1),
    h: Math.max(1, imgRef.current?.offsetHeight || 1),
  })
  const maxScale = () =>
    Math.max(ZOOM_MAX_MIN, (2 * (imgRef.current?.naturalWidth || 0)) / fitted().w)
  // Bigger than the screen, it moves only as far as its edges; smaller, it stays centred.
  const clamp = ({ s, x, y }) => {
    const { w, h } = fitted()
    const mx = Math.max(0, (w * s - window.innerWidth) / 2)
    const my = Math.max(0, (h * s - window.innerHeight) / 2)
    return { s, x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) }
  }
  const zoomTo = (scale, px = window.innerWidth / 2, py = window.innerHeight / 2, ease = true) => {
    const v = viewRef.current
    const s = Math.min(maxScale(), Math.max(1, scale))
    // Keep the point under (px, py) there.
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const k = s / v.s
    setSmooth(ease)
    setView(clamp({ s, x: px - cx - (px - cx - v.x) * k, y: py - cy - (py - cy - v.y) * k }))
  }
  const panBy = (dx, dy, ease = false) => {
    const v = viewRef.current
    setSmooth(ease)
    setView(clamp({ ...v, x: v.x + dx, y: v.y + dy }))
  }
  const fit = () => {
    setSmooth(true)
    setView({ s: 1, x: 0, y: 0 })
  }
  const toggleAt = (px, py) => {
    if (viewRef.current.s > 1.01) return fit()
    return zoomTo(Math.max(2.5, (window.innerWidth * 0.92) / fitted().w), px, py)
  }
  const handlers = useRef({})
  handlers.current = { zoomTo, panBy, fit, clamp, onClose }

  useEffect(() => {
    if (!zoom) return undefined
    setView({ s: 1, x: 0, y: 0 })
    const onKey = (event) => {
      const { zoomTo, panBy, fit, onClose } = handlers.current
      const { s } = viewRef.current
      if (event.key === "Escape") onClose()
      else if (event.key === "+" || event.key === "=") zoomTo(s * ZOOM_STEP)
      else if (event.key === "-" || event.key === "_") zoomTo(s / ZOOM_STEP)
      else if (event.key === "0") fit()
      else if (s > 1 && event.key.startsWith("Arrow")) {
        const step = 80
        const [dx, dy] = {
          ArrowLeft: [step, 0],
          ArrowRight: [-step, 0],
          ArrowUp: [0, step],
          ArrowDown: [0, -step],
        }[event.key] || [0, 0]
        panBy(dx, dy, true)
      } else return
      event.preventDefault()
    }
    // Not passive: scrolling here mustn't scroll the page behind.
    const onWheel = (event) => {
      event.preventDefault()
      const { zoomTo, panBy } = handlers.current
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
      if (event.ctrlKey || event.metaKey) {
        zoomTo(viewRef.current.s * Math.exp(-event.deltaY * unit * 0.01), event.clientX, event.clientY, false)
      } else if (viewRef.current.s > 1) {
        panBy(-event.deltaX * unit, -event.deltaY * unit)
      }
    }
    const onResize = () => setView((v) => handlers.current.clamp(v))
    const backdrop = backdropRef.current
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", onResize)
    backdrop?.addEventListener("wheel", onWheel, { passive: false })
    closeRef.current?.querySelector("button")?.focus()
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onResize)
      backdrop?.removeEventListener("wheel", onWheel)
      document.documentElement.style.overflow = overflow
    }
  }, [zoom])

  // Drags pan; two fingers pinch (and pan with their midpoint).
  const pointers = useRef(new Map())
  const onPointerDown = (event) => {
    if (event.button > 0 || event.target.closest("button")) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size === 1) {
      movedRef.current = false
      const start = { x: event.clientX, y: event.clientY }
      const move = (e) => {
        const p = pointers.current.get(e.pointerId)
        if (!p) return
        const prev = [...pointers.current.values()]
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const now = [...pointers.current.values()]
        if (now.length >= 2) {
          movedRef.current = true
          const [a0, b0] = prev
          const [a1, b1] = now
          const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y) || 1
          const d1 = Math.hypot(a1.x - b1.x, a1.y - b1.y)
          const mid = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 }
          handlers.current.panBy(mid.x - (a0.x + b0.x) / 2, mid.y - (a0.y + b0.y) / 2)
          handlers.current.zoomTo(viewRef.current.s * (d1 / d0), mid.x, mid.y, false)
          return
        }
        if (!movedRef.current && Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_SLOP) return
        movedRef.current = true
        if (viewRef.current.s > 1) {
          setDragging(true)
          handlers.current.panBy(e.clientX - p.x, e.clientY - p.y)
        }
      }
      const up = (e) => {
        pointers.current.delete(e.pointerId)
        if (pointers.current.size > 0) return
        setDragging(false)
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
        window.removeEventListener("pointercancel", up)
      }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
      window.addEventListener("pointercancel", up)
    }
  }

  if (!zoom || typeof document === "undefined") return null
  const zoomed = view.s > 1.01
  return createPortal(
    <ZoomBackdrop
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label={zoom.alt || "Enlarged picture"}
      onPointerDown={onPointerDown}
      onClick={() => {
        if (!movedRef.current) onClose()
      }}
    >
      <ZoomFigure ref={closeRef} onClick={(event) => event.stopPropagation()}>
        <ZoomImage
          ref={imgRef}
          src={zoom.src}
          alt={zoom.alt}
          draggable={false}
          $smooth={smooth}
          $cursor={zoomed ? (dragging ? "grabbing" : "grab") : "zoom-in"}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}
          onClick={(event) => {
            if (!movedRef.current) toggleAt(event.clientX, event.clientY)
          }}
        />
        {/* Zoomed, the picture's corner may be off screen: the screen's. */}
        <ZoomClose
          onClose={onClose}
          style={zoomed ? { position: "fixed", top: "16px", right: "16px" } : undefined}
        />
      </ZoomFigure>
      <ZoomTools onClick={(event) => event.stopPropagation()}>
        <ZoomTool type="button" aria-label="Zoom out" title="Zoom out (−)" disabled={!zoomed} onClick={() => zoomTo(view.s / ZOOM_STEP)}>
          −
        </ZoomTool>
        <ZoomTool type="button" aria-label="Fit to screen" title="Fit to screen (0)" disabled={!zoomed} onClick={fit} $wide>
          {zoomed ? `${Math.round(view.s * 100)}%` : "Fit"}
        </ZoomTool>
        <ZoomTool type="button" aria-label="Zoom in" title="Zoom in (+)" disabled={view.s >= maxScale() - 0.01} onClick={() => zoomTo(view.s * ZOOM_STEP)}>
          +
        </ZoomTool>
      </ZoomTools>
    </ZoomBackdrop>,
    document.body,
  )
}

/**
 * A page's `images` ({ src, alt }) in a grid that fills what's left of the
 * page, `cols` across (up to three by default), each kept whole; one caption.
 * An image with `crop` [x0, y0, x1, y1] (of its `size` [w, h]) shows just
 * that part, e.g. one piece of a tall picture split side by side; it still
 * enlarges whole. An image's `span` is how many columns it takes (`rowSpan`,
 * rows), and the page's `rows` (one weight a row) share out the height, for
 * wide and tall pictures mixed.
 */
/** Where a gallery image sits: `span` columns, `rowSpan` rows. */
const cellStyle = ({ span, rowSpan }) =>
  span || rowSpan
    ? {
        gridColumn: span ? `span ${span}` : undefined,
        gridRow: rowSpan ? `span ${rowSpan}` : undefined,
      }
    : undefined

function GalleryFigure({ page }) {
  const n = page.images.length
  const cols = page.cols || Math.min(n, 3)
  return (
    <GalleryWrap>
      <GalleryGrid
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: page.rows
            ? page.rows.map((weight) => `minmax(0, ${weight}fr)`).join(" ")
            : `repeat(${Math.ceil(n / cols)}, minmax(0, 1fr))`,
        }}
      >
        {page.images.map((image) =>
          image.crop ? (
            <GalleryCrop
              key={`${image.src}:${image.crop}`}
              viewBox={`${image.crop[0]} ${image.crop[1]} ${image.crop[2] - image.crop[0]} ${image.crop[3] - image.crop[1]}`}
              preserveAspectRatio="xMidYMin meet"
              style={cellStyle(image)}
              {...zoomProps(image.src, image.alt)}
            >
              {/* Its own viewport clips the picture to the crop (the
                  outer one shows past it where the cell is roomier). */}
              <svg
                x={image.crop[0]}
                y={image.crop[1]}
                width={image.crop[2] - image.crop[0]}
                height={image.crop[3] - image.crop[1]}
                viewBox={`${image.crop[0]} ${image.crop[1]} ${image.crop[2] - image.crop[0]} ${image.crop[3] - image.crop[1]}`}
              >
                <image href={image.src} width={image.size[0]} height={image.size[1]} />
              </svg>
            </GalleryCrop>
          ) : (
            <GalleryImage
              key={image.src}
              src={image.src}
              alt={image.alt || ""}
              loading="lazy"
              style={cellStyle(image)}
              {...zoomProps(image.src, image.alt)}
            />
          ),
        )}
      </GalleryGrid>
      {page.caption && <SketchCaption>{page.caption}</SketchCaption>}
    </GalleryWrap>
  )
}

function SketchPageContent({ page }) {
  if (page.variant === "cover" || page.variant === "back") {
    if (page.coverImage) {
      const [width, height] = page.coverCanvas || [1, 1]
      const [x0, y0, x1, y1] = page.coverCrop || [0, 0, width, height]
      return <CoverArtwork role="img" aria-label={page.coverAlt || page.title}
        style={{
          backgroundImage: `url("${page.coverImage}")`,
          backgroundSize: `${width / (x1 - x0) * 100}% ${height / (y1 - y0) * 100}%`,
          backgroundPosition: `${width === x1 - x0 ? 0 : x0 / (width - (x1 - x0)) * 100}% ${height === y1 - y0 ? 0 : y0 / (height - (y1 - y0)) * 100}%`,
        }} />
    }
    return (
      <SketchPageInner $variant={page.variant}>
        <CoverPlate>
          {page.variant === "cover" && <SketchCoverMark aria-hidden>✎</SketchCoverMark>}
          <SketchTitle>{page.title}</SketchTitle>
          {page.subtitle && <SketchSubtitle>{page.subtitle}</SketchSubtitle>}
          {page.body && <SketchBody>{page.body}</SketchBody>}
        </CoverPlate>
      </SketchPageInner>
    )
  }

  if (page.variant === "toc") {
    const sections = getTocSections(page.tocHalf)
    return (
      <SketchPageInner $variant="toc">
        <SketchTitle>{page.title}</SketchTitle>
        {page.subtitle && <SketchSubtitle>{page.subtitle}</SketchSubtitle>}
        <TocList>
          {sections.map((section) => (
            <TocItem key={section.id}>
              <TocButton
                type="button"
                $color={section.tabColor}
                data-toc-section={section.id}
              >
                <TocSwatch $color={section.tabColor} aria-hidden />
                <TocText>
                  <TocLabel>{section.label}</TocLabel>
                  <TocProgress>{section.progress}</TocProgress>
                </TocText>
              </TocButton>
            </TocItem>
          ))}
        </TocList>
      </SketchPageInner>
    )
  }

  // A section's extra pages are labelled small in its tab colour, so they
  // don't read as a new section.
  const section = DESIGN_SKETCHBOOK_SECTIONS.find((s) => s.id === page.sectionId)
  const label = section && (
    <SketchLabel style={{ "--label-color": section.color }}>
      {section.label} / {page.title}
    </SketchLabel>
  )

  if (page.variant === "aside") {
    return (
      <SketchPageInner $variant="aside">
        {label}
        {page.body && <SketchBody>{page.body}</SketchBody>}
      </SketchPageInner>
    )
  }

  if (page.variant === "notes") {
    return (
      <SketchPageInner $variant="notes">
        {label}
        {page.body && <SketchBody>{page.body}</SketchBody>}
        {page.images ? (
          <GalleryFigure page={page} />
        ) : page.imageSrc ? (
          <SketchFigure>
            <SketchImage src={page.imageSrc} alt={page.imageAlt || ""} {...zoomProps(page.imageSrc, page.imageAlt)} />
            {page.caption && <SketchCaption>{page.caption}</SketchCaption>}
          </SketchFigure>
        ) : (
          <SketchPlaceholder aria-hidden={false}>
            <SketchPlaceholderLabel>Notes / image slot</SketchPlaceholderLabel>
          </SketchPlaceholder>
        )}
      </SketchPageInner>
    )
  }

  if (page.variant === "image") {
    return (
      <SketchPageInner $variant="image">
        {page.images ? (
          <GalleryFigure page={page} />
        ) : (
        <SketchFigure $alone>
          <SketchImage src={page.imageSrc} alt={page.imageAlt || ""} {...zoomProps(page.imageSrc, page.imageAlt)} />
          {page.caption && <SketchCaption>{page.caption}</SketchCaption>}
        </SketchFigure>
        )}
      </SketchPageInner>
    )
  }

  const showMedia = page.variant === "spread"
  return (
    <SketchPageInner $variant={page.variant}>
      <SketchTitle>{page.title}</SketchTitle>
      {page.subtitle && <SketchSubtitle>{page.subtitle}</SketchSubtitle>}
      {page.body && <SketchBody>{page.body}</SketchBody>}
      {showMedia && page.images && <GalleryFigure page={page} />}
      {showMedia && page.imageSrc && (
        <SketchFigure>
          <SketchImage src={page.imageSrc} alt={page.imageAlt || ""} {...zoomProps(page.imageSrc, page.imageAlt)} />
          {page.caption && <SketchCaption>{page.caption}</SketchCaption>}
        </SketchFigure>
      )}
      {showMedia && !page.imageSrc && !page.images && (
        <SketchPlaceholder aria-hidden={false}>
          <SketchPlaceholderLabel>
            {page.imagePlaceholder || "Image coming soon"}
          </SketchPlaceholderLabel>
        </SketchPlaceholder>
      )}
    </SketchPageInner>
  )
}

export function DesignSketchbook() {
  const bookHostRef = useRef(null)
  const bookStageRef = useRef(null)
  const pageFlipRef = useRef(null)
  const flipRunIdRef = useRef(0)
  const [ready, setReady] = useState(false)
  /**
   * How the pages fit at this size (buildSketchbookPages): pages whose photo
   * has its own page, and where text runs on to more pages.
   */
  const [fit, setFit] = useState({ split: [], breaks: {} })
  /** Whether two pages show at once. */
  const [landscape, setLandscape] = useState(true)
  /** One page's size in px, to measure the pages against. */
  const [pageBox, setPageBox] = useState(null)
  /** Height / width of each section's photo, as they load. */
  const [photoRatios, setPhotoRatios] = useState({})
  /** Set once the web fonts are in, so the pages are measured in them. */
  const [fontsReady, setFontsReady] = useState(false)
  const pages = useMemo(
    () => buildSketchbookPages({ ...fit, pairs: landscape }),
    [fit, landscape]
  )
  const pagesRef = useRef(pages)
  pagesRef.current = pages
  const layoutKey = `${landscape ? "pairs" : "single"}:${JSON.stringify(fit)}`
  /** Page to reopen at when the book is rebuilt with a new layout. */
  const resumePageIdRef = useRef(null)
  const measureRef = useRef(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [spreadIndex, setSpreadIndex] = useState(0)
  const [pageCount, setPageCount] = useState(DESIGN_SKETCHBOOK_PAGES.length)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  /** Pixel offsets from BookStage to the visible notebook face. */
  const [tabAnchor, setTabAnchor] = useState({
    top: 48,
    right: 0,
    left: 0,
    bookWidth: 0,
    faceTop: 48,
    faceHeight: 0,
  })

  const navigatingRef = useRef(false)
  const [flipState, setFlipState] = useState("read")
  /** 0 = forward/next, 1 = back/prev — matches StPageFlip FlipDirection. */
  const [flipDirection, setFlipDirection] = useState(null)
  const flipWaitersRef = useRef([])
  const flipStateRef = useRef("read")

  const measureTabAnchor = useCallback(() => {
    const stage = bookStageRef.current
    const host = bookHostRef.current
    if (!stage || !host) return
    // Corner-hover / fold temporarily reveals extra faces. Measuring then
    // stretches the static hardcover across the empty left half of the cover.
    if (flipStateRef.current !== "read") return

    const stageRect = stage.getBoundingClientRect()

    // Use the library's stable layout, never a rotating page's bounding box.
    const flip = pageFlipRef.current
    const rect = flip?.getBoundsRect?.()
    if (!rect?.pageWidth || !rect?.height) return
    const hostRect = host.getBoundingClientRect()
    const currentIndex = flip.getCurrentPageIndex()
    const lastIndex = Math.max(0, flip.getPageCount() - 1)
    const portrait = flip.getOrientation?.() === "portrait"
    const single = portrait || currentIndex === 0 || currentIndex === lastIndex
    const leftOffset = portrait || currentIndex === 0 ? rect.pageWidth : 0
    const useRect = {
      left: hostRect.left + rect.left + leftOffset,
      top: hostRect.top + rect.top,
      width: single ? rect.pageWidth : rect.width,
      height: rect.height,
    }
    useRect.right = useRect.left + useRect.width

    // Tabs start below the notebook top so the page edge leads the tab stack.
    const faceTop = Math.max(0, useRect.top - stageRect.top)
    const faceHeight = Math.max(0, useRect.height)
    const top = Math.max(12, faceTop + 28)
    const right = Math.max(0, stageRect.right - useRect.right)
    const left = Math.max(0, useRect.left - stageRect.left)
    const bookWidth = Math.max(0, useRect.width ?? useRect.right - useRect.left)
    setTabAnchor({ top, right, left, bookWidth, faceTop, faceHeight })

    const hardTop = pageFlipRef.current?.getBoundsRect?.()?.top
    if (typeof hardTop === "number") {
      host.style.setProperty("--sketch-hard-top", `${Math.max(0, hardTop)}px`)
    }
  }, [])

  useEffect(() => {
    setReducedMotion(prefersReducedMotion())
  }, [])

  useLayoutEffect(() => {
    if (!ready) return undefined
    measureTabAnchor()
    const raf = window.requestAnimationFrame(() => {
      measureTabAnchor()
      window.requestAnimationFrame(measureTabAnchor)
    })
    const onResize = () => measureTabAnchor()
    window.addEventListener("resize", onResize)
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measureTabAnchor())
        : null
    if (bookHostRef.current && ro) ro.observe(bookHostRef.current)
    if (bookStageRef.current && ro) ro.observe(bookStageRef.current)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      ro?.disconnect()
    }
  }, [ready, pageIndex, measureTabAnchor])

  const syncIndicesFromFlip = useCallback((flip) => {
    if (!flip) return
    const nextPage = flip.getCurrentPageIndex()
    setPageIndex(nextPage)
    const collection = flip.getPageCollection?.()
    if (collection) {
      setSpreadIndex(collection.getCurrentSpreadIndex())
    }
  }, [])

  const activeSectionId = useMemo(() => {
    if (selectedSectionId) return selectedSectionId
    return pages[pageIndex]?.sectionId || null
  }, [pageIndex, pages, selectedSectionId])

  const getSectionStartIndex = useCallback(
    (sectionId) => {
      const section = DESIGN_SKETCHBOOK_SECTIONS.find((s) => s.id === sectionId)
      return section ? pages.findIndex((p) => p.id === section.startPageId) : -1
    },
    [pages]
  )

  /** Spread index of a section's first page (one page per spread when single). */
  const getSectionSpreadIndex = useCallback(
    (sectionId) => {
      const start = getSectionStartIndex(sectionId)
      if (start < 0) return -1
      if (!landscape) return start
      // With showCover: spread 0 = [0], then pairs [1,2], [3,4], …
      if (start === 0) return 0
      return Math.floor((start - 1) / 2) + 1
    },
    [getSectionStartIndex, landscape]
  )

  const { rightSections, leftSections } = useMemo(() => {
    if (pageIndex === 0) {
      return { rightSections: DESIGN_SKETCHBOOK_SECTIONS, leftSections: [] }
    }
    const right = []
    const left = []
    for (const section of DESIGN_SKETCHBOOK_SECTIONS) {
      const sectionSpread = getSectionSpreadIndex(section.id)
      if (sectionSpread >= 0 && sectionSpread < spreadIndex) {
        left.push(section)
      } else {
        right.push(section)
      }
    }
    return { rightSections: right, leftSections: left }
  }, [getSectionSpreadIndex, pageIndex, spreadIndex])

  const waitForFlipSettle = useCallback((flipInstance, runId) => {
    return new Promise((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        resolve()
      }

      flipWaitersRef.current.push(() => {
        if (flipRunIdRef.current !== runId) {
          finish()
          return
        }
        finish()
      })
      const timeout = window.setTimeout(finish, FLIP_WAIT_MS)
    })
  }, [])

  const isPageInCurrentSpread = useCallback((flip, targetIndex) => {
    const collection = flip.getPageCollection?.()
    if (!collection) return flip.getCurrentPageIndex() === targetIndex
    return (
      collection.getSpreadIndexByPage(targetIndex) === collection.getCurrentSpreadIndex()
    )
  }, [])

  const flipToPageAnimated = useCallback(
    async (targetIndex) => {
      if (targetIndex < 0) return

      if (reducedMotion) {
        const page = DESIGN_SKETCHBOOK_PAGES[targetIndex]
        if (page) {
          document.getElementById(`sketch-${page.id}`)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
        setPageIndex(targetIndex)
        return
      }

      const flip = pageFlipRef.current
      if (!flip || !ready) return

      if (isPageInCurrentSpread(flip, targetIndex)) {
        syncIndicesFromFlip(flip)
        return
      }

      const runId = flipRunIdRef.current + 1
      flipRunIdRef.current = runId
      navigatingRef.current = true
      setNavigating(true)

      try {
        let guard = 0
        const maxSteps = Math.max(pageCount * 2, 24)

        while (!isPageInCurrentSpread(flip, targetIndex) && guard < maxSteps) {
          if (flipRunIdRef.current !== runId) return

          const current = flip.getCurrentPageIndex()
          if (current < targetIndex) {
            setFlipDirection(0)
            flip.flipNext("top")
          } else {
            setFlipDirection(1)
            flip.flipPrev("top")
          }

          await waitForFlipSettle(flip, runId)
          if (flipRunIdRef.current !== runId) return

          syncIndicesFromFlip(flip)
          guard += 1
        }
      } finally {
        if (flipRunIdRef.current === runId) {
          navigatingRef.current = false
          setNavigating(false)
          syncIndicesFromFlip(flip)
        }
      }
    },
    [isPageInCurrentSpread, pageCount, ready, reducedMotion, syncIndicesFromFlip, waitForFlipSettle]
  )

  const goToSection = useCallback(
    (sectionId) => {
      const index = getSectionStartIndex(sectionId)
      if (index < 0) return
      setSelectedSectionId(sectionId)
      flipToPageAnimated(index)
    },
    [flipToPageAnimated, getSectionStartIndex]
  )

  /** One page's size and whether two show at once, as page-flip laid them out. */
  const readPageBox = useCallback((flip) => {
    const rect = flip?.getBoundsRect?.()
    if (!rect?.pageWidth || !rect?.height) return
    const w = Math.round(rect.pageWidth)
    const h = Math.round(rect.height)
    setPageBox((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }))
    setLandscape(flip.getOrientation?.() !== "portrait")
  }, [])

  useEffect(() => {
    let cancelled = false
    SPREAD_PAGES.forEach((page) => {
      if (!page.imageSrc) return
      const img = new Image()
      img.onload = () => {
        if (cancelled || !img.naturalWidth) return
        const ratio = img.naturalHeight / img.naturalWidth
        setPhotoRatios((prev) => ({ ...prev, [page.sectionId]: ratio }))
      }
      img.src = page.imageSrc
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) setFontsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Lay each page with text out at the current page size (off screen, text
  // and caption only). Its photo gets its own page if the room left would
  // shrink it too far, and text that still doesn't fit runs on over more
  // pages, broken where a probe page fills up, so no page ever scrolls.
  useLayoutEffect(() => {
    const layer = measureRef.current
    if (!layer || !pageBox) return
    const probeInner = layer.querySelector("[data-measure-probe]")?.firstElementChild
    const probeLabel = probeInner?.querySelector("[data-probe-label]")
    const probeBody = probeInner?.querySelector("[data-probe-body]")
    if (!probeInner || !probeLabel || !probeBody) return
    const contentBox = (inner) => {
      const style = window.getComputedStyle(inner)
      const padTop = parseFloat(style.paddingTop) || 0
      const padBottom = parseFloat(style.paddingBottom) || 0
      return {
        top: inner.getBoundingClientRect().top + padTop,
        height: inner.clientHeight - padTop - padBottom,
        width:
          inner.clientWidth -
          (parseFloat(style.paddingLeft) || 0) -
          (parseFloat(style.paddingRight) || 0),
      }
    }
    const split = []
    const breaks = {}
    layer.querySelectorAll("[data-measure-page]").forEach((clone) => {
      const page = TEXT_PAGES.find((p) => p.id === clone.getAttribute("data-measure-page"))
      const inner = clone.firstElementChild
      const body = inner?.querySelector("[data-measure-body]")
      if (!page || !body) return
      const box = contentBox(inner)
      const bodyRect = body.getBoundingClientRect()
      const headH = bodyRect.top - box.top
      const figure = inner.querySelector("figure")
      const figureH = figure ? figure.getBoundingClientRect().bottom - bodyRect.bottom : 0
      const hasPhoto = Boolean(page.imageSrc || page.images?.length)
      if (hasPhoto) {
        const photoW = Math.min(box.width, 28 * 16)
        const ratio = page.variant === "spread" ? photoRatios[page.sectionId] ?? 1 : 1
        const left = box.height - headH - bodyRect.height - figureH
        if (left >= Math.min(photoW * ratio, MIN_PHOTO_SHARE * box.height)) return
        split.push(page.id)
      } else if (headH + bodyRect.height <= box.height - FIT_SLACK_PX) {
        return
      }
      // Its text on its own: run it on over as many pages as it needs.
      probeLabel.textContent = pageLabel(page, continuedTitle(page))
      const probeBox = contentBox(probeInner)
      const runOnRoom =
        probeBox.height - (probeBody.getBoundingClientRect().top - probeBox.top) - FIT_SLACK_PX
      const words = page.body.split(/\s+/).filter(Boolean)
      const cuts = []
      let from = 0
      let room = box.height - headH - FIT_SLACK_PX
      const fits = (n) => {
        probeBody.textContent = words.slice(from, from + n).join(" ")
        return probeBody.getBoundingClientRect().height <= room
      }
      while (from < words.length && !fits(words.length - from)) {
        let lo = 1
        let hi = words.length - from - 1
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1
          if (fits(mid)) lo = mid
          else hi = mid - 1
        }
        let n = lo
        for (let k = n; k > Math.floor(n * (1 - SENTENCE_REACH)); k -= 1) {
          if (/[.!?…:]["”’)]?$/.test(words[from + k - 1])) {
            n = k
            break
          }
        }
        from += n
        cuts.push(from)
        room = runOnRoom
      }
      probeBody.textContent = ""
      if (cuts.length) breaks[page.id] = cuts
    })
    split.sort()
    const next = { split, breaks }
    setFit((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
  }, [pageBox, photoRatios, fontsReady])

  const sketchRootRef = useRef(null)
  const goToSectionRef = useRef(goToSection)
  goToSectionRef.current = goToSection

  const [zoom, setZoom] = useState(null)
  const zoomFromRef = useRef(null)
  const closeZoom = useCallback(() => {
    setZoom(null)
    zoomFromRef.current?.focus?.()
  }, [])

  // Pictures enlarge on click, Enter or Space. Pressing one mustn't reach
  // page-flip (it would turn the page), so presses on them stop here.
  useEffect(() => {
    const root = sketchRootRef.current
    if (!root) return undefined
    const zoomTarget = (event) => {
      const target = event.target instanceof Element ? event.target : null
      const img = target?.closest?.(ZOOM_SELECTOR)
      return img && root.contains(img) ? img : null
    }
    const open = (img) => {
      zoomFromRef.current = img
      setZoom({ src: img.getAttribute("data-zoom-src"), alt: img.getAttribute("data-zoom-alt") })
    }
    const onPress = (event) => {
      if (zoomTarget(event)) event.stopPropagation()
    }
    const onClick = (event) => {
      const img = zoomTarget(event)
      if (!img) return
      event.preventDefault()
      event.stopPropagation()
      open(img)
    }
    const onKey = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return
      const img = zoomTarget(event)
      if (!img) return
      event.preventDefault()
      event.stopPropagation()
      open(img)
    }
    const presses = ["mousedown", "touchstart", "pointerdown"]
    presses.forEach((type) => root.addEventListener(type, onPress, true))
    root.addEventListener("click", onClick, true)
    root.addEventListener("keydown", onKey, true)
    return () => {
      presses.forEach((type) => root.removeEventListener(type, onPress, true))
      root.removeEventListener("click", onClick, true)
      root.removeEventListener("keydown", onKey, true)
    }
  }, [])

  // TOC buttons live inside page-flip's reparented DOM — use capture delegation.
  useEffect(() => {
    const root = sketchRootRef.current
    if (!root) return undefined

    const onTocClick = (event) => {
      const target = event.target instanceof Element ? event.target : null
      const button = target?.closest?.("[data-toc-section]")
      if (!button || !root.contains(button)) return
      event.preventDefault()
      event.stopPropagation()
      const sectionId = button.getAttribute("data-toc-section")
      if (sectionId) goToSectionRef.current(sectionId)
    }

    root.addEventListener("click", onTocClick, true)
    return () => root.removeEventListener("click", onTocClick, true)
  }, [])

  useEffect(() => {
    if (reducedMotion || typeof window === "undefined") return undefined

    let cancelled = false
    let flipInstance = null
    // page-flip writes its shading into each shadow's style as it turns:
    // swap its black for the paper's shade as it does.
    const shade = new MutationObserver((records) => {
      records.forEach(({ target }) => {
        if (!FLIP_SHADOW.test(target.className)) return
        const css = target.style.cssText
        const next = css.replace(FLIP_BLACK, (_, alpha) => `rgba(${FLIP_SHADE}${alpha || ", 1"})`)
        if (next !== css) target.style.cssText = next
      })
    })
    // The pages this book is built from (the layout can change under it).
    const instancePages = pagesRef.current
    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => readPageBox(flipInstance), RESIZE_SETTLE_MS)
    }
    window.addEventListener("resize", onResize)

    const init = async () => {
      const host = bookHostRef.current
      if (!host) return

      const pageEls = host.querySelectorAll("[data-sketch-page]")
      if (!pageEls.length) return

      try {
        const { PageFlip } = await import("page-flip")
        if (cancelled) return

        flipInstance = new PageFlip(host, FLIP_SETTINGS)
        pageFlipRef.current = flipInstance

        flipInstance.on("flip", (e) => {
          const nextIndex =
            typeof e.data === "number" ? e.data : flipInstance.getCurrentPageIndex()
          setPageIndex(nextIndex)
          const collection = flipInstance.getPageCollection?.()
          if (collection) setSpreadIndex(collection.getCurrentSpreadIndex())
          if (navigatingRef.current) return
          setSelectedSectionId(instancePages[nextIndex]?.sectionId || null)
        })

        flipInstance.on("changeState", (e) => {
          const prevState = flipStateRef.current
          flipStateRef.current = e.data
          setFlipState(e.data)
          if (
            e.data === "flipping" ||
            e.data === "user_fold" ||
            e.data === "fold_corner"
          ) {
            const dir = flipInstance.getRender?.()?.getDirection?.()
            if (dir === 0 || dir === 1) setFlipDirection(dir)
          }
          if (e.data === "read") {
            setFlipDirection(null)
            const waiters = flipWaitersRef.current
            flipWaitersRef.current = []
            waiters.forEach((fn) => fn())
            const idx = flipInstance.getCurrentPageIndex()
            const last = flipInstance.getPageCount() - 1
            // Cover-corner hover can leave a hard leaf drawn on the empty half.
            if (
              (prevState === "fold_corner" || prevState === "user_fold") &&
              (idx === 0 || idx === last)
            ) {
              flipInstance.update()
            }
            measureTabAnchor()
          }
        })

        flipInstance.loadFromHTML(pageEls)
        shade.observe(host, { attributes: true, attributeFilter: ["style"], subtree: true })
        // Hover-fold on hard covers leaves a board drawn across the empty half.
        const origUserMove = flipInstance.userMove.bind(flipInstance)
        flipInstance.userMove = (pos, isTouch) => {
          const idx = flipInstance.getCurrentPageIndex()
          const last = flipInstance.getPageCount() - 1
          if (!isTouch && (idx === 0 || idx === last)) return
          // Hover (not a drag) over the leaf beside a cover would preview that
          // hard cover turning, which the static hardcover can't follow: the
          // right half of the last spread and the left half of the first.
          if (!isTouch && !flipInstance.isUserTouch) {
            const rect = flipInstance.getBoundsRect?.()
            const onRight = rect ? pos.x >= rect.left + rect.width / 2 : true
            if ((onRight && idx >= last - 2) || (!onRight && idx <= 2)) return
          }
          origUserMove(pos, isTouch)
        }
        setPageCount(flipInstance.getPageCount())
        // Rebuilt for a new layout: reopen where the reader was (a page that's
        // gone, like a photo moved back beside its text, means its section).
        const resumeId = resumePageIdRef.current
        resumePageIdRef.current = null
        if (resumeId) {
          let resumeAt = instancePages.findIndex((p) => p.id === resumeId)
          if (resumeAt < 0) {
            const sectionId = DESIGN_SKETCHBOOK_SECTIONS.find((s) =>
              resumeId.startsWith(s.id)
            )?.id
            resumeAt = instancePages.findIndex((p) => p.id === sectionId)
          }
          if (resumeAt > 0) flipInstance.turnToPage(resumeAt)
        }
        syncIndicesFromFlip(flipInstance)
        readPageBox(flipInstance)
        const hardTop = flipInstance.getBoundsRect?.()?.top
        if (typeof hardTop === "number") {
          host.style.setProperty("--sketch-hard-top", `${Math.max(0, hardTop)}px`)
        }
        setReady(true)
      } catch {
        setReady(false)
      }
    }

    const timer = window.setTimeout(init, 50)

    return () => {
      cancelled = true
      window.removeEventListener("resize", onResize)
      window.clearTimeout(resizeTimer)
      shade.disconnect()
      if (pageFlipRef.current) {
        resumePageIdRef.current =
          instancePages[pageFlipRef.current.getCurrentPageIndex()]?.id ?? null
      }
      flipRunIdRef.current += 1
      navigatingRef.current = false
      window.clearTimeout(timer)
      flipWaitersRef.current = []
      if (pageFlipRef.current) {
        pageFlipRef.current.destroy()
        pageFlipRef.current = null
      }
      setReady(false)
      setNavigating(false)
      flipStateRef.current = "read"
      setFlipState("read")
      setFlipDirection(null)
    }
  }, [reducedMotion, layoutKey, readPageBox])

  const goPrev = (event) => {
    event?.preventDefault()
    event?.stopPropagation()
    if (navigating || !ready) return
    const flip = pageFlipRef.current
    if (!flip || flip.getCurrentPageIndex() <= 0) return
    flipRunIdRef.current += 1
    setSelectedSectionId(null)
    const before = flip.getCurrentPageIndex()
    setFlipDirection(1)
    flip.flipPrev("top")
    window.setTimeout(() => {
      if (pageFlipRef.current !== flip) return
      if (flip.getCurrentPageIndex() === before) {
        flip.turnToPrevPage()
        syncIndicesFromFlip(flip)
      }
    }, FLIP_WAIT_MS)
  }

  const goNext = (event) => {
    event?.preventDefault()
    event?.stopPropagation()
    if (navigating || !ready) return
    const flip = pageFlipRef.current
    if (!flip || flip.getCurrentPageIndex() >= pageCount - 1) return
    flipRunIdRef.current += 1
    setSelectedSectionId(null)
    const before = flip.getCurrentPageIndex()
    setFlipDirection(0)
    flip.flipNext("top")
    window.setTimeout(() => {
      if (pageFlipRef.current !== flip) return
      if (flip.getCurrentPageIndex() === before) {
        flip.turnToNextPage()
        syncIndicesFromFlip(flip)
      }
    }, FLIP_WAIT_MS)
  }

  const bookOpen = pageIndex > 0
  // Hide the static board only while the front or back cover itself is turning —
  // not on the inner flip immediately after (page 2) or before (near the back).
  const lastPage = Math.max(0, pageCount - 1)
  const isTurningCover =
    flipState === "flipping" ||
    flipState === "user_fold" ||
    flipState === "fold_corner"
  const flippingFrontCover =
    isTurningCover && (pageIndex === 0 || (pageIndex <= 2 && flipDirection === 1))
  const flippingBackCover =
    isTurningCover &&
    (pageIndex >= lastPage ||
      (pageIndex >= lastPage - 2 && pageIndex < lastPage && flipDirection === 0))
  const showHardcoverCase =
    bookOpen && pageIndex < lastPage &&
    tabAnchor.bookWidth > 0 &&
    tabAnchor.faceHeight > 0 &&
    !flippingFrontCover &&
    !flippingBackCover
  // Back cover: treat like a closed board so left stubs tuck under the brown.
  const onBackCover =
    pages[pageIndex]?.variant === "back" ||
    (pageIndex > 0 && pageIndex >= lastPage)

  const renderRightTabs = (mode, { embedded = false } = {}) => (
    <TabRail
      role="tablist"
      aria-label="Sketchbook sections"
      $side="right"
      $mode={mode}
      $embedded={embedded}
      $anchored={embedded ? tabAnchor.bookWidth > 0 : true}
    >
      {rightSections.map((section) => {
        const selected = activeSectionId === section.id
        return (
          <SectionTab
            key={section.id}
            type="button"
            role="tab"
            aria-selected={selected}
            title={section.progress}
            $color={section.color}
            $image={section.tabImage}
            $active={selected && mode === "open"}
            $mode={mode}
            $compact={false}
            disabled={!reducedMotion && !ready}
            onClick={() => goToSection(section.id)}
          >
            <SectionTabLabel $mode={mode}>{section.label}</SectionTabLabel>
            {mode === "open" && (
              <SectionTabProgress>{section.progress}</SectionTabProgress>
            )}
          </SectionTab>
        )
      })}
    </TabRail>
  )

  const renderLeftStubs = () => {
    if (!bookOpen || leftSections.length === 0) return null
    return (
      <TabRail
        role="tablist"
        aria-label="Previous sketchbook sections"
        $side="left"
        $mode={onBackCover ? "closed" : "open"}
        $embedded
        $anchored={tabAnchor.bookWidth > 0}
      >
        {leftSections.map((section) => (
          <SectionTab
            key={section.id}
            type="button"
            role="tab"
            aria-label={`Go back to ${section.label}`}
            title={`${section.label}: ${section.progress}`}
            $color={section.color}
            $image={section.tabImage}
            $active={false}
            $mode="open"
            $compact
            disabled={!ready}
            onClick={() => goToSection(section.id)}
          />
        ))}
      </TabRail>
    )
  }

  if (reducedMotion) {
    return (
      <SketchbookRoot ref={sketchRootRef} data-nav-skip="">
        {renderRightTabs("open")}
        <ReducedMotionList aria-label="Design sketchbook pages">
          {DESIGN_SKETCHBOOK_PAGES.map((page, index) => (
            <ReducedMotionPage
              key={page.id}
              id={`sketch-${page.id}`}
              $variant={page.variant}
               $paperX={index % 2 ? PAPER_LEFT : PAPER_RIGHT}
            >
              <SketchPageContent page={page} />
            </ReducedMotionPage>
          ))}
        </ReducedMotionList>
        <SketchZoom zoom={zoom} onClose={closeZoom} />
        <AttributionFooter />
      </SketchbookRoot>
    )
  }

  return (
    <SketchbookRoot ref={sketchRootRef} data-nav-skip="">
      <BookStage
        ref={bookStageRef}
        style={{
          "--sketch-tab-top": `${tabAnchor.top}px`,
          "--sketch-tab-right": `${tabAnchor.right}px`,
          "--sketch-tab-left": `${tabAnchor.left}px`,
          "--sketch-tab-book-width": `${tabAnchor.bookWidth}px`,
          "--sketch-face-top": `${tabAnchor.faceTop}px`,
          "--sketch-face-height": `${tabAnchor.faceHeight}px`,
        }}
        aria-label="Design team sketchbook. Drag a corner or use the buttons to turn pages."
      >
        {renderLeftStubs()}
        {renderRightTabs(bookOpen ? "open" : "closed", { embedded: true })}
        <HardcoverCase
          aria-hidden
          $visible={showHardcoverCase}
          $closed={!bookOpen || onBackCover}
          $back={onBackCover}
        />
        {onBackCover && showHardcoverCase && <BackCoverEdgeMask aria-hidden />}
        <BookHost
          key={layoutKey}
          ref={bookHostRef}
          className="stf__parent"
          $closed={!bookOpen || onBackCover}
        >
          {pages.map((page, index) => (
            <SketchPage
              key={page.id}
               $paperX={index % 2 ? PAPER_LEFT : PAPER_RIGHT}
              data-sketch-page
              data-density={page.density}
              $hard={page.density === "hard"}
              $artwork={Boolean(page.coverImage)}
              className="design-sketchbook-page"
            >
              <SketchPageContent page={page} />
            </SketchPage>
          ))}
        </BookHost>
      </BookStage>

      {pageBox && (
        <MeasureLayer ref={measureRef} aria-hidden>
          {TEXT_PAGES.map((page) => (
            <SketchPage
              key={page.id}
              data-measure-page={page.id}
              style={{ width: pageBox.w, height: pageBox.h }}
            >
              {page.variant === "spread" ? (
                <SketchPageInner $variant="spread">
                  <SketchTitle>{page.title}</SketchTitle>
                  {page.subtitle && <SketchSubtitle>{page.subtitle}</SketchSubtitle>}
                  <SketchBody data-measure-body>{page.body}</SketchBody>
                  {page.images ? (
                    <GalleryWrap style={{ flex: "none" }}>
                      {page.caption && <SketchCaption>{page.caption}</SketchCaption>}
                    </GalleryWrap>
                  ) : (
                    page.imageSrc && (
                      <SketchFigure>
                        {page.caption && <SketchCaption>{page.caption}</SketchCaption>}
                      </SketchFigure>
                    )
                  )}
                </SketchPageInner>
              ) : (
                <SketchPageInner $variant={page.variant}>
                  <SketchLabel>{pageLabel(page)}</SketchLabel>
                  <SketchBody data-measure-body>{page.body}</SketchBody>
                  {page.images ? (
                    <GalleryWrap style={{ flex: "none" }}>
                      {page.caption && <SketchCaption>{page.caption}</SketchCaption>}
                    </GalleryWrap>
                  ) : (
                    page.imageSrc && (
                      <SketchFigure>
                        {page.caption && <SketchCaption>{page.caption}</SketchCaption>}
                      </SketchFigure>
                    )
                  )}
                </SketchPageInner>
              )}
            </SketchPage>
          ))}
          {/* A run-on page, filled word by word to find where each breaks. */}
          <SketchPage data-measure-probe style={{ width: pageBox.w, height: pageBox.h }}>
            <SketchPageInner $variant="aside">
              <SketchLabel data-probe-label />
              <SketchBody data-probe-body />
            </SketchPageInner>
          </SketchPage>
        </MeasureLayer>
      )}

      <Controls>
        <ControlButton
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={goPrev}
          disabled={!ready || navigating || pageIndex <= 0}
        >
          Previous
        </ControlButton>
        <PageIndicator aria-live="polite">
          {!ready
            ? "Loading sketchbook…"
            : navigating
              ? "Turning pages…"
              : `Page ${pageIndex + 1} of ${pageCount}`}
        </PageIndicator>
        <ControlButton
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={goNext}
          disabled={!ready || navigating || pageIndex >= pageCount - 1}
        >
          Next
        </ControlButton>
      </Controls>

      <Hint>
        Named tabs sit on the right. After you pass a section, its tab moves to the left as a
        color stub; tap it to flip back. Open the cover for the table of contents. Click any
        picture in the book to enlarge it.
      </Hint>

      <SketchZoom zoom={zoom} onClose={closeZoom} />
      <AttributionFooter />
    </SketchbookRoot>
  )
}

function AttributionFooter() {
  const { name, author, url, license, npmPackage } = PAGE_FLIP_ATTRIBUTION
  return (
    <Attribution>
      Page-turn effect by{" "}
      <a href={url} target="_blank" rel="noopener noreferrer">
        {name}
      </a>{" "}
      ({license}) by {author}, via{" "}
      <a
        href="https://www.npmjs.com/package/page-flip"
        target="_blank"
        rel="noopener noreferrer"
      >
        {npmPackage}
      </a>
      .
    </Attribution>
  )
}

export default DesignSketchbook

/**
 * The text box's full width: open, the two pages span it; shut, the cover
 * sits where its page does (the right half), its tabs just past the box.
 */
const SketchbookRoot = styled.div`
  position: relative;
  z-index: 0;
  width: 100%;
  max-width: none;
  margin: var(--space-lg) 0;
  overflow: visible;
`

/* How far closed tabs tuck under the outer hardcover rim. */
const TAB_CLOSED_TUCK_PX = 10

const TabRail = styled.div`
  /* Closed front (right) + back cover (left): tabs sit under the brown board */
  z-index: ${({ $mode }) => ($mode === "closed" ? 1 : 4)};
  pointer-events: none;
  display: flex;
  flex-direction: column;
  transition: inset 0.2s ease, width 0.2s ease, opacity 0.15s ease, transform 0.2s ease;
  opacity: ${({ $anchored }) => ($anchored === false ? 0 : 1)};

  ${({ $embedded, $side, $mode }) =>
    $embedded
      ? $side === "left"
        ? `
    /* Flush with notebook left edge — stubs sit outside the page.
       On the back cover ($mode closed), tuck under the hardcover rim. */
    position: absolute;
    top: var(--sketch-tab-top, 18%);
    bottom: auto;
    left: calc(
      var(--sketch-tab-left, 0px)
      ${
        $mode === "closed"
          ? ` + ${TAB_CLOSED_TUCK_PX}px`
          : ""
      }
    );
    width: 1.1rem;
    height: auto;
    justify-content: flex-start;
    gap: 0.4rem;
    transform: translateX(-100%);
  `
        : `
    position: absolute;
    top: var(--sketch-tab-top, 12%);
    bottom: auto;
    left: calc(
      var(--sketch-tab-left, 0px) + var(--sketch-tab-book-width, 0px)
      ${
        $mode === "closed"
          ? ` + ${COVER_OVERHANG_PX - TAB_CLOSED_TUCK_PX}px`
          : ""
      }
    );
    right: auto;
    width: ${$mode === "open" ? "11rem" : "8.2rem"};
    height: auto;
    justify-content: flex-start;
    gap: 0.4rem;
    transform: none;
  `
      : `
    position: relative;
    width: 100%;
    margin: 0 0 0.5rem;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 0.35rem;
    transform: none;
  `}

  > * {
    pointer-events: auto;
  }

  @media (max-width: 720px) {
    ${({ $embedded, $side, $mode }) =>
      $embedded && $side === "right"
        ? `
      /* Keep the artwork's roughly 3.49:1 proportions on phones too. */
      width: 7rem;
    `
        : $embedded && $side === "left"
          ? `
      width: 0.9rem;
    `
          : ""}
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const SectionTab = styled.button`
  appearance: none;
  border: 0;
  background-color: transparent;
  background-image: url("${({ $image }) => $image}");
  background-repeat: no-repeat;
  /* Each file is already one tab. Fill the button with the whole brush. */
  background-size: 100% 100%;
  background-position: center;
  color: #1a1a1a;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 1px 2px rgba(34, 34, 34, 0.12);
  flex: 0 0 auto;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    padding 0.2s ease,
    width 0.2s ease;

  ${({ $compact, $mode }) =>
    $compact
      ? `
    /* Fixed mini stubs — never grow with the notebook */
    border-radius: 5px 0 0 5px;
    border-right: none;
    width: 100%;
    height: 1.35rem;
    min-height: 1.35rem;
    max-height: 1.35rem;
    padding: 0;
  `
      : `
    border-radius: 0 7px 7px 0;
    border-left: none;
    width: 100%;
    padding: ${$mode === "open" ? "0.35rem 0.45rem 0.4rem 0.4rem" : "0.35rem 0.5rem"};
    /* Fixed tab height — do not flex-grow with the stage */
    height: ${$mode === "open" ? "3.15rem" : "2.35rem"};
    min-height: ${$mode === "open" ? "3.15rem" : "2.35rem"};
    max-height: ${$mode === "open" ? "3.15rem" : "2.35rem"};
    overflow: hidden;
  `}

  /* Active section: tuck onto the page face; others stay flush at the edge */
  ${({ $active, $compact }) =>
    $active && !$compact
      ? `
    transform: translateX(-14px);
    z-index: 1;
    box-shadow: -2px 1px 0 rgba(34, 34, 34, 0.08);
  `
      : `
    transform: translateX(0);
  `}

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    ${({ $compact, $active, $mode }) =>
      $compact
        ? `transform: translateX(-3px);`
        : $mode === "closed"
          ? `transform: translateX(3px);`
          : `transform: translateX(${$active ? "-16px" : "-4px"});`}
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  /* Narrow screens: name only (the progress line is hidden), up to two lines. */
  ${({ $compact }) =>
    $compact
      ? ""
      : `
  @media (max-width: 720px) {
    height: 2rem;
    min-height: 2rem;
    max-height: 2rem;
    padding: 0.3rem 0.4rem;
  }
  `}
`

const SectionTabLabel = styled.span`
  display: block;
  font-family: var(--font-body);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.2;
  font-size: ${({ $mode }) => ($mode === "closed" ? "0.68rem" : "0.72rem")};
  margin-bottom: ${({ $mode }) => ($mode === "closed" ? "0" : "0.15rem")};
`

const SectionTabProgress = styled.span`
  display: -webkit-box;

  @media (max-width: 720px) {
    display: none;
  }

  font-family: var(--font-body);
  font-size: 0.58rem;
  line-height: 1.25;
  opacity: 0.88;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const BookStage = styled.div`
  position: relative;
  z-index: 1;
  isolation: isolate;
  width: 100%;
  /* Hug the page-flip aspect box so hard covers aren't vertically centered in empty space. */
  height: auto;
  min-height: 0;
  overflow: visible;
  padding: 0;
  box-sizing: border-box;

  @media (max-width: 720px) {
    padding-left: 2.25rem;
    padding-right: 7.5rem;
  }
`

const HardcoverCase = styled.div`
  position: absolute;
  z-index: ${({ $closed }) => ($closed ? 2 : 0)};
  pointer-events: none;
  left: calc(var(--sketch-tab-left, 0px) - ${COVER_OVERHANG_PX}px);
  top: calc(var(--sketch-face-top, 0px) - ${COVER_OVERHANG_PX}px);
  width: calc(var(--sketch-tab-book-width, 0px) + ${COVER_OVERHANG_PX * 2}px);
  height: calc(var(--sketch-face-height, 0px) + ${COVER_OVERHANG_PX * 2}px);
  /* Front cover rounds the right edge; back cover rounds the left. */
  border-radius: ${({ $back, $closed }) =>
    $back ? "7px 3px 3px 7px" : $closed ? "3px 7px 7px 3px" : "3px 7px 7px 3px"};
  box-shadow: 0 10px 24px rgba(34, 22, 14, 0.22);
  /* Crop the transparent canvas to the open backing artwork. */
  background-image: url("https://static.igem.wiki/teams/6187/wiki/outreach/sketchbook/cover-open.avif");
  background-repeat: no-repeat;
  background-size: ${2360 / 1147 * 100}% ${1640 / 1112 * 100}%;
  background-position: ${447 / (2360 - 1147) * 100}% ${404 / (1640 - 1112) * 100}%;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity ${({ $visible }) => ($visible ? "0.35s ease" : "0s")};
`


/* Narrow brown strip that always paints over tab overlaps on the back cover. */
const BackCoverEdgeMask = styled.div`
  position: absolute;
  z-index: 5;
  pointer-events: none;
  left: calc(var(--sketch-tab-left, 0px) - ${COVER_OVERHANG_PX}px);
  top: calc(var(--sketch-face-top, 0px) - ${COVER_OVERHANG_PX}px);
  width: calc(${COVER_OVERHANG_PX}px + 14px);
  height: calc(var(--sketch-face-height, 0px) + ${COVER_OVERHANG_PX * 2}px);
  border-radius: 7px 0 0 7px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.1), transparent 46%),
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.035) 0 1px,
      transparent 1px 4px
    ),
    ${COVER_BOARD};
`

const BookHost = styled.div`
  position: relative;
  z-index: 3;
  width: 100%;
  height: auto;
  margin: 0 auto;
  max-width: 100%;
  overflow: hidden;
  /* Closed: let peeking tabs receive clicks past the cover. Open: keep page-flip drags. */
  pointer-events: ${({ $closed }) => ($closed ? "none" : "auto")};

  .stf__item {
    pointer-events: auto;
  }

  /*
   * StPageFlip hard covers:
   *  1. rewrite the leaf to top:0 while resting pages sit at getRect().top
   *  2. use transform-origin y=0, so perspective lifts the board during rotateY
   */
  .stf__item.--hard:not(.--simple) {
    top: var(--sketch-hard-top, 0px) !important;
  }

  .stf__item.--hard:not(.--simple).--right {
    transform-origin: 0 50% !important;
  }

  .stf__item.--hard:not(.--simple).--left {
    transform-origin: 100% 50% !important;
  }

  /* Default 2000px perspective makes rotateY boards balloon and lift. */
  .stf__block {
    perspective: 8000px !important;
  }

  /*
   * Never taller than the screen. StPageFlip sizes the wrapper from its width
   * (padding-bottom); here it gets the same shape but a capped height, leaving
   * room for the covers and the Previous / Next buttons. The pages then shrink
   * to that height, keeping their shape, and stay centered.
   */
  .stf__wrapper {
    padding-bottom: 0 !important;
    aspect-ratio: ${FLIP_SETTINGS.width * 2} / ${FLIP_SETTINGS.height};
    max-height: max(20rem, calc(100svh - 10rem));
  }

  .stf__wrapper.--portrait {
    aspect-ratio: ${FLIP_SETTINGS.width} / ${FLIP_SETTINGS.height};
  }
`

const SketchPage = styled.div`
  --paper-x: ${({ $paperX }) => $paperX || PAPER_LEFT};
  &.--left { --paper-x: ${PAPER_LEFT}; }
  &.--right { --paper-x: ${PAPER_RIGHT}; }
  /* Page text and padding scale with the page (cqw), which shrinks on short screens. */
  container-type: inline-size;
  background: ${({ $hard, $artwork }) => ($artwork ? "transparent" : $hard ? COVER_BOARD : PAPER)};
  border: ${({ $artwork }) => $artwork ? "0" : "1px"} solid
    ${({ $hard }) =>
      $hard ? "rgba(34, 34, 34, 0.22)" : "rgba(34, 34, 34, 0.08)"};
  box-sizing: border-box;
  overflow: hidden;
`

const SketchPageInner = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: ${({ $variant }) =>
    $variant === "cover" || $variant === "back" || $variant === "image"
      ? "center"
      : "flex-start"};
  align-items: ${({ $variant }) =>
    $variant === "cover" || $variant === "back" ? "center" : "flex-start"};
  text-align: ${({ $variant }) =>
    $variant === "cover" || $variant === "back" ? "center" : "left"};
  box-sizing: border-box;
  padding: clamp(0.85rem, 7.4cqw, 2rem);
  /* Never scrolls: text that wouldn't fit runs on to more pages (see the
     layout effect that measures them). */
  overflow: hidden;
  height: 100%;
  min-height: 100%;
  width: 100%;
  margin: 0;

  ${({ $variant }) =>
    $variant === "cover" || $variant === "back"
      ? `
    background:
      linear-gradient(145deg, rgba(255, 255, 255, 0.1), transparent 46%),
      repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.035) 0 1px,
        transparent 1px 4px
      ),
      ${COVER_BOARD};
  `
      : `
    background-color: ${PAPER};
    background-image: url("${PAPER_ART}");
    background-repeat: no-repeat;
    background-size: ${2360 / 545 * 100}% ${1640 / 1055 * 100}%;
    background-position: var(--paper-x, ${PAPER_LEFT}) ${433 / (1640 - 1055) * 100}%;
  `}
`

const CoverArtwork = styled.div`
  display: block;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  user-select: none;
`

const CoverPlate = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: min(86%, 22rem);
  padding: 1.35rem 1.15rem 1.45rem;
  background: ${PAPER};
  border-radius: 3px;
  box-shadow:
    0 0 0 1px rgba(255, 248, 235, 0.35),
    0 8px 18px rgba(0, 0, 0, 0.22);
`

const SketchCoverMark = styled.span`
  font-size: 2.5rem;
  line-height: 1;
  margin-bottom: var(--space-sm);
  opacity: 0.45;
`

/**
 * Doubled class (&&): the article's own h3 / p rules (a 4rem top margin, a
 * fixed size) would otherwise reach into the pages and push them down.
 */
const SketchTitle = styled.h3`
  && {
    font-family: var(--font-display);
    font-size: clamp(1.05rem, 6.5cqw, 1.75rem);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-sm);
    line-height: 1.2;
  }
`

const SketchLabel = styled.p`
  && {
    margin: 0 0 var(--space-sm);
    color: var(--label-color);
    font-family: var(--font-body);
    font-size: clamp(0.68rem, 3.1cqw, 0.82rem);
    font-weight: 800;
    letter-spacing: 0.09em;
    line-height: 1.3;
    text-transform: uppercase;
  }
`

const SketchSubtitle = styled.p`
  && {
    font-family: var(--font-body);
    font-size: clamp(0.7rem, 3cqw, 0.8rem);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-muted);
    margin: 0 0 var(--space-md);
  }
`

const SketchBodyText = styled.p`
  && {
    font-family: var(--font-body);
    font-size: clamp(0.75rem, 3.5cqw, 0.95rem);
    line-height: 1.55;
    margin: 0;
    max-width: 36rem;
  }
`

function SketchBody({ children, ...props }) {
  return <SketchBodyText {...props}>{flashConferenceMentions(children)}</SketchBodyText>
}

const TocList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
`

const TocItem = styled.li`
  margin: 0;
`

/** A row per section: its tab's colour beside its name, no box (a tint on hover). */
const TocButton = styled.button`
  appearance: none;
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border: 0;
  border-radius: 6px;
  padding: 0.45rem 0.55rem;
  margin-left: -0.55rem;
  background: transparent;
  cursor: pointer;
  text-align: left;
  pointer-events: auto;
  transition: background-color 0.15s ease;

  &:hover {
    background: color-mix(in srgb, ${({ $color }) => $color} 22%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const TocSwatch = styled.span`
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  margin-top: 0.3rem;
  border-radius: 3px;
  background: ${({ $color }) => $color};
`

const TocText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`

const TocLabel = styled.span`
  font-family: var(--font-body);
  font-size: clamp(0.95rem, 4.6cqw, 1.25rem);
  font-weight: 700;
  color: var(--color-text);
`

const TocProgress = styled.span`
  font-family: var(--font-body);
  font-size: clamp(0.82rem, 3.8cqw, 1.05rem);
  line-height: 1.4;
  color: var(--color-muted);
`

const SketchPlaceholder = styled.div`
  margin-top: var(--space-md);
  width: 100%;
  max-width: 28rem;
  min-height: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  box-sizing: border-box;
  border: 1.5px dashed rgba(34, 34, 34, 0.2);
  border-radius: 4px;
  background: repeating-linear-gradient(
    -45deg,
    rgba(200, 240, 80, 0.08),
    rgba(200, 240, 80, 0.08) 6px,
    transparent 6px,
    transparent 12px
  );
`

const SketchPlaceholderLabel = styled.span`
  font-family: var(--font-body);
  font-size: 0.75rem;
  line-height: 1.4;
  text-align: center;
  color: var(--color-muted);
`

/** Takes the room left under the text; a tall image shrinks to fit the page. */
const GalleryWrap = styled.figure`
  margin: var(--space-sm) 0 0;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

const GalleryGrid = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  gap: 0.5rem;
`

/** Pictures that enlarge when clicked (zoomProps). */
const zoomable = `
  cursor: zoom-in;

  &:focus-visible {
    outline: 2px solid var(--color-accent, #6b7fe6);
    outline-offset: 2px;
  }
`

const GalleryImage = styled.img`
  ${zoomable}
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(34, 34, 34, 0.18));
`

/** A gallery image's `crop`, fitted in its cell like the others. */
const GalleryCrop = styled.svg`
  ${zoomable}
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  filter: drop-shadow(0 1px 2px rgba(34, 34, 34, 0.18));
`

/** Centred on the page (it's narrower than a wide page). */
const SketchFigure = styled.figure`
  margin: ${({ $alone }) => ($alone ? "0" : "var(--space-md) 0 0")};
  align-self: center;
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  flex: 0 1 auto;
  min-height: 0;
`

const SketchImage = styled.img`
  ${zoomable}
  display: block;
  width: 100%;
  height: auto;
  flex: 0 1 auto;
  min-height: 0;
  object-fit: contain;
  object-position: center top;
  border-radius: 4px;
  /* Follows the picture rather than its box, which is wider once it shrinks. */
  filter: drop-shadow(0 1px 2px rgba(34, 34, 34, 0.18));
`

const SketchCaptionText = styled.figcaption`
  flex-shrink: 0;
  margin-top: 0.4rem;
  font-family: var(--font-body);
  font-size: clamp(0.65rem, 2.8cqw, 0.75rem);
  line-height: 1.4;
  color: var(--color-muted);
`

function SketchCaption({ children, ...props }) {
  return <SketchCaptionText {...props}>{flashConferenceMentions(children)}</SketchCaptionText>
}

/** Off-screen copies of the pages, laid out only to be measured. */
const MeasureLayer = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;

  > * {
    position: absolute;
    left: 0;
    top: 0;
  }
`

/** Same side padding as BookStage, so the controls and notes below center on the book. */
const underBook = `
  box-sizing: border-box;
  width: 100%;
  padding-left: 0;
  padding-right: 0;

  /* Doubled class: beats the article's \`p { max-width: 48rem }\`. */
  && {
    max-width: none;
  }

  @media (max-width: 720px) {
    padding-left: 2.25rem;
    padding-right: 7.5rem;
  }
`

const Controls = styled.div`
  ${underBook}
  position: relative;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-md);
  flex-wrap: wrap;
  pointer-events: auto;
`

const ControlButton = styled.button`
  appearance: none;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.45rem 1rem;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--color-accent);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const PageIndicator = styled.p`
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-muted);
  margin: 0;
  min-width: 8rem;
  text-align: center;
`

const Hint = styled.p`
  ${underBook}
  position: relative;
  z-index: 6;
  font-size: 0.75rem;
  color: var(--color-muted);
  text-align: center;
  margin: var(--space-sm) 0 0;
`

const Attribution = styled.p`
  ${underBook}
  font-size: 0.7rem;
  color: var(--color-muted);
  text-align: center;
  margin: var(--space-md) 0 0;
  line-height: 1.5;

  a {
    color: var(--color-text);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`

const ReducedMotionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`

const ReducedMotionPage = styled.div`
  --paper-x: ${({ $paperX }) => $paperX || PAPER_LEFT};
  ${({ $variant }) => ($variant === "cover" || $variant === "back") && `aspect-ratio: ${FLIP_SETTINGS.width} / ${FLIP_SETTINGS.height};`}
  border: 1px solid var(--color-border);
  ${({ $variant }) => ($variant === "cover" || $variant === "back") && "border: 0; border-radius: 0;"}
  border-radius: 6px;
  overflow: hidden;
  min-height: 10rem;
`

const ZoomBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: clamp(28px, 5vw, 56px) clamp(16px, 4vw, 48px);
  overflow: hidden;
  background: rgba(28, 20, 14, 0.82);
  cursor: zoom-out;
  /* Its own pinches and drags, not the browser's. */
  touch-action: none;
`

const ZoomFigure = styled.figure`
  position: relative;
  margin: 0;
  font-size: clamp(1rem, 2.4vw, 1.25rem);
  cursor: default;
`

/** As big as the screen allows, on the sketchbook's paper. */
const ZoomImage = styled.img`
  display: block;
  width: auto;
  height: auto;
  max-width: min(calc(100vw - 2 * clamp(16px, 4vw, 48px)), 1400px);
  max-height: calc(100vh - 2 * clamp(28px, 5vw, 56px));
  object-fit: contain;
  border-radius: 6px;
  background: ${PAPER};
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  cursor: ${({ $cursor }) => $cursor};
  user-select: none;
  transition: ${({ $smooth }) => ($smooth ? "transform 0.25s ease" : "none")};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const ZoomClose = styled(PopupClose)`
  top: -0.8em;
  right: -0.8em;
`

/** −, fit and + along the screen's bottom. */
const ZoomTools = styled.div`
  position: fixed;
  left: 50%;
  bottom: 14px;
  z-index: 3;
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(20, 14, 10, 0.72);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  transform: translateX(-50%);
  cursor: default;
`

const ZoomTool = styled.button`
  min-width: ${({ $wide }) => ($wide ? "4.2em" : "2.2em")};
  height: 2.2em;
  padding: 0 0.6em;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #fff;
  font: 600 15px/1 var(--font-body, sans-serif);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.16);
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 1px;
  }
`
