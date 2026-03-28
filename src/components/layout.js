import React from "react"
import styled from "styled-components"
import { GlobalStyle } from "../styles/globalStyles.js"
import Header from "../components/header.js"


const WikiLayout = ({ children, pageTitle }) => {
  return (
    <>
      <GlobalStyle />

      <SiteWrapper>
        <Header
          siteTitle="iGEM Toronto 2026"
          menuLinks={navLinks}
        />
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

const navLinks = [
    {
      name: "Project",
      subLinks: [
        { name: "Description",      link: "/description" },
        { name: "Applications",     link: "/applications" },
        { name: "Wet Lab",          link: "/wet-lab" },
        { name: "Model",            link: "/model" },
        { name: "Software",         link: "/software" },
        { name: "Hardware",         link: "/hardware" },
        { name: "Engineering",      link: "/engineering" },
      ],
    },
    {
      name: "Support",
      subLinks: [
        { name: "Human Practices",  link: "/human-practices" },
        { name: "Entrepreneurship", link: "/entrepreneurship" },
      ],
    },
    {
      name: "Team",
      subLinks: [
        { name: "Team",             link: "/team" },
        { name: "Attributions",     link: "/attributions" },
        { name: "Contribution",     link: "/contribution" },
      ],
    },
    {
      name: "Other",
      subLinks: [
        { name: "Finance",          link: "/finance" },
        { name: "Outreach",         link: "/outreach" },
        { name: "Web",              link: "/web" },
      ],
    },
    
]