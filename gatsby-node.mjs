import path from "path"
import TerserPlugin from "terser-webpack-plugin"
import { USE_PAYLOAD_EXPORTS } from "./content-source.config.mjs"
import { STANDARD_ROUTE_ALIASES } from "./src/data/standardRoutes.mjs"

const wikiTemplate = path.resolve(`./src/templates/wiki-mdx.js`)

// Gatsby inlines small fonts into CSS, then repeats that CSS in every HTML
// page. Emit shared font files instead to keep the Pages archive small.
export function onCreateWebpackConfig({ stage, getConfig, actions }) {
  const config = getConfig()
  // Production source maps are removed from the Pages artifact anyway. Avoid
  // generating them during both webpack compilations on the limited runner.
  if (stage === "build-javascript" || stage === "build-html") config.devtool = false
  if (stage === "build-javascript") {
    // Keep CSS optimization; replace only JavaScript minification with esbuild.
    config.optimization.minimizer = config.optimization.minimizer.map(plugin =>
      plugin instanceof TerserPlugin ? new TerserPlugin({
        minify: TerserPlugin.esbuildMinify,
        parallel: false,
        terserOptions: { target: "es2017" },
      }) : plugin,
    )
  }
  const visit = (rules = []) => {
    for (const rule of rules) {
      if (!rule || typeof rule !== "object") continue
      if (rule.test instanceof RegExp && rule.test.test("font.woff2")) {
        for (const use of Array.isArray(rule.use) ? rule.use : [rule.use]) {
          if (use && typeof use === "object" && /[\\/]url-loader[\\/]/.test(use.loader || "")) {
            use.options = { ...use.options, limit: 0 }
          }
        }
      }
      visit(rule.oneOf)
      visit(rule.rules)
    }
  }
  visit(config.module?.rules)
  // Mol* (the structure viewer on the Software page) reaches for Node's fs,
  // path and crypto; webpack 5 stops polyfilling those, so they are stubbed
  // out the way petadex.io's frontend stubs them.
  config.resolve = {
    ...config.resolve,
    fallback: { ...config.resolve?.fallback, fs: false, path: false, crypto: false },
  }
  actions.replaceWebpackConfig(config)
}

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

  // Comma-separated path prefixes left out of this build. The iGEM build skips
  // the Dry Lab issue pages: their embedded images are far over iGEM's 5 MB
  // upload limit until they move to static.igem.wiki.
  const excludedPrefixes = (process.env.WIKI_EXCLUDE_PATHS || ``)
    .split(`,`)
    .map((prefix) => prefix.trim())
    .filter(Boolean)
  if (excludedPrefixes.length) {
    reporter.info(`Leaving out wiki pages under: ${excludedPrefixes.join(`, `)}`)
  }

  const selectedRoutes = new Map()
  const nodes = result.data.allMdx.nodes
    .filter((node) => !path.basename(node.internal.contentFilePath).startsWith(`_`))
    .filter((node) => !excludedPrefixes.some((prefix) => node.frontmatter.path.startsWith(prefix)))
    .filter((node) => USE_PAYLOAD_EXPORTS || !isPayloadExport(node))
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
