import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const DescriptionsPage = () => {
  return (
    <WikiLayout pageTitle="Descriptions">
      <Placeholder>
        <p>✏️ Content for <strong>Descriptions</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default DescriptionsPage

export const Head = () => <title>Descriptions — iGEM Toronto 2026</title>
