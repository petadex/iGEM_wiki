import React, { useState, useRef, useEffect } from "react"
import styled, { keyframes, css } from "styled-components"

/**
 * EnzymeBattle
 * -------------------------------------------------------------
 * The petamon vs PET battle game.
 *
 * GAME RULES
 * - 11 enzymes, 8 plastic types.
 * - Each enzyme has exactly one plastic type it "counters":
 *     - it deals bonus damage to that plastic type
 *     - it takes reduced damage from that plastic type
 * - Battles are turn-based: you attack, then the
 *   plastic attacks back, until one side's HP hits 0.
 */
/* ---------------------------------- game data ---------------------------------- */

const ADVANTAGE_ATK_MULT = 1.6 // bonus damage dealt to the countered plastic
const ADVANTAGE_DEF_MULT = 0.6 // damage taken from the countered plastic

const PLASTICS = [
  { key: "PET1", name: "PET 1", color: "#e8c9c9", hp: 90, atk: 11 },
  { key: "PET2", name: "PET 2", color: "#cfe3f5", hp: 105, atk: 10 },
  { key: "PET3", name: "PET 3", color: "#d5e8cc", hp: 85, atk: 12 },
  { key: "PET4", name: "PET 4", color: "#f5e6ac", hp: 100, atk: 13 },
  { key: "PET5", name: "PET 5", color: "#e6d5f5", hp: 75, atk: 10 },
  { key: "PET6", name: "PET 6", color: "#f5d5c9", hp: 110, atk: 9 },
  { key: "PET7", name: "PET 7", color: "#c9f5e0", hp: 95, atk: 11 },
  { key: "PET8", name: "PET 8", color: "#d9d9f5", hp: 90, atk: 12 },
]

const ENZYMES = [
  { key: "A", name: "Enzyme A", counter: "PET1", hp: 100, atk: 14, desc: "Specialized against PET 1." },
  { key: "B", name: "Enzyme B", counter: "PET1", hp: 95, atk: 15, desc: "Specialized against PET 1." },
  { key: "C", name: "Enzyme C", counter: "PET1", hp: 105, atk: 16, desc: "Specialized against PET 1." },
  { key: "D", name: "Enzyme D", counter: "PET1", hp: 90, atk: 13, desc: "Specialized against PET 1." },
  { key: "E", name: "Enzyme E", counter: "PET2", hp: 110, atk: 12, desc: "Specialized against PET 2." },
  { key: "F", name: "Enzyme F", counter: "PET3", hp: 100, atk: 13, desc: "Specialized against PET 3." },
  { key: "G", name: "Enzyme G", counter: "PET5", hp: 95, atk: 14, desc: "Specialized against PET 5." },
  { key: "H", name: "Enzyme H", counter: "PET7", hp: 100, atk: 13, desc: "Specialized against PET 7." },
  { key: "I", name: "Enzyme I", counter: "PET7", hp: 90, atk: 15, desc: "Specialized against PET 7." },
  { key: "J", name: "Enzyme J", counter: "PET6", hp: 115, atk: 11, desc: "Specialized against PET 6." },
  { key: "K", name: "Enzyme K", counter: "PET8", hp: 100, atk: 14, desc: "Specialized against PET 8." },
]

const randRange = (min, max) => Math.random() * (max - min) + min

function rollDamage(baseAtk, isAdvantageAttacker, isAdvantageDefender) {
  let dmg = baseAtk * randRange(0.85, 1.15)
  if (isAdvantageAttacker) dmg *= ADVANTAGE_ATK_MULT
  if (isAdvantageDefender) dmg *= ADVANTAGE_DEF_MULT
  return Math.max(1, Math.round(dmg))
}

const SCREENS = {
  SELECT: "select",
  BATTLE: "battle",
  RESULT: "result",
}

