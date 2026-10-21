import React, { useState } from "react"
import styled from "styled-components"

/**
 * Model page, Predicted Structures: where the structure of every 60% identity
 * centroid came from. Numbers are the final set in Step 17 of
 * igem-toronto/notebooks/260806_issue6_purav_foldrun.ipynb, which reads them
 * from structure_index.tsv on S3; they sum to the 1,814,296 centroids in
 * dims/clusters60. Colours follow the Dry Lab figure style guide, as in
 * ModelDatasets.js: the two ESMFold2 tiers are two steps of one indigo, AFDB
 * is orange (validated together for colour-vision deficiency), and the two
 * bookkeeping rows are neutral.
 */

export const INK = "#5f3928"
export const INK_SOFT = "#805340"
export const PAPER = "#f3e9e5"
export const FRAME = "#c8b388"

/** One colour per ESMFold2 model, shared with the fold-run figures. */
export const FAST = "#3f4a99"
export const FULL = "#7d87d0"

const TOTAL = 1814296

const SOURCES = [
  {
    key: "fast",
    label: "ESMFold2-Fast",
    n: 1669868,
    color: FAST,
    detail: "150 to 2,500 aa. L40S up to 1,740 aa, H100 above. Includes 27 centroids whose AFDB entry was a different protein.",
  },
  {
    key: "full",
    label: "ESMFold2 (full model)",
    n: 123940,
    color: FULL,
    detail: "Under 150 aa, where the Fast model lost confidence in our benchmark.",
  },
  {
    key: "afdb",
    label: "AlphaFold DB",
    n: 19403,
    color: "#c4702c",
    detail: "Already in AFDB, with the model's sequence checked against the centroid.",
  },
  {
    key: "dup",
    label: "Exact duplicates",
    n: 31,
    color: "#a39589",
    detail: "Same sequence as another centroid, so they share its structure.",
  },
  {
    key: "none",
    label: "Not folded",
    n: 1054,
    color: "none",
    detail: "Longer than the 2,500 aa cap, mostly multi-domain fusions or mis-assemblies.",
  },
]

const FOLDED = SOURCES.filter((s) => s.key !== "none").reduce((sum, s) => sum + s.n, 0)

const fmt = (n) => n.toLocaleString("en-US")
const pct = (n) => {
  const p = (100 * n) / TOTAL
  return p >= 1 ? `${p.toFixed(1)}%` : p >= 0.01 ? `${p.toFixed(2)}%` : "<0.01%"
}

export const StructureCoverage = () => {
  // Hovering a row lights its segment and the reverse, so the slivers too thin
  // to point at can still be found from the list.
  const [active, setActive] = useState(null)
  const on = (key) => ({
    onPointerEnter: () => setActive(key),
    onPointerLeave: () => setActive(null),
  })
  return (
    <Wrap>
      <Card>
        <Head>
          <Value>
            {((100 * FOLDED) / TOTAL).toFixed(2)}% <small>of 60% centroids have a structure</small>
          </Value>
          <Detail>
            {fmt(FOLDED)} of {fmt(TOTAL)} centroids at 60% identity
          </Detail>
        </Head>
        <Bar role="img" aria-label={SOURCES.map((s) => `${s.label} ${fmt(s.n)}`).join(", ")}>
          {SOURCES.map((s) => (
            <Segment
              key={s.key}
              title={`${s.label}: ${fmt(s.n)} (${pct(s.n)})`}
              $color={s.color}
              $dim={active !== null && active !== s.key}
              style={{ flexGrow: s.n / TOTAL }}
              {...on(s.key)}
            />
          ))}
        </Bar>
        <Rows>
          {SOURCES.map((s) => (
            <Row key={s.key} $dim={active !== null && active !== s.key} {...on(s.key)}>
              <Swatch $color={s.color} aria-hidden="true" />
              <RowLabel>{s.label}</RowLabel>
              <RowN>{fmt(s.n)}</RowN>
              <RowPct>{pct(s.n)}</RowPct>
              <RowDetail>{s.detail}</RowDetail>
            </Row>
          ))}
        </Rows>
      </Card>
      <Caption>
        Where each 60% centroid's structure comes from. ESMFold2 runs used 32 diffusion steps and 3 refinement loops.
        Every structure is on S3, and the <code>structure_path</code> column of the PETadex corpus points to it.
      </Caption>
    </Wrap>
  )
}

const Wrap = styled.figure`
  margin: var(--space-lg) 0;
`

const Card = styled.div`
  display: grid;
  gap: 0.8rem;
  padding: 1rem 1.1rem;
  border: 2px solid ${FRAME};
  border-radius: 12px;
  background: ${PAPER};
  color: ${INK};
`

const Head = styled.div`
  display: grid;
  gap: 0.2rem;
`

const Value = styled.span`
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;

  small {
    font-size: 0.9rem;
    font-weight: 600;
    color: ${INK_SOFT};
  }
`

const Detail = styled.span`
  color: ${INK_SOFT};
  font-size: 0.85rem;
`

/* The 2px gap between segments is the surface showing through, so even the
   3px slivers read as separate marks. */
const Bar = styled.div`
  display: flex;
  gap: 2px;
  height: 1.1rem;
  overflow: hidden;
  border-radius: 4px;
`

const fill = (color) =>
  color === "none"
    ? `background: repeating-linear-gradient(45deg, ${FRAME} 0 2px, transparent 2px 5px); box-shadow: inset 0 0 0 1.5px ${FRAME};`
    : `background: ${color};`

const Segment = styled.span`
  flex-basis: 0;
  min-width: 3px;
  ${({ $color }) => fill($color)}
  opacity: ${({ $dim }) => ($dim ? 0.3 : 1)};
  transition: opacity 0.15s ease;
`

const Rows = styled.ul`
  display: grid;
  gap: 0.15rem;
  margin: 0;
  padding: 0;
  list-style: none;
`

/* && outranks the article's li + li spacing, as in ModelDatasets.js. */
const Row = styled.li`
  display: grid;
  grid-template-columns: 0.8rem minmax(0, 1fr) auto 4.2rem;
  column-gap: 0.6rem;
  align-items: baseline;
  padding: 0.4rem 0.3rem;
  border-top: 1px solid ${FRAME};
  opacity: ${({ $dim }) => ($dim ? 0.45 : 1)};
  transition: opacity 0.15s ease;

  && {
    margin: 0;
  }
`

const Swatch = styled.span`
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 2px;
  align-self: center;
  ${({ $color }) => fill($color)}
`

const RowLabel = styled.span`
  font-weight: 700;
  font-size: 0.95rem;
`

const RowN = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`

const RowPct = styled.span`
  color: ${INK_SOFT};
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
`

const RowDetail = styled.span`
  grid-column: 2 / -1;
  color: ${INK_SOFT};
  font-size: 0.8rem;
  line-height: 1.35;
`

const Caption = styled.figcaption`
  margin-top: var(--space-sm);
  color: ${INK_SOFT};
  font-size: 0.85rem;
  text-align: center;
`
