import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const ApplicationsPage = () => {
  return (
    <WikiLayout pageTitle="Applications">
      <Placeholder>
        <p>✏️ Content for <strong>Applications</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default ApplicationsPage

export const Head = () => <title>Applications — iGEM Toronto 2026</title>
