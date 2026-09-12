/**
 * Refresh the homepage map snapshot from PETadex.
 *
 *   npm run export:logan-map
 *
 * Writes src/data/logan-map-locations.json. Does not run during Gatsby build.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dest = path.join(__dirname, "..", "src", "data", "logan-map-locations.json")
const apiUrl = (
  process.env.PETADEX_API_URL || "https://api.petadex.net/api"
).replace(/\/$/, "")
const endpoint = `${apiUrl}/gene-details/locations`

const response = await fetch(endpoint)
if (!response.ok) {
  console.error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`)
  process.exit(1)
}

const payload = await response.json()
const locations = (payload.locations || []).map(row => ({
  accession: row.accession,
  country: row.country || null,
  continent: row.continent || null,
  biome: row.biome || null,
  organism: row.organism || null,
  elevation: row.elevation == null ? null : Number(row.elevation),
  latitude: row.latitude == null ? null : Number(row.latitude),
  longitude: row.longitude == null ? null : Number(row.longitude),
  location_name: row.location_name || null,
}))

const countryCounts = {}
const continentCounts = {}
for (const loc of locations) {
  if (loc.country) {
    countryCounts[loc.country] = (countryCounts[loc.country] || 0) + 1
  }
  if (loc.continent) {
    continentCounts[loc.continent] = (continentCounts[loc.continent] || 0) + 1
  }
}

const statsIn = payload.stats || {}
const out = {
  source: "with_sra_and_biosample_loc_metadata",
  endpoint: "/api/gene-details/locations",
  exportedAt: new Date().toISOString().slice(0, 10),
  stats: {
    total_samples: Number(statsIn.total_samples ?? locations.length),
    total_countries: Number(statsIn.total_countries ?? Object.keys(countryCounts).length),
    total_continents: Number(
      statsIn.total_continents ?? Object.keys(continentCounts).length,
    ),
    total_biomes: Number(statsIn.total_biomes ?? 0),
    mapped_samples: locations.length,
    mapped_countries: Object.keys(countryCounts).length,
  },
  countryCounts,
  continentCounts,
  locations,
}

fs.writeFileSync(dest, `${JSON.stringify(out, null, 2)}\n`)
console.log(
  `Wrote ${path.relative(process.cwd(), dest)} (${locations.length} mapped samples, ${
    out.stats.mapped_countries
  } countries)`,
)
