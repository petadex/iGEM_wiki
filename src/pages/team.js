import React from "react"
import styled from "styled-components"
import WikiLayout from "../components/layout.js"
import Placeholder from "../components/placeholder-style.js"

const TeamPage = () => {
  return (
    <WikiLayout pageTitle="Team">
      <Placeholder>
        <p>Content for <strong>Team</strong> goes here.</p>
      </Placeholder>
    </WikiLayout>
  )
}

export default TeamPage

export const Head = () => <title>Team — iGEM Toronto 2026</title>
