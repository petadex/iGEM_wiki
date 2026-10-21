import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import styled from "styled-components"
import CA from "../../../data/componentAssignment.json"
import {
  Arrow,
  Box,
  BoxTitle,
  ChartScroll,
  FRAME,
  Flow,
  INK,
  INK_SOFT,
  LINE,
  Lane,
  LegendRow,
  MUTED,
  Node,
  NodeD,
  NodeN,
  NodeT,
  PANEL,
  SUNK,
  Sub,
  Swatch,
  TableToggle,
  Tip,
  fmt,
  fieldStyle,
  tipTransform,
} from "./plasticomeFigure.js"

/**
 * Component Assignment, from the Model page's Dataset Generation section and
 * its Methods page (/dry-lab/model/component-assignment/).
 *
 * Ported from the draft in plasticome/wiki-reference-curation/03 Component
 * Assignment/ (template.html). src/data/componentAssignment.json is that
 * draft's data.json: the final run (runs/2026-08-06.final-usearch.3), the
 * USEARCH/DIAMOND 2x2 (archive/diamond-usearch-comparison/), and the
 * component map's nodes and edges (logan-plasticome-figure/ssn/out/).
 *   ComponentMap        the interactive component map, with a button per
 *                       component that highlights it and links the explorer
 *   ComponentFlow       411 centroids to 46 components
 *   IdentityHistogram   where the 30% cutoff sits
 *   ComponentSizes      components by number of centroids
 */

const D = CA
const S = D.stats
const COMP = Object.fromEntries(D.comps.map(c => [c.c, c]))
const pretty = s => s.replace("alpha/beta", "α/β").replace(/\s+-\s+/, ", ")
const domOf = c => pretty((c.cath && D.names[c.cath]) || c.dom)

/* ---------- component map ---------- */

// Substrate colours and node shapes follow logan-plasticome-figure/ssn/build_ssn.py.
// The CATH forest draws its tips in the same colours, and reuses these for its key.
export const SUB = {
  PET: "#275ca0",
  PE: "#e8559e",
  PA: "#40b6c5",
  PUR: "#f0c95e",
  PLA: "#cc490b",
  PBAT: "#9a6fd4",
  PBS: "#23873d",
  PHA: "#8fbf5f",
  PC: "#8c6d46",
  NR: "#959595",
  "Combi.": "#262626",
}
export const SUBNAME = { NR: "Not reported", "Combi.": "Several plastics" }
const ORIGIN = { D: "Bacterial", h: "Eukaryotic", o: "Metagenomic" }
const HALO = "#e8ddd1"
const HALO_ON = "#d6c4b1"
const EDGE = "#b9a998"
const STROKE = "#3a3a3a"

const M = D.map
const MN = M.nodes
const fy = y => -y // the layout is y-up

function markPath(shape, x, y, r) {
  if (shape === "D")
    return `M${x} ${y - r * 1.25}L${x + r * 1.25} ${y}L${x} ${y + r * 1.25}L${x - r * 1.25} ${y}Z`
  if (shape === "h")
    return (
      Array.from({ length: 6 }, (_, k) => {
        const a = Math.PI / 6 + (k * Math.PI) / 3
        return `${k ? "L" : "M"}${(x + r * 1.1 * Math.cos(a)).toFixed(3)} ${(y + r * 1.1 * Math.sin(a)).toFixed(3)}`
      }).join("") + "Z"
    )
  return `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`
}

// One section per catalytic family, headed above the bounding box of its nodes.
const SECTIONS = Object.values(
  MN.reduce((acc, n) => {
    const f = (acc[n.fam] ??= {
      fam: n.fam,
      x0: Infinity,
      x1: -Infinity,
      top: Infinity,
      bottom: -Infinity,
      maps: new Set(),
      n: 0,
    })
    f.x0 = Math.min(f.x0, n.x)
    f.x1 = Math.max(f.x1, n.x)
    f.top = Math.min(f.top, fy(n.y))
    f.bottom = Math.max(f.bottom, fy(n.y))
    f.maps.add(n.m)
    f.n += 1
    return acc
  }, {}),
)
// Headings run past the nodes, so the right edge gets room for the longest one.
const BOX = (() => {
  const xs = MN.map(n => n.x)
  const ys = MN.map(n => fy(n.y))
  const x0 = Math.min(...xs) - 2
  const y0 = Math.min(...ys) - 4.2
  const x1 = Math.max(
    Math.max(...xs) + 2,
    ...SECTIONS.map(s => s.x0 + s.fam.length * 0.78),
  )
  return { x: x0, y: y0, w: x1 - x0, h: Math.max(...ys) + 2 - y0 }
})()
const SUBS = Object.keys(SUB).filter(k => MN.some(n => n.sub === k))
const BY_SIZE = [
  ...D.comps.filter(c => c.cent > 1),
  ...D.comps.filter(c => c.cent === 1),
]

