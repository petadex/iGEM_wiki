import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import styled, { css, keyframes } from "styled-components"
import DEMO from "../../../data/diamondSearchDemo.json"
import { ExpandWindow } from "../ExpandWindow.js"

/**
 * Demo D2: replays of ten real sharded DIAMOND searches.
 *
 * Every number comes from a search actually run on the live tool on
 * 2026-10-19 against database catalytic_orfs_v1.1_20260610_173654,
 * search_version 1.4.0, frozen into src/data/diamondSearchDemo.json. The
 * page makes no network requests: the top 25 hits of each search are
 * embedded, and the summary figures are computed over all stored hits.
 *
 * Source of the data and the scripts that regenerate it:
 * petadex-sequence-search/wiki-demo (README.md lists the three steps).
 *
 * Colours follow the Dry Lab figure style guide, the same palette as
 * DiamondSearch.js on this page.
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
const SEARCH_URL = `${SITE}/search/`

const SOURCE_NAME = { logan: "Logan", ref: "NCBI", pdb: "PDB" }
const SOURCE_LONG = {
  logan: "Logan (assembled from public sequencing data)",
  ref: "NCBI protein database (RefSeq / GenBank)",
  pdb: "Protein Data Bank",
}

/** The loading scene's length. The real search takes about 45 seconds. */
const SCENE_MS = 2000

const fmtInt = (n) => Number(n).toLocaleString("en-US")

/** Hits store log10(E-value); null means it underflowed past 1e-300. */
const fmtEvalue = (e) => {
  if (e == null) return "< 1e-300"
  const x = Math.round(e)
  return x >= -1 ? Math.pow(10, e).toPrecision(2) : `1e${x}`
}

const coverage = (hit, queryLen) => (hit.q[1] - hit.q[0] + 1) / queryLen

const SORTS = {
  bs: { label: "Bit score", of: (h) => h.bs },
  pid: { label: "Identity", of: (h) => h.pid },
  cov: { label: "Query coverage", of: (h, len) => coverage(h, len) },
}

const SOURCE_FILTERS = [
  { value: "all", label: "All" },
  { value: "logan", label: "Logan" },
  { value: "known", label: "Reference" },
]

