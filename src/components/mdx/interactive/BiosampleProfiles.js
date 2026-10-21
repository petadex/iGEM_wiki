import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { withPrefix } from "gatsby"
import styled from "styled-components"
import DATA from "../../../data/biosampleProfiles.json"
import BIOSAMPLES from "../../../data/biosampleExamples.json"

/**
 * BioSample Metadata Profiles, from the Model page's Sequence Annotation
 * section and its Methods page (/dry-lab/model/biosample-profiles/).
 *
 * Ported from the handoff demo (wiki-handoff/biosample-metadata-profiles/demo):
 *   ProfileSteps    how a profile is assigned: seven steps, the picked one open beside them
 *   ProfileShares   share of BioSamples vs share of 90% clusters per profile;
 *                   with `example`, the selected profile followed through the
 *                   pipeline below the chart
 *   ProfileStack    the Model overview: BioSample to cluster, and the flip
 *   BiosampleViewer ten real BioSamples, one per ecosystem on the wiki,
 *                   opened down to their sequences and clusters
 *
 * src/data/biosampleProfiles.json is the handoff's profiles_explorer.json and
 * src/data/biosampleExamples.json its wiki_biosample_examples.json; both were
 * built on watson on 2026-10-20 and the page makes no network requests. Every
 * number shown is listed in the Methods page's writer notes.
 *
 * Colours follow the Dry Lab figure style guide: purple for BioSamples and
 * green for clusters, as in the static figure.
 */

const BG = "#ede5db"
const PANEL = "#f5efe8"
const SUNK = "#e5d9cd"
const LINE = "#d3c4b3"
const FRAME = "#c8b388"
const INK = "#5f3928"
const INK_SOFT = "#805340"
const MUTED = "#8a6c57"
const BS = "#7b5f9d"
const CL = "#679a79"
const WARN = "#ac493d"
const WARN_BG = "#f2e1d6"

const TIER = {
  stated: { name: "Stated", color: "#5e689e", how: "environment named" },
  inferred: { name: "Inferred", color: "#cba945", how: "from isolation source or host" },
  form_template: { name: "Form only", color: "#ac7f56", how: "from the form, with other metadata alongside" },
}
const TIER_BY_RANK = { 1: TIER.stated.color, 2: TIER.inferred.color, 3: TIER.form_template.color }

const GROUPS = [
  { name: "Natural environments", short: "Natural", color: "#5e8f8a", profiles: ["soil", "other_environmental", "marine", "freshwater", "sediment", "extreme", "air"] },
  { name: "Built and managed", short: "Built", color: "#b8962f", profiles: ["wastewater_sludge", "engineered_built", "lab_culture", "food"] },
  { name: "Plant and animal hosts", short: "Plant/animal", color: "#b6693d", profiles: ["plant_associated", "animal_other", "gut_unspecified", "animal_gut"] },
  { name: "Human body", short: "Human", color: "#9d5e91", profiles: ["human_gut", "human_oral", "human_other", "human_skin", "human_respiratory", "human_urogenital"] },
]
const NO_PROFILE = "#cdbeae"
const GROUP_OF = Object.fromEntries(GROUPS.flatMap((g) => g.profiles.map((p) => [p, g])))

const LABEL = {
  soil: "Soil", other_environmental: "Other environmental", marine: "Marine", freshwater: "Freshwater",
  sediment: "Sediment", extreme: "Extreme", air: "Air", wastewater_sludge: "Wastewater and sludge",
  engineered_built: "Engineered and built", lab_culture: "Lab culture", food: "Food",
  plant_associated: "Plant-associated", animal_other: "Animal, other", gut_unspecified: "Gut, host unstated",
  animal_gut: "Animal gut", human_gut: "Human gut", human_oral: "Human oral", human_other: "Human, other",
  human_skin: "Human skin", human_respiratory: "Human respiratory", human_urogenital: "Human urogenital",
}

const DEF = {
  soil: "Bulk, farm, forest and grassland soil, peat, compost.",
  other_environmental: "Environmental, but no specific environment named.",
  marine: "Seawater, coasts, estuaries, reefs.",
  freshwater: "Lakes, rivers, groundwater, wetlands.",
  sediment: "Mud and sediment from any water body.",
  extreme: "Hot springs, vents, salt lakes, permafrost, glaciers.",
  air: "Air, aerosols, dust.",
  wastewater_sludge: "Sewage, wastewater, activated sludge.",
  engineered_built: "Bioreactors, hospitals, buildings, oil fields.",
  lab_culture: "Cultures, mock communities, lab strains.",
  food: "Food, mostly raw poultry and meat.",
  plant_associated: "Roots, leaves, seeds, crops.",
  animal_other: "Non-human animals, body site other than gut.",
  gut_unspecified: "Gut or stool, host never stated.",
  animal_gut: "Gut, rumen and faeces of named animals.",
  human_gut: "Human stool and intestine.",
  human_oral: "Saliva, plaque, mouth.",
  human_other: "Human, no specific body site (blood, tissue, clinical).",
  human_skin: "Skin, wounds, abscesses.",
  human_respiratory: "Nose, throat, sputum, lung.",
  human_urogenital: "Urine, vaginal and other urogenital.",
}

/* Rule defects found 2026-10-20 and not yet fixed (handoff README §5). */
const hostBug = (n) => <>Host is not checked, so {n} samples here are from animals.</>
const ISSUE = {
  human_oral: <><code>oral metagenome</code> also matches <code>coral metagenome</code>, so about 2,035 coral samples are here by mistake.</>,
  animal_gut: <>About 4,800 human stool samples land here because <code>salmo</code> (for salmon) matches <i>Salmonella</i>.</>,
  human_gut: hostBug("17,598"),
  human_respiratory: hostBug("5,308"),
  human_skin: hostBug("2,680"),
  human_urogenital: hostBug("2,932"),
  human_other: hostBug("1,540"),
}

const P = DATA.profiles
// "land" alone reads as a typo; the rule matches it as part of farm-land terms.
P.soil.terms = P.soil.terms.map((t) => (t === "land" ? "agricultural land" : t))
const TOTAL_BS = DATA.totals.bs
const TOTAL_CL = DATA.totals.cl

