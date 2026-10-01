import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import styled, { css, keyframes } from "styled-components"

/**
 * Dry Lab subpage: the desert/underground plate scrolls behind the text
 * slower (or faster) than the page, so the end of the text lands by the
 * cobweb tunnel; the art below it is a decorative ending. Subsections (h2) are listed in the sticky side box and
 * the one being read is highlighted.
 *
 * Every asset is a full 918 × 4000 plate already aligned to the others, so
 * pieces are placed by their bounding box in plate pixels (see PLATE_*).
 */
const ASSET_BASE = "https://static.igem.wiki/teams/6187/wiki/drylab-page/"
const asset = name => `${ASSET_BASE}${name}.avif`

const PLATE_W = 918
const PLATE_H = 4000

/**
 * Background art, back to front. `box` is the piece's bounding box in plate
 * px [x0, y0, x1, y1]; only that window is rendered.
 */
const ART_LAYERS = [
  // Ground layers (whole width).
  { name: "layer-1", box: [0, 0, 918, 4000] },
  { name: "layer-2", box: [0, 1305, 918, 3136] },
  { name: "layer-3", box: [0, 2567, 918, 4000] },
  // Holes and paths dug into the ground.
  { name: "hole-top-1", box: [0, 278, 918, 1088] },
  { name: "hole-top-2", box: [0, 1218, 273, 1337] },
  { name: "hole-top-3", box: [763, 1076, 918, 1248] },
  { name: "hole-mid-1", box: [0, 1511, 163, 1632] },
  { name: "hole-mid-2", box: [0, 2266, 199, 2528] },
  { name: "hole-mid-3", box: [39, 1814, 918, 1984] },
  { name: "hole-bottom-1", box: [563, 2986, 918, 3121] },
  { name: "microplastic-fragments", box: [32, 327, 918, 3170] },
  // Buried objects.
  { name: "vase-mid", box: [0, 2536, 192, 2848] },
  { name: "fossil-bottom", box: [8, 3696, 296, 3969] },
  { name: "dino-bottom", box: [504, 3266, 918, 3744] },
  { name: "bottle-top", box: [856, 269, 914, 361] },
  { name: "bottle-bottom", box: [0, 3336, 144, 3553] },
  { name: "web-mid", box: [478, 1817, 689, 1952] },
  { name: "web-bottom", box: [803, 2983, 918, 3120] },
  // Critters.
  { name: "crab-2", crab: true, box: [11, 946, 77, 1017] },
  { name: "crab-carrying-bottle", patrol: true, box: [99, 1849, 242, 1937] },
  { name: "red-crab", crab: true, box: [260, 1875, 320, 1934] },
  { name: "crab-1", crab: true, box: [70, 2407, 145, 2496] },
  // Second crab-1 in the cobweb tunnel (hole-bottom-1), where the mockup has
  // it; `from` is where the sprite sits on its plate.
  {
    name: "crab-cobweb",
    src: "crab-1",
    from: [70, 2407, 145, 2496],
    crab: true,
    box: [655, 3014, 730, 3103],
  },
  // Not in the mockup (three crabs on the path where crab-2 sits) — kept for
  // an animation / easter egg later.
  { name: "crab-in-a-row", box: [11, 855, 232, 1016], hidden: true },
]

/** Side box (subsection list) and its pieces, plate px. */
const SIDE_BOX = [78, 314, 249, 865]
const SIDE_CAPS = [60, 70]
const SIDE_INDICATOR = [88, 452, 241, 513]
const SIDE_CRAB = [144, 804, 195, 860]

/** Text box, plate px. It stretches with the text between its caps. */
const TEXT_BOX = [274, 320, 804, 2488]
const TEXT_CAPS = [40, 40]

/** Shortest text box (plate px): the mockup's length, so short pages still read as the design. */
const TEXT_BOX_MIN_H = TEXT_BOX[3] - TEXT_BOX[1]

