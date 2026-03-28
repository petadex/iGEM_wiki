import React from "react"
import styled from "styled-components"
import WikiLayout from "../../components/layout.js"

const Page = () => (
  <WikiLayout pageTitle="Engineering">
    <Placeholder><p>Content for <strong>Engineering</strong> goes here.</p></Placeholder>
  </WikiLayout>
)
export default Page
export const Head = () => <title>Engineering — iGEM Toronto 2026</title>
const Placeholder = styled.div`
  border: 1px dashed var(--color-border); border-radius: 4px;
  padding: var(--space-xl); color: var(--color-muted); text-align: center; font-size: 1.1rem;
  strong { color: var(--color-accent); }
`
