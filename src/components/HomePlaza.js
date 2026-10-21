import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { Link } from "gatsby"
import styled, { css, keyframes } from "styled-components"
import { artFont, artPx, inputCopyCss, phone, phoneSize } from "./artScale.js"
import { PlateImg } from "./PlateImg.js"
import { PopupClose } from "./PopupClose.js"

/**
 * The top of the homepage under the logo: the welcome lines, the "Meet the
 * PETamons" line, and the petamons around the front campus, each with a
 * speech bubble. Hovering one shows its bubble and clicking visits its
 * subteam; on touch the first tap shows it and a second tap visits.
 *
 * Positions are plate px on the 563-wide front plate, so everything stays
 * on the art at any width. Human Practices is the bird in the sky by the
 * church (on the back art, which moves): HomeScrollPrototype puts its spot
 * in the bird's own layer. PetamonProvider (round both) keeps which bubble is open
 * and which petamons have been met.
 */

const PLATE_W = 563
const PLATE_H = 4000

/**
 * The plaza art behind the hover spotlight: the cropped copy (rows 310 on),
 * and from 520px wide the sharper one the page draws there (HQ_TOP in
 * HomeScrollPrototype, rows 310–1400), so the spotlight matches it.
 */
const PLAZA_ART = {
  src: "https://static.igem.wiki/teams/6187/wiki/homepage-cropped/wiki-front-page-top-new.avif",
  top: 310,
  height: 3205,
}
const PLAZA_ART_HQ = {
  src: "https://static.igem.wiki/teams/6187/wiki/homepage-components/front-top-orig.avif",
  top: 310,
  height: 1090,
}

/** The "!" the crabs wear, over each petamon not yet met. */
const BANG_SRC =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/exclamation.avif"

/** Petamons met (hovered or tapped), kept across visits in this browser. */
const MET_KEY = "petabite-petamons-met"

function readMet() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(MET_KEY)) || [])
  } catch {
    return new Set()
  }
}

function saveMet(met) {
  try {
    window.localStorage.setItem(MET_KEY, JSON.stringify([...met]))
  } catch {
    // No storage: the marks just come back next visit.
  }
}

/**
 * Where each petamon is painted, where it's hovered, and what it says.
 * `below`: its bubble opens under it (it's high up, so above it would be
 * under the top bar or off the window by the time it's hovered).
 */
const PETAMONS = [
  {
    id: "dryLab",
    team: "Dry Lab",
    to: "/dry-lab/overview/",
    hit: [430, 612, 545, 668],
    say: "Better sequence them all",
  },
  {
    id: "wetLab",
    team: "Wet Lab",
    to: "/wet-lab/overview/",
    hit: [312, 722, 430, 790],
    say: "Sure hope my controls work",
  },
  {
    id: "hardware",
    team: "Hardware",
    to: "/hardware/",
    hit: [0, 640, 115, 722],
    say: "Under my condition-specific training no PETase shall be slow",
  },
  {
    id: "venture",
    team: "Entrepreneurship",
    to: "/entrepreneurship/",
    hit: [362, 530, 430, 618],
    say: "I want to see Dry Lab’s PETamon card",
  },
  {
    id: "outreach",
    team: "Outreach",
    to: "/beyond-the-bench/outreach/",
    hit: [140, 530, 220, 620],
    say: "Alright everyone, smile! Your PETadex photo is being taken",
  },
  {
    id: "web",
    team: "Wiki",
    to: "/wiki/",
    hit: [28, 345, 150, 420],
    below: true,
    say: "Ain’t it fun to catalogue all these new PETamons?",
  },
]

/** The white bird in the sky by the church (it bobs, so its spot follows it: BirdSpot). */
const HP_PETAMON = {
  id: "humanPractices",
  team: "Human Practices",
  to: "/human-practices/",
  below: true,
  say: "Can’t wait to meet the other PETamons, we will be a large happy family of enzymes",
}

const xPct = x => `${((x / PLATE_W) * 100).toFixed(3)}%`
const yPct = y => `${((y / PLATE_H) * 100).toFixed(3)}%`

