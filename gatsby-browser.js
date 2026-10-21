import "./src/styles/dm-sans.css"
// Body font (--font-body). Bundled into the build so it's served from the wiki
// itself; weights match the ones used across src/.
import { endRouteWait, startRouteWait } from "./src/components/SiteLoader.js"

/*
 * A page that takes over a second to arrive puts the logo loader up (in
 * place of Gatsby's "Preparing requested page" notice, which
 * scripts/run-develop.cjs turns off).
 */
export const onRouteUpdateDelayed = () => startRouteWait()
export const onRouteUpdate = ({ location, prevLocation }) => {
  endRouteWait()
  // A #section link from another page lands on its section (see
  // holdHashInView). Same-page anchors keep the browser's smooth scroll, and
  // the first load is onInitialClientRender's.
  const newPage = prevLocation && prevLocation.pathname !== location.pathname
  if (newPage && location.hash) holdHashInView(location.hash)
}

/*
 * Scroll restoration: back/forward (and reloads) return to where you were
 * on that page. Gatsby remembers each history entry's position; these make
 * the return instant and reliable.
 */

export const shouldUpdateScroll = ({
  routerProps: { location },
  getSavedScrollPosition,
}) => {
  // [x, y], with no y when this visit to the page hasn't been scrolled.
  const [, savedY] = getSavedScrollPosition(location)
  if (savedY != null) {
    restoreScroll(savedY)
    return false
  }
  // A #section link: onRouteUpdate holds it in view.
  if (location.hash) return false
  // A new page starts at the top, at once (the site's smooth scrolling
  // would otherwise glide up from the last page's position).
  window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  return false
}

/*
 * A page opened at a #section (a link from another page, often in a new tab)
 * lands on that section. The browser's own jump happens before the content
 * has rendered and sized, so it ends up at the top or short of the target.
 */
export const onInitialClientRender = () => {
  if (window.location.hash) holdHashInView(window.location.hash)
}

/** Holds the element `hash` names at the top of the window (less its
    scroll-margin-top, which clears the sticky header) while the page settles. */
function holdHashInView(hash) {
  let id
  try {
    id = decodeURIComponent(hash.slice(1))
  } catch {
    return
  }
  holdScroll(() => {
    const el = document.getElementById(id)
    if (!el) return null
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    return window.scrollY + el.getBoundingClientRect().top - margin
  }, 2000)
}

/** Puts the page back at `y`; see holdScroll. */
function restoreScroll(y) {
  holdScroll(() => y, 1200)
}

/**
 * Puts the page at `target()` straight away (not smooth-scrolled from the
 * top) and holds it there for `ms` while the art finishes sizing, which can
 * shift the page; stops as soon as the reader scrolls themselves. `target`
 * is re-read every frame and may return null while its element is missing.
 */
function holdScroll(target, ms) {
  const until = performance.now() + ms
  const inputs = ["wheel", "touchstart", "keydown", "pointerdown"]
  let readerScrolled = false
  const stop = () => {
    readerScrolled = true
  }
  inputs.forEach(type =>
    window.addEventListener(type, stop, { passive: true, once: true }),
  )
  const hold = () => {
    const y = target()
    if (!readerScrolled && y != null && Math.abs(window.scrollY - y) > 1) {
      window.scrollTo({ top: y, left: 0, behavior: "instant" })
    }
    if (!readerScrolled && performance.now() < until) {
      requestAnimationFrame(hold)
    } else {
      inputs.forEach(type => window.removeEventListener(type, stop))
    }
  }
  hold()
}
