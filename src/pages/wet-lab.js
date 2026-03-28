import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"

const WetLabPage = () => (
  <WikiLayout pageTitle="Wet Lab">
    <Placeholder>
      <p>Content for <strong>Wet Lab</strong> goes here.</p>
    </Placeholder>
  </WikiLayout>
)

export default WetLabPage
export const Head = () => <title>Wet Lab — iGEM Toronto 2026</title>

const Placeholder = styled.div`
  border: 1px dashed var(--color-border);
  border-radius: 4px;
  padding: var(--space-xl);
  color: var(--color-muted);
  text-align: center;
  font-size: 1.1rem;
  strong { color: var(--color-accent); }
`
