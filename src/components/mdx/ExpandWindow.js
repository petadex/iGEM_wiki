import React, { createContext, useEffect, useRef, useState } from "react"
import styled, { css, keyframes } from "styled-components"

/**
 * A figure that opens into a large in-page window: a panel over the page with
 * a dimmed backdrop, a title bar and a close button. The landscape, the game
 * the DIAMOND search demo and the calendar use it in place of browser full screen, which
 * hides the rest of the wiki and drops the reader out of the page.
 *
 * The window is the same element as the inline figure, pinned over the page
 * with `position: fixed`, not a portal: moving an iframe in the DOM reloads
 * it, and remounting a React figure resets it, either of which would throw
 * away where the reader had got to.
 *
 * `children` is a function of `open`, so a figure can lay itself out for the
 * window (e.g. render an iframe at its true size). `focusRef` names what takes
 * focus on open, so the figure answers keys and drags without a first click;
 * without it the window body takes focus, which lets the keyboard scroll it.
 * `ground` is the window's background; `dark` picks light chrome to sit on it.
 * `inlineTitle={false}` keeps the title to the window's bar, for a figure that
 * already sits under a heading saying the same thing.
 */
/**
 * True inside an open window. A figure that sizes itself off the screen (the
 * calendar's fit mode) reads it to fill the window's height instead, which
 * figures nested in MDX (<Expandable>) can't get as a prop.
 */
export const ExpandContext = createContext(false)

export const ExpandWindow = ({
  title,
  inlineTitle = true,
  dark = false,
  ground,
  focusRef,
  children,
}) => {
  const [open, setOpen] = useState(false)
  const [placeholderH, setPlaceholderH] = useState(0)
  const stageRef = useRef(null)
  const bodyRef = useRef(null)
  const openerRef = useRef(null)
  const bg = ground || (dark ? "#0b1220" : "#f8fafc")

  const expand = () => {
    // The placeholder holds the figure's inline height, so the page doesn't
    // jump under the window.
    setPlaceholderH(stageRef.current?.offsetHeight || 0)
    setOpen(true)
  }

  // A link to a spot on the page (the overview cards) closes the window
  // first, then jumps, since the page behind can't scroll while it's up.
  const followPageLink = e => {
    const link = open && e.target.closest?.('a[href^="#"]')
    const target = link && document.getElementById(decodeURIComponent(link.hash.slice(1)))
    if (!target) return
    e.preventDefault()
    setOpen(false)
    requestAnimationFrame(() => {
      target.scrollIntoView()
      window.history.pushState(null, "", link.hash)
    })
  }

  // While the window is up: Escape closes it, the page behind it stops
  // scrolling, and focus goes into the figure and back to the opener after.
  useEffect(() => {
    if (!open) return undefined
    const onKey = e => {
      if (e.key === "Escape") setOpen(false)
    }
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    root.style.overflow = "hidden"
    document.addEventListener("keydown", onKey)

    // The window can only stack as high as the layers it sits in, and the page
    // column is a z-index 1 layer under the site header (110). Lift each
    // ancestor that sets a z-index above the header while the window is up.
    const lifted = []
    for (let el = stageRef.current?.parentElement; el && el !== document.body; el = el.parentElement) {
      const { position, zIndex } = getComputedStyle(el)
      if (position !== "static" && zIndex !== "auto") {
        lifted.push([el, el.style.zIndex])
        el.style.zIndex = "10000"
      }
    }

    const target = focusRef?.current || bodyRef.current
    // Keys pressed inside an iframe never reach this document, so Escape is
    // also heard in the frame's own window -- possible only for a same-origin
    // figure; a cross-origin one still closes from the button or backdrop.
    let frameWin = null
    if (target?.tagName === "IFRAME") {
      try {
        frameWin = target.contentWindow
        frameWin?.addEventListener("keydown", onKey)
      } catch {
        frameWin = null
      }
    }
    target?.focus({ preventScroll: true })
    frameWin?.focus()

    const opener = openerRef.current
    return () => {
      root.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
      for (const [el, z] of lifted) el.style.zIndex = z
      try {
        frameWin?.removeEventListener("keydown", onKey)
      } catch {
        // The frame navigated away or was torn down; nothing to unhook.
      }
      opener?.focus({ preventScroll: true })
    }
  }, [open, focusRef])

  return (
    <>
      {open && (
        <Placeholder $dark={dark} $bg={bg} style={{ height: placeholderH }}>
          Open in the window above
        </Placeholder>
      )}
      {open && <Backdrop onClick={() => setOpen(false)} aria-hidden="true" />}
      <Stage
        ref={stageRef}
        $open={open}
        $dark={dark}
        $bg={bg}
        role={open ? "dialog" : undefined}
        aria-modal={open ? "true" : undefined}
        aria-label={open ? title || "Interactive figure" : undefined}
      >
        <Bar $open={open} $dark={dark}>
          {title && (open || inlineTitle) && <Title>{title}</Title>}
          {open ? (
            <Close $dark={dark} type="button" onClick={() => setOpen(false)}>
              Close <span aria-hidden="true">✕</span>
            </Close>
          ) : (
            <Opener ref={openerRef} type="button" onClick={expand}>
              Expand ⤢
            </Opener>
          )}
        </Bar>
        <Body
          ref={bodyRef}
          $open={open}
          tabIndex={open && !focusRef ? -1 : undefined}
          onClick={followPageLink}
        >
          <ExpandContext.Provider value={open}>{children(open)}</ExpandContext.Provider>
        </Body>
      </Stage>
    </>
  )
}

