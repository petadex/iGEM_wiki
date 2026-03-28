import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const SoftwarePage = () => {
  return (
    <WikiLayout pageTitle="Software">
      <Placeholder>
        <p>✏️ Content for <strong>Software</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default SoftwarePage

export const Head = () => <title>Software — iGEM Toronto 2026</title>
