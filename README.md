# iGEM Toronto 2026 — Wiki

Built with **Gatsby**, **Styled Components**, **MDX**, and an optional **Payload CMS** pilot for visual editing.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v20 recommended
- [Git](https://git-scm.com/)

If you use `nvm`:

```bash
nvm use
```

---

## Getting Started

```bash
git clone https://github.com/petadex/iGEM_wiki.git
cd iGEM_wiki
npm install
npm run develop
```

Open **http://localhost:8000**

---

## Project Structure

```
src/
├── components/
│   ├── layout.js          ← WikiLayout shell (nav, footer, page chrome)
│   ├── WikiTopBar.js      ← Site navigation
│   └── mdx/               ← MDX shortcodes (Callout, Figure, etc.)
├── content/wiki/          ← Wiki pages as MDX (frontmatter drives routing)
├── pages/                 ← React-only routes (home, team, dry-lab map, 404)
├── styles/globalStyles.js ← Design tokens
├── templates/wiki-mdx.js  ← Layout wrapper for MDX pages
└── data/                  ← Team CSV, sponsor placeholders

cms/payload-app/           ← Payload CMS (optional authoring UI)
scripts/validate-content.mjs
docs/vercel-demo-deployment.md  ← Hosted team demo guide
```

Most wiki pages live in `src/content/wiki/**/index.mdx`. Use `src/content/wiki/_template.mdx` for new pages.

## Citations in MDX

To add citations to a wiki page, create `references.bib` beside that page's
`index.mdx`:

```text
src/content/wiki/project/description/
├── index.mdx
└── references.bib
```

Add normal BibTeX records to `references.bib`, using a unique citation key:

```bibtex
@article{austin2018,
  author = {Austin, Harry P. and others},
  title = {Characterization and engineering of a plastic-degrading aromatic polyesterase},
  journal = {Proceedings of the National Academy of Sciences},
  year = {2018},
  doi = {10.1073/pnas.1718804115}
}
```

Use the key in MDX with Pandoc-style citation syntax:

```md
PETase can break down PET under laboratory conditions [@austin2018].
Several studies support this claim [@austin2018; @anotherStudy].
A specific passage can include a locator [@austin2018, p. 3].
```

The site renders linked Vancouver-style numbers and automatically appends a
References section containing only sources cited on that page. Clicking an
in-text number scrolls to its bibliography entry.

---

## Useful Commands

| Command | What it does |
| --- | --- |
| `npm run develop` | Start local Gatsby dev server |
| `npm run build` | Validate content, then build for production |
| `npm run build:igem` | Build GitLab Pages output with the `/toronto` path prefix |
| `npm run validate:content` | Check MDX frontmatter and route collisions |
| `npm run serve` | Preview production build locally |
| `npm run clean` | Clear Gatsby cache |
| `npm run sync:igem` | Push GitHub `main` to a new iGEM GitLab merge-request branch |
| `npm run payload:develop` | Payload admin at http://localhost:3000/admin |
| `npm run payload:import-mdx` | Import existing MDX into Payload |
| `npm run payload:export` | Export published Payload pages to MDX |
| `npm run payload:sync` | Export + validate |
| `npm run build:demo` | Sync from hosted Payload + Gatsby build (Vercel) |

---

## Payload CMS & Vercel demo

See `docs/payload-cms-workflow.md` (local) and **`docs/vercel-demo-deployment.md`** (hosted demo).

---

## Contributing

1. Never push directly to `main`
2. Create a branch for your work
3. Run `npm run validate:content` and `npm run build`
4. Open a pull request

---

## Sync GitHub main to iGEM GitLab

GitHub is the source of truth. After changes are merged into GitHub `main`, sync
them to the protected iGEM GitLab repository.
Do not force-push either `main` branch.

GitHub Actions automatically merges and pushes to GitLab `main` after each push
to GitHub `main`. It requires the `IGEM_GITLAB_TOKEN` GitHub Actions secret and
permission for that token's account to push to GitLab's protected `main` branch.

Configure the iGEM remote once:

```bash
git remote get-url igem || \
  git remote add igem https://gitlab.igem.org/2026/toronto.git
```

If the automatic workflow fails, run this manual fallback:

```bash
npm run sync:igem
```

Git prints a link for opening the GitLab merge request. Open it, confirm the
target is `main`, and merge it. The iGEM GitLab Pages pipeline runs after that
merge. If the merge command reports conflicts, resolve and test them before
pushing the sync branch.

---

_iGEM Toronto 2026 — University of Toronto_
