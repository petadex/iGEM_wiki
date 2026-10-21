import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { graphql } from "gatsby"
import styled from "styled-components"
import WikiLayout from "../../components/layout.js"

/*
 * Members come from src/data/team/team.csv (from the team roster). The
 * `level` column groups the unfiltered page, in the order of LEVELS; within
 * a level they keep the roster's order. `subteams` lists membership ("Wet
 * Lab; Outreach"), each shown as its symbol on the card. `role` says which
 * of those they lead ("Venture Lead · Dry Lab" leads Venture only). A
 * subteam filter groups by that, so a lead of another subteam shows as a
 * member.
 */

const LEVELS = [
  ["President", "Presidents"],
  ["Lead", "Leads"],
  ["Member", "Members"],
  ["Advisor", "Advisors"],
]

/**
 * Colours from the waterfall behind the page: card frames in its sand (leads)
 * and spray (everyone else), headings in the deep teal of its pool.
 */
const LEAD_FRAME = "#eadfc8"
const TEAM_FRAME = "#cdeae8"
const LEAD_LEVELS = new Set(["President", "Lead"])

const HEADING = "#1f6e69"
const MUTED = "#4d6d69"

/**
 * Subteam "types", shown like a Pokémon card's type symbols down each card's
 * corner, one for each of a member's subteams. `slug` names the icon
 * uploaded to team/icons/ on iGEM's servers.
 */
const SUBTEAM_ICON_BASE =
  "https://static.igem.wiki/teams/6187/wiki/team/icons/"

/**
 * Circle colour of each icon (sampled from the artwork). A selected pill
 * mixes this with white, so Hardware and Wet Lab don't share one red.
 */
const SWATCH = {
  hardware: "#bb5851",
  "wet-lab": "#e79267",
  "dry-lab": "#f0b275",
  web: "#ebd087",
  outreach: "#abbc89",
  entrepreneurship: "#669481",
  "human-practices": "#56848b",
}

const SUBTEAMS = [
  { slug: "hardware", label: "Hardware", match: ["hardware"] },
  { slug: "wet-lab", label: "Wet Lab", match: ["wet lab", "wetlab"] },
  { slug: "dry-lab", label: "Dry Lab", match: ["dry lab", "drylab"] },
  { slug: "web", label: "Web", match: ["web", "wiki"] },
  { slug: "outreach", label: "Outreach", match: ["outreach"] },
  {
    slug: "entrepreneurship",
    label: "Entrepreneurship",
    match: ["entrepreneurship", "venture"],
  },
  {
    slug: "human-practices",
    label: "Human Practices",
    match: ["human practices"],
  },
]

const subteamIn = (text = "") => {
  const t = text.toLowerCase()
  return SUBTEAMS.find((st) => st.match.some((k) => t.includes(k)))
}

const subteamsOf = (m) =>
  (m.subteams || "").split(";").map(subteamIn).filter(Boolean)

/** "Venture Lead · Dry Lab" → ["Venture Lead", "Dry Lab"]. */
const roleParts = (role = "") =>
  String(role)
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)

/**
 * Subteams this person leads. A role part counts only when it names the
 * subteam and says Lead, so "Dry Lab" is membership and "Dry Lab Lead" is not.
 */
const ledSubteams = (m) => {
  const memberOf = new Set(subteamsOf(m).map((type) => type.slug))
  const seen = new Set()
  return roleParts(m.role).flatMap((part) => {
    if (!/\blead\b/i.test(part)) return []
    const type = subteamIn(part)
    if (!type || !memberOf.has(type.slug) || seen.has(type.slug)) return []
    seen.add(type.slug)
    return [type]
  })
}

/**
 * No filter keeps the roster level. A filter promotes someone only for a
 * selected subteam they lead; on any other selected subteam they are a member.
 * Advisors stay advisors. A president who leads the selected subteam stays a
 * president (Anthony on Entrepreneurship).
 */
const levelInFilter = (m, filter) => {
  if (!filter.size || m.level === "Advisor") return m.level
  const leadsHere = ledSubteams(m).some((type) => filter.has(type.slug))
  if (!leadsHere) return "Member"
  return m.level === "President" ? "President" : "Lead"
}

