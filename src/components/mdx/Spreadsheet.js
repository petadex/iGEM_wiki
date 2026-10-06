import React, { useEffect, useState } from "react"
import styled, { css } from "styled-components"

/**
 * Read-only spreadsheet viewer for MDX pages: one tab per sheet, values as
 * the workbook displays them. Workbooks are converted to JSON (text + style
 * flags per cell) and live in src/data/sheets; each one loads on its own
 * chunk so it doesn't weigh down the page.
 *
 * Cell flags: b bold, i italic, n number, H header band, T tan band, G grey,
 * B input (blue), L linked from another sheet (green), X sheet title, U url.
 */
const WORKBOOKS = {
  "petascale-build": () => import("../../data/sheets/petascale-build.json"),
}

/** Excel column width (characters) → CSS min width. */
const colWidth = chars => `${Math.round(chars * 7 + 12)}px`

export const Spreadsheet = ({ sheet, title, note }) => {
  const [book, setBook] = useState(null)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    let live = true
    WORKBOOKS[sheet]?.().then(mod => live && setBook(mod.default || mod))
    return () => {
      live = false
    }
  }, [sheet])

  const current = book?.sheets[tab]
  // The first row is the sheet's own title; the tab already says it.
  const rows = current?.rows.filter(
    (row, i) => !(i === 0 && row[0]?.[1].includes("X")),
  )

  return (
    <Wrap>
      <Head>
        {title && <Title>{title}</Title>}
        <Legend aria-hidden>
          <Swatch $flag="B">Inputs</Swatch>
          <Swatch $flag="L">From other sheets</Swatch>
        </Legend>
      </Head>
      {note && <Note>{note}</Note>}
      {!book ? (
        <Loading>Loading spreadsheet…</Loading>
      ) : (
        <>
          <Tabs role="tablist" aria-label={`${title || "Spreadsheet"} sheets`}>
            {book.sheets.map((s, i) => (
              <Tab
                key={s.name}
                type="button"
                role="tab"
                aria-selected={i === tab}
                $on={i === tab}
                onClick={() => setTab(i)}
              >
                {s.name}
              </Tab>
            ))}
          </Tabs>
          <Scroller role="tabpanel" tabIndex={0} aria-label={current.name}>
            <Table>
              <colgroup>
                {current.widths.map((w, i) => (
                  <col key={i} style={{ minWidth: colWidth(w) }} />
                ))}
              </colgroup>
              <tbody>
                {rows.map((row, r) =>
                  row.length === 0 ? (
                    <Gap key={r}>
                      <td colSpan={current.widths.length} />
                    </Gap>
                  ) : (
                    <tr key={r}>
                      {current.widths.map((w, c) => {
                        const cell = row[c]
                        const flags = cell?.[1] || ""
                        const text = cell?.[0] ?? ""
                        return (
                          <Cell
                            key={c}
                            $flags={flags}
                            $first={c === 0}
                            style={{ minWidth: colWidth(w) }}
                          >
                            {flags.includes("U") &&
                            /^https?:\/\//.test(text) ? (
                              <a
                                href={text}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {text}
                              </a>
                            ) : (
                              text
                            )}
                          </Cell>
                        )
                      })}
                    </tr>
                  ),
                )}
              </tbody>
            </Table>
          </Scroller>
        </>
      )}
    </Wrap>
  )
}

const HEADER = "#938953"
const TAN = "#e6e1c8"
const GREY = "#f2f2f2"
const INPUT = "#1b4fd8"
const LINKED = "#2e7d32"

const Wrap = styled.figure`
  margin: var(--space-lg) 0;
  min-width: 0;
`

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 1rem;
  margin-bottom: var(--space-sm);
`

const Title = styled.span`
  color: var(--color-text);
  font-weight: 700;
`

const Legend = styled.span`
  display: flex;
  gap: 0.9rem;
  font-size: 0.78rem;
`

const Swatch = styled.span`
  font-weight: 600;
  color: ${({ $flag }) => ($flag === "B" ? INPUT : LINKED)};
`

const Note = styled.p`
  margin: 0 0 var(--space-sm) !important;
  font-size: 0.85rem;
`

const Loading = styled.div`
  padding: 2rem;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-muted);
  font-size: 0.9rem;
  text-align: center;
`

const Tabs = styled.div`
  display: flex;
  gap: 0.3rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
  scrollbar-width: thin;
`

const Tab = styled.button`
  flex: none;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: ${({ $on }) => ($on ? HEADER : "transparent")};
  color: ${({ $on }) => ($on ? "#fff" : "var(--color-text)")};
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ $on }) => ($on ? HEADER : "rgba(147, 137, 83, 0.12)")};
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const Scroller = styled.div`
  max-height: min(70vh, 40rem);
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fff;
  overscroll-behavior: contain;

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const Table = styled.table`
  /* Undo the page's prose table styles. */
  && {
    width: auto;
    max-width: none;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.78rem;
    line-height: 1.35;
  }
`

const Gap = styled.tr`
  height: 0.6rem;

  && td {
    padding: 0;
    border: 0;
  }
`

const Cell = styled.td`
  && {
    padding: 0.3rem 0.55rem;
    border: 0;
    border-bottom: 1px solid #ecebe6;
    color: var(--color-text);
    vertical-align: top;
    white-space: nowrap;
    background: #fff;
  }

  ${({ $flags }) => css`
    && {
      ${
        $flags.includes("n") &&
        css`
          text-align: right;
          font-variant-numeric: tabular-nums;
        `
      }
      ${
        !$flags.includes("n") &&
        css`
          white-space: normal;
          max-width: 24rem;
        `
      }
      ${$flags.includes("b") && "font-weight: 700;"}
      ${$flags.includes("i") && "font-style: italic; color: var(--color-muted);"}
      ${$flags.includes("B") && `color: ${INPUT};`}
      ${$flags.includes("L") && `color: ${LINKED};`}
      ${$flags.includes("T") && `background: ${TAN};`}
      ${$flags.includes("G") && `background: ${GREY};`}
      ${$flags.includes("H") && `background: ${HEADER}; color: #fff;`}
    }
  `}

  /* Row labels stay put while the months scroll sideways. */
  ${({ $first }) =>
    $first &&
    css`
      && {
        position: sticky;
        left: 0;
        z-index: 1;
        box-shadow: 1px 0 0 #ecebe6;
      }
    `}
`

export default Spreadsheet
