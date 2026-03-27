import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const HardwarePage = () => {
  return (
    <WikiLayout pageTitle="Hardware">
      <Placeholder>
        <p>✏️ Content for <strong>Hardware</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default HardwarePage

export const Head = () => <title>Hardware — iGEM Toronto 2026</title>