/**
 * The map is drawn across the box's full width, wider than the layout, so
 * there is room either side to drag components into. `base` is the whole
 * drawing area: BOX widened, about its centre, to the map's on-screen shape.
 */
const widen = aspect => {
  if (!aspect || aspect <= BOX.w / BOX.h) return BOX
  const w = BOX.h * aspect
  return { x: BOX.x - (w - BOX.w) / 2, y: BOX.y, w, h: BOX.h }
}

/**
 * The map's groups, each dragged as one: a group is one halo, the nodes a
 * chain of 30% links joins (the map's own `m`; no edge or bridge crosses
 * two). `box` is its extent with the halo, for keeping it on the map.
 */
const GROUPS = Object.values(
  MN.reduce((acc, n, i) => {
    const g = (acc[n.m] ??= {
      m: n.m,
      nodes: [],
      edges: [],
      bridges: [],
      box: { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
    })
    g.nodes.push(i)
    g.box.x0 = Math.min(g.box.x0, n.x - M.pad)
    g.box.x1 = Math.max(g.box.x1, n.x + M.pad)
    g.box.y0 = Math.min(g.box.y0, fy(n.y) - M.pad)
    g.box.y1 = Math.max(g.box.y1, fy(n.y) + M.pad)
    return acc
  }, {}),
)
const GROUP_OF = Object.fromEntries(GROUPS.map(g => [g.m, g]))
M.edges.forEach((e, k) => GROUP_OF[MN[e[0]].m].edges.push(k))
M.bridges.forEach((b, k) => GROUP_OF[MN[b[0]].m].bridges.push(k))

SECTIONS.forEach(sec => {
  sec.groups = GROUPS.filter(g => MN[g.nodes[0]].fam === sec.fam)
})

const plural = (k, word) => `${k} ${word}${k === 1 ? "" : "s"}`
const sectionSub = sec => `${plural(sec.maps.size, "component")} · ${plural(sec.n, "enzyme")}`

/**
 * A domain's frame: round its nodes and its heading. `right` is where the
 * heading's text ends, measured once drawn; until then it is estimated.
 */
const frameOf = (sec, right) => {
  const textRight =
    right ??
    sec.x0 - 0.8 + Math.max(sec.fam.length * 0.78, sectionSub(sec).length * 0.47)
  return {
    x0: sec.x0 - M.pad - 0.6,
    y0: sec.top - 4,
    x1: Math.max(sec.x1 + M.pad, textRight) + 0.6,
    y1: sec.bottom + M.pad + 0.6,
  }
}

/** A group's offset, held so that all of it stays inside the drawing area. */
const clampShift = (g, dx, dy, base) => ({
  dx: Math.min(Math.max(dx, base.x - g.box.x0), base.x + base.w - g.box.x1),
  dy: Math.min(Math.max(dy, base.y - g.box.y0), base.y + base.h - g.box.y1),
})

/** A view framing these nodes where they are drawn now, dragged or not. */
function fitView(ns, base = BOX, shift = {}) {
  if (!ns.length) return base
  const xs = ns.map(n => n.x + (shift[n.m]?.dx || 0))
  const ys = ns.map(n => fy(n.y) + (shift[n.m]?.dy || 0))
  const pad = 3.5
  const x0 = Math.min(...xs) - pad
  const x1 = Math.max(...xs) + pad
  const y0 = Math.min(...ys) - pad - 2
  const y1 = Math.max(...ys) + pad
  const ar = base.w / base.h
  const w = Math.max(x1 - x0, (y1 - y0) * ar, 12)
  const h = w / ar
  return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h }
}

/**
 * One group of the map, in its own layer so it can be dragged on its own. It
 * redraws only when the highlight changes or it moves.
 */
