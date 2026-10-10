import React, { useEffect, useRef, useState } from "react";
import hardwareCode from "../generated/hardwareCode.json";

const findFile = (name) => hardwareCode[name] ?? null;

// general dropdown
export function Dropdown({ title, description, defaultOpen = false, children }) {
  return (
    <details className="dd" open={defaultOpen}>
      <style>{css}</style>
      <summary className="dd-summary">
        <span className="dd-chevron" aria-hidden="true" />
        <span className="dd-title">{title}</span>
        {description && <span className="dd-desc">{description}</span>}
      </summary>
      <div className="dd-body">{children}</div>
    </details>
  );
}

// code version for hardware bioreactor files
export function CodeDropdown({
  file, title, language, code, description, defaultOpen = false, children,
}) {
  const bodyRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const resolved = code ?? (file ? findFile(file) : null);
  const name = title ?? file;
  const lang = language ?? (file ? file.split(".").pop() : undefined);

  const copy = async () => {
    const text = resolved ?? bodyRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <details className="dd dd-code" open={defaultOpen}>
      <style>{css}</style>
      <summary className="dd-summary">
        <span className="dd-chevron" aria-hidden="true" />
        <span className="dd-title dd-mono">{name}</span>
        {lang && <span className="dd-lang">{lang}</span>}
        {description && <span className="dd-desc">{description}</span>}
      </summary>
      <div className="dd-body dd-codebody">
        <button type="button" className="dd-copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
        <div ref={bodyRef}>
          {resolved != null ? (
            <pre><code>{resolved}</code></pre>
          ) : file ? (
            <pre><code>File not found: {file}</code></pre>
          ) : (
            children
          )}
        </div>
      </div>
    </details>
  );
}

export default Dropdown

const css = `
.dd {
  --dd-border: var(--border, rgba(127, 127, 127, 0.35));
  --dd-bg: var(--surface, rgba(127, 127, 127, 0.06));
  --dd-accent: var(--accent, currentColor);
  border: 1px solid var(--dd-border);
  border-radius: 8px;
  background: var(--dd-bg);
  margin: 1rem 0;
}
.dd-code pre {
  margin: 0; padding: 1rem; overflow-x: auto; max-height: 32rem; overflow-y: auto;
  font-size: 0.85rem; line-height: 1.5; tab-size: 2; background: transparent; border: 0; border-radius: 0 0 8px 8px;
  color: #000;
}
.dd-code pre code {
  color: #000;
  background: transparent;
}
.dd-summary {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  cursor: pointer;
  list-style: none;
  font-weight: 600;
}
.dd-summary::-webkit-details-marker { display: none; }
.dd-summary:focus-visible { outline: 2px solid var(--dd-accent); outline-offset: 2px; border-radius: 8px; }
.dd-chevron {
  width: 0.5rem; height: 0.5rem; flex: none;
  border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;
  transform: rotate(-45deg);
  transition: transform 0.15s ease;
}
.dd[open] > .dd-summary .dd-chevron { transform: rotate(45deg); }
.dd-desc { margin-left: auto; font-weight: 400; opacity: 0.7; font-size: 0.9em; }
.dd-body { padding: 0.25rem 1rem 1rem; border-top: 1px solid var(--dd-border); }

/* Code variant */
.dd-mono, .dd-code pre, .dd-code code {
  font-family: ui-monospace, "JetBrains Mono", "Fira Code", SFMono-Regular, Menlo, Consolas, monospace;
}
.dd-title.dd-mono { font-weight: 500; font-size: 0.92em; }
.dd-lang {
  font-size: 0.75em; padding: 0.1rem 0.45rem; border-radius: 4px;
  border: 1px solid var(--dd-border); opacity: 0.8; font-weight: 400;
}
.dd-codebody { position: relative; padding: 0; }
.dd-code pre {
  margin: 0; padding: 1rem; overflow-x: auto; max-height: 32rem; overflow-y: auto;
  font-size: 0.85rem; line-height: 1.5; tab-size: 2; background: transparent; border: 0; border-radius: 0 0 8px 8px;
}
.dd-copy {
  position: absolute; top: 0.5rem; right: 0.6rem; z-index: 1;
  font: inherit; font-size: 0.75rem; padding: 0.2rem 0.55rem; cursor: pointer;
  color: inherit; background: var(--dd-bg); border: 1px solid var(--dd-border); border-radius: 4px;
}
.dd-copy:hover { border-color: var(--dd-accent); }
.dd-copy:focus-visible { outline: 2px solid var(--dd-accent); }

@media (prefers-reduced-motion: reduce) { .dd-chevron { transition: none; } }
`