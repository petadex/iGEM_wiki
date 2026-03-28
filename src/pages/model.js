import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const ModelPage = () => {
  return (
    <WikiLayout pageTitle="Model">
      <Placeholder>
        <p>✏️ Content for <strong>Model</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default ModelPage

export const Head = () => <title>Model — iGEM Toronto 2026</title>