const MapGroup = React.memo(function MapGroup({ g, dx, dy, on, comp }) {
  const lit = i => comp && on.has(i)
  return (
    <g className="grp" data-m={g.m} transform={`translate(${dx} ${dy})`}>
      {g.nodes.map(i => (
        <circle
          key={i}
          cx={MN[i].x}
          cy={fy(MN[i].y)}
          r={M.pad}
          fill={lit(i) ? HALO_ON : HALO}
        />
      ))}
      {g.bridges.map(k => {
        const [a, b] = M.bridges[k]
        return (
          <line
            key={k}
            x1={MN[a].x}
            y1={fy(MN[a].y)}
            x2={MN[b].x}
            y2={fy(MN[b].y)}
            stroke={lit(a) ? HALO_ON : HALO}
            strokeWidth={2 * M.pad * 0.42}
            strokeLinecap="round"
          />
        )
      })}
      {g.edges.map(k => {
        const [a, b, p] = M.edges[k]
        return (
          <line
            key={k}
            x1={MN[a].x}
            y1={fy(MN[a].y)}
            x2={MN[b].x}
            y2={fy(MN[b].y)}
            stroke={EDGE}
            strokeWidth={(0.03 + (0.11 * (p - 40)) / 60).toFixed(3)}
            opacity={on && !(on.has(a) && on.has(b)) ? 0.12 : 0.75}
          />
        )
      })}
      {g.nodes.map(i => {
        const n = MN[i]
        return (
          <path
            key={i}
            data-i={i}
            className="nd"
            d={markPath(n.shape, n.x, fy(n.y), n.seed ? 0.4 : 0.32)}
            fill={SUB[n.sub] || SUB.NR}
            stroke={on?.has(i) || n.seed ? INK : STROKE}
            strokeWidth={n.seed ? 0.13 : on?.has(i) ? 0.09 : 0.05}
            opacity={on && !on.has(i) ? 0.14 : 1}
          />
        )
      })}
      {g.nodes
        .filter(i => MN[i].seed)
        .map(i => (
          <text
            key={i}
            className="lab"
            pointerEvents="none"
            x={MN[i].x + 0.7}
            y={fy(MN[i].y) - 0.55}
            fontSize={0.95}
            strokeWidth={0.25}
          >
            {MN[i].seed}
          </text>
        ))}
    </g>
  )
})

/**
 * The drawing: every group where it has been dragged to. With `domains` on,
 * each catalytic family (CATH domain) is framed and headed where the layout
 * put it, and dragging its heading moves the whole domain. A group dragged
 * on its own leaves its frame behind. No two frames overlap as laid out.
 */
const MapLayers = ({ on, comp, shift, domains, domShift, rights }) => {
  const at = k => `translate(${domShift[k]?.dx || 0} ${domShift[k]?.dy || 0})`
  return (
    <>
      {domains && (
        <g pointerEvents="none">
          {SECTIONS.map((sec, k) => {
            const f = frameOf(sec, rights[k])
            return (
              <rect
                key={sec.fam}
                className="dom"
                transform={at(k)}
                x={f.x0}
                y={f.y0}
                width={f.x1 - f.x0}
                height={f.y1 - f.y0}
                rx={0.8}
              />
            )
          })}
        </g>
      )}
      {GROUPS.map(g => (
        <MapGroup
          key={g.m}
          g={g}
          dx={shift[g.m]?.dx || 0}
          dy={shift[g.m]?.dy || 0}
          on={on}
          comp={comp}
        />
      ))}
      {domains &&
        SECTIONS.map((sec, k) => {
          const f = frameOf(sec, rights[k])
          return (
            <g key={sec.fam} className="domhead" data-s={k} transform={at(k)}>
              {/* Something to take hold of between and around the words. */}
              <rect
                fill="transparent"
                x={f.x0}
                y={f.y0}
                width={f.x1 - f.x0}
                height={sec.top - 1.1 - f.y0}
              />
              <g className="domtext">
                <text x={sec.x0 - 0.8} y={sec.top - 2.6} fontSize={1.5}>
                  {sec.fam}
                </text>
                <text className="sub" x={sec.x0 - 0.8} y={sec.top - 1.4} fontSize={0.85}>
                  {sectionSub(sec)}
                </text>
              </g>
            </g>
          )
        })}
    </>
  )
}

