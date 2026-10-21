import React, { useMemo, useState } from "react"
import styled from "styled-components"
import DATA from "../../../data/plasticomeCuration.json"

/**
 * Plasticome Reference Curation, from the Model page's Dataset Generation
 * section and its Methods page (/dry-lab/model/plasticome/).
 *
 * Ported from the draft in plasticome/wiki-reference-curation/ (template.html):
 *   PlasticomeStats     the three numbers the overview leads with
 *   PlasticomeCoverage  records per plastic, with a menu for superkingdom and
 *                       for PDB structure and metagenomic origin
 *   PlasticomeExplorer  every record, with the decisions behind it
 *   PlasticomeFlow      the two PAZy snapshots, merged (Methods)
 *   EricksonSequences   the 21 sequences reset to the paper (Methods)
 *
 * src/data/plasticomeCuration.json is the draft's data.json, written by its
 * extract_data.py from plasticome.v2.xlsx; the page makes no network
 * requests. Colours follow the Dry Lab figure style guide.
 *
 * union[].seqsrc is not extract_data.py's: that guessed from the enzyme's
 * name, which build_union.py dropped as a rule. It was rewritten from
 * runs/2026-08-06.final-usearch.3/fetched_sequences.json, so it says which
 * database served each accession, and where there was none, that the
 * sequence came from the paper (pazy-240826) or the PAZy record (pazy-260701).
 */

const PANEL = "#f5efe8"
const SUNK = "#e5d9cd"
const LINE = "#d3c4b3"
const FRAME = "#c8b388"
const INK = "#5f3928"
const INK_SOFT = "#805340"
const MUTED = "#8a6c57"

const U = DATA.union
const fmt = (n) => n.toLocaleString("en-US")

/** Where each record came from, in the order the bars stack. */
const SOURCES = [
  { key: "v260701", label: "pazy-260701 only", color: "#4f5aa0" },
  { key: "both", label: "Both snapshots", color: "#3f7a5a" },
  { key: "v1.1", label: "pazy-240826 only", color: "#b6693d" },
]
const SOURCE = Object.fromEntries(SOURCES.map((s) => [s.key, s]))

/** Full names, for the bar labels' tooltips. */
const PLASTIC_FULL = {
  PET: "Polyethylene terephthalate",
  PA: "Polyamide (nylon)",
  PLA: "Polylactic acid",
  PUR: "Polyurethane",
  PBAT: "Poly(butylene adipate-co-terephthalate)",
  PHA: "Polyhydroxyalkanoates",
  NR: "Natural rubber",
  PC: "Polycarbonate",
  PBS: "Poly(butylene succinate)",
  PEF: "Polyethylene furanoate",
  PE: "Polyethylene",
}

const PLASTIC_NAME = {
  PET: "PET",
  PA: "Polyamide",
  PLA: "PLA",
  PUR: "Polyurethane",
  PBAT: "PBAT",
  PHA: "PHA",
  NR: "Natural rubber",
  PC: "Polycarbonate",
  PBS: "PBS",
  PEF: "PEF",
  PE: "Polyethylene",
}

const plasticsOf = (r) =>
  r.sub
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && s !== "NA")

const has = (v) => v && v !== "NA"

/** The 21 Erickson et al. (2022) records in pazy-240826, by name. */
const ERICKSON = new Set(DATA.v1.erickson.map((e) => e.name))

const countBySource = (rows) =>
  SOURCES.map((s) => ({ ...s, n: rows.filter((r) => r.src === s.key).length }))

/** The plastics, most records first. A record with several counts once for each. */
const PLASTICS = Object.keys(PLASTIC_NAME)
  .map((code) => ({ code, rows: U.filter((r) => plasticsOf(r).includes(code)) }))
  .filter((p) => p.rows.length)
  .sort((a, b) => b.rows.length - a.rows.length)

/* ---------- stats ---------- */