/**
 * Where the text ends in the art (plate y): just above the cobweb tunnel, so
 * its crab is in view.
 * The art scrolls at whatever pace lands this line on the text box's bottom
 * edge; below it (bottle, dino, fossil) is a decorative ending that scrolls
 * with the page.
 */
const TEXT_END_ART_Y = 2960

/** Sky band above the boxes where the section header sits (plate px). */
const SKY_BOTTOM = 290

const NARROW = "@media (max-width: 860px)"

/**
 * Hover scuttle, same as the homepage crabs: sidestep left, then right on the
 * next hover, wobbling ±θ on the way. Distance is a share of the art width
 * (the homepage's 4.5% of its plate), converted to each crab's own width.
 */
const CRAB_SCUTTLE_ART_PCT = 4.5
const CRAB_SCUTTLE_THETA_DEG = 16
const CRAB_SCUTTLE_MS = 480

/**
 * The bottle-carrying crabs pace their tunnel (hole-mid-3) on a loop: walk in
 * from the right edge to the tunnel's left end, stop, turn around, walk back,
 * turn again. Kept slow so it doesn't pull focus from the text.
 */
const PATROL = {
  /** Crab's left edge at each end of the walk (plate px). */
  rightX: 765,
  leftX: 55,
  walkS: 22,
  pauseS: 1.4,
  turnS: 0.5,
  /** One wobble (lean one way) every this many seconds while walking. */
  stepS: 0.4,
  leanDeg: 3,
  /** Tunnel floor (plate y) along its length, by the crab's center x. */
  floor: [
    [100, 1930],
    [220, 1940],
    [340, 1949],
    [460, 1952],
    [580, 1953],
    [700, 1946],
    [820, 1941],
    [900, 1942],
  ],
}

function patrolFloorY(cx) {
  const f = PATROL.floor
  if (cx <= f[0][0]) return f[0][1]
  for (let i = 1; i < f.length; i++) {
    if (cx <= f[i][0]) {
      const [x0, y0] = f[i - 1]
      const [x1, y1] = f[i]
      return y0 + ((y1 - y0) * (cx - x0)) / (x1 - x0)
    }
  }
  return f[f.length - 1][1]
}

const patrolCache = new Map()
const patrolFor = layer => {
  if (!patrolCache.has(layer.name))
    patrolCache.set(layer.name, patrolKeyframes(layer.box))
  return patrolCache.get(layer.name)
}

/** Keyframes for one full patrol loop of the sprite in `box`. */
function patrolKeyframes(box) {
  const [bx0, by0, bx1, by1] = box
  const w = bx1 - bx0
  const h = by1 - by0
  const baseFloor = patrolFloorY(bx0 + w / 2)
  const { rightX, leftX, walkS, pauseS, turnS, stepS, leanDeg } = PATROL
  const frames = []
  let t = 0
  const at = (x, flip, lean) => {
    const dx = ((x - bx0) / w) * 100
    const dy = ((patrolFloorY(x + w / 2) - baseFloor) / h) * 100
    frames.push([
      t,
      `translate(${dx.toFixed(2)}%, ${dy.toFixed(2)}%) scaleX(${flip}) rotate(${lean}deg)`,
    ])
  }
  const walk = (from, to, flip) => {
    const steps = Math.round(walkS / stepS)
    for (let i = 0; i <= steps; i++) {
      at(
        from + ((to - from) * i) / steps,
        flip,
        i === 0 || i === steps ? 0 : i % 2 ? leanDeg : -leanDeg,
      )
      if (i < steps) t += walkS / steps
    }
  }
  const turn = (x, from, to) => {
    t += pauseS
    at(x, from, 0)
    t += turnS
    at(x, to, 0)
    t += pauseS * 0.6
    at(x, to, 0)
  }
  walk(rightX, leftX, 1) // Sprite faces left as painted.
  turn(leftX, 1, -1)
  walk(leftX, rightX, -1)
  turn(rightX, -1, 1)
  const total = t
  const css = frames
    .map(
      ([ft, tf]) => `${((ft / total) * 100).toFixed(3)}% { transform: ${tf}; }`,
    )
    .join("\n")
  return { name: keyframes`${css}`, totalS: total }
}

