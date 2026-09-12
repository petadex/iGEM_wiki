import React, { useRef, useState } from "react"
import styled from "styled-components"
import WikiLayout from "../../components/layout.js"
import AtlasMap from "../../components/AtlasMap.js"
import EnzymeBattle from "../../components/EnzymeBattle.js"
import Petadex from "../../components/Petadex.js"
import PetadexBottlePath from "../../components/PetadexBottlePath.js"

const Page = () => {
  const petadexRef = useRef(null)
  const [battleOpen, setBattleOpen] = useState(false)

  return (
    <WikiLayout pageTitle="Overview" sectionLabel="Dry Lab">
      <Blurb>
        The Dry Lab performs in-silico discovery, mining large-scale metagenomic
        data to identify and prioritize the most promising PETase candidates from
        a database of over 216 million sequences. Computational predictions are
        organized through PETadex and passed to the Wet Lab for experimental
        validation, forming the analytical core of the project's enzyme discovery
        pipeline.
      </Blurb>
      <Section>
        <h2>Protein Family Atlas</h2>
        <p>
          Interactive UMAP visualization of protein families. Use the controls to
          color by taxonomic domain, phylum, or structural component. Search for
          specific families or organisms using the search bar. Scroll to zoom and
          drag to pan.
        </p>
        <AtlasMap />
      </Section>
      <Section>
        <h2>PETadex</h2>
        <p>
          Browse PETase candidates in PETadex, then start an enzyme battle to
          see how each one fares against different plastics.
        </p>
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
      </Section>
      <EnzymeBattle isOpen={battleOpen} onClose={() => setBattleOpen(false)} />
    </WikiLayout>
  )
}

export default Page
export const Head = () => <title>Dry Lab Overview — iGEM Toronto 2026</title>

const Blurb = styled.p`
  color: var(--color-muted);
  font-size: 1.05rem;
  line-height: 1.75;
  max-width: 52rem;
  margin-bottom: var(--space-xl);
`

const Section = styled.section`
  h2 {
    font-size: 1.5rem;
    margin-bottom: var(--space-sm);
    color: var(--color-text);
  }
  p {
    color: var(--color-muted);
    margin-bottom: var(--space-lg);
    line-height: 1.6;
  }
`

const GameWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  padding-bottom: 1.5rem;
`
