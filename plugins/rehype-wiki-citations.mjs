import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import rehypeCitation from "rehype-citation"

const ieeeStylePath = fileURLToPath(new URL("./styles/ieee.csl", import.meta.url))

function frontmatterBibliography(file) {
  const sources = [
    file?.data?.matter,
    file?.data?.frontmatter,
    file?.data?.astro?.frontmatter,
  ]

  for (const source of sources) {
    if (source?.bibliography) return source.bibliography
  }

  return null
}

// gatsby-plugin-mdx compiles the body with its frontmatter already stripped,
// so file.data carries none; read the `bibliography:` line from disk instead.
function frontmatterBibliographyOnDisk(sourcePath) {
  if (!fs.existsSync(sourcePath)) return null

  const block = fs.readFileSync(sourcePath, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const line = block?.[1].match(/^bibliography:\s*(.+?)\s*$/m)
  return line ? line[1].replace(/^(["'])(.*)\1$/, "$2") : null
}

function findBibliography(file) {
  const sourcePath = file?.path || file?.history?.[0]
  if (!sourcePath) return null

  const pageDirectory = path.dirname(sourcePath)
  const configured =
    frontmatterBibliography(file) || frontmatterBibliographyOnDisk(sourcePath)
  if (configured) {
    return {
      bibliography: configured,
      path: pageDirectory,
    }
  }

  const conventionalPath = path.join(pageDirectory, "references.bib")
  if (!fs.existsSync(conventionalPath)) return null

  return {
    bibliography: "references.bib",
    path: pageDirectory,
  }
}

export default function rehypeWikiCitations(options = {}) {
  return async (tree, file) => {
    const bibliography = findBibliography(file)
    if (!bibliography) return tree

    const transform = rehypeCitation({
      csl: path.relative(bibliography.path, ieeeStylePath),
      linkCitations: true,
      ...options,
      ...bibliography,
    })

    return (await transform(tree, file)) || tree
  }
}