const PetamonContext = createContext(null)

/** Which bubble is open, and which petamons have been met. */
export function PetamonProvider({ children }) {
  const [active, setActive] = useState(null)
  // null until read (the server render has no storage): no marks till then.
  const [met, setMet] = useState(null)
  const touchRef = useRef(false)

  useEffect(() => setMet(readMet()), [])

  // Opening a petamon's bubble counts as meeting it; its "!" goes.
  useEffect(() => {
    if (!active || !met || met.has(active)) return
    const next = new Set(met).add(active)
    setMet(next)
    saveMet(next)
  }, [active, met])

  // Meeting one some other way (the shore crab, by scuttling it).
  const meet = useCallback(id => {
    setMet(prev => {
      if (!prev || prev.has(id)) return prev
      const next = new Set(prev).add(id)
      saveMet(next)
      return next
    })
  }, [])

  // A tap elsewhere closes an open bubble.
  useEffect(() => {
    if (!active) return undefined
    const close = event => {
      if (event.target.closest?.("[data-petamon-spot]")) return
      setActive(null)
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [active])

  return (
    <PetamonContext.Provider value={{ active, setActive, met, meet, touchRef }}>
      {children}
    </PetamonContext.Provider>
  )
}

/** Which petamons have been met (null till read), and `meet(id)` to mark one. */
export function usePetamonsMet() {
  const { met, meet } = useContext(PetamonContext)
  return { met, meet }
}

/** Room a bubble needs above its petamon besides its own height (its tail and gap). */
const BUBBLE_ROOM_PX = 18

/** Bottom of the fixed top bar, which a bubble opening above must clear. */
function topBarBottom() {
  const bar = document.querySelector("header")
  return bar ? Math.max(0, bar.getBoundingClientRect().bottom) : 0
}

/**
 * A petamon's hover / tap spot: a link to its subteam with its speech
 * bubble, its "!" until met, and (with `art`, its painted box on the plaza)
 * a spotlight on it while open. Placed by `style`.
 *
 * The bubble opens above the petamon, or below it for the high-up ones
 * (`p.below`) and for any other without room above under the top bar (like
 * the red terms' popups), so it's never off the top of the window.
 */
export function PetamonSpot({ p, style, art, leftward = false }) {
  const { active, setActive, met, touchRef } = useContext(PetamonContext)
  const open = active === p.id
  const bubbleRef = useRef(null)
  const [noRoomAbove, setNoRoomAbove] = useState(false)

  useLayoutEffect(() => {
    const bubble = bubbleRef.current
    if (!open || p.below || !bubble) return
    const spotTop = bubble.parentElement.getBoundingClientRect().top
    setNoRoomAbove(
      spotTop - bubble.offsetHeight - BUBBLE_ROOM_PX < topBarBottom(),
    )
  }, [open, p.below])

  return (
    <Spot
      to={p.to}
      data-petamon-spot={p.id}
      aria-label={`${p.team}: “${p.say}” Visit their page.`}
      style={style}
      onPointerEnter={e => {
        if (e.pointerType === "mouse") setActive(p.id)
      }}
      onPointerLeave={e => {
        if (e.pointerType === "mouse") setActive(a => (a === p.id ? null : a))
      }}
      onPointerDown={e => {
        touchRef.current = e.pointerType !== "mouse"
      }}
      onKeyDown={() => {
        touchRef.current = false
      }}
      onClick={e => {
        // Touch: the first tap shows the bubble, the second visits.
        if (touchRef.current && !open) {
          e.preventDefault()
          setActive(p.id)
        }
      }}
      // Keyboard focus shows it too (a tap's focus doesn't: it would open it
      // before the tap's click, which would then visit).
      onFocus={() => {
        if (!touchRef.current) setActive(p.id)
      }}
      onBlur={() => setActive(a => (a === p.id ? null : a))}
    >
      {art && <Spotlight $on={open} aria-hidden style={spotlightStyle(art)} />}
      {met && !met.has(p.id) && (
        <Bang aria-hidden>
          <PlateImg src={BANG_SRC} alt="" draggable={false} />
        </Bang>
      )}
      <Bubble
        ref={bubbleRef}
        $open={open}
        $leftward={leftward}
        $below={p.below || noRoomAbove}
        aria-hidden
      >
        <BubbleTeam>{p.team}</BubbleTeam>
        {p.say}
      </Bubble>
    </Spot>
  )
}

/**
 * The journey callout points at the bottle waiting at the top of the
 * waterfall, and fades once the reader scrolls on past it (when its middle
 * goes above this share of the window). Auto-scroll holds on it to read.
 */
const JOURNEY_GONE_VIEW_Y = 0.32

function JourneyCallout() {
  const ref = useRef(null)
  // Closed with its ✕: stays gone for the visit.
  const closedRef = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const gone =
        closedRef.current ||
        r.top + r.height / 2 < window.innerHeight * JOURNEY_GONE_VIEW_Y
      if ((el.dataset.gone === "1") !== gone) {
        if (gone) el.dataset.gone = "1"
        else delete el.dataset.gone
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])
  return (
    <JourneyBox ref={ref} data-autoplay-hold="journey">
      <span className="wide-copy">
        We’ll follow the journey of this discarded water bottle as it travels
        through storm drains, sewers, rivers and out to sea. It moves through
        many environments, and we are working to stop it from causing more harm.
      </span>
      <span className="phone-copy">
        We’ll follow the journey of this discarded bottle through many places.
        We want to stop it from causing more harm.
      </span>
      <JourneyClose
        label="Close"
        onClose={() => {
          closedRef.current = true
          if (ref.current) ref.current.dataset.gone = "1"
        }}
      />
    </JourneyBox>
  )
}

/**
 * Human Practices' bird bobs in the sky in the back layer, beside the "Meet
 * the PETamons" line; its spot lives up here so its bubble shows over the
 * front art, and follows the bird (`anchorRef`, a box in the bird's layer)
 * every frame while the top of the page is on screen.
 */
function BirdSpot({ p, anchorRef }) {
  const { active } = useContext(PetamonContext)
  const open = active === p.id
  const followRef = useRef(null)
  const [leftward, setLeftward] = useState(false)

  useEffect(() => {
    const follow = followRef.current
    const anchor = anchorRef?.current
    if (!follow || !anchor) return undefined
    const sky = follow.offsetParent
    let raf = 0
    const place = () => {
      raf = requestAnimationFrame(place)
      const a = anchor.getBoundingClientRect()
      const o = sky.getBoundingClientRect()
      follow.style.transform = `translate3d(${a.left - o.left}px, ${a.top - o.top}px, 0)`
      follow.style.width = `${a.width}px`
      follow.style.height = `${a.height}px`
    }
    // Only while the birds' sky is on screen.
    const birds = anchor.closest("[data-birds]") || anchor.parentElement
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf)
      if (entry.isIntersecting) place()
    })
    io.observe(birds)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [anchorRef])

  // Bubbles on the right of the window open leftward, to stay on it.
  useLayoutEffect(() => {
    const follow = followRef.current
    if (!open || !follow) return
    const r = follow.getBoundingClientRect()
    setLeftward((r.left + r.right) / 2 > window.innerWidth * 0.55)
  }, [open])

  // Lit up like the others' spotlights while its bubble is open: the bird's
  // layer (the anchor's) takes `data-lit`.
  useEffect(() => {
    const layer = anchorRef?.current?.parentElement
    if (!layer) return undefined
    layer.dataset.lit = open ? "1" : ""
    return () => {
      layer.dataset.lit = ""
    }
  }, [open, anchorRef])

  return (
    <BirdFollow ref={followRef}>
      <PetamonSpot p={p} leftward={leftward} style={{ inset: 0 }} />
    </BirdFollow>
  )
}