/**
 * The line under a name. Subteams already have icons, so this is only a
 * title: President, Advisor, or the team someone leads. Anthony is both
 * president and Entrepreneurship lead, so those join with a comma.
 */
const cardLabel = (m, level = m.level) => {
  const parts = []
  if (level === "President") parts.push("President")
  if (level === "Advisor") parts.push("Advisor")
  if (level === "President" || level === "Lead") {
    for (const type of ledSubteams(m)) parts.push(type.label)
  }
  return parts.join(", ")
}

/**
 * Waterfall painting (1110×4000) behind the page. It fills the window width
 * and pans from the sky to the pool over the page's scroll, so the whole
 * painting goes by however long the page is.
 */
const BG_SRC = "https://static.igem.wiki/teams/6187/wiki/team/bg.avif"

const photoSrc = (m) => m.photo || ""

/** First and last name's, past a nickname in brackets ("Adrija (Hiya) Paul"). */
const initials = (name = "") => {
  const words = name.split(/\s+/).filter((w) => w && !w.startsWith("("))
  return [words[0], words.length > 1 && words[words.length - 1]]
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("")
}

const groupByLevel = (members) =>
  LEVELS.map(([level, title]) => [
    level,
    title,
    members.filter((m) => m.displayLevel === level),
  ]).filter(([, , group]) => group.length)

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      fill="currentColor"
      d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.54h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.02c0-1.2-.02-2.74-1.67-2.74-1.67 0-1.93 1.3-1.93 2.65V21h-4z"
    />
  </svg>
)

const MailIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      d="M3.5 6h17v12h-17zM3.5 6.5l8.5 6.5 8.5-6.5"
    />
  </svg>
)

function MemberLinks({ m }) {
  if (!m.linkedIn && !m.email) return null
  return (
    <Links>
      {m.linkedIn && (
        <IconLink href={m.linkedIn} target="_blank" rel="noopener noreferrer" aria-label={`${m.Name} on LinkedIn`}>
          <LinkedInIcon />
        </IconLink>
      )}
      {m.email && (
        <IconLink href={`mailto:${m.email}`} target="_blank" rel="noopener noreferrer" aria-label={`Email ${m.Name}`}>
          <MailIcon />
        </IconLink>
      )}
    </Links>
  )
}

/** One legend. Scroll moves these same buttons from the header row to the left edge. */
function SubteamLegend({ active, onToggle, legendRef }) {
  return (
    <Legend ref={legendRef} aria-label="Subteam icons">
      {SUBTEAMS.map((type) => (
        <li key={type.slug}>
          <LegendButton
            type="button"
            data-subteam={type.slug}
            aria-pressed={active.has(type.slug)}
            onClick={() => onToggle(type.slug)}
          >
            <img src={`${SUBTEAM_ICON_BASE}${type.slug}.avif`} alt="" />
            <span>{type.label}</span>
          </LegendButton>
        </li>
      ))}
    </Legend>
  )
}

