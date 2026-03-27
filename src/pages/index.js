import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const HomePage = () => {
  return (
    <WikiLayout pageTitle="Home">
      <Placeholder>
        <p>Content for <strong>Home</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default HomePage

export const Head = () => <title>Home — iGEM Toronto 2026</title>
