/**
 * Footer sponsor carousel — edit this list only.
 *
 * - id: unique string (stable key)
 * - name: shown if logoSrc is missing
 * - href: optional sponsor website
 * - logoSrc: optional image URL (AVIF on static.igem.wiki); the card shows the
 *   name instead until the image loads
 * - showName: also print the name under the logo (for icon-only logos)
 */

const LOGOS = "https://static.igem.wiki/teams/6187/wiki/sponsor-logos"
export const SPONSORS = [
  // University of Toronto units
  {
    id: "rnalab",
    name: "RNAlab",
    href: "https://www.rnalab.ca/",
    logoSrc: `${LOGOS}/sponsor-rnalab.avif`,
    showName: true,
  },
  {
    id: "cagef",
    name: "CAGEF",
    href: "https://cagef.utoronto.ca/",
    logoSrc: `${LOGOS}/sponsor-cagef.avif`,
  },
  {
    id: "eeb",
    name: "UofT Ecology & Evolutionary Biology",
    href: "https://eeb.utoronto.ca/",
    logoSrc: `${LOGOS}/sponsor-eeb.avif`,
  },
  {
    id: "csb",
    name: "UofT Cell & Systems Biology",
    href: "https://csb.utoronto.ca/",
    logoSrc: `${LOGOS}/sponsor-csb.avif`,
  },
  {
    id: "hmb",
    name: "UofT Human Biology Program",
    href: "https://hmb.utoronto.ca/",
  },
  {
    id: "assu",
    name: "ASSU",
    href: "https://assu.ca/",
    logoSrc: `${LOGOS}/sponsor-assu.avif`,
  },
  {
    id: "trash-team",
    name: "U of T Trash Team",
    href: "https://uofttrashteam.ca/",
    logoSrc: `${LOGOS}/sponsor-trash-team.avif`,
  },
  // Industry partners
  {
    id: "twist",
    name: "Twist Bioscience",
    href: "https://www.twistbioscience.com/",
    logoSrc: `${LOGOS}/sponsor-twist.avif`,
  },
  {
    id: "neb",
    name: "New England Biolabs",
    href: "https://www.neb.ca/",
    logoSrc: `${LOGOS}/sponsor-neb.avif`,
  },
  {
    id: "idt",
    name: "Integrated DNA Technologies",
    href: "https://www.idtdna.com/",
    logoSrc: `${LOGOS}/sponsor-idt.avif`,
  },
  {
    id: "snapgene",
    name: "SnapGene",
    href: "https://www.snapgene.com/",
    logoSrc: `${LOGOS}/sponsor-snapgene.avif`,
  },
  {
    id: "biorender",
    name: "BioRender",
    href: "https://www.biorender.com/",
    logoSrc: `${LOGOS}/sponsor-biorender.avif`,
  },
  // Community sponsors
  {
    id: "frjunk",
    name: "Fraser River Junk Removal",
    href: "https://frjunk.ca/",
    logoSrc: `${LOGOS}/sponsor-frjunk.avif`,
  },
  {
    id: "awesome-foundation",
    name: "Awesome Foundation",
    href: "https://www.awesomefoundation.org/en/chapters/toronto",
    logoSrc: `${LOGOS}/sponsor-awesome-foundation.avif`,
    showName: true,
  },
  {
    id: "longos",
    name: "Longo's",
    href: "https://www.longos.com/",
    logoSrc: `${LOGOS}/sponsor-longos.avif`,
  },
  {
    id: "jukebox",
    name: "Jukebox",
    href: "https://www.jukeboxprint.com/",
    logoSrc: `${LOGOS}/sponsor-jukebox.avif`,
  },
  {
    id: "quokka",
    name: "Quokka Prints",
    href: "https://quokkaprints.com/",
    logoSrc: `${LOGOS}/sponsor-quokka.avif`,
  },
]
