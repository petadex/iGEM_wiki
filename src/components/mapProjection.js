/**
 * Lat/lng → position on the painted homepage world map, shared by the map
 * overlays (LoganMapOverlay, HomeEcosystemMap).
 */

/**
 * The paint is an equirectangular world, fitted against a reference land mask
 * (IoU 0.86; Mercator managed 0.63, Miller 0.74). Positions are fractions of
 * the WORLD_MAP band: longitude -180 sits at x0 and spans xw, latitude 85 sits
 * at y0 and 170° spans yh. yh > 1 because the paint runs below the band's
 * bottom edge, down to Tierra del Fuego. latMin / latMax are the painted
 * coasts; anything further toward a pole sits on that edge.
 * Check with `?mapCalibrate=1`, which draws a 30° graticule over the paint.
 */
export const LOGAN_MAP_CAL = {
  x0: -21 / 1434,
  xw: 1396 / 1434,
  y0: 2 / 484,
  yh: 656 / 484,
  latMax: 83,
  latMin: -56,
}

export const PIN_SRC =
  "https://static.igem.wiki/teams/6187/wiki/homepage-components/pin.avif"
/**
 * The CDN pin is a large padded frame; only this inner box is the marker.
 * Tip is the bottom-center of that box (anchor for lat/lng).
 */
export const PIN_FRAME = { w: 2238, h: 3132 }
export const PIN_CROP = { x: 968, y: 1260, w: 169, h: 353 }

/** Percent of the map box, or null for a latitude well past the paint. */
export function lngLatToPct(lng, lat, cal = LOGAN_MAP_CAL) {
  if (lat < cal.latMin - 8 || lat > cal.latMax + 8) return null
  return lngLatToPctClamped(lng, lat, cal)
}

/** lngLatToPct without the cutoff: anything past the paint sits on its edge. */
export function lngLatToPctClamped(lng, lat, cal = LOGAN_MAP_CAL) {
  const wrapped = ((((lng + 180) % 360) + 360) % 360) / 360
  const clampedLat = Math.max(cal.latMin, Math.min(cal.latMax, lat))
  return {
    left: (cal.x0 + wrapped * cal.xw) * 100,
    top: (cal.y0 + ((85 - clampedLat) / 170) * cal.yh) * 100,
  }
}

/** 30° graticule as polylines in map-box percent, for `?mapCalibrate=1`. */
export function graticule(cal = LOGAN_MAP_CAL) {
  const lines = []
  for (let lat = -60; lat <= 80; lat += 30) {
    lines.push([
      lngLatToPctClamped(-180, lat, cal),
      lngLatToPctClamped(179.99, lat, cal),
    ])
  }
  for (let lng = -180; lng < 180; lng += 30) {
    lines.push([
      lngLatToPctClamped(lng, cal.latMax, cal),
      lngLatToPctClamped(lng, cal.latMin, cal),
    ])
  }
  return lines
}
