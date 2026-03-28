import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"

const SafetyPage = () => {
  return (
    <WikiLayout pageTitle="Safety">
      <Placeholder>
        <p>Content for <strong>Safety</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default SafetyPage

export const Head = () => <title>Safety — iGEM Toronto 2026</title>