export const ComponentMap = () => {
  const [focus, setFocus] = useState(null) // { kind: "comp" | "sub" | "origin" | "q", key }
  const [query, setQuery] = useState("")
  const [view, setView] = useState(BOX)
  const [tip, setTip] = useState(null)
  const [aspect, setAspect] = useState(null) // the map's width / height on screen
  const [shift, setShift] = useState({}) // m -> { dx, dy }, the groups dragged so far
  const [domains, setDomains] = useState(true) // frame and head each CATH domain
  const [domShift, setDomShift] = useState({}) // section index -> { dx, dy }
  const [rights, setRights] = useState({}) // section index -> where its heading text ends
  const base = useMemo(() => widen(aspect), [aspect])
  const svg = useRef(null)
  const drag = useRef(null)
  const viewRef = useRef(view)
  viewRef.current = view

  const test = useMemo(() => {
    if (!focus) return null
    if (focus.kind === "comp") return n => n.c === focus.key
    if (focus.kind === "sub") return n => n.sub === focus.key
    if (focus.kind === "origin") return n => n.shape === focus.key
    const q = focus.key.toLowerCase()
    return n =>
      n.name.toLowerCase().includes(q) || `pl${n.id}` === q.replace(/\s/g, "")
  }, [focus])
  const on = useMemo(
    () => (test ? new Set(MN.flatMap((n, i) => (test(n) ? [i] : []))) : null),
    [test],
  )
  const hits = useMemo(() => (on ? [...on].map(i => MN[i]) : []), [on])

  const choose = (f, zoom) => {
    const same = f && focus && f.kind === focus.kind && f.key === focus.key
    const next = same ? null : f
    setFocus(next)
    if (next?.kind !== "q") setQuery("")
    if (zoom) {
      const t =
        next && next.kind === "comp" ? MN.filter(n => n.c === next.key) : []
      setView(fitView(t, base, shift))
    }
  }

  const toSvg = (cx, cy) => {
    const r = svg.current.getBoundingClientRect()
    const v = viewRef.current
    return {
      x: v.x + ((cx - r.left) / r.width) * v.w,
      y: v.y + ((cy - r.top) / r.height) * v.h,
    }
  }
  const zoomAt = useCallback((k, cx, cy) => {
    const v = viewRef.current
    const p =
      cx == null ? { x: v.x + v.w / 2, y: v.y + v.h / 2 } : toSvg(cx, cy)
    const w = Math.min(Math.max(v.w * k, 8), BOX.w * 1.5)
    const s = w / v.w
    setView({
      x: p.x - (p.x - v.x) * s,
      y: p.y - (p.y - v.y) * s,
      w,
      h: (w * v.h) / v.w,
    })
  }, [])

  // The map is about square, so at the column's width it alone would fill the
  // screen. It is made shorter until the whole box, controls and notes
  // included, fits between the header and the bottom of the window, and keeps
  // the box's full width: the drawing is centred in it with room either side
  // to drag groups into. The open component list is left out of the sum, so
  // opening it doesn't shrink the map.
  const boxRef = useRef(null)
  useEffect(() => {
    const box = boxRef.current
    const map = svg.current
    const fit = () => {
      const list = box.querySelector("details[open]")
      const listBody = list
        ? list.offsetHeight - list.querySelector("summary").offsetHeight
        : 0
      const rest = box.offsetHeight - map.getBoundingClientRect().height - listBody
      const header =
        parseFloat(getComputedStyle(box).getPropertyValue("--dl-header")) || 0
      const w = map.clientWidth
      const h = Math.min(
        (w * BOX.h) / BOX.w,
        Math.max(window.innerHeight - header - rest - 24, 240),
      )
      map.style.height = `${h}px`
      setAspect(w / h)
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    window.addEventListener("resize", fit)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", fit)
    }
  }, [])

  // When the map changes shape, a view of the whole map follows it to the new
  // drawing area, and a zoomed view keeps its centre and width. Dragged groups
  // are pulled back inside if the area got narrower.
  const lastBase = useRef(base)
  useEffect(() => {
    const was = lastBase.current
    lastBase.current = base
    if (was === base) return
    setView(v => {
      if (v.x === was.x && v.y === was.y && v.w === was.w && v.h === was.h) return base
      const h = (v.w * base.h) / base.w
      return { ...v, y: v.y + (v.h - h) / 2, h }
    })
    setShift(sh =>
      Object.fromEntries(
        Object.entries(sh).map(([m, { dx, dy }]) => [m, clampShift(GROUP_OF[m], dx, dy, base)]),
      ),
    )
  }, [base])

  // Each frame is sized to its heading's drawn text, so the words stay inside.
  useEffect(() => {
    if (!domains) return
    const next = {}
    svg.current.querySelectorAll(".domhead").forEach(h => {
      const b = h.querySelector(".domtext").getBBox()
      next[h.dataset.s] = b.x + b.width
    })
    setRights(next)
  }, [domains])

  // ⌘/Ctrl-scroll and trackpad pinch zoom; a plain scroll still scrolls the page.
  useEffect(() => {
    const el = svg.current
    const onWheel = e => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      zoomAt(Math.exp(e.deltaY * 0.01), e.clientX, e.clientY)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [zoomAt])

  const nodeOf = e => {
    const t = e.target.closest?.(".nd")
    return t ? MN[+t.dataset.i] : null
  }
  // Pressing on a group (a node or its halo) drags that group; pressing
  // anywhere else pans.
  const onDown = e => {
    const head = e.target.closest?.(".domhead")
    const g = !head && e.target.closest?.(".grp")
    const group = g ? GROUP_OF[g.dataset.m] : null
    const k = head ? +head.dataset.s : null
    drag.current = {
      k,
      fromDom: head ? domShift[k] || { dx: 0, dy: 0 } : null,
      fromGroups: head
        ? Object.fromEntries(
            SECTIONS[k].groups.map(gr => [gr.m, shift[gr.m] || { dx: 0, dy: 0 }]),
          )
        : null,
      x: e.clientX,
      y: e.clientY,
      v: view,
      moved: false,
      n: nodeOf(e),
      group,
      from: group ? shift[group.m] || { dx: 0, dy: 0 } : null,
    }
    svg.current.setPointerCapture(e.pointerId)
  }
  const onMove = e => {
    const d = drag.current
    if (d) {
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!d.moved && Math.hypot(dx, dy) < 4) return
      d.moved = true
      setTip(null)
      const r = svg.current.getBoundingClientRect()
      if (d.k != null) {
        // The whole domain moves as one, held so that its frame stays on the map.
        const f = frameOf(SECTIONS[d.k], rights[d.k])
        const ox = d.fromDom.dx
        const oy = d.fromDom.dy
        const mx = Math.min(
          Math.max((dx / r.width) * d.v.w, base.x - (f.x0 + ox)),
          base.x + base.w - (f.x1 + ox),
        )
        const my = Math.min(
          Math.max((dy / r.height) * d.v.h, base.y - (f.y0 + oy)),
          base.y + base.h - (f.y1 + oy),
        )
        setDomShift(ds => ({ ...ds, [d.k]: { dx: ox + mx, dy: oy + my } }))
        setShift(sh => {
          const next = { ...sh }
          SECTIONS[d.k].groups.forEach(gr => {
            const from = d.fromGroups[gr.m]
            next[gr.m] = clampShift(gr, from.dx + mx, from.dy + my, base)
          })
          return next
        })
        return
      }
      if (d.group) {
        const to = clampShift(
          d.group,
          d.from.dx + (dx / r.width) * d.v.w,
          d.from.dy + (dy / r.height) * d.v.h,
          base,
        )
        setShift(sh => ({ ...sh, [d.group.m]: to }))
        return
      }
      setView({
        ...d.v,
        x: d.v.x - (dx / r.width) * d.v.w,
        y: d.v.y - (dy / r.height) * d.v.h,
      })
      return
    }
    const n = nodeOf(e)
    setTip(n ? { x: e.clientX, y: e.clientY, n } : null)
  }
  const onUp = () => {
    const d = drag.current
    drag.current = null
    if (!d || d.moved) return
    if (d.n) choose({ kind: "comp", key: d.n.c })
    else if (focus) choose(null)
  }

  const panel = (() => {
    if (!focus) return "Click an enzyme to highlight its component."
    if (focus.kind === "comp") {
      const c = COMP[focus.key]
      const groups = new Set(hits.map(n => n.m)).size
      return (
        <>
          <b>
            {c.c} · {domOf(c)}
          </b>
          : {c.cent} centroid{c.cent > 1 ? "s" : ""}, {c.enz} enzymes
          {groups > 1
            ? `, drawn as ${groups} separate groups on the map (the map also requires 50% coverage)`
            : ""}
          . <a href={`#comp=${c.c}`}>List them in the PETadex-PAZy explorer →</a>
        </>
      )
    }
    return (
      <>
        <b>{hits.length}</b> enzyme{hits.length === 1 ? "" : "s"}{" "}
        {focus.kind === "sub"
          ? `act on ${SUBNAME[focus.key] || focus.key}`
          : focus.kind === "origin"
            ? `${hits.length === 1 ? "is" : "are"} ${ORIGIN[focus.key].toLowerCase()}`
            : `match “${focus.key}”`}
        .
      </>
    )
  })()

  const comp = focus?.kind === "comp"
  return (
    <Box ref={boxRef}>
      <BoxTitle>PETadex-PAZy as a map of components</BoxTitle>
      <Sub>
        Drag any component to move it around the map, or a domain's heading to
        move the whole domain.
      </Sub>
      <MapBar>
        <input
          type="search"
          placeholder="Find an enzyme (name or PL number)"
          aria-label="Find an enzyme"
          value={query}
          onChange={e => {
            const q = e.target.value
            setQuery(q)
            setFocus(q.trim() ? { kind: "q", key: q.trim() } : null)
          }}
          onKeyDown={e =>
            e.key === "Enter" && hits.length && setView(fitView(hits, base, shift))
          }
        />
        <Zoom>
          <button
            type="button"
            aria-pressed={domains}
            onClick={() => setDomains(!domains)}
          >
            CATH domains
          </button>
        </Zoom>
        <Zoom role="group" aria-label="Zoom">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => zoomAt(0.7)}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => zoomAt(1 / 0.7)}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => {
              setView(base)
              setShift({})
              setDomShift({})
            }}
          >
            Reset
          </button>
        </Zoom>
      </MapBar>
      <Legend>
      <LegendRow>
        <LegendLabel>Plastic substrate</LegendLabel>
        {SUBS.map(k => (
          <LegendButton
            key={k}
            type="button"
            aria-pressed={focus?.kind === "sub" && focus.key === k}
            onClick={() => choose({ kind: "sub", key: k })}
          >
            <Swatch style={{ background: SUB[k] }} />
            {SUBNAME[k] || k}
          </LegendButton>
        ))}
      </LegendRow>
      <LegendRow>
        <LegendLabel>Organism type</LegendLabel>
        {Object.entries(ORIGIN).map(([k, l]) => (
          <LegendButton
            key={k}
            type="button"
            aria-pressed={focus?.kind === "origin" && focus.key === k}
            onClick={() => choose({ kind: "origin", key: k })}
          >
            <svg width="12" height="12" viewBox="-1 -1 2 2" aria-hidden="true">
              <path
                d={markPath(k, 0, 0, k === "D" ? 0.7 : 0.8)}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.2"
              />
            </svg>
            {l}
          </LegendButton>
        ))}
      </LegendRow>
      </Legend>
      <MapSvg
        ref={svg}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        role="img"
        aria-label="Sequence similarity network of the 609 PETadex-PAZy enzymes, grouped into sections by catalytic family. Nodes are coloured by substrate and shaped by origin; grey halos outline components."
        $drag={!!drag.current?.moved}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={() => setTip(null)}
        onDoubleClick={e => zoomAt(0.6, e.clientX, e.clientY)}
      >
        <MapLayers
          on={on}
          comp={comp}
          shift={shift}
          domains={domains}
          domShift={domShift}
          rights={rights}
        />
      </MapSvg>
      <Panel aria-live="polite">
        {panel}
        {focus && (
          <>
            {" · "}
            <ClearButton
              type="button"
              onClick={() => {
                setFocus(null)
                setQuery("")
                setView(base)
              }}
            >
              Clear
            </ClearButton>
          </>
        )}
      </Panel>
      <TableToggle>
        <summary>Highlight a component ({D.comps.length})</summary>
        <CompButtons aria-label="Components">
          {BY_SIZE.map((c, i) => (
            <React.Fragment key={c.c}>
              {i > 0 && c.cent === 1 && BY_SIZE[i - 1].cent > 1 && <Break />}
              <a
                href={`#comp=${c.c}`}
                aria-pressed={comp && focus.key === c.c}
                title={`${c.c}: ${c.cent} centroid${c.cent > 1 ? "s" : ""}, ${c.enz} enzymes. ${c.ex.join(", ")}`}
                onClick={e => {
                  if (e.metaKey || e.ctrlKey) return
                  e.preventDefault()
                  choose({ kind: "comp", key: c.c }, true)
                }}
              >
                <span>{domOf(c)}</span>
                <small>
                  {c.c} · {c.enz}
                </small>
              </a>
            </React.Fragment>
          ))}
        </CompButtons>
      </TableToggle>
      {tip && (
        <Tip style={{ transform: tipTransform(tip) }}>
          <b>
            {tip.n.name} · PL{tip.n.id}
            {tip.n.seed ? " · seed" : ""}
          </b>
          <span>
            {tip.n.raw && tip.n.raw !== "NA"
              ? tip.n.raw
              : "Substrate not reported"}{" "}
            · {ORIGIN[tip.n.shape]}
          </span>
          <span>{pretty(tip.n.dom.split(";")[0])}</span>
          <span>
            Component {tip.n.c} ({COMP[tip.n.c]?.enz ?? "?"} enzymes)
          </span>
        </Tip>
      )}
    </Box>
  )
}

