import React, { useState } from "react"
import styled from "styled-components"
import PLDDT from "../../../data/fold60Plddt.json"
import { FAST, FRAME, FULL, INK, INK_SOFT, PAPER } from "./StructureCoverage.js"

/**
 * Model page, Predicted Structures: two figures on the 60% centroid fold,
 * placed under <StructureCoverage />.
 *
 *   PlddtByTier    mean pLDDT per structure, one row per fold tier
 *   FoldCostByLength  fold time and peak GPU memory by sequence length
 *
 * pLDDT comes from src/data/fold60Plddt.json. Until fold60_plddt_hist.py has
 * been run on Killarney it holds the notebook's QC-sample summaries with no
 * bins, and each row shows only its median. Drop the script's JSON in place
 * and the histograms appear.
 *
 * The length profile is the "Fold time and peak GPU memory by length" table
 * in Step 16 of notebook 260806_issue6_purav_foldrun, measured over every
 * fold of the run (run_length_profile.tsv).
 *
 * Colours: one per model, as in StructureCoverage.js; the H100 tail is the
 * Fast model on different hardware, so it keeps Fast's colour and gains a
 * stripe.
 */

const STRIPE = `repeating-linear-gradient(135deg, ${FAST} 0 4px, #6670b4 4px 6px)`

const TIERS = {
  short_full: { label: "ESMFold2 full model", sub: "40–149 aa · L40S", fill: FULL },
  mid_fast: { label: "ESMFold2-Fast", sub: "150–1,740 aa · L40S", fill: FAST },
  tail_h100: { label: "ESMFold2-Fast", sub: "1,741–2,500 aa · H100", fill: STRIPE },
}

const fmt = (n) => n.toLocaleString("en-US")
const pct1 = (x) => `${(100 * x).toFixed(1)}%`

/* ---------- shared pieces ---------- */

const Readout = ({ text, hint }) => (
  <ReadoutLine aria-live="polite" $shown={Boolean(text)}>
    <ReadoutIcon aria-hidden="true">i</ReadoutIcon>
    <span>{text || hint}</span>
  </ReadoutLine>
)

const Key = ({ items }) => (
  <KeyList>
    {items.map(({ label, fill }) => (
      <li key={label}>
        <KeySwatch style={{ background: fill }} />
        {label}
      </li>
    ))}
  </KeyList>
)

/* ---------- pLDDT by tier ---------- */

/** AlphaFold's confidence bands, the convention pLDDT is read against. */
const BANDS = [
  { lo: 0, hi: 50, label: "very low" },
  { lo: 50, hi: 70, label: "low" },
  { lo: 70, hi: 90, label: "confident" },
  { lo: 90, hi: 100, label: "very high" },
]

