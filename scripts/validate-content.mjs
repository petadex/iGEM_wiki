import fs from "fs"
import path from "path"
import process from "process"
import { STANDARD_ROUTE_ALIASES } from "../src/data/standardRoutes.mjs"

const root = process.cwd()
const contentRoot = path.join(root, "src", "content", "wiki")
const pagesRoot = path.join(root, "src", "pages")
const navPath = path.join(root, "src", "components", "WikiTopBar.js")

const requiredFrontmatter = [
  "title",
  "section",
  "path",
  "navTitle",
  "order",
  "description",
  "owners",
  "updated",
  "status",
]

const allowedStatuses = new Set(["draft", "review", "published"])
const errors = []

function walk(dir, predicate, files = []) {
  if (!fs.existsSync(dir)) return files

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, predicate, files)
    } else if (predicate(fullPath)) {
      files.push(fullPath)
    }
  }

  return files
}

function stripQuotes(value) {
  return value.replace(/^["']|["']$/g, "")
}

function parseValue(rawValue) {
  const value = rawValue.trim()

  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim()
    if (!inner) return []
    return inner.split(",").map((item) => stripQuotes(item.trim())).filter(Boolean)
  }

  if (/^\d+$/.test(value)) return Number(value)

  return stripQuotes(value)
}

function parseFrontmatter(filePath) {
  const source = fs.readFileSync(filePath, "utf8")
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)

  if (!match) {
    errors.push(`${relative(filePath)} is missing frontmatter.`)
    return {}
  }

  const frontmatter = {}
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue

    const separator = line.indexOf(":")
    if (separator === -1) {
      errors.push(`${relative(filePath)} has invalid frontmatter line: ${line}`)
      continue
    }

    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1)
    frontmatter[key] = parseValue(value)
  }

  return frontmatter
}

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/")
}

function pageRouteFromFile(filePath) {
  const rel = relative(filePath)
    .replace(/^src\/pages\//, "")
    .replace(/\.(jsx?|tsx?)$/, "")

  if (rel === "index") return "/"
  if (rel.endsWith("/index")) return `/${rel.replace(/\/index$/, "")}/`
  return `/${rel}/`
}

function isPayloadExport(filePath) {
  return relative(filePath).split("/").includes("_payload-export")
}

function validateFrontmatter(filePath, frontmatter) {
  for (const key of requiredFrontmatter) {
    if (frontmatter[key] == null || frontmatter[key] === "") {
      errors.push(`${relative(filePath)} is missing frontmatter field "${key}".`)
    }
  }

  if (typeof frontmatter.path === "string") {
    if (!frontmatter.path.startsWith("/") || !frontmatter.path.endsWith("/")) {
      errors.push(`${relative(filePath)} path must start and end with "/".`)
    }
  }

  if (!Number.isInteger(frontmatter.order)) {
    errors.push(`${relative(filePath)} order must be an integer.`)
  }

  if (!Array.isArray(frontmatter.owners) || frontmatter.owners.length === 0) {
    errors.push(`${relative(filePath)} owners must be a non-empty array.`)
  }

  if (typeof frontmatter.updated !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.updated)) {
    errors.push(`${relative(filePath)} updated must use YYYY-MM-DD.`)
  }

  if (typeof frontmatter.status === "string" && !allowedStatuses.has(frontmatter.status)) {
    errors.push(`${relative(filePath)} status must be draft, review, or published.`)
  }
}

const mdxFiles = walk(
  contentRoot,
  (filePath) => filePath.endsWith(".mdx") && !path.basename(filePath).startsWith("_")
)

const mdxRoutes = new Map()
for (const filePath of mdxFiles) {
  const frontmatter = parseFrontmatter(filePath)
  validateFrontmatter(filePath, frontmatter)

  if (frontmatter.path) {
    const existing = mdxRoutes.get(frontmatter.path)

    if (existing) {
      const existingIsPayloadExport = isPayloadExport(existing.filePath)
      const currentIsPayloadExport = isPayloadExport(filePath)
      const preferredLocal = [existing, { filePath, frontmatter }].find(
        (candidate) =>
          !isPayloadExport(candidate.filePath) && candidate.frontmatter.preferLocal === true
      )

      if (preferredLocal) {
        mdxRoutes.set(frontmatter.path, preferredLocal)
        continue
      }

      if (existingIsPayloadExport && !currentIsPayloadExport) {
        continue
      }

      if (!existingIsPayloadExport && currentIsPayloadExport) {
        mdxRoutes.set(frontmatter.path, { filePath, frontmatter })
        continue
      }

      errors.push(
        `Duplicate MDX path "${frontmatter.path}" in ${relative(filePath)} and ${relative(
          existing.filePath
        )}.`
      )
    } else {
      mdxRoutes.set(frontmatter.path, { filePath, frontmatter })
    }
  }
}

const reactPageFiles = walk(
  pagesRoot,
  (filePath) => /\.(jsx?|tsx?)$/.test(filePath) && !path.basename(filePath).startsWith("_")
)

const reactRoutes = new Map(reactPageFiles.map((filePath) => [pageRouteFromFile(filePath), filePath]))
const standardRoutes = new Set(Object.keys(STANDARD_ROUTE_ALIASES))

for (const [aliasPath, sourcePath] of Object.entries(STANDARD_ROUTE_ALIASES)) {
  if (mdxRoutes.has(aliasPath) || reactRoutes.has(aliasPath)) {
    errors.push(`Standard iGEM path collides with an existing page: "${aliasPath}".`)
  }

  if (!mdxRoutes.has(sourcePath)) {
    errors.push(`Standard iGEM path "${aliasPath}" has no MDX source page at "${sourcePath}".`)
  }
}

for (const [route, mdxFile] of mdxRoutes) {
  if (reactRoutes.has(route)) {
    errors.push(
      `Route collision at "${route}" between ${relative(mdxFile)} and ${relative(reactRoutes.get(route))}.`
    )
  }
}

if (fs.existsSync(navPath)) {
  const navSource = fs.readFileSync(navPath, "utf8")
  const navRoutes = [...navSource.matchAll(/to:\s*["`]([^"`]+)["`]/g)].map((match) => match[1])

  for (const route of navRoutes) {
    if (!reactRoutes.has(route) && !mdxRoutes.has(route) && !standardRoutes.has(route)) {
      errors.push(`Navigation route "${route}" does not resolve to a React page or MDX page.`)
    }
  }
}

if (errors.length > 0) {
  console.error("Content validation failed:")
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Content validation passed for ${mdxFiles.length} MDX wiki pages.`)
