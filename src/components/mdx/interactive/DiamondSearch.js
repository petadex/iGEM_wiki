import React, { useState } from "react"
import { withPrefix } from "gatsby"
import styled, { keyframes } from "styled-components"
import { useLinkTarget } from "../linkTarget.js"
import { useFigureViewer, ViewerButton } from "../FigureViewer.js"

/**
 * The sharded DIAMOND search's logo hero and the link card into its Methods
 * sub-page. Colours follow the Dry Lab figure style guide (Obsidian
 * "04 Design/igem-dry-lab_style-guide.svg"); the numbers are sourced in the
 * Methods page's writer notes.
 */

const INK = "#5f3928"
const INK_SOFT = "#805340"
const PAPER = "#f3e9e5"
const FRAME = "#c8b388"
const COMPUTE = "#b6693d"

export const METHODS_PATH = "/dry-lab/software/diamond-search/"
export const SEARCH_URL = "https://petadex.net/search"

/* ---------- Hero: logo, headline numbers, links ---------- */

const STATS = [
  { value: "300M+", label: "proteins searched per query" },
  { value: "32", label: "shards searched in parallel" },
  { value: "< 1 min", label: "from paste to results" },
]

export const DiamondSearchHero = ({ logoSrc, methodsHref = METHODS_PATH }) => {
  const methodsTarget = useLinkTarget(methodsHref)
  return (
    <Hero>
      <Logo
        src={logoSrc.startsWith("/") ? withPrefix(logoSrc) : logoSrc}
        alt="PETadex DIAMOND search logo: a hand holding a diamond made of protein sequence, refracting light from a protein structure"
        width={625}
        height={900}
        loading="lazy"
      />
      <HeroBody>
        <Tagline>Paste a protein. Search every enzyme in PETadex.</Tagline>
        <Stats>
          {STATS.map(({ value, label }) => (
            <Stat key={label}>
              <StatValue>{value}</StatValue>
              <StatLabel>{label}</StatLabel>
            </Stat>
          ))}
        </Stats>
        <Actions>
          <Action href={SEARCH_URL} target="_blank" rel="noopener noreferrer">
            Try it on petadex.net
          </Action>
          <Action href={withPrefix(methodsHref)} {...methodsTarget} $secondary>
            Read the full methods
          </Action>
        </Actions>
      </HeroBody>
    </Hero>
  )
}

/** Inline link card that leads into the Methods sub-page. */
export const MethodsLink = ({ href = METHODS_PATH, children }) => (
  <MethodsCard href={withPrefix(href)} {...useLinkTarget(href)}>
    <MethodsKicker>Methods</MethodsKicker>
    <MethodsText>{children}</MethodsText>
    <MethodsArrow aria-hidden="true">→</MethodsArrow>
  </MethodsCard>
)

/* ---------- Architecture figure with clickable components ---------- */

/** Catppuccin Mocha base, the background of D2's Dark Mauve theme (200). */
const ARCH_BG = "#1e1e2e"
const ARCH_ACCENT = "#cba6f7"

/**
 * Each component of the full architecture SVG (1416 × 1884) and the Methods
 * section that describes it. Boxes are % of the image (x, y, width, height),
 * measured from the rendered SVG; re-measure them if the SVG is re-exported.
 * Later entries sit on top, so the worker row wins over its container.
 * `summary` is the hover overview; it gives live values where the SVG's
 * labels predate the reshard (20 .dmnd shards, reserved concurrency 100).
 */
