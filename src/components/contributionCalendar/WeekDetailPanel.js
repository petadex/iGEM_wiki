import React from "react"
import { Link } from "gatsby"
import styled from "styled-components"
import {
  SUBTEAM_BY_ID,
  SUBTEAM_TRACKS,
  trackColor,
} from "../../data/subteamTracks.js"
import { formatDayShort } from "../../data/contributionCalendar/calendarUtils.js"

export function WeekDetailPanel({ week, activeIds }) {
  if (!week) {
    return (
      <PanelRoot>
        <EmptyText>Select a week on the calendar to view progress.</EmptyText>
      </PanelRoot>
    )
  }

  return (
    <PanelRoot>
      <OverviewCard>
        <OverviewLabel>Team overview</OverviewLabel>
        <p>{week.overview}</p>
      </OverviewCard>

      {/* In full here: the calendar cells only have room for a few words. */}
      {week.milestones.length > 0 && (
        <OverviewCard>
          <OverviewLabel>Milestones this week</OverviewLabel>
          <MilestoneList>
            {[...week.milestones]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((ms) => {
              const track = SUBTEAM_BY_ID[ms.subteamId]
              return (
                <MilestoneItem key={`${ms.date}-${ms.label}`}>
                  <MilestoneDot
                    aria-hidden
                    style={{ background: track ? trackColor(track) : "currentColor" }}
                  />
                  <span>
                    <MilestoneMeta>
                      {formatDayShort(ms.date)}
                      {track ? ` · ${track.label}` : ""}
                    </MilestoneMeta>
                    {ms.label}
                  </span>
                </MilestoneItem>
              )
            })}
          </MilestoneList>
        </OverviewCard>
      )}

      <SubteamList>
        {SUBTEAM_TRACKS.filter((t) => activeIds.has(t.id)).map((track) => {
          const content = week.subteams[track.id]
          if (!content) return null
          const href = content.link || track.href
          return (
            <SubteamBlock key={track.id} $accent={trackColor(track)}>
              <SubteamHeader>{track.label}</SubteamHeader>
              <Summary>{content.summary}</Summary>
              {content.detail ? <Detail>{content.detail}</Detail> : null}
              <ReadMore to={href}>
                Read more on {track.label} →
              </ReadMore>
            </SubteamBlock>
          )
        })}
      </SubteamList>

      {activeIds.size === 0 && (
        <Hint>Turn on a subteam above to see its progress this week.</Hint>
      )}
    </PanelRoot>
  )
}

const PanelRoot = styled.div`
  padding: var(--space-md);
  background: var(--cal-surface, #fff);
  border: none;
  border-radius: 0;
  min-height: 100%;
`

const OverviewCard = styled.div`
  padding: var(--space-md);
  background: var(--cal-surface, #fff);
  border: 1px solid var(--cal-line, var(--color-border));
  border-radius: 6px;
  margin-bottom: var(--space-sm);

  /* Doubled up so a page's prose styles (around the calendar) don't win. */
  && p {
    font-size: 0.92rem;
    line-height: 1.65;
    color: var(--cal-ink, var(--color-text));
  }
`

const OverviewLabel = styled.p`
  &&& {
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--cal-accent, #2d9194);
    margin-bottom: var(--space-xs);
  }
`

const MilestoneList = styled.ul`
  &&& {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
`

const MilestoneItem = styled.li`
  &&& {
    display: flex;
    gap: 0.5rem;
    margin: 0;
    font-size: 0.86rem;
    line-height: 1.4;
    color: var(--cal-ink, var(--color-text));
  }
`

const MilestoneDot = styled.span`
  flex: none;
  width: 0.6rem;
  height: 0.6rem;
  margin-top: 0.3rem;
  border-radius: 50%;
`

const MilestoneMeta = styled.span`
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--cal-muted, var(--color-muted));
`

const SubteamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`

const SubteamBlock = styled.article`
  padding: var(--space-md);
  border-left: 4px solid ${({ $accent }) => $accent};
  background: color-mix(in srgb, ${({ $accent }) => $accent} 12%, var(--cal-surface, #fff));
  border-radius: 0 6px 6px 0;
`

const SubteamHeader = styled.h3`
  &&& {
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0 0 var(--space-xs);
    padding: 0;
    border: none;
    color: var(--cal-ink, var(--color-text));
  }
`

const Summary = styled.p`
  &&& {
    font-size: 0.88rem;
    font-weight: 600;
    line-height: 1.5;
    margin-bottom: 0.35rem;
    color: var(--cal-ink, var(--color-text));
  }
`

const Detail = styled.p`
  &&& {
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--cal-muted, var(--color-muted));
    margin-bottom: var(--space-sm);
    white-space: pre-line;
  }
`

const ReadMore = styled(Link)`
  &&& {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--cal-accent, #2d9194);
    text-decoration: none;
    background: none;
    border-bottom: 1px solid transparent;
  }

  &&&:hover {
    border-bottom-color: var(--cal-accent, #2d9194);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }
`

const EmptyText = styled.p`
  &&& {
    color: var(--cal-muted, var(--color-muted));
    font-size: 0.95rem;
    padding: var(--space-xl) 0;
    text-align: center;
  }
`

const Hint = styled.p`
  &&& {
    font-size: 0.85rem;
    color: var(--cal-muted, var(--color-muted));
    margin-top: var(--space-md);
  }
`

export default WeekDetailPanel
