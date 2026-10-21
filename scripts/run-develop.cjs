/**
 * Spawn `gatsby develop` from the repo root (so it works from any cwd),
 * passing through extra CLI args and the exit code.
 */
const path = require('path')
const { spawn } = require('child_process')

const root = path.join(__dirname, '..')
process.chdir(root)

const cli = path.join(root, 'node_modules', 'gatsby', 'cli.js')
const extraArgs = process.argv.slice(2).filter(a => a.length > 0)

// Node's default heap (~4 GB) is not enough to bundle Mol*, the structure
// viewer on the Software page: it is several thousand modules, and webpack
// runs out of memory partway through "Building development bundle". Passed
// as a node flag rather than through NODE_OPTIONS so it works on Windows
// shells too.
const HEAP_MB = process.env.WIKI_DEV_HEAP_MB || '6144'
const child = spawn(process.execPath, [`--max-old-space-size=${HEAP_MB}`, cli, 'develop', ...extraArgs], {
  cwd: root,
  stdio: 'inherit',
  // The site's own loader covers slow page changes (gatsby-browser.js).
  env: { GATSBY_QUERY_ON_DEMAND_LOADING_INDICATOR: 'false', ...process.env },
})

child.on('error', err => {
  console.error(err)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Gatsby development server stopped by ${signal}.`)
  } else if (code) {
    console.error(`Gatsby development server exited with code ${code}.`)
  }
  process.exit(code ?? 1)
})