const FULL_HOTSPOTS = [
  {
    label: "petadex.net search page",
    section: "using-the-search",
    box: [44.1, 5.4, 21.3, 5.3],
    summary: "Where a search starts. Paste one protein sequence of 10 to 10,000 amino acids; the page gets a job ID within a second and checks back until the result is ready.",
  },
  {
    label: "Orchestrator",
    section: "atomic-versioning",
    box: [29.9, 17.1, 23.0, 8.0],
    summary: "Validates the sequence, reads the live database version and its shard list, returns a job ID at once and starts the search. It never waits for the search to finish.",
  },
  {
    label: "Sharded database in S3",
    section: "building-the-sharded-database",
    box: [42.0, 31.2, 22.5, 7.4],
    summary: "32 compressed FASTA shards of about 9.6 million sequences each, 23.8 GB in all, plus a manifest. A new build goes live only once every shard is written.",
  },
  {
    label: "Step Functions Map",
    section: "failure-handling",
    box: [3.7, 42.8, 64.7, 10.7],
    summary: "Starts one worker per shard, all 32 at once. Brief errors are retried; if a shard still fails, the whole job fails rather than returning a result with gaps.",
  },
  {
    label: "Workers",
    section: "searching-a-shard",
    box: [5.9, 47.4, 60.2, 4.5],
    summary: "Each downloads one shard (about 8 s) and searches it with diamond blastp (about 31 s), keeping up to 500 hits with E-values scaled to the whole corpus.",
  },
  {
    label: "Per-shard hit lists in S3",
    section: "merging-into-one-ranking",
    box: [29.9, 61.4, 22.9, 7.4],
    summary: "One table of hits per shard, plus a timing file that each worker writes even when it fails.",
  },
  {
    label: "Aggregator",
    section: "merging-into-one-ranking",
    box: [28.3, 73.3, 26.3, 8.0],
    summary: "Reads all 32 hit lists, checks none is missing, ranks by bit score and keeps the top 500: exactly the list one whole-corpus search would give.",
  },
  {
    label: "Metadata in RDS",
    section: "merging-into-one-ranking",
    box: [30.2, 89.4, 20.2, 6.5],
    summary: "Our PostgreSQL database, queried once per job to add metadata to each hit.",
  },
  {
    label: "Stored results in S3",
    section: "versioning-and-caching",
    box: [66.8, 87.4, 23.0, 7.4],
    summary: "The result, labelled with the database build and search version, under a permanent link. Searching the same sequence again returns it instantly.",
  },
]

/**
 * The same, for the simplified landscape SVG (2271 × 665) on the Software
 * overview. That figure folds the per-shard parts bucket and the RDS box
 * into its neighbours, so their summaries are carried here instead.
 * Boxes were read off the rendered SVG with getBBox().
 */
const SIMPLE_HOTSPOTS = [
  {
    label: "petadex.net search page",
    section: "using-the-search",
    box: [1.8, 63.6, 14.4, 16.2],
    summary: "Where a search starts. Paste one protein sequence of 10 to 10,000 amino acids; the page gets a job ID within a second and checks back until the result is ready.",
  },
  {
    label: "Orchestrator",
    section: "atomic-versioning",
    box: [27.4, 37.2, 9.0, 12.9],
    summary: "Validates the sequence, reads the live database version and its shard list, returns a job ID at once and starts the search. It never waits for the search to finish.",
  },
  {
    label: "Sharded database in S3",
    section: "building-the-sharded-database",
    box: [27.8, 58.4, 8.4, 20.9],
    summary: "32 compressed FASTA shards of about 9.6 million sequences each, 23.8 GB in all, plus a manifest. A new build goes live only once every shard is written.",
  },
  {
    label: "Step Functions Map",
    section: "failure-handling",
    box: [51.5, 12.1, 7.8, 70.4],
    summary: "Starts one worker per shard, all 32 at once. Brief errors are retried; if a shard still fails, the whole job fails rather than returning a result with gaps.",
  },
  {
    label: "Workers",
    section: "searching-a-shard",
    box: [52.9, 16.4, 5.1, 61.4],
    summary: "Each downloads one shard (about 8 s) and searches it with diamond blastp (about 31 s), keeping up to 500 hits with E-values scaled to the whole corpus. Each writes its hits to S3 for the aggregator.",
  },
  {
    label: "Aggregator",
    section: "merging-into-one-ranking",
    box: [73.7, 49.8, 7.3, 12.9],
    summary: "Reads all 32 hit lists, checks none is missing, ranks by bit score and keeps the top 500: exactly the list one whole-corpus search would give. It adds each hit's metadata from our PostgreSQL database.",
  },
  {
    label: "Stored result in S3",
    section: "versioning-and-caching",
    box: [91.1, 61.2, 7.1, 20.9],
    summary: "The result, labelled with the database build and search version, under a permanent link. Searching the same sequence again returns it instantly.",
  },
]

/** The two renderings of the diagram, each with its own image box. */
const ARCH_VARIANTS = {
  full: { width: 1416, height: 1884, hotspots: FULL_HOTSPOTS },
  simple: { width: 2271, height: 665, hotspots: SIMPLE_HOTSPOTS },
}

