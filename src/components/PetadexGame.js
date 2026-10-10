import React, { useRef, useState } from "react"
import styled from "styled-components"
import EnzymeBattle from "./EnzymeBattle.js"
import Petadex from "./Petadex.js"
import PetadexBottlePath from "./PetadexBottlePath.js"

/** PETadex browser on the bottle path, plus the enzyme battle it opens. */
const PetadexGame = () => {
  const petadexRef = useRef(null)
  const [battleOpen, setBattleOpen] = useState(false)

  return (
    <>
      <GameWrap>
        <PetadexBottlePath
          petadexRef={petadexRef}
          onBattle={() => setBattleOpen(true)}
        >
          <div ref={petadexRef}>
            <Petadex />
          </div>
        </PetadexBottlePath>
      </GameWrap>
      <EnzymeBattle isOpen={battleOpen} onClose={() => setBattleOpen(false)} />
    </>
  )
}

export default PetadexGame

const GameWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  padding-bottom: 1.5rem;
`