const fmt = (n) => Math.round(n).toLocaleString("en-US")
const shares = (p) => [(100 * P[p].n_bs) / TOTAL_BS, (100 * P[p].n_cl) / TOTAL_CL]
const pct = (v) => `${v.toFixed(v < 0.1 ? 2 : 1)}%`
const ratio = (p) => {
  const [sb, sc] = shares(p)
  return sc / sb
}
const foldText = (p) => {
  const r = ratio(p)
  if (r >= 1) return `${r.toFixed(1)}× more`
  const inv = 1 / r
  return `${inv >= 10 ? inv.toFixed(0) : inv.toFixed(1)}× fewer`
}
const label = (p) => LABEL[p] || (p === "unprofilable" ? "No profile" : p)
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* ---------- How a profile is assigned ---------- */

const STEPS = [
  {
    title: "Keep BioSamples with real metadata",
    gist: "2,744,599 of 6,796,722",
    body: () => (
      <>
        <p>A BioSample counts only if a field describes the sample itself.</p>
        <p>Left out: samples with no metadata, and 876,790 whose only clue is the submission form they used.</p>
      </>
    ),
  },
  {
    title: "Read fields in a fixed order",
    gist: "first match wins",
    body: () => (
      <>
        <Chain>
          {DATA.precedence.map(([field, tier], i) => (
            <React.Fragment key={field}>
              {i > 0 && <ChainArrow aria-hidden="true">→</ChainArrow>}
              <FieldChip style={{ borderLeftColor: TIER_BY_RANK[tier] }}>{field}</FieldChip>
            </React.Fragment>
          ))}
        </Chain>
        <Sub>Species names are never read. Measured temperature and pH are too rare (about 2%) to use.</Sub>
      </>
    ),
  },
  {
    title: "Match a profile's word list",
    gist: "21 lists",
    body: () => (
      <>
        <p>Each profile has a list of words. Specific profiles are checked first, so “hot spring” becomes Extreme, not Freshwater.</p>
        <Sub>Pick a profile in the chart below to see its list.</Sub>
      </>
    ),
  },
  {
    title: "Settle “gut” by host",
    gist: "human or animal",
    body: () => (
      <p>
        “Gut metagenome” or “stool” doesn't say whose gut. The host field decides; if it's empty, the sample stays “Gut,
        host unstated”.
      </p>
    ),
  },
  {
    title: "Record evidence strength",
    gist: "3 tiers",
    body: () => (
      <Key>
        {Object.values(TIER).map((t) => (
          <span key={t.name}>
            <KeySwatch style={{ background: t.color }} />
            <b>{t.name}</b>: {t.how}
          </span>
        ))}
      </Key>
    ),
  },
  {
    title: "Pass profiles to sequence clusters",
    gist: "14,455,359 clusters",
    body: () => (
      <>
        <p>Each sequence takes its sample's profile. A cluster of sequences at 90% identity takes the profile most of its members carry.</p>
        <Sub>14,455,359 of 18,172,960 clusters get a profile.</Sub>
      </>
    ),
  },
  {
    title: "Check against temperature",
    gist: "independent",
    body: () => (
      <p>
        Temperature is estimated from the microbes in each sample, not from its metadata. Profiles separate as expected:
        gut about 37 °C, soil about 31 °C. The effect is small (ε² = {DATA.kw.epsilon2.toFixed(3)}).
      </p>
    ),
  },
]

export const ProfileSteps = () => {
  const [open, setOpen] = useState(0)
  const step = STEPS[open]
  return (
    <Box as="figure" aria-label="How a profile is assigned">
      <BoxTitle>How a profile is assigned</BoxTitle>
      <StepLayout>
        <Flow>
          {STEPS.map(({ title, gist }, i) => (
            <FlowItem key={title}>
              <Node
                type="button"
                aria-pressed={open === i}
                aria-controls="profile-step-body"
                onClick={() => setOpen(i)}
              >
                <NodeNum>{i + 1}</NodeNum>
                <b>{title}</b>
                <NodeGist>{gist}</NodeGist>
              </Node>
            </FlowItem>
          ))}
        </Flow>
        <StepBody id="profile-step-body" aria-live="polite">
          <StepHead>
            <NodeNum>{open + 1}</NodeNum>
            {step.title}
          </StepHead>
          {step.body()}
        </StepBody>
      </StepLayout>
    </Box>
  )
}

/* ---------- Where the samples are vs where the sequences are ---------- */

const LOG_LO = Math.log10(0.01)
const LOG_HI = Math.log10(50)
const xPos = (v) => 2 + (96 * (Math.log10(Math.max(v, 0.01)) - LOG_LO)) / (LOG_HI - LOG_LO)
const TICKS = [
  [0.01, "0.01%"],
  [0.1, "0.1%"],
  [1, "1%"],
  [10, "10%"],
]
const HOSTED = new Set([...GROUPS[2].profiles, ...GROUPS[3].profiles, "food", "lab_culture"])

/** The popup's second line is a reading of the data, not a measurement
    (handoff README §5): keep it hedged. */
const whyText = (p) => {
  const r = ratio(p)
  if (r >= 2)
    return "Each sample here adds many sequences nobody else has. These communities are diverse, so sequencing more of them is likely to find new enzymes."
  if (r <= 0.5)
    return HOSTED.has(p)
      ? "Many samples, few new sequences. Many are likely isolates of the same few organisms sequenced again and again, so their sequences fall into clusters that already exist."
      : "Many samples, few new sequences: this environment mostly repeats sequences already found elsewhere."
  return "Roughly in proportion: this environment adds about as many sequences as its sample count predicts."
}

const ROWS = GROUPS.map((g) => ({
  ...g,
  profiles: g.profiles.slice().sort((a, b) => P[b].n_cl - P[a].n_cl),
}))
const ORDER = ROWS.flatMap((g) => g.profiles)

