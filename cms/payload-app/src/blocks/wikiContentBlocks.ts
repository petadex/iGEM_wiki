import type { Block } from 'payload'

/** Fields shared by standalone Figure blocks and figures inside ImageGrid. */
export const figureItemFields = [
  {
    name: 'image',
    type: 'relationship' as const,
    relationTo: 'media' as const,
    admin: {
      description:
        'Upload or choose a Payload media item. Export copies it into Gatsby static files.',
    },
  },
  {
    name: 'src',
    type: 'text' as const,
    admin: {
      description:
        'Optional fallback for existing static paths such as /images/example.png. Prefer Media above.',
    },
  },
  {
    name: 'alt',
    type: 'text' as const,
    required: true,
  },
  {
    name: 'caption',
    type: 'textarea' as const,
  },
  {
    name: 'credit',
    type: 'text' as const,
    admin: {
      description: 'Optional photo credit shown below the caption.',
    },
  },
]

/**
 * Payload blocks that map 1:1 to approved MDX components in
 * `src/components/mdx/wikiComponents.js` (see docs/content-authoring.md).
 */
export const wikiContentBlocks: Block[] = [
  {
    slug: 'richText',
    labels: {
      singular: 'Rich Text',
      plural: 'Rich Text',
    },
    fields: [
      {
        name: 'body',
        type: 'richText',
        required: true,
      },
    ],
  },
  {
    slug: 'callout',
    labels: {
      singular: 'Callout',
      plural: 'Callouts',
    },
    fields: [
      {
        name: 'title',
        type: 'text',
      },
      {
        name: 'tone',
        type: 'select',
        defaultValue: 'note',
        options: [
          { label: 'Note', value: 'note' },
          { label: 'Success', value: 'success' },
          { label: 'Warning', value: 'warning' },
        ],
      },
      {
        name: 'body',
        type: 'textarea',
        required: true,
      },
    ],
  },
  {
    slug: 'figure',
    labels: {
      singular: 'Figure',
      plural: 'Figures',
    },
    fields: figureItemFields,
  },
  {
    slug: 'imageGrid',
    labels: {
      singular: 'Image Grid',
      plural: 'Image Grids',
    },
    admin: {
      description: 'Side-by-side figures — maps to the wiki <ImageGrid> MDX component.',
    },
    fields: [
      {
        name: 'figures',
        type: 'array',
        required: true,
        minRows: 1,
        labels: {
          singular: 'Figure',
          plural: 'Figures',
        },
        fields: figureItemFields,
      },
    ],
  },
  {
    slug: 'dataTable',
    labels: {
      singular: 'Data Table',
      plural: 'Data Tables',
    },
    admin: {
      description: 'Markdown table inside the wiki <DataTable> MDX component.',
    },
    fields: [
      {
        name: 'caption',
        type: 'text',
      },
      {
        name: 'tableMarkdown',
        type: 'textarea',
        required: true,
        admin: {
          description:
            'GitHub-flavored markdown table (header row, separator, data rows). Example:\n| Col A | Col B |\n| --- | --- |\n| a | b |',
        },
      },
    ],
  },
  {
    slug: 'interactiveGizmo',
    labels: {
      singular: 'Interactive Gizmo',
      plural: 'Interactive Gizmos',
    },
    admin: {
      description:
        'Embed an approved interactive React component inline in the page — maps to <InteractiveGizmo>. Keep gizmo options in sync with src/components/mdx/interactive/registry.js.',
    },
    fields: [
      {
        name: 'gizmo',
        type: 'select',
        required: true,
        defaultValue: 'growthCurve',
        options: [
          { label: 'Growth Curve Simulator', value: 'growthCurve' },
        ],
        admin: {
          description: 'Which approved interactive component to render.',
        },
      },
      {
        name: 'title',
        type: 'text',
        admin: {
          description: 'Optional heading shown above the gizmo.',
        },
      },
      {
        name: 'config',
        type: 'json',
        admin: {
          description:
            'Optional settings passed to the gizmo as props, e.g. { "growthRate": 0.5, "carryingCapacity": 200 }. Leave blank to use defaults.',
        },
      },
      {
        name: 'caption',
        type: 'textarea',
        admin: {
          description: 'Optional caption shown below the gizmo.',
        },
      },
    ],
  },
  {
    slug: 'markdown',
    labels: {
      singular: 'Markdown / MDX',
      plural: 'Markdown / MDX',
    },
    fields: [
      {
        name: 'body',
        type: 'textarea',
        required: true,
        admin: {
          description:
            'Escape hatch for web members when a visual block is not enough. Prefer the blocks above.',
        },
      },
    ],
  },
]
