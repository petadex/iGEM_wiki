import React, { useEffect, useState } from "react"
import styled, { css } from "styled-components"
import { GlobalStyle } from "../styles/globalStyles.js"
import { SiteLoader } from "./SiteLoader.js"
import { SponsorCarousel } from "./SponsorCarousel.js"
import { WikiTopBar } from "./WikiTopBar.js"

const WikiLayout = ({
  children,
  pageTitle,
  sectionLabel,
  hideSiteChrome = false,
  hideTopBar = false,
  fullBleed = false,
  wideSideTabs = false,
  /** Pages that render their own SiteLoader (the homepage hands off to its hero). */
  hideLoader = false,
  /**
   * Painting behind the footer: `box` [x0, y0, x1, y1] of a `size` [W, H]
   * image at `src`, carrying on from the page art above at the same scale.
   * `ink` is the text colour that reads on it, `halo` the "r, g, b" glow
   * behind that text, and `base` a colour under it all.
   */
  footerArt = null,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const updateVisibility = () => setShowScrollTop(window.scrollY > 600)
    updateVisibility()
    window.addEventListener("scroll", updateVisibility, { passive: true })
    return () => window.removeEventListener("scroll", updateVisibility)
  }, [])

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
  }

  return (
    <>
      <GlobalStyle />
      {!hideLoader && <SiteLoader />}
      <SiteWrapper>

        {!hideSiteChrome && !hideTopBar && <WikiTopBar sticky />}

        {hideSiteChrome || fullBleed ? (
          <MainFullBleed>{children}</MainFullBleed>
        ) : (
          <Main $wideSideTabs={wideSideTabs}>
            {pageTitle && (
              <PageHeader>
                {sectionLabel && <SectionLabel>{sectionLabel}</SectionLabel>}
                <PageTitle>{pageTitle}</PageTitle>
                <Divider />
              </PageHeader>
            )}
            {children}
          </Main>
        )}

        {showScrollTop && (
          <ScrollTopButton
            type="button"
            aria-label="Scroll to top"
            title="Scroll to top"
            onClick={scrollToTop}
          >
            <span aria-hidden="true">↑</span>
          </ScrollTopButton>
        )}

        <Footer
          $art={!!footerArt}
          $ink={footerArt?.ink}
          $halo={footerArt?.halo}
          $base={footerArt?.base}
        >
            {footerArt && <FooterArtLayer art={footerArt} />}
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
                <FooterConnect aria-label="Contact and social">
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

/** Full image offset so `box` of a `[W, H]` image fills its window. */
function cropStyle([x0, y0, x1, y1], [W, H]) {
  const w = x1 - x0
  const h = y1 - y0
  return {
    width: `${(W / w) * 100}%`,
    height: `${(H / h) * 100}%`,
    left: `${(-x0 / w) * 100}%`,
    top: `${(-y0 / h) * 100}%`,
  }
}

/** Painted rows at the strip's foot that stretch down a taller footer. */
const FOOTER_TAIL_ROWS = 4

/**
 * The strip spans the full width at the page art's scale, so its top edge
 * meets the art above at every window size. A footer taller than the strip
 * (narrow windows) gets the strip's last rows stretched down below it.
 */
function FooterArtLayer({ art }) {
  const [x0, y0, x1, y1] = art.box
  const tail = [x0, y1 - 1 - FOOTER_TAIL_ROWS, x1, y1 - 1]
  return (
    <FooterArt aria-hidden>
      <FooterArtTail>
        <img src={art.src} alt="" decoding="async" style={cropStyle(tail, art.size)} />
      </FooterArtTail>
      <FooterArtStrip style={{ aspectRatio: `${x1 - x0} / ${y1 - y0}` }}>
        <img src={art.src} alt="" decoding="async" style={cropStyle(art.box, art.size)} />
      </FooterArtStrip>
    </FooterArt>
  )
}

/* ── Styled Components ── */

const SiteWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`

const ScrollTopButton = styled.button`
  position: fixed;
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
  z-index: 105;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: 0 4px 14px rgba(6, 32, 43, 0.18);
  font-family: var(--font-body);
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: var(--color-surface);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const Main = styled.main`
  flex: 1;
  max-width: var(--max-width);
  width: 100%;
  margin: 0 auto;
  padding: var(--space-xl) var(--page-padding);

  ${({ $wideSideTabs }) =>
    $wideSideTabs &&
    `
    max-width: none;
    width: 100%;
  `}
`

const MainFullBleed = styled.main`
  flex: none;
  align-self: stretch;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  min-width: 0;
  overflow: visible;
`

const PageHeader = styled.div`
  margin-bottom: var(--space-xl);
`

const SectionLabel = styled.p`
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
  font-weight: 600;
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
  position: relative;
  z-index: 100;
  margin-top: auto;
  background: ${({ $art, $base }) => ($art && $base) || "var(--color-bg)"};
  color: var(--color-text);
  border-top: ${({ $art }) => ($art ? "0" : "1px solid var(--color-border)")};
  padding: var(--space-xl) var(--page-padding) var(--space-lg);

  /* On a painting, the footer's own text takes one ink with a soft halo of
     the opposite tone, so it stands off the brushwork. The sponsor cards are
     left alone: they keep the site's colours on their light faces. */
  ${({ $art, $ink = "#14211b", $halo = "255, 255, 255" }) =>
    $art &&
    css`
      ${FooterIntro}, ${FooterConnect}, ${FooterRule}, ${FooterMeta} {
        --color-text: ${$ink};
        --color-muted: ${$ink};
        color: var(--color-text);
        text-shadow:
          0 0 0.2em rgba(${$halo}, 0.9),
          0 0 0.7em rgba(${$halo}, 0.7);
      }

      ${FooterConnect} a, ${FooterMeta} a {
        font-weight: 600;
      }
    `}

  @media (max-width: 720px) {
    padding: var(--space-lg) var(--page-padding) var(--space-md);
  }
`

const FooterInner = styled.div`
  position: relative;
  max-width: var(--max-width);
  margin: 0 auto;
`

const FooterArt = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  img {
    position: absolute;
    max-width: none;
  }
`

/** The strip's last rows, stretched over the whole footer (seen below the strip). */
const FooterArtTail = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
`

/** The strip at the page art's scale: full width, its own shape, pinned to the top. */
const FooterArtStrip = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
`

const FooterTop = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: var(--space-md);
  row-gap: var(--space-lg);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
    row-gap: var(--space-md);
  }
`

const FooterIntro = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
  justify-self: start;

  @media (max-width: 720px) {
    align-items: center;
    justify-self: center;
    width: 100%;
  }
`

const FooterSponsorSlot = styled.div`
  justify-self: center;
  width: fit-content;
  max-width: 100%;
  min-width: 0;

  @media (max-width: 720px) {
    justify-self: center;
    width: 100%;
    display: flex;
    justify-content: center;
  }
`

const FooterBrand = styled.p`
  font-family: var(--font-display);
  font-size: clamp(1.125rem, 2.5vw, 1.5rem);
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.02em;
`

const FooterButton = styled.a`
  text-shadow: none;
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

  @media (max-width: 720px) {
    padding: 0.5rem 0.875rem;
    font-size: 0.75rem;
  }

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
  margin-top: 2.7rem;

  @media (max-width: 720px) {
    justify-self: center;
    justify-content: center;
    margin-top: 0;
    font-size: 0.875rem;
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

  @media (max-width: 720px) {
    margin: var(--space-md) 0 var(--space-sm);
  }
`

const FooterMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.25rem 0;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-muted);

  @media (max-width: 720px) {
    justify-content: center;
    font-size: 0.75rem;
    text-align: center;
  }
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
