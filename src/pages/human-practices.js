import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const HumanPracticesPage = () => {
  return (
    <WikiLayout pageTitle="Human Practices">
      <Placeholder>
        <p>✏️ Content for <strong>Human Practices</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default HumanPracticesPage

export const Head = () => <title>Human Practices — iGEM Toronto 2026</title>
