import React, { useState } from "react"
import styled from "styled-components"
import CATH from "../../../data/plasticomeCath.json"
import {
  INK,
  INK_SOFT,
  LINE,
  MUTED,
  PANEL,
  SUNK,
  LegendRow,
  LinkButton,
  Mono,
  Swatch,
  Tip,
  Trail,
  TrailStep,
  TrailTitle,
  tipTransform,
} from "./plasticomeFigure.js"

/**
 * CATH calls for the 609 plasticome enzymes, shared by the plasticome explorer
 * (its "Domain calls" tab) and the CATH Assignment figures.
 *
 * src/data/plasticomeCath.json is the 02 CATH Assignment draft's data.json
 * (extract_data.py over ~/plasticome-cath-assignment/results/), trimmed to the
 * fields these components read, plus the forest figure's fold groups from
 * logan-plasticome-figure/tree/runs/centroids/results/ (fold_table.tsv,
 * tree_tips.tsv). Reference of record is CATH v4.3.0.
 */

export { CATH }

export const blank = (v) => !v || v === "-" || v === "NA"

/** CATH class, by the first number of the code. */
export const CLASSES = [
  { key: "3", label: "Alpha-beta", color: "#4f5aa0" },
  { key: "1", label: "Mainly alpha", color: "#3f7a5a" },
  { key: "2", label: "Mainly beta", color: "#b6693d" },
]
const CLASS = Object.fromEntries(CLASSES.map((c) => [c.key, c]))
export const classColor = (sf) => (blank(sf) ? MUTED : (CLASS[sf[0]]?.color ?? MUTED))
export const nameOf = (sf) => CATH.names[sf] || ""

export const ClassLegend = ({ none }) => (
  <LegendRow>
    {CLASSES.map((c) => (
      <span key={c.key}>
        <Swatch style={{ background: c.color }} />
        Class {c.key} · {c.label}
      </span>
    ))}
    {none && (
      <span>
        <Swatch style={{ background: MUTED }} />
        {none}
      </span>
    )}
  </LegendRow>
)

export const cathOf = (r) => CATH.enz[r.id] ?? {}

/** Fold groups of the forest figure, each with the centroids in its tree. */
export const FOLD_GROUPS = CATH.tree.groups
const GROUP = Object.fromEntries(FOLD_GROUPS.map((g) => [g.g, g]))
/** A record's fold group is its 90% cluster centroid's tip in the forest. */
export const groupOf = (r) => GROUP[CATH.tree.tip[String(r.cent ? r.id : r.cid)]]

/** Components from Component Assignment, largest first, named by their commonest domain. */
export const COMPONENTS = Object.values(
  Object.values(CATH.enz).reduce((acc, e) => {
    const c = (acc[e.comp] ??= { key: e.comp, n: 0, dom: {} })
    c.n += 1
    const d = e.dom.split(";")[0]
    c.dom[d] = (c.dom[d] || 0) + 1
    return acc
  }, {})
)
  .map((c) => ({
    ...c,
    dom: Object.entries(c.dom)
      .sort((a, b) => b[1] - a[1])[0][0]
      .replace("alpha/beta", "α/β"),
  }))
  .sort((a, b) => b.n - a.n || a.key.localeCompare(b.key))

/** "39-130;234-392" -> [[39, 130], [234, 392]] */
export const ranges = (s) =>
  blank(s) ? [] : [...String(s).matchAll(/(\d+)-(\d+)/g)].map((m) => [+m[1], +m[2]])

const consensus = (d) => [d.A, d.T, d.B].find((x) => !blank(x)) || ""