export const ProfileShares = ({ example = false }) => {
  const [sel, setSel] = useState("soil")
  const [tip, setTip] = useState(null)
  const tipRef = useRef(null)
  const rowRefs = useRef({})
  const cardRef = useRef(null)

  // Place the popup under the ratio it explains, flipping above it near the
  // bottom of the window and staying inside the window sideways.
  useLayoutEffect(() => {
    if (!tip || !tipRef.current) return
    const t = tipRef.current.getBoundingClientRect()
    const a = tip.rect
    const left = Math.min(window.innerWidth - t.width - 16, Math.max(16, a.right - t.width))
    let top = a.bottom + 8
    if (top + t.height > window.innerHeight - 8) top = a.top - t.height - 8
    tipRef.current.style.left = `${left}px`
    tipRef.current.style.top = `${top}px`
  }, [tip])

  useEffect(() => {
    if (!tip) return undefined
    const hide = () => setTip(null)
    window.addEventListener("scroll", hide, { passive: true })
    return () => window.removeEventListener("scroll", hide)
  }, [tip])

  const showTip = (p, el) => el && setTip({ p, rect: el.getBoundingClientRect() })

  const choose = (p) => {
    setSel(p)
    if (example && window.innerWidth <= 700 && cardRef.current)
      cardRef.current.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" })
  }

  const onKeyDown = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const i = ORDER.indexOf(sel)
    const next = ORDER[Math.max(0, Math.min(ORDER.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))]
    setSel(next)
    rowRefs.current[next]?.focus()
  }

  const [sb0, sc0] = shares("soil")

  return (
    <>
      <Box as="figure" aria-label="Where the samples are vs where the sequences are">
        <BoxTitle>Where the samples are vs where the sequences are</BoxTitle>
        <HowTo>
          <span>
            <Dot style={{ background: BS }} />
            Share of BioSamples <Muted>({fmt(TOTAL_BS)})</Muted>
          </span>
          <span>
            <Dot style={{ background: CL }} />
            Share of 90% identity clusters <Muted>({fmt(TOTAL_CL)})</Muted>
          </span>
        </HowTo>
        <Explain>
          How to read it: soil is <b>{pct(sb0)}</b> of samples but <b>{pct(sc0)}</b> of sequence clusters, so it holds{" "}
          <b>{foldText("soil")}</b> sequences than its sample count suggests. Human urogenital holds{" "}
          <b>{foldText("human_urogenital")}</b>.
        </Explain>
        <Chart
          role="listbox"
          aria-label="Profiles"
          onKeyDown={onKeyDown}
          onMouseLeave={() => setTip(null)}
          onBlur={() => setTip(null)}
        >
          <ChartHead aria-hidden="true">
            <span />
            <Axis>
              {TICKS.map(([v, s]) => (
                <Tick key={s} style={{ left: `${xPos(v)}%` }}>
                  {s}
                </Tick>
              ))}
            </Axis>
            <Pc>samples → clusters</Pc>
            <HeadRight>vs sample share</HeadRight>
          </ChartHead>
          {ROWS.map((g) => (
            <React.Fragment key={g.name}>
              <GroupHead>{g.name}</GroupHead>
              {g.profiles.map((p) => {
                const [sb, sc] = shares(p)
                const a = xPos(sb)
                const c = xPos(sc)
                const r = ratio(p)
                return (
                  <Row
                    key={p}
                    ref={(el) => (rowRefs.current[p] = el)}
                    type="button"
                    role="option"
                    aria-selected={sel === p}
                    tabIndex={sel === p ? 0 : -1}
                    aria-label={`${LABEL[p]}: ${pct(sb)} of samples, ${pct(sc)} of clusters, ${foldText(p)}`}
                    onClick={() => choose(p)}
                    onFocus={(e) => showTip(p, e.currentTarget.querySelector("[data-fold]"))}
                  >
                    <RowLabel>
                      {LABEL[p]}
                      {ISSUE[p] && <Flag title="Known rule defect">●</Flag>}
                    </RowLabel>
                    <Track>
                      {TICKS.map(([v, s]) => (
                        <Grid key={s} style={{ left: `${xPos(v)}%` }} />
                      ))}
                      <Span style={{ left: `${Math.min(a, c)}%`, width: `${Math.abs(c - a)}%` }} />
                      <Mark style={{ left: `${a}%`, background: BS }} />
                      <Mark style={{ left: `${c}%`, background: CL }} />
                    </Track>
                    <Pc>
                      {pct(sb)} → {pct(sc)}
                    </Pc>
                    <Fold
                      data-fold
                      $big={r >= 2 || r <= 0.5}
                      onMouseEnter={(e) => showTip(p, e.currentTarget)}
                      onMouseLeave={() => setTip(null)}
                    >
                      {foldText(p)}
                    </Fold>
                  </Row>
                )
              })}
            </React.Fragment>
          ))}
        </Chart>
        {!example && <Readout p={sel} />}
      </Box>
      {tip && (
        <Tip ref={tipRef} role="tooltip">
          <b>{foldText(tip.p)}</b>
          <span>
            {LABEL[tip.p]} is {pct(shares(tip.p)[0])} of BioSamples but {pct(shares(tip.p)[1])} of sequence clusters.
          </span>
          <TipWhy>{whyText(tip.p)}</TipWhy>
        </Tip>
      )}
      {example && <WorkedExample p={sel} cardRef={cardRef} />}
    </>
  )
}

/** The overview's one-line answer for the selected row. */
const Readout = ({ p }) => {
  const [sb, sc] = shares(p)
  return (
    <ReadoutBox aria-live="polite">
      <div>
        <Eyebrow>{GROUP_OF[p].name}</Eyebrow>
        <ReadoutName>{LABEL[p]}</ReadoutName>
        <Sub>{DEF[p]}</Sub>
      </div>
      <p>
        <b>{pct(sb)}</b> of samples → <b>{pct(sc)}</b> of clusters: <b>{foldText(p)}</b>. {whyText(p)}
      </p>
      {ISSUE[p] && (
        <Warn>
          <b>Known rule defect:</b> {ISSUE[p]}
        </Warn>
      )}
    </ReadoutBox>
  )
}

/* ---------- Worked example: one profile through the pipeline ---------- */

const EXAMPLE_FIELDS = ["metagenome_label", "env_broad_scale", "env_medium", "isolation_source", "host", "country_calc", "collection_year"]

const TempStrip = ({ tenv }) => {
  const [, q1, q2, q3] = tenv
  const x = (v) => `${4 + (92 * (v - 29)) / (38 - 29)}%`
  return (
    <TempSvg role="img" aria-label={`Median ${q2.toFixed(1)} °C, interquartile range ${q1.toFixed(1)} to ${q3.toFixed(1)} °C`}>
      {[30, 32, 34, 36, 38].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1="4" y2="26" stroke={LINE} />
          <text x={x(v)} y="40" fill={MUTED} fontSize="11" textAnchor="middle">
            {v} °C
          </text>
        </g>
      ))}
      {Object.entries(P).map(([k, o]) => (
        <circle key={k} cx={x(o.tenv[2])} cy="15" r="3" fill={MUTED} opacity=".4" />
      ))}
      <line x1={x(q1)} x2={x(q3)} y1="15" y2="15" stroke={INK_SOFT} strokeWidth="3" strokeLinecap="round" />
      <circle cx={x(q2)} cy="15" r="6" fill={INK} stroke={PANEL} strokeWidth="2" />
    </TempSvg>
  )
}

