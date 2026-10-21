import { S, DRY_LAB_TRACKS } from "./dryLabCalendar.js"
import { weekIdForDate } from "./contributionCalendar/calendarUtils.js"

/*
 * Dry Lab's iterations: what went wrong (or surprised us), how we found out,
 * and what we changed. One record per story; the calendar, the ledger
 * (<DryLabIterations />) and the Engineering page all read from here.
 *
 * Sources: the Dry Lab meeting minutes (named in each `source`). Write about
 * the work, never the people: no names, costs, deadline pressure or health.
 *
 * Fields
 *   track     a workstream id from DRY_LAB_TRACKS, or "all" for the whole Dry Lab
 *   kind      failure     a test showed our approach was wrong
 *             surprise    a result we didn't expect, which changed the plan
 *             constraint  a limit (time, compute, scale) we designed around
 *             feedback    outside input (advisors, tool authors, editors,
 *                         interviews) that we responded to and integrated
 *   criteria  which judging lens it speaks to: engineering, model, hp
 *   expected / happened / foundBy / learned / changed   one or two sentences each
 *   result    optional: what the change achieved
 *   status    resolved | in-progress | open
 *   steps     dated Design / Build / Test / Learn steps; dates inside the season
 *   see       wiki sections holding the evidence, as [label, href]
 *
 * Check with `npm run check:calendar` (fields, dates, links).
 */

/** @typedef {'failure' | 'surprise' | 'constraint' | 'feedback'} IterationKind */
/** @typedef {'resolved' | 'in-progress' | 'open'} IterationStatus */

export const ITERATION_KINDS = {
  failure: { label: "Failure", glyph: "!" },
  surprise: { label: "Surprise", glyph: "?" },
  constraint: { label: "Constraint", glyph: "◇" },
  feedback: { label: "Outside feedback", glyph: "↩" },
}

export const ITERATION_STATUSES = {
  resolved: { label: "Resolved" },
  "in-progress": { label: "In progress" },
  open: { label: "Open" },
}

export const ITERATION_CRITERIA = {
  engineering: "Engineering",
  model: "Model",
  hp: "Human Practices",
}

export const ITERATION_STAGES = {
  design: "Design",
  build: "Build",
  test: "Test",
  learn: "Learn",
}

