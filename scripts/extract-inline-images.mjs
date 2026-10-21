// Pull base64 images out of MDX into files, ready for static.igem.wiki.
//
//   node scripts/extract-inline-images.mjs [file.mdx ...]
//
// Notebook exports (the Dry Lab issue pages) embed every plot as a
// data:image/png;base64 URI, which puts megabytes of text into git on each
// edit. This writes each image to static/figures/dry-lab-issues/<issue>/,
// re-encoded as WebP, and points the MDX at that path. From there the usual
// CDN flow takes over: `node scripts/cdn-assets.mjs stage`, upload, `apply`,
// then delete the local copies it lists, all before committing.
//
// With no arguments it scans every MDX file under src/content/wiki/dry-lab/issue/.
// Files are named by content hash, so re-running it is harmless.
import fs from "fs/promises"
import path from "path"
import { createHash } from "crypto"
import sharp from "sharp"

const root = process.cwd()
const issueRoot = path.join(root, "src", "content", "wiki", "dry-lab", "issue")
const outRoot = path.join(root, "static", "figures", "dry-lab-issues")
const DATA_URI = /data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/=]+)/g

async function walk(dir, out = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, out)
    else if (entry.name.endsWith(".mdx")) out.push(full)
  }
  return out
}

// 260530_issue78_umap_control_analysis.mdx → 260530-issue78
function folderFor(file) {
  const parts = path.basename(file, ".mdx").toLowerCase().split(/[_\s]+/)
  const issue = parts.find((p) => /^issue[\da-z]+$/.test(p))
  return [parts[0], issue].filter(Boolean).join("-")
}

const files = process.argv.length > 2
  ? process.argv.slice(2).map((f) => path.resolve(f))
  : await walk(issueRoot)

let extracted = 0
let before = 0
let after = 0
for (const file of files) {
  const source = await fs.readFile(file, "utf8")
  const matches = [...source.matchAll(DATA_URI)]
  if (!matches.length) continue

  const folder = folderFor(file)
  await fs.mkdir(path.join(outRoot, folder), { recursive: true })
  const urls = new Map()
  for (const [uri, , data] of matches) {
    if (urls.has(uri)) continue
    const input = Buffer.from(data, "base64")
    const name = `${createHash("sha1").update(input).digest("hex").slice(0, 10)}.webp`
    const output = await sharp(input).webp({ quality: 90, effort: 6 }).toBuffer()
    await fs.writeFile(path.join(outRoot, folder, name), output)
    urls.set(uri, `/figures/dry-lab-issues/${folder}/${name}`)
    before += input.length
    after += output.length
  }

  let next = source
  for (const [uri, url] of urls) next = next.split(uri).join(url)
  await fs.writeFile(file, next)
  extracted += urls.size
  console.log(`${path.relative(root, file)}: ${urls.size} images → static/figures/dry-lab-issues/${folder}/`)
}

const mb = (n) => (n / 1e6).toFixed(2)
console.log(`Extracted ${extracted} images (${mb(before)} MB decoded → ${mb(after)} MB WebP).`)
