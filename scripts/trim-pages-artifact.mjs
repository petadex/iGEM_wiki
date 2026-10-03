import fs from "fs/promises"
import path from "path"
import sharp from "sharp"

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

const afterArtifact = await artifactSize()
const mib = (bytes) => (bytes / 1024 ** 2).toFixed(2)
console.log(
  `Pages artifact: ${beforeArtifact.files} files / ${mib(beforeArtifact.bytes)} MiB -> ` +
  `${afterArtifact.files} files / ${mib(afterArtifact.bytes)} MiB (uncompressed)`
)
