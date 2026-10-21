import React, { useEffect, useRef, useState } from "react"
import { withPrefix } from "gatsby"
import styled, { css, keyframes } from "styled-components"
import { ExpandWindow } from "./ExpandWindow.js"

/**
 * Dropdowns and file embeds for MDX pages. Every embed shows a "coming soon"
 * box until it's given a `src`, so a page's layout can go in before its files.
 *
 * iGEM rule: files must live on iGEM's servers. PDFs go on static.igem.wiki
 * and videos on video.igem.org (PeerTube; it streams HLS only, so a raw
 * <video src> cannot play from it); Google Docs/Sheets/Slides and YouTube
 * links can't be embedded.
 */

/** Click to open/close; built on <details>, so it works without JS too. */
export const Dropdown = ({ title, open = false, spotlight = false, children }) => (
  <DropdownBox open={open}>
    <DropdownSummary>{spotlight ? <SpotlightTitle>{title}</SpotlightTitle> : title}</DropdownSummary>
    <DropdownBody>{children}</DropdownBody>
  </DropdownBox>
)

/**
 * Same sweep as the homepage figures (`discoveryShimmer` in
 * HomeScrollPrototype): a bright band travels through a purple word.
 */
const conferenceFlash = keyframes`
  from { background-position: 200% center; }
  to { background-position: -200% center; }
`

/** Purple, not the page's body colour, so a mention stays readable. */
const CONFERENCE_FLASH = "#553273"

const ConferenceFlashText = styled.span`
  color: ${CONFERENCE_FLASH};
  font-weight: inherit;

  @supports (background-clip: text) or (-webkit-background-clip: text) {
    background-image: linear-gradient(
      110deg,
      #553273 20%,
      #80502a 40%,
      #ffe694 50%,
      #80502a 60%,
      #553273 80%
    );
    background-size: 250% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    animation: ${conferenceFlash} 5s linear infinite;
    filter: drop-shadow(0 1px 1px #fff7d9);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: none;
    color: ${CONFERENCE_FLASH};
    -webkit-text-fill-color: ${CONFERENCE_FLASH};
    filter: none;
  }
`

/** Inline name of the flagship event. The colour flashes; the words do not change. */
export const ConferenceFlash = ({ children }) => (
  <ConferenceFlashText>{children}</ConferenceFlashText>
)

const CONFERENCE_MENTION = /(Microplastics Conference|Microplastic Conference)/g

/** Wrap those names inside a string, leaving the rest of the sentence as it is. */
export function flashConferenceMentions(text) {
  if (typeof text !== "string" || !text.includes("Microplastic")) return text
  const parts = text.split(CONFERENCE_MENTION)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    part === "Microplastics Conference" || part === "Microplastic Conference" ? (
      <ConferenceFlash key={i}>{part}</ConferenceFlash>
    ) : (
      part
    )
  )
}

/**
 * PDF in a scrollable frame; `badge` labels it (e.g. "Primary vertical").
 * Until the PDF exists, `cover` (its title page, AVIF) stands in for it in
 * the same frame.
 */
export const PdfEmbed = ({ src, title, badge, cover }) => (
  <EmbedFigure>
    <EmbedHead>
      {badge && <Badge>{badge}</Badge>}
      {title && <EmbedTitle>{title}</EmbedTitle>}
      {src && (
        <OpenLink href={src} target="_blank" rel="noopener noreferrer">
          Open PDF ↗
        </OpenLink>
      )}
    </EmbedHead>
    {src ? (
      <PdfFrame src={src} title={title || "PDF"} />
    ) : cover ? (
      <CoverFrame>
        <CoverImg
          src={cover}
          alt={`${title || "Report"} cover page`}
          loading="lazy"
          decoding="async"
        />
        <CoverTag>Full report coming soon</CoverTag>
      </CoverFrame>
    ) : (
      <Pending>PDF coming soon</Pending>
    )}
  </EmbedFigure>
)

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

/** 16:9 video from video.igem.org, as its PeerTube embed URL. */
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

/**
 * A self-contained HTML figure from static/ (e.g. a three.js scene) in a 16:9
 * frame that opens into a large in-page window. `dark` matches the frame to a
 * figure that draws on a dark ground, so the page doesn't flash light around it
 * while the iframe loads.
 *
 * The frame renders the figure at `logical` size and scales the result to fit,
 * rather than handing it the box's own dimensions. These figures size their type
 * off the viewport but lay out their chrome — step lists, view tabs, callouts —
 * in fixed pixels, so at a prose-width box the chrome keeps its pixel size while
 * the art shrinks around it and the two collide. Scaling a design-size render
 * keeps that proportion fixed, whatever the column is. The window has the room
 * to render at its true size instead, which keeps the canvas and the type crisp.
 */
const LOGICAL = [1600, 900]