/* ---------- 411 centroids to 46 components ---------- */

export const ComponentFlow = () => (
  <Box>
    <BoxTitle>
      From {fmt(S.n_nodes)} centroids to {S.n_components} components
    </BoxTitle>
    <Sub>Counts are from the final run.</Sub>
    <FlowGrid>
      <Lane>
        <Node>
          <NodeN>{fmt(S.n_nodes)}</NodeN>
          <NodeT>Centroids</NodeT>
          <NodeD>
            PETadex-PAZy clustered at 90% identity; one node per distinct sequence
          </NodeD>
        </Node>
      </Lane>
      <Arrow aria-hidden="true">→</Arrow>
      <Lane>
        <Node>
          <Tag>USEARCH · both orientations</Tag>
          <NodeN>{fmt(S.aligned_pairs)}</NodeN>
          <NodeT>Aligned pairs</NodeT>
          <NodeD>
            {fmt(S.raw_alignments)} alignments, best per pair by bit score
          </NodeD>
        </Node>
      </Lane>
      <Arrow aria-hidden="true">→</Arrow>
      <Lane>
        <Node>
          <Tag>≥ 30% identity · E &lt; 10⁻⁵</Tag>
          <NodeN>{fmt(S.edges_passing)}</NodeN>
          <NodeT>Links</NodeT>
          <NodeD>Applied after the search, never during it</NodeD>
        </Node>
        <Node>
          <NodeN>{fmt(S.n_components)}</NodeN>
          <NodeT>Connected components</NodeT>
          <NodeD>
            Largest {fmt(S.largest_component)} centroids; {fmt(S.n_singletons)}{" "}
            single
          </NodeD>
        </Node>
      </Lane>
      <Arrow aria-hidden="true">→</Arrow>
      <Lane>
        <Node $out>
          <NodeN>{fmt(D.union.n)}</NodeN>
          <NodeT>PETadex-PAZy, one row per enzyme</NodeT>
          <NodeD>Each enzyme takes the component of its centroid</NodeD>
        </Node>
      </Lane>
    </FlowGrid>
    <Sub>
      Every centroid is aligned to every other. Each pair keeps its best
      alignment. A pair becomes a link if it passes both the identity and the
      E-value rule, and the components are the connected groups of the resulting
      graph. Each of the 609 enzymes then takes the component of its centroid.
    </Sub>
  </Box>
)