const WorkedExample = ({ p, cardRef }) => {
  const o = P[p]
  const tierTotal = Object.values(o.tiers).reduce((a, b) => a + b, 0)
  const [sb, sc] = shares(p)
  return (
    <Box ref={cardRef} aria-live="polite">
      <Explain>
        <b>Worked example.</b> One profile followed through the pipeline. Pick any row in the chart to switch.
      </Explain>
      <div>
        <Eyebrow>{GROUP_OF[p].name}</Eyebrow>
        <CardName>{LABEL[p]}</CardName>
        <Sub>{DEF[p]}</Sub>
      </div>
      {ISSUE[p] && (
        <Warn>
          <b>Known rule defect:</b> {ISSUE[p]}
        </Warn>
      )}
      <ExStep n={1} title="BioSamples">
        <BigNum>
          <b>{fmt(o.n_universe)}</b> with metadata
        </BigNum>
      </ExStep>
      <ExStep n={3} title="Words that match">
        <Terms>
          {o.terms.map((t) => (
            <Term key={t}>{t}</Term>
          ))}
        </Terms>
        {o.form.length > 0 && (
          <Sub>
            Form templates:{" "}
            {o.form.map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && ", "}
                <code>{t}</code>
              </React.Fragment>
            ))}
          </Sub>
        )}
      </ExStep>
      <ExStep n={5} title="Evidence strength">
        <TierBar>
          {Object.entries(TIER)
            .filter(([k]) => o.tiers[k])
            .map(([k, t]) => (
              <span key={k} title={`${t.name}: ${fmt(o.tiers[k])}`} style={{ flexGrow: o.tiers[k], background: t.color }} />
            ))}
        </TierBar>
        <Key>
          {Object.entries(TIER).map(([k, t]) => (
            <span key={k}>
              <KeySwatch style={{ background: t.color }} />
              {t.name} {(((o.tiers[k] || 0) / tierTotal) * 100).toFixed(0)}%
            </span>
          ))}
        </Key>
        <Examples>
          {o.examples.map((e) => {
            const win = (e.profile_source || "").split("+")[0]
            const tier = TIER[e.profile_evidence]
            return (
              <ExCard key={e.biosample} style={{ borderTopColor: tier ? tier.color : MUTED }}>
                <ExId>
                  {e.biosample}
                  <span>{tier ? tier.name : e.profile_evidence}</span>
                </ExId>
                <Fields>
                  {EXAMPLE_FIELDS.filter((k) => e[k] != null).map((k) => (
                    <React.Fragment key={k}>
                      <dt data-win={k === win || undefined}>{k}</dt>
                      <dd data-win={k === win || undefined}>{String(e[k]).replace(/\.0$/, "")}</dd>
                    </React.Fragment>
                  ))}
                  {!EXAMPLE_FIELDS.includes(win) && (
                    <>
                      <dt data-win>{win}</dt>
                      <dd data-win>decided here</dd>
                    </>
                  )}
                </Fields>
              </ExCard>
            )
          })}
        </Examples>
        <Sub>Bold field: the one that decided.</Sub>
      </ExStep>
      <ExStep n={6} title="Share of sequences">
        <BigNum>
          <b>{pct(sb)}</b> of samples → <b>{pct(sc)}</b> of clusters: <b>{foldText(p)}</b>
        </BigNum>
      </ExStep>
      <ExStep n={7} title="Temperature check">
        <TempStrip tenv={o.tenv} />
        <Sub>
          Median <b>{o.tenv[2].toFixed(1)} °C</b>. Faint dots: the other profiles.
        </Sub>
      </ExStep>
    </Box>
  )
}

const ExStep = ({ n, title, children }) => (
  <ExStepWrap>
    <ExNum>{n}</ExNum>
    <BoxTitle>{title}</BoxTitle>
    <ExStepBody>{children}</ExStepBody>
  </ExStepWrap>
)

/* ---------- The whole stack, for the Model page's overview ---------- */

/* Counts from profile_summary.json and cluster_propagation.json; see the
   Methods page's writer notes. */
const LAYERS = [
  { level: "BioSamples", value: "2.74M", of: "of 6.80M carry real metadata", does: "Fields read in a fixed order; species never read" },
  { level: "Profiles", value: "21", of: "environments in 4 groups", does: "Each label carries an evidence tier" },
  { level: "Sequences", value: "256M", of: "of 307M ORFs linked to a sample", does: "Each ORF takes its sample's profile" },
  { level: "Clusters", value: "14.5M", of: "of 18.2M at 90% identity", does: "Each takes its members' majority profile" },
]

const groupShares = (key, total) =>
  GROUPS.map((g) => ({ ...g, share: (100 * g.profiles.reduce((sum, p) => sum + P[p][key], 0)) / total }))

const FLIP = [
  { label: "Counted by BioSamples", n: TOTAL_BS, groups: groupShares("n_bs", TOTAL_BS) },
  { label: "Counted by clusters", n: TOTAL_CL, groups: groupShares("n_cl", TOTAL_CL) },
]

export const ProfileStack = () => (
  <Box as="figure" aria-label="From BioSample to sequence cluster">
    <BoxTitle>From BioSample to sequence cluster</BoxTitle>
    <Layers>
      {LAYERS.map(({ level, value, of, does }) => (
        <Layer key={level}>
          <Tag>{level}</Tag>
          <LayerValue>{value}</LayerValue>
          <Sub>{of}</Sub>
          <LayerDoes>{does}</LayerDoes>
        </Layer>
      ))}
    </Layers>
    <FlipRows>
      {FLIP.map(({ label: name, n, groups }) => (
        <div key={name}>
          <FlipLabel>
            {name} <Muted>({fmt(n)})</Muted>
          </FlipLabel>
          <FlipBar role="img" aria-label={groups.map((g) => `${g.name} ${pct(g.share)}`).join(", ")}>
            {groups.map((g) => (
              <span key={g.name} title={`${g.name}: ${pct(g.share)}`} style={{ flexGrow: g.share, background: g.color }}>
                {g.share >= 12 && pct(g.share)}
              </span>
            ))}
          </FlipBar>
        </div>
      ))}
    </FlipRows>
    {/* The key carries both shares, since the thinnest segments have no room
        for a label. */}
    <MixKey>
      {GROUPS.map((g, i) => (
        <span key={g.name}>
          <KeySwatch style={{ background: g.color }} />
          {g.name}{" "}
          <b>
            {pct(FLIP[0].groups[i].share)} → {pct(FLIP[1].groups[i].share)}
          </b>
        </span>
      ))}
    </MixKey>
  </Box>
)