export const DiamondSearchDemo = () => {
  const [queryIndex, setQueryIndex] = useState(0)
  const [source, setSource] = useState("all")
  const [minIdentity, setMinIdentity] = useState(0)
  const [sort, setSort] = useState("bs")
  const [openRank, setOpenRank] = useState(-1)
  const [running, setRunning] = useState(false)

  const rootRef = useRef(null)
  const shardRefs = useRef([])
  const barRef = useRef(null)
  const stageRef = useRef(null)
  const countRef = useRef(null)
  const rafRef = useRef(0)
  const runningRef = useRef(false)
  const reducedRef = useRef(false)

  const query = DEMO.queries[queryIndex]

  /* ---- the sped-up replay of the pipeline ---- */

  const play = useCallback(() => {
    if (runningRef.current || reducedRef.current) return
    runningRef.current = true
    setRunning(true)

    // Shards finish at slightly different times, as the real workers do.
    const finishAt = shardRefs.current.map(() => 0.45 + Math.random() * 0.35)
    const started = performance.now()

    const frame = (now) => {
      const f = Math.min(1, (now - started) / SCENE_MS)
      let done = 0
      shardRefs.current.forEach((el, i) => {
        if (!el) return
        const state = f < 0.12 ? "idle" : f < finishAt[i] ? "run" : "done"
        if (state === "done") done += 1
        if (el.dataset.state !== state) el.dataset.state = state
      })
      if (barRef.current) barRef.current.style.width = `${(f * 100).toFixed(1)}%`
      if (stageRef.current) {
        stageRef.current.textContent =
          f < 0.12
            ? `Parsing query, reading database ${DEMO.db.version}…`
            : done < DEMO.db.shards
              ? `Searching ${fmtInt(DEMO.db.sequences)} sequences across ${DEMO.db.shards} shards…`
              : "Merging shard results, ranking by bit score…"
      }
      if (countRef.current) {
        countRef.current.textContent =
          f < 0.12 ? "" : `${done}/${DEMO.db.shards} shards`
      }
      if (f < 1) {
        rafRef.current = requestAnimationFrame(frame)
        return
      }
      runningRef.current = false
      setRunning(false)
    }
    rafRef.current = requestAnimationFrame(frame)
  }, [])

  useEffect(() => {
    reducedRef.current =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Play once, when the demo first scrolls into view.
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver !== "function") return undefined
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        io.disconnect()
        play()
      },
      { threshold: 0.35 }
    )
    io.observe(root)
    return () => io.disconnect()
  }, [play])

  const selectQuery = (i) => {
    setQueryIndex(i)
    setOpenRank(-1)
    play()
  }

  /* ---- results ---- */

  const rows = useMemo(() => {
    const picked = query.hits
      .map((hit, i) => ({ hit, rank: i + 1 }))
      .filter(({ hit }) => {
        if (source === "logan" && hit.s !== "logan") return false
        if (source === "known" && hit.s === "logan") return false
        return hit.pid >= minIdentity
      })
    const of = SORTS[sort].of
    return picked.sort(
      (a, b) =>
        of(b.hit, query.len) - of(a.hit, query.len) || a.rank - b.rank
    )
  }, [query, source, minIdentity, sort])

  // Hits arrive ranked by bit score, so this is the top-ranked hit's
  // identity, not the highest identity in the list — the label says so.
  // When the query is itself in the corpus, skip its own exact match.
  const exactSelf = query.hits.length > 0 && query.hits[0].pid === 100
  const others = query.hits.filter((h) => h.pid < 100)
  const best = (exactSelf && others.length ? others : query.hits)[0]

  return (
    <Wrap>
      <ExpandWindow title="DIAMOND search demo" inlineTitle={false} ground={PAPER}>
        {(open) => (
    <Demo ref={rootRef} $open={open}>
      <Head>
        <div>
          <Kicker>Demo · replays of real searches</Kicker>
          <Title>What is this enzyme? Ask its neighbours.</Title>
          <Sub>
            Pick an enzyme to replay a real search of it against every protein
            in PETadex.
          </Sub>
        </div>
        <Cta href={SEARCH_URL} target="_blank" rel="noopener noreferrer">
          Search your own sequence →
        </Cta>
      </Head>

      <Chips role="group" aria-label="Example queries">
        {DEMO.queries.map((q, i) => (
          <Chip
            key={q.slug}
            type="button"
            title={q.org}
            aria-pressed={i === queryIndex}
            onClick={() => selectQuery(i)}
          >
            {q.name}
          </Chip>
        ))}
      </Chips>

      <QueryBox>
        <div>
          <QueryName>{query.name}</QueryName>
          <QueryMeta>
            {query.org} · {query.len} aa · {query.blurb}
          </QueryMeta>
        </div>
        <Go type="button" onClick={play} disabled={running}>
          {running ? "Searching…" : "Search"}
        </Go>
        <Fasta aria-label="Query sequence">
          {">"}
          {query.name}
          {"\n"}
          {query.seq}
        </Fasta>
      </QueryBox>

      <Loading hidden={!running} aria-live="polite">
        <Stage>
          <strong ref={stageRef}>Parsing query…</strong>
          <Mono ref={countRef} />
        </Stage>
        <Shards aria-hidden="true">
          {Array.from({ length: DEMO.db.shards }, (unused, i) => (
            <Shard
              key={i}
              data-state="idle"
              ref={(el) => {
                shardRefs.current[i] = el
              }}
            />
          ))}
        </Shards>
        <Progress>
          <i ref={barRef} />
        </Progress>
        <Note>
          Sped-up replay. On petadex.net, {DEMO.db.shards} cloud workers each
          search one shard in parallel; a real search takes about 45 seconds.
        </Note>
      </Loading>

      <Results hidden={running}>
        <Summary>
          <Stat>
            <b>
              {fmtInt(query.n)}
              {query.n >= DEMO.db.depth ? "+" : ""}
            </b>
            <span>hits found (E &lt; 0.001)</span>
          </Stat>
          <Stat>
            <b>{best ? `${best.pid.toFixed(1)}%` : "—"}</b>
            <span>
              {exactSelf ? "closest hit that isn't exact" : "identity of the top hit"}
            </span>
          </Stat>
          <Stat>
            <b>{query.n ? `${Math.round((query.logan / query.n) * 100)}%` : "—"}</b>
            <span>from Logan, not in public databases</span>
          </Stat>
          <Stat as={HistStat}>
            <span>identity of all hits</span>
            <Histogram counts={query.hist} />
          </Stat>
        </Summary>

        <Controls>
          <Segmented role="group" aria-label="Filter by source">
            {SOURCE_FILTERS.map((f) => (
              <SegButton
                key={f.value}
                type="button"
                aria-pressed={source === f.value}
                onClick={() => setSource(f.value)}
              >
                {f.label}
              </SegButton>
            ))}
          </Segmented>
          <label>
            Min identity
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minIdentity}
              onChange={(e) => setMinIdentity(Number(e.target.value))}
            />
            <Mono>{minIdentity}%</Mono>
          </label>
          <label>
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORTS).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </Controls>

        <Table $open={open}>
          <HeadRow aria-hidden="true">
            <span>#</span>
            <span>Hit</span>
            <span>Identity</span>
            <span className="c-cov">Coverage of query</span>
            <Num className="c-e">E-value</Num>
            <Num className="c-bs">Bits</Num>
          </HeadRow>
          {rows.length === 0 && <Empty>No hits match these filters.</Empty>}
          {rows.map(({ hit, rank }) => (
            <HitRow
              key={rank}
              hit={hit}
              rank={rank}
              queryLen={query.len}
              open={openRank === rank}
              onToggle={() => setOpenRank(openRank === rank ? -1 : rank)}
            />
          ))}
        </Table>

        <Foot>
          <span title={`database ${DEMO.db.version}`}>
            {rows.length} of the top {query.hits.length} hits · {fmtInt(DEMO.db.sequences)}{" "}
            sequences searched
          </span>
          <a
            href={`${SITE}/results?job=${query.sid}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open this full result on petadex.net →
          </a>
        </Foot>
      </Results>
    </Demo>
        )}
      </ExpandWindow>
    </Wrap>
  )
}

/* ---------- one hit ---------- */

const HitRow = ({ hit, rank, queryLen, open, onToggle }) => {
  const cov = coverage(hit, queryLen)
  const detailId = `pdx-hit-${rank}`
  const subtitle =
    hit.s === "logan"
      ? `Sequencing run${hit.lab ? ` · sample labelled ${hit.lab}` : ""}`
      : hit.lab || ""

  return (
    <>
      <Row type="button" aria-expanded={open} aria-controls={detailId} onClick={onToggle}>
        <Rank>{rank}</Rank>
        <span>
          <HitId>
            <Badge $source={hit.s}>{SOURCE_NAME[hit.s]}</Badge>
            {hit.id}
          </HitId>
          <HitLabel>
            {subtitle}
            {hit.s !== "logan" && hit.org ? (
              <>
                {subtitle ? " · " : ""}
                <i>{hit.org}</i>
              </>
            ) : null}
          </HitLabel>
        </span>
        <Meter>
          <SrOnly>identity</SrOnly>
          <Bar fraction={hit.pid / 100} color={hit.s === "logan" ? LOGAN : REF} />
          <Num>{hit.pid.toFixed(1)}%</Num>
        </Meter>
        <Meter className="c-cov">
          <SrOnly>covers</SrOnly>
          <CoverageTrack hit={hit} queryLen={queryLen} />
          <Num>{Math.round(cov * 100)}%</Num>
        </Meter>
        <Num className="c-e" as="span">
          <SrOnly>E-value</SrOnly>
          <Mono>{fmtEvalue(hit.e)}</Mono>
        </Num>
        <Num className="c-bs">
          <SrOnly>bit score</SrOnly>
          {hit.bs}
        </Num>
      </Row>
      <Detail id={detailId} hidden={!open}>
        {open && (
          <>
            <dl>
              <dt>Source</dt>
              <dd>{SOURCE_LONG[hit.s]}</dd>
              {hit.s === "logan" ? (
                <>
                  <dt>SRA run</dt>
                  <dd>
                    <Mono>{hit.id}</Mono>
                  </dd>
                  {hit.lab && (
                    <>
                      <dt>Sample labelled</dt>
                      <dd>{hit.lab}</dd>
                    </>
                  )}
                  {(hit.geo || hit.yr) && (
                    <>
                      <dt>Collected</dt>
                      <dd>{[hit.geo, hit.yr].filter(Boolean).join(", ")}</dd>
                    </>
                  )}
                </>
              ) : (
                hit.org && (
                  <>
                    <dt>Organism</dt>
                    <dd>
                      <i>{hit.org}</i>
                    </dd>
                  </>
                )
              )}
              <dt>Identity</dt>
              <dd>
                {hit.pid.toFixed(1)}% over {hit.q[1] - hit.q[0] + 1} aligned
                residues
              </dd>
              <dt>Coverage</dt>
              <dd>
                {Math.round(cov * 100)}% of query
                {hit.t[2]
                  ? `, ${Math.round(((hit.t[1] - hit.t[0] + 1) / hit.t[2]) * 100)}% of hit`
                  : ""}
              </dd>
              <dt>Scores</dt>
              <dd>
                bit score {hit.bs}, E-value {fmtEvalue(hit.e)}
              </dd>
            </dl>
            <Alignment hit={hit} queryLen={queryLen} />
            <Links>
              {hit.o != null && (
                <a
                  href={`${SITE}/sequence/orf/${hit.o}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sequence page on petadex.net →
                </a>
              )}
              <ExternalHitLink hit={hit} />
            </Links>
          </>
        )}
      </Detail>
    </>
  )
}

