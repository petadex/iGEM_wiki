import React, { useEffect, useMemo, useRef, useState } from "react"
import styled from "styled-components"
import DATA from "../../../data/plasticomeCuration.json"
import { COMPONENTS, DomainCalls, FOLD_GROUPS, cathOf, groupOf } from "./plasticomeCath.js"
import {
  Arrow,
  Box,
  LinkButton,
  BoxTitle,
  ChartScroll,
  FRAME,
  Flow,
  Head,
  INK,
  INK_SOFT,
  LINE,
  Lane,
  LegendRow,
  MUTED,
  MiniBar,
  Mono,
  Node,
  NodeD,
  NodeN,
  NodeT,
  PANEL,
  Picker,
  SUNK,
  Stat,
  StatLabel,
  StatValue,
  Stats,
  Sub,
  Swatch,
  TableToggle,
  Trail,
  TrailStep,
  TrailTitle,
  Tip,
  ext,
  fieldStyle,
  fmt,
  tipTransform,
} from "./plasticomeFigure.js"

/**
 * Plasticome Reference Curation, from the Model page's Dataset Generation
 * section and its Methods page (/dry-lab/model/plasticome/).
 *
 * Ported from the draft in plasticome/wiki-reference-curation/ (template.html):
 *   PlasticomeStats     the three numbers the overview leads with
 *   PlasticomeCoverage  a donut of enzymes per plastic, with a menu for
 *                       superkingdom and for PDB structure
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

const U = DATA.union

/** Where each record came from, in the order the bars stack. */
const SOURCES = [
  { key: "v260701", label: "pazy-260701 only", color: "#4f5aa0" },
  { key: "both", label: "Both snapshots", color: "#3f7a5a" },
  { key: "v1.1", label: "pazy-240826 only", color: "#b6693d" },
]
const SOURCE = Object.fromEntries(SOURCES.map((s) => [s.key, s]))

/**
 * Each plastic's entry on petadex.net/substrates/, by its id there. That page
 * keeps the chosen polymer in state, so the hash only lands on the page until
 * it learns to read one. PHA has no entry.
 */
const PETADEX_SUBSTRATE = {
  PET: "pet",
  PA: "pa_group",
  PLA: "pla",
  PUR: "pur",
  PBAT: "pbat",
  NR: "nr",
  PC: "pc",
  PBS: "pbs",
  PEF: "pef",
  PE: "pe",
}
const substrateHref = (code) =>
  PETADEX_SUBSTRATE[code] && `https://petadex.net/substrates/#${PETADEX_SUBSTRATE[code]}`

/** Full names, for the table and the tooltips. */
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

const yesNo = (key, yes, no, test) => [
  { key, label: yes, rows: U.filter(test) },
  { key: "None", label: no, rows: U.filter((r) => !test(r)) },
]

const VIEWS = {
  plastic: {
    label: "Plastic type",
    title: ["Plasticome", "Plastics"],
    sub: ["Inner ring: plastic type.", "Outer ring: which PAZy snapshot each enzyme came from."],
    head: "Plastic",
    rows: () =>
      PLASTICS.map((p) => ({
        key: p.code,
        label: PLASTIC_NAME[p.code],
        full: PLASTIC_FULL[p.code],
        href: substrateHref(p.code),
        rows: p.rows,
      })),
  },
  superkingdom: {
    label: "Superkingdom",
    title: ["Enzyme", "Origins"],
    sub: ["Inner ring: superkingdom of the source organism.", "Outer ring: PAZy snapshot."],
    caption:
      "Most known plastic-degrading enzymes come from bacteria. Unassigned enzymes have no organism recorded in either snapshot.",
    head: "Superkingdom",
    rows: () =>
      [
        ["Bacteria", "Bacteria"],
        ["Eukaryota", "Eukaryota"],
        ["Archaea", "Archaea"],
        ["NA", "Unassigned"],
      ].map(([key, label]) => ({
        key: label,
        label,
        rows: U.filter((r) => r.sk === key),
      })),
  },
  structure: {
    label: "Experimental structure",
    title: ["Solved", "structures"],
    sub: [
      "Inner ring: whether the enzyme has an experimental structure in the PDB.",
      "Outer ring: PAZy snapshot.",
    ],
    caption:
      "Every plasticome enzyme also has a predicted ESMFold2 structure; this view counts only experimental structures.",
    head: "Structure",
    rows: () => yesNo("PDB", "In the PDB", "No experimental structure", (r) => has(r.pdb)),
  },
}

