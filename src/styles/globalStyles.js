import { createGlobalStyle } from "styled-components"

export const GlobalStyle = createGlobalStyle`
  /* ── Design tokens ── */
  :root {
    /* Colors */
    --color-bg:         #f7fbff;
    --color-surface:    #ffffff;
    --color-border:     #9bb8c5;
    --color-text:       #06202b;
    --color-muted:      #58717b;
    /* Reading text (paragraphs, lists, tables): darker than muted so long
       sections stay comfortable to read; muted is for captions and meta. */
    --color-body:       #1f2f36;
    --color-accent:     #c92f3b;

    /* Typography */
    --font-body:    'DM Sans', system-ui, sans-serif;
    /* Same as the body: the whole site uses DM Sans, like the homepage. */
    --font-display: var(--font-body);
    --font-mono:    'DM Mono', monospace;

    /* Spacing scale */
    --space-xs:  0.25rem;
    --space-sm:  0.5rem;
    --space-md:  1rem;
    --space-lg:  2rem;
    --space-xl:  4rem;
    --space-2xl: 8rem;

    /* Layout */
    --max-width: 75rem;
    --page-padding: clamp(1rem, 5vw, 4rem);
    /* The tallest a figure is drawn inline. A figure is as wide as the column
       or as wide as this height allows at its shape, whichever is narrower:
       wide plots fill the column, square and tall ones stop here and centre.
       Detail is one click away in the figure viewer. */
    --figure-max-h: min(32rem, 70vh);
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    /* Up to a 1920px-wide window, 16px. Wider, the text grows with the
       window, as the art (and everything drawn to its scale) does, so pages
       look the same on a 1440p or 4K monitor as on a 1080p one. */
    font-size: max(16px, calc(100vw / 120));
    scroll-behavior: smooth;
    /* No grey flash over tapped art (crabs, bottle pieces) on phones. */
    -webkit-tap-highlight-color: transparent;
    /* No double-tap zoom: iOS otherwise eats the second of two quick taps
       (tap-to-preview, tap-again-to-open; play then pause). Pinch zoom stays. */
    touch-action: manipulation;
    scroll-padding-top: 6rem;
    min-height: 100%;
  }

  body {
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  #___gatsby,
  #gatsby-focus-wrapper {
    min-height: 100vh;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    line-height: 1.15;
    font-weight: 700;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  img, video {
    max-width: 100%;
    display: block;
  }

  /* PlateImg's stand-in for an <img>: block, the plate's own width, height
     from its aspect ratio. Zero specificity, so a component's styles win. */
  :where(.plate-img) {
    position: relative;
    display: block;
    width: var(--plate-w);
    max-width: 100%;
  }

  .citation a,
  [id^="citation-"] a {
    color: var(--color-accent);
    font-weight: 700;
    text-decoration: none;
  }

  .citation a:hover,
  [id^="citation-"] a:hover {
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }

  .citation a:focus-visible,
  [id^="citation-"] a:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  .references {
    margin-top: var(--space-xl);
    padding-top: var(--space-lg);
    border-top: 1px solid var(--color-border);
    color: var(--color-text);
  }

  .references::before {
    content: "References";
    display: block;
    margin-bottom: var(--space-md);
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.15;
  }

  .references [id] {
    scroll-margin-top: 6rem;
  }

  .references .csl-entry {
    margin-bottom: var(--space-sm);
    transition: background-color 180ms ease;
  }

  .references .csl-entry:target {
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  }

  .references .csl-entry:has(.csl-left-margin) {
    display: flex;
    align-items: baseline;
    gap: 0.75em;
  }

  .references .csl-left-margin {
    flex: 0 0 2.5em;
  }

  .references .csl-right-inline {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--color-bg); }
  ::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
`