/**
 * The welcome lines fade out once scrolled past, so the plaza under them
 * isn't text heavy: from when they're a third of the way down the screen (or
 * where they start, if higher) over a fifth of a screen more.
 */
const INTRO_FADE_FROM_VH = 0.35
const INTRO_FADE_OVER_VH = 0.2

function useScrolledPastFade(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const top = el.getBoundingClientRect().top
      const from = Math.min(top + window.scrollY, vh * INTRO_FADE_FROM_VH)
      const gone = (from - top) / (vh * INTRO_FADE_OVER_VH)
      el.style.opacity = String(1 - Math.min(1, Math.max(0, gone)))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [ref])
}

export function HomePlaza({ hpAnchorRef }) {
  const introRef = useRef(null)
  useScrolledPastFade(introRef)

  return (
    <Plaza aria-label="Meet the PETamons">
      <Intro ref={introRef}>
        <IntroLead>
          <span className="wide-copy">
            Introducing iGEM Toronto’s 2026 project: PetaBite. We take a byte
            out of plastic!
          </span>
        </IntroLead>
        <IntroBody>
          <span className="wide-copy">
            iGEM Toronto is a group of 70 students at the University of Toronto
            working in seven subteams to identify, engineer, and deploy highly
            efficient plastic-degrading enzymes.
          </span>
          <span className="phone-copy">
            iGEM Toronto: 70 students finding, engineering, and deploying
            plastic-degrading enzymes.
          </span>
        </IntroBody>
      </Intro>

      <MeetLine>
        <strong>Meet the PETamons!</strong>{" "}
        <span className="hover-copy">
          Hover over them to see what they’re up to, and click on them to learn
          more about what they do.
        </span>
        <span className="touch-copy">
          Tap them to see what they’re up to, and tap again to learn more about
          what they do.
        </span>
      </MeetLine>

      {/* Pointing at the bottle where it sets off, over the waterfall. */}
      <JourneyCallout />

      {PETAMONS.map(p => {
        const [x0, y0, x1, y1] = p.hit
        return (
          <PetamonSpot
            key={p.id}
            p={p}
            art={p.hit}
            // Bubbles on the right half open leftward, so they stay on screen.
            leftward={(x0 + x1) / 2 > PLATE_W * 0.55}
            style={{
              left: xPct(x0),
              top: yPct(y0),
              width: xPct(x1 - x0),
              height: yPct(y1 - y0),
            }}
          />
        )
      })}

      {hpAnchorRef && <BirdSpot p={HP_PETAMON} anchorRef={hpAnchorRef} />}
    </Plaza>
  )
}