export default function EnzymeBattle({ isOpen, onClose }) {
  const [screen, setScreen] = useState(SCREENS.BATTLE)
  const [enzyme, setEnzyme] = useState(null)
  const [plastic, setPlastic] = useState(null)
  const [enzymeHp, setEnzymeHp] = useState(0)
  const [plasticHp, setPlasticHp] = useState(0)
  const [log, setLog] = useState([])
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState(null)
  const logEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      const chosenPlastic = PLASTICS[Math.floor(Math.random() * PLASTICS.length)]
      setScreen(SCREENS.BATTLE)
      setEnzyme(null)
      setPlastic(chosenPlastic)
      setEnzymeHp(0)
      setPlasticHp(chosenPlastic.hp)
      setLog([`A wild ${chosenPlastic.name} sample appears! Select an enzyme to begin.`])
      setBusy(false)
      setOutcome(null)
    }
  }, [isOpen])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" })
  }, [log])

  const openSelect = () => {
    setScreen(SCREENS.SELECT)
  }

  const selectEnzyme = (chosenEnzyme) => {
    setEnzyme(chosenEnzyme)
    setEnzymeHp(chosenEnzyme.hp)
    setOutcome(null)
    setLog((currentLog) => [
      ...currentLog,
      `${chosenEnzyme.name} enters the battle against ${plastic.name}.`,
    ])
    setScreen(SCREENS.BATTLE)
  }

  const startNewBattle = () => {
    const chosenPlastic = PLASTICS[Math.floor(Math.random() * PLASTICS.length)]
    setScreen(SCREENS.BATTLE)
    setEnzyme(null)
    setPlastic(chosenPlastic)
    setEnzymeHp(0)
    setPlasticHp(chosenPlastic.hp)
    setLog([`A wild ${chosenPlastic.name} sample appears! Select an enzyme to begin.`])
    setBusy(false)
    setOutcome(null)
  }

  const attack = () => {
    if (busy || !enzyme || !plastic) return
    setBusy(true)

    const enzymeHasAdvantage = enzyme.counter === plastic.key
    const enzymeDmg = rollDamage(enzyme.atk, enzymeHasAdvantage, false)
    const nextPlasticHp = Math.max(0, plasticHp - enzymeDmg)

    setPlasticHp(nextPlasticHp)
    setLog((l) => [
      ...l,
      `${enzyme.name} attacks for ${enzymeDmg} damage${enzymeHasAdvantage ? " — super effective!" : ""}`,
    ])

    if (nextPlasticHp <= 0) {
      setLog((l) => [...l, `${plastic.name} breaks down completely. ${enzyme.name} wins!`])
      setOutcome("win")
      setTimeout(() => {
        setScreen(SCREENS.RESULT)
        setBusy(false)
      }, 700)
      return
    }

    setTimeout(() => {
      const plasticDmg = rollDamage(plastic.atk, false, enzymeHasAdvantage)
      const nextEnzymeHp = Math.max(0, enzymeHp - plasticDmg)
      setEnzymeHp(nextEnzymeHp)
      setLog((l) => [
        ...l,
        `${plastic.name} strikes back for ${plasticDmg} damage${
          enzymeHasAdvantage ? " — resisted!" : ""
        }`,
      ])

      if (nextEnzymeHp <= 0) {
        setLog((l) => [...l, `${enzyme.name} is deactivated. ${plastic.name} wins this round.`])
        setOutcome("lose")
        setTimeout(() => {
          setScreen(SCREENS.RESULT)
          setBusy(false)
        }, 700)
      } else {
        setBusy(false)
      }
    }, 550)
  }

  if (!isOpen) return null

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="Enzyme battle">
      <Panel>
        <CloseButton type="button" aria-label="Close battle" onClick={onClose}>
          ×
        </CloseButton>

        {screen === SCREENS.SELECT && (
          <>
            <PanelTitle>Choose your PETase</PanelTitle>
            <PanelSubtitle>
              Each PETase deals bonus damage to its counter plastic type.
            </PanelSubtitle>
            <EnzymeGrid>
              {ENZYMES.map((e) => (
                <EnzymeCard key={e.key} type="button" onClick={() => selectEnzyme(e)}>
                  <EnzymeCardName>{e.name}</EnzymeCardName>
                  <EnzymeCounterTag>
                    vs <strong>{e.counter}</strong>
                  </EnzymeCounterTag>
                  <EnzymeCardStats>
                    HP {e.hp} · ATK {e.atk}
                  </EnzymeCardStats>
                  <EnzymeCardDesc>{e.desc}</EnzymeCardDesc>
                </EnzymeCard>
              ))}
            </EnzymeGrid>
          </>
        )}

        {screen === SCREENS.BATTLE && plastic && (
          <BattleLayout>
            <Fighters>
              <FighterCard>
                {enzyme ? (
                  <>
                    <SpriteBox aria-hidden="true">
                      <SpriteBoxLabel>{enzyme.name}</SpriteBoxLabel>
                    </SpriteBox>
                    <FighterName>{enzyme.name}</FighterName>
                    <HpBar>
                      <HpFill
                        style={{ width: `${(enzymeHp / enzyme.hp) * 100}%` }}
                        $low={enzymeHp / enzyme.hp < 0.3}
                      />
                    </HpBar>
                    <HpLabel>
                      {enzymeHp} / {enzyme.hp} HP
                    </HpLabel>
                    {enzyme.counter === plastic.key && (
                      <AdvantageTag>Advantage vs {plastic.name}</AdvantageTag>
                    )}
                  </>
                ) : (
                  <EmptyFighter>
                    <EmptySprite aria-hidden="true">?</EmptySprite>
                    <FighterName>No enzyme selected</FighterName>
                    <EmptyHint>Choose an enzyme to enter the battle.</EmptyHint>
                  </EmptyFighter>
                )}
              </FighterCard>

              <Versus>VS</Versus>

              <FighterCard>
                <SpriteBox aria-hidden="true" style={{ background: `${plastic.color}33` }}>
                  <SpriteBoxLabel>{plastic.name}</SpriteBoxLabel>
                </SpriteBox>
                <FighterName style={{ color: plastic.color }}>{plastic.name}</FighterName>
                <HpBar>
                  <HpFill
                    style={{ width: `${(plasticHp / plastic.hp) * 100}%` }}
                    $low={plasticHp / plastic.hp < 0.3}
                    $plastic
                  />
                </HpBar>
                <HpLabel>
                  {plasticHp} / {plastic.hp} HP
                </HpLabel>
              </FighterCard>
            </Fighters>

            <LogBox>
              {log.map((line, i) => (
                <LogLine key={i}>{line}</LogLine>
              ))}
              <div ref={logEndRef} />
            </LogBox>

            {enzyme ? (
              <AttackButton type="button" onClick={attack} disabled={busy}>
                {busy ? "…" : "Attack"}
              </AttackButton>
            ) : (
              <AttackButton type="button" onClick={openSelect}>
                Select enzyme
              </AttackButton>
            )}
          </BattleLayout>
        )}

        {screen === SCREENS.RESULT && enzyme && plastic && (
          <ResultLayout>
            <ResultTitle $win={outcome === "win"}>
              {outcome === "win" ? "Victory!" : "Defeated"}
            </ResultTitle>
            <ResultBody>
              {outcome === "win"
                ? `${enzyme.name} fully broke down the ${plastic.name} sample.`
                : `${enzyme.name} ran out of activity before finishing off the ${plastic.name} sample.`}
            </ResultBody>
            <ResultActions>
              <SecondaryButton type="button" onClick={startNewBattle}>
                Battle again
              </SecondaryButton>
              <SecondaryButton type="button" onClick={onClose}>
                Return home
              </SecondaryButton>
            </ResultActions>
          </ResultLayout>
        )}
      </Panel>
    </Overlay>
  )
}

