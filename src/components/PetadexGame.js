import React, { useRef } from "react"
import { withPrefix } from "gatsby"
import styled, { css } from "styled-components"
import { ExpandWindow } from "./mdx/ExpandWindow.js"

/*
 * The PETadex game: title screen, browser, battle, coverage board and
 * tutorial, all in one self-contained page at
 * static/figures/petadex-game/petadex-game.html. It is a copy of
 * ~/Documents/projects/petamon-game/petadex-game-demo.html, adapted here to be
 * always dark and to lay itself out to fill the frame (the diff against the
 * demo is just those CSS rules). Carry later changes to the demo over by hand.
 *
 * The frame is sized to fit the window under the site header, and the game
 * fits inside it: the coverage board takes what is left and scrolls on its
 * own. The battle dialog and tutorial bar are fixed to the game's viewport,
 * so they always land inside the frame. Expand opens it in a large in-page
 * window (ExpandWindow), where it lays itself out to the bigger frame.
 */
const SRC = "/figures/petadex-game/petadex-game.html"
const GROUND = "#16181a"

const PetadexGame = ({ grow = false, anchor }) => {
  const href = withPrefix(SRC)
  const frameRef = useRef(null)

  return (
    <Figure>
      <ExpandWindow title="PETamon" inlineTitle={false} dark ground={GROUND} focusRef={frameRef} grow={grow} anchor={anchor}>
        {open => (
          <Box $open={open}>
            <Frame ref={frameRef} src={href} title="PETadex game" loading="lazy" />
          </Box>
        )}
      </ExpandWindow>
    </Figure>
  )
}

export default PetadexGame

const Figure = styled.figure`
  margin: var(--space-lg, 1.5rem) 0;
`

const Box = styled.div`
  width: 100%;
  height: min(46rem, calc(100vh - 7rem));
  min-height: 26rem;
  overflow: hidden;
  border: 1px solid ${GROUND};
  border-radius: 8px;
  background: ${GROUND};

  /* In the window the game fills whatever the window leaves below its bar. */
  ${({ $open }) =>
    $open &&
    css`
      flex: 1;
      height: auto;
      min-height: 0;
      border: 0;
      border-radius: 0 0 12px 12px;
    `}
`

const Frame = styled.iframe`
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
`
