import React from "react"
import styled from "styled-components"

export function PanelChrome({ title, onHide, hideLabel }) {

  return (
    <ChromeBar>
      {title ? <ChromeTitle>{title}</ChromeTitle> : <span />}
      <HideBtn type="button" onClick={onHide} title={hideLabel} aria-label={hideLabel}>
        {hideLabel}
      </HideBtn>
    </ChromeBar>
  )
}

export function RestorePanelBar({ label, onRestore }) {
  return (
    <RestoreBar>
      <RestoreBtn type="button" onClick={onRestore} aria-label={label}>
        {label}
      </RestoreBtn>
    </RestoreBar>
  )
}

const ChromeBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 0.5rem var(--space-md);
  border-bottom: 1px solid var(--cal-line, var(--color-border));
  background: var(--cal-chrome, color-mix(in srgb, var(--color-bg) 50%, #fff));
  flex-shrink: 0;
`

const ChromeTitle = styled.span`
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--cal-muted, var(--color-muted));
`

const HideBtn = styled.button`
  border: 1px solid var(--cal-line, var(--color-border));
  background: var(--cal-surface, #fff);
  color: var(--cal-accent, #2d9194);
  font-family: var(--font-body);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: var(--cal-hover, #e2f6e2);
    border-color: var(--cal-accent, #2d9194);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

const RestoreBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  background: color-mix(in srgb, var(--cal-accent, #2d9194) 8%, var(--cal-surface, var(--color-bg)));
  border-bottom: 1px solid var(--cal-line, var(--color-border));
  flex-shrink: 0;
`

const RestoreBtn = styled.button`
  border: none;
  background: transparent;
  color: var(--cal-accent, #2d9194);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: var(--cal-ink, #06202b);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`

export default PanelChrome