/* ---------- BioSample viewer ---------- */

/** Each sample's photo is its site's on the home page map (homeMap.json's
    sites.items[].image), keyed by the sample's `key`. */
const SITE_PHOTO = {
  arctic_canada: "https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/arctic.avif",
  yellowstone: "https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/yellowstone.avif",
  alps: "https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/alps.avif",
  south_africa: "https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/wastewater.avif",
  antarctica: "https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/antarctica.avif",
  lake_chapala: "https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/lake-chapala.avif",
  red_sea_brine: "https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/red-sea-brine-pool.avif",
  lake_baikal: "https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/lake-baikal.avif",
  borneo_peat: "https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/tropical-peat-swamp.avif",
  kagoshima_hot_spring: "https://static.igem.wiki/teams/6187/wiki/drylab-page/sites/hot-springs.avif",
}
const photo = (key) => SITE_PHOTO[key] && withPrefix(SITE_PHOTO[key])

/** Where the home page map's sites link: ?biosample=<key> picks the sample
    and opens the viewer; #biosample-viewer brings it into view. */
export const VIEWER_ID = "biosample-viewer"

const groupColor = (p) => GROUP_OF[p]?.color ?? NO_PROFILE

const MixBar = ({ mix, own }) => {
  const total = mix.reduce((a, [, n]) => a + n, 0)
  return (
    <>
      <MixTrack role="img" aria-label={mix.map(([p, n]) => `${label(p)} ${Math.round((100 * n) / total)}%`).join(", ")}>
        {mix.map(([p, n]) => (
          <span key={p} title={`${label(p)}: ${fmt(n)}`} style={{ flexGrow: n, background: groupColor(p) }} />
        ))}
      </MixTrack>
      <MixKey>
        {mix.slice(0, 4).map(([p, n]) => (
          <span key={p}>
            <KeySwatch style={{ background: groupColor(p) }} />
            {p === own ? <b>{label(p)}</b> : label(p)} {Math.round((100 * n) / total)}%
          </span>
        ))}
      </MixKey>
    </>
  )
}

const measured = (b) =>
  [
    b.temperature_c != null && `${+b.temperature_c.toFixed(1)} °C`,
    b.ph != null && `pH ${+b.ph.toFixed(2)}`,
    b.salinity_psu != null && `${+b.salinity_psu.toFixed(1)} psu`,
    b.elevation_m != null && b.elevation_m > 0 && `${fmt(b.elevation_m)} m`,
  ]
    .filter(Boolean)
    .join(" · ")

const Orf = ({ o, own }) => {
  const s = o.seq.replace(/\*$/, "")
  const a = (o.ds || 1) - 1
  const z = o.de || s.length
  const k = o.cluster
  const sources = [
    k.n_sra && `${fmt(k.n_sra)} metagenome`,
    k.n_nr && `${fmt(k.n_nr)} NCBI`,
    k.n_pazy && `${fmt(k.n_pazy)} known enzyme`,
  ]
    .filter(Boolean)
    .join(", ")
  return (
    <OrfBox>
      <summary>
        <OrfName>{o.domain || "Catalytic domain"}</OrfName>
        <Muted>{o.len} aa</Muted>
      </summary>
      <OrfBody>
        <Kv>
          <dt>ORF</dt>
          <dd>
            <code>{o.id}</code>
            {o.centroid && " · cluster representative"}
          </dd>
          {o.res && (
            <>
              <dt>Catalytic residues</dt>
              <dd>{o.res.replace(/[{}']/g, "").replace(/,/g, ", ")}</dd>
            </>
          )}
          {o.taxon && (
            <>
              <dt>Organism</dt>
              <dd>
                <i>{o.taxon}</i>
              </dd>
            </>
          )}
        </Kv>
        <Seq aria-label="Protein sequence; catalytic domain in bold">
          {s.slice(0, a)}
          <mark>{s.slice(a, z)}</mark>
          {s.slice(z)}
        </Seq>
        <Level>
          <Tag>90% identity cluster</Tag>
          <p>
            <b>{fmt(k.size)}</b> sequences{sources && ` (${sources})`}
          </p>
          <div>
            <Sub>Where its members were sampled</Sub>
            <MixBar mix={k.mix} own={own} />
          </div>
        </Level>
      </OrfBody>
    </OrfBox>
  )
}

export const BiosampleViewer = () => {
  const [i, setI] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("biosample")
    const j = BIOSAMPLES.findIndex((x) => x.key === key)
    if (j < 0) return
    // Landing on #biosample-viewer is gatsby-browser.js's job.
    setI(j)
    setOpen(true)
  }, [])

  const b = BIOSAMPLES[i]
  const s = b.summary
  const [field, how] = (b.profile_source || "").split("+")
  const value = b[field]
  const tier = TIER[b.profile_evidence]
  const where = [b.country_calc && titleCase(b.country_calc), b.collection_year && Math.round(b.collection_year)]
    .filter(Boolean)
    .join(", ")
  const m = measured(b)
  return (
    <ViewerBox as="figure" id={VIEWER_ID} aria-label="BioSample viewer (demo)">
      {/* Closed by default: the viewer is long, and the section reads without it.
          A link from the home page map opens it on that map site's sample. */}
      <Collapse open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>
          <Chevron aria-hidden="true" />
          <span>
            <BoxTitle as="span">BioSample Viewer (Demo)</BoxTitle>
            <Sub as="span">
              One real BioSample from each ecosystem on our other pages. Open a level to go deeper: sample → sequencing
              run → sequences → cluster.
            </Sub>
          </span>
        </summary>
        <Viewer>
          <Eco role="group" aria-label="Ecosystems">
            {BIOSAMPLES.map((x, j) => (
              <EcoButton key={x.key} type="button" aria-pressed={i === j} onClick={() => setI(j)}>
                {photo(x.key) && <EcoThumb src={photo(x.key)} alt="" loading="lazy" />}
                <EcoText>
                  {x.ecosystem}
                  <span>{label(x.profile)}</span>
                </EcoText>
              </EcoButton>
            ))}
          </Eco>
          <Tree aria-live="polite">
            <SampleHead>
              {photo(b.key) && (
                <SamplePhoto>
                  <img src={photo(b.key)} alt={b.ecosystem} />
                </SamplePhoto>
              )}
              <SampleInfo>
                <div>
                  <Tag>BioSample</Tag>
                  <BsId>{b.biosample}</BsId>
                  <Hover>{b.hover}</Hover>
                </div>
                <Kv>
                  {where && (
                    <>
                      <dt>Collected</dt>
                      <dd>{where}</dd>
                    </>
                  )}
                  {m && (
                    <>
                      <dt>Measured</dt>
                      <dd>{m}</dd>
                    </>
                  )}
                  {["metagenome_label", "env_broad_scale", "env_medium", "isolation_source", "host"]
                    .filter((f) => b[f])
                    .map((f) => (
                      <React.Fragment key={f}>
                        <dt>
                          <code>{f}</code>
                        </dt>
                        <dd>{b[f]}</dd>
                      </React.Fragment>
                    ))}
                </Kv>
                <Decide style={{ borderLeftColor: tier ? tier.color : MUTED }}>
                  Profile <b>{label(b.profile)}</b>, from <code>{field}</code>
                  {value && ` = “${value}”`}
                  {how && ` (${how.replace("=", " = ")})`} · {tier ? tier.name : b.profile_evidence}
                </Decide>
              </SampleInfo>
            </SampleHead>
            <div>
              <Sub>Its {fmt(s.n_clusters)} clusters are mostly found in</Sub>
              <MixBar mix={s.cluster_profiles} own={b.profile} />
            </div>
            {b.runs.map((r) => (
              <Level key={r.acc}>
                <Tag>Sequencing run</Tag>
                <p>
                  <code>{r.acc}</code> · {r.instrument} · {(Math.round(r.mbases / 100) / 10).toLocaleString("en-US")} Gb
                  {r.center_name && ` · ${titleCase(r.center_name)}`}
                </p>
                <Level>
                  <Tag>PETadex sequences · {fmt(r.n_orfs)}</Tag>
                  {r.orfs.map((o) => (
                    <Orf key={o.id} o={o} own={b.profile} />
                  ))}
                  {r.n_orfs > r.orfs.length && (
                    <Sub>
                      Showing {r.orfs.length} of {fmt(r.n_orfs)}: the longest of each catalytic domain type.
                    </Sub>
                  )}
                </Level>
              </Level>
            ))}
          </Tree>
        </Viewer>
      </Collapse>
    </ViewerBox>
  )
}

/* ---------- Styles ---------- */

/* Each box is a figure; && outranks the article's own figure, p and list
   spacing, as in ModelDatasets.js. */
const Box = styled.div`
  && {
    display: grid;
    gap: 1rem;
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

  code {
    font-family: var(--font-mono, monospace);
    font-size: 0.86em;
  }

  @media (max-width: 640px) {
    && {
      padding: 1rem;
    }
  }
`

/* Not a heading: the page's sidebar lists every h2 and h3 it finds. */
const BoxTitle = styled.div`
  && {
    margin: 0;
    color: ${INK_SOFT};
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`

const Sub = styled.p`
  && {
    margin: 0;
    color: ${INK_SOFT};
    font-size: 0.82rem;
  }
`

const Muted = styled.span`
  color: ${MUTED};
  font-variant-numeric: tabular-nums;
`

const Eyebrow = styled.div`
  color: ${INK_SOFT};
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`

/* Steps */

/* Steps run down the left with the open one's text beside them; on phones
   they become a swipeable row above it. */
const StepLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 15rem) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Flow = styled.ol`
  && {
    display: grid;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  @media (max-width: 760px) {
    && {
      display: flex;
      overflow-x: auto;
      padding-bottom: 0.3rem;
      scroll-snap-type: x proximity;
    }
  }
`

