// Web export of the two-tier Dataset Generation flowchart, pasted as-is. Each
// <a class="fc-stage" data-stage="..."> is one subsection of the page, and
// its data-stage is that subsection heading's anchor.
export const FLOWCHART_SVG = `
<svg class="fc" xmlns="http://www.w3.org/2000/svg" viewBox="-1.0 -1.0 210.00 33.00"
     role="navigation" aria-label="Dataset generation pipeline" font-family="sans-serif" text-anchor="middle">
<defs>
  <marker id="fc-arrowhead" viewBox="0 0 10 10" refX="1" refY="5" markerUnits="userSpaceOnUse"
          markerWidth="2" markerHeight="2" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="#5f3928"/>
  </marker>
</defs>
<g class="fc-row-labels">
  <text x="0.00" y="4.90" font-size="3.1" font-weight="bold" fill="#5f3928" text-anchor="start">PETadex-PAZy</text>
  <text x="0.00" y="8.60" font-size="2.6" font-weight="normal" fill="#805340" text-anchor="start" font-style="italic">existing data</text>
  <text x="0.00" y="24.90" font-size="3.1" font-weight="bold" fill="#5f3928" text-anchor="start">Expansion</text>
  <text x="0.00" y="28.60" font-size="2.6" font-weight="normal" fill="#805340" text-anchor="start" font-style="italic">nr + Logan</text>
</g>
<a class="fc-stage" data-stage="petadex-pazy-reference-curation" href="#petadex-pazy-reference-curation" aria-label="PETadex-PAZy Reference Curation">
  <g class="fc-node"><rect x="24.00" y="0.00" width="40.0" height="11.0" rx="2.2" fill="#d2cdd5" stroke="#5e689e" stroke-width="0.8"/>
  <text x="44.00" y="5.10" font-size="3.1" font-weight="bold" fill="#5f3928">PETadex-PAZy</text>
  <text x="44.00" y="8.80" font-size="3.1" font-weight="bold" fill="#5f3928">Reference Curation</text>
  </g>
</a>
<a class="fc-stage" data-stage="cath-assignment" href="#cath-assignment" aria-label="CATH Assignment">
  <path class="fc-arrow" d="M 64.40,5.5 H 70.20" stroke="#5f3928" stroke-width="0.64" fill="none" stroke-linejoin="round" marker-end="url(#fc-arrowhead)"/>
  <g class="fc-node"><rect x="72.00" y="0.00" width="40.0" height="11.0" rx="2.2" fill="#d2cdd5" stroke="#5e689e" stroke-width="0.8"/>
  <text x="92.00" y="5.10" font-size="3.1" font-weight="bold" fill="#5f3928">CATH</text>
  <text x="92.00" y="8.80" font-size="3.1" font-weight="bold" fill="#5f3928">Assignment</text>
  </g>
</a>
<a class="fc-stage" data-stage="component-assignment" href="#component-assignment" aria-label="Component Assignment">
  <path class="fc-arrow" d="M 112.40,5.5 H 118.20" stroke="#5f3928" stroke-width="0.64" fill="none" stroke-linejoin="round" marker-end="url(#fc-arrowhead)"/>
  <g class="fc-node"><rect x="120.00" y="0.00" width="40.0" height="11.0" rx="2.2" fill="#d2cdd5" stroke="#5e689e" stroke-width="0.8"/>
  <text x="140.00" y="5.10" font-size="3.1" font-weight="bold" fill="#5f3928">Component</text>
  <text x="140.00" y="8.80" font-size="3.1" font-weight="bold" fill="#5f3928">Assignment</text>
  </g>
</a>
<a class="fc-stage" data-stage="ncbi-nr-homology-expansion" href="#ncbi-nr-homology-expansion" aria-label="NCBI-nr Homology Expansion">
  <path class="fc-arrow" d="M 140.00,11.4 V 15.50 H 44.00 V 18.20" stroke="#5f3928" stroke-width="0.64" fill="none" stroke-linejoin="round" marker-end="url(#fc-arrowhead)"/>
  <g class="fc-node"><rect x="24.00" y="20.00" width="40.0" height="11.0" rx="2.2" fill="#d4d8cd" stroke="#679a79" stroke-width="0.8"/>
  <text x="44.00" y="25.10" font-size="3.1" font-weight="bold" fill="#5f3928">NCBI-nr Homology</text>
  <text x="44.00" y="28.80" font-size="3.1" font-weight="bold" fill="#5f3928">Expansion</text>
  </g>
</a>
<a class="fc-stage" data-stage="seed-msas-and-catalytic-hmms" href="#seed-msas-and-catalytic-hmms" aria-label="Seed MSAs and Catalytic HMMs">
  <path class="fc-arrow" d="M 64.40,25.5 H 70.20" stroke="#5f3928" stroke-width="0.64" fill="none" stroke-linejoin="round" marker-end="url(#fc-arrowhead)"/>
  <g class="fc-node"><rect x="72.00" y="20.00" width="40.0" height="11.0" rx="2.2" fill="#d4d8cd" stroke="#679a79" stroke-width="0.8"/>
  <text x="92.00" y="25.10" font-size="3.1" font-weight="bold" fill="#5f3928">Seed MSAs and</text>
  <text x="92.00" y="28.80" font-size="3.1" font-weight="bold" fill="#5f3928">Catalytic HMMs</text>
  </g>
</a>
<a class="fc-stage" data-stage="logan-query-extraction" href="#logan-query-extraction" aria-label="Logan Query Extraction">
  <path class="fc-arrow" d="M 112.40,25.5 H 118.20" stroke="#5f3928" stroke-width="0.64" fill="none" stroke-linejoin="round" marker-end="url(#fc-arrowhead)"/>
  <g class="fc-node"><rect x="120.00" y="20.00" width="40.0" height="11.0" rx="2.2" fill="#d4d8cd" stroke="#679a79" stroke-width="0.8"/>
  <text x="140.00" y="25.10" font-size="3.1" font-weight="bold" fill="#5f3928">Logan Query</text>
  <text x="140.00" y="28.80" font-size="3.1" font-weight="bold" fill="#5f3928">Extraction</text>
  </g>
</a>
<a class="fc-stage" data-stage="clustering-and-corpus-structure" href="#clustering-and-corpus-structure" aria-label="Clustering and Corpus Structure">
  <path class="fc-arrow" d="M 160.40,25.5 H 166.20" stroke="#5f3928" stroke-width="0.64" fill="none" stroke-linejoin="round" marker-end="url(#fc-arrowhead)"/>
  <g class="fc-node"><rect x="168.00" y="20.00" width="40.0" height="11.0" rx="2.2" fill="#d4d8cd" stroke="#679a79" stroke-width="0.8"/>
  <text x="188.00" y="25.10" font-size="3.1" font-weight="bold" fill="#5f3928">Clustering and</text>
  <text x="188.00" y="28.80" font-size="3.1" font-weight="bold" fill="#5f3928">Corpus Structure</text>
  </g>
</a>
</svg>
`