/** @type {Array<Object>} in pipeline order within each workstream */
const ITERATIONS_RAW = [
  // Dataset
  {
    id: "plasticome-contamination",
    track: "dataset",
    kind: "failure",
    criteria: ["engineering", "model"],
    title: "The curated seed set wasn't clean",
    expected: "PETadex-PAZy, our hand-curated set of known plastic-degrading enzymes, would be reliable ground truth for every search built on it.",
    happened: "Re-checking it showed that homologs of enzymes that don't degrade plastic had leaked in through the earlier curation.",
    foundBy: "A sequence-by-sequence re-curation against the published sources during the PETadex rebuild.",
    learned: "Every downstream search inherits the seed set's errors, so the seed set needs the strictest QC of anything in the pipeline.",
    changed: "Re-curated to about 470 validated enzymes with confirmed sequences; about 40 sequences changed. The full Logan search waited until the corpus was QC'd.",
    result: "A sizeable part of the database would otherwise have been built on the wrong enzymes.",
    status: "resolved",
    steps: [
      { date: "2026-07-21", stage: "test", text: "Re-curation finds non-plastic-degrading homologs in the seed set." },
      { date: "2026-07-21", stage: "build", text: "PETadex-PAZy rebuilt: ~470 enzymes, ~40 sequences changed." },
      { date: "2026-08-09", stage: "design", text: "Full Logan search held until the corpus is QC'd." },
    ],
    see: [S.plasticome],
    source: "Meeting #14 (Jul 21)",
  },
  {
    id: "seed-msas",
    track: "dataset",
    kind: "failure",
    criteria: ["engineering", "model"],
    title: "Seed alignments were too shallow",
    expected: "Alignments built from the ~600 known enzymes would give reliable catalytic HMMs for searching Logan.",
    happened: "Many components had fewer than 10 sequences, some only 1 or 2, so residues that shouldn't line up were aligned together.",
    foundBy: "HMM benchmarks for overfitting, envelope creep, hit quality and complete vs partial hits.",
    learned: "Alignment depth, not the HMM build, was the weak link; benchmarking is what caught it.",
    changed: "Rebuilt the seed alignments from about 2,000 close NCBI-nr homologs, cleaned by hand.",
    status: "in-progress", // VERIFY: resolved once the rebuilt HMMs are confirmed in the release search
    steps: [
      { date: "2026-08-25", stage: "test", text: "Benchmarks flag misaligned components." },
      { date: "2026-08-25", stage: "learn", text: "Root cause: seed MSAs of 1–2 sequences." },
      { date: "2026-08-25", stage: "design", text: "Rebuild from ~2,000 close NR homologs; gap-penalty tuning as the alternative." },
    ],
    see: [S.hmms],
    source: "Meeting #17 (Aug 25)",
  },
  {
    id: "circular-hmm-validation",
    track: "dataset",
    kind: "surprise",
    criteria: ["engineering", "model"],
    title: "Our HMM validation was circular",
    expected: "Benchmarking the catalytic HMMs on NCBI-nr would show how well they find real enzymes.",
    happened: "The HMMs were themselves built from the NR search, so testing them on NR mostly measured how well they recall their own training data.",
    foundBy: "Reviewing the search figures for the manuscript.",
    learned: "A benchmark has to be independent of what the model was built from.",
    changed: "Validate the HMMs on a held-out set from Logan instead.",
    status: "in-progress",
    steps: [
      { date: "2026-09-26", stage: "learn", text: "Circularity spotted in the NR benchmark." },
      { date: "2026-09-26", stage: "design", text: "Move validation to a Logan set." },
    ],
    see: [S.hmms],
    source: "Meeting #19 (Sep 26)",
  },
  {
    id: "logan-fragments",
    track: "dataset",
    kind: "surprise",
    criteria: ["engineering"],
    title: "Logan hits are mostly fragments",
    expected: "Searching assembled public sequencing data would recover full-length enzymes, as searching NR does.",
    happened: "About a billion poorly assembled sequences flooded results with fragments. Even after filtering, Logan contigs peak around 100 residues, while NR hits are mostly complete (~300) with canonical catalytic residues.",
    foundBy: "Counting fragments per HMM component, then comparing contig-length distributions between Logan and NR.",
    learned: "Scale from metagenomes comes with partial sequences; completeness has to be measured and reported, not assumed.",
    changed: "Kept only sequences with a complete catalytic domain (~300M) and assigned fragments to clusters, so clusters hold both. The completeness gap is reported in the manuscript's discussion.",
    status: "open",
    steps: [
      { date: "2026-05-09", stage: "test", text: "Fragment-heavy search results traced to ~1B poorly assembled sequences." },
      { date: "2026-05-09", stage: "build", text: "~300M complete sequences with full catalytic domains extracted." },
      { date: "2026-09-26", stage: "test", text: "Contig lengths: Logan peaks near 100 residues, NR near 300." },
    ],
    see: [S.logan, S.clustering],
    source: "Meetings #5 (May 9) and #19 (Sep 26)",
  },

  // Annotation
  {
    id: "novel-domains",
    track: "annotation",
    kind: "failure",
    criteria: ["engineering", "model"],
    title: "Novel domains can't be called from sequence alone",
    expected: "Masking known domains and clustering what's left would reveal new accessory domains directly.",
    happened: "Leftover regions were mostly short, and singletons could be chance. A sequence-only call over a billion sequences wouldn't be defensible.",
    foundBy: "Following the funnel step by step (65K strands → 13K fragments → 1,300 over 50 residues) and asking what would convince a reviewer.",
    learned: "Novelty needs structural evidence and a benchmark where any hit is a false positive.",
    changed: "Fold the full proteins, cut domains by structure and compare against TED (The Encyclopedia of Domains). Benchmark on UniProt and the AlphaFold DB, which shouldn't contain new domains.",
    result: "On a 1,000-protein test the pipeline reproduces TED's own domain cuts, and validation against existing data is complete.",
    status: "in-progress",
    steps: [
      { date: "2026-06-06", stage: "test", text: "Accession search returns 0 matches at 90M sequences; bug fixed (~46K at 21M)." },
      { date: "2026-06-16", stage: "learn", text: "Funnel to ~1,300 fragments; sequence alone can't establish novelty." },
      { date: "2026-06-23", stage: "design", text: "Validate candidates against TED." },
      { date: "2026-06-30", stage: "learn", text: "TED stores structures, so strands must be folded first." },
      { date: "2026-07-28", stage: "learn", text: "A masked fragment won't fold on its own: fold the full protein." },
      { date: "2026-08-25", stage: "design", text: "Benchmark against UniProt and the AlphaFold DB." },
      { date: "2026-09-26", stage: "test", text: "1,000-protein test matches TED's cuts; one step too slow to scale." },
      { date: "2026-10-03", stage: "test", text: "Validation against existing data complete." },
    ],
    see: [S.novel, S.domains],
    source: "Meetings #9–#19 and the Oct 3 wrap-up",
  },
  {
    id: "signalp-version",
    track: "annotation",
    kind: "surprise",
    criteria: ["engineering"],
    title: "The first signal peptide call didn't make biological sense",
    expected: "A test run on IsPETase would return the signal peptide type we know it has.",
    happened: "SignalP 5 returned about 80% confidence for a type (SP2) that is biologically unexpected for IsPETase.",
    foundBy: "Running a known enzyme as a control before scaling.",
    learned: "SignalP 5 covers only three of the five signal peptide types, so it was forcing a wrong class.",
    changed: "Switched to SignalP 6, which covers all five, then scaled it to every sequence.",
    result: "SignalP results for all 300M sequences are in the database.",
    status: "resolved",
    steps: [
      { date: "2026-03-21", stage: "test", text: "IsPETase control returns an unlikely SP2 call." },
      { date: "2026-03-21", stage: "design", text: "Validate with SignalP 6." },
      { date: "2026-07-06", stage: "build", text: "SignalP 6 done for all 300M sequences." },
    ],
    see: [S.signal],
    source: "Meetings #3 (Mar 21) and #13 (Jul 6)",
  },
  {
    id: "deeploc-throughput",
    track: "annotation",
    kind: "constraint",
    criteria: ["engineering"],
    title: "Localization prediction was too slow for the database",
    expected: "DeepLoc could run alongside SignalP across every sequence.",
    happened: "Benchmarked at about 14 sequences per second, far slower than SignalP: too costly for hundreds of millions of sequences.",
    foundBy: "A throughput benchmark before the full run.",
    learned: "Benchmark the cost of every tool before committing to a database-wide run.",
    changed: "Run DeepLoc on an autoscaling cluster, only where organism tags show it's relevant, once the new database lands.",
    status: "in-progress",
    steps: [
      { date: "2026-07-06", stage: "test", text: "DeepLoc benchmarked at ~14 sequences/s." },
      { date: "2026-07-28", stage: "build", text: "Autoscaling group ready to run on the new database." },
    ],
    see: [S.signal],
    source: "Meetings #13 (Jul 6) and #15 (Jul 28)",
  },
  {
    id: "eukaryote-calls",
    track: "annotation",
    kind: "failure",
    criteria: ["engineering", "model"],
    title: "Sample metadata mislabels organisms",
    expected: "A sample's metadata would tell us whether a sequence came from a eukaryote.",
    happened: "About 93M sequences looked eukaryotic by metadata, but metagenomes mix organisms: a \"human\" sample can be gut bacteria.",
    foundBy: "Checking the eukaryote count against what metagenomic samples contain.",
    learned: "Per-sample labels describe the sample, not the organism a read came from.",
    changed: "Call it per 90% cluster: if every member says eukaryote it's probably real, and a single bacterial member points to a bacterial origin.",
    status: "in-progress",
    steps: [
      { date: "2026-03-28", stage: "learn", text: "SRA labels describe the sample, not the read." },
      { date: "2026-07-06", stage: "test", text: "~93M sequences flagged eukaryotic by metadata." },
      { date: "2026-07-06", stage: "design", text: "Decide by consensus across each 90% cluster." },
    ],
    see: [S.metadata],
    source: "Meetings #4 (Mar 28) and #13 (Jul 6)",
  },
  {
    id: "map-sampling-bias",
    track: "annotation",
    kind: "surprise",
    criteria: ["engineering", "model"],
    title: "The world map showed sampling, not enzymes",
    expected: "Mapping where PETadex sequences come from would show where plastic-degrading enzymes are concentrated.",
    happened: "Raw counts just mirrored where sequencing happens: North America, Europe and East Asia.",
    foundBy: "Comparing the map to where public samples come from.",
    learned: "Counts need a control for sampling effort before they mean anything.",
    changed: "Normalized sequence density by Logan biosample density, and present it with marginal histograms of the samples.",
    result: "The normalized map is mostly flat with one clear hotspot, a candidate plastic dump that is being traced. Soil is ~4% of biosamples but ~31% of clusters.",
    status: "in-progress",
    steps: [
      { date: "2026-08-18", stage: "test", text: "Raw map tracks sampling effort." },
      { date: "2026-08-18", stage: "build", text: "Normalized by biosample density; one hotspot appears." },
      { date: "2026-09-26", stage: "design", text: "Normalized map with marginal sample histograms for the paper." },
    ],
    see: [S.metaProfiles],
    source: "Meetings #16 (Aug 18) and #19 (Sep 26)",
  },
  {
    id: "esmfold-steps",
    track: "annotation",
    kind: "surprise",
    criteria: ["engineering", "model"],
    title: "More folding steps didn't mean better structures",
    expected: "Tuning ESMFold2's diffusion steps would trade runtime for structure quality.",
    happened: "On a leakage-free benchmark (proteins released after the training cutoff that have PDB structures), structures were nearly identical across settings; only runtime changed.",
    foundBy: "A hyperparameter sweep scored by TM-score against experimental structures.",
    learned: "Quality was already saturated, so the setting only affects cost. The planned fine-tune vs base comparison would also have needed ESMFold2 itself retrained.",
    changed: "Used the original paper's 68 steps, and replaced fine-tune vs base with an MSA vs no-MSA experiment.",
    status: "resolved",
    steps: [
      { date: "2026-07-21", stage: "build", text: "Leakage-free benchmark set built." },
      { date: "2026-07-28", stage: "test", text: "Sweep: structures near-identical, only runtime differs." },
      { date: "2026-07-28", stage: "design", text: "68 steps; MSA vs no-MSA replaces fine-tune vs base." },
    ],
    see: [S.structures],
    source: "Meetings #14 (Jul 21) and #15 (Jul 28)",
  },

  // Machine Learning
  {
    id: "stability-models",
    track: "ml",
    kind: "failure",
    criteria: ["model"],
    title: "Published stability models don't work for PETases",
    expected: "An existing thermostability or growth-temperature model could label our enzymes.",
    happened: "General-purpose models tend to return average conditions rather than enzyme-specific predictions.",
    foundBy: "Comparing published models' outputs on PETases against the literature.",
    learned: "We need a model specific to plastic-degrading enzymes, and only one good enough to rank candidates, not a state-of-the-art predictor.",
    changed: "A PETase-specific model on ESM embeddings plus explicit features (growth temperature and other metadata), fed in as extra tokens, trained with the scraped activity data.",
    status: "in-progress",
    steps: [
      { date: "2026-06-16", stage: "test", text: "Published models return average conditions." },
      { date: "2026-06-16", stage: "design", text: "Two-headed PETase-specific model planned." },
      { date: "2026-09-26", stage: "build", text: "Proof of concept on current data, metadata as extra tokens." },
    ],
    see: [S.activity, S.lora],
    source: "Meetings #10 (Jun 16) and #19 (Sep 26)",
  },
  {
    id: "embedding-null",
    track: "ml",
    kind: "surprise",
    criteria: ["model"],
    title: "Fine-tuning barely moved the embeddings",
    expected: "Fine-tuning ESM on the PETadex would visibly reshape the embedding map.",
    happened: "Fine-tuned and base embeddings looked almost the same.",
    foundBy: "Embedding the same centroids with both models and comparing them side by side.",
    learned: "A visual impression isn't evidence either way; the difference has to be measured.",
    changed: "Report correlation and similarity between the two embeddings instead of comparing maps by eye.",
    status: "in-progress",
    steps: [
      { date: "2026-07-06", stage: "test", text: "Fine-tuned vs base maps look nearly identical." },
      { date: "2026-07-21", stage: "build", text: "Base and fine-tuned embeddings side by side in one table." },
    ],
    see: [S.controls, S.lora],
    source: "Meetings #13 (Jul 6) and #14 (Jul 21)",
  },
  {
    id: "controls-scale",
    track: "ml",
    kind: "constraint",
    criteria: ["model"],
    title: "Controls swamped the map",
    expected: "Every embedding map could carry its full set of control sequences.",
    happened: "With controls, the 20,000-centroid map grew to about 400,000 points.",
    foundBy: "Rendering the map with its controls.",
    learned: "The controls showed what they needed to: a 30% window of a sequence embeds much closer to the full sequence than the baselines do, and shuffled sequences land where expected.",
    changed: "No controls on the 60% map; controls return for the final version.",
    status: "resolved",
    steps: [
      { date: "2026-06-06", stage: "build", text: "Fragment controls (10–100 residues, five replicas)." },
      { date: "2026-07-06", stage: "test", text: "Controls behave sanely; map grows to ~400K points." },
      { date: "2026-07-06", stage: "design", text: "Drop controls at 60%, keep them for the final map." },
    ],
    see: [S.controls],
    source: "Meetings #9 (Jun 6) and #13 (Jul 6)",
  },

  // Activity Data
  {
    id: "llm-hallucinations",
    track: "extraction",
    kind: "failure",
    criteria: ["engineering", "model"],
    title: "The cheaper model attached data to the wrong enzyme",
    expected: "A small, cheap model could extract activity values from papers reliably.",
    happened: "Haiku hallucinated and swapped which experiment belonged to which protein: right numbers, wrong enzyme.",
    foundBy: "Checking extractions against the papers by hand.",
    learned: "Extraction needs a check that every value is really in the paper.",
    changed: "Every value now comes with an evidence sentence. One script finds that sentence in the source and another checks the value is in it. Models are compared on the same papers.",
    result: "Over 1,276 papers Haiku had 33 flags, 11 of them real hallucinations; Sonnet had none. Opus over-applied the \"skip if not relevant\" rule and cut valid proteins, so Sonnet runs the pipeline.",
    status: "resolved",
    steps: [
      { date: "2026-07-06", stage: "test", text: "Haiku swaps entities between experiments." },
      { date: "2026-07-06", stage: "design", text: "Evidence sentences with script checks." },
      { date: "2026-07-28", stage: "test", text: "Haiku 33 flags / 11 real; Sonnet 0." },
      { date: "2026-09-01", stage: "test", text: "Controls: no false positives, rare false negatives." },
      { date: "2026-09-08", stage: "test", text: "Opus over-cuts; Sonnet kept." },
    ],
    see: [S.llm, S.agreement],
    source: "Meetings #13, #15, #18 and the Sep 8 meeting",
  },
  {
    id: "one-condition",
    track: "extraction",
    kind: "failure",
    criteria: ["engineering"],
    title: "One value per paper hid the conditions",
    expected: "One extraction per paper would capture its activity data.",
    happened: "Papers report activity under several pH and temperature conditions (e.g. 10.6 vs 18.9 U/mg), and the model returned just one of them.",
    foundBy: "Spot-checking extracted values against the papers.",
    learned: "The unit of extraction is an experiment, not a paper.",
    changed: "Split papers into experiments before extraction, which also fits the model's output limit.",
    status: "resolved",
    steps: [
      { date: "2026-06-06", stage: "test", text: "Spot checks: one condition kept out of several." },
      { date: "2026-07-06", stage: "build", text: "Papers split by experiment before extraction." },
    ],
    see: [S.llm, S.schema],
    source: "Meetings #9 (Jun 6) and #13 (Jul 6)",
  },
  {
    id: "pdf-text",
    track: "extraction",
    kind: "failure",
    criteria: ["engineering"],
    title: "PDF parsing dropped paragraphs",
    expected: "GROBID would turn each paper's PDF into clean, sectioned text.",
    happened: "GROBID skipped paragraphs it judged irrelevant, and odd PDF encodings merged two columns line by line.",
    foundBy: "Comparing GROBID's output with the PDFs.",
    learned: "No single parser is complete; their outputs have to be reconciled.",
    changed: "Detect columns from empty space, extract text within each column, and merge missing paragraphs back into GROBID's XML by section.",
    result: "Most papers now have their full abstract, introduction, methods, results and discussion.",
    status: "resolved",
    steps: [
      { date: "2026-06-16", stage: "test", text: "Missing paragraphs and merged columns found." },
      { date: "2026-06-16", stage: "build", text: "Column-aware extraction merged into GROBID XML." },
    ],
    see: [S.llm],
    source: "Meeting #10 (Jun 16)",
  },
  {
    id: "human-scraping-scale",
    track: "extraction",
    kind: "constraint",
    criteria: ["engineering", "model"],
    title: "Human scraping didn't scale to 100 papers",
    expected: "Volunteers could hand-extract about 100 papers as ground truth for the LLM.",
    happened: "A paper took 3–6 hours, and the first candidate list overlapped only ~8% with papers already scraped.",
    foundBy: "Timing the pilot rounds and auditing submissions.",
    learned: "We need enough papers to validate the LLM, not the whole literature. Errors cluster in predictable places (misspellings, extra columns).",
    changed: "Scoped to the papers needed for validation. Moved to an interactive form with fixed dropdowns, two scrapers per paper and a third on disagreement, swapped review papers for PAZy papers, and automated error checks.",
    result: "Human vs LLM agreement is measured: the LLM found 70% of the enzymes humans listed, against 83% for a second human.",
    status: "resolved",
    steps: [
      { date: "2026-08-18", stage: "test", text: "3–6 hours per paper; 100 papers unrealistic." },
      { date: "2026-08-25", stage: "design", text: "Interactive form; two scrapers plus a tie-breaker." },
      { date: "2026-09-01", stage: "build", text: "Form live; work time down to ~1–1.5 hours per paper." },
      { date: "2026-09-26", stage: "test", text: "~8% overlap: swap reviews for PAZy papers, automate checks." },
    ],
    see: [S.schema, S.agreement],
    source: "Meetings #16–#19",
  },

  // DNA Ordering
  {
    id: "lobster",
    track: "ordering",
    kind: "failure",
    criteria: ["engineering"],
    title: "Five redesigns of the library algorithm",
    expected: "Degenerate codons alone could encode most of a cluster's natural sequences in a few cheap oligos.",
    happened: "Degeneracy can't handle sequences of different lengths, one cluster needed 22 oligos, and HMM hits were narrower than the real domain. The effective-sequences objective sat flat at 1 because it counted everything.",
    foundBy: "Prototype runs reporting percent wild-type, percent junk and oligo coverage per cluster.",
    learned: "Cost and diversity pull against each other inside the algorithm, so diversity has to come from which sequences go in. Library cap turned out to be the only parameter that matters.",
    changed: "A graph of cut positions for mixed lengths, a tunable cap on junk, domains cut by structure, and caps on kilobases and colonies instead of the effective-sequences objective.",
    result: "LOBSTER is finished: the IsPETase case runs in ~15 minutes on a laptop, and two clusters alone save ~$2,300.",
    status: "resolved",
    steps: [
      { date: "2026-06-16", stage: "design", text: "Coverage via bitmap shifts; greedy and DP sketches." },
      { date: "2026-06-30", stage: "test", text: "22 oligos for one cluster; equal lengths only." },
      { date: "2026-06-30", stage: "design", text: "Fragment graph; percent-junk cap as a parameter." },
      { date: "2026-08-18", stage: "learn", text: "HMM hits narrower than the domain: cut by structure." },
      { date: "2026-08-25", stage: "learn", text: "Effective-sequences curve flat: drop it." },
      { date: "2026-09-01", stage: "build", text: "Algorithm finished." },
      { date: "2026-09-26", stage: "test", text: "Grid search: only the library cap matters." },
    ],
    see: [S.lobster],
    source: "Meetings #10–#19",
  },
  {
    id: "centroid-sampling",
    track: "ordering",
    kind: "failure",
    criteria: ["engineering"],
    title: "One sequence per superfamily was too risky",
    expected: "Ordering one 90% centroid per superfamily would cover the most superfamilies for Wet Lab's capacity.",
    happened: "A single wrong centroid could mark a whole superfamily inactive; a previous screen had found a whole ocean clade inactive.",
    foundBy: "Weighing the sampling plan against earlier screening results.",
    learned: "Each superfamily needs a spread, not a point estimate, even if fewer superfamilies fit.",
    changed: "Three 90% centroids per superfamily, each from a different 60% family. A random baseline batch goes first and bioprospecting second.",
    status: "resolved",
    steps: [
      { date: "2026-09-01", stage: "design", text: "Triplicates in different 60% families; random baseline first." },
    ],
    see: [S.lobster],
    source: "Meeting #18 (Sep 1)",
  },

  // Software
  {
    id: "search-io",
    track: "software",
    kind: "surprise",
    criteria: ["engineering"],
    title: "Search was slow because of downloads, not compute",
    expected: "Searching 300M sequences would be limited by alignment compute.",
    happened: "Most of the time went to downloading the database shards.",
    foundBy: "Profiling each stage of a search.",
    learned: "Fix the bottleneck you measure, not the one you assume.",
    changed: "Download compressed shards that decompress while the search runs, with managed memory, using a patch from DIAMOND's author.",
    result: "From 10 minutes to 2 minutes to 48 seconds (~40 s warm); shard download ~8 s.",
    status: "resolved",
    steps: [
      { date: "2026-06-02", stage: "design", text: "Search over 300M sequences on AWS Lambda." },
      { date: "2026-06-16", stage: "test", text: "Profiling: IO dominates." },
      { date: "2026-06-16", stage: "build", text: "Streaming decompression and a DIAMOND patch: 48 s." },
    ],
    see: [S.diamond, S.diamondPerf],
    source: "Meeting #10 (Jun 16)",
  },
  {
    id: "cluster-queries",
    track: "software",
    kind: "constraint",
    criteria: ["engineering"],
    title: "Database queries were too slow for the website",
    expected: "The website could query the cluster table and domain pages directly from SQL.",
    happened: "One query on the cluster table took about 10 minutes, and a catalytic-domain page took 1–2 minutes to load.",
    foundBy: "Timing the drill-down the front end needed.",
    learned: "The web needs data shaped for how it's read, not how it's stored.",
    changed: "Restructured the cluster table into a tree of small tables, so any cluster's children load in effectively constant time. Domain pages get a materialized view.",
    status: "resolved",
    steps: [
      { date: "2026-07-21", stage: "build", text: "Tree of small tables: instant drill-down." },
      { date: "2026-08-25", stage: "test", text: "Domain pages take 1–2 minutes; materialized view planned." },
    ],
    see: [S.atlas, S.record],
    source: "Meetings #14 (Jul 21) and #17 (Aug 25)",
  },

  {
    id: "demo-offline",
    track: "software",
    kind: "constraint",
    criteria: ["engineering"],
    title: "The search demo couldn't lean on the live site",
    expected: "Each replayed search on the wiki could link straight to its full result on petadex.net.",
    happened: "The site's API timed out while the demo was being built, so none of the ten result links could be confirmed to open.",
    foundBy: "Opening every outward link from the demo before shipping it.",
    learned: "A demo on the wiki has to work whatever state the live service is in.",
    changed: "The ten searches, each really run on the live tool, ship with the page as 46 kB of data and replay with no network calls. The links to petadex.net stay, marked to be checked before publishing.",
    status: "open",
    steps: [
      { date: "2026-10-19", stage: "test", text: "API times out; the ten result links can't be confirmed." },
      { date: "2026-10-19", stage: "build", text: "Ten real searches shipped with the page; the demo needs no network." },
    ],
    see: [S.diamond],
    source: "Commit history (Oct 19)",
  },

  // The wiki
  {
    id: "upload-budget",
    track: "all",
    kind: "constraint",
    criteria: ["engineering"],
    title: "The wiki didn't fit iGEM's upload limit",
    expected: "The Dry Lab pages, figures and interactive demos would deploy to iGEM's servers like any other page.",
    happened: "The build went over iGEM's 5 MB upload limit and ran out of build-runner memory. Images embedded inside pages, and figures committed into the build output (three of them used by no page), counted against the budget.",
    foundBy: "Failed builds on iGEM's GitLab, and the size check that runs after every build.",
    learned: "An image inside a page is paid for on every build; the budget has to be designed for, not checked at the end.",
    changed: "Embedded figures became files, plots became AVIF, and large images moved to iGEM's static host. The issue pages leave the iGEM build until their images move too, and the sync to GitLab sends its files in batches under GitLab's push limits.",
    result: "The build passes the size check with all three interactives on the overview.",
    status: "in-progress",
    steps: [
      { date: "2026-10-17", stage: "test", text: "Build over the 5 MB upload limit and out of runner memory." },
      { date: "2026-10-17", stage: "build", text: "Issue pages left out; embedded figures moved into files; GitLab sync in batches." },
      { date: "2026-10-18", stage: "build", text: "Model page figures and the DIAMOND logo served from iGEM's static host." },
      { date: "2026-10-19", stage: "build", text: "Model plots converted to AVIF; landscape images halved (493 to 248 kB)." },
      { date: "2026-10-20", stage: "test", text: "Build passes the size check with the landscape, game and demo." },
    ],
    see: [S.overview],
    source: "Commit history (Oct 17–20)",
  },
  {
    id: "page-review",
    track: "all",
    kind: "failure",
    criteria: ["engineering", "model"],
    title: "The Model page said things its figures didn't",
    expected: "Figures and numbers written into the Model page would match their sources.",
    happened: "Three embedded figures shared one label, so all three showed the SignalP figure. A count had lost its magnitude (7.8 for 7.83 million), one sentence still held a placeholder, a reference pointed at old figure numbering, and alt text described the wrong charts.",
    foundBy: "Reading the built page against each figure and source, not the source files alone.",
    learned: "The rendered page is what gets judged, so it is what has to be checked.",
    changed: "Each figure got its own file and its own alt text. Numbers were corrected against their sources, a count still unconfirmed was taken out rather than guessed, and the Datasets section was matched to the published release cards, with one claim held back until it is confirmed.",
    status: "resolved",
    steps: [
      { date: "2026-10-17", stage: "test", text: "Three figures render as the same SignalP figure." },
      { date: "2026-10-17", stage: "build", text: "Each figure a separate file." },
      { date: "2026-10-19", stage: "test", text: "Review finds a lost magnitude, a placeholder, a stale figure number and wrong alt text." },
      { date: "2026-10-19", stage: "build", text: "Corrected against sources; Datasets numbers matched to the release cards." },
    ],
    see: [S.structures, S.controls, S.datasets],
    source: "Commit history (Oct 17–19)",
  },
  {
    id: "landscape-embed",
    track: "all",
    kind: "failure",
    criteria: ["engineering"],
    title: "The landscape broke when it was put in the page",
    expected: "The interactive landscape from the conference talk would work embedded in the page as it does on its own.",
    happened: "Its type scales with the frame but its step list, tabs and callouts are fixed in size. In a page-width frame the caption covered 90% of an enzyme label, the legend sat over a site callout and two callouts overlapped; in a small frame the step list was taller than the frame.",
    foundBy: "Measuring overlaps over all 14 story steps at four frame sizes.",
    learned: "A figure designed at one size should be rendered at that size and scaled, not reflowed.",
    changed: "The page renders the figure at its 1600×900 design size and scales it to fit, and Expand opens it in a large window at its true size. Browser full screen gave way to that in-page window, so the reader stays on the page.",
    result: "The measured overlaps are gone; the embedded figure lays out as the standalone one does.",
    status: "resolved",
    steps: [
      { date: "2026-10-19", stage: "test", text: "Overlaps measured at four frame sizes." },
      { date: "2026-10-19", stage: "build", text: "Rendered at design size and scaled to fit." },
      { date: "2026-10-20", stage: "build", text: "Expand opens an in-page window instead of full screen." },
    ],
    see: [S.landscape],
    source: "Commit history (Oct 19–20)",
  },

  // Outside feedback
  {
    id: "journal-reframe",
    track: "all",
    kind: "feedback",
    criteria: ["hp", "engineering"],
    title: "Editors: \"this is primary research, not a database\"",
    expected: "The work would go to the NAR database issue as a database paper.",
    happened: "NAR replied that it reads as primary research and declined it as a database paper.",
    foundBy: "Asking the journal before submitting.",
    learned: "We had framed the work too modestly; the analysis is the contribution, not only the data.",
    changed: "Reframed the paper as research, targeted Nature Communications, brought Wet Lab results into scope, and set new data and preprint dates.",
    status: "resolved",
    steps: [
      { date: "2026-06-28", stage: "design", text: "Letter of intent to the NAR database issue." },
      { date: "2026-07-06", stage: "learn", text: "NAR: primary research, not a database." },
      { date: "2026-07-06", stage: "design", text: "Reframed; Wet Lab experiments now in scope." },
    ],
    see: [S.limitations, S.wetLab],
    source: "Meetings #12 (Jun 30) and #13 (Jul 6)",
  },
  {
    id: "stability-target",
    track: "ml",
    kind: "feedback",
    criteria: ["hp", "model"],
    title: "Interviews moved the temperature target",
    expected: "We'd tune predictions to the conditions of a specific industrial use case.",
    happened: "Interviews kept changing the use case. A wastewater plant's digester runs at about 40 °C, which might favour the enzyme, but the framing kept shifting.",
    foundBy: "Venture's stakeholder interviews.",
    learned: "Coupling the model to a moving business case would make it a moving target too.",
    changed: "Set a stable target (room temperature to ~37 °C) and attach environment temperature and pH to every sequence, so any use case can filter for itself.",
    status: "resolved",
    steps: [
      { date: "2026-06-06", stage: "learn", text: "Interview findings on wastewater temperature." },
      { date: "2026-06-06", stage: "design", text: "Stable ~37 °C target." },
      { date: "2026-06-23", stage: "build", text: "Temperature and pH per sequence from SRAstat + BacDive." },
    ],
    see: [S.metadata, S.activity],
    source: "Meetings #9 (Jun 6) and #11 (Jun 23)",
  },
  {
    id: "structural-annotation",
    track: "annotation",
    kind: "feedback",
    criteria: ["hp", "model"],
    title: "A tool author's advice: annotate by structure",
    expected: "Sequence-based domain models (InterProScan, Pfam) would be enough to classify accessory domains.",
    happened: "Robert Edgar suggested that sequence-based models are poor enough to contaminate datasets, and proposed extracting catalytic domains, clustering the rest, folding the centroids and classifying them by structure.",
    foundBy: "Sharing the pipeline with him for review.",
    learned: "Structural classification is the stronger evidence for new domains.",
    changed: "Integrated into the novel-domain pipeline, which now classifies by structure against TED. His larger proposal, a purely structural clustering of the whole PETadex, was declined for this paper as out of scope and kept as a possible follow-up.",
    status: "resolved",
    steps: [
      { date: "2026-08-25", stage: "learn", text: "Structural approach suggested for accessory domains." },
      { date: "2026-08-25", stage: "design", text: "Added to the novel-domain pipeline." },
      { date: "2026-09-26", stage: "design", text: "Whole-database structural study deferred to a separate paper." },
    ],
    see: [S.novel, S.domains],
    source: "Meetings #17 (Aug 25) and #19 (Sep 26)",
  },
  {
    id: "researcher-interviews",
    track: "software",
    kind: "feedback",
    criteria: ["hp"],
    title: "Researcher interviews set the website's deadline",
    expected: "PETadex.net pages could be finished after the analysis.",
    happened: "Human Practices' interviews with researchers were about to start, and they needed something real to react to.",
    foundBy: "Planning the interviews with Human Practices.",
    learned: "Feedback is only useful on something people can use.",
    changed: "Pages had to be live and public before the interviews. A question asking researchers to contribute their data went into the interviews.",
    status: "resolved",
    steps: [
      { date: "2026-06-06", stage: "design", text: "Data-contribution question added to interviews." },
      { date: "2026-08-25", stage: "build", text: "PETadex.net pages live before interviews." },
    ],
    see: [S.hpInterviews, S.record],
    source: "Meetings #9 (Jun 6) and #17 (Aug 25)",
  },
  {
    id: "advisor-writeup",
    track: "ordering",
    kind: "feedback",
    criteria: ["hp", "engineering"],
    title: "An advisor's ideas reshaped the algorithm and its explanation",
    expected: "We'd solve the library problem from scratch and explain it in a long write-up.",
    happened: "Our advisor proposed starting from an ancestral reconstruction, and replied to the long write-up with a TL;DR request.",
    foundBy: "Regular review with the lab.",
    learned: "The ancestral root turns an open-ended search into a constrained one; a reader needs a picture before the detail.",
    changed: "Adopted the ancestral-root plus greedy set-cover approach, and replaced the write-up with a staged figure (algorithm stages, cut search, greedy step, worked example).",
    status: "resolved",
    steps: [
      { date: "2026-06-23", stage: "design", text: "Ancestral root + greedy set cover adopted." },
      { date: "2026-08-25", stage: "learn", text: "Write-up too long: draw it instead." },
      { date: "2026-09-26", stage: "design", text: "Figure structure agreed (1A–1D)." },
    ],
    see: [S.lobster],
    source: "Meetings #11 (Jun 23), #17 (Aug 25) and #19 (Sep 26)",
  },
  {
    id: "overview-cards",
    track: "all",
    kind: "feedback",
    criteria: ["engineering"],
    title: "The wiki team: explore the Dry Lab, don't read about it",
    expected: "The Dry Lab overview would introduce the work in prose before the pages that hold it.",
    happened: "The wiki team's review asked for buttons to explore the Dry Lab instead of text, and for the game to stay if there was room.",
    foundBy: "The wiki team's page-by-page review.",
    learned: "A reader picks a way in faster from something to try than from a paragraph describing it.",
    changed: "The overview opens with three cards, the landscape, the game and the calendar, each with a preview, and the page carries just those three interactives.",
    status: "resolved",
    steps: [
      { date: "2026-10-11", stage: "learn", text: "Review asks for buttons, not text, and keeps the game." },
      { date: "2026-10-19", stage: "build", text: "Three cards lead into the landscape, the game and the calendar." },
    ],
    see: [S.overview],
    source: "Wiki meeting (Oct 11)",
  },
]

