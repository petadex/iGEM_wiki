import { HardwareIterations } from "../hardwareIterations/HardwareIterations.js"
import { HardwareMap } from "../hardwareIterations/HardwareMap.js"
import React from "react"
import { withPrefix } from "gatsby"
import styled, { css } from "styled-components"
import { BioreactorRequirements } from "../bioreactorRequirements/BioreactorRequirements.js"
import { BioreactorSimulator } from "../bioreactorSim/BioreactorSimulator.js"
import { ContributionTimeline } from "../contributionCalendar/ContributionTimeline.js"
import { DryLabCalendar } from "../dryLabCalendar/DryLabCalendar.js"
import { DryLabIterations } from "../dryLabCalendar/IterationLedger.js"
import { DryLabSeasonRibbon } from "../dryLabCalendar/DryLabSeasonRibbon.js"
import { DesignSketchbook } from "../designSketchbook/DesignSketchbook.js"
import { HardwareJournal } from "../hardwareJournal/HardwareJournal.js"
import { WetLabJournal } from "../wetLabJournal/WetLabJournal.js"
import { HardwareNotebookSandbox } from "../hardwareNotebook/HardwareNotebookSandbox.js"
import { HardwareArchitectureDiagram } from "../hardwareArchitecture/HardwareArchitectureDiagram.js"
import { PageTab, PageTabs } from "../PageTabs.js"
import AtlasMap from "../AtlasMap.js"
import PetadexGame from "../PetadexGame.js"
import { FeatureCard, FeatureCards } from "./FeatureCards.js"
import { Expandable } from "./ExpandWindow.js"
import { useFigureViewer, ViewableImage } from "./FigureViewer.js"
import { InteractiveGizmo } from "./interactive/InteractiveGizmo.js"
import { PetAssayAnimation } from "./interactive/PetAssayAnimation.js"
import {
  DatasetFlowchart,
  DatasetFlowchartFigure,
} from "./interactive/DatasetFlowchart.js"
import {
  ArchitectureFigure,
  DiamondSearchHero,
  MethodsLink,
} from "./interactive/DiamondSearch.js"
import { DiamondSearchDemo } from "./interactive/DiamondSearchDemo.js"
import { RecordCardDemo } from "./interactive/RecordCardDemo.js"
import { DatasetLoop, ModelDatasets } from "./interactive/ModelDatasets.js"
import { BiosampleViewer, ProfileShares, ProfileStack, ProfileSteps } from "./interactive/BiosampleProfiles.js"
import {
  EricksonSequences,
  PlasticomeCoverage,
  PlasticomeExplorer,
  PlasticomeFlow,
  PlasticomeStats,
} from "./interactive/PlasticomeCuration.js"
import { AntibioticSelectionAnimation, GfpBiosensorAnimation } from "./interactive/CopperReleaseAnimation.js"
import Dropdown, { CodeDropdown } from "../Dropdown.js";
import { embedComponents } from "./embeds.js"
import { PhotoGallery } from "./PhotoGallery.js"
import { Spreadsheet } from "./Spreadsheet.js"
import { useLinkTarget } from "./linkTarget.js"
import Citation from "../Citation"
import References from "../References"

export const Callout = ({ tone = "note", title, children }) => (
  <CalloutBox $tone={tone}>
    {title && <CalloutTitle>{title}</CalloutTitle>}
    <CalloutBody>{children}</CalloutBody>
  </CalloutBox>
)

/** The Project page's painted papers (on iGEM's uploads, by colour). */
const PAPER_ART = "https://static.igem.wiki/teams/6187/wiki/project/paper-"

/** Callouts on painted paper, side by side, a third of the text each. */
export const PaperCallouts = ({ children }) => <PaperRow>{children}</PaperRow>

/** One of them: `paper` is "peach", "mauve" or "blue". */
export const PaperCallout = ({ paper = "peach", title, children }) => (
  <PaperNote style={{ backgroundImage: `url(${PAPER_ART}${paper}.avif)` }}>
    {title && <PaperTitle>{title}</PaperTitle>}
    <CalloutBody>{children}</CalloutBody>
  </PaperNote>
)

/** Marks draft copy that still has to be replaced before the page is published. */
export const Placeholder = ({ label = "Placeholder text", children }) => (
  <PlaceholderBox>
    <PlaceholderLabel>{label}</PlaceholderLabel>
    <CalloutBody>{children}</CalloutBody>
  </PlaceholderBox>
)