const ExternalHitLink = ({ hit }) => {
  const [href, label] =
    hit.s === "logan"
      ? [`https://www.ncbi.nlm.nih.gov/sra/${encodeURIComponent(hit.id)}`, "SRA run"]
      : hit.s === "pdb"
        ? [
            `https://www.rcsb.org/structure/${encodeURIComponent(hit.id.split("_")[0])}`,
            "RCSB PDB entry",
          ]
        : [
            `https://www.ncbi.nlm.nih.gov/protein/${encodeURIComponent(hit.id)}`,
            "NCBI protein",
          ]
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  )
}

/* ---------- small figures ---------- */

const Bar = ({ fraction, color }) => {
  const w = Math.max(0, Math.min(1, fraction)) * 100
  return (
    <MeterSvg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
      <rect width="100" height="8" rx="2" fill="#efe4dc" />
      <rect width={w.toFixed(1)} height="8" rx="2" fill={color} />
    </MeterSvg>
  )
}

/** Where along the query the hit aligns. */
const CoverageTrack = ({ hit, queryLen }) => {
  const x = ((hit.q[0] - 1) / queryLen) * 100
  const w = ((hit.q[1] - hit.q[0] + 1) / queryLen) * 100
  return (
    <MeterSvg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
      <rect y="3" width="100" height="2" fill={LINE} />
      <rect x={x.toFixed(1)} width={w.toFixed(1)} height="8" rx="2" fill={COMPUTE} />
    </MeterSvg>
  )
}