const FlowItem = styled.li`
  && {
    display: flex;
    min-width: 0;
    margin: 0;
  }

  @media (max-width: 760px) {
    && {
      flex: 0 0 9.5em;
      scroll-snap-align: start;
    }
  }
`

const Node = styled.button`
  all: unset;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1.1rem minmax(0, 1fr);
  flex: 1;
  align-content: start;
  gap: 0.1rem 0.4rem;
  padding: 0.45rem 0.65rem;
  border: 1.5px solid ${FRAME};
  border-radius: 10px;
  background: ${SUNK};
  color: ${INK};
  font-size: 0.82rem;
  line-height: 1.3;
  cursor: pointer;

  b {
    font-weight: 600;
  }

  &:hover {
    border-color: ${INK_SOFT};
  }

  &:focus-visible {
    outline: 2px solid ${INK};
    outline-offset: 2px;
  }

  &[aria-pressed="true"] {
    border-color: ${INK};
    background: ${INK};
    color: ${PANEL};
  }
`

const NodeNum = styled.span`
  color: inherit;
  font-weight: 700;
  font-size: 0.8rem;
  opacity: 0.75;
`

const NodeGist = styled.span`
  grid-column: 2;
  font-size: 0.72rem;
  opacity: 0.75;
`

const StepBody = styled.div`
  display: grid;
  gap: 0.6rem;
  min-height: 5.5rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  background: ${SUNK};
  box-shadow: inset 3px 0 0 ${INK};
`

const StepHead = styled.p`
  && {
    display: flex;
    gap: 0.6rem;
    font-weight: 700;
  }
`

const Chain = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
`

const ChainArrow = styled.span`
  color: ${MUTED};
  font-size: 0.75rem;
`

const FieldChip = styled.code`
  && {
    padding: 0.1rem 0.5rem 0.1rem 0.45rem;
    border-left: 3px solid;
    border-radius: 6px;
    background: ${PANEL};
    font-size: 0.75rem;
    white-space: nowrap;
  }
`

const Key = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.2rem;
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
`

const KeySwatch = styled.i`
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  margin-right: 0.35rem;
  border-radius: 2px;
  vertical-align: -1px;
`

/* Share chart */

const HowTo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.5rem;
  font-size: 0.88rem;
`

const Dot = styled.i`
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  margin-right: 0.4rem;
  border-radius: 50%;
  vertical-align: -1px;
`

const Explain = styled.p`
  && {
    padding: 0.6rem 0.9rem;
    border-radius: 8px;
    background: ${SUNK};
    font-size: 0.88rem;
  }
`

const Chart = styled.div`
  display: grid;
`

/* rem, not em: the header row's smaller type must not shift its columns off
   the rows' gridlines. */
const COLUMNS = `
  display: grid;
  grid-template-columns: 10.5rem minmax(0, 1fr) 7.5rem 6.5rem;
  gap: 0.9rem;
  align-items: center;
  padding: 0 0.6rem;

  /* Phones: label and ratio on one line, the track full width under them. */
  @media (max-width: 700px) {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "label fold" "track track";
    gap: 0.1rem 0.6rem;
    font-size: 0.82rem;
  }
`

const onPhone = (area) => `
  @media (max-width: 700px) {
    grid-area: ${area};
  }