const TeamPage = ({ data }) => {
  const members = data.allTeamCsv.nodes
  const [filter, setFilter] = useState(() => new Set())
  const backdropRef = useRef(null)
  const contentRef = useRef(null)
  const headerLegendRef = useRef(null)

  useEffect(() => {
    const box = backdropRef.current
    const img = box?.firstElementChild
    if (!img) return undefined
    let frame = 0
    const pan = () => {
      frame = 0
      const range = document.documentElement.scrollHeight - window.innerHeight
      const p = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0
      const y = p * Math.min(0, box.clientHeight - img.offsetHeight)
      img.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`
    }
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(pan)
    }
    pan()
    img.addEventListener("load", queue)
    window.addEventListener("scroll", queue, { passive: true })
    window.addEventListener("resize", queue)
    return () => {
      cancelAnimationFrame(frame)
      img.removeEventListener("load", queue)
      window.removeEventListener("scroll", queue)
      window.removeEventListener("resize", queue)
    }
  }, [])

  /*
   * One legend stays in the header flow. Over a short scroll (the row
   * reaching the site bar), each button's translate moves it to the
   * left-hand stack. Progress is the scroll position, not a timed tween.
   * A linear mix would still be moving when it hits the side slot, and
   * would change direction the instant the move starts. Smoothstep keeps
   * the same short range but matches scroll speed at both ends.
   * Reduced motion snaps to the row or the stack.
   */
  useLayoutEffect(() => {
    const legend = headerLegendRef.current
    const content = contentRef.current
    if (!legend || !content) return undefined
    const travel = 140
    let frame = 0
    let home = []
    const buttons = () => [...legend.querySelectorAll("button")]
    const measure = () => {
      buttons().forEach((b) => {
        b.style.transform = "none"
        b.style.clipPath = ""
        const span = b.querySelector("span")
        if (span) span.style.opacity = ""
      })
      const lr = legend.getBoundingClientRect()
      home = buttons().map((b) => {
        const r = b.getBoundingClientRect()
        return { x: r.left - lr.left, y: r.top - lr.top, w: r.width, h: r.height }
      })
    }
    const place = () => {
      frame = 0
      const list = buttons()
      if (home.length !== list.length) measure()
      const bar = document.querySelector("header")
      const cover = bar ? bar.getBoundingClientRect().bottom : 0
      const lr = legend.getBoundingClientRect()
      const raw = (cover - lr.top) / travel
      const p = Math.min(1, Math.max(0, raw))
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const t = reduce ? (p >= 0.5 ? 1 : 0) : p * p * (3 - 2 * p)
      const narrow = window.matchMedia("(max-width: 900px)").matches
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const gap = 0.4 * root
      const sideLeft = 0.75 * root
      const total = home.reduce((sum, slot, i) => sum + slot.h + (i ? gap : 0), 0)
      let cursor = (window.innerHeight - total) / 2
      list.forEach((b, i) => {
        const slot = home[i]
        if (!slot) return
        const naturalX = lr.left + slot.x
        const naturalY = lr.top + slot.y
        const sideY = cursor
        cursor += slot.h + gap
        const dx = (sideLeft - naturalX) * t
        const dy = (sideY - naturalY) * t
        b.style.transform =
          t === 0 ? "" : `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`
        const span = b.querySelector("span")
        if (!narrow) {
          b.style.clipPath = ""
          if (span) span.style.opacity = ""
          return
        }
        const img = b.querySelector("img")
        const pad = parseFloat(getComputedStyle(b).paddingLeft) || 0
        const iconPill = pad + (img ? img.offsetWidth : 0) + pad
        const clip = Math.max(0, slot.w - iconPill) * t
        b.style.clipPath = clip > 0.4 ? `inset(0 ${clip.toFixed(1)}px 0 0 round 999px)` : ""
        if (span) span.style.opacity = String(1 - t)
      })
      content.style.setProperty("--legend-p", t.toFixed(3))
    }
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(place)
    }
    const onResize = () => {
      measure()
      place()
    }
    measure()
    place()
    window.addEventListener("scroll", queue, { passive: true })
    window.addEventListener("resize", onResize)
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    motion.addEventListener?.("change", queue)
    let cancelFonts = false
    document.fonts?.ready.then(() => {
      if (cancelFonts) return
      measure()
      place()
    })
    return () => {
      cancelFonts = true
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", queue)
      window.removeEventListener("resize", onResize)
      motion.removeEventListener?.("change", queue)
    }
  }, [])

  const toggleFilter = (slug) =>
    setFilter((current) => {
      const next = new Set(current)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })

  const shown = (filter.size
    ? members.filter((m) =>
        subteamsOf(m).some((type) => filter.has(type.slug))
      )
    : members
  ).map((m) => ({ ...m, displayLevel: levelInFilter(m, filter) }))
  const sections = groupByLevel(shown)

  return (
    <WikiLayout pagePath="/team/">
      <Backdrop ref={backdropRef} aria-hidden>
        <img src={BG_SRC} alt="" />
      </Backdrop>

      <Content ref={contentRef}>
        <Title>Meet the Team</Title>
        <Intro>
          The team behind PetaBite.
          Choose a subteam to see who is on it.
        </Intro>
        <SubteamLegend
          active={filter}
          onToggle={toggleFilter}
          legendRef={headerLegendRef}
        />

        <Roster>
          {sections.map(([level, title, group]) => (
            <Section key={level} aria-labelledby={`team-${level}`}>
              <SectionTitle id={`team-${level}`}>{title}</SectionTitle>
              <Cards>
                {group.map((m) => {
                  const frame = LEAD_LEVELS.has(m.displayLevel) ? LEAD_FRAME : TEAM_FRAME
                  const types = subteamsOf(m)
                  const label = cardLabel(m, m.displayLevel)
                  return (
                    <Card key={m.id} style={{ "--frame": frame }}>
                      <Photo>
                        {photoSrc(m) ? (
                          <img src={photoSrc(m)} alt="" loading="lazy" />
                        ) : (
                          <Initials aria-hidden>{initials(m.Name)}</Initials>
                        )}
                        <Top>
                          <Caption>
                            <Name>{m.Name}</Name>
                            {label && <Role>{label}</Role>}
                          </Caption>
                          {types.length > 0 && (
                            <TypeBadges>
                              {types.map((type) => (
                                <TypeBadge
                                  key={type.slug}
                                  src={`${SUBTEAM_ICON_BASE}${type.slug}.avif`}
                                  alt={`${type.label} subteam`}
                                  title={type.label}
                                  loading="lazy"
                                  decoding="async"
                                />
                              ))}
                            </TypeBadges>
                          )}
                        </Top>
                        <MemberLinks m={m} />
                      </Photo>
                    </Card>
                  )
                })}
              </Cards>
            </Section>
          ))}
          {sections.length === 0 && (
            <Empty>No one on this subteam is listed.</Empty>
          )}
        </Roster>
      </Content>
    </WikiLayout>
  )
}

export const query = graphql`
  query TeamMembers {
    allTeamCsv {
      nodes {
        id
        Name
        level
        role
        subteams
        linkedIn
        email
        photo
      }
    }
  }
`

export default TeamPage
export const Head = () => <title>Meet the Team | iGEM Toronto 2026</title>

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: #cfe6e4;

  img {
    display: block;
    width: 100%;
    height: auto;
    min-height: 100%;
    object-fit: cover;
    will-change: transform;
  }
`

const Content = styled.div`
  position: relative;
  z-index: 1;
`

const Title = styled.h1`
  margin: clamp(2rem, 6vw, 4rem) 0 0.65rem;
  text-align: center;
  color: ${HEADING};
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(2.5rem, 7vw, 4.25rem);
  letter-spacing: -0.01em;
`

const Intro = styled.p`
  max-width: 36rem;
  margin: 0 auto clamp(1.1rem, 2.5vw, 1.55rem);
  text-align: center;
  color: ${MUTED};
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
`

const Empty = styled.p`
  margin: 1.5rem 0 3rem;
  text-align: center;
  color: ${MUTED};
  font-size: 1rem;
`

/** Clears the left edge in step with the legend's scroll progress, only as far as the icons would cover the cards. */
const Roster = styled.div`
  --legend-reach: 13.25rem;
  padding-left: calc(
    var(--legend-p, 0) *
      max(
        0px,
        var(--legend-reach) - max(0px, (100vw - var(--max-width)) / 2) -
          var(--page-padding)
      )
  );

  @media (max-width: 900px) {
    --legend-reach: 3.6rem;
  }
`

const LegendButton = styled.button`
  appearance: none;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: max-content;
  max-width: 100%;
  margin: 0;
  padding: 0.3rem 0.7rem 0.3rem 0.35rem;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: ${HEADING};
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;

  ${Object.entries(SWATCH)
    .map(([slug, color]) => `&[data-subteam="${slug}"] { --swatch: ${color}; }`)
    .join("\n")}

  img {
    width: 1.7rem;
    height: 1.7rem;
    flex: none;
  }

  &:focus-visible {
    outline: 2px solid ${HEADING};
    outline-offset: 3px;
  }

  &[aria-pressed="true"] {
    background: color-mix(in srgb, var(--swatch) 30%, #fff);
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--swatch) 58%, #fff);
  }
`

const Legend = styled.ul`
  position: relative;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  max-width: 100%;
  margin: 0 0 clamp(1.75rem, 4vw, 2.75rem);
  padding: 0;
  overflow: visible;
  list-style: none;

  li {
    display: flex;
    flex: 0 0 auto;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }
`

const Section = styled.section`
  margin-bottom: clamp(3rem, 7vw, 5rem);
`

const SectionTitle = styled.h2`
  margin: 0 0 clamp(1.5rem, 3vw, 2.25rem);
  color: ${HEADING};
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(1.75rem, 4.5vw, 2.6rem);
`

/** Rows of up to four, centered (so a short row like the leads sits in the middle). */
/**
 * Cards are big on small windows (40vw) and keep growing on big ones (12.5vw
 * past 10rem), so they never look tiny. Everything on a card is sized in em
 * off the card's width, so the text and buttons grow with it.
 */
const Cards = styled.div`
  --card-w: clamp(8.5rem, 40vw, max(10rem, 12.5vw));
  --card-gap: clamp(1rem, 3vw, max(1.9rem, 2.4vw));
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(1.25rem, 3vw, max(2rem, 2.6vw)) var(--card-gap);
  max-width: calc(4 * var(--card-w) + 3 * var(--card-gap));
  margin: 0 auto;
`

const Card = styled.article`
  position: relative;
  width: var(--card-w);
  aspect-ratio: 156 / 218;
  box-sizing: border-box;
  padding: 0.44em;
  border-radius: 0.5em;
  background: var(--frame);
  /* 1em is 16px on a 10rem card. */
  font-size: max(0.85rem, calc(var(--card-w) / 10));
`

const Photo = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 4px;
  background: linear-gradient(160deg, #a7dedf, #4f9f99);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Darkens the top and bottom so the name and icons read on any photo. */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      rgba(0, 0, 0, 0.45),
      transparent 32%,
      transparent 78%,
      rgba(0, 0, 0, 0.35)
    );
  }
`

const Initials = styled.span`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  /* Sit below a long name instead of through the middle of it. */
  padding-top: 2.4em;
  color: rgba(255, 255, 255, 0.85);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 2.25em;
`

/** Name on the left, subteam icons in their own column on the right. */
const Top = styled.div`
  position: absolute;
  z-index: 1;
  top: 0.4em;
  left: 0.45em;
  right: 0.35em;
  display: flex;
  align-items: flex-start;
  gap: 0.4em;
`

const Caption = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  color: #fff;
  line-height: 1.2;
`

/** The subteams' icons, down the top right like a Pokémon card's type symbol. */
const TypeBadges = styled.div`
  flex: 0 0 2.15em;
  display: flex;
  flex-direction: column;
  gap: 0.15em;
`

const TypeBadge = styled.img`
  /* Over the photo's own img rule (fill the card). */
  && {
    width: 100%;
    height: auto;
  }
  aspect-ratio: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  transition: transform 0.25s cubic-bezier(0.3, 1.6, 0.5, 1);

  @media (hover: hover) {
    ${Card}:hover & {
      transform: scale(1.12) rotate(-8deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const Name = styled.div`
  font-size: 0.95em;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
`

const Role = styled.div`
  font-size: 0.68em;
  opacity: 0.9;
`

const Links = styled.div`
  position: absolute;
  z-index: 1;
  right: 0.4em;
  bottom: 0.4em;
  display: flex;
  gap: 0.25em;
`

const IconLink = styled.a`
  display: grid;
  place-items: center;
  width: 1.3em;
  height: 1.3em;
  border: 1.5px solid #fff;
  border-radius: 3px;
  color: #fff;

  svg {
    width: 0.8em;
    height: 0.8em;
  }

  &:hover,
  &:focus-visible {
    background: rgba(255, 255, 255, 0.25);
  }
`