export const PlasticomeStats = () => (
  <Stats>
    <Stat $hero>
      <StatValue>{fmt(U.length)}</StatValue>
      <StatLabel>curated, experimentally validated enzymes: the plasticome</StatLabel>
    </Stat>
    <Stat>
      <StatValue>{fmt(DATA.pull.n)}</StatValue>
      <StatLabel>functionally verified enzymes in PAZy, each curated by hand</StatLabel>
    </Stat>
    <Stat>
      <StatValue>{PLASTICS.length}</StatValue>
      <StatLabel>plastic types with a known enzyme</StatLabel>
    </Stat>
  </Stats>
)

/* ---------- coverage ---------- */

const VIEWS = {
  plastic: {
    label: "Plastic",
    sub: "Enzymes per plastic type. An enzyme reported on several plastics counts once for each.",
    caption:
      "PET dominates, reflecting where published work has concentrated. Colour shows which PAZy snapshot each enzyme came from.",
    rows: () =>
      PLASTICS.map((p) => ({ label: PLASTIC_NAME[p.code], title: PLASTIC_FULL[p.code], rows: p.rows })),
    // Records repeat across plastics, so the longest bar sets the scale.
    scale: "max",
  },
  superkingdom: {
    label: "Superkingdom",
    sub: "Enzymes per superkingdom of the source organism.",
    caption:
      "Most known plastic-degrading enzymes come from bacteria. Unassigned enzymes have no organism recorded in either snapshot.",
    rows: () =>
      [
        ["Bacteria", "Bacteria"],
        ["Eukaryota", "Eukaryota"],
        ["Archaea", "Archaea"],
        ["NA", "Unassigned"],
      ].map(([key, label]) => ({ label, rows: U.filter((r) => r.sk === key) })),
    scale: "total",
  },
  evidence: {
    label: "PDB structure and metagenomic origin",
    sub: `Enzymes with an experimental structure in the PDB, and enzymes found by metagenomics. Bars are out of all ${fmt(U.length)}.`,
    caption:
      "Every plasticome enzyme also has a predicted ESMFold2 structure; this view counts only experimental structures.",
    rows: () => [
      { label: "PDB structure", rows: U.filter((r) => has(r.pdb)) },
      { label: "Metagenomic", rows: U.filter((r) => r.meta) },
    ],
    scale: "total",
  },
}

export const PlasticomeCoverage = () => {
  const [view, setView] = useState("plastic")
  const [tip, setTip] = useState(null)
  const spec = VIEWS[view]
  const rows = useMemo(
    () => spec.rows().map((r) => ({ ...r, parts: countBySource(r.rows), n: r.rows.length })),
    [spec]
  )
  const max = spec.scale === "total" ? U.length : Math.max(...rows.map((r) => r.n))

  const showTip = (e, html) => setTip({ x: e.clientX, y: e.clientY, html })

  return (
    <Box>
      <Head>
        <BoxTitle>Plastics the plasticome acts on</BoxTitle>
        <Picker>
          <span>Show enzymes by</span>
          <select value={view} onChange={(e) => setView(e.target.value)}>
            {Object.entries(VIEWS).map(([key, v]) => (
              <option key={key} value={key}>
                {v.label}
              </option>
            ))}
          </select>
        </Picker>
      </Head>
      <Sub>{spec.sub}</Sub>
      <Legend />
      <Bars onPointerLeave={() => setTip(null)}>
        {rows.map((row) => (
          <BarRow
            key={row.label}
            aria-label={`${row.label}: ${fmt(row.n)} records, ${row.parts
              .map((p) => `${fmt(p.n)} ${p.label}`)
              .join(", ")}`}
          >
            <BarLabel title={row.title}>{row.label}</BarLabel>
            <BarTrack aria-hidden="true">
              {row.parts
                .filter((p) => p.n)
                .map((p) => (
                  <Segment
                    key={p.key}
                    style={{ width: `${(100 * p.n) / max}%`, background: p.color }}
                    onPointerMove={(e) =>
                      showTip(e, {
                        title: row.label,
                        line: `${p.label}: ${fmt(p.n)} of ${fmt(row.n)}`,
                      })
                    }
                  />
                ))}
            </BarTrack>
            <BarValue>{fmt(row.n)}</BarValue>
          </BarRow>
        ))}
      </Bars>
      <Sub>{spec.caption} Hover a bar segment for counts.</Sub>
      {tip && (
        <Tip style={{ transform: tipTransform(tip) }}>
          <b>{tip.html.title}</b>
          <span>{tip.html.line}</span>
        </Tip>
      )}
    </Box>
  )
}

