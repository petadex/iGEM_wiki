import React, { useId, useState } from "react"
import styled from "styled-components"
import members from "../data/attributions.json"
import external from "../data/externalAttributions.json"

// From the attributions spreadsheet: its Team Members and External
// Contributions tabs.
const people = [...members, ...external]
const GROUPS = [
  ["Current", "Current members"],
  ["Former", "Former members"],
  ["Contributor", "Other contributors"],
  ["Institution", "Supporting institutions and sponsors"],
]

export function AttributionCards() {
  const searchId = useId()
  const [query, setQuery] = useState("")
  const term = query.trim().toLocaleLowerCase()
  const matches = people.filter(person =>
    [person.name, person.role, person.type, ...person.tasks, person.specificTasks]
      .join(" ").toLocaleLowerCase().includes(term),
  )

  return (
    <Directory>
      <SearchLabel htmlFor={searchId}>Find a contributor</SearchLabel>
      <Search id={searchId} type="search" value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="Search by name, role, or task" />
      <ResultCount role="status">{matches.length} of {people.length} contributors</ResultCount>
      {matches.length === 0 && <p>No contributors match your search. Try another name or task.</p>}
      {GROUPS.map(([section, title]) => {
        const group = matches.filter(person => person.section === section)
        if (!group.length) return null
        return (
          <section key={section} aria-label={title}>
            <GroupTitle>{title}</GroupTitle>
            <Grid>
              {group.map(person => <AttributionCard key={person.id} person={person} />)}
            </Grid>
          </section>
        )
      })}
    </Directory>
  )
}

export function AttributionCard({ person }) {
  const headingId = useId()
  // Keep the original wording, separating numbered tasks for readability.
  const specificTasks = person.specificTasks.split(/(?=\(\d+\)\s)/).filter(text => text.trim())
  return (
    <Card aria-labelledby={headingId}>
      <Name id={headingId}>{person.name}</Name>
      {/* Outside the team, with the kind of institution they're from. */}
      <Role>{person.type ? `${person.role} · ${person.type}` : person.role}</Role>
      <TaskLabel>Tasks</TaskLabel>
      <Tags aria-label="Tasks">
        {person.tasks.map(task => <li key={task}>{task}</li>)}
      </Tags>
      <Details>
        <summary>Specific tasks</summary>
        {specificTasks.map((text, index) => <p key={index}>{text}</p>)}
      </Details>
    </Card>
  )
}

const Directory = styled.div`
  width: 100%;
  min-width: 0;
  color: #352c3c;
`
const SearchLabel = styled.label`
  display: block;
  font-weight: 700;
  margin-bottom: 0.5rem;
`
const Search = styled.input`
  width: 100%;
  min-width: 0;
  padding: 0.8rem 1rem;
  border: 1px solid #8a7182;
  border-radius: 0.6rem;
  background: #fff;
  color: #352c3c;
  font: inherit;
  &:focus-visible { outline: 3px solid #8a4f60; outline-offset: 3px; }
`
const ResultCount = styled.p`
  font-size: 0.9rem;
  margin: 0.6rem 0 1.5rem;
`
const GroupTitle = styled.h2`
  && { color: #584960; margin: 2rem 0 1rem; }
`
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
  gap: 1rem;
  align-items: start;
`
const Card = styled.article`
  min-width: 0;
  padding: clamp(1rem, 3vw, 1.5rem);
  background: #fff;
  border: 1px solid #dfc8be;
  border-top: 4px solid #ebb9a0;
  border-radius: 0.8rem;
  box-shadow: 0 3px 12px rgba(79, 65, 89, 0.07);
  overflow-wrap: anywhere;
`
/* Tripled: the scene's text box sets h3 margins with a doubled class. */
const Name = styled.h3`
  &&& { margin: 0 0 0.35rem; padding: 0; border: 0; color: #4f4159; font-size: 1.3rem; line-height: 1.3; }
`
const Role = styled.p`
  && { margin: 0 0 1rem; font-size: 0.95rem; font-weight: 600; color: #714653; }
`
const TaskLabel = styled.p`
  && { margin: 0 0 0.5rem; font-size: 0.85rem; font-weight: 700; }
`
const Tags = styled.ul`
  && { display: flex; flex-wrap: wrap; gap: 0.4rem; list-style: none; padding: 0; margin: 0 0 1rem; }
  && li { margin: 0; padding: 0.25rem 0.6rem; border-radius: 0.4rem; background: #f7e8df; font-size: 0.8rem; line-height: 1.4; }
`
const Details = styled.details`
  border-top: 1px solid #eadbd4;
  padding-top: 0.7rem;
  summary { cursor: pointer; font-weight: 700; padding: 0.3rem 0; }
  summary:focus-visible { outline: 3px solid #8a4f60; outline-offset: 3px; }
  && p { font-size: 0.95rem; line-height: 1.65; margin: 0.8rem 0 0; white-space: pre-wrap; }
`
