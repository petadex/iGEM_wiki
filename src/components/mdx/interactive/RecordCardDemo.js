import { withPrefix } from "gatsby"
import React, { useEffect, useMemo, useRef, useState } from "react"
import styled, { css, keyframes } from "styled-components"
import DEMO from "../../../data/recordCardDemo.json"
import WORLD from "../../../data/worldOutline.json"
import { ExpandWindow } from "../ExpandWindow.js"
import {
  CHAIN_COLORS,
  PLDDT_COLORS,
  PLAIN_COLOR,
  PLDDT_DOMAIN,
  StructureViewer,
  TRIAD_COLOR,
  cssColor,
} from "./StructureViewer.js"

/**
 * Demo D3: one enzyme's record on petadex.net, a layer at a time.
 *
 * Two real records, IsPETase and LCC, frozen from the live API on the date in
 * src/data/recordCardDemo.json by scripts/build-record-card-demo.mjs (the
 * script's header lists the calls). The page calls nothing off this site.
 *
 * The structure layer is petadex.net's own Mol* viewer, in
 * StructureViewer.js, reading a structure file the same script writes to
 * static/figures/record-card/. The origin layer draws
 * src/data/worldOutline.json, a coarse land outline in equirectangular
 * degrees, so a point is placed by its own longitude and latitude.
 *
 * Colours follow the Dry Lab figure style guide, the same palette as
 * DiamondSearchDemo.js beside it.
 */

const INK = "#5f3928"
const INK_SOFT = "#805340"
const PAPER = "#f3e9e5"
const CARD = "#fbf6f3"
const FRAME = "#c8b388"
const COMPUTE = "#b6693d"
const LOGAN = "#3f7a5a"
const REF = "#4a5f8c"
const LINE = "#e2d3c8"
const MUTED = "#8a7266"

const SITE = "https://petadex.net"

const MEDIA_LABEL = { "BHET12.5": "12.5 mM BHET", "BHET25": "25 mM BHET" }
const COMPARE_STYLE = {
  "FAST-PETase": { color: REF, dash: null },
  EV: { color: MUTED, dash: "4 3" },
}
const COMPARE_LABEL = { "FAST-PETase": "FAST-PETase", EV: "Empty vector" }

const LAYERS = [
  { key: "structure", label: "Structure", note: "predicted fold" },
  { key: "sequence", label: "Sequence", note: "residues and domain" },
  { key: "origin", label: "Origin", note: "where it was found" },
  { key: "neighbours", label: "Neighbours", note: "sequence search" },
  { key: "clusters", label: "Clusters", note: "90 / 60 / 30%" },
  { key: "lobster", label: "Library", note: "what LOBSTER ordered" },
  { key: "activity", label: "Activity", note: "halo assay" },
]

const TRIAD_NAME = { S: "serine", D: "aspartate", H: "histidine" }

