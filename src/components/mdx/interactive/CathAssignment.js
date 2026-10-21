import React, { useEffect, useMemo, useState } from "react"
import { withPrefix } from "gatsby"
import styled from "styled-components"
import { CATH_STRUCTURES } from "../../../data/cathStructures.js"
import { ViewableImage } from "../FigureViewer.js"
import {
  CHAIN_COLORS,
  COFACTOR_COLOR,
  PLDDT_COLORS,
  PLDDT_DOMAIN,
  SECONDARY_COLOR,
  SUBSTRATE_COLOR,
  StructureViewer,
  TRIAD_COLOR,
  cssColor,
} from "./StructureViewer.js"
import {
  CATH,
  ClassLegend,
  DomainTrack,
  FOLD_GROUPS,
  blank,
  classColor,
  nameOf,
} from "./plasticomeCath.js"
import {
  Arrow,
  Box,
  BoxTitle,
  ChartScroll,
  FRAME,
  Flow,
  Head,
  INK,
  INK_SOFT,
  LINE,
  Lane,
  MUTED,
  MiniBar,
  Mono,
  Node,
  PANEL,
  NodeD,
  NodeN,
  NodeT,
  Picker,
  SUNK,
  Stat,
  StatLabel,
  StatValue,
  Stats,
  Sub,
  TableToggle,
  Tip,
  ext,
  fmt,
  tipTransform,
} from "./plasticomeFigure.js"

/**
 * CATH Assignment, from the Model page's Dataset Generation section and its
 * Methods page (/dry-lab/model/cath-assignment/).
 *
 * Ported from the draft in plasticome/wiki-reference-curation/02 CATH
 * Assignment/ (template.html):
 *   CathForest          the forest of fold groups, with a button per group
 *                       that opens the plasticome explorer on it
 *   CathStructures      one representative structure per fold, in Mol*
 *   CathStats           the four numbers the Methods page's final table ends on
 *   CathFlow            609 structures to one label per domain
 *   MerizoDomainCounts  structures by number of Merizo domains
 *   TedEvalueHistogram  where the E-value cutoff sits
 *   OverlapExamples     the two structures the overlap rule has to handle
 *   RouteCoverage       enzymes with a call from each route
 *   CathFolds           enzymes per catalytic or accessory superfamily
 *
 * The domain-call explorer is the "Domain calls" tab of PlasticomeExplorer.
 */

const D = CATH
const N = Object.keys(D.enz).length

/* ---------- forest ---------- */

const FOREST = "/figures/dry-lab-model/plasticome-forest-full.avif"
const FOREST_ALT =
  "Circular forest of 16 fold groups. The alpha/beta hydrolase fold fills more than half the circle; amidase and peptidase folds follow, then smaller slices for oxygenases, beta-lactamase-like enzymes, proteases, cytochromes, cupredoxins and SGNH hydrolases, each with a representative structure."
// Shown under the figure and again in its expanded view.
const FOREST_CAPTION =
  "The plasticome spans several unrelated and unalignable folds, so it cannot be aligned as a single family. Instead the 411 centroids are represented as 56 sequence-similarity families (connected components at 30% identity over 50% coverage), assigned to 16 fold groups by the CATH superfamily of their catalytic domain. Each slice is one fold group with its own tree; slices are not related to each other. Phylogenetic relationships are only reliable within families: between the families of the α/β-hydrolase fold only 2 of 33 backbone branches are supported, and no relationship is inferred across folds. Tips are coloured by substrate; dashed lines are supported links between families of the same fold (not to scale). Structures show one representative enzyme per fold, with its CATH superfamily and PDB entry."
const asset = (src) => (src.startsWith("/") ? withPrefix(src) : src)

export const CathForest = () => (
  <Box>
    <BoxTitle>What are the Plasticome Structurally?</BoxTitle>
    <Sub>
      Click the figure to expand it. Pick a fold group to list its enzymes in the plasticome
      explorer.
    </Sub>
    <Forest>
      <ViewableImage
        src={asset(FOREST)}
        alt={FOREST_ALT}
        title="What are the Plasticome Structurally?"
        caption={FOREST_CAPTION}
      />
    </Forest>
    <FoldButtons aria-label="Fold groups">
      {FOLD_GROUPS.map((g) => (
        <a
          key={g.g}
          href={`#fold=${g.g}`}
          title={`CATH ${g.cath} · ${g.n} centroid${g.n > 1 ? "s" : ""} in the tree`}
        >
          {g.fold}
          <small>{g.n}</small>
        </a>
      ))}
    </FoldButtons>
    <Sub>{FOREST_CAPTION}</Sub>
  </Box>
)

