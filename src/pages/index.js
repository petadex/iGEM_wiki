import React from "react"
import WikiLayout from "../components/layout.js"
import Seo from "../components/seo.js"
import { HomeScrollPrototype } from "../components/HomeScrollPrototype.js"

const HomePage = () => (
  <WikiLayout pagePath="/" fullBleed hideTopBar hideLoader>
    <HomeScrollPrototype />
  </WikiLayout>
)

export default HomePage

export const Head = () => (
  <Seo
    title="Home"
    description="iGEM Toronto 2026 (PetaBite): 70 students finding, engineering, and deploying plastic-degrading enzymes."
  />
)
