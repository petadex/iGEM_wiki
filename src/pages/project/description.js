import React from "react"
import styled from "styled-components"
import WikiLayout from "../../components/layout.js"

const Page = () => (
  <WikiLayout pageTitle="Project Description">
    <Blurb>
      The iGEM Toronto PETase project aims to accelerate the discovery and
      characterization of plastic-degrading enzymes at a global scale. By
      mining the Logan metagenomic assembly — one of the largest collections
      of environmental sequencing data — the project has identified over 216
      million putative PETase sequences from diverse microbial communities
      worldwide. These sequences are organized and made accessible through{" "}
      <strong>PETadex</strong>, a structured database and web platform that
      enables researchers to explore enzyme diversity, phylogenetic
      relationships, and predicted functional properties. The project's broader
      goal is to bridge computational enzyme discovery with experimental
      validation, ultimately supporting the development of scalable biological
      solutions for PET plastic degradation and biorecycling.
    </Blurb>
  </WikiLayout>
)
export default Page
export const Head = () => <title>Project Description — iGEM Toronto 2026</title>

const Blurb = styled.p`
  color: var(--color-muted);
  font-size: 1.05rem;
  line-height: 1.75;
  max-width: 52rem;
  strong { color: var(--color-text); }
`
