import React, { useState } from "react"
import styled from "styled-components"

/**
 * Clustering and Corpus Structure, from the Model page's Dataset Generation
 * section and its Methods page (/dry-lab/model/clustering/).
 *
 *   ClusterFunnel   the Model overview: 298,687,363 catalytic cores down
 *                   to 90%, 60% and 30% clusters, each against the original
 *                   PETadex (v1.1), with the source each centroid came from
 *
 * Numbers are from the "PETadex v2 Clustering" Slack thread (2026-10-21) and
 * are PROVISIONAL: 90% and 60% are Run 1, 30% is Run 2 (per CATH
 * superfamily, v1.1 settings). Replace them when the end-to-end rerun lands,
 * and update the Methods page tables with them.
 *
 * Colours follow the Dry Lab figure style guide: green for clusters, as in
 * BiosampleProfiles, and the source colours of ModelDatasets.
 */

const PANEL = "#f5efe8"
const SUNK = "#e5d9cd"
const LINE = "#d3c4b3"
const FRAME = "#c8b388"
const INK = "#5f3928"
const INK_SOFT = "#805340"
const MUTED = "#8a6c57"
const BAR = "#679a79"

const SOURCES = [
  { key: "logan", name: "Logan", color: "#b6693d" },
  { key: "nr", name: "NCBI nr", color: "#4f5aa0" },
  { key: "pazy", name: "PAZy", color: "#5f8a5a" },
]

// src is [Logan, nr, PAZy], in SOURCES order.
const LEVELS = [
  { id: "cores", tag: "Input", name: "Catalytic cores", n: 298687363, src: [291922243, 6764617, 503] },
  { id: "90", tag: "90%", name: "Enzymes", n: 30453501, src: [28058493, 2394647, 361], v11: 18172960, single: 15564260, run: "Run 1" },
  { id: "60", tag: "60%", name: "Families", n: 2928810, src: [2545374, 383233, 203], v11: 1814296, single: 1019461, run: "Run 1" },
  { id: "30", tag: "30%", name: "Superfamilies", n: 77524, src: [68949, 8496, 79], v11: 22235, single: 18348, run: "Run 2" },
]

// Log axis from 10^4 to 10^9: 77,524 and 298,687,363 are 3.6 orders apart.
const LOG_MIN = 4
const LOG_MAX = 9
const TICKS = [
  [4, "10K"],
  [5, "100K"],
  [6, "1M"],
  [7, "10M"],
  [8, "100M"],
  [9, "1B"],
]
const x = (n) => `${((Math.log10(n) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100}%`

const fmt = (n) => n.toLocaleString("en-US")
const pct = (part, whole) => {
  const v = (100 * part) / whole
  return `${v < 0.1 ? "<0.1" : v.toFixed(1)}%`
}

export const ClusterFunnel = () => {
  const [active, setActive] = useState("30")
  const level = LEVELS.find((l) => l.id === active)

  return (
    <Card as="figure" aria-label="PETadex V2 clustered at 90%, 60% and 30% identity">
      <Head>
        <Title>From 299 million cores to 77,524 superfamilies</Title>
        <Legend>
          <span>
            <BarSwatch /> PETadex V2
          </span>
          <span>
            <TickSwatch /> Original PETadex (v1.1)
          </span>
        </Legend>
      </Head>

      <Rows>
        {LEVELS.map((l, i) => {
          const prev = LEVELS[i - 1]
          return (
            <Row
              key={l.id}
              type="button"
              $on={l.id === active}
              onMouseEnter={() => setActive(l.id)}
              onFocus={() => setActive(l.id)}
              onClick={() => setActive(l.id)}
              aria-pressed={l.id === active}
            >
              <Label>
                <Tag>{l.tag}</Tag>
                <Name>{l.name}</Name>
              </Label>
              <Count>
                {fmt(l.n)}
                {prev && <Fold>÷{(prev.n / l.n).toFixed(1)}</Fold>}
              </Count>
              <Track aria-hidden="true">
                {TICKS.map(([t]) => (
                  <GridLine key={t} style={{ left: x(10 ** t) }} />
                ))}
                <Bar style={{ width: x(l.n) }} />
                {l.v11 && <V11Tick style={{ left: x(l.v11) }} title={`v1.1: ${fmt(l.v11)}`} />}
              </Track>
              <Strip aria-label={SOURCES.map((s, k) => `${s.name} ${pct(l.src[k], l.n)}`).join(", ")}>
                {SOURCES.map((s, k) => (
                  <span key={s.key} style={{ flexGrow: l.src[k], background: s.color }} />
                ))}
              </Strip>
            </Row>
          )
        })}
      </Rows>

      <AxisRow aria-hidden="true">
        <span />
        <span />
        <Axis>
          {TICKS.map(([t, name]) => (
            <AxisTick key={t} style={{ left: x(10 ** t) }}>
              {name}
            </AxisTick>
          ))}
        </Axis>
        <AxisNote>Centroid source</AxisNote>
      </AxisRow>

      <Detail aria-live="polite">
        <DetailHead>
          <b>{level.tag}</b> {level.name.toLowerCase()}: {fmt(level.n)} {level.id === "cores" ? "complete catalytic cores" : "clusters"}
          {level.run && <Muted> ({level.run})</Muted>}
        </DetailHead>
        <DetailGrid>
          {SOURCES.map((s, k) => (
            <span key={s.key}>
              <Dot style={{ background: s.color }} />
              {s.name} <b>{fmt(level.src[k])}</b> <Muted>{pct(level.src[k], level.n)}</Muted>
            </span>
          ))}
        </DetailGrid>
        {level.v11 && (
          <DetailLine>
            {fmt(level.single)} singletons ({pct(level.single, level.n)}). The original PETadex had{" "}
            {fmt(level.v11)} clusters at {level.tag}.
          </DetailLine>
        )}
      </Detail>

      <Note>
        Cluster counts on a log scale. Each level clusters the centroids of the level above, within each CATH superfamily.
      </Note>
    </Card>
  )
}

