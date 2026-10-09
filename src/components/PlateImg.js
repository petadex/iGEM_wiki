import React, { forwardRef } from "react"
import { PLATE_CROPS } from "../data/plateCrops.js"

const PLATE_BASE = "https://static.igem.wiki/teams/6187/wiki/homepage-components/"
const CROP_BASE = "https://static.igem.wiki/teams/6187/wiki/homepage-cropped/"

/** Props that belong on the drawn image rather than the plate-sized box. */
const IMG_PROPS = new Set([
  "alt",
  "crossOrigin",
  "decoding",
  "draggable",
  "fetchPriority",
  "loading",
  "onError",
  "onLoad",
  "referrerPolicy",
])

const pct = (part, whole) => `${(part / whole) * 100}%`

/**
 * The cropped copy of plate `src` as { src, size, box }, or null when it has
 * none (see plateCrops.js).
 */
export function plateCrop(src) {
  if (typeof src !== "string" || !src.startsWith(PLATE_BASE)) return null
  const path = src.slice(PLATE_BASE.length)
  const crop = PLATE_CROPS[path]
  return crop && { ...crop, src: CROP_BASE + path.replace(/\//g, "-") }
}

/**
 * Drop-in for an <img> of a big, mostly transparent plate. The element keeps
 * the plate's box, so its own styles, transforms and animations apply as
 * before, but it only loads and draws the painted crop, in place. Phones run
 * out of memory decoding every full plate. A plate without a crop renders as
 * a plain <img>.
 */
export const PlateImg = forwardRef(function PlateImg(
  { src, className, style, ...rest },
  ref,
) {
  const crop = plateCrop(src)
  if (!crop) {
    return <img ref={ref} src={src} className={className} style={style} {...rest} />
  }

  const imgProps = {}
  const boxProps = {}
  for (const [key, value] of Object.entries(rest)) {
    ;(IMG_PROPS.has(key) ? imgProps : boxProps)[key] = value
  }
  const [W, H] = crop.size
  const [x0, y0, x1, y1] = crop.box
  return (
    <span
      ref={ref}
      className={className ? `plate-img ${className}` : "plate-img"}
      style={{ aspectRatio: `${W} / ${H}`, "--plate-w": `${W}px`, ...style }}
      {...boxProps}
    >
      <img
        src={crop.src}
        {...imgProps}
        style={{
          position: "absolute",
          left: pct(x0, W),
          top: pct(y0, H),
          width: pct(x1 - x0, W),
          height: pct(y1 - y0, H),
          maxWidth: "none",
        }}
      />
    </span>
  )
})

/**
 * Plate `region` { x, y, w, h } drawn over `ctx`'s (0, 0, dw, dh), from the
 * plate's crop when it has one. Resolves once drawn.
 */
export async function drawPlateRegion(ctx, src, region, dw, dh) {
  const crop = plateCrop(src)
  const img = await new Promise((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = "anonymous"
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = crop ? crop.src : src
  })
  const [x0, y0, x1, y1] = crop
    ? crop.box
    : [0, 0, img.naturalWidth, img.naturalHeight]
  const sx = dw / region.w
  const sy = dh / region.h
  ctx.drawImage(
    img,
    (x0 - region.x) * sx,
    (y0 - region.y) * sy,
    (x1 - x0) * sx,
    (y1 - y0) * sy,
  )
}
