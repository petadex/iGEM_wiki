import React, { useId, useState } from "react"
import styled from "styled-components"
import { ENGINEERING_ART, ENGINEERING_TEAMS } from "../../data/engineeringCycles.js"
import { CycleContent } from "./CycleContent.js"
import { ENGINEERING_CONTENT } from "./contentRegistry.js"
import DefaultContent from "../../content/wiki/project/engineering/_template.mdx"
import { EngineeringArtwork } from "./EngineeringArtwork.js"

export function EngineeringExplorer({ teams = ENGINEERING_TEAMS, art = ENGINEERING_ART }) {
  const id = useId()
  const [teamId, setTeamId] = useState(teams[0].id)
  const [versions, setVersions] = useState({})
  const team = teams.find(item => item.id === teamId) || teams[0]
  const versionIndex = Math.min(versions[team.id] || 0, team.versions.length - 1)
  const version = team.versions[versionIndex]

  const selectVersion = (selectedTeam, index) => {
    setTeamId(selectedTeam.id)
    setVersions(previous => ({ ...previous, [selectedTeam.id]: index }))
  }

  return (
    <Explorer>
      <TeamNav aria-label="Engineering subteams">
        {teams.map(item => {
          const selected = team.id === item.id
          return (
            <TeamChoice key={item.id} $fullWidth={item.fullWidth}>
              <TeamButton type="button" $color={item.color} $hasImage={Boolean(item.barImage || item.barCrop)} aria-pressed={selected}
                aria-controls={`${id}-content`} onClick={() => setTeamId(item.id)}>
                {item.buttonCrop && art.combinedButtonsImage ? (
                  <CombinedButtonArt style={{ aspectRatio: `${item.buttonCrop[2]} / ${item.buttonCrop[3]}` }}>
                    <EngineeringArtwork src={art.combinedButtonsImage} crop={item.buttonCrop} />
                    <CombinedLabel className="team-bar" $dark={item.id === "entrepreneurship-outreach"}
                      style={{
                        left: `${(item.barCrop[0] - item.buttonCrop[0]) / item.buttonCrop[2] * 100}%`,
                        top: `${(item.barCrop[1] - item.buttonCrop[1]) / item.buttonCrop[3] * 100}%`,
                        width: `${item.barCrop[2] / item.buttonCrop[2] * 100}%`,
                        height: `${item.barCrop[3] / item.buttonCrop[3] * 100}%`,
                      }}>
                      {item.label}
                    </CombinedLabel>
                  </CombinedButtonArt>
                ) : <>
                {item.petamonCrop && <PetamonArt $fullWidth={item.fullWidth} $offsetX={item.petamonOffsetX} $overlap={item.petamonOverlap}>
                  <EngineeringArtwork src={art.petamonImage} crop={item.petamonCrop} preserveAspectRatio="xMidYMax meet" />
                </PetamonArt>}
                <Bar $painted={Boolean(item.barCrop)} $dark={item.id === "entrepreneurship-outreach"}
                  $aspect={item.barCrop ? item.barCrop[2] / item.barCrop[3] : undefined}>
                  {item.barCrop ? <EngineeringArtwork src={art.buttonsImage} crop={item.barCrop} preserveAspectRatio="none" />
                    : item.barImage ? <img src={item.barImage} alt="" /> : null}
                  <span>{item.label}</span>
                </Bar>
                </>}
              </TeamButton>
              <Dots aria-label={`${item.label} versions`}>
                {item.versions.map((iteration, index) => (
                  <Dot key={iteration.id} type="button" $color={item.color} $artwork={Boolean(art.gearImage)}
                    aria-label={`${item.label}, ${iteration.label}`}
                    aria-pressed={selected && versionIndex === index}
                    aria-controls={`${id}-content`} title={iteration.label}
                    onClick={() => selectVersion(item, index)}>
                    {art.gearImage ? <GearArt>
                      <EngineeringArtwork src={selected && versionIndex === index ? art.highlightedGearImage : art.gearImage} crop={art.gearCrop} />
                    </GearArt> : <span />}
                  </Dot>
                ))}
              </Dots>
            </TeamChoice>
          )
        })}
      </TeamNav>

      <SelectionHeader>
        <TeamTitle id={`${id}-title`}>{team.label}</TeamTitle>
        <VersionNav aria-label="Version navigation">
          <Arrow type="button" aria-label="Previous version" disabled={versionIndex === 0}
            onClick={() => selectVersion(team, versionIndex - 1)}>←</Arrow>
          <VersionLabel role="status" aria-live="polite">{version.label} <small>of {team.versions.length}</small></VersionLabel>
          <Arrow type="button" aria-label="Next version" disabled={versionIndex === team.versions.length - 1}
            onClick={() => selectVersion(team, versionIndex + 1)}>→</Arrow>
        </VersionNav>
      </SelectionHeader>

      <CycleContent key={`${team.id}-${version.id}`} Content={ENGINEERING_CONTENT[team.id]?.[versionIndex] || DefaultContent}
        panelId={`${id}-content`} titleId={`${id}-title`} art={{ ...art, centerImage: team.centerImage || art.centerImage, centerCrop: team.centerCrop, centerBounds: team.centerBounds, centerAlt: `${team.label} Petamon`, links: team.links }} />
    </Explorer>
  )
}