/* ---------- styles ---------- */

const Card = styled.div`
  && {
    min-width: 0;
    margin: var(--space-lg) 0;
    padding: 1.1rem 1.25rem;
    border: 2px solid ${FRAME};
    border-radius: 12px;
    background: ${PANEL};
    color: ${INK};
    font-size: 0.95rem;
    line-height: 1.5;
  }

  @media (max-width: 640px) {
    && {
      padding: 1rem;
    }
  }
`

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem 1.5rem;
  margin-bottom: 1rem;
`

/* Not a heading: the page's sidebar lists every h2 and h3 it finds. */
const Title = styled.div`
  && {
    margin: 0;
    color: ${INK_SOFT};
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`

const Legend = styled.div`
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: ${INK_SOFT};

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
`

const BarSwatch = styled.i`
  width: 14px;
  height: 10px;
  border-radius: 0 3px 3px 0;
  background: ${BAR};
`

const TickSwatch = styled.i`
  width: 2px;
  height: 14px;
  background: ${INK_SOFT};
`

// Label | count | log bar | source strip. Below 640px the bar and the strip
// take their own lines.
const COLUMNS = "7.5rem 7.5rem minmax(0, 1fr) 6rem"

const Rows = styled.div`
  display: grid;
  gap: 2px;
`

const Row = styled.button`
  display: grid;
  grid-template-columns: ${COLUMNS};
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.55rem 0.5rem;
  border: 0;
  border-radius: 8px;
  background: ${(p) => (p.$on ? SUNK : "transparent")};
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${INK};
    outline-offset: 1px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr auto;
    gap: 0.4rem 1rem;
  }
`

const Label = styled.span`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
`

const Tag = styled.span`
  font-family: var(--font-mono);
  font-size: 1rem;
  color: ${INK};
`

const Name = styled.span`
  font-size: 0.8rem;
  color: ${INK_SOFT};
`

const Count = styled.span`
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: ${INK};
`

const Fold = styled.span`
  display: block;
  font-size: 0.75rem;
  color: ${MUTED};
`

const Track = styled.span`
  position: relative;
  height: 18px;

  @media (max-width: 640px) {
    grid-column: 1 / -1;
  }
`

const GridLine = styled.i`
  position: absolute;
  top: -6px;
  bottom: -6px;
  width: 1px;
  background: ${LINE};
`

const Bar = styled.i`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-left: 1px solid ${INK_SOFT};
  border-radius: 0 4px 4px 0;
  background: ${BAR};
`

// A surface ring keeps the tick readable where it sits on the bar.
const V11Tick = styled.i`
  position: absolute;
  top: -4px;
  bottom: -4px;
  width: 2px;
  margin-left: -1px;
  background: ${INK_SOFT};
  box-shadow: 0 0 0 2px ${PANEL};
`

const Strip = styled.span`
  display: flex;
  gap: 2px;
  height: 10px;

  span {
    min-width: 2px;
    border-radius: 2px;
  }

  @media (max-width: 640px) {
    grid-column: 1 / -1;
  }
`

const AxisRow = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: 1rem;
  padding: 0.35rem 0.5rem 0;

  @media (max-width: 640px) {
    display: none;
  }
`

const Axis = styled.span`
  position: relative;
  height: 1rem;
`

const AxisTick = styled.span`
  position: absolute;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: ${MUTED};
`

const AxisNote = styled.span`
  font-size: 0.7rem;
  color: ${MUTED};
`

const Detail = styled.div`
  margin-top: 1rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid ${LINE};
  border-radius: 8px;
  font-size: 0.85rem;
  color: ${INK_SOFT};
`

const DetailHead = styled.div`
  margin-bottom: 0.4rem;
  color: ${INK};

  b {
    font-family: var(--font-mono);
    font-weight: 400;
  }
`

const DetailGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.25rem;

  b {
    font-family: var(--font-mono);
    font-weight: 400;
    color: ${INK};
  }
`

const DetailLine = styled.p`
  margin: 0.4rem 0 0;
`

const Dot = styled.i`
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 0.35rem;
  border-radius: 50%;
`

const Muted = styled.span`
  color: ${MUTED};
`

const Note = styled.figcaption`
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: ${MUTED};
`
