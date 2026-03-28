import React from "react"
import styled from "styled-components"
import WikiLayout from "../../components/layout.js"

const Page = () => (
  <WikiLayout pageTitle="Experimental Overview" sectionLabel="Wet Lab">
    <Blurb>
      The Wet Lab team is developing novel assays to experimentally determine
      plastic-degrading enzyme activity with greater speed and precision than
      existing methods. By designing targeted biochemical workflows, the team
      converts computational PETase candidates identified by the Dry Lab into
      experimentally validated hits — providing the empirical backbone of the
      project's enzyme discovery pipeline.
    </Blurb>
  </WikiLayout>
)
export default Page
export const Head = () => <title>Experimental Overview — iGEM Toronto 2026</title>

const Blurb = styled.p`
  color: var(--color-muted);
  font-size: 1.05rem;
  line-height: 1.75;
  max-width: 52rem;
`