`

const ChartHead = styled.div`
  ${COLUMNS}

  & > span:first-child {
    ${onPhone("label")}
  }

  align-items: end;
  min-height: 1.4rem;
  padding-bottom: 0.25rem;
  color: ${MUTED};
  font-size: 0.72rem;
`

const Axis = styled.div`
  position: relative;
  height: 1.1rem;
  ${onPhone("track")}
`

const Tick = styled.span`
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

const Pc = styled.span`
  color: ${INK_SOFT};
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;

  @media (max-width: 700px) {
    display: none;
  }
`

const HeadRight = styled.span`
  ${onPhone("fold")}
  text-align: right;
  white-space: nowrap;
`

const GroupHead = styled.div`
  margin-top: 0.25rem;
  padding: 0.85rem 0.6rem 0.25rem;
  border-top: 1px solid ${LINE};
  color: ${MUTED};
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`

const Row = styled.button`
  all: unset;
  box-sizing: border-box;
  ${COLUMNS}
  height: 2.25rem;
  border-radius: 7px;
  color: ${INK};
  font-size: 0.88rem;
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

  @media (max-width: 700px) {
    height: auto;
    padding-block: 0.35rem;
  }
`

const RowLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${onPhone("label")}
`

const Flag = styled.span`
  margin-left: 0.3rem;
  color: ${WARN};
  font-size: 0.6rem;
  vertical-align: 2px;
`

const Track = styled.span`
  position: relative;
  height: 100%;

  @media (max-width: 700px) {
    grid-area: track;
    height: 1.3rem;
  }
`

const Grid = styled.i`
  position: absolute;
  top: 6px;
  bottom: 6px;
  width: 1px;
  background: ${LINE};
`

const Span = styled.i`
  position: absolute;
  top: 50%;
  height: 2px;
  margin-top: -1px;
  background: ${MUTED};
  opacity: 0.6;
`

const Mark = styled.i`
  position: absolute;
  top: 50%;
  width: 13px;
  height: 13px;
  margin: -6.5px 0 0 -6.5px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px ${PANEL};
`

const Fold = styled.span`
  justify-self: end;
  border-bottom: 1px dotted ${MUTED};
  color: ${({ $big }) => ($big ? INK : INK_SOFT)};
  font-weight: ${({ $big }) => ($big ? 700 : 400)};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  cursor: help;
  ${onPhone("fold")}
`

const Tip = styled.div`
  position: fixed;
  z-index: 50;
  top: 0;
  left: 0;
  display: grid;
  gap: 0.35rem;
  max-width: min(320px, calc(100vw - 32px));
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: ${INK};
  box-shadow: 0 8px 24px -8px rgba(40, 20, 10, 0.45);
  color: ${PANEL};
  font-size: 0.82rem;
  line-height: 1.45;
  pointer-events: none;

  b {
    font-size: 0.95rem;
  }
`

const TipWhy = styled.span`
  opacity: 0.85;
`

const ReadoutBox = styled.div`
  display: grid;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  background: ${SUNK};
  box-shadow: inset 3px 0 0 ${INK};
  font-size: 0.9rem;
`

const ReadoutName = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
`

const Warn = styled.p`
  && {
    padding: 0.55rem 0.9rem;
    border-left: 3px solid ${WARN};
    border-radius: 8px;
    background: ${WARN_BG};
    font-size: 0.85rem;
  }

  b {
    color: ${WARN};
  }
`

/* Worked example */

const CardName = styled.div`
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
`

const ExStepWrap = styled.div`
  display: grid;
  grid-template-columns: 2em minmax(0, 1fr);
  gap: 0.25rem 0.6rem;
`

const ExNum = styled.span`
  grid-row: span 2;
  display: grid;
  place-items: center;
  width: 1.75em;
  height: 1.75em;
  border: 1.5px solid ${FRAME};
  border-radius: 50%;
  color: ${INK_SOFT};
  font-size: 0.8rem;
  font-weight: 700;
`

const ExStepBody = styled.div`
  display: grid;
  gap: 0.45rem;
  min-width: 0;
`

const BigNum = styled.p`
  && {
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
  }

  b {
    font-size: 1.2rem;
  }
`

const Terms = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`

const Term = styled.span`
  padding: 0.05rem 0.45rem;
  border: 1px solid ${LINE};
  border-radius: 5px;
  background: ${SUNK};
  font-family: var(--font-mono, monospace);
  font-size: 0.75rem;
`

const TierBar = styled.div`
  display: flex;
  gap: 2px;
  height: 14px;
  overflow: hidden;
  border-radius: 4px;

  span {
    flex-basis: 0;
    min-width: 2px;
  }
`

const Examples = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.6rem;
`

const ExCard = styled.div`
  display: grid;
  gap: 0.25rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid ${LINE};
  border-top: 3px solid;
  border-radius: 8px;
  background: ${BG};
  font-size: 0.78rem;
`

