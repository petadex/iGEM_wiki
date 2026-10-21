// Move the figures still served from static/ onto static.igem.wiki.
//
//   node scripts/cdn-assets.mjs stage   copy each file to tmp/cdn-upload/<cdn path>,
//                                       ready to upload folder by folder at
//                                       tools.igem.org/uploads
//   node scripts/cdn-assets.mjs apply   for every CDN URL that now answers 200,
//                                       swap the local path for it across src/
//
// apply never touches a reference whose upload is missing, so it is safe to run
// after a partial upload and again later. Uploads are named in lowercase kebab
// case up front, matching the rest of the CDN, so the URL is known in advance.
// The CDN caches for 24 h: re-upload a changed file under a new name (-v2).
//
// The landscape figure's assets and the record card's .pdb files are staged
// by their own scripts (sync-landscape-figure.mjs, build-record-card-demo.mjs).
//
// Everything in static/figures/dry-lab-issues/ (written there by
// extract-inline-images.mjs) is included automatically.
import fs from "fs/promises"
import path from "path"

const root = process.cwd()
const CDN = "https://static.igem.wiki/teams/6187/wiki"
const stageRoot = path.join(root, "tmp", "cdn-upload")

// static/<local> → <CDN>/<cdn>
const assets = [
  ["figures/dry-lab-model/dataset-flowchart-centred.avif", "drylab-page/figures/dataset-flowchart-centred.avif"],
  ["figures/dry-lab-model/cluster_plot.avif", "drylab-page/figures/cluster-plot.avif"],
  ["figures/dry-lab-model/Domain640.avif", "drylab-page/figures/domain640.avif"],
  ["figures/dry-lab-model/domain_distribution.avif", "drylab-page/figures/domain-distribution.avif"],
  ["figures/dry-lab-model/component_distribution.avif", "drylab-page/figures/component-distribution.avif"],
  ["figures/dry-lab-model/real_vs_controls_stacked.avif", "drylab-page/figures/real-vs-controls-stacked.avif"],
  ["figures/dry-lab-model/PETadex_workflow_overview.svg", "drylab-page/figures/petadex-workflow-overview.svg"],
  ["figures/dry-lab-model/TED_workflow_styled.svg", "drylab-page/figures/ted-workflow-styled.svg"],
  ["figures/dry-lab-model/biosample-metadata-profiles.svg", "drylab-page/figures/biosample-metadata-profiles.svg"],
  ["figures/dry-lab-model/The spread of plastic degrading enzyme literature enzyme literature over time.svg", "drylab-page/figures/plastic-enzyme-literature-over-time.svg"],
  ["figures/diamond-search/diamond-search-architecture.svg", "drylab-page/figures/diamond-search-architecture.svg"],
  ["figures/diamond-search/diamond-search-architecture-simple.svg", "drylab-page/figures/diamond-search-architecture-simple.svg"],
  ["figures/diamond-search/diamond-search-temporal.svg", "drylab-page/figures/diamond-search-temporal.svg"],
  ["figures/dry-lab-overview/game-title.avif", "drylab-page/figures/game-title.avif"],
  ["figures/dry-lab-overview/landscape-spin-poster.avif", "drylab-page/figures/landscape-spin-poster.avif"],
  // Biosample viewer photos. landscape.html loads the first five from here too.
  ["figures/dry-lab-landscape/sites/arctic.avif", "drylab-page/sites/arctic.avif"],
  ["figures/dry-lab-landscape/sites/yellowstone.avif", "drylab-page/sites/yellowstone.avif"],
  ["figures/dry-lab-landscape/sites/alps.avif", "drylab-page/sites/alps.avif"],
  ["figures/dry-lab-landscape/sites/wastewater.avif", "drylab-page/sites/wastewater.avif"],
  ["figures/dry-lab-landscape/sites/antarctica.avif", "drylab-page/sites/antarctica.avif"],
  ["figures/home-ecosystems/lake-chapala.avif", "drylab-page/sites/lake-chapala.avif"],
  ["figures/home-ecosystems/red-sea-brine-pool.avif", "drylab-page/sites/red-sea-brine-pool.avif"],
  ["figures/home-ecosystems/lake-baikal.avif", "drylab-page/sites/lake-baikal.avif"],
  ["figures/home-ecosystems/tropical-peat-swamp.avif", "drylab-page/sites/tropical-peat-swamp.avif"],
  ["figures/home-ecosystems/hot-springs.avif", "drylab-page/sites/hot-springs.avif"],
  // Dry Lab issue pages
  ["figures/dry-lab-issue-107/petadex-sequence-density.svg", "drylab-page/drylab-issues/260818-issue107-petadex-sequence-density.svg"],
  ["figures/dry-lab-issue-107/logan-biosample-distribution.svg", "drylab-page/drylab-issues/260818-issue107-logan-biosample-distribution.svg"],
  ["figures/dry-lab-issue-107/petase-density-normalized.svg", "drylab-page/drylab-issues/260818-issue107-petase-density-normalized.svg"],
]

