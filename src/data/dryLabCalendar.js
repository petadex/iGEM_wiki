import {
  buildWeekSkeleton,
  CONTRIBUTION_MONTHS,
} from "./contributionCalendar/calendarUtils.js"

/*
 * Dry Lab's week by week record for the calendar on /dry-lab/overview/, one
 * track per workstream (the Model page's sections, plus DNA ordering).
 *
 * Sources: the Dry Lab meeting minutes (Inaugural, #2-#5, #9-#20, the May 19
 * metadata meeting and the May 25 leads' update). Minutes for meetings #6-#8
 * (mid to late May) and for the weeks without a meeting are missing; those
 * weeks are filled in from the team calendar's Dry Lab entries
 * (contributionCalendar/weeks.js), which come from Discord announcements, and
 * say so in their `source` line.
 *
 * Same shape as the team calendar (see contributionCalendar/README.md): week
 * ids are `week-` + the Sunday that starts the row, and a milestone's date
 * must fall inside its week.
 */

/** @typedef {'dataset' | 'annotation' | 'ml' | 'extraction' | 'ordering' | 'software'} DryLabTrackId */

const MODEL = "/dry-lab/model/"

const SW = "/dry-lab/software/"

/** Wiki sections the calendar links to, as [label, href]. */
export const S = {
  whatModel: ["What our model does", `${MODEL}#what-our-model-does`],
  plasticome: ["PETadex-PAZy curation", `${MODEL}#petadex-pazy-reference-curation`],
  cath: ["CATH assignment", `${MODEL}#cath-assignment`],
  components: ["Component assignment", `${MODEL}#component-assignment`],
  nr: ["NCBI-nr expansion", `${MODEL}#ncbi-nr-homology-expansion`],
  hmms: ["Seed MSAs and catalytic HMMs", `${MODEL}#seed-msas-and-catalytic-hmms`],
  logan: ["Logan query extraction", `${MODEL}#logan-query-extraction`],
  clustering: ["Clustering and corpus structure", `${MODEL}#clustering-and-corpus-structure`],
  metadata: ["Biosample metadata", `${MODEL}#biosample-metadata-annotations`],
  metaProfiles: ["Metadata profiles", `${MODEL}#biosample-metadata-profiles`],
  signal: ["Signal peptides", `${MODEL}#localization-and-signal-peptides`],
  domains: ["Domain annotation", `${MODEL}#domain-annotation`],
  novel: ["Novel accessory domains", `${MODEL}#novel-accessory-domains`],
  structures: ["Predicted structures", `${MODEL}#predicted-structures`],
  biochem: [
    "Biochemical properties",
    `${MODEL}#biochemical-properties-and-ancestral-reconstruction`,
  ],
  extraction: ["Activity data extraction", `${MODEL}#activity-data-extraction`],
  llm: ["LLM extraction pipeline", `${MODEL}#llm-extraction-pipeline`],
  schema: ["Extraction schema", `${MODEL}#schema-design-and-extraction-protocol`],
  agreement: ["Human vs LLM agreement", `${MODEL}#human-vs-llm-agreement`],
  kinetics: ["Kinetics labels", `${MODEL}datasets/#the-petai-activity-labels`],
  datasets: ["Datasets", `${MODEL}datasets/`],
  controls: ["Embedding controls", `${MODEL}#embedding-controls`],
  lora: ["ESM-LoRA fine-tuning", `${MODEL}#domain-adapted-esm-lora`],
  embedding: ["Machine learning", `${MODEL}#machine-learning`],
  activity: ["Activity prediction", `${MODEL}#activity-prediction`],
  limitations: ["Limitations", `${MODEL}#limitations`],
  repro: ["Reproducibility and reuse", `${MODEL}#reproducibility-and-reuse`],
  lobster: ["LOBSTER", `${SW}#lobster`],
  diamond: ["Sharded DIAMOND search", `${SW}#sharded-diamond-search`],
  diamondMethods: ["Search methods", `${SW}diamond-search/`],
  diamondPerf: ["Search performance", `${SW}diamond-search/#performance`],
  record: ["Sequence record card", `${SW}#sequence-record-card`],
  atlas: ["ESM Atlas", `${SW}#esm-atlas`],
  availability: ["Availability", `${SW}#availability-and-licensing`],
  overview: ["Dry Lab overview", "/dry-lab/overview/"],
  landscape: ["PETadex Model Landscape", "/dry-lab/overview/#petadex-model-landscape"],
  wetLab: ["Wet Lab", "/wet-lab/overview/"],
  hpInterviews: ["Database interviews", "/human-practices/#global-consolidated-database-interviews"],
  hpConference: ["Microplastics Conference", "/human-practices/#education-and-multi-directional-feedback"],
  attributions: ["Attributions", "/attributions/"],
}

/** Workstreams, in pipeline order. Colours are the desert scene's (see DRY_LAB_SCENE.vars). */
export const DRY_LAB_TRACKS = [
  {
    id: "dataset",
    label: "Dataset",
    color: "#d39a5c",
    textColor: "#3a2412",
    href: `${MODEL}#dataset-generation`,
  },
  {
    id: "annotation",
    label: "Annotation",
    color: "#9db58a",
    textColor: "#1f2c16",
    href: `${MODEL}#sequence-annotation`,
  },
  {
    id: "ml",
    label: "Machine Learning",
    color: "#8fb0cc",
    textColor: "#132634",
    href: `${MODEL}#machine-learning`,
  },
  {
    id: "extraction",
    label: "Activity Data",
    color: "#dda6a0",
    textColor: "#3a1714",
    href: `${MODEL}#activity-data-extraction`,
  },
  {
    id: "ordering",
    label: "DNA Ordering",
    color: "#b9a0cc",
    textColor: "#26173a",
    href: `${SW}#lobster`,
  },
  {
    id: "software",
    label: "Software",
    color: "#e6cd73",
    textColor: "#3a2f0c",
    href: "/dry-lab/software/",
  },
]

/** Whole Dry Lab dates (deadlines, meetings): a calendar colour only, not a filter. */
const WHOLE_DRY_LAB = {
  id: "all",
  label: "Whole Dry Lab",
  color: "#5c3f2e",
  textColor: "#fbf3ea",
  href: "/dry-lab/overview/",
}

export const DRY_LAB_TRACK_BY_ID = Object.fromEntries(
  [...DRY_LAB_TRACKS, WHOLE_DRY_LAB].map((t) => [t.id, t])
)

/** The calendar opens on the latest week on the record. */
const LATEST_WEEK_ID = "week-2026-10-18"

/** Weeks starting on or after this are still to come. */
const UPCOMING_FROM = "2026-10-25"

