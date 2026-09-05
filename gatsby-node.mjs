import path from "path"
import { STANDARD_ROUTE_ALIASES } from "./src/data/standardRoutes.mjs"

const wikiTemplate = path.resolve(`./src/templates/wiki-mdx.js`)

export async function createPages({ actions, graphql, reporter }) {
  const { createPage } = actions

  const result = await graphql(`
    query WikiMdxPages {
      allMdx(
        filter: {
          internal: { contentFilePath: { regex: "/src/content/wiki/" } }
          frontmatter: { path: { ne: null } }
        }
      ) {
        nodes {
          id
          frontmatter {
            path
            preferLocal
          }
          internal {
            contentFilePath
          }
        }
      }
    }
  `)

  if (result.errors) {
    reporter.panicOnBuild(`Unable to load MDX wiki pages`, result.errors)
    return
  }

  const selectedRoutes = new Map()
  const nodes = result.data.allMdx.nodes
    .filter((node) => !path.basename(node.internal.contentFilePath).startsWith(`_`))
    .sort((a, b) => Number(isPayloadExport(b)) - Number(isPayloadExport(a)))

  for (const node of nodes) {
    const pagePath = node.frontmatter.path
    const existing = selectedRoutes.get(pagePath)

    if (existing) {
      const preferredLocal = [existing, node].find(
        (candidate) => !isPayloadExport(candidate) && candidate.frontmatter.preferLocal === true
      )

      if (preferredLocal) {
        selectedRoutes.set(pagePath, preferredLocal)
        continue
      }

      if (isPayloadExport(existing) && !isPayloadExport(node)) {
        continue
      }

      if (!isPayloadExport(existing) && isPayloadExport(node)) {
        selectedRoutes.set(pagePath, node)
        continue
      }

      reporter.panicOnBuild(`Duplicate MDX wiki path found: ${pagePath}`)
      return
    }

    selectedRoutes.set(pagePath, node)
  }

  for (const [, node] of selectedRoutes) {
    createPage({
      path: node.frontmatter.path,
      component: `${wikiTemplate}?__contentFilePath=${node.internal.contentFilePath}`,
      context: {
        id: node.id,
      },
    })
  }

  for (const [aliasPath, sourcePath] of Object.entries(STANDARD_ROUTE_ALIASES)) {
    if (selectedRoutes.has(aliasPath)) {
      reporter.panicOnBuild(`Standard iGEM path collides with an MDX page: ${aliasPath}`)
      return
    }

    const node = selectedRoutes.get(sourcePath)
    if (!node) {
      reporter.panicOnBuild(`Standard iGEM path ${aliasPath} has no source page: ${sourcePath}`)
      return
    }

    createPage({
      path: aliasPath,
      component: `${wikiTemplate}?__contentFilePath=${node.internal.contentFilePath}`,
      context: {
        id: node.id,
      },
    })
  }
}

function isPayloadExport(node) {
  return node.internal.contentFilePath.replace(/\\/g, `/`).split(`/`).includes(`_payload-export`)
}
