# Wiki Content Authoring

This wiki now supports author-owned content in `src/content/wiki`. Subteams should edit MDX files and open pull requests instead of asking the web team to rewrite React page code.

## Workflow

1. Create a branch for your page or section.
2. Edit the matching `index.mdx` file in `src/content/wiki`.
3. Keep the frontmatter at the top of the file.
4. Run `npm run validate:content`.
5. Run `npm run build` before requesting review.
6. Open a pull request and tag the web team plus the relevant subteam lead.

## Frontmatter

Every wiki MDX page must include:

```yaml
---
title: "Project Description"
section: "Project"
path: "/project/description/"
navTitle: "Project Description"
order: 10
description: "One sentence page summary."
owners: ["Project Leads", "Dry Lab"]
updated: "2026-05-16"
status: "draft"
---
```

Use `draft`, `review`, or `published` for `status`. Paths must start and end with `/`, and each path must be unique.

## Markdown

Use normal Markdown for most content:

```md
## Heading

Short paragraphs are easier to scan.

- Use bullets for lists.
- Use tables for structured comparisons.
- Use links when a reader needs source context.
```

## Curated Components

Use only the approved components below. Do not import arbitrary React components from MDX.

### Callout

```mdx
<Callout title="Review needed">
Ask the relevant lead to check this claim before marking the page as published.
</Callout>
```

Optional tones: `note`, `success`, `warning`.

### Figure

```mdx
<Figure
  src="/images/mapleleaf.jpeg"
  alt="Maple leaf placeholder image"
  caption="Replace this with a useful figure caption."
/>
```

Place public assets in `static/images` and reference them with `/images/file-name.ext`.

### ImageGrid

```mdx
<ImageGrid>
  <Figure src="/images/mapleleaf.jpeg" alt="First image" caption="First result." />
  <Figure src="/images/mapleleaf.jpeg" alt="Second image" caption="Second result." />
</ImageGrid>
```

### DataTable

```mdx
<DataTable caption="Candidate shortlist">

| Candidate | Reason | Status |
| --- | --- | --- |
| Example enzyme | High-priority placeholder. | Draft |

</DataTable>
```

## Pull Request Checklist

- `npm run validate:content` passes.
- `npm run build` passes.
- Page has a clear description and owner list.
- Images have meaningful `alt` text.
- Claims that need scientific, safety, or stakeholder review are marked clearly.
- The page looks good on desktop and mobile before merging.

### Interactive Gizmos

Approved interactive components (sliders, simulators, etc.) can be dropped **inline, in the middle of a page**:

```mdx
<InteractiveGizmo
  name="growthCurve"
  title="Logistic growth model"
  config={{ "growthRate": 0.5, "carryingCapacity": 200 }}
  caption="Drag the sliders to explore the model."
/>
```

- `name` picks an approved gizmo from the registry (`src/components/mdx/interactive/registry.js`).
- `config` is optional JSON passed to the gizmo as props; omit it to use defaults.
- Unknown names render a visible notice instead of breaking the build.

Available gizmos: `growthCurve` (logistic growth simulator). More can be added by the web team.

## Payload CMS

The same components are available as visual blocks in **Payload** (Wiki → Wiki Pages → Content tab). Authors can use Callout, Figure, Image Grid, Data Table, and **Interactive Gizmo** without writing MDX. Because blocks render in order, an Interactive Gizmo block placed between two text blocks appears in the middle of the page. Publishing exports them to the same component tags above.

Run `npm run test:payload-blocks` to verify block → MDX rendering offline.

### Adding a new interactive gizmo (web team)

1. Build an SSR-safe React component in `src/components/mdx/interactive/` (React state + SVG/canvas is fine; guard any `window`/`document` access so the Gatsby build can server-render it).
2. Register it under a stable key in `src/components/mdx/interactive/registry.js`.
3. Add the same key to the `gizmo` select options in `cms/payload-app/src/blocks/wikiContentBlocks.ts`.
4. `npm run test:payload-blocks` and `npm run build:gatsby` to confirm it renders.

The export pipeline and MDX wiring need no changes — gizmos flow through the single `<InteractiveGizmo>` component.