const fmtInt = (n) => Number(n).toLocaleString("en-US")
const titleCase = (s) => (s ? s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : "—")
const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export const RecordCardDemo = () => {
  const [recordIndex, setRecordIndex] = useState(0)
  const [layer, setLayer] = useState(0)
  const record = DEMO.records[recordIndex]
  const current = LAYERS[layer].key

  return (
    <Wrap>
      <ExpandWindow title="Sequence record demo" inlineTitle={false} ground={PAPER}>
        {(open) => (
          <Demo $open={open}>
            <Head>
              <div>
                <Kicker>Demo · real records from petadex.net</Kicker>
                <Title>One enzyme, every layer.</Title>
                <Sub>One record, layer by layer. Pick an enzyme, then step down the left.</Sub>
              </div>
              <Cta
                href={`${SITE}/sequence/${record.accession}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open this record →
              </Cta>
            </Head>

            <Chips role="group" aria-label="Records">
              {DEMO.records.map((r, i) => (
                <Chip
                  key={r.key}
                  type="button"
                  aria-pressed={i === recordIndex}
                  onClick={() => setRecordIndex(i)}
                >
                  {r.name}
                </Chip>
              ))}
            </Chips>

            <IdCard>
              <IdName>
                {record.name} <Mono>{record.accession}</Mono>
              </IdName>
              <IdMeta>
                <i>{record.organism}</i> · {record.seq.length} aa · {record.blurb}
              </IdMeta>
            </IdCard>

            <Body>
              <Stack role="tablist" aria-label="Record layers" aria-orientation="vertical">
                {LAYERS.map((l, i) => {
                  const empty = l.key === "activity" && !record.curves
                  return (
                    <Tab
                      key={l.key}
                      type="button"
                      role="tab"
                      id={`rc-tab-${l.key}`}
                      aria-selected={i === layer}
                      aria-controls="rc-panel"
                      $empty={empty}
                      onClick={() => setLayer(i)}
                    >
                      <TabNum>{i + 1}</TabNum>
                      <span>
                        <TabLabel>{l.label}</TabLabel>
                        <TabNote>{empty ? "not assayed" : l.note}</TabNote>
                      </span>
                    </Tab>
                  )
                })}
              </Stack>

              <Panel id="rc-panel" role="tabpanel" aria-labelledby={`rc-tab-${current}`}>
                {current === "structure" && <StructureLayer record={record} />}
                {current === "sequence" && <SequenceLayer record={record} />}
                {current === "origin" && <OriginLayer record={record} />}
                {current === "neighbours" && <NeighboursLayer record={record} />}
                {current === "clusters" && <ClustersLayer record={record} />}
                {current === "lobster" && <LobsterLayer record={record} />}
                {current === "activity" && <ActivityLayer record={record} />}

                <Step>
                  <StepButton type="button" disabled={layer === 0} onClick={() => setLayer(layer - 1)}>
                    ← {layer > 0 ? LAYERS[layer - 1].label : ""}
                  </StepButton>
                  <Mono>
                    {layer + 1} / {LAYERS.length}
                  </Mono>
                  <StepButton
                    type="button"
                    disabled={layer === LAYERS.length - 1}
                    onClick={() => setLayer(layer + 1)}
                  >
                    {layer < LAYERS.length - 1 ? LAYERS[layer + 1].label : ""} →
                  </StepButton>
                </Step>
              </Panel>
            </Body>

            <Foot>
              Frozen from the petadex.net API on {DEMO.fetched}.
            </Foot>
          </Demo>
        )}
      </ExpandWindow>
    </Wrap>
  )
}

/* ---------- layer 1: structure ---------- */

const COLOR_MODES = [
  { value: "chain", label: "Along the chain" },
  { value: "plddt", label: "Confidence" },
]

// The legend's ramps, built from the viewer's own colour lists. The
// confidence list is ordered from the confident end down, the way Mol*'s
// reversed scale wants it, so it is flipped to read low to high.
const CHAIN_RAMP = CHAIN_COLORS.map(cssColor)
const PLDDT_RAMP = [...PLDDT_COLORS].reverse().map(cssColor)
const PLAIN_RAMP = [cssColor(PLAIN_COLOR), cssColor(PLAIN_COLOR)]

const StructureLayer = ({ record }) => {
  const { structure, triad } = record
  const [mode, setMode] = useState("chain")
  const [spin, setSpin] = useState(true)
  // Drops the cartoon to plain white, so only the catalytic triad carries
  // any colour. The chosen ramp is remembered for when it is switched back.
  const [plain, setPlain] = useState(false)

  useEffect(() => {
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setSpin(false)
    }
  }, [])

  const mean = Math.round(structure.plddt.reduce((s, v) => s + v, 0) / structure.plddt.length)

  return (
    <>
      <LayerTitle>Predicted fold</LayerTitle>
      <Controls>
        <Segmented role="group" aria-label="Colour the chain by">
          {COLOR_MODES.map((m) => (
            <SegButton key={m.value} type="button" aria-pressed={mode === m.value} onClick={() => setMode(m.value)}>
              {m.label}
            </SegButton>
          ))}
        </Segmented>
        <StepButton type="button" onClick={() => setSpin(!spin)}>
          {spin ? "Pause" : "Spin"}
        </StepButton>
        <Muted>Drag to turn it, scroll to zoom</Muted>
      </Controls>

      <Stage
        aria-label={`Predicted structure of ${record.name}: a cartoon of its ${structure.n} residues with its catalytic triad drawn as ball-and-stick`}
      >
        <StructureViewer
          src={withPrefix(`/figures/record-card/${record.key}.pdb`)}
          triad={triad}
          mode={plain ? "plain" : mode}
          spin={spin}
          label={`${record.name} · ${structure.id}`}
        />
        {/* A ramp, not swatches: both colour modes interpolate, and the old
            key drew a continuous scale as two discrete squares. The stops are
            the viewer's own, so the two cannot drift apart. */}
        <Key>
          <ScaleName>
            {plain ? "Chain uncoloured" : mode === "plddt" ? "pLDDT confidence" : "N to C terminus"}
          </ScaleName>
          <Scale>
            <ScaleEnd>{plain ? "" : mode === "plddt" ? PLDDT_DOMAIN[0] : "N"}</ScaleEnd>
            <Ramp
              $stops={plain ? PLAIN_RAMP : mode === "plddt" ? PLDDT_RAMP : CHAIN_RAMP}
              $flat={plain}
            />
            <ScaleEnd>{plain ? "" : mode === "plddt" ? `${PLDDT_DOMAIN[1]}+` : "C"}</ScaleEnd>
          </Scale>
          <TriadRow>
            <Dot style={{ background: cssColor(TRIAD_COLOR) }} />
            catalytic triad
          </TriadRow>
          <Toggle type="button" aria-pressed={plain} onClick={() => setPlain(!plain)}>
            <Box aria-hidden="true">{plain ? "✓" : ""}</Box>
            white chain
          </Toggle>
        </Key>
      </Stage>

      <Caption>
        {structure.method}, {structure.n} residues, mean {mean} pLDDT ·{" "}
        <Mono>{structure.id}</Mono>. Picked out in the fold: the catalytic
        triad, {triad.map(([pos, aa]) => `${TRIAD_NAME[aa]} ${pos}`).join(", ")},
        where a PET chain is cut.
      </Caption>
    </>
  )
}


/* ---------- layer 2: sequence ---------- */

const SequenceLayer = ({ record }) => {
  const { seq, motifs, domains, triad } = record
  const len = seq.length
  const X = (pos) => 10 + ((pos - 1) / len) * 500
  const triadAt = new Map(triad.map(([pos, aa]) => [pos, aa]))

  const inDomain = (i) => domains.some((d) => i + 1 >= d.from && i + 1 <= d.to)
  const inMotif = (i) => motifs.some(([a, b]) => i + 1 >= a && i + 1 <= b)

  // How many residues fit on one line, measured rather than fixed at 50, so
  // the block fills the panel instead of stopping halfway across it. The
  // probe is ten monospace characters of the block's own font.
  const boxRef = useRef(null)
  const [perLine, setPerLine] = useState(50)
  useEffect(() => {
    const box = boxRef.current
    if (!box || typeof ResizeObserver !== "function") return undefined
    const fit = () => {
      const probe = box.querySelector("[data-probe]")
      const gutter = box.querySelector("[data-gutter]")
      if (!probe || !gutter) return
      const ch = probe.getBoundingClientRect().width / 10
      const style = window.getComputedStyle(box)
      const room =
        box.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight) -
        gutter.getBoundingClientRect().width -
        parseFloat(window.getComputedStyle(gutter.parentNode).columnGap || 0)
      if (!(ch > 0) || !(room > 0)) return
      setPerLine(Math.max(10, Math.floor(room / ch / 10) * 10))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  const lines = []
  for (let i = 0; i < len; i += perLine) lines.push(i)

  return (
    <>
      <LayerTitle>Residues and domain</LayerTitle>
      <svg viewBox="0 0 520 64" role="img" aria-label="Map of the sequence">
        <rect x="10" y="30" width="500" height="6" rx="2" fill={LINE} />
        {domains.map((d) => (
          <g key={d.hmm}>
            <rect x={X(d.from)} y="26" width={X(d.to) - X(d.from)} height="14" rx="3" fill={COMPUTE} />
            <text x={X(d.from)} y="20" fontSize="10" fill={INK}>
              {d.name} · {d.from}–{d.to}
            </text>
          </g>
        ))}
        {triad.map(([pos, aa]) => (
          <g key={pos}>
            <rect x={X(pos) - 1.5} y="22" width="3" height="22" fill={INK} />
            <text x={X(pos)} y="56" fontSize="9" fill={INK} textAnchor="middle">
              {aa}
              {pos}
            </text>
          </g>
        ))}
        <text x="10" y="56" fontSize="9" fill={MUTED}>
          1
        </text>
        <text x="510" y="56" fontSize="9" fill={MUTED} textAnchor="end">
          {len}
        </text>
      </svg>

      <Residues ref={boxRef} aria-label="Amino-acid sequence">
        <Probe data-probe aria-hidden="true">
          AAAAAAAAAA
        </Probe>
        {lines.map((start) => (
          <div key={start}>
            <ResNum data-gutter={start === 0 ? "" : undefined}>{start + 1}</ResNum>
            <span>
              {seq
                .slice(start, start + perLine)
                .split("")
                .map((aa, j) => {
                  const i = start + j
                  return (
                    <Res
                      key={i}
                      $motif={inMotif(i)}
                      $domain={inDomain(i)}
                      $triad={triadAt.has(i + 1)}
                      title={triadAt.has(i + 1) ? `catalytic ${TRIAD_NAME[aa]} ${i + 1}` : undefined}
                    >
                      {aa}
                    </Res>
                  )
                })}
            </span>
          </div>
        ))}
      </Residues>

      <Caption>
        Shaded: the <b>{domains[0]?.name}</b> domain, from a profile search
        against known plastic degraders (PAZy HMMs). Dark: the triad, its
        serine inside the G-x-S-x-G motif at {motifs[0]?.[0]}.
      </Caption>
    </>
  )
}

/* ---------- layer 3: origin ---------- */

/** The pins' bounding box, padded, so each map frames its own points. */
const frame = (points) => {
  const lons = points.map((p) => p.lon)
  const lats = points.map((p) => p.lat)
  const west = Math.max(-180, Math.min(...lons) - 12)
  const east = Math.min(180, Math.max(...lons) + 12)
  const north = Math.min(85, Math.max(...lats) + 12)
  const south = Math.max(-60, Math.min(...lats) - 12)
  return { x: west, y: -north, w: east - west, h: north - south }
}

const OriginLayer = ({ record }) => {
  const [hover, setHover] = useState(null)
  const o = record.origin
  const places = record.neighbours.places
  const box = useMemo(() => frame([...places, { lat: o.lat, lon: o.lon }]), [places, o])
  // Pins are drawn in degrees, so undo the viewBox's stretch to keep them round.
  const r = box.w / 150
  const countries = new Set(places.map((p) => p.country).filter(Boolean))
  const shown = hover ?? null

  return (
    <>
      <LayerTitle>Where it was found</LayerTitle>
      <MapBox>
        <svg
          viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
          role="img"
          aria-label={`World map: ${record.name} was found at ${o.place}, and ${places.length} of its relatives have a recorded location`}
        >
          <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#eef3f4" />
          <path d={WORLD.path} fill="#e7ddd1" stroke={FRAME} strokeWidth={box.w / 1200} />
          {places.map((p) => (
            <circle
              key={p.o}
              cx={p.lon}
              cy={-p.lat}
              r={r}
              fill={LOGAN}
              opacity="0.7"
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{[p.country, p.source, p.year].filter(Boolean).join(" · ")}</title>
            </circle>
          ))}
          <circle cx={o.lon} cy={-o.lat} r={r * 2} fill="none" stroke={COMPUTE} strokeWidth={r / 2} />
          <circle cx={o.lon} cy={-o.lat} r={r * 1.1} fill={COMPUTE} />
        </svg>
        <MapKey>
          <span>
            <i style={{ background: COMPUTE }} />
            {record.name}, {o.place}
          </span>
          <span>
            <i style={{ background: LOGAN, opacity: 0.7 }} />
            {places.length} relatives with a location
          </span>
        </MapKey>
      </MapBox>

      <Hovered>
        {shown ? (
          <>
            <b>{shown.country || "Location not stated"}</b>
            {shown.source ? ` · ${titleCase(shown.source)}` : ""}
            {shown.year ? ` · ${shown.year}` : ""}
            {shown.profile ? (
              <>
                {" "}
                <Pill>{titleCase(shown.profile)}</Pill>
              </>
            ) : null}
          </>
        ) : (
          <Muted>Hover a point for its sample.</Muted>
        )}
      </Hovered>

      <Facts>
        <dt>Discovered</dt>
        <dd>
          {o.what}, {o.place}, {o.year}
        </dd>
        <dt>Reported in</dt>
        <dd>
          <a href={`https://doi.org/${o.doi}`} target="_blank" rel="noopener noreferrer">
            {o.ref}
          </a>
        </dd>
      </Facts>

      <Caption>
        Found once in {o.place}; its Logan relatives place it in{" "}
        {countries.size} countries. {places.length} of{" "}
        {fmtInt(record.neighbours.logan)} carry a stated location.
      </Caption>
    </>
  )
}

/* ---------- layer 4: neighbours ---------- */

const NeighboursLayer = ({ record }) => {
  const nb = record.neighbours
  const best = nb.top[0]
  return (
    <>
      <LayerTitle>Closest relatives</LayerTitle>
      <Stats>
        <Stat>
          <b>
            {fmtInt(nb.n)}
            {nb.n >= nb.depth ? "+" : ""}
          </b>
          <span>relatives found</span>
        </Stat>
        <Stat>
          <b>{best ? `${best.pid.toFixed(1)}%` : "—"}</b>
          <span>identity of the closest</span>
        </Stat>
        <Stat>
          <b>{Math.round((nb.logan / nb.n) * 100)}%</b>
          <span>found only in Logan</span>
        </Stat>
        <Stat>
          <span>identity of all relatives</span>
          <Histogram counts={nb.hist} />
        </Stat>
      </Stats>
      <Hits>
        {nb.top.map((h) => (
          <HitRow key={h.o}>
            <span>
              <HitId>
                <Badge $source={h.s}>{h.s === "logan" ? "Logan" : "NCBI"}</Badge>
                <a href={`${SITE}/sequence/orf/${h.o}`} target="_blank" rel="noopener noreferrer">
                  {h.id}
                </a>
              </HitId>
              <HitLabel>
                {h.lab || (h.s === "logan" ? "Sequencing run" : "")}
                {h.org && (
                  <>
                    {" · "}
                    <i>{h.org}</i>
                  </>
                )}
              </HitLabel>
            </span>
            <Meter>
              <Bar fraction={h.pid / 100} color={h.s === "logan" ? LOGAN : REF} />
              <Num>{h.pid.toFixed(1)}%</Num>
            </Meter>
            <Meter className="c-cov">
              <Track from={h.q[0]} to={h.q[1]} len={record.seq.length} />
              <Num>{h.cov}%</Num>
            </Meter>
          </HitRow>
        ))}
      </Hits>
      <Caption>
        Identity, then coverage of this enzyme, from the{" "}
        <a href="#sharded-diamond-search">sharded DIAMOND search</a> below.{" "}
        <a href={`${SITE}/results?job=${nb.sessionId}`} target="_blank" rel="noopener noreferrer">
          Full result →
        </a>
      </Caption>
    </>
  )
}

/* ---------- layer 5: clusters ---------- */

const ClustersLayer = ({ record }) => {
  const [pick, setPick] = useState(0)
  const clusters = record.clusters
  const c = clusters[pick]
  const max = Math.log10(clusters[clusters.length - 1].members)

  return (
    <>
      <LayerTitle>Its place in the families</LayerTitle>
      <Nest role="group" aria-label="Cluster levels">
        {clusters.map((cl, i) => (
          <NestRow key={cl.level} type="button" aria-pressed={i === pick} onClick={() => setPick(i)}>
            <span>{cl.level}% identity</span>
            <NestBar>
              <i style={{ width: `${Math.max(4, (Math.log10(cl.members) / max) * 100)}%` }} />
            </NestBar>
            <Num>{fmtInt(cl.members)}</Num>
          </NestRow>
        ))}
      </Nest>
      <NestAxis>members, log scale · each level contains the one above</NestAxis>

      <ClusterCard>
        <Facts>
          <dt>Cluster</dt>
          <dd>
            <a href={`${SITE}/cluster/${c.level}/${c.id}`} target="_blank" rel="noopener noreferrer">
              {c.level}% cluster <Mono>{c.id}</Mono>
            </a>
          </dd>
          <dt>Representative</dt>
          <dd>
            <Mono>{c.centroid}</Mono> <Muted>from {c.centroidSource}</Muted>
          </dd>
          {c.domain && (
            <>
              <dt>Fold</dt>
              <dd>
                {c.domain} <Muted>CATH {c.cath}</Muted>
              </dd>
            </>
          )}
          <dt>Members</dt>
          <dd>
            <Split>
              {c.sra > 0 && <i style={{ flex: c.sra, background: LOGAN }} />}
              {c.nr > 0 && <i style={{ flex: c.nr, background: REF }} />}
              {c.pazy > 0 && <i style={{ flex: c.pazy, background: COMPUTE }} />}
            </Split>
            <Muted>
              {fmtInt(c.sra)} Logan · {fmtInt(c.nr)} NCBI · {fmtInt(c.pazy)} known plastic
              degraders (PAZy)
            </Muted>
          </dd>
          <dt>Organisms</dt>
          <dd>
            {fmtInt(c.organisms)} <Muted>most often “{c.dominant}”</Muted>
          </dd>
        </Facts>
      </ClusterCard>

      <Caption>
        90% is near enough the same gene; 30% is a family spanning thousands of
        organisms. The 90% cluster is what LOBSTER designs for, next.
      </Caption>
    </>
  )
}

/* ---------- layer 6: LOBSTER library ---------- */

const FRAG_COLORS = ["#5e689e", "#72a09c", "#679a79", "#cba945", "#7b5f9d", "#9d5e91"]

const LobsterLayer = ({ record }) => {
  const [pick, setPick] = useState(0)
  const design = record.lobster
  if (!design) {
    return (
      <>
        <LayerTitle>What LOBSTER ordered</LayerTitle>
        <Empty>No library was designed for this record.</Empty>
      </>
    )
  }
  const { k, width, fragments, adapters } = design
  const total = fragments.reduce((s, f) => s + f.oligos, 0)
  // One oligo from each position is one assembly; a degenerate oligo is a mix
  // of several sequences, so the library is larger than the assembly count.
  const combos = fragments.reduce((s, f) => s * f.oligos, 1)
  const variants = fragments.reduce((s, f) => s * (f.vars ?? f.oligos), 1)
  const nt = fragments.reduce((s, f) => s + f.nt, 0)
  const f = fragments[pick]

  return (
    <>
      <LayerTitle>What LOBSTER ordered</LayerTitle>
      <Frags role="group" aria-label="Fragment positions">
        <AdapterCap>
          5′
          <Mono>{adapters.left.seq}</Mono>
        </AdapterCap>
        <FragTrack>
          {fragments.map((fr, i) => (
            <FragBlock
              key={fr.idx}
              type="button"
              aria-pressed={i === pick}
              style={{ flexGrow: fr.span, background: FRAG_COLORS[i % FRAG_COLORS.length] }}
              onClick={() => setPick(i)}
            >
              <b>FP{fr.idx}</b>
              <span>×{fr.oligos}</span>
            </FragBlock>
          ))}
        </FragTrack>
        <AdapterCap>
          3′
          <Mono>{adapters.right.seq}</Mono>
        </AdapterCap>
      </Frags>
      <NestAxis>
        {width} alignment columns in {k} fragment positions · click one
      </NestAxis>

      <Stats>
        <Stat>
          <b>{total}</b>
          <span>oligos ordered</span>
        </Stat>
        <Stat>
          <b>{fmtInt(variants)}</b>
          <span>genes in the library</span>
        </Stat>
        <Stat>
          <b>{fmtInt(nt)}</b>
          <span>nucleotides of DNA</span>
        </Stat>
        <Stat>
          <b>{fragments.reduce((s, fr) => s + fr.deg.length, 0)}</b>
          <span>degenerate positions</span>
        </Stat>
      </Stats>

      <ClusterCard>
        <Facts>
          <dt>Position</dt>
          <dd>
            FP{f.idx} · columns {f.start}–{f.end} · {f.oligos} oligo
            {f.oligos === 1 ? "" : "s"} · {f.deg.length} degenerate column
            {f.deg.length === 1 ? "" : "s"}
            {f.vars != null && f.vars !== f.oligos && ` · ${f.vars} variants`}
          </dd>
          <dt>One of its oligos</dt>
          <dd>
            <Oligo>
              {f.example.split("").map((base, i) =>
                "ACGT".includes(base) ? base : <Deg key={i}>{base}</Deg>
              )}
            </Oligo>
          </dd>
        </Facts>
      </ClusterCard>

      <Caption>
        <a href="#lobster">LOBSTER</a> orders {total} oligos instead of whole
        genes; Golden Gate joins one per position into {fmtInt(combos)}{" "}
        assemblies. Highlighted bases are degenerate — one oligo that is really
        a mix — which takes those to {fmtInt(variants)} distinct genes.
      </Caption>
    </>
  )
}

/* ---------- layer 7: activity ---------- */

const ActivityLayer = ({ record }) => {
  const [media, setMedia] = useState(DEMO.media[DEMO.media.length - 1])
  const series = useMemo(() => {
    if (!record.curves) return []
    return [
      ...DEMO.compare.map((c) => ({
        ...COMPARE_STYLE[c.gene],
        gene: c.gene,
        label: COMPARE_LABEL[c.gene],
        pts: c.curves[media],
      })),
      { gene: record.gene, label: record.name, color: COMPUTE, dash: null, pts: record.curves[media], main: true },
    ]
  }, [record, media])

  if (!record.curves) {
    return (
      <>
        <LayerTitle>Halo assay</LayerTitle>
        <Empty>
          {record.name} was not one of the genes we synthesised. IsPETase was.
        </Empty>
      </>
    )
  }

  const ranked = DEMO.lateMax[media]
  const rank = ranked.findIndex(([g]) => g === record.gene) + 1
  const value = (g) => ranked.find(([x]) => x === g)?.[1]
  const mine = value(record.gene)
  const ev = value("EV")

  return (
    <>
      <LayerTitle>How it did in our halo assay</LayerTitle>
      <Controls>
        <Segmented role="group" aria-label="Substrate concentration">
          {DEMO.media.map((m) => (
            <SegButton key={m} type="button" aria-pressed={m === media} onClick={() => setMedia(m)}>
              {MEDIA_LABEL[m]}
            </SegButton>
          ))}
        </Segmented>
        <Legend>
          {series.map((s) => (
            <span key={s.gene}>
              <svg width="18" height="8" aria-hidden="true">
                <line
                  x1="0"
                  y1="4"
                  x2="18"
                  y2="4"
                  stroke={s.color}
                  strokeWidth={s.main ? 3 : 2}
                  strokeDasharray={s.dash || undefined}
                />
              </svg>
              {s.label}
            </span>
          ))}
        </Legend>
      </Controls>

      {/* Keyed, so switching substrate replays the wipe. */}
      <TimeChart key={`${record.key}-${media}`} series={series} />

      <SubTitle>
        {ordinal(rank)} of {ranked.length} genes tested
      </SubTitle>
      <RankStrip ranked={ranked} gene={record.gene} label={record.name} />

      <Caption>
        Yeast displaying the enzyme on BHET, a building block of PET: as it is
        broken down the plate clears and intensity rises. {record.name} reaches{" "}
        {mine.toFixed(2)} against {ev.toFixed(2)} for the empty vector. Means
        over replicate colonies; ranked on each gene's highest from 24 h on.
      </Caption>
    </>
  )
}

/* ---------- small figures ---------- */

const TimeChart = ({ series }) => {
  const clipId = `rc-wipe-${React.useId().replace(/:/g, "")}`
  const W = 520
  const H = 190
  const pad = { l: 40, r: 20, t: 10, b: 28 }
  const all = series.flatMap((s) => s.pts)
  const hours = [...new Set(all.map((p) => p[0]))].sort((a, b) => a - b)
  const yLo = Math.floor(Math.min(0, ...all.map((p) => p[1])) * 20) / 20
  const yHi = Math.ceil(Math.max(...all.map((p) => p[1])) * 20) / 20
  const X = (h) => pad.l + ((h - hours[0]) / (hours[hours.length - 1] - hours[0])) * (W - pad.l - pad.r)
  const Y = (v) => pad.t + ((yHi - v) / (yHi - yLo)) * (H - pad.t - pad.b)
  const ticks = []
  for (let v = yLo; v <= yHi + 1e-9; v += 0.05) ticks.push(Number(v.toFixed(2)))

  return (
    <ChartSvg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Mean halo intensity over time for each gene">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? FRAME : LINE} />
          <text x={pad.l - 6} y={Y(v) + 3} fontSize="9" fill={MUTED} textAnchor="end">
            {v.toFixed(2)}
          </text>
        </g>
      ))}
      {hours.map((h) => (
        <text key={h} x={X(h)} y={H - 12} fontSize="9" fill={MUTED} textAnchor="middle">
          {h} h
        </text>
      ))}
      {/* The curves are revealed by a wipe that runs left to right, so the
          reader watches the assay develop in the order it was measured. A
          wipe rather than a dash offset, because one series is dashed. */}
      <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
        <Wipe x={pad.l - 6} y="0" width={W - pad.l - pad.r + 12} height={H} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {series.map((s) => (
          <g key={s.gene}>
            <polyline
              points={s.pts.map(([h, v]) => `${X(h)},${Y(v)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={s.main ? 3 : 1.75}
              strokeDasharray={s.dash || undefined}
              strokeLinejoin="round"
            />
            {s.pts.map(([h, v, sd]) => (
              <circle key={h} cx={X(h)} cy={Y(v)} r={s.main ? 3.5 : 2.5} fill={s.color}>
                <title>{`${s.label}, ${h} h: ${v.toFixed(3)} ± ${sd.toFixed(3)}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </g>
    </ChartSvg>
  )
}

/** Every gene tested, one tick each, by its highest mean intensity. */
const RankStrip = ({ ranked, gene, label }) => {
  const W = 520
  const vals = ranked.map((r) => r[1])
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const X = (v) => 10 + ((v - lo) / (hi - lo)) * (W - 20)
  const marks = [
    [gene, COMPUTE, label, 10],
    ["EV", MUTED, "empty vector", 50],
  ]
  return (
    <ChartSvg viewBox={`0 0 ${W} 54`} role="img" aria-label="Every gene's highest mean intensity">
      {ranked.map(([g, v]) => (
        <line key={g} x1={X(v)} x2={X(v)} y1="18" y2="34" stroke={FRAME} strokeWidth="1">
          <title>{`${g}: ${v.toFixed(3)}`}</title>
        </line>
      ))}
      {marks.map(([g, color, text, y]) => {
        const v = ranked.find((r) => r[0] === g)?.[1]
        if (v == null) return null
        const x = X(v)
        const anchor = x > W - 80 ? "end" : x < 80 ? "start" : "middle"
        return (
          <g key={g}>
            <line x1={x} x2={x} y1="14" y2="38" stroke={color} strokeWidth="3" />
            <text x={x} y={y} fontSize="9" fill={color} textAnchor={anchor}>
              {text}
            </text>
          </g>
        )
      })}
    </ChartSvg>
  )
}

const Bar = ({ fraction, color }) => (
  <MeterSvg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
    <rect width="100" height="8" rx="2" fill="#efe4dc" />
    <rect width={(Math.max(0, Math.min(1, fraction)) * 100).toFixed(1)} height="8" rx="2" fill={color} />
  </MeterSvg>
)

const Track = ({ from, to, len }) => (
  <MeterSvg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
    <rect y="3" width="100" height="2" fill={LINE} />
    <rect
      x={(((from - 1) / len) * 100).toFixed(1)}
      width={(((to - from + 1) / len) * 100).toFixed(1)}
      height="8"
      rx="2"
      fill={COMPUTE}
    />
  </MeterSvg>
)

/** Identities in 10% bins from 20% to 100%, as in the DIAMOND demo. */
const Histogram = ({ counts }) => {
  const max = Math.max(...counts) || 1
  const w = 100 / counts.length
  return (
    <>
      <HistSvg viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label="Histogram of identities from 20% to 100%">
        {counts.map((c, i) => {
          const h = (c / max) * 30
          return (
            <rect key={i} x={i * w + 1} y={32 - h} width={w - 2} height={Math.max(h, c ? 1 : 0)} fill={COMPUTE}>
              <title>{`${20 + i * 10}–${30 + i * 10}%: ${c}`}</title>
            </rect>
          )
        })}
      </HistSvg>
      <Axis>
        <span>20%</span>
        <span>60%</span>
        <span>100%</span>
      </Axis>
    </>
  )
}

/* ---------- styles ---------- */

const PHONE = "@media (max-width: 720px)"

const Mono = styled.span`
  font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.92em;
`

const Muted = styled.span`
  color: ${MUTED};
`

const Wrap = styled.div`
  margin: var(--space-lg) 0;
`

const Demo = styled.section`
  padding: 1.25rem;
  border: 1px solid ${FRAME};
  border-radius: 14px;
  background: ${PAPER};
  color: ${INK};
  font-size: 0.95rem;
  line-height: 1.45;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    min-width: 0;
  }

  &&& a {
    color: ${COMPUTE};
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  ${PHONE} {
    padding: 1rem;
  }

  ${({ $open }) =>
    $open &&
    css`
      width: 100%;
      max-width: 76rem;
      margin: 0 auto;
      padding: 1.5rem 2rem 2rem;
      border: 0;
      border-radius: 0;
    `}
`

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: flex-end;
  justify-content: space-between;

  > div {
    flex: 1 1 22rem;
  }
`

const Kicker = styled.div`
  color: ${COMPUTE};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const Title = styled.h3`
  &&& {
    margin: 0.15rem 0 0.25rem;
  }
  font-family: var(--font-display), Georgia, serif;
  font-size: 1.6rem;
  font-weight: 400;
  line-height: 1.15;

  ${PHONE} {
    font-size: 1.35rem;
  }
`

const Sub = styled.p`
  max-width: 35rem;
  margin: 0;
  color: ${INK_SOFT};
`

// Four &s to outrank the demo's own "&&& a" link colour.
const Cta = styled.a`
  &&&& {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    padding: 0.6rem 1rem;
    border-radius: 999px;
    background: ${INK};
    color: ${PAPER};
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }

  &&&&:hover {
    background: ${COMPUTE};
  }
`

const Chips = styled.div`
  display: flex;
  gap: 0.5rem;
  margin: 0.85rem 0 0.7rem;
  overflow-x: auto;
`

const Chip = styled.button`
  flex: none;
  padding: 0.35rem 0.85rem;
  border: 1px solid ${FRAME};
  border-radius: 999px;
  background: ${CARD};
  color: ${INK};
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;

  &:hover {
    border-color: ${COMPUTE};
  }

  &[aria-pressed="true"] {
    border-color: ${INK};
    background: ${INK};
    color: ${PAPER};
  }
`

const IdCard = styled.div`
  padding: 0.6rem 0.9rem;
  border: 1px solid ${LINE};
  border-radius: 10px 10px 0 0;
  background: ${CARD};
`

const IdName = styled.div`
  font-family: var(--font-display), Georgia, serif;
  font-size: 1.25rem;

  span {
    color: ${MUTED};
    font-size: 0.8rem;
  }
`

const IdMeta = styled.div`
  color: ${INK_SOFT};
  font-size: 0.8rem;
`

const Body = styled.div`
  display: grid;
  grid-template-columns: 11rem minmax(0, 1fr);
  border: 1px solid ${LINE};
  border-top: 0;
  border-radius: 0 0 10px 10px;
  background: #fff;

  ${PHONE} {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0.5rem;
  border-right: 1px solid ${LINE};
  background: ${CARD};

  ${PHONE} {
    flex-direction: row;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid ${LINE};
  }
`

const Tab = styled.button`
  display: flex;
  flex: none;
  gap: 0.5rem;
  align-items: center;
  padding: 0.35rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: ${INK};
  font: inherit;
  text-align: left;
  cursor: pointer;
  opacity: ${({ $empty }) => ($empty ? 0.55 : 1)};

  &:hover {
    border-color: ${LINE};
    background: #fff;
  }

  &[aria-selected="true"] {
    border-color: ${FRAME};
    background: #fff;
    box-shadow: 0 1px 0 ${FRAME};
  }

  &:focus-visible {
    outline: 2px solid ${COMPUTE};
    outline-offset: 1px;
  }
`

const TabNum = styled.span`
  display: grid;
  flex: none;
  place-items: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: ${LINE};
  font-size: 0.7rem;
  font-weight: 700;

  [aria-selected="true"] > & {
    background: ${COMPUTE};
    color: #fff;
  }
`

const TabLabel = styled.span`
  display: block;
  font-size: 0.84rem;
  font-weight: 600;
`

const TabNote = styled.span`
  display: block;
  color: ${MUTED};
  font-size: 0.68rem;

  ${PHONE} {
    display: none;
  }
`

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 27rem;
  padding: 0.9rem 1.1rem;

  ${PHONE} {
    min-height: 0;
    padding: 0.9rem;
  }
`

// A div, not an h4: the wiki's heading styles would restyle it.
const LayerTitle = styled.div`
  margin: 0;
  font-family: var(--font-display), Georgia, serif;
  font-size: 1.15rem;
`

const SubTitle = styled.div`
  color: ${INK_SOFT};
  font-size: 0.78rem;
  font-weight: 600;
`

const Caption = styled.p`
  margin: 0;
  color: ${INK_SOFT};
  font-size: 0.8rem;
`

// width is explicit: the auto side margins below cancel a flex column's
// default stretch, which would otherwise leave this shrink-wrapping a viewer
// whose children are all absolutely positioned — i.e. zero wide.
const Stage = styled.div`
  position: relative;
  width: 100%;
  max-width: 34rem;
  margin: 0 auto;
`

// Top right of the viewer, and transparent to the mouse so it never gets in
// the way of turning the structure.
const Key = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 9.5rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid ${LINE};
  border-radius: 8px;
  background: rgba(251, 246, 243, 0.86);
  color: ${INK_SOFT};
  font-size: 0.68rem;
  line-height: 1.3;
  pointer-events: none;

  ${PHONE} {
    position: static;
    width: auto;
    margin-top: 0.4rem;
    background: ${CARD};
  }
`

const ScaleName = styled.div`
  color: ${INK};
  font-weight: 600;
`

const Scale = styled.div`
  display: flex;
  gap: 0.35rem;
  align-items: center;
`

const ScaleEnd = styled.span`
  flex: none;
  font-variant-numeric: tabular-nums;
`

const Ramp = styled.span`
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(to right, ${({ $stops }) => $stops.join(", ")});
  /* A flat white bar needs an edge to be visible against the card. */
  ${({ $flat }) => $flat && css`box-shadow: inset 0 0 0 1px ${FRAME};`}
`

// The one part of the key that takes the mouse; the card itself does not, so
// that dragging the structure is never intercepted.
const Toggle = styled.button`
  display: flex;
  gap: 0.35rem;
  align-items: center;
  margin-top: 0.1rem;
  padding: 0;
  border: 0;
  background: none;
  color: ${INK_SOFT};
  font: inherit;
  cursor: pointer;
  pointer-events: auto;

  &:hover {
    color: ${COMPUTE};
  }

  &:focus-visible {
    outline: 2px solid ${COMPUTE};
    outline-offset: 2px;
  }
`

const Box = styled.span`
  display: grid;
  flex: none;
  place-items: center;
  width: 11px;
  height: 11px;
  border: 1px solid ${FRAME};
  border-radius: 3px;
  background: #fff;
  font-size: 8px;
  line-height: 1;

  [aria-pressed="true"] > & {
    border-color: ${COMPUTE};
    background: ${COMPUTE};
    color: #fff;
  }
`

const TriadRow = styled.div`
  display: flex;
  gap: 0.35rem;
  align-items: center;
`

const Dot = styled.i`
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
`

const MapBox = styled.div`
  position: relative;
  overflow: hidden;
  border: 1px solid ${LINE};
  border-radius: 10px;

  &&& svg {
    max-height: 15rem;
  }
`

const MapKey = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0 8px 0 0;
  background: rgba(251, 246, 243, 0.88);
  color: ${INK_SOFT};
  font-size: 0.7rem;

  span {
    display: inline-flex;
    gap: 0.3rem;
    align-items: center;
  }

  i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
`

const Hovered = styled.div`
  min-height: 1.4em;
  font-size: 0.8rem;
`

const Residues = styled.div`
  position: relative;
  padding: 0.4rem 0.6rem;
  overflow-x: auto;
  border: 1px solid ${LINE};
  border-radius: 6px;
  background: ${CARD};
  font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  line-height: 1.55;
  white-space: nowrap;

  > div {
    display: flex;
    gap: 0.6rem;
  }
`

// Ten characters of the block's own font, out of the flow, to measure by.
const Probe = styled.span`
  position: absolute;
  visibility: hidden;
  white-space: pre;
  pointer-events: none;
`

const ResNum = styled.span`
  flex: none;
  width: 2.2rem;
  color: ${MUTED};
  text-align: right;
`

const Res = styled.span`
  ${({ $domain }) => $domain && css`background: #f2dccd;`}
  ${({ $motif }) => $motif && css`background: #e8c9ae;`}
  ${({ $triad }) =>
    $triad &&
    css`
      background: ${INK};
      color: #fff;
      font-weight: 700;
    `}
`

const Facts = styled.dl`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 0.3rem 1rem;
  margin: 0;
  font-size: 0.84rem;

  dt {
    color: ${MUTED};
  }

  dd {
    margin: 0;
  }

  ${PHONE} {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.1rem;

    dd {
      margin-bottom: 0.4rem;
    }
  }
`

const Pill = styled.span`
  display: inline-block;
  padding: 0 0.5rem;
  border-radius: 999px;
  background: ${LOGAN};
  color: #fff;
  font-size: 0.74rem;
`

const Badge = styled.span`
  display: inline-block;
  margin-right: 0.4rem;
  padding: 1px 5px;
  border-radius: 4px;
  background: ${({ $source }) => ($source === "logan" ? LOGAN : REF)};
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  vertical-align: 1px;
`

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.5fr);
  gap: 0.45rem;

  ${PHONE} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.4rem 0.65rem;
  border: 1px solid ${LINE};
  border-radius: 10px;
  background: ${CARD};
  text-align: center;

  b {
    display: block;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
  }

  > span {
    color: ${MUTED};
    font-size: 0.7rem;
  }
`

const HistSvg = styled.svg`
  &&& {
    height: 26px;
  }
  margin-top: 0.15rem;
`

const Axis = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${MUTED};
  font-size: 0.65rem;
`

const Hits = styled.div`
  overflow: hidden;
  border: 1px solid ${LINE};
  border-radius: 10px;
`

const HitRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 118px 118px;
  gap: 0.7rem;
  align-items: center;
  padding: 0.35rem 0.7rem;

  & + & {
    border-top: 1px solid ${LINE};
  }

  ${PHONE} {
    grid-template-columns: minmax(0, 1fr) 96px;

    > .c-cov {
      display: none;
    }
  }
`

const HitId = styled.span`
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  overflow-wrap: anywhere;
`

const HitLabel = styled.span`
  display: block;
  overflow: hidden;
  color: ${INK_SOFT};
  font-size: 0.7rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Meter = styled.span`
  display: flex;
  gap: 0.4rem;
  align-items: center;
`

const MeterSvg = styled.svg`
  &&& {
    flex: 1;
    min-width: 0;
    height: 8px;
  }
`

const Num = styled.span`
  font-size: 0.78rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
`

const Nest = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const NestRow = styled.button`
  display: grid;
  grid-template-columns: 7rem minmax(0, 1fr) 4.5rem;
  gap: 0.6rem;
  align-items: center;
  padding: 0.3rem 0.5rem;
  border: 1px solid ${LINE};
  border-radius: 8px;
  background: ${CARD};
  color: ${INK};
  font: inherit;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;

  &[aria-pressed="true"] {
    border-color: ${COMPUTE};
    background: #fff;
  }
`

const NestBar = styled.span`
  display: block;
  height: 10px;
  overflow: hidden;
  border-radius: 3px;
  background: #efe4dc;

  i {
    display: block;
    height: 100%;
    background: ${COMPUTE};
  }
`

const NestAxis = styled.div`
  color: ${MUTED};
  font-size: 0.7rem;
`

const ClusterCard = styled.div`
  padding: 0.6rem 0.8rem;
  border: 1px solid ${LINE};
  border-radius: 10px;
  background: ${CARD};
`

const Split = styled.span`
  display: flex;
  max-width: 16rem;
  height: 8px;
  margin: 0.25rem 0;
  overflow: hidden;
  border-radius: 3px;

  i {
    min-width: 2px;
  }
`

const Frags = styled.div`
  display: flex;
  gap: 4px;
  align-items: stretch;
`

const AdapterCap = styled.div`
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 0.1rem;
  justify-content: center;
  width: 7.5rem;
  padding: 0.3rem 0.4rem;
  border: 1px dashed ${FRAME};
  border-radius: 6px;
  color: ${MUTED};
  font-size: 0.68rem;
  text-align: center;

  span {
    font-size: 0.6rem;
    overflow-wrap: anywhere;
  }

  ${PHONE} {
    display: none;
  }
`

const FragTrack = styled.div`
  display: flex;
  flex: 1;
  gap: 2px;
`

const FragBlock = styled.button`
  display: flex;
  flex-direction: column;
  flex-basis: 0;
  gap: 0.1rem;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0.6rem 0.2rem;
  border: 2px solid transparent;
  border-radius: 6px;
  color: #fff;
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;

  span {
    font-size: 0.7rem;
    opacity: 0.85;
  }

  &[aria-pressed="true"] {
    border-color: ${INK};
  }
`

const Oligo = styled.span`
  display: block;
  max-height: 4.5em;
  overflow-y: auto;
  font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
`

const Deg = styled.b`
  padding: 0 1px;
  border-radius: 2px;
  background: ${COMPUTE};
  color: #fff;
`

const Empty = styled.p`
  margin: 0;
  padding: 1.25rem;
  border: 1px dashed ${FRAME};
  border-radius: 10px;
  color: ${INK_SOFT};
  font-size: 0.84rem;
`

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  align-items: center;
  font-size: 0.78rem;
`

const Segmented = styled.div`
  display: inline-flex;
  overflow: hidden;
  border: 1px solid ${FRAME};
  border-radius: 8px;
`

const SegButton = styled.button`
  padding: 0.3rem 0.6rem;
  border: 0;
  background: ${CARD};
  color: ${INK};
  font: inherit;
  cursor: pointer;

  & + & {
    border-left: 1px solid ${FRAME};
  }

  &[aria-pressed="true"] {
    background: ${INK};
    color: ${PAPER};
  }
`

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.9rem;
  color: ${INK_SOFT};

  span {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
  }

  &&& svg {
    width: 18px;
  }
`

const ChartSvg = styled.svg`
  max-width: 40rem;
`

const wipe = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`

const Wipe = styled.rect`
  transform-box: fill-box;
  transform-origin: left center;
  animation: ${wipe} 1.1s cubic-bezier(0.33, 0.1, 0.25, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Step = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.6rem;
  border-top: 1px solid ${LINE};
  color: ${MUTED};
  font-size: 0.75rem;
`

const StepButton = styled.button`
  padding: 0.3rem 0.7rem;
  border: 1px solid ${FRAME};
  border-radius: 8px;
  background: ${CARD};
  color: ${INK};
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;

  &:disabled {
    visibility: hidden;
  }

  &:hover {
    border-color: ${COMPUTE};
  }
`

const Foot = styled.div`
  margin-top: 0.6rem;
  color: ${MUTED};
  font-size: 0.75rem;
`