/** Query and hit drawn to one residue scale, lined up on the aligned block. */
const Alignment = ({ hit, queryLen }) => {
  const targetLen = hit.t[2] || hit.t[1]
  const offset = hit.q[0] - hit.t[0]
  const lo = Math.min(0, offset)
  const hi = Math.max(queryLen, offset + targetLen)
  const scale = 500 / (hi - lo)
  const X = (pos) => 10 + (pos - lo) * scale

  const bar = (y, start, len, from, to, label, color) => (
    <>
      <rect x={X(start)} y={y} width={len * scale} height="6" rx="2" fill={LINE} />
      <rect
        x={X(start + from - 1)}
        y={y}
        width={(to - from + 1) * scale}
        height="6"
        rx="2"
        fill={color}
      />
      <text x={X(start)} y={y - 3} fontSize="9" fill={INK_SOFT}>
        {label}
      </text>
    </>
  )

  return (
    <AlignBox>
      <svg viewBox="0 0 520 44" role="img" aria-label="Aligned region on query and target">
        {bar(
          12,
          0,
          queryLen,
          hit.q[0],
          hit.q[1],
          `query ${hit.q[0]}–${hit.q[1]} of ${queryLen}`,
          COMPUTE
        )}
        {bar(
          34,
          offset,
          targetLen,
          hit.t[0],
          hit.t[1],
          `hit ${hit.t[0]}–${hit.t[1]}${hit.t[2] ? ` of ${hit.t[2]}` : ""}`,
          hit.s === "logan" ? LOGAN : REF
        )}
      </svg>
    </AlignBox>
  )
}

