import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { Link } from "gatsby"
import styled, { css, keyframes } from "styled-components"
import data from "../data/homeMap.json"
import { artFont, artPx, phone } from "./artScale.js"
import {
  PIN_CROP,
  PIN_FRAME,
  PIN_SRC,
  lngLatToPct,
  lngLatToPctClamped,
  graticule,
} from "./mapProjection.js"

/**
 * The painted world map under the Logan paragraph, told in four stages as it
 * scrolls past, the last three in the same order as the landscape's
 * 1a → 1c → 2a:
 *
 *   0  Empty      the painted map on its own, so the reader sees it whole
 *   1  PAZy       the known enzymes; pins where a paper names the site
 *   2  PETadex    BioSamples spread out from the PAZy families, then the rest
 *   3  Ecosystems the landscape's five site callouts, labelled as there
 *
 * Like the forest walk below it, the map does not play while it scrolls by:
 * HomeScrollPrototype pins the painting with the map in view and feeds this
 * component its progress through that hold (`ref.current.update(p)`), so the
 * four stages read as slides over a still map.
 *
 * Data: src/data/homeMap.json (scripts/export-home-map.py).
 */

/**
 * Progress through the hold where each stage begins. PETadex takes the longest
 * run: it is the one stage where something grows while the reader scrolls.
 * Its count finishes at EXPAND_END, and the full map holds still a beat before
 * the ecosystems come in.
 */
const STAGE_AT = [0, 0.124, 0.351, 0.867]
const EXPAND_END = 0.764

/**
 * Every BioSample in PETadex (the Model page's 6.8M; exact figure from
 * profile_summary.json, on the BioSample profiles Methods page). The map's
 * dots are only the 11,562 of them with coordinates, so the count runs to
 * this instead.
 */
const PETADEX_BIOSAMPLES = 6796722

/** How sharply the dots' spread bends upward: slow at first, then faster. */
const GROWTH = 4

const PAZY_COLOR = "#c4561d"
const PETADEX_COLOR = "#2f5d4a"

const GRATICULE = graticule()
const fmt = n => n.toLocaleString("en-US")

const PINS = data.pazy.pins.map(pin => ({
  ...pin,
  pos: lngLatToPct(pin.lon, pin.lat),
}))

/**
 * Cells holding a PAZy family come first, nearest the pins first, so the dots
 * spread out from them; the rest of PETadex follows.
 */
const CELLS = (() => {
  const near = cell =>
    Math.min(
      ...PINS.map(pin => Math.hypot(pin.lat - cell.lat, pin.lon - cell.lon)),
    )
  return data.petadex.cells
    .map(cell => ({ ...cell, pos: lngLatToPct(cell.lon, cell.lat) }))
    .filter(cell => cell.pos)
    .map(cell => ({ ...cell, order: (cell.pazy ? 0 : 1000) + near(cell) }))
    .sort((a, b) => a.order - b.order)
})()

/** Small seeded PRNG, so the scatter is the same on every visit. */
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Each grid cell drawn as a few dots scattered around it. On the 2° grid the
 * ship transects (a handful of samples per cell, cell after cell) came out as
 * ruled lines across the oceans; sparse cells scatter wider so those break up
 * into a spray, while dense cells on land stay close to where they are.
 */
const DOTS = (() => {
  const dots = []
  CELLS.forEach((cell, order) => {
    const rand = mulberry32(order + 1)
    const n = cell.samples >= 12 ? 3 : cell.samples >= 4 ? 2 : 1
    const spread = cell.samples <= 3 ? 4 : cell.samples <= 12 ? 2 : 1
    for (let k = 0; k < n; k++) {
      const pos = lngLatToPct(
        cell.lon + (rand() * 2 - 1) * spread,
        cell.lat + (rand() * 2 - 1) * spread,
      )
      if (!pos) continue
      dots.push({ order, pos, pazy: cell.pazy, samples: cell.samples / n })
    }
  })
  return dots
})()