/** Start of the week each workstream first shows up; earlier weeks say "Not started yet". */
const TRACK_FIRST_WEEK = {
  dataset: "2026-03-01",
  ml: "2026-03-01",
  annotation: "2026-03-08",
  software: "2026-03-08",
  extraction: "2026-05-03",
  ordering: "2026-05-24",
}

const minutes = (name) => `From the minutes of ${name}.`
const COMMITS =
  "No Dry Lab meeting this week: pieced together from the wiki's commit history and the wiki team's meeting (Oct 11)."
const COMMITS_AND_LM30 =
  "No Dry Lab meeting this week: pieced together from the wiki's commit history and the leads' meeting (Oct 19)."
const RECONSTRUCTED =
  "No meeting minutes this week: pieced together from the team's announcements and the leads' updates."

/** Week copy keyed by week id. */
const WEEKS = {
  "week-2026-02-01": {
    see: [S.whatModel],
    overview:
      "The Dry Lab leads scoped the year around the PETadex, an open database of candidate plastic-degrading enzymes, with biorecycling of plastic waste as the real-world application.",
    source: RECONSTRUCTED,
  },
  "week-2026-02-08": { overview: "Recruitment. No Dry Lab meetings yet." },
  "week-2026-02-15": { overview: "Recruitment. No Dry Lab meetings yet." },
  "week-2026-02-22": {
    see: [S.repro],
    overview:
      "New members joined and were added to the PETadex and iGEM Toronto GitHub organizations, where all Dry Lab work is hosted.",
    source: RECONSTRUCTED,
  },

  "week-2026-03-01": {
    see: [S.repro],
    overview:
      "Kickoff meeting. Dry Lab set up its way of working: one GitHub organization, two-week sprints on a project board, a Jupyter notebook for every analysis (objective, inputs, expected figures), and S3 as the shared data store.",
    source: minutes("the inaugural meeting (Mar 5)"),
    milestones: [{ date: "2026-03-05", label: "Dry Lab kickoff", subteamId: "all", see: S.whatModel }],
    tracks: {
      dataset: {
        summary: "Starting point: 213 seed enzymes, 2.7M homologs.",
        see: [S.plasticome, S.nr, S.components],
        detail:
          "The PETadex at the start of the year: 213 known PET-degrading sequences, searched against NCBI's non-redundant proteins, gave 2.7M homologs. HMMs trained on the alignments group them into families (over 30% identity) and enzymes (over 90%).\n• No quality control yet for whether a sequence is really expressed as a protein.\n• A high-activity clade with an extra domain stood out as a possible plastic-binding domain.",
      },
      ml: {
        summary: "PlasticESM planned.",
        see: [S.lora, S.activity],
        detail:
          "Plan: fine-tune the ESM-2 protein language model on the PETadex with LoRA (\"PlasticESM\"), then add a regression head to predict activity, improved over rounds with active learning. Prior work had fine-tuned ESM on about 400 enzymes; this scales it to millions.",
      },
    },
  },
  "week-2026-03-08": {
    see: [S.whatModel],
    overview:
      "Sprint 0: everyone took one GitHub issue. The sprint plan ran from small-scale tests on Logan sequences (Sprint 1) to a medium-scale run over exams (Sprint 2) and the full PETadex in the summer.",
    source: minutes("Meeting #2 (Mar 14)"),
    milestones: [{ date: "2026-03-14", label: "Starter projects assigned", subteamId: "all", see: S.whatModel }],
    tracks: {
      annotation: {
        summary: "Annotation projects assigned.",
        see: [S.signal, S.hmms, S.structures, S.biochem, S.metadata],
        detail:
          "• Signal peptide prediction (SignalP).\n• Active-site annotation and HMMs.\n• Structure prediction benchmarks (ColabFold).\n• Alignments, phylogenetics and ancestral sequence reconstruction.\n• Propagating SRA metadata (environment, organism) to sequences.",
      },
      ml: {
        summary: "ESM fine-tuning and a metadata GNN assigned.",
        see: [S.lora],
        detail: "LoRA fine-tuning of ESM-2, and a graph neural network over sequence metadata.",
      },
      software: {
        summary: "Embedding atlas assigned.",
        see: [S.atlas],
        detail: "A UMAP map of ESM embeddings across the PETadex families.",
      },
    },
  },
  "week-2026-03-15": {
    see: [S.whatModel],
    overview: "First round of five-minute project pitches.",
    source: minutes("Meeting #3 (Mar 21)"),
    milestones: [{ date: "2026-03-21", label: "Project pitches, round 1", subteamId: "all", see: S.whatModel }],
    tracks: {
      annotation: {
        summary: "Tools chosen for signal peptides, active sites and structures.",
        see: [S.signal, S.hmms, S.structures],
        detail:
          "• SignalP 6 over SignalP 5, since it covers all five signal peptide types.\n• Family HMMs anchored on the catalytic residues rather than whole sequences.\n• Boltz-2, Protenix and ColabFold to be benchmarked on pLDDT and PAE; ColabFold with and without an MSA.\n• Substrate docking ruled out for comparing across enzymes and substrates.\n• Scaling structures costs about $1,000 per protein family, so it needs a case first.",
      },
      software: {
        summary: "Live UMAP on petadex.net.",
        see: [S.atlas],
        detail:
          "Family centroids drawn as bubbles sized by family size and coloured by metadata. Still reads from a static CSV rather than the database; UMAP settings to be documented.",
      },
    },
  },
  "week-2026-03-22": {
    see: [S.whatModel],
    overview: "Second round of pitches. Every project starts on a small subset before it scales.",
    source: minutes("Meeting #4 (Mar 28)"),
    milestones: [{ date: "2026-03-28", label: "Project pitches, round 2", subteamId: "all", see: S.whatModel }],
    tracks: {
      annotation: {
        summary: "PTM prediction and SRA metadata plans.",
        see: [S.domains, S.metadata],
        detail:
          "• Post-translational modifications: compare MUSiteDeep and DeepMVP on a small set before running the ~65K family representatives.\n• SRA metadata often describes the sample, not the organism a read came from. Proposal: label reads taxonomically with Kraken2 as ground truth, building on an earlier label-propagation proof of concept (353 halo-assay sequences linked to ~448K Logan sequences).",
      },
      ml: {
        summary: "ESM-2 + LoRA codebase.",
        see: [S.lora],
        detail: "Setting up the fine-tuning code and first tests, with a hyperparameter sweep to follow.",
      },
    },
  },
  "week-2026-03-29": {
    overview: "An optional online meeting over Easter, then a pause for exams.",
    source: RECONSTRUCTED,
  },
  "week-2026-04-05": { overview: "Exam period. No Dry Lab meetings on the record." },
  "week-2026-04-12": { overview: "Exam period. No Dry Lab meetings on the record." },
  "week-2026-04-19": {
    see: [S.attributions],
    overview:
      "Dry Lab got its own workspace: five workstations on the Donnelly Centre's 6th floor, next to the RNAlab.",
    source: RECONSTRUCTED,
    milestones: [{ date: "2026-04-21", label: "Workspace at the Donnelly Centre", subteamId: "all", see: S.attributions }],
  },
  "week-2026-04-26": { overview: "Exam period. No Dry Lab meetings on the record." },

  "week-2026-05-03": {
    see: [S.whatModel],
    overview:
      "First meeting back after exams. Saturday meetings for the summer, alternating a long working session with a short standup.",
    source: minutes("Meeting #5 (May 9)"),
    milestones: [{ date: "2026-05-09", label: "First summer meeting", subteamId: "all", see: S.whatModel }],
    tracks: {
      dataset: {
        summary: "~300M complete sequences pulled from Logan.",
        see: [S.logan, S.components],
        detail:
          "• About 300M complete sequences with full catalytic domains extracted from Logan.\n• Cleaning up ~1B poorly assembled sequences that flood search results with fragments, and measuring fragments per HMM across 42 components.\n• Catalytic residues annotated for 43 components.",
      },
      annotation: {
        summary: "Signal peptides, organism IDs and catalytic HMMs.",
        see: [S.signal, S.metadata, S.hmms, S.domains],
        detail:
          "• SignalP test on 600 sequences; DeepLoc found 56 more signal peptides that SignalP missed. Most proteins look cytoplasmic or extracellular.\n• SRAstat could identify organisms from reads directly (after removing human reads with Bowtie2), cutting Kraken2 runs.\n• Catalytic-domain HMMs from PAZy: 8 valid mechanisms over 19 groups, mostly the Ser-His-Asp triad.\n• InterProScan domain annotation underway; ColabFold running on a subset.",
      },
      extraction: {
        summary: "Literature mining proposed.",
        see: [S.extraction],
        detail:
          "GenBank metadata is poor (misspellings, missing columns). Proposal: pull every paper with \"plastic\" in its abstract and check for sequence hits, on the hypothesis that plastic-environment studies are enriched for plastic-degrading enzymes.",
      },
      software: {
        summary: "JavaScript UMAP with component info.",
        see: [S.atlas],
        detail:
          "Family centroids and component details in the browser. Silhouette scores show most clusters are good, alpha/beta hydrolases especially; a 3D view is being considered.",
      },
    },
  },
  "week-2026-05-10": {
    see: [S.repro],
    overview:
      "$25,000 in AWS credits from the UATech prize became Dry Lab's main compute, so the team no longer depends on the lab's servers.",
    source: RECONSTRUCTED,
  },
  "week-2026-05-17": {
    see: [S.metadata],
    overview:
      "Everyone set up with compute (Azure while the AWS credits came online). A metadata meeting with an external collaborator planned a metadata-wide association study (MWAS) over the SRA.",
    source: minutes("the May 19 metadata meeting"),
    tracks: {
      annotation: {
        summary: "MWAS over 8.27M libraries.",
        see: [S.metadata, S.metaProfiles],
        detail:
          "Associate every BioSample's text fields with how many PETase contigs each library holds, as a measure of PETase abundance. SRAstat organism tags to supplement the bacterial growth-temperature metadata, so melting temperature can be predicted from the organism.",
      },
    },
  },
  "week-2026-05-24": {
    see: [S.structures, S.extraction],
    overview:
      "500,000 predicted structures retrieved and 9,000 plastic degradation papers compiled. Dry Lab started working with Wet Lab toward an enzyme library for July.",
    source: "From the May 25 leads' update and the team's announcements (minutes for meetings #6-#8 are missing).",
    tracks: {
      annotation: {
        summary: "458K structures; SignalP at scale.",
        see: [S.structures, S.signal],
        detail:
          "• ~458K pre-folded structures pulled from the AlphaFold DB; ~830K of 4.7M sequences mapped to UniProt, the rest flagged for folding later.\n• SignalP 6 running on 4.7M sequences (~28% done), scaling to the full Logan set. DeepLoc waits on GPUs, or runs on many CPUs in parallel.",
      },
      extraction: {
        summary: "~9K papers scraped.",
        see: [S.extraction],
        detail: "PDFs and HTML for about 9,000 papers, for annotating the PETadex.",
      },
      ml: {
        summary: "Embedding controls; LoRA handed over.",
        see: [S.controls, S.lora],
        detail:
          "Six types of control sequence generated to check what signal the UMAP carries. The LoRA fine-tuning repo changed hands; the UMAP before and after fine-tuning will serve as an internal control.",
      },
      ordering: {
        summary: "First degenerate-base design tool.",
        see: [S.lobster],
        detail: "A tool to design degenerate bases for IsPETase variants, validated and under review.",
      },
      software: {
        summary: "Per-sequence domain viewer.",
        see: [S.record],
        detail: "Renders domain features from the PETadex's own tables rather than UniProt; 3D structures to follow.",
      },
    },
  },
  "week-2026-05-31": {
    see: [S.availability, S.logan],
    overview:
      "The PETadex passed 300 million candidates. The Azure credits ran out, so data moved to S3 (raw, documented) and Hugging Face (clean). The library design work was split up and an ML team formed.",
    source: minutes("Meeting #9 (Jun 6)"),
    milestones: [{ date: "2026-06-02", label: "PETadex passes 300M candidates", subteamId: "dataset", see: S.logan }],
    tracks: {
      dataset: {
        summary: "300M candidates; data rules for S3.",
        see: [S.logan, S.availability],
        detail:
          "• All catalytic open reading frames (100 GB) on S3; 300M candidates: 18M at high identity, 1.8M at medium, 22K at low.\n• Every file added to S3 gets a README entry, and large files are sharded so nobody downloads a terabyte for a slice.",
      },
      annotation: {
        summary: "Novel-domain search and fast structure retrieval.",
        see: [S.novel, S.structures, S.signal],
        detail:
          "• Novel domains: mask the known (HMM-hit) domains, then cluster what is left. A bug in the accession search was fixed (~46K matches at 21M sequences, the expected rate).\n• Structures: reverse-engineered the ESM Atlas storage (MD5 hash, B-tree lookup, MessagePack + Brotli), much faster than its API.\n• SignalP benchmarked at ~9 sequences/s on CPU.",
      },
      ml: {
        summary: "ESM-C embeddings of 20K centroids.",
        see: [S.controls, S.embedding],
        detail:
          "The 600M ESM-C model embedded the 20,000 superfamily centroids on a local GPU. Fragment controls (10-100 residues, five replicas each) measure how far a piece lands from its full sequence.",
      },
      extraction: {
        summary: "First activity extractions checked.",
        see: [S.llm],
        detail:
          "Spot-checked values are correct, but each paper often reports several pH and temperature conditions and the model picks one. ~10K JSON outputs already flag whether a paper has activity data. Moving to a much cheaper model and scaling gradually.",
      },
      ordering: {
        summary: "Library design split into parts.",
        see: [S.lobster],
        detail:
          "Goal: about $1,000 buys as many wild-type sequences as possible with little junk. Separate owners for the algorithm, codon optimization, structure checks and signal peptides.\n• Codon scoring works: a 0-1 score from the Codon Adaptation Index, adapted to degenerate bases.",
      },
      software: {
        summary: "Phylogenetic tree viewer.",
        see: [S.record],
        detail:
          "A collapsible, GPU-rendered (deck.gl) tree with ~3,000 nodes. Next: search, and a tree per 90/60/30% cluster.",
      },
    },
  },
  "week-2026-06-07": {
    see: [S.activity, S.lobster],
    overview:
      "Everything moved from Azure to AWS. Dry Lab split into one group building the ML pipeline for PETase activity and thermal stability and one designing the synthesis library for Wet Lab. Meetings moved to Tuesdays.",
    source: RECONSTRUCTED,
  },
  "week-2026-06-14": {
    see: [S.diamond, S.lobster],
    overview:
      "Search over the PETadex got 15 times faster. A hard July 1 deadline was set for the library algorithm so sequences can be ordered.",
    source: minutes("Meeting #10 (Jun 16)"),
    milestones: [{ date: "2026-06-16", label: "Search under a minute", subteamId: "software", see: S.diamondPerf }],
    tracks: {
      annotation: {
        summary: "Novel domains: 65K strands to ~1,300 fragments.",
        see: [S.novel, S.structures],
        detail:
          "• InterProScan on 65,000 strands (12 hours with all CPUs), known domains masked, fragments under 50 residues dropped: 65K → ~13K → ~1,300.\n• Novelty can't be called from sequence alone: candidates need structures (ESMFold + Foldseek) first.\n• About 632K of 1M ORFs already have a structure in the AlphaFold DB or ESM Atlas. The ORFs collapse to 123M unique sequences, as expected for metagenomes.",
      },
      ml: {
        summary: "Scoping a PETase-specific stability model.",
        see: [S.activity],
        detail:
          "General thermostability models return average conditions, so a PETase-specific model is needed, trained on a few hundred good data points. Plan: ESM-2 embeddings plus explicit features (growth temperature and others) in a two-headed model; binding affinity explored as a proxy for activity.",
      },
      extraction: {
        summary: "Cleaner text from PDFs.",
        see: [S.llm],
        detail:
          "GROBID drops paragraphs and misreads columns. A layout-aware extractor (column detection from empty space) fills the gaps back into GROBID's XML.\n• 50 papers hand-sorted into categories for testing.\n• Nova Lite sorts papers well but extracts activity values poorly.\n• ~1,200 papers map to ~1.4M accessions.",
      },
      ordering: {
        summary: "Coverage algorithm sketched; July 1 deadline.",
        see: [S.lobster],
        detail:
          "Coverage computed with bitmap shifts; greedy and dynamic-programming versions drafted. Families with different sequence lengths are the open problem. Using an ancestral reconstruction to approximate cluster coverage looks novel.",
      },
      software: {
        summary: "Search from 10 min to 48 s.",
        see: [S.diamond, S.diamondPerf],
        detail:
          "The search went from 10 minutes to 2 minutes to 48 seconds (~40 s warm). A DIAMOND patch from its author cut the shard download to ~8 s by decompressing while searching. The sequence viewer now runs across the site.",
      },
    },
  },
  "week-2026-06-21": {
    see: [S.repro, S.datasets],
    overview:
      "Paper planning. Every member owns a deliverable for the database paper, due July 20: a SQL table, a website display, methods and results paragraphs, an SVG figure, summary stats and documentation. Data lives in SQL (everything), S3 (heavy files) and Hugging Face (clean views for ML).",
    source: minutes("Meeting #11 (Jun 23)"),
    milestones: [{ date: "2026-06-23", label: "Paper deliverables assigned", subteamId: "all", see: S.repro }],
    tracks: {
      dataset: {
        summary: "Cluster hierarchy named; 90% centroids on Hugging Face.",
        see: [S.clustering, S.datasets],
        detail:
          "Cluster levels named by enzyme family (not species, to avoid clashing with taxonomy), searchable, with a tree per family. The 90% catalytic centroid set (17.8M training rows with splits) goes on Hugging Face.",
      },
      annotation: {
        summary: "~10K candidate novel strands; organism table planned.",
        see: [S.novel, S.metadata],
        detail:
          "• Novel domains: length and low-complexity filters plus MetaPredict took ~63K strands to ~10K candidates, to be checked against TED (The Encyclopedia of Domains).\n• SRAstat across ~8M Logan libraries plus BacDive (culture temperature, pH, media) gives every PETase an environment: \"PlasticDB, but on everything\".",
      },
      ml: {
        summary: "Fine-tuning ESM-C on the 90% centroids.",
        see: [S.lora],
        detail:
          "About 5 days on one GPU (~$250). Next: predict the missing SRA metadata (organism, location, conditions), labelled as predicted, then thermostability.",
      },
      extraction: {
        summary: "Scraping designed as an experiment.",
        see: [S.extraction, S.agreement],
        detail:
          "Three routes: ask authors for their data, human volunteers (~5 replicates per paper as ground truth), and LLMs reading PDFs into a schema. Where the LLM matches the humans closely enough, it scales to every paper.",
      },
      ordering: {
        summary: "Problem formalized.",
        see: [S.lobster],
        detail:
          "Find a degenerate sequence that covers the most of N sequences: NP-hard. Approach: start from an ancestral reconstruction and use the greedy set-cover approximation (a guaranteed ~63%).",
      },
      software: {
        summary: "Catalytic-domain pages and Petra planned.",
        see: [S.cath, S.record],
        detail:
          "One page per catalytic (CATH) domain: mechanism, literature, HMMs and logos. Also planned: Petra, a plain-language query interface, and a tree-based way into the database.",
      },
    },
  },
  "week-2026-06-28": {
    see: [S.lora, S.lobster],
    overview:
      "The first fine-tuned model, two working library algorithms, and a letter of intent to the NAR database issue.",
    source: minutes("Meeting #12 (Jun 30)"),
    milestones: [
      { date: "2026-06-29", label: "First model fine-tuned (ESM-C)", subteamId: "ml", see: S.lora },
      { date: "2026-06-30", label: "Library algorithm prototypes", subteamId: "ordering", see: S.lobster },
    ],
    tracks: {
      annotation: {
        summary: "TED check needs folded strands; organisms annotated.",
        see: [S.novel, S.metadata],
        detail:
          "• TED stores structures, not sequences, so candidate strands have to be folded first.\n• SRAstat queries for ~1.6M samples set up on AWS Athena.\n• First BacDive pass: ~900 organisms, at least 474 with values.",
      },
      ml: {
        summary: "ESM-C fine-tuned on the PETadex.",
        see: [S.lora],
        detail: "A six-day run with the loss coming down nicely.",
      },
      extraction: {
        summary: "Pilot extractions \"semi-decent\".",
        see: [S.llm, S.hpInterviews],
        detail:
          "Activity data and methods come through on the pilot papers. Next: finish collecting DOIs (forward and backward citation search) and build the author list for Human Practices to contact.",
      },
      ordering: {
        summary: "Two working prototypes.",
        see: [S.lobster],
        detail:
          "• Greedy set-cover over degenerate oligos, for equal-length sequences.\n• A graph of cut positions, solved by dynamic programming, for mixed lengths.\nOne cluster: 80% of its natural sequences from 22 oligos and under 100 library members. Results reported as percent wild-type vs percent junk, with junk capped by a tunable limit (~0.5%) and at most 3 fragments.",
      },
      software: {
        summary: "Catalytic-domain page cleanup.",
        see: [S.cath],
        detail:
          "Better navigation, and links between tools: what makes a database, not a pile of tools, is that one analysis flows into the next.",
      },
    },
  },
  "week-2026-07-05": {
    see: [S.limitations, S.wetLab],
    overview:
      "NAR replied that the work reads as primary research, not a database paper, so the target moved to Nature Communications. New dates: all data by August 1, preprint online September 1. Wet lab results can now go in the paper.",
    source: minutes("Meeting #13 (Jul 6)"),
    milestones: [{ date: "2026-07-06", label: "Paper target: Nature Communications", subteamId: "all", see: S.repro }],
    tracks: {
      dataset: {
        summary: "PETadex rebuild started.",
        see: [S.logan, S.clustering],
        detail:
          "A versioned, reproducible pipeline: a curated seed set, then a search through Logan's ~39M datasets, then hierarchical clustering. Every analysis re-runs on the new dataset once it lands.",
      },
      annotation: {
        summary: "SignalP and biochemistry done for 300M.",
        see: [S.signal, S.biochem, S.structures, S.metadata],
        detail:
          "• SignalP for all 300M sequences, in PostgreSQL.\n• GRAVY, molecular weight, pI, instability and aromaticity for all 300M.\n• DeepLoc at ~14 sequences/s is too slow for the full database.\n• ~93M sequences look eukaryotic by metadata, to be checked across whole 90% clusters.\n• BacDive data is clean for 1,000+ bacteria. Experimental and AlphaFold structures are in the PETadex.\n• PTM predictions reach ~98% confidence.",
      },
      ml: {
        summary: "First model trained; embeddings hold up.",
        see: [S.lora, S.controls],
        detail:
          "Full training targeted for the end of July, with ablations on which metadata matters. A 30% window of a sequence embeds very close to the whole sequence, much closer than baselines do.",
      },
      extraction: {
        summary: "Hallucination checks and a pilot group.",
        see: [S.llm, S.schema],
        detail:
          "• Papers are split by experiment to fit the output limit.\n• Haiku swapped which data belonged to which protein, so a stronger model plus checks.\n• Every value now comes with an evidence sentence that a script checks against the paper.\n• A small pilot group tests the human schema on PAZy papers for 3-4 rounds.",
      },
      ordering: {
        summary: "Novel-domain experiment proposed for Wet Lab.",
        see: [S.novel, S.wetLab],
        detail:
          "Test enzymes with and without each new accessory domain (cut at the linker) to show which domains raise activity. Waits on BioZone lab access, likely August.",
      },
      software: {
        summary: "Domain architecture viewer.",
        see: [S.domains, S.record],
        detail:
          "Zoomable domain architecture for each catalytic domain, loaded on demand. First organism page format up for review.",
      },
    },
  },
  "week-2026-07-12": {
    see: [S.logan],
    overview:
      "AWS on-demand CPU quota raised from 32 to 128 vCPUs, so more jobs can run at once for the PETadex rebuild.",
    source: RECONSTRUCTED,
  },
  "week-2026-07-19": {
    see: [S.repro],
    overview:
      "August 1 became a methods deadline: clean notebooks and a methods write-up, since final results wait on the new dataset. New reproducibility rules: scripts read from and write to S3, and record tool versions and database dates.",
    source: minutes("Meeting #14 (Jul 21)"),
    milestones: [{ date: "2026-07-21", label: "Plasticome re-curated (~470)", subteamId: "dataset", see: S.plasticome }],
    tracks: {
      dataset: {
        summary: "PETadex-PAZy re-curated; Logan set QC'd.",
        see: [S.plasticome, S.logan],
        detail:
          "PETadex-PAZy, the hand-curated ground truth, is now ~470 validated enzymes; about 40 sequences changed, which would have skewed much of the database. Pipeline: Plasticome → NCBI-nr → catalytic check with the PETadex HMMs → Logan (~10B sequences) → QC with the same HMMs.",
      },
      annotation: {
        summary: "Folding benchmark and the strand bottleneck.",
        see: [S.structures, S.novel, S.metadata],
        detail:
          "• A leakage-free benchmark set (proteins released after ESMFold2's training cutoff that have PDB structures) for tuning folding settings.\n• Everything after folding is built for novel domains; folding 10,000 strands is the bottleneck.\n• Missing BacDive and SRA records reviewed.",
      },
      ml: {
        summary: "Centroid embeddings with the 6B model planned.",
        see: [S.embedding],
        detail: "Embed all 30% and 60% centroids. Fine-tuning the 6B model isn't feasible near term.",
      },
      extraction: {
        summary: "Schema due August 1.",
        see: [S.schema],
        detail: "The human scraping schema needs at least three rounds of pilot feedback before August 1, since the LLM uses it too.",
      },
      software: {
        summary: "Instant drill-down through clusters.",
        see: [S.atlas, S.cath],
        detail:
          "A single SQL query on the cluster table took ~10 minutes. Restructured into a tree of small tables, the children of any cluster load in effectively constant time, so clicking a 30% family shows its 60% clusters at once.\n• Catalytic-domain pages will carry our own mechanism write-ups, not just links.",
      },
    },
  },
  "week-2026-07-26": {
    see: [S.repro, S.llm],
    overview:
      "Last week before the methods deadline. Literature scraping finished, the folding settings were locked, and Dry Lab presented a poster at the iGEM symposium.",
    source: minutes("Meeting #15 (Jul 28)"),
    milestones: [
      { date: "2026-07-28", label: "Scraping done: ~4.6K papers", subteamId: "extraction", see: S.llm },
      { date: "2026-07-29", label: "Symposium poster", subteamId: "all", see: S.overview },
      { date: "2026-08-01", label: "Methods deadline", subteamId: "all", see: S.repro },
    ],
    tracks: {
      annotation: {
        summary: "ESMFold2 tuned; TED search works.",
        see: [S.structures, S.novel, S.metaProfiles, S.signal],
        detail:
          "• Folding: structures barely change with diffusion steps, only runtime does, so the original paper's 68 steps. Fine-tuned vs base dropped for MSA vs no MSA.\n• Novel domains: the Foldseek + TED search works. Full proteins are folded, not just the masked region.\n• Mean temperature and pH per biosample from SRAstat filtered to BacDive organisms.\n• DeepLoc and SignalP ready to run when the new database lands.",
      },
      ml: {
        summary: "Repo cleaned; 60% centroids embedding.",
        see: [S.embedding],
        detail: "Embedding the 60% centroids on the old dataset now, to swap for the new one later.",
      },
      extraction: {
        summary: "~4.6K relevant papers; validation passes.",
        see: [S.llm],
        detail:
          "Evidence sentences are matched back to the paper, then checked to contain the value.\n• Haiku, 1,276 papers: 33 flags, 11 real hallucinations.\n• Sonnet: none. Evidence checks run on every paper (~7.5¢ a paper in batch).\nPublisher blocks paused live scraping; citation mapping continues.",
      },
      ordering: {
        summary: "Algorithm needed in 2-3 weeks.",
        see: [S.lobster, S.wetLab],
        detail: "Wet Lab may switch to a yeast halo assay and will need sequences. Sequence shuffling comes before domains.",
      },
      software: {
        summary: "Catalytic-domain overview; organism pages.",
        see: [S.cath, S.record],
        detail:
          "• Domain overview: bubbles sized by families per domain, open into each domain's page. PFAM pages cut.\n• Organism pages: over 100,000 species, to be indexed by taxonomy with a tree of organisms.\n• The poster's map, citation network and sequence cards to become interactive site features.",
      },
    },
  },
  "week-2026-08-02": {
    see: [S.structures, S.extraction],
    overview:
      "Protein structure prediction running across the PETadex candidates, scaling toward millions of structures, while the activity-scraping pipeline moved forward. Notebook text must now be written by hand.",
    source: RECONSTRUCTED,
  },
  "week-2026-08-09": {
    see: [S.plasticome, S.hmms, S.logan],
    overview:
      "PETadex-PAZy was finalized and HMM curation added 8 million sequences and new domains before the full Logan DIAMOND search ran. The database was held back until it was QC'd, so a search that size wasn't spent on an unfinished corpus.",
    source: RECONSTRUCTED,
  },
  "week-2026-08-16": {
    see: [S.lobster, S.wetLab],
    overview:
      "Dry Lab and Wet Lab settled how to order sequences: a wide screen straight from the PETadex first, then a rational design round on the data it produces. Wet Lab's copper-release GFP assay now works end to end.",
    source: minutes("Meeting #16 (Aug 18)"),
    milestones: [{ date: "2026-08-18", label: "Wide screen chosen", subteamId: "ordering", see: S.lobster }],
    tracks: {
      dataset: {
        summary: "Every sequence folded and given a catalytic domain.",
        see: [S.cath, S.components],
        detail:
          "The database now has ~13 catalytic domains (superfamilies rather than subfamilies), down from ~22. One page each, including one novel domain.",
      },
      annotation: {
        summary: "Catalytic sites annotated; a possible plastic dump.",
        see: [S.hmms, S.domains, S.metaProfiles],
        detail:
          "• Each domain's catalytic and key secondary residues (oxyanion hole, aromatic-stacking tryptophans) annotated on reference structures, from the PDB where possible. HMMs carry these across the database, and they can gate what gets ordered.\n• Sequence density normalized by Logan biosample density shows one clear hotspot: possibly a plastic dump.",
      },
      extraction: {
        summary: "Human scheme, round two; activity normalized.",
        see: [S.schema, S.kinetics],
        detail:
          "Disagreements between paired scrapers are logged as likely errors. 25-30 papers are enough to validate the LLM. Activity is normalized within each paper against an internal benchmark (usually IsPETase).",
      },
      ordering: {
        summary: "Algorithm demoed; clusters to be ranked.",
        see: [S.lobster],
        detail:
          "• Input: aligned cores, a junk cap and Golden Gate assembly. Output: orders, fragments and codons.\n• Domains will be cut by structure, not HMM hits, which are narrower than the real domain.\n• ~18M 90% clusters to be ranked by the share of members from plastic-related samples.\n• Target ~100,000 sequences, since the readout is simply active or not per colony.",
      },
      software: {
        summary: "PETadex site rebuilt; notebooks render.",
        see: [S.record, S.repro],
        detail:
          "The PETadex site was rebuilt as its own project. Notebooks render with images on the website (to become a GitHub Action). Domain pages are now database-driven, with a card per domain.",
      },
    },
  },
  "week-2026-08-23": {
    see: [S.lobster, S.wetLab],
    overview:
      "Every current project closes on September 1 so the team can turn to the wiki (due October 21). About 100,000 sequences to be ordered, split between superfamilies with a known (PAZy) enzyme and those without: the real test of whether the bigger database finds new enzymes.",
    source: minutes("Meeting #17 (Aug 25)"),
    tracks: {
      dataset: {
        summary: "Logan pipeline complete; shallow MSAs found.",
        see: [S.hmms, S.logan, S.nr],
        detail:
          "• Done: MSAs, annotated reference structures, and a sourced mechanism write-up for each catalytic domain.\n• HMM benchmarks (overfitting, envelope creep, hit quality, complete vs partial hits) showed that seed MSAs built from ~600 enzymes were too shallow, some with 1-2 sequences. Rebuilding them from ~2,000 close NR homologs.\n• Preprint narrowed to the dataset.",
      },
      annotation: {
        summary: "InterProScan finished; benchmarks set.",
        see: [S.novel, S.metadata, S.signal],
        detail:
          "• Novel domains to be benchmarked against UniProt and the AlphaFold DB, where any hit is a false positive.\n• Temperature and pH for every Logan library, to be checked against author-entered values.\n• Localization pipeline done; phylogenetic tree handed over to run.",
      },
      ml: {
        summary: "Folding budget; selection model by mid-September.",
        see: [S.structures, S.activity],
        detail:
          "Folding ~18M structures is ~60,000 GPU hours (~30,000 without singletons). A sequence-selection model will drive the second order.",
      },
      extraction: {
        summary: "Schema finalized.",
        see: [S.schema],
        detail:
          "Two scrapers per paper, a third where they disagree, then a cleaning pass. Part one becomes an HTML form so guidelines sit beside the fields.",
      },
      ordering: {
        summary: "Diversity comes from what goes in.",
        see: [S.lobster],
        detail:
          "The effective-sequences objective was dropped: cheap ordering and diversity pull against each other. Inputs must be 90% clusters or tighter; caps move to kilobases and colony count.",
      },
      software: {
        summary: "Organism pages up; pages live by September 1.",
        see: [S.record, S.cath],
        detail: "Organism page PRs up and working locally. A catalytic-domain page takes 1-2 minutes to load, so a materialized view is planned.",
      },
    },
  },
  "week-2026-08-30": {
    see: [S.lobster, S.schema],
    overview:
      "Project cutoff. The ordering algorithm is finished, the first batch of sequences can go out, and literature scraping opened to the whole team.",
    source: minutes("Meeting #18 (Sep 1)"),
    milestones: [
      { date: "2026-09-01", label: "Project cutoff", subteamId: "all", see: S.repro },
      { date: "2026-09-01", label: "Literature scraping launched", subteamId: "extraction", see: S.schema },
    ],
    tracks: {
      annotation: {
        summary: "Metadata benchmarks nearly done.",
        see: [S.metaProfiles],
        detail: "Logan metadata benchmarking almost finished, with figures in the notebooks; SRA pipeline cleaned up in the repo.",
      },
      extraction: {
        summary: "Interactive form; LLM pipeline complete.",
        see: [S.schema, S.llm],
        detail:
          "• Human side: 26 sign-ups, papers ranked by how many PET enzymes they study, weekly batches, with large activity screens as positive controls.\n• LLM side: optimized for Sonnet; controls show no false positives. The ~$1.2K full run waits on a human-vs-model benchmark and a five-model comparison.",
      },
      ordering: {
        summary: "Algorithm finished; sampling decided.",
        see: [S.lobster],
        detail:
          "Shortest path through a graph of cuts plus random cut searches, then a greedy fill until a cap. The IsPETase case takes ~15 minutes on a laptop for a ~2,000-member library.\nSampling: three 90% centroids per superfamily, each from a different 60% family. A random baseline batch goes out now; bioprospecting follows.",
      },
      software: {
        summary: "~10 site PRs in review.",
        see: [S.record],
        detail: "Wiki direction set: visual landing pages, with notebooks one click deeper.",
      },
    },
  },
  "week-2026-09-06": {
    see: [S.hpConference],
    overview: "Write-ups and figures for the conference poster, and a new meeting schedule for the term.",
    source: minutes("the Sep 8 meeting (partial recording)"),
    milestones: [{ date: "2026-09-08", label: "Poster write-ups due", subteamId: "all", see: S.hpConference }],
    tracks: {
      annotation: {
        summary: "Metadata methods flow chart.",
        see: [S.metadata],
        detail: "Methods flow chart and overview plots as SVG for the poster.",
      },
      extraction: {
        summary: "Model benchmark done: Sonnet wins.",
        see: [S.agreement, S.llm],
        detail:
          "Haiku, Opus, Sonnet and mixes tested. Opus over-applies the \"skip if not relevant\" instruction and cuts valid proteins, so Sonnet stays.",
      },
    },
  },
  "week-2026-09-13": {
    see: [S.hpConference],
    overview:
      "Final figures due Monday, and meetings moved to Sunday evenings. Dry Lab presented its poster at the Microplastics Conference on September 19.",
    source: RECONSTRUCTED,
    milestones: [
      { date: "2026-09-14", label: "Final figures due", subteamId: "all", see: S.repro },
      { date: "2026-09-19", label: "Microplastics Conference", subteamId: "all", see: S.hpConference },
    ],
  },
  "week-2026-09-20": {
    see: [S.whatModel, S.repro],
    overview:
      "Wiki and awards planning: Dry Lab goes for best model. Its wiki follows the manuscript, every notebook goes on it, and each page gets a central interactive figure. Everyone writes up their project for the preprint.",
    source: minutes("Meeting #19 (Sep 26)"),
    milestones: [{ date: "2026-09-26", label: "Wiki plan set", subteamId: "all", see: S.whatModel }],
    tracks: {
      dataset: {
        summary: "Search results: fragments vs complete hits.",
        see: [S.logan, S.hmms, S.cath],
        detail:
          "Logan hits are mostly partial (contigs peak around 100 residues); NR hits are mostly complete with canonical catalytic residues. A protein language model search finds fewer hits but more novel sequence space. HMMs were built from NR, so they are validated on Logan instead. Reference structures built for every catalytic domain.",
      },
      annotation: {
        summary: "TED pipeline at 900K proteins; soil stands out.",
        see: [S.novel, S.domains, S.metaProfiles],
        detail:
          "• 900,000 proteins in both TED and the PETadex; a 1,000-protein test passes every step but one step takes ~6 hours per 1,000.\n• InterProScan analysis started for the paper.\n• Soil is ~4% of biosamples but ~31% of clusters: sequence diversity is concentrated in environmental metagenomes.",
      },
      ml: {
        summary: "Proof-of-concept model on current data.",
        see: [S.lora, S.activity],
        detail:
          "ESM fine-tuned with LoRA on the previous dataset. Next: train again with the scraped activity data and metadata as extra tokens, on today's data rather than waiting.",
      },
      extraction: {
        summary: "Paper set revised.",
        see: [S.schema, S.agreement],
        detail:
          "Only ~8% overlap with the candidate list, so related review papers were swapped for PAZy papers, letting results be compared with PAZy directly. Common submission errors to be checked automatically.",
      },
      ordering: {
        summary: "~$2,300 saved on two clusters.",
        see: [S.lobster],
        detail:
          "Library cap turns out to be the only parameter that matters. The grid search re-runs across ~2.3M clusters, in parallel on the cluster. The figure is written for the paper first.",
      },
      software: {
        summary: "Website code halved; notebooks to the wiki.",
        see: [S.diamond, S.repro],
        detail:
          "About half the PETadex site's code was dead and deleted. Notebooks pushed to the repo render to the wiki automatically through GitHub Actions.",
      },
    },
  },
  "week-2026-09-27": {
    see: [S.landscape],
    overview:
      "Write-ups due October 3 for the PETadex preprint. The search of Logan's latest release finished, and the Dry Lab wiki story was set: islands of known activity in a desert, narrowed by layers of annotation.",
    source: minutes("the wrap-up meeting (Oct 3)"),
    milestones: [
      { date: "2026-09-30", label: "Logan search run", subteamId: "dataset", see: S.logan },
      { date: "2026-10-03", label: "Preprint write-ups due", subteamId: "all", see: S.repro },
    ],
    tracks: {
      dataset: {
        summary: "Latest Logan search: ~6 TB.",
        see: [S.logan, S.clustering],
        detail: "Next: HMMsearch over the hits (an estimated several billion enzymes), then clustering at 90/60/30%.",
      },
      annotation: {
        summary: "SignalP scan complete; TED pipeline validated.",
        see: [S.signal, S.novel],
        detail: "Signal peptides scanned across the full PETadex; the TED pipeline's validation against existing data is complete.",
      },
      ml: {
        summary: "Embedding landscape done; PETai next.",
        see: [S.embedding, S.activity],
        detail:
          "Choosing between retraining PlasticESM on the expanded dataset and training models specialized to each domain's fold, with metadata and domain annotations as inputs.",
      },
      extraction: {
        summary: "Scraping complete, being checked.",
        see: [S.llm, S.agreement],
        detail: "The literature scraping is complete and being checked.",
      },
    },
  },
  "week-2026-10-04": {
    see: [S.overview],
    overview:
      "Wiki sprint. The Overview, Model and Software pages went live on the official wiki on October 10, organized into five components of the PETadex pipeline. Every member set up a notebook for the wiki.",
    source: minutes("Meeting #20 (Oct 10)"),
    milestones: [{ date: "2026-10-10", label: "Dry Lab wiki pages live", subteamId: "all", see: S.overview }],
    tracks: {
      ml: {
        summary: "Five ML sections to write.",
        see: [S.lora, S.embedding, S.controls, S.activity],
        detail: "PlasticESM (ESM with LoRA), corpus-scale embedding, embedding controls, activity prediction (PETai) and a comparison of manifold methods.",
      },
      software: {
        summary: "Every product benchmarked and demoed.",
        see: [S.availability, S.diamond],
        detail:
          "The Software page shows deliverable products only. Each one gets a benchmark, documentation, a Docker package and a demo on the wiki.",
      },
    },
  },
  "week-2026-10-11": {
    see: [S.whatModel, S.diamond],
    overview:
      "Getting the wiki to a complete first version (checked October 13): a short summary and figure for every item on Model, and demos on Software, before any polish. The wiki team's review asked for the overview to let readers explore rather than read, and the first full builds for iGEM's servers ran into its upload limit.",
    source: COMMITS,
    milestones: [{ date: "2026-10-13", label: "Wiki MVP check", subteamId: "all", see: S.whatModel }],
    tracks: {
      dataset: {
        summary: "Dataset generation charted on the Model page.",
        see: [S.cath],
        detail:
          "A two-tier pipeline chart pins under the header and lights the subsection being read; CATH assignment got its own subsection.",
      },
      annotation: {
        summary: "Model page figures fixed.",
        see: [S.signal, S.structures],
        detail: "Three embedded figures had all been showing the SignalP figure; each is now its own file.",
      },
      software: {
        summary: "Sharded DIAMOND search on the wiki.",
        see: [S.diamond, S.diamondMethods],
        detail:
          "The search's overview went up on the Software page with an architecture diagram you can click into, and its full methods on their own page.",
      },
    },
  },
  "week-2026-10-18": {
    see: [S.overview, S.datasets],
    overview:
      "The Dry Lab pages came together for the wiki freeze on October 21. The overview now leads with three interactives, the Model page gained its Datasets section, and the preprint is set to go on bioRxiv before the freeze so the wiki can cite it.",
    source: COMMITS_AND_LM30,
    milestones: [
      { date: "2026-10-19", label: "Overview interactives live", subteamId: "all", see: S.overview },
      { date: "2026-10-21", label: "Wiki freeze", subteamId: "all", see: S.overview },
    ],
    tracks: {
      ml: {
        summary: "Datasets section written; landscape on the overview.",
        see: [S.datasets, S.landscape],
        detail:
          "The Datasets section is written against the published releases, with its numbers matched to the release cards. The embedding landscape from the conference talk is on the overview, rendered at its design size.",
      },
      annotation: {
        summary: "Structure and controls sections corrected.",
        see: [S.structures, S.controls],
        detail: "A count that had lost its magnitude, a leftover placeholder, a stale figure number and mismatched alt text were fixed.",
      },
      software: {
        summary: "Search demo: ten real searches, replayed.",
        see: [S.diamond],
        detail:
          "The Software page replays ten searches really run on the live tool, shipped with the page so the demo works without the live site.",
      },
    },
  },
  "week-2026-10-25": { overview: "Coming up: preparing for the Grand Jamboree." },
}

