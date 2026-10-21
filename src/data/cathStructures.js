/**
 * One representative structure per catalytic fold of the plasticome, served
 * from static.igem.wiki (drylab-page/cath-structures/), each with its
 * substrate docked as chain L and any cofactors (hemes, metal ions) as other
 * HETATM-only chains.
 *
 * Generated from the team's per-fold sheet, ~/Downloads/petadex_domain_summary.csv
 * (2026-10-21): domain, reference structure, residues in the model's own
 * numbering, mechanism, structural features, the docked ligand and its
 * scores, and QC flags. The sheet's catalytic residues agree with those of
 * plasticome.v2.sequence_annotations.csv (s3://petadex/petadex.v260701/
 * 3_msa_cleaning/) carried onto each model by alignment.
 *
 * Not from the sheet: `url` (the raw files are ~/Downloads/good_folds/, each
 * checked byte-for-byte against the CDN), `fold` and `cath` as displayed, and
 * `id` / `enzyme`, the plasticome record whose sequence the model's chain A
 * matches (≥ 92% of 5-mers against the final run's 01-union.tsv). Four
 * models match none; their references are PDB structures outside the
 * plasticome.
 *
 * Edits to the sheet's text: spelling (Stabillizing, tryphtophans, tryptohan,
 * stabilzes, Nucelophile, gylcine, amid, oxidates, prodominant, proximinal,
 * cites, glutamatic, oxidization, "which is creates"); the phosphatase entry
 * drops a sentence about bold and underlined residues and leaves the first
 * person; the glycoside hydrolase entry says where its mechanism comes from
 * without the first person. Wording is otherwise the sheet's own and is the
 * team's to rewrite.
 *
 * Residues flagged in the sheet keep the flag (`flag`) and are listed but not
 * drawn. Open questions from the sheet's QC column are in `qc`. Also open:
 * the cupredoxin's secondary "C-term T2/T3" site repeats the four catalytic
 * histidines' numbers, so it is probably a copy of the N-terminal site.
 *
 * The ligand scores (ligand-ipTM, interface pLDDT, affinity, p(bind)) look
 * like Boltz-2's; the sheet does not name the predictor.
 */
