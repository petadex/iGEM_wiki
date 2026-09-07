import fs from "fs"
import path from "path"
import rehypeCitation from "rehype-citation"

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

function findBibliography(file) {
  const sourcePath = file?.path || file?.history?.[0]
  if (!sourcePath) return null

  const pageDirectory = path.dirname(sourcePath)
  const configured = frontmatterBibliography(file)
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
      csl: "vancouver",
      linkCitations: true,
      ...options,
      ...bibliography,
    })

    return (await transform(tree, file)) || tree
  }
}
