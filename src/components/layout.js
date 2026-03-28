import React from "react"
import { Link } from "gatsby"
import styled from "styled-components"
import { GlobalStyle } from "../styles/globalStyles.js"
import { SponsorCarousel } from "./SponsorCarousel.js"

const nav = [
  { to: "/", label: "Home" },
  { to: "/team/", label: "Team" },
  { to: "/safety/", label: "Safety" },
  { to: "/attributions/", label: "Attributions" },
]

const WikiLayout = ({ children, pageTitle }) => {
  return (
    <>
      <GlobalStyle />

      <SiteWrapper>

        <TopBar>
          <Nav aria-label="Wiki sections">
            {nav.map(({ to, label }) => (
              <NavLink key={to} to={to}>
                {label}
              </NavLink>
            ))}
          </Nav>
        </TopBar>

        <Main>
          {pageTitle && (
            <PageHeader>
              <PageTitle>{pageTitle}</PageTitle>
              <Divider />
            </PageHeader>
          )}
          {children}
        </Main>

        <Footer>
          <FooterInner>
            <FooterTop>
              <FooterIntro>
                <FooterBrand>iGEM Toronto</FooterBrand>
                <FooterButton href="https://igem.skule.ca/" target="_blank" rel="noopener noreferrer">
                  Visit iGEM Toronto
                </FooterButton>
              </FooterIntro>
              <FooterSponsorSlot>
                <SponsorCarousel />
              </FooterSponsorSlot>
              <FooterConnect aria-label="Contact and social" style={{ marginTop: "2.7rem" }}>
                <ConnectLink href="https://www.instagram.com/igemtoronto" target="_blank" rel="noopener noreferrer">
                  Instagram
                </ConnectLink>
                <ConnectLink href="mailto:igem@g.skule.ca">igem@g.skule.ca</ConnectLink>
              </FooterConnect>
            </FooterTop>

            <FooterRule />

            <FooterMeta>
              <MetaLink href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
                This work is licensed under CC BY 4.0
              </MetaLink>
              <MetaSep aria-hidden>·</MetaSep>
              <MetaLink href="https://gitlab.com" target="_blank" rel="noopener noreferrer">
                Source on GitLab
              </MetaLink>
            </FooterMeta>
          </FooterInner>
        </Footer>

      </SiteWrapper>
    </>
  )
}

export default WikiLayout

/* ── Styled Components ── */

const SiteWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`

const TopBar = styled.div`
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
`

const Nav = styled.nav`
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-md) var(--page-padding);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md) var(--space-lg);
  font-size: 0.9rem;
`

const NavLink = styled(Link)`
  color: var(--color-muted);
  text-decoration: none;

  &:hover,
  &:focus-visible {
    color: var(--color-text);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`

const Main = styled.main`
  flex: 1;
  max-width: var(--max-width);
  width: 100%;
  margin: 0 auto;
  padding: var(--space-xl) var(--page-padding);
`

const PageHeader = styled.div`
  margin-bottom: var(--space-xl);
`

const PageTitle = styled.h1`
  font-size: clamp(2.5rem, 6vw, 5rem);
  color: var(--color-text);
  margin-bottom: var(--space-md);
`

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--color-accent);
  width: 4rem;
  margin: 0;
`

const Footer = styled.footer`
  margin-top: auto;
  background: var(--color-bg);
  color: var(--color-text);
  border-top: 1px solid var(--color-border);
  padding: var(--space-xl) var(--page-padding) var(--space-lg);
`

const FooterInner = styled.div`
  max-width: var(--max-width);
  margin: 0 auto;
`

const FooterTop = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: var(--space-md);
  row-gap: var(--space-lg);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    justify-items: start;
  }
`

const FooterIntro = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
  justify-self: start;
`

const FooterSponsorSlot = styled.div`
  justify-self: center;
  width: fit-content;
  max-width: 100%;
  min-width: 0;

  @media (max-width: 720px) {
    justify-self: center;
  }
`

const FooterBrand = styled.p`
  font-family: var(--font-display);
  font-size: clamp(1.125rem, 2.5vw, 1.5rem);
  color: var(--color-text);
  letter-spacing: 0.02em;
`

const FooterButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.125rem;
  border: 1px solid var(--color-accent);
  border-radius: 999px;
  color: var(--color-text);
  background: var(--color-accent);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease,
    transform 0.15s ease;

  &:hover {
    background: transparent;
    color: var(--color-text);
    box-shadow: 0 0 0 1px var(--color-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }
`

const FooterConnect = styled.nav`
  justify-self: end;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm) var(--space-md);
  font-family: var(--font-body);
  font-size: 0.9375rem;

  @media (max-width: 720px) {
    justify-self: start;
    justify-content: flex-start;
  }
`

const ConnectLink = styled.a`
  color: var(--color-muted);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  padding-bottom: 0.125rem;
  transition: color 0.2s ease, border-color 0.2s ease;

  &:hover {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 4px;
    border-radius: 2px;
  }
`

const FooterRule = styled.hr`
  border: none;
  border-top: 1px solid var(--color-muted);
  margin: var(--space-lg) 0 var(--space-md);
`

const FooterMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-muted);
`

const MetaLink = styled.a`
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid var(--color-muted);
  padding-bottom: 0.05rem;
  transition: color 0.2s ease, border-color 0.2s ease;

  &:hover {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
    border-radius: 2px;
  }
`

const MetaSep = styled.span`
  margin: 0 0.5rem;
  user-select: none;
  color: var(--color-muted);
`
