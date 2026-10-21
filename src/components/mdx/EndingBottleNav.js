import React, { useEffect, useRef } from "react"
import { Link } from "gatsby"
import styled from "styled-components"
import EndingPetamonBottle from "../EndingPetamonBottle.js"
import { phone } from "../artScale.js"

/** Share of the block that must be visible before the petamons pop. */
const PLAY_AT = 0.3

/**
 * The page's closing navigation: one big button to the Engineering page, and
 * under it the homepage's ending bottle, whose seven pieces each open a
 * subteam page.
 *
 * On the homepage the pieces fly in from the edges of the screen as the page
 * scrolls. Here the bottle is already whole: it only waits until it is in
 * view, then the petamons pop out from behind their pieces, in place.
 */
export const EndingBottleNav = ({
  to = "/project/engineering/",
  label = "See the Engineering cycles",
  kicker = "Where to next",
  note = null,
}) => {
  const bottleRef = useRef(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const bottle = bottleRef.current
    if (!section || !bottle) return undefined

    // Assembled from the start, so the bottle never flies across the page.
    bottle.update({ assemble: 1, burst: 0 })

    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.intersectionRatio >= PLAY_AT)) return
        observer.disconnect()
        // Burst above its trigger pops the petamons where they stand.
        bottle.update({ assemble: 1, burst: 1 })
      },
      { threshold: [PLAY_AT] },
    )
    observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return (
    <Panel ref={sectionRef}>
      <Kicker>{kicker}</Kicker>
      <BigButton to={to}>{label}</BigButton>
      {note && <Note>{note}</Note>}
      <BottleSlot>
        <EndingPetamonBottle ref={bottleRef} whisper={false} light />
      </BottleSlot>
    </Panel>
  )
}

export default EndingBottleNav

const Panel = styled.section`
  /* Its own cap, not the page's block width: where a page lets its blocks
     run the full column, the bottle would grow with it and tower over the
     text it closes. */
  max-width: 44rem;
  margin: var(--space-xl) auto 0;
  padding: clamp(1.75rem, 4vw, 3rem) clamp(0.5rem, 1vw, 0.75rem);
  /* The hint hangs below the frame, so this has to clear it; it wraps to two
     lines once the column gets narrow. */
  padding-bottom: clamp(4rem, 7vw, 4.5rem);
  text-align: center;
  /* No panel: the bottle sits straight on the page, so the labels and hint
     run in each subteam's darker ink (the bottle's light prop). */
  overflow: hidden;

  /* Phones: the block stays inside the text column, because outside it the
     page is dark art and these labels are dark ink. Every pixel of the column
     goes to the bottle so the longest names still fit beside it. */
  ${phone} {
    padding-left: 0;
    padding-right: 0;
  }

  /* The page template underlines and recolours every prose link. These links
     are art, not prose, so take them back (doubled && to outrank it). */
  && a:not(.heading-anchor) {
    border-bottom: none;
    text-decoration: none;
  }

  && a:not(.heading-anchor):hover {
    background: transparent;
  }
`

const Kicker = styled.p`
  margin: 0 0 0.75rem;
  color: var(--color-muted);
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`

const BigButton = styled(Link)`
  /* Doubled: the page template's prose-link colour is more specific than one class. */
  && {
    color: #fff;
  }

  display: inline-block;
  padding: clamp(0.95rem, 2.2vw, 1.3rem) clamp(1.7rem, 4.4vw, 3rem);
  border-radius: 999px;
  background: var(--color-accent);
  color: #fff;
  font-family: var(--font-body);
  font-size: clamp(1.15rem, 2.9vw, 1.65rem);
  font-weight: 700;
  line-height: 1.2;
  text-decoration: none;
  transition:
    transform 200ms ease,
    box-shadow 200ms ease,
    filter 200ms ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    filter: brightness(1.08);
    box-shadow: 0 10px 28px rgba(201, 47, 59, 0.45);
  }

  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover,
    &:focus-visible {
      transform: none;
    }
  }
`

const Note = styled.p`
  margin: 1.25rem auto 0;
  max-width: 38rem;
  color: var(--color-muted);
  font-family: var(--font-body);
  font-size: 1.15rem;
  line-height: 1.45;
`

/**
 * Narrower than the panel: the subteam labels reach past the art on both
 * sides, so this keeps them inside it. Nudged left because the labels reach
 * further right (Human Practices, Entrepreneurship) than left.
 */
const BottleSlot = styled.div`
  width: 96%;
  margin: clamp(1.5rem, 4vw, 2.5rem) auto 0;
  transform: translateX(-3%);

  /* On phones the bottle is far narrower than on the homepage, so it takes the
     full panel and the names drop below their usual floor to stay beside it. */
  ${phone} {
    width: 84%;
    transform: none;
    --bottle-name-min: 0.6rem;
    --bottle-label-max: 70cqw;
  }
`
