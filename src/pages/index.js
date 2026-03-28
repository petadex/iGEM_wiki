import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"

const HomePage = () => (
  <WikiLayout>
    <Hero>
      <LogoPlaceholder>
        <span>LOGO</span>
        <sub>Replace with team logo</sub>
      </LogoPlaceholder>
      <HeroText>
        <h1>We are iGEM Toronto</h1>
        <p>
          We are a multidisciplinary team of undergraduate researchers at the University of Toronto,
          competing in the International Genetically Engineered Machine (iGEM) Foundation's annual
          synthetic biology competition. Our 2026 project tackles one of the most pressing
          environmental challenges of our time — plastic pollution — through the lens of
          computational biology, experimental biochemistry, and community engagement.
        </p>
      </HeroText>
    </Hero>

    <Section>
      <SectionLabel>The Problem</SectionLabel>
      <h2>The Plastics Crisis</h2>
      <p>
        Over 400 million tonnes of plastic are produced every year, and less than 10% is ever
        recycled. PET — polyethylene terephthalate — is among the most widely used and
        least-recycled plastics, accumulating in landfills, waterways, and oceans at an
        alarming rate. Conventional recycling is energy-intensive, economically marginal, and
        unable to keep pace with production. A scalable biological solution — enzymes capable
        of breaking PET down into reusable monomers — could fundamentally change that equation.
        The challenge is finding and validating the right enzymes from the vast, largely
        unexplored diversity of microbial life.
      </p>
    </Section>

    <Section>
      <SectionLabel>Our Approach</SectionLabel>
      <h2>How We Are Tackling It</h2>

      <SubteamGrid>
        <SubteamCard>
          <CardAccent />
          <CardTitle>Wet Lab</CardTitle>
          <p>
            Developing novel assays to experimentally determine plastic-degrading enzyme activity
            with greater speed and precision than existing methods — turning computational
            candidates into experimentally validated hits.
          </p>
        </SubteamCard>

        <SubteamCard>
          <CardAccent />
          <CardTitle>Dry Lab</CardTitle>
          <p>
            Performing in-silico discovery by mining large-scale metagenomic data to identify and
            prioritize the most promising PETase candidates from a database of over 216 million
            sequences, organized through our PETadex platform.
          </p>
        </SubteamCard>

        <SubteamCard>
          <CardAccent />
          <CardTitle>Hardware</CardTitle>
          <p>
            Building custom bioreactors that simulate industrial recycling conditions, enabling
            high-throughput enzyme testing across a range of temperatures and pH levels —
            bridging the gap between computational predictions and real-world applicability.
          </p>
        </SubteamCard>

        <SubteamCard>
          <CardAccent />
          <CardTitle>Human Practices &amp; Outreach</CardTitle>
          <p>
            Raising public awareness of the plastics crisis and engaging stakeholders across
            industry, policy, and education. Through our Education Toolkit and community
            initiatives, we ensure our science is grounded in societal need and accessible
            to everyone.
          </p>
        </SubteamCard>
      </SubteamGrid>
    </Section>

    <Section $accent>
      <SectionLabel>The Project</SectionLabel>
      <h2>PETadex — A Global Enzyme Discovery Platform</h2>
      <p>
        The iGEM Toronto PETase project aims to accelerate the discovery and characterization
        of plastic-degrading enzymes at a global scale. By mining the Logan metagenomic
        assembly — one of the largest collections of environmental sequencing data — the project
        has identified over 216 million putative PETase sequences from diverse microbial
        communities worldwide. These sequences are organized and made accessible through{" "}
        <strong>PETadex</strong>, a structured database and web platform that enables researchers
        to explore enzyme diversity, phylogenetic relationships, and predicted functional
        properties. The project's broader goal is to bridge computational enzyme discovery with
        experimental validation, ultimately supporting the development of scalable biological
        solutions for PET plastic degradation and biorecycling.
      </p>
    </Section>
  </WikiLayout>
)

export default HomePage
export const Head = () => <title>Home — iGEM Toronto 2026</title>

const Hero = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-xl);
  padding: var(--space-xl) 0 var(--space-2xl);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`

const LogoPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  padding: var(--space-xl) var(--space-lg);
  color: var(--color-muted);
  flex-shrink: 0;

  span {
    font-family: var(--font-display);
    font-size: clamp(2rem, 6vw, 4rem);
    line-height: 1;
    color: var(--color-text);
    letter-spacing: 0.05em;
  }

  sub { font-size: 0.8rem; letter-spacing: 0.05em; }
`

const HeroText = styled.div`
  h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    margin-bottom: var(--space-md);
  }
  p { color: var(--color-muted); max-width: 52rem; line-height: 1.7; }
`

const Section = styled.section`
  padding: var(--space-xl) 0;
  border-top: 1px solid var(--color-border);

  h2 {
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    margin-bottom: var(--space-md);
  }

  > p {
    color: var(--color-muted);
    max-width: 52rem;
    line-height: 1.7;
    strong { color: var(--color-text); }
  }

  ${({ $accent }) => $accent && `
    background: color-mix(in srgb, var(--color-accent) 8%, transparent);
    border-radius: 8px;
    padding-left: var(--space-lg);
    padding-right: var(--space-lg);
    border-top: none;
    margin-top: var(--space-xl);
  `}
`

const SectionLabel = styled.p`
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: var(--space-sm);
  font-weight: 600;
`

const SubteamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--space-md);
  margin-top: var(--space-lg);
`

const SubteamCard = styled.div`
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: var(--space-lg);
  position: relative;
  overflow: hidden;

  p { color: var(--color-muted); font-size: 0.9rem; line-height: 1.65; }
`

const CardAccent = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--color-accent);
`

const CardTitle = styled.h3`
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 400;
  margin-bottom: var(--space-sm);
`