export const CATH_STRUCTURES = [
  {
    raw: "01_alpha_beta_hydrolase_model_4.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/01-alpha-beta-hydrolase-model-4.pdb",
    fold: "α/β-hydrolase",
    cath: "3.40.50.1820",
    id: 1,
    enzyme: "IsPETase",
    domain: "alpha/beta hydrolase",
    reference: "5XJH",
    accession: "GAP38373.1",
    catalytic: [
      {
        label: "Catalytic Triad",
        residues: [
          {
            chain: "A",
            num: 128,
            aa: "S",
          },
          {
            chain: "A",
            num: 174,
            aa: "D",
          },
          {
            chain: "A",
            num: 205,
            aa: "H",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Oxyanion Hole",
        residues: [
          {
            chain: "A",
            num: 55,
            aa: "Y",
          },
          {
            chain: "A",
            num: 129,
            aa: "M",
          },
        ],
      },
      {
        label: "Stabilizing Tryptophans",
        residues: [
          {
            chain: "A",
            num: 127,
            aa: "W",
          },
          {
            chain: "A",
            num: 153,
            aa: "W",
          },
        ],
      },
    ],
    mechanism:
      "The catalytic triad performs a nucleophilic attack on the carboxyl group of the PET, forming an acyl-intermediate. The oxyanion hole stabilizes this tetrahedral intermediate using their amide backbones, while the tryptophans pi-pi stack with the TPA benzene rings. Water then replaces the nucleophile, and the PET is removed from the protein.",
    features: "Monomer; No cofactor",
    processing:
      "N-terminal expression tag MGSSHHHHHHSSGLVPRGSH (deposit res 13-32) removed; 280 aa folded",
    ligand: {
      name: "PET dimer",
      formula: "C22H22O10",
      iptm: 0.93,
      iplddt: 0.85,
      affinity: 0.39,
      pbind: 0.374,
    },
    cofactors: false,
  },
  {
    raw: "02_SGNH_hydrolase_model_3.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/02-sgnh-hydrolase-model-3.pdb",
    fold: "SGNH hydrolase",
    cath: "3.40.50.1110",
    id: 463,
    enzyme: "E4",
    domain: "SGNH hydrolase",
    reference: "7C82",
    accession: "A0A4P1LYH5 (UniProt; no GenBank protein ID available)",
    catalytic: [
      {
        label: "Catalytic Triad",
        residues: [
          {
            chain: "A",
            num: 14,
            aa: "S",
          },
          {
            chain: "A",
            num: 163,
            aa: "D",
          },
          {
            chain: "A",
            num: 166,
            aa: "H",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Oxyanion Hole",
        residues: [
          {
            chain: "A",
            num: 55,
            aa: "G",
            flag: "unverified",
          },
          {
            chain: "A",
            num: 82,
            aa: "N",
          },
        ],
      },
    ],
    mechanism:
      "This domain is similar to an alpha-beta hydrolase domain in that it contains the catalytic triad, but it must be a dimer to function. One subunit supplies the S and D, while the other supplies the H. The paper notes that Cd2+ inhibits the mechanism. The oxyanion hole stabilizes the tetrahedral intermediate.",
    features:
      "Obligate homodimer - active site is shared, one subunit contributes Ser/Asp and the other the His; No cofactor",
    processing: "None; full deposited entity folded as a homodimer (2 x 191 aa)",
    ligand: {
      name: "PBAT dimer",
      formula: "C26H38O10",
      iptm: 0.78,
      iplddt: 0.664,
      affinity: -0.52,
      pbind: 0.418,
    },
    cofactors: false,
    qc: "ref G55 maps to fold A56. Catalytic triad and N81 map exactly, so the offset is right and this token looks off by one. Nearest glycines are fold G57 (ref G56) and fold G51 (ref G50) - needs a human call",
  },
  {
    raw: "03_amidase_signature_model_0.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/03-amidase-signature-model-0.pdb",
    fold: "Amidase signature",
    cath: "3.90.1300.10",
    id: 51,
    enzyme: "NylA",
    domain: "Amidase signature domain",
    reference: "3A2P",
    accession: "BAA05090.1",
    catalytic: [
      {
        label: "Catalytic Triad",
        residues: [
          {
            chain: "A",
            num: 174,
            aa: "S",
          },
          {
            chain: "A",
            num: 150,
            aa: "S",
          },
          {
            chain: "A",
            num: 72,
            aa: "K",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Oxyanion Hole",
        residues: [
          {
            chain: "A",
            num: 171,
            aa: "A",
          },
          {
            chain: "A",
            num: 172,
            aa: "A",
          },
        ],
      },
    ],
    mechanism:
      "Serine 150 activates serine 174, allowing it to perform a nucleophilic attack on the carbonyl carbon of the substrate. The lysine stabilizes serine 150. The oxyanion hole stabilizes the tetrahedral intermediate using the amide of the alanine backbones. To deacylate the ligand from the protein, a water molecule attacks the carboxyl bond.",
    features: "Monomer; No cofactor",
    processing: "None; full deposited entity folded (493 aa)",
    ligand: {
      name: "Polyurethane dimer, MDI bis-carbamate",
      formula: "C19H22N2O6",
      iptm: 0.848,
      iplddt: 0.864,
      affinity: 1.49,
      pbind: 0.355,
    },
    cofactors: false,
  },
  {
    raw: "04_DD_peptidase_beta_lactamase_model_0.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/04-dd-peptidase-beta-lactamase-model-0.pdb",
    fold: "DD-peptidase / β-lactamase",
    cath: "3.40.710.10",
    id: 451,
    enzyme: "NylB′",
    domain: "DD-peptidase/beta-lactamase",
    reference: "2ZLY",
    accession: "CAA24927.1",
    catalytic: [
      {
        label: "Catalytic Triad",
        residues: [
          {
            chain: "A",
            num: 112,
            aa: "S",
          },
          {
            chain: "A",
            num: 115,
            aa: "K",
          },
          {
            chain: "A",
            num: 215,
            aa: "Y",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Flipping Tyrosine",
        residues: [
          {
            chain: "A",
            num: 170,
            aa: "Y",
          },
        ],
      },
    ],
    mechanism:
      "The tyrosine acts as a base to increase the nucleophilicity of the serine. Serine then performs a nucleophilic attack on the amide bond of the ligand, which creates an anion that is stabilized by the lysine. The flipping tyrosine is located on a flexible loop region and stabilizes the binding of the ligand, and may help the catalytic tyrosine perform proton transfer with the serine.",
    features: "Monomer; No cofactor",
    processing: "None; full deposited entity folded (392 aa)",
    ligand: {
      name: "Nylon-6 linear dimer / 6-aminohexanoate dimer",
      formula: "C12H24N2O3",
      iptm: 0.935,
      iplddt: 0.946,
      affinity: 1.81,
      pbind: 0.491,
    },
    cofactors: false,
  },
  {
    raw: "05_L_aminopeptidase_DalaEsterase_model_0.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/05-l-aminopeptidase-dalaesterase-model-0.pdb",
    fold: "L-aminopeptidase / D-Ala esterase-amidase",
    cath: "3.60.70.12",
    id: 53,
    enzyme: "NylC",
    domain: "L-amino peptidase D-ALA esterase/amidase",
    reference: "5XYG",
    accession: "BAA01528.1",
    catalytic: [
      {
        label: "Nucleophile",
        residues: [
          {
            chain: "B",
            num: 1,
            aa: "T",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Cleavage Site",
        residues: [
          {
            chain: "A",
            num: 266,
            aa: "N",
          },
        ],
      },
      {
        label: "Hydrogen Bonding Network",
        residues: [
          {
            chain: "A",
            num: 219,
            aa: "N",
          },
          {
            chain: "B",
            num: 40,
            aa: "D",
          },
          {
            chain: "B",
            num: 41,
            aa: "G",
          },
        ],
      },
    ],
    mechanism:
      "The precursor protein self cleaves by having the catalytic threonine attack the alpha carbon of the asparagine just before it. The tetrahedral intermediate performs a N-O acyl shift and the protein is cleaved. Then the protein forms a dimer with the two produced subunits. Then the dimer binds with another dimer to form a 4-subunit quaternary structure. To stabilize the reaction, the asparagine, aspartic acid and amide backbone of the glycine hydrogen bond with the now produced electronically charged oxygen-carbon bond.",
    features:
      "Self-cleaving precursor folded as its two subunits (alpha chain A + beta chain B); biological unit is a dimer of these heterodimers (4 subunits); No cofactor",
    processing:
      "Precursor split at the autoproteolysis site between Asn266 and Thr267; chain A = alpha subunit (ref 1-266), chain B = beta subunit (ref 267-355) with catalytic Thr267 as its free N-terminus",
    ligand: {
      name: "Nylon-6 linear dimer / 6-aminohexanoate dimer",
      formula: "C12H24N2O3",
      iptm: 0.785,
      iplddt: 0.864,
      affinity: 2.1,
      pbind: 0.428,
    },
    cofactors: false,
  },
  {
    raw: "06_trypsin_like_serine_protease_model_0.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/06-trypsin-like-serine-protease-model-0.pdb",
    fold: "Trypsin-like serine protease",
    cath: "2.40.10.10",
    domain: "Trypsin-like serine protease",
    reference: "1PQ5",
    accession: "AAB27568.1",
    catalytic: [
      {
        label: "Catalytic Triad",
        residues: [
          {
            chain: "A",
            num: 41,
            aa: "H",
          },
          {
            chain: "A",
            num: 84,
            aa: "D",
          },
          {
            chain: "A",
            num: 180,
            aa: "S",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Oxyanion Hole",
        residues: [
          {
            chain: "A",
            num: 178,
            aa: "G",
          },
          {
            chain: "A",
            num: 180,
            aa: "S",
          },
          {
            chain: "A",
            num: 177,
            aa: "Q",
          },
          {
            chain: "A",
            num: 179,
            aa: "D",
          },
        ],
      },
    ],
    mechanism:
      "The histidine activates the serine to perform a nucleophilic attack on the substrate carbonyl. The aspartic acid stabilizes the histidine. The oxyanion hole residues' amide backbones will stabilize the tetrahedral intermediate. After the collapse of the intermediate to form an acyl-enzyme, water attacks the carbonyl to replace the serine and displaces the protein in the substrate.",
    features: "Monomer; No cofactor",
    processing: "None; full deposited entity folded (224 aa). Deposit auth numbering starts at 16",
    ligand: {
      name: "PLA 4-mer, all-L",
      formula: "C12H18O9",
      iptm: 0.842,
      iplddt: 0.88,
      affinity: 1.27,
      pbind: 0.307,
    },
    cofactors: false,
  },
  {
    raw: "07_peptidase_S8_S53_model_0.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/07-peptidase-s8-s53-model-0.pdb",
    fold: "Peptidase S8/S53",
    cath: "3.40.50.200",
    domain: "Peptidase S8/S53 domain",
    reference: "1S01",
    accession: "CAA24990.1",
    catalytic: [
      {
        label: "Catalytic Triad",
        residues: [
          {
            chain: "A",
            num: 221,
            aa: "S",
          },
          {
            chain: "A",
            num: 32,
            aa: "D",
          },
          {
            chain: "A",
            num: 64,
            aa: "H",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Oxyanion Hole",
        residues: [
          {
            chain: "A",
            num: 155,
            aa: "N",
          },
        ],
      },
    ],
    mechanism:
      "The histidine activates the serine to perform a nucleophilic attack on the substrate carbonyl. The aspartic acid stabilizes the histidine. The oxyanion hole residues will stabilize the tetrahedral intermediate. After the collapse of the intermediate to form an acyl-enzyme, water attacks the carbonyl to replace the serine and displaces the protein in the substrate.",
    features: "Monomer; No cofactor",
    processing: "None; full deposited entity folded (275 aa)",
    ligand: {
      name: "PLA 4-mer, all-L",
      formula: "C12H18O9",
      iptm: 0.971,
      iplddt: 0.924,
      affinity: 1.7,
      pbind: 0.39,
    },
    cofactors: false,
  },
  {
    raw: "08_cytochrome_c_like_model_3.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/08-cytochrome-c-like-model-3.pdb",
    fold: "Cytochrome c-like",
    cath: "1.10.760.10",
    id: 107,
    enzyme: "RoxA",
    domain: "Cytochrome c-like",
    reference: "4B2N",
    accession: "AAP41848.1",
    catalytic: [
      {
        label: "Heme Binding Site 1",
        residues: [
          {
            chain: "A",
            num: 191,
            aa: "C",
          },
          {
            chain: "A",
            num: 194,
            aa: "C",
          },
          {
            chain: "A",
            num: 195,
            aa: "H",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Heme Binding Site 2",
        residues: [
          {
            chain: "A",
            num: 390,
            aa: "C",
          },
          {
            chain: "A",
            num: 393,
            aa: "C",
          },
          {
            chain: "A",
            num: 394,
            aa: "H",
          },
          {
            chain: "A",
            num: 641,
            aa: "H",
          },
        ],
      },
    ],
    mechanism:
      "The protein has two bound heme groups in it, with the first having an open distal axial ligand position open for dioxygen binding, while the second heme group has both axial positions occupied by histidines. The heme group binds to dioxygen, and when the natural rubber enters the hydrophobic tunnel, the dioxygen oxidizes the substrate, cleaving it. The substrate then leaves the hydrophobic tunnel and heme group is primed to bind another dioxygen.",
    features: "Monomer; 2 x heme c (CCD HEC; chains B, C)",
    processing: "None; full deposited entity folded (662 aa)",
    ligand: {
      name: "Natural rubber 4-mer, all-cis-polyisoprene",
      formula: "C22H38",
      iptm: 0.944,
      iplddt: 0.931,
      affinity: 1.58,
      pbind: 0.274,
    },
    cofactors: true,
  },
  {
    raw: "09_oxygenase_like_model_2.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/09-oxygenase-like-model-2.pdb",
    fold: "Lcp oxygenase (no CATH superfamily)",
    cath: null,
    id: 562,
    enzyme: "Lcp (LCP_STRK3)",
    domain: "oxygenase-like",
    reference: "5O1L",
    accession: "AAR25849.1",
    catalytic: [
      {
        label: "Heme Axial Ligands",
        residues: [
          {
            chain: "A",
            num: 198,
            aa: "H",
          },
          {
            chain: "A",
            num: 167,
            aa: "K",
          },
        ],
      },
    ],
    secondary: [],
    mechanism:
      "The axial ligands bind the heme group in the closed state of the protein, but due to a conformational change in the Lysine to flip away from the heme group, the protein enters an open state. The open state allows for a hyperoxide molecule to bind to the heme group, facilitating catalysis by oxidizing the substrate.",
    features: "Monomer; 1 x heme b (CCD HEM; chain B)",
    processing: "None; full deposited entity folded (407 aa)",
    ligand: {
      name: "Natural rubber 4-mer, all-cis-polyisoprene",
      formula: "C22H38",
      iptm: 0.957,
      iplddt: 0.874,
      affinity: 1.75,
      pbind: 0.364,
    },
    cofactors: true,
  },
  {
    raw: "10_glycoside_hydrolase_deacetylase_model_0.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/10-glycoside-hydrolase-deacetylase-model-0.pdb",
    fold: "Glycoside hydrolase / deacetylase",
    cath: "3.20.20.370",
    domain: "Glycoside hydrolase/deacetylase",
    reference: "3CL6",
    accession: "ABA73449.1",
    catalytic: [
      {
        label: "Acid and Base",
        residues: [
          {
            chain: "A",
            num: 36,
            aa: "E",
          },
          {
            chain: "A",
            num: 259,
            aa: "H",
          },
        ],
      },
      {
        label: "Tethering Tryptophan",
        residues: [
          {
            chain: "A",
            num: 130,
            aa: "W",
          },
        ],
      },
    ],
    secondary: [],
    mechanism:
      "The paper that reports this protein does not describe its structure or mechanism, so the mechanism is taken from its closest characterised homolog: a Foldseek search of AF-B2T567-F1 finds PDB 3CL6 (63.1% identity, E = 2.16 × 10⁻⁴⁴). The mechanism of the protein is an acid (glutamic acid) and base (histidine) catalysis. The base and acid destabilize the substrate, allowing for a water to catalysis the bond. The tryptophan is completely conserved, and positions the acid.",
    features: "Monomer; No cofactor",
    processing: "None; full deposited entity folded (308 aa)",
    ligand: {
      name: "Polyurethane dimer, MDI bis-carbamate",
      formula: "C19H22N2O6",
      iptm: 0.913,
      iplddt: 0.892,
      affinity: 0.98,
      pbind: 0.365,
    },
    cofactors: false,
  },
  {
    raw: "11_peroxidase_model_3.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/11-peroxidase-model-3.pdb",
    fold: "Peroxidase",
    cath: "1.10.520.10 + 1.10.420.10",
    id: 177,
    enzyme: "MnP",
    domain: "Peroxidase",
    reference: "1MNP",
    accession: "AAA33744.1",
    catalytic: [
      {
        label: "Manganese Coordinating Ligands",
        residues: [
          {
            chain: "A",
            num: 179,
            aa: "D",
          },
          {
            chain: "A",
            num: 35,
            aa: "E",
          },
          {
            chain: "A",
            num: 39,
            aa: "E",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Heme Proximal Ligand",
        residues: [
          {
            chain: "A",
            num: 173,
            aa: "H",
          },
        ],
      },
    ],
    mechanism:
      "The enzyme binds to a manganese (II) atom with the following ligands: 3 acidic residues, 2 waters, and a heme group. The manganese is oxidized by a peroxide compound, where it then oxidizes the substrate, cleaving it. The heme group is folded around by the protein, with the predominant bond being between the iron and the proximal histidine.",
    features:
      "Monomer; 1 x heme b (CCD HEM; chain B), 1 x Mn(II) (CCD MN; chain C); N-glycosylation sequons at N76, N131, N217 (not modelled)",
    processing: "None; full deposited entity folded (357 aa). Glycosylation not modelled",
    ligand: {
      name: "Nylon-6 linear dimer / 6-aminohexanoate dimer",
      formula: "C12H24N2O3",
      iptm: 0.941,
      iplddt: 0.938,
      affinity: 1.99,
      pbind: 0.318,
    },
    cofactors: true,
  },
  {
    raw: "12_cytochrome_P450_model_3.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/12-cytochrome-p450-model-3.pdb",
    fold: "Cytochrome P450",
    cath: "1.10.630.10",
    id: 221,
    enzyme: "CYP450",
    domain: "Cytochrome P450",
    reference: "1W0E",
    accession: "BAA00001.1",
    catalytic: [
      {
        label: "Heme Coordinating Cysteine",
        residues: [
          {
            chain: "A",
            num: 420,
            aa: "C",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Heme Binding Site",
        residues: [
          {
            chain: "A",
            num: 353,
            aa: "R",
          },
          {
            chain: "A",
            num: 418,
            aa: "R",
          },
          {
            chain: "A",
            num: 108,
            aa: "R",
          },
          {
            chain: "A",
            num: 83,
            aa: "R",
          },
        ],
      },
    ],
    mechanism:
      "The heme group is oxidized by a cofactor and then will oxidize the substrate. Often, this oxidation of the substrate requires a coenzyme.",
    features: "Monomer; 1 x heme b (CCD HEM; chain B)",
    processing:
      "C-terminal purification tag HHHH removed; 481 aa folded. Deposit auth numbering starts at 23",
    ligand: {
      name: "PET dimer",
      formula: "C22H22O10",
      iptm: 0.956,
      iplddt: 0.911,
      affinity: 1.05,
      pbind: 0.443,
    },
    cofactors: true,
  },
  {
    raw: "13_acid_protease_model_0.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/13-acid-protease-model-0.pdb",
    fold: "Acid protease",
    cath: "2.40.70.10",
    domain: "acid protease",
    reference: "1PSO",
    accession: "AAA98529.1",
    catalytic: [
      {
        label: "Catalytic Dyad",
        residues: [
          {
            chain: "A",
            num: 32,
            aa: "D",
          },
          {
            chain: "A",
            num: 215,
            aa: "D",
          },
        ],
      },
    ],
    secondary: [],
    mechanism:
      "The exact reaction is unclear, but it appears that there are two aspartate residues that perform the catalysis on the carbonyl bond of the substrate.",
    features: "Monomer; No cofactor",
    processing:
      "Inhibitor chain (pepstatin, auth chain I) omitted so the cleft is free; 326 aa folded",
    ligand: {
      name: "Polyurethane dimer, MDI bis-carbamate",
      formula: "C19H22N2O6",
      iptm: 0.916,
      iplddt: 0.896,
      affinity: 1.37,
      pbind: 0.261,
    },
    cofactors: false,
  },
  {
    raw: "14_metallo_dependent_phosphatase_model_1.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/14-metallo-dependent-phosphatase-model-1.pdb",
    fold: "Metallo-dependent phosphatase",
    cath: "3.60.21.10",
    id: 466,
    enzyme: "BsMPPE",
    domain: "metallo-dependent phosphatases",
    reference: "AF-A0A063XDV7-F1",
    accession: "A0A063XDV7 (UniProt; no GenBank protein ID available)",
    catalytic: [
      {
        label: "Conserved Metal Binding Site",
        residues: [
          {
            chain: "A",
            num: 37,
            aa: "D",
          },
          {
            chain: "A",
            num: 64,
            aa: "D",
          },
          {
            chain: "A",
            num: 95,
            aa: "N",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "Less Conserved Metal Binding Site",
        residues: [
          {
            chain: "A",
            num: 39,
            aa: "H",
            flag: "corrected",
          },
          {
            chain: "A",
            num: 164,
            aa: "H",
          },
          {
            chain: "A",
            num: 185,
            aa: "H",
          },
          {
            chain: "A",
            num: 187,
            aa: "H",
          },
        ],
      },
      {
        label: "Possible Catalytic Residue",
        residues: [
          {
            chain: "A",
            num: 96,
            aa: "N",
          },
        ],
      },
    ],
    mechanism:
      "The protein binds two metal atoms (homologs use Fe + Zn) using a consort of aspartic acids and histidines. The metals are theorized to react with the substrate and perform catalysis. The paper references three motifs and how they are conserved across different phosphatases (DxH/G, GD, GNH). The exact mechanism for how the histidine works with the metals to catalyze the reaction is unclear, but it is conserved. The histidine is not conserved in this protein, so D, D and N are taken as its conserved residues.",
    features: "Monomer; Fe3+ (CCD FE; chain B), Zn2+ (CCD ZN; chain C)",
    processing:
      "N-terminal membrane anchor (UniProt res 1-17) removed - zero long-range contacts in the AFDB model, hydropathy peak; 242 of 259 aa folded",
    ligand: {
      name: "Bisphenol-A polycarbonate 1-mer",
      formula: "C31H30O5",
      iptm: 0.925,
      iplddt: 0.9,
      affinity: 1.38,
      pbind: 0.097,
    },
    cofactors: true,
    qc: "ref H46 maps to fold P29. Almost certainly a typo for H56: fold 37-39 read D-I-H, i.e. the DxH motif paired with the annotated D54 (fold D37), and fold H39 is the only histidine within 20 residues",
  },
  {
    raw: "15_cupredoxin_blue_copper_model_0.pdb",
    url: "https://static.igem.wiki/teams/6187/wiki/drylab-page/cath-structures/15-cupredoxin-blue-copper-model-0.pdb",
    fold: "Cupredoxin (blue copper)",
    cath: "2.60.40.420",
    id: 558,
    enzyme: "LMC021",
    domain: "cupredoxins - blue copper proteins",
    reference: "AF-A0A076EYX8-F1",
    accession: "A0A076EYX8 (UniProt; no GenBank protein ID available)",
    catalytic: [
      {
        label: "N-term T2/T3 Copper Binding Sites",
        residues: [
          {
            chain: "A",
            num: 412,
            aa: "H",
          },
          {
            chain: "A",
            num: 414,
            aa: "H",
          },
          {
            chain: "A",
            num: 456,
            aa: "H",
          },
          {
            chain: "A",
            num: 458,
            aa: "H",
          },
        ],
      },
    ],
    secondary: [
      {
        label: "T1 Copper Binding Site",
        residues: [
          {
            chain: "A",
            num: 409,
            aa: "H",
          },
          {
            chain: "A",
            num: 457,
            aa: "C",
            flag: "corrected",
          },
          {
            chain: "A",
            num: 462,
            aa: "H",
          },
        ],
      },
      {
        label: "C-term T2/T3 Copper Binding Sites",
        residues: [
          {
            chain: "A",
            num: 412,
            aa: "H",
          },
          {
            chain: "A",
            num: 414,
            aa: "H",
          },
          {
            chain: "A",
            num: 456,
            aa: "H",
          },
          {
            chain: "A",
            num: 458,
            aa: "H",
          },
        ],
      },
    ],
    mechanism:
      "The catalysis site of these proteins is in the copper cluster of the T2/T3 copper binding sites. The copper cluster oxidizes and in some cases will transfer electrons to the T1 copper, which shuttles the electrons to the substrate. With the two proteins in Plasticome, only the 4 N-terminal copper binding sites are present in both, with one protein missing half of T2/T3 and all of T1. Therefore the conserved residues are the N-terminal T2/T3 cluster histidines.",
    features: "Monomer; 4 x Cu (CCD CU; chains B, C, D, E)",
    processing:
      "N-terminal Tat/lipoprotein signal + disordered linker (UniProt res 1-41) removed - zero contacts, pLDDT 24-53 rising to >92 at res 43; 475 of 516 aa folded. Also removes free lipobox Cys32",
    ligand: {
      name: "PE oligomer model, n-hexadecane",
      formula: "C16H34",
      iptm: 0.863,
      iplddt: 0.89,
      affinity: 1.79,
      pbind: 0.086,
    },
    cofactors: true,
    qc: "ref C398 maps to fold R357. Certainly a typo for C498: fold 455-462 read V-H-C-H-N-L-Y-H, so the T1 Cu cysteine is fold C457 (ref 498), flanked by the annotated H497/H499. C457 is the ONLY cysteine in the folded chain",
  },
]
