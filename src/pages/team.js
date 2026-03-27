import React, { useCallback, useState } from "react"
import { graphql } from "gatsby"
import styled, { css } from "styled-components"
import WikiLayout from "../components/layout.js"

const photoSrc = (m) => m.photo || m.imageSrc || ""

const TeamPage = ({ data }) => {
  const members = data.allTeamCsv.nodes
  const [flipped, setFlipped] = useState(() => new Set())

  const toggle = useCallback((id) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <WikiLayout pageTitle="Team">
      <Intro>
        Loaded from{" "}
        <code>src/data/team/team.csv</code>, change w Google Sheets (as csv) later
      </Intro>

      <Grid>
        {members.map((m) => {
          const isFlipped = flipped.has(m.id)
          return (
            <FlipShell key={m.id}>
              <FlipInner $flipped={isFlipped}>
                <CardFaceFront
                  role="button"
                  tabIndex={isFlipped ? -1 : 0}
                  aria-hidden={isFlipped}
                  aria-expanded={isFlipped}
                  aria-label={`${m.Name}, ${m.role}. Show bio.`}
                  onClick={() => toggle(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggle(m.id)
                    }
                  }}
                >
                  {photoSrc(m) ? (
                    <Thumb src={photoSrc(m)} alt="" />
                  ) : (
                    <ThumbPlaceholder aria-hidden />
                  )}
                  <CardName>{m.Name}</CardName>
                  <CardRole>{m.role}</CardRole>
                  <Links aria-label="Links">
                    {m.linkedIn && (
                      <a
                        href={m.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        LinkedIn
                      </a>
                    )}
                    {m.email && (
                      <a
                        href={`mailto:${m.email}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Email
                      </a>
                    )}
                    {m.website && (
                      <a
                        href={m.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Website
                      </a>
                    )}
                  </Links>
                </CardFaceFront>

                <CardFaceBack
                  role="button"
                  tabIndex={isFlipped ? 0 : -1}
                  aria-hidden={!isFlipped}
                  aria-expanded={isFlipped}
                  aria-label={`${m.Name} bio. Click to flip back.`}
                  onClick={() => toggle(m.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      toggle(m.id)
                    }
                  }}
                >
                  <BackName>{m.Name}</BackName>
                  <BackBio>{m.description}</BackBio>
                  <Links aria-label="Links">
                    {m.linkedIn && (
                      <a
                        href={m.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        LinkedIn
                      </a>
                    )}
                    {m.email && (
                      <a
                        href={`mailto:${m.email}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Email
                      </a>
                    )}
                    {m.website && (
                      <a
                        href={m.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Website
                      </a>
                    )}
                  </Links>
                </CardFaceBack>
              </FlipInner>
            </FlipShell>
          )
        })}
      </Grid>
    </WikiLayout>
  )
}

export const query = graphql`
  query TeamMembers {
    allTeamCsv {
      nodes {
        id
        Name
        role
        description
        imageSrc
        linkedIn
        email
        website
        photo
      }
    }
  }
`

export default TeamPage

export const Head = () => <title>Team — iGEM Toronto 2026</title>

const Intro = styled.p`
  color: var(--color-muted);
  font-size: 0.95rem;
  margin-bottom: var(--space-lg);
  max-width: 42rem;

  code {
    font-family: var(--font-mono);
    font-size: 0.85em;
    color: var(--color-text);
  }
`

const Grid = styled.div`
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
`

const FlipShell = styled.div`
  perspective: 1000px;
`

const FlipInner = styled.div`
  position: relative;
  width: 100%;
  min-height: 22rem;
  transform-style: preserve-3d;
  transition: transform 0.55s ease;
  transform: rotateY(${({ $flipped }) => ($flipped ? 180 : 0)}deg);
`

const faceButton = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: var(--space-md);
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  border: 1px dashed var(--color-border);
  border-radius: 4px;
  background: var(--color-bg);
  overflow-y: auto;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const CardFaceFront = styled.div`
  ${faceButton}
`

const CardFaceBack = styled.div`
  ${faceButton}
  transform: rotateY(180deg);
`

const Thumb = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 2px;
  margin-bottom: var(--space-sm);
  flex-shrink: 0;
`

const ThumbPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 2px;
  margin-bottom: var(--space-sm);
  background: color-mix(in srgb, var(--color-border) 35%, transparent);
  flex-shrink: 0;
`

const CardName = styled.div`
  font-family: var(--font-display);
  font-size: 1.15rem;
  margin-bottom: var(--space-xs);
`

const CardRole = styled.div`
  color: var(--color-muted);
  font-size: 0.9rem;
  margin-bottom: var(--space-sm);
`

const BackName = styled.h2`
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 400;
  margin-bottom: var(--space-md);
`

const BackBio = styled.p`
  flex: 1;
  margin-bottom: var(--space-md);
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.55;
`

const Links = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  font-size: 0.85rem;
  margin-top: auto;

  a {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`
