# The adjacency landscape (story mode)

An interactive 3D view of the PETadex enzyme atlas, in fourteen narrated steps.
It already ships on the Dry Lab overview page. This is what changed, how to use
it elsewhere, and how to update it.

---

## What changed

The embedded copy used to be the whole presentation figure, opened on its Story
panel with a `#8` on the URL. The panel strip at the bottom was still live, so a
reader could click into panels 1–7, which are built for a conference talk and
make no sense on a wiki page.

It is now **the Story panel alone**:

- `goTo` refuses any index but the story panel, which closes the panel strip,
  the keyboard shortcuts and the URL hash in one place.
- The strip, the provenance stamp and the depth scale are hidden.
- `src` no longer needs `#8` — it opens there.

Panels 1–7 are still *in* the file. They share almost every code path with the
stacked panel the story is built on, and cutting them out would be a rewrite
with a lot of ways to go subtly wrong. Making them unreachable is the same
result for a reader at a fraction of the risk.

Everything the story uses came across: all fourteen steps, the view tabs, the
hover cards, the simulated volume with its turntable, both of its buttons, and
the narration.

It also got lighter:

| | before | after |
|---|---|---|
| images (9 structures, 5 site photos) | 580 KB | 248 KB |
| on disk | 2.13 MB | 1.84 MB |
| **over the wire, gzipped** | ~950 KB | **~617 KB** |

The structure renders are 700 px and are drawn about 100 px wide, so they are
resized to 224 px on the way through. `KNN_EDGES` is emptied: it fed a "graph"
view of the interpretation layer that no longer exists, so 73 KB was being
parsed into a geometry on every load and never drawn.

Two further savings were considered and rejected: trimming the surface grids to
two decimals saves 31 KB gzipped and risks visible terracing on the depth
surfaces, and a tree-shaken three.js build might save 80 KB for a real chance of
breaking the scene.

---

## Use it on a page

```mdx
<InteractiveEmbed
  src="/figures/dry-lab-landscape/landscape.html"
  title="The PETadex adjacency landscape"
  caption="…"
  dark
/>
```

`InteractiveEmbed` renders the frame at a logical size and scales it to fit,
which is what keeps the layout right — the figure puts its caption on the left
and its step list on the right and needs the width. Do not swap it for a plain
iframe.

---

## Updating it

The figure is **generated**. It is built in the `petadex-adjacency-landscape`
repo (a sibling checkout) and synced here:

```bash
cd ../petadex-adjacency-landscape
python make_landscapes.py                  # rebuild from data + narrative.txt
cd ../iGEM_wiki
node scripts/sync-landscape-figure.mjs     # copy, patch and convert into static/
```

Then commit what changed under `static/figures/dry-lab-landscape/`.

**Do not edit the copy under `static/`.** The next sync overwrites it. The
narration is one line per step in `narrative.txt` in the other repo, and that is
the file to change for wording.

Captions can link to where a step is written up: `[[label|/dry-lab/model/#anchor]]`
anywhere on the line. Links are set small under the caption with a ↗, open in a
new tab so the reader keeps their step, and are written relative to `static/figures/dry-lab-landscape/` so they
work under the iGEM path prefix. The anchor is the heading's slug on that page,
so **renaming a Model or Software heading breaks its link here** — check
`narrative.txt` when you do.

The sync asserts on every patch site — the wheel guard, the five story patches,
`KNN_EDGES`. If the figure changes shape upstream it fails with the name of the
patch that no longer matches, rather than quietly shipping a page with a live
panel strip. If you see that error, the fix is in
`scripts/sync-landscape-figure.mjs`, not in the copy.

---

## How it behaves

- **Fourteen steps.** ↑ Back / ↓ Next, the step list on the right, or ↑ ↓.
  ← → move sideways through a layer's views. The last step pulls back to an
  overview of all three layers.
- **The wheel is left to the host page.** Deliberate: inside an iframe the
  figure's own scroll handling would swallow the page's scroll. Stepping is by
  button, list and arrow key.
- **Hover cards** on most marks; hold or click to pin one so the pointer can
  move into it and use its links.
- **Two buttons** appear in the step list where they apply: Stop spin (the slow
  turntable on steps 1c, 1d and the overview) and Show names (reference enzyme
  labels, hidden while the view turns because they crowd each other).
- **Dark by design.** It draws its own dark ground; it does not follow the
  wiki's light theme. That is why the embed passes `dark`.

---

## Caveats

- **The third axis in step 1c is simulated.** The volume the dataset grows into
  is a presentational device, not a 3D projection — the public atlas export is
  2D. It is deliberately not labelled as such on the page, so captions and
  talks should not describe it as a 3D embedding.
- **Width.** Laid out for a wide frame. `InteractiveEmbed` scales it, so it
  stays legible, but on a phone it will be small. It has not been designed for
  phones.
- **WebGL.** No fallback. Without it the plane and labels draw but the surfaces
  do not.
- **Reduced motion** is honoured for step transitions; the turntable still
  turns, and Stop spin is the control.

---

## If something looks wrong

| Symptom | Likely cause |
|---|---|
| Panel strip visible at the bottom | Sync not rerun after an upstream change, or a patch silently skipped — rerun and read its output |
| Frame stays dark | `vendor/three.min.js` missing from the commit |
| Structures or photos missing | `.avif` files not committed, or `GATSBY_PATH_PREFIX` wrong |
| Page scroll jumps when the cursor is over the figure | The wheel guard did not apply; check the sync's assertion |
| Wording changes not showing | `make_landscapes.py` not rerun before the sync |

One thing found while verifying this, unrelated to the figure: an incremental
`npm run build` did not pick up an edit to `index.mdx` — the page was served
from cache and the old copy shipped. And `npm run clean && npm run build` exits
1 on this checkout with a run of `ERROR UNKNOWN` against `src/data/sponsors.js`,
before any page is written. That reproduces with the landscape changes reverted,
so it predates them, but it means the cache is currently load-bearing: a clean
build does not succeed. Worth fixing before anyone relies on `npm run clean` to
pick up content edits.
