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

test("interactiveGizmo with config emits a JSX expression", () => {
  const out = renderBlock({
    blockType: "interactiveGizmo",
    gizmo: "growthCurve",
    title: "Fluorescence Model",
    config: { growthRate: 0.5, carryingCapacity: 200 },
  })
  assert.match(out, /<InteractiveGizmo/)
  assert.match(out, /name="growthCurve"/)
  assert.match(out, /title="Fluorescence Model"/)
  // config must be an expression {{...}}, NOT a quoted string
  assert.match(out, /config=\{\{"growthRate":0\.5,"carryingCapacity":200\}\}/)
})

test("interactiveGizmo accepts a JSON string config", () => {
  const out = renderBlock({
    blockType: "interactiveGizmo",
    gizmo: "growthCurve",
    config: '{"growthRate":0.8}',
  })
  assert.match(out, /config=\{\{"growthRate":0\.8\}\}/)
})

test("interactiveGizmo without config omits the prop", () => {
  const out = renderBlock({ blockType: "interactiveGizmo", gizmo: "growthCurve" })
  assert.match(out, /name="growthCurve"/)
  assert.ok(!/config=/.test(out), "should not emit a config prop when empty")
})

test("interactiveGizmo with invalid JSON reports an error and renders nothing", () => {
  let captured = null
  const out = renderBlock(
    { blockType: "interactiveGizmo", gizmo: "growthCurve", config: "{ not json }" },
    { onError: (msg) => (captured = msg) }
  )
  assert.equal(out, "")
  assert.match(captured, /invalid JSON/)
})

test("gizmo can sit between text blocks (mid-page)", () => {
  const body = renderPageBody(
    [
      { blockType: "richText", body: "Intro paragraph." },
      { blockType: "interactiveGizmo", gizmo: "growthCurve", title: "Try it" },
      { blockType: "richText", body: "Closing paragraph." },
    ],
    { resolveFigureSrc: () => null }
  )
  const gizmoIndex = body.indexOf("<InteractiveGizmo")
  assert.ok(body.indexOf("Intro paragraph.") < gizmoIndex)
  assert.ok(gizmoIndex < body.indexOf("Closing paragraph."))
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
