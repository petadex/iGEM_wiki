import React, { useEffect, useRef } from "react"
import styled, { css } from "styled-components"
import { HomeEcosystemMap } from "./HomeEcosystemMap.js"
import { ART_WIDTH_VAR } from "./artScale.js"
import { ExpandWindow } from "./mdx/ExpandWindow.js"

/**
 * The homepage's PAZy → PETadex → ecosystems map, as a figure on a wiki page.
 *
 * HomeEcosystemMap is an overlay: it paints no map of its own, positions
 * everything as a fraction of the homepage's WORLD_MAP band, and only moves
 * when something calls `update(p)` on its ref. This wrapper supplies the three
 * things the homepage otherwise provides.
 *
 *   1  The paint. The world map is rows 2644–2902 of the 563×4000 front
 *      canvas: 2644 is the band's top (latitude 85) and LOGAN_MAP_CAL's
 *      yh = 656/484 of the band reaches 258 rows down, to Tierra del Fuego.
 *      The window shows the painted map plus TOP_ROOM rows of cream above it,
 *      where the stage title sits, with the plate pulled up to match.
 *   2  The band. The overlay's percentages are fractions of the 190-row band,
 *      not of the window, so it sits in a box of that height at the map's
 *      top and its dots spill below (MapRoot is overflow: visible).
 *   3  The scroll tick. Here it is a one-shot autoplay, so the figure plays
 *      itself the first time it is scrolled into view.
 *
 * `grow` has it grow to fill the screen as the reader scrolls down to it, as
 * the Overview's figures do (ExpandWindow → ScrollExpand); grown or open in
 * its window, the map keeps its aspect and fits the frame.
 */

const FRONT_SRC =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/wiki-front-page-top-new.avif"

const ART_W = 563
/**
 * The painted world map's rows on that canvas; see LOGAN_MAP_CAL. The paint
 * runs to 2902, but a dot stops at latMin (-56), which lands on row 2858.4,
 * so the window ends just past it rather than carrying the forest canopy that
 * the paint fades into below.
 */
const MAP_TOP = 2644
const MAP_BOTTOM = 2860
/** The band HomeEcosystemMap measures against (WORLD_MAP_TOP/HEIGHT). */
const BAND_ROWS = 2834 - 2644

/**
 * Cream kept above the map for the stage title, which HomeEcosystemMap sets
 * 21% of the band above it (40 rows) and is about 32 rows tall at two lines.
 */
const TOP_ROOM = 56

const WIN_TOP = MAP_TOP - TOP_ROOM
const WIN_ROWS = MAP_BOTTOM - WIN_TOP
/** Margin-top percentages resolve against the container width, as needed here. */
const PLATE_PULL = (WIN_TOP / ART_W) * 100
const BAND_TOP = (TOP_ROOM / WIN_ROWS) * 100
const BAND_SHARE = (BAND_ROWS / WIN_ROWS) * 100

/** How long the four stages take to play out, once. */
const PLAY_MS = 9000

export const EcosystemMapFigure = ({ caption, grow = false, anchor }) => {
  const mapRef = useRef(null)
  const windowRef = useRef(null)
  const playedRef = useRef(false)

  // artPx() sizes (pins, labels, cards) are shares of --art-w, which the
  // homepage sets on its root. Here the figure is the art, so bind it to the
  // window's own width; without it they would key to the whole viewport.
  useEffect(() => {
    const el = windowRef.current
    if (!el) return
    const sync = () => {
      el.style.setProperty(ART_WIDTH_VAR, `${el.clientWidth}px`)
    }
    sync()
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", sync)
      return () => window.removeEventListener("resize", sync)
    }
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = windowRef.current
    if (!el) return

    const settle = () => mapRef.current?.update(1)
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    if (reduced?.matches) {
      settle()
      return
    }

    let frame = 0
    const play = () => {
      const started = performance.now()
      const tick = now => {
        const p = Math.min(1, (now - started) / PLAY_MS)
        mapRef.current?.update(p)
        if (p < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }

    if (typeof IntersectionObserver === "undefined") {
      settle()
      return
    }
    const io = new IntersectionObserver(
      entries => {
        if (!entries.some(e => e.isIntersecting) || playedRef.current) return
        playedRef.current = true
        io.disconnect()
        play()
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <Figure>
      <ExpandWindow title="From PAZy to PETadex" inlineTitle={false} ground="var(--color-bg)" grow={grow} anchor={anchor} minimizeOnLeave>
        {open => (
          <Fit $open={open}>
            <MapWindow ref={windowRef} $open={open}>
              <Plate $open={open} src={FRONT_SRC} alt="" aria-hidden="true" draggable="false" />
              <Band $open={open}>
                <HomeEcosystemMap ref={mapRef} />
              </Band>
            </MapWindow>
          </Fit>
        )}
      </ExpandWindow>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </Figure>
  )
}

const Figure = styled.figure`
  margin: var(--space-lg) 0;

  figcaption {
    margin-top: 0.6rem;
    font-size: 0.9rem;
    line-height: 1.45;
  }
`

/* Grown or in the window, the frame is the size query. The map takes the
   width it can without outgrowing the frame's height (--map-w), and the window
   runs the frame's full height, showing the canvas's paint above and below
   with the map and its title room centred in it (--map-y is the map's top,
   down from the window's). */
const MAP_RATIO = (ART_W / WIN_ROWS).toFixed(4)

const Fit = styled.div`
  ${({ $open }) =>
    $open &&
    css`
      flex: 1 1 auto;
      min-height: 0;
      container-type: size;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    `}
`

const MapWindow = styled.div`
  position: relative;
  aspect-ratio: ${ART_W} / ${WIN_ROWS};
  overflow: hidden;
  border-radius: 12px;

  ${({ $open }) =>
    $open &&
    css`
      --map-w: min(100cqw, 100cqh * ${MAP_RATIO});
      --map-y: calc((100cqh - var(--map-w) / ${MAP_RATIO}) / 2 + var(--map-w) * ${(TOP_ROOM / ART_W).toFixed(6)});
      flex: none;
      width: var(--map-w);
      height: 100cqh;
      aspect-ratio: auto;
    `}
`

const Plate = styled.img`
  display: block;
  width: 100%;
  max-width: none;
  margin-top: -${PLATE_PULL.toFixed(4)}%;
  pointer-events: none;
  user-select: none;

  ${({ $open }) =>
    $open &&
    css`
      margin-top: calc(var(--map-y) - var(--map-w) * ${(MAP_TOP / ART_W).toFixed(6)});
    `}
`

const Band = styled.div`
  position: absolute;
  top: ${BAND_TOP.toFixed(4)}%;
  left: 0;
  width: 100%;
  height: ${BAND_SHARE.toFixed(4)}%;

  ${({ $open }) =>
    $open &&
    css`
      top: var(--map-y);
      height: calc(var(--map-w) * ${(BAND_ROWS / ART_W).toFixed(6)});
    `}
`

export default EcosystemMapFigure