/** Below and right of the pointer, flipped near the viewport's edges. */
const tipTransform = ({ x, y }) => {
  const pad = 14
  const flipX = x + 290 > window.innerWidth
  const flipY = y + 80 > window.innerHeight
  return `translate(${flipX ? `calc(${x - pad}px - 100%)` : `${x + pad}px`}, ${
    flipY ? `calc(${y - pad}px - 100%)` : `${y + pad}px`
  })`
}

const Legend = () => (
  <LegendRow>
    {SOURCES.map((s) => (
      <span key={s.key}>
        <Swatch style={{ background: s.color }} />
        {s.label}
      </span>
    ))}
  </LegendRow>
)

/* ---------- explorer ---------- */

const EXAMPLES = [
  ["IsPETase", (r) => r.name === "ISPETase"],
  ["Cut190 (two records)", (r) => r.name === "Cut190"],
  ["An Erickson enzyme", (r) => ERICKSON.has(r.name) && r.seqsrc.startsWith("Taken from the paper")],
  ["A hand-recovered sequence", (r) => r.seqnote && /primers/i.test(r.seqnote)],
  ["Indirect activity", (r) => r.act === "Indirect"],
]

const LIST_LIMIT = 300

export const PlasticomeExplorer = () => {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState("")
  const [plastic, setPlastic] = useState("")
  const [example, setExample] = useState(null)
  const [selected, setSelected] = useState(U[0].id)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const test = example === null ? null : EXAMPLES[example][1]
    return U.filter(
      (r) =>
        (!test || test(r)) &&
        (!source || r.src === source) &&
        (!plastic || plasticsOf(r).includes(plastic)) &&
        (!q || [r.name, r.acc, r.org, `pl${r.id}`, r.pdb, r.uni].join(" ").toLowerCase().includes(q))
    )
  }, [query, source, plastic, example])

  const current = rows.find((r) => r.id === selected) ?? rows[0]

  const clearFilters = () => {
    setQuery("")
    setSource("")
    setPlastic("")
  }
  const pickExample = (i) => {
    clearFilters()
    setExample(i)
    const hit = U.find(EXAMPLES[i][1])
    if (hit) setSelected(hit.id)
  }
  const goTo = (id) => {
    clearFilters()
    setExample(null)
    setSelected(id)
  }

  return (
    <Box>
      <BoxTitle>Explore the plasticome</BoxTitle>
      <Sub>
        Every one of the {fmt(U.length)} enzymes, with the trail of decisions behind it. Pick an
        example or search by name, accession or organism.
      </Sub>
      <Explorer>
        <div>
          <Controls>
            <input
              type="search"
              placeholder="Search name, accession, organism"
              aria-label="Search records"
              value={query}
              onChange={(e) => {
                setExample(null)
                setQuery(e.target.value)
              }}
            />
            <select
              aria-label="Source"
              value={source}
              onChange={(e) => {
                setExample(null)
                setSource(e.target.value)
              }}
            >
              <option value="">All sources</option>
              {SOURCES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Plastic"
              value={plastic}
              onChange={(e) => {
                setExample(null)
                setPlastic(e.target.value)
              }}
            >
              <option value="">All plastics</option>
              {PLASTICS.map((p) => (
                <option key={p.code} value={p.code}>
                  {PLASTIC_NAME[p.code]}
                </option>
              ))}
            </select>
          </Controls>
          <Chips>
            {EXAMPLES.map(([label], i) => (
              <Chip
                key={label}
                type="button"
                aria-pressed={example === i}
                onClick={() => pickExample(i)}
              >
                {label}
              </Chip>
            ))}
          </Chips>
          <List role="listbox" aria-label="Records">
            {rows.slice(0, LIST_LIMIT).map((r) => (
              <ListItem
                key={r.id}
                type="button"
                role="option"
                aria-selected={current?.id === r.id}
                onClick={() => setSelected(r.id)}
              >
                <Mono>PL{r.id}</Mono>
                <ItemName>{r.name}</ItemName>
                <SourceTag $color={SOURCE[r.src].color}>{SOURCE[r.src].label}</SourceTag>
              </ListItem>
            ))}
          </List>
          <Count>
            {fmt(rows.length)} of {fmt(U.length)} records
            {rows.length > LIST_LIMIT ? `, first ${LIST_LIMIT} shown` : ""}
          </Count>
        </div>
        <Card aria-live="polite">
          {current ? <RecordCard record={current} goTo={goTo} /> : <Sub>No records match.</Sub>}
        </Card>
      </Explorer>
    </Box>
  )
}