/** The Merizo, Gene3D and Pfam lanes of one enzyme's domain track. */
export const lanesFor = (id) => {
  const ds = CATH.dom[id] || []
  const merizo = ds.map((d) => {
    const sf = consensus(d)
    return {
      r: ranges(d.seg),
      color: classColor(sf),
      label: sf || (blank(d.Tl) ? "" : d.Tl),
      tip: [`${d.d} · residues ${d.seg}`, sf ? `${sf} ${nameOf(sf)}` : "No CATH superfamily"],
    }
  })
  const seen = new Set()
  const gene3d = []
  const pfam = []
  ds.forEach((d) => {
    if (!blank(d.Bseg) && !seen.has(`b${d.Bseg}${d.B}`)) {
      seen.add(`b${d.Bseg}${d.B}`)
      gene3d.push({
        r: ranges(d.Bseg),
        color: classColor(d.B),
        label: d.B,
        tip: [`Gene3D · ${d.Bseg}`, `${d.B} ${nameOf(d.B)}`, `bit score ${d.Bsc}`],
      })
    }
    if (!blank(d.Cenv)) {
      const names = d.C.split(";")
      const accs = d.Ca.split(";")
      d.Cenv.split(";").forEach((env, i) => {
        if (seen.has(`c${env}`)) return
        seen.add(`c${env}`)
        pfam.push({
          r: ranges(env),
          color: INK_SOFT,
          label: names[i] || names[0],
          tip: [`Pfam · ${env}`, `${names[i] || names[0]} (${accs[i] || d.Ca})`],
        })
      })
    }
  })
  return [
    { name: "Merizo", items: merizo },
    { name: "Gene3D", items: gene3d },
    { name: "Pfam", items: pfam },
  ]
}

/**
 * Domains drawn to scale along the sequence, one lane per source. A domain in
 * several pieces is joined by a dashed line over the gap. Hover a block for
 * its call.
 */
export const DomainTrack = ({ length: L, lanes, width: W = 640, label = "Domain map" }) => {
  const [tip, setTip] = useState(null)
  const left = 76
  const right = 8
  const laneH = 24
  const gap = 10
  const top = 20
  const x = (v) => left + ((v - 1) / Math.max(L - 1, 1)) * (W - left - right)
  const H = top + lanes.length * (laneH + gap)
  const step = L > 500 ? 200 : 100
  const ticks = []
  for (let t = 0; t <= L; t += step) ticks.push(Math.max(t, 1))

  return (
    <div onPointerLeave={() => setTip(null)}>
      <TrackSvg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={top - 6} y2={H - gap} stroke={SUNK} />
            <text x={x(t)} y={top - 9} textAnchor="middle" className="tick">
              {t}
            </text>
          </g>
        ))}
        {lanes.map((lane, i) => {
          const y = top + i * (laneH + gap)
          return (
            <g key={lane.name}>
              <text x="0" y={y + laneH / 2 + 4} className="lane">
                {lane.name}
              </text>
              <line x1={x(1)} x2={x(L)} y1={y + laneH / 2} y2={y + laneH / 2} stroke={LINE} />
              {lane.items.map((it, j) =>
                it.r.length ? (
                  <g
                    key={j}
                    onPointerMove={(e) => setTip({ x: e.clientX, y: e.clientY, lines: it.tip })}
                  >
                    {it.r.length > 1 && (
                      <line
                        x1={x(it.r[0][1])}
                        x2={x(it.r[it.r.length - 1][0])}
                        y1={y + 3}
                        y2={y + 3}
                        stroke={it.color}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}
                    {it.r.map(([a, b], k) => {
                      const w = Math.max(x(b) - x(a), 2)
                      return (
                        <g key={k}>
                          <rect
                            x={x(a)}
                            y={y + 4}
                            width={w}
                            height={laneH - 4}
                            rx="4"
                            fill={it.color}
                            stroke={PANEL}
                            strokeWidth="2"
                          />
                          {k === 0 && w > 74 && it.label && (
                            <text x={x(a) + 6} y={y + laneH / 2 + 5} className="in">
                              {it.label}
                            </text>
                          )}
                        </g>
                      )
                    })}
                  </g>
                ) : null
              )}
            </g>
          )
        })}
      </TrackSvg>
      {tip && (
        <Tip style={{ transform: tipTransform(tip) }}>
          <b>{tip.lines[0]}</b>
          {tip.lines.slice(1).map((l) => (
            <span key={l}>{l}</span>
          ))}
        </Tip>
      )}
    </div>
  )
}

/* ---------- the explorer's "Domain calls" tab ---------- */

const VERDICT = {
  agree: "Routes agree",
  single_route: "One route",
  no_hit: "No call",
  conflict: "Routes disagree",
}

const TIER = {
  exact: "Its sequence is a centroid; the call is its own.",
  near: "Same protein as a centroid (≥ 80% identity, ≥ 0.8 coverage both ways); the whole call transfers.",
  partial: "A fragment of a longer centroid; only domains it covers transfer.",
  none: "No usable match to a centroid.",
}

