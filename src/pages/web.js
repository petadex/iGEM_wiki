import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const WebPage = () => {
  return (
    <WikiLayout pageTitle="Web">
      <Placeholder>
        <p>✏️ Content for <strong>Web</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default WebPage

export const Head = () => <title>Web — iGEM Toronto 2026</title>