/* ---------- one structure per fold ---------- */

const COLOR_MODES = [
  { value: "plain", label: "White" },
  { value: "chain", label: "Along the chain" },
  { value: "plddt", label: "Confidence" },
]
// Ramps for the key, from the viewer's own colour lists. The confidence list
// runs from the confident end down, the way Mol* wants it, so it is flipped.
const CHAIN_RAMP = CHAIN_COLORS.map(cssColor)
const PLDDT_RAMP = [...PLDDT_COLORS].reverse().map(cssColor)

/** "S128", or "B:T1" off chain A. */
const residueName = (r) => `${r.chain === "A" ? "" : `${r.chain}:`}${r.aa}${r.num}`

/** The residues of some groups that can be drawn: the sheet's unverified ones are left out. */
const drawable = (groups, except = []) => {
  const skip = new Set(except.map(residueName))
  return groups
    .flatMap((g) => g.residues)
    .filter((r) => r.flag !== "unverified" && !skip.has(residueName(r)))
}

const referenceLink = (ref) =>
  ref.startsWith("AF-")
    ? ext(`https://alphafold.ebi.ac.uk/entry/${ref.split("-")[1]}`, `AlphaFold DB ${ref}`)
    : ext(`https://www.rcsb.org/structure/${ref}`, `PDB ${ref}`)

const ResidueGroups = ({ groups, color }) =>
  groups.map((g) => (
    <div key={g.label}>
      <Dot style={{ background: cssColor(color) }} /> {g.label}:{" "}
      {g.residues.map((r, i) => (
        <React.Fragment key={residueName(r)}>
          {i > 0 && ", "}
          <Mono>{residueName(r)}</Mono>
          {r.flag && <Faint> ({r.flag})</Faint>}
        </React.Fragment>
      ))}
    </div>
  ))