const ext = (href, text) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {text}
  </a>
)

const RecordCard = ({ record: r, goTo }) => {
  const twins = U.filter((o) => o.id !== r.id && o.name.toLowerCase() === r.name.toLowerCase())
  const dois = has(r.doi)
    ? r.doi
        .split(";")
        .map((d) => d.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, ""))
        .filter(Boolean)
    : []
  const accession = !r.acc
    ? "None"
    : /^[A-Z0-9]{4}(_[A-Z])?$/.test(r.acc)
      ? ext(`https://www.rcsb.org/structure/${r.acc.slice(0, 4)}`, r.acc)
      : ext(`https://www.ncbi.nlm.nih.gov/protein/${r.acc}`, r.acc)

  const steps = []
  if (r.src !== "v1.1") {
    steps.push({ title: "In pazy-260701", body: `PAZy ID ${r.pazy}, retrieved 30 June 2026` })
  }
  if (r.src !== "v260701") {
    steps.push({
      title: r.src === "both" ? "Also in pazy-240826" : "From pazy-240826",
      body: ERICKSON.has(r.name)
        ? "Erickson et al. (2022) metagenomic enzyme, reset to the paper's sequence when the seed set was cleaned"
        : "Seed set of the original PETadex build",
    })
  }
  if (r.src !== "v1.1") {
    const bits = []
    if (r.act) bits.push(`${r.act} evidence of activity`)
    if (r.accfix) bits.push("accession added or corrected by the curator")
    if (r.renamed) bits.push("name changed to the one in the paper")
    steps.push({ title: "Checked against the paper", body: bits.join("; ") || "Kept as pulled", quote: r.note })
  } else {
    steps.push({ title: "Not curated in 2026", body: "Not in pazy-260701", skip: true })
  }
  steps.push({ title: "Sequence", body: `${r.len} aa · ${r.seqsrc}`, quote: r.seqnote })
  steps.push({
    title: "Merged into the plasticome",
    body: (
      <>
        {SOURCE[r.src].label}
        {twins.length > 0 && (
          <>
            <br />
            Also recorded as{" "}
            {twins.map((t, i) => (
              <React.Fragment key={t.id}>
                {i > 0 && ", "}
                <LinkButton type="button" onClick={() => goTo(t.id)}>
                  PL{t.id}
                </LinkButton>{" "}
                ({t.acc || "no accession"})
              </React.Fragment>
            ))}
            : kept as separate records, collapsed by clustering
          </>
        )}
      </>
    ),
  })
  steps.push({
    title: "Clustered at 90%",
    body: r.cent ? (
      "Centroid of its cluster"
    ) : (
      <>
        Member of the cluster led by{" "}
        <LinkButton type="button" onClick={() => goTo(Number(r.cid))}>
          PL{r.cid}
        </LinkButton>
      </>
    ),
  })

  return (
    <>
      <Mono>PL{r.id}</Mono>
      <CardName>{r.name}</CardName>
      <Sub>
        {has(r.org) ? r.org : "Organism not recorded"}
        {r.meta ? " · metagenomic" : ""}
      </Sub>
      <Fields>
        <dt>Accession</dt>
        <dd>{accession}</dd>
        <dt>Plastics</dt>
        <dd>{plasticsOf(r).map((s) => PLASTIC_NAME[s] || s).join(", ") || "Not recorded"}</dd>
        <dt>Fold (CATH)</dt>
        <dd>
          <Mono>{r.cath}</Mono> · {r.dom.split(";")[0]}
        </dd>
        <dt>Structure</dt>
        <dd>
          {has(r.pdb)
            ? r.pdb.split(";").map((p, i) => (
                <React.Fragment key={p}>
                  {i > 0 && ", "}
                  {ext(`https://www.rcsb.org/structure/${p.trim()}`, p.trim())}
                </React.Fragment>
              ))
            : "None in PDB"}
        </dd>
        <dt>Paper</dt>
        <dd>
          {dois.length
            ? dois.slice(0, 3).map((d, i) => (
                <React.Fragment key={d}>
                  {i > 0 && <br />}
                  {ext(`https://doi.org/${d}`, d)}
                </React.Fragment>
              ))
            : "None recorded"}
        </dd>
      </Fields>
      <Trail>
        {steps.map((s) => (
          <TrailStep key={s.title} $skip={s.skip}>
            <TrailTitle>{s.title}</TrailTitle>
            {s.body}
            {s.quote && <Quote>“{s.quote}”</Quote>}
          </TrailStep>
        ))}
      </Trail>
    </>
  )
}

