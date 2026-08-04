/**
 * Rewrites relative image references left behind by `jupyter nbconvert --to markdown`
 * (e.g. `![](260324_issue_files/image-2.png)`) into paths Gatsby can actually serve.
 *
 * Gatsby only publishes files under `static/`, not `src/content/wiki/`, so nbconvert's
 * sibling `*_files/` image folders 404 once dropped straight into a wiki page.
 *
 * For each MDX file, this copies any locally-referenced images into
 * `static/images/<same-relative-path-as-the-page>/` and rewrites the markdown to point
 * at `/images/<...>/<filename>`. Safe to re-run: already-absolute references are skipped.
 *
 * Usage:
 *   node scripts/fix-notebook-images.mjs                        # scan all wiki MDX files
 *   node scripts/fix-notebook-images.mjs src/content/wiki/a.mdx  # scan specific file(s)
 *   node scripts/fix-notebook-images.mjs --delete-source         # also remove the *_files/ folders after copying
 */
import fs from "fs"
import path from "path"

const root = process.cwd()
const contentRoot = path.join(root, "src", "content", "wiki")
const staticImagesRoot = path.join(root, "static", "images")

const args = process.argv.slice(2)
const deleteSource = args.includes("--delete-source")
const targets = args.filter((arg) => !arg.startsWith("--"))

const IMAGE_RE = /!\[([^\]]*)\]\((?!\/|https?:\/\/|data:)([^)\s]+)\)/g

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/")
}

function walkMdx(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walkMdx(fullPath, files)
    else if (fullPath.endsWith(".mdx")) files.push(fullPath)
  }
  return files
}

const mdxFiles =
  targets.length > 0 ? targets.map((target) => path.resolve(root, target)) : walkMdx(contentRoot)

let totalCopied = 0
let totalRewrites = 0

for (const mdxPath of mdxFiles) {
  if (!fs.existsSync(mdxPath)) {
    console.warn(`Skipping missing file: ${relative(mdxPath)}`)
    continue
  }

  const mdxDir = path.dirname(mdxPath)
  const wikiRelDir = path.relative(contentRoot, mdxDir).split(path.sep).join("/")
  const destDir = path.join(staticImagesRoot, wikiRelDir)

  const source = fs.readFileSync(mdxPath, "utf8")
  const foldersToClean = new Set()
  let fileChanged = false

  const rewritten = source.replace(IMAGE_RE, (match, alt, relPath) => {
    const normalizedRelPath = relPath.replace(/\\/g, "/")
    const srcAbsPath = path.join(mdxDir, normalizedRelPath)

    if (!fs.existsSync(srcAbsPath)) {
      console.warn(`  ! ${relative(mdxPath)}: image not found on disk, leaving as-is: ${normalizedRelPath}`)
      return match
    }

    const filename = path.basename(normalizedRelPath)
    const destAbsPath = path.join(destDir, filename)

    fs.mkdirSync(destDir, { recursive: true })
    fs.copyFileSync(srcAbsPath, destAbsPath)
    totalCopied++

    const sourceSubdir = path.dirname(normalizedRelPath)
    if (sourceSubdir && sourceSubdir !== ".") {
      foldersToClean.add(path.join(mdxDir, sourceSubdir))
    }

    fileChanged = true
    totalRewrites++
    return `![${alt}](/images/${wikiRelDir}/${filename})`
  })

  if (!fileChanged) continue

  fs.writeFileSync(mdxPath, rewritten)
  console.log(`Updated ${relative(mdxPath)}`)

  if (deleteSource) {
    for (const folder of foldersToClean) {
      fs.rmSync(folder, { recursive: true, force: true })
      console.log(`  removed ${relative(folder)}`)
    }
  }
}

console.log(
  `\nDone. ${totalCopied} image(s) copied, ${totalRewrites} reference(s) rewritten across ${mdxFiles.length} file(s) scanned.`
)