export const CathStructures = () => {
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState(0)
  const [mode, setMode] = useState("plain")
  const [spin, setSpin] = useState(true)
  const s = CATH_STRUCTURES[pick]
  // Kept per structure: the viewer reloads whenever these arrays change.
  const catalytic = useMemo(() => drawable(s.catalytic), [s])
  const secondary = useMemo(() => drawable(s.secondary, catalytic), [s, catalytic])

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setSpin(false)
  }, [])

  return (
    <Box>
      <BoxTitle>One structure per fold</BoxTitle>
      <Sub>
        A representative predicted structure for each catalytic fold of the plasticome. Pick a fold
        to load it; drag to turn it, scroll to zoom.
      </Sub>
      {/* Mol* is fetched when the viewer first mounts, so it stays closed
          until a reader opens it. */}
      <TableToggle open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>Open the structure viewer</summary>
        {open && (
          <StructureLayout>
            <FoldList role="listbox" aria-label="Folds">
              {CATH_STRUCTURES.map((f, i) => (
                <button
                  key={f.raw}
                  type="button"
                  role="option"
                  aria-selected={pick === i}
                  onClick={() => setPick(i)}
                >
                  <span>{f.fold}</span>
                  <Mono>{f.cath ?? "no CATH code"}</Mono>
                </button>
              ))}
            </FoldList>
            <div>
              <ViewerControls>
                <Segmented role="group" aria-label="Colour the chain by">
                  {COLOR_MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      aria-pressed={mode === m.value}
                      onClick={() => setMode(m.value)}
                    >
                      {m.label}
                    </button>
                  ))}
                </Segmented>
                <Segmented>
                  <button type="button" aria-pressed={!spin} onClick={() => setSpin(!spin)}>
                    {spin ? "Pause" : "Spin"}
                  </button>
                </Segmented>
              </ViewerControls>
              <StructureViewer
                src={s.url}
                sites={catalytic}
                secondary={secondary}
                mode={mode}
                spin={spin}
                label={s.enzyme ? `${s.enzyme} · ${s.fold}` : s.fold}
              />
              <ViewerKey>
                {mode !== "plain" && (
                  <span>
                    <b>{mode === "plddt" ? "pLDDT confidence" : "N to C terminus"}</b>
                    {mode === "plddt" ? PLDDT_DOMAIN[0] : "N"}
                    <Ramp $stops={mode === "plddt" ? PLDDT_RAMP : CHAIN_RAMP} />
                    {mode === "plddt" ? `${PLDDT_DOMAIN[1]}+` : "C"}
                  </span>
                )}
                <span>
                  <Dot style={{ background: cssColor(TRIAD_COLOR) }} />
                  catalytic residues
                </span>
                {secondary.length > 0 && (
                  <span>
                    <Dot style={{ background: cssColor(SECONDARY_COLOR) }} />
                    supporting residues
                  </span>
                )}
                <span>
                  <Dot style={{ background: cssColor(SUBSTRATE_COLOR) }} />
                  docked substrate
                </span>
                {s.cofactors && (
                  <span>
                    <Dot style={{ background: cssColor(COFACTOR_COLOR) }} />
                    cofactors and metal ions
                  </span>
                )}
              </ViewerKey>
              <FoldDetails>
                <DetailsHead>
                  <b>{s.domain}</b>
                  {s.cath ? (
                    <>
                      {" "}
                      · CATH <Mono>{s.cath}</Mono>
                    </>
                  ) : (
                    " · not classified by CATH"
                  )}
                  <span>
                    Reference {referenceLink(s.reference)}
                    {s.enzyme
                      ? ` · ${s.enzyme} (PL${s.id}), a plasticome enzyme`
                      : " · a representative of the fold, not a plasticome sequence"}
                  </span>
                </DetailsHead>
                <dl>
                  <dt>Catalytic</dt>
                  <dd>
                    <ResidueGroups groups={s.catalytic} color={TRIAD_COLOR} />
                  </dd>
                  {s.secondary.length > 0 && (
                    <>
                      <dt>Supporting</dt>
                      <dd>
                        <ResidueGroups groups={s.secondary} color={SECONDARY_COLOR} />
                      </dd>
                    </>
                  )}
                  <dt>Mechanism</dt>
                  <dd>{s.mechanism}</dd>
                  <dt>Substrate</dt>
                  <dd>
                    {s.ligand.name} ({s.ligand.formula}), docked · ligand ipTM{" "}
                    {s.ligand.iptm.toFixed(2)}, interface pLDDT {s.ligand.iplddt.toFixed(2)}
                  </dd>
                  <dt>Structure</dt>
                  <dd>
                    {s.features}. {s.processing}.
                  </dd>
                </dl>
              </FoldDetails>
            </div>
          </StructureLayout>
        )}
      </TableToggle>
      {/* From petadex-manuscript.tex: Results on the forest (hand-written) and
          Methods, Domain assignment of the plasticome (marked AI-GENERATED). */}
      <Sub>
        The plasticome spans several unrelated and unalignable folds. Each structure here represents
        one catalytic fold, labelled with the CATH homologous superfamily of its catalytic domain.
        Superfamilies were assigned by two independent routes, Foldseek searches of Merizo domains
        against CATH S40 and the CATH-Gene3D HMM library, which agreed for all 643 domains matched
        by both. The rubber oxygenases (Lcp) have no CATH superfamily in either CATH release and
        were annotated from Pfam (PF09995). Colour runs from the N to the C terminus, or by
        predicted confidence (pLDDT).
      </Sub>
    </Box>
  )
}

/* ---------- stats ---------- */

const nCatSuperfamilies = D.folds
  .filter(([sf]) => !blank(sf))
  .reduce((a, [sf]) => a + sf.split(";").length, 0)
const nAlphaBeta = (D.folds.find(([sf]) => sf === "3.40.50.1820") || [0, 0, 0])[2]

export const CathStats = () => (
  <Stats>
    <Stat $hero>
      <StatValue>
        {fmt(D.cov.union)}
        <small> / {fmt(N)}</small>
      </StatValue>
      <StatLabel>enzymes labelled by at least one of the three routes</StatLabel>
    </Stat>
    <Stat>
      <StatValue>0</StatValue>
      <StatLabel>
        disagreements between the structure and sequence routes, over {fmt(D.xc.AGREE)} domains both
        labelled
      </StatLabel>
    </Stat>
    <Stat>
      <StatValue>{nCatSuperfamilies}</StatValue>
      <StatLabel>catalytic CATH superfamilies, plus one family CATH has never classified</StatLabel>
    </Stat>
    <Stat>
      <StatValue>{Math.round((100 * nAlphaBeta) / N)}%</StatValue>
      <StatLabel>of enzymes have an α/β-hydrolase catalytic domain</StatLabel>
    </Stat>
  </Stats>
)