export default HomePlaza

/** Room round a petamon's spot that its spotlight fades out across (plate px). */
const SPOTLIGHT_PAD = 14

/** The plaza art behind a spot, padded, laid over it exactly. */
function spotlightStyle([x0, y0, x1, y1]) {
  const w = x1 - x0 + SPOTLIGHT_PAD * 2
  const h = y1 - y0 + SPOTLIGHT_PAD * 2
  const left = x0 - SPOTLIGHT_PAD
  // As a background of `art` (the spot's box padded is `w` × `h` of it).
  const bg = art => {
    const top = y0 - SPOTLIGHT_PAD - art.top
    return {
      image: `url(${art.src})`,
      size: `${((PLATE_W / w) * 100).toFixed(3)}% ${((art.height / h) * 100).toFixed(3)}%`,
      position: `${((left / (PLATE_W - w)) * 100).toFixed(3)}% ${((top / (art.height - h)) * 100).toFixed(3)}%`,
    }
  }
  const lo = bg(PLAZA_ART)
  const hi = bg(PLAZA_ART_HQ)
  return {
    left: `${((-SPOTLIGHT_PAD / (x1 - x0)) * 100).toFixed(3)}%`,
    top: `${((-SPOTLIGHT_PAD / (y1 - y0)) * 100).toFixed(3)}%`,
    width: `${((w / (x1 - x0)) * 100).toFixed(3)}%`,
    height: `${((h / (y1 - y0)) * 100).toFixed(3)}%`,
    "--spot-img": lo.image,
    "--spot-size": lo.size,
    "--spot-pos": lo.position,
    "--spot-img-hq": hi.image,
    "--spot-size-hq": hi.size,
    "--spot-pos-hq": hi.position,
  }
}

/**
 * Spans the front plate; only its spots and text take the pointer. Phones
 * get shorter copy (`phone-copy`), so it fits between the logo and the
 * plaza.
 */