/**
 * Each site's BioSample in the Model page's BioSample viewer, as its pop-out
 * shows it: the `key` of src/data/biosampleExamples.json the viewer opens on,
 * and that entry's accession, `why` and ORF count. Copied here rather than
 * imported, since the file carries every ORF's sequence (~90 KB) and the
 * home page needs three fields of it.
 */
const SITE_SAMPLE = {
  "Arctic Canada": {
    key: "arctic_canada",
    biosample: "SAMN03075713",
    why: "Tundra soil, Axel Heiberg Island, Nunavut (79.4° N)",
    orfs: 934,
  },
  Antarctica: {
    key: "antarctica",
    biosample: "SAMN14845652",
    why: "Polar desert soil, McMurdo Dry Valleys region (76.4° S)",
    orfs: 1370,
  },
  Yellowstone: {
    key: "yellowstone",
    biosample: "SAMN14510639",
    why: "Octopus Spring, Lower Geyser Basin; every ORF in a hot-spring-dominated cluster",
    orfs: 18,
  },
  Alps: {
    key: "alps",
    biosample: "SAMN29179893",
    why: "Alpine grassland soil, Wannegrat, Switzerland; 2,592 m",
    orfs: 19,
  },
  "South Africa": {
    key: "south_africa",
    biosample: "SAMN03445079",
    why: "Cyanide and thiocyanate bioreactor, University of Cape Town (PRJNA279279)",
    orfs: 1795,
  },
  "Lake Chapala": {
    key: "lake_chapala",
    biosample: "SAMN29252289",
    why: "Lake water; pH 9.51 measured",
    orfs: 1562,
  },
  "Red Sea brine pool": {
    key: "red_sea_brine",
    biosample: "SAMN13483622",
    why: "Brine pool water; 110.7 psu measured (about 3x seawater)",
    orfs: 394,
  },
  "Lake Baikal": {
    key: "lake_baikal",
    biosample: "SAMN37013656",
    why: "Lake water; profiled freshwater",
    orfs: 237,
  },
  "Tropical peat swamp": {
    key: "borneo_peat",
    biosample: "SAMN33440591",
    why: "Tropical peat, Sarawak; pH 3.30 measured, the landmark's value",
    orfs: 3487,
  },
  "Hot springs": {
    key: "kagoshima_hot_spring",
    biosample: "SAMD00155364",
    why: "Kirishima hot spring water; 84.5 °C measured",
    orfs: 66,
  },
}

const SITES = data.sites.items.map(site => {
  const sample = SITE_SAMPLE[site.label] || null
  return {
    ...site,
    pos: lngLatToPctClamped(site.lon, site.lat),
    sample,
    href: sample
      ? `/dry-lab/model/?biosample=${sample.key}#biosample-viewer`
      : null,
  }
})

/**
 * A clicked ecosystem, popped out of its circle into a card in the middle of
 * the screen: the photo large, what the place is, how much of PETadex comes
 * from there, and its BioSample with a link into the Model page's viewer.
 * In a portal, as the map sits inside the pinned painting. Escape, a click
 * outside or a scroll puts it back.
 */
const SitePopout = ({ site, x, y, onClose }) => {
  const closeRef = useRef(null)

  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    window.addEventListener("scroll", onClose, { passive: true })
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onClose)
    }
  }, [onClose])

  const { sample } = site
  const kind =
    site.habitat || (site.kind === "landmark" ? "Landmark ecosystem" : "Sampling site")

  return createPortal(
    <>
      <PopBackdrop onClick={onClose} aria-hidden="true" />
      <Popout
        role="dialog"
        aria-labelledby="eco-popout-title"
        style={{
          "--from-x": `${x - window.innerWidth / 2}px`,
          "--from-y": `${y - window.innerHeight / 2}px`,
        }}
      >
        {site.image && <PopPhoto src={site.image} alt="" />}
        <PopClose ref={closeRef} type="button" onClick={onClose} aria-label="Close">
          ✕
        </PopClose>
        <PopBody>
          <PopKicker>{kind}</PopKicker>
          <PopTitle id="eco-popout-title">{site.label}</PopTitle>
          <PopNote>{site.note}</PopNote>
          {site.samples != null && (
            <PopStat>
              <strong>{fmt(site.samples)}</strong> mapped BioSamples in PETadex
              from here
            </PopStat>
          )}
          {sample && (
            <PopSample>
              <PopSampleHead>
                One of its BioSamples · <code>{sample.biosample}</code>
              </PopSampleHead>
              {sample.why} · {fmt(sample.orfs)} ORFs
            </PopSample>
          )}
          {site.href && (
            <PopLink to={site.href}>Open it in the BioSample viewer →</PopLink>
          )}
        </PopBody>
      </Popout>
    </>,
    document.body,
  )
}

