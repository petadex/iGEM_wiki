import fs from "fs/promises"
import path from "path"
import sharp from "sharp"
import { deflateRawSync } from "node:zlib"
import { transformSync } from "esbuild"

const root = process.cwd()
const publicRoot = path.join(root, "public")

// Legacy static assets still kept in the repository for authoring. Only omit
// these known candidates when no generated HTML, CSS, JS or JSON references them.
const legacyAssets = [
  "hardware-notebook/requirements/image1.png",
  "hardware-notebook/requirements/image2.png",
  "hardware-notebook/requirements/image3.png",
  "wiki-mockup/wiki-front-front.png",
  "wiki-mockup/wiki-front-back.jpg",
  "wiki-mockup/wiki-front-logo.png",
  "wiki-mockup/wiki-front-bottle.png",
  "wiki-mockup/wiki-front-pop-up.png",
  "payload-media/campus.jpeg",
  "images/petadex-petase.png",
  "homepage/world-map-reference.png",
  // Only used by the Dry Lab issue pages, which the iGEM build leaves out
  // until their images move to static.igem.wiki.
  "figures/dry-lab-issue-107/petadex-sequence-density.svg",
  "figures/dry-lab-issue-107/logan-biosample-distribution.svg",
  "figures/dry-lab-issue-107/petase-density-normalized.svg",
]

const removeGlobs = [
  [publicRoot, (file) => file.endsWith(".map")],
  [path.join(publicRoot, "~partytown", "debug"), () => true],
]

const imageJobs = [
  {
    file: "hardware-notebook/requirements/image3.png",
    format: "png",
    options: { compressionLevel: 9, palette: true, quality: 72 },
  },
  {
    file: "wiki-mockup/wiki-front-front.png",
    format: "png",
    options: { compressionLevel: 9, palette: true, quality: 72 },
  },
  {
    file: "wiki-mockup/wiki-front-back.jpg",
    format: "jpeg",
    options: { quality: 72, progressive: true, mozjpeg: true },
  },
]

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function walk(dir, visitor) {
  if (!(await exists(dir))) return
  const entries = await fs.readdir(dir, { withFileTypes: true })
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(entryPath, visitor)
        return
      }
      await visitor(entryPath)
    })
  )
}

async function artifactSize() {
  let bytes = 0
  let files = 0
  await walk(publicRoot, async (filePath) => {
    const stat = await fs.stat(filePath)
    bytes += stat.size
    files += 1
  })
  return { bytes, files }
}

const beforeArtifact = await artifactSize()

for (const [dir, shouldRemove] of removeGlobs) {
  await walk(dir, async (filePath) => {
    if (shouldRemove(filePath)) {
      await fs.rm(filePath, { force: true })
    }
  })
}

await fs.rm(path.join(publicRoot, "webpack.stats.json"), { force: true })

const referencedAssets = new Set()
await walk(publicRoot, async (filePath) => {
  if (!/\.(html|css|js|json|txt|xml|svg)$/.test(filePath)) return
  const content = await fs.readFile(filePath, "utf8")
  for (const asset of legacyAssets) {
    // Checking the basename also catches prefixed, absolute and escaped URLs.
    if (content.includes(path.basename(asset))) referencedAssets.add(asset)
  }
})
for (const asset of legacyAssets) {
  const filePath = path.join(publicRoot, asset)
  if (referencedAssets.has(asset) || !(await exists(filePath))) continue
  await fs.rm(filePath)
  console.log(`Omitted unused deployment asset: ${asset}`)
}

for (const job of imageJobs) {
  const filePath = path.join(publicRoot, job.file)
  if (!(await exists(filePath))) continue

  const tempPath = `${filePath}.tmp`
  const pipeline = sharp(filePath)

  if (job.format === "png") {
    await pipeline.png(job.options).toFile(tempPath)
  } else {
    await pipeline.jpeg(job.options).toFile(tempPath)
  }

  const [before, after] = await Promise.all([fs.stat(filePath), fs.stat(tempPath)])
  if (after.size < before.size) {
    await fs.rename(tempPath, filePath)
  } else {
    await fs.rm(tempPath, { force: true })
  }
}

