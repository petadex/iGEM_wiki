#!/usr/bin/env node
/**
 * Builds src/data/worldOutline.json: a coarse land outline for the small maps
 * in the record card demo, as one SVG path in equirectangular degrees
 * (x = longitude, y = -latitude), so a component can place a pin on it with
 * no projection maths and no mapping library.
 *
 *   node scripts/build-world-outline.mjs
 *
 * The source is Natural Earth's 110m land layer, via the world-atlas package
 * on a CDN. It is fetched once, here, and the result is committed; the wiki
 * never requests it. Rings smaller than MIN_AREA square degrees (small
 * islands) are dropped and the rest are simplified to the nearest TENTHS of a
 * degree, which is far finer than the maps are drawn.
 */
import { writeFile } from "node:fs/promises"

const SRC = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json"
const MIN_AREA = 6
const OUT = new URL("../src/data/worldOutline.json", import.meta.url)

const topo = await fetch(SRC, { signal: AbortSignal.timeout(60000) }).then((r) => r.json())
const { scale, translate } = topo.transform
const land = topo.objects.land

/** TopoJSON arcs are delta-encoded; decode to absolute [lon, lat]. */
const arcs = topo.arcs.map((arc) => {
  let x = 0
  let y = 0
  return arc.map(([dx, dy]) => {
    x += dx
    y += dy
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]]
  })
})

const ring = (indices) =>
  indices.flatMap((i, k) => {
    const points = i < 0 ? [...arcs[~i]].reverse() : arcs[i]
    return k === 0 ? points : points.slice(1)
  })

/** Twice the signed area, for dropping specks. */
const area2 = (points) => {
  let a = 0
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    a += points[j][0] * points[i][1] - points[i][0] * points[j][1]
  }
  return Math.abs(a / 2)
}

const polygons = land.geometries.flatMap((g) =>
  g.type === "MultiPolygon" ? g.arcs : [g.arcs]
)

const parts = []
for (const poly of polygons) {
  for (const indices of poly) {
    const points = ring(indices)
    if (area2(points) < MIN_AREA) continue
    // A ring that crosses the antimeridian comes back as one huge jump in
    // longitude, which would draw a line straight across the map; break the
    // path there instead.
    let d = ""
    let previous = null
    for (const [lon, lat] of points) {
      const jumped = previous !== null && Math.abs(lon - previous) > 180
      d += `${d && !jumped ? "L" : "M"}${lon.toFixed(1)} ${(-lat).toFixed(1)}`
      previous = lon
    }
    parts.push(`${d}Z`)
  }
}

const data = {
  source: SRC,
  note: "equirectangular degrees: x = longitude -180..180, y = -latitude -90..90",
  viewBox: "-180 -90 360 180",
  path: parts.join(""),
}

await writeFile(OUT, `${JSON.stringify(data)}\n`)
console.log(`wrote ${OUT.pathname}: ${parts.length} rings, ${data.path.length} chars`)
