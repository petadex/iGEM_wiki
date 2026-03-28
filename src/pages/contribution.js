import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const ContributionPage = () => {
  return (
    <WikiLayout pageTitle="Contribution">
      <Placeholder>
        <p>✏️ Content for <strong>Contribution</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default ContributionPage

export const Head = () => <title>Contribution — iGEM Toronto 2026</title>
