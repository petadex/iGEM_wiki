import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const WetLabPage = () => {
  return (
    <WikiLayout pageTitle="Wet Lab">
      <Placeholder>
        <p>✏️ Content for <strong>Wet Lab</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default WetLabPage

export const Head = () => <title>Wet Lab — iGEM Toronto 2026</title>