const ExId = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-family: var(--font-mono, monospace);
  font-weight: 500;

  span {
    color: ${INK_SOFT};
    font-family: inherit;
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`

const Kv = styled.dl`
  && {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.1rem 0.9rem;
    margin: 0;
    font-size: 0.82rem;
  }

  dt {
    color: ${MUTED};
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`

const Fields = styled(Kv)`
  && {
    gap: 1px 0.6rem;
    font-size: inherit;
  }

  dt {
    font-family: var(--font-mono, monospace);
    font-size: 0.68rem;
  }

  [data-win] {
    color: ${INK};
    font-weight: 700;
  }
`

const TempSvg = styled.svg`
  display: block;
  width: 100%;
  height: 44px;
  overflow: visible;
`

/* Viewer */

const Viewer = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 14em) minmax(0, 1fr);
  gap: 1.1rem;
  align-items: start;

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Eco = styled.div`
  display: grid;
  gap: 0.25rem;

  @media (max-width: 760px) {
    display: flex;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
`

const EcoButton = styled.button`
  all: unset;
  box-sizing: border-box;
  display: flex;
  gap: 0.55rem;
  align-items: center;
  padding: 0.4rem 0.65rem 0.4rem 0.45rem;
  border-radius: 7px;
  color: ${INK};
  font-size: 0.85rem;
  line-height: 1.25;
  cursor: pointer;

  &:hover,
  &[aria-pressed="true"] {
    background: ${SUNK};
  }

  &[aria-pressed="true"] {
    box-shadow: inset 3px 0 0 ${INK};
    font-weight: 600;
  }

  &:focus-visible {
    outline: 2px solid ${INK_SOFT};
    outline-offset: -2px;
  }

  @media (max-width: 760px) {
    flex: 0 0 auto;
  }
`

/* Photos framed as on the home page map: a circle with a cream rim. */
/* && outranks the article's own img rules, which squared the corners. */
const EcoThumb = styled.img`
  && {
    flex: 0 0 auto;
    width: 2.1rem;
    height: 2.1rem;
    margin: 0;
    border: 2px solid #f7eed8;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(40, 24, 10, 0.22);
    object-fit: cover;
  }
`

const EcoText = styled.span`
  display: grid;
  gap: 1px;
  min-width: 0;

  && span {
    color: ${MUTED};
    font-size: 0.72rem;
    font-weight: 400;
  }
`

/* The photo runs the full height of the sample's details, from its title
   down to the profile line, with the details to its right. Stacks on phones. */
const SampleHead = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 11rem) minmax(0, 1fr);
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

/* The image is absolutely placed so its own height cannot grow the row: the
   details set the height and the photo fills it. */
const SamplePhoto = styled.div`
  position: relative;
  min-height: 9rem;
  overflow: hidden;
  border: 3px solid #f7eed8;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(40, 24, 10, 0.25);

  && img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    border: 0;
    border-radius: 0;
    object-fit: cover;
  }
`

const SampleInfo = styled.div`
  display: grid;
  align-content: start;
  gap: 0.75rem;
  min-width: 0;
`

/* Clears the sticky header when a map link scrolls the viewer into view. */
const ViewerBox = styled(Box)`
  scroll-margin-top: 6rem;
`

const Collapse = styled.details`
  summary {
    display: flex;
    gap: 0.7rem;
    align-items: start;
    list-style: none;
    cursor: pointer;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary > span {
    display: grid;
    gap: 0.35rem;
  }

  summary:focus-visible {
    outline: 2px solid ${INK};
    outline-offset: 4px;
    border-radius: 4px;
  }

  &[open] > summary {
    margin-bottom: 1rem;
  }
`

/* A right-pointing caret that turns down when open. */
const Chevron = styled.span`
  flex: 0 0 auto;
  width: 0.55rem;
  height: 0.55rem;
  margin: 0.2rem 0.15rem 0 0.1rem;
  border-right: 2px solid ${INK_SOFT};
  border-bottom: 2px solid ${INK_SOFT};
  transform: rotate(-45deg);
  transition: transform 0.2s ease;

  details[open] > summary > & {
    transform: rotate(45deg);
  }
`

const Tree = styled.div`
  display: grid;
  gap: 0.75rem;
  min-width: 0;
`

const Level = styled.div`
  display: grid;
  gap: 0.6rem;
  min-width: 0;
  margin-left: 0.4rem;
  padding-left: 0.9rem;
  border-left: 2px solid ${FRAME};
  font-size: 0.85rem;
`

const Tag = styled.span`
  color: ${MUTED};
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`

const BsId = styled.div`
  font-family: var(--font-mono, monospace);
  font-size: 0.95rem;
  font-weight: 500;
`

const Hover = styled.p`
  && {
    color: ${INK_SOFT};
    font-size: 0.88rem;
    font-style: italic;
  }
`

const Decide = styled.p`
  && {
    padding: 0.5rem 0.75rem;
    border-left: 3px solid;
    border-radius: 8px;
    background: ${SUNK};
    font-size: 0.85rem;
  }
`

const MixTrack = styled.div`
  display: flex;
  gap: 2px;
  height: 12px;
  margin-top: 0.3rem;
  overflow: hidden;
  border-radius: 3px;

  span {
    flex-basis: 0;
    min-width: 2px;
  }
`

const MixKey = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.9rem;
  margin-top: 0.3rem;
  color: ${INK_SOFT};
  font-size: 0.75rem;
`

const OrfBox = styled.details`
  border: 1px solid ${LINE};
  border-radius: 8px;
  background: ${BG};

  summary {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.6rem;
    align-items: baseline;
    padding: 0.45rem 0.65rem;
    font-size: 0.82rem;
    list-style: none;
    cursor: pointer;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::before {
    content: "+";
    color: ${MUTED};
    font-family: var(--font-mono, monospace);
  }

  &[open] summary::before {
    content: "–";
  }

  summary:focus-visible {
    outline: 2px solid ${INK};
    outline-offset: 2px;
  }
`

const OrfName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const OrfBody = styled.div`
  display: grid;
  gap: 0.6rem;
  padding: 0 0.75rem 0.75rem 1.6rem;
  font-size: 0.82rem;
`

const Seq = styled.div`
  padding: 0.5rem 0.65rem;
  border-radius: 6px;
  background: ${SUNK};
  color: ${MUTED};
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
  line-height: 1.6;
  overflow-wrap: anywhere;

  mark {
    background: transparent;
    color: ${INK};
    font-weight: 600;
  }
`

/* Stack */

const Layers = styled.ol`
  && {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.3rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  @media (max-width: 640px) {
    && {
      grid-template-columns: 1fr;
      gap: 1.2rem;
    }
  }
`

/* && outranks the article's li + li spacing, as in ModelDatasets.js. */
const Layer = styled.li`
  position: relative;
  display: grid;
  align-content: start;
  gap: 0.2rem;
  padding: 0.7rem 0.8rem;
  border: 1.5px solid ${FRAME};
  border-radius: 10px;
  background: ${SUNK};

  && {
    margin: 0;
  }

  /* Arrow to the next layer: right on wide screens, down when stacked. */
  &:not(:last-child)::after {
    content: "→";
    position: absolute;
    top: 50%;
    right: -1.05rem;
    transform: translateY(-50%);
    color: ${MUTED};
    font-weight: 700;
  }

  @media (max-width: 640px) {
    &:not(:last-child)::after {
      content: "↓";
      top: auto;
      right: auto;
      bottom: -1.15rem;
      left: 50%;
      transform: translateX(-50%);
    }
  }
`

const LayerValue = styled.span`
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`

const LayerDoes = styled.span`
  margin-top: 0.3rem;
  padding-top: 0.4rem;
  border-top: 1.5px dashed ${FRAME};
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.35;
`

const FlipRows = styled.div`
  display: grid;
  gap: 0.7rem;
`

const FlipLabel = styled.div`
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
`

const FlipBar = styled.div`
  display: flex;
  gap: 2px;
  height: 1.6rem;
  overflow: hidden;
  border-radius: 6px;

  span {
    display: grid;
    flex-basis: 0;
    place-items: center;
    min-width: 2px;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`
