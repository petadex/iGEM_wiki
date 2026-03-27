import React from "react"
import { Link } from "gatsby"
import styled from "styled-components"
import { GlobalStyle } from "../styles/globalStyles.js"

const nav = [
  { to: "/", label: "Home" },
  { to: "/team/", label: "Team" },
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
            <span>iGEM Toronto 2026</span>
            <span>PETadex</span>
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
  border-top: 1px solid var(--color-border);
  padding: var(--space-lg) var(--page-padding);
`

const FooterInner = styled.div`
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-muted);
  font-size: 0.875rem;
`