export const InteractiveEmbed = ({ src, title, caption, dark = false, logical = LOGICAL, grow = false, hint }) => {
  const href = src.startsWith("/") ? withPrefix(src) : src
  const frameRef = useRef(null)

  return (
    <EmbedFigure>
      <ExpandWindow title={title} dark={dark} focusRef={frameRef} grow={grow} hint={hint}>
        {open => (
          <ScaledFigure
            href={href}
            /* A figure that carries its label in the caption still has to name
               itself to a screen reader. */
            title={title || caption || "Interactive figure"}
            dark={dark}
            logical={logical}
            open={open}
            frameRef={frameRef}
          />
        )}
      </ExpandWindow>
      {caption && <EmbedCaption>{caption}</EmbedCaption>}
    </EmbedFigure>
  )
}

const ScaledFigure = ({ href, title, dark, logical, open, frameRef }) => {
  const boxRef = useRef(null)
  const [logicalW, logicalH] = logical

  useEffect(() => {
    const box = boxRef.current
    const frame = frameRef.current
    if (!box || !frame) return undefined

    const layout = () => {
      const { clientWidth: w, clientHeight: h } = box
      if (open) {
        Object.assign(frame.style, { width: `${w}px`, height: `${h}px`, transform: "none" })
      } else {
        Object.assign(frame.style, {
          width: `${logicalW}px`,
          height: `${logicalH}px`,
          transform: `scale(${w / logicalW})`,
        })
      }
    }

    layout()
    const observer = new ResizeObserver(layout)
    observer.observe(box)
    return () => observer.disconnect()
  }, [logicalW, logicalH, open, frameRef])

  return (
    <FrameBox ref={boxRef} $dark={dark} $open={open} $aspect={`${logicalW} / ${logicalH}`}>
      <ScaledFrame ref={frameRef} src={href} title={title} loading="lazy" />
    </FrameBox>
  )
}

export const embedComponents = {
  Dropdown,
  ConferenceFlash,
  Photos,
  InteractiveEmbed,
  PdfEmbed,
  SheetEmbed,
  VideoEmbed,
}

const spotlightShimmer = keyframes`
  from { background-position: 200% center; }
  to { background-position: -200% center; }
`

const SpotlightTitle = styled.span`
  display: block;
  font-size: clamp(1.35rem, 2.5vw, 2rem);
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: break-word;
  color: #553273;

  @supports (background-clip: text) or (-webkit-background-clip: text) {
    background: linear-gradient(110deg, #553273 20%, #80502a 40%, #ffe694 50%, #80502a 60%, #553273 80%);
    background-size: 250% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    animation: ${spotlightShimmer} 5s linear infinite;
    filter: drop-shadow(0 1px 1px #fff7d9);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background-position: 0 center;
  }
`

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
`

const EmbedHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  margin-bottom: var(--space-sm);
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

const FRAME_H = "min(80vh, 56rem)"

const PdfFrame = styled.iframe`
  ${frameBox}
  height: ${FRAME_H};
`

const VideoFrame = styled.iframe`
  ${frameBox}
  aspect-ratio: 16 / 9;
  height: auto;
`

const FrameBox = styled.div`
  position: relative;
  width: 100%;
  /* The scaled frame fills this box exactly, so the box carries the aspect and
     nothing forces it taller -- a min-height would letterbox the figure in dark
     dead space on a narrow column. The aspect follows the logical size, so a square
     figure gets a square box (16 / 9 by default). */
  aspect-ratio: ${({ $aspect }) => $aspect};
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: ${({ $dark }) => ($dark ? "#0b1220" : "#f8fafc")};

  ${({ $dark }) =>
    $dark &&
    css`
      border-color: #0b1220;
    `}

  /* In the window the box fills whatever the window leaves below its bar. */
  ${({ $open }) =>
    $open &&
    css`
      flex: 1;
      aspect-ratio: auto;
      min-height: 0;
      border: 0;
      border-radius: 0 0 12px 12px;
    `}
`

/* Width, height and scale are set from JS, which knows the box's real size.
   Without JS these keep the frame usable at the box's own dimensions. */
const ScaledFrame = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
  transform-origin: top left;
`

const EmbedCaption = styled.figcaption`
  margin-top: var(--space-sm);
  color: var(--color-muted);
  font-size: 0.875rem;
  line-height: 1.5;
`

const Pending = styled.div`
  ${frameBox}
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22rem;
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

/** Title page standing in for a PDF, laid out like a viewer's first page. */
const CoverFrame = styled.div`
  ${frameBox}
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Page-shaped on narrow screens, as tall as a PDF frame on wide ones. */
  aspect-ratio: 1414 / 2000;
  min-height: 0;
  max-height: ${FRAME_H};
  padding: var(--space-md);
`

const CoverImg = styled.img`
  && {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
    box-shadow: 0 6px 18px rgba(20, 30, 40, 0.14);
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