const Plaza = styled.div`
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  ${inputCopyCss}

  .phone-copy {
    display: none;
  }

  ${phone} {
    .wide-copy {
      display: none;
    }

    .phone-copy {
      display: inline;
    }
  }
`

/** Phones: the copy's width, between the dark lamp posts at the plaza's edges. */
const PHONE_COPY_WIDTH = "78%"

/** Copy over the art, readable on the pale sky and the plaza. */
const copyBase = css`
  margin: 0;
  color: #1f2f4a;
  font-family: var(--font-body);
  line-height: 1.35;
  text-align: center;
  overflow-wrap: break-word;
  text-shadow:
    0 0 6px rgba(255, 255, 255, 0.95),
    0 0 14px rgba(255, 255, 255, 0.8),
    0 1px 2px rgba(255, 255, 255, 0.9);
`

/**
 * Just under the logo, on the sky; it fades once scrolled past
 * (useScrolledPastFade). Phones: as wide as MeetLine.
 */
const Intro = styled.div`
  position: absolute;
  top: ${yPct(272)};
  left: 50%;
  width: ${artPx(860)};
  transform: translateX(-50%);

  ${phone} {
    top: ${yPct(280)};
    width: ${PHONE_COPY_WIDTH};
    text-wrap: balance;
  }
`

const IntroLead = styled.p`
  ${copyBase}
  ${artFont(30)}
  font-weight: 800;

  /* Phones: just the line under it. */
  ${phone} {
    display: none;
  }
`

const IntroBody = styled.p`
  ${copyBase}
  margin-top: 0.35em;
  ${artFont(22)}
  font-weight: 600;

  ${phone} {
    margin-top: 0;
    font-size: ${phoneSize(0.72)};
  }
`

/**
 * On the white road between the fox and the kangaroo (which stand at row
 * 530), clear of the bushes either side. Phones: on the church, between the
 * "We are" line and those two, and between the dark lamp posts at the edges.
 */
const MeetLine = styled.p`
  ${copyBase}
  position: absolute;
  top: ${yPct(604)};
  left: ${xPct(284)};
  width: ${artPx(300)};
  text-wrap: balance;
  transform: translateX(-50%);
  ${artFont(20)}
  font-weight: 600;

  strong {
    font-weight: 800;
  }

  /* Phones: narrower than the rest, so it's mostly on the church, off the
     lamps and houses either side. */
  ${phone} {
    top: ${yPct(442)};
    left: 50%;
    width: 58%;
    text-wrap: balance;
    font-size: ${phoneSize(0.64)};
  }
`

/**
 * Beside the bottle where it waits over the waterfall (painted at x 244–319,
 * rows 739–855), its pointer aimed at it: on the left on wide screens, above
 * it on phones. A comic box like the speech bubbles, fading once passed.
 */
/** On the box's top-right corner. */
const JourneyClose = styled(PopupClose)`
  top: 0;
  right: 0;
  transform: translate(45%, -45%);

  &:hover {
    transform: translate(45%, -45%) scale(1.1);
  }
`

const JourneyBox = styled.p`
  position: absolute;
  top: ${yPct(744)};
  left: ${xPct(18)};
  width: ${xPct(212)};
  box-sizing: border-box;
  margin: 0;
  padding: 0.7em 0.9em;
  border: 2px solid #111;
  border-radius: 1em;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  color: #111;
  font-family: var(--font-body);
  ${artFont(17)}
  font-weight: 700;
  line-height: 1.35;
  pointer-events: none;
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;

  /* The pointer, on its right edge, aimed at the bottle. */
  &::after {
    content: "";
    position: absolute;
    top: 38%;
    left: 100%;
    border: 0.6em solid transparent;
    border-left-color: #111;
  }

  &[data-gone="1"] {
    opacity: 0;
    transform: translateY(-0.6em);
  }

  &[data-gone="1"] > button {
    pointer-events: none;
  }

  ${phone} {
    top: auto;
    bottom: calc(100% - ${yPct(735)});
    left: 50%;
    width: 94%;
    font-size: ${phoneSize(0.66)};
    transform: translateX(-50%);

    &::after {
      top: 100%;
      left: calc(${((281 - 16) / 530) * 100}% - 0.6em);
      border-left-color: transparent;
      border-top-color: #111;
    }

    &[data-gone="1"] {
      transform: translate(-50%, -0.6em);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 0.35s ease;
  }
`