/* ---------- flow ---------- */

const AGREEMENT = [
  { key: "agree", label: "Routes agree", color: "#4f5aa0" },
  { key: "single_route", label: "One route", color: "#3f7a5a" },
  { key: "no_hit", label: "No CATH call", color: LINE },
  { key: "conflict", label: "Routes disagree", color: "#b6693d" },
]

export const CathFlow = () => {
  const R = D.routes
  return (
    <Box>
      <BoxTitle>From 609 structures to one CATH label per domain</BoxTitle>
      <Sub>The routes run on all 609 structures. Counts are domains unless marked.</Sub>
      <CathFlowGrid>
        <Lane>
          <Node>
            <NodeN>{fmt(N)}</NodeN>
            <NodeT>Predicted structures</NodeT>
            <NodeD>ESMFold, one per plasticome enzyme; sequence read from the same file</NodeD>
          </Node>
          <Node>
            <NodeN>{fmt(D.n_merizo_domains)}</NodeN>
            <NodeT>Merizo domains</NodeT>
            <NodeD>{fmt(D.merizo_discontinuous)} discontinuous</NodeD>
          </Node>
        </Lane>
        <Arrow aria-hidden="true">→</Arrow>
        <Lane>
          <Node>
            <RouteTag>Route A · structure</RouteTag>
            <NodeT>Foldseek vs CATH S40</NodeT>
            <NodeD>{fmt(R.A.hit)} domains labelled · TM ≥ 0.5, E ≤ 10⁻⁵</NodeD>
          </Node>
          <Node>
            <RouteTag>Route A′ · structure</RouteTag>
            <NodeT>Foldseek vs TED50</NodeT>
            <NodeD>{fmt(R.T.status.hit)} domains labelled · same thresholds</NodeD>
          </Node>
          <Node>
            <RouteTag>Route B · sequence</RouteTag>
            <NodeT>Gene3D HMMs</NodeT>
            <NodeD>
              {fmt(R.B.domains)} domains on {fmt(R.B.seqs)} sequences · Gene3D's own thresholds
            </NodeD>
          </Node>
          <Node>
            <RouteTag>Route C · sequence</RouteTag>
            <NodeT>Pfam-A</NodeT>
            <NodeD>
              {fmt(R.C.domains)} domains on {fmt(R.C.seqs)} sequences · gathering thresholds
            </NodeD>
          </Node>
        </Lane>
        <Arrow aria-hidden="true">→</Arrow>
        <Lane>
          <Node>
            <NodeT>Reconcile per domain</NodeT>
            <NodeD>Residue-set overlap, label-aware rule</NodeD>
            <MiniBar
              parts={AGREEMENT.map((a) => ({
                n: D.dom_agree[a.key] || 0,
                color: a.color,
                label: `${a.label} (domains)`,
              }))}
            />
          </Node>
          <Node>
            <NodeN>
              {fmt(D.centroids.assigned)}
              <small> / {D.centroids.n}</small>
            </NodeN>
            <NodeT>Centroids labelled</NodeT>
            <NodeD>Union of A, A′ and B</NodeD>
          </Node>
        </Lane>
        <Arrow aria-hidden="true">→</Arrow>
        <Lane>
          <Node $out>
            <NodeN>{fmt(N)}</NodeN>
            <NodeT>Plasticome, one row per enzyme</NodeT>
            <NodeD>Catalytic and accessory CATH, domain name, Pfam</NodeD>
          </Node>
        </Lane>
      </CathFlowGrid>
      <Sub>
        Routes A and A′ are the same structure search against two references. Route B uses only the
        sequence. Route C (Pfam) was added later to cover a family that CATH has never classified.
        All calls are mapped onto the domains Merizo cut, compared, and then collapsed into one row
        per enzyme.
      </Sub>
    </Box>
  )
}

/* ---------- simple count bars ---------- */