/** Records with a story worth telling, keyed by plasticome id. */
const SPECIAL = {
  52: "A discontinuous β-lactamase-like domain with an α-helical domain inserted in it. Gene3D cannot represent the insertion, so it is a structure-only call.",
  604: "Same protein as structure 52: a β-lactamase-like domain with an inserted α-helical domain.",
  56: "A 28-residue fragment, too short to annotate. Its empty CATH columns are correct.",
  72: "No route passes the standard thresholds. The α/β-hydrolase call comes from the sensitive TM-align pass, where both copies of MGS0084 (72 and 567) agree at TM 0.78–0.79.",
  567: "No route passes the standard thresholds. The α/β-hydrolase call comes from the sensitive TM-align pass, where both copies of MGS0084 (72 and 567) agree at TM 0.78–0.79.",
  78: "The original PETadex set labelled this α/β-hydrolase. Both new routes say subtilase (3.40.50.200), the correct fold for Proteinase K.",
}
;[318, 325, 335, 342].forEach((i) => {
  SPECIAL[i] =
    "One of the four conflicts: CATH S40 and Gene3D say 3.60.70.12, TED50 labels a sub-domain differently. Pfam's Peptidase_S58 (clan DmpA_ArgJ) supports 3.60.70.12."
})
;[65, 66, 68, 574].forEach((i) => {
  SPECIAL[i] =
    "The original PETadex set labelled this subtilisin α/β-hydrolase. Both new routes say subtilase (3.40.50.200)."
})
Object.entries(CATH.enz)
  .filter(([, e]) => e.comp === "C024")
  .forEach(([id]) => {
    SPECIAL[id] =
      "Latex clearing protein (Lcp), a rubber oxygenase. CATH has never classified this family, so no CATH route can label it. Pfam identifies it as PF09995 MPAB_Lcp_cat."
  })

/** One route's call in the domain table: the code, with its TM-score beneath. */
const Call = ({ sf, extra, fallback }) =>
  blank(sf) ? (
    <Faint>{fallback || "–"}</Faint>
  ) : (
    <>
      <Mono>{sf}</Mono>
      {extra && <small>{extra}</small>}
    </>
  )

