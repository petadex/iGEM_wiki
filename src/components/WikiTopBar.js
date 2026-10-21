import React, { useEffect, useState } from "react"
import { Link } from "gatsby"
import styled from "styled-components"

export const wikiNav = [
  { to: "/", label: "Home" },
  { label: "Project", children: [
    { to: "/project/description/", label: "Project Description" },
    { to: "/engineering/", label: "Engineering" },
    { to: "/wiki/", label: "Wiki" },
    { to: "/finance/", label: "Finance" },
    { to: "/safety-and-security/", label: "Safety" },
  ]},
  { label: "Dry Lab", children: [
    { to: "/dry-lab/overview/", label: "Overview" },
    { to: "/model/", label: "Model" },
    { to: "/software/", label: "Software" },
  ]},
  { label: "Wet Lab", children: [
    { to: "/wet-lab/overview/", label: "Overview" },
    { to: "/wet-lab/plasmid-design/", label: "Plasmid Design" },
    { to: "/wet-lab/copper-integration/", label: "Copper Integration" },
    { to: "/wet-lab/biosensor/", label: "Biosensor Assay" },
    { to: "/wet-lab/selection/", label: "Selection Assay" },
    { to: "/wet-lab/results/", label: "Results" },
    { to: "/wet-lab/notebook/", label: "Protocols, Experiment Schedule, and Lab Notes" },
    { to: "/wet-lab/parts/", label: "Parts Documentation" },
  ]},
  { label: "Hardware", children: [
    { to: "/hardware/", label: "Overview" },
    { to: "/hardware/motivation/", label: "Motivation" },
    { to: "/hardware/past-iterations/", label: "Past Iterations" },
    { to: "/hardware/notebook/", label: "Notebook" },
  ]},
  { to: "/human-practices/", label: "Human Practices" },
  { to: "/beyond-the-bench/outreach/", label: "Outreach" },
  { to: "/entrepreneurship/", label: "Entrepreneurship" },
  { label: "Team", children: [
    { to: "/contribution/", label: "Contribution" },
    { to: "/team/", label: "Meet the Team" },
    { to: "/team/attributions/", label: "Attributions" },
  ]},
]

/** Below this the links don't fit on one line beside the logo, so the menu button takes over. */
const MOBILE_NAV_BREAKPOINT = "1080px"

/** The PetaBite wordmark in the wiki colourway (Cindy's logo, intact frame). */
const LOGO_SRC = "https://static.igem.wiki/teams/6187/wiki/outreach/photos/petabite-logo-web.avif"
/** The logo's dark green (its "i" and "t"): the bar's text. */
const LOGO_GREEN = "#34686c"
/** A pale blue box behind a hovered title (the text stays green on it). */
const HOVER_BG = "#cfe8f1"

/**
 * A title's hover box. Its padding is taken back by negative margins, so the
 * bar's spacing (and where the menus drop from) stays as it was.
 */
const hoverBox = `
  padding: 0.3rem 0.55rem;
  margin: -0.3rem -0.55rem;
  border-radius: 0.45rem;
  transition: background-color 0.15s ease;
`
const hoverBoxOn = `
  background-color: ${HOVER_BG};
  color: ${LOGO_GREEN};
`