const CountBars = ({ title, sub, rows, max, unit, caption }) => {
  const [tip, setTip] = useState(null)
  const top = max ?? Math.max(...rows.map((r) => r.n))
  return (
    <Box>
      <BoxTitle>{title}</BoxTitle>
      {sub && <Sub>{sub}</Sub>}
      <Bars onPointerLeave={() => setTip(null)}>
        {rows.map((r) => (
          <BarRow key={r.label} aria-label={`${r.label}: ${fmt(r.n)} ${unit}`}>
            <BarLabel $strong={r.strong}>{r.label}</BarLabel>
            <BarTrack aria-hidden="true">
              <i
                style={{ width: `${(100 * r.n) / top}%`, background: r.color ?? INK_SOFT }}
                onPointerMove={(e) =>
                  setTip({
                    x: e.clientX,
                    y: e.clientY,
                    title: r.label,
                    line: `${fmt(r.n)} ${unit}`,
                  })
                }
              />
            </BarTrack>
            <BarValue>{fmt(r.n)}</BarValue>
          </BarRow>
        ))}
      </Bars>
      {caption && <Sub>{caption}</Sub>}
      {tip && (
        <Tip style={{ transform: tipTransform(tip) }}>
          <b>{tip.title}</b>
          <span>{tip.line}</span>
        </Tip>
      )}
    </Box>
  )
}

export const MerizoDomainCounts = () => (
  <CountBars
    title="Domains per structure"
    sub="Structures by number of Merizo domains."
    unit="structures"
    rows={Object.entries(D.merizo_ndom)
      .map(([k, n]) => [+k, n])
      .sort((a, b) => a[0] - b[0])
      .map(([k, n]) => ({ label: `${k} domain${k > 1 ? "s" : ""}`, n }))}
  />
)

export const RouteCoverage = () => (
  <CountBars
    title="How the routes compare"
    sub={`Enzymes (of ${fmt(N)}) with at least one call from each route.`}
    unit="enzymes with a call"
    max={N}
    rows={[
      { label: "A · CATH S40", n: D.cov.A },
      { label: "A′ · TED50", n: D.cov.T },
      { label: "B · Gene3D", n: D.cov.B },
      { label: "C · Pfam", n: D.cov.Ca },
      { label: "Any route", n: D.cov.union, strong: true, color: INK },
    ]}
  />
)

/* ---------- TED50 E-value histogram ---------- */

export const TedEvalueHistogram = () => {
  const [tip, setTip] = useState(null)
  const h = D.ted_hist
  const n = h.counts.length
  const mx = Math.max(...h.counts)
  const W = 760
  const H = 260
  const l = 56
  const r = 12
  const t = 16
  const b = 40
  const x = (i) => l + (i / n) * (W - l - r)
  const y = (v) => t + (1 - v / mx) * (H - t - b)
  const cut = x((-5 - h.lo) / h.w)
  const gridlines = []
  for (let v = 0; v <= mx; v += 5000) gridlines.push(v)
  const xticks = []
  for (let e = h.lo; e <= h.lo + n * h.w; e += 10) xticks.push(e)

  return (
    <Box>
      <BoxTitle>Where the E-value cutoff sits</BoxTitle>
      <Sub>All TED50 hits with TM-score ≥ 0.5, binned by E-value. Hover a bar for the count.</Sub>
      <ChartScroll onPointerLeave={() => setTip(null)}>
        <Plot
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Histogram of log10 E-value for TED50 hits with TM-score at least 0.5"
        >
          {gridlines.map((v) => (
            <g key={v}>
              <line x1={l} x2={W - r} y1={y(v)} y2={y(v)} stroke={SUNK} />
              <text x={l - 8} y={y(v) + 4} textAnchor="end">
                {fmt(v)}
              </text>
            </g>
          ))}
          {xticks.map((e) => (
            <text key={e} x={x((e - h.lo) / h.w)} y={H - b + 18} textAnchor="middle">
              10
              <tspan dy="-6" fontSize="9">
                {e}
              </tspan>
            </text>
          ))}
          <text x={(l + W - r) / 2} y={H - 4} textAnchor="middle">
            E-value (lowest bin includes all smaller; highest, all larger)
          </text>
          {h.counts.map((c, i) => {
            const e0 = h.lo + i * h.w
            return (
              <rect
                key={i}
                x={x(i) + 1}
                y={y(c)}
                width={Math.max(x(i + 1) - x(i) - 2, 1)}
                height={y(0) - y(c)}
                rx="2"
                fill={e0 < -5 ? "#4f5aa0" : LINE}
                onPointerMove={(ev) =>
                  setTip({
                    x: ev.clientX,
                    y: ev.clientY,
                    title: (
                      <>
                        10<sup>{e0}</sup> to 10<sup>{e0 + h.w}</sup>
                      </>
                    ),
                    line: `${fmt(c)} hits`,
                  })
                }
              />
            )
          })}
          <line x1={cut} x2={cut} y1={t - 6} y2={y(0)} stroke={INK} strokeDasharray="4 4" />
          <text x={cut - 6} y={t + 4} textAnchor="end" className="strong">
            cutoff 10⁻⁵
          </text>
        </Plot>
      </ChartScroll>
      <Sub>
        Among structurally good hits, E-values form a main peak near 10⁻⁹ and a second, broader peak
        of weaker hits above 10⁻⁵. The cutoff (dashed) sits in the dip between them. The number of
        domains assigned rises smoothly as the cutoff is relaxed, so the shape of this distribution,
        not the yield, is what justifies keeping 10⁻⁵.
      </Sub>
      {tip && (
        <Tip style={{ transform: tipTransform(tip) }}>
          <b>{tip.title}</b>
          <span>{tip.line}</span>
        </Tip>
      )}
    </Box>
  )
}

