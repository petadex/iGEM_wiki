#!/usr/bin/env node
/**
 * Freezes petadex.net sequence records into src/data/recordCardDemo.json for
 * the record card demo on the Software page (<RecordCardDemo />), so the page
 * makes no network calls.
 *
 * Two records, the field's two reference enzymes, both of which the lab put
 * through LOBSTER as literature controls (igem-toronto issue 109):
 *   - IsPETase (ORF 1, WP_054022242.1), also in our halo assay.
 *   - LCC, leaf-branch compost cutinase (ORF 33, G9BY57.1).
 *
 * Each block below is one call the live site makes for its /sequence/,
 * /cluster/ or /halo-assay page, plus one sequence search through
 * POST /api/search (served from the site's cache once someone has run it) and
 * one batch provenance lookup for the relatives' coordinates.
 *
 * The structures are the site's own ColabFold predictions. Each is trimmed
 * to backbone plus the catalytic triad's side chains and written to
 * static/figures/record-card/<key>.pdb, which the demo's Mol* viewer loads;
 * only the per-residue pLDDT goes into the JSON, for the caption.
 *
 * The LOBSTER designs are read from the team's fragment-map page
 * (lobster_fragment_map.html, by Alex, in the LOBSTER Page folder on the
 * team Drive), whose path is passed as --lobster; it defaults to a copy in
 * dennis-scratch/, which is not in the repo. Without it the records keep
 * whatever design the existing JSON holds.
 *
 *   node scripts/build-record-card-demo.mjs [apiBase] [--lobster <file.html>]
 *
 * apiBase defaults to the API Gateway endpoint; api.petadex.net timed out
 * when this was first run (2026-10-20).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"

const argv = process.argv.slice(2)
const flag = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1]
}
const API = argv.find((a) => a.startsWith("http")) || "https://8ww706wo68.execute-api.us-east-1.amazonaws.com/api"
const LOBSTER_HTML =
  flag("lobster") || new URL("../dennis-scratch/lobster_fragment_map.html", import.meta.url).pathname

const OUT = new URL("../src/data/recordCardDemo.json", import.meta.url)
// The viewer loads these over HTTP from the built site, not from the JSON.
const STRUCTURES = new URL("../static/figures/record-card/", import.meta.url)

/**
 * The two records. `triad` is the catalytic serine-aspartate-histidine, as
 * the literature numbers it on these precursor sequences; each one's serine
 * is the one in the G-x-S-x-G motif, which the script checks.
 */
const RECORDS = [
  {
    key: "ispetase",
    name: "IsPETase",
    orf: 1,
    accession: "WP_054022242.1",
    gene: "IsPETase",
    lobster: "IsPETase",
    triad: [160, 206, 237],
    organism: "Ideonella sakaiensis",
    blurb: "The PETase that started the field, from a bacterium found living on PET bottles.",
    origin: {
      what: "Isolated from sediment, soil and wastewater sampled at a PET bottle recycling site",
      place: "Sakai, Osaka, Japan",
      lat: 34.5733,
      lon: 135.4831,
      year: 2016,
      ref: "Yoshida et al., Science 351, 1196 (2016)",
      doi: "10.1126/science.aad6359",
    },
  },
  {
    key: "lcc",
    name: "LCC",
    orf: 33,
    accession: "G9BY57.1",
    gene: null, // not in our halo assay
    lobster: "Leaf-branch compost cutinase (LCC)",
    triad: [165, 210, 242],
    organism: "Leaf-branch compost metagenome",
    blurb:
      "Leaf-branch compost cutinase, found by sequencing compost rather than by culturing an organism. Its engineered form is the basis of industrial PET recycling.",
    origin: {
      what: "Cloned from a metagenomic library of leaf-branch compost, with no organism ever isolated",
      place: "Chiba, Japan",
      lat: 35.6073,
      lon: 140.1065,
      year: 2012,
      ref: "Sulaiman et al., Appl. Environ. Microbiol. 78, 1556 (2012)",
      doi: "10.1128/AEM.06725-11",
    },
  },
]

// Genes drawn as curves beside a record that has halo-assay data.
const COMPARE = ["FAST-PETase", "EV"]
const MEDIA = ["BHET12.5", "BHET25"]
const TOP_HITS = 6
const BATCH_CAP = 1000