/** Quiet entries show as one muted line, without a "Read more" link. */
function placeholderFor(trackId, weekStart) {
  if (weekStart >= UPCOMING_FROM) return { summary: "Coming up.", quiet: true }
  if (weekStart < TRACK_FIRST_WEEK[trackId]) return { summary: "Not started yet.", quiet: true }
  return { summary: "No update on the record this week.", quiet: true }
}

/** Dry Lab's season runs February to October. */
const FIRST_MONTH = "2026-02"

const DRY_LAB_MONTHS = CONTRIBUTION_MONTHS.filter((m) => m.key >= FIRST_MONTH)

export const DRY_LAB_WEEKS = buildWeekSkeleton()
  .filter((w) => w.end >= `${FIRST_MONTH}-01`)
  .map((sk) => {
    const content = WEEKS[sk.id] || {}
    const subteams = {}
    for (const { id } of DRY_LAB_TRACKS) {
      subteams[id] = content.tracks?.[id] || placeholderFor(id, sk.start)
    }
    return {
      ...sk,
      monthKeys: sk.monthKeys.filter((k) => k >= FIRST_MONTH),
      overview: content.overview || "No Dry Lab update on the record this week.",
      source: content.source,
      see: content.see,
      milestones: content.milestones || [],
      subteams,
    }
  })

