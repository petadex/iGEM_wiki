import React, { useCallback, useEffect, useRef, useState } from "react"
import { withPrefix } from "gatsby"
import styled from "styled-components"

const BATTLE_IMG = withPrefix("/images/petadex-battle-button-bg.png")

const PetadexBottlePath = ({ petadexRef, onBattle, children }) => {
  const wrapperRef = useRef(null)
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 })
  const [positioned, setPositioned] = useState(false)

  const positionButton = useCallback(() => {
    const wrapper = wrapperRef.current
    const petadex = petadexRef?.current
    if (!wrapper || !petadex) return false

    const shell = petadex.firstElementChild || petadex
    const wrapperRect = wrapper.getBoundingClientRect()
    const petadexRect = shell.getBoundingClientRect()
    if (petadexRect.height === 0) return false

    const paddedRight = petadexRect.right - wrapperRect.left + 55
    const paddedBottom = petadexRect.bottom - wrapperRect.top + 55
    setButtonPosition({ x: paddedRight - 290, y: paddedBottom - 260 })
    setPositioned(true)
    return true
  }, [petadexRef])

  useEffect(() => {
    let attempts = 0
    let retryTimer

    const tryPosition = () => {
      if (!positionButton() && attempts++ < 30) {
        retryTimer = window.setTimeout(tryPosition, 100)
      }
    }

    tryPosition()
    window.addEventListener("resize", positionButton)
    return () => {
      window.clearTimeout(retryTimer)
      window.removeEventListener("resize", positionButton)
    }
  }, [positionButton])

  return (
    <Wrapper ref={wrapperRef}>
      {children}
      <BattleButton
        type="button"
        aria-label="Start enzyme battle"
        $positioned={positioned}
        style={{ left: buttonPosition.x, top: buttonPosition.y }}
        onClick={onBattle}
      >
        BATTLE
      </BattleButton>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const BattleButton = styled.button`
  position: absolute;
  z-index: 101;
  width: 180px;
  height: 58px;
  border: none;
  background: transparent url(${BATTLE_IMG}) center / 100% 100% no-repeat;
  color: #000;
  font-family: monospace;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 3px;
  cursor: pointer;
  opacity: ${({ $positioned }) => ($positioned ? 1 : 0)};
  pointer-events: ${({ $positioned }) => ($positioned ? "auto" : "none")};
  transition: transform 0.1s, opacity 0.2s;

  &:hover {
    filter: brightness(1.1);
  }

  &:active {
    transform: translateY(3px);
  }
`

export default PetadexBottlePath