async function listFiles(dir, out = []) {
  if (!(await exists(dir))) return out
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await listFiles(full, out)
    else if (!entry.name.startsWith(".")) out.push(full)
  }
  return out
}

for (const file of await listFiles(path.join(root, "static", "figures", "dry-lab-issues"))) {
  const local = path.relative(path.join(root, "static"), file).split(path.sep).join("/")
  // One flat CDN folder: figures/dry-lab-issues/<issue>/<file> → drylab-page/drylab-issues/<issue>-<file>
  assets.push([local, local.replace(/^figures\/dry-lab-issues\/([^/]+)\//, "drylab-page/drylab-issues/$1-")])
}

async function walk(dir, out = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, out)
    else if (/\.(js|mjs|mdx|json)$/.test(entry.name)) out.push(full)
  }
  return out
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function isLive(url) {
  const res = await fetch(url, { method: "HEAD" })
  return res.status === 200
}

async function stage() {
  // Only stage what still has a local copy and is not on the CDN yet.
  const pending = []
  for (const asset of assets) {
    if (!(await exists(path.join(root, "static", asset[0])))) continue
    if (await isLive(`${CDN}/${asset[1]}`)) continue
    pending.push(asset)
  }
  await fs.rm(stageRoot, { recursive: true, force: true })
  for (const [local, cdn] of pending) {
    const dest = path.join(stageRoot, cdn)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.copyFile(path.join(root, "static", local), dest)
  }
  const folders = [...new Set(pending.map(([, cdn]) => path.dirname(cdn)))]
  console.log(`Staged ${pending.length} files in ${path.relative(root, stageRoot)}/`)
  for (const folder of folders) {
    const count = pending.filter(([, cdn]) => path.dirname(cdn) === folder).length
    console.log(`  ${folder}/  (${count} files) → upload into ${folder}/`)
  }
}

async function apply() {
  const files = await walk(path.join(root, "src"))
  const sources = new Map()
  for (const file of files) sources.set(file, await fs.readFile(file, "utf8"))

  const missing = []
  let swapped = 0
  for (const [local, cdn] of assets) {
    const url = `${CDN}/${cdn}`
    if (!(await isLive(url))) {
      missing.push(url)
      continue
    }
    // Quoted (src="...") and Markdown image (![alt](...)) references.
    for (const [open, close] of [['"', '"'], ["(", ")"]]) {
      for (const [file, text] of sources) {
        const next = text.split(`${open}/${local}${close}`).join(`${open}${url}${close}`)
        if (next !== text) {
          sources.set(file, next)
          swapped += text.split(`${open}/${local}${close}`).length - 1
        }
      }
    }
  }

  for (const file of files) {
    const text = sources.get(file)
    if (text !== (await fs.readFile(file, "utf8"))) {
      await fs.writeFile(file, text)
      console.log(`updated ${path.relative(root, file)}`)
    }
  }
  console.log(`Swapped ${swapped} references.`)
  if (missing.length) {
    console.log(`\nNot on the CDN yet (references left local):`)
    for (const url of missing) console.log(`  ${url}`)
  }

  // Local copies nothing in src/ points at any more can be deleted.
  const all = [...sources.values()].join("\n")
  const orphans = []
  for (const [local] of assets) {
    if (all.includes(`/${local}`) || local.startsWith("figures/dry-lab-landscape/")) continue
    if (await exists(path.join(root, "static", local))) orphans.push(local)
  }
  if (orphans.length) {
    console.log(`\nNo longer referenced, safe to delete:`)
    for (const local of orphans) console.log(`  static/${local}`)
  }
}

const command = process.argv[2]
if (command === "stage") await stage()
else if (command === "apply") await apply()
else {
  console.error("usage: node scripts/cdn-assets.mjs <stage|apply>")
  process.exit(1)
}