export const PlddtByTier = () => {
  const [readout, setReadout] = useState(null)
  const width = PLDDT.binWidth
  const histogram = PLDDT.tiers.every((t) => Array.isArray(t.bins))
  // One y scale for every row, in share of the tier, so heights compare.
  const top = histogram ? Math.max(...PLDDT.tiers.flatMap((t) => t.bins.map((c) => c / t.n))) : 1

  return (
    <Wrap>
      <Card>
        <Title>Confidence of each structure, by fold tier</Title>
        <Sub>
          Mean pLDDT per structure, from 0 (no confidence) to 100.{" "}
          {histogram ? "Bar height is the share of the tier's structures." : "Dot: median structure."}
        </Sub>
        <PRow aria-hidden="true">
          <span />
          <BandHead>
            {BANDS.map((b) => (
              <span key={b.label} style={{ left: `${b.lo}%`, width: `${b.hi - b.lo}%` }}>
                {b.label}
              </span>
            ))}
          </BandHead>
          <span />
        </PRow>
        {PLDDT.tiers.map((t) => {
          const meta = TIERS[t.key]
          const summary = `${meta.label}, ${meta.sub}: median pLDDT ${t.median}, ${pct1(t.lt70)} below 70`
          return (
            <PRow key={t.key}>
              <TierName>
                <strong>{meta.label}</strong>
                <span>{meta.sub}</span>
              </TierName>
              <Plot $tall={histogram} role="img" aria-label={summary}>
                <Bands />
                {histogram ? (
                  <Bins>
                    {t.bins.map((c, i) => (
                      <Bin
                        key={i}
                        onPointerEnter={() =>
                          setReadout(
                            `${meta.label} (${meta.sub}): pLDDT ${i * width}–${(i + 1) * width}, ` +
                              `${fmt(c)} structures, ${pct1(c / t.n)} of the tier`
                          )
                        }
                        onPointerLeave={() => setReadout(null)}
                      >
                        <span style={{ height: `${(100 * c) / t.n / top}%`, background: meta.fill }} />
                      </Bin>
                    ))}
                  </Bins>
                ) : null}
                <Median
                  style={{ left: `${t.median}%` }}
                  $dot={!histogram}
                  $fill={meta.fill}
                  onPointerEnter={() => setReadout(summary)}
                  onPointerLeave={() => setReadout(null)}
                >
                  <MedianLabel>{t.median}</MedianLabel>
                </Median>
              </Plot>
              <Stats>
                <strong>{pct1(t.lt70)}</strong> below 70
                <span>{t.sample ? `QC sample of ${fmt(t.n)}` : `${fmt(t.n)} structures`}</span>
              </Stats>
            </PRow>
          )
        })}
        <PRow aria-hidden="true">
          <span />
          <Ticks>
            {[0, 50, 70, 90, 100].map((v) => (
              <span key={v} style={{ left: `${v}%` }}>
                {v}
              </span>
            ))}
          </Ticks>
          <span />
        </PRow>
        <Readout
          text={readout}
          hint={histogram ? "Hover a bar for its count" : "Hover a dot for the tier's numbers"}
        />
      </Card>
      <Caption>
        Short sequences are mostly fragments of Logan contigs: about half fold with low confidence, while a
        quarter fold as confidently as longer sequences. Filter or weight structures by pLDDT before using them.
        {histogram ? "" : " Medians are from a QC sample of 1,000 structures per tier."}
      </Caption>
    </Wrap>
  )
}

/* ---------- fold time and memory by length ---------- */

/** Step 16, "Fold time and peak GPU memory by length": every fold of the run. */
const LENGTHS = [
  { lo: 40, hi: 99, tier: "short_full", folds: 70845, s: 0.9, mem: 13.9, max: 14.0 },
  { lo: 100, hi: 149, tier: "short_full", folds: 53095, s: 0.9, mem: 14.1, max: 14.1 },
  { lo: 150, hi: 249, tier: "mid_fast", folds: 310059, s: 0.79, mem: 14.2, max: 14.4 },
  { lo: 250, hi: 399, tier: "mid_fast", folds: 910885, s: 1.05, mem: 14.8, max: 15.7 },
  { lo: 400, hi: 599, tier: "mid_fast", folds: 324794, s: 2.04, mem: 16.6, max: 18.5 },
  { lo: 600, hi: 899, tier: "mid_fast", folds: 92554, s: 4.0, mem: 20.0, max: 24.7 },
  { lo: 900, hi: 1299, tier: "mid_fast", folds: 23675, s: 9.07, mem: 26.2, max: 31.7 },
  { lo: 1300, hi: 1740, tier: "mid_fast", folds: 5488, s: 19.11, mem: 36.1, max: 46.1 },
  { lo: 1741, hi: 1999, tier: "tail_h100", folds: 1303, s: 14.67, mem: 50.3, max: 56.6 },
  { lo: 2000, hi: 2249, tier: "tail_h100", folds: 664, s: 19.59, mem: 61.5, max: 68.0 },
  { lo: 2250, hi: 2500, tier: "tail_h100", folds: 419, s: 25.96, mem: 73.8, max: 80.9 },
]
const H100_FROM = LENGTHS.findIndex((b) => b.tier === "tail_h100")

/** Selective labels: the ends of each hardware run, not every bar. */
const TIME_LABELS = new Set([0, H100_FROM - 1, LENGTHS.length - 1])
const MEM_LABELS = new Set([H100_FROM - 1, LENGTHS.length - 1])