/* ---------- where the identity cutoff sits ---------- */

export const IdentityHistogram = () => {
  const [tip, setTip] = useState(null)
  const h = D.pid_hist
  const n = h.counts.length
  const mx = Math.max(...h.counts)
  const W = 760
  const H = 260
  const l = 56
  const r = 12
  const t = 16
  const b = 40
  const x = i => l + (i / n) * (W - l - r)
  const y = v => t + (1 - v / mx) * (H - t - b)
  const cut = x(30 / h.w)
  const gridlines = []
  for (let v = 0; v <= mx; v += 1000) gridlines.push(v)

  return (
    <Box>
      <BoxTitle>Where the identity cutoff sits</BoxTitle>
      <Sub>
        Best alignment per pair of centroids, for every pair with E &lt; 10⁻⁵,
        binned by percent identity. Hover a bar for the count.
      </Sub>
      <ChartScroll onPointerLeave={() => setTip(null)}>
        <Plot
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Histogram of percent identity for centroid pairs with E-value below 1e-5"
        >
          {gridlines.map(v => (
            <g key={v}>
              <line x1={l} x2={W - r} y1={y(v)} y2={y(v)} stroke={SUNK} />
              <text x={l - 8} y={y(v) + 4} textAnchor="end">
                {fmt(v)}
              </text>
            </g>
          ))}
          {Array.from({ length: n / 2 + 1 }, (_, k) => k * 2).map(i => (
            <text key={i} x={x(i)} y={H - b + 18} textAnchor="middle">
              {i * h.w}%
            </text>
          ))}
          <text x={(l + W - r) / 2} y={H - 4} textAnchor="middle">
            Identity of the best alignment
          </text>
          {h.counts.map((c, i) => (
            <rect
              key={i}
              x={x(i) + 1}
              y={y(c)}
              width={Math.max(x(i + 1) - x(i) - 2, 1)}
              height={y(0) - y(c)}
              rx="2"
              fill={i * h.w >= 30 ? "#4f5aa0" : LINE}
              onPointerMove={ev =>
                setTip({
                  x: ev.clientX,
                  y: ev.clientY,
                  title: `${i * h.w}% to ${(i + 1) * h.w}%`,
                  line: `${fmt(c)} pairs`,
                })
              }
            />
          ))}
          <line
            x1={cut}
            x2={cut}
            y1={t - 6}
            y2={y(0)}
            stroke={INK}
            strokeDasharray="4 4"
          />
          <text x={cut - 6} y={t + 4} textAnchor="end" className="strong">
            cutoff 30%
          </text>
        </Plot>
      </ChartScroll>
      <Sub>
        Almost every pair that passes the E-value rule is at 20% identity or
        more, and most sit between 35% and 50%: these are the many members of
        the α/β-hydrolase component aligned to each other. The pairs below 30%
        (grey) are links the cutoff refuses. They matter far more than their
        number suggests, because one such link is enough to join two components.
      </Sub>
      {tip && (
        <Tip style={{ transform: tipTransform(tip) }}>
          <b>{tip.title}</b>
          <span>{tip.line}</span>
        </Tip>
      )}
    </Box>
  )
}