/* ---------- the two structures the overlap rule has to handle ---------- */

const block = (r, sf, who) => ({
  r,
  color: classColor(sf),
  label: sf,
  tip: [`${who} · ${r.map((p) => p.join("-")).join(", ")}`, `${sf} ${nameOf(sf)}`],
})

const OVERLAP_EXAMPLES = [
  {
    id: 52,
    name: "NylB",
    L: 392,
    merizo: [
      block(
        [
          [39, 130],
          [234, 392],
        ],
        "3.40.710.10",
        "Merizo"
      ),
      block([[131, 233]], "1.20.58.710", "Merizo"),
    ],
    gene3d: [
      block([[29, 52]], "6.10.250.420", "Gene3D"),
      block([[58, 206]], "3.40.710.10", "Gene3D"),
      block([[204, 392]], "3.40.710.10", "Gene3D"),
    ],
  },
  {
    id: 410,
    name: "ESM139",
    L: 339,
    merizo: [block([[46, 339]], "3.40.50.1820", "Merizo")],
    gene3d: [
      block([[25, 288]], "3.40.50.1820", "Gene3D"),
      block([[289, 339]], "2.80.10.50", "Gene3D"),
    ],
  },
]

export const OverlapExamples = () => (
  <Box>
    <BoxTitle>Two structures the overlap rule has to handle</BoxTitle>
    <Sub>
      Merizo domains (top lane) and Gene3D domains (bottom lane), drawn to scale along the sequence.
      Colour is CATH class. Hover a block for its superfamily.
    </Sub>
    <ClassLegend />
    {OVERLAP_EXAMPLES.map((e) => (
      <div key={e.id}>
        <ExampleTitle>
          <b>Structure {e.id}</b> · {e.name} · {e.L} aa
        </ExampleTitle>
        <DomainTrack
          length={e.L}
          width={760}
          label={`Merizo and Gene3D domains of structure ${e.id}`}
          lanes={[
            { name: "Merizo", items: e.merizo },
            { name: "Gene3D", items: e.gene3d },
          ]}
        />
      </div>
    ))}
    <Sub>
      <b>Structure 52</b>, a serine β-lactamase-like nylon hydrolase: its catalytic domain (
      <Mono>3.40.710.10</Mono>) is split around an inserted α-helical domain (
      <Mono>1.20.58.710</Mono>, TM 0.999). Gene3D's sequence models cannot represent an insertion
      and tile the region with two β-lactamase hits. The body agrees, and the insertion is a
      structure-only finding. <b>Structure 410</b>: Gene3D finds a small 51-residue trefoil domain (
      <Mono>2.80.10.50</Mono>) inside the region Merizo leaves as one α/β-hydrolase domain.
      Different folds with little reciprocal overlap: two domains, not a conflict.
    </Sub>
  </Box>
)

/* ---------- folds ---------- */

const foldRow = ([sf, , n]) => {
  if (blank(sf)) {
    return {
      key: "none",
      code: "None",
      name: "no CATH superfamily",
      n,
      color: MUTED,
      tip: "No CATH superfamily: 15 Lcp rubber oxygenases, 1 fragment",
    }
  }
  const name = sf
    .split(";")
    .map((x) => nameOf(x) || "unnamed superfamily")
    .join(" + ")
  return {
    key: sf,
    code: sf.replace(";", " + "),
    name,
    n,
    color: classColor(sf),
    tip: `Class ${sf[0]} · ${name}`,
  }
}