// Root-relative srcs point into static/; withPrefix adds the /toronto path
// prefix the iGEM build is served under.
const figureSrc = src => (src.startsWith("/") ? withPrefix(src) : src)

// On the Dry Lab pages the image opens into the figure viewer with its
// caption; `expandable` overrides that either way for one figure, and
// `title` names it in the viewer's bar.
export const Figure = ({
  id,
  src,
  alt = "",
  title,
  caption,
  credit,
  width = "100%",
  expandable,
  children,
}) => {
  const viewer = useFigureViewer(expandable)
  return (
    <FigureWrap id={id} $width={typeof width === "number" ? `${width}px` : width}>
      {src &&
        (viewer ? (
          <ViewableImage src={figureSrc(src)} alt={alt} title={title} caption={caption} credit={credit} />
        ) : (
          <img src={figureSrc(src)} alt={alt} />
        ))}
      {children}
      {(caption || credit) && (
        <figcaption>
          {caption && <span>{caption}</span>}
          {credit && <small>{credit}</small>}
        </figcaption>
      )}
    </FigureWrap>
  )
}

// Markdown links to other wiki pages are root-relative too, so they need the
// same prefix. Protocol-relative (//) and hash-only links are left alone.
const MdxLink = ({ href = "", ...props }) => (
  <a
    {...props}
    {...useLinkTarget(href)}
    href={href.startsWith("/") && !href.startsWith("//") ? withPrefix(href) : href}
  />
)

export const ImageGrid = ({ children }) => <GridWrap>{children}</GridWrap>

/**
 * Text with a figure beside it. The text sets the row height and the image
 * scales down to fit inside it, so the figure never runs past the text.
 * Stacks on narrow screens.
 */
export const SideFigure = ({
  src,
  alt = "",
  title,
  caption,
  width = "50%",
  side = "right",
  expandable,
  children,
}) => {
  const viewer = useFigureViewer(expandable)
  return (
    <SideFigureWrap
      $width={typeof width === "number" ? `${width}px` : width}
      $left={side === "left"}
    >
      <SideFigureText>{children}</SideFigureText>
      <SideFigureFrame>
        <SideFigureImage>
          {src &&
            (viewer ? (
              <ViewableImage src={figureSrc(src)} alt={alt} title={title} caption={caption} />
            ) : (
              <img src={figureSrc(src)} alt={alt} />
            ))}
        </SideFigureImage>
        {caption && <figcaption>{caption}</figcaption>}
      </SideFigureFrame>
    </SideFigureWrap>
  )
}

export const DataTable = ({ caption, children }) => (
  <DataTableWrap>
    {caption && <TableCaption>{caption}</TableCaption>}
    {children}
  </DataTableWrap>
)

export const ContributionCalendar = ({ title, caption }) => (
  <ContributionCalendarWrap>
    {title && <CalendarTitle>{title}</CalendarTitle>}
    <ContributionTimeline embedded />
    {caption && <CalendarCaption>{caption}</CalendarCaption>}
  </ContributionCalendarWrap>
)

export const mdxComponents = {
  a: MdxLink,
  HardwareIterations,
  HardwareMap,
  Callout,
  PaperCallouts,
  PaperCallout,
  Placeholder,
  Figure,
  ImageGrid,
  SideFigure,
  DataTable,
  ContributionCalendar,
  ContributionTimeline,
  DryLabCalendar,
  DryLabIterations,
  DryLabSeasonRibbon,
  DesignSketchbook,
  HardwareNotebookSandbox,
  HardwareJournal,
  WetLabJournal,
  BioreactorRequirements,
  BioreactorSimulator,
  HardwareArchitectureDiagram,
  PageTabs,
  PageTab,
  InteractiveGizmo,
  PetAssayAnimation,
  DatasetFlowchart,
  DatasetFlowchartFigure,
  ArchitectureFigure,
  DiamondSearchHero,
  DiamondSearchDemo,
  RecordCardDemo,
  MethodsLink,
  ModelDatasets,
  DatasetLoop,
  ProfileSteps,
  ProfileShares,
  ProfileStack,
  BiosampleViewer,
  PlasticomeStats,
  PlasticomeCoverage,
  PlasticomeExplorer,
  PlasticomeFlow,
  EricksonSequences,
  AntibioticSelectionAnimation,
  GfpBiosensorAnimation,
  CodeDropdown,
  Dropdown,
  Citation,
  References,
  ...embedComponents,
  PhotoGallery,
  Spreadsheet,
  AtlasMap,
  PetadexGame,
  FeatureCards,
  FeatureCard,
  Expandable,
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

// --wiki-block-max lets a page (the Dry Lab scene) run these boxes the full
// width of its text box.
const CalloutBox = styled.aside`
  max-width: var(--wiki-block-max, 48rem);
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
    color: var(--color-body);
  }
`

const PaperRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.75rem, 3%, 2rem);
  width: 100%;
  margin: var(--space-lg) 0;

  /* Too narrow for three: one under the other. */
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