/**
 * How the ecosystems are drawn: "circle" (photo in a circle, name under it) or
 * "tag" (the earlier photo-and-name pill). `?ecoStyle=tag` shows the other one.
 */
const SITE_STYLE = "circle"

/**
 * PAZy's own count. pazy_enzymes.csv holds the ones plasticome could map to an
 * atlas family, which is fewer.
 */
const PAZY_TOTAL = 495

/** The paint runs below the band (to Tierra del Fuego); so does the canvas. */
const CANVAS_OVERHANG = 1.25

const clamp01 = v => Math.max(0, Math.min(1, v))
const grow = t => Math.expm1(GROWTH * t) / Math.expm1(GROWTH)

function stageFor(p) {
  for (let i = STAGE_AT.length - 1; i > 0; i--) if (p >= STAGE_AT[i]) return i
  return 0
}

/** 0–1 through the expansion (stage 2), linear in scroll; 1 once past it. */
function expandFor(p) {
  return clamp01((p - STAGE_AT[2]) / (EXPAND_END - STAGE_AT[2]))
}

/**
 * The count at that point: an equal share of the scroll in each run of digits
 * (1–9, 10–99, … 1,000,000–6,796,722), climbing evenly through each.
 */
const COUNT_DIGITS = String(PETADEX_BIOSAMPLES).length
function countFor(p) {
  const t = expandFor(p)
  if (t <= 0) return 0
  const k = Math.min(COUNT_DIGITS - 1, Math.floor(t * COUNT_DIGITS))
  const lo = 10 ** k
  const hi = k === COUNT_DIGITS - 1 ? PETADEX_BIOSAMPLES : 10 ** (k + 1)
  return Math.round(lo * (hi / lo) ** (t * COUNT_DIGITS - k))
}

