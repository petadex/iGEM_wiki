import React, { useEffect, useState } from "react"
import { Link } from "gatsby"
import styled from "styled-components"

export const wikiNav = [
  { to: "/", label: "Home" },
  { label: "Project", children: [
    { to: "/project/description/", label: "Project Description" },
    { to: "/project/applications/", label: "Applications" },
    { to: "/contribution/", label: "Contribution" },
    { to: "/engineering/", label: "Engineering" },
    { to: "/finance/", label: "Finance" },
  ]},
  { label: "Wet Lab", children: [
    { to: "/wet-lab/overview/", label: "Experimental Overview" },
    { to: "/wet-lab/parts/", label: "Parts" },
    { to: "/wet-lab/notebook/", label: "Notebook" },
    { to: "/wet-lab/results/", label: "Results" },
    { to: "/wet-lab/milestones/", label: "Pivotal Changes and Milestones" },
  ]},
  { label: "Dry Lab", children: [
    { to: "/dry-lab/overview/", label: "Overview" },
    { to: "/model/", label: "Generalized Model" },
    { to: "/software/", label: "Software" },
    { to: "/dry-lab/software-specs/", label: "Software Specs" },
  ]},
  { label: "Hardware", children: [
    { to: "/hardware/", label: "Overview" },
    { to: "/hardware/parts/", label: "Parts" },
    { to: "/hardware/notebook/", label: "Notebook" },
    { to: "/hardware/results/", label: "Results" },
  ]},
  { label: "Team", children: [
    { to: "/team/", label: "Meet the Team" },
    { to: "/team/attributions/", label: "Attributions" },
    { to: "/team/collaborations/", label: "Collaborations" },
    { to: "/wiki/", label: "Wiki" },
  ]},
  { label: "Beyond the Bench", children: [
    { to: "/education/", label: "Education Toolkit" },
    { to: "/human-practices/", label: "Human Practices" },
    { to: "/beyond-the-bench/outreach/", label: "Outreach" },
    { to: "/entrepreneurship/", label: "Entrepreneurship" },
    { to: "/safety-and-security/", label: "Safety" },
  ]},
]

const MOBILE_NAV_BREAKPOINT = "900px"

export function WikiTopBar() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (typeof document === "undefined" || !menuOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <TopBar>
      <NavInner>
        <LogoPlaceholder to="/" aria-label="iGEM Toronto 2026 — Home" onClick={closeMenu}>
          <LogoBox>LOGO</LogoBox>
        </LogoPlaceholder>

        <DesktopNav aria-label="Wiki sections">
          {wikiNav.slice(1).map(({ label, children }) => (
            <NavItem key={label}>
              <NavParent>{label}</NavParent>
              <Dropdown>
                {children.map(({ to, label: childLabel }) => (
                  <DropdownLink key={to} to={to}>{childLabel}</DropdownLink>
                ))}
              </Dropdown>
            </NavItem>
          ))}
        </DesktopNav>

        <MenuToggle
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="wiki-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuBar $open={menuOpen} aria-hidden />
        </MenuToggle>
      </NavInner>

      <MobileMenu id="wiki-mobile-nav" $open={menuOpen} aria-hidden={!menuOpen}>
        <MobileNav aria-label="Wiki sections">
          {wikiNav.slice(1).map(({ label, children }) => (
            <MobileSection key={label}>
              <MobileSectionLabel>{label}</MobileSectionLabel>
              <MobileLinks>
                {children.map(({ to, label: childLabel }) => (
                  <MobileLink key={to} to={to} onClick={closeMenu}>
                    {childLabel}
                  </MobileLink>
                ))}
              </MobileLinks>
            </MobileSection>
          ))}
        </MobileNav>
      </MobileMenu>
    </TopBar>
  )
}

/** Keep nav above portaled glossary popovers (`ExplainTermPopover` uses 100). */
export const WIKI_TOP_BAR_Z_INDEX = 110

const TopBar = styled.header`
  position: relative;
  z-index: ${WIKI_TOP_BAR_Z_INDEX};
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  position: relative;
  z-index: 120;
`

const NavInner = styled.div`
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0.5rem var(--page-padding);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
`

const LogoPlaceholder = styled(Link)`
  text-decoration: none;
  flex-shrink: 0;
`

const LogoBox = styled.div`
  width: 6.5rem;
  height: 1.75rem;
  border: 1px dashed var(--color-border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
`

const DesktopNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm) var(--space-md);
  font-size: 0.8125rem;

  @media (max-width: ${MOBILE_NAV_BREAKPOINT}) {
    display: none;
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
  color: var(--color-muted);
  font-size: inherit;
  cursor: default;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &::after {
    content: '▾';
    font-size: 0.7rem;
    transition: transform 0.2s ease;
  }

  ${NavItem}:hover & {
    color: var(--color-text);
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
  color: var(--color-muted);
  font-size: 0.875rem;
  text-decoration: none;
  white-space: nowrap;
  position: relative;
  z-index: 1;

  &:first-child { margin-top: 0.75rem; }
  &:last-child { margin-bottom: 0.25rem; }

  &:hover {
    color: var(--color-text);
    background: rgba(0,0,0,0.04);
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

const MobileSectionLabel = styled.p`
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--color-text);
`

const MobileLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`

const MobileLink = styled(Link)`
  display: block;
  padding: 0.45rem 0;
  color: var(--color-muted);
  font-size: 0.9rem;
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
