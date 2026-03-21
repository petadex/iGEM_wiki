import { createGlobalStyle } from "styled-components"

export const GlobalStyle = createGlobalStyle`
  /* ── Design tokens ── */
  :root {
    /* Colors */
    --color-bg:         #f0ede6;
    --color-surface:    #111111;
    --color-border:     #222222;
    --color-text:       #0a0a0a;
    --color-muted:      #888880;
    --color-accent:     #c8f050;   /* electric lime — swap this for your brand color */

    /* Typography */
    --font-display: 'DM Serif Display', Georgia, serif;
    --font-body:    'DM Sans', system-ui, sans-serif;
    --font-mono:    'DM Mono', monospace;

    /* Spacing scale */
    --space-xs:  0.25rem;
    --space-sm:  0.5rem;
    --space-md:  1rem;
    --space-lg:  2rem;
    --space-xl:  4rem;
    --space-2xl: 8rem;

    /* Layout */
    --max-width: 1200px;
    --page-padding: clamp(1rem, 5vw, 4rem);
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    background-color: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    line-height: 1.15;
    font-weight: 400;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  img, video {
    max-width: 100%;
    display: block;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--color-bg); }
  ::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
`