/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
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
    `gatsby-transformer-csv`,
  ],
}
