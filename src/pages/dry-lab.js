import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const DryLabPage = () => {
  return (
    <WikiLayout pageTitle="Dry Lab">
      <Placeholder>
        <p>✏️ Content for <strong>Dry Lab</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default DryLabPage

export const Head = () => <title>Dry Lab — iGEM Toronto 2026</title>
