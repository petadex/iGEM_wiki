import React, { useRef, useState } from "react"
import { Link } from "gatsby"
import styled from "styled-components"
import WikiLayout from "../../components/layout.js"
import SubpageScene from "../../components/SubpageScene.js"
import { DRY_LAB_SCENE } from "../../components/subpageScenes.js"
import EnzymeBattle from "../../components/EnzymeBattle.js"
import Petadex from "../../components/Petadex.js"
import PetadexBottlePath from "../../components/PetadexBottlePath.js"

const Page = () => {
  const petadexRef = useRef(null)
  const [battleOpen, setBattleOpen] = useState(false)

  return (
    <WikiLayout fullBleed>
      <SubpageScene scene={DRY_LAB_SCENE} title="Overview">
        <Blurb>
          The Dry Lab performs in-silico discovery, mining large-scale
          metagenomic data to identify and prioritize the most promising PETase
          candidates from a database of over 216 million sequences.
          Computational predictions are organized through PETadex and passed to
          the Wet Lab for experimental validation, forming the analytical core
          of the project's enzyme discovery pipeline.
        </Blurb>
        <PageLinks aria-label="Dry Lab pages">
          <Link to="/model/">Model</Link>
          <Link to="/software/">Software</Link>
        </PageLinks>
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
      </SubpageScene>
      <EnzymeBattle isOpen={battleOpen} onClose={() => setBattleOpen(false)} />
    </WikiLayout>
  )
}

export default Page
export const Head = () => <title>Dry Lab Overview — iGEM Toronto 2026</title>

const Blurb = styled.p`
  color: var(--color-body);
  font-size: 1.05rem;
  line-height: 1.75;
  max-width: 52rem;
  margin-bottom: var(--space-xl);
`

const PageLinks = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);

  a {
    padding: 0.5rem 1.1rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-text);
    font-weight: 600;
    text-decoration: none;
  }

  a:hover {
    background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  }
`

const Section = styled.section`
  h2 {
    font-size: 1.5rem;
    margin-bottom: var(--space-sm);
    color: var(--color-text);
  }
  p {
    color: var(--color-body);
    margin-bottom: var(--space-lg);
    line-height: 1.6;
  }
`

const GameWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  padding-bottom: 1.5rem;
`