export function WikiTopBar({ sticky = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openMobileSection, setOpenMobileSection] = useState(null)

  useEffect(() => {
    if (typeof document === "undefined" || !menuOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false)
        setOpenMobileSection(null)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

  const closeMenu = () => {
    setMenuOpen(false)
    setOpenMobileSection(null)
  }

  const toggleMenu = () => {
    setMenuOpen(open => {
      if (open) setOpenMobileSection(null)
      return !open
    })
  }

  return (
    <TopBar $sticky={sticky}>
      <NavInner>
        <LogoLink to="/" aria-label="PetaBite, iGEM Toronto 2026 home page" onClick={closeMenu}>
          <LogoImg src={LOGO_SRC} alt="" />
        </LogoLink>

        <DesktopNav aria-label="Wiki sections">
          {wikiNav.slice(1).map(({ to, label, children }) =>
            children ? (
              <NavItem key={label}>
                <NavParent>{label}</NavParent>
                <Dropdown>
                  {children.map(({ to: childTo, label: childLabel }) => (
                    <DropdownLink key={childTo} to={childTo}>{childLabel}</DropdownLink>
                  ))}
                </Dropdown>
              </NavItem>
            ) : (
              <DesktopLink key={to} to={to}>{label}</DesktopLink>
            )
          )}
        </DesktopNav>

        <MenuToggle
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="wiki-mobile-nav"
          onClick={toggleMenu}
        >
          <MenuBar $open={menuOpen} aria-hidden />
        </MenuToggle>
      </NavInner>

      <MobileMenu id="wiki-mobile-nav" $open={menuOpen} aria-hidden={!menuOpen}>
        <MobileNav aria-label="Wiki sections">
          {wikiNav.slice(1).map(({ to, label, children }) =>
            children ? (
              <MobileSection key={label}>
                <MobileSectionToggle
                  type="button"
                  aria-expanded={openMobileSection === label}
                  onClick={() =>
                    setOpenMobileSection(current =>
                      current === label ? null : label,
                    )
                  }
                >
                  <span>{label}</span>
                  <MobileChevron
                    $open={openMobileSection === label}
                    aria-hidden="true"
                  >
                    ▾
                  </MobileChevron>
                </MobileSectionToggle>
                <MobileLinks $open={openMobileSection === label}>
                  {children.map(({ to: childTo, label: childLabel }) => (
                    <MobileLink key={childTo} to={childTo} onClick={closeMenu}>
                      {childLabel}
                    </MobileLink>
                  ))}
                </MobileLinks>
              </MobileSection>
            ) : (
              <MobileTopLink key={to} to={to} onClick={closeMenu}>
                {label}
              </MobileTopLink>
            )
          )}
        </MobileNav>
      </MobileMenu>
    </TopBar>
  )
}

/** Keep nav above portaled glossary popovers (`ExplainTermPopover` uses 100). */
export const WIKI_TOP_BAR_Z_INDEX = 110

const TopBar = styled.header`
  position: ${({ $sticky }) => ($sticky ? "sticky" : "relative")};
  top: ${({ $sticky }) => ($sticky ? "0" : "auto")};
  z-index: ${WIKI_TOP_BAR_Z_INDEX};
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
`

const NavInner = styled.div`
  max-width: var(--max-width);
  margin: 0 auto;
  /* Room for the logo's hanging letters once it's nudged down (LogoImg). */
  padding: 1rem var(--page-padding);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
`

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
`

/**
 * Taller than the nav links; the negative margin lets it use the bar's padding.
 * Nudged down so its hexagon row, not its box, lines up with the links (the
 * B and e hang below the rest of the word).
 */
const LogoImg = styled.img`
  display: block;
  height: 3.9rem;
  width: auto;
  margin: -0.65rem 0;
  transform: translateY(0.3rem);
`

const DesktopNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm) var(--space-md);
  font-size: 1.05rem;

  @media (max-width: ${MOBILE_NAV_BREAKPOINT}) {
    display: none;
  }
`

const DesktopLink = styled(Link)`
  color: ${LOGO_GREEN};
  font-size: inherit;
  text-decoration: none;
  ${hoverBox}

  &:hover {
    ${hoverBoxOn}
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
    border-radius: 2px;
  }
`

const NavItem = styled.div`
  position: relative;

  &:hover > div,
  &:focus-within > div {
    display: flex;
  }

  &:last-child > div {
    left: auto;
    right: 0;
  }
`

const NavParent = styled.span`
  color: ${LOGO_GREEN};
  font-size: inherit;
  cursor: default;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  ${hoverBox}

  &::after {
    content: '▾';
    font-size: 0.8rem;
    transition: transform 0.2s ease;
  }

  ${NavItem}:hover & {
    ${hoverBoxOn}
    &::after { transform: rotate(180deg); }
  }
`

const Dropdown = styled.div`
  display: none;
  flex-direction: column;
  position: absolute;
  top: 100%;
  left: 0;
  padding-top: 0.5rem;
  background: transparent;
  min-width: 200px;
  z-index: 100;

  &::before {
    content: '';
    position: absolute;
    inset: 0.5rem 0 0;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    z-index: -1;
  }
`

const DropdownLink = styled(Link)`
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  color: ${LOGO_GREEN};
  font-size: 1rem;
  text-decoration: none;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  transition: background-color 0.15s ease;

  &:first-child { margin-top: 0.75rem; }
  &:last-child { margin-bottom: 0.25rem; }

  &:hover {
    ${hoverBoxOn}
  }
`

const MenuToggle = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  cursor: pointer;
  flex-shrink: 0;

  @media (max-width: ${MOBILE_NAV_BREAKPOINT}) {
    display: inline-flex;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const MenuBar = styled.span`
  position: relative;
  display: block;
  width: 1.125rem;
  height: 2px;
  background: var(--color-text);
  border-radius: 1px;
  transition: background 0.2s ease;

  &::before,
  &::after {
    content: "";
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--color-text);
    border-radius: 1px;
    transition: transform 0.2s ease, top 0.2s ease;
  }

  &::before {
    top: ${({ $open }) => ($open ? "0" : "-6px")};
    transform: ${({ $open }) => ($open ? "rotate(45deg)" : "none")};
  }

  &::after {
    top: ${({ $open }) => ($open ? "0" : "6px")};
    transform: ${({ $open }) => ($open ? "rotate(-45deg)" : "none")};
  }

  ${({ $open }) =>
    $open &&
    `
    background: transparent;
  `}
`

const MobileMenu = styled.div`
  display: none;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  max-height: calc(100vh - 3.5rem);
  overflow-y: auto;

  @media (max-width: ${MOBILE_NAV_BREAKPOINT}) {
    display: ${({ $open }) => ($open ? "block" : "none")};
  }
`

const MobileNav = styled.nav`
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-sm) var(--page-padding) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`

const MobileSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`

const MobileSectionToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.45rem 0;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  background: transparent;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 2px;
  }
`

const MobileChevron = styled.span`
  font-size: 0.9rem;
  transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
  transition: transform 0.2s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const MobileLinks = styled.div`
  display: ${({ $open }) => ($open ? "flex" : "none")};
  flex-direction: column;
  gap: 0.125rem;
  padding-left: 0.75rem;
`

const MobileLink = styled(Link)`
  display: block;
  padding: 0.45rem 0;
  color: ${LOGO_GREEN};
  font-size: 1.05rem;
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);

  &:hover {
    color: var(--color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 2px;
  }
`

const MobileTopLink = styled(MobileLink)`
  color: var(--color-text);
  font-weight: 600;
`
