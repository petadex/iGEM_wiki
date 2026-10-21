import React from "react"
import { referenceId } from "./referenceIds.js"

const References = ({ items = [] }) => {
  const seenIds = new Set()
  const references = items.filter((item) => {
    const id = referenceId(item?.number)
    if (!id || !item?.text || seenIds.has(id)) return false
    seenIds.add(id)
    return true
  })

  if (references.length === 0) return null

  return (
    <section className="references" aria-label="References">
      <ol>
        {references.map((item) => (
          <li id={referenceId(item.number)} key={referenceId(item.number)}>
            {item.text}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default References