/**
 * MDX wrapper: any run of page content, opened into the window together. Use
 * it to keep a figure's companions (a caption, its MethodsLink) with it in the
 * window. Inline the content lays out exactly as it would unwrapped.
 *
 *   <Expandable title="PETadex Project Calendar">
 *     <DryLabCalendar />
 *     <MethodsLink href="...">...</MethodsLink>
 *   </Expandable>
 *
 * `wide` lets the content take the window's full width, for a figure that
 * fills the window rather than reads in it (the overview's feature cards).
 */
export const Expandable = ({ title, inlineTitle = false, wide = false, dark = false, ground, children }) => (
  <ExpandableBlock>
    <ExpandWindow
      title={title}
      inlineTitle={inlineTitle}
      dark={dark}
      ground={ground || (dark ? undefined : "var(--color-bg)")}
    >
      {open => (
        <ExpandableBody $open={open} $wide={wide}>
          {children}
        </ExpandableBody>
      )}
    </ExpandWindow>
  </ExpandableBlock>
)

const ExpandableBlock = styled.div`
  margin: var(--space-lg) 0;
`

/* In the window the content is held to a readable width with room round it,
   and is one window tall: a child that fills the window (the calendar) takes
   whatever height the others leave, so the whole run fits without scrolling.
   Its first and last children keep their page margins inline, so they are
   trimmed only here. */
const ExpandableBody = styled.div`
  ${({ $open, $wide }) =>
    $open &&
    css`
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      max-width: ${$wide ? "none" : "80rem"};
      margin: 0 auto;
      padding: 1rem 1.5rem 1.25rem;

      > * {
        flex: none;
      }

      /* Doubled up past the &&& that page components use on their margins. */
      &&&& > :first-child {
        margin-top: 0;
      }

      &&&& > :last-child {
        margin-bottom: 0;
      }
    `}
`

export const windowIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: none; }
`

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

/* Inline it is just a wrapper; open, it is the window. */
const Stage = styled.div`
  ${({ $open, $bg }) =>
    $open &&
    css`
      position: fixed;
      z-index: 10001;
      inset: max(2.5vh, 16px) max(2.5vw, 16px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-radius: 12px;
      background: ${$bg};
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08);
      animation: ${windowIn} 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);

      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
`

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  margin-bottom: var(--space-sm);

  ${({ $open, $dark }) =>
    $open &&
    css`
      flex: none;
      margin: 0;
      padding: 0.7rem 0.9rem 0.7rem 1.1rem;
      border-bottom: 1px solid ${$dark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"};
      color: ${$dark ? "#e6edf7" : "var(--color-text)"};
    `}
`

const Title = styled.span`
  font-weight: 700;
`

const Body = styled.div`
  ${({ $open }) =>
    $open &&
    css`
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: auto;
      outline: none;
    `}
`

const Opener = styled.button`
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-link, inherit);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
`

export const Close = styled.button`
  margin-left: auto;
  padding: 0.35rem 0.75rem;
  border: 1px solid ${({ $dark }) => ($dark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.15)")};
  border-radius: 999px;
  background: ${({ $dark }) => ($dark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)")};
  color: inherit;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${({ $dark }) => ($dark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.09)")};
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

export const Backdrop = styled.div`
  position: fixed;
  z-index: 10000;
  inset: 0;
  background: rgba(6, 10, 18, 0.62);
  backdrop-filter: blur(3px);
  animation: ${fadeIn} 0.2s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Placeholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed ${({ $dark }) => ($dark ? "rgba(255, 255, 255, 0.2)" : "var(--color-border)")};
  border-radius: 8px;
  background: ${({ $bg }) => $bg};
  color: ${({ $dark }) => ($dark ? "rgba(230, 237, 247, 0.55)" : "var(--color-muted)")};
  font-size: 0.875rem;
  font-weight: 600;
`