/** Donut geometry, in viewBox units: inner ring is the category, outer ring its sources. */
const C = 170
const IN0 = 92
const IN1 = 128
const OUT0 = 131
const OUT1 = 156
/** How far a hovered slice slides out from the centre. */
const POP = 7

const arcPath = (r0, r1, a0, a1) => {
  const p = (r, a) => `${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`
  if (a1 - a0 >= 2 * Math.PI - 1e-6) a1 = a0 + 2 * Math.PI - 1e-4
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M${p(r1, a0)}A${r1},${r1} 0 ${large} 1 ${p(r1, a1)}L${p(r0, a1)}A${r0},${r0} 0 ${large} 0 ${p(r0, a0)}Z`
}

export const PlasticomeCoverage = () => {
  const [view, setView] = useState("plastic")
  const [active, setActive] = useState(null)
  const [source, setSource] = useState(null)
  const [tip, setTip] = useState(null)
  const spec = VIEWS[view]

  const slices = useMemo(() => {
    const rows = spec.rows().map((r) => ({ ...r, parts: countBySource(r.rows), n: r.rows.length }))
    const total = rows.reduce((a, r) => a + r.n, 0)
    let a = -Math.PI / 2
    return rows.map((r) => {
      const a0 = a
      const a1 = a + (2 * Math.PI * r.n) / total
      a = a1
      let b = a0
      const outer = r.parts
        .filter((p) => p.n)
        .map((p) => {
          const b0 = b
          b += ((a1 - a0) * p.n) / r.n
          return { ...p, d: arcPath(OUT0, OUT1, b0, b) }
        })
      const mid = (a0 + a1) / 2
      const rr = (IN0 + IN1) / 2
      const showLabel = a1 - a0 > 0.8 || (a1 - a0 > 0.2 && r.key.length * 7 <= IN1 - IN0)
      return {
        ...r,
        inner: arcPath(IN0, IN1, a0, a1),
        outer,
        labelAt: showLabel ? [C + rr * Math.cos(mid), C + rr * Math.sin(mid) + 4] : null,
        pop: `translate(${(POP * Math.cos(mid)).toFixed(2)}px, ${(POP * Math.sin(mid)).toFixed(2)}px)`,
      }
    })
  }, [spec])

  const clear = () => {
    setActive(null)
    setSource(null)
    setTip(null)
  }
  const point = (i, key) => (e) => {
    setActive(i)
    setSource(key)
    setTip({ x: e.clientX, y: e.clientY, slice: slices[i], source: key })
  }
  const changeView = (e) => {
    clear()
    setView(e.target.value)
  }
  // First baseline, so the title's lines sit centred in the hole.
  const y0 = C - (spec.title.length - 1) * 11 + 7

  return (
    <Box>
      <Head>
        <BoxTitle>What is the Plasticome?</BoxTitle>
        <Picker>
          <span>Show enzymes by</span>
          <select value={view} onChange={changeView}>
            {Object.entries(VIEWS).map(([key, v]) => (
              <option key={key} value={key}>
                {v.label}
              </option>
            ))}
          </select>
        </Picker>
      </Head>
      <Sub>
        {spec.sub.map((line, i) => {
          // "Inner ring: plastic type." -> bold "Inner ring:", then the rest.
          const [ring, ...rest] = line.split(": ")
          return (
            <React.Fragment key={ring}>
              {i > 0 && <br />}
              <b>{ring}:</b> {rest.join(": ")}
            </React.Fragment>
          )
        })}
      </Sub>
      <Legend />
      <DonutWrap>
        <Donut $dim={active !== null} $source={source}>
          <svg
            viewBox="0 0 340 340"
            role="img"
            aria-label={`${spec.title.join(" ")}: ${slices
              .map((s) => `${s.label} ${fmt(s.n)}`)
              .join(", ")}`}
          >
            {slices.map((s, i) => (
              <Slice
                key={s.key}
                $hl={active === i}
                style={active === i ? { transform: s.pop } : undefined}
                onPointerEnter={() => setActive(i)}
                onPointerMove={point(i, null)}
                onPointerLeave={clear}
              >
                <path className="inner" d={s.inner} />
                {s.outer.map((p) => (
                  <path
                    key={p.key}
                    d={p.d}
                    fill={p.color}
                    data-src={p.key}
                    onPointerMove={(e) => {
                      e.stopPropagation()
                      point(i, p.key)(e)
                    }}
                  />
                ))}
                {s.labelAt && (
                  <text x={s.labelAt[0].toFixed(1)} y={s.labelAt[1].toFixed(1)} textAnchor="middle">
                    {s.key}
                  </text>
                )}
              </Slice>
            ))}
            <text className="title" textAnchor="middle">
              {spec.title.map((line, i) => (
                <tspan key={line} x={C} y={y0 + i * 22}>
                  {line}
                </tspan>
              ))}
            </text>
          </svg>
        </Donut>
        <TableToggle>
          <summary>Show the table</summary>
          <DonutTable>
            <thead>
              <tr>
                <th>{spec.head}</th>
                <th className="num">Enzymes</th>
                <th>By source</th>
              </tr>
            </thead>
            <tbody>
              {slices.map((s, i) => (
                <DonutRow
                  key={s.key}
                  $hl={active === i}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                >
                  <td>
                    {s.href ? ext(s.href, s.label) : s.label}
                    {s.full && s.full !== s.label && <small>{s.full}</small>}
                  </td>
                  <td className="num">{fmt(s.n)}</td>
                  <td>
                    <SourceBar onPointerLeave={clear}>
                      {s.parts
                        .filter((p) => p.n)
                        .map((p) => (
                          <SourceSegment
                            key={p.key}
                            type="button"
                            $on={source === null || source === p.key || active !== i}
                            style={{ flex: p.n, background: p.color }}
                            aria-label={`${s.label}, ${p.label}: ${fmt(p.n)} of ${fmt(s.n)}`}
                            onPointerMove={point(i, p.key)}
                            onFocus={(e) => {
                              const box = e.currentTarget.getBoundingClientRect()
                              point(i, p.key)({ clientX: box.left, clientY: box.bottom })
                            }}
                            onBlur={clear}
                          />
                        ))}
                    </SourceBar>
                  </td>
                </DonutRow>
              ))}
            </tbody>
          </DonutTable>
        </TableToggle>
      </DonutWrap>
      {spec.caption && <Sub>{spec.caption}</Sub>}
      {tip && (
        <Tip style={{ transform: tipTransform(tip) }}>
          <b>
            {tip.slice.full && tip.slice.full !== tip.slice.label
              ? `${tip.slice.label} (${tip.slice.full})`
              : tip.slice.label}
            : {fmt(tip.slice.n)}
          </b>
          {tip.slice.parts.map((p) => (
            <span key={p.key} style={tip.source === p.key ? { fontWeight: 700 } : undefined}>
              {p.label}: {fmt(p.n)}
            </span>
          ))}
        </Tip>
      )}
    </Box>
  )
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

/** Each example also picks the card tab that tells its story. */
const EXAMPLES = [
  ["IsPETase", (r) => r.name === "ISPETase", "curation"],
  ["Cut190 (two records)", (r) => r.name === "Cut190", "curation"],
  [
    "An Erickson enzyme",
    (r) => ERICKSON.has(r.name) && r.seqsrc.startsWith("Taken from the paper"),
    "curation",
  ],
  ["A hand-recovered sequence", (r) => r.seqnote && /primers/i.test(r.seqnote), "curation"],
  ["Indirect activity", (r) => r.act === "Indirect", "curation"],
  ["An inserted domain", (r) => r.id === 52, "domains"],
  ["Not in CATH (Lcp)", (r) => cathOf(r).comp === "C024", "domains"],
  ["Old label corrected", (r) => [78, 65, 66, 68, 574].includes(r.id), "domains"],
  ["Routes disagree", (r) => cathOf(r).agree === "conflict", "domains"],
]

const LIST_LIMIT = 300

/** The text a search matches: identifiers, organism, and the CATH and Pfam calls. */
const haystack = (r) => {
  const c = cathOf(r)
  return [r.name, r.acc, r.org, `pl${r.id}`, r.pdb, r.uni, c.cat, c.acc_cath, c.Cn, c.Ca]
    .join(" ")
    .toLowerCase()
}

/**
 * Links of the form #fold=g00 or #comp=C001, from the CATH forest's fold
 * buttons or a record card, open the explorer filtered to that set.
 */
const HASH_FILTER = /^#(fold|comp)=(g\d+|C\d+)$/

export const PlasticomeExplorer = () => {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState("")
  const [plastic, setPlastic] = useState("")
  const [fold, setFold] = useState("")
  const [comp, setComp] = useState("")
  const [example, setExample] = useState(null)
  const [selected, setSelected] = useState(U[0].id)
  const [tab, setTab] = useState("curation")
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const test = example === null ? null : EXAMPLES[example][1]
    return U.filter(
      (r) =>
        (!test || test(r)) &&
        (!source || r.src === source) &&
        (!plastic || plasticsOf(r).includes(plastic)) &&
        (!fold || groupOf(r)?.g === fold) &&
        (!comp || cathOf(r).comp === comp) &&
        (!q || haystack(r).includes(q))
    )
  }, [query, source, plastic, fold, comp, example])

  const current = rows.find((r) => r.id === selected) ?? rows[0]

  const clearFilters = () => {
    setQuery("")
    setSource("")
    setPlastic("")
    setFold("")
    setComp("")
  }
  /** Change one filter; any example chip gives way to it. */
  const filter = (set) => (e) => {
    setExample(null)
    set(e.target.value)
  }
  const pickExample = (i) => {
    // A second click on the pressed chip turns it off and shows every record again.
    if (example === i) {
      setExample(null)
      return
    }
    clearFilters()
    setExample(i)
    setTab(EXAMPLES[i][2])
    const hit = U.find(EXAMPLES[i][1])
    if (hit) setSelected(hit.id)
  }
  const goTo = (id) => {
    clearFilters()
    setExample(null)
    setSelected(id)
  }
  const showComponent = (key) => {
    clearFilters()
    setExample(null)
    setComp(key)
  }

  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(HASH_FILTER)
      if (!m) return
      setQuery("")
      setSource("")
      setPlastic("")
      setExample(null)
      setFold(m[1] === "fold" ? m[2] : "")
      setComp(m[1] === "comp" ? m[2] : "")
      setOpen(true)
      boxRef.current?.scrollIntoView({ block: "start" })
    }
    fromHash()
    window.addEventListener("hashchange", fromHash)
    return () => window.removeEventListener("hashchange", fromHash)
  }, [])

  return (
    <Box ref={boxRef} id="plasticome-explorer">
      <BoxTitle>Explore the plasticome</BoxTitle>
      <Sub>
        Every one of the {fmt(U.length)} enzymes, with the trail of curation decisions behind it and
        its domain calls from CATH Assignment. Pick an example or search by name, accession,
        organism, CATH code or Pfam family.
      </Sub>
      <TableToggle open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>Open the explorer</summary>
        <Explorer>
          <div>
            <Controls>
              <input
                type="search"
                placeholder="Search name, accession, organism, CATH, Pfam"
                aria-label="Search records"
                value={query}
                onChange={filter(setQuery)}
              />
              <select aria-label="Source" value={source} onChange={filter(setSource)}>
                <option value="">All sources</option>
                {SOURCES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select aria-label="Plastic" value={plastic} onChange={filter(setPlastic)}>
                <option value="">All plastics</option>
                {PLASTICS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {PLASTIC_NAME[p.code]}
                  </option>
                ))}
              </select>
              <select aria-label="Fold group" value={fold} onChange={filter(setFold)}>
                <option value="">All fold groups</option>
                {FOLD_GROUPS.map((g) => (
                  <option key={g.g} value={g.g}>
                    {g.fold}
                  </option>
                ))}
              </select>
              <select aria-label="Component" value={comp} onChange={filter(setComp)}>
                <option value="">All components</option>
                {COMPONENTS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key} · {c.dom} ({c.n})
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
            {current ? (
              <RecordCard
                record={current}
                goTo={goTo}
                showComponent={showComponent}
                tab={tab}
                setTab={setTab}
              />
            ) : (
              <Sub>No records match.</Sub>
            )}
          </Card>
        </Explorer>
      </TableToggle>
    </Box>
  )
}

const RecordCard = ({ record: r, goTo, showComponent, tab, setTab }) => {
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
    steps.push({
      title: "In pazy-260701",
      body: `PAZy ID ${r.pazy}, retrieved 30 June 2026`,
    })
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
    steps.push({
      title: "Checked against the paper",
      body: bits.join("; ") || "Kept as pulled",
      quote: r.note,
    })
  } else {
    steps.push({
      title: "Not curated in 2026",
      body: "Not in pazy-260701",
      skip: true,
    })
  }
  steps.push({
    title: "Sequence",
    body: `${r.len} aa · ${r.seqsrc}`,
    quote: r.seqnote,
  })
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
        <dd>
          {plasticsOf(r)
            .map((s) => PLASTIC_NAME[s] || s)
            .join(", ") || "Not recorded"}
        </dd>
        <dt>Component</dt>
        <dd>
          {cathOf(r).comp ? (
            <LinkButton type="button" onClick={() => showComponent(cathOf(r).comp)}>
              {cathOf(r).comp}
            </LinkButton>
          ) : (
            "None"
          )}
        </dd>
        <dt>Fold group</dt>
        <dd>
          {groupOf(r) ? (
            <>
              {groupOf(r).fold} <Mono>{groupOf(r).g}</Mono>
            </>
          ) : (
            "None"
          )}
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
      <Tabs role="tablist">
        {[
          ["curation", "Curation"],
          ["domains", "Domain calls"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </Tabs>
      <div role="tabpanel">
        {tab === "curation" ? (
          <Trail>
            {steps.map((s) => (
              <TrailStep key={s.title} $skip={s.skip}>
                <TrailTitle>{s.title}</TrailTitle>
                {s.body}
                {s.quote && <Quote>“{s.quote}”</Quote>}
              </TrailStep>
            ))}
          </Trail>
        ) : (
          <DomainCalls record={r} goTo={goTo} />
        )}
      </div>
    </>
  )
}

/* ---------- methods: curation flow ---------- */

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
                {
                  n: pull.status.in_v1,
                  color: SOURCE.both.color,
                  label: "Already in the PETadex v1 seed set",
                },
                {
                  n: pull.status.new_since_v1,
                  color: SOURCE.v260701.color,
                  label: "New since PETadex v1",
                },
                {
                  n: pull.status.no_sequence,
                  color: LINE,
                  label: "No sequence",
                },
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
                {
                  n: cleaned.activity.Direct,
                  color: SOURCE.v260701.color,
                  label: "Direct activity",
                },
                {
                  n: cleaned.activity.Indirect,
                  color: LINE,
                  label: "Indirect activity",
                },
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
            <MiniBar
              parts={SOURCES.map((s) => ({
                n: src[s.key],
                color: s.color,
                label: s.label,
              }))}
            />
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
                <circle
                  cx={x(r.new)}
                  cy={y}
                  r="5"
                  fill={SOURCE["v1.1"].color}
                  stroke={PANEL}
                  strokeWidth="2"
                />
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
        the constructs reported in the paper. Several database sequences were nearly twice as long
        as the reported construct, so all {rows.length} were replaced with the sequences printed in
        the paper. The paper's sequence is kept in the plasticome only where there is no accession
        to retrieve one from; elsewhere the retrieved sequence wins (see Sequences, below).
      </Sub>
    </Box>
  )
}

/* ---------- styles ---------- */

/* Not a heading: the page's sidebar lists every h2 and h3 it finds. */

const DonutWrap = styled.div`
  display: grid;
  gap: 0.75rem;
`

const Donut = styled.div`
  justify-self: center;
  width: 100%;
  max-width: 360px;

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  path {
    stroke: ${PANEL};
    stroke-width: 2;
    stroke-linejoin: round;
    transition: opacity 0.12s;
  }

  ${({ $dim }) => ($dim ? `g:not([data-hl="true"]) path { opacity: 0.3; }` : "")}
  ${({ $source }) =>
    $source
      ? `g[data-hl="true"] path[data-src]:not([data-src="${$source}"]) { opacity: 0.3; }`
      : ""}

  .title {
    fill: ${INK};
    font-family: var(--font-display), serif;
    font-size: 20px;
  }

  @media (prefers-reduced-motion: reduce) {
    path {
      transition: none;
    }
  }
`

const Slice = styled.g.attrs(({ $hl }) => ({
  "data-hl": $hl ? "true" : "false",
}))`
  cursor: default;
  transition: transform 0.18s ease-out;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  .inner {
    fill: ${({ $hl }) => ($hl ? FRAME : SUNK)};
  }

  text {
    fill: ${INK};
    font-size: 11px;
    font-weight: 700;
    pointer-events: none;
  }
`

const DonutTable = styled.table`
  && {
    width: 100%;
    margin: 0;
    border-collapse: collapse;
    font-size: 0.84rem;
  }

  th,
  td {
    padding: 0.3rem 0.5rem;
    border-bottom: 1px solid ${SUNK};
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: ${MUTED};
    font-size: 0.75rem;
    font-weight: 600;
  }

  /* Wide enough for the "Enzymes" header, and no wider. */
  .num {
    width: 4.75rem;
    min-width: 4.75rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  small {
    display: block;
    color: ${MUTED};
    font-size: 0.72rem;
  }

  td:last-child {
    width: 50%;
    min-width: 80px;
  }

  a {
    color: ${INK};
  }

  @media (max-width: 640px) {
    small {
      display: none;
    }
  }
`

const SourceBar = styled.div`
  display: flex;
  height: 12px;
  border-radius: 3px;
  overflow: hidden;
`

const SourceSegment = styled.button`
  all: unset;
  min-width: 3px;
  height: 100%;
  opacity: ${({ $on }) => ($on ? 1 : 0.35)};
  cursor: pointer;
  transition: opacity 0.12s;

  & + & {
    box-shadow: inset 1px 0 0 #fffaf6;
  }

  &:focus-visible {
    outline: 2px solid ${INK};
    outline-offset: -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const DonutRow = styled.tr`
  background: ${({ $hl }) => ($hl ? SUNK : "transparent")};
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

const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-top: 0.4rem;
  border-bottom: 1px solid ${LINE};

  button {
    all: unset;
    padding: 0.35rem 0.7rem;
    border-bottom: 2px solid transparent;
    color: ${INK_SOFT};
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  button[aria-selected="true"] {
    border-bottom-color: ${INK};
    color: ${INK};
  }

  button:focus-visible {
    outline: 2px solid ${INK_SOFT};
    outline-offset: -2px;
  }
`

const Quote = styled.q`
  display: block;
  margin-top: 0.2rem;
  color: ${INK_SOFT};
  font-style: italic;
  quotes: none;
`
