import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const FinancePage = () => {
  return (
    <WikiLayout pageTitle="Finance">
      <Placeholder>
        <p>✏️ Content for <strong>Finance</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default FinancePage

export const Head = () => <title>Finance — iGEM Toronto 2026</title>