/** Upright like the painted paper (404 × 555), taller if its text needs it. */
const PaperNote = styled.aside`
  aspect-ratio: 404 / 555;
  /* Clear of the paper's rough edges. */
  padding: 13% 11% 12%;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;

  @media (max-width: 640px) {
    aspect-ratio: auto;
    padding: 2rem 1.75rem;
  }
`

const PaperTitle = styled.p`
  color: var(--color-text) !important;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: var(--space-sm);
`

const PlaceholderBox = styled.div`
  max-width: var(--wiki-block-max, 48rem);
  padding: var(--space-md) var(--space-lg);
  border: 1px dashed var(--color-muted);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.24);
`

const PlaceholderLabel = styled.p`
  color: var(--color-muted) !important;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: var(--space-xs);
`

const FigureWrap = styled.figure`
  width: 100%;
  max-width: ${({ $width }) => $width};
  margin: var(--space-lg) auto;
  /* Clears the sticky header when a link lands on the figure's id. */
  scroll-margin-top: 6rem;

  img {
    width: 100%;
    height: auto;
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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  width: 100%;
  min-width: 0;
  gap: var(--space-md);
  max-width: var(--wiki-block-max, 54rem);
  margin: var(--space-lg) 0;

  figure {
    min-width: 0;
    margin: 0 auto;
  }
`

const SideFigureWrap = styled.div`
  display: grid;
  grid-template-columns: ${({ $left, $width }) =>
    $left ? `${$width} minmax(0, 1fr)` : `minmax(0, 1fr) ${$width}`};
  gap: var(--space-lg);
  max-width: var(--wiki-block-max, 54rem);
  margin: var(--space-lg) 0;

  ${({ $left }) =>
    $left &&
    css`
      > figure {
        order: -1;
      }
    `}

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);

    > figure {
      order: 0;
    }
  }
`

const SideFigureText = styled.div`
  > * + * {
    margin-top: var(--space-sm);
  }
`

const SideFigureFrame = styled.figure`
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: 0;

  figcaption {
    margin-top: var(--space-sm);
    color: var(--color-muted);
    font-size: 0.875rem;
  }
`

// The absolutely placed image adds nothing to the row height, so the text
// alone sets it; object-fit then shrinks the image to fit the box.
const SideFigureImage = styled.div`
  position: relative;
  flex: 1;
  min-height: 12rem;

  /* The viewer's opener stands in for the box, so the image inside it
     still fills the same area. */
  > button {
    position: absolute;
    inset: 0;
  }

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: top center;
  }

  @media (max-width: 720px) {
    position: static;
    min-height: 0;

    > button {
      position: relative;
    }

    img {
      position: static;
      height: auto;
    }
  }
`

const DataTableWrap = styled.div`
  max-width: var(--wiki-block-max, 54rem);
  overflow-x: auto;
  margin: var(--space-lg) 0;
`

const TableCaption = styled.p`
  color: var(--color-text) !important;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: var(--space-sm);
`

const ContributionCalendarWrap = styled.div`
  width: 100%;
  max-width: 80rem;
  min-width: 0;
  margin: var(--space-lg) 0;
`

const CalendarTitle = styled.p`
  color: var(--color-text) !important;
  font-weight: 700;
  margin-bottom: var(--space-sm);
`

const CalendarCaption = styled.p`
  max-width: 48rem;
  margin-top: var(--space-sm);
  color: var(--color-muted);
  font-size: 0.875rem;
`
