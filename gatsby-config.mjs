import { fileURLToPath } from "url"
import path from "path"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeWikiCitations from "./plugins/rehype-wiki-citations.mjs"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * @type {import('gatsby').GatsbyConfig}
 */
const config = {
  pathPrefix: process.env.GATSBY_PATH_PREFIX || ``,
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
