/**
 * Renders Payload wiki page content blocks to MDX using approved components from
 * `src/components/mdx/wikiComponents.js`.
 */

export function quote(value) {
  return JSON.stringify(String(value ?? ""))
}

export function renderBlock(block, { resolveFigureSrc, onError } = {}) {
  if (!block?.blockType) return ""

  switch (block.blockType) {
    case "richText":
      return typeof block.body === "string" ? block.body.trim() : ""
    case "callout":
      return renderCallout(block)
    case "figure":
      return renderFigure(block, { resolveFigureSrc, onError })
    case "imageGrid":
      return renderImageGrid(block, { resolveFigureSrc, onError })
    case "dataTable":
      return renderDataTable(block)
    case "markdown":
      return String(block.body || "").trim()
    default:
      onError?.(`Unknown block type "${block.blockType}".`)
      return ""
  }
}

export function renderPageBody(blocks, options = {}) {
  return (blocks || []).map((block) => renderBlock(block, options)).filter(Boolean).join("\n\n")
}

function renderCallout(block) {
  const titleAttr = block.title ? ` title=${quote(block.title)}` : ""
  const tone = block.tone || "note"
  return `<Callout${titleAttr} tone=${quote(tone)}>\n${String(block.body || "").trim()}\n</Callout>`
}

function renderFigure(block, options) {
  const src = options.resolveFigureSrc?.(block)
  if (!src) {
    options.onError?.("Figure block is missing Media or fallback src.")
    return ""
  }

  const alt = block.alt || ""
  const attrs = [`src=${quote(src)}`, `alt=${quote(alt)}`]
  if (block.caption) attrs.push(`caption=${quote(block.caption)}`)
  if (block.credit) attrs.push(`credit=${quote(block.credit)}`)

  return `<Figure\n  ${attrs.join("\n  ")}\n/>`
}

function renderImageGrid(block, options) {
  const figures = Array.isArray(block.figures) ? block.figures : []
  if (figures.length === 0) {
    options.onError?.("ImageGrid block has no figures.")
    return ""
  }

  const inner = figures
    .map((item) => renderFigure(item, options))
    .filter(Boolean)
    .join("\n  ")

  if (!inner) return ""

  return `<ImageGrid>\n  ${inner}\n</ImageGrid>`
}

function renderDataTable(block) {
  const table = String(block.tableMarkdown || "").trim()
  if (!table) return ""

  const captionAttr = block.caption ? ` caption=${quote(block.caption)}` : ""
  return `<DataTable${captionAttr}>\n\n${table}\n\n</DataTable>`
}