const call = async (path, init) => {
  const res = await fetch(`${API}/${path}`, { signal: AbortSignal.timeout(90000), ...init })
  if (!res.ok && res.status !== 202) throw new Error(`${path}: HTTP ${res.status}`)
  return res.json()
}
const get = (path) => call(path)
const post = (path, body) =>
  call(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const round = (x, n = 4) => (x == null ? null : Number(Number(x).toFixed(n)))

/** Runs (or reads back from the cache) the site's sequence search. */
const search = async (sequence) => {
  const posted = await post("search", { sequence, max_results: 500 })
  const id = posted.session_id
  for (let i = 0; i < 30; i++) {
    const res = await get(`search/results/${id}?max_results=500`)
    if (res.status === "completed") return { sessionId: id, ...res }
    if (res.status === "failed") throw new Error(`search ${id} failed`)
    await sleep(8000)
  }
  throw new Error(`search ${id} timed out`)
}

// The search API leaves name and organism empty; the DIAMOND demo's export
// fetched them from NCBI, so reuse its labels for hits the two share.
const LABELS = new Map(
  JSON.parse(await readFile(new URL("../src/data/diamondSearchDemo.json", import.meta.url)))
    .queries.flatMap((q) => q.hits)
    .filter((h) => h.o != null && (h.lab || h.org))
    .map((h) => [h.o, h])
)

/** Hits come back as "orfId|genbankAcc|run|contig|start|end|frame". */
const parseHit = (h) => {
  const [orf, genbank, run] = h.accession.split("|")
  const known = LABELS.get(Number(orf))
  return {
    s: genbank ? "ref" : "logan",
    id: genbank || run,
    o: Number(orf),
    pid: round(h.percent_identity, 1),
    cov: round(h.query_coverage, 0),
    q: [h.query_start, h.query_end],
    t: [h.target_start, h.target_end],
    lab: h.name || known?.lab || null,
    org: h.organism || known?.org || null,
  }
}

/**
 * What the Mol* viewer loads: every residue's backbone, which is all a
 * cartoon and its secondary-structure assignment need, plus the side chains
 * of the catalytic triad, which the viewer draws as ball-and-stick. Dropping
 * the hydrogens and the other side chains takes the file from about 340 KB
 * to about 95 KB. pLDDT stays in the B-factor column, as ColabFold writes it.
 */
const BACKBONE = new Set(["N", "CA", "C", "O"])
const trimPdb = (pdb, triad) => {
  const sideChains = new Set(triad)
  const out = []
  for (const line of pdb.split("\n")) {
    if (!line.startsWith("ATOM")) continue
    if ((line.slice(76, 78).trim() || line.slice(12, 16).trim()[0]) === "H") continue
    const atom = line.slice(12, 16).trim()
    if (!BACKBONE.has(atom) && !sideChains.has(Number(line.slice(22, 26)))) continue
    out.push(line)
  }
  out.push("END", "")
  return out.join("\n")
}

/**
 * Per-residue pLDDT, for the layer's caption and its confidence key. The
 * coordinates are not copied into the JSON: the viewer reads them from the
 * structure file trimPdb writes beside it.
 */
const confidence = (pdb) => {
  const plddt = []
  for (const line of pdb.split("\n")) {
    if (!line.startsWith("ATOM") || line.slice(12, 16).trim() !== "CA") continue
    plddt.push(Math.round(Number(line.slice(60, 66))))
  }
  return { n: plddt.length, plddt }
}

/** The fragment design for one cluster, from the team's fragment-map page. */
const lobsterDesigns = async () => {
  let html
  try {
    html = await readFile(LOBSTER_HTML, "utf8")
  } catch {
    console.warn(`no LOBSTER page at ${LOBSTER_HTML}; keeping existing designs`)
    return null
  }
  const start = html.indexOf("const DATA = ")
  const data = JSON.parse(html.slice(start + 13, html.indexOf("};", start) + 1))
  return data
}

const comparison = await get(`plate-data/comparison?media=${MEDIA.join(",")}`)
const lobster = await lobsterDesigns()
const previous = await readFile(OUT, "utf8").then(JSON.parse).catch(() => null)

const curves = (gene) => {
  if (!gene) return null
  const out = {}
  for (const media of MEDIA) {
    out[media] = comparison.timeseries
      .filter((t) => t.gene === gene && t.media === media)
      .sort((a, b) => a.timepoint_hours - b.timepoint_hours)
      .map((t) => [Number(t.timepoint_hours), round(t.average_readout), round(t.stddev_readout)])
  }
  return out
}

// Every gene's highest mean intensity from 24 h on, per medium: the halo the
// colony has cleared once the assay has had time to develop. The 8 h reading
// is left out because every colony, the empty vector included, starts near 0.
const lateMax = {}
for (const media of MEDIA) {
  const byGene = {}
  for (const t of comparison.timeseries) {
    if (t.media !== media || Number(t.timepoint_hours) < 24) continue
    byGene[t.gene] = Math.max(byGene[t.gene] ?? -Infinity, Number(t.average_readout))
  }
  lateMax[media] = Object.entries(byGene)
    .map(([gene, v]) => [gene, round(v)])
    .sort((a, b) => b[1] - a[1])
}

const nickname = (gene) => comparison.activity.find((a) => a.gene === gene)?.nickname || null

const records = []
for (const spec of RECORDS) {
  const [fasta, orf, domains, struct] = await Promise.all([
    get(`fastaa/${spec.accession}`),
    get(`orf/${spec.orf}`),
    get(`orf/${spec.orf}/domains`),
    get(`pdb/accession/${spec.accession}`),
  ])
  const seq = fasta.sequence
  const motifs = [...seq.matchAll(/(?=G.S.G)/g)].map((m) => [m.index + 1, m.index + 5])
  const [ser] = spec.triad
  if (!motifs.some(([a, b]) => ser >= a && ser <= b)) {
    throw new Error(`${spec.name}: catalytic serine ${ser} is not in a G-x-S-x-G motif`)
  }

  const pdb = await fetch(struct.pdb_url, { signal: AbortSignal.timeout(90000) }).then((r) => r.text())
  await mkdir(STRUCTURES, { recursive: true })
  await writeFile(new URL(`${spec.key}.pdb`, STRUCTURES), trimPdb(pdb, spec.triad))
  const trace = confidence(pdb)
  if (trace.n !== seq.length) {
    throw new Error(`${spec.name}: structure has ${trace.n} residues, sequence has ${seq.length}`)
  }

  const found = await search(seq)
  const hits = found.results.map(parseHit)
  const hist = Array(8).fill(0)
  for (const h of hits) hist[Math.min(7, Math.max(0, Math.floor((h.pid - 20) / 10)))] += 1
  const self = hits.find((h) => h.o === spec.orf)

  // Where the relatives were sampled. Only Logan hits carry coordinates, and
  // only some of those: the rest are sequencing runs with no stated location.
  const loganIds = hits.filter((h) => h.s === "logan").map((h) => h.o)
  const places = []
  for (let i = 0; i < loganIds.length; i += BATCH_CAP) {
    const { results } = await post("annotations/batch", { orf_ids: loganIds.slice(i, i + BATCH_CAP) })
    for (const p of results) {
      if (p.latitude == null || p.longitude == null) continue
      places.push({
        o: p.orf_id,
        lat: round(p.latitude, 2),
        lon: round(p.longitude, 2),
        country: p.country || null,
        label: p.organism || null,
        source: p.isolation_source || null,
        profile: p.profile || null,
        year: p.collection_date ? Number(p.collection_date.slice(0, 4)) : null,
      })
    }
  }
  places.sort((a, b) => a.lat - b.lat)

  const { c90_id, c60_id, c30_id } = orf.ancestors
  const levels = await Promise.all(
    [["90", c90_id], ["60", c60_id], ["30", c30_id]].map(([lv, id]) => get(`cluster/${lv}/${id}`))
  )

  const design = lobster?.clusters.find((c) => c.label === spec.lobster)
  const kept = previous?.records.find((r) => r.key === spec.key)?.lobster

  records.push({
    key: spec.key,
    name: spec.name,
    organism: spec.organism,
    blurb: spec.blurb,
    accession: fasta.accession,
    orf: spec.orf,
    seq,
    motifs,
    triad: spec.triad.map((pos) => [pos, seq[pos - 1]]),
    domains: domains.map((d) => ({
      name: d.domain,
      hmm: d.pazy_hmm_id,
      from: d.domain_start,
      to: d.domain_end,
    })),
    structure: {
      id: struct.pdb_id,
      method: struct.technique,
      alignedTo: struct.alignment,
      ...trace,
    },
    origin: spec.origin,
    neighbours: {
      sessionId: found.sessionId,
      n: hits.length,
      depth: found.metadata.result_depth,
      logan: hits.filter((h) => h.s === "logan").length,
      placed: places.length,
      hist,
      top: hits.filter((h) => h !== self).slice(0, TOP_HITS),
      places,
    },
    clusters: levels.map((c) => ({
      level: Number(c.level),
      id: String(c.cluster_id),
      members: Number(c.member_count),
      pazy: Number(c.n_pazy),
      nr: Number(c.n_nr),
      sra: Number(c.n_sra),
      organisms: Number(c.distinct_organism_count),
      dominant: c.dominant_organism,
      centroid: c.centroid_accession,
      centroidSource: c.centroid_source,
      cath: c.centroid_cath_domain,
      domain: c.centroid_domain_name,
    })),
    lobster: design
      ? {
          k: design.K,
          width: design.width,
          adapters: design.adapters,
          fragments: design.fragments.map((f) => ({
            idx: f.idx,
            start: f.start,
            end: f.end,
            span: f.span,
            oligos: f.n_oligos,
            // Ordered oligos are mixes: a degenerate one is several sequences
            // in a tube, so the position really carries `vars` variants.
            vars: f.oligos.reduce((s, o) => s + o.variants, 0),
            deg: f.deg_cols,
            // The longest oligo of the position, as its example.
            example: f.oligos.reduce((a, b) => (b.seq.length > a.seq.length ? b : a)).seq,
            nt: f.oligos.reduce((s, o) => s + o.nt, 0),
          })),
        }
      : kept || null,
    gene: spec.gene,
    nickname: spec.gene ? nickname(spec.gene) : null,
    curves: curves(spec.gene),
  })
}

const data = {
  fetched: new Date().toISOString().slice(0, 10),
  media: MEDIA,
  measure: "median pixel intensity under yeast colony",
  compare: COMPARE.map((gene) => ({ gene, nickname: nickname(gene), curves: curves(gene) })),
  lateMax,
  records,
}

await writeFile(OUT, `${JSON.stringify(data)}\n`)
console.log(`wrote ${OUT.pathname}`)
