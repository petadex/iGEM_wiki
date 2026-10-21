import { fileURLToPath } from "url"
import path from "path"
import { USE_PAYLOAD_EXPORTS } from "./content-source.config.mjs"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeWikiCitations from "./plugins/rehype-wiki-citations.mjs"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Whether a hast node has an <a> anywhere beneath it. */
const containsLink = node =>
  (node.children || []).some(child => child.tagName === `a` || containsLink(child))

/**
 * @type {import('gatsby').GatsbyConfig}
 */
const config = {
  pathPrefix: process.env.GATSBY_PATH_PREFIX || ``,
  // gatsby develop never serves .html from public/, so self-contained HTML
  // figures (static/figures/**/*.html, shown in iframes) are served from
  // static/ here. Production builds copy and serve them like any static file.
  developMiddleware: app => {
    const figures = path.join(__dirname, `static`, `figures`)
    app.get(/^\/figures\/.+\.html$/, (req, res, next) => {
      const file = path.join(figures, decodeURIComponent(req.path.slice(`/figures/`.length)))
      if (!file.startsWith(figures + path.sep)) return next()
      res.sendFile(file, err => {
        if (!err) return
        // A client that goes away mid-transfer (likely: these figures are ~1 MB)
        // errors here with the response already streaming. Handing it to the
        // next middleware would try to set headers again and take the dev
        // server down with ERR_HTTP_HEADERS_SENT, so only unstarted responses
        // fall through to gatsby's 404.
        if (res.headersSent) return res.destroy()
        next()
      })
    })
  },
  siteMetadata: {
    title: `iGEM Toronto 2026`,
    description: `iGEM Toronto 2026 Wiki`,
    author: `iGEM Toronto`,
    siteUrl: `https://github.com/petadex/iGEM_wiki.git`,
  },
  plugins: [
    `gatsby-plugin-styled-components`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `team`,
        path: `${__dirname}/src/data/team`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `wiki`,
        path: `${__dirname}/src/content/wiki`,
        ignore: USE_PAYLOAD_EXPORTS ? [] : [`**/_payload-export/**`],
      },
    },
    `gatsby-transformer-csv`,
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: [`.mdx`, `.md`],
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeWikiCitations,
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              {
                behavior: `wrap`,
                // A heading written as a link (### [Title](/elsewhere/)) keeps
                // that link instead of being wrapped in a second, nested one.
                test: heading => !containsLink(heading),
                properties: {
                  className: [`heading-anchor`],
                  ariaLabel: `Link to this section`,
                },
              },
            ],
          ],
        },
      },
    },
  ],
}

export default config
