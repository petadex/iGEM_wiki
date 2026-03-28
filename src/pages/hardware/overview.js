import React from "react"
import styled from "styled-components"
import WikiLayout from "../../components/layout.js"

const Page = () => (
  <WikiLayout pageTitle="Hardware Overview" sectionLabel="Hardware">
    <Blurb>
      The Hardware team builds custom bioreactors that simulate industrial
      recycling conditions, enabling high-throughput enzyme testing across a
      range of temperatures and pH levels. By engineering the physical
      infrastructure for experimental validation, the team bridges the gap
      between the Dry Lab's computational predictions and real-world
      applicability — ensuring that promising PETase candidates can be
      rigorously tested under conditions that reflect practical biorecycling
      scenarios.
    </Blurb>
  </WikiLayout>
)
export default Page
export const Head = () => <title>Hardware Overview — iGEM Toronto 2026</title>

const Blurb = styled.p`
  color: var(--color-muted);
  font-size: 1.05rem;
  line-height: 1.75;
  max-width: 52rem;
`
