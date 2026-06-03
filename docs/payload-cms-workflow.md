# Payload CMS Pilot Workflow

Payload is the current CMS pilot. It controls wiki pages through an authoring workflow: published Payload pages are exported to static MDX before Gatsby builds the wiki.

## Start The CMS

```bash
npm run payload:develop
```

Open `http://localhost:3000/admin` and create the first admin user.

The root script starts Payload with Next's webpack dev server instead of Turbopack because the Payload admin can show noisy hydration overlays in Turbopack dev mode.

## Load Existing Wiki Pages For Demo

Run this once after starting the Payload pilot, or run it again any time you want to refresh Payload from the current MDX files:

```bash
npm run payload:import-mdx
```

This imports the existing section pages into **Wiki > Wiki Pages**. Current MDX draft pages stay as Payload drafts, so they are visible in the CMS for demo and editing but do not export over the existing Gatsby routes until someone intentionally publishes them.

Once an imported page is published in Payload, its exported MDX becomes the Gatsby source for that route. If an older hand-written MDX page has the same `path`, Gatsby intentionally uses the Payload export and treats the old MDX file as a fallback copy during the pilot.

## Create A Page

1. Go to **Wiki > Wiki Pages**.
2. Create a new page.
3. Fill the **Page** tab: title, section, path, nav title, order, description, owners, and updated date.
4. Use the **Content** tab to add visual blocks (each maps to an approved MDX component in `src/components/mdx/wikiComponents.js`):
   - **Rich Text** for headings, paragraphs, links, and lists.
   - **Callout** → `<Callout>` (tones: note, success, warning).
   - **Figure** → `<Figure>` (Media upload or static `src`, alt, caption, optional credit).
   - **Image Grid** → `<ImageGrid>` with multiple figures side by side.
   - **Data Table** → `<DataTable>` with a markdown table body.
   - **Markdown / MDX** only as an escape hatch for web members.

   See `docs/content-authoring.md` for MDX examples subteams can mirror in Payload.
5. Save draft while editing.
6. Publish only when the page is ready to export.

## Add Images And Files

Use **Media** in Payload to upload images, then choose that image from a **Figure** block on a Wiki Page. The upload itself stays inside the local Payload app at `cms/payload-app/media`, which is not part of the final Gatsby site.

When a page is exported, selected Payload media files are copied into `static/payload-media`, and the generated MDX references them as `/payload-media/file-name.ext`. Commit the exported MDX and the copied static media files for the final wiki.

For iGEM safety, do not use Payload media URLs like `http://localhost:3000/api/media/file/...` in final content. The final wiki should reference only local static files.

## Export To Gatsby

Payload automatically runs `npm run payload:export` when a Wiki Page is published or deleted. This keeps local publishing lighter than running full validation every time, and the exporter only rewrites files whose content actually changed.

The branch is set up so Payload-exported pages win route conflicts. That means a member can edit `/project/description/` in Payload, publish it, and Gatsby will use the generated file in `src/content/wiki/_payload-export/project/description/index.mdx` instead of the older hand-written MDX page at the same route.

You can run the full sync manually before committing:

```bash
npm run payload:sync
npm run develop
```

The exported page will appear under `src/content/wiki/_payload-export` and will be available at the `path` you entered in Payload.

When Gatsby is already running, edits to exported pages still make Gatsby rebuild because the final site is static MDX. That is expected, but it is not a great live-authoring loop. Use Payload's editor for drafting, then use Gatsby to verify final output after publishing. Brand-new routes may need a Gatsby restart if the dev server does not pick up the newly created MDX file.

For hosted staging, use the same model in CI/CD: publishing in Payload should trigger a build job that runs `npm run payload:sync` and then builds/deploys Gatsby. If the staging host gives you a deploy hook URL, set it as `PAYLOAD_REBUILD_WEBHOOK_URL` in `cms/payload-app/.env`. The Payload publish hook will call it after the local static export succeeds.

If you want Payload publish to run the heavier local validation step too, set this in `cms/payload-app/.env`:

```env
PAYLOAD_PUBLISH_SYNC_SCRIPT=payload:sync
```

## iGEM Safety Boundary

The public wiki must not call Payload at runtime. Always export to static MDX, commit the generated files, and build the Gatsby site from committed source.

For the proposed hosted GitHub Pages staging workflow and CI/CD next steps, see `docs/payload-github-pages-cicd.md`.