/** Plate px → share of the scene width (the art always spans it). */
const ax = px => `calc(var(--art-w, 100vw) * ${+(px / PLATE_W).toFixed(6)})`

/** Absolute window over `box`, as % of the plate. */
function cropWindowStyle([x0, y0, x1, y1]) {
  return {
    left: `${(x0 / PLATE_W) * 100}%`,
    top: `${(y0 / PLATE_H) * 100}%`,
    width: `${((x1 - x0) / PLATE_W) * 100}%`,
    height: `${((y1 - y0) / PLATE_H) * 100}%`,
  }
}

/** Full plate offset so `box` fills its window. */
function cropImgStyle([x0, y0, x1, y1]) {
  const w = x1 - x0
  const h = y1 - y0
  return {
    width: `${(PLATE_W / w) * 100}%`,
    height: `${(PLATE_H / h) * 100}%`,
    left: `${(-x0 / w) * 100}%`,
    top: `${(-y0 / h) * 100}%`,
  }
}

/** Background that stretches `box` of a plate over the whole element. */
function cropBg(name, [x0, y0, x1, y1]) {
  const w = x1 - x0
  const h = y1 - y0
  return {
    backgroundImage: `url(${asset(name)})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${(PLATE_W / w) * 100}% ${(PLATE_H / h) * 100}%`,
    backgroundPosition: `${(x0 / (PLATE_W - w)) * 100}% ${(y0 / (PLATE_H - h)) * 100}%`,
  }
}

/** A plate box cut in three: fixed-ratio caps, middle stretched to any height. */
function StretchBox({ name, box, caps: [capTop, capBottom], className }) {
  const [x0, y0, x1, y1] = box
  const w = x1 - x0
  return (
    <SliceStack className={className} aria-hidden>
      <SliceCap
        style={{
          aspectRatio: `${w} / ${capTop}`,
          ...cropBg(name, [x0, y0, x1, y0 + capTop]),
        }}
      />
      <SliceMid style={cropBg(name, [x0, y0 + capTop, x1, y1 - capBottom])} />
      <SliceCap
        style={{
          aspectRatio: `${w} / ${capBottom}`,
          ...cropBg(name, [x0, y1 - capBottom, x1, y1]),
        }}
      />
    </SliceStack>
  )
}

/** Wraps a crab; hovering it plays one scuttle and leaves it at the new spot. */
function CrabScuttle({ box, as, style, children, ...rest }) {
  const [homeX, setHomeX] = useState(0)
  const [dir, setDir] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const busyRef = useRef(false)
  // Sidestep in % of the crab's own width.
  const step = (CRAB_SCUTTLE_ART_PCT * PLATE_W) / (box[2] - box[0])

  const settle = () => {
    setHomeX(x => x + dir * step)
    setDir(d => -d)
    setPlaying(false)
    busyRef.current = false
  }

  const onEnter = () => {
    if (busyRef.current) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      settle()
      return
    }
    busyRef.current = true
    setPlaying(true)
  }

  return (
    <ScuttleShell
      as={as}
      style={{ ...style, transform: `translate3d(${homeX}%, 0, 0)` }}
      onMouseEnter={onEnter}
      onPointerDown={event => {
        // Touch has no hover: a tap scuttles it instead.
        if (event.pointerType !== "mouse") onEnter()
      }}
      {...rest}
    >
      <ScuttleMotion
        $playing={playing}
        $dir={dir}
        style={{ "--scuttle": `${step}%` }}
        onAnimationEnd={e => e.target === e.currentTarget && settle()}
      >
        {children}
      </ScuttleMotion>
    </ScuttleShell>
  )
}