const ALL_TRACK = { id: "all", label: "Whole Dry Lab", color: "#5c3f2e", textColor: "#fbf3ea" }

/** Workstreams in pipeline order, numbered, plus the whole Dry Lab. */
export const ITERATION_TRACKS = [
  ...DRY_LAB_TRACKS.map((t, i) => ({ ...t, number: i + 1 })),
  { ...ALL_TRACK, number: null },
]
export const ITERATION_TRACK_BY_ID = Object.fromEntries(ITERATION_TRACKS.map((t) => [t.id, t]))

export const DRY_LAB_ITERATIONS = ITERATIONS_RAW.map((it) => ({
  ...it,
  steps: [...it.steps].sort((a, b) => a.date.localeCompare(b.date)),
}))

export const DRY_LAB_ITERATION_BY_ID = Object.fromEntries(DRY_LAB_ITERATIONS.map((it) => [it.id, it]))

/** Week id → iterations with a step that week, each with just those steps. */
export const ITERATIONS_BY_WEEK = (() => {
  const map = {}
  for (const it of DRY_LAB_ITERATIONS) {
    for (const step of it.steps) {
      const wk = weekIdForDate(step.date)
      map[wk] ||= {}
      ;(map[wk][it.id] ||= { iteration: it, steps: [] }).steps.push(step)
    }
  }
  return Object.fromEntries(Object.entries(map).map(([wk, byId]) => [wk, Object.values(byId)]))
})()

/** Counts for the ledger's summary line. */
export function summarizeIterations(list) {
  const by = (key) => list.reduce((acc, it) => ({ ...acc, [it[key]]: (acc[it[key]] || 0) + 1 }), {})
  return { total: list.length, status: by("status"), kind: by("kind") }
}

/** `#iter-<id>` → id, or null. */
export function parseIterationHash(hash) {
  const raw = (hash || "").replace(/^#/, "")
  if (!raw.startsWith("iter-")) return null
  const id = raw.slice(5)
  return DRY_LAB_ITERATION_BY_ID[id] ? id : null
}
