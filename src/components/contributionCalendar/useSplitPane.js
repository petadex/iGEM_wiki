import { useCallback, useEffect, useRef, useState } from "react"

const STORAGE_KEY = "contribution-calendar-split-v3"
const DEFAULT_SPLIT = 36
const MIN_SPLIT = 18
const MAX_SPLIT = 45

function readStoredSplit() {
  if (typeof window === "undefined") return DEFAULT_SPLIT
  try {
    const v = parseFloat(window.localStorage.getItem(STORAGE_KEY))
    if (Number.isFinite(v) && v >= MIN_SPLIT && v <= MAX_SPLIT) return v
  } catch {
    /* ignore */
  }
  return DEFAULT_SPLIT
}

/**
 * Draggable split between detail (left) and calendar (right) as % width for the left pane.
 */
export function useSplitPane() {
  const [splitPct, setSplitPct] = useState(DEFAULT_SPLIT)
  const containerRef = useRef(null)
  const draggingRef = useRef(false)
  const splitRef = useRef(splitPct)
  splitRef.current = splitPct

  useEffect(() => {
    const stored = readStoredSplit()
    splitRef.current = stored
    setSplitPct(stored)
  }, [])

  const persistSplit = useCallback((pct) => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(STORAGE_KEY, String(pct))
    } catch {
      /* ignore */
    }
  }, [])

  const onDividerPointerDown = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault()
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const pct = (x / rect.width) * 100
      const clamped = Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, pct))
      splitRef.current = clamped
      setSplitPct(clamped)
    }

    const onUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      persistSplit(splitRef.current)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [persistSplit])

  const nudgeSplit = useCallback((delta) => {
    setSplitPct((pct) => {
      const next = Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, pct + delta))
      persistSplit(next)
      return next
    })
  }, [persistSplit])

  return {
    splitPct,
    setSplitPct,
    nudgeSplit,
    containerRef,
    onDividerPointerDown,
  }
}