function drawCells(canvas, p) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const fullH = canvas.clientHeight
  if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr)
  if (canvas.height !== Math.round(fullH * dpr))
    canvas.height = Math.round(fullH * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, fullH)
  // The canvas runs CANVAS_OVERHANG past the band; positions are band-relative.
  const h = fullH / CANVAS_OVERHANG

  // The dots creep out from the PAZy pins, then sweep the map.
  const t = grow(expandFor(p))
  const shown = Math.round(CELLS.length * t)
  if (!shown) return
  const unit = w / 1440
  ctx.globalAlpha = stageFor(p) === 3 ? 0.32 : 0.82
  for (const dot of DOTS) {
    if (dot.order >= shown) continue
    const r = Math.min(8, 1.6 + Math.sqrt(dot.samples) * 0.55) * unit * 1.4
    ctx.fillStyle = dot.pazy ? PAZY_COLOR : PETADEX_COLOR
    ctx.beginPath()
    ctx.arc(
      (dot.pos.left / 100) * w,
      (dot.pos.top / 100) * h,
      r,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

export const HomeEcosystemMap = forwardRef(
  function HomeEcosystemMap(_props, ref) {
    const canvasRef = useRef(null)
    const countRef = useRef(null)
    const progressRef = useRef(0)
    const [stage, setStage] = useState(0)
    const [calibrate, setCalibrate] = useState(false)
    const [siteStyle, setSiteStyle] = useState(SITE_STYLE)
    /** The ecosystem popped out, and the point on screen it grew from. */
    const [popout, setPopout] = useState(null)
    const popOpenerRef = useRef(null)

    const openSite = (site, e) => {
      const r = e.currentTarget.getBoundingClientRect()
      popOpenerRef.current = e.currentTarget
      setPopout({ site, x: r.left + r.width / 2, y: r.top + r.height / 2 })
    }
    const closeSite = useCallback(() => {
      setPopout(null)
      popOpenerRef.current?.focus({ preventScroll: true })
    }, [])

    useEffect(() => {
      const params = new URLSearchParams(window.location.search)
      setCalibrate(params.get("mapCalibrate") === "1")
      const style = params.get("ecoStyle")
      if (style === "tag" || style === "circle") setSiteStyle(style)
    }, [])

    const paint = p => {
      if (canvasRef.current) drawCells(canvasRef.current, p)
      if (countRef.current) {
        countRef.current.textContent = fmt(countFor(p))
      }
    }

    // Called from the page's scroll tick, every frame the hold moves.
    useImperativeHandle(ref, () => ({
      update(p) {
        const next = clamp01(p)
        if (next === progressRef.current) return
        progressRef.current = next
        setStage(stageFor(next))
        paint(next)
      },
    }))

    useEffect(() => {
      const redraw = () => paint(progressRef.current)
      redraw()
      window.addEventListener("resize", redraw)
      return () => window.removeEventListener("resize", redraw)
    }, [])

    // The ecosystems leave with stage 3, and take an open pop-out with them.
    useEffect(() => {
      if (stage !== 3) setPopout(null)
    }, [stage])

    // The counter mounts with stage 2, after the frame that would have filled it.
    useEffect(() => {
      if (countRef.current) {
        countRef.current.textContent = fmt(countFor(progressRef.current))
      }
    }, [stage])

    return (
      <MapRoot
        role="group"
        aria-label="From PAZy to PETadex to ecosystems, on the world map"
        data-stage={stage}
      >
        {calibrate ? (
          <CalibrateGrid viewBox="0 0 100 100" preserveAspectRatio="none">
            {GRATICULE.map(([a, b], i) => (
              <line
                key={i}
                x1={a.left}
                y1={a.top}
                x2={b.left}
                y2={b.top}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </CalibrateGrid>
        ) : null}

        <CellCanvas ref={canvasRef} aria-hidden="true" />

        {PINS.filter(pin => pin.pos).map((pin, i) => (
          <Pin
            key={pin.label}
            type="button"
            $on={stage >= 1}
            $dim={stage === 3}
            aria-hidden={stage === 0}
            tabIndex={stage === 0 ? -1 : 0}
            style={{
              left: `${pin.pos.left}%`,
              top: `${pin.pos.top}%`,
              transitionDelay: stage === 1 ? `${i * 110}ms` : "0ms",
            }}
            aria-label={`${pin.enzymes.join(", ")}: ${pin.label}. ${pin.habitat}.`}
          >
            <PinImg src={PIN_SRC} alt="" draggable="false" />
            <PinCard role="tooltip">
              <PinCardTitle>{pin.enzymes.join(", ")}</PinCardTitle>
              <PinCardMeta>{pin.label}</PinCardMeta>
              <PinCardBody>{pin.habitat}</PinCardBody>
            </PinCard>
          </Pin>
        ))}

        {/* After the pins, so a pin never covers an ecosystem. */}
        {SITES.map(site => {
          const props = {
            type: "button",
            onClick: e => openSite(site, e),
            "aria-haspopup": "dialog",
            "aria-expanded": popout?.site === site,
            $on: stage === 3,
            "aria-hidden": stage !== 3,
            tabIndex: stage === 3 ? 0 : -1,
            "aria-label": `${site.label}: ${site.note}`,
            style: { left: `${site.pos.left}%`, top: `${site.pos.top}%` },
          }
          return siteStyle === "tag" ? (
            <SiteTag key={site.label} {...props}>
              {site.image ? (
                <SiteThumb src={site.image} alt="" loading="lazy" />
              ) : null}
              <SiteLabel>{site.label}</SiteLabel>
              {popout?.site !== site && <SiteCard role="tooltip">{site.note}</SiteCard>}
            </SiteTag>
          ) : (
            <SiteCircle key={site.label} {...props}>
              <CirclePhoto src={site.image} alt="" loading="lazy" />
              <CircleLabel>{site.label}</CircleLabel>
              {popout?.site !== site && <SiteCard role="tooltip">{site.note}</SiteCard>}
            </SiteCircle>
          )
        })}

        <StageCard aria-live="polite" $on={stage > 0}>
          <StageTitle>
            {stage <= 1 ? (
              <>From {fmt(PAZY_TOTAL)} known plastic-degrading enzymes</>
            ) : (
              <>
                to <Count ref={countRef} /> BioSamples in PETadex
              </>
            )}
          </StageTitle>
          {/* Joins the PETadex line rather than replacing it: one sentence. */}
          <StageTitleNext $on={stage === 3} aria-hidden={stage !== 3}>
            across countless ecosystems
          </StageTitleNext>
        </StageCard>
        {popout && <SitePopout {...popout} onClose={closeSite} />}
      </MapRoot>
    )
  },
)

const fade = css`
  transition:
    opacity 360ms ease,
    transform 360ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const MapRoot = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
`

const CalibrateGrid = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  stroke: #c0392b;
  stroke-width: 1;
  stroke-dasharray: 4 3;
`

const CellCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${CANVAS_OVERHANG * 100}%;
  mix-blend-mode: multiply;
`

const SiteTag = styled.button`
  position: absolute;
  display: flex;
  align-items: center;
  gap: ${artPx(8)};
  padding: ${artPx(4)} ${artPx(12)} ${artPx(4)} ${artPx(4)};
  font: inherit;
  text-align: left;
  cursor: pointer;
  appearance: none;
  pointer-events: ${({ $on }) => ($on ? "auto" : "none")};
  background: #f7eed8;
  color: #3b2a18;
  border: 1px solid rgba(90, 62, 32, 0.25);
  border-radius: ${artPx(12)};
  box-shadow: 0 ${artPx(4)} ${artPx(12)} rgba(40, 24, 10, 0.18);
  white-space: nowrap;
  opacity: ${({ $on }) => ($on ? 1 : 0)};
  transform: translate(-50%, -50%) scale(${({ $on }) => ($on ? 1 : 0.85)});
  ${fade}

  &:not(:has(img)) {
    padding-left: ${artPx(12)};
  }

  &:hover,
  &:focus-visible {
    z-index: 6;
  }

  &:focus-visible {
    outline: 2px solid #3c5a3a;
    outline-offset: 2px;
  }

  ${phone} {
    gap: 3px;
    padding: 1px 5px 1px 1px;
  }
`

/** The photo sits on the point; the name hangs underneath it. */
const SiteCircle = styled.button`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${artPx(4)};
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  cursor: pointer;
  appearance: none;
  pointer-events: ${({ $on }) => ($on ? "auto" : "none")};
  opacity: ${({ $on }) => ($on ? 1 : 0)};
  transform: translate(-50%, -${artPx(33)})
    scale(${({ $on }) => ($on ? 1 : 0.8)});
  transform-origin: 50% ${artPx(33)};
  ${fade}

  color: inherit;

  &:hover,
  &:focus-visible {
    z-index: 6;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible img {
    outline: 2px solid #3c5a3a;
    outline-offset: 2px;
  }

  ${phone} {
    gap: 1px;
    transform: translate(-50%, -12px) scale(${({ $on }) => ($on ? 1 : 0.8)});
  }
`

const CirclePhoto = styled.img`
  width: ${artPx(66)};
  height: ${artPx(66)};
  border-radius: 50%;
  object-fit: cover;
  border: ${artPx(3)} solid #f7eed8;
  box-shadow: 0 ${artPx(4)} ${artPx(12)} rgba(40, 24, 10, 0.25);
  transition: transform 200ms ease;

  ${SiteCircle}:hover & {
    transform: scale(1.08);
  }

  ${phone} {
    width: 24px;
    height: 24px;
    border-width: 1.5px;
  }
`

const CircleLabel = styled.span`
  padding: ${artPx(1)} ${artPx(8)};
  border-radius: 999px;
  background: rgba(247, 238, 216, 0.92);
  color: #3b2a18;
  font-family: var(--font-display);
  ${artFont(15)}
  line-height: 1.2;
  white-space: nowrap;

  ${phone} {
    padding: 0 3px;
    font-size: 0.45rem;
  }
`

const SiteCard = styled.span`
  position: absolute;
  left: 50%;
  top: calc(100% + ${artPx(6)});
  width: max-content;
  max-width: ${artPx(260)};
  min-width: 150px;
  padding: 0.5rem 0.65rem;
  transform: translateX(-50%);
  background: #f7eed8;
  color: #3b2a18;
  border: 1px solid rgba(90, 62, 32, 0.22);
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(40, 24, 10, 0.18);
  font-family: var(--font-body);
  font-size: 0.8rem;
  line-height: 1.35;
  white-space: normal;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 160ms ease;

  ${SiteTag}:hover &,
  ${SiteTag}:focus-visible &,
  ${SiteCircle}:hover &,
  ${SiteCircle}:focus-visible & {
    opacity: 1;
    visibility: visible;
  }
`

const SiteThumb = styled.img`
  width: ${artPx(52)};
  height: ${artPx(38)};
  border-radius: ${artPx(7)};
  object-fit: cover;
  flex: none;

  ${phone} {
    width: 12px;
    height: 12px;
  }
`

const SiteLabel = styled.span`
  display: block;
  font-family: var(--font-display);
  ${artFont(16)}
  line-height: 1.1;

  ${phone} {
    font-size: 0.55rem;
  }
`

const Pin = styled.button`
  position: absolute;
  width: ${artPx(18)};
  height: ${artPx((18 * PIN_CROP.h) / PIN_CROP.w)};
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, ${({ $on }) => ($on ? "-100%" : "-160%")});
  transform-origin: 50% 100%;
  opacity: ${({ $on, $dim }) => (!$on ? 0 : $dim ? 0.55 : 1)};
  pointer-events: ${({ $on }) => ($on ? "auto" : "none")};
  filter: drop-shadow(0 1px 1px rgba(40, 24, 10, 0.35));
  appearance: none;
  -webkit-tap-highlight-color: transparent;
  ${fade}

  &:focus-visible {
    outline: 2px solid #3c5a3a;
    outline-offset: 2px;
  }

  &:hover,
  &:focus-visible {
    z-index: 5;
  }
`

const PinImg = styled.img`
  position: absolute;
  display: block;
  max-width: none;
  width: ${(PIN_FRAME.w / PIN_CROP.w) * 100}%;
  height: ${(PIN_FRAME.h / PIN_CROP.h) * 100}%;
  left: ${(-PIN_CROP.x / PIN_CROP.w) * 100}%;
  top: ${(-PIN_CROP.y / PIN_CROP.h) * 100}%;
  pointer-events: none;
  user-select: none;
`

const PinCard = styled.span`
  position: absolute;
  left: 50%;
  bottom: calc(100% + ${artPx(6)});
  width: max-content;
  max-width: ${artPx(240)};
  min-width: 140px;
  padding: 0.55rem 0.7rem;
  transform: translateX(-50%);
  background: #f7eed8;
  color: #3b2a18;
  border: 1px solid rgba(90, 62, 32, 0.22);
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(40, 24, 10, 0.18);
  text-align: left;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 160ms ease;

  ${Pin}:hover &,
  ${Pin}:focus-visible & {
    opacity: 1;
    visibility: visible;
  }
`

const PinCardTitle = styled.span`
  display: block;
  font-family: var(--font-display);
  font-size: 0.95rem;
  line-height: 1.2;
`

const PinCardMeta = styled.span`
  display: block;
  margin-top: 0.15rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  opacity: 0.8;
`

const PinCardBody = styled.span`
  display: block;
  margin-top: 0.25rem;
  font-family: var(--font-body);
  font-size: 0.8rem;
  line-height: 1.35;
`

/** In the clear cream between the Logan paragraph and the top of the map. */
const StageCard = styled.div`
  position: absolute;
  left: 50%;
  top: -21%;
  width: max-content;
  max-width: 90%;
  transform: translateX(-50%);
  text-align: center;
  opacity: ${({ $on }) => ($on ? 1 : 0)};
  ${fade}

  ${phone} {
    top: auto;
    bottom: -40%;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    background: rgba(247, 238, 216, 0.92);
  }
`

/** Bold, in the PETadex red the landscape uses for its key phrases. */
const StageTitle = styled.p`
  margin: 0;
  color: #e74c4c;
  font-family: var(--font-body);
  ${artFont(34)}
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;

  ${phone} {
    font-size: 0.8rem;
  }
`

const Count = styled.span`
  text-decoration: underline;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.14em;
`

const StageTitleNext = styled(StageTitle)`
  opacity: ${({ $on }) => ($on ? 1 : 0)};
  transform: translateY(${({ $on }) => ($on ? "0" : "0.3em")});
  ${fade}
`

const popIn = keyframes`
  from {
    opacity: 0;
    transform: translate(calc(-50% + var(--from-x)), calc(-50% + var(--from-y)))
      scale(0.15);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
`

const backdropIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const PopBackdrop = styled.div`
  position: fixed;
  z-index: 10000;
  inset: 0;
  background: rgba(40, 24, 10, 0.28);
  animation: ${backdropIn} 200ms ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/* The map's paper and ink, so the card reads as a piece of it. */
const Popout = styled.div`
  position: fixed;
  z-index: 10001;
  left: 50%;
  top: 50%;
  width: min(24rem, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow: auto;
  transform: translate(-50%, -50%);
  background: #f7eed8;
  color: #3b2a18;
  border: 1px solid rgba(90, 62, 32, 0.25);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(40, 24, 10, 0.35);
  font-family: var(--font-body);
  animation: ${popIn} 280ms cubic-bezier(0.2, 0.9, 0.25, 1.1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const PopPhoto = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
`

const PopClose = styled.button`
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 50%;
  background: rgba(247, 238, 216, 0.9);
  color: #3b2a18;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(40, 24, 10, 0.2);

  &:hover {
    background: #fff8e8;
  }

  &:focus-visible {
    outline: 2px solid #3c5a3a;
    outline-offset: 2px;
  }
`

const PopBody = styled.div`
  padding: 1rem 1.25rem 1.25rem;
`

const PopKicker = styled.p`
  margin: 0;
  color: #7a5a36;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const PopTitle = styled.h3`
  margin: 0.15rem 0 0;
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 400;
  line-height: 1.15;
`

const PopNote = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  line-height: 1.45;
`

const PopStat = styled.p`
  margin: 0.75rem 0 0;
  font-size: 0.875rem;

  strong {
    color: ${PETADEX_COLOR};
    font-variant-numeric: tabular-nums;
  }
`

const PopSample = styled.div`
  margin-top: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  background: rgba(90, 62, 32, 0.07);
  font-size: 0.85rem;
  line-height: 1.4;
`

const PopSampleHead = styled.div`
  margin-bottom: 0.2rem;
  font-weight: 700;

  code {
    font-family: var(--font-mono);
    font-weight: 400;
  }
`

const PopLink = styled(Link)`
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: ${PETADEX_COLOR};
  color: #f7eed8;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background: #244a3a;
  }

  &:focus-visible {
    outline: 2px solid #3c5a3a;
    outline-offset: 2px;
  }
`