export const DomainCalls = ({ record: r, goTo }) => {
  const e = cathOf(r)
  const ds = CATH.dom[r.id] || []
  if (!e.comp) return <Faint>No CATH record for this enzyme.</Faint>

  const domNames = e.dom.split(";")
  const cat = blank(e.cat) ? [] : e.cat.split(";")
  const acc = blank(e.acc_cath) ? [] : e.acc_cath.split(";")
  const named = (list, offset) =>
    list.map((sf, i) => (
      <React.Fragment key={sf}>
        {i > 0 && <br />}
        <Mono>{sf}</Mono> {domNames[offset + i] || nameOf(sf) || "unnamed"}
      </React.Fragment>
    ))
  const nDisc = ds.filter((d) => ranges(d.seg).length > 1).length

  const steps = [
    ["Predicted structure", `${e.len} aa, ESMFold`],
    [
      "Cut into domains",
      ds.length
        ? `${ds.length} Merizo domain${ds.length > 1 ? "s" : ""}${nDisc ? `, ${nDisc} discontinuous` : ""}`
        : "No domain cut",
    ],
    [
      "Searched four ways",
      `${e.nr} of 4 routes returned a call${VERDICT[e.agree] ? ` · ${VERDICT[e.agree].toLowerCase()}` : ""}`,
    ],
    [
      "Call transferred",
      <>
        {TIER[e.tier] || e.tier}
        {e.tier !== "exact" && (
          <>
            {" "}
            Centroid{" "}
            <LinkButton type="button" onClick={() => goTo(Number(e.cent))}>
              PL{e.cent}
            </LinkButton>
            , {e.pid}% identity.
          </>
        )}
      </>,
    ],
    ["Split into catalytic and accessory", `Component ${e.comp}`],
  ]

  return (
    <>
      <CallFields>
        <dt>Catalytic</dt>
        <dd>{cat.length ? named(cat, 0) : e.dom !== "NA" ? e.dom : "None"}</dd>
        <dt>Accessory</dt>
        <dd>{acc.length ? named(acc, cat.length) : "None"}</dd>
        <dt>Pfam</dt>
        <dd>
          {blank(e.Cn)
            ? "No hit"
            : e.Cn.split(";").map((n, i) => (
                <React.Fragment key={`${n}${i}`}>
                  {i > 0 && <br />}
                  {n} <Mono>{e.Ca.split(";")[i] || ""}</Mono>
                </React.Fragment>
              ))}
        </dd>
      </CallFields>
      {SPECIAL[r.id] && <Special>{SPECIAL[r.id]}</Special>}
      <ClassLegend />
      <DomainTrack
        length={e.len || r.len}
        lanes={lanesFor(r.id)}
        width={560}
        label={`Domains of ${r.name}`}
      />
      <TableScroll>
        <CallTable>
          <thead>
            <tr>
              <th>Domain</th>
              <th>CATH S40</th>
              <th>TED50</th>
              <th>Gene3D</th>
              <th>Pfam</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ds.map((d) => (
              <tr key={d.d}>
                <td>
                  <b>{d.d}</b>
                  <small>{d.seg}</small>
                </td>
                <td>
                  <Call sf={d.A} extra={blank(d.A) ? "" : `TM ${(+d.Atm).toFixed(2)}`} />
                </td>
                <td>
                  <Call
                    sf={d.T}
                    extra={blank(d.T) ? "" : `TM ${Math.min(+d.Ttm, 1).toFixed(2)}`}
                    fallback={blank(d.Tl) ? "" : d.Tl}
                  />
                </td>
                <td>
                  <Call sf={d.B} />
                </td>
                <td>
                  {blank(d.C) ? (
                    <Faint>–</Faint>
                  ) : (
                    d.C.split(";").map((c, i) => (
                      <React.Fragment key={`${c}${i}`}>
                        {i > 0 && <br />}
                        {c}
                      </React.Fragment>
                    ))
                  )}
                </td>
                <td>{VERDICT[d.agr] && <Verdict $kind={d.agr}>{VERDICT[d.agr]}</Verdict>}</td>
              </tr>
            ))}
          </tbody>
        </CallTable>
      </TableScroll>
      <Trail>
        {steps.map(([title, body]) => (
          <TrailStep key={title}>
            <TrailTitle>{title}</TrailTitle>
            {body}
          </TrailStep>
        ))}
      </Trail>
    </>
  )
}

/* ---------- styles ---------- */

const TrackSvg = styled.svg`
  display: block;
  width: 100%;
  height: auto;
  margin-top: 0.4rem;
  overflow: visible;

  text {
    fill: ${INK_SOFT};
    font-size: 11px;
  }

  .lane {
    fill: ${INK};
    font-weight: 600;
  }

  .in {
    fill: #fff;
    font-family: var(--font-mono), monospace;
    font-size: 10.5px;
    pointer-events: none;
  }

  rect {
    cursor: default;
  }
`

const Faint = styled.span`
  color: ${MUTED};
`

const CallFields = styled.dl`
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

const Special = styled.p`
  && {
    margin: 0.2rem 0;
    padding: 0.5rem 0.7rem;
    border-left: 3px solid ${INK_SOFT};
    border-radius: 0 6px 6px 0;
    background: ${SUNK};
    color: ${INK};
    font-size: 0.82rem;
  }
`

const TableScroll = styled.div`
  overflow-x: auto;
`

const CallTable = styled.table`
  && {
    width: 100%;
    margin: 0.4rem 0;
    border-collapse: collapse;
    font-size: 0.78rem;
  }

  th,
  td {
    padding: 0.3rem 0.4rem;
    border-bottom: 1px solid ${SUNK};
    text-align: left;
    vertical-align: top;
  }

  th {
    color: ${MUTED};
    font-weight: 600;
    white-space: nowrap;
  }

  small {
    display: block;
    color: ${MUTED};
  }
`

const VERDICT_COLOR = {
  agree: "#3f7a5a",
  single_route: "#805340",
  no_hit: "#8a6c57",
  conflict: "#ac493d",
}

const Verdict = styled.span`
  padding: 0.05rem 0.4rem;
  border-radius: 4px;
  background: ${({ $kind }) => VERDICT_COLOR[$kind] ?? MUTED};
  color: #fff;
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
`