const describe = (b) =>
  `${fmt(b.lo)}–${fmt(b.hi)} aa (${TIERS[b.tier].label}, ${b.tier === "tail_h100" ? "H100" : "L40S"}): ` +
  `${fmt(b.folds)} folds, median ${b.s.toFixed(2)} s per fold, ` +
  `peak memory ${b.mem.toFixed(1)} GB median, ${b.max.toFixed(1)} GB max`

const Panel = ({ title, unit, ticks, ymax, refs = [], value, label, whisker, active, setActive }) => (
  <PanelWrap>
    <PanelTitle>
      {title} <span>({unit})</span>
    </PanelTitle>
    <Chart>
      <YAxis aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} style={{ bottom: `${(100 * t) / ymax}%` }}>
            {t}
          </span>
        ))}
      </YAxis>
      <Area>
        {ticks.map((t) => (
          <Grid key={t} style={{ bottom: `${(100 * t) / ymax}%` }} />
        ))}
        {refs.map((r) => (
          <Ref key={r.label} style={{ bottom: `${(100 * r.at) / ymax}%` }}>
            <span>{r.label}</span>
          </Ref>
        ))}
        <Cols>
          {LENGTHS.map((b, i) => (
            <Col
              key={b.lo}
              $dim={active !== null && active !== i}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
            >
              {whisker ? (
                <Whisker style={{ bottom: `${(100 * b.mem) / ymax}%`, height: `${(100 * (b.max - b.mem)) / ymax}%` }}>
                  {label(i) ? <BarLabel>{label(i)}</BarLabel> : null}
                </Whisker>
              ) : null}
              <ColBar style={{ height: `${(100 * value(b)) / ymax}%`, background: TIERS[b.tier].fill }}>
                {!whisker && label(i) ? <BarLabel>{label(i)}</BarLabel> : null}
              </ColBar>
            </Col>
          ))}
        </Cols>
      </Area>
    </Chart>
  </PanelWrap>
)

export const FoldCostByLength = () => {
  const [active, setActive] = useState(null)
  const shared = { active, setActive }
  return (
    <Wrap>
      <Card>
        <Title>Cost of a fold, by sequence length</Title>
        <Sub>Median over every fold in each length bin. Bins of 1,741 aa and up ran on H100 GPUs.</Sub>
        <Key
          items={[
            { label: "Full model, L40S", fill: FULL },
            { label: "Fast, L40S", fill: FAST },
            { label: "Fast, H100", fill: STRIPE },
          ]}
        />
        <Panel
          title="Fold time"
          unit="seconds per structure"
          ticks={[0, 10, 20, 30]}
          ymax={30}
          value={(b) => b.s}
          label={(i) => TIME_LABELS.has(i) && LENGTHS[i].s.toFixed(1)}
          {...shared}
        />
        <Panel
          title="Peak GPU memory"
          unit="GB; line to the largest fold"
          ticks={[0, 20, 40, 60, 80]}
          ymax={90}
          refs={[
            { at: 46, label: "L40S limit" },
            { at: 85.5, label: "H100 limit" },
          ]}
          value={(b) => b.mem}
          label={(i) => MEM_LABELS.has(i) && LENGTHS[i].max.toFixed(1)}
          whisker
          {...shared}
        />
        <XAxis aria-hidden="true">
          <span />
          <Cols>
            {LENGTHS.map((b) => (
              <span key={b.lo}>
                {fmt(b.lo)}
                <BinEnd>
                  –<br />
                  {fmt(b.hi)}
                </BinEnd>
              </span>
            ))}
          </Cols>
        </XAxis>
        <XTitle>Sequence length (aa)</XTitle>
        <Readout text={active === null ? null : describe(LENGTHS[active])} hint="Hover a length bin for its numbers" />
        <SrTable>
          <caption>Fold time and peak GPU memory by length</caption>
          <tbody>
            {LENGTHS.map((b) => (
              <tr key={b.lo}>
                <td>{describe(b)}</td>
              </tr>
            ))}
          </tbody>
        </SrTable>
      </Card>
      <Caption>
        Up to about 250 aa a fold costs a near-constant 0.8 to 0.9 s; beyond that, time grows roughly as L<sup>1.66</sup>.
        Memory grows with the square of length and reached the L40S limit at 1,740 aa, so longer sequences moved to
        H100s, which are also faster per residue. The 2,500 aa cap sits where one H100 runs out.
      </Caption>
    </Wrap>
  )
}