/* ---------- methods: curation flow ---------- */

const MiniBar = ({ parts }) => {
  const total = parts.reduce((a, p) => a + p.n, 0)
  return (
    <Mini>
      {parts.map((p) => (
        <i
          key={p.label}
          style={{ flex: p.n, background: p.color }}
          title={`${p.label}: ${fmt(p.n)} (${Math.round((100 * p.n) / total)}%)`}
        />
      ))}
    </Mini>
  )
}

export const PlasticomeFlow = () => {
  const { pull, cleaned, v1, manual, nr, centroids } = DATA
  const src = Object.fromEntries(countBySource(U).map((s) => [s.key, s.n]))
  return (
    <Box>
      <BoxTitle>Two PAZy snapshots, merged on accession</BoxTitle>
      <Sub>Bars under a box show how its records split. Hover one for counts.</Sub>
      <Flow>
        <Lane>
          <Node>
            <NodeN>{fmt(pull.n)}</NodeN>
            <NodeT>pazy-260701</NodeT>
            <NodeD>Retrieved 30 June 2026, through the API</NodeD>
            <MiniBar
              parts={[
                { n: pull.status.in_v1, color: SOURCE.both.color, label: "Already in the PETadex v1 seed set" },
                { n: pull.status.new_since_v1, color: SOURCE.v260701.color, label: "New since PETadex v1" },
                { n: pull.status.no_sequence, color: LINE, label: "No sequence" },
              ]}
            />
          </Node>
          <Node>
            <NodeN>{fmt(v1.n_v1)}</NodeN>
            <NodeT>PETadex v1 seed set</NodeT>
            <NodeD>The enzymes the original build searched with</NodeD>
          </Node>
        </Lane>
        <Arrow aria-hidden="true">→</Arrow>
        <Lane>
          <Node>
            <NodeN>{fmt(cleaned.n)}</NodeN>
            <NodeT>Curated against each paper</NodeT>
            <NodeD>{manual.activity["-"]} without reported activity removed, 4 added</NodeD>
            <MiniBar
              parts={[
                { n: cleaned.activity.Direct, color: SOURCE.v260701.color, label: "Direct activity" },
                { n: cleaned.activity.Indirect, color: LINE, label: "Indirect activity" },
              ]}
            />
          </Node>
          <Node>
            <NodeN>{fmt(v1.n_v11)}</NodeN>
            <NodeT>pazy-240826</NodeT>
            <NodeD>
              {v1.retrieved_changed} accessions fixed, {v1.erickson.length} sequences reset to the
              paper, a DOI on every record
            </NodeD>
          </Node>
        </Lane>
        <Arrow aria-hidden="true">→</Arrow>
        <Lane>
          <Node $out>
            <NodeN>{fmt(U.length)}</NodeN>
            <NodeT>Plasticome, merged on accession</NodeT>
            <NodeD>
              {fmt(src.v260701)} pazy-260701 only · {fmt(src.both)} in both · {fmt(src["v1.1"])}{" "}
              pazy-240826 only
            </NodeD>
            <MiniBar parts={SOURCES.map((s) => ({ n: src[s.key], color: s.color, label: s.label }))} />
          </Node>
          <Node>
            <NodeN>{fmt(nr.n)}</NodeN>
            <NodeT>Non-redundant proteins</NodeT>
            <NodeD>
              Collapsed at 100% identity; {fmt(centroids.n)} centroids at 90%, in{" "}
              {centroids.components} graph components
            </NodeD>
          </Node>
        </Lane>
      </Flow>
    </Box>
  )
}

