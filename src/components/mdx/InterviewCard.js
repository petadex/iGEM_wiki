import React from "react"
import styled from "styled-components"

export function InterviewCard({ name, role, context, photo, photoAlt, minutesLabel, minutesUrl, children }) {
  return (
    <Card>
      <Header>
        {photo && <Portrait src={photo} alt={photoAlt || name} loading="lazy" />}
        <div>
          <h3>{name}</h3>
          {role && <Role>{role}</Role>}
        </div>
      </Header>
      {context && <p><strong>What we hoped to learn:</strong> {context}</p>}
      {minutesLabel && <p><strong>Meeting minutes:</strong>{" "}
        {minutesUrl ? <a href={minutesUrl}>{minutesLabel}</a> : minutesLabel}
      </p>}
      {children && <div><strong>Interview takeaways</strong>{children}</div>}
    </Card>
  )
}

const Card = styled.section`
  margin: 1.5rem 0;
  padding: clamp(1rem, 3vw, 1.75rem);
  border: 1px solid var(--color-border, #9ab8c4);
  border-left: 5px solid var(--color-accent, #7966bd);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  overflow-wrap: anywhere;
  min-width: 0;
  & > * + * { margin-top: 1rem; }
  ul { padding-left: 1.4rem; }
`
const Header = styled.header`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  & > div { flex: 1 1 12rem; min-width: 0; }
  h3 { margin: 0; }
`
const Portrait = styled.img`
  width: 6rem;
  height: 6rem;
  object-fit: cover;
  border-radius: 50%;
  flex: none;
`
const Role = styled.p`
  margin: 0.35rem 0 0;
  font-weight: 600;
  color: var(--color-accent, #7966bd);
`