// Preserve SVG geometry and labels; losslessly recompress embedded PNG pixels.
await walk(publicRoot, async (filePath) => {
  if (!filePath.endsWith(".svg")) return
  const original = await fs.readFile(filePath, "utf8")
  let optimized = original
  for (const match of original.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)) {
    const png = Buffer.from(match[1], "base64")
    const webp = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer()
    const replacement = `data:image/webp;base64,${webp.toString("base64")}`
    if (replacement.length < match[0].length) {
      optimized = optimized.replace(match[0], replacement)
    }
  }
  if (optimized !== original) await fs.writeFile(filePath, optimized)
})

// These standalone figures bypass Gatsby's webpack JavaScript minifier.
// Keep top-level names intact: separate scripts and HTML handlers may use them.
for (const relativePath of [
  "figures/dry-lab-landscape/landscape.html",
  "figures/petadex-game/petadex-game.html",
  "figures/dry-lab-model/pipeline-animation.html",
]) {
  const filePath = path.join(publicRoot, relativePath)
  if (!(await exists(filePath))) continue
  const original = await fs.readFile(filePath, "utf8")
  const optimized = original.replace(
    /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,
    (whole, opening, code, closing) => {
      const type = opening.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]
      if (!code.trim() || (type && !["module", "text/javascript", "application/javascript"].includes(type))) return whole
      const { code: minified } = transformSync(code, {
        minifyWhitespace: true,
        minifySyntax: true,
        target: "es2017",
        legalComments: "inline",
      })
      return opening + minified.replace(/<\/script/gi, "<\\/script") + closing
    },
  )
  if (deflateRawSync(optimized, { level: 9 }).length < deflateRawSync(original, { level: 9 }).length) {
    await fs.writeFile(filePath, optimized)
  }
}

const afterArtifact = await artifactSize()
const mib = (bytes) => (bytes / 1024 ** 2).toFixed(2)
console.log(
  `Pages artifact: ${beforeArtifact.files} files / ${mib(beforeArtifact.bytes)} MiB -> ` +
  `${afterArtifact.files} files / ${mib(afterArtifact.bytes)} MiB (uncompressed)`
)

// Estimate a level-9 ZIP including per-file headers. The runner's archive
// implementation may differ slightly; this exposes upload size in CI logs.
let estimatedZipBytes = 22
await walk(publicRoot, async (filePath) => {
  const content = await fs.readFile(filePath)
  const name = path.relative(root, filePath).split(path.sep).join("/")
  estimatedZipBytes += deflateRawSync(content, { level: 9 }).length +
    76 + 2 * Buffer.byteLength(name)
})
console.log(`Estimated compressed Pages archive: ${mib(estimatedZipBytes)} MiB (${estimatedZipBytes.toLocaleString("en-US")} bytes)`)

// iGEM's upload limit is 5 MB. Leave 500 kB for the runner's ZIP metadata,
// directory entries and differences from Node's compression implementation.
const uploadLimitBytes = 5_000_000
const safetyMarginBytes = 500_000
const archiveBudgetBytes = uploadLimitBytes - safetyMarginBytes
if (estimatedZipBytes > archiveBudgetBytes) {
  console.error(
    `Pages artifact is too large by ${(estimatedZipBytes - archiveBudgetBytes).toLocaleString("en-US")} bytes: estimated ${(estimatedZipBytes / 1_000_000).toFixed(3)} MB ` +
    `exceeds the ${(archiveBudgetBytes / 1_000_000).toFixed(2)} MB safety budget ` +
    `for iGEM's 5 MB upload limit. ` +
    `Move large images, PDFs or datasets to the iGEM CDN and reference their URLs, ` +
    `or reduce the generated output before deploying.`
  )
  process.exitCode = 1
} else {
  console.log("Pages artifact size check passed (4.50 MB safety budget; 5 MB upload limit).")
}