/* ---------- methods: Erickson sequences ---------- */

export const EricksonSequences = () => {
  const rows = [...DATA.v1.erickson].sort((a, b) => b.old - b.new - (a.old - a.new))
  const W = 760
  const rowH = 22
  const top = 24
  const left = 120
  const right = 60
  const H = top + rows.length * rowH + 8
  const lo = 150
  const hi = 650
  const x = (v) => left + ((v - lo) / (hi - lo)) * (W - left - right)

  return (
    <Box>
      <BoxTitle>One curation decision in full: the Erickson enzymes</BoxTitle>
      <Sub>
        Sequence length in the database record and in the paper's supplement (table D1), for the{" "}
        {rows.length} Erickson et al. (2022) metagenomic enzymes in pazy-240826.
      </Sub>
      <LegendRow>
        <span>
          <Swatch style={{ background: MUTED }} />
          Database record
        </span>
        <span>
          <Swatch style={{ background: SOURCE["v1.1"].color }} />
          Sequence from the paper
        </span>
      </LegendRow>
      <ChartScroll>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Sequence length before and after for ${rows.length} Erickson enzymes`}
        >
          {[200, 300, 400, 500, 600].map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={top - 8} y2={H} stroke={LINE} />
              <text x={x(t)} y={top - 12} textAnchor="middle" fontSize="11" fill={MUTED}>
                {t} aa
              </text>
            </g>
          ))}
          {rows.map((r, i) => {
            const y = top + i * rowH + rowH / 2
            const d = r.new - r.old
            return (
              <g key={r.name}>
                <title>{`${r.name}: database ${r.old} aa, paper ${r.new} aa (${d > 0 ? "+" : "−"}${Math.abs(d)} aa)`}</title>
                <text x={left - 10} y={y + 4} textAnchor="end" fontSize="12" fill={INK}>
                  {r.name}
                </text>
                <line x1={x(r.old)} x2={x(r.new)} y1={y} y2={y} stroke={MUTED} strokeWidth="2" />
                <circle cx={x(r.old)} cy={y} r="5" fill={MUTED} stroke={PANEL} strokeWidth="2" />
                <circle cx={x(r.new)} cy={y} r="5" fill={SOURCE["v1.1"].color} stroke={PANEL} strokeWidth="2" />
                {i < 3 && (
                  <text x={x(Math.max(r.old, r.new)) + 10} y={y + 4} fontSize="11" fill={INK_SOFT}>
                    {d > 0 ? "+" : "−"}
                    {Math.abs(d)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </ChartScroll>
      <Sub>
        These enzymes were found by functional metagenomics, and their database records differ from
        the constructs reported in the paper. Several database sequences were nearly twice as long as
        the reported construct, so all {rows.length} were replaced with the sequences printed in the
        paper. The paper's sequence is kept in the plasticome only where there is no accession to
        retrieve one from; elsewhere the retrieved sequence wins (see Sequences, below).
      </Sub>
    </Box>
  )
}

/* ---------- styles ---------- */

const Box = styled.div`
  && {
    position: relative;
    display: grid;
    gap: 0.85rem;
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

  p {
    margin: 0;
  }

  @media (max-width: 640px) {
    && {
      padding: 1rem;
    }
  }
`

/* Not a heading: the page's sidebar lists every h2 and h3 it finds. */
const BoxTitle = styled.div`
  color: ${INK_SOFT};
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const Sub = styled.p`
  && {
    margin: 0;
    color: ${INK_SOFT};
    font-size: 0.82rem;
  }
`

const Stats = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 0.75rem;
  margin: var(--space-lg) 0;

  @media (max-width: 640px) {
    grid-template-columns: 1fr 1fr;

    & > :first-child {
      grid-column: 1 / -1;
    }
  }
`

const Stat = styled.div`
  padding: 0.9rem 1rem;
  border: 2px solid ${FRAME};
  border-radius: 12px;
  background: ${({ $hero }) => ($hero ? SUNK : PANEL)};
  color: ${INK};
`

const StatValue = styled.div`
  font-family: var(--font-display), serif;
  font-size: 2.2rem;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`

const StatLabel = styled.div`
  margin-top: 0.2rem;
  color: ${INK_SOFT};
  font-size: 0.85rem;
  line-height: 1.35;
`

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
`

const fieldStyle = `
  min-width: 0;
  padding: 0.35rem 0.55rem;
  border: 1px solid ${FRAME};
  border-radius: 7px;
  background: #fffaf6;
  color: ${INK};
  font: inherit;
  font-size: 0.85rem;
`

const Picker = styled.label`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  color: ${INK_SOFT};
  font-size: 0.82rem;

  select {
    ${fieldStyle}
    max-width: 100%;
  }
`

const LegendRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  color: ${INK_SOFT};
  font-size: 0.8rem;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
`

const Swatch = styled.i`
  width: 11px;
  height: 11px;
  border-radius: 3px;
`

const Bars = styled.div`
  display: grid;
  gap: 0.3rem;
`

const BarRow = styled.div`
  display: grid;
  grid-template-columns: 8.5rem minmax(0, 1fr) 3rem;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.86rem;

  @media (max-width: 640px) {
    grid-template-columns: 6.5rem minmax(0, 1fr) 2.6rem;
    gap: 0.5rem;
    font-size: 0.8rem;
  }
`

const BarLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const BarTrack = styled.span`
  display: flex;
  height: 1.1rem;
  border-radius: 4px;
  background: ${SUNK};
  overflow: hidden;
`

const Segment = styled.i`
  height: 100%;
  transition: width 0.3s ease;

  & + & {
    box-shadow: inset 1px 0 0 ${PANEL};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const BarValue = styled.span`
  justify-self: end;
  color: ${INK_SOFT};
  font-variant-numeric: tabular-nums;
`

const Tip = styled.div`
  position: fixed;
  z-index: 50;
  top: 0;
  left: 0;
  display: grid;
  gap: 0.2rem;
  max-width: min(280px, calc(100vw - 32px));
  padding: 0.5rem 0.7rem;
  border-radius: 8px;
  background: ${INK};
  box-shadow: 0 8px 24px -8px rgba(40, 20, 10, 0.45);
  color: ${PANEL};
  font-size: 0.8rem;
  line-height: 1.4;
  pointer-events: none;
`

const Explorer = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Controls = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.4rem;

  input {
    grid-column: 1 / -1;
  }

  input,
  select {
    ${fieldStyle}
  }
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0.6rem 0;
`

const Chip = styled.button`
  padding: 0.2rem 0.6rem;
  border: 1px solid ${FRAME};
  border-radius: 999px;
  background: transparent;
  color: ${INK};
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;

  &:hover {
    background: ${SUNK};
  }

  &[aria-pressed="true"] {
    border-color: ${INK};
    background: ${INK};
    color: ${PANEL};
  }
`

const List = styled.div`
  display: grid;
  align-content: start;
  max-height: 22rem;
  overflow-y: auto;
  border: 1px solid ${LINE};
  border-radius: 8px;
  background: #fffaf6;
`

const ListItem = styled.button`
  all: unset;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 3.4rem minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.35rem 0.6rem;
  border-bottom: 1px solid ${SUNK};
  font-size: 0.84rem;
  cursor: pointer;

  &:hover,
  &[aria-selected="true"] {
    background: ${SUNK};
  }

  &[aria-selected="true"] {
    box-shadow: inset 3px 0 0 ${INK};
    font-weight: 600;
  }

  &:focus-visible {
    outline: 2px solid ${INK_SOFT};
    outline-offset: -2px;
  }
`

const ItemName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const SourceTag = styled.span`
  padding: 0.05rem 0.4rem;
  border-radius: 4px;
  background: ${({ $color }) => $color};
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
`

const Mono = styled.span`
  color: ${MUTED};
  font-family: var(--font-mono), monospace;
  font-size: 0.8em;
`

const Count = styled.p`
  && {
    margin: 0.4rem 0 0;
    color: ${MUTED};
    font-size: 0.78rem;
  }
`

const Card = styled.div`
  display: grid;
  gap: 0.35rem;
  align-content: start;
  min-width: 0;
  padding: 0.9rem 1rem;
  border: 1px solid ${LINE};
  border-radius: 10px;
  background: #fffaf6;

  a {
    color: ${INK};
    overflow-wrap: anywhere;
  }
`

const CardName = styled.div`
  font-family: var(--font-display), serif;
  font-size: 1.35rem;
  line-height: 1.2;
`

const Fields = styled.dl`
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr);
  gap: 0.25rem 0.75rem;
  margin: 0.4rem 0;
  font-size: 0.84rem;

  dt {
    color: ${MUTED};
  }

  dd {
    margin: 0;
    min-width: 0;
  }
`

const Trail = styled.ol`
  display: grid;
  gap: 0.5rem;
  margin: 0.3rem 0 0;
  padding: 0 0 0 1rem;
  border-left: 2px solid ${LINE};
  list-style: none;
  font-size: 0.83rem;
`

const TrailStep = styled.li`
  position: relative;
  color: ${({ $skip }) => ($skip ? MUTED : INK)};

  &::before {
    content: "";
    position: absolute;
    top: 0.35rem;
    left: calc(-1rem - 6px);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ $skip }) => ($skip ? LINE : INK_SOFT)};
  }
