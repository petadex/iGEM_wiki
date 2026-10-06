import React, { useState } from "react"
import styled, { css } from "styled-components"

/**
 * Dropdowns and file embeds for MDX pages. Every embed shows a "coming soon"
 * box until it's given a `src`, so a page's layout can go in before its files.
 *
 * iGEM rule: files must live on iGEM's servers. PDFs go on static.igem.wiki
 * and videos on video.igem.wiki; Google Docs/Sheets/Slides and YouTube
 * links can't be embedded.
 */

/** Click to open/close; built on <details>, so it works without JS too. */
export const Dropdown = ({ title, open = false, children }) => (
  <DropdownBox open={open}>
    <DropdownSummary>{title}</DropdownSummary>
    <DropdownBody>{children}</DropdownBody>
  </DropdownBox>
)

/**
 * PDF in a scrollable frame. `compact` makes it smaller (secondary
 * verticals); `badge` labels it (e.g. "Primary vertical"). Until the PDF
 * exists, `cover` (its title page, AVIF) stands in for it.
 */
export const PdfEmbed = ({ src, title, badge, cover, compact = false }) => (
  <EmbedFigure $compact={compact}>
    <EmbedHead $compact={compact}>
      {badge && <Badge>{badge}</Badge>}
      {title && <EmbedTitle>{title}</EmbedTitle>}
      {src && (
        <OpenLink href={src} target="_blank" rel="noopener noreferrer">
          Open PDF ↗
        </OpenLink>
      )}
    </EmbedHead>
    {src ? (
      <PdfFrame src={src} title={title || "PDF"} $compact={compact} />
    ) : cover ? (
      <CoverCard $compact={compact}>
        <CoverImg
          src={cover}
          alt={`${title || "Report"} cover page`}
          loading="lazy"
          decoding="async"
        />
        <CoverTag>Full report coming soon</CoverTag>
      </CoverCard>
    ) : (
      <Pending $compact={compact}>PDF coming soon</Pending>
    )}
  </EmbedFigure>
)

/** Side-by-side compact embeds (one column on narrow screens). */
export const EmbedGrid = ({ children }) => <Grid>{children}</Grid>

/** Spreadsheet frame (an iGEM-hosted export, e.g. HTML or PDF). */
export const SheetEmbed = ({ src, title }) => (
  <EmbedFigure>
    <EmbedHead>
      {title && <EmbedTitle>{title}</EmbedTitle>}
      {src && (
        <OpenLink href={src} target="_blank" rel="noopener noreferrer">
          Open sheet ↗
        </OpenLink>
      )}
    </EmbedHead>
    {src ? (
      <PdfFrame src={src} title={title || "Spreadsheet"} />
    ) : (
      <Pending>Spreadsheet coming soon</Pending>
    )}
  </EmbedFigure>
)

/** 16:9 video from video.igem.wiki. */
export const VideoEmbed = ({ src, title }) => (
  <EmbedFigure>
    {title && (
      <EmbedHead>
        <EmbedTitle>{title}</EmbedTitle>
      </EmbedHead>
    )}
    {src ? (
      <VideoFrame
        src={src}
        title={title || "Video"}
        allow="fullscreen; picture-in-picture"
        allowFullScreen
      />
    ) : (
      <Pending $video>Video coming soon</Pending>
    )}
  </EmbedFigure>
)

/**
 * A justified row of photos: they share one height and fill the width in
 * proportion to their own shape (learned as each loads). Click to open the
 * full image. `small` makes the row shorter (e.g. document pages).
 */
export const Photos = ({ srcs = [], alt = "", small = false }) => (
  <PhotoRow $small={small}>
    {srcs.map((src, i) => (
      <Photo
        key={src}
        src={src}
        alt={srcs.length > 1 ? `${alt} (${i + 1} of ${srcs.length})` : alt}
      />
    ))}
  </PhotoRow>
)

function Photo({ src, alt }) {
  const [ratio, setRatio] = useState(4 / 3)
  return (
    <PhotoLink
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      style={{ flexGrow: ratio, flexBasis: `calc(var(--row-h) * ${ratio})` }}
    >
      <PhotoImg
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={e => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget
          if (w && h) setRatio(w / h)
        }}
      />
    </PhotoLink>
  )
}

