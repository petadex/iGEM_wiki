# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run develop   # start dev server at http://localhost:8000
npm run build     # production build → public/
npm run serve     # preview production build locally
npm run clean     # clear Gatsby cache (fixes most build errors)
```

No test suite is configured.

**Memory:** bundling Mol* (the structure viewer on the Software page) needs more than Node's default ~4 GB heap, or webpack dies with "JavaScript heap out of memory" during *Building development bundle*. `scripts/run-develop.cjs` raises it to 6 GB — override with `WIKI_DEV_HEAP_MB` — and both build workflows set `NODE_OPTIONS=--max-old-space-size=6144`. A local `npm run build` needs the same: `NODE_OPTIONS=--max-old-space-size=6144 npm run build`.

## Architecture

**Framework:** Gatsby 5 (React 18, SSR via `gatsby-ssr.js`)  
**Styling:** Styled Components — design tokens are defined as CSS custom properties in [src/styles/globalStyles.js](src/styles/globalStyles.js) and should be used consistently across components.  
**Data:** CSV files in `src/data/team/` are sourced via `gatsby-source-filesystem` + `gatsby-transformer-csv` and queried with GraphQL in page components. Static sponsor data lives in `src/data/sponsors.js`.  
**Visualization:** Deck.GL (`@deck.gl/core`, `@deck.gl/layers`) is used for the CATH family atlas map in [src/components/AtlasMap.js](src/components/AtlasMap.js).

### Page structure

Pages live in `src/pages/` and map directly to routes. Nested folders (`project/`, `dry-lab/`, `wet-lab/`, `hardware/`, `beyond-the-bench/`, `team/`) contain sub-pages for each wiki section. [src/components/layout.js](src/components/layout.js) wraps every page with the shared header and global styles.

### Deployment

GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) builds and deploys to GitHub Pages on every push to `main`. The built artifact is the `public/` directory.

## home-scroll-prototype (`/home-scroll-prototype/`)

A full-page composited mockup of the wiki front page, built from layered PNG assets served from `/static/wiki-mockup/`. The stack (back → front → logo → bottle → water) is composited with absolute positioning so all layers share the same dimensions, driven by the background image's natural size.

**Scroll-pinned nav:** The nav bar (`nav33`) starts `position: absolute` at the top of the composition. A scroll listener switches it to `position: fixed` while the mockup is in the viewport, clearing the skip-link bar height so it doesn't overlap. It reverts to `absolute` once the user scrolls past the mockup.

**Logo idle float:** The logo layer has a 4.2s `ease-in-out` infinite translate animation (±7 px vertical). Respects `prefers-reduced-motion`.

Site chrome (header/footer) is suppressed via `<WikiLayout hideSiteChrome>`.

Source: [src/components/HomeScrollPrototype.js](src/components/HomeScrollPrototype.js)

## Design tokens (from globalStyles.js)

| Token | Value |
|---|---|
| `--color-bg` | `#f0ede6` (off-white) |
| `--color-accent` | `#c8f050` (electric lime) |
| `--color-text` | `#0a0a0a` |
| `--font-display` | DM Serif Display |
| `--font-body` | DM Sans |
| `--font-mono` | DM Mono |