const SECTION_TITLES = {
  "using-the-search": "Using the search",
  "atomic-versioning": "Atomic versioning",
  "building-the-sharded-database": "Building the sharded database",
  "failure-handling": "Failure handling",
  "searching-a-shard": "Searching a shard",
  "merging-into-one-ranking": "Merging into one ranking",
  "versioning-and-caching": "Versioning and caching",
}

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/** Smooth, header-aware jump for links to a section on this page. */
const jumpToSection = e => {
  const href = e.target.closest?.("a")?.getAttribute("href") || ""
  if (!href.startsWith("#")) return
  const el = document.getElementById(href.slice(1))
  if (!el) return
  e.preventDefault()
  const top =
    el.getBoundingClientRect().top +
    window.scrollY -
    (parseFloat(getComputedStyle(el).scrollMarginTop) || 0)
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" })
  window.history.replaceState(null, "", href)
}

/**
 * The architecture diagram on its dark theme background, with a link over
 * each component. `sectionsPath` is the page holding the sections: leave it
 * empty on the Methods page itself, set it to METHODS_PATH elsewhere.
 * `variant` picks the rendering: "full" is the portrait diagram on the
 * Methods page, "simple" the landscape one on the Software overview. The
 * hotspots take the image's clicks, so it opens into the figure viewer from
 * its Expand chip alone.
 */
export const ArchitectureFigure = ({
  src,
  alt = "",
  caption,
  sectionsPath = "",
  width = "36rem",
  variant = "full",
  title,
  expandable,
}) => {
  const viewer = useFigureViewer(expandable)
  const resolved = src.startsWith("/") ? withPrefix(src) : src
  const base = sectionsPath ? withPrefix(sectionsPath) : ""
  const [active, setActive] = useState(null)
  const hotspotTarget = useLinkTarget(sectionsPath ? base : "#")
  const { width: imgW, height: imgH, hotspots } = ARCH_VARIANTS[variant]
  const spot = active === null ? null : hotspots[active]
  return (
    <ArchWrap $width={width}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the hotspots are links; this only smooths same-page jumps */}
      <ArchMap onClick={jumpToSection}>
        <ArchInner>
          <img src={resolved} alt={alt} width={imgW} height={imgH} />
          {hotspots.map(({ label, section, box: [x, y, w, h] }, i) => (
            <a
              key={label}
              href={`${base}#${section}`}
              {...hotspotTarget}
              aria-label={`${label}: read ${SECTION_TITLES[section]}`}
              aria-describedby={active === i ? "ds-arch-popover" : undefined}
              data-active={active === i || undefined}
              style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          ))}
          {spot && <ArchPopover spot={spot} />}
        </ArchInner>
        {viewer && (
          <ViewerButton src={resolved} alt={alt} title={title} caption={caption} ground={ARCH_BG} />
        )}
      </ArchMap>
      {caption && <figcaption>{caption}</figcaption>}
    </ArchWrap>
  )
}

/**
 * The overview card for a hovered component: on whichever side of the box
 * has more room inside the figure, aligned to whichever box edge keeps it
 * inside. The landscape variant's boxes are tall enough that "below unless
 * near the bottom" would push the Map's card off the top of the figure.
 */
const ArchPopover = ({ spot: { label, section, summary, box: [x, y, w, h] } }) => {
  const below = 100 - (y + h) >= y
  const fromLeft = x + w / 2 < 50
  const style = {
    ...(below ? { top: `calc(${y + h}% + 10px)` } : { bottom: `calc(${100 - y}% + 10px)` }),
    ...(fromLeft ? { left: `${x}%` } : { right: `${100 - x - w}%` }),
  }
  return (
    <Popover id="ds-arch-popover" role="tooltip" style={style}>
      <strong>{label}</strong>
      <span>{summary}</span>
      <small>{`Click to read: ${SECTION_TITLES[section]} →`}</small>
    </Popover>
  )
}

/* ---------- Styles ---------- */

const ArchWrap = styled.figure`
  width: 100%;
  max-width: ${({ $width }) => $width};
  margin: var(--space-lg) auto;

  figcaption {
    margin-top: var(--space-sm);
    color: var(--color-muted);
    font-size: 0.875rem;
  }
`

const ArchMap = styled.div`
  position: relative;
  padding: 3%;
  border-radius: 12px;
  background: ${ARCH_BG};
`