/* ---------- styles ---------- */

const Wrap = styled.figure`
  margin: var(--space-lg) 0;
`

const Card = styled.div`
  display: grid;
  gap: 0.6rem;
  padding: 1rem 1.1rem;
  border: 2px solid ${FRAME};
  border-radius: 12px;
  background: ${PAPER};
  color: ${INK};
`

const Title = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
`

const Sub = styled.span`
  margin-top: -0.4rem;
  color: ${INK_SOFT};
  font-size: 0.82rem;
`

const Caption = styled.figcaption`
  margin-top: var(--space-sm);
  color: ${INK_SOFT};
  font-size: 0.85rem;
  text-align: center;
`

const KeyList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.78rem;

  && li {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0;
  }
`

const KeySwatch = styled.span`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 2px;
`

const ReadoutLine = styled.p`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.45rem;
  align-items: start;
  min-height: calc(2 * 1.35em);
  margin: 0;
  color: ${({ $shown }) => ($shown ? INK : INK_SOFT)};
  font-size: 0.8rem;
  font-style: ${({ $shown }) => ($shown ? "normal" : "italic")};
  line-height: 1.35;
`

const ReadoutIcon = styled.span`
  display: grid;
  place-items: center;
  width: 1.05rem;
  height: 1.05rem;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  font-family: var(--font-mono, monospace);
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
`

/* pLDDT rows: name | plot | stats. Below 640px the name and stats sit above
   and below the plot so the plot keeps the full width. */
const PRow = styled.div`
  display: grid;
  grid-template-columns: 9.5rem minmax(0, 1fr) 7rem;
  column-gap: 0.8rem;
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 0.25rem;
    & > span:empty {
      display: none;
    }
  }
`

const TierName = styled.span`
  display: grid;
  font-size: 0.85rem;
  line-height: 1.25;

  span {
    color: ${INK_SOFT};
    font-size: 0.75rem;
  }
`

/* The top margin leaves room for the median label above the plot, clear of
   the row above. */
const Plot = styled.div`
  position: relative;
  height: ${({ $tall }) => ($tall ? "3.6rem" : "1.6rem")};
  margin-top: ${({ $tall }) => ($tall ? "1rem" : "0")};
`

/* Alternating tints mark the four confidence bands; the dashed line is 70. */
const Bands = styled.div`
  position: absolute;
  inset: 0;
  border-bottom: 1px solid ${FRAME};
  background: linear-gradient(
    to right,
    rgba(95, 57, 40, 0.07) 0 50%,
    rgba(95, 57, 40, 0.02) 50% 70%,
    rgba(95, 57, 40, 0.07) 70% 90%,
    rgba(95, 57, 40, 0.02) 90% 100%
  );

  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 70%;
    border-left: 1.5px dashed ${INK_SOFT};
  }
`

const BandHead = styled.div`
  position: relative;
  height: 1rem;

  span {
    position: absolute;
    color: ${INK_SOFT};
    font-size: 0.7rem;
    text-align: center;
    white-space: nowrap;
  }
`

const Bins = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  gap: 1px;
`

/* The cell is the hit target; the bar inside it is the mark. */
const Bin = styled.span`
  flex: 1 1 0;
  display: flex;
  align-items: flex-end;

  span {
    width: 100%;
    border-radius: 2px 2px 0 0;
  }

  &:hover span {
    outline: 2px solid ${INK};
  }