const FOLD_VIEWS = {
  catalytic: {
    label: "Catalytic domain",
    sub: "Enzymes per catalytic CATH superfamily. Each enzyme counts once.",
    caption:
      "The α/β-hydrolase fold of IsPETase and LCC dominates. Next come two amidase and peptidase folds that include the nylon hydrolases, then a tail of proteases, oxygenases and peroxidases. The grey bar is the Lcp rubber-oxygenase family, which CATH has never classified, plus one 28-residue fragment.",
    rows: D.folds,
  },
  accessory: {
    label: "Accessory domains",
    sub: "Enzymes carrying each accessory (non-catalytic) superfamily. An enzyme with several counts once for each.",
    caption:
      "Accessory domains are mostly binding modules: the trefoil (ricin-B-like) domain, Ig-like and galactose-binding domains, and the subtilisin propeptide. Superfamilies CATH leaves unnamed are shown by code only.",
    rows: D.accessory,
  },
}

export const CathFolds = () => {
  const [view, setView] = useState("catalytic")
  const [tip, setTip] = useState(null)
  const spec = FOLD_VIEWS[view]
  const rows = spec.rows.map(foldRow)
  const max = Math.max(...rows.map((r) => r.n))
  return (
    <Box>
      <Head>
        <BoxTitle>The folds of the plasticome</BoxTitle>
        <Picker>
          <span>Show</span>
          <select
            value={view}
            onChange={(e) => {
              setTip(null)
              setView(e.target.value)
            }}
          >
            {Object.entries(FOLD_VIEWS).map(([key, v]) => (
              <option key={key} value={key}>
                {v.label}
              </option>
            ))}
          </select>
        </Picker>
      </Head>
      <Sub>{spec.sub}</Sub>
      <ClassLegend none={view === "catalytic" ? "No CATH superfamily" : null} />
      <Bars $wide onPointerLeave={() => setTip(null)}>
        {rows.map((r) => (
          <BarRow key={r.key} $wide aria-label={`${r.code} ${r.name}: ${fmt(r.n)} enzymes`}>
            <BarLabel title={r.name}>
              <Mono>{r.code}</Mono> <small>{blank(r.name) ? "" : r.name}</small>
            </BarLabel>
            <BarTrack aria-hidden="true">
              <i
                style={{ width: `${(100 * r.n) / max}%`, background: r.color }}
                onPointerMove={(e) =>
                  setTip({
                    x: e.clientX,
                    y: e.clientY,
                    title: r.code,
                    line: `${r.tip}: ${fmt(r.n)}`,
                  })
                }
              />
            </BarTrack>
            <BarValue>{fmt(r.n)}</BarValue>
          </BarRow>
        ))}
      </Bars>
      <Sub>{spec.caption}</Sub>
      {tip && (
        <Tip style={{ transform: tipTransform(tip) }}>
          <b>{tip.title}</b>
          <span>{tip.line}</span>
        </Tip>
      )}
    </Box>
  )
}

/* ---------- styles ---------- */

const Forest = styled.div`
  /* The figure is drawn on white; multiplying drops the white into the panel. */
  img {
    display: block;
    width: 100%;
    height: auto;
    mix-blend-mode: multiply;
  }
`

const StructureLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 15rem) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const FoldList = styled.div`
  display: grid;
  align-content: start;
  max-height: 26rem;
  overflow-y: auto;
  border: 1px solid ${LINE};
  border-radius: 8px;
  background: #fffaf6;

  button {
    all: unset;
    box-sizing: border-box;
    display: grid;
    gap: 0.05rem;
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid ${SUNK};
    color: ${INK};
    font-size: 0.82rem;
    cursor: pointer;
  }

  button:hover,
  button[aria-selected="true"] {
    background: ${SUNK};
  }

  button[aria-selected="true"] {
    box-shadow: inset 3px 0 0 ${INK};
    font-weight: 600;
  }

  button:focus-visible {
    outline: 2px solid ${INK_SOFT};
    outline-offset: -2px;
  }

  @media (max-width: 760px) {
    max-height: 11rem;
  }
`

const ViewerControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
`

const Segmented = styled.div`
  display: inline-flex;
  overflow: hidden;
  border: 1px solid ${FRAME};
  border-radius: 999px;

  button {
    all: unset;
    padding: 0.2rem 0.7rem;
    color: ${INK};
    font-size: 0.78rem;
    cursor: pointer;
  }

  button + button {
    border-left: 1px solid ${FRAME};
  }

  button[aria-pressed="true"] {
    background: ${INK};
    color: ${PANEL};
  }

  button:focus-visible {
    outline: 2px solid ${INK_SOFT};
    outline-offset: -2px;
  }
`

const ViewerKey = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 1rem;
  margin: 0.5rem 0 0.25rem;
  color: ${INK_SOFT};
  font-size: 0.78rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
`

const FoldDetails = styled.div`
  display: grid;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid ${LINE};
  border-radius: 10px;
  background: #fffaf6;
  color: ${INK};
  font-size: 0.84rem;

  dl {
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr);
    gap: 0.45rem 0.75rem;
    margin: 0;
  }

  dt {
    color: ${MUTED};
  }

  dd {
    margin: 0;
    min-width: 0;
  }

  dd > div + div {
    margin-top: 0.15rem;
  }

  a {
    color: ${INK};
  }

  @media (max-width: 640px) {
    dl {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.15rem;
    }

    dd {
      margin-bottom: 0.4rem;
    }
  }
`

const DetailsHead = styled.div`
  span {
    display: block;
    color: ${INK_SOFT};
    font-size: 0.8rem;
  }
`

const Faint = styled.span`
  color: ${MUTED};
`

const Dot = styled.i`
  display: inline-block;
  vertical-align: -0.05em;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
`

const Ramp = styled.i`
  width: 8rem;
  height: 0.6rem;
  border-radius: 999px;
  background: linear-gradient(to right, ${({ $stops }) => $stops.join(", ")});
`

const FoldButtons = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.2rem 0.6rem;
    border: 1px solid ${FRAME};
    border-radius: 999px;
    color: ${INK};
    font-size: 0.78rem;
    text-decoration: none;
  }

  a:hover,
  a:focus-visible {
    background: ${SUNK};
  }

  small {
    color: ${MUTED};
    font-variant-numeric: tabular-nums;
  }
`

const CathFlowGrid = styled(Flow)`
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.2fr) auto minmax(0, 1fr) auto minmax(
      0,
      0.9fr
    );

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }

  ${NodeN} small {
    color: ${MUTED};
    font-size: 0.6em;
  }
`

const RouteTag = styled.div`
  color: ${MUTED};
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const Bars = styled.div`
  display: grid;
  gap: 0.3rem;
  max-width: ${({ $wide }) => ($wide ? "none" : "40rem")};
`

const BarRow = styled.div`
  display: grid;
  grid-template-columns:
    ${({ $wide }) => ($wide ? "minmax(8rem, 18rem)" : "8.5rem")} minmax(0, 1fr)
    3rem;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.86rem;

  @media (max-width: 640px) {
    grid-template-columns: ${({ $wide }) => ($wide ? "6.5rem" : "6.5rem")} minmax(0, 1fr) 2.6rem;
    gap: 0.5rem;
    font-size: 0.8rem;

    small {
      display: none;
    }
  }
`

const BarLabel = styled.span`
  overflow: hidden;
  font-weight: ${({ $strong }) => ($strong ? 700 : 400)};
  text-overflow: ellipsis;
  white-space: nowrap;

  small {
    color: ${MUTED};
  }
`

const BarTrack = styled.span`
  display: flex;
  height: 1.1rem;
  border-radius: 4px;
  background: ${SUNK};
  overflow: hidden;

  i {
    height: 100%;
    transition: width 0.3s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    i {
      transition: none;
    }
  }
`

const BarValue = styled.span`
  justify-self: end;
  color: ${INK_SOFT};
  font-variant-numeric: tabular-nums;
`

const Plot = styled.svg`
  text {
    fill: ${INK_SOFT};
    font-size: 11px;
  }

  .strong {
    fill: ${INK};
    font-weight: 600;
  }

  rect:hover {
    opacity: 0.8;
  }
`

const ExampleTitle = styled.p`
  && {
    margin: 0.6rem 0 0;
    color: ${INK};
    font-size: 0.84rem;
  }
`