`

const TrailTitle = styled.span`
  display: block;
  font-weight: 700;
`

const Quote = styled.q`
  display: block;
  margin-top: 0.2rem;
  color: ${INK_SOFT};
  font-style: italic;
  quotes: none;
`

const LinkButton = styled.button`
  all: unset;
  color: ${INK};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${INK_SOFT};
  }
`

const Flow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.6rem;
  align-items: center;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Lane = styled.div`
  display: grid;
  gap: 0.6rem;
`

const Arrow = styled.span`
  color: ${MUTED};
  font-size: 1.3rem;
  text-align: center;

  @media (max-width: 760px) {
    transform: rotate(90deg);
  }
`

const Node = styled.div`
  padding: 0.7rem 0.8rem;
  border: ${({ $out }) => ($out ? `2px solid ${INK_SOFT}` : `1px solid ${LINE}`)};
  border-radius: 10px;
  background: #fffaf6;
`

const NodeN = styled.div`
  font-family: var(--font-display), serif;
  font-size: 1.6rem;
  line-height: 1.1;
`

const NodeT = styled.div`
  font-weight: 700;
  font-size: 0.86rem;
`

const NodeD = styled.div`
  color: ${INK_SOFT};
  font-size: 0.78rem;
  line-height: 1.4;
`

const Mini = styled.div`
  display: flex;
  height: 8px;
  margin-top: 0.5rem;
  border-radius: 3px;
  overflow: hidden;

  i + i {
    box-shadow: inset 1px 0 0 #fffaf6;
  }
`

const ChartScroll = styled.div`
  overflow-x: auto;

  svg {
    display: block;
    width: 100%;
    min-width: 520px;
    height: auto;
  }
`