/* ---------------------------------- styling ---------------------------------- */

const pop = keyframes`
  from { transform: scale(0.96); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md, 1rem);
  z-index: 999999;
`

const Panel = styled.div`
  position: relative;
  width: 100%;
  max-width: 46rem;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 10px;
  padding: var(--space-lg, 1.5rem);
  animation: ${pop} 0.15s ease-out;
`

const CloseButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--color-border, #ccc);
  background: rgba(0, 0, 0, 0.03);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
`

const PanelTitle = styled.h2`
  color: var(--color-text, #222) !important;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
`

const PanelSubtitle = styled.p`
  color: var(--color-muted, #666);
  font-size: 0.95rem;
  margin: 0 0 var(--space-md, 1rem);
`

const EnzymeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 0.75rem;
`

const EnzymeCard = styled.button`
  text-align: left;
  border: 1px solid var(--color-border, #ccc);
  border-radius: 8px;
  padding: 0.75rem;
  background: rgba(123, 47, 214, 0.04);
  cursor: pointer;

  &:hover {
    background: rgba(123, 47, 214, 0.1);
    border-color: var(--color-accent, #7b2fd6);
  }
`

const EnzymeCardName = styled.div`
  font-weight: 700;
  color: var(--color-text, #222);
  margin-bottom: 0.15rem;
`

const EnzymeCounterTag = styled.div`
  font-size: 0.8rem;
  color: var(--color-accent, #7b2fd6);
  margin-bottom: 0.35rem;
`

const EnzymeCardStats = styled.div`
  font-size: 0.75rem;
  color: var(--color-muted, #666);
  margin-bottom: 0.35rem;
`

const EnzymeCardDesc = styled.div`
  font-size: 0.78rem;
  color: var(--color-muted, #666);
  line-height: 1.3;
`

const BattleLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 1rem);
`

const Fighters = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md, 1rem);
`

const FighterCard = styled.div`
  flex: 1 1 0;
  min-width: 0;
`

const EmptyFighter = styled.div`
  text-align: center;
`

const EmptySprite = styled.div`
  width: 96px;
  height: 96px;
  margin: 0 auto 0.5rem;
  border: 2px dashed var(--color-border, #aaa);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.025);
  color: var(--color-muted, #777);
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 700;
`

const EmptyHint = styled.p`
  margin: 0;
  color: var(--color-muted, #666);
  font-size: 0.78rem;
  line-height: 1.35;
`

/** Placeholder for a future petamon illustration */
const SpriteBox = styled.div`
  width: 96px;
  height: 96px;
  margin: 0 auto 0.5rem;
  border: 2px dashed var(--color-border, #ccc);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
`

const SpriteBoxLabel = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-muted, #666);
  padding: 0 4px;
`

const FighterName = styled.div`
  font-weight: 700;
  color: var(--color-text, #222);
  margin-bottom: 0.35rem;
`

const HpBar = styled.div`
  height: 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
`

const HpFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: ${({ $low, $plastic }) => ($low ? "#d64545" : $plastic ? "#8a8f98" : "#3fb56f")};
  transition: width 0.4s ease-in-out, background 0.3s ease;
`

const HpLabel = styled.div`
  font-size: 0.75rem;
  color: var(--color-muted, #666);
  margin-top: 0.2rem;
`

const AdvantageTag = styled.div`
  margin-top: 0.35rem;
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  color: #3fb56f;
  border: 1px solid #3fb56f;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
`

const Versus = styled.div`
  flex: none;
  font-weight: 700;
  color: var(--color-muted, #666);
`

const LogBox = styled.div`
  height: 110px;
  overflow-y: auto;
  border: 1px solid var(--color-border, #ccc);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  font-size: 0.85rem;
  color: var(--color-text, #222);
`

const LogLine = styled.div`
  padding: 0.15rem 0;
`

const AttackButton = styled.button`
  align-self: center;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.6rem 2.5rem;
  border-radius: 999px;
  border: none;
  background: var(--color-accent, #7b2fd6);
  color: #fff;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  &:not(:disabled):hover {
    filter: brightness(1.08);
  }
`

const ResultLayout = styled.div`
  text-align: center;
  padding: var(--space-md, 1rem) 0;
`

const ResultTitle = styled.h2`
  font-size: 1.6rem;
  font-weight: 800;
  color: ${({ $win }) => ($win ? "#3fb56f" : "#d64545")} !important;
  margin: 0 0 0.5rem;
`

const ResultBody = styled.p`
  color: var(--color-muted, #666);
  margin: 0 0 var(--space-md, 1rem);
`

const ResultActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
`

const SecondaryButton = styled.button`
  padding: 0.55rem 1.25rem;
  border-radius: 999px;
  border: 1px solid var(--color-border, #ccc);
  background: #fff;
  color: var(--color-text, #222);
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
`
