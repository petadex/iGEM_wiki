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

## Payload CMS

The same components are available as visual blocks in **Payload** (Wiki → Wiki Pages → Content tab). Authors can use Callout, Figure, Image Grid, and Data Table without writing MDX. Publishing exports them to the same component tags above.

Run `npm run test:payload-blocks` to verify block → MDX rendering offline.
