import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const EngineeringPage = () => {
  return (
    <WikiLayout pageTitle="Engineering">
      <Placeholder>
        <p>✏️ Content for <strong>Engineering</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default EngineeringPage

export const Head = () => <title>Engineering — iGEM Toronto 2026</title>