export const embedComponents = {
  Dropdown,
  Photos,
  PdfEmbed,
  EmbedGrid,
  SheetEmbed,
  VideoEmbed,
}

const DropdownBox = styled.details`
  max-width: none;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  overflow: hidden;

  & + & {
    margin-top: var(--space-sm) !important;
  }

  &[open] > summary::after {
    transform: translateY(-25%) rotate(-135deg);
  }
`

const DropdownSummary = styled.summary`
  position: relative;
  padding: 0.85rem 2.75rem 0.85rem 1.1rem;
  color: var(--color-text);
  font-weight: 700;
  line-height: 1.35;
  list-style: none;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;

  &::-webkit-details-marker {
    display: none;
  }

  /* Chevron. */
  &::after {
    content: "";
    position: absolute;
    right: 1.15rem;
    top: 50%;
    width: 0.5rem;
    height: 0.5rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translateY(-75%) rotate(45deg);
    transition: transform 0.2s ease;
  }

  &:hover {
    background: color-mix(in srgb, var(--color-border) 18%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }
`

const DropdownBody = styled.div`
  padding: 0.25rem 1.1rem 1.1rem;

  > * + * {
    margin-top: var(--space-sm);
  }

  /* Tighter than the page's headings; none above the first block. */
  && h3,
  && h4 {
    margin-top: var(--space-lg);
  }

  && > :first-child {
    margin-top: 0.5rem;
  }
`

const EmbedFigure = styled.figure`
  margin: var(--space-lg) 0;
  min-width: 0;

  ${({ $compact }) =>
    $compact &&
    css`
      margin: 0;
    `}
`

const EmbedHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  margin-bottom: var(--space-sm);

  /* Compact cards stack the badge over the title so the grid lines up. */
  ${({ $compact }) =>
    $compact &&
    css`
      flex-direction: column;
      align-items: flex-start;
    `}
`

const Badge = styled.span`
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--color-text);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const EmbedTitle = styled.span`
  color: var(--color-text);
  font-weight: 700;
`

const OpenLink = styled.a`
  margin-left: auto;
  font-size: 0.875rem;
  font-weight: 600;
`

const frameBox = css`
  display: block;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #f3f3f0;
`

const PdfFrame = styled.iframe`
  ${frameBox}
  height: ${({ $compact }) => ($compact ? "22rem" : "min(80vh, 56rem)")};
`

const VideoFrame = styled.iframe`
  ${frameBox}
  aspect-ratio: 16 / 9;
  height: auto;
`

const Pending = styled.div`
  ${frameBox}
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${({ $compact }) => ($compact ? "14rem" : "22rem")};
  border-style: dashed;
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 600;

  ${({ $video }) =>
    $video &&
    css`
      height: auto;
      aspect-ratio: 16 / 9;
    `}
`

/** Title page standing in for a PDF; the primary one is larger. */
const CoverCard = styled.div`
  position: relative;
  width: 100%;
  max-width: ${({ $compact }) => ($compact ? "none" : "26rem")};
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(20, 30, 40, 0.12);
`

const CoverImg = styled.img`
  && {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 1414 / 2000;
    object-fit: cover;
    border-radius: 0;
  }
`

const CoverTag = styled.span`
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: rgba(15, 25, 35, 0.72);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: var(--space-md);
  margin: var(--space-lg) 0;
`

const PhotoRow = styled.div`
  --row-h: ${({ $small }) => ($small ? "9rem" : "13rem")};
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: var(--space-md) 0;

  /* Keeps the last row from stretching a lone photo across the width. */
  &::after {
    content: "";
    flex-grow: 999;
  }
`

const PhotoLink = styled.a`
  && {
    display: block;
    flex-shrink: 1;
    min-width: 0;
    max-height: calc(var(--row-h) * 1.6);
    overflow: hidden;
    border: 0;
    border-radius: 8px;
    background: #ecebe6;
  }

  &&:hover {
    background: #ecebe6;
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const PhotoImg = styled.img`
  && {
    display: block;
    width: 100%;
    height: 100%;
    min-height: var(--row-h);
    object-fit: cover;
    border-radius: 0;
    transition: transform 0.25s ease;
  }

  ${PhotoLink}:hover && {
    transform: scale(1.03);
  }

  @media (prefers-reduced-motion: reduce) {
    && {
      transition: none;
    }
  }
`
