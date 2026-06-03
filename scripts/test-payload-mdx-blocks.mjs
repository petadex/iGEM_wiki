/**
 * Offline tests for Payload → MDX block rendering (no server required).
 */
import assert from "node:assert/strict"
import { renderBlock, renderPageBody } from "./lib/payload-mdx-render.mjs"

let passed = 0

function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok ${name}`)
}

console.log("payload-mdx-blocks")

test("callout", () => {
  const out = renderBlock({
    blockType: "callout",
    title: "Note",
    tone: "warning",
    body: "Check this claim.",
  })
  assert.match(out, /<Callout title="Note" tone="warning">/)
  assert.match(out, /Check this claim\./)
})

test("figure with static src", () => {
  const out = renderBlock(
    { blockType: "figure", src: "/images/a.png", alt: "Alt text", caption: "Cap" },
    { resolveFigureSrc: (b) => b.src }
  )
  assert.match(out, /<Figure/)
  assert.match(out, /src="\/images\/a.png"/)
  assert.match(out, /alt="Alt text"/)
  assert.match(out, /caption="Cap"/)
})

test("figure with credit", () => {
  const out = renderBlock(
    { blockType: "figure", src: "/images/a.png", alt: "Alt", credit: "Team photo" },
    { resolveFigureSrc: (b) => b.src }
  )
  assert.match(out, /credit="Team photo"/)
})

test("imageGrid", () => {
  const out = renderBlock(
    {
      blockType: "imageGrid",
      figures: [
        { src: "/images/one.png", alt: "One", caption: "First" },
        { src: "/images/two.png", alt: "Two" },
      ],
    },
    { resolveFigureSrc: (b) => b.src }
  )
  assert.match(out, /<ImageGrid>/)
  assert.match(out, /src="\/images\/one.png"/)
  assert.match(out, /src="\/images\/two.png"/)
  assert.match(out, /<\/ImageGrid>/)
})

test("dataTable", () => {
  const out = renderBlock({
    blockType: "dataTable",
    caption: "Parts list",
    tableMarkdown: "| Part | Status |\n| --- | --- |\n| Sensor | Draft |",
  })
  assert.match(out, /<DataTable caption="Parts list">/)
  assert.match(out, /\| Part \| Status \|/)
  assert.match(out, /<\/DataTable>/)
})

test("full page body", () => {
  const body = renderPageBody(
    [
      { blockType: "callout", body: "Hello", tone: "note" },
      {
        blockType: "dataTable",
        caption: "T",
        tableMarkdown: "| A |\n| --- |\n| 1 |",
      },
    ],
    { resolveFigureSrc: () => null }
  )
  assert.match(body, /<Callout/)
  assert.match(body, /<DataTable/)
})

console.log(`\n${passed} tests passed.`)