/** Identities of every stored hit, in 10% bins from 20% to 100%. */
const Histogram = ({ counts }) => {
  const max = Math.max(...counts) || 1
  const w = 100 / counts.length
  return (
    <>
      <HistSvg
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        role="img"
        aria-label="Histogram of hit identities from 20% to 100%"
      >
        {counts.map((c, i) => {
          const h = (c / max) * 30
          return (
            <rect
              key={i}
              x={i * w + 1}
              y={32 - h}
              width={w - 2}
              height={Math.max(h, c ? 1 : 0)}
              fill={COMPUTE}
            >
              <title>{`${20 + i * 10}–${30 + i * 10}%: ${c} hits`}</title>
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

const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`

const Mono = styled.span`
  font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
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

  ${PHONE} {
    padding: 1rem;
  }

  /* In the window the window is the frame, so the demo's own border goes and
     its content is held to a readable width. */
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

// &&& outranks the wiki's own h3 margins.
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
    color: #fff;
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
  padding-bottom: 0.25rem;
  overflow-x: auto;
  scrollbar-width: thin;
`

const Chip = styled.button`
  flex: none;
  padding: 0.35rem 0.75rem;
  border: 1px solid ${FRAME};
  border-radius: 999px;
  background: ${CARD};
  color: ${INK};
  font: inherit;
  font-size: 0.8rem;
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

const QueryBox = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.6rem 1rem;
  align-items: center;
  padding: 0.75rem 0.9rem;
  border: 1px solid ${LINE};
  border-radius: 10px;
  background: ${CARD};

  ${PHONE} {
    grid-template-columns: minmax(0, 1fr);
  }
`

const QueryName = styled.div`
  font-weight: 600;
`

const QueryMeta = styled.div`
  color: ${MUTED};
  font-size: 0.82rem;
`

const Go = styled.button`
  padding: 0.6rem 1rem;
  border: 0;
  border-radius: 8px;
  background: ${COMPUTE};
  color: #fff;
  font: inherit;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  ${PHONE} {
    justify-self: start;
  }
`

// The whole sequence, wrapped: a 300-residue query is three or four lines.
const Fasta = styled.div`
  grid-column: 1 / -1;
  padding: 0.5rem 0.6rem;
  border: 1px solid ${LINE};
  border-radius: 6px;
  background: #fff;
  color: ${INK_SOFT};
  font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
`

const Loading = styled.div`
  margin-top: 0.85rem;
  padding: 1rem;
  border: 1px solid ${LINE};
  border-radius: 10px;
  background: ${CARD};
`

const Stage = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  margin-bottom: 0.6rem;
  font-size: 0.82rem;
`

const Shards = styled.div`
  display: grid;
  grid-template-columns: repeat(32, 1fr);
  gap: 3px;

  ${PHONE} {
    grid-template-columns: repeat(16, 1fr);
  }
`

const pulse = keyframes`
  to { opacity: 0.45; }
`

const Shard = styled.div`
  height: 22px;
  border-radius: 3px;
  background: ${LINE};
  transition: background-color 0.15s ease;

  &[data-state="run"] {
    background: ${FRAME};
    animation: ${pulse} 0.5s ease-in-out infinite alternate;
  }

  &[data-state="done"] {
    background: ${COMPUTE};
  }

  ${PHONE} {
    height: 16px;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-state="run"] {
      animation: none;
    }
  }
`

const Progress = styled.div`
  height: 4px;
  margin-top: 0.75rem;
  overflow: hidden;
  border-radius: 2px;
  background: ${LINE};

  i {
    display: block;
    width: 0;
    height: 100%;
    background: ${INK};
  }
`

const Note = styled.div`
  margin-top: 0.5rem;
  color: ${MUTED};
  font-size: 0.75rem;
`

const Results = styled.div`
  margin-top: 0.7rem;
`

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.6fr);
  gap: 0.5rem;

  ${PHONE} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`

const Stat = styled.div`
  padding: 0.4rem 0.7rem;
  border: 1px solid ${LINE};
  border-radius: 10px;
  background: ${CARD};

  b {
    display: block;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  span {
    color: ${MUTED};
    font-size: 0.75rem;
  }
`

const HistStat = styled.div`
  ${PHONE} {
    grid-column: 1 / -1;
  }
`

const HistSvg = styled.svg`
  display: block;
  width: 100%;
  height: 22px;
  margin-top: 0.25rem;
`

const Axis = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${MUTED};
  font-size: 0.65rem;
`

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.1rem;
  align-items: center;
  margin: 0.6rem 0 0.45rem;
  font-size: 0.82rem;

  label {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
  }

  select {
    padding: 0.2rem 0.4rem;
    border: 1px solid ${FRAME};
    border-radius: 6px;
    background: ${CARD};
    color: ${INK};
    font: inherit;
  }

  input[type="range"] {
    width: 7rem;
    accent-color: ${COMPUTE};
  }
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

// The hit list scrolls inside a fixed height so the whole demo fits on one
// screen; in the expanded window it shows every row.
const Table = styled.div`
  max-height: min(18rem, 32vh);
  overflow: auto;
  border: 1px solid ${LINE};
  border-radius: 10px;
  background: #fff;
  overscroll-behavior: contain;

  ${({ $open }) =>
    $open &&
    css`
      max-height: none;
    `}
`

const rowGrid = css`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 110px 150px 78px 52px;
  gap: 0.6rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  text-align: left;

  ${PHONE} {
    grid-template-columns: 26px minmax(0, 1fr) 92px;
    gap: 0.25rem 0.6rem;

    > .c-cov,
    > .c-e,
    > .c-bs {
      display: none;
    }
  }
`

const HeadRow = styled.div`
  ${rowGrid};
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 1px solid ${LINE};
  background: ${CARD};
  color: ${MUTED};
  font-size: 0.75rem;
  font-weight: 600;
`

const Row = styled.button`
  ${rowGrid};
  width: 100%;
  border: 0;
  border-top: 1px solid ${LINE};
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:hover {
    background: #fdf8f4;
  }

  &:focus-visible {
    outline: 2px solid ${COMPUTE};
    outline-offset: -2px;
  }

  &[aria-expanded="true"] {
    background: #fbf1ea;
  }
`

const Rank = styled.span`
  color: ${MUTED};
  font-size: 0.75rem;
`

/* Spans, not divs: these sit inside the row's <button>, which may only
   hold phrasing content. */
const HitId = styled.span`
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  overflow-wrap: anywhere;
`

const HitLabel = styled.span`
  display: -webkit-box;
  overflow: hidden;
  color: ${INK_SOFT};
  font-size: 0.75rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`

const Badge = styled.span`
  display: inline-block;
  margin-right: 0.4rem;
  padding: 1px 5px;
  border-radius: 4px;
  background: ${({ $source }) =>
    $source === "logan" ? LOGAN : $source === "pdb" ? INK_SOFT : REF};
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  vertical-align: 1px;
`

const Meter = styled.span`
  display: flex;
  gap: 0.4rem;
  align-items: center;
  font-size: 0.82rem;
`

const MeterSvg = styled.svg`
  flex: 1;
  min-width: 0;
  height: 8px;
`

const Num = styled.span`
  font-size: 0.82rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
`

const Detail = styled.div`
  padding: 0.25rem 0.75rem 0.5rem 2.75rem;
  border-top: 1px solid ${LINE};
  font-size: 0.82rem;

  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.2rem 0.9rem;
    margin: 0.4rem 0;
  }

  dt {
    color: ${MUTED};
  }

  dd {
    margin: 0;
  }

  ${PHONE} {
    padding-left: 0.75rem;
  }
`

const AlignBox = styled.div`
  svg {
    display: block;
    width: 100%;
    max-width: 32rem;
    height: 44px;
  }
`

const Links = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-top: 0.25rem;
`

const Empty = styled.div`
  padding: 1.1rem;
  border-top: 1px solid ${LINE};
  color: ${MUTED};
  font-size: 0.82rem;
  text-align: center;
`

const Foot = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
  margin-top: 0.6rem;
  color: ${MUTED};
  font-size: 0.8rem;
`