/* ---------- components by size ---------- */

export const ComponentSizes = () => {
  const rows = Object.entries(D.size_hist)
    .map(([k, n]) => [+k, n])
    .sort((a, b) => b[0] - a[0])
  const top = Math.max(...rows.map(r => r[1]))
  return (
    <Box>
      <BoxTitle>Component sizes</BoxTitle>
      <Sub>Components by number of centroids.</Sub>
      <Bars>
        {rows.map(([k, n]) => (
          <BarRow
            key={k}
            title={`${n} component${n > 1 ? "s" : ""} of ${k} centroid${k > 1 ? "s" : ""}`}
          >
            <span>
              {k} centroid{k > 1 ? "s" : ""}
            </span>
            <BarTrack aria-hidden="true">
              <i style={{ width: `${(100 * n) / top}%` }} />
            </BarTrack>
            <span>{n}</span>
          </BarRow>
        ))}
      </Bars>
    </Box>
  )
}

/* ---------- styles ---------- */

/* One row per key: what the colour means, then what the shape means. */
const Legend = styled.div`
  display: grid;
  gap: 0.35rem;
`

const LegendLabel = styled.b`
  min-width: 7.5rem;
  color: ${INK};
  font-weight: 600;
`

const MapBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;

  input {
    ${fieldStyle}
    flex: 1 1 14rem;
    min-width: 0;
  }
