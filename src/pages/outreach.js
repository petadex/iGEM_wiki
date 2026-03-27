import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const OutreachPage = () => {
  return (
    <WikiLayout pageTitle="Outreach">
      <Placeholder>
        <p>✏️ Content for <strong>Outreach</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default OutreachPage

export const Head = () => <title>Outreach — iGEM Toronto 2026</title>