export const DRY_LAB_WEEK_BY_ID = Object.fromEntries(DRY_LAB_WEEKS.map((w) => [w.id, w]))

/** Everything ContributionTimeline needs (see TEAM_CALENDAR there). */
export const DRY_LAB_CALENDAR = {
  weeks: DRY_LAB_WEEKS,
  weekById: DRY_LAB_WEEK_BY_ID,
  months: DRY_LAB_MONTHS,
  tracks: DRY_LAB_TRACKS,
  trackById: DRY_LAB_TRACK_BY_ID,
  defaultWeekId: DRY_LAB_WEEK_BY_ID[LATEST_WEEK_ID]
    ? LATEST_WEEK_ID
    : DRY_LAB_WEEKS[DRY_LAB_WEEKS.length - 1]?.id,
  parseHash: (hash) => {
    const raw = (hash || "").replace(/^#/, "")
    return DRY_LAB_WEEK_BY_ID[raw] ? raw : null
  },
  /** One screen tall, so the whole calendar is in view at once. */
  fit: true,
  /** Every workstream on at first, so a week reads as the whole Dry Lab's progress. */
  initialActiveIds: DRY_LAB_TRACKS.map((t) => t.id),
  labels: {
    tracks: "Workstreams",
    overview: "Dry Lab this week",
    hint: "Turn on a workstream above to see its progress this week.",
  },
}
