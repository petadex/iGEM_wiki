import React from "react"
import styled, { css } from "styled-components"
import { ContributionTimeline } from "../contributionCalendar/ContributionTimeline.js"
import { HardwareNotebookSandbox } from "../hardwareNotebook/HardwareNotebookSandbox.js"
import { InteractiveGizmo } from "./interactive/InteractiveGizmo.js"

export const Callout = ({ tone = "note", title, children }) => (
  <CalloutBox $tone={tone}>
    {title && <CalloutTitle>{title}</CalloutTitle>}
    <CalloutBody>{children}</CalloutBody>
  </CalloutBox>
)

export const Figure = ({ src, alt = "", caption, credit, children }) => (
  <FigureWrap>
    {src && <img src={src} alt={alt} />}
    {children}
    {(caption || credit) && (
      <figcaption>
        {caption && <span>{caption}</span>}
        {credit && <small>{credit}</small>}
      </figcaption>
    )}
  </FigureWrap>
)

export const ImageGrid = ({ children }) => <GridWrap>{children}</GridWrap>

export const DataTable = ({ caption, children }) => (
  <DataTableWrap>
    {caption && <TableCaption>{caption}</TableCaption>}
    {children}
  </DataTableWrap>
)

export const mdxComponents = {
  Callout,
  Figure,
  ImageGrid,
  DataTable,
  ContributionTimeline,
  HardwareNotebookSandbox,
  InteractiveGizmo,
}

const toneStyles = {
  note: css`
    --callout-accent: var(--color-accent);
  `,
  success: css`
    --callout-accent: #5bd47a;
  `,
  warning: css`
    --callout-accent: #f2b84b;
  `,
}

const CalloutBox = styled.aside`
  max-width: 48rem;
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--color-border);
  border-left: 5px solid var(--callout-accent);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.24);
  ${({ $tone }) => toneStyles[$tone] || toneStyles.note}
`

const CalloutTitle = styled.p`
  color: var(--color-text) !important;
  font-weight: 700;
  margin-bottom: var(--space-xs);
`

const CalloutBody = styled.div`
  > * + * {
    margin-top: var(--space-sm);
  }

  p {
    color: var(--color-muted);
  }
`

const FigureWrap = styled.figure`
  max-width: 54rem;
  margin: var(--space-lg) 0;

  img {
    width: 100%;
    border: 1px solid var(--color-border);
    background: rgba(255, 255, 255, 0.28);
  }

  figcaption {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem var(--space-sm);
    margin-top: var(--space-sm);
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  figcaption span {
    color: var(--color-text);
  }

  figcaption small {
    font: inherit;
  }
`

const GridWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-md);
  max-width: 54rem;
  margin: var(--space-lg) 0;

  figure {
    margin: 0;
  }
`

const DataTableWrap = styled.div`
  max-width: 54rem;
  overflow-x: auto;
  margin: var(--space-lg) 0;
`

const TableCaption = styled.p`
  color: var(--color-text) !important;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: var(--space-sm);
`