/** A petamon's hover / tap area (a link to its subteam). */
const BirdFollow = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  will-change: transform;
`

const Spot = styled(Link)`
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: 2px solid #1f2f4a;
    outline-offset: 2px;
    border-radius: 6px;
  }
`

/**
 * The petamon lit up while its bubble is open: the art under it, brighter,
 * fading out softly at the edges so no box shows.
 */
const Spotlight = styled.span`
  position: absolute;
  display: block;
  background-image: var(--spot-img);
  background-size: var(--spot-size);
  background-position: var(--spot-pos);
  background-repeat: no-repeat;

  /* Where the page draws the sharper plaza (HQ_TOP's breakpoint). */
  @media (min-width: 520px) {
    background-image: var(--spot-img-hq);
    background-size: var(--spot-size-hq);
    background-position: var(--spot-pos-hq);
  }

  pointer-events: none;
  filter: brightness(1.22) saturate(1.35);
  -webkit-mask-image: radial-gradient(
    ellipse closest-side,
    #000 55%,
    transparent 100%
  );
  mask-image: radial-gradient(ellipse closest-side, #000 55%, transparent 100%);
  opacity: ${({ $on }) => ($on ? 1 : 0)};
  transition: opacity 0.25s ease;
`

const bangBob = keyframes`
  0%,
  100% {
    transform: translate3d(-50%, 0, 0);
  }
  50% {
    transform: translate3d(-50%, -18%, 0);
  }
`

/** A bobbing "!" over a petamon you haven't met yet. */
const Bang = styled.span`
  position: absolute;
  bottom: 88%;
  left: 50%;
  display: block;
  width: ${artPx(40)};
  min-width: 14px;
  pointer-events: none;
  animation: ${bangBob} 2.4s ease-in-out infinite;
  transform: translate3d(-50%, 0, 0);

  img {
    display: block;
    width: 100%;
    height: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/**
 * A comic speech bubble over the petamon (or under it, `$below`), white with
 * a black outline.
 */
const Bubble = styled.span`
  position: absolute;
  ${({ $below }) => ($below ? "top" : "bottom")}: calc(100% + 0.6em);
  ${({ $leftward }) =>
    $leftward
      ? css`
          right: 10%;
        `
      : css`
          left: 10%;
        `}
  display: block;
  width: max-content;
  max-width: ${artPx(300)};
  padding: 0.55em 0.8em;
  border: 2px solid #111;
  border-radius: 1em;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  color: #111;
  font-family: var(--font-body);
  ${artFont(17)}
  font-weight: 700;
  line-height: 1.3;
  text-align: left;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: ${({ $open }) => ($open ? "scale(1)" : "scale(0.6)")};
  transform-origin: ${({ $leftward, $below }) =>
    `${$leftward ? "90%" : "10%"} ${$below ? "-10%" : "110%"}`};
  transition:
    opacity 0.18s ease,
    transform 0.28s cubic-bezier(0.34, 1.45, 0.64, 1);
  pointer-events: none;

  /* The tail, pointing at the petamon. */
  &::after {
    content: "";
    position: absolute;
    ${({ $below }) => ($below ? "bottom" : "top")}: 100%;
    ${({ $leftward }) => ($leftward ? "right: 1.4em;" : "left: 1.4em;")}
    border: 0.55em solid transparent;
    border-${({ $below }) => ($below ? "bottom" : "top")}-color: #111;
  }

  ${phone} {
    max-width: 56vw;
    font-size: ${phoneSize(0.7)};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 0.18s ease;
    transform: none;
  }
`

const BubbleTeam = styled.span`
  display: block;
  margin-bottom: 0.15em;
  color: #6a6a6a;
  font-size: 0.72em;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`
