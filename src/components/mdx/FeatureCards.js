import React, { useContext, useEffect, useRef } from "react"
import { withPrefix } from "gatsby"
import styled, { css } from "styled-components"
import { ExpandContext } from "./ExpandWindow.js"

const prefixed = src => (src && src.startsWith("/") ? withPrefix(src) : src)

/** A row of boxes that introduce a page's sections, each linking down to one. */
export const FeatureCards = ({ children }) => {
  const windowed = useContext(ExpandContext)
  return <Row $windowed={windowed}>{children}</Row>
}

/**
 * One box: a picture, a bold name, a line of text and a link. The picture is
 * one of:
 *   - `live`: a page that draws it at whatever size the box takes (the
 *     landscape figure's #card mode), over its `poster` until it has drawn.
 *     It turns only while the box is on screen.
 *   - `picture`: a React element drawn in place (the calendar's season ribbon).
 *   - `video`: a short silent loop; reduced motion gets its `poster` instead.
 *   - `img`: a still.
 * The name is not a heading, so the page's section menu lists the sections
 * themselves, not these boxes.
 */
export const FeatureCard = ({ href, title, cta = "Go", img, video, poster, live, picture, children }) => {
  const videoRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return undefined
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      if (reduce.matches) el.pause()
      else el.play().catch(() => {})
    }
    sync()
    reduce.addEventListener("change", sync)
    return () => reduce.removeEventListener("change", sync)
  }, [])

  // The live picture keeps still off screen, so the page isn't drawing a
  // second landscape nobody can see. It also hears once it has loaded, since
  // a message sent before then is lost.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return undefined
    let shown = false
    const tell = () => frame.contentWindow?.postMessage({ card: shown ? "play" : "pause" }, window.location.origin)
    const seen = new IntersectionObserver(([entry]) => {
      shown = entry.isIntersecting
      tell()
    })
    seen.observe(frame)
    frame.addEventListener("load", tell)
    return () => {
      seen.disconnect()
      frame.removeEventListener("load", tell)
    }
  }, [live])

  return (
    <Card href={href}>
      <Media aria-hidden="true">
        {live ? (
          <>
            {poster && <img src={prefixed(poster)} alt="" loading="lazy" />}
            <iframe ref={frameRef} src={prefixed(live)} title="" tabIndex={-1} loading="lazy" />
          </>
        ) : picture ? (
          picture
        ) : video ? (
          <video ref={videoRef} src={prefixed(video)} poster={prefixed(poster)} muted loop playsInline preload="metadata" />
        ) : (
          img && <img src={prefixed(img)} alt="" loading="lazy" />
        )}
      </Media>
      <Body>
        <Name>{title}</Name>
        <Text>{children}</Text>
        <Cta>
          {cta} <span aria-hidden="true">↓</span>
        </Cta>
      </Body>
    </Card>
  )
}

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-md);
  margin: var(--space-md) 0 var(--space-lg);

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }

  /* In an expand window the boxes fill it: the row takes the window's height
     (&& outranks the window's flex: none on its children) and each picture
     grows into whatever its text leaves, instead of holding to 4:3. */
  ${({ $windowed }) =>
    $windowed &&
    css`
      && {
        flex: 1 1 auto;
        min-height: 0;
        grid-auto-rows: minmax(0, 1fr);
        margin: 0;
      }

      @media (min-width: 761px) {
        ${Media} {
          flex: 1 1 auto;
          min-height: 0;
          aspect-ratio: auto;
        }

        ${Body} {
          flex: none;
        }
      }
    `}
`

/* &&& outranks the prose rule that underlines every link with a border. */
const Card = styled.a`
  &&& {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface);
    color: var(--color-text);
    text-decoration: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  /* Stacked on a phone, each box lies on its side so the three fit a screen. */
  @media (max-width: 760px) {
    &&& {
      flex-direction: row;
    }
  }

  &&&:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(6, 32, 43, 0.12);
  }

  &&:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
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

const Media = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  background: #16181a;

  @media (max-width: 760px) {
    flex: none;
    width: 38%;
    aspect-ratio: auto;
  }

  && img,
  && video {
    display: block;
    width: 100%;
    height: 100%;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    object-fit: cover;
  }

  /* Over the poster, which shows until the figure draws. Clicks go through to
     the card's link. */
  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    pointer-events: none;
  }
`

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);

  @media (max-width: 760px) {
    padding: var(--space-sm) var(--space-md);
  }
`

const Name = styled.strong`
  font-size: 1.05rem;
  line-height: 1.3;
`

/* MDX wraps the text in a paragraph; it takes the box's type, not the prose's. */
const Text = styled.div`
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.45;

  && p {
    margin: 0;
    color: inherit;
    font-size: inherit;
    line-height: inherit;
  }
`

const Cta = styled.span`
  margin-top: auto;
  padding-top: var(--space-sm);
  color: var(--color-accent);
  font-size: 0.9rem;
  font-weight: 600;
`