`

const Median = styled.span`
  position: absolute;
  top: ${({ $dot }) => ($dot ? "50%" : "0")};
  bottom: ${({ $dot }) => ($dot ? "auto" : "0")};
  width: ${({ $dot }) => ($dot ? "0.85rem" : "2px")};
  height: ${({ $dot }) => ($dot ? "0.85rem" : "auto")};
  transform: ${({ $dot }) => ($dot ? "translate(-50%, -50%)" : "translateX(-1px)")};
  border-radius: ${({ $dot }) => ($dot ? "50%" : "0")};
  background: ${({ $dot, $fill }) => ($dot ? $fill : INK)};
  box-shadow: ${({ $dot }) => ($dot ? `0 0 0 2px ${PAPER}` : "none")};
  cursor: default;
`

const MedianLabel = styled.span`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, -2px);
  padding: 0 0.2rem;
  border-radius: 3px;
  background: ${PAPER};
  color: ${INK};
  font-size: 0.72rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

const Stats = styled.span`
  display: grid;
  font-size: 0.8rem;
  line-height: 1.3;

  strong {
    font-size: 0.95rem;
  }

  span {
    color: ${INK_SOFT};
    font-size: 0.72rem;
  }

  @media (max-width: 640px) {
    display: block;

    span::before {
      content: " · ";
    }
  }
`

const Ticks = styled.div`
  position: relative;
  height: 1rem;

  span {
    position: absolute;
    transform: translateX(-50%);
    color: ${INK_SOFT};
    font-size: 0.72rem;
    font-variant-numeric: tabular-nums;
  }
`

/* Length panels: y-axis gutter | plot. XAxis repeats the same gutter so the
   bin labels line up with the bars above. */
const GUTTER = "2.2rem"

const PanelWrap = styled.div`
  display: grid;
  gap: 0.3rem;
`

const PanelTitle = styled.span`
  font-size: 0.85rem;
  font-weight: 700;

  span {
    color: ${INK_SOFT};
    font-weight: 400;
  }
`

const Chart = styled.div`
  display: grid;
  grid-template-columns: ${GUTTER} minmax(0, 1fr);
  height: 9.5rem;
  margin-top: 0.4rem;
`

const YAxis = styled.div`
  position: relative;

  span {
    position: absolute;
    right: 0.4rem;
    transform: translateY(50%);
    color: ${INK_SOFT};
    font-size: 0.72rem;
    font-variant-numeric: tabular-nums;
  }
`

const Area = styled.div`
  position: relative;
  border-bottom: 1px solid ${INK_SOFT};
`

const Grid = styled.span`
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid rgba(95, 57, 40, 0.12);
`

const Ref = styled.span`
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1.5px dashed ${INK_SOFT};

  span {
    position: absolute;
    bottom: 1px;
    left: 2px;
    color: ${INK_SOFT};
    font-size: 0.68rem;
    font-weight: 600;
  }
`

const Cols = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(${LENGTHS.length}, minmax(0, 1fr));
  gap: 4px;

  @media (max-width: 640px) {
    gap: 2px;
  }
`

const Col = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  opacity: ${({ $dim }) => ($dim ? 0.35 : 1)};
  transition: opacity 0.15s ease;
`

const ColBar = styled.span`
  position: relative;
  width: 72%;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
`

const BarLabel = styled.span`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, -2px);
  color: ${INK};
  font-size: 0.7rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

/* From the median bar's top to the largest fold in the bin. */
const Whisker = styled.span`
  position: absolute;
  left: 50%;
  border-left: 2px solid ${INK};

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: -5px;
    width: 8px;
    border-top: 2px solid ${INK};
  }
`

const XAxis = styled.div`
  display: grid;
  grid-template-columns: ${GUTTER} minmax(0, 1fr);

  & > div {
    position: static;
  }

  & > div > span {
    color: ${INK_SOFT};
    font-size: 0.68rem;
    line-height: 1.2;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 640px) {
    & > div > span {
      font-size: 0.6rem;
    }
  }
`

/* On narrow screens each bin is labelled by where it starts; the full range
   is in the readout. */
const BinEnd = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`

const XTitle = styled.span`
  margin-top: -0.3rem;
  color: ${INK_SOFT};
  font-size: 0.75rem;
  text-align: center;
`

const SrTable = styled.table`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`