/** Exactly the image's box, so the hotspot percentages line up with it. */
const ArchInner = styled.div`
  position: relative;

  img {
    display: block;
    width: 100%;
    height: auto;
  }

  &&& a {
    position: absolute;
    border: 0;
    border-radius: 10px;
    transition: background-color 0.15s ease, box-shadow 0.15s ease;
  }

  &&& a[data-active],
  &&& a:focus-visible {
    background: color-mix(in srgb, ${ARCH_ACCENT} 18%, transparent);
    box-shadow: 0 0 0 2px ${ARCH_ACCENT};
    outline: none;
  }

  @media (prefers-reduced-motion: reduce) {
    a {
      transition: none;
    }
  }
`

const Hero = styled.div`
  display: grid;
  grid-template-columns: minmax(8rem, 13rem) 1fr;
  gap: var(--space-lg);
  align-items: center;
  margin: var(--space-lg) 0;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
`

const Logo = styled.img`
  width: 100%;
  max-width: 13rem;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(95, 57, 40, 0.22);
`

const HeroBody = styled.div`
  display: grid;
  gap: var(--space-md);
`

const Tagline = styled.p`
  margin: 0;
  color: ${INK};
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.25;
`

const Stats = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-sm);
  margin: 0;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`

const Stat = styled.div`
  padding: 0.7rem 0.8rem;
  border: 1.5px solid ${FRAME};
  border-radius: 10px;
  background: ${PAPER};
`

const StatValue = styled.dt`
  color: ${INK};
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`

const StatLabel = styled.dd`
  margin: 0.2rem 0 0;
  color: ${INK_SOFT};
  font-size: 0.8rem;
  line-height: 1.3;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);

  @media (max-width: 560px) {
    justify-content: center;
  }
`

const BUTTON = "#4f5aa0"
const BUTTON_HOVER = "#3d4688"

/* &&& outranks the page template's a:not(.heading-anchor) colour and
   underline (specificity 0,2,1). */
const Action = styled.a`
  &&& {
    display: inline-block;
    padding: 0.55rem 1rem;
    border: 2px solid ${({ $secondary }) => ($secondary ? INK : BUTTON)};
    border-radius: 999px;
    background: ${({ $secondary }) => ($secondary ? "transparent" : BUTTON)};
    color: ${({ $secondary }) => ($secondary ? INK : "#fff")};
    font-weight: 700;
    font-size: 0.9rem;
    text-decoration: none;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  &&&:hover {
    border-color: ${({ $secondary }) => ($secondary ? INK : BUTTON_HOVER)};
    background: ${({ $secondary }) => ($secondary ? INK : BUTTON_HOVER)};
    color: #fff;
  }

  &&&:focus-visible {
    outline: 3px solid ${COMPUTE};
    outline-offset: 2px;
  }
`

const MethodsCard = styled.a`
  &&& {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-md);
    margin: var(--space-lg) 0;
    padding: 1rem 1.2rem;
    border: 2px solid ${FRAME};
    border-radius: 12px;
    background: ${PAPER};
    color: ${INK};
    text-decoration: none;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }

  &&&:hover {
    border-color: ${INK_SOFT};
    transform: translateY(-1px);
  }

  &&&:focus-visible {
    outline: 3px solid ${COMPUTE};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    &&& {
      transition: none;
    }
    &&&:hover {
      transform: none;
    }
  }
`

const MethodsKicker = styled.span`
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  background: ${INK};
  color: ${PAPER};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const MethodsText = styled.span`
  font-size: 0.95rem;
  line-height: 1.4;
`

const MethodsArrow = styled.span`
  font-size: 1.4rem;
  font-weight: 700;
`

const popIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
`

const Popover = styled.span`
  position: absolute;
  z-index: 3;
  display: grid;
  gap: 0.3rem;
  width: min(17rem, 90%);
  padding: 0.7rem 0.85rem;
  border: 1.5px solid ${ARCH_ACCENT};
  border-radius: 10px;
  background: #313244;
  color: #fff;
  font-size: 0.82rem;
  line-height: 1.4;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  animation: ${popIn} 0.14s ease-out;

  /* && outranks the page's own strong and link colours. */
  && strong {
    color: #fff;
    font-size: 0.9rem;
  }

  && small {
    color: #fff;
    font-size: 0.75rem;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`