function useHeaderHeight() {
  const [h, setH] = useState(0)
  useLayoutEffect(() => {
    const header = document.querySelector("header")
    if (!header) return undefined
    const measure = () => setH(header.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])
  return h
}

export function DryLabScene({ title, sectionLabel, description, children }) {
  const sceneRef = useRef(null)
  const artRef = useRef(null)
  const textBoxRef = useRef(null)
  const bodyRef = useRef(null)
  const navRef = useRef(null)
  const headerH = useHeaderHeight()
  const [sections, setSections] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [indicator, setIndicator] = useState(null)

  // Subsections = the h2s in the text box.
  useEffect(() => {
    const heads = Array.from(bodyRef.current?.querySelectorAll("h2") || [])
    heads.forEach((el, i) => {
      if (!el.id) el.id = `section-${i + 1}`
    })
    setSections(heads.map(el => ({ id: el.id, label: el.textContent.trim() })))
  }, [children])

  // Scroll-linked background + active subsection.
  useEffect(() => {
    const scene = sceneRef.current
    const art = artRef.current
    if (!scene || !art) return undefined
    let raf = 0

    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const rect = scene.getBoundingClientRect()
      const view = vh - headerH
      const boxBottom = textBoxRef.current
        ? textBoxRef.current.getBoundingClientRect().bottom - rect.top
        : scene.offsetHeight
      // Art offset (from the scene top) once the text ends: its bottom on the
      // scene's bottom, which puts TEXT_END_ART_Y on the box's bottom edge.
      const endOffset = scene.offsetHeight - art.offsetHeight
      // Scrolled into the scene, from the page top to the box's bottom edge
      // meeting the viewport bottom; past that the art rides with the page.
      const start = -headerH
      const lockAt = boxBottom - vh
      const scrolled = -rect.top
      const progress =
        lockAt > start
          ? Math.min(1, Math.max(0, (scrolled - start) / (lockAt - start)))
          : 1
      art.style.transform = `translate3d(0, ${(progress * endOffset).toFixed(2)}px, 0)`

      const heads = bodyRef.current?.querySelectorAll("h2") || []
      const line = headerH + view * 0.35
      let current = heads[0]?.id ?? null
      for (const h of heads) {
        if (h.getBoundingClientRect().top <= line) current = h.id
      }
      // Bottom of the page: the last section is the one being read.
      if (rect.top + boxBottom <= vh + 2 && heads.length)
        current = heads[heads.length - 1].id
      setActiveId(prev => (prev === current ? prev : current))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    const setArtWidth = () => {
      scene.style.setProperty("--art-w", `${scene.clientWidth}px`)
      schedule()
    }
    setArtWidth()
    const ro = new ResizeObserver(setArtWidth)
    ro.observe(scene)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [headerH, sections])

  // Slide the highlight onto the active item.
  useLayoutEffect(() => {
    const nav = navRef.current
    const item = nav?.querySelector(`[data-id="${CSS.escape(activeId || "")}"]`)
    if (!item) {
      setIndicator(null)
      return undefined
    }
    const place = () =>
      setIndicator({
        top: item.offsetTop,
        left: item.offsetLeft,
        width: item.offsetWidth,
        height: item.offsetHeight,
      })
    place()
    // Keep the active item in view in the narrow (horizontal) list.
    if (nav.scrollWidth > nav.clientWidth) {
      nav.scrollTo({
        left: item.offsetLeft - nav.clientWidth / 2 + item.offsetWidth / 2,
        behavior: "smooth",
      })
    }
    const ro = new ResizeObserver(place)
    ro.observe(nav)
    return () => ro.disconnect()
  }, [activeId, sections])

  const goTo = (e, id) => {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 24
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" })
    window.history.replaceState(null, "", `#${id}`)
  }

  return (
    <Scene ref={sceneRef} style={{ "--dl-header": `${headerH}px` }}>
      <BgTrack aria-hidden>
        <Art ref={artRef}>
          {ART_LAYERS.filter(l => !l.hidden).map(layer => {
            const img = (
              <CropImg
                src={asset(layer.src || layer.name)}
                alt=""
                decoding="async"
                draggable={false}
                style={cropImgStyle(layer.from || layer.box)}
              />
            )
            if (layer.patrol) {
              return (
                <PatrolWindow
                  key={layer.name}
                  data-layer={layer.name}
                  $patrol={patrolFor(layer)}
                  style={cropWindowStyle(layer.box)}
                >
                  <CropWindow style={{ inset: 0 }}>{img}</CropWindow>
                </PatrolWindow>
              )
            }
            return layer.crab ? (
              <CrabScuttle
                key={layer.name}
                data-layer={layer.name}
                box={layer.box}
                style={cropWindowStyle(layer.box)}
              >
                <CropWindow style={{ inset: 0 }}>{img}</CropWindow>
              </CrabScuttle>
            ) : (
              <CropWindow
                key={layer.name}
                data-layer={layer.name}
                style={cropWindowStyle(layer.box)}
              >
                {img}
              </CropWindow>
            )
          })}
        </Art>
      </BgTrack>

      {sectionLabel && (
        <SectionHeader>
          <SectionTitle>{sectionLabel}</SectionTitle>
        </SectionHeader>
      )}

      <Content>
        <SideColumn>
          <SideBox>
            <SideBoxArt name="subsection-box" box={SIDE_BOX} caps={SIDE_CAPS} />
            <SideNav ref={navRef} aria-label="Sections on this page">
              {indicator && (
                <Indicator
                  aria-hidden
                  style={{
                    ...cropBg("box-subsection-indicator", SIDE_INDICATOR),
                    transform: `translate(${indicator.left}px, ${indicator.top}px)`,
                    width: indicator.width,
                    height: indicator.height,
                  }}
                />
              )}
              {sections.map(s => (
                <SideLink
                  key={s.id}
                  href={`#${s.id}`}
                  data-id={s.id}
                  aria-current={s.id === activeId ? "location" : undefined}
                  onClick={e => goTo(e, s.id)}
                >
                  {s.label}
                </SideLink>
              ))}
            </SideNav>
            <SideCrab aria-hidden>
              <CrabScuttle box={SIDE_CRAB}>
                <CrabArt style={cropBg("box-crab", SIDE_CRAB)} />
              </CrabScuttle>
            </SideCrab>
          </SideBox>
        </SideColumn>

        <TextBox ref={textBoxRef}>
          <StretchBox name="box-extendable" box={TEXT_BOX} caps={TEXT_CAPS} />
          <TextInner ref={bodyRef}>
            <TitleBlock>
              <Title>{title}</Title>
              {description && <Lede>{description}</Lede>}
            </TitleBlock>
            {children}
          </TextInner>
        </TextBox>
      </Content>
    </Scene>
  )
}

export default DryLabScene

const Scene = styled.div`
  position: relative;
  width: 100%;
  min-height: calc(100vh - var(--dl-header, 0px));
  background: #c9b48a;
`

/** Spans the scene; the art inside is shifted by the scroll handler. */
const BgTrack = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`

const Art = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  aspect-ratio: ${PLATE_W} / ${PLATE_H};
  will-change: transform;
`

const PatrolWindow = styled.div`
  position: absolute;
  transform-origin: 50% 85%;
  animation: ${({ $patrol }) => $patrol.name}
    ${({ $patrol }) => $patrol.totalS}s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const CropWindow = styled.div`
  position: absolute;
  overflow: hidden;
`

const CropImg = styled.img`
  position: absolute;
  display: block;
  max-width: none;
  user-select: none;
`

/** "Dry Lab" across the sky, above the side box and text box. */
const SectionHeader = styled.div`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  height: ${ax(SKY_BOTTOM)};
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  ${NARROW} {
    height: max(4.5rem, ${ax(SKY_BOTTOM)});
  }
`

const SectionTitle = styled.p`
  margin: 0;
  color: #5c3f2e;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: max(2.4rem, ${ax(64)});
  line-height: 1;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 0 rgba(255, 255, 255, 0.35);
`

const scuttleKeyframes = sign => keyframes`
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  18% {
    transform: translate3d(calc(var(--scuttle) * ${sign * 0.2}), 0, 0) rotate(${sign * -CRAB_SCUTTLE_THETA_DEG}deg);
  }
  38% {
    transform: translate3d(calc(var(--scuttle) * ${sign * 0.467}), 0, 0) rotate(${sign * CRAB_SCUTTLE_THETA_DEG}deg);
  }
  58% {
    transform: translate3d(calc(var(--scuttle) * ${sign * 0.733}), 0, 0) rotate(${sign * -CRAB_SCUTTLE_THETA_DEG}deg);
  }
  78% {
    transform: translate3d(calc(var(--scuttle) * ${sign * 0.911}), 0, 0) rotate(${sign * CRAB_SCUTTLE_THETA_DEG}deg);
  }
  100% {
    transform: translate3d(calc(var(--scuttle) * ${sign}), 0, 0) rotate(0deg);
  }
`
const crabScuttleLeft = scuttleKeyframes(-1)
const crabScuttleRight = scuttleKeyframes(1)

const ScuttleShell = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: auto;
  cursor: pointer;
`

const ScuttleMotion = styled.div`
  position: absolute;
  inset: 0;
  transform-origin: 50% 60%;

  ${({ $playing, $dir }) =>
    $playing &&
    css`
      animation: ${$dir < 0 ? crabScuttleLeft : crabScuttleRight}
        ${CRAB_SCUTTLE_MS}ms cubic-bezier(0.45, 0.05, 0.25, 1) both;
    `}
`

const CrabArt = styled.span`
  position: absolute;
  inset: 0;
`

const Content = styled.div`
  position: relative;
  z-index: 1;
  /* Only the boxes take the pointer, so the crabs behind stay hoverable. */
  pointer-events: none;
  display: grid;
  grid-template-columns:
    ${((SIDE_BOX[0] / PLATE_W) * 100).toFixed(4)}%
    ${(((SIDE_BOX[2] - SIDE_BOX[0]) / PLATE_W) * 100).toFixed(4)}%
    ${(((TEXT_BOX[0] - SIDE_BOX[2]) / PLATE_W) * 100).toFixed(4)}%
    ${(((TEXT_BOX[2] - TEXT_BOX[0]) / PLATE_W) * 100).toFixed(4)}%
    1fr;
  align-items: start;
  padding: ${ax(SIDE_BOX[1])} 0 ${ax(PLATE_H - TEXT_END_ART_Y)};

  ${NARROW} {
    grid-template-columns: 5% 90% 5%;
    padding-top: max(1.5rem, ${ax(SIDE_BOX[1])});
  }
`

const SideColumn = styled.div`
  pointer-events: auto;
  grid-column: 2;
  align-self: stretch;

  ${NARROW} {
    grid-column: 1 / -1;
    position: sticky;
    top: var(--dl-header, 0px);
    z-index: 2;
    padding: 0.5rem 5%;
  }
`

const SideBox = styled.div`
  position: sticky;
  top: calc(var(--dl-header, 0px) + 1.25rem);
  height: min(
    ${ax(SIDE_BOX[3] - SIDE_BOX[1])},
    calc(100vh - var(--dl-header, 0px) - 2.5rem)
  );
  min-height: 14rem;

  ${NARROW} {
    position: relative;
    top: auto;
    height: auto;
    min-height: 0;
    border-radius: 0.6rem;
    background-color: #b0886c;
    box-shadow: 0 2px 10px rgba(60, 35, 20, 0.25);
    ${cssObject(cropBg("subsection-box", [SIDE_BOX[0], SIDE_BOX[1] + SIDE_CAPS[0], SIDE_BOX[2], SIDE_BOX[3] - SIDE_CAPS[1]]))}
  }
`

const SliceStack = styled.div`
  position: absolute;
  z-index: 0;
  inset: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
`

const SliceCap = styled.div`
  position: relative;
  z-index: 1;
  flex: none;
  width: 100%;
`

/** Overlaps the caps by a pixel so no seam shows between slices. */
const SliceMid = styled.div`
  flex: 1 1 auto;
  margin: -1px 0;
`

const SideBoxArt = styled(StretchBox)`
  ${NARROW} {
    display: none;
  }
`

const SideNav = styled.nav`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: ${ax(32)} ${ax(6)} 0;

  ${NARROW} {
    flex-direction: row;
    gap: 0.25rem;
    padding: 0.35rem;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`

const Indicator = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  transition:
    transform 0.35s cubic-bezier(0.3, 0.9, 0.3, 1.1),
    height 0.35s ease,
    width 0.35s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const SideLink = styled.a`
  position: relative;
  display: block;
  padding: ${ax(10)} ${ax(14)};
  color: #fbf3ea;
  font-family: var(--font-body);
  font-size: max(0.78rem, ${ax(12.5)});
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
  text-decoration: none;
  overflow-wrap: anywhere;
  opacity: 0.85;
  transition: opacity 0.2s ease;

  &:hover,
  &[aria-current] {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid #fbf3ea;
    outline-offset: -2px;
    border-radius: 4px;
  }

  ${NARROW} {
    flex: none;
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
    white-space: nowrap;
    overflow-wrap: normal;
  }
`

/** The little crab sitting on the bottom edge of the side box. */
const SideCrab = styled.span`
  position: absolute;
  left: ${(((SIDE_CRAB[0] - SIDE_BOX[0]) / (SIDE_BOX[2] - SIDE_BOX[0])) * 100).toFixed(3)}%;
  bottom: ${ax(SIDE_BOX[3] - SIDE_CRAB[3])};
  width: ${(((SIDE_CRAB[2] - SIDE_CRAB[0]) / (SIDE_BOX[2] - SIDE_BOX[0])) * 100).toFixed(3)}%;
  aspect-ratio: ${SIDE_CRAB[2] - SIDE_CRAB[0]} / ${SIDE_CRAB[3] - SIDE_CRAB[1]};

  ${NARROW} {
    display: none;
  }
`

const TextBox = styled.div`
  pointer-events: auto;
  position: relative;
  grid-column: 4;
  min-height: ${ax(TEXT_BOX_MIN_H)};
  margin-top: ${ax(TEXT_BOX[1] - SIDE_BOX[1])};

  ${NARROW} {
    grid-column: 2;
    margin-top: 1rem;
    min-height: 60vh;
  }
`

const TextInner = styled.div`
  position: relative;
  padding: max(1.5rem, ${ax(34)}) max(1.25rem, ${ax(36)}) max(2rem, ${ax(48)});

  h2,
  h3 {
    scroll-margin-top: calc(var(--dl-header, 0px) + 1.5rem);
  }
`

const TitleBlock = styled.header`
  margin-bottom: var(--space-lg);
`

const Title = styled.h1`
  margin: 0 0 var(--space-sm);
  color: var(--color-text);
  font-size: clamp(2rem, 3.4vw, 3rem);
`

const Lede = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 1.05rem;
  line-height: 1.7;
`

/** Inline style object → CSS declarations (for media-query overrides). */
function cssObject(obj) {
  return Object.entries(obj)
    .map(
      ([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${v};`,
    )
    .join("\n")
}