`

const Zoom = styled.div`
  display: flex;

  button {
    min-width: 2.2rem;
    padding: 0.35rem 0.65rem;
    border: 1px solid ${FRAME};
    background: ${PANEL};
    color: ${INK};
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }

  button + button {
    border-left: 0;
  }

  button:first-child {
    border-radius: 8px 0 0 8px;
  }

  button:last-child {
    border-radius: 0 8px 8px 0;
  }

  button:hover,
  button:focus-visible {
    background: ${SUNK};
  }

  button[aria-pressed="true"] {
    background: ${SUNK};
    font-weight: 600;
  }
`

const LegendButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.1rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: none;
  color: ${INK_SOFT};
  font: inherit;
  cursor: pointer;

  &:hover,
  &[aria-pressed="true"] {
    border-color: ${INK_SOFT};
    color: ${INK};
  }
`

const MapSvg = styled.svg`
  display: block;
  width: 100%;
  height: auto;
  cursor: ${({ $drag }) => ($drag ? "grabbing" : "grab")};

  .grp {
    cursor: move;
  }

  .domhead {
    cursor: move;
  }

  .dom {
    fill: rgba(0, 0, 0, 0.025);
    stroke: ${LINE};
    stroke-width: 0.12;
    stroke-dasharray: 0.5 0.35;
  }
  touch-action: none;
  user-select: none;

  .nd {
    cursor: pointer;
    transition: opacity 0.15s;
  }

  text {
    fill: ${INK};
    font-family: inherit;
  }

  text.sub {
    fill: ${MUTED};
  }

  text.lab {
    paint-order: stroke;
    stroke: ${PANEL};
    stroke-linejoin: round;
  }

  @media (prefers-reduced-motion: reduce) {
    .nd {
      transition: none;
    }
  }
`

const Panel = styled.p`
  && {
    min-height: 1.5em;
    color: ${INK_SOFT};
    font-size: 0.85rem;
  }

  b {
    color: ${INK};
  }
`

const ClearButton = styled.button`
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
`

const CompButtons = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    max-width: 100%;
    padding: 0.2rem 0.6rem;
    border: 1px solid ${FRAME};
    border-radius: 999px;
    color: ${INK};
    font-size: 0.78rem;
    text-decoration: none;
  }

  a span {
    max-width: 22ch;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  a:hover,
  a:focus-visible,
  a[aria-pressed="true"] {
    background: ${SUNK};
  }

  a[aria-pressed="true"] {
    border-color: ${INK};
  }

  small {
    color: ${MUTED};
    font-variant-numeric: tabular-nums;
  }
`

const Break = styled.span`
  flex-basis: 100%;
  height: 0;
`

const FlowGrid = styled(Flow)`
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(
      0,
      1fr
    ) auto minmax(0, 1fr);

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Tag = styled.div`
  color: ${MUTED};
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const Plot = styled.svg`
  text {
    fill: ${INK_SOFT};
    font-size: 11px;
  }

  .strong {
    fill: ${INK};
    font-weight: 600;
  }

  rect:hover {
    opacity: 0.8;
  }
`

const Bars = styled.div`
  display: grid;
  gap: 0.3rem;
  max-width: 40rem;
`

const BarRow = styled.div`
  display: grid;
  grid-template-columns: 8.5rem minmax(0, 1fr) 3rem;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.86rem;

  & > span:last-child {
    justify-self: end;
    color: ${INK_SOFT};
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 640px) {
    grid-template-columns: 6.5rem minmax(0, 1fr) 2.6rem;
    gap: 0.5rem;
    font-size: 0.8rem;
  }
`

const BarTrack = styled.span`
  display: flex;
  height: 1.1rem;
  border-radius: 4px;
  background: ${SUNK};
  overflow: hidden;

  i {
    height: 100%;
    background: ${INK_SOFT};
  }
`