const Explorer = styled.div`
  color: #3e3128;
  width: 100%;
  min-width: 0;
  button { font: inherit; cursor: pointer; }
  button:focus-visible { outline: 3px solid #805340; outline-offset: 3px; }
`
const TeamNav = styled.nav`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  @media (max-width: 620px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`
const TeamChoice = styled.div`
  min-width: 0;
  ${({ $fullWidth }) => $fullWidth && `grid-column: 1 / -1; margin-top: 0.5rem;`}
`
const TeamButton = styled.button`
  position: relative;
  transition: transform 180ms ease;
  &:focus-visible, &[aria-pressed="true"] {
    transform: translateY(-5px) scale(1.02);
  }
  @media (hover: hover) {
    &:hover {
      transform: translateY(-5px) scale(1.02);
      }
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-height: 3.6rem;
  padding: 0.6rem 0.35rem;
  border: 2px solid ${({ $color }) => $color};
  border-radius: 2px;
  background: #fffaf3;
  color: #3e3128;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  &[aria-pressed="true"] { background: ${({ $color }) => $color}; color: white; box-shadow: 0 3px 0 #dfc9ad; }
  ${({ $hasImage, $color }) => $hasImage && `
    padding: 0;
    border: 0;
    background: transparent;
    &[aria-pressed="true"] { background: transparent; box-shadow: none; }
    &[aria-pressed="true"] .team-bar { outline: 2px solid ${$color}; outline-offset: 2px; }
  `}
`
const CombinedButtonArt = styled.div`
  position: relative;
  width: 100%;
  pointer-events: none;
`
const CombinedLabel = styled.span`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0.2rem;
  color: ${({ $dark }) => $dark ? "#ffffff" : "#263b34"};
  font-size: clamp(0.68rem, 1.4vw, 0.95rem);
  line-height: 1.2;
`
const PetamonArt = styled.div`
  width: 100%;
  height: clamp(5rem, 12vw, 8.5rem);
  margin-bottom: ${({ $overlap }) => $overlap || "-10px"};
  transform: translateX(${({ $offsetX }) => $offsetX || "0"});
  position: relative;
  z-index: 1;
  pointer-events: none;
  mix-blend-mode: multiply;
  ${({ $fullWidth }) => $fullWidth && `height: clamp(5rem, 14vw, 9rem);`}
`
const Bar = styled.div.attrs({ className: "team-bar" })`
  display: grid;
  align-items: center;
  justify-items: stretch;
  min-height: 3rem;
  aspect-ratio: ${({ $aspect }) => $aspect || "auto"};
  width: 100%;
  svg, img, span { grid-area: 1 / 1; }
  svg { height: 100%; min-width: 0; }
  img { width: 100%; height: auto; }
  span { position: relative; z-index: 1; padding: 0.3rem; font-size: clamp(0.68rem, 1.4vw, 0.95rem); line-height: 1.2; }
  ${({ $painted, $dark }) => $painted && `color: ${$dark ? "#ffffff" : "#263b34"};`}
`
const Dots = styled.div`display: flex; flex-wrap: wrap; justify-content: center; margin-top: 0.25rem;`
const Dot = styled.button`
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border: 0;
  background: transparent;
  padding: 0;
  span { width: 0.6rem; height: 0.6rem; border-radius: 50%; border: 1px solid ${({ $color }) => $color}; background: #f0e7dc; }
  &[aria-pressed="true"] span { background: ${({ $color }) => $color}; box-shadow: 0 0 0 3px #fffaf3, 0 0 0 4px ${({ $color }) => $color}; }
  ${({ $artwork }) => $artwork && `width: 2.75rem; height: 2.75rem;`}
`
const GearArt = styled.div`width: 1.65rem; height: 1.65rem;`
const SelectionHeader = styled.header`text-align: center; margin: 1.6rem 0;`
const TeamTitle = styled.h2`
  && { margin: 0; padding: 0; border: 0; color: #805340; font-size: clamp(1.6rem, 4vw, 2.5rem); }
`
const VersionNav = styled.div`display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 0.65rem;`
const VersionLabel = styled.span`font-weight: 600; small { font-weight: 400; }`
const Arrow = styled.button`
  width: 2.75rem; height: 2.75rem; border: 1px solid #b89773; border-radius: 50%; background: #fffaf3; color: #594632;
  &:disabled { opacity: 0.35; cursor: default; }
`
