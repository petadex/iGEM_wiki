import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const EntrepreneurshipPage = () => {
  return (
    <WikiLayout pageTitle="Entrepreneurship">
      <Placeholder>
        <p>✏️ Content for <strong>Entrepreneurship</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default EntrepreneurshipPage

export const Head = () => <title>Entrepreneurship — iGEM Toronto 2026</title>
