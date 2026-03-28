import React from "react"
import styled from "styled-components"
import WikiLayout from "../../components/layout.js"

const Page = () => (
  <WikiLayout pageTitle="Pivotal Changes and Milestones">
    <Placeholder><p>Content for <strong>Pivotal Changes and Milestones</strong> goes here.</p></Placeholder>
  </WikiLayout>
)
export default Page
export const Head = () => <title>Pivotal Changes and Milestones — iGEM Toronto 2026</title>
const Placeholder = styled.div`
  border: 1px dashed var(--color-border); border-radius: 4px;
  padding: var(--space-xl); color: var(--color-muted); text-align: center; font-size: 1.1rem;
  strong { color: var(--color-accent); }
`